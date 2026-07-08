/* =========================================================
   Personal Wealth Center
   Portfolio V3.3 Ultimate Premium
   Compact Hero + 2x2 KPIs + Quick Edit + Compact Formula
   File: js/portfolio.js
========================================================= */

(function () {
  "use strict";

  const page = document.getElementById("portfolio");
  if (!page) return;

  const APP_KEY = "pwcDataV1";
  const SETTINGS_KEY = "pwcSettingsV1";
  const VERSION = "3.3.0";
  const GOALS = [100000, 250000, 500000, 1000000];

  const DEFAULT_PORTFOLIO = {
    capital: 0,
    currentValue: 0,
    monthlyInvestment: 3500,
    expectedReturn: 10,
    purchases: [],
    notes: "",
    updatedAt: null
  };

  const DEFAULT_DATA = {
    meta: { version: VERSION, updatedAt: null },
    portfolio: structuredClone(DEFAULT_PORTFOLIO),
    assets: { cash: 0, investments: 0, realEstate: 0, other: 0 },
    liabilities: { total: 0, items: [] },
    goals: { targetNetWorth: 1000000 }
  };

  const DEFAULT_SETTINGS = {
    currency: "AED",
    locale: "ar-AE",
    monthlyInvestment: 3500,
    expectedReturn: 10,
    targetNetWorth: 1000000,
    monthlySalary: 32000
  };

  function clone(obj) {
    try { return structuredClone(obj); }
    catch (e) { return JSON.parse(JSON.stringify(obj)); }
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch (e) {
      return clone(fallback);
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function safeText(v) {
    return String(v || "").replace(/[<>&"]/g, function (c) {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
    });
  }

  function uid() {
    return "pf_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function money(v) {
    return Math.round(num(v)).toLocaleString("en-US") + " د.إ";
  }

  function pct(v) {
    return num(v).toFixed(1) + "%";
  }

  function monthLabel(months) {
    if (months === Infinity) return "غير ممكن حالياً";
    if (months <= 0) return "تم الوصول";
    if (months < 12) return months + " شهر";
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m ? y + " سنة و " + m + " شهر" : y + " سنة";
  }

  function lastUpdatedLabel(iso) {
    if (!iso) return "لم يتم التحديث";
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (min < 1) return "الآن";
    if (min < 60) return "قبل " + min + " دقيقة";
    if (hr < 24) return "قبل " + hr + " ساعة";
    return "قبل " + day + " يوم";
  }

  const EventBus = window.PWCEvents || {
    emit(name, detail) {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    },
    on(name, handler) {
      window.addEventListener(name, handler);
    }
  };

  window.PWCEvents = EventBus;

  const Store = {
    getSettings() {
      if (window.WCStore && typeof window.WCStore.getSettings === "function") {
        return Object.assign({}, DEFAULT_SETTINGS, window.WCStore.getSettings());
      }

      if (window.PWCStore && typeof window.PWCStore.getSettings === "function") {
        return Object.assign({}, DEFAULT_SETTINGS, window.PWCStore.getSettings());
      }

      return Object.assign({}, DEFAULT_SETTINGS, readJSON(SETTINGS_KEY, {}));
    },

    getData() {
      let data;

      if (window.WCStore && typeof window.WCStore.getState === "function") {
        data = window.WCStore.getState();
      } else if (window.WCStore && typeof window.WCStore.getData === "function") {
        data = window.WCStore.getData();
      } else if (window.PWCStore && typeof window.PWCStore.getState === "function") {
        data = window.PWCStore.getState();
      } else if (window.PWCStore && typeof window.PWCStore.getData === "function") {
        data = window.PWCStore.getData();
      } else {
        data = readJSON(APP_KEY, DEFAULT_DATA);
      }

      data = Object.assign({}, clone(DEFAULT_DATA), data || {});
      data.portfolio = Object.assign({}, clone(DEFAULT_PORTFOLIO), data.portfolio || {});

      if (!Array.isArray(data.portfolio.purchases)) data.portfolio.purchases = [];
      if (!data.assets) data.assets = clone(DEFAULT_DATA.assets);
      if (!data.liabilities) data.liabilities = clone(DEFAULT_DATA.liabilities);
      if (!data.goals) data.goals = clone(DEFAULT_DATA.goals);
      if (!data.meta) data.meta = clone(DEFAULT_DATA.meta);

      return data;
    },

    setData(data, reason = "portfolio:update") {
      data.meta = data.meta || {};
      data.meta.version = VERSION;
      data.meta.updatedAt = new Date().toISOString();

      if (window.WCStore && typeof window.WCStore.setState === "function") {
        window.WCStore.setState(data, reason);
      } else if (window.WCStore && typeof window.WCStore.saveData === "function") {
        window.WCStore.saveData(data, reason);
      } else if (window.PWCStore && typeof window.PWCStore.setState === "function") {
        window.PWCStore.setState(data, reason);
      } else if (window.PWCStore && typeof window.PWCStore.saveData === "function") {
        window.PWCStore.saveData(data, reason);
      } else {
        saveJSON(APP_KEY, data);
      }

      EventBus.emit("pwc:dataUpdated", { reason, data });
      EventBus.emit("pwc:portfolioUpdated", { reason, portfolio: data.portfolio, data });
      EventBus.emit("pwc:assetsUpdated", { reason, assets: data.assets, data });
      EventBus.emit("pwc:netWorthUpdated", { reason, data });
    }
  };

  function calculate() {
    const data = Store.getData();
    const settings = Store.getSettings();
    const p = data.portfolio;

    const capital = num(p.capital);
    const currentValue = num(p.currentValue);
    const monthlyInvestment = num(p.monthlyInvestment, num(settings.monthlyInvestment, 3500));
    const expectedReturn = num(p.expectedReturn, num(settings.expectedReturn, 10));

    const profit = currentValue - capital;
    const returnPct = capital > 0 ? (profit / capital) * 100 : 0;

    const monthlySalary = num(settings.monthlySalary);
    const investmentRateFromSalary = monthlySalary > 0 ? (monthlyInvestment / monthlySalary) * 100 : 0;

    const totalPurchases = p.purchases.reduce((sum, x) => sum + num(x.amount), 0);
    const monthlyRate = expectedReturn / 100 / 12;

    const projections = GOALS.map((goal) => {
      let months = 0;
      let value = currentValue;

      if (value >= goal) {
        months = 0;
      } else if (monthlyInvestment <= 0 && monthlyRate <= 0) {
        months = Infinity;
      } else {
        while (value < goal && months < 1200) {
          value = value * (1 + monthlyRate) + monthlyInvestment;
          months++;
        }
        if (months >= 1200) months = Infinity;
      }

      return {
        goal,
        months,
        progress: goal > 0 ? Math.min((currentValue / goal) * 100, 100) : 0
      };
    });

    let status = "جاهز";
    let tone = "neutral";
    let message = "أدخل رأس المال وقيمة المحفظة الحالية للحصول على تحليل مباشر.";

    if (capital > 0) {
      if (returnPct >= 15) {
        status = "أداء قوي";
        tone = "good";
        message = "المحفظة تحقق أداء قوي مقارنة برأس المال. الاستمرار الشهري بيسرّع الوصول للأهداف الكبيرة.";
      } else if (returnPct > 0) {
        status = "أداء إيجابي";
        tone = "good";
        message = "المحفظة فوق رأس المال. حافظ على الإضافة الشهرية وراقب نمو القيمة مع الوقت.";
      } else if (returnPct === 0) {
        status = "تعادل";
        tone = "neutral";
        message = "المحفظة حالياً عند رأس المال تقريباً. النمو الحقيقي بيظهر مع الوقت والإضافات المنتظمة.";
      } else {
        status = "تراجع مؤقت";
        tone = "bad";
        message = "المحفظة أقل من رأس المال. ركّز على خطة واضحة ومتوسط تكلفة مناسب.";
      }
    }

    return {
      data,
      settings,
      portfolio: p,
      capital,
      currentValue,
      monthlyInvestment,
      expectedReturn,
      profit,
      returnPct,
      totalPurchases,
      monthlySalary,
      investmentRateFromSalary,
      projections,
      status,
      tone,
      message,
      updatedLabel: lastUpdatedLabel(p.updatedAt)
    };
  }

  function updateMain(values) {
    const data = Store.getData();

    data.portfolio.capital = Math.max(0, num(values.capital));
    data.portfolio.currentValue = Math.max(0, num(values.currentValue));
    data.portfolio.monthlyInvestment = Math.max(0, num(values.monthlyInvestment, 3500));
    data.portfolio.expectedReturn = Math.max(0, num(values.expectedReturn, 10));
    data.portfolio.notes = safeText(values.notes || "");
    data.portfolio.updatedAt = new Date().toISOString();

    data.assets = data.assets || {};
    data.assets.investments = data.portfolio.currentValue;

    Store.setData(data, "portfolio:main_saved");
  }

  function addPurchase(amount, note) {
    amount = Math.max(0, num(amount));

    if (amount <= 0) {
      alert("دخل مبلغ الشراء أولاً");
      return;
    }

    const data = Store.getData();
    const p = data.portfolio;

    p.capital = num(p.capital) + amount;
    p.currentValue = num(p.currentValue) + amount;

    p.purchases.push({
      id: uid(),
      amount,
      note: safeText(note || ""),
      date: todayISO(),
      createdAt: new Date().toISOString()
    });

    p.updatedAt = new Date().toISOString();

    data.assets = data.assets || {};
    data.assets.investments = p.currentValue;

    Store.setData(data, "portfolio:purchase_added");
  }

  function deletePurchase(id) {
    const data = Store.getData();
    data.portfolio.purchases = data.portfolio.purchases.filter((x) => x.id !== id);
    data.portfolio.updatedAt = new Date().toISOString();
    Store.setData(data, "portfolio:purchase_deleted");
  }

  function clearPurchases() {
    if (!confirm("متأكد تبغي تمسح سجل الشراء الإضافي؟")) return;

    const data = Store.getData();
    data.portfolio.purchases = [];
    data.portfolio.updatedAt = new Date().toISOString();
    Store.setData(data, "portfolio:purchases_cleared");
  }

  function openManager() {
    const body = document.getElementById("pfSettingsBody");
    const arrow = document.getElementById("pfArrow");

    if (body) body.classList.add("open");
    if (arrow) arrow.textContent = "⌃";

    setTimeout(function () {
      const el = document.getElementById("pfManager");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function render() {
    const c = calculate();

    page.innerHTML = `
      <style>
        #portfolio {
          direction: rtl;
          padding: 14px 14px 92px;
          color: #101828;
          background: #f6f7f9;
          min-height: 100vh;
          box-sizing: border-box;
        }

        .pfHero {
          background: linear-gradient(135deg, #101828, #1d2939);
          color: #fff;
          border-radius: 30px;
          padding: 18px;
          box-shadow: 0 16px 38px rgba(16,24,40,.16);
          margin-bottom: 12px;
        }

        .pfTop {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }

        .pfTitle {
          margin: 0;
          font-size: 21px;
          font-weight: 950;
        }

        .pfSub {
          margin-top: 5px;
          font-size: 12px;
          opacity: .78;
          line-height: 1.6;
        }

        .pfBadge {
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }

        .pfMainValue {
          margin-top: 12px;
          font-size: 32px;
          font-weight: 950;
          letter-spacing: -.4px;
        }

        .pfHeroActions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .pfQuickBtn {
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.12);
          color: #fff;
          border-radius: 999px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .pfProfitBox {
          margin-top: 12px;
          background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 20px;
          padding: 12px;
        }

        .pfProfitLabel {
          font-size: 11px;
          opacity: .75;
          margin-bottom: 4px;
        }

        .pfProfitValue {
          font-size: 22px;
          font-weight: 950;
          color: ${c.profit >= 0 ? "#32d583" : "#f97066"};
        }

        .pfProfitSub {
          font-size: 11px;
          opacity: .78;
          margin-top: 3px;
        }

        .pfHeroGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 10px;
        }

        .pfHeroMini {
          background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 16px;
          padding: 10px;
        }

        .pfHeroMini span {
          display: block;
          color: rgba(255,255,255,.72);
          font-size: 10px;
          margin-bottom: 4px;
        }

        .pfHeroMini b {
          font-size: 12px;
          font-weight: 900;
        }

        .pfCard {
          background: #fff;
          border: 1px solid #eaecf0;
          border-radius: 23px;
          padding: 15px;
          box-shadow: 0 9px 24px rgba(16,24,40,.055);
          margin-bottom: 12px;
        }

        .pfCard h3 {
          margin: 0 0 12px;
          font-size: 17px;
          font-weight: 950;
        }

        .pfAnalysis {
          border-radius: 21px;
          padding: 14px;
          line-height: 1.8;
          font-size: 14px;
          margin-bottom: 12px;
          border: 1px solid #eaecf0;
          background: #fff;
        }

        .pfAnalysis.good {
          background: #ecfdf3;
          border-color: #abefc6;
        }

        .pfAnalysis.bad {
          background: #fef3f2;
          border-color: #fecdca;
        }

        .pfGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }

        .pfKpi {
          margin-bottom: 0;
          min-height: 104px;
        }

        .pfKpi span {
          display: block;
          font-size: 11px;
          color: #667085;
          margin-bottom: 7px;
          line-height: 1.5;
        }

        .pfKpi b {
          font-size: 18px;
          font-weight: 950;
          line-height: 1.3;
        }

        .pfSmall {
          font-size: 11px;
          color: #667085;
          margin-top: 6px;
          line-height: 1.65;
        }

        .pfFormula {
          background: #f9fafb;
          border: 1px solid #eaecf0;
          border-radius: 18px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .pfFormulaTitle {
          font-weight: 950;
          margin-bottom: 9px;
          font-size: 14px;
        }

        .pfFormulaLine {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .pfPill {
          background: #fff;
          border: 1px solid #eaecf0;
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 12px;
          color: #475467;
        }

        .pfPill b {
          color: #101828;
          font-weight: 950;
        }

        .pfGoals {
          display: grid;
          gap: 10px;
        }

        .pfGoal {
          border: 1px solid #eaecf0;
          background: #fff;
          border-radius: 19px;
          padding: 12px;
        }

        .pfGoalTop {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 9px;
          font-size: 12px;
        }

        .pfGoalTop b {
          font-size: 15px;
        }

        .pfGoalTop span {
          color: #667085;
        }

        .pfBar {
          height: 9px;
          border-radius: 999px;
          background: #f2f4f7;
          overflow: hidden;
        }

        .pfFill {
          height: 100%;
          background: #101828;
          border-radius: 999px;
        }

        .pfEmpty {
          text-align: center;
          padding: 16px 8px;
          color: #667085;
        }

        .pfEmptyIcon {
          font-size: 28px;
          margin-bottom: 7px;
        }

        .pfPurchase {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 11px 0;
          border-bottom: 1px solid #eaecf0;
        }

        .pfPurchase:last-child {
          border-bottom: 0;
        }

        .pfAccordion {
          margin-top: 10px;
        }

        .pfAccordionHeader {
          width: 100%;
          border: 0;
          background: #fff;
          border: 1px solid #eaecf0;
          border-radius: 22px;
          padding: 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 17px;
          font-weight: 950;
          color: #101828;
          cursor: pointer;
          box-shadow: 0 9px 24px rgba(16,24,40,.055);
        }

        .pfAccordionBody {
          display: none;
          margin-top: 10px;
        }

        .pfAccordionBody.open {
          display: block;
        }

        .pfForm {
          display: grid;
          gap: 9px;
        }

        .pfInput, .pfText {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 15px;
          padding: 12px 13px;
          font-size: 15px;
          outline: none;
          background: #fff;
          color: #101828;
        }

        .pfText {
          min-height: 76px;
          resize: vertical;
          font-family: inherit;
        }

        .pfBtn {
          width: 100%;
          border: 0;
          border-radius: 15px;
          padding: 12px 13px;
          font-size: 15px;
          font-weight: 950;
          background: #101828;
          color: #fff;
          cursor: pointer;
        }

        .pfBtn.secondary {
          background: #f2f4f7;
          color: #101828;
        }

        .pfBtn.danger {
          background: #fee4e2;
          color: #b42318;
        }
      </style>

      <section class="pfHero">
        <div class="pfTop">
          <div>
            <h1 class="pfTitle">المحفظة الاستثمارية</h1>
            <div class="pfSub">تحليل احترافي لرأس المال، الربح، العائد، والتوقعات.</div>
          </div>
          <div class="pfBadge">${c.status}</div>
        </div>

        <div class="pfMainValue">${money(c.currentValue)}</div>

        <div class="pfHeroActions">
          <button id="pfQuickEdit" class="pfQuickBtn">تحديث سريع</button>
        </div>

        <div class="pfProfitBox">
          <div class="pfProfitLabel">إجمالي الربح / الخسارة المحققة</div>
          <div class="pfProfitValue">${c.profit >= 0 ? "+" : ""}${money(c.profit)}</div>
          <div class="pfProfitSub">${pct(c.returnPct)} مقارنة برأس المال ${money(c.capital)}</div>
        </div>

        <div class="pfHeroGrid">
          <div class="pfHeroMini">
            <span>الإضافة</span>
            <b>${money(c.monthlyInvestment)}</b>
          </div>
          <div class="pfHeroMini">
            <span>العائد</span>
            <b>${pct(c.expectedReturn)}</b>
          </div>
          <div class="pfHeroMini">
            <span>تحديث</span>
            <b>${c.updatedLabel}</b>
          </div>
        </div>
      </section>

      <div class="pfAnalysis ${c.tone}">
        <b>التحليل الذكي:</b><br>
        ${c.message}
      </div>

      <section class="pfGrid">
        <div class="pfCard pfKpi">
          <span>قيمة الاستثمار الحالية</span>
          <b>${money(c.currentValue)}</b>
          <div class="pfSmall">قيمة المحفظة فقط.</div>
        </div>

        <div class="pfCard pfKpi">
          <span>نسبة الاستثمار من الراتب</span>
          <b>${pct(c.investmentRateFromSalary)}</b>
          <div class="pfSmall">حسب الإضافة الشهرية.</div>
        </div>

        <div class="pfCard pfKpi">
          <span>رأس المال المودع</span>
          <b>${money(c.capital)}</b>
        </div>

        <div class="pfCard pfKpi">
          <span>التقدم نحو المليون</span>
          <b>${pct(Math.min((c.currentValue / 1000000) * 100, 100))}</b>
          <div class="pfSmall">حسب المحفظة فقط.</div>
        </div>
      </section>

      <section class="pfCard">
        <h3>توقعات الوصول للأهداف</h3>

        <div class="pfFormula">
          <div class="pfFormulaTitle">أساس الحسبة</div>
          <div class="pfFormulaLine">
            <span class="pfPill">المحفظة: <b>${money(c.currentValue)}</b></span>
            <span class="pfPill">شهرياً: <b>${money(c.monthlyInvestment)}</b></span>
            <span class="pfPill">العائد: <b>${pct(c.expectedReturn)}</b></span>
            <span class="pfPill">الطريقة: <b>شهري مركب</b></span>
          </div>
        </div>

        <div class="pfGoals">
          ${c.projections.map((g) => `
            <div class="pfGoal">
              <div class="pfGoalTop">
                <b>${money(g.goal)}</b>
                <span>${pct(g.progress)} • ${monthLabel(g.months)}</span>
              </div>
              <div class="pfBar">
                <div class="pfFill" style="width:${g.progress}%"></div>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="pfSmall">
          التوقعات تقديرية وليست ضماناً. يتم احتسابها شهر بشهر على أساس القيمة الحالية + الإضافة الشهرية + العائد السنوي المتوقع مقسوماً شهرياً.
        </div>
      </section>

      <section class="pfCard">
        <h3>سجل الشراء الإضافي</h3>

        ${
          c.portfolio.purchases.length
            ? c.portfolio.purchases.slice().reverse().map((x) => `
              <div class="pfPurchase">
                <div>
                  <b>${money(x.amount)}</b>
                  <div class="pfSmall">${safeText(x.date)}${x.note ? " • " + safeText(x.note) : ""}</div>
                </div>
                <button class="pfBtn danger" style="width:auto;padding:8px 11px;" data-delete-purchase="${x.id}">
                  حذف
                </button>
              </div>
            `).join("")
            : `
              <div class="pfEmpty">
                <div class="pfEmptyIcon">📈</div>
                <b>لا توجد عمليات شراء إضافية بعد</b>
                <div class="pfSmall">أي شراء تضيفه من إدارة المحفظة سيظهر هنا.</div>
              </div>
            `
        }
      </section>

      <section id="pfManager" class="pfAccordion">
        <button id="pfToggleSettings" class="pfAccordionHeader">
          <span>⚙️ إدارة المحفظة</span>
          <span id="pfArrow">⌄</span>
        </button>

        <div id="pfSettingsBody" class="pfAccordionBody">
          <div class="pfCard">
            <h3>إضافة شراء جديد</h3>
            <div class="pfForm">
              <input id="pfBuyAmount" class="pfInput" type="number" inputmode="decimal" placeholder="كم اشتريت زيادة؟">
              <input id="pfBuyNote" class="pfInput" type="text" placeholder="ملاحظة اختيارية">
              <button id="pfAddBuy" class="pfBtn">إضافة إلى رأس المال والمحفظة</button>
            </div>
          </div>

          <div class="pfCard" style="margin-bottom:0;">
            <h3>تعديل بيانات المحفظة</h3>

            <div class="pfForm">
              <input id="pfCapital" class="pfInput" type="number" inputmode="decimal" placeholder="رأس المال المودع" value="${c.capital || ""}">
              <input id="pfCurrent" class="pfInput" type="number" inputmode="decimal" placeholder="قيمة المحفظة الحالية" value="${c.currentValue || ""}">
              <input id="pfMonthly" class="pfInput" type="number" inputmode="decimal" placeholder="الإضافة الشهرية" value="${c.monthlyInvestment || ""}">
              <input id="pfReturn" class="pfInput" type="number" inputmode="decimal" placeholder="العائد السنوي المتوقع %" value="${c.expectedReturn || ""}">
              <textarea id="pfNotes" class="pfText" placeholder="ملاحظات اختيارية">${safeText(c.portfolio.notes || "")}</textarea>
              <button id="pfSaveMain" class="pfBtn">حفظ وتحديث كل الصفحات</button>
              <button id="pfClearBuys" class="pfBtn secondary">مسح سجل الشراء</button>
            </div>
          </div>
        </div>
      </section>
    `;

    bindEvents();
  }

  function bindEvents() {
    const quickEdit = document.getElementById("pfQuickEdit");
    if (quickEdit) quickEdit.onclick = openManager;

    const toggleBtn = document.getElementById("pfToggleSettings");
    const body = document.getElementById("pfSettingsBody");
    const arrow = document.getElementById("pfArrow");

    if (toggleBtn && body) {
      toggleBtn.onclick = function () {
        body.classList.toggle("open");
        if (arrow) arrow.textContent = body.classList.contains("open") ? "⌃" : "⌄";
      };
    }

    const saveBtn = document.getElementById("pfSaveMain");
    const addBtn = document.getElementById("pfAddBuy");
    const clearBtn = document.getElementById("pfClearBuys");

    if (saveBtn) {
      saveBtn.onclick = function () {
        updateMain({
          capital: document.getElementById("pfCapital").value,
          currentValue: document.getElementById("pfCurrent").value,
          monthlyInvestment: document.getElementById("pfMonthly").value,
          expectedReturn: document.getElementById("pfReturn").value,
          notes: document.getElementById("pfNotes").value
        });
        render();
      };
    }

    if (addBtn) {
      addBtn.onclick = function () {
        addPurchase(
          document.getElementById("pfBuyAmount").value,
          document.getElementById("pfBuyNote").value
        );
        render();
      };
    }

    if (clearBtn) {
      clearBtn.onclick = function () {
        clearPurchases();
        render();
      };
    }

    document.querySelectorAll("[data-delete-purchase]").forEach((btn) => {
      btn.onclick = function () {
        deletePurchase(this.getAttribute("data-delete-purchase"));
        render();
      };
    });
  }

  window.PWCPortfolio = {
    version: VERSION,
    calculate,
    render,
    updateMain,
    addPurchase,
    deletePurchase,
    clearPurchases
  };

  EventBus.on("pwc:dataUpdated", function (e) {
    if (e.detail && String(e.detail.reason || "").startsWith("portfolio:")) return;
    render();
  });

  EventBus.on("pwc:settingsUpdated", render);
  EventBus.on("pwc:assetsUpdated", render);
  EventBus.on("pwc:liabilitiesUpdated", render);
  window.addEventListener("storage", render);

  render();
})();