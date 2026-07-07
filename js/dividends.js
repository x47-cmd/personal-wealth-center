/* ==========================================================
   Personal Wealth Center
   Dividends Page
   Version: 1.0.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("dividends");
  if (!page) return;

  function render() {
    const data = WCStore.get();
    const dividends = data.dividends || [];

    const totalDividends = dividends.reduce((s, x) => s + WCUtils.num(x.amount), 0);
    const monthlyTarget = WCUtils.num(data.settings.targetDividendIncomeMonthly);
    const yearlyTarget = monthlyTarget * 12;
    const progress = yearlyTarget > 0 ? Math.min((totalDividends / yearlyTarget) * 100, 100) : 0;

    page.innerHTML = `
      <section class="pageHero">
        <span class="badge">Dividend Income</span>
        <h2>دخل التوزيعات</h2>
        <p>تابع التوزيعات المستلمة، الدخل السلبي، والعائد السنوي المتوقع من محفظتك.</p>
      </section>

      <section class="gridCards">
        <div class="statCard gold">
          <span>💰</span>
          <small>إجمالي التوزيعات</small>
          <strong>${WCUtils.money(totalDividends)}</strong>
        </div>

        <div class="statCard">
          <span>📅</span>
          <small>هدف شهري</small>
          <strong>${WCUtils.money(monthlyTarget)}</strong>
        </div>

        <div class="statCard">
          <span>🎯</span>
          <small>هدف سنوي</small>
          <strong>${WCUtils.money(yearlyTarget)}</strong>
        </div>

        <div class="statCard">
          <span>📊</span>
          <small>الإنجاز</small>
          <strong>${WCUtils.percent(progress)}</strong>
        </div>
      </section>

      <section class="progressCard">
        <div class="progressTop">
          <h3>التقدم نحو الدخل السلبي</h3>
          <strong>${WCUtils.percent(progress)}</strong>
        </div>
        <div class="progressBar">
          <span style="width:${progress}%"></span>
        </div>
        <p>الهدف النهائي: بناء دخل توزيعات يغطي جزء كبير من المصاريف الشهرية.</p>
      </section>

      <section class="actionCard">
        <h3>➕ إضافة توزيع</h3>
        <p>لاحقاً بنضيف نموذج تسجيل التوزيعات حسب الشركة، التاريخ، المبلغ، ونوع التوزيع.</p>
      </section>

      <section class="emptyState">
        <h3>لا توجد توزيعات مسجلة</h3>
        <p>بعد تسجيل أول توزيع، ستظهر هنا قائمة التوزيعات وتحليل الدخل السلبي.</p>
      </section>
    `;
  }

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);

})();