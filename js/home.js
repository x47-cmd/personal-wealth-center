/* ==========================================================
   Personal Wealth Center Home Page
   Version: 2.3.0
   Fixed Home Integration + Removed Bottom Shortcuts
========================================================== */
"use strict";

(function () {
  const page = document.getElementById("home");
  if (!page) return;

  const VERSION = "2.3.0";

  const STORAGE_KEYS = [
    "pwcDataV1",
    "pwcBackupV1",
    "personalWealthData",
    "wealthData",
    "pwcStore"
  ];

  function n(v, fallback = 0) {
    const x = Number(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(x) ? x : fallback;
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function toArray(v) {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") return [v];
    return [];
  }

  function objectValuesSum(obj, keysToSkip = []) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return 0;

    return Object.keys(obj).reduce((total, key) => {
      if (keysToSkip.includes(key)) return total;

      const value = obj[key];

      if (typeof value === "number" || typeof value === "string") {
        return total + n(value);
      }

      if (Array.isArray(value)) {
        return total + value.reduce((s, x) => {
          if (typeof x === "number" || typeof x === "string") return s + n(x);
          if (x && typeof x === "object") {
            return s + n(x.value ?? x.amount ?? x.balance ?? x.currentValue ?? 0);
          }
          return s;
        }, 0);
      }

      if (value && typeof value === "object") {
        return total + n(value.value ?? value.amount ?? value.balance ?? value.currentValue ?? 0);
      }

      return total;
    }, 0);
  }

  function monthKey(date) {
    const d = date || new Date().toISOString().slice(0, 10);
    return String(d).slice(0, 7);
  }

  function money(v) {
    return `AED ${n(v).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  function sum(list, picker) {
    return toArray(list).reduce((s, x) => s + n(picker(x)), 0);
  }

  function pct(part, total) {
    total = n(total);
    if (total <= 0) return 0;
    return Math.max(0, Math.min((n(part) / total) * 100, 999));
  }

  function getStoreData() {
    let data = {};

    STORAGE_KEYS.forEach((key) => {
      const d = readJSON(key, null);
      if (d && typeof d === "object") data = { ...data, ...d };
    });

    try {
      if (window.WCStore && typeof window.WCStore.get === "function") {
        const d = window.WCStore.get() || {};
        data = { ...data, ...d };
      } else if (window.WCStore && typeof window.WCStore.getState === "function") {
        const d = window.WCStore.getState() || {};
        data = { ...data, ...d };
      } else if (window.WCStore && typeof window.WCStore.getData === "function") {
        const d = window.WCStore.getData() || {};
        data = { ...data, ...d };
      }
    } catch (e) {}

    try {
      if (window.PWCStore && typeof window.PWCStore.getState === "function") {
        const d = window.PWCStore.getState() || {};
        data = { ...data, ...d };
      } else if (window.PWCStore && typeof window.PWCStore.getData === "function") {
        const d = window.PWCStore.getData() || {};
        data = { ...data, ...d };
      }
    } catch (e) {}

    return data || {};
  }

  function normalizePortfolio(portfolio, data) {
    const p = portfolio || data.portfolio || data.stocks || data.investments || {};

    if (Array.isArray(p)) return p;

    if (p && typeof p === "object") {
      return [{
        currentValue:
          p.currentValue ??
          p.marketValue ??
          p.value ??
          p.totalValue ??
          p.portfolioValue ??
          p.current ??
          data.assets?.investments ??
          0,

        costValue:
          p.capital ??
          p.costValue ??
          p.totalCost ??
          p.deposited ??
          p.cost ??
          0,

        monthlyInvestment: p.monthlyInvestment ?? 0,
        expectedReturn: p.expectedReturn ?? 0
      }];
    }

    return [];
  }

  function getPortfolioValue(list) {
    return sum(list, x =>
      x.currentValue ??
      x.marketValue ??
      x.value ??
      x.totalValue ??
      x.portfolioValue ??
      x.current ??
      0
    );
  }

  function getPortfolioCost(list) {
    return sum(list, x => {
      const direct = n(
        x.costValue ??
        x.totalCost ??
        x.capital ??
        x.deposited ??
        x.cost ??
        0
      );

      if (direct > 0) return direct;

      return n(x.qty ?? x.quantity ?? x.shares ?? 0) *
             n(x.avgCost ?? x.averageCost ?? x.buyPrice ?? x.price ?? 0);
    });
  }

  function calc() {
    const data = getStoreData();

    const settings = {
      ...(readJSON("pwcSettingsV1", {}) || {}),
      ...(data.settings || {})
    };

    const spendingSettings = data.spendingSettings || {};
    const currentMonth = monthKey();

    const portfolioList = normalizePortfolio(data.portfolio, data);
    const portfolioValue = getPortfolioValue(portfolioList);
    const portfolioCost = getPortfolioCost(portfolioList);
    const portfolioProfit = portfolioValue - portfolioCost;
    const portfolioReturn = portfolioCost > 0 ? (portfolioProfit / portfolioCost) * 100 : 0;

    const assetsValue = Array.isArray(data.assets)
      ? sum(data.assets, x => x.value ?? x.amount ?? x.currentValue ?? 0)
      : objectValuesSum(data.assets, ["cash", "emergency", "emergencyCash", "investments"]);

    const liabilitiesValue = Array.isArray(data.liabilities)
      ? sum(data.liabilities, x => x.balance ?? x.remaining ?? x.amount ?? x.value ?? 0)
      : n(data.liabilities?.total ?? 0) || objectValuesSum(data.liabilities, ["items"]);

    const dividendsValue = Array.isArray(data.dividends)
      ? sum(data.dividends, x => x.amount ?? x.value ?? 0)
      : objectValuesSum(data.dividends);

    const emergencyCash = n(
      settings.emergencyFundCurrent ??
      settings.emergencyCash ??
      settings.emergency ??
      data.assets?.emergencyCash ??
      data.assets?.emergency ??
      0
    );

    const availableCash = n(
      settings.availableCash ??
      settings.cashBalance ??
      settings.bankCash ??
      data.assets?.cash ??
      0
    );

    const emergencyTarget = n(
      settings.emergencyFundTarget ??
      settings.emergencyCashTarget ??
      settings.targetEmergencyCash ??
      100000
    );

    const monthlyBudget = n(
      spendingSettings.monthlyBudget ??
      settings.monthlyBudget ??
      7000
    );

    const expenses = toArray(data.expenses || data.spending || data.transactions);
    const monthExpenses = expenses.filter(x => monthKey(x.date) === currentMonth);
    const monthlySpent = sum(monthExpenses, x => x.amount ?? x.value ?? 0);
    const spendingRemaining = monthlyBudget - monthlySpent;
    const spendingPercent = pct(monthlySpent, monthlyBudget);

    const totalAssets =
      availableCash +
      emergencyCash +
      portfolioValue +
      assetsValue +
      dividendsValue;

    const netWorth = totalAssets - liabilitiesValue;

    const targetNetWorth = n(
      settings.targetNetWorth ??
      data.goals?.targetNetWorth ??
      1000000
    );

    const goalProgress = pct(netWorth, targetNetWorth);

    const monthlyInvestment = n(
      settings.monthlyInvestment ??
      data.portfolio?.monthlyInvestment ??
      0
    );

    const monthlySalary = n(settings.monthlySalary, 32000);
    const investRate = monthlySalary > 0 ? (monthlyInvestment / monthlySalary) * 100 : 0;

    return {
      portfolioValue,
      portfolioCost,
      portfolioProfit,
      portfolioReturn,
      assetsValue,
      liabilitiesValue,
      dividendsValue,
      emergencyCash,
      availableCash,
      emergencyTarget,
      emergencyPercent: pct(emergencyCash, emergencyTarget),
      monthlyBudget,
      monthlySpent,
      spendingRemaining,
      spendingPercent,
      totalAssets,
      netWorth,
      targetNetWorth,
      goalProgress,
      monthlyInvestment,
      monthlySalary,
      investRate
    };
  }

  function decision(c) {
    if (c.netWorth < 0) {
      return ["تنبيه مهم", "صافي الثروة بالسالب. الأولوية الآن تخفيف الالتزامات.", "danger", "⚠️"];
    }

    if (c.portfolioValue <= 0) {
      return ["اربط المحفظة", "بيانات المحفظة غير ظاهرة في الرئيسية. حدّث المحفظة أو تأكد من الحفظ.", "warning", "📈"];
    }

    if (c.spendingPercent >= 100) {
      return ["وقف المصروف الزائد", `تجاوزت ميزانية الشهر بـ ${money(c.monthlySpent - c.monthlyBudget)}.`, "danger", "🚨"];
    }

    if (c.emergencyPercent < 30) {
      return ["قوّي صندوق الطوارئ", `ناقصك ${money(Math.max(c.emergencyTarget - c.emergencyCash, 0))} للوصول للهدف.`, "warning", "🛟"];
    }

    return ["مسارك المالي جيد", "استمر بالتحديث، راقب المصروف، وثبّت الاستثمار الشهري.", "good", "✅"];
  }

  function insightList(c) {
    return [
      `صافي الثروة = الكاش المتاح + صندوق الطوارئ + المحفظة + الأصول + التوزيعات - الالتزامات.`,
      `المحفظة الداخلة في الحسبة: ${money(c.portfolioValue)}.`,
      `هدف المليون محسوب من صافي الثروة الحقيقي: ${c.goalProgress.toFixed(1)}%.`,
      `المصروف الشهري منفصل عن صافي الثروة، وليس أصل.`
    ];
  }

  function cls(v) {
    return n(v) < 0 ? "neg" : "pos";
  }

  function bar(v) {
    return Math.max(0, Math.min(n(v), 100));
  }

  function injectStyle() {
    if (document.getElementById("homePremiumStyle")) return;

    const style = document.createElement("style");
    style.id = "homePremiumStyle";
    style.textContent = `
      #home{padding:18px 16px 118px;direction:rtl}
      .homeTop{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:6px 2px 16px}
      .homeTitle h1{margin:0;font-size:28px;line-height:1.15;color:#071022;font-weight:950;letter-spacing:-.7px}
      .homeTitle p{margin:5px 0 0;color:#6b7280;font-size:14px;font-weight:800}
      .homeLogo{width:56px;height:56px;border-radius:18px;display:grid;place-items:center;font-size:28px;background:linear-gradient(135deg,#ffe17a,#d6a913);box-shadow:0 14px 30px rgba(214,169,19,.25)}
      .homeHero{position:relative;overflow:hidden;border-radius:30px;padding:24px 22px;min-height:205px;background:radial-gradient(circle at 20% 10%,rgba(255,220,90,.24),transparent 35%),linear-gradient(135deg,#101827,#050816);color:#fff;box-shadow:0 22px 45px rgba(15,23,42,.18)}
      .homeHero::after{content:"";position:absolute;inset:auto -55px -75px auto;width:190px;height:190px;border-radius:50%;background:rgba(255,213,74,.12)}
      .heroLabel{display:inline-flex;padding:8px 13px;border:1px solid rgba(255,213,74,.36);color:#ffd64a;border-radius:999px;font-size:13px;font-weight:900;background:rgba(255,255,255,.06)}
      .homeHero h2{position:relative;margin:18px 0 6px;font-size:25px;line-height:1.25;font-weight:950;letter-spacing:-.6px;z-index:1}
      .homeHero p{position:relative;margin:0;color:#cbd5e1;font-size:14px;line-height:1.9;font-weight:700;z-index:1}
      .heroValue{position:relative;margin-top:18px;z-index:1}
      .heroValue strong{display:block;direction:ltr;text-align:right;color:#ffd64a;font-size:34px;line-height:1;font-weight:950;letter-spacing:-1px}
      .heroValue span{display:block;margin-top:8px;color:#9ca3af;font-size:13px;font-weight:800}
      .homeDecision2{margin-top:14px;border-radius:26px;padding:18px;display:flex;gap:14px;align-items:center;border:1px solid rgba(226,232,240,.9);background:rgba(255,255,255,.82);box-shadow:0 16px 36px rgba(15,23,42,.08);backdrop-filter:blur(12px)}
      .homeDecision2.warning{background:linear-gradient(135deg,#fff9df,#fff);border-color:#f8df80}
      .homeDecision2.danger{background:linear-gradient(135deg,#fff1f1,#fff);border-color:#fecaca}
      .homeDecision2.good{background:linear-gradient(135deg,#effdf5,#fff);border-color:#bbf7d0}
      .decisionIcon{width:52px;height:52px;border-radius:18px;display:grid;place-items:center;background:#fff;font-size:25px;flex:0 0 auto;box-shadow:0 12px 28px rgba(15,23,42,.08)}
      .homeDecision2 h3{margin:0;color:#071022;font-size:18px;font-weight:950}
      .homeDecision2 strong{display:block;margin-top:3px;color:#111827;font-size:15px;font-weight:950}
      .homeDecision2 p{margin:5px 0 0;color:#6b7280;line-height:1.65;font-size:13px;font-weight:750}
      .quickGrid{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .quickCard{min-height:142px;padding:18px 15px;border-radius:25px;background:rgba(255,255,255,.9);border:1px solid rgba(226,232,240,.8);box-shadow:0 16px 34px rgba(15,23,42,.07)}
      .quickCard .ico{font-size:24px;margin-bottom:13px}
      .quickCard small{display:block;color:#6b7280;font-size:13px;font-weight:900}
      .quickCard strong{display:block;direction:ltr;text-align:right;margin-top:7px;color:#071022;font-size:22px;line-height:1.15;font-weight:950;letter-spacing:-.4px}
      .quickCard p{margin:8px 0 0;color:#8b95a5;font-size:12.5px;line-height:1.55;font-weight:750}
      .quickCard .gold{color:#d4a915}.quickCard .neg{color:#b91c1c}.quickCard .pos{color:#071022}
      .homePanel{margin-top:16px;padding:20px 18px;border-radius:28px;background:rgba(255,255,255,.92);border:1px solid rgba(226,232,240,.8);box-shadow:0 16px 34px rgba(15,23,42,.07)}
      .panelTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
      .panelTop h3{margin:0;color:#071022;font-size:22px;font-weight:950;letter-spacing:-.5px}
      .panelTop strong{direction:ltr;color:#071022;font-size:23px;font-weight:950;white-space:nowrap}
      .homeBar{width:100%;height:11px;overflow:hidden;border-radius:999px;background:#edf2f7}
      .homeBar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#f7d857,#d6a913)}
      .panelNote{margin:12px 0 0;color:#6b7280;font-size:13px;line-height:1.7;font-weight:800}
      .wealthFormula{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
      .formulaItem{padding:13px;border-radius:18px;background:#f8fafc;border:1px solid #eef2f7}
      .formulaItem small{display:block;color:#7b8494;font-size:12px;font-weight:850}
      .formulaItem strong{display:block;direction:ltr;text-align:right;margin-top:5px;font-size:16px;color:#071022;font-weight:950}
      .formulaItem .neg{color:#b91c1c}
      .homeInsights{margin-top:16px;padding:20px 18px;border-radius:28px;background:#fff;border:1px solid rgba(226,232,240,.85);box-shadow:0 16px 34px rgba(15,23,42,.07)}
      .homeInsights h3{margin:0 0 12px;color:#071022;font-size:21px;font-weight:950}
      .insight{padding:13px 14px;border-radius:18px;background:#f8fafc;border:1px solid #eef2f7;color:#111827;font-size:13.5px;line-height:1.7;font-weight:850}
      .insight+.insight{margin-top:9px}
      @media(max-width:390px){
        #home{padding-left:12px;padding-right:12px}
        .homeTitle h1{font-size:25px}
        .homeHero{border-radius:26px;padding:22px 18px}
        .heroValue strong{font-size:30px}
        .quickCard{min-height:134px;padding:16px 13px}
        .quickCard strong{font-size:20px}
        .panelTop strong{font-size:20px}
      }
    `;
    document.head.appendChild(style);
  }

  function render() {
    injectStyle();

    const c = calc();
    const [dTitle, dText, dType, dIcon] = decision(c);
    const insights = insightList(c);

    page.innerHTML = `
      <section class="homeTop">
        <div class="homeTitle">
          <h1>مركز الثروة</h1>
          <p>لوحة مختصرة لصافي الثروة الحقيقي</p>
        </div>
        <div class="homeLogo">💰</div>
      </section>

      <section class="homeHero">
        <div class="heroLabel">لوحة التحكم الرئيسية</div>
        <h2>صافي ثروتك الحقيقي</h2>
        <p>
          يتم حسابه من الكاش المتاح، صندوق الطوارئ، المحفظة، الأصول، والتوزيعات
          بعد خصم الالتزامات. المصروف الشهري لا يدخل ضمن صافي الثروة.
        </p>
        <div class="heroValue">
          <strong>${money(c.netWorth)}</strong>
          <span>${c.netWorth >= 0 ? "موجب بعد خصم الالتزامات" : "بالسالب بعد خصم الالتزامات"}</span>
        </div>
      </section>

      <section class="homeDecision2 ${dType}">
        <div class="decisionIcon">${dIcon}</div>
        <div>
          <h3>قرار اليوم المالي</h3>
          <strong>${dTitle}</strong>
          <p>${dText}</p>
        </div>
      </section>

      <section class="quickGrid">
        <div class="quickCard">
          <div class="ico">💰</div>
          <small>صافي الثروة</small>
          <strong class="${cls(c.netWorth)}">${money(c.netWorth)}</strong>
          <p>الأصول ناقص الالتزامات</p>
        </div>

        <div class="quickCard">
          <div class="ico">📈</div>
          <small>المحفظة</small>
          <strong>${money(c.portfolioValue)}</strong>
          <p>العائد الحالي ${c.portfolioReturn.toFixed(1)}%</p>
        </div>

        <div class="quickCard">
          <div class="ico">🛟</div>
          <small>صندوق الطوارئ</small>
          <strong>${c.emergencyPercent.toFixed(0)}%</strong>
          <p>${money(c.emergencyCash)} من ${money(c.emergencyTarget)}</p>
        </div>

        <div class="quickCard">
          <div class="ico">💳</div>
          <small>مصروف الشهر</small>
          <strong class="${c.spendingPercent >= 90 ? "neg" : "gold"}">${c.spendingPercent.toFixed(0)}%</strong>
          <p>${money(c.monthlySpent)} من ${money(c.monthlyBudget)}</p>
        </div>
      </section>

      <section class="homePanel">
        <div class="panelTop">
          <h3>هدف المليون</h3>
          <strong>${c.goalProgress.toFixed(1)}%</strong>
        </div>
        <div class="homeBar"><span style="width:${bar(c.goalProgress)}%"></span></div>
        <p class="panelNote">
          محسوب من صافي الثروة الحقيقي شامل المحفظة. باقي: ${money(Math.max(c.targetNetWorth - c.netWorth, 0))}
        </p>
      </section>

      <section class="homePanel">
        <div class="panelTop">
          <h3>المصروف الشهري</h3>
          <strong>${c.spendingPercent.toFixed(0)}%</strong>
        </div>
        <div class="homeBar"><span style="width:${bar(c.spendingPercent)}%"></span></div>
        <p class="panelNote">
          المصروف منفصل عن صافي الثروة. المتبقي من الميزانية: ${money(c.spendingRemaining)}
        </p>
      </section>

      <section class="homePanel">
        <div class="panelTop">
          <h3>تفصيل صافي الثروة</h3>
          <strong class="${cls(c.netWorth)}">${money(c.netWorth)}</strong>
        </div>

        <div class="wealthFormula">
          <div class="formulaItem">
            <small>الكاش المتاح</small>
            <strong>${money(c.availableCash)}</strong>
          </div>

          <div class="formulaItem">
            <small>صندوق الطوارئ</small>
            <strong>${money(c.emergencyCash)}</strong>
          </div>

          <div class="formulaItem">
            <small>المحفظة</small>
            <strong>${money(c.portfolioValue)}</strong>
          </div>

          <div class="formulaItem">
            <small>الأصول الأخرى</small>
            <strong>${money(c.assetsValue)}</strong>
          </div>

          <div class="formulaItem">
            <small>التوزيعات</small>
            <strong>${money(c.dividendsValue)}</strong>
          </div>

          <div class="formulaItem">
            <small>الالتزامات</small>
            <strong class="neg">${money(c.liabilitiesValue)}</strong>
          </div>
        </div>
      </section>

      <section class="homePanel">
        <div class="panelTop">
          <h3>أداء المحفظة</h3>
          <strong class="${cls(c.portfolioProfit)}">${money(c.portfolioProfit)}</strong>
        </div>
        <p class="panelNote">
          قيمة المحفظة: ${money(c.portfolioValue)} — رأس المال: ${money(c.portfolioCost)} — العائد: ${c.portfolioReturn.toFixed(1)}%
        </p>
      </section>

      <section class="homeInsights">
        <h3>تنبيهات ذكية</h3>
        ${insights.map(x => `<div class="insight">🔔 ${x}</div>`).join("")}
      </section>
    `;
  }

  function bind() {
    const events = [
      "pwc:dataChanged",
      "pwc:portfolioChanged",
      "pwc:dataUpdated",
      "pwc:portfolioUpdated",
      "pwc:assetsUpdated",
      "pwc:liabilitiesUpdated",
      "pwc:settingsUpdated",
      "dataChanged",
      "portfolioChanged",
      "assetsChanged",
      "liabilitiesChanged",
      "settingsChanged"
    ];

    events.forEach(ev => {
      window.addEventListener(ev, render);
      document.addEventListener(ev, render);
    });

    if (window.WCEvents && typeof WCEvents.on === "function") {
      events.forEach(ev => WCEvents.on(ev, render));
    }

    if (window.PWCEvents && typeof PWCEvents.on === "function") {
      events.forEach(ev => PWCEvents.on(ev, render));
    }

    window.addEventListener("storage", render);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) render();
    });
  }

  bind();
  render();

  window.PWCHome = {
    version: VERSION,
    render,
    calc
  };
})();