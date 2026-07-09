/* ==========================================================
   Personal Wealth Center Home Page
   Version: 2.1.0
   Premium Compact Dashboard
   صافي الثروة الحقيقي = الكاش + المحفظة + الأصول + التوزيعات - الالتزامات
========================================================== */
"use strict";

(function () {
  const page = document.getElementById("home");
  if (!page) return;

  const VERSION = "2.1.0";

  function n(v, fallback = 0) {
    const x = Number(v);
    return Number.isFinite(x) ? x : fallback;
  }

  function arr(v) {
    return Array.isArray(v) ? v : [];
  }

  function today() {
    return WCUtils?.today ? WCUtils.today() : new Date().toISOString().slice(0, 10);
  }

  function monthKey(date) {
    return String(date || today()).slice(0, 7);
  }

  function money(v) {
    if (WCUtils?.money) return WCUtils.money(n(v));
    return `AED ${n(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function pct(part, total) {
    if (total <= 0) return 0;
    return Math.max(0, Math.min((part / total) * 100, 999));
  }

  function sum(list, picker) {
    return arr(list).reduce((s, x) => s + n(picker(x)), 0);
  }

  function calc(data) {
    const settings = data.settings || {};
    const spendingSettings = data.spendingSettings || {};
    const currentMonth = monthKey();

    const portfolioValue = sum(data.portfolio, x =>
      x.currentValue ?? x.value ?? x.marketValue ?? 0
    );

    const portfolioCost = sum(data.portfolio, x => {
      const direct = n(x.costValue ?? x.totalCost ?? 0);
      if (direct > 0) return direct;
      return n(x.qty ?? x.quantity ?? x.shares) * n(x.avgCost ?? x.averageCost ?? x.buyPrice ?? x.cost);
    });

    const portfolioProfit = portfolioValue - portfolioCost;
    const portfolioReturn = portfolioCost > 0 ? (portfolioProfit / portfolioCost) * 100 : 0;

    const assetsValue = sum(data.assets, x => x.value ?? x.amount ?? 0);
    const liabilitiesValue = sum(data.liabilities, x => x.balance ?? x.amount ?? x.value ?? 0);
    const dividendsValue = sum(data.dividends, x => x.amount ?? 0);

    const monthlyBudget = n(spendingSettings.monthlyBudget ?? settings.monthlyBudget, 7000);

    const monthExpenses = arr(data.expenses).filter(x => monthKey(x.date) === currentMonth);
    const monthlySpent = sum(monthExpenses, x => x.amount ?? 0);
    const spendingRemaining = monthlyBudget - monthlySpent;
    const spendingPercent = pct(monthlySpent, monthlyBudget);

    const emergencyTarget = n(
      settings.emergencyFundTarget ??
      settings.emergencyCashTarget ??
      settings.targetEmergencyCash,
      100000
    );

    const emergencyCash = n(
      settings.emergencyFundCurrent ??
      settings.emergencyCash ??
      settings.cash ??
      0
    );

    const availableCash = n(
      settings.availableCash ??
      settings.cashBalance ??
      settings.bankCash ??
      emergencyCash,
      emergencyCash
    );

    const totalAssets = availableCash + emergencyCash + portfolioValue + assetsValue + dividendsValue;
    const netWorth = totalAssets - liabilitiesValue;

    const targetNetWorth = n(settings.targetNetWorth, 1000000);
    const goalProgress = pct(netWorth, targetNetWorth);

    const monthlyInvestment = n(settings.monthlyInvestment, 0);
    const monthlySalary = n(settings.monthlySalary, 32000);
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
      emergencyCash,
      availableCash,
      emergencyTarget,
      emergencyPercent: pct(emergencyCash, emergencyTarget),
      totalAssets,
      netWorth,
      targetNetWorth,
      goalProgress,
      monthlyInvestment,
      monthlySalary,
      investRate
    };
  }

  function decision(c) {
    if (c.netWorth < 0) {
      return ["تنبيه مهم", "صافي الثروة بالسالب. الأولوية الآن تخفيف الالتزامات ورفع الكاش.", "danger", "⚠️"];
    }

    if (c.spendingPercent >= 100) {
      return ["وقف المصروف الزائد", `تجاوزت ميزانية الشهر بـ ${money(c.monthlySpent - c.monthlyBudget)}.`, "danger", "🚨"];
    }

    if (c.emergencyPercent < 30) {
      return ["قوّي صندوق الطوارئ", `ناقصك ${money(Math.max(c.emergencyTarget - c.emergencyCash, 0))} للوصول للهدف.`, "warning", "🛟"];
    }

    if (c.spendingPercent >= 80) {
      return ["هدّئ المصروف", "مصروف الشهر مرتفع. خل باقي الشهر للضروريات فقط.", "warning", "💳"];
    }

    if (c.monthlyInvestment <= 0) {
      return ["فعّل الاستثمار الشهري", "حدد مبلغ شهري ثابت للمحفظة عشان يبدأ النمو الحقيقي.", "good", "📈"];
    }

    return ["مسارك المالي جيد", "استمر بالتحديث، راقب المصروف، وخل الاستثمار الشهري ثابت.", "good", "✅"];
  }

  function insightList(c) {
    const items = [];

    items.push(`صافي الثروة محسوب بدون إدخال المصروف الشهري كأصل.`);
    items.push(`الأصول الحالية: ${money(c.totalAssets)} مقابل التزامات ${money(c.liabilitiesValue)}.`);

    if (c.spendingPercent >= 75) {
      items.push(`مصروف الشهر وصل ${c.spendingPercent.toFixed(0)}% من الميزانية.`);
    }

    if (c.emergencyPercent < 100) {
      items.push(`صندوق الطوارئ مكتمل ${c.emergencyPercent.toFixed(0)}%.`);
    }

    if (c.monthlyInvestment > 0) {
      items.push(`استثمارك الشهري ${money(c.monthlyInvestment)} = ${c.investRate.toFixed(0)}% من الراتب.`);
    }

    return items.slice(0, 4);
  }

  function cls(v) {
    return v < 0 ? "neg" : "pos";
  }

  function bar(v) {
    return Math.min(Math.max(v, 0), 100);
  }

  function injectStyle() {
    if (document.getElementById("homePremiumStyle")) return;

    const style = document.createElement("style");
    style.id = "homePremiumStyle";
    style.textContent = `
      #home{
        padding:18px 16px 115px;
        direction:rtl;
      }

      .homeTop{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin:6px 2px 16px;
      }

      .homeTitle h1{
        margin:0;
        font-size:28px;
        line-height:1.15;
        color:#071022;
        font-weight:950;
        letter-spacing:-.7px;
      }

      .homeTitle p{
        margin:5px 0 0;
        color:#6b7280;
        font-size:14px;
        font-weight:800;
      }

      .homeLogo{
        width:56px;
        height:56px;
        border-radius:18px;
        display:grid;
        place-items:center;
        font-size:28px;
        background:linear-gradient(135deg,#ffe17a,#d6a913);
        box-shadow:0 14px 30px rgba(214,169,19,.25);
      }

      .homeHero{
        position:relative;
        overflow:hidden;
        border-radius:30px;
        padding:24px 22px;
        min-height:205px;
        background:
          radial-gradient(circle at 20% 10%, rgba(255,220,90,.24), transparent 35%),
          linear-gradient(135deg,#101827,#050816);
        color:#fff;
        box-shadow:0 22px 45px rgba(15,23,42,.18);
      }

      .homeHero::after{
        content:"";
        position:absolute;
        inset:auto -55px -75px auto;
        width:190px;
        height:190px;
        border-radius:50%;
        background:rgba(255,213,74,.12);
      }

      .heroLabel{
        display:inline-flex;
        align-items:center;
        gap:7px;
        padding:8px 13px;
        border:1px solid rgba(255,213,74,.36);
        color:#ffd64a;
        border-radius:999px;
        font-size:13px;
        font-weight:900;
        background:rgba(255,255,255,.06);
      }

      .homeHero h2{
        position:relative;
        margin:18px 0 6px;
        font-size:25px;
        line-height:1.25;
        font-weight:950;
        letter-spacing:-.6px;
        z-index:1;
      }

      .homeHero p{
        position:relative;
        margin:0;
        color:#cbd5e1;
        font-size:14px;
        line-height:1.9;
        font-weight:700;
        z-index:1;
      }

      .heroValue{
        position:relative;
        margin-top:18px;
        z-index:1;
      }

      .heroValue strong{
        display:block;
        direction:ltr;
        text-align:right;
        color:#ffd64a;
        font-size:34px;
        line-height:1;
        font-weight:950;
        letter-spacing:-1px;
      }

      .heroValue span{
        display:block;
        margin-top:8px;
        color:#9ca3af;
        font-size:13px;
        font-weight:800;
      }

      .homeDecision2{
        margin-top:14px;
        border-radius:26px;
        padding:18px;
        display:flex;
        gap:14px;
        align-items:center;
        border:1px solid rgba(226,232,240,.9);
        background:rgba(255,255,255,.82);
        box-shadow:0 16px 36px rgba(15,23,42,.08);
        backdrop-filter:blur(12px);
      }

      .homeDecision2.warning{
        background:linear-gradient(135deg,#fff9df,#fff);
        border-color:#f8df80;
      }

      .homeDecision2.danger{
        background:linear-gradient(135deg,#fff1f1,#fff);
        border-color:#fecaca;
      }

      .homeDecision2.good{
        background:linear-gradient(135deg,#effdf5,#fff);
        border-color:#bbf7d0;
      }

      .decisionIcon{
        width:52px;
        height:52px;
        border-radius:18px;
        display:grid;
        place-items:center;
        background:#fff;
        font-size:25px;
        flex:0 0 auto;
        box-shadow:0 12px 28px rgba(15,23,42,.08);
      }

      .homeDecision2 h3{
        margin:0;
        color:#071022;
        font-size:18px;
        font-weight:950;
      }

      .homeDecision2 strong{
        display:block;
        margin-top:3px;
        color:#111827;
        font-size:15px;
        font-weight:950;
      }

      .homeDecision2 p{
        margin:5px 0 0;
        color:#6b7280;
        line-height:1.65;
        font-size:13px;
        font-weight:750;
      }

      .quickGrid{
        margin-top:16px;
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:12px;
      }

      .quickCard{
        min-height:142px;
        padding:18px 15px;
        border-radius:25px;
        background:rgba(255,255,255,.9);
        border:1px solid rgba(226,232,240,.8);
        box-shadow:0 16px 34px rgba(15,23,42,.07);
      }

      .quickCard .ico{
        font-size:24px;
        margin-bottom:13px;
      }

      .quickCard small{
        display:block;
        color:#6b7280;
        font-size:13px;
        font-weight:900;
      }

      .quickCard strong{
        display:block;
        direction:ltr;
        text-align:right;
        margin-top:7px;
        color:#071022;
        font-size:22px;
        line-height:1.15;
        font-weight:950;
        letter-spacing:-.4px;
      }

      .quickCard p{
        margin:8px 0 0;
        color:#8b95a5;
        font-size:12.5px;
        line-height:1.55;
        font-weight:750;
      }

      .quickCard .gold{color:#d4a915}
      .quickCard .neg{color:#b91c1c}
      .quickCard .pos{color:#071022}

      .homePanel{
        margin-top:16px;
        padding:20px 18px;
        border-radius:28px;
        background:rgba(255,255,255,.92);
        border:1px solid rgba(226,232,240,.8);
        box-shadow:0 16px 34px rgba(15,23,42,.07);
      }

      .panelTop{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:12px;
        margin-bottom:14px;
      }

      .panelTop h3{
        margin:0;
        color:#071022;
        font-size:22px;
        font-weight:950;
        letter-spacing:-.5px;
      }

      .panelTop strong{
        direction:ltr;
        color:#071022;
        font-size:23px;
        font-weight:950;
        white-space:nowrap;
      }

      .homeBar{
        width:100%;
        height:11px;
        overflow:hidden;
        border-radius:999px;
        background:#edf2f7;
      }

      .homeBar span{
        display:block;
        height:100%;
        border-radius:999px;
        background:linear-gradient(90deg,#f7d857,#d6a913);
      }

      .panelNote{
        margin:12px 0 0;
        color:#6b7280;
        font-size:13px;
        line-height:1.7;
        font-weight:800;
      }

      .wealthFormula{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin-top:14px;
      }

      .formulaItem{
        padding:13px;
        border-radius:18px;
        background:#f8fafc;
        border:1px solid #eef2f7;
      }

      .formulaItem small{
        display:block;
        color:#7b8494;
        font-size:12px;
        font-weight:850;
      }

      .formulaItem strong{
        display:block;
        direction:ltr;
        text-align:right;
        margin-top:5px;
        font-size:16px;
        color:#071022;
        font-weight:950;
      }

      .homeInsights{
        margin-top:16px;
        padding:20px 18px;
        border-radius:28px;
        background:#fff;
        border:1px solid rgba(226,232,240,.85);
        box-shadow:0 16px 34px rgba(15,23,42,.07);
      }

      .homeInsights h3{
        margin:0 0 12px;
        color:#071022;
        font-size:21px;
        font-weight:950;
      }

      .insight{
        padding:13px 14px;
        border-radius:18px;
        background:#f8fafc;
        border:1px solid #eef2f7;
        color:#111827;
        font-size:13.5px;
        line-height:1.7;
        font-weight:850;
      }

      .insight + .insight{
        margin-top:9px;
      }

      .homeActions{
        margin-top:16px;
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:12px;
      }

      .homeActionBtn{
        border:0;
        border-radius:22px;
        padding:15px 12px;
        background:#071022;
        color:#fff;
        font-size:14px;
        font-weight:950;
        box-shadow:0 14px 28px rgba(7,16,34,.16);
      }

      .homeActionBtn.light{
        background:#fff;
        color:#071022;
        border:1px solid rgba(226,232,240,.9);
      }

      @media(max-width:390px){
        #home{padding-left:12px;padding-right:12px}
        .homeTitle h1{font-size:25px}
        .homeHero{border-radius:26px;padding:22px 18px}
        .heroValue strong{font-size:30px}
        .quickCard{min-height:134px;padding:16px 13px}
        .quickCard strong{font-size:20px}
        .panelTop strong{font-size:20px}
      }
    `;
    document.head.appendChild(style);
  }

  function go(id) {
    try {
      const btn = document.querySelector(`[onclick*="${id}"]`);
      if (typeof pg === "function") pg(id, btn || null);
    } catch (e) {}
  }

  function render() {
    injectStyle();

    const data = WCStore.get();
    const c = calc(data);
    const [dTitle, dText, dType, dIcon] = decision(c);
    const insights = insightList(c);

    page.innerHTML = `
      <section class="homeTop">
        <div class="homeTitle">
          <h1>مركز الثروة</h1>
          <p>لوحة مختصرة لصافي الثروة الحقيقي</p>
        </div>
        <div class="homeLogo">💰</div>
      </section>

      <section class="homeHero">
        <div class="heroLabel">لوحة التحكم الرئيسية</div>
        <h2>صافي ثروتك الحقيقي</h2>
        <p>
          يتم حسابه من الكاش، صندوق الطوارئ، المحفظة، الأصول، والتوزيعات
          بعد خصم الالتزامات. المصروف الشهري لا يدخل ضمن صافي الثروة.
        </p>
        <div class="heroValue">
          <strong>${money(c.netWorth)}</strong>
          <span>${c.netWorth >= 0 ? "موجب بعد خصم الالتزامات" : "بالسالب بعد خصم الالتزامات"}</span>
        </div>
      </section>

      <section class="homeDecision2 ${dType}">
        <div class="decisionIcon">${dIcon}</div>
        <div>
          <h3>قرار اليوم المالي</h3>
          <strong>${dTitle}</strong>
          <p>${dText}</p>
        </div>
      </section>

      <section class="quickGrid">
        <div class="quickCard">
          <div class="ico">💰</div>
          <small>صافي الثروة</small>
          <strong class="${cls(c.netWorth)}">${money(c.netWorth)}</strong>
          <p>الأصول ناقص الالتزامات</p>
        </div>

        <div class="quickCard">
          <div class="ico">📈</div>
          <small>المحفظة</small>
          <strong>${money(c.portfolioValue)}</strong>
          <p>العائد الحالي ${c.portfolioReturn.toFixed(1)}%</p>
        </div>

        <div class="quickCard">
          <div class="ico">🛟</div>
          <small>صندوق الطوارئ</small>
          <strong>${c.emergencyPercent.toFixed(0)}%</strong>
          <p>${money(c.emergencyCash)} من ${money(c.emergencyTarget)}</p>
        </div>

        <div class="quickCard">
          <div class="ico">💳</div>
          <small>مصروف الشهر</small>
          <strong class="${c.spendingPercent >= 90 ? "neg" : "gold"}">${c.spendingPercent.toFixed(0)}%</strong>
          <p>${money(c.monthlySpent)} من ${money(c.monthlyBudget)}</p>
        </div>
      </section>

      <section class="homePanel">
        <div class="panelTop">
          <h3>هدف المليون</h3>
          <strong>${c.goalProgress.toFixed(1)}%</strong>
        </div>
        <div class="homeBar"><span style="width:${bar(c.goalProgress)}%"></span></div>
        <p class="panelNote">
          باقي للوصول للهدف: ${money(Math.max(c.targetNetWorth - c.netWorth, 0))}
        </p>
      </section>

      <section class="homePanel">
        <div class="panelTop">
          <h3>المصروف الشهري</h3>
          <strong>${c.spendingPercent.toFixed(0)}%</strong>
        </div>
        <div class="homeBar"><span style="width:${bar(c.spendingPercent)}%"></span></div>
        <p class="panelNote">
          المصروف منفصل عن صافي الثروة. المتبقي من الميزانية: ${money(c.spendingRemaining)}
        </p>
      </section>

      <section class="homePanel">
        <div class="panelTop">
          <h3>تفصيل صافي الثروة</h3>
          <strong class="${cls(c.netWorth)}">${money(c.netWorth)}</strong>
        </div>

        <div class="wealthFormula">
          <div class="formulaItem">
            <small>الكاش المتاح</small>
            <strong>${money(c.availableCash)}</strong>
          </div>

          <div class="formulaItem">
            <small>صندوق الطوارئ</small>
            <strong>${money(c.emergencyCash)}</strong>
          </div>

          <div class="formulaItem">
            <small>المحفظة</small>
            <strong>${money(c.portfolioValue)}</strong>
          </div>

          <div class="formulaItem">
            <small>الأصول الأخرى</small>
            <strong>${money(c.assetsValue)}</strong>
          </div>

          <div class="formulaItem">
            <small>التوزيعات</small>
            <strong>${money(c.dividendsValue)}</strong>
          </div>

          <div class="formulaItem">
            <small>الالتزامات</small>
            <strong class="neg">${money(c.liabilitiesValue)}</strong>
          </div>
        </div>
      </section>

      <section class="homePanel">
        <div class="panelTop">
          <h3>أداء المحفظة</h3>
          <strong class="${cls(c.portfolioProfit)}">${money(c.portfolioProfit)}</strong>
        </div>
        <p class="panelNote">
          قيمة المحفظة: ${money(c.portfolioValue)} — التكلفة: ${money(c.portfolioCost)} — العائد: ${c.portfolioReturn.toFixed(1)}%
        </p>
      </section>

      <section class="homeInsights">
        <h3>تنبيهات ذكية</h3>
        ${insights.map(x => `<div class="insight">🔔 ${x}</div>`).join("")}
      </section>

      <section class="homeActions">
        <button class="homeActionBtn" id="homeGoPortfolio">تحديث المحفظة</button>
        <button class="homeActionBtn light" id="homeGoSpending">إضافة مصروف</button>
        <button class="homeActionBtn light" id="homeGoAssets">تحديث الثروة</button>
        <button class="homeActionBtn light" id="homeGoReports">عرض التحليل</button>
      </section>
    `;

    const p = document.getElementById("homeGoPortfolio");
    const s = document.getElementById("homeGoSpending");
    const a = document.getElementById("homeGoAssets");
    const r = document.getElementById("homeGoReports");

    if (p) p.onclick = () => go("portfolio");
    if (s) s.onclick = () => go("spending");
    if (a) a.onclick = () => go("assets");
    if (r) r.onclick = () => go("reports");
  }

  function bind() {
    if (window.WCEvents && typeof WCEvents.on === "function") {
      WCEvents.on("dataChanged", render);
      WCEvents.on("portfolioChanged", render);
      WCEvents.on("spendingChanged", render);
      WCEvents.on("assetsChanged", render);
      WCEvents.on("liabilitiesChanged", render);
      WCEvents.on("settingsChanged", render);
    }

    window.addEventListener("storage", render);
    document.addEventListener("DOMContentLoaded", render);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) render();
    });
  }

  bind();
  render();
})();