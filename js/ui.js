/* ==========================================================
   Personal Wealth Center
   UI Components System
   Version: 1.0.0
========================================================== */

"use strict";

const WCUI = (() => {

  function badge(text) {
    return `<span class="badge">${text}</span>`;
  }

  function pageHero(title, desc, tag = "Wealth Center") {
    return `
      <section class="pageHero">
        ${badge(tag)}
        <h2>${title}</h2>
        <p>${desc}</p>
      </section>
    `;
  }

  function heroCard({ tag, title, desc, value, sub }) {
    return `
      <section class="heroCard">
        <div class="heroTop">
          ${badge(tag || "Overview")}
          <span class="version">V${WC_CONFIG.app.version}</span>
        </div>
        <h2>${title}</h2>
        <p>${desc || ""}</p>
        <div class="heroValue">${value || ""}</div>
        <small>${sub || ""}</small>
      </section>
    `;
  }

  function statCard({ icon, label, value, type = "" }) {
    return `
      <div class="statCard ${type}">
        <span>${icon || "•"}</span>
        <small>${label}</small>
        <strong>${value}</strong>
      </div>
    `;
  }

  function statGrid(items = []) {
    return `
      <section class="gridCards">
        ${items.map(statCard).join("")}
      </section>
    `;
  }

  function card(title, body, className = "") {
    return `
      <section class="infoCard ${className}">
        <h3>${title}</h3>
        <div>${body}</div>
      </section>
    `;
  }

  function decision(text) {
    return `
      <section class="decisionCard">
        <h3>💡 التحليل الذكي</h3>
        <p>${text}</p>
      </section>
    `;
  }

  function empty(title, text) {
    return `
      <section class="emptyState">
        <h3>${title}</h3>
        <p>${text}</p>
      </section>
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
        ${step ? `step="${step}"` : ""} 
        placeholder="${placeholder}">
    `;
  }

  function formCard(title, fields, buttonText, action) {
    return `
      <section class="formCard">
        <h3>${title}</h3>
        <div class="formGrid">
          ${fields.join("")}
        </div>
        ${button(buttonText, action)}
      </section>
    `;
  }

  function progress(title, percent, text) {
    const safe = Math.max(0, Math.min(100, WCUtils.num(percent)));

    return `
      <section class="progressCard">
        <div class="progressTop">
          <h3>${title}</h3>
          <strong>${WCUtils.percent(safe)}</strong>
        </div>
        <div class="progressBar">
          <span style="width:${safe}%"></span>
        </div>
        <p>${text || ""}</p>
      </section>
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