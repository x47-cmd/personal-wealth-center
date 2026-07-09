/* =========================================================
   Personal Wealth Center - Home
   Phase 1 Data Integration
   File: js/home.js
========================================================= */

(function () {
  "use strict";

  const root = document.getElementById("home");
  if (!root) return;

  const $ = (id) => document.getElementById(id);

  function store() {
    return window.WCStore;
  }

  function n(v) {
    return store().num(v, 0);
  }

  function money(v) {
    return store().money(v);
  }

  function pct(v) {
    return `${n(v).toFixed(1)}%`;
  }

  function go(pageId) {
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("on"));
    const page = document.getElementById(pageId);
    if (page) page.classList.add("on");

    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("on"));
    const tab = document.querySelector(`.tab[data-page="${pageId}"]`);
    if (tab) tab.classList.add("on");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.pwcGo = go;

  function progressBar(value) {
    const width = Math.max(0, Math.min(n(value), 100));
    return `
      <div class="pwcProgress">
        <span style="width:${width}%"></span>
      </div>
    `;
  }

  function render() {
    if (!store()) return;

    const data = store().get();
    const c = store().calc(data);

    root.innerHTML = `
      <section class="pwcHome">

        <div class="pwcBrand">
          <div>
            <h1>مركز إدارة الثروة الشخصية</h1>
            <p>Personal Wealth Center</p>
          </div>
          <div class="pwcLogo">💰</div>
        </div>

        <div class="pwcHeroTitle">
          <div class="pwcLogo big">💰</div>
          <div>
            <h2>مركز الثروة</h2>
            <p>لوحة مختصرة لصافي الثروة الحقيقي</p>
          </div>
        </div>

        <div class="pwcHeroCard">
          <div class="pwcPill">لوحة التحكم الرئيسية</div>
          <h2>صافي ثروتك الحقيقي</h2>
          <p>
            يتم حسابه من الكاش، صندوق الطوارئ، المحفظة، التوزيعات،
            والأصول بعد خصم الالتزامات. المصروف الشهري لا يدخل ضمن صافي الثروة.
          </p>
          <strong>${money(c.netWorth)}</strong>
          <small>${c.netWorth >= 0 ? "موجب بعد خصم الالتزامات" : "سالب بعد خصم الالتزامات"}</small>
        </div>

        <div class="pwcDecision">
          <div>
            <h3>قرار اليوم المالي</h3>
            <p>${decisionText(c)}</p>
          </div>
          <span>🛟</span>
        </div>

        <div class="pwcKpiGrid">
          <div class="pwcKpi">
            <span>📈</span>
            <h4>المحفظة</h4>
            <strong>${money(c.portfolio)}</strong>
            <p>العائد الحالي ${pct(c.portfolioReturnPercent)}</p>
          </div>

          <div class="pwcKpi">
            <span>💰</span>
            <h4>صافي الثروة</h4>
            <strong>${money(c.netWorth)}</strong>
            <p>الأصول ناقص الالتزامات</p>
          </div>

          <div class="pwcKpi">
            <span>💳</span>
            <h4>مصروف الشهر</h4>
            <strong>${pct(c.spendingProgress)}</strong>
            <p>${money(c.monthSpent)} من ${money(c.monthlyBudget)}</p>
          </div>

          <div class="pwcKpi">
            <span>🛟</span>
            <h4>صندوق الطوارئ</h4>
            <strong>${pct(c.emergencyProgress)}</strong>
            <p>${money(c.emergency)} من ${money(c.emergencyTarget)}</p>
          </div>
        </div>

        <div class="pwcWideCard">
          <div class="pwcWideHead">
            <h3>هدف المليون</h3>
            <strong>${pct(c.targetProgress)}</strong>
          </div>
          ${progressBar(c.targetProgress)}
          <p>باقي للوصول للهدف: <b>${money(c.remainingToTarget)}</b></p>
        </div>

        <div class="pwcWideCard">
          <div class="pwcWideHead">
            <h3>المصروف الشهري</h3>
            <strong>${pct(c.spendingProgress)}</strong>
          </div>
          ${progressBar(c.spendingProgress)}
          <p>المصروف منفصل عن صافي الثروة. المتبقي من الميزانية: <b>${money(c.spendingRemaining)}</b></p>
        </div>

        <div class="pwcNetCard">
          <div class="pwcNetTop">
            <h3>تفصيل صافي الثروة</h3>
            <strong>${money(c.netWorth)}</strong>
          </div>

          <div class="pwcMiniGrid">
            <div>
              <span>الكاش المتاح</span>
              <b>${money(c.cash)}</b>
            </div>
            <div>
              <span>صندوق الطوارئ</span>
              <b>${money(c.emergency)}</b>
            </div>
            <div>
              <span>المحفظة</span>
              <b>${money(c.portfolio)}</b>
            </div>
            <div>
              <span>التوزيعات</span>
              <b>${money(c.dividends)}</b>
            </div>
            <div>
              <span>الأصول الأخرى</span>
              <b>${money(c.otherAssets)}</b>
            </div>
            <div>
              <span>الالتزامات</span>
              <b>${money(c.liabilities)}</b>
            </div>
          </div>
        </div>

        <div class="pwcPortfolioCard">
          <div>
            <h3>أداء المحفظة</h3>
            <p>
              قيمة المحفظة: ${money(c.portfolio)}
              —
              التكلفة: ${money(c.portfolioCost)}
              —
              العائد: ${pct(c.portfolioReturnPercent)}
            </p>
          </div>
          <strong>${money(c.portfolioProfit)}</strong>
        </div>

        <div class="pwcAlerts">
          <h3>تنبيهات ذكية</h3>
          ${alerts(c).map((x) => `<div class="pwcAlert">🔔 ${x}</div>`).join("")}
        </div>

        <div class="pwcActions">
          <button onclick="pwcGo('portfolio')">تحديث المحفظة</button>
          <button onclick="pwcGo('assets')">تحديث الثروة</button>
          <button onclick="pwcGo('spending')">إضافة مصروف</button>
          <button onclick="pwcGo('reports')">عرض التحليل</button>
        </div>

      </section>
    `;
  }

  function decisionText(c) {
    if (c.emergencyProgress < 20) {
      return `قوّي صندوق الطوارئ. ناقصك ${money(c.emergencyTarget - c.emergency)} للوصول للهدف.`;
    }

    if (c.spendingProgress > 90) {
      return `خفف المصروف هذا الشهر. باقي من الميزانية ${money(c.spendingRemaining)}.`;
    }

    if (c.portfolioReturnPercent > 10) {
      return "محفظتك أداؤها قوي. الاستمرار الشهري بيسرّع الوصول للأهداف.";
    }

    return "استمر على الاستثمار الشهري وراقب المصروف والطوارئ.";
  }

  function alerts(c) {
    return [
      `صافي الثروة الحالي ${money(c.netWorth)} محسوب من كل الأصول ناقص الالتزامات.`,
      `الأصول الحالية ${money(c.totalAssets)} مقابل التزامات ${money(c.liabilities)}.`,
      `صندوق الطوارئ مكتمل ${pct(c.emergencyProgress)}.`,
      `استثمارك الشهري ${money(c.monthlyInvestment)} = ${pct(c.investmentOfSalary)} من الراتب.`
    ];
  }

  window.addEventListener("pwc:dataUpdated", render);
  window.addEventListener("storage", render);
  document.addEventListener("DOMContentLoaded", render);

  render();
})();