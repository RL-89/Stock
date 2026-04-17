// Mock macro data — used when FRED API is unreachable
async function getRiskFreeRate() { return 0.0433; }
async function getCPI() { return { current: 314.8, previous: 311.2, yoy: 2.82 }; }
async function getFedFundsRate() { return 0.0533; }

async function getMacroSnapshot() {
  return {
    riskFreeRate: await getRiskFreeRate(),
    cpi: await getCPI(),
    fedFundsRate: await getFedFundsRate(),
  };
}

module.exports = { getRiskFreeRate, getCPI, getFedFundsRate, getMacroSnapshot };
