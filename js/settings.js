/* ==========================================================
   Personal Wealth Center
   Settings
   Version: 1.2.0
   Practical Settings Center / Stable Save
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("settings");
  if (!page) return;

  const defaults = WC_CONFIG.defaults.settings;

  function num(v, fallback){
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function getSettings(){
    const data = WCStore.get();
    const s = {
      ...defaults,
      ...(data.settings || {})
    };

    return {
      currency: s.currency || "AED",
      targetNetWorth: num(s.targetNetWorth, 1000000),
      monthlyInvestment: num(s.monthlyInvestment, 3500),
      emergencyCash: num(s.emergencyCash, 15000),
      expectedReturn: num(s.expectedReturn, 10),
      monthlySalary: num(s.monthlySalary, 32000),
      salaryDay: num(s.salaryDay, 27)
    };
  }

  function field(label, id, value, hint){
    return `
      <label class="settingField">
        <span>${label}</span>
        <input id="${id}" type="number" inputmode="decimal" value="${value}" />
        ${hint ? `<small>${hint}</small>` : ""}
      </label>
    `;
  }

  function render() {
    const s = getSettings();

    page.innerHTML = `
      ${WCUI.pageHero(
        "الإعدادات",
        "مركز التحكم في أهدافك المالية، الاستثمار الشهري، الراتب، والنسخ الاحتياطي.",
        "Settings"
      )}

      ${WCUI.statGrid([
        { icon:"💾", label:"الإصدار", value:WC_CONFIG.app.version },
        { icon:"💵", label:"العملة", value:s.currency },
        { icon:"📈", label:"الاستثمار الشهري", value:WCUtils.money(s.monthlyInvestment) },
        { icon:"🎯", label:"هدف الثروة", value:WCUtils.money(s.targetNetWorth) }
      ])}

      <section class="formCard">
        <h3>الإعدادات المالية</h3>

        <div class="formGrid">

          <label class="settingField">
            <span>العملة</span>
            <select id="setCurrency">
              <option value="AED" ${s.currency==="AED" ? "selected" : ""}>AED - درهم إماراتي</option>
              <option value="USD" ${s.currency==="USD" ? "selected" : ""}>USD - دولار</option>
              <option value="SAR" ${s.currency==="SAR" ? "selected" : ""}>SAR - ريال سعودي</option>
            </select>
            <small>العملة الأساسية في كل الصفحات.</small>
          </label>

          ${field("هدف الثروة", "setTargetNetWorth", s.targetNetWorth, "مثال: 1000000")}
          ${field("الاستثمار الشهري", "setMonthlyInvestment", s.monthlyInvestment, "المبلغ الذي تخطط تستثمره شهرياً.")}
          ${field("الكاش الاحتياطي", "setEmergencyCash", s.emergencyCash, "مبلغ الطوارئ أو الاحتياطي.")}
          ${field("العائد السنوي المتوقع %", "setExpectedReturn", s.expectedReturn, "مثال: 10")}
          ${field("الراتب الشهري", "setMonthlySalary", s.monthlySalary, "راتبك الشهري الأساسي.")}
          ${field("يوم نزول الراتب", "setSalaryDay", s.salaryDay, "مثال: 27")}

        </div>

        <button class="mainBtn" onclick="PWC_Settings.saveFinancialSettings()">
          حفظ الإعدادات المالية
        </button>

        <p id="settingsSaveMsg" style="display:none;margin-top:14px;color:#1f7a2e;font-weight:900;">
          تم حفظ الإعدادات بنجاح ✅
        </p>
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
    `;
  }

  function readNumber(id, fallback){
    const el = document.getElementById(id);
    return num(el ? el.value : fallback, fallback);
  }

  function saveFinancialSettings(){

    const nextSettings = {
      currency: document.getElementById("setCurrency").value || "AED",
      targetNetWorth: readNumber("setTargetNetWorth", 1000000),
      monthlyInvestment: readNumber("setMonthlyInvestment", 3500),
      emergencyCash: readNumber("setEmergencyCash", 15000),
      emergencyFundTarget: readNumber("setEmergencyCash", 15000),
      expectedReturn: readNumber("setExpectedReturn", 10),
      monthlySalary: readNumber("setMonthlySalary", 32000),
      salaryDay: readNumber("setSalaryDay", 27)
    };

    WCStore.updateSettings(nextSettings);

    render();

    const msg = document.getElementById("settingsSaveMsg");
    if(msg){
      msg.style.display = "block";
      setTimeout(() => msg.style.display = "none", 2500);
    }
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
    if(!confirm("هل أنت متأكد من حذف جميع البيانات؟")) return;
    WCStore.reset();
    render();
  }

  window.PWC_Settings = {
    backup,
    reset,
    saveFinancialSettings
  };

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);

})();