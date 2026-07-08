/* ==========================================================
   Personal Wealth Center UI Components System
   Version: 1.2.0
========================================================== */
"use strict";

const WCUI = (() => {
  function badge(text) {
    return `<span class="heroTag">${text || "Wealth Center"}</span>`;
  }

  function pageHero(title, desc, tag = "Wealth Center") {
    return `
      <div class="pageHero">
        ${badge(tag)}
        <h2>${title}</h2>
        <p>${desc || ""}</p>
      </div>
    `;
  }

  function heroCard({ tag, title, desc, value, sub }) {
    return `
      <div class="heroCard">
        <div class="heroTop">
          <span class="heroTag">${tag || "Overview"}</span>
          <span class="version">V${WC_CONFIG.app.version}</span>
        </div>

        <h2>${title || ""}</h2>
        <p>${desc || ""}</p>

        <div class="heroValue">${value || ""}</div>
        <div class="heroSub">${sub || ""}</div>
      </div>
    `;
  }

  function statCard({ icon, label, value, type = "" }) {
    return `
      <div class="statCard ${type}">
        <div class="statIcon">${icon || "•"}</div>
        <div class="statLabel">${label || ""}</div>
        <div class="statValue">${value || ""}</div>
      </div>
    `;
  }

  function statGrid(items = []) {
    return `
      <div class="statGrid">
        ${items.map(statCard).join("")}
      </div>
    `;
  }

  function card(title, body, className = "") {
    return `
      <div class="tableCard ${className}">
        <h3>${title || ""}</h3>
        <div>${body || ""}</div>
      </div>
    `;
  }

  function decision(text) {
    return `
      <div class="decisionCard">
        <h3>💡 التحليل الذكي</h3>
        <p>${text || ""}</p>
      </div>
    `;
  }

  function empty(title, text) {
    return `
      <div class="emptyCard">
        <h3>${title || ""}</h3>
        <p>${text || ""}</p>
      </div>
    `;
  }

  function button(text, action, type = "mainBtn") {
    return `<button class="${type}" onclick="${action}">${text}</button>`;
  }

  function input(id, placeholder, type = "text", step = "") {
    return `
      <input 
        id="${id}" 
        type="${type}" 
        placeholder="${placeholder || ""}" 
        ${step ? `step="${step}"` : ""}
      />
    `;
  }

  function formCard(title, fields, buttonText, action) {
    return `
      <div class="formCard">
        <h3>${title || ""}</h3>
        <div class="formGrid">
          ${fields.join("")}
        </div>
        ${button(buttonText, action)}
      </div>
    `;
  }

  function progress(title, percent, text) {
    const safe = Math.max(0, Math.min(100, WCUtils.num(percent)));

    return `
      <div class="progressCard">
        <div class="progressTop">
          <h3>${title || ""}</h3>
          <div class="progressPercent">${WCUtils.percent(safe)}</div>
        </div>

        <div class="progressBar">
          <div class="progressFill" style="width:${safe}%"></div>
        </div>

        <p>${text || ""}</p>
      </div>
    `;
  }

  return {
    badge,
    pageHero,
    heroCard,
    statCard,
    statGrid,
    card,
    decision,
    empty,
    button,
    input,
    formCard,
    progress
  };
})();

window.WCUI = WCUI;