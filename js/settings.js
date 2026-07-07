/* ==========================================================
   Personal Wealth Center
   Settings
   Version: 1.0.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("settings");
  if (!page) return;

  function render() {

    const data = WCStore.get();

    page.innerHTML = `

      ${WCUI.pageHero(
        "الإعدادات",
        "إدارة بيانات التطبيق والنسخ الاحتياطي والإعدادات العامة.",
        "Settings"
      )}

      ${WCUI.statGrid([

        {
          icon:"💾",
          label:"الإصدار",
          value:WC_CONFIG.app.version
        },

        {
          icon:"💵",
          label:"العملة",
          value:WC_CONFIG.app.currency
        },

        {
          icon:"📈",
          label:"الاستثمار الشهري",
          value:WCUtils.money(data.settings.monthlyInvestment)
        },

        {
          icon:"🎯",
          label:"هدف الثروة",
          value:WCUtils.money(data.settings.targetNetWorth)
        }

      ])}

      <section class="tableCard">

        <h3>إدارة البيانات</h3>

        <button class="mainBtn" onclick="PWC_Settings.backup()">
            إنشاء نسخة احتياطية
        </button>

        <button class="mainBtn secondaryBtn" onclick="PWC_Settings.reset()">
            إعادة ضبط البيانات
        </button>

      </section>

      ${WCUI.decision(
        "يتم حالياً حفظ البيانات داخل Local Storage. في المرحلة القادمة سيتم إضافة Firebase والمزامنة بين الأجهزة."
      )}

    `;

  }

  function backup(){

      const data = WCStore.get();

      const blob = new Blob(
          [JSON.stringify(data,null,2)],
          {type:"application/json"}
      );

      const url = URL.createObjectURL(blob);

      const a=document.createElement("a");

      a.href=url;

      a.download="wealth-backup.json";

      a.click();

      URL.revokeObjectURL(url);

  }

  function reset(){

      if(!confirm("هل أنت متأكد من حذف جميع البيانات؟"))
          return;

      WCStore.reset();

  }

  window.PWC_Settings={

      backup,

      reset

  };

  WCEvents.on("dataChanged",render);

  document.addEventListener("DOMContentLoaded",render);

})();