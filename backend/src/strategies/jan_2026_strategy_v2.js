// ============================================================
// КОНСТАНТЫ СТРАТЕГИИ
// ============================================================
const STRATEGY_CONFIG = {
  // Управление риском
  HARD_STOP: 2.5,                          // % — жёсткий стоп-лосс
  TRAILING_TAKE: 0.8,                      // % — откат от пика прибыли для выхода
  MIN_PROFIT_TO_TRAIL: 0.5,                // % — минимальная прибыль до активации трейлинга

  // Peak staleness
  PEAK_STALENESS_SINCE_PROFIT: 1.0,        // % — минимальный достигнутый пик
  PEAK_STALENESS_SINCE_MINUTES: 180,       // мин — время без обновления пика

  // Time stop
  MAX_POSITION_MINUTES: 24 * 60,           // мин — максимальное время удержания
  TIME_STOP_MIN_LOSS_TO_SKIP: 1.75,        // % — не закрывать по тайм-стопу при глубоком минусе

  // Фильтры входа
  ATR_PERIOD: 14,
  ATR_MAX_PERCENT: 3.5,                    // % — макс. ATR относительно цены
  RANGE_LOOKBACK_CANDLES: 6,               // 4h свечей для расчёта диапазона (24ч)
  TREND_LOOKBACK_CANDLES: 3,               // 4h свечей для определения тренда

  // Зона безопасности от краёв канала
  ENTRY_BAND_PERCENT: 0.15,                // не входим в 15% диапазона у границы

  // Cooldown после закрытия
  REENTRY_COOLDOWN_MS: 4 * 60 * 60 * 1000, // 4 часа
};

// ============================================================
// СОСТОЯНИЕ (in-memory, при рестарте сбрасывается)
// ============================================================
const recentlyClosed = new Map();   // symbol -> timestamp закрытия
const pendingCloseSet = new Set();  // symbol -> блок от двойного закрытия

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Расчёт ATR (Average True Range) — мера волатильности.
 */
function calculateATR(candles, period) {
  if (candles.length < period + 1) return null;

  const trueRanges = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  const recent = trueRanges.slice(-period);
  return recent.reduce((sum, tr) => sum + tr, 0) / period;
}

/**
 * Определение тренда по последним свечам (majority vote).
 * Возвращает: "bullish", "bearish", "neutral"
 */
function detectTrend(candles) {
  if (candles.length < 2) return "neutral";

  const closes = candles.map(c => c.close);
  let up = 0, down = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) up++;
    else if (closes[i] < closes[i - 1]) down++;
  }

  const total = closes.length - 1;
  if (up > total * 0.6) return "bullish";
  if (down > total * 0.6) return "bearish";
  return "neutral";
}

/**
 * Проверка, находится ли цена в безопасной зоне для mean-reversion входа.
 * Не входим у самых краёв диапазона — там высок риск пробоя.
 */
function isInSafeReversionZone(price, rangeLow, rangeHigh, bandPercent) {
  const range = rangeHigh - rangeLow;
  if (range === 0) return false; // флэт — вход бессмысленен
  const safeLow = rangeLow + range * bandPercent;
  const safeHigh = rangeHigh - range * bandPercent;
  return price >= safeLow && price <= safeHigh;
}

// ============================================================
// ОСНОВНАЯ СТРАТЕГИЯ
// ============================================================

addStrategySchema({
  strategyName: "jan_2026_strategy_v2",

  getSignal: async (symbol, when, currentPrice) => {
    // --- 1. Базовая проверка сигнала ---
    const signal = getActiveSignal(symbol, when);
    if (!signal) return null;

    // --- 2. Cooldown после недавнего закрытия ---
    const lastCloseTs = recentlyClosed.get(symbol);
    if (lastCloseTs && Date.now() - lastCloseTs < STRATEGY_CONFIG.REENTRY_COOLDOWN_MS) {
      Log.debug("Signal skipped: cooldown active", { symbol });
      return null;
    }

    // --- 3. Проверка зоны входа из сигнала ---
    const close_1m = await getClosePrice(symbol, "1m");
    if (close_1m < signal.entry.from || close_1m > signal.entry.to) {
      return null;
    }

    // --- 4. Загрузка свечей (одним запросом) ---
    const candleCount = Math.max(
      STRATEGY_CONFIG.RANGE_LOOKBACK_CANDLES,
      STRATEGY_CONFIG.TREND_LOOKBACK_CANDLES,
      STRATEGY_CONFIG.ATR_PERIOD + 1,
    );
    const candles = await getCandles(symbol, "4h", candleCount);

    if (!candles || candles.length < candleCount) {
      Log.warn("Signal skipped: insufficient candle data", { symbol, got: candles?.length });
      return null;
    }

    // --- 5. Фильтр волатильности (ATR) ---
    const atr = calculateATR(candles, STRATEGY_CONFIG.ATR_PERIOD);
    if (!atr) return null;

    const atrPercent = (atr / currentPrice) * 100;
    if (atrPercent > STRATEGY_CONFIG.ATR_MAX_PERCENT) {
      Log.info("Signal skipped: high volatility", { symbol, atrPercent });
      return null;
    }

    // --- 6. Расчёт диапазона по N свечам ---
    const rangeCandles = candles.slice(-STRATEGY_CONFIG.RANGE_LOOKBACK_CANDLES);
    const range_high = Math.max(...rangeCandles.map(c => c.high));
    const range_low = Math.min(...rangeCandles.map(c => c.low));
    const range_middle = (range_high + range_low) / 2;

    // --- 7. Не входим у краёв диапазона (риск пробоя) ---
    if (!isInSafeReversionZone(close_1m, range_low, range_high, STRATEGY_CONFIG.ENTRY_BAND_PERCENT)) {
      Log.debug("Signal skipped: too close to range edge", { symbol, close_1m, range_low, range_high });
      return null;
    }

    // --- 8. Определение направления (mean-reversion от середины) ---
    const position = close_1m > range_middle ? "short" : "long";

    // --- 9. Фильтр тренда — не входим против сильного тренда ---
    const trendCandles = candles.slice(-STRATEGY_CONFIG.TREND_LOOKBACK_CANDLES);
    const trend = detectTrend(trendCandles);

    if (position === "short" && trend === "bullish") {
      Log.info("Signal skipped: short against bullish trend", { symbol });
      return null;
    }
    if (position === "long" && trend === "bearish") {
      Log.info("Signal skipped: long against bearish trend", { symbol });
      return null;
    }

    // --- 10. Финальный сигнал ---
    Log.info("Signal accepted", {
      symbol,
      position,
      close_1m,
      range_middle,
      atrPercent: atrPercent.toFixed(2),
      trend,
    });

    return {
      position,
      ...Position.moonbag({
        position,
        currentPrice,
        percentStopLoss: STRATEGY_CONFIG.HARD_STOP,
      }),
      minuteEstimatedTime: STRATEGY_CONFIG.MAX_POSITION_MINUTES,
      note: signal.note,
      metadata: {
        atrPercent,
        rangePosition: ((close_1m - range_low) / (range_high - range_low) * 100).toFixed(1),
        trend,
      },
    };
  },
});

// ============================================================
// УПРАВЛЕНИЕ ПОЗИЦИЕЙ — ВЫХОДЫ
// ============================================================

/**
 * Унифицированный безопасный выход с защитой от двойного срабатывания.
 */
async function safeClosePosition(symbol, reason, details = {}) {
  if (pendingCloseSet.has(symbol)) {
    Log.debug("Close already pending, skipping", { symbol, reason });
    return;
  }

  pendingCloseSet.add(symbol);

  try {
    Log.info("Closing position", { symbol, reason, ...details });

    await commitClosePending(symbol, {
      id: "unknown",
      note: str.newline(`# Позиция закрыта: ${reason}`),
    });

    recentlyClosed.set(symbol, Date.now());
  } catch (err) {
    Log.error("Failed to close position", { symbol, reason, error: err.message });
    pendingCloseSet.delete(symbol); // отпустим, чтобы можно было повторить
    throw err;
  }
  // pendingCloseSet не чистим здесь — cleanup interval сделает это ровно через 1× cooldown
}

/**
 * ВЫХОД 1: Trailing Take — фиксация прибыли при откате от пика.
 */
listenActivePing(async ({ symbol, data }) => {
  if (pendingCloseSet.has(symbol)) return;

  const currentProfit = await getPositionPnlPercent(symbol);
  if (currentProfit <= 0) return;

  const peakProfit = await getPositionHighestPnlPercentage(symbol);
  if (!peakProfit || isNaN(peakProfit) || peakProfit < STRATEGY_CONFIG.MIN_PROFIT_TO_TRAIL) {
    return;
  }

  const peakDistance = await getPositionHighestProfitDistancePnlPercentage(symbol);
  if (peakDistance == null || isNaN(peakDistance)) return;

  if (peakDistance < STRATEGY_CONFIG.TRAILING_TAKE) return;

  await safeClosePosition(symbol, "trailing take", {
    peakProfit: peakProfit.toFixed(2),
    currentProfit: currentProfit.toFixed(2),
    peakDistance: peakDistance.toFixed(2),
    data,
  });
});

/**
 * ВЫХОД 2: Peak Staleness — выход, если прибыль давно не обновляет максимум.
 */
listenActivePing(async ({ symbol, data }) => {
  if (pendingCloseSet.has(symbol)) return;

  const peakProfitCost = await getPositionHighestPnlPercentage(symbol);
  if (!peakProfitCost || isNaN(peakProfitCost)) return;
  if (peakProfitCost < STRATEGY_CONFIG.PEAK_STALENESS_SINCE_PROFIT) return;

  const peakProfitMinutes = await getPositionHighestProfitMinutes(symbol);
  if (!peakProfitMinutes || peakProfitMinutes < STRATEGY_CONFIG.PEAK_STALENESS_SINCE_MINUTES) {
    return;
  }

  await safeClosePosition(symbol, "peak staleness", {
    peakProfitCost: peakProfitCost.toFixed(2),
    peakProfitMinutes,
    data,
  });
});

/**
 * ВЫХОД 3: Time Stop — закрытие по истечении времени.
 */
listenActivePing(async ({ symbol, data }) => {
  if (pendingCloseSet.has(symbol)) return;

  const ageMinutes = await getPositionAgeMinutes(symbol);
  if (!ageMinutes || ageMinutes < STRATEGY_CONFIG.MAX_POSITION_MINUTES) return;

  const currentProfit = await getPositionPnlPercent(symbol);

  // Не закрываем по таймауту при глубокой просадке — пусть отрабатывает hard stop.
  if (currentProfit < -STRATEGY_CONFIG.TIME_STOP_MIN_LOSS_TO_SKIP) {
    Log.debug("Time stop skipped: deep drawdown, awaiting hard stop", {
      symbol,
      currentProfit: currentProfit.toFixed(2),
    });
    return;
  }

  await safeClosePosition(symbol, "time stop", {
    ageMinutes,
    currentProfit: currentProfit.toFixed(2),
    data,
  });
});

// ============================================================
// ОЧИСТКА ПАМЯТИ
// ============================================================

setInterval(() => {
  const now = Date.now();
  for (const [symbol, ts] of recentlyClosed.entries()) {
    // Разблокируем exits ровно когда cooldown истекает — чтобы новая позиция была управляема
    if (ts < now - STRATEGY_CONFIG.REENTRY_COOLDOWN_MS) {
      pendingCloseSet.delete(symbol);
    }
    // Освобождаем память с запасом
    if (ts < now - STRATEGY_CONFIG.REENTRY_COOLDOWN_MS * 2) {
      recentlyClosed.delete(symbol);
    }
  }
}, 60 * 60 * 1000);
