/* ==========================================================
   Personal Wealth Center Home Page
   Version: 1.3.0
   Clean Premium + Spending Connected
========================================================== */
"use strict";

(function () {
  const page = document.getElementById("home");
  if (!page) return;

  function monthKey(date = WCUtils.today()) {
    return String(date).slice(0, 7);
  }

  function calc(data) {
    const portfolioValue = (data.portfolio || []).reduce((s, x) => {
      return s + WCUtils.num(x.currentValue || x.value || x.marketValue);
    }, 0);

    const assetsValue = (data.assets || []).reduce((s, x) => {
      return s + WCUtils.num(x.value);
    }, 0);

    const liabilitiesValue = (data.liabilities || []).reduce((s, x) => {
      return s + WCUtils.num(x.balance || x.amount || x.value);
    }, 0);

    const dividendsValue = (data.dividends || []).reduce((s, x) => {
      return s + WCUtils.num(x.amount);
    }, 0);

    const currentMonth = monthKey();
    const monthlyBudget = WCUtils.num(data.spendingSettings?.monthlyBudget, 7000);

    const monthExpenses = (data.expenses || []).filter(x => {
      return monthKey(x.date) === currentMonth;
    });

    const monthlySpent = monthExpenses.reduce((s, x) => {
      return s + WCUtils.num(x.amount);
    }, 0);

    const spendingRemaining = monthlyBudget - monthlySpent;
    const spendingPercent = monthlyBudget > 0
      ? Math.min((monthlySpent / monthlyBudget) * 100, 999)
      : 0;

    const cashAfterSpending = Math.max(spendingRemaining, 0);
    const totalAssets = portfolioValue + assetsValue + cashAfterSpending;
    const netWorth = totalAssets - liabilitiesValue;

    const goal = WCUtils.num(data.settings?.targetNetWorth, 1000000);
    const progress = goal > 0 ? Math.min((netWorth / goal) * 100, 100) : 0;

    return {
      portfolioValue,
      assetsValue,
      liabilitiesValue,
      dividendsValue,
      monthlyBudget,
      monthlySpent,
      spendingRemaining,
      spendingPercent,
      cashAfterSpending,
      totalAssets,
      netWorth,
      goal,
      progress
    };
  }

  function render() {
    const data = WCStore.get();
    const c = calc(data);

    page.innerHTML = `
      ${WCUI.heroCard({
        tag: "Wealth Overview",
        title: "لوحة الثروة الشخصية",
        desc: "صورة شاملة لصافي الثروة، المحفظة، الأصول، الالتزامات، المصروفات، والتقدم نحو الهدف المالي.",
        value: WCUtils.money(c.netWorth),
        sub: "صافي الثروة الحالي"
      })}

      ${WCUI.statGrid([
        { icon: "📈", label: "المحفظة", value: WCUtils.money(c.portfolioValue) },
        { icon: "💎", label: "الأصول الأخرى", value: WCUtils.money(c.assetsValue) },
        { icon: "💳", label: "مصروف الشهر", value: WCUtils.money(c.monthlySpent), type: c.monthlySpent > c.monthlyBudget ? "danger" : "" },
        { icon: "🏦", label: "الكاش المتبقي", value: WCUtils.money(c.cashAfterSpending), type: "gold" },
        { icon: "⚠️", label: "الالتزامات", value: WCUtils.money(c.liabilitiesValue), type: "danger" },
        { icon: "💸", label: "التوزيعات", value: WCUtils.money(c.dividendsValue), type: "gold" }
      ])}

      ${WCUI.progress(
        "التقدم نحو هدف المليون",
        c.progress,
        `الهدف الحالي هو ${WCUtils.money(c.goal)}.`
      )}

      ${WCUI.progress(
        "استهلاك المصروف الشهري",
        c.spendingPercent,
        `صرفت ${WCUtils.money(c.monthlySpent)} من ميزانية ${WCUtils.money(c.monthlyBudget)}. المتبقي ${WCUtils.money(c.spendingRemaining)}.`
      )}

      ${WCUI.decision(smartDecision(c))}
    `;
  }

  function smartDecision(c) {
    if (c.monthlySpent > c.monthlyBudget) {
      return `يا يوسف، صرفك هذا الشهر تجاوز الميزانية بـ ${WCUtils.money(c.monthlySpent - c.monthlyBudget)}. الأفضل توقف المصاريف الكمالية مؤقتاً.`;
    }

    if (c.spendingPercent >= 90) {
      return "وصلت إلى أكثر من 90% من مصروف الشهر. من الآن ركز فقط على الضروريات.";
    }

    if (c.spendingPercent >= 75) {
      return "صرفك وصل فوق 75% من الميزانية. راقب المطاعم والمشتريات والبترول قبل نهاية الشهر.";
    }

    if (c.liabilitiesValue > c.totalAssets && c.liabilitiesValue > 0) {
      return "الالتزامات أعلى من الأصول. الأفضل التركيز على تخفيض الدين وزيادة الكاش قبل التوسع الاستثماري.";
    }

    if (c.netWorth < 15000) {
      return "الأولوية الحالية هي تقوية صندوق الطوارئ وبناء قاعدة مالية آمنة.";
    }

    if (c.progress < 10) {
      return "أنت في مرحلة التأسيس. الاستمرارية الشهرية أهم من البحث عن عائد سريع.";
    }

    return "المسار جيد. استمر في الاستثمار الشهري، راقب المصروف، وحدث بياناتك بشكل منتظم.";
  }

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);
})();