class CacheService {
  constructor() {
    this.store = new Map();
    this.timers = new Map();
  }

  set(key, value, ttlSeconds = 3600) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    this.store.set(key, { value, cachedAt: Date.now() });
    const timer = setTimeout(() => this.delete(key), ttlSeconds * 1000);
    timer.unref?.();
    this.timers.set(key, timer);
  }

  get(key) {
    const entry = this.store.get(key);
    return entry ? entry.value : null;
  }

  delete(key) {
    this.store.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  has(key) {
    return this.store.has(key);
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.store.clear();
    this.timers.clear();
  }

  size() {
    return this.store.size;
  }

  stats() {
    const entries = [];
    this.store.forEach((v, k) => {
      entries.push({ key: k, cachedAt: v.cachedAt, age: Math.round((Date.now() - v.cachedAt) / 1000) });
    });
    return { size: this.store.size, entries };
  }
}

module.exports = new CacheService();
