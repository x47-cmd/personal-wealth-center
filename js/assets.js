/* ==========================================================
   Personal Wealth Center Wealth Center
   الأصول + الالتزامات + صافي الثروة
========================================================== */
"use strict";

(function () {
  const page = document.getElementById("assets");
  if (!page) return;

  function calc(data) {
    const assets = data.assets || [];
    const liabilities = data.liabilities || [];

    const totalAssets = assets.reduce((s, x) => s + WCUtils.num(x.value), 0);
    const totalLiabilities = liabilities.reduce((s, x) => s + WCUtils.num(x.balance || x.amount), 0);
    const netWorth = totalAssets - totalLiabilities;

    return { assets, liabilities, totalAssets, totalLiabilities, netWorth };
  }

  function render() {
    const data = WCStore.get();
    const c = calc(data);

    page.innerHTML = `
      ${WCUI.pageHero(
        "الثروة",
        "هنا تجمع كل ما تملك وكل ما عليك حتى تعرف صافي ثروتك الحقيقي.",
        "Net Worth"
      )}

      ${WCUI.heroCard({
        tag: "Net Worth",
        title: WCUtils.money(c.netWorth),
        desc: "صافي الأصول بعد خصم الالتزامات",
        value: WCUtils.money(c.totalAssets),
        sub: "إجمالي الأصول"
      })}

      ${WCUI.statGrid([
        { icon: "🏦", label: "الأصول", value: WCUtils.money(c.totalAssets) },
        { icon: "💳", label: "الالتزامات", value: WCUtils.money(c.totalLiabilities), type: "danger" },
        { icon: "💎", label: "الصافي", value: WCUtils.money(c.netWorth), type: "gold" },
        { icon: "📦", label: "عدد الأصول", value: String(c.assets.length) }
      ])}

      ${assetForm()}
      ${liabilityForm()}
      ${assetList(c)}
      ${liabilityList(c)}
      ${WCUI.decision(wealthInsight(c))}
    `;
  }

  function assetForm() {
    return `
      <div class="formCard">
        <h3>➕ إضافة أصل</h3>
        <div class="formGrid">
          <input id="asName" placeholder="اسم الأصل مثال: كاش / سندات وطنية">
          <input id="asType" placeholder="النوع مثال: Cash / Bonds / Real Estate">
          <input id="asValue" type="number" step="0.01" placeholder="القيمة">
          <input id="asNote" placeholder="ملاحظة اختيارية">
        </div>
        <button class="mainBtn" onclick="PWC_Wealth.addAsset()">حفظ الأصل</button>
      </div>
    `;
  }

  function liabilityForm() {
    return `
      <div class="formCard">
        <h3>➕ إضافة التزام</h3>
        <div class="formGrid">
          <input id="liName" placeholder="اسم الالتزام مثال: قرض شخصي">
          <input id="liType" placeholder="النوع مثال: Loan / Card">
          <input id="liBalance" type="number" step="0.01" placeholder="الرصيد المتبقي">
          <input id="liPayment" type="number" step="0.01" placeholder="القسط الشهري">
        </div>
        <button class="mainBtn" onclick="PWC_Wealth.addLiability()">حفظ الالتزام</button>
      </div>
    `;
  }

  function assetList(c) {
    if (!c.assets.length) {
      return WCUI.empty("قائمة الأصول", "لا توجد أصول. أضف أول أصل حتى يبدأ حساب صافي الثروة.");
    }

    return `
      <div class="tableCard">
        <h3>💎 قائمة الأصول</h3>
        <div class="stockList">
          ${c.assets.map(x => `
            <div class="stockItem">
              <strong>${x.name || "أصل"}</strong>
              <small>${x.type || "غير مصنف"} • ${x.note || ""}</small>
              <b>${WCUtils.money(x.value)}</b>
              <button class="miniBtn dangerBtn" onclick="PWC_Wealth.removeAsset('${x.id}')">حذف</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function liabilityList(c) {
    if (!c.liabilities.length) {
      return WCUI.empty("قائمة الالتزامات", "لا توجد التزامات. أضف القروض أو البطاقات حتى تظهر الصورة المالية الحقيقية.");
    }

    return `
      <div class="tableCard">
        <h3>💳 قائمة الالتزامات</h3>
        <div class="stockList">
          ${c.liabilities.map(x => `
            <div class="stockItem">
              <strong>${x.name || "التزام"}</strong>
              <small>${x.type || "غير مصنف"} • قسط ${WCUtils.money(x.payment)}</small>
              <b>${WCUtils.money(x.balance)}</b>
              <button class="miniBtn dangerBtn" onclick="PWC_Wealth.removeLiability('${x.id}')">حذف</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function wealthInsight(c) {
    if (!c.assets.length && !c.liabilities.length) return "ابدأ بإضافة الأصول والالتزامات حتى تظهر الصورة المالية الحقيقية.";
    if (c.netWorth < 0) return "صافي الثروة سلبي. الأولوية الحالية هي تخفيض الالتزامات وزيادة الكاش.";
    if (c.totalLiabilities > c.totalAssets * 0.5) return "الالتزامات مرتفعة مقارنة بالأصول. راقب الديون قبل زيادة المخاطرة.";
    return "صافي الثروة إيجابي. استمر بتحديث الأصول والالتزامات بشكل شهري.";
  }

  function addAsset() {
    const name = WCUtils.byId("asName").value.trim();
    const type = WCUtils.byId("asType").value.trim();
    const value = WCUtils.num(WCUtils.byId("asValue").value);
    const note = WCUtils.byId("asNote").value.trim();

    if (!name) return alert("دخل اسم الأصل.");
    if (value <= 0) return alert("دخل قيمة الأصل.");

    WCStore.update(data => {
      data.assets.push({
        id: WCUtils.uid(),
        name,
        type,
        value,
        note,
        createdAt: WCUtils.today()
      });
    });
  }

  function addLiability() {
    const name = WCUtils.byId("liName").value.trim();
    const type = WCUtils.byId("liType").value.trim();
    const balance = WCUtils.num(WCUtils.byId("liBalance").value);
    const payment = WCUtils.num(WCUtils.byId("liPayment").value);

    if (!name) return alert("دخل اسم الالتزام.");
    if (balance <= 0) return alert("دخل الرصيد المتبقي.");

    WCStore.update(data => {
      data.liabilities.push({
        id: WCUtils.uid(),
        name,
        type,
        balance,
        payment,
        createdAt: WCUtils.today()
      });
    });
  }

  function removeAsset(id) {
    if (!confirm("حذف الأصل؟")) return;
    WCStore.update(data => {
      data.assets = data.assets.filter(x => x.id !== id);
    });
  }

  function removeLiability(id) {
    if (!confirm("حذف الالتزام؟")) return;
    WCStore.update(data => {
      data.liabilities = data.liabilities.filter(x => x.id !== id);
    });
  }

  window.PWC_Wealth = { addAsset, addLiability, removeAsset, removeLiability };

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);
})();