/* ==========================================================
   Personal Wealth Center
   Investments Center V2.1
   File: js/portfolio.js
   UAE Stocks / Smart Add / Auto Price / News / Capital
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

  function n(v, f = 0){ const x = Number(v); return Number.isFinite(x) ? x : f; }
  function arr(v){ return Array.isArray(v) ? v : []; }
  function money(v){ return WCUtils.money(n(v)); }
  function today(){ return WCUtils.today ? WCUtils.today() : new Date().toISOString().slice(0,10); }
  function id(){ return WCUtils.uid ? WCUtils.uid() : String(Date.now() + Math.random()); }
  function el(id){ return document.getElementById(id); }
  function val(id){ return el(id) ? String(el(id).value || "").trim() : ""; }

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
      monthlyProfit: totalValue + dividends - capital,
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
      const txt = `${x.symbol} ${x.ar} ${x.name} ${x.market} ${x.sector}`.toLowerCase();
      return (!q || txt.includes(q)) &&
             (state.market === "all" || x.market === state.market) &&
             (state.sector === "all" || x.sector === state.sector);
    });
  }

  function unique(key){
    return [...new Set(UAE_STOCKS.map(x => x[key]).filter(Boolean))];
  }

  function insight(c){
    if (!c.stocks.length) return "أضف أول سهم من القائمة حتى يبدأ التحليل.";
    if (c.totalPnl < 0) return `محفظتك حالياً خسرانة ${money(Math.abs(c.totalPnl))}. راقب الأسهم الضعيفة ولا تزيد التركيز بدون مراجعة.`;
    if (c.totalReturn > 10) return `الأداء ممتاز بعائد ${c.totalReturn.toFixed(1)}%. راقب التوازن بين القطاعات وجني جزء من الأرباح عند الحاجة.`;
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
      ${WCUI.pageHero(
        "الاستثمارات",
        "إدارة أسهم الإمارات، رأس المال، الشراء، التوزيعات، الأخبار، والتحليل الذكي.",
        "Investments"
      )}

      ${WCUI.heroCard({
        tag:"Investments Value",
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
        {icon:"📊", label:"الربح مقابل رأس المال", value:money(c.monthlyProfit), type:c.monthlyProfit < 0 ? "danger" : "gold"}
      ])}

      <section class="decisionCard">
        <h3>🧠 التحليل الذكي</h3>
        <p>${insight(c)}</p>
      </section>

      <section class="formCard">
        <h3>💼 إضافة رأس مال</h3>
        <div class="formGrid">
          <input id="capitalAmount" type="number" inputmode="decimal" placeholder="مثال: 3000" />
          <input id="capitalDate" type="date" value="${today()}" />
          <input id="capitalNote" placeholder="مثال: استثمار شهر يوليو" />
        </div>
        <button class="mainBtn" onclick="PWC_Portfolio.addCapital()">حفظ رأس المال</button>
      </section>

      <section class="formCard">
        <h3>🔎 بحث وفلترة</h3>
        <div class="formGrid">
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
      </section>

      <section class="formCard">
        <h3>➕ إضافة سهم من سوق الإمارات</h3>

        <div class="formGrid">
          <select id="stockSelect" onchange="PWC_Portfolio.selectStock()">
            <option value="">اختر السهم</option>
            ${filteredCatalog().map(x => `
              <option value="${x.symbol}" ${state.selected === x.symbol ? "selected" : ""}>
                ${x.symbol} - ${x.ar} - ${x.market}
              </option>
            `).join("")}
          </select>

          <input id="stockQty" type="number" inputmode="decimal" placeholder="عدد الأسهم فقط" />
          <input id="stockDate" type="date" value="${today()}" />
          <input id="stockNote" placeholder="ملاحظة اختيارية" />
        </div>

        ${selectedMeta ? `
          <div class="decisionCard">
            <h3>${selectedMeta.ar} • ${selectedMeta.symbol}</h3>
            <p>${selectedMeta.market} • ${selectedMeta.sector}</p>
            <p>السعر الحالي: <b>${state.loading ? "جاري البحث..." : selectedPrice ? money(selectedPrice.price) : "غير متوفر حالياً"}</b></p>
          </div>
        ` : ""}

        <button class="mainBtn" onclick="PWC_Portfolio.addStock()">حفظ السهم</button>
      </section>

      <section class="tableCard">
        <h3>⚡ الأسعار والأخبار</h3>
        <button class="mainBtn" onclick="PWC_Portfolio.refreshAllPrices()">
          ${state.loading ? "جاري تحديث الأسعار..." : "تحديث أسعار أسهمي"}
        </button>
        <br><br>
        <button class="mainBtn" onclick="PWC_Portfolio.fetchNews()">
          ${state.newsLoading ? "جاري جلب الأخبار..." : "جلب أخبار أسهمي"}
        </button>
      </section>

      ${newsBlock()}
      ${summaryBlock(c)}
      ${stocksBlock(stocks, c)}
      ${dividendBlock()}
      ${distributionBlock("توزيع القطاعات", c.sectors, c.totalValue)}
      ${distributionBlock("توزيع الأسواق", c.markets, c.totalValue)}
    `;
  }

  function newsBlock(){
    if (!state.news.length) {
      return `
        <section class="emptyCard">
          <h3>📰 أخبار أسهمي</h3>
          <p>اضغط جلب أخبار أسهمي لعرض أخبار الشركات الموجودة في محفظتك.</p>
        </section>
      `;
    }

    return `
      <section class="tableCard">
        <h3>📰 أخبار أسهمي</h3>
        <div class="stockList">
          ${state.news.map(x => `
            <div class="stockItem">
              <strong>${x.title}</strong>
              <small>${x.date ? new Date(x.date).toLocaleDateString("ar-AE") : ""}</small>
              <a class="miniBtn" href="${x.link}" target="_blank" rel="noopener">فتح</a>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function summaryBlock(c){
    return `
      <section class="tableCard">
        <h3>📌 ملخص الاستثمارات</h3>
        <div class="stockList">
          <div class="stockItem"><strong>أفضل سهم</strong><small>${c.best ? `${c.best.ar} • ${pnlPct(c.best).toFixed(1)}%` : "لا يوجد"}</small><b>${c.best ? money(pnl(c.best)) : money(0)}</b></div>
          <div class="stockItem"><strong>أضعف سهم</strong><small>${c.worst ? `${c.worst.ar} • ${pnlPct(c.worst).toFixed(1)}%` : "لا يوجد"}</small><b>${c.worst ? money(pnl(c.worst)) : money(0)}</b></div>
          <div class="stockItem"><strong>إجمالي رأس المال</strong><small>كل المبالغ التي أضفتها</small><b>${money(c.capital)}</b></div>
        </div>
      </section>
    `;
  }

  function stocksBlock(stocks, c){
    if (!stocks.length) {
      return `<section class="emptyCard"><h3>📋 الأسهم</h3><p>لا توجد أسهم مطابقة.</p></section>`;
    }

    return `
      <section class="tableCard">
        <h3>📋 الأسهم</h3>
        ${stocks.map(x => {
          const v = value(x);
          const p = pnl(x);
          const weight = c.totalValue > 0 ? v / c.totalValue * 100 : 0;

          return `
            <div class="formCard">
              <h3>${p >= 0 ? "🟢" : "🔴"} ${x.ar || x.symbol}</h3>

              <div class="stockList">
                <div class="stockItem"><strong>الرمز / السوق</strong><small>${x.symbol} • ${x.market}</small><b>${x.sector}</b></div>
                <div class="stockItem"><strong>الكمية</strong><small>متوسط الشراء ${n(x.avgPrice).toFixed(3)}</small><b>${n(x.quantity)}</b></div>
                <div class="stockItem"><strong>القيمة الحالية</strong><small>السعر الحالي ${n(x.currentPrice).toFixed(3)}</small><b>${money(v)}</b></div>
                <div class="stockItem"><strong>الربح / الخسارة</strong><small>${pnlPct(x).toFixed(1)}% • وزن ${weight.toFixed(1)}%</small><b>${money(p)}</b></div>
              </div>

              <br>
              <div class="formGrid">
                <input id="moreQty_${x.id}" type="number" inputmode="decimal" placeholder="كم سهم اشتريت زيادة؟" />
                <input id="moreDate_${x.id}" type="date" value="${today()}" />
              </div>

              <button class="miniBtn" onclick="PWC_Portfolio.addMore('${x.id}')">➕ إضافة شراء</button>
              <button class="miniBtn" onclick="PWC_Portfolio.updateOne('${x.id}')">🔄 تحديث السعر</button>
              <button class="miniBtn dangerBtn" onclick="PWC_Portfolio.removeStock('${x.id}')">🗑 حذف</button>
            </div>
          `;
        }).join("")}
      </section>
    `;
  }

  function dividendBlock(){
    const data = ensure(WCStore.get());

    return `
      <section class="formCard">
        <h3>💸 إضافة توزيع</h3>
        <div class="formGrid">
          <select id="divSymbol">
            <option value="">اختر الشركة</option>
            ${data.portfolio.map(x => `<option value="${x.symbol}">${x.symbol} - ${x.ar}</option>`).join("")}
          </select>
          <input id="divAmount" type="number" inputmode="decimal" placeholder="قيمة التوزيع" />
          <input id="divDate" type="date" value="${today()}" />
          <input id="divNote" placeholder="ملاحظة اختيارية" />
        </div>
        <button class="mainBtn" onclick="PWC_Portfolio.addDividend()">حفظ التوزيع</button>
      </section>
    `;
  }

  function distributionBlock(title, obj, total){
    const rows = Object.entries(obj || {}).sort((a,b) => b[1] - a[1]);

    if (!rows.length) return "";

    return `
      <section class="tableCard">
        <h3>📊 ${title}</h3>
        ${rows.map(([name, amount]) => {
          const p = total > 0 ? amount / total * 100 : 0;
          return `
            <div class="stockItem"><strong>${name}</strong><small>${money(amount)}</small><b>${p.toFixed(1)}%</b></div>
            <div class="progressBar"><div class="progressFill" style="width:${Math.min(p,100)}%"></div></div>
          `;
        }).join("")}
      </section>
    `;
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
        existing.transactions = arr(existing.transactions);
        existing.transactions.push({id:id(), type:"buy", quantity, price, date, note});
      } else {
        data.portfolio.push({
          id:id(),
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
          transactions:[{id:id(), type:"buy", quantity, price, date, note}],
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
    x.transactions = arr(x.transactions);
    x.transactions.push({id:id(), type:"buy", quantity, price:live.price, date});

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
        id:id(),
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
        id:id(),
        amount,
        date:val("capitalDate") || today(),
        note:val("capitalNote"),
        createdAt:today()
      });
    });
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
    fetchNews
  };

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);
})();