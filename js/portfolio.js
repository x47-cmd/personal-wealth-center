/* ==========================================================
   Personal Wealth Center
   Investments Center V2.3
   File: js/portfolio.js
   Cleaner UI / Fixed Dates / Organized Panels
========================================================== */

"use strict";

(function () {
  const page = document.getElementById("portfolio");
  if (!page) return;

  const state = {
    q: "",
    market: "all",
    sector: "all",
    selected: "",
    prices: {},
    news: [],
    loading: false,
    newsLoading: false
  };

  const UAE_STOCKS = [
    {symbol:"ADIB", ar:"مصرف أبوظبي الإسلامي", name:"Abu Dhabi Islamic Bank", market:"ADX", sector:"بنوك", yahoo:["ADIB.AD"]},
    {symbol:"ADCB", ar:"بنك أبوظبي التجاري", name:"Abu Dhabi Commercial Bank", market:"ADX", sector:"بنوك", yahoo:["ADCB.AD"]},
    {symbol:"FAB", ar:"بنك أبوظبي الأول", name:"First Abu Dhabi Bank", market:"ADX", sector:"بنوك", yahoo:["FAB.AD"]},
    {symbol:"ADNOCDRILL", ar:"أدنوك للحفر", name:"ADNOC Drilling", market:"ADX", sector:"طاقة", yahoo:["ADNOCDRILL.AD"]},
    {symbol:"ADNOCGAS", ar:"أدنوك للغاز", name:"ADNOC Gas", market:"ADX", sector:"طاقة", yahoo:["ADNOCGAS.AD"]},
    {symbol:"ADNOCDIST", ar:"أدنوك للتوزيع", name:"ADNOC Distribution", market:"ADX", sector:"طاقة", yahoo:["ADNOCDIST.AD"]},
    {symbol:"ALDAR", ar:"الدار العقارية", name:"Aldar Properties", market:"ADX", sector:"عقار", yahoo:["ALDAR.AD"]},
    {symbol:"TAQA", ar:"طاقة", name:"TAQA", market:"ADX", sector:"مرافق", yahoo:["TAQA.AD"]},
    {symbol:"MULTIPLY", ar:"ملتيبلاي", name:"Multiply Group", market:"ADX", sector:"استثمار", yahoo:["MULTIPLY.AD"]},
    {symbol:"BOROUGE", ar:"بروج", name:"Borouge", market:"ADX", sector:"صناعة", yahoo:["BOROUGE.AD"]},
    {symbol:"FERTIGLB", ar:"فيرتيغلوب", name:"Fertiglobe", market:"ADX", sector:"صناعة", yahoo:["FERTIGLB.AD"]},
    {symbol:"DANA", ar:"دانة غاز", name:"Dana Gas", market:"ADX", sector:"طاقة", yahoo:["DANA.AD"]},
    {symbol:"EAND", ar:"إي آند", name:"e&", market:"ADX", sector:"اتصالات", yahoo:["EAND.AD"]},
    {symbol:"AGTHIA", ar:"أغذية", name:"Agthia", market:"ADX", sector:"أغذية", yahoo:["AGTHIA.AD"]},

    {symbol:"EMAAR", ar:"إعمار العقارية", name:"Emaar Properties", market:"DFM", sector:"عقار", yahoo:["EMAAR.AE"]},
    {symbol:"EMAARDEV", ar:"إعمار للتطوير", name:"Emaar Development", market:"DFM", sector:"عقار", yahoo:["EMAARDEV.AE"]},
    {symbol:"DEWA", ar:"ديوا", name:"Dubai Electricity and Water Authority", market:"DFM", sector:"مرافق", yahoo:["DEWA.AE"]},
    {symbol:"DIB", ar:"بنك دبي الإسلامي", name:"Dubai Islamic Bank", market:"DFM", sector:"بنوك", yahoo:["DIB.AE"]},
    {symbol:"EMIRATESNBD", ar:"الإمارات دبي الوطني", name:"Emirates NBD", market:"DFM", sector:"بنوك", yahoo:["EMIRATESNBD.AE"]},
    {symbol:"DFM", ar:"سوق دبي المالي", name:"Dubai Financial Market", market:"DFM", sector:"خدمات مالية", yahoo:["DFM.AE"]},
    {symbol:"AIRARABIA", ar:"العربية للطيران", name:"Air Arabia", market:"DFM", sector:"طيران", yahoo:["AIRARABIA.AE"]},
    {symbol:"DU", ar:"دو", name:"du", market:"DFM", sector:"اتصالات", yahoo:["DU.AE"]},
    {symbol:"SALIK", ar:"سالك", name:"Salik", market:"DFM", sector:"نقل", yahoo:["SALIK.AE"]},
    {symbol:"TECOM", ar:"تيكوم", name:"TECOM Group", market:"DFM", sector:"عقار", yahoo:["TECOM.AE"]},
    {symbol:"PARKIN", ar:"باركن", name:"Parkin", market:"DFM", sector:"نقل", yahoo:["PARKIN.AE"]},
    {symbol:"TALABAT", ar:"طلبات", name:"Talabat", market:"DFM", sector:"تقنية", yahoo:["TALABAT.AE"]}
  ];

  injectCSS();

  const n = (v, f = 0) => Number.isFinite(Number(v)) ? Number(v) : f;
  const arr = v => Array.isArray(v) ? v : [];
  const money = v => WCUtils.money(n(v));
  const today = () => WCUtils.today ? WCUtils.today() : new Date().toISOString().slice(0,10);
  const uid = () => WCUtils.uid ? WCUtils.uid() : String(Date.now() + Math.random());
  const el = id => document.getElementById(id);
  const val = id => el(id) ? String(el(id).value || "").trim() : "";

  function ensure(data){
    data.portfolio = arr(data.portfolio);
    data.dividends = arr(data.dividends);
    data.capitalContributions = arr(data.capitalContributions);
    return data;
  }

  function meta(symbol){
    return UAE_STOCKS.find(x => x.symbol === symbol) || null;
  }

  function cost(x){ return n(x.quantity) * n(x.avgPrice); }
  function value(x){ return n(x.quantity) * n(x.currentPrice || x.avgPrice); }
  function pnl(x){ return value(x) - cost(x); }
  function pnlPct(x){ return cost(x) > 0 ? pnl(x) / cost(x) * 100 : 0; }

  function calc(data){
    ensure(data);

    const stocks = data.portfolio;
    const totalCost = stocks.reduce((s,x) => s + cost(x), 0);
    const totalValue = stocks.reduce((s,x) => s + value(x), 0);
    const totalPnl = totalValue - totalCost;
    const totalReturn = totalCost > 0 ? totalPnl / totalCost * 100 : 0;
    const dividends = data.dividends.reduce((s,x) => s + n(x.amount), 0);
    const capital = data.capitalContributions.reduce((s,x) => s + n(x.amount), 0);

    const sectors = {};
    const markets = {};

    stocks.forEach(x => {
      sectors[x.sector || "غير محدد"] = (sectors[x.sector || "غير محدد"] || 0) + value(x);
      markets[x.market || "غير محدد"] = (markets[x.market || "غير محدد"] || 0) + value(x);
    });

    const sorted = stocks.slice().sort((a,b) => pnl(b) - pnl(a));

    return {
      stocks,
      totalCost,
      totalValue,
      totalPnl,
      totalReturn,
      dividends,
      capital,
      capitalDiff: totalValue + dividends - capital,
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      sectors,
      markets
    };
  }

  async function fetchPrice(symbol){
    const m = meta(symbol);
    if (!m) return null;
    if (state.prices[symbol]) return state.prices[symbol];

    for (const y of m.yahoo || []) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(y)}?range=5d&interval=1d`;
        const res = await fetch(url);
        if (!res.ok) continue;

        const json = await res.json();
        const r = json?.chart?.result?.[0];
        const p = r?.meta?.regularMarketPrice || r?.meta?.previousClose;

        if (Number.isFinite(Number(p))) {
          state.prices[symbol] = {
            price: Number(p),
            source: "Yahoo Finance",
            at: new Date().toISOString()
          };
          return state.prices[symbol];
        }
      } catch(e){}
    }

    return null;
  }

  function unique(key){
    return [...new Set(UAE_STOCKS.map(x => x[key]).filter(Boolean))];
  }

  function filteredCatalog(){
    const q = state.q.toLowerCase();
    return UAE_STOCKS.filter(x => {
      const txt = `${x.symbol} ${x.ar} ${x.name} ${x.market} ${x.sector}`.toLowerCase();
      return (!q || txt.includes(q)) &&
        (state.market === "all" || x.market === state.market) &&
        (state.sector === "all" || x.sector === state.sector);
    });
  }

  function filteredStocks(stocks){
    const q = state.q.toLowerCase();
    return stocks.filter(x => {
      const txt = `${x.symbol} ${x.ar || ""} ${x.name || ""} ${x.market || ""} ${x.sector || ""}`.toLowerCase();
      return (!q || txt.includes(q)) &&
        (state.market === "all" || x.market === state.market) &&
        (state.sector === "all" || x.sector === state.sector);
    });
  }

  function insight(c){
    if (!c.stocks.length) return "أضف أول سهم من القائمة حتى يبدأ التحليل الحقيقي للمحفظة.";
    if (c.totalPnl < 0) return `محفظتك حالياً خسرانة ${money(Math.abs(c.totalPnl))}. راقب الأسهم الضعيفة ولا تزيد التركيز بدون مراجعة.`;
    if (c.totalReturn > 10) return `الأداء ممتاز بعائد ${c.totalReturn.toFixed(1)}%. راقب التوازن بين القطاعات.`;
    if (!c.dividends) return "المحفظة موجودة، لكن لا توجد توزيعات مسجلة. أضف التوزيعات لمتابعة الدخل السلبي.";
    return `المحفظة مستقرة بعائد ${c.totalReturn.toFixed(1)}%. حدث الأسعار والأخبار بشكل دوري.`;
  }

  function render(){
    const data = ensure(WCStore.get());
    const c = calc(data);
    const stocks = filteredStocks(c.stocks);
    const selectedMeta = meta(state.selected);
    const selectedPrice = state.prices[state.selected];

    page.innerHTML = `
      <section class="investTitle">
        <span>الاستثمارات</span>
        <h2>مركز الاستثمارات</h2>
        <p>إدارة أسهم الإمارات، رأس المال، التوزيعات، الأسعار، والأخبار في مكان واحد.</p>
      </section>

      ${WCUI.heroCard({
        tag:"قيمة الاستثمارات",
        title:money(c.totalValue),
        desc:"إجمالي قيمة الاستثمارات الحالية",
        value:`${c.totalPnl >= 0 ? "+" : ""}${money(c.totalPnl)}`,
        sub:`العائد: ${c.totalReturn.toFixed(1)}%`
      })}

      ${WCUI.statGrid([
        {icon:"💼", label:"رأس المال", value:money(c.capital)},
        {icon:"💵", label:"إجمالي التكلفة", value:money(c.totalCost)},
        {icon:"📈", label:"القيمة الحالية", value:money(c.totalValue)},
        {icon:c.totalPnl >= 0 ? "🟢" : "🔴", label:"الربح / الخسارة", value:money(c.totalPnl), type:c.totalPnl < 0 ? "danger" : "gold"},
        {icon:"💸", label:"التوزيعات", value:money(c.dividends), type:"gold"},
        {icon:"📊", label:"مقابل رأس المال", value:money(c.capitalDiff), type:c.capitalDiff < 0 ? "danger" : "gold"}
      ])}

      <section class="investInsight">
        <h3>🧠 القراءة الذكية</h3>
        <p>${insight(c)}</p>
      </section>

      <section class="investShortcuts">
        <button onclick="PWC_Portfolio.scrollToBox('addStockBox')">➕ إضافة سهم</button>
        <button onclick="PWC_Portfolio.scrollToBox('capitalBox')">💼 رأس مال</button>
        <button onclick="PWC_Portfolio.scrollToBox('dividendBox')">💸 توزيع</button>
        <button onclick="PWC_Portfolio.refreshAllPrices()">⚡ تحديث الأسعار</button>
      </section>

      ${capitalBox()}
      ${filterBox()}
      ${addStockBox(selectedMeta, selectedPrice)}
      ${priceNewsBox()}
      ${newsBlock()}
      ${summaryBlock(c)}
      ${stocksBlock(stocks, c)}
      ${dividendBlock()}
      ${distributionBlock("توزيع القطاعات", c.sectors, c.totalValue)}
      ${distributionBlock("توزيع الأسواق", c.markets, c.totalValue)}
    `;
  }

  function panel(id, title, desc, body){
    return `
      <section ${id ? `id="${id}"` : ""} class="investPanel">
        <div class="investPanelHead">
          <h3>${title}</h3>
          ${desc ? `<p>${desc}</p>` : ""}
        </div>
        ${body}
      </section>
    `;
  }

  function capitalBox(){
    return panel(
      "capitalBox",
      "💼 إضافة رأس مال",
      "سجل المبلغ الذي خصصته للاستثمار، مثل استثمار شهري جديد.",
      `
      <div class="investForm">
        <input id="capitalAmount" type="number" inputmode="decimal" placeholder="المبلغ مثال: 3000" />
        <input id="capitalDate" class="dateFix" type="date" value="${today()}" />
        <input id="capitalNote" placeholder="ملاحظة مثال: استثمار شهر يوليو" />
      </div>
      <button class="mainBtn" onclick="PWC_Portfolio.addCapital()">حفظ رأس المال</button>
      `
    );
  }

  function filterBox(){
    return panel(
      "",
      "🔎 بحث وفلترة",
      "فلتر محفظتك أو قائمة الأسهم حسب السوق والقطاع.",
      `
      <div class="investForm">
        <input id="pfSearch" value="${state.q}" placeholder="ابحث باسم الشركة / الرمز / القطاع" />
        <select id="pfMarketFilter">
          <option value="all">كل الأسواق</option>
          ${unique("market").map(x => `<option value="${x}" ${state.market === x ? "selected" : ""}>${x}</option>`).join("")}
        </select>
        <select id="pfSectorFilter">
          <option value="all">كل القطاعات</option>
          ${unique("sector").map(x => `<option value="${x}" ${state.sector === x ? "selected" : ""}>${x}</option>`).join("")}
        </select>
      </div>
      <button class="mainBtn" onclick="PWC_Portfolio.applyFilters()">تطبيق الفلترة</button>
      `
    );
  }

  function addStockBox(selectedMeta, selectedPrice){
    return panel(
      "addStockBox",
      "➕ إضافة سهم إماراتي",
      "اختر السهم واكتب عدد الأسهم فقط. السعر يحاول النظام جلبه تلقائياً.",
      `
      <div class="investForm">
        <select id="stockSelect" onchange="PWC_Portfolio.selectStock()">
          <option value="">اختر السهم</option>
          ${filteredCatalog().map(x => `
            <option value="${x.symbol}" ${state.selected === x.symbol ? "selected" : ""}>
              ${x.symbol} - ${x.ar} - ${x.market}
            </option>
          `).join("")}
        </select>
        <input id="stockQty" type="number" inputmode="decimal" placeholder="عدد الأسهم فقط" />
        <input id="stockDate" class="dateFix" type="date" value="${today()}" />
        <input id="stockNote" placeholder="ملاحظة اختيارية" />
      </div>

      ${selectedMeta ? `
        <div class="selectedStockBox">
          <strong>${selectedMeta.ar}</strong>
          <span>${selectedMeta.symbol} • ${selectedMeta.market} • ${selectedMeta.sector}</span>
          <b>${state.loading ? "جاري جلب السعر..." : selectedPrice ? money(selectedPrice.price) : "السعر غير متوفر حالياً"}</b>
        </div>
      ` : ""}

      <button class="mainBtn" onclick="PWC_Portfolio.addStock()">حفظ السهم</button>
      `
    );
  }

  function priceNewsBox(){
    return panel(
      "",
      "⚡ الأسعار والأخبار",
      "حدث أسعار الأسهم أو اجلب آخر الأخبار المتعلقة بشركات محفظتك.",
      `
      <div class="investActionGrid">
        <button onclick="PWC_Portfolio.refreshAllPrices()">${state.loading ? "جاري التحديث..." : "تحديث أسعار أسهمي"}</button>
        <button onclick="PWC_Portfolio.fetchNews()">${state.newsLoading ? "جاري الجلب..." : "جلب أخبار أسهمي"}</button>
      </div>
      `
    );
  }

  function newsBlock(){
    if (!state.news.length) {
      return panel("", "📰 أخبار أسهمي", "اضغط زر جلب الأخبار لعرض أخبار الشركات الموجودة في محفظتك.", "");
    }

    return panel(
      "",
      "📰 أخبار أسهمي",
      "",
      `
      <div class="investList">
        ${state.news.map(x => `
          <div class="investRow">
            <div>
              <strong>${x.title}</strong>
              <span>${x.date ? new Date(x.date).toLocaleDateString("ar-AE") : ""}</span>
            </div>
            <a href="${x.link}" target="_blank" rel="noopener">فتح</a>
          </div>
        `).join("")}
      </div>
      `
    );
  }

  function summaryBlock(c){
    return panel(
      "",
      "📌 ملخص الاستثمارات",
      "",
      `
      <div class="investList">
        <div class="investRow">
          <div><strong>أفضل سهم</strong><span>${c.best ? `${c.best.ar || c.best.symbol} • ${pnlPct(c.best).toFixed(1)}%` : "لا يوجد"}</span></div>
          <b>${c.best ? money(pnl(c.best)) : money(0)}</b>
        </div>
        <div class="investRow">
          <div><strong>أضعف سهم</strong><span>${c.worst ? `${c.worst.ar || c.worst.symbol} • ${pnlPct(c.worst).toFixed(1)}%` : "لا يوجد"}</span></div>
          <b>${c.worst ? money(pnl(c.worst)) : money(0)}</b>
        </div>
        <div class="investRow">
          <div><strong>إجمالي رأس المال</strong><span>كل المبالغ التي أضفتها</span></div>
          <b>${money(c.capital)}</b>
        </div>
      </div>
      `
    );
  }

  function stocksBlock(stocks, c){
    if (!stocks.length) {
      return panel("", "📋 الأسهم", "لا توجد أسهم مطابقة حالياً.", "");
    }

    return panel(
      "",
      "📋 الأسهم",
      "كل سهم مع الكمية، السعر، الربح، الوزن، والتحديث.",
      stocks.map(x => {
        const v = value(x);
        const p = pnl(x);
        const weight = c.totalValue > 0 ? v / c.totalValue * 100 : 0;

        return `
          <div class="stockCardV2">
            <div class="stockHeaderV2">
              <h3>${p >= 0 ? "🟢" : "🔴"} ${x.ar || x.symbol}</h3>
              <span>${x.symbol} • ${x.market}</span>
            </div>

            <div class="stockMiniGrid">
              <div><small>القطاع</small><strong>${x.sector || "-"}</strong></div>
              <div><small>الكمية</small><strong>${n(x.quantity)}</strong></div>
              <div><small>متوسط الشراء</small><strong>${n(x.avgPrice).toFixed(3)}</strong></div>
              <div><small>السعر الحالي</small><strong>${n(x.currentPrice).toFixed(3)}</strong></div>
              <div><small>القيمة</small><strong>${money(v)}</strong></div>
              <div><small>الربح / الخسارة</small><strong class="${p < 0 ? "lossText" : "gainText"}">${money(p)}</strong></div>
            </div>

            <p class="stockNoteLine">العائد ${pnlPct(x).toFixed(1)}% • الوزن من المحفظة ${weight.toFixed(1)}%</p>

            <div class="stockBuyMore">
              <input id="moreQty_${x.id}" type="number" inputmode="decimal" placeholder="كم سهم اشتريت زيادة؟" />
              <input id="moreDate_${x.id}" class="dateFix" type="date" value="${today()}" />
            </div>

            <div class="stockBtnGrid">
              <button onclick="PWC_Portfolio.addMore('${x.id}')">➕ شراء إضافي</button>
              <button onclick="PWC_Portfolio.updateOne('${x.id}')">🔄 تحديث</button>
              <button class="dangerBtn" onclick="PWC_Portfolio.removeStock('${x.id}')">🗑 حذف</button>
            </div>
          </div>
        `;
      }).join("")
    );
  }

  function dividendBlock(){
    const data = ensure(WCStore.get());

    return panel(
      "dividendBox",
      "💸 إضافة توزيع",
      "سجل توزيعات الأرباح للشركات الموجودة في محفظتك.",
      `
      <div class="investForm">
        <select id="divSymbol">
          <option value="">اختر الشركة</option>
          ${data.portfolio.map(x => `<option value="${x.symbol}">${x.symbol} - ${x.ar || x.name || ""}</option>`).join("")}
        </select>
        <input id="divAmount" type="number" inputmode="decimal" placeholder="قيمة التوزيع" />
        <input id="divDate" class="dateFix" type="date" value="${today()}" />
        <input id="divNote" placeholder="ملاحظة اختيارية" />
      </div>
      <button class="mainBtn" onclick="PWC_Portfolio.addDividend()">حفظ التوزيع</button>
      `
    );
  }

  function distributionBlock(title, obj, total){
    const rows = Object.entries(obj || {}).sort((a,b) => b[1] - a[1]);
    if (!rows.length) return "";

    return panel(
      "",
      `📊 ${title}`,
      "",
      `
      <div class="investDistList">
        ${rows.map(([name, amount]) => {
          const p = total > 0 ? amount / total * 100 : 0;
          return `
            <div class="distRow">
              <div><strong>${name}</strong><span>${money(amount)}</span></div>
              <b>${p.toFixed(1)}%</b>
            </div>
            <div class="progressBar"><div class="progressFill" style="width:${Math.min(p,100)}%"></div></div>
          `;
        }).join("")}
      </div>
      `
    );
  }

  function applyFilters(){
    state.q = val("pfSearch");
    state.market = val("pfMarketFilter") || "all";
    state.sector = val("pfSectorFilter") || "all";
    render();
  }

  async function selectStock(){
    state.selected = val("stockSelect");
    if (!state.selected) return render();

    state.loading = true;
    render();

    await fetchPrice(state.selected);

    state.loading = false;
    render();
  }

  async function addStock(){
    const symbol = val("stockSelect");
    const quantity = n(val("stockQty"));
    const date = val("stockDate") || today();
    const note = val("stockNote");

    if (!symbol) return alert("اختر السهم.");
    if (quantity <= 0) return alert("دخل عدد الأسهم.");

    const m = meta(symbol);
    const live = await fetchPrice(symbol);

    if (!live) return alert("ما قدرت أجيب سعر السهم أونلاين حالياً.");

    WCStore.update(data => {
      ensure(data);

      const existing = data.portfolio.find(x => x.symbol === symbol);
      const price = live.price;

      if (existing) {
        const oldQty = n(existing.quantity);
        const oldCost = oldQty * n(existing.avgPrice);
        const newQty = oldQty + quantity;

        existing.quantity = newQty;
        existing.avgPrice = (oldCost + quantity * price) / newQty;
        existing.currentPrice = price;
        existing.priceUpdatedAt = live.at;
        existing.priceSource = live.source;
        existing.transactions = arr(existing.transactions);
        existing.transactions.push({id:uid(), type:"buy", quantity, price, date, note});
      } else {
        data.portfolio.push({
          id:uid(),
          symbol,
          ar:m.ar,
          name:m.name,
          market:m.market,
          sector:m.sector,
          quantity,
          avgPrice:price,
          currentPrice:price,
          priceSource:live.source,
          priceUpdatedAt:live.at,
          transactions:[{id:uid(), type:"buy", quantity, price, date, note}],
          createdAt:today()
        });
      }
    });

    state.selected = "";
    render();
  }

  async function addMore(stockId){
    const data = ensure(WCStore.get());
    const x = data.portfolio.find(s => s.id === stockId);
    if (!x) return;

    const quantity = n(val(`moreQty_${stockId}`));
    const date = val(`moreDate_${stockId}`) || today();

    if (quantity <= 0) return alert("دخل كمية الشراء.");

    const live = await fetchPrice(x.symbol);
    if (!live) return alert("ما قدرت أجيب السعر الحالي.");

    const oldQty = n(x.quantity);
    const oldCost = oldQty * n(x.avgPrice);
    const newQty = oldQty + quantity;

    x.quantity = newQty;
    x.avgPrice = (oldCost + quantity * live.price) / newQty;
    x.currentPrice = live.price;
    x.priceUpdatedAt = live.at;
    x.priceSource = live.source;
    x.transactions = arr(x.transactions);
    x.transactions.push({id:uid(), type:"buy", quantity, price:live.price, date});

    WCStore.set(data);
  }

  async function updateOne(stockId){
    const data = ensure(WCStore.get());
    const x = data.portfolio.find(s => s.id === stockId);
    if (!x) return;

    const live = await fetchPrice(x.symbol);
    if (!live) return alert("ما قدرت أجيب السعر الحالي.");

    x.currentPrice = live.price;
    x.priceUpdatedAt = live.at;
    x.priceSource = live.source;
    WCStore.set(data);
  }

  function removeStock(stockId){
    if (!confirm("حذف السهم؟")) return;
    WCStore.update(data => {
      ensure(data);
      data.portfolio = data.portfolio.filter(x => x.id !== stockId);
    });
  }

  function addDividend(){
    const symbol = val("divSymbol");
    const amount = n(val("divAmount"));
    if (!symbol || amount <= 0) return alert("اختر الشركة ودخل قيمة التوزيع.");

    WCStore.update(data => {
      ensure(data);
      data.dividends.push({
        id:uid(),
        symbol,
        amount,
        date:val("divDate") || today(),
        note:val("divNote"),
        createdAt:today()
      });
    });
  }

  function addCapital(){
    const amount = n(val("capitalAmount"));
    if (amount <= 0) return alert("دخل مبلغ رأس المال.");

    WCStore.update(data => {
      ensure(data);
      data.capitalContributions.push({
        id:uid(),
        amount,
        date:val("capitalDate") || today(),
        note:val("capitalNote"),
        createdAt:today()
      });
    });
  }

  async function refreshAllPrices(){
    const data = ensure(WCStore.get());
    if (!data.portfolio.length) return alert("ما عندك أسهم حالياً.");

    state.loading = true;
    render();

    for (const x of data.portfolio) {
      const live = await fetchPrice(x.symbol);
      if (live) {
        x.currentPrice = live.price;
        x.priceSource = live.source;
        x.priceUpdatedAt = live.at;
      }
    }

    WCStore.set(data);
    state.loading = false;
    render();
  }

  async function fetchNews(){
    const data = ensure(WCStore.get());
    const symbols = data.portfolio.map(x => x.symbol).slice(0,8);

    if (!symbols.length) return alert("أضف أسهم أولاً عشان تظهر أخبارها.");

    state.newsLoading = true;
    render();

    try{
      const q = encodeURIComponent(symbols.join(" OR ") + " UAE stocks");
      const rss = `https://news.google.com/rss/search?q=${q}&hl=en-AE&gl=AE&ceid=AE:en`;
      const api = `https://api.allorigins.win/get?url=${encodeURIComponent(rss)}`;
      const res = await fetch(api);
      const json = await res.json();
      const xml = new DOMParser().parseFromString(json.contents || "", "text/xml");

      state.news = [...xml.querySelectorAll("item")].slice(0,8).map(item => ({
        title:item.querySelector("title")?.textContent || "خبر",
        link:item.querySelector("link")?.textContent || "#",
        date:item.querySelector("pubDate")?.textContent || ""
      }));
    }catch(e){
      state.news = [];
      alert("الأخبار ما اشتغلت حالياً بسبب قيود المصدر.");
    }

    state.newsLoading = false;
    render();
  }

  function scrollToBox(boxId){
    const box = document.getElementById(boxId);
    if (box) box.scrollIntoView({behavior:"smooth", block:"start"});
  }

  function injectCSS(){
    if (document.getElementById("investmentsV23CSS")) return;

    const css = document.createElement("style");
    css.id = "investmentsV23CSS";
    css.innerHTML = `
      #portfolio{
        padding-bottom:155px !important;
      }

      .investTitle{
        margin:10px 0 22px;
        text-align:right;
      }

      .investTitle span{
        display:inline-block;
        background:#fff7df;
        color:#d4af37;
        border-radius:999px;
        padding:8px 16px;
        font-weight:1000;
        font-size:14px;
        margin-bottom:12px;
      }

      .investTitle h2{
        margin:0 0 8px;
        color:#0b1020;
        font-size:34px;
        font-weight:1000;
        line-height:1.25;
      }

      .investTitle p{
        margin:0;
        color:#667085;
        font-size:16px;
        line-height:1.8;
      }

      .investInsight,
      .investPanel{
        background:#fff;
        border:1px solid #e7eaf0;
        border-radius:28px;
        padding:22px;
        margin-bottom:22px;
        box-shadow:0 18px 45px rgba(15,23,42,.09);
        overflow:hidden;
      }

      .investInsight{
        background:#fffbeb;
        border-color:#fde68a;
      }

      .investInsight h3,
      .investPanelHead h3{
        margin:0 0 10px;
        color:#0b1020;
        font-size:26px;
        font-weight:1000;
        line-height:1.3;
      }

      .investInsight p,
      .investPanelHead p{
        margin:0;
        color:#667085;
        font-size:15px;
        line-height:1.8;
      }

      .investShortcuts{
        display:grid;
        grid-template-columns:repeat(2,1fr);
        gap:10px;
        margin-bottom:22px;
      }

      .investShortcuts button,
      .investActionGrid button,
      .stockBtnGrid button{
        width:100%;
        border:none;
        background:#0b1020;
        color:#f6c945;
        border-radius:18px;
        padding:15px 10px;
        font-size:15px;
        font-weight:1000;
        font-family:inherit;
      }

      .investForm{
        display:grid;
        grid-template-columns:1fr;
        gap:12px;
        margin-top:18px;
        margin-bottom:16px;
        width:100%;
      }

      .investForm input,
      .investForm select,
      .stockBuyMore input{
        width:100%;
        max-width:100%;
        min-width:0;
        height:58px;
        border:1px solid #e7eaf0;
        background:#f8fafc;
        border-radius:18px;
        padding:0 16px;
        font-size:16px;
        color:#101828;
        outline:none;
        font-family:inherit;
        display:block;
      }

      .dateFix{
        direction:ltr !important;
        text-align:center !important;
        appearance:none !important;
        -webkit-appearance:none !important;
        line-height:58px !important;
        padding:0 14px !important;
      }

      .selectedStockBox{
        background:#f8fafc;
        border:1px solid #e7eaf0;
        border-radius:22px;
        padding:16px;
        margin:12px 0 16px;
      }

      .selectedStockBox strong,
      .selectedStockBox span,
      .selectedStockBox b{
        display:block;
      }

      .selectedStockBox strong{
        color:#0b1020;
        font-size:18px;
        font-weight:1000;
        margin-bottom:6px;
      }

      .selectedStockBox span{
        color:#667085;
        font-size:14px;
        font-weight:800;
        margin-bottom:8px;
      }

      .selectedStockBox b{
        color:#d4af37;
        font-size:18px;
        font-weight:1000;
        direction:ltr;
        text-align:right;
      }

      .investActionGrid{
        display:grid;
        grid-template-columns:1fr;
        gap:10px;
        margin-top:18px;
      }

      .investList{
        display:flex;
        flex-direction:column;
        gap:10px;
        margin-top:14px;
      }

      .investRow{
        display:grid;
        grid-template-columns:1fr auto;
        align-items:center;
        gap:12px;
        background:#f8fafc;
        border:1px solid #e7eaf0;
        border-radius:18px;
        padding:14px;
      }

      .investRow strong,
      .investRow span{
        display:block;
      }

      .investRow strong{
        color:#0b1020;
        font-size:15px;
        font-weight:1000;
        margin-bottom:4px;
      }

      .investRow span{
        color:#667085;
        font-size:13px;
        font-weight:800;
        line-height:1.5;
      }

      .investRow b{
        color:#0b1020;
        font-size:15px;
        font-weight:1000;
        direction:ltr;
        white-space:nowrap;
      }

      .investRow a{
        text-decoration:none;
        background:#0b1020;
        color:#f6c945;
        border-radius:14px;
        padding:10px 14px;
        font-weight:1000;
        font-size:13px;
      }

      .stockCardV2{
        background:#fff;
        border:1px solid #e7eaf0;
        border-radius:26px;
        padding:18px;
        margin-top:16px;
        box-shadow:0 12px 30px rgba(15,23,42,.06);
      }

      .stockHeaderV2 h3{
        margin:0 0 6px;
        color:#0b1020;
        font-size:25px;
        font-weight:1000;
      }

      .stockHeaderV2 span{
        color:#667085;
        font-size:14px;
        font-weight:900;
      }

      .stockMiniGrid{
        display:grid;
        grid-template-columns:repeat(2,1fr);
        gap:10px;
        margin-top:14px;
      }

      .stockMiniGrid div{
        background:#f8fafc;
        border:1px solid #e7eaf0;
        border-radius:18px;
        padding:13px;
        min-width:0;
      }

      .stockMiniGrid small{
        display:block;
        color:#667085;
        font-size:12px;
        font-weight:900;
        margin-bottom:6px;
      }

      .stockMiniGrid strong{
        display:block;
        color:#0b1020;
        font-size:15px;
        font-weight:1000;
        direction:ltr;
        text-align:right;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }

      .gainText{color:#d4af37 !important;}
      .lossText{color:#b42318 !important;}

      .stockNoteLine{
        color:#667085;
        font-size:13px;
        font-weight:800;
        line-height:1.6;
        margin:12px 0;
      }

      .stockBuyMore{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin:12px 0;
      }

      .stockBtnGrid{
        display:grid;
        grid-template-columns:1fr 1fr 1fr;
        gap:8px;
      }

      .stockBtnGrid .dangerBtn{
        color:#ffb4a8 !important;
      }

      .investDistList{
        display:flex;
        flex-direction:column;
        gap:10px;
        margin-top:14px;
      }

      .distRow{
        display:grid;
        grid-template-columns:1fr auto;
        align-items:center;
        gap:12px;
        background:#f8fafc;
        border:1px solid #e7eaf0;
        border-radius:18px;
        padding:13px 14px;
      }

      .distRow strong{
        display:block;
        color:#0b1020;
        font-size:15px;
        font-weight:1000;
        margin-bottom:4px;
      }

      .distRow span{
        display:block;
        color:#667085;
        font-size:13px;
        font-weight:800;
        direction:ltr;
        text-align:right;
      }

      .distRow b{
        color:#0b1020;
        font-size:16px;
        font-weight:1000;
        direction:ltr;
      }

      @media(max-width:430px){
        .investTitle h2{
          font-size:30px;
        }

        .investPanel,
        .investInsight{
          padding:20px;
          border-radius:26px;
        }

        .investInsight h3,
        .investPanelHead h3{
          font-size:24px;
        }

        .investForm input,
        .investForm select,
        .stockBuyMore input{
          height:56px;
          font-size:15.5px;
          border-radius:17px;
        }

        .dateFix{
          line-height:56px !important;
        }

        .stockMiniGrid{
          grid-template-columns:1fr;
        }

        .stockBuyMore{
          grid-template-columns:1fr;
        }

        .stockBtnGrid{
          grid-template-columns:1fr;
        }
      }
    `;

    document.head.appendChild(css);
  }

  window.PWC_Portfolio = {
    applyFilters,
    selectStock,
    addStock,
    addMore,
    updateOne,
    removeStock,
    addDividend,
    addCapital,
    refreshAllPrices,
    fetchNews,
    scrollToBox
  };

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);
})();