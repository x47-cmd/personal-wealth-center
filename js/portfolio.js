/* =========================================================
   Personal Wealth Center
   Portfolio V3.1 Ultimate
   Store Architecture + Event Bus + Global State + Live Sync
   Update:
   - Edit box moved to bottom
   - Collapsed Accordion
   - Projection explanation added
   File: js/portfolio.js
========================================================= */

(function () {
  "use strict";

  const page = document.getElementById("portfolio");
  if (!page) return;

  const APP_KEY = "pwcDataV1";
  const SETTINGS_KEY = "pwcSettingsV1";
  const VERSION = "3.1.0";

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

    const liabilitiesTotal =
      num(data.liabilities.total) ||
      (Array.isArray(data.liabilities.items)
        ? data.liabilities.items.reduce((s, x) => s + num(x.balance || x.amount), 0)
        : 0);

    const assetsTotal =
      num(data.assets.cash) +
      currentValue +
      num(data.assets.realEstate) +
      num(data.assets.other);

    const netWorth = assetsTotal - liabilitiesTotal;

    const targetNetWorth = num(
      settings.targetNetWorth,
      num(data.goals && data.goals.targetNetWorth, 1000000)
    );

    const targetProgress = targetNetWorth > 0 ? Math.min((netWorth / targetNetWorth) * 100, 100) : 0;

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

    let status = "جاهز للتحليل";
    let tone = "neutral";
    let message = "أدخل رأس المال وقيمة المحفظة الحالية، وبعدها بتحصل تحليل مباشر وتوقعات للأهداف.";

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
        message = "المحفظة أقل من رأس المال. لا ترفع المخاطرة؛ ركّز على خطة واضحة ومتوسط تكلفة مناسب.";
      }
    }

    return {
      data, settings, portfolio: p,
      capital, currentValue, monthlyInvestment, expectedReturn,
      profit, returnPct, totalPurchases,
      monthlySalary, investmentRateFromSalary,
      assetsTotal, liabilitiesTotal, netWorth,
      targetNetWorth, targetProgress, projections,
      status, tone, message
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

  function render() {
    const c = calculate();

    page.innerHTML = `
      <style>
        #portfolio {
          direction: rtl;
          padding: 18px 14px 115px;
          color: #101828;
          background: #f6f7f9;
          min-height: 100vh;
          box-sizing: border-box;
        }

        .pfHero {
          background: linear-gradient(135deg, #101828, #1d2939);
          color: #fff;
          border-radius: 30px;
          padding: 22px;
          box-shadow: 0 18px 45px rgba(16, 24, 40, .18);
          margin-bottom: 14px;
        }

        .pfTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .pfTitle {
          margin: 0;
          font-size: 22px;
          font-weight: 950;
        }

        .pfSub {
          margin-top: 7px;
          font-size: 13px;
          opacity: .78;
          line-height: 1.7;
        }

        .pfBadge {
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .pfMainValue {
          margin-top: 18px;
          font-size: 34px;
          font-weight: 950;
        }

        .pfHeroGrid, .pfGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .pfHeroGrid {
          grid-template-columns: repeat(3, 1fr);
          margin-top: 16px;
        }

        .pfHeroMini {
          background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 18px;
          padding: 12px;
        }

        .pfHeroMini span, .pfKpi span {
          display: block;
          font-size: 12px;
          color: #667085;
          margin-bottom: 7px;
        }

        .pfHeroMini span {
          color: rgba(255,255,255,.72);
          font-size: 11px;
        }

        .pfHeroMini b {
          font-size: 14px;
          font-weight: 900;
        }

        .pfCard {
          background: #fff;
          border: 1px solid #eaecf0;
          border-radius: 24px;
          padding: 16px;
          box-shadow: 0 10px 28px rgba(16,24,40,.06);
          margin-bottom: 14px;
        }

        .pfCard h3 {
          margin: 0 0 13px;
          font-size: 16px;
          font-weight: 950;
        }

        .pfKpi b {
          font-size: 19px;
          font-weight: 950;
        }

        .pfAnalysis {
          border-radius: 22px;
          padding: 15px;
          line-height: 1.8;
          font-size: 14px;
          margin-bottom: 14px;
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

        .pfForm {
          display: grid;
          gap: 10px;
        }

        .pfInput, .pfText {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 16px;
          padding: 13px 14px;
          font-size: 15px;
          outline: none;
          background: #fff;
          color: #101828;
        }

        .pfText {
          min-height: 82px;
          resize: vertical;
          font-family: inherit;
        }

        .pfBtn {
          width: 100%;
          border: 0;
          border-radius: 16px;
          padding: 13px 14px;
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

        .pfGoals {
          display: grid;
          gap: 12px;
        }

        .pfGoal {
          border: 1px solid #eaecf0;
          background: #fff;
          border-radius: 20px;
          padding: 14px;
        }

        .pfGoalTop {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
          font-size: 13px;
        }

        .pfGoalTop b {
          font-size: 15px;
        }

        .pfGoalTop span {
          color: #667085;
        }

        .pfBar {
          height: 10px;
          border-radius: 999px;
          background: #f2f4f7;
          overflow: hidden;
        }

        .pfFill {
          height: 100%;
          background: #101828;
          border-radius: 999px;
        }

        .pfSmall {
          font-size: 12px;
          color: #667085;
          margin-top: 6px;
          line-height: 1.7;
        }

        .pfPurchase {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 12px 0;
          border-bottom: 1px solid #eaecf0;
        }

        .pfPurchase:last-child {
          border-bottom: 0;
        }

        .pfProfit {
          color: ${c.profit >= 0 ? "#027a48" : "#b42318"};
        }

        .pfAccordion {
          margin-top: 14px;
        }

        .pfAccordionHeader {
          width: 100%;
          border: 0;
          background: #fff;
          border: 1px solid #eaecf0;
          border-radius: 22px;
          padding: 17px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 16px;
          font-weight: 950;
          color: #101828;
          cursor: pointer;
          box-shadow: 0 10px 28px rgba(16,24,40,.06);
        }

        .pfAccordionBody {
          display: none;
          margin-top: 12px;
        }

        .pfAccordionBody.open {
          display: block;
        }

        @media(max-width: 620px) {
          .pfGrid, .pfHeroGrid {
            grid-template-columns: 1fr;
          }

          .pfMainValue {
            font-size: 30px;
          }
        }
      </style>

      <section class="pfHero">
        <div class="pfTop">
          <div>
            <h1 class="pfTitle">المحفظة الاستثمارية</h1>
            <div class="pfSub">تحليل مبسط لرأس المال، قيمة المحفظة، الربح، والتوقعات المستقبلية.</div>
          </div>
          <div class="pfBadge">${c.status}</div>
        </div>

        <div class="pfMainValue">${money(c.currentValue)}</div>

        <div class="pfHeroGrid">
          <div class="pfHeroMini">
            <span>رأس المال</span>
            <b>${money(c.capital)}</b>
          </div>
          <div class="pfHeroMini">
            <span>الربح / الخسارة</span>
            <b class="pfProfit">${money(c.profit)}</b>
          </div>
          <div class="pfHeroMini">
            <span>العائد</span>
            <b>${pct(c.returnPct)}</b>
          </div>
        </div>
      </section>

      <div class="pfAnalysis ${c.tone}">
        <b>التحليل الذكي:</b><br>
        ${c.message}
      </div>

      <section class="pfGrid">
        <div class="pfCard pfKpi">
          <span>صافي الثروة الحالي</span>
          <b>${money(c.netWorth)}</b>
          <div class="pfSmall">الأصول ناقص الالتزامات.</div>
        </div>

        <div class="pfCard pfKpi">
          <span>نسبة الاستثمار من الراتب</span>
          <b>${pct(c.investmentRateFromSalary)}</b>
          <div class="pfSmall">حسب الإضافة الشهرية والراتب.</div>
        </div>

        <div class="pfCard pfKpi">
          <span>إجمالي الشراء الإضافي</span>
          <b>${money(c.totalPurchases)}</b>
        </div>

        <div class="pfCard pfKpi">
          <span>التقدم نحو هدف صافي الثروة</span>
          <b>${pct(c.targetProgress)}</b>
          <div class="pfSmall">الهدف الحالي: ${money(c.targetNetWorth)}</div>
        </div>
      </section>

      <section class="pfCard">
        <h3>توقعات الوصول للأهداف</h3>

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
          الحسبة تقديرية مبنية على قيمة المحفظة الحالية ${money(c.currentValue)}،
          إضافة شهرية ${money(c.monthlyInvestment)}،
          وعائد سنوي متوقع ${pct(c.expectedReturn)}.
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
                <button class="pfBtn danger" style="width:auto;padding:9px 12px;" data-delete-purchase="${x.id}">
                  حذف
                </button>
              </div>
            `).join("")
            : `<div class="pfSmall">لا توجد عمليات شراء إضافية بعد.</div>`
        }
      </section>

      <section class="pfCard">
        <h3>إضافة شراء جديد</h3>
        <div class="pfForm">
          <input id="pfBuyAmount" class="pfInput" type="number" inputmode="decimal" placeholder="كم اشتريت زيادة؟">
          <input id="pfBuyNote" class="pfInput" type="text" placeholder="ملاحظة اختيارية">
          <button id="pfAddBuy" class="pfBtn">إضافة إلى رأس المال والمحفظة</button>
        </div>
      </section>

      <section class="pfAccordion">
        <button id="pfToggleSettings" class="pfAccordionHeader">
          <span>⚙️ تعديل بيانات المحفظة</span>
          <span id="pfArrow">⌄</span>
        </button>

        <div id="pfSettingsBody" class="pfAccordionBody">
          <div class="pfCard">
            <h3>تحديث بيانات المحفظة</h3>

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