/* ==========================================================
   Personal Wealth Center
   Portfolio Management Pro V1.2
   File: js/portfolio.js
========================================================== */
"use strict";

(function () {
  const page = document.getElementById("portfolio");
  if (!page) return;

  const state = {
    query: "",
    market: "all",
    sector: "all",
    editingId: null
  };

  function ensure(data) {
    data.portfolio = Array.isArray(data.portfolio) ? data.portfolio : [];
    data.dividends = Array.isArray(data.dividends) ? data.dividends : [];
    return data;
  }

  function n(v) {
    return WCUtils.num(v);
  }

  function uid() {
    return WCUtils.uid ? WCUtils.uid() : String(Date.now() + Math.random());
  }

  function today() {
    return WCUtils.today ? WCUtils.today() : new Date().toISOString().slice(0, 10);
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function money(v) {
    return WCUtils.money(n(v));
  }

  function pct(v) {
    return WCUtils.percent(n(v));
  }

  function stockCost(x) {
    return n(x.quantity) * n(x.avgPrice);
  }

  function stockValue(x) {
    return n(x.quantity) * n(x.currentPrice || x.avgPrice);
  }

  function stockPnl(x) {
    return stockValue(x) - stockCost(x);
  }

  function stockPnlPct(x) {
    const cost = stockCost(x);
    return cost > 0 ? (stockPnl(x) / cost) * 100 : 0;
  }

  function stockDividends(data, symbolOrName) {
    const key = String(symbolOrName || "").toLowerCase();
    return (data.dividends || [])
      .filter(d => {
        const c = String(d.company || "").toLowerCase();
        const s = String(d.symbol || "").toLowerCase();
        return c === key || s === key;
      })
      .reduce((sum, d) => sum + n(d.amount), 0);
  }

  function calc(data) {
    ensure(data);

    const stocks = data.portfolio;
    const dividends = data.dividends;

    const totalCost = stocks.reduce((s, x) => s + stockCost(x), 0);
    const totalValue = stocks.reduce((s, x) => s + stockValue(x), 0);
    const totalPnl = totalValue - totalCost;
    const totalReturn = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    const totalDividends = dividends.reduce((s, x) => s + n(x.amount), 0);
    const dividendYield = totalCost > 0 ? (totalDividends / totalCost) * 100 : 0;

    const winners = stocks
      .slice()
      .sort((a, b) => stockPnl(b) - stockPnl(a));

    const best = winners[0] || null;
    const worst = winners.length ? winners[winners.length - 1] : null;

    const markets = {};
    const sectors = {};

    stocks.forEach(x => {
      const market = x.market || "غير محدد";
      const sector = x.sector || "غير محدد";
      const value = stockValue(x);

      markets[market] = (markets[market] || 0) + value;
      sectors[sector] = (sectors[sector] || 0) + value;
    });

    return {
      stocks,
      dividends,
      totalCost,
      totalValue,
      totalPnl,
      totalReturn,
      totalDividends,
      dividendYield,
      best,
      worst,
      markets,
      sectors
    };
  }

  function filteredStocks(stocks) {
    const q = state.query.toLowerCase();

    return stocks.filter(x => {
      const matchQuery =
        !q ||
        String(x.name || "").toLowerCase().includes(q) ||
        String(x.symbol || "").toLowerCase().includes(q) ||
        String(x.sector || "").toLowerCase().includes(q) ||
        String(x.market || "").toLowerCase().includes(q);

      const matchMarket = state.market === "all" || x.market === state.market;
      const matchSector = state.sector === "all" || x.sector === state.sector;

      return matchQuery && matchMarket && matchSector;
    });
  }

  function unique(list, key) {
    return [...new Set(list.map(x => x[key]).filter(Boolean))];
  }

  function render() {
    const data = ensure(WCStore.get());
    const c = calc(data);
    const stocks = filteredStocks(c.stocks);

    page.innerHTML = `
      ${WCUI.pageHero(
        "المحفظة",
        "إدارة الأسهم، التكلفة، القيمة الحالية، التوزيعات، الربح والخسارة، ونسبة كل شركة من المحفظة.",
        "Portfolio"
      )}

      ${WCUI.heroCard({
        tag: "Portfolio Value",
        title: money(c.totalValue),
        desc: "إجمالي قيمة المحفظة الحالية",
        value: `${c.totalPnl >= 0 ? "+" : ""}${money(c.totalPnl)}`,
        sub: `العائد: ${pct(c.totalReturn)}`
      })}

      ${WCUI.statGrid([
        { icon: "💵", label: "إجمالي التكلفة", value: money(c.totalCost) },
        { icon: "📈", label: "القيمة الحالية", value: money(c.totalValue) },
        { icon: c.totalPnl >= 0 ? "🟢" : "🔴", label: "الربح / الخسارة", value: money(c.totalPnl), type: c.totalPnl < 0 ? "danger" : "gold" },
        { icon: "🏢", label: "عدد الشركات", value: String(c.stocks.length) },
        { icon: "💸", label: "التوزيعات", value: money(c.totalDividends), type: "gold" },
        { icon: "📊", label: "عائد التوزيعات", value: pct(c.dividendYield), type: "gold" }
      ])}

      ${portfolioSummary(c)}
      ${filters(c)}
      ${stockForm(data)}
      ${stockCards(data, stocks, c)}
      ${dividendForm()}
      ${dividendList(c)}
      ${allocationCard("توزيع القطاعات", c.sectors, c.totalValue)}
      ${allocationCard("توزيع الأسواق", c.markets, c.totalValue)}
      ${WCUI.decision(portfolioInsight(c))}
    `;
  }

  function portfolioSummary(c) {
    return `
      <div class="tableCard">
        <h3>📌 ملخص المحفظة</h3>
        <div class="stockList">
          <div class="stockItem">
            <strong>أفضل سهم</strong>
            <small>${c.best ? `${c.best.name || c.best.symbol} • ${pct(stockPnlPct(c.best))}` : "لا يوجد"}</small>
            <b>${c.best ? money(stockPnl(c.best)) : money(0)}</b>
          </div>

          <div class="stockItem">
            <strong>أضعف سهم</strong>
            <small>${c.worst ? `${c.worst.name || c.worst.symbol} • ${pct(stockPnlPct(c.worst))}` : "لا يوجد"}</small>
            <b>${c.worst ? money(stockPnl(c.worst)) : money(0)}</b>
          </div>

          <div class="stockItem">
            <strong>الدخل من التوزيعات</strong>
            <small>إجمالي التوزيعات المسجلة</small>
            <b>${money(c.totalDividends)}</b>
          </div>
        </div>
      </div>
    `;
  }

  function filters(c) {
    const markets = unique(c.stocks, "market");
    const sectors = unique(c.stocks, "sector");

    return `
      <div class="formCard">
        <h3>🔎 بحث وفلترة</h3>
        <div class="formGrid">
          <input id="pfSearch" placeholder="ابحث باسم الشركة / الرمز / القطاع" value="${state.query}">
          
          <select id="pfMarketFilter">
            <option value="all">كل الأسواق</option>
            ${markets.map(m => `<option value="${m}" ${state.market === m ? "selected" : ""}>${m}</option>`).join("")}
          </select>

          <select id="pfSectorFilter">
            <option value="all">كل القطاعات</option>
            ${sectors.map(s => `<option value="${s}" ${state.sector === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>

        <button class="mainBtn" onclick="PWC_Portfolio.applyFilters()">تطبيق الفلترة</button>
      </div>
    `;
  }

  function stockForm(data) {
    const edit = state.editingId
      ? (data.portfolio || []).find(x => x.id === state.editingId)
      : null;

    return `
      <div class="formCard">
        <h3>${edit ? "✏️ تعديل سهم" : "➕ إضافة سهم"}</h3>

        <div class="formGrid">
          <input id="pfName" placeholder="اسم الشركة مثال: ADIB" value="${edit?.name || ""}">
          <input id="pfSymbol" placeholder="الرمز مثال: ADIB" value="${edit?.symbol || ""}">
          <input id="pfMarket" placeholder="السوق مثال: ADX / DFM / US" value="${edit?.market || ""}">
          <input id="pfSector" placeholder="القطاع مثال: بنوك" value="${edit?.sector || ""}">
          <input id="pfQty" type="number" step="0.01" placeholder="عدد الأسهم" value="${edit?.quantity || ""}">
          <input id="pfAvg" type="number" step="0.01" placeholder="متوسط الشراء" value="${edit?.avgPrice || ""}">
          <input id="pfPrice" type="number" step="0.01" placeholder="السعر الحالي" value="${edit?.currentPrice || ""}">
          <input id="pfFee" type="number" step="0.01" placeholder="العمولة / الرسوم" value="${edit?.fees || ""}">
          <input id="pfDate" type="date" value="${edit?.buyDate || today()}">
          <input id="pfNote" placeholder="ملاحظة اختيارية" value="${edit?.note || ""}">
        </div>

        <button class="mainBtn" onclick="PWC_Portfolio.saveStock()">
          ${edit ? "حفظ التعديل" : "حفظ السهم"}
        </button>

        ${edit ? `<button class="miniBtn" style="margin-top:10px;width:100%;" onclick="PWC_Portfolio.cancelEdit()">إلغاء التعديل</button>` : ""}
      </div>
    `;
  }

  function stockCards(data, stocks, c) {
    if (!stocks.length) {
      return WCUI.empty("قائمة الأسهم", "لا توجد أسهم حالياً. أضف أول سهم عشان يبدأ التحليل.");
    }

    return `
      <div class="tableCard">
        <h3>📋 الأسهم</h3>
        <div class="stockList">
          ${stocks.map(x => {
            const cost = stockCost(x);
            const value = stockValue(x);
            const pnl = stockPnl(x);
            const r = stockPnlPct(x);
            const weight = c.totalValue > 0 ? (value / c.totalValue) * 100 : 0;
            const divs = stockDividends(data, x.symbol || x.name);
            const divYield = cost > 0 ? (divs / cost) * 100 : 0;

            return `
              <div class="tableCard" style="margin-bottom:14px;">
                <h3>${x.name || x.symbol || "سهم"} ${pnl >= 0 ? "🟢" : "🔴"}</h3>

                <div class="stockList">
                  <div class="stockItem">
                    <strong>الرمز / السوق</strong>
                    <small>${x.symbol || "-"} • ${x.market || "غير محدد"}</small>
                    <b>${x.sector || "غير مصنف"}</b>
                  </div>

                  <div class="stockItem">
                    <strong>الكمية</strong>
                    <small>متوسط الشراء ${n(x.avgPrice)}</small>
                    <b>${n(x.quantity)}</b>
                  </div>

                  <div class="stockItem">
                    <strong>القيمة الحالية</strong>
                    <small>السعر الحالي ${n(x.currentPrice || x.avgPrice)}</small>
                    <b>${money(value)}</b>
                  </div>

                  <div class="stockItem">
                    <strong>الربح / الخسارة</strong>
                    <small>${pct(r)} • وزن ${pct(weight)}</small>
                    <b class="${pnl < 0 ? "danger" : "gold"}">${money(pnl)}</b>
                  </div>

                  <div class="stockItem">
                    <strong>التوزيعات</strong>
                    <small>عائد التوزيع ${pct(divYield)}</small>
                    <b>${money(divs)}</b>
                  </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;">
                  <button class="miniBtn" onclick="PWC_Portfolio.editStock('${x.id}')">✏️ تعديل</button>
                  <button class="miniBtn dangerBtn" onclick="PWC_Portfolio.removeStock('${x.id}')">🗑 حذف</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function dividendForm() {
    return `
      <div class="formCard">
        <h3>💸 إضافة توزيع</h3>
        <div class="formGrid">
          <input id="dvCompany" placeholder="الشركة / الرمز">
          <input id="dvAmount" type="number" step="0.01" placeholder="قيمة التوزيع">
          <input id="dvDate" type="date" value="${today()}">
          <input id="dvNote" placeholder="ملاحظة اختيارية">
        </div>
        <button class="mainBtn" onclick="PWC_Portfolio.addDividend()">حفظ التوزيع</button>
      </div>
    `;
  }

  function dividendList(c) {
    if (!c.dividends.length) {
      return WCUI.empty("التوزيعات", "لا توجد توزيعات حالياً. أضف أول توزيع لمتابعة الدخل السلبي.");
    }

    return `
      <div class="tableCard">
        <h3>💸 سجل التوزيعات</h3>
        <div class="stockList">
          ${c.dividends.slice().reverse().map(x => `
            <div class="stockItem">
              <strong>${x.company || "توزيع"}</strong>
              <small>${x.date || "-"} • ${x.note || ""}</small>
              <b>${money(x.amount)}</b>
              <button class="miniBtn dangerBtn" onclick="PWC_Portfolio.removeDividend('${x.id}')">حذف</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function allocationCard(title, obj, total) {
    const rows = Object.entries(obj || {}).sort((a, b) => b[1] - a[1]);

    if (!rows.length) {
      return WCUI.empty(title, "لا توجد بيانات كافية لعرض التوزيع.");
    }

    return `
      <div class="tableCard">
        <h3>📊 ${title}</h3>
        <div class="stockList">
          ${rows.map(([name, value]) => {
            const p = total > 0 ? (value / total) * 100 : 0;
            return `
              <div>
                <div class="stockItem">
                  <strong>${name}</strong>
                  <small>${money(value)}</small>
                  <b>${pct(p)}</b>
                </div>
                <div class="progressBar" style="margin-top:8px;">
                  <div class="progressFill" style="width:${Math.min(p, 100)}%"></div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function portfolioInsight(c) {
    if (!c.stocks.length) return "ابدأ بإضافة أسهمك الحالية حتى تحصل على قراءة فعلية للمحفظة.";
    if (c.totalValue <= 0) return "أضف الأسعار الحالية للأسهم حتى تظهر القيمة الفعلية.";
    if (c.totalPnl < 0) return "المحفظة حالياً تحت التكلفة. راقب متوسط الشراء ولا تزيد التركيز في سهم واحد.";
    if (c.totalDividends <= 0) return "المحفظة موجودة، لكن لم يتم تسجيل توزيعات بعد. أضف التوزيعات لمتابعة الدخل السلبي.";
    return "المحفظة بدأت تعطي صورة أوضح. استمر بتحديث الأسعار والتوزيعات بشكل دوري.";
  }

  function saveStock() {
    const name = val("pfName");
    const symbol = val("pfSymbol");
    const market = val("pfMarket");
    const sector = val("pfSector");
    const quantity = n(val("pfQty"));
    const avgPrice = n(val("pfAvg"));
    const currentPrice = n(val("pfPrice"));
    const fees = n(val("pfFee"));
    const buyDate = val("pfDate") || today();
    const note = val("pfNote");

    if (!name && !symbol) return alert("دخل اسم الشركة أو الرمز.");
    if (quantity <= 0) return alert("دخل عدد الأسهم.");
    if (avgPrice <= 0) return alert("دخل متوسط الشراء.");

    WCStore.update(data => {
      ensure(data);

      const item = {
        id: state.editingId || uid(),
        name,
        symbol,
        market,
        sector,
        quantity,
        avgPrice,
        currentPrice: currentPrice || avgPrice,
        fees,
        buyDate,
        note,
        updatedAt: today()
      };

      if (state.editingId) {
        data.portfolio = data.portfolio.map(x => x.id === state.editingId ? item : x);
      } else {
        item.createdAt = today();
        data.portfolio.push(item);
      }
    });

    state.editingId = null;
  }

  function editStock(id) {
    state.editingId = id;
    render();
    setTimeout(() => {
      const input = document.getElementById("pfName");
      if (input) input.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  function cancelEdit() {
    state.editingId = null;
    render();
  }

  function removeStock(id) {
    if (!confirm("حذف السهم؟")) return;

    WCStore.update(data => {
      ensure(data);
      data.portfolio = data.portfolio.filter(x => x.id !== id);
    });
  }

  function addDividend() {
    const company = val("dvCompany");
    const amount = n(val("dvAmount"));
    const date = val("dvDate") || today();
    const note = val("dvNote");

    if (!company) return alert("دخل اسم الشركة أو الرمز.");
    if (amount <= 0) return alert("دخل قيمة التوزيع.");

    WCStore.update(data => {
      ensure(data);
      data.dividends.push({
        id: uid(),
        company,
        symbol: company,
        amount,
        date,
        note,
        createdAt: today()
      });
    });
  }

  function removeDividend(id) {
    if (!confirm("حذف التوزيع؟")) return;

    WCStore.update(data => {
      ensure(data);
      data.dividends = data.dividends.filter(x => x.id !== id);
    });
  }

  function applyFilters() {
    state.query = val("pfSearch");
    state.market = val("pfMarketFilter") || "all";
    state.sector = val("pfSectorFilter") || "all";
    render();
  }

  window.PWC_Portfolio = {
    saveStock,
    editStock,
    cancelEdit,
    removeStock,
    addDividend,
    removeDividend,
    applyFilters
  };

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);
})();