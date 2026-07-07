/* ==========================================================
   Personal Wealth Center
   Portfolio Page
   Version: 1.1.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("portfolio");
  if (!page) return;

  function render() {
    const data = WCStore.get();
    const portfolio = data.portfolio || [];

    const totalCost = portfolio.reduce((s, x) => s + WCUtils.num(x.totalCost), 0);
    const totalValue = portfolio.reduce((s, x) => s + WCUtils.num(x.currentValue), 0);
    const profit = totalValue - totalCost;
    const profitPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    page.innerHTML = `
      <section class="pageHero">
        <span class="badge">Portfolio</span>
        <h2>محفظتي الاستثمارية</h2>
        <p>تابع الأسهم، التكلفة، القيمة الحالية، الربح والخسارة، وتوزيع المحفظة.</p>
      </section>

      <section class="heroCard">
        <div class="heroTop">
          <span class="badge">Portfolio Value</span>
          <span class="version">${portfolio.length} شركة</span>
        </div>
        <h2>${WCUtils.money(totalValue)}</h2>
        <p>إجمالي قيمة المحفظة الحالية</p>
        <div class="heroValue ${profit >= 0 ? "positiveText" : "negativeText"}">
          ${profit >= 0 ? "+" : ""}${WCUtils.money(profit)}
        </div>
        <small>العائد: ${WCUtils.percent(profitPct)}</small>
      </section>

      <section class="gridCards">
        <div class="statCard">
          <span>💵</span>
          <small>إجمالي التكلفة</small>
          <strong>${WCUtils.money(totalCost)}</strong>
        </div>

        <div class="statCard">
          <span>📈</span>
          <small>القيمة الحالية</small>
          <strong>${WCUtils.money(totalValue)}</strong>
        </div>

        <div class="statCard ${profit >= 0 ? "success" : "danger"}">
          <span>${profit >= 0 ? "🟢" : "🔴"}</span>
          <small>الربح / الخسارة</small>
          <strong>${WCUtils.money(profit)}</strong>
        </div>

        <div class="statCard gold">
          <span>📊</span>
          <small>العائد</small>
          <strong>${WCUtils.percent(profitPct)}</strong>
        </div>
      </section>

      <section class="formCard">
        <h3>➕ إضافة سهم</h3>

        <div class="formGrid">
          <input id="pName" placeholder="اسم الشركة مثال: ADIB">
          <input id="pSymbol" placeholder="الرمز مثال: ADIB">
          <input id="pSector" placeholder="القطاع مثال: بنوك">
          <input id="pQty" type="number" placeholder="الكمية">
          <input id="pAvg" type="number" step="0.001" placeholder="متوسط الشراء">
          <input id="pPrice" type="number" step="0.001" placeholder="السعر الحالي">
        </div>

        <button class="mainBtn" onclick="PWC_Portfolio.add()">حفظ السهم</button>
      </section>

      <section class="tableCard">
        <h3>قائمة الأسهم</h3>
        ${renderTable(portfolio, totalValue)}
      </section>

      <section class="decisionCard">
        <h3>💡 تحليل المحفظة</h3>
        <p>${portfolioInsight(portfolio, totalValue)}</p>
      </section>
    `;
  }

  function renderTable(list, totalValue) {
    if (!list.length) {
      return `
        <div class="emptyState inner">
          <h3>لا توجد أسهم حالياً</h3>
          <p>أضف أول سهم عشان تبدأ متابعة المحفظة والتحليل.</p>
        </div>
      `;
    }

    return `
      <div class="stockList">
        ${list.map(x => {
          const weight = totalValue > 0 ? (WCUtils.num(x.currentValue) / totalValue) * 100 : 0;
          const profit = WCUtils.num(x.currentValue) - WCUtils.num(x.totalCost);
          const pct = WCUtils.num(x.totalCost) > 0 ? (profit / WCUtils.num(x.totalCost)) * 100 : 0;

          return `
            <div class="stockItem">
              <div>
                <strong>${x.name}</strong>
                <small>${x.symbol} • ${x.sector || "غير محدد"}</small>
              </div>

              <div>
                <b>${WCUtils.money(x.currentValue)}</b>
                <small class="${profit >= 0 ? "positiveText" : "negativeText"}">
                  ${profit >= 0 ? "+" : ""}${WCUtils.money(profit)} / ${WCUtils.percent(pct)}
                </small>
              </div>

              <div>
                <small>الوزن</small>
                <b>${WCUtils.percent(weight)}</b>
              </div>

              <button class="miniBtn dangerBtn" onclick="PWC_Portfolio.remove('${x.id}')">حذف</button>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function add() {
    const name = WCUtils.byId("pName").value.trim();
    const symbol = WCUtils.byId("pSymbol").value.trim();
    const sector = WCUtils.byId("pSector").value.trim();
    const qty = WCUtils.num(WCUtils.byId("pQty").value);
    const avg = WCUtils.num(WCUtils.byId("pAvg").value);
    const price = WCUtils.num(WCUtils.byId("pPrice").value);

    if (!name || qty <= 0 || avg <= 0 || price <= 0) {
      alert("دخل اسم الشركة، الكمية، متوسط الشراء، والسعر الحالي.");
      return;
    }

    WCStore.update(data => {
      data.portfolio.push({
        id: WCUtils.uid(),
        name,
        symbol: symbol || name,
        sector,
        quantity: qty,
        avgCost: avg,
        currentPrice: price,
        totalCost: qty * avg,
        currentValue: qty * price,
        createdAt: WCUtils.today()
      });
    });

    render();
  }

  function remove(id) {
    if (!confirm("حذف السهم من المحفظة؟")) return;

    WCStore.update(data => {
      data.portfolio = data.portfolio.filter(x => x.id !== id);
    });

    render();
  }

  function portfolioInsight(list, totalValue) {
    if (!list.length) return "ابدأ بإضافة أسهمك الحالية حتى يعطيك الموقع قراءة فعلية للمحفظة.";

    const biggest = [...list].sort((a, b) => WCUtils.num(b.currentValue) - WCUtils.num(a.currentValue))[0];
    const weight = totalValue > 0 ? (WCUtils.num(biggest.currentValue) / totalValue) * 100 : 0;

    if (weight > 40) {
      return `يوجد تركّز عالي في ${biggest.name} بنسبة ${WCUtils.percent(weight)} من المحفظة. راقب التنويع لتقليل المخاطر.`;
    }

    if (list.length < 5) {
      return "المحفظة ما زالت في مرحلة بناء. الأفضل لاحقاً توزيعها على عدة شركات وقطاعات.";
    }

    return "المحفظة تبدو متوازنة مبدئياً. استمر في المتابعة الشهرية وتحديث الأسعار.";
  }

  window.PWC_Portfolio = {
    add,
    remove
  };

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);

})();