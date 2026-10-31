// Langas website: menu, visit log, contact / delete forms, invite page.
(function () {
  "use strict";

  var API = "https://www.eumaps.org/api/langas-web";
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

  // ── Invite page: /u/123 ──────────────────────────────────────────
  var invite = document.getElementById("invite");
  if (invite) {
    var m = location.pathname.match(/^\/u\/(\d{1,12})\/?$/);
    var id = m ? m[1] : null;
    var nameEl = document.getElementById("invite-name");
    var subEl = document.getElementById("invite-sub");
    var avEl = document.getElementById("invite-avatar");
    var statsEl = document.getElementById("invite-stats");
    var openBtn = document.getElementById("invite-open");
    var getBtn = document.getElementById("invite-get");

    if (getBtn) getBtn.href = PLAY + (id ? "&referrer=" + encodeURIComponent("utm_source=invite&utm_content=u" + id) : "");

    if (!id) {
      nameEl.textContent = "Invite not found";
      subEl.textContent = "This link looks broken. You can still get Langas below.";
      if (openBtn) openBtn.style.display = "none";
      var txt = document.getElementById("invite-text");
      if (txt) txt.style.display = "none";
      return;
    }

    // Opens the app on this player's profile when it's installed; otherwise Google Play.
    if (openBtn) {
      openBtn.href = "intent://langas.online/u/" + id +
        "#Intent;scheme=https;package=com.langas.app;S.browser_fallback_url=" +
        encodeURIComponent(PLAY) + ";end";
      if (!/Android/i.test(navigator.userAgent)) openBtn.style.display = "none";
    }

    fetch(API + "/u/" + id)
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.resStatus || !res.player) throw new Error("not found");
        var p = res.player;
        nameEl.textContent = p.name || "A Langas player";
        document.title = (p.name || "A friend") + " invites you to Langas";
        subEl.textContent = p.levelCode ? (p.levelCode + " · " + (p.levelTitle || "")).toUpperCase() : "LEARNING LATVIAN";
        avEl.textContent = (p.name || "?").charAt(0).toUpperCase();
        if (p.avatarUrl) {
          var img = new Image();
          img.alt = "";
          img.onload = function () { avEl.textContent = ""; avEl.appendChild(img); };
          img.src = p.avatarUrl;
        }
        if (statsEl) {
          statsEl.innerHTML = "";
          [["CROWNS", p.crowns], ["STREAK", p.streak], ["POINTS", p.points]].forEach(function (s) {
            if (typeof s[1] !== "number") return;
            var d = document.createElement("div");
            d.textContent = s[1].toLocaleString("en");
            var sm = document.createElement("small");
            sm.textContent = s[0];
            d.appendChild(sm);
            statsEl.appendChild(d);
          });
        }
      })
      .catch(function () {
        nameEl.textContent = "Join me on Langas";
        subEl.textContent = "LEARN LATVIAN TOGETHER";
      });
  }
})();
