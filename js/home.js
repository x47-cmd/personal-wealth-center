/* ==========================================================
   Personal Wealth Center
   Home Page
   Version: 1.0.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("home");
  if (!page) return;

  function render() {
    const data = WCStore.get();

    const totalAssets = data.assets.reduce((s, a) => s + WCUtils.num(a.value), 0);
    const totalLiabilities = data.liabilities.reduce((s, l) => s + WCUtils.num(l.balance), 0);
    const portfolioValue = data.portfolio.reduce((s, p) => s + WCUtils.num(p.value), 0);
    const netWorth = totalAssets + portfolioValue - totalLiabilities;

    page.innerHTML = `
      <section class="heroCard">
        <div class="heroTop">
          <span class="badge">Wealth Center</span>
          <span class="version">V${WC_CONFIG.app.version}</span>
        </div>

        <h2>لوحة الثروة الشخصية</h2>
        <p>تابع صافي ثروتك، محفظتك، التزاماتك، وتقدمك نحو أهدافك المالية من مكان واحد.</p>

        <div class="heroValue">${WCUtils.money(netWorth)}</div>
        <small>صافي الثروة الحالي</small>
      </section>

      <section class="gridCards">

        <div class="statCard">
          <span>📈</span>
          <small>المحفظة</small>
          <strong>${WCUtils.money(portfolioValue)}</strong>
        </div>

        <div class="statCard">
          <span>🏦</span>
          <small>الأصول</small>
          <strong>${WCUtils.money(totalAssets)}</strong>
        </div>

        <div class="statCard danger">
          <span>💳</span>
          <small>الالتزامات</small>
          <strong>${WCUtils.money(totalLiabilities)}</strong>
        </div>

        <div class="statCard gold">
          <span>🎯</span>
          <small>هدف الثروة</small>
          <strong>${WCUtils.money(data.settings.targetNetWorth)}</strong>
        </div>

      </section>

      <section class="decisionCard">
        <h3>💡 القرار المالي الآن</h3>
        <p>${smartDecision(data, netWorth, totalLiabilities)}</p>
      </section>

      <section class="emptyState">
        <h3>بداية المشروع</h3>
        <p>الهيكل الأساسي جاهز. الخطوة التالية هي بناء صفحة المحفظة وإضافة أول سهم.</p>
      </section>
    `;
  }

  function smartDecision(data, netWorth, debt) {
    if (debt > netWorth && debt > 0) {
      return "الأولوية الحالية هي تخفيض الالتزامات قبل زيادة المخاطرة الاستثمارية.";
    }

    if (netWorth < data.settings.emergencyFundTarget) {
      return "الأولوية الحالية هي تقوية صندوق الطوارئ قبل التوسع الاستثماري.";
    }

    return "وضعك مناسب للمتابعة: استمر في الاستثمار الشهري ومراقبة نمو صافي الثروة.";
  }

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);

})();