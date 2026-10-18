/* DOGM.AI — site runtime
   Loads /data/*.json, injects chrome (nav + footer), and powers
   the ambient layer: chart-wheel canvas, seal, reveals, counters. */

(function () {
  "use strict";

  const ROOT = document.body.dataset.root || ".";
  const cache = {};

  async function load(file) {
    if (cache[file]) return cache[file];
    const res = await fetch(`${ROOT}/data/${file}`);
    if (!res.ok) throw new Error(`Failed to load ${file}`);
    cache[file] = await res.json();
    return cache[file];
  }

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- chrome ---------- */

  function href(path) {
    return path.startsWith("http") || path.startsWith("mailto:") ? path : `${ROOT}/${path}`;
  }

  function buildHeader(site) {
    const here = document.body.dataset.page || "";
    const groups = site.nav.groups
      .map(
        (g) => `
      <div class="nav-group">
        <button type="button" aria-expanded="false">${esc(g.label)} <span class="caret">▾</span></button>
        <div class="nav-drop" role="menu">
          ${g.items
            .map(
              (i) => `<a role="menuitem" href="${href(i.href)}"><span class="t">${esc(i.label)}</span><span class="d">${esc(i.desc)}</span></a>`
            )
            .join("")}
        </div>
      </div>`
      )
      .join("");

    const links = site.nav.links
      .map(
        (l) =>
          `<a href="${href(l.href)}"${here === l.id ? ' aria-current="page"' : ""}>${esc(l.label)}</a>`
      )
      .join("");

    const header = el(`
      <header class="site-header">
        <div class="bar">
          <a class="wordmark" href="${href("index.html")}" aria-label="DOGM.AI — home">DOGM<span class="tld">.AI</span></a>
          <nav class="nav-desktop" aria-label="Primary">${groups}${links}</nav>
          <div class="nav-cta">
            <a class="btn btn--sm" href="${href(site.nav.cta.href)}">${esc(site.nav.cta.label)}</a>
            <button class="nav-burger" aria-expanded="false" aria-controls="nav-mobile" aria-label="Menu">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>`);

    const mob = el(`
      <nav class="nav-mobile" id="nav-mobile" aria-label="Mobile">
        ${site.nav.groups
          .map(
            (g) => `
          <div class="grp">
            <div class="lbl">${esc(g.label)}</div>
            ${g.items.map((i) => `<a href="${href(i.href)}">${esc(i.label)}</a>`).join("")}
          </div>`
          )
          .join("")}
        <div class="grp">
          <div class="lbl">Company</div>
          ${site.nav.links.map((l) => `<a href="${href(l.href)}">${esc(l.label)}</a>`).join("")}
        </div>
        <div class="cta-row"><a class="btn" href="${href(site.nav.cta.href)}">${esc(site.nav.cta.label)}</a></div>
      </nav>`);

    document.body.prepend(mob);
    document.body.prepend(header);

    /* dropdowns */
    header.querySelectorAll(".nav-group").forEach((grp) => {
      const btn = grp.querySelector("button");
      const open = (v) => {
        if (v) { grp.setAttribute("data-open", ""); btn.setAttribute("aria-expanded", "true"); }
        else { grp.removeAttribute("data-open"); btn.setAttribute("aria-expanded", "false"); }
      };
      btn.addEventListener("click", () => open(!grp.hasAttribute("data-open")));
      grp.addEventListener("mouseenter", () => open(true));
      grp.addEventListener("mouseleave", () => open(false));
      grp.addEventListener("focusout", (e) => { if (!grp.contains(e.relatedTarget)) open(false); });
    });
    document.addEventListener("click", (e) => {
      header.querySelectorAll(".nav-group[data-open]").forEach((grp) => {
        if (!grp.contains(e.target)) {
          grp.removeAttribute("data-open");
          grp.querySelector("button").setAttribute("aria-expanded", "false");
        }
      });
    });

    /* burger */
    const burger = header.querySelector(".nav-burger");
    burger.addEventListener("click", () => {
      const on = mob.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(on));
      document.body.style.overflow = on ? "hidden" : "";
    });
  }

  function buildFooter(site) {
    const cols = site.footer.columns
      .map(
        (c) => `
      <div class="col">
        <h4>${esc(c.label)}</h4>
        ${c.items.map((i) => `<a href="${href(i.href)}">${esc(i.label)}</a>`).join("")}
      </div>`
      )
      .join("");

    const footer = el(`
      <footer class="site-footer">
        <div class="container">
          <div class="top">
            <div>
              <p class="sig">${site.footer.signoff}</p>
              <p class="mini">${esc(site.footer.mini)}</p>
              <p class="mini" style="margin-top:0.8rem"><a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a></p>
            </div>
            ${cols}
          </div>
          <div class="base">
            <span>© <span data-year></span> ${esc(site.legalName)} · ${esc(site.footer.tagline)}</span>
            <span>${site.footer.baseLinks.map((l) => `<a href="${href(l.href)}">${esc(l.label)}</a>`).join(" · ")}</span>
          </div>
        </div>
      </footer>`);
    document.body.appendChild(footer);
    footer.querySelector("[data-year]").textContent = new Date().getFullYear();
  }

  /* ---------- ambient: reveals, counters, tooltip ---------- */

  function initReveal() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".rv").forEach((n) => n.classList.add("in"));
      document.querySelectorAll(".bar[data-w]").forEach((b) => { b.style.width = b.dataset.w; });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );
    document.querySelectorAll(".rv").forEach((n) => io.observe(n));

    /* animate bars when their figure scrolls in */
    const bio = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.querySelectorAll(".bar[data-w]").forEach((b) => { b.style.width = b.dataset.w; });
          bio.unobserve(e.target);
        }),
      { threshold: 0.25 }
    );
    document.querySelectorAll(".fig, .tiles").forEach((n) => bio.observe(n));

    window.addEventListener("beforeprint", () => {
      document.querySelectorAll(".rv").forEach((n) => n.classList.add("in"));
      document.querySelectorAll(".bar[data-w]").forEach((b) => { b.style.transition = "none"; b.style.width = b.dataset.w; });
    });
  }

  function initCounters() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const n = e.target;
          io.unobserve(n);
          const to = parseFloat(n.dataset.count);
          const dec = (n.dataset.count.split(".")[1] || "").length;
          const fmt = (v) => (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US"));
          if (reduce) { n.textContent = fmt(to); return; }
          const t0 = performance.now();
          const dur = 1400;
          (function tick(t) {
            const p = Math.min(1, (t - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            n.textContent = fmt(to * eased);
            if (p < 1) requestAnimationFrame(tick);
          })(t0);
        }),
      { threshold: 0.6 }
    );
    document.querySelectorAll("[data-count]").forEach((n) => io.observe(n));
  }

  function initTooltip() {
    const tt = el('<div id="tt" role="status" aria-hidden="true"></div>');
    document.body.appendChild(tt);
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("[data-tip]");
      if (!t) return;
      tt.innerHTML = t.dataset.tipKey
        ? `<span class="tt-k">${esc(t.dataset.tipKey)}</span>${esc(t.dataset.tip)}`
        : esc(t.dataset.tip);
      tt.classList.add("show");
    });
    document.addEventListener("mousemove", (e) => {
      if (!tt.classList.contains("show")) return;
      const pad = 14;
      let x = e.clientX + pad, y = e.clientY + pad;
      const r = tt.getBoundingClientRect();
      if (x + r.width > innerWidth - 8) x = e.clientX - r.width - pad;
      if (y + r.height > innerHeight - 8) y = e.clientY - r.height - pad;
      tt.style.left = x + "px";
      tt.style.top = y + "px";
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest && e.target.closest("[data-tip]")) tt.classList.remove("show");
    });
  }

  /* ---------- ambient art ---------- */

  /* The chart wheel: an astrological natal wheel drawn as a technical
     instrument — concentric rings, 360 degree ticks, sign glyphs, and a
     slowly precessing outer ring. */
  function initWheel() {
    const host = document.querySelector("[data-wheel]");
    if (!host) return;
    const canvas = document.createElement("canvas");
    host.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const GOLD = "210,164,76";
    const BONE = "237,232,220";
    const SIGNS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎︎", "♏", "♐", "♑", "♒", "♓"];
    const PLANETS = [
      { g: "☉", a: 12 }, { g: "☽", a: 118 }, { g: "☿", a: 47 }, { g: "♀", a: 205 },
      { g: "♂", a: 251 }, { g: "♃", a: 298 }, { g: "♄", a: 336 }
    ];
    let raf, rot = 0;

    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = host.clientWidth;
      canvas.width = w * dpr;
      canvas.height = w * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      const w = host.clientWidth, c = w / 2, R = w / 2 - 6;
      ctx.clearRect(0, 0, w, w);

      const ring = (r, alpha, lw) => {
        ctx.beginPath();
        ctx.arc(c, c, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${GOLD},${alpha})`;
        ctx.lineWidth = lw || 1;
        ctx.stroke();
      };

      ring(R, 0.55, 1.2);
      ring(R * 0.86, 0.4);
      ring(R * 0.62, 0.3);
      ring(R * 0.34, 0.25);
      ring(R * 0.08, 0.5);

      /* degree ticks on the precessing outer band */
      for (let d = 0; d < 360; d += 2) {
        const a = ((d + rot) * Math.PI) / 180;
        const major = d % 30 === 0, mid = d % 10 === 0;
        const len = major ? 14 : mid ? 8 : 4;
        const r1 = R - 2, r0 = r1 - len;
        ctx.beginPath();
        ctx.moveTo(c + r0 * Math.cos(a), c + r0 * Math.sin(a));
        ctx.lineTo(c + r1 * Math.cos(a), c + r1 * Math.sin(a));
        ctx.strokeStyle = `rgba(${GOLD},${major ? 0.7 : mid ? 0.45 : 0.22})`;
        ctx.lineWidth = major ? 1.2 : 0.7;
        ctx.stroke();
      }

      /* house spokes */
      for (let h = 0; h < 12; h++) {
        const a = ((h * 30 + rot) * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(c + R * 0.34 * Math.cos(a), c + R * 0.34 * Math.sin(a));
        ctx.lineTo(c + R * 0.86 * Math.cos(a), c + R * 0.86 * Math.sin(a));
        ctx.strokeStyle = `rgba(${BONE},0.10)`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      /* sign glyphs — ︎ forces monochrome text presentation over emoji */
      ctx.font = `${Math.max(13, w * 0.045)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      SIGNS.forEach((g, i) => {
        const a = ((i * 30 + 15 + rot) * Math.PI) / 180;
        const r = R * 0.925;
        ctx.fillStyle = `rgba(${GOLD},0.75)`;
        ctx.fillText(g + "︎", c + r * Math.cos(a), c + r * Math.sin(a));
      });

      /* planet glyphs + aspect lines */
      const pts = PLANETS.map((p) => {
        const a = ((p.a + rot * 0.4) * Math.PI) / 180;
        const r = R * 0.74;
        return { x: c + r * Math.cos(a), y: c + r * Math.sin(a), g: p.g };
      });
      ctx.strokeStyle = `rgba(${GOLD},0.16)`;
      ctx.lineWidth = 0.7;
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          if ((i + j) % 3 !== 0) continue;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      ctx.font = `${Math.max(12, w * 0.04)}px serif`;
      pts.forEach((p) => {
        ctx.fillStyle = "rgba(11,9,18,0.9)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(9, w * 0.03), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${BONE},0.85)`;
        ctx.fillText(p.g + "︎", p.x, p.y + 1);
      });
    }

    function loop() {
      rot += 0.016;
      draw();
      raf = requestAnimationFrame(loop);
    }

    size();
    draw();
    window.addEventListener("resize", () => { size(); draw(); });
    if (!reduce) {
      const io = new IntersectionObserver((e) => {
        if (e[0].isIntersecting) { if (!raf) loop(); }
        else { cancelAnimationFrame(raf); raf = null; }
      });
      io.observe(host);
    }
  }

  /* faint fixed stars behind hero / cta bands */
  function initStars() {
    document.querySelectorAll("[data-stars]").forEach((hostSec) => {
      const c = document.createElement("canvas");
      c.className = "starfield";
      c.setAttribute("aria-hidden", "true");
      hostSec.prepend(c);
      const ctx = c.getContext("2d");
      function paint() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = hostSec.clientWidth, h = hostSec.clientHeight;
        c.width = w * dpr; c.height = h * dpr;
        c.style.width = w + "px"; c.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        /* deterministic scatter so every load matches */
        let seed = 9;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        const n = Math.floor((w * h) / 9000);
        for (let i = 0; i < n; i++) {
          const x = rnd() * w, y = rnd() * h, r = rnd() * 1.1 + 0.2, a = rnd() * 0.5 + 0.08;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(237,232,220,${a * 0.55})`;
          ctx.fill();
        }
      }
      paint();
      window.addEventListener("resize", paint);
    });
  }

  /* rotating attestation seal */
  function buildSeals() {
    document.querySelectorAll("[data-seal]").forEach((host) => {
      const id = "sealPath" + Math.floor(Math.random() * 1e6);
      host.classList.add("seal");
      host.innerHTML = `
      <svg viewBox="0 0 200 200" role="img" aria-label="Attestation seal — read by a human">
        <defs><path id="${id}" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"></path></defs>
        <circle cx="100" cy="100" r="96" fill="rgba(11,9,18,0.88)" stroke="rgba(210,164,76,0.5)" stroke-width="1"></circle>
        <circle cx="100" cy="100" r="58" fill="none" stroke="rgba(210,164,76,0.45)" stroke-width="1"></circle>
        <g class="ring">
          <text fill="#d2a44c" font-family="'IBM Plex Mono', monospace" font-size="12" letter-spacing="3">
            <textPath href="#${id}" textLength="462" lengthAdjust="spacingAndGlyphs">READ BY A HUMAN ✳ ATTESTED ✳ HUMAN ✳ SEALED ✳</textPath>
          </text>
        </g>
        <text x="100" y="94" text-anchor="middle" fill="#ede8dc" font-family="Georgia, serif" font-size="30">✳</text>
        <text x="100" y="124" text-anchor="middle" fill="#d2a44c" font-family="'IBM Plex Mono', monospace" font-size="9" letter-spacing="2">DOGM.AI</text>
      </svg>`;
    });
  }

  /* ---------- data-driven fragments ---------- */

  async function hydrate() {
    const nodes = document.querySelectorAll("[data-json]");
    for (const n of nodes) {
      const [file, key] = n.dataset.json.split("#");
      try {
        const data = await load(file);
        const fn = window.DOGM.renderers[n.dataset.render];
        if (fn) fn(n, key ? data[key] : data);
      } catch (err) {
        console.error(err);
      }
    }
    document.dispatchEvent(new CustomEvent("dogm:hydrated"));
  }

  function fileProtocolNotice() {
    if (location.protocol !== "file:") return;
    const n = el(
      `<div class="notice" role="alert"><strong>Local file mode.</strong> This site loads its content from JSON, which browsers block over <code>file://</code>. From the project folder run <code>python3 -m http.server</code> (or <code>npx serve</code>) and open <code>localhost:8000</code>.</div>`
    );
    document.body.appendChild(n);
  }

  /* ---------- boot ---------- */

  window.DOGM = { load, el, esc, href, renderers: {} };

  document.addEventListener("DOMContentLoaded", async () => {
    fileProtocolNotice();
    try {
      const site = await load("site.json");
      buildHeader(site);
      buildFooter(site);
    } catch (e) {
      console.error("Chrome failed to build:", e);
    }
    buildSeals();
    initWheel();
    initStars();
    initTooltip();
    await hydrate();
    initReveal();
    initCounters();
  });
})();
