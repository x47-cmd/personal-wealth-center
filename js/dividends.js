/* ==========================================================
   Personal Wealth Center
   Dividends Page
   Version: 1.1.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("dividends");
  if (!page) return;

  function render() {
    const data = WCStore.get();
    const list = data.dividends || [];

    const total = list.reduce((s, x) => s + WCUtils.num(x.amount), 0);
    const monthlyTarget = WCUtils.num(data.settings.targetDividendIncomeMonthly);
    const yearlyTarget = monthlyTarget * 12;
    const progress = yearlyTarget > 0 ? Math.min((total / yearlyTarget) * 100, 100) : 0;

    page.innerHTML = `
      ${WCUI.pageHero(
        "دخل التوزيعات",
        "تابع التوزيعات المستلمة، الدخل السلبي، والهدف الشهري من أرباح الأسهم.",
        "Dividends"
      )}

      ${WCUI.heroCard({
        tag: "Passive Income",
        title: WCUtils.money(total),
        desc: "إجمالي التوزيعات المسجلة",
        value: WCUtils.money(monthlyTarget),
        sub: "هدف الدخل الشهري من التوزيعات"
      })}

      ${WCUI.statGrid([
        { icon: "💰", label: "إجمالي التوزيعات", value: WCUtils.money(total), type: "gold" },
        { icon: "📅", label: "هدف شهري", value: WCUtils.money(monthlyTarget) },
        { icon: "🎯", label: "هدف سنوي", value: WCUtils.money(yearlyTarget) },
        { icon: "📊", label: "الإنجاز", value: WCUtils.percent(progress) }
      ])}

      ${WCUI.progress(
        "التقدم نحو دخل التوزيعات",
        progress,
        `هدفك السنوي الحالي من التوزيعات هو ${WCUtils.money(yearlyTarget)}.`
      )}

      ${WCUI.formCard(
        "➕ إضافة توزيع",
        [
          WCUI.input("dCompany", "الشركة مثال: ADIB"),
          WCUI.input("dAmount", "المبلغ", "number", "0.01"),
          WCUI.input("dDate", "التاريخ", "date"),
          WCUI.input("dNote", "ملاحظة اختيارية")
        ],
        "حفظ التوزيع",
        "PWC_Dividends.add()"
      )}

      <section class="tableCard">
        <h3>سجل التوزيعات</h3>
        ${renderList(list)}
      </section>

      ${WCUI.decision(dividendInsight(total, monthlyTarget, progress))}
    `;
  }

  function renderList(list) {
    if (!list.length) {
      return `
        <div class="emptyState inner">
          <h3>لا توجد توزيعات</h3>
          <p>أضف أول توزيع حتى يبدأ الموقع بحساب الدخل السلبي.</p>
        </div>
      `;
    }

    return `
      <div class="stockList">
        ${[...list].reverse().map(x => `
          <div class="stockItem">
            <div>
              <strong>${x.company}</strong>
              <small>${x.date || "بدون تاريخ"}</small>
            </div>

            <div>
              <b>${WCUtils.money(x.amount)}</b>
              <small>${x.note || "توزيع أرباح"}</small>
            </div>

            <div>
              <small>النوع</small>
              <b>Dividend</b>
            </div>

            <button class="miniBtn dangerBtn" onclick="PWC_Dividends.remove('${x.id}')">حذف</button>
          </div>
        `).join("")}
      </div>
    `;
  }

  function add() {
    const company = WCUtils.byId("dCompany").value.trim();
    const amount = WCUtils.num(WCUtils.byId("dAmount").value);
    const date = WCUtils.byId("dDate").value || WCUtils.today();
    const note = WCUtils.byId("dNote").value.trim();

    if (!company || amount <= 0) {
      alert("دخل اسم الشركة والمبلغ.");
      return;
    }

    WCStore.update(data => {
      data.dividends.push({
        id: WCUtils.uid(),
        company,
        amount,
        date,
        note,
        createdAt: WCUtils.today()
      });
    });
  }

  function remove(id) {
    if (!confirm("حذف التوزيع؟")) return;

    WCStore.update(data => {
      data.dividends = data.dividends.filter(x => x.id !== id);
    });
  }

  function dividendInsight(total, monthlyTarget, progress) {
    if (total <= 0) {
      return "لم يتم تسجيل أي توزيعات بعد. بعد أول توزيع سيبدأ النظام بحساب الدخل السلبي والتقدم نحو الهدف.";
    }

    if (progress < 10) {
      return "أنت في بداية بناء دخل التوزيعات. الاستمرارية في الشراء الشهري أهم من حجم التوزيع الحالي.";
    }

    if (monthlyTarget > 0 && total >= monthlyTarget) {
      return "ممتاز، إجمالي التوزيعات المسجلة وصل أو تجاوز هدف شهر واحد من الدخل السلبي.";
    }

    return "الدخل السلبي بدأ يتشكل. راقب نمو التوزيعات سنوياً وركز على الاستمرارية.";
  }

  window.PWC_Dividends = {
    add,
    remove
  };

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);

})();