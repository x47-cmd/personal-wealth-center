/* ==========================================================
   Personal Wealth Center Global Config
   Version: 1.1.0
========================================================== */
"use strict";

const WC_CONFIG = {
  app: {
    name: "مركز إدارة الثروة الشخصية",
    shortName: "Wealth Center",
    version: "1.1.0",
    currency: "AED",
    locale: "ar-AE",
    direction: "rtl"
  },

  storage: {
    main: "pwcDataV1",
    backup: "pwcBackupV1",
    settings: "pwcSettingsV1"
  },

  pages: {
    home: "الرئيسية",
    portfolio: "محفظتي",
    dividends: "التوزيعات",
    assets: "الأصول",
    liabilities: "الالتزامات",
    spending: "المصروفات",
    goals: "الأهداف",
    reports: "التحليل",
    quick: "إدخال سريع",
    settings: "الإعدادات"
  },

  defaults: {
    profile: {
      name: "يوسف",
      baseCurrency: "AED"
    },

    portfolio: [],
    dividends: [],
    assets: [],
    liabilities: [],
    expenses: [],
    budgets: [],

    goals: [],
    snapshots: [],

    spendingSettings: {
      monthlyBudget: 7000,
      rollover: false,
      alert50: true,
      alert75: true,
      alert90: true
    },

    settings: {
      monthlyInvestment: 3500,
      targetNetWorth: 1000000,
      targetDividendIncomeMonthly: 10000,
      emergencyFundTarget: 15000
    }
  }
};

window.WC_CONFIG = WC_CONFIG;