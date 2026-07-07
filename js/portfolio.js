/* ==========================================================
   Personal Wealth Center
   Portfolio Page
   Version: 1.2.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("portfolio");
  if (!page) return;

  function render() {
    const data = WCStore.get();
    const list = data.portfolio || [];

    const totalCost = list.reduce((s, x) => s + WCUtils.num(x.totalCost), 0);
    const totalValue = list.reduce((s, x) => s + WCUtils.num(x.currentValue), 0);
    const profit = totalValue - totalCost;
    const profitPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    page.innerHTML = `
      ${WCUI.pageHero(
        "محفظتي الاستثمارية",
        "إدارة الأسهم، التكلفة، القيمة الحالية، الربح والخسارة، ونسبة كل شركة من المحفظة.",
        "Portfolio"
      )}

      ${WCUI.heroCard({
        tag: "Portfolio Value",
        title: WCUtils.money(totalValue),
        desc: "إجمالي قيمة المحفظة الحالية",
        value: `${profit >= 0 ? "+" : ""}${WCUtils.money(profit)}`,
        sub: `العائد: ${WCUtils.percent(profitPct)}`
      })}

      ${WCUI.statGrid([
        { icon: "💵", label: "إجمالي التكلفة", value: WCUtils.money(totalCost) },
        { icon: "📈", label: "القيمة الحالية", value: WCUtils.money(totalValue) },
        { icon: profit >= 0 ? "🟢" : "🔴", label: "الربح / الخسارة", value: WCUtils.money(profit), type: profit >= 0 ? "success" : "danger" },
        { icon: "🏢", label: "عدد الشركات", value: list.length }
      ])}

      ${WCUI.formCard(
        "➕ إضافة سهم",
        [
          WCUI.input("pName", "اسم الشركة مثال: ADIB"),
          WCUI.input("pSymbol", "الرمز مثال: ADIB"),
          WCUI.input("pSector", "القطاع مثال: بنوك"),
          WCUI.input("pQty", "الكمية", "number"),
          WCUI.input("pAvg", "متوسط الشراء", "number", "0.001"),
          WCUI.input("pPrice", "السعر الحالي", "number", "0.001")
        ],
        "حفظ السهم",
        "PWC_Portfolio.add()"
      )}

      <section class="tableCard">
        <h3>قائمة الأسهم</h3>
        ${renderList(list, totalValue)}
      </section>

      ${WCUI.decision(portfolioInsight(list, totalValue))}
    `;
  }

  function renderList(list, totalValue) {
    if (!list.length) {
      return `
        <div class="emptyState inner">
          <h3>لا توجد أسهم حالياً</h3>
          <p>أضف أول سهم عشان يبدأ التحليل.</p>
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
  }

  function remove(id) {
    if (!confirm("حذف السهم من المحفظة؟")) return;

    WCStore.update(data => {
      data.portfolio = data.portfolio.filter(x => x.id !== id);
    });
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