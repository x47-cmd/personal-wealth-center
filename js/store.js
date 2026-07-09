/* =========================================================
   Personal Wealth Center - Unified Store
   Phase 1 Data Integration
   File: js/store.js
========================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "pwcDataV1";
  const SETTINGS_KEY = "pwcSettingsV1";

  const DEFAULT_DATA = {
    meta: {
      version: "1.3.0",
      updatedAt: new Date().toISOString()
    },

    settings: {
      currency: "AED",
      locale: "en-US",
      targetNetWorth: 1000000,
      emergencyTarget: 100000,
      monthlySalary: 32000,
      monthlyInvestment: 3000,
      monthlySpendingBudget: 7000,
      expectedReturn: 10
    },

    cash: {
      available: 0
    },

    emergency: {
      current: 5000,
      target: 100000
    },

    portfolio: {
      currentValue: 0,
      costBasis: 0,
      monthlyContribution: 3000,
      expectedReturn: 10,
      dividends: 0,
      updatedAt: null
    },

    assets: {
      other: 0,
      items: []
    },

    liabilities: {
      total: 0,
      items: []
    },

    spending: {
      monthSpent: 5000,
      monthlyBudget: 7000,
      items: []
    }
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function deepMerge(base, extra) {
    const out = clone(base);

    function merge(target, source) {
      if (!source || typeof source !== "object") return target;

      Object.keys(source).forEach((key) => {
        const sv = source[key];

        if (
          sv &&
          typeof sv === "object" &&
          !Array.isArray(sv) &&
          typeof target[key] === "object" &&
          target[key] !== null &&
          !Array.isArray(target[key])
        ) {
          merge(target[key], sv);
        } else {
          target[key] = sv;
        }
      });

      return target;
    }

    return merge(out, extra || {});
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return clone(fallback);
      return JSON.parse(raw);
    } catch (e) {
      return clone(fallback);
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalize(data) {
    const d = deepMerge(DEFAULT_DATA, data || {});

    d.settings.targetNetWorth = toNumber(d.settings.targetNetWorth, 1000000);
    d.settings.emergencyTarget = toNumber(d.settings.emergencyTarget, 100000);
    d.settings.monthlySalary = toNumber(d.settings.monthlySalary, 32000);
    d.settings.monthlyInvestment = toNumber(d.settings.monthlyInvestment, 3000);
    d.settings.monthlySpendingBudget = toNumber(d.settings.monthlySpendingBudget, 7000);
    d.settings.expectedReturn = toNumber(d.settings.expectedReturn, 10);

    d.cash.available = toNumber(d.cash.available, 0);

    d.emergency.current = toNumber(d.emergency.current, 0);
    d.emergency.target = toNumber(
      d.emergency.target,
      d.settings.emergencyTarget
    );

    d.portfolio.currentValue = toNumber(d.portfolio.currentValue, 0);
    d.portfolio.costBasis = toNumber(d.portfolio.costBasis, 0);
    d.portfolio.monthlyContribution = toNumber(
      d.portfolio.monthlyContribution,
      d.settings.monthlyInvestment
    );
    d.portfolio.expectedReturn = toNumber(
      d.portfolio.expectedReturn,
      d.settings.expectedReturn
    );
    d.portfolio.dividends = toNumber(d.portfolio.dividends, 0);

    d.assets.other = toNumber(d.assets.other, 0);
    d.liabilities.total = toNumber(d.liabilities.total, 0);

    d.spending.monthSpent = toNumber(d.spending.monthSpent, 0);
    d.spending.monthlyBudget = toNumber(
      d.spending.monthlyBudget,
      d.settings.monthlySpendingBudget
    );

    if (!Array.isArray(d.assets.items)) d.assets.items = [];
    if (!Array.isArray(d.liabilities.items)) d.liabilities.items = [];
    if (!Array.isArray(d.spending.items)) d.spending.items = [];

    d.meta.updatedAt = new Date().toISOString();

    return d;
  }

  function getData() {
    const main = readJSON(STORAGE_KEY, DEFAULT_DATA);
    const legacySettings = readJSON(SETTINGS_KEY, {});

    const merged = normalize(
      deepMerge(main, {
        settings: legacySettings && typeof legacySettings === "object"
          ? legacySettings
          : {}
      })
    );

    return merged;
  }

  function saveData(data) {
    const normalized = normalize(data);
    writeJSON(STORAGE_KEY, normalized);
    writeJSON(SETTINGS_KEY, normalized.settings);

    window.dispatchEvent(
      new CustomEvent("pwc:dataUpdated", {
        detail: normalized
      })
    );

    window.dispatchEvent(new Event("storage"));

    return normalized;
  }

  function updateData(patch) {
    const current = getData();
    const next = deepMerge(current, patch || {});
    return saveData(next);
  }

  function calculate(data) {
    const d = normalize(data || getData());

    const cash = toNumber(d.cash.available, 0);
    const emergency = toNumber(d.emergency.current, 0);
    const portfolio = toNumber(d.portfolio.currentValue, 0);
    const portfolioCost = toNumber(d.portfolio.costBasis, 0);
    const dividends = toNumber(d.portfolio.dividends, 0);

    const otherAssets =
      toNumber(d.assets.other, 0) +
      d.assets.items.reduce((sum, item) => {
        return sum + toNumber(item.value, 0);
      }, 0);

    const liabilities =
      toNumber(d.liabilities.total, 0) +
      d.liabilities.items.reduce((sum, item) => {
        return sum + toNumber(item.balance || item.value, 0);
      }, 0);

    const totalAssets =
      cash + emergency + portfolio + dividends + otherAssets;

    const netWorth = totalAssets - liabilities;

    const portfolioProfit = portfolio - portfolioCost;
    const portfolioReturnPercent =
      portfolioCost > 0 ? (portfolioProfit / portfolioCost) * 100 : 0;

    const targetNetWorth = toNumber(d.settings.targetNetWorth, 1000000);
    const targetProgress =
      targetNetWorth > 0 ? Math.min((netWorth / targetNetWorth) * 100, 100) : 0;

    const remainingToTarget = Math.max(targetNetWorth - netWorth, 0);

    const emergencyTarget = toNumber(
      d.emergency.target,
      d.settings.emergencyTarget || 100000
    );

    const emergencyProgress =
      emergencyTarget > 0
        ? Math.min((emergency / emergencyTarget) * 100, 100)
        : 0;

    const monthSpent = toNumber(d.spending.monthSpent, 0);
    const monthlyBudget = toNumber(d.spending.monthlyBudget, 7000);

    const spendingProgress =
      monthlyBudget > 0 ? Math.min((monthSpent / monthlyBudget) * 100, 999) : 0;

    const spendingRemaining = Math.max(monthlyBudget - monthSpent, 0);

    const monthlyInvestment = toNumber(
      d.portfolio.monthlyContribution,
      d.settings.monthlyInvestment || 3000
    );

    const monthlySalary = toNumber(d.settings.monthlySalary, 0);

    const investmentOfSalary =
      monthlySalary > 0 ? (monthlyInvestment / monthlySalary) * 100 : 0;

    return {
      cash,
      emergency,
      emergencyTarget,
      emergencyProgress,

      portfolio,
      portfolioCost,
      portfolioProfit,
      portfolioReturnPercent,
      dividends,

      otherAssets,
      liabilities,
      totalAssets,
      netWorth,

      targetNetWorth,
      targetProgress,
      remainingToTarget,

      monthSpent,
      monthlyBudget,
      spendingProgress,
      spendingRemaining,

      monthlyInvestment,
      monthlySalary,
      investmentOfSalary
    };
  }

  function formatMoney(value) {
    const d = getData();
    const currency = d.settings.currency || "AED";
    return `${currency} ${toNumber(value, 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  function updatePortfolio(values) {
    const current = getData();

    const currentValue = toNumber(
      values.currentValue,
      current.portfolio.currentValue
    );

    const costBasis = toNumber(
      values.costBasis,
      current.portfolio.costBasis
    );

    const monthlyContribution = toNumber(
      values.monthlyContribution,
      current.portfolio.monthlyContribution
    );

    const expectedReturn = toNumber(
      values.expectedReturn,
      current.portfolio.expectedReturn
    );

    const dividends = toNumber(
      values.dividends,
      current.portfolio.dividends
    );

    return updateData({
      portfolio: {
        currentValue,
        costBasis,
        monthlyContribution,
        expectedReturn,
        dividends,
        updatedAt: new Date().toISOString()
      },
      settings: {
        monthlyInvestment: monthlyContribution,
        expectedReturn
      }
    });
  }

  function updateWealth(values) {
    const current = getData();

    return updateData({
      cash: {
        available: toNumber(values.cash, current.cash.available)
      },
      emergency: {
        current: toNumber(values.emergency, current.emergency.current),
        target: toNumber(values.emergencyTarget, current.emergency.target)
      },
      assets: {
        other: toNumber(values.otherAssets, current.assets.other)
      },
      liabilities: {
        total: toNumber(values.liabilities, current.liabilities.total)
      }
    });
  }

  function updateSpending(values) {
    const current = getData();

    return updateData({
      spending: {
        monthSpent: toNumber(values.monthSpent, current.spending.monthSpent),
        monthlyBudget: toNumber(
          values.monthlyBudget,
          current.spending.monthlyBudget
        )
      },
      settings: {
        monthlySpendingBudget: toNumber(
          values.monthlyBudget,
          current.settings.monthlySpendingBudget
        )
      }
    });
  }

  function addExpense(expense) {
    const current = getData();

    const item = {
      id: "exp_" + Date.now(),
      title: expense.title || "مصروف",
      amount: toNumber(expense.amount, 0),
      category: expense.category || "عام",
      date: expense.date || new Date().toISOString().slice(0, 10)
    };

    current.spending.items.push(item);
    current.spending.monthSpent =
      toNumber(current.spending.monthSpent, 0) + item.amount;

    return saveData(current);
  }

  function resetAll() {
    return saveData(clone(DEFAULT_DATA));
  }

  const WCStore = {
    STORAGE_KEY,
    SETTINGS_KEY,

    defaults: clone(DEFAULT_DATA),

    get: getData,
    save: saveData,
    update: updateData,
    calc: calculate,

    money: formatMoney,
    num: toNumber,

    updatePortfolio,
    updateWealth,
    updateSpending,
    addExpense,
    resetAll
  };

  window.WCStore = WCStore;

  if (!localStorage.getItem(STORAGE_KEY)) {
    saveData(DEFAULT_DATA);
  } else {
    saveData(getData());
  }
})();