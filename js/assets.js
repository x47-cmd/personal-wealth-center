/* ==========================================================
   Personal Wealth Center
   Assets Page
   Version: 1.1.0
========================================================== */

"use strict";

(function () {

  const page = document.getElementById("assets");
  if (!page) return;

  function render() {
    const data = WCStore.get();

    const assets = data.assets || [];
    const liabilities = data.liabilities || [];

    const totalAssets = assets.reduce((s, x) => s + WCUtils.num(x.value), 0);
    const totalLiabilities = liabilities.reduce((s, x) => s + WCUtils.num(x.balance), 0);
    const net = totalAssets - totalLiabilities;

    page.innerHTML = `
      ${WCUI.pageHero(
        "الأصول والالتزامات",
        "هنا تجمع كل ما تملك وكل ما عليك حتى تعرف صافي ثروتك الحقيقي.",
        "Net Worth"
      )}

      ${WCUI.heroCard({
        tag: "Net Worth",
        title: WCUtils.money(net),
        desc: "صافي الأصول بعد خصم الالتزامات",
        value: WCUtils.money(totalAssets),
        sub: "إجمالي الأصول"
      })}

      ${WCUI.statGrid([
        { icon: "🏦", label: "الأصول", value: WCUtils.money(totalAssets) },
        { icon: "💳", label: "الالتزامات", value: WCUtils.money(totalLiabilities), type: "danger" },
        { icon: "💎", label: "الصافي", value: WCUtils.money(net), type: "gold" },
        { icon: "📦", label: "عدد الأصول", value: assets.length }
      ])}

      ${WCUI.formCard(
        "➕ إضافة أصل",
        [
          WCUI.input("aName", "اسم الأصل مثال: كاش / سندات وطنية"),
          WCUI.input("aType", "النوع مثال: Cash / Bonds / Real Estate"),
          WCUI.input("aValue", "القيمة", "number", "0.01"),
          WCUI.input("aNote", "ملاحظة اختيارية")
        ],
        "حفظ الأصل",
        "PWC_Assets.addAsset()"
      )}

      ${WCUI.formCard(
        "➕ إضافة التزام",
        [
          WCUI.input("lName", "اسم الالتزام مثال: قرض شخصي"),
          WCUI.input("lType", "النوع مثال: Loan / Card"),
          WCUI.input("lBalance", "الرصيد المتبقي", "number", "0.01"),
          WCUI.input("lMonthly", "القسط الشهري", "number", "0.01")
        ],
        "حفظ الالتزام",
        "PWC_Assets.addLiability()"
      )}

      <section class="tableCard">
        <h3>قائمة الأصول</h3>
        ${renderAssets(assets)}
      </section>

      <section class="tableCard">
        <h3>قائمة الالتزامات</h3>
        ${renderLiabilities(liabilities)}
      </section>

      ${WCUI.decision(assetInsight(totalAssets, totalLiabilities, net))}
    `;
  }

  function renderAssets(list) {
    if (!list.length) {
      return `<div class="emptyState inner"><h3>لا توجد أصول</h3><p>أضف أول أصل حتى يبدأ حساب صافي الثروة.</p></div>`;
    }

    return `
      <div class="stockList">
        ${list.map(x => `
          <div class="stockItem">
            <div>
              <strong>${x.name}</strong>
              <small>${x.type || "Asset"}</small>
            </div>
            <div>
              <b>${WCUtils.money(x.value)}</b>
              <small>${x.note || "أصل مسجل"}</small>
            </div>
            <div>
              <small>التاريخ</small>
              <b>${x.createdAt || "-"}</b>
            </div>
            <button class="miniBtn dangerBtn" onclick="PWC_Assets.removeAsset('${x.id}')">حذف</button>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderLiabilities(list) {
    if (!list.length) {
      return `<div class="emptyState inner"><h3>لا توجد التزامات</h3><p>أضف القروض أو البطاقات حتى تظهر الصورة المالية الحقيقية.</p></div>`;
    }

    return `
      <div class="stockList">
        ${list.map(x => `
          <div class="stockItem">
            <div>
              <strong>${x.name}</strong>
              <small>${x.type || "Liability"}</small>
            </div>
            <div>
              <b>${WCUtils.money(x.balance)}</b>
              <small>قسط شهري: ${WCUtils.money(x.monthly)}</small>
            </div>
            <div>
              <small>التاريخ</small>
              <b>${x.createdAt || "-"}</b>
            </div>
            <button class="miniBtn dangerBtn" onclick="PWC_Assets.removeLiability('${x.id}')">حذف</button>
          </div>
        `).join("")}
      </div>
    `;
  }

  function addAsset() {
    const name = WCUtils.byId("aName").value.trim();
    const type = WCUtils.byId("aType").value.trim();
    const value = WCUtils.num(WCUtils.byId("aValue").value);
    const note = WCUtils.byId("aNote").value.trim();

    if (!name || value <= 0) {
      alert("دخل اسم الأصل والقيمة.");
      return;
    }

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
    const name = WCUtils.byId("lName").value.trim();
    const type = WCUtils.byId("lType").value.trim();
    const balance = WCUtils.num(WCUtils.byId("lBalance").value);
    const monthly = WCUtils.num(WCUtils.byId("lMonthly").value);

    if (!name || balance <= 0) {
      alert("دخل اسم الالتزام والرصيد المتبقي.");
      return;
    }

    WCStore.update(data => {
      data.liabilities.push({
        id: WCUtils.uid(),
        name,
        type,
        balance,
        monthly,
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

  function assetInsight(assets, liabilities, net) {
    if (assets <= 0 && liabilities <= 0) return "ابدأ بإضافة الأصول والالتزامات حتى تظهر الصورة المالية الحقيقية.";
    if (liabilities > assets) return "الالتزامات أعلى من الأصول. الأولوية الحالية هي خفض الدين وزيادة الأصول السائلة.";
    if (net > 0 && liabilities > 0) return "صافي الثروة إيجابي، لكن تابع نسبة الدين حتى لا تضغط على نمو الثروة.";
    return "وضع الأصول جيد كبداية. استمر في تحديث القيم بشكل شهري.";
  }

  window.PWC_Assets = {
    addAsset,
    addLiability,
    removeAsset,
    removeLiability
  };

  WCEvents.on("dataChanged", render);
  document.addEventListener("DOMContentLoaded", render);

})();