/* ==========================================================
   Personal Wealth Center
   Settings
   Version: 1.1.0
   Editable Financial Settings
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("settings");
  if (!page) return;

  function money(v){
    return WCUtils.money(Number(v || 0));
  }

  function getSettings(data){
    if(!data.settings) data.settings = {};

    return {
      currency: data.settings.currency || WC_CONFIG.app.currency || "AED",
      monthlyInvestment: Number(data.settings.monthlyInvestment || 3500),
      targetNetWorth: Number(data.settings.targetNetWorth || 1000000),
      emergencyCash: Number(data.settings.emergencyCash || 15000),
      expectedReturn: Number(data.settings.expectedReturn || 10),
      monthlySalary: Number(data.settings.monthlySalary || 32000),
      salaryDay: Number(data.settings.salaryDay || 27)
    };
  }

  function render() {

    const data = WCStore.get();
    const s = getSettings(data);

    page.innerHTML = `

      ${WCUI.pageHero(
        "الإعدادات",
        "إدارة إعداداتك المالية، أهداف الثروة، الاستثمار الشهري، والنسخ الاحتياطي.",
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
          value:s.currency
        },

        {
          icon:"📈",
          label:"الاستثمار الشهري",
          value:money(s.monthlyInvestment)
        },

        {
          icon:"🎯",
          label:"هدف الثروة",
          value:money(s.targetNetWorth)
        }

      ])}

      <section class="formCard">

        <h3>الإعدادات المالية</h3>

        <div class="formGrid">

          <select id="setCurrency">
            <option value="AED" ${s.currency==="AED" ? "selected" : ""}>AED - درهم إماراتي</option>
            <option value="USD" ${s.currency==="USD" ? "selected" : ""}>USD - دولار</option>
            <option value="SAR" ${s.currency==="SAR" ? "selected" : ""}>SAR - ريال سعودي</option>
          </select>

          <input id="setTargetNetWorth" type="number" inputmode="decimal"
            placeholder="هدف الثروة"
            value="${s.targetNetWorth}" />

          <input id="setMonthlyInvestment" type="number" inputmode="decimal"
            placeholder="الاستثمار الشهري"
            value="${s.monthlyInvestment}" />

          <input id="setEmergencyCash" type="number" inputmode="decimal"
            placeholder="الكاش الاحتياطي"
            value="${s.emergencyCash}" />

          <input id="setExpectedReturn" type="number" inputmode="decimal"
            placeholder="العائد السنوي المتوقع %"
            value="${s.expectedReturn}" />

          <input id="setMonthlySalary" type="number" inputmode="decimal"
            placeholder="الراتب الشهري"
            value="${s.monthlySalary}" />

          <input id="setSalaryDay" type="number" inputmode="numeric"
            placeholder="يوم نزول الراتب"
            value="${s.salaryDay}" />

        </div>

        <button class="mainBtn" onclick="PWC_Settings.saveFinancialSettings()">
          حفظ الإعدادات المالية
        </button>

      </section>

      <section class="tableCard">

        <h3>إدارة البيانات</h3>

        <button class="mainBtn" onclick="PWC_Settings.backup()">
          إنشاء نسخة احتياطية
        </button>

        <button class="mainBtn secondaryBtn dangerBtn" onclick="PWC_Settings.reset()">
          إعادة ضبط البيانات
        </button>

      </section>

      ${WCUI.decision(
        "أي تعديل في الإعدادات المالية سيتم حفظه وتحديثه في الرئيسية، الثروة، التحليل، وباقي الصفحات المرتبطة."
      )}

    `;

  }

  function saveFinancialSettings(){

    const data = WCStore.get();

    if(!data.settings) data.settings = {};

    data.settings.currency = document.getElementById("setCurrency").value || "AED";

    data.settings.targetNetWorth =
      Number(document.getElementById("setTargetNetWorth").value || 0);

    data.settings.monthlyInvestment =
      Number(document.getElementById("setMonthlyInvestment").value || 0);

    data.settings.emergencyCash =
      Number(document.getElementById("setEmergencyCash").value || 0);

    data.settings.expectedReturn =
      Number(document.getElementById("setExpectedReturn").value || 0);

    data.settings.monthlySalary =
      Number(document.getElementById("setMonthlySalary").value || 0);

    data.settings.salaryDay =
      Number(document.getElementById("setSalaryDay").value || 27);

    WCStore.set(data);

    WCEvents.emit("dataChanged");

    alert("تم حفظ الإعدادات المالية بنجاح ✅");

  }

  function backup(){

    const data = WCStore.get();

    const blob = new Blob(
      [JSON.stringify(data,null,2)],
      {type:"application/json"}
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "wealth-backup.json";
    a.click();

    URL.revokeObjectURL(url);

  }

  function reset(){

    if(!confirm("هل أنت متأكد من حذف جميع البيانات؟"))
      return;

    WCStore.reset();

  }

  window.PWC_Settings = {
    backup,
    reset,
    saveFinancialSettings
  };

  WCEvents.on("dataChanged",render);

  document.addEventListener("DOMContentLoaded",render);

})();