/* ==========================================================
   Personal Wealth Center
   Utilities
   Version: 1.0.0
========================================================== */

"use strict";

const WCUtils = (() => {

    const num = (v, d = 0) => {
        v = Number(v);
        return isNaN(v) ? d : v;
    };

    const round = (v, p = 2) => {
        return Number(num(v).toFixed(p));
    };

    const money = (v) => {
        return new Intl.NumberFormat("en-AE", {
            style: "currency",
            currency: WC_CONFIG.app.currency,
            maximumFractionDigits: 2
        }).format(num(v));
    };

    const integer = (v) => {
        return Math.round(num(v)).toLocaleString("en-US");
    };

    const percent = (v, p = 1) => {
        return `${round(v, p)}%`;
    };

    const today = () => {
        return new Date().toISOString().slice(0, 10);
    };

    const now = () => {
        return Date.now();
    };

    const uid = () => {
        return crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
    };

    const byId = (id) => document.getElementById(id);

    const qs = (s) => document.querySelector(s);

    const qsa = (s) => [...document.querySelectorAll(s)];

    return {

        num,
        round,
        money,
        integer,
        percent,
        today,
        now,
        uid,

        byId,
        qs,
        qsa

    };

})();

window.WCUtils = WCUtils;