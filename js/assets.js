/* ==========================================================
   Personal Wealth Center
   Assets Page
   Version: 1.0.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("assets");
  if (!page) return;

  function render() {
    const data = WCStore.get();

    const assets = data.assets || [];
    const liabilities = data.liabilities || [];

    const totalAssets = assets.reduce((s, x) => s + WCUtils.num(x.value), 0);
    const totalLiabilities = liabilities.reduce((s, x) => s + WCUtils.num(x.balance), 0);
    const netAssets = totalAssets - totalLiabilities;

    page.innerHTML = `
      <section class="pageHero">
        <span class="badge">Net Worth</span>
        <h2>الأصول والالتزامات</h2>
        <p>هنا تجمع كل ما تملك وكل ما عليك حتى تعرف صافي ثروتك الحقيقي.</p>
      </section>

      <section class="gridCards">
        <div class="statCard">
          <span>🏦</span>
          <small>إجمالي الأصول</small>
          <strong>${WCUtils.money(totalAssets)}</strong>
        </div>

        <div class="statCard danger">
          <span>💳</span>
          <small>إجمالي الالتزامات</small>
          <strong>${WCUtils.money(totalLiabilities)}</strong>
        </div>

        <div class="statCard gold">
          <span>💎</span>
          <small>الصافي</small>
          <strong>${WCUtils.money(netAssets)}</strong>
        </div>

        <div class="statCard">
          <span>📦</span>
          <small>عدد الأصول</small>
          <strong>${assets.length}</strong>
        </div>
      </section>

      <section class="actionCard">
        <h3>➕ إضافة أصل</h3>
        <p>لاحقاً بنضيف نموذج للأصول مثل الكاش، العقار، السندات الوطنية، الذهب، والمشاريع الخاصة.</p>
      </section>

      <section class="actionCard light">
        <h3>➕ إضافة التزام</h3>
        <p>بنضيف أيضاً نموذج للقروض، البطاقات، الأقساط، والدفعات الشهرية أو السنوية.</p>
      </section>

      <section class="emptyState">
        <h3>الثروة الحقيقية تبدأ هنا</h3>
        <p>بعد إضافة الأصول والالتزامات، سيحسب الموقع صافي الثروة تلقائياً ويعرض تطورها مع الوقت.</p>
      </section>
    `;
  }

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);

})();