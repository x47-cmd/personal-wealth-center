/* ==========================================================
   Personal Wealth Center
   Home Page
   Version: 1.1.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("home");
  if (!page) return;

  function calc(data) {
    const portfolioValue = data.portfolio.reduce((s, x) => s + WCUtils.num(x.currentValue), 0);
    const assetsValue = data.assets.reduce((s, x) => s + WCUtils.num(x.value), 0);
    const liabilitiesValue = data.liabilities.reduce((s, x) => s + WCUtils.num(x.balance), 0);
    const dividendsValue = data.dividends.reduce((s, x) => s + WCUtils.num(x.amount), 0);

    const totalAssets = portfolioValue + assetsValue;
    const netWorth = totalAssets - liabilitiesValue;
    const goal = WCUtils.num(data.settings.targetNetWorth);
    const progress = goal > 0 ? Math.min((netWorth / goal) * 100, 100) : 0;

    return {
      portfolioValue,
      assetsValue,
      liabilitiesValue,
      dividendsValue,
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
        desc: "صورة شاملة لصافي الثروة، المحفظة، الأصول، الالتزامات، والتقدم نحو الهدف المالي.",
        value: WCUtils.money(c.netWorth),
        sub: "صافي الثروة الحالي"
      })}

      ${WCUI.statGrid([
        {
          icon: "📈",
          label: "المحفظة",
          value: WCUtils.money(c.portfolioValue)
        },
        {
          icon: "🏦",
          label: "الأصول الأخرى",
          value: WCUtils.money(c.assetsValue)
        },
        {
          icon: "💳",
          label: "الالتزامات",
          value: WCUtils.money(c.liabilitiesValue),
          type: "danger"
        },
        {
          icon: "💰",
          label: "التوزيعات",
          value: WCUtils.money(c.dividendsValue),
          type: "gold"
        }
      ])}

      ${WCUI.progress(
        "التقدم نحو هدف المليون",
        c.progress,
        `الهدف الحالي هو ${WCUtils.money(c.goal)}.`
      )}

      ${WCUI.decision(smartDecision(c))}

      ${WCUI.empty(
        "بداية قوية",
        "الهيكل الأساسي جاهز. الآن نبني كل صفحة باستخدام نظام موحد عشان يكون المشروع مرتب وسهل التوسع."
      )}
    `;
  }

  function smartDecision(c) {
    if (c.liabilitiesValue > c.totalAssets && c.liabilitiesValue > 0) {
      return "الالتزامات أعلى من الأصول. الأفضل التركيز على تخفيض الدين وزيادة الكاش قبل التوسع الاستثماري.";
    }

    if (c.netWorth < 15000) {
      return "الأولوية الحالية هي تقوية صندوق الطوارئ وبناء قاعدة مالية آمنة.";
    }

    if (c.progress < 10) {
      return "أنت في مرحلة التأسيس. الاستمرارية الشهرية أهم من البحث عن عائد سريع.";
    }

    return "المسار جيد. استمر في الاستثمار الشهري، راقب التوزيع بين الأصول، وحدث بياناتك بشكل منتظم.";
  }

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);

})();