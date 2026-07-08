/* ==========================================================
   Personal Wealth Center Home Page
   Version: 2.0.0
   Financial Dashboard V2 / Smart Decision Center
========================================================== */
"use strict";

(function () {
  const page = document.getElementById("home");
  if (!page) return;

  function n(v, fallback = 0) {
    const x = Number(v);
    return Number.isFinite(x) ? x : fallback;
  }

  function arr(v) {
    return Array.isArray(v) ? v : [];
  }

  function monthKey(date) {
    return String(date || WCUtils.today()).slice(0, 7);
  }

  function pct(part, total) {
    return total > 0 ? Math.min((part / total) * 100, 999) : 0;
  }

  function safeMoney(v) {
    return WCUtils.money(n(v));
  }

  function calc(data) {
    const settings = data.settings || {};
    const spendingSettings = data.spendingSettings || {};

    const portfolioValue = arr(data.portfolio).reduce((s, x) => {
      return s + n(x.currentValue || x.value || x.marketValue);
    }, 0);

    const portfolioCost = arr(data.portfolio).reduce((s, x) => {
      const qty = n(x.qty || x.quantity || x.shares);
      const avg = n(x.avgCost || x.averageCost || x.buyPrice || x.cost);
      const fallbackCost = n(x.costValue || x.totalCost);
      return s + (fallbackCost || (qty * avg));
    }, 0);

    const portfolioProfit = portfolioValue - portfolioCost;
    const portfolioReturn = portfolioCost > 0 ? (portfolioProfit / portfolioCost) * 100 : 0;

    const assetsValue = arr(data.assets).reduce((s, x) => {
      return s + n(x.value);
    }, 0);

    const liabilitiesValue = arr(data.liabilities).reduce((s, x) => {
      return s + n(x.balance || x.amount || x.value);
    }, 0);

    const dividendsValue = arr(data.dividends).reduce((s, x) => {
      return s + n(x.amount);
    }, 0);

    const currentMonth = monthKey();
    const monthlyBudget = n(spendingSettings.monthlyBudget, 7000);

    const monthExpenses = arr(data.expenses).filter(x => monthKey(x.date) === currentMonth);
    const monthlySpent = monthExpenses.reduce((s, x) => s + n(x.amount), 0);
    const spendingRemaining = monthlyBudget - monthlySpent;
    const spendingPercent = pct(monthlySpent, monthlyBudget);

    const cash = n(settings.emergencyCash ?? settings.emergencyFundCurrent ?? settings.cash, Math.max(spendingRemaining, 0));
    const emergencyTarget = n(settings.emergencyFundTarget ?? settings.emergencyCashTarget ?? settings.emergencyCash, 15000);
    const emergencyPercent = pct(cash, emergencyTarget);

    const cashAfterSpending = Math.max(spendingRemaining, 0);
    const totalAssets = portfolioValue + assetsValue + cashAfterSpending;
    const netWorth = totalAssets - liabilitiesValue;

    const goal = n(settings.targetNetWorth, 1000000);
    const goalProgress = pct(netWorth, goal);

    const monthlyInvestment = n(settings.monthlyInvestment, 0);
    const monthlySalary = n(settings.monthlySalary, 0);
    const investRate = monthlySalary > 0 ? (monthlyInvestment / monthlySalary) * 100 : 0;

    return {
      portfolioValue,
      portfolioCost,
      portfolioProfit,
      portfolioReturn,
      assetsValue,
      liabilitiesValue,
      dividendsValue,
      monthlyBudget,
      monthlySpent,
      spendingRemaining,
      spendingPercent,
      cash,
      emergencyTarget,
      emergencyPercent,
      cashAfterSpending,
      totalAssets,
      netWorth,
      goal,
      goalProgress,
      monthlyInvestment,
      monthlySalary,
      investRate
    };
  }

  function decision(c) {
    if (c.monthlySpent > c.monthlyBudget) {
      return {
        title: "أوقف المصروفات الكمالية",
        text: `تجاوزت الميزانية بـ ${safeMoney(c.monthlySpent - c.monthlyBudget)}. ركز فقط على الضروريات لين نهاية الشهر.`,
        type: "danger"
      };
    }

    if (c.spendingPercent >= 90) {
      return {
        title: "اقتربت من نهاية الميزانية",
        text: "وصلت فوق 90% من مصروف الشهر. أي صرف إضافي لازم يكون ضروري.",
        type: "danger"
      };
    }

    if (c.emergencyPercent < 50) {
      return {
        title: "قوّي صندوق الطوارئ",
        text: `صندوق الطوارئ مكتمل بنسبة ${c.emergencyPercent.toFixed(0)}%. الأولوية الآن رفع الكاش قبل التوسع.`,
        type: "warning"
      };
    }

    if (c.portfolioReturn < -5) {
      return {
        title: "راجع أداء المحفظة",
        text: `العائد الحالي ${c.portfolioReturn.toFixed(1)}%. لا تستعجل البيع، لكن راجع التوزيع والمخاطر.`,
        type: "warning"
      };
    }

    if (c.goalProgress < 5) {
      return {
        title: "استمر في البناء",
        text: "أنت في مرحلة تأسيس الثروة. أهم شيء الآن الاستمرارية الشهرية وتقليل التسرب المالي.",
        type: "good"
      };
    }

    return {
      title: "المسار المالي جيد",
      text: "استمر في الاستثمار، راقب المصروف، وحدث المحفظة بشكل منتظم.",
      type: "good"
    };
  }

  function alertList(c) {
    const list = [];

    if (c.spendingPercent >= 75) {
      list.push(`مصروف الشهر وصل ${c.spendingPercent.toFixed(0)}% من الميزانية.`);
    }

    if (c.emergencyPercent < 100) {
      list.push(`صندوق الطوارئ يحتاج ${safeMoney(Math.max(c.emergencyTarget - c.cash, 0))} للوصول للهدف.`);
    }

    if (c.monthlyInvestment > 0) {
      list.push(`استثمارك الشهري الحالي ${safeMoney(c.monthlyInvestment)} بنسبة ${c.investRate.toFixed(0)}% من الراتب.`);
    }

    if (c.portfolioValue > 0) {
      list.push(`أداء المحفظة الحالي ${c.portfolioReturn.toFixed(1)}% بقيمة ربح/خسارة ${safeMoney(c.portfolioProfit)}.`);
    }

    if (!list.length) {
      list.push("لا توجد تنبيهات مهمة حالياً. حدث بياناتك للحصول على تحليل أدق.");
    }

    return list;
  }

  function statusClass(type) {
    if (type === "danger") return "homeDecision danger";
    if (type === "warning") return "homeDecision warning";
    return "homeDecision good";
  }

  function render() {
    const data = WCStore.get();
    const c = calc(data);
    const d = decision(c);
    const alerts = alertList(c);

    page.innerHTML = `
      ${WCUI.heroCard({
        tag: "Wealth Dashboard",
        title: "لوحة الثروة الشخصية",
        desc: "مركز قيادة يومي لصافي الثروة، المصروف، صندوق الطوارئ، أداء المحفظة، والتقدم نحو هدف المليون.",
        value: safeMoney(c.netWorth),
        sub: "صافي الثروة الحالي"
      })}

      <section class="${statusClass(d.type)}">
        <div class="homeDecisionIcon">${d.type === "danger" ? "🚨" : d.type === "warning" ? "⚠️" : "✅"}</div>
        <div>
          <h3>قرار اليوم المالي</h3>
          <strong>${d.title}</strong>
          <p>${d.text}</p>
        </div>
      </section>

      <section class="homeDashboardGrid">
        <div class="homeKpiCard">
          <span>💰</span>
          <small>صافي الثروة</small>
          <strong>${safeMoney(c.netWorth)}</strong>
          <p>الأصول بعد خصم الالتزامات</p>
        </div>

        <div class="homeKpiCard">
          <span>🎯</span>
          <small>هدف المليون</small>
          <strong>${c.goalProgress.toFixed(1)}%</strong>
          <p>${safeMoney(c.netWorth)} من ${safeMoney(c.goal)}</p>
        </div>

        <div class="homeKpiCard">
          <span>💳</span>
          <small>مصروف الشهر</small>
          <strong>${c.spendingPercent.toFixed(1)}%</strong>
          <p>${safeMoney(c.monthlySpent)} من ${safeMoney(c.monthlyBudget)}</p>
        </div>

        <div class="homeKpiCard">
          <span>🛟</span>
          <small>صندوق الطوارئ</small>
          <strong>${c.emergencyPercent.toFixed(0)}%</strong>
          <p>${safeMoney(c.cash)} من ${safeMoney(c.emergencyTarget)}</p>
        </div>
      </section>

      <section class="progressCard">
        <div class="progressTop">
          <h3>هدف المليون</h3>
          <div class="progressPercent">${c.goalProgress.toFixed(1)}%</div>
        </div>
        <div class="progressBar">
          <div class="progressFill" style="width:${Math.min(c.goalProgress, 100)}%"></div>
        </div>
        <p>باقي للوصول للهدف: ${safeMoney(Math.max(c.goal - c.netWorth, 0))}.</p>
      </section>

      <section class="homeSplit">
        <div class="homeMiniPanel">
          <h3>المصروف الشهري</h3>
          <strong class="${c.spendingPercent >= 90 ? "danger" : c.spendingPercent >= 75 ? "gold" : ""}">
            ${c.spendingPercent.toFixed(1)}%
          </strong>
          <div class="progressBar">
            <div class="progressFill" style="width:${Math.min(c.spendingPercent, 100)}%"></div>
          </div>
          <p>المتبقي: ${safeMoney(c.spendingRemaining)}</p>
        </div>

        <div class="homeMiniPanel">
          <h3>أداء المحفظة</h3>
          <strong class="${c.portfolioProfit < 0 ? "danger" : "gold"}">
            ${safeMoney(c.portfolioProfit)}
          </strong>
          <p>العائد الحالي: ${c.portfolioReturn.toFixed(1)}%</p>
          <p>قيمة المحفظة: ${safeMoney(c.portfolioValue)}</p>
        </div>
      </section>

      <section class="homeAlerts">
        <h3>آخر التنبيهات الذكية</h3>
        ${alerts.map(x => `<div class="homeAlertItem">🔔 ${x}</div>`).join("")}
      </section>

      ${WCUI.statGrid([
        { icon: "📈", label: "المحفظة", value: safeMoney(c.portfolioValue) },
        { icon: "💎", label: "الأصول الأخرى", value: safeMoney(c.assetsValue) },
        { icon: "💳", label: "مصروف الشهر", value: safeMoney(c.monthlySpent), type: c.monthlySpent > c.monthlyBudget ? "danger" : "" },
        { icon: "🏦", label: "الكاش المتبقي", value: safeMoney(c.cashAfterSpending), type: "gold" },
        { icon: "⚠️", label: "الالتزامات", value: safeMoney(c.liabilitiesValue), type: "danger" },
        { icon: "💸", label: "التوزيعات", value: safeMoney(c.dividendsValue), type: "gold" }
      ])}
    `;
  }

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);
})();