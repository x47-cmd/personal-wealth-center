/* ==========================================================
   Personal Wealth Center
   App Core
   Version: 1.0.0
========================================================== */

"use strict";

const WC = (() => {

    const VERSION = "1.0.0";

    function init() {

        console.log(
            "%cPersonal Wealth Center",
            "color:#d4af37;font-size:18px;font-weight:bold;"
        );

        console.log("Version:", VERSION);

        bindNavigation();

        window.dispatchEvent(new Event("wealth-ready"));

    }

    function bindNavigation() {

        document.querySelectorAll(".navBtn").forEach(btn => {

            btn.addEventListener("click", () => {

                document
                    .querySelectorAll(".navBtn")
                    .forEach(x => x.classList.remove("active"));

                btn.classList.add("active");

            });

        });

    }

    function go(page, button = null) {

        document.querySelectorAll(".page").forEach(p => {

            p.classList.remove("active");

        });

        const target = document.getElementById(page);

        if (target)
            target.classList.add("active");

        if (button) {

            document.querySelectorAll(".navBtn").forEach(x => {

                x.classList.remove("active");

            });

            button.classList.add("active");

        }

        window.dispatchEvent(

            new CustomEvent("pageChanged", {

                detail: {

                    page

                }

            })

        );

    }

    return {

        VERSION,

        init,

        go

    };

})();

document.addEventListener("DOMContentLoaded", WC.init);