/* ==========================================================
   Personal Wealth Center
   Settings Center
   Version: 1.3.0
   Full Financial Control Center
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

  function getData(){
    return WCStore.get();
  }

  function getSettings(){
    const data = getData();
    const s = {
      ...defaults,
      ...(data.settings || {})
    };

    return {
      currency: s.currency || "AED",
      targetNetWorth: num(s.targetNetWorth, 1000000),
      targetDividendIncomeMonthly: num(s.targetDividendIncomeMonthly, 10000),
      monthlyInvestment: num(s.monthlyInvestment, 3000),
      emergencyCash: num(s.emergencyCash, 15000),
      emergencyFundTarget: num(s.emergencyFundTarget || s.emergencyCash, 15000),
      expectedReturn: num(s.expectedReturn, 10),
      monthlySalary: num(s.monthlySalary, 32000),
      salaryDay: num(s.salaryDay, 27),
      annualRaise: num(s.annualRaise, 0),
      monthlySavingsTarget: num(s.monthlySavingsTarget, 0),
      monthlySpendingLimit: num(s.monthlySpendingLimit, 7000),
      retirementAge: num(s.retirementAge, 45),
      inflationRate: num(s.inflationRate, 3)
    };
  }

  function money(v){
    return WCUtils.money(num(v, 0));
  }

  function progress(current, target){
    if(!target || target <= 0) return 0;
    return Math.min(100, Math.max(0, (current / target) * 100));
  }

  function field(label, id, value, hint, type = "number"){
    return `
      <label class="settingField">
        <span>${label}</span>
        <input id="${id}" type="${type}" inputmode="decimal" value="${value}" />
        ${hint ? `<small>${hint}</small>` : ""}
      </label>
    `;
  }

  function section(title, desc, body){
    return `
      <section class="formCard settingsSection">
        <h3>${title}</h3>
        ${desc ? `<p class="settingsDesc">${desc}</p>` : ""}
        <div class="formGrid">
          ${body}
        </div>
      </section>
    `;
  }

  function render(){
    const s = getSettings();

    const emergencyProgress = progress(s.emergencyCash, s.emergencyFundTarget);
    const yearlyInvestment = s.monthlyInvestment * 12;
    const savingsRate = s.monthlySalary > 0
      ? Math.round((s.monthlyInvestment / s.monthlySalary) * 100)
      : 0;

    page.innerHTML = `
      ${WCUI.pageHero(
        "الإعدادات",
        "مركز التحكم الكامل في أهدافك المالية، الراتب، الاستثمار، الطوارئ، والنسخ الاحتياطي.",
        "Settings"
      )}

      ${WCUI.statGrid([
        { icon:"💾", label:"الإصدار", value:WC_CONFIG.app.version },
        { icon:"💵", label:"العملة", value:s.currency },
        { icon:"📈", label:"الاستثمار الشهري", value:money(s.monthlyInvestment) },
        { icon:"🎯", label:"هدف الثروة", value:money(s.targetNetWorth) }
      ])}

      <section class="decisionCard">
        <h3>ملخص الإعدادات</h3>
        <p>
          تستثمر حالياً <b>${money(s.monthlyInvestment)}</b> شهرياً،
          أي تقريباً <b>${money(yearlyInvestment)}</b> سنوياً.
          نسبة الاستثمار من الراتب حوالي <b>${savingsRate}%</b>.
        </p>
      </section>

      ${section(
        "الملف المالي الأساسي",
        "الإعدادات العامة التي تستخدمها كل صفحات المشروع.",
        `
          <label class="settingField">
            <span>العملة</span>
            <select id="setCurrency">
              <option value="AED" ${s.currency==="AED" ? "selected" : ""}>AED - درهم إماراتي</option>
              <option value="USD" ${s.currency==="USD" ? "selected" : ""}>USD - دولار</option>
              <option value="SAR" ${s.currency==="SAR" ? "selected" : ""}>SAR - ريال سعودي</option>
            </select>
            <small>العملة الأساسية في الرئيسية، التحليل، الثروة، والمصروفات.</small>
          </label>

          ${field("الراتب الشهري", "setMonthlySalary", s.monthlySalary, "راتبك الشهري الأساسي.")}
          ${field("يوم نزول الراتب", "setSalaryDay", s.salaryDay, "مثال: 27")}
          ${field("الزيادة السنوية المتوقعة", "setAnnualRaise", s.annualRaise, "اختياري. مثال: 5000")}
        `
      )}

      ${section(
        "أهداف الثروة والاستثمار",
        "هذه القيم تتحكم في حسابات النمو، التوقعات، والتحليل المالي.",
        `
          ${field("هدف الثروة", "setTargetNetWorth", s.targetNetWorth, "مثال: 1000000")}
          ${field("الاستثمار الشهري", "setMonthlyInvestment", s.monthlyInvestment, "المبلغ الذي تخطط تستثمره شهرياً.")}
          ${field("العائد السنوي المتوقع %", "setExpectedReturn", s.expectedReturn, "مثال: 10")}
          ${field("هدف الدخل السلبي الشهري", "setTargetDividendIncomeMonthly", s.targetDividendIncomeMonthly, "مثال: 10000")}
          ${field("سن الحرية المالية / التقاعد", "setRetirementAge", s.retirementAge, "مثال: 45")}
          ${field("معدل التضخم المتوقع %", "setInflationRate", s.inflationRate, "مثال: 3")}
        `
      )}

      ${section(
        "الكاش والطوارئ",
        "حدد المبلغ الحالي والهدف المطلوب لصندوق الطوارئ.",
        `
          ${field("الكاش الاحتياطي الحالي", "setEmergencyCash", s.emergencyCash, "المبلغ المتوفر حالياً للطوارئ.")}
          ${field("هدف صندوق الطوارئ", "setEmergencyFundTarget", s.emergencyFundTarget, "مثال: 15000 أو 30000")}
          ${field("هدف الادخار الشهري", "setMonthlySavingsTarget", s.monthlySavingsTarget, "اختياري.")}
          ${field("حد المصروف الشهري", "setMonthlySpendingLimit", s.monthlySpendingLimit, "يرتبط بصفحة المصروفات.")}
        `
      )}

      <section class="progressCard">
        <div class="progressTop">
          <h3>تقدم صندوق الطوارئ</h3>
          <div class="progressPercent">${Math.round(emergencyProgress)}%</div>
        </div>
        <div class="progressBar">
          <div class="progressFill" style="width:${emergencyProgress}%"></div>
        </div>
        <p>
          الحالي: ${money(s.emergencyCash)}
          —
          الهدف: ${money(s.emergencyFundTarget)}
        </p>
      </section>

      <section class="formCard">
        <button class="mainBtn" onclick="PWC_Settings.saveFinancialSettings()">
          حفظ كل الإعدادات
        </button>

        <p id="settingsSaveMsg" style="display:none;margin-top:14px;color:#1f7a2e;font-weight:900;text-align:center;">
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

      ${WCUI.decision(
        "هذه الصفحة أصبحت مركز التحكم الأساسي. أي تعديل هنا سيتم استخدامه لاحقاً في الرئيسية، التحليل، الثروة، المحفظة، والمصروفات."
      )}
    `;
  }

  function readNumber(id, fallback){
    const el = document.getElementById(id);
    return num(el ? el.value : fallback, fallback);
  }

  function saveFinancialSettings(){
    const nextSettings = {
      currency: document.getElementById("setCurrency").value || "AED",

      monthlySalary: readNumber("setMonthlySalary", 32000),
      salaryDay: readNumber("setSalaryDay", 27),
      annualRaise: readNumber("setAnnualRaise", 0),

      targetNetWorth: readNumber("setTargetNetWorth", 1000000),
      monthlyInvestment: readNumber("setMonthlyInvestment", 3000),
      expectedReturn: readNumber("setExpectedReturn", 10),
      targetDividendIncomeMonthly: readNumber("setTargetDividendIncomeMonthly", 10000),
      retirementAge: readNumber("setRetirementAge", 45),
      inflationRate: readNumber("setInflationRate", 3),

      emergencyCash: readNumber("setEmergencyCash", 15000),
      emergencyFundTarget: readNumber("setEmergencyFundTarget", 15000),
      monthlySavingsTarget: readNumber("setMonthlySavingsTarget", 0),
      monthlySpendingLimit: readNumber("setMonthlySpendingLimit", 7000)
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
  WCEvents.on("settingsChanged", render);
  document.addEventListener("DOMContentLoaded", render);

})();