/* ==========================================================
   Personal Wealth Center Reports Page
   Version: 1.1.0
   Spending Analytics Connected
========================================================== */
"use strict";

(function () {
  const page = document.getElementById("reports");
  if (!page) return;

  function monthKey(date = WCUtils.today()) {
    return String(date).slice(0, 7);
  }

  function render() {
    const data = WCStore.get();

    const portfolio = (data.portfolio || []).reduce((s, x) => s + WCUtils.num(x.currentValue), 0);
    const assets = (data.assets || []).reduce((s, x) => s + WCUtils.num(x.value), 0);
    const liabilities = (data.liabilities || []).reduce((s, x) => s + WCUtils.num(x.balance), 0);
    const dividends = (data.dividends || []).reduce((s, x) => s + WCUtils.num(x.amount), 0);

    const currentMonth = monthKey();
    const monthlyBudget = WCUtils.num(data.spendingSettings?.monthlyBudget, 7000);

    const monthExpenses = (data.expenses || []).filter(x => monthKey(x.date) === currentMonth);
    const monthlySpent = monthExpenses.reduce((s, x) => s + WCUtils.num(x.amount), 0);
    const spendingPercent = monthlyBudget > 0 ? Math.min((monthlySpent / monthlyBudget) * 100, 999) : 0;
    const remainingBudget = monthlyBudget - monthlySpent;

    const cashAfterSpending = Math.max(remainingBudget, 0);
    const totalAssets = portfolio + assets + cashAfterSpending;
    const netWorth = totalAssets - liabilities;

    const debtRatio = totalAssets > 0 ? (liabilities / totalAssets) * 100 : 0;

    const byCategory = {};
    const byMerchant = {};

    monthExpenses.forEach(x => {
      const category = x.category || "متفرقات";
      const merchant = x.merchant || "غير محدد";

      byCategory[category] = (byCategory[category] || 0) + WCUtils.num(x.amount);
      byMerchant[merchant] = (byMerchant[merchant] || 0) + WCUtils.num(x.amount);
    });

    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    const topMerchant = Object.entries(byMerchant).sort((a, b) => b[1] - a[1])[0];

    page.innerHTML = `
      ${WCUI.pageHero(
        "مركز التحليل المالي",
        "تحليل صافي الثروة، المحفظة، الالتزامات، التوزيعات، المصروفات، والمخاطر المالية.",
        "Reports"
      )}

      ${WCUI.heroCard({
        tag: "Financial Intelligence",
        title: WCUtils.money(netWorth),
        desc: "صافي الثروة التحليلي بعد احتساب المصروف الشهري والكاش المتبقي.",
        value: WCUtils.percent(debtRatio),
        sub: "نسبة الالتزامات من إجمالي الأصول"
      })}

      ${WCUI.statGrid([
        { icon: "💎", label: "صافي الثروة", value: WCUtils.money(netWorth), type: "gold" },
        { icon: "📈", label: "المحفظة", value: WCUtils.money(portfolio) },
        { icon: "🏦", label: "الكاش المتبقي", value: WCUtils.money(cashAfterSpending), type: "gold" },
        { icon: "💳", label: "مصروف الشهر", value: WCUtils.money(monthlySpent), type: monthlySpent > monthlyBudget ? "danger" : "" },
        { icon: "⚠️", label: "الديون", value: WCUtils.money(liabilities), type: "danger" },
        { icon: "💸", label: "التوزيعات", value: WCUtils.money(dividends), type: "gold" }
      ])}

      ${WCUI.progress(
        "مؤشر الدين",
        debtRatio,
        "كلما انخفضت النسبة كان الوضع المالي أكثر مرونة."
      )}

      ${WCUI.progress(
        "مؤشر المصروف الشهري",
        spendingPercent,
        `صرفت ${WCUtils.money(monthlySpent)} من ${WCUtils.money(monthlyBudget)}. المتبقي ${WCUtils.money(remainingBudget)}.`
      )}

      ${spendingAnalysis(topCategory, topMerchant, monthlySpent)}

      ${WCUI.decision(reportInsight({
        netWorth,
        debtRatio,
        dividends,
        monthlySpent,
        monthlyBudget,
        spendingPercent,
        topCategory,
        topMerchant
      }))}
    `;
  }

  function spendingAnalysis(topCategory, topMerchant, monthlySpent) {
    if (!monthlySpent) {
      return WCUI.empty(
        "تحليل المصروفات",
        "لا توجد مصروفات مسجلة لهذا الشهر. أضف مصروفاتك من صفحة المصروفات حتى يظهر التحليل."
      );
    }

    return `
      <div class="tableCard">
        <h3>💳 تحليل المصروفات</h3>
        <div class="stockList">
          <div class="stockItem">
            <strong>أكثر تصنيف صرفاً</strong>
            <small>${topCategory ? topCategory[0] : "غير محدد"}</small>
            <b>${topCategory ? WCUtils.money(topCategory[1]) : WCUtils.money(0)}</b>
          </div>

          <div class="stockItem">
            <strong>أكثر مكان صرفاً</strong>
            <small>${topMerchant ? topMerchant[0] : "غير محدد"}</small>
            <b>${topMerchant ? WCUtils.money(topMerchant[1]) : WCUtils.money(0)}</b>
          </div>
        </div>
      </div>
    `;
  }

  function reportInsight(c) {
    if (c.monthlySpent > c.monthlyBudget) {
      return `المصروفات تجاوزت الميزانية الشهرية. أكثر نقطة تحتاج مراجعة هي ${c.topCategory ? c.topCategory[0] : "المصاريف الكمالية"}.`;
    }

    if (c.spendingPercent >= 90) {
      return "استهلاك الميزانية وصل إلى مستوى مرتفع جداً. الأفضل إيقاف المصروفات غير الضرورية حتى نهاية الشهر.";
    }

    if (c.spendingPercent >= 75) {
      return "المصروفات بدأت تقترب من الحد الأعلى. راقب الصرف اليومي وركز على الضروريات.";
    }

    if (c.netWorth <= 0) {
      return "المرحلة الحالية هي بناء قاعدة مالية موجبة عبر رفع الأصول وخفض الالتزامات وضبط المصروف.";
    }

    if (c.debtRatio > 50) {
      return "نسبة الالتزامات مرتفعة. الأفضل إعطاء أولوية لخطة السداد قبل زيادة المخاطرة.";
    }

    if (c.dividends <= 0) {
      return "صافي الثروة إيجابي، لكن دخل التوزيعات لم يبدأ بعد. أضف التوزيعات لمتابعة الدخل السلبي.";
    }

    return "الوضع المالي يتجه بشكل جيد. استمر في تحديث المصروفات والاستثمارات شهرياً لمراقبة النمو الحقيقي.";
  }

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);
})();