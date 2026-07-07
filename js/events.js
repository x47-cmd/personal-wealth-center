/* ==========================================================
   Personal Wealth Center
   Event Bus
   Version: 1.0.0
========================================================== */

"use strict";

const WCEvents = (() => {

  const emit = (name, detail = {}) => {
    window.dispatchEvent(
      new CustomEvent(`wc:${name}`, { detail })
    );
  };

  const on = (name, callback) => {
    window.addEventListener(`wc:${name}`, callback);
  };

  const off = (name, callback) => {
    window.removeEventListener(`wc:${name}`, callback);
  };

  return {
    emit,
    on,
    off
  };

})();

window.WCEvents = WCEvents;