/* ==========================================================
   Personal Wealth Center
   Reports Page
   Version: 1.0.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("reports");
  if (!page) return;

  function render() {
    const data = WCStore.get();

    const portfolio = data.portfolio.reduce((s, x) => s + WCUtils.num(x.currentValue), 0);
    const assets = data.assets.reduce((s, x) => s + WCUtils.num(x.value), 0);
    const liabilities = data.liabilities.reduce((s, x) => s + WCUtils.num(x.balance), 0);
    const dividends = data.dividends.reduce((s, x) => s + WCUtils.num(x.amount), 0);

    const totalAssets = portfolio + assets;
    const netWorth = totalAssets - liabilities;
    const debtRatio = totalAssets > 0 ? (liabilities / totalAssets) * 100 : 0;

    page.innerHTML = `
      ${WCUI.pageHero(
        "مركز التحليل المالي",
        "تحليل صافي الثروة، المحفظة، الالتزامات، التوزيعات، والمخاطر المالية.",
        "Reports"
      )}

      ${WCUI.heroCard({
        tag: "Financial Intelligence",
        title: WCUtils.money(netWorth),
        desc: "صافي الثروة التحليلي",
        value: WCUtils.percent(debtRatio),
        sub: "نسبة الالتزامات من إجمالي الأصول"
      })}

      ${WCUI.statGrid([
        { icon: "💎", label: "صافي الثروة", value: WCUtils.money(netWorth), type: "gold" },
        { icon: "📈", label: "المحفظة", value: WCUtils.money(portfolio) },
        { icon: "🏦", label: "الأصول", value: WCUtils.money(assets) },
        { icon: "💳", label: "الديون", value: WCUtils.money(liabilities), type: "danger" }
      ])}

      ${WCUI.progress(
        "مؤشر الدين",
        debtRatio,
        "كلما انخفضت النسبة كان الوضع المالي أكثر مرونة."
      )}

      ${WCUI.decision(reportInsight(netWorth, debtRatio, dividends))}
    `;
  }

  function reportInsight(netWorth, debtRatio, dividends) {
    if (netWorth <= 0) return "المرحلة الحالية هي بناء قاعدة مالية موجبة عبر رفع الأصول وخفض الالتزامات.";
    if (debtRatio > 50) return "نسبة الالتزامات مرتفعة. الأفضل إعطاء أولوية لخطة السداد قبل زيادة المخاطرة.";
    if (dividends <= 0) return "صافي الثروة إيجابي، لكن دخل التوزيعات لم يبدأ بعد. أضف التوزيعات لمتابعة الدخل السلبي.";
    return "الوضع المالي يتجه بشكل جيد. استمر في تحديث البيانات شهرياً لمراقبة النمو.";
  }

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);

})();