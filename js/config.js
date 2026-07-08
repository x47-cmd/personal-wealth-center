/* ==========================================================
   Personal Wealth Center Global Config
   Version: 1.1.1
   Central App Settings / No Index Version Editing
========================================================== */

"use strict";

const WC_CONFIG = {
  app: {
    name: "مركز إدارة الثروة الشخصية",
    shortName: "Wealth Center",
    version: "1.1.1",
    build: "2026.07.08",
    currency: "AED",
    locale: "ar-AE",
    direction: "rtl",
    devMode: true
  },

  storage: {
    main: "pwcDataV1",
    backup: "pwcBackupV1",
    settings: "pwcSettingsV1"
  },

  pages: {
    home: "الرئيسية",
    portfolio: "محفظتي",
    spending: "المصروفات",
    assets: "الثروة",
    reports: "التحليل",
    settings: "الإعدادات",
    quick: "إدخال سريع"
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
      currency: "AED",
      monthlyInvestment: 3500,
      targetNetWorth: 1000000,
      targetDividendIncomeMonthly: 10000,
      emergencyCash: 15000,
      emergencyFundTarget: 15000,
      expectedReturn: 10,
      monthlySalary: 32000,
      salaryDay: 27
    }
  }
};

window.WC_CONFIG = WC_CONFIG;