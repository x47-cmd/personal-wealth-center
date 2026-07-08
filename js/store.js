/* ==========================================================
   Personal Wealth Center Data Store
   Version: 1.1.0
========================================================== */
"use strict";

const WCStore = (() => {
  const KEY = WC_CONFIG.storage.main;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function defaultData() {
    return {
      meta: {
        app: WC_CONFIG.app.shortName,
        version: WC_CONFIG.app.version,
        createdAt: WCUtils.today(),
        updatedAt: WCUtils.today()
      },

      profile: clone(WC_CONFIG.defaults.profile),

      portfolio: clone(WC_CONFIG.defaults.portfolio),
      dividends: clone(WC_CONFIG.defaults.dividends),
      assets: clone(WC_CONFIG.defaults.assets),
      liabilities: clone(WC_CONFIG.defaults.liabilities),

      expenses: clone(WC_CONFIG.defaults.expenses),
      budgets: clone(WC_CONFIG.defaults.budgets),
      spendingSettings: clone(WC_CONFIG.defaults.spendingSettings),

      goals: clone(WC_CONFIG.defaults.goals),
      snapshots: clone(WC_CONFIG.defaults.snapshots),

      settings: clone(WC_CONFIG.defaults.settings)
    };
  }

  function normalize(data = {}) {
    const base = defaultData();

    return {
      ...base,
      ...data,

      meta: {
        ...base.meta,
        ...(data.meta || {})
      },

      profile: {
        ...base.profile,
        ...(data.profile || {})
      },

      settings: {
        ...base.settings,
        ...(data.settings || {})
      },

      spendingSettings: {
        ...base.spendingSettings,
        ...(data.spendingSettings || {})
      },

      portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
      dividends: Array.isArray(data.dividends) ? data.dividends : [],
      assets: Array.isArray(data.assets) ? data.assets : [],
      liabilities: Array.isArray(data.liabilities) ? data.liabilities : [],
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      budgets: Array.isArray(data.budgets) ? data.budgets : [],
      goals: Array.isArray(data.goals) ? data.goals : [],
      snapshots: Array.isArray(data.snapshots) ? data.snapshots : []
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);

      if (!raw) {
        const fresh = defaultData();
        save(fresh, false);
        return fresh;
      }

      return normalize(JSON.parse(raw));
    } catch (e) {
      console.warn("WCStore load failed:", e);
      return defaultData();
    }
  }

  function save(data, emit = true) {
    const safeData = normalize(data);
    safeData.meta.updatedAt = WCUtils.today();

    localStorage.setItem(KEY, JSON.stringify(safeData));

    if (emit) {
      WCEvents.emit("dataChanged", {
        updatedAt: safeData.meta.updatedAt
      });
    }

    return safeData;
  }

  function get() {
    return load();
  }

  function set(path, value) {
    const data = load();
    data[path] = value;
    return save(data);
  }

  function update(mutator) {
    const data = load();
    mutator(data);
    return save(data);
  }

  function reset() {
    const fresh = defaultData();
    save(fresh);
    return fresh;
  }

  function backup() {
    const data = load();
    localStorage.setItem(WC_CONFIG.storage.backup, JSON.stringify(data));
    return data;
  }

  return {
    get,
    set,
    update,
    save,
    reset,
    backup,
    defaultData
  };
})();

window.WCStore = WCStore;