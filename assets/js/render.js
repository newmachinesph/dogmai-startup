/* DOGM.AI — data-driven renderers.
   Each renderer hydrates a node marked
   <div data-json="file.json[#key]" data-render="name"></div>
   Chart conventions follow the validated palette in README:
   gold ordinal ramp for magnitude, gold+gray for emphasis,
   direct labels, hover tooltips, and a data-table fallback. */

(function () {
  "use strict";
  const R = (window.DOGM.renderers = window.DOGM.renderers || {});
  const { esc, href } = window.DOGM;

  const RAMP = ["#f3e2bd", "#e3b96a", "#d2a44c", "#b4883a", "#8e6b2a"];
  const GOLD = "#d2a44c";
  const DIM = "#46405a";

  const fmts = {
    pct: (v) => `${v}%`,
    usdB: (v) => (v >= 1 ? `$${v}B` : `$${Math.round(v * 1000)}M`),
    usdM: (v) => `$${v}M`,
    num: (v) => v.toLocaleString("en-US"),
    raw: (v) => String(v),
  };

  /* ---------- stat tiles ---------- */
  R.tiles = function (node, items) {
    node.classList.add("tiles");
    node.innerHTML = items
      .map((t, i) => {
        const spark = t.spark ? sparkline(t.spark) : "";
        const val = t.count != null
          ? `<span data-count="${t.count}">0</span>${t.unit ? `<span class="u">${esc(t.unit)}</span>` : ""}`
          : `${t.prefix ? `<span class="u">${esc(t.prefix)}</span>` : ""}${esc(t.value)}${t.unit ? `<span class="u">${esc(t.unit)}</span>` : ""}`;
        return `<div class="tile rv" style="--d:${i * 0.06}s">
          <div class="v">${val}</div>
          <div class="l">${esc(t.label)}</div>
          ${spark}
          <div class="s">${esc(t.source)}</div>
        </div>`;
      })
      .join("");
  };

  function sparkline(values) {
    const w = 120, h = 30, pad = 2;
    const min = Math.min(...values), max = Math.max(...values);
    const x = (i) => pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = (v) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const lx = x(values.length - 1).toFixed(1), ly = y(values[values.length - 1]).toFixed(1);
    return `<div class="spark"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <polyline points="${pts}" fill="none" stroke="${GOLD}" stroke-width="1.5"></polyline>
      <circle cx="${lx}" cy="${ly}" r="2.5" fill="#efce8a"></circle>
    </svg></div>`;
  }

  /* ---------- horizontal bar figure ---------- */
  R.hbar = function (node, cfg) {
    const fmt = fmts[cfg.fmt || "raw"];
    const max = cfg.max || Math.max(...cfg.items.map((i) => i.value)) * 1.06;
    const color = (item, idx) => {
      if (cfg.mode === "emphasis") return item.emph ? GOLD : DIM;
      if (cfg.mode === "ordinal") return RAMP[Math.min(idx, RAMP.length - 1)];
      return GOLD;
    };
    const rows = cfg.items
      .map((item, idx) => {
        const pct = Math.max(0.5, (item.value / max) * 100);
        const display = item.display || fmt(item.value);
        const inside = pct > 78;
        const tip = item.tip || `${item.label} — ${display}`;
        return `<div class="row">
          <div class="lbl">${esc(item.label)}${item.sub ? `<small>${esc(item.sub)}</small>` : ""}</div>
          <div class="track" data-tip="${esc(tip)}" data-tip-key="${esc(cfg.tipKey || cfg.title)}">
            <div class="bar" data-w="${pct.toFixed(2)}%" style="width:0;background:${color(item, idx)}"></div>
            <span class="val" style="${inside ? `right:calc(${(100 - pct).toFixed(2)}% + 0.6rem);padding-left:0;color:#0b0912;` : `left:${pct.toFixed(2)}%;`}">${esc(display)}</span>
          </div>
        </div>`;
      })
      .join("");

    const table = `<details><summary>View data</summary><table>
      <thead><tr><th scope="col">${esc(cfg.dimLabel || "Category")}</th><th scope="col">${esc(cfg.unitLabel || "Value")}</th></tr></thead>
      <tbody>${cfg.items.map((i) => `<tr><td>${esc(i.label)}</td><td>${esc(i.display || fmt(i.value))}</td></tr>`).join("")}</tbody>
    </table></details>`;

    node.classList.add("fig", "rv");
    node.innerHTML = `
      <div class="fig-head"><h3>${esc(cfg.title)}</h3><span class="src">${esc(cfg.source)}</span></div>
      ${cfg.sub ? `<p class="sub">${esc(cfg.sub)}</p>` : ""}
      <div class="hbar">${rows}</div>
      ${cfg.note ? `<p class="note">${esc(cfg.note)}</p>` : ""}
      ${table}`;
  };

  /* ---------- module / card grids ---------- */
  R.pillars = function (node, items) {
    node.classList.add("grid", "grid--3");
    node.innerHTML = items
      .map(
        (p, i) => `<div class="cell rv" style="--d:${(i % 3) * 0.07}s">
        <div class="glyph" aria-hidden="true">${p.glyph}</div>
        <h3>${esc(p.name)}<span class="idx">0${i + 1}</span></h3>
        <p>${esc(p.blurb)}</p>
        ${p.href ? `<span class="more">${esc(p.linkLabel || "Explore")} →</span><a class="cell-link" href="${href(p.href)}" aria-label="${esc(p.name)}"></a>` : ""}
      </div>`
      )
      .join("");
  };

  R.cells = function (node, items) {
    node.classList.add("grid", "grid--3");
    node.innerHTML = items
      .map(
        (p, i) => `<div class="cell rv" style="--d:${(i % 3) * 0.07}s">
        ${p.glyph ? `<div class="glyph" aria-hidden="true">${p.glyph}</div>` : ""}
        ${p.kicker ? `<p class="eyebrow" style="margin-bottom:0.6rem">${esc(p.kicker)}</p>` : ""}
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.blurb)}</p>
      </div>`
      )
      .join("");
  };

  /* ---------- pricing ---------- */
  R.plans = function (node, data) {
    node.classList.add("plans");
    node.innerHTML = data.tiers
      .map(
        (t, i) => `<div class="plan ${t.highlight ? "plan--hot" : ""} rv" style="--d:${i * 0.08}s">
        <div class="nm">${esc(t.name)}</div>
        <div class="for">${esc(t.audience)}</div>
        <div class="pr"><span class="amt">$${t.price}</span><span class="per">/ MO</span></div>
        <div class="sub">${esc(t.sub)}</div>
        <ul>${t.features.map((f) => `<li${f.startsWith("×") ? ' class="na"' : ""}>${esc(f.replace(/^×\s*/, ""))}</li>`).join("")}</ul>
        <a class="btn ${t.highlight ? "" : "btn--ghost"}" href="${href(t.href)}">${esc(t.cta)}</a>
      </div>`
      )
      .join("");
  };

  R.cmpTable = function (node, data) {
    node.classList.add("cmp-wrap");
    const th = data.columns.map((c) => `<th scope="col">${esc(c)}</th>`).join("");
    const rows = data.rows
      .map((r) => {
        const cells = r.values
          .map((v) => {
            if (v === true) return `<td><span class="yes">✳ Included</span></td>`;
            if (v === false) return `<td><span class="no">—</span></td>`;
            return `<td>${esc(v)}</td>`;
          })
          .join("");
        return `<tr><th scope="row">${esc(r.label)}</th>${cells}</tr>`;
      })
      .join("");
    node.innerHTML = `<table class="cmp"><thead><tr><th scope="col">${esc(data.dim)}</th>${th}</tr></thead><tbody>${rows}</tbody></table>`;
  };

  /* ---------- competitor matrix ---------- */
  R.matrix = function (node, data) {
    node.classList.add("mx-wrap");
    const th = data.columns.map((c) => `<th scope="col">${esc(c)}</th>`).join("");
    const rows = data.rows
      .map(
        (r) => `<tr class="${r.highlight ? "hl" : ""}">
        <th scope="row">${esc(r.name)}<small>${esc(r.type)}</small></th>
        ${r.values.map((v) => `<td>${esc(v)}</td>`).join("")}
      </tr>`
      )
      .join("");
    node.innerHTML = `<table class="mx"><thead><tr><th scope="col">${esc(data.dim)}</th>${th}</tr></thead><tbody>${rows}</tbody></table>`;
  };

  /* ---------- roadmap timeline ---------- */
  R.timeline = function (node, phases) {
    node.classList.add("timeline");
    node.innerHTML = phases
      .map(
        (p) => `<div class="phase rv">
        <div class="when"><div class="yrs">${esc(p.years)}</div><div class="tag">${esc(p.tag)}</div></div>
        <div class="body">
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.body)}</p>
          <ul class="ticks">${p.moves.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
          <div class="marks">
            <span class="pill pill--gold" data-tip="${esc(p.benchmarkTip || "")}" data-tip-key="Benchmark">${esc(p.benchmark)}</span>
            ${p.trigger ? `<span class="pill" data-tip="${esc(p.triggerTip || "")}" data-tip-key="Decision trigger">${esc(p.trigger)}</span>` : ""}
          </div>
        </div>
      </div>`
      )
      .join("");
  };

  /* ---------- FAQ ---------- */
  R.faq = function (node, cats) {
    node.innerHTML = cats
      .map(
        (c) => `<div class="faq-cat rv">
        <h2>${esc(c.category)}</h2>
        ${c.items
          .map(
            (q) => `<details class="qa">
          <summary>${esc(q.q)}<span class="ind" aria-hidden="true">+</span></summary>
          <div class="a">${q.a}</div>
        </details>`
          )
          .join("")}
      </div>`
      )
      .join("");
  };

  /* ---------- quotes ---------- */
  R.quotes = function (node, items) {
    node.classList.add("quotes");
    node.innerHTML = items
      .map(
        (q, i) => `<figure class="quote rv" style="--d:${(i % 3) * 0.08}s">
        <div class="mark" aria-hidden="true">“</div>
        <blockquote>${q.text}</blockquote>
        <figcaption class="who"><b>${esc(q.name)}</b>${esc(q.role)}</figcaption>
      </figure>`
      )
      .join("");
  };

  /* ---------- blog cards ---------- */
  R.posts = function (node, data) {
    const posts = data.posts;
    node.classList.add("post-grid");
    node.innerHTML = posts
      .map(
        (p, i) => `<article class="post-card ${i === 0 && data.feature ? "post-card--feature" : ""} rv" style="--d:${(i % 2) * 0.07}s">
        <div class="meta"><span class="cat">${esc(p.category)}</span><span>${esc(p.date)}</span><span>${esc(p.read)}</span></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.excerpt)}</p>
        <div class="meta"><span>${esc(p.author)}</span></div>
        <a class="cover" href="${href(p.href)}" aria-label="${esc(p.title)}"></a>
      </article>`
      )
      .join("");
  };

  /* ---------- definition rows ---------- */
  R.defs = function (node, items) {
    node.classList.add("defs");
    node.innerHTML = items
      .map(
        (d) => `<div class="def rv">
        <dt>${esc(d.term)}</dt>
        <dd>${d.def}${d.sub ? `<div class="sub" style="margin-top:0.4rem">${esc(d.sub)}</div>` : ""}</dd>
      </div>`
      )
      .join("");
  };

  /* ---------- manifesto tenets ---------- */
  R.tenets = function (node, items) {
    node.classList.add("tenets");
    node.innerHTML = items
      .map(
        (t) => `<div class="tenet rv">
        <div>
          <h3>${esc(t.title)}</h3>
          <p>${t.body}</p>
          <div class="oath">${esc(t.oath)}</div>
        </div>
      </div>`
      )
      .join("");
  };

  /* ---------- careers roles ---------- */
  R.roles = function (node, roles) {
    node.innerHTML = roles
      .map(
        (r) => `<details class="qa rv">
        <summary>${esc(r.title)} <span style="font-family:var(--ff-mono);font-size:0.66rem;letter-spacing:0.12em;color:var(--mute);margin-left:auto">${esc(r.type)} · ${esc(r.location)}</span><span class="ind" aria-hidden="true">+</span></summary>
        <div class="a">
          <p>${esc(r.body)}</p>
          <ul class="ticks">${r.asks.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
          <p style="margin-top:1.2rem"><a class="btn btn--sm btn--ghost" href="mailto:${esc(r.mail)}?subject=${encodeURIComponent(r.title)}">Apply by email →</a></p>
        </div>
      </details>`
      )
      .join("");
  };
})();
