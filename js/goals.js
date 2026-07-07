/* ==========================================================
   Personal Wealth Center
   Goals Page
   Version: 1.0.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("goals");
  if (!page) return;

  function render() {
    page.innerHTML = `
      <section class="pageHero">
        <span class="badge">Financial Goals</span>
        <h2>الأهداف المالية</h2>
        <p>متابعة أهداف مثل مليون درهم، دخل توزيعات شهري، صندوق الطوارئ، وسداد الالتزامات.</p>
      </section>

      <section class="emptyState">
        <h3>قريباً</h3>
        <p>بنربط هذه الصفحة بصافي الثروة والمحفظة والتوزيعات بعد اكتمال الأساس.</p>
      </section>
    `;
  }

  document.addEventListener("DOMContentLoaded", render);

})();