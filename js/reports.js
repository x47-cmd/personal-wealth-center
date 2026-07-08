/* ==========================================================
   Personal Wealth Center Reports + Goals Center
========================================================== */
"use strict";

(function () {
  const page = document.getElementById("reports");
  if (!page) return;

  function monthKey(date = WCUtils.today()) {
    return String(date).slice(0, 7);
  }

  function calc(data) {
    const portfolio = (data.portfolio || []).reduce((s, x) => {
      return s + WCUtils.num(x.quantity) * WCUtils.num(x.currentPrice || x.avgPrice);
    }, 0);

    const assets = (data.assets || []).reduce((s, x) => s + WCUtils.num(x.value), 0);
    const liabilities = (data.liabilities || []).reduce((s, x) => s + WCUtils.num(x.balance), 0);
    const dividends = (data.dividends || []).reduce((s, x) => s + WCUtils.num(x.amount), 0);

    const monthlyBudget = WCUtils.num(data.spendingSettings?.monthlyBudget, 7000);
    const currentMonth = monthKey();
    const expenses = (data.expenses || []).filter(x => monthKey(x.date) === currentMonth);
    const monthlySpent = expenses.reduce((s, x) => s + WCUtils.num(x.amount), 0);
    const cashRemaining = Math.max(monthlyBudget - monthlySpent, 0);

    const netWorth = portfolio + assets + cashRemaining - liabilities;
    const goal = WCUtils.num(data.settings?.targetNetWorth, 1000000);
    const goalProgress = goal > 0 ? Math.min((netWorth / goal) * 100, 100) : 0;
    const debtRatio = portfolio + assets + cashRemaining > 0 ? (liabilities / (portfolio + assets + cashRemaining)) * 100 : 0;
    const spendingRatio = monthlyBudget > 0 ? (monthlySpent / monthlyBudget) * 100 : 0;

    return {
      portfolio,
      assets,
      liabilities,
      dividends,
      monthlyBudget,
      monthlySpent,
      cashRemaining,
      netWorth,
      goal,
      goalProgress,
      debtRatio,
      spendingRatio
    };
  }

  function render() {
    const data = WCStore.get();
    const c = calc(data);

    page.innerHTML = `
      ${WCUI.pageHero(
        "التحليل",
        "تحليل صافي الثروة، المحفظة، الالتزامات، المصروفات، التوزيعات، والأهداف المالية.",
        "Reports"
      )}

      ${WCUI.heroCard({
        tag: "Financial Intelligence",
        title: WCUtils.money(c.netWorth),
        desc: "صافي الثروة التحليلي بعد احتساب المصروف الشهري والكاش المتبقي.",
        value: WCUtils.percent(c.debtRatio),
        sub: "نسبة الالتزامات من إجمالي الأصول"
      })}

      ${WCUI.statGrid([
        { icon: "💎", label: "صافي الثروة", value: WCUtils.money(c.netWorth), type: "gold" },
        { icon: "📈", label: "المحفظة", value: WCUtils.money(c.portfolio) },
        { icon: "🏦", label: "الكاش المتبقي", value: WCUtils.money(c.cashRemaining), type: "gold" },
        { icon: "💳", label: "مصروف الشهر", value: WCUtils.money(c.monthlySpent) },
        { icon: "⚠️", label: "الديون", value: WCUtils.money(c.liabilities), type: "danger" },
        { icon: "💸", label: "التوزيعات", value: WCUtils.money(c.dividends), type: "gold" }
      ])}

      ${WCUI.progress(
        "هدف الثروة",
        c.goalProgress,
        `هدفك الحالي هو ${WCUtils.money(c.goal)}.`
      )}

      ${WCUI.progress(
        "مؤشر الدين",
        c.debtRatio,
        "كلما انخفضت النسبة كان الوضع المالي أكثر مرونة."
      )}

      ${WCUI.progress(
        "مؤشر المصروف الشهري",
        c.spendingRatio,
        `صرفت ${WCUtils.money(c.monthlySpent)} من ${WCUtils.money(c.monthlyBudget)}. المتبقي ${WCUtils.money(c.cashRemaining)}.`
      )}

      ${WCUI.card(
        "تحليل المصروفات",
        c.monthlySpent > 0
          ? `مصروفك الحالي هذا الشهر ${WCUtils.money(c.monthlySpent)} من ميزانية ${WCUtils.money(c.monthlyBudget)}.`
          : "لا توجد مصروفات مسجلة لهذا الشهر. أضف مصروفاتك من صفحة المصروفات حتى يظهر التحليل."
      )}

      ${WCUI.decision(reportInsight(c))}
    `;
  }

  function reportInsight(c) {
    if (c.netWorth < 0) return "صافي الثروة سلبي. الأولوية هي تخفيض الالتزامات وبناء كاش آمن.";
    if (c.debtRatio > 50) return "نسبة الديون مرتفعة. الأفضل التركيز على خفض الالتزامات قبل زيادة الاستثمار.";
    if (c.spendingRatio > 90) return "استهلاك المصروف الشهري مرتفع جداً. حاول تقليل المصاريف غير الضرورية.";
    if (c.dividends <= 0) return "صافي الثروة إيجابي، لكن دخل التوزيعات لم يبدأ بعد. أضف التوزيعات لمتابعة الدخل السلبي.";
    return "الوضع المالي يتجه بشكل جيد. استمر بتحديث البيانات ومراقبة المصروفات والاستثمارات.";
  }

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);
})();