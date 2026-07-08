/* ==========================================================
   Personal Wealth Center Spending & Budget Center
   Version: 1.0.0
========================================================== */
"use strict";

(function () {
  const page = document.getElementById("spending");
  if (!page) return;

  const CATEGORIES = [
    "مطاعم",
    "طلبات",
    "قهوة",
    "بترول",
    "سوبرماركت",
    "كارفور",
    "لولو",
    "نون",
    "أمازون",
    "مولات",
    "سيارة",
    "اشتراكات",
    "سفر",
    "تحويلات",
    "ترفيه",
    "متفرقات"
  ];

  const METHODS = [
    "Apple Pay",
    "بطاقة",
    "كاش",
    "تحويل",
    "Tabby",
    "أخرى"
  ];

  function monthKey(date = WCUtils.today()) {
    return String(date).slice(0, 7);
  }

  function calc(data) {
    const currentMonth = monthKey();
    const expenses = data.expenses || [];
    const monthExpenses = expenses.filter(x => monthKey(x.date) === currentMonth);

    const monthlyBudget = WCUtils.num(data.spendingSettings?.monthlyBudget, 7000);
    const spent = monthExpenses.reduce((s, x) => s + WCUtils.num(x.amount), 0);
    const remaining = monthlyBudget - spent;
    const usedPercent = monthlyBudget > 0 ? Math.min((spent / monthlyBudget) * 100, 999) : 0;

    const today = new Date();
    const day = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(daysInMonth - day, 1);

    const avgDaily = day > 0 ? spent / day : 0;
    const safeDaily = remaining > 0 ? remaining / daysLeft : 0;
    const forecast = avgDaily * daysInMonth;

    const byCategory = {};
    const byMerchant = {};

    monthExpenses.forEach(x => {
      const cat = x.category || "متفرقات";
      const merchant = x.merchant || "غير محدد";
      byCategory[cat] = (byCategory[cat] || 0) + WCUtils.num(x.amount);
      byMerchant[merchant] = (byMerchant[merchant] || 0) + WCUtils.num(x.amount);
    });

    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    const topMerchant = Object.entries(byMerchant).sort((a, b) => b[1] - a[1])[0];

    return {
      currentMonth,
      monthlyBudget,
      monthExpenses,
      spent,
      remaining,
      usedPercent,
      avgDaily,
      safeDaily,
      forecast,
      topCategory,
      topMerchant,
      byCategory,
      byMerchant
    };
  }

  function render() {
    const data = WCStore.get();
    const c = calc(data);

    page.innerHTML = `
      ${WCUI.pageHero(
        "مركز المصروفات والميزانية",
        "تابع مصروفك الشهري، اعرف وين تروح فلوسك، وخذ تنبيهات ذكية قبل ما تتجاوز الميزانية.",
        "Spending Center"
      )}

      ${WCUI.heroCard({
        tag: "Monthly Budget",
        title: WCUtils.money(c.spent),
        desc: `المصروف الحالي من ميزانية ${WCUtils.money(c.monthlyBudget)}`,
        value: WCUtils.money(c.remaining),
        sub: "المتبقي لهذا الشهر"
      })}

      ${WCUI.statGrid([
        { icon: "💰", label: "الميزانية", value: WCUtils.money(c.monthlyBudget), type: "gold" },
        { icon: "💳", label: "المصروف", value: WCUtils.money(c.spent), type: c.spent > c.monthlyBudget ? "danger" : "" },
        { icon: "📆", label: "المسموح يومياً", value: WCUtils.money(c.safeDaily) },
        { icon: "📈", label: "توقع نهاية الشهر", value: WCUtils.money(c.forecast), type: c.forecast > c.monthlyBudget ? "danger" : "" }
      ])}

      ${WCUI.progress(
        "استهلاك الميزانية الشهرية",
        c.usedPercent,
        `استخدمت ${WCUtils.percent(c.usedPercent)} من ميزانية هذا الشهر.`
      )}

      ${budgetForm(c.monthlyBudget)}
      ${expenseForm()}
      ${quickButtons()}
      ${categoryReport(c)}
      ${merchantReport(c)}
      ${expenseList(c.monthExpenses)}
      ${WCUI.decision(spendingInsight(c))}
    `;
  }

  function budgetForm(current) {
    return `
      <div class="formCard">
        <h3>⚙️ تعديل المصروف الشهري</h3>
        <div class="formGrid">
          <input id="spMonthlyBudget" type="number" step="0.01" value="${current}" placeholder="المصروف الشهري">
        </div>
        <button class="mainBtn" onclick="PWC_Spending.saveBudget()">حفظ الميزانية</button>
      </div>
    `;
  }

  function expenseForm() {
    return `
      <div class="formCard">
        <h3>➕ إضافة مصروف</h3>

        <div class="formGrid">
          <input id="exAmount" type="number" step="0.01" placeholder="المبلغ">
          <input id="exMerchant" type="text" placeholder="المكان / التاجر مثال: Talabat">

          <select id="exCategory">
            ${CATEGORIES.map(x => `<option value="${x}">${x}</option>`).join("")}
          </select>

          <select id="exMethod">
            ${METHODS.map(x => `<option value="${x}">${x}</option>`).join("")}
          </select>

          <input id="exDate" type="date" value="${WCUtils.today()}">
          <input id="exNote" type="text" placeholder="ملاحظة اختيارية">
        </div>

        <button class="mainBtn" onclick="PWC_Spending.addExpense()">حفظ المصروف</button>
      </div>
    `;
  }

  function quickButtons() {
    return `
      <div class="formCard">
        <h3>⚡ صرف سريع</h3>
        <div class="quickSpendGrid">
          ${[10, 25, 50, 100, 250, 500].map(v => `
            <button class="miniBtn" onclick="PWC_Spending.quickExpense(${v})">${v} درهم</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function categoryReport(c) {
    const rows = Object.entries(c.byCategory).sort((a, b) => b[1] - a[1]);

    if (!rows.length) {
      return WCUI.empty("لا توجد مصروفات هذا الشهر", "ابدأ بإضافة أول مصروف حتى تظهر التحليلات.");
    }

    return `
      <div class="tableCard">
        <h3>📊 المصروف حسب التصنيف</h3>
        <div class="stockList">
          ${rows.map(([name, value]) => `
            <div class="stockItem">
              <strong>${name}</strong>
              <small>${WCUtils.percent((value / c.spent) * 100)}</small>
              <b>${WCUtils.money(value)}</b>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function merchantReport(c) {
    const rows = Object.entries(c.byMerchant).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (!rows.length) return "";

    return `
      <div class="tableCard">
        <h3>🏪 أكثر الأماكن صرفاً</h3>
        <div class="stockList">
          ${rows.map(([name, value]) => `
            <div class="stockItem">
              <strong>${name}</strong>
              <small>من إجمالي مصروف الشهر</small>
              <b>${WCUtils.money(value)}</b>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function expenseList(list) {
    const sorted = [...list].sort((a, b) => String(b.date).localeCompare(String(a.date)));

    if (!sorted.length) return "";

    return `
      <div class="tableCard">
        <h3>🧾 آخر المصروفات</h3>
        <div class="stockList">
          ${sorted.slice(0, 20).map(x => `
            <div class="stockItem">
              <strong>${x.merchant || "مصروف"}</strong>
              <small>${x.category || "متفرقات"} • ${x.method || "-"} • ${x.date || "-"}</small>
              <b>${WCUtils.money(x.amount)}</b>
              <button class="miniBtn dangerBtn" onclick="PWC_Spending.removeExpense('${x.id}')">حذف</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function spendingInsight(c) {
    if (c.spent <= 0) {
      return "ابدأ بتسجيل المصروفات اليومية. بعد عدة أيام بنقدر نعطيك تحليل أدق لتوزيع مصروفك.";
    }

    if (c.spent > c.monthlyBudget) {
      return `يا يوسف، تجاوزت ميزانية الشهر بـ ${WCUtils.money(c.spent - c.monthlyBudget)}. الأفضل توقف المصاريف الكمالية وتراجع أعلى تصنيفين.`;
    }

    if (c.forecast > c.monthlyBudget) {
      return `إذا استمر صرفك بنفس المعدل، متوقع توصل إلى ${WCUtils.money(c.forecast)} نهاية الشهر. حاول تخفض الصرف اليومي إلى ${WCUtils.money(c.safeDaily)}.`;
    }

    if (c.usedPercent >= 75) {
      return "وصلت فوق 75% من الميزانية. من الآن ركز على الضروريات فقط عشان تكمل الشهر براحة.";
    }

    if (c.topCategory) {
      return `أكثر تصنيف صرفت عليه هذا الشهر هو ${c.topCategory[0]} بإجمالي ${WCUtils.money(c.topCategory[1])}. وضعك حالياً تحت السيطرة.`;
    }

    return "مصروفك الحالي متوازن. استمر بتسجيل العمليات حتى تحصل على تقارير أدق.";
  }

  function saveBudget() {
    const monthlyBudget = WCUtils.num(WCUtils.byId("spMonthlyBudget").value);

    if (monthlyBudget <= 0) {
      alert("دخل ميزانية صحيحة.");
      return;
    }

    WCStore.update(data => {
      data.spendingSettings.monthlyBudget = monthlyBudget;
    });
  }

  function addExpense() {
    const amount = WCUtils.num(WCUtils.byId("exAmount").value);
    const merchant = WCUtils.byId("exMerchant").value.trim();
    const category = WCUtils.byId("exCategory").value;
    const method = WCUtils.byId("exMethod").value;
    const date = WCUtils.byId("exDate").value || WCUtils.today();
    const note = WCUtils.byId("exNote").value.trim();

    if (amount <= 0) {
      alert("دخل مبلغ صحيح.");
      return;
    }

    WCStore.update(data => {
      data.expenses.push({
        id: WCUtils.uid(),
        amount,
        merchant: merchant || "غير محدد",
        category,
        method,
        date,
        note,
        createdAt: WCUtils.today()
      });
    });
  }

  function quickExpense(amount) {
    WCStore.update(data => {
      data.expenses.push({
        id: WCUtils.uid(),
        amount,
        merchant: "صرف سريع",
        category: "متفرقات",
        method: "Apple Pay",
        date: WCUtils.today(),
        note: "تمت إضافته من زر الصرف السريع",
        createdAt: WCUtils.today()
      });
    });
  }

  function removeExpense(id) {
    if (!confirm("حذف هذا المصروف؟")) return;

    WCStore.update(data => {
      data.expenses = data.expenses.filter(x => x.id !== id);
    });
  }

  window.PWC_Spending = {
    saveBudget,
    addExpense,
    quickExpense,
    removeExpense
  };

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);
})();