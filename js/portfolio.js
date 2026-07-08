/* ==========================================================
   Personal Wealth Center Portfolio Center
   الأسهم + التوزيعات + الأداء
========================================================== */
"use strict";

(function () {
  const page = document.getElementById("portfolio");
  if (!page) return;

  function calc(data) {
    const stocks = data.portfolio || [];
    const dividends = data.dividends || [];

    const cost = stocks.reduce((s, x) => s + WCUtils.num(x.quantity) * WCUtils.num(x.avgPrice), 0);
    const value = stocks.reduce((s, x) => s + WCUtils.num(x.quantity) * WCUtils.num(x.currentPrice || x.avgPrice), 0);
    const pnl = value - cost;
    const returnPct = cost > 0 ? (pnl / cost) * 100 : 0;
    const divTotal = dividends.reduce((s, x) => s + WCUtils.num(x.amount), 0);

    return { stocks, dividends, cost, value, pnl, returnPct, divTotal };
  }

  function render() {
    const data = WCStore.get();
    const c = calc(data);

    page.innerHTML = `
      ${WCUI.pageHero(
        "المحفظة",
        "إدارة الأسهم، التكلفة، القيمة الحالية، التوزيعات، الربح والخسارة، ونسبة كل شركة من المحفظة.",
        "Portfolio"
      )}

      ${WCUI.heroCard({
        tag: "Portfolio Value",
        title: WCUtils.money(c.value),
        desc: "إجمالي قيمة المحفظة الحالية",
        value: `${WCUtils.money(c.pnl)} ${c.pnl >= 0 ? "+" : ""}`,
        sub: `العائد: ${WCUtils.percent(c.returnPct)}`
      })}

      ${WCUI.statGrid([
        { icon: "💵", label: "إجمالي التكلفة", value: WCUtils.money(c.cost) },
        { icon: "📈", label: "القيمة الحالية", value: WCUtils.money(c.value) },
        { icon: c.pnl >= 0 ? "🟢" : "🔴", label: "الربح / الخسارة", value: WCUtils.money(c.pnl), type: c.pnl < 0 ? "danger" : "gold" },
        { icon: "🏢", label: "عدد الشركات", value: String(c.stocks.length) },
        { icon: "💸", label: "التوزيعات", value: WCUtils.money(c.divTotal), type: "gold" },
        { icon: "📊", label: "العائد", value: WCUtils.percent(c.returnPct) }
      ])}

      ${stockForm()}
      ${stockList(c)}
      ${dividendForm()}
      ${dividendList(c)}
      ${WCUI.decision(portfolioInsight(c))}
    `;
  }

  function stockForm() {
    return `
      <div class="formCard">
        <h3>➕ إضافة سهم</h3>
        <div class="formGrid">
          <input id="pfName" placeholder="اسم الشركة مثال: ADIB">
          <input id="pfSymbol" placeholder="الرمز مثال: ADIB">
          <input id="pfSector" placeholder="القطاع مثال: بنوك">
          <input id="pfQty" type="number" step="0.01" placeholder="الكمية">
          <input id="pfAvg" type="number" step="0.01" placeholder="متوسط الشراء">
          <input id="pfPrice" type="number" step="0.01" placeholder="السعر الحالي">
        </div>
        <button class="mainBtn" onclick="PWC_Portfolio.addStock()">حفظ السهم</button>
      </div>
    `;
  }

  function dividendForm() {
    return `
      <div class="formCard">
        <h3>💸 إضافة توزيع</h3>
        <div class="formGrid">
          <input id="dvCompany" placeholder="الشركة">
          <input id="dvAmount" type="number" step="0.01" placeholder="قيمة التوزيع">
          <input id="dvDate" type="date" value="${WCUtils.today()}">
          <input id="dvNote" placeholder="ملاحظة اختيارية">
        </div>
        <button class="mainBtn" onclick="PWC_Portfolio.addDividend()">حفظ التوزيع</button>
      </div>
    `;
  }

  function stockList(c) {
    if (!c.stocks.length) {
      return WCUI.empty("قائمة الأسهم", "لا توجد أسهم حالياً. أضف أول سهم عشان يبدأ التحليل.");
    }

    return `
      <div class="tableCard">
        <h3>📋 الأسهم</h3>
        <div class="stockList">
          ${c.stocks.map(x => {
            const qty = WCUtils.num(x.quantity);
            const avg = WCUtils.num(x.avgPrice);
            const price = WCUtils.num(x.currentPrice || x.avgPrice);
            const value = qty * price;
            const cost = qty * avg;
            const pnl = value - cost;
            const weight = c.value > 0 ? (value / c.value) * 100 : 0;

            return `
              <div class="stockItem">
                <strong>${x.name || x.symbol || "سهم"}</strong>
                <small>${x.symbol || "-"} • ${x.sector || "غير مصنف"} • وزن ${WCUtils.percent(weight)}</small>
                <b>${WCUtils.money(value)}</b>
                <button class="miniBtn dangerBtn" onclick="PWC_Portfolio.removeStock('${x.id}')">حذف</button>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function dividendList(c) {
    if (!c.dividends.length) {
      return WCUI.empty("التوزيعات", "لا توجد توزيعات حالياً. أضف أول توزيع لمتابعة الدخل السلبي.");
    }

    return `
      <div class="tableCard">
        <h3>💸 التوزيعات</h3>
        <div class="stockList">
          ${c.dividends.slice().reverse().map(x => `
            <div class="stockItem">
              <strong>${x.company || "توزيع"}</strong>
              <small>${x.date || "-"} • ${x.note || ""}</small>
              <b>${WCUtils.money(x.amount)}</b>
              <button class="miniBtn dangerBtn" onclick="PWC_Portfolio.removeDividend('${x.id}')">حذف</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function portfolioInsight(c) {
    if (!c.stocks.length) return "ابدأ بإضافة أسهمك الحالية حتى تحصل على قراءة فعلية للمحفظة.";
    if (c.pnl < 0) return "المحفظة حالياً تحت التكلفة. راقب متوسط الشراء ولا تزيد التركيز في سهم واحد.";
    if (c.divTotal <= 0) return "المحفظة موجودة، لكن لم يتم تسجيل توزيعات بعد. أضف التوزيعات لمتابعة الدخل السلبي.";
    return "المحفظة بدأت تعطي صورة أوضح. استمر بتحديث الأسعار والتوزيعات بشكل دوري.";
  }

  function addStock() {
    const name = WCUtils.byId("pfName").value.trim();
    const symbol = WCUtils.byId("pfSymbol").value.trim();
    const sector = WCUtils.byId("pfSector").value.trim();
    const quantity = WCUtils.num(WCUtils.byId("pfQty").value);
    const avgPrice = WCUtils.num(WCUtils.byId("pfAvg").value);
    const currentPrice = WCUtils.num(WCUtils.byId("pfPrice").value);

    if (!name && !symbol) return alert("دخل اسم الشركة أو الرمز.");
    if (quantity <= 0 || avgPrice <= 0) return alert("دخل الكمية ومتوسط الشراء.");

    WCStore.update(data => {
      data.portfolio.push({
        id: WCUtils.uid(),
        name,
        symbol,
        sector,
        quantity,
        avgPrice,
        currentPrice: currentPrice || avgPrice,
        createdAt: WCUtils.today()
      });
    });
  }

  function addDividend() {
    const company = WCUtils.byId("dvCompany").value.trim();
    const amount = WCUtils.num(WCUtils.byId("dvAmount").value);
    const date = WCUtils.byId("dvDate").value || WCUtils.today();
    const note = WCUtils.byId("dvNote").value.trim();

    if (!company) return alert("دخل اسم الشركة.");
    if (amount <= 0) return alert("دخل قيمة التوزيع.");

    WCStore.update(data => {
      data.dividends.push({
        id: WCUtils.uid(),
        company,
        amount,
        date,
        note
      });
    });
  }

  function removeStock(id) {
    if (!confirm("حذف السهم؟")) return;
    WCStore.update(data => {
      data.portfolio = data.portfolio.filter(x => x.id !== id);
    });
  }

  function removeDividend(id) {
    if (!confirm("حذف التوزيع؟")) return;
    WCStore.update(data => {
      data.dividends = data.dividends.filter(x => x.id !== id);
    });
  }

  window.PWC_Portfolio = { addStock, addDividend, removeStock, removeDividend };

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);
})();