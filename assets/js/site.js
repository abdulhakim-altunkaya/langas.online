// Langas website: menu, visit log, contact / delete forms, invite page.
(function () {
  "use strict";

  var API = "/api"; // Netlify proxies /api/* to https://www.eumaps.org/api/langas-web/*
  var PLAY = "https://play.google.com/store/apps/details?id=com.langas.app";

  // ── Mobile menu ──────────────────────────────────────────────────
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ── Footer year ──────────────────────────────────────────────────
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  // ── Visit log (no cookies; skipped when "Do Not Track" is on) ─────
  try {
    if (navigator.doNotTrack !== "1" && window.doNotTrack !== "1") {
      fetch(API + "/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: location.pathname, referrer: document.referrer || "" }),
        keepalive: true
      }).catch(function () {});
    }
  } catch (e) { /* never break the page */ }

  // ── Forms (contact, delete account) ──────────────────────────────
  function post(path, data) {
    return fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) {
      return r.json().catch(function () { return { resStatus: false, resMessage: "Server error" }; });
    });
  }

  function wireForm(form, path, okText) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      button.disabled = true;
      status.className = "form-status";
      status.textContent = "Sending...";
      post(path, data)
        .then(function (res) {
          if (res && res.resStatus) {
            status.className = "form-status ok";
            status.textContent = okText;
            form.reset();
            updateCounts();
          } else {
            status.className = "form-status err";
            status.textContent = (res && res.resMessage) || "Something went wrong. Please try again.";
          }
        })
        .catch(function () {
          status.className = "form-status err";
          status.textContent = "Couldn't reach the server. Check your connection and try again.";
        })
        .then(function () { button.disabled = false; });
    });
  }

  function updateCounts() {
    document.querySelectorAll("[data-count-for]").forEach(function (c) {
      var field = document.getElementById(c.getAttribute("data-count-for"));
      if (field) c.textContent = field.value.length + " / " + field.maxLength;
    });
  }
  document.querySelectorAll("textarea[maxlength]").forEach(function (t) {
    t.addEventListener("input", updateCounts);
  });
  updateCounts();

  var contact = document.getElementById("contact-form");
  if (contact) wireForm(contact, "/contact", "Thank you! Your message was sent. We usually reply within a few days.");

  var del = document.getElementById("delete-form");
  if (del) wireForm(del, "/delete-request", "Request received. We'll delete your account and data within 30 days and confirm by email.");


  // ── Invite page: /u/123 (no player data shown; the app opens the profile) ──
  var invite = document.getElementById("invite");
  if (invite) {
    var m = location.pathname.match(/^\/u\/(\d{1,12})\/?$/);
    var id = m ? m[1] : null;
    var getBtn = document.getElementById("invite-get");
    var openBtn = document.getElementById("invite-open");
    if (getBtn) getBtn.href = PLAY + (id ? "&referrer=" + encodeURIComponent("utm_source=invite&utm_content=u" + id) : "");
    // Android with Langas installed: open the app on the friend's profile
    if (openBtn && id && /Android/i.test(navigator.userAgent)) {
      openBtn.href = "intent://langas.online/u/" + id +
        "#Intent;scheme=https;package=com.langas.app;S.browser_fallback_url=" +
        encodeURIComponent(PLAY) + ";end";
      openBtn.hidden = false;
    }
  }
})();
