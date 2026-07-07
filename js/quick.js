/* ==========================================================
   Personal Wealth Center
   Quick Entry Page
   Version: 1.0.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("quick");
  if (!page) return;

  function render() {
    page.innerHTML = `
      ${WCUI.pageHero(
        "الإدخال السريع",
        "مكان واحد لإضافة سهم، توزيع، أصل، أو التزام بسرعة.",
        "Quick Entry"
      )}

      ${WCUI.empty(
        "قريباً",
        "بعد تثبيت المحفظة والتوزيعات والأصول، بنبني هنا مركز إدخال سريع لكل العمليات."
      )}
    `;
  }

  document.addEventListener("DOMContentLoaded", render);

})();