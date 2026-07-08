/* ==========================================================
   Personal Wealth Center App Controller
   Version: 1.1.0
========================================================== */
"use strict";

const WC = (() => {
  function go(pageId, btn) {
    document.querySelectorAll(".page").forEach(page => {
      page.classList.remove("active", "on");
    });

    const page = document.getElementById(pageId);
    if (page) {
      page.classList.add("active", "on");
    }

    document.querySelectorAll(".navBtn").forEach(b => {
      b.classList.remove("active");
    });

    if (btn) {
      btn.classList.add("active");
    } else {
      const found = document.querySelector(`.navBtn[data-page="${pageId}"]`);
      if (found) found.classList.add("active");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    WCEvents.emit("pageChanged", { page: pageId });
  }

  function init() {
    const data = WCStore.get();
    WCStore.save(data, false);

    const activeBtn = document.querySelector(".navBtn.active");
    const activePage = activeBtn ? activeBtn.dataset.page : "home";

    go(activePage || "home", activeBtn);
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    go,
    init
  };
})();

window.WC = WC;