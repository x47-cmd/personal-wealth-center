/* ==========================================================
   Personal Wealth Center
   Settings Center
   Version: 1.4.0
   Modern Auto-Save Control Center
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

  function data(){
    return WCStore.get();
  }

  function settings(){
    const d = data();
    const s = {
      ...defaults,
      ...(d.settings || {})
    };

    return {
      currency: s.currency || "AED",
      monthlySalary: num(s.monthlySalary, 26550),
      salaryDay: num(s.salaryDay, 27),
      annualRaise: num(s.annualRaise, 0),

      targetNetWorth: num(s.targetNetWorth, 1000000),
      monthlyInvestment: num(s.monthlyInvestment, 3000),
      expectedReturn: num(s.expectedReturn, 10),
      targetDividendIncomeMonthly: num(s.targetDividendIncomeMonthly, 10000),
      retirementAge: num(s.retirementAge, 45),
      inflationRate: num(s.inflationRate, 3),

      emergencyCash: num(s.emergencyCash, 5000),
      emergencyFundTarget: num(s.emergencyFundTarget, 100000),

      monthlySavingsTarget: num(s.monthlySavingsTarget, 0),
      monthlySpendingLimit: num(s.monthlySpendingLimit, 7000)
    };
  }

  function money(v){
    return WCUtils.money(num(v, 0));
  }

  function pct(current, target){
    if(!target || target <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  }

  function save(next){
    WCStore.updateSettings(next);

    const toast = document.getElementById("settingsToast");
    if(toast){
      toast.classList.add("show");
      clearTimeout(window.__pwcSettingsToast);
      window.__pwcSettingsToast = setTimeout(() => {
        toast.classList.remove("show");
      }, 1400);
    }

    render(false);
  }

  function updateNumber(key, fallback){
    const current = settings()[key];
    const label = labels[key] || key;

    const value = prompt(`تعديل ${label}`, current);

    if(value === null) return;

    const n = num(value, fallback);

    save({ [key]: n });
  }

  function updateCurrency(){
    const s = settings();
    const value = prompt("اكتب العملة: AED أو USD أو SAR", s.currency);

    if(!value) return;

    const clean = value.trim().toUpperCase();

    if(!["AED","USD","SAR"].includes(clean)){
      alert("العملة المدعومة حالياً: AED / USD / SAR");
      return;
    }

    save({ currency: clean });
  }

  const labels = {
    currency:"العملة",
    monthlySalary:"الراتب الشهري",
    salaryDay:"يوم الراتب",
    annualRaise:"الزيادة السنوية",
    targetNetWorth:"هدف الثروة",
    monthlyInvestment:"الاستثمار الشهري",
    expectedReturn:"العائد السنوي المتوقع",
    targetDividendIncomeMonthly:"هدف الدخل السلبي",
    retirementAge:"سن الحرية المالية",
    inflationRate:"معدل التضخم",
    emergencyCash:"الكاش الحالي",
    emergencyFundTarget:"هدف الطوارئ",
    monthlySavingsTarget:"هدف الادخار الشهري",
    monthlySpendingLimit:"حد المصروف الشهري"
  };

  function settingRow(icon, label, value, action){
    return `
      <button class="settingRow" onclick="${action}">
        <div class="settingRowIcon">${icon}</div>
        <div class="settingRowText">
          <strong>${label}</strong>
          <span>${value}</span>
        </div>
        <div class="settingRowArrow">›</div>
      </button>
    `;
  }

  function metricCard(icon, label, value, sub){
    return `
      <div class="settingsMetric">
        <div class="settingsMetricIcon">${icon}</div>
        <small>${label}</small>
        <strong>${value}</strong>
        ${sub ? `<span>${sub}</span>` : ""}
      </div>
    `;
  }

  function section(title, desc, body){
    return `
      <section class="settingsPanel">
        <div class="settingsPanelHead">
          <h3>${title}</h3>
          ${desc ? `<p>${desc}</p>` : ""}
        </div>
        <div class="settingsList">
          ${body}
        </div>
      </section>
    `;
  }

  function render(scrollTop = false){
    const s = settings();

    const yearlyInvestment = s.monthlyInvestment * 12;
    const investRate = s.monthlySalary > 0
      ? Math.round((s.monthlyInvestment / s.monthlySalary) * 100)
      : 0;

    const emergencyPct = pct(s.emergencyCash, s.emergencyFundTarget);
    const afterInvestment = Math.max(0, s.monthlySalary - s.monthlyInvestment);

    page.innerHTML = `
      ${WCUI.pageHero(
        "الإعدادات",
        "مركز التحكم الذكي في الراتب، الاستثمار، أهداف الثروة، الطوارئ، والمصروفات.",
        "Settings"
      )}

      <div id="settingsToast" class="settingsToast">تم الحفظ ✅</div>

      <section class="settingsDashboard">
        ${metricCard("💵", "الراتب", money(s.monthlySalary), `بعد الاستثمار: ${money(afterInvestment)}`)}
        ${metricCard("📈", "الاستثمار الشهري", money(s.monthlyInvestment), `سنوياً: ${money(yearlyInvestment)}`)}
        ${metricCard("🎯", "هدف الثروة", money(s.targetNetWorth), `دخل سلبي: ${money(s.targetDividendIncomeMonthly)}`)}
        ${metricCard("🛟", "الطوارئ", `${emergencyPct}%`, `${money(s.emergencyCash)} / ${money(s.emergencyFundTarget)}`)}
      </section>

      <section class="decisionCard">
        <h3>القراءة الذكية</h3>
        <p>
          تستثمر حالياً <b>${money(s.monthlyInvestment)}</b> شهرياً،
          وهذا يساوي تقريباً <b>${investRate}%</b> من راتبك.
          صندوق الطوارئ مكتمل بنسبة <b>${emergencyPct}%</b>.
        </p>
      </section>

      ${section(
        "الملف المالي",
        "اضغط على أي بند لتعديله. يتم الحفظ تلقائياً.",
        `
          ${settingRow("💵", "العملة", s.currency, "PWC_Settings.updateCurrency()")}
          ${settingRow("🏦", "الراتب الشهري", money(s.monthlySalary), "PWC_Settings.updateNumber('monthlySalary',26550)")}
          ${settingRow("📅", "يوم نزول الراتب", s.salaryDay, "PWC_Settings.updateNumber('salaryDay',27)")}
          ${settingRow("⬆️", "الزيادة السنوية المتوقعة", money(s.annualRaise), "PWC_Settings.updateNumber('annualRaise',0)")}
        `
      )}

      ${section(
        "أهداف الثروة والاستثمار",
        "القيم الأساسية لحسابات النمو والتوقعات والتحليل المالي.",
        `
          ${settingRow("🎯", "هدف الثروة", money(s.targetNetWorth), "PWC_Settings.updateNumber('targetNetWorth',1000000)")}
          ${settingRow("📈", "الاستثمار الشهري", money(s.monthlyInvestment), "PWC_Settings.updateNumber('monthlyInvestment',3000)")}
          ${settingRow("📊", "العائد السنوي المتوقع", `${s.expectedReturn}%`, "PWC_Settings.updateNumber('expectedReturn',10)")}
          ${settingRow("💸", "هدف الدخل السلبي الشهري", money(s.targetDividendIncomeMonthly), "PWC_Settings.updateNumber('targetDividendIncomeMonthly',10000)")}
          ${settingRow("🏁", "سن الحرية المالية", `${s.retirementAge} سنة`, "PWC_Settings.updateNumber('retirementAge',45)")}
          ${settingRow("🔥", "معدل التضخم المتوقع", `${s.inflationRate}%`, "PWC_Settings.updateNumber('inflationRate',3)")}
        `
      )}

      <section class="settingsPanel">
        <div class="settingsPanelHead">
          <h3>صندوق الطوارئ</h3>
          <p>متابعة الكاش الاحتياطي مقابل الهدف المطلوب.</p>
        </div>

        <div class="emergencyBox">
          <div>
            <strong>${emergencyPct}%</strong>
            <span>مكتمل</span>
          </div>
          <div class="progressBar">
            <div class="progressFill" style="width:${emergencyPct}%"></div>
          </div>
          <p>الحالي: ${money(s.emergencyCash)} — الهدف: ${money(s.emergencyFundTarget)}</p>
        </div>

        <div class="settingsList">
          ${settingRow("💰", "الكاش الحالي", money(s.emergencyCash), "PWC_Settings.updateNumber('emergencyCash',5000)")}
          ${settingRow("🛟", "هدف صندوق الطوارئ", money(s.emergencyFundTarget), "PWC_Settings.updateNumber('emergencyFundTarget',100000)")}
        </div>
      </section>

      ${section(
        "المصروفات والادخار",
        "هذه القيم سيتم ربطها بصفحة المصروفات والتحليل.",
        `
          ${settingRow("💳", "حد المصروف الشهري", money(s.monthlySpendingLimit), "PWC_Settings.updateNumber('monthlySpendingLimit',7000)")}
          ${settingRow("🏦", "هدف الادخار الشهري", money(s.monthlySavingsTarget), "PWC_Settings.updateNumber('monthlySavingsTarget',0)")}
        `
      )}

      <section class="settingsPanel">
        <div class="settingsPanelHead">
          <h3>إدارة البيانات</h3>
          <p>النسخ الاحتياطي وإعادة ضبط بيانات التطبيق.</p>
        </div>

        <button class="mainBtn" onclick="PWC_Settings.backup()">
          إنشاء نسخة احتياطية
        </button>

        <button class="mainBtn secondaryBtn dangerBtn" onclick="PWC_Settings.reset()">
          إعادة ضبط البيانات
        </button>
      </section>

      <section class="settingsPanel aboutPanel">
        <div class="settingsPanelHead">
          <h3>حول التطبيق</h3>
          <p>${WC_CONFIG.app.name}</p>
        </div>

        <div class="settingsList">
          ${settingRow("💾", "الإصدار", WC_CONFIG.app.version, "void(0)")}
          ${settingRow("📦", "Build", WC_CONFIG.app.build || "-", "void(0)")}
          ${settingRow("🧭", "الوضع", WC_CONFIG.app.devMode ? "Development" : "Production", "void(0)")}
        </div>
      </section>
    `;

    if(scrollTop){
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function backup(){
    const d = WCStore.get();

    const blob = new Blob(
      [JSON.stringify(d,null,2)],
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
    render(true);
  }

  window.PWC_Settings = {
    updateNumber,
    updateCurrency,
    backup,
    reset
  };

  WCEvents.on("dataChanged", () => render(false));
  WCEvents.on("settingsChanged", () => render(false));
  document.addEventListener("DOMContentLoaded", () => render(false));

})();