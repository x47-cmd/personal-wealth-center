/* ==========================================================
   Personal Wealth Center
   Global Config
   Version: 1.0.0
========================================================== */

"use strict";

const WC_CONFIG = {

  app: {
    name: "مركز إدارة الثروة الشخصية",
    shortName: "Wealth Center",
    version: "1.0.0",
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
    goals: "الأهداف",
    reports: "التحليل",
    quick: "إدخال سريع",
    settings: "الإعدادات"
  },

  theme: {
    primary: "#0f172a",
    secondary: "#1e293b",
    gold: "#d4af37",
    green: "#16a34a",
    red: "#dc2626",
    blue: "#2563eb",
    bg: "#f5f7fb",
    card: "#ffffff",
    text: "#111827",
    muted: "#6b7280"
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
    goals: [],

    snapshots: [],

    settings: {
      monthlyInvestment: 3500,
      targetNetWorth: 1000000,
      targetDividendIncomeMonthly: 10000,
      emergencyFundTarget: 15000
    }
  }

};

window.WC_CONFIG = WC_CONFIG;