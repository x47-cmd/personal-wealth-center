/* ==========================================================
   Personal Wealth Center
   Portfolio Page
   Version: 1.0.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("portfolio");
  if (!page) return;

  function render() {
    const data = WCStore.get();
    const portfolio = data.portfolio || [];

    const total = portfolio.reduce((s, x) => s + WCUtils.num(x.value), 0);

    page.innerHTML = `
      <section class="pageHero">
        <span class="badge">Portfolio</span>
        <h2>محفظتي الاستثمارية</h2>
        <p>إدارة الأسهم، متوسط التكلفة، القيمة الحالية، الربح والخسارة، وتوزيع المحفظة.</p>
      </section>

      <section class="gridCards">
        <div class="statCard">
          <span>📈</span>
          <small>قيمة المحفظة</small>
          <strong>${WCUtils.money(total)}</strong>
        </div>

        <div class="statCard">
          <span>🏢</span>
          <small>عدد الشركات</small>
          <strong>${portfolio.length}</strong>
        </div>

        <div class="statCard gold">
          <span>💰</span>
          <small>استثمار شهري</small>
          <strong>${WCUtils.money(data.settings.monthlyInvestment)}</strong>
        </div>

        <div class="statCard">
          <span>⚖️</span>
          <small>حالة التنويع</small>
          <strong>${portfolio.length >= 5 ? "جيد" : "قيد البناء"}</strong>
        </div>
      </section>

      <section class="actionCard">
        <h3>➕ إضافة سهم</h3>
        <p>المرحلة القادمة بنضيف نموذج شراء سهم: الاسم، الرمز، الكمية، متوسط السعر، والقيمة الحالية.</p>
      </section>

      <section class="emptyState">
        <h3>لا توجد أسهم حالياً</h3>
        <p>بعد إضافة أول سهم، ستظهر هنا المحفظة مع التحليل والنسب والربح والخسارة.</p>
      </section>
    `;
  }

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);

})();