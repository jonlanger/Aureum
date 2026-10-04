/* ==========================================================================
   Aureum Viz — dependency-free SVG chart components
   - Colors are role tokens (var(--viz-n), var(--seq-n) …) so light/dark swap for free
   - Responsive (ResizeObserver), animated on first view (IntersectionObserver),
     reduced-motion aware, keyboard + pointer tooltips, sr-only data table
   API:  AureumViz.line(el, cfg)  .bars  .cashflow  .stack  .donut  .spark
         .gauge  .ring  .heatmap  .budget
   ========================================================================== */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- formatting ---------- */
  const fmt = {
    money: (v, d = 0) => (v < 0 ? "−$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }),
    money2: (v) => fmt.money(v, 2),
    compact: (v) => {
      const a = Math.abs(v), s = v < 0 ? "−$" : "$";
      if (a >= 1e6) return s + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
      if (a >= 1e3) return s + (a / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "K";
      return s + Math.round(a);
    },
    pct: (v) => Math.round(v) + "%",
    num: (v) => v.toLocaleString("en-US"),
  };

  /* ---------- tiny DOM helpers ---------- */
  function s(tag, attrs = {}, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function h(tag, cls, parent, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function niceTicks(min, max, count = 4) {
    if (min === max) { max = min + 1; }
    const span = max - min;
    const step0 = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag;
    const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
    return { lo, hi, ticks };
  }

  /* ---------- shared infra: mount, resize, reveal, tooltip, sr table ---------- */
  const registry = new WeakMap();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("viz-in"); io.unobserve(e.target); const r = registry.get(e.target); r && r.onReveal && r.onReveal(); }
    });
  }, { threshold: 0.25 });
  const ro = new ResizeObserver((entries) => {
    entries.forEach((e) => {
      const r = registry.get(e.target);
      if (!r) return;
      const w = Math.round(e.contentRect.width);
      if (w && w !== r.w) { r.w = w; if (r.drawn) { e.target.classList.add("viz-static"); r.render(); } }
    });
  });

  function mount(el, render, opts = {}) {
    el.classList.add("viz");
    const rec = { w: el.clientWidth, render: () => { render(); rec.drawn = true; }, onReveal: opts.onReveal };
    registry.set(el, rec);
    if (reduce) el.classList.add("viz-in", "viz-static");
    rec.render();
    if (!reduce) io.observe(el);
    ro.observe(el);
    return { rerender: rec.render };
  }

  function tooltip(host) {
    let t = host.querySelector(":scope > .a-tooltip");
    if (!t) { t = h("div", "a-tooltip", host); t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); }
    return {
      show(title, rows, x, y) {
        t.replaceChildren();
        if (title) h("div", "a-tooltip__title", t, title);
        rows.forEach((r) => {
          const row = h("div", "a-tooltip__row", t);
          const key = h("i", "", row);
          key.style.background = r.color || "var(--a-text-3)";
          if (r.shape === "box") { key.style.height = "10px"; key.style.width = "10px"; key.style.borderRadius = "3px"; }
          h("span", "", row, r.label);
          h("b", "", row, r.value);
        });
        const hw = host.clientWidth, tw = t.offsetWidth, th = t.offsetHeight;
        let left = x + 14; if (left + tw > hw - 4) left = x - tw - 14; left = clamp(left, 4, hw - tw - 4);
        let top = y - th - 12; if (top < 0) top = y + 16;
        t.style.left = left + "px"; t.style.top = top + "px";
        t.classList.add("is-on");
      },
      hide() { t.classList.remove("is-on"); },
    };
  }

  function srTable(host, caption, columns, rows) {
    let wrap = host.querySelector(":scope > .viz-table");
    if (!wrap) wrap = h("div", "viz-table", host);
    wrap.replaceChildren();
    const table = h("table", "a-table", wrap);
    h("caption", "visually-hidden", table, caption || "Chart data");
    const tr = h("tr", "", h("thead", "", table));
    columns.forEach((c, i) => { const th = h("th", i ? "num" : "", tr, c); th.scope = "col"; });
    const tb = h("tbody", "", table);
    rows.forEach((r) => { const row = h("tr", "", tb); r.forEach((c, i) => h("td", i ? "num" : "", row, c)); });
    return wrap;
  }

  function legend(host, items, shape = "box") {
    let lg = host.querySelector(":scope > .viz-legend");
    if (!lg) { lg = h("div", "viz-legend"); host.insertBefore(lg, host.firstChild); }
    lg.replaceChildren();
    items.forEach((it) => {
      const tag = h("span", "viz-legend__item", lg);
      const k = h("i", "viz-key viz-key--" + shape, tag); k.style.background = it.color;
      h("span", "", tag, it.label);
    });
    return lg;
  }

  function svgRoot(host, w, hgt, label) {
    let svg = host.querySelector(":scope > svg.viz-svg");
    if (svg) svg.remove();
    svg = s("svg", { class: "viz-svg", width: w, height: hgt, viewBox: `0 0 ${w} ${hgt}`, role: "img", "aria-label": label || "Chart" });
    const tbl = host.querySelector(":scope > .viz-table");
    host.insertBefore(svg, tbl || null);
    return svg;
  }

  const approxTextW = (str, px = 11) => String(str).length * px * 0.6;

  /* ======================================================================
     LINE / AREA — crosshair + one tooltip for every series
     cfg: { labels, series:[{name, values, color, forecastFrom}], area, height,
            yFormat, band:{lo:[], hi:[], color}, endLabels, yMin, markers:[{i,label}] }
     ====================================================================== */
  function line(el, cfg) {
    const series = cfg.series;
    const yf = cfg.yFormat || fmt.compact;
    const tipFmt = cfg.tipFormat || cfg.yFormat || fmt.money;
    const tt = tooltip(el);
    if (series.length > 1) legend(el, series.map((sr, i) => ({ label: sr.name, color: sr.color || `var(--viz-${i + 1})` })), "line");

    function render() {
      const W = el.clientWidth || 600, H = cfg.height || 260;
      const all = series.flatMap((sr) => sr.values).concat(cfg.band ? [...cfg.band.lo, ...cfg.band.hi] : []).concat(cfg.refLine ? [cfg.refLine.value] : []);
      const { lo, hi, ticks } = niceTicks(cfg.yMin != null ? cfg.yMin : Math.min(...all), Math.max(...all), cfg.ticks || 4);
      const showEnd = cfg.endLabels !== false && series.length <= 4 && W > 420;
      const endW = showEnd ? Math.max(...series.map((sr) => approxTextW(yf(sr.values[sr.values.length - 1]), 12))) + 18 : 12;
      const padL = Math.max(...ticks.map((t) => approxTextW(yf(t)))) + 12, padR = endW, padT = 12, padB = 28;
      const iw = W - padL - padR, ih = H - padT - padB;
      const n = cfg.labels.length;
      const x = (i) => padL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
      const y = (v) => padT + ih - ((v - lo) / (hi - lo)) * ih;
      const svg = svgRoot(el, W, H, cfg.label);

      // grid + y ticks
      const g = s("g", { class: "viz-grid" }, svg);
      ticks.forEach((t) => {
        s("line", { x1: padL, x2: W - padR, y1: y(t), y2: y(t), class: t === lo ? "viz-baseline" : "viz-gridline" }, g);
        s("text", { x: padL - 10, y: y(t) + 4, "text-anchor": "end", class: "viz-tick" }, g).textContent = yf(t);
      });
      // x ticks — thin out to fit
      const every = Math.ceil(n / Math.max(2, Math.floor(iw / 64)));
      cfg.labels.forEach((lb, i) => {
        if (i % every && i !== n - 1) return;
        if (i !== n - 1 && x(n - 1) - x(i) < (approxTextW(lb) + approxTextW(cfg.labels[n - 1])) / 2 + 14) return;
        s("text", { x: x(i), y: H - 8, "text-anchor": i === 0 ? "start" : i === n - 1 ? "end" : "middle", class: "viz-tick" }, g).textContent = lb;
      });

      // confidence band
      if (cfg.band) {
        const { lo: bl, hi: bh } = cfg.band;
        const start = cfg.band.from || 0;
        let d = "";
        for (let i = start; i < n; i++) d += (i === start ? "M" : "L") + x(i) + " " + y(bh[i]);
        for (let i = n - 1; i >= start; i--) d += "L" + x(i) + " " + y(bl[i]);
        s("path", { d: d + "Z", class: "viz-band", style: `fill:${cfg.band.color || "var(--viz-1)"}` }, svg);
      }

      // horizontal reference (e.g. a goal target)
      if (cfg.refLine) {
        const ry = y(cfg.refLine.value);
        s("line", { x1: padL, x2: W - padR, y1: ry, y2: ry, class: "viz-ref" }, svg);
        s("text", { x: padL + 6, y: ry - 7, class: "viz-tick viz-tick--strong" }, svg).textContent = cfg.refLine.label;
      }
      // markers (vertical annotation, e.g. "Today")
      (cfg.markers || []).forEach((m) => {
        s("line", { x1: x(m.i), x2: x(m.i), y1: padT, y2: padT + ih, class: "viz-marker" }, svg);
        s("text", { x: x(m.i) + 6, y: padT + 10, class: "viz-tick viz-tick--strong" }, svg).textContent = m.label;
      });

      // series
      series.forEach((sr, si) => {
        const color = sr.color || `var(--viz-${si + 1})`;
        const pts = sr.values.map((v, i) => [x(i), y(v)]);
        const path = (arr) => arr.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
        if (cfg.area) {
          s("path", { d: path(pts) + `L${x(n - 1)} ${padT + ih}L${x(0)} ${padT + ih}Z`, class: "viz-area", style: `fill:${color}` }, svg);
        }
        const ff = sr.forecastFrom;
        if (ff != null) {
          s("path", { d: path(pts.slice(0, ff + 1)), class: "viz-line", pathLength: 1, style: `stroke:${color}` }, svg);
          s("path", { d: path(pts.slice(ff)), class: "viz-line viz-line--forecast", style: `stroke:${color}` }, svg);
        } else {
          s("path", { d: path(pts), class: "viz-line", pathLength: 1, style: `stroke:${color};--i:${si}` }, svg);
        }
        const last = pts[pts.length - 1];
        s("circle", { cx: last[0], cy: last[1], r: 4.5, class: "viz-dot viz-dot--end", style: `fill:${color}` }, svg);
        if (showEnd) {
          s("text", { x: last[0] + 10, y: last[1] + 4, class: "viz-endlabel" }, svg).textContent = yf(sr.values[sr.values.length - 1]);
        }
      });

      // crosshair layer
      const cross = s("g", { class: "viz-cross", opacity: 0 }, svg);
      const cl = s("line", { y1: padT, y2: padT + ih, class: "viz-crossline" }, cross);
      const dots = series.map((sr, si) => s("circle", { r: 5, class: "viz-dot", style: `fill:${sr.color || `var(--viz-${si + 1})`}` }, cross));
      const hit = s("rect", { x: padL, y: padT, width: iw, height: ih, fill: "transparent", tabindex: 0, class: "viz-hit", "aria-label": (cfg.label || "Chart") + ". Use arrow keys to read values." }, svg);
      let cur = n - 1;
      const showAt = (i) => {
        cur = clamp(i, 0, n - 1);
        cross.setAttribute("opacity", 1);
        cl.setAttribute("x1", x(cur)); cl.setAttribute("x2", x(cur));
        series.forEach((sr, si) => { dots[si].setAttribute("cx", x(cur)); dots[si].setAttribute("cy", y(sr.values[cur])); });
        const rows = series.map((sr, si) => ({ label: sr.name, value: tipFmt(sr.values[cur]), color: sr.color || `var(--viz-${si + 1})` }));
        if (cfg.band && cur >= (cfg.band.from || 0)) rows.push({ label: cfg.band.name || "Likely range", value: `${yf(cfg.band.lo[cur])}–${yf(cfg.band.hi[cur])}`, color: "var(--a-text-3)" });
        const topY = Math.min(...series.map((sr) => y(sr.values[cur])));
        tt.show(cfg.labels[cur], rows, x(cur), topY);
      };
      const hide = () => { cross.setAttribute("opacity", 0); tt.hide(); };
      hit.addEventListener("pointermove", (e) => {
        const r = svg.getBoundingClientRect();
        const px = (e.clientX - r.left) * (W / r.width);
        showAt(Math.round(((px - padL) / iw) * (n - 1)));
      });
      hit.addEventListener("pointerleave", hide);
      hit.addEventListener("focus", () => showAt(cur));
      hit.addEventListener("blur", hide);
      hit.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { showAt(cur + 1); e.preventDefault(); }
        if (e.key === "ArrowLeft") { showAt(cur - 1); e.preventDefault(); }
        if (e.key === "Home") { showAt(0); e.preventDefault(); }
        if (e.key === "End") { showAt(n - 1); e.preventDefault(); }
      });

      srTable(el, cfg.label, ["", ...series.map((sr) => sr.name)], cfg.labels.map((lb, i) => [lb, ...series.map((sr) => tipFmt(sr.values[i]))]));
    }
    return mount(el, render);
  }

  /* ======================================================================
     COLUMNS — single or grouped; ≤24px marks, 4px rounded data-end
     cfg: { categories, series:[{name, values, color}], height, yFormat, highlight }
     ====================================================================== */
  function colPath(x, yTop, w, yBase, r = 4) {
    const hgt = yBase - yTop;
    if (hgt <= 0) return "";
    const rr = Math.min(r, hgt, w / 2);
    return `M${x} ${yBase}V${yTop + rr}Q${x} ${yTop} ${x + rr} ${yTop}H${x + w - rr}Q${x + w} ${yTop} ${x + w} ${yTop + rr}V${yBase}Z`;
  }
  function colPathDown(x, yBase, w, yBot, r = 4) {
    const hgt = yBot - yBase;
    if (hgt <= 0) return "";
    const rr = Math.min(r, hgt, w / 2);
    return `M${x} ${yBase}V${yBot - rr}Q${x} ${yBot} ${x + rr} ${yBot}H${x + w - rr}Q${x + w} ${yBot} ${x + w} ${yBot - rr}V${yBase}Z`;
  }

  function bars(el, cfg) {
    const series = cfg.series;
    const yf = cfg.yFormat || fmt.compact;
    const tf = cfg.tipFormat || fmt.money;
    const tt = tooltip(el);
    if (series.length > 1) legend(el, series.map((sr, i) => ({ label: sr.name, color: sr.color || `var(--viz-${i + 1})` })));

    function render() {
      const W = el.clientWidth || 600, H = cfg.height || 240;
      const all = series.flatMap((sr) => sr.values);
      const { hi, ticks } = niceTicks(0, Math.max(...all), 4);
      const padL = Math.max(...ticks.map((t) => approxTextW(yf(t)))) + 12, padR = 8, padT = 22, padB = 28;
      const iw = W - padL - padR, ih = H - padT - padB;
      const n = cfg.categories.length, k = series.length;
      const band = iw / n;
      const barW = Math.min(24, (band * 0.7 - (k - 1) * 2) / k);
      const groupW = barW * k + (k - 1) * 2;
      const y = (v) => padT + ih - (v / hi) * ih;
      const base = padT + ih;
      const svg = svgRoot(el, W, H, cfg.label);
      const g = s("g", {}, svg);
      ticks.forEach((t) => {
        s("line", { x1: padL, x2: W - padR, y1: y(t), y2: y(t), class: t === 0 ? "viz-baseline" : "viz-gridline" }, g);
        s("text", { x: padL - 10, y: y(t) + 4, "text-anchor": "end", class: "viz-tick" }, g).textContent = yf(t);
      });
      const every = Math.ceil(n / Math.max(2, Math.floor(iw / 44)));
      cfg.categories.forEach((c, i) => {
        const cx = padL + band * i + band / 2;
        if (i % every === 0) s("text", { x: cx, y: H - 8, "text-anchor": "middle", class: "viz-tick" }, g).textContent = c;
        series.forEach((sr, si) => {
          const v = sr.values[i];
          const bx = cx - groupW / 2 + si * (barW + 2);
          const hl = cfg.highlight != null && cfg.highlight !== i && k === 1;
          const color = hl ? "var(--viz-muted)" : sr.color || `var(--viz-${si + 1})`;
          const p = s("path", { d: colPath(bx, y(v), barW, base), class: "viz-bar", style: `fill:${color};transform-origin:0 ${base}px;--i:${i}`, tabindex: 0, "aria-label": `${c} ${sr.name}: ${tf(v)}` }, svg);
          const show = () => tt.show(c, series.map((ss, j) => ({ label: ss.name, value: tf(ss.values[i]), color: ss.color || `var(--viz-${j + 1})`, shape: "box" })), bx + barW / 2, y(v));
          p.addEventListener("pointerenter", show); p.addEventListener("focus", show);
          p.addEventListener("pointerleave", tt.hide); p.addEventListener("blur", tt.hide);
        });
        if (cfg.highlight === i && k === 1) s("text", { x: cx, y: y(series[0].values[i]) - 8, "text-anchor": "middle", class: "viz-endlabel" }, svg).textContent = yf(series[0].values[i]);
      });
      srTable(el, cfg.label, ["", ...series.map((sr) => sr.name)], cfg.categories.map((c, i) => [c, ...series.map((sr) => tf(sr.values[i]))]));
    }
    return mount(el, render);
  }

  /* ======================================================================
     CASHFLOW — money in (up, teal) vs money out (down, coral), net dot
     One axis, one unit: a diverging column chart around zero.
     cfg: { categories, income:[], spend:[], height }
     ====================================================================== */
  function cashflow(el, cfg) {
    const tt = tooltip(el);
    legend(el, [
      { label: "Money in", color: "var(--div-pos-2)" },
      { label: "Money out", color: "var(--div-neg-2)" },
    ]);
    const lgItem = h("span", "viz-legend__item", el.querySelector(".viz-legend"));
    const dk = h("i", "viz-key viz-key--dot", lgItem); dk.style.background = "var(--a-text-ink)";
    h("span", "", lgItem, "Net");
    function render() {
      const W = el.clientWidth || 600, H = cfg.height || 280;
      const m = Math.max(...cfg.income, ...cfg.spend);
      const { hi, ticks } = niceTicks(0, m, 2);
      const allTicks = [...ticks.slice(1).map((t) => -t).reverse(), ...ticks];
      const padL = Math.max(...allTicks.map((t) => approxTextW(fmt.compact(t)))) + 12, padR = 8, padT = 10, padB = 28;
      const iw = W - padL - padR, ih = H - padT - padB;
      const y = (v) => padT + ih / 2 - (v / hi) * (ih / 2);
      const zero = y(0);
      const n = cfg.categories.length, band = iw / n, bw = Math.min(24, band * 0.56);
      const svg = svgRoot(el, W, H, cfg.label);
      allTicks.forEach((t) => {
        s("line", { x1: padL, x2: W - padR, y1: y(t), y2: y(t), class: t === 0 ? "viz-baseline" : "viz-gridline" }, svg);
        s("text", { x: padL - 10, y: y(t) + 4, "text-anchor": "end", class: "viz-tick" }, svg).textContent = fmt.compact(t);
      });
      const netPts = [];
      const every = Math.ceil(n / Math.max(2, Math.floor(iw / 40)));
      cfg.categories.forEach((c, i) => {
        const cx = padL + band * i + band / 2, bx = cx - bw / 2;
        const inc = cfg.income[i], sp = cfg.spend[i], net = inc - sp;
        const up = s("path", { d: colPath(bx, y(inc), bw, zero - 1), class: "viz-bar", style: `fill:var(--div-pos-2);transform-origin:0 ${zero}px;--i:${i}` }, svg);
        const dn = s("path", { d: colPathDown(bx, zero + 1, bw, y(-sp)), class: "viz-bar", style: `fill:var(--div-neg-2);transform-origin:0 ${zero}px;--i:${i}` }, svg);
        netPts.push([cx, y(net)]);
        if (i % every === 0) s("text", { x: cx, y: H - 8, "text-anchor": "middle", class: "viz-tick" }, svg).textContent = c;
        const hit = s("rect", { x: padL + band * i, y: padT, width: band, height: ih, fill: "transparent", tabindex: 0, "aria-label": `${c}: in ${fmt.money(inc)}, out ${fmt.money(sp)}, net ${fmt.money(net)}` }, svg);
        const show = () => {
          up.classList.add("is-hover"); dn.classList.add("is-hover");
          tt.show(c, [
            { label: "Money in", value: fmt.money(inc), color: "var(--div-pos-2)", shape: "box" },
            { label: "Money out", value: fmt.money(sp), color: "var(--div-neg-2)", shape: "box" },
            { label: "Net", value: (net >= 0 ? "+" : "") + fmt.money(net), color: "var(--a-text-ink)" },
          ], cx, y(inc));
        };
        const hide = () => { up.classList.remove("is-hover"); dn.classList.remove("is-hover"); tt.hide(); };
        hit.addEventListener("pointerenter", show); hit.addEventListener("focus", show);
        hit.addEventListener("pointerleave", hide); hit.addEventListener("blur", hide);
      });
      s("path", { d: netPts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(""), class: "viz-line viz-line--net", pathLength: 1 }, svg);
      netPts.forEach((p) => s("circle", { cx: p[0], cy: p[1], r: 4, class: "viz-dot viz-dot--net" }, svg));
      // move hit rects to top so they catch the pointer
      svg.querySelectorAll("rect[tabindex]").forEach((r) => svg.appendChild(r));
      srTable(el, cfg.label, ["Month", "Money in", "Money out", "Net"], cfg.categories.map((c, i) => [c, fmt.money(cfg.income[i]), fmt.money(cfg.spend[i]), fmt.money(cfg.income[i] - cfg.spend[i])]));
    }
    return mount(el, render);
  }

  /* ======================================================================
     STACK — one 100% bar (allocation). 2px surface gaps. Legend w/ values.
     cfg: { items:[{label, value, color}], height, format }
     ====================================================================== */
  function stack(el, cfg) {
    const tt = tooltip(el);
    const f = cfg.format || fmt.money;
    function render() {
      el.querySelector(":scope > .viz-stack")?.remove();
      el.querySelector(":scope > .viz-stack-legend")?.remove();
      const total = cfg.items.reduce((a, b) => a + b.value, 0);
      const bar = h("div", "viz-stack");
      bar.style.height = (cfg.height || 20) + "px";
      cfg.items.forEach((it, i) => {
        const seg = h("div", "viz-stack__seg", bar);
        seg.style.flexGrow = it.value; seg.style.background = it.color || `var(--viz-${i + 1})`;
        seg.style.setProperty("--i", i);
        seg.tabIndex = 0;
        seg.setAttribute("aria-label", `${it.label}: ${f(it.value)}, ${Math.round((it.value / total) * 100)}%`);
        const show = () => { const r = seg.getBoundingClientRect(), hr = el.getBoundingClientRect(); tt.show(it.label, [{ label: "Amount", value: f(it.value), color: seg.style.background, shape: "box" }, { label: "Share", value: Math.round((it.value / total) * 100) + "%", color: "transparent" }], r.left - hr.left + r.width / 2, r.top - hr.top); };
        seg.addEventListener("pointerenter", show); seg.addEventListener("focus", show);
        seg.addEventListener("pointerleave", tt.hide); seg.addEventListener("blur", tt.hide);
      });
      el.insertBefore(bar, el.querySelector(".a-tooltip"));
      const lg = h("div", "viz-stack-legend");
      cfg.items.forEach((it, i) => {
        const row = h("div", "viz-stack-legend__row", lg);
        const k = h("i", "viz-key viz-key--box", row); k.style.background = it.color || `var(--viz-${i + 1})`;
        h("span", "", row, it.label);
        h("b", "tabular", row, f(it.value));
        h("em", "tabular", row, Math.round((it.value / total) * 100) + "%");
      });
      el.insertBefore(lg, el.querySelector(".a-tooltip"));
    }
    return mount(el, render);
  }

  /* ======================================================================
     DONUT — part-to-whole, ≤6 segments, center figure updates on hover
     cfg: { items:[{label, value, color}], size, centerLabel, format }
     ====================================================================== */
  function donut(el, cfg) {
    const f = cfg.format || fmt.money;
    function render() {
      const size = Math.min(cfg.size || 200, el.clientWidth || 200);
      el.querySelector(":scope > .viz-donut")?.remove();
      const wrap = h("div", "viz-donut");
      wrap.style.width = wrap.style.height = size + "px";
      el.insertBefore(wrap, el.firstChild);
      const svg = s("svg", { viewBox: "0 0 200 200", width: size, height: size, role: "img", "aria-label": cfg.label || "Donut chart" }, wrap);
      const total = cfg.items.reduce((a, b) => a + b.value, 0);
      const R = 84, sw = cfg.thickness || 22, C = 2 * Math.PI * R;
      s("circle", { cx: 100, cy: 100, r: R, class: "viz-donut__track", "stroke-width": sw }, svg);
      const center = h("div", "viz-donut__center", wrap);
      const cv = h("div", "viz-donut__value", center, f(total));
      const cl = h("div", "viz-donut__label", center, cfg.centerLabel || "Total");
      let acc = 0;
      const gap = 2.2; // px of surface between segments (in circumference units)
      cfg.items.forEach((it, i) => {
        const len = (it.value / total) * C;
        const seg = s("circle", {
          cx: 100, cy: 100, r: R, class: "viz-donut__seg", "stroke-width": sw, tabindex: 0,
          "stroke-dasharray": `${Math.max(0, len - gap)} ${C}`, "stroke-dashoffset": -acc,
          transform: "rotate(-90 100 100)", style: `stroke:${it.color || `var(--viz-${i + 1})`};--i:${i}`,
          "aria-label": `${it.label}: ${f(it.value)}`,
        }, svg);
        seg.style.setProperty("--len", len);
        acc += len;
        const on = () => { seg.classList.add("is-hover"); cv.textContent = f(it.value); cl.textContent = `${it.label} · ${Math.round((it.value / total) * 100)}%`; };
        const off = () => { seg.classList.remove("is-hover"); cv.textContent = f(total); cl.textContent = cfg.centerLabel || "Total"; };
        seg.addEventListener("pointerenter", on); seg.addEventListener("focus", on);
        seg.addEventListener("pointerleave", off); seg.addEventListener("blur", off);
      });
      srTable(el, cfg.label, ["Category", "Amount"], cfg.items.map((it) => [it.label, f(it.value)]));
    }
    return mount(el, render);
  }

  /* ======================================================================
     SPARKLINE — 12-ish points, de-emphasis hue with accent end dot
     ====================================================================== */
  function spark(el, cfg) {
    const values = Array.isArray(cfg) ? cfg : cfg.values;
    const color = cfg.color || "var(--viz-1)";
    function render() {
      const W = el.clientWidth || 120, H = el.clientHeight || 36, p = 5;
      const mn = Math.min(...values), mx = Math.max(...values);
      const x = (i) => p + (i / (values.length - 1)) * (W - p * 2);
      const y = (v) => p + (H - p * 2) - ((v - mn) / (mx - mn || 1)) * (H - p * 2);
      const svg = svgRoot(el, W, H, cfg.label || "Trend");
      const d = values.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join("");
      if (cfg.area !== false) s("path", { d: d + `L${x(values.length - 1)} ${H}L${x(0)} ${H}Z`, class: "viz-area", style: `fill:${color}` }, svg);
      s("path", { d, class: "viz-line", pathLength: 1, style: `stroke:${color}` }, svg);
      s("circle", { cx: x(values.length - 1), cy: y(values[values.length - 1]), r: 3.5, class: "viz-dot viz-dot--end", style: `fill:${color}` }, svg);
    }
    return mount(el, render);
  }

  /* ======================================================================
     GAUGE — Financial Health Score (0–100), 240° arc
     cfg: { value, max, grade, label, size }
     ====================================================================== */
  function arcPath(cx, cy, r, a0, a1) {
    const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}`;
  }
  function gauge(el, cfg) {
    const max = cfg.max || 100;
    function render() {
      el.querySelector(":scope > .viz-gauge")?.remove();
      const size = Math.min(cfg.size || 220, el.clientWidth || 220);
      const wrap = h("div", "viz-gauge");
      wrap.style.width = size + "px"; wrap.style.height = size * 0.82 + "px";
      el.insertBefore(wrap, el.firstChild);
      const svg = s("svg", { viewBox: "0 0 200 164", width: size, height: size * 0.82, role: "img", "aria-label": `${cfg.label || "Score"}: ${cfg.value} of ${max}` }, wrap);
      const a0 = Math.PI * (5 / 6), a1 = Math.PI * (13 / 6);
      const R = 82;
      s("path", { d: arcPath(100, 100, R, a0, a1), class: "viz-gauge__track" }, svg);
      // zone ticks: 40 / 70 thresholds
      [0.4, 0.7].forEach((t) => {
        const a = a0 + (a1 - a0) * t;
        s("line", { x1: 100 + (R - 16) * Math.cos(a), y1: 100 + (R - 16) * Math.sin(a), x2: 100 + (R + 13) * Math.cos(a), y2: 100 + (R + 13) * Math.sin(a), class: "viz-gauge__tick" }, svg);
      });
      const frac = clamp(cfg.value / max, 0, 1);
      const fill = s("path", { d: arcPath(100, 100, R, a0, a0 + (a1 - a0) * Math.max(frac, 0.001)), class: "viz-gauge__fill", pathLength: 1 }, svg);
      fill.style.stroke = frac >= 0.7 ? "var(--a-accent)" : frac >= 0.4 ? "var(--a-warn)" : "var(--a-bad)";
      const ae = a0 + (a1 - a0) * frac;
      const knob = s("circle", { cx: 100 + R * Math.cos(ae), cy: 100 + R * Math.sin(ae), r: 9, class: "viz-gauge__knob" }, svg);
      knob.style.setProperty("--a0", `${(a0 * 180) / Math.PI}deg`);
      const c = h("div", "viz-gauge__center", wrap);
      const v = h("div", "viz-gauge__value", c, "0");
      if (cfg.grade) h("div", "viz-gauge__grade", c, cfg.grade);
      h("div", "viz-gauge__label", c, cfg.label || "Health score");
      state.v = v;
      if (el.classList.contains("viz-in")) v.textContent = cfg.value;
    }
    const state = {};
    return mount(el, render, { onReveal: () => countUp(state.v, cfg.value, { duration: 1100, format: (n) => Math.round(n) }) });
  }

  /* ======================================================================
     RING — goal progress
     cfg: { value (0–1), size, label, color }
     ====================================================================== */
  function ring(el, cfg) {
    function render() {
      el.querySelector(":scope > .viz-ring")?.remove();
      const size = cfg.size || 96;
      const wrap = h("div", "viz-ring");
      wrap.style.width = wrap.style.height = size + "px";
      el.insertBefore(wrap, el.firstChild);
      const svg = s("svg", { viewBox: "0 0 100 100", width: size, height: size, role: "img", "aria-label": `${cfg.label || "Progress"}: ${Math.round(cfg.value * 100)}%` }, wrap);
      s("circle", { cx: 50, cy: 50, r: 42, class: "viz-ring__track", style: cfg.track ? `stroke:${cfg.track}` : "" }, svg);
      const arc = s("circle", { cx: 50, cy: 50, r: 42, class: "viz-ring__fill", pathLength: 100, transform: "rotate(-90 50 50)", style: `stroke:${cfg.color || "var(--a-accent)"};--v:${100 - cfg.value * 100}` }, svg);
      h("div", "viz-ring__value", wrap, Math.round(cfg.value * 100) + "%");
    }
    return mount(el, render);
  }

  /* ======================================================================
     HEATMAP — daily spending calendar (sequential teal)
     cfg: { values:[daily], start: Date, format, weeks, fill }
     fill: cells stretch to the container width; height grows more slowly.
     ====================================================================== */
  function heatmap(el, cfg) {
    const tt = tooltip(el);
    const f = cfg.format || fmt.money;
    function render() {
      const vals = cfg.values;
      const W = el.clientWidth || 600;
      const weeks = Math.ceil(vals.length / 7);
      const padL = 28, padT = 18;
      const gap = cfg.fill && (W - padL) / weeks > 48 ? 5 : 3;
      const fit = cfg.fill ? (W - padL + gap) / weeks : Math.floor((W - padL) / weeks);
      const cw = cfg.fill ? Math.max(8, fit - gap) : clamp(fit - gap, 8, cfg.maxCell || 34);
      const cell = cfg.fill ? Math.min(cw, Math.max(cfg.maxCell || 34, Math.round(cw * .45)), 44) : cw;
      const H = padT + 7 * (cell + gap) + 30;
      const svg = svgRoot(el, Math.min(W, padL + weeks * (cw + gap) - gap), H, cfg.label);
      const mx = Math.max(...vals);
      const bins = 6;
      const bin = (v) => (v === 0 ? 0 : 1 + Math.min(bins - 1, Math.floor((v / mx) * bins)));
      const start = cfg.start || new Date(2026, 6, 6);
      ["M", "W", "F"].forEach((d, i) => s("text", { x: 0, y: padT + (i * 2 + 1) * (cell + gap) - 3 + cell / 2 + 4, class: "viz-tick" }, svg).textContent = d);
      let lastMonth = -1;
      vals.forEach((v, i) => {
        const wk = Math.floor(i / 7), dy = i % 7;
        const date = new Date(start); date.setDate(start.getDate() + i);
        if (dy === 0 && date.getMonth() !== lastMonth) {
          lastMonth = date.getMonth();
          s("text", { x: padL + wk * (cw + gap), y: 11, class: "viz-tick" }, svg).textContent = date.toLocaleString("en-US", { month: "short" });
        }
        const b = bin(v);
        const r = s("rect", { x: padL + wk * (cw + gap), y: padT + dy * (cell + gap), width: cw, height: cell, rx: cfg.fill ? 5 : 3, class: "viz-cell", tabindex: 0, style: `fill:${b ? `var(--seq-${b + 1})` : "var(--seq-1)"};--i:${wk}`, "aria-label": `${date.toDateString()}: ${f(v)}` }, svg);
        const show = () => tt.show(date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), [{ label: "Spent", value: f(v), color: `var(--seq-${b + 1})`, shape: "box" }], +r.getAttribute("x") + cw / 2, +r.getAttribute("y"));
        r.addEventListener("pointerenter", show); r.addEventListener("focus", show);
        r.addEventListener("pointerleave", tt.hide); r.addEventListener("blur", tt.hide);
      });
      // scale legend
      const ly = H - 12;
      s("text", { x: padL, y: ly + 4, class: "viz-tick" }, svg).textContent = "Less";
      for (let b = 0; b <= bins; b++) s("rect", { x: padL + 30 + b * 14, y: ly - 5, width: 11, height: 11, rx: 2.5, style: `fill:var(--seq-${b + 1})` }, svg);
      s("text", { x: padL + 30 + (bins + 1) * 14 + 4, y: ly + 4, class: "viz-tick" }, svg).textContent = "More";
    }
    return mount(el, render);
  }

  /* ======================================================================
     BUDGET — category meters. Fill is status by % used; track is a lighter
     step of the same ramp. Status always ships with icon + label.
     cfg: { items:[{label, icon, spent, limit}] }
     ====================================================================== */
  function budget(el, cfg) {
    function render() {
      el.replaceChildren();
      const list = h("div", "viz-budget", el);
      cfg.items.forEach((it, i) => {
        const pct = it.spent / it.limit;
        const st = pct > 1 ? "bad" : pct > 0.85 ? "warn" : "good";
        const row = h("div", "viz-budget__row viz-budget__row--" + st, list);
        row.style.setProperty("--i", i);
        const ic = h("span", "viz-budget__icon", row);
        ic.innerHTML = window.AureumArt ? AureumArt.icon(it.icon || "wallet", 18) : "";
        const top = h("div", "viz-budget__top", row);
        h("span", "viz-budget__label", top, it.label);
        const amt = h("span", "viz-budget__amt tabular", top);
        h("b", "", amt, fmt.money(it.spent)); amt.append(" / " + fmt.money(it.limit));
        const meter = h("div", "viz-budget__meter", row);
        meter.setAttribute("role", "meter"); meter.setAttribute("aria-valuenow", Math.round(pct * 100)); meter.setAttribute("aria-valuemin", 0); meter.setAttribute("aria-valuemax", 100); meter.setAttribute("aria-label", `${it.label} budget used`);
        const fill = h("span", "", meter); fill.style.setProperty("--w", Math.min(pct, 1) * 100 + "%");
        const status = h("span", "viz-budget__status", row);
        const label = st === "bad" ? `${fmt.money(it.spent - it.limit)} over` : st === "warn" ? `${fmt.money(it.limit - it.spent)} left` : `${fmt.money(it.limit - it.spent)} left`;
        status.innerHTML = window.AureumArt ? AureumArt.icon(st === "good" ? "check" : "alert", 14) : "";
        status.append(label);
      });
    }
    return mount(el, render);
  }

  /* ---------- number count-up (used by hero figures) ---------- */
  function countUp(node, to, { duration = 1200, format = fmt.money, from = 0 } = {}) {
    if (reduce) { node.textContent = format(to); return; }
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    function tick(t) {
      const p = clamp((t - t0) / duration, 0, 1);
      node.textContent = format(from + (to - from) * ease(p));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- chart styles ---------- */
  const css = `
  .viz{position:relative;color:var(--a-text)}
  .viz-svg{display:block;overflow:visible;max-width:100%}
  .viz-gridline{stroke:var(--a-grid);stroke-width:1}
  .viz-baseline{stroke:var(--a-axis);stroke-width:1}
  .viz-tick{fill:var(--a-text-3);font:500 11px/1 var(--font-sans);font-variant-numeric:tabular-nums}
  .viz-tick--strong{fill:var(--a-text-2);font-weight:700}
  .viz-endlabel{fill:var(--a-text);font:700 12px/1 var(--font-sans)}
  .viz-line{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .viz-line--forecast{stroke-dasharray:2 5;stroke-width:2.25}
  .viz-line--net{stroke:var(--a-text-ink);stroke-width:1.5;opacity:.75}
  .viz-area{opacity:var(--viz-area-opacity)}
  .viz-band{opacity:.14}
  .viz-marker{stroke:var(--a-text-3);stroke-width:1}
  .viz-ref{stroke:var(--a-text-ink);stroke-width:1.5;opacity:.55}
  .viz-dot{stroke:var(--viz-surface);stroke-width:2}
  .viz-dot--net{fill:var(--a-text-ink)}
  .viz-crossline{stroke:var(--a-text-3);stroke-width:1}
  .viz-hit{cursor:crosshair;outline:none}
  .viz-hit:focus-visible{outline:none}
  .viz-hit:focus-visible ~ *{}
  .viz-bar{transition:filter var(--dur-1),opacity var(--dur-1);cursor:pointer;outline:none}
  .viz-bar:hover,.viz-bar:focus-visible,.viz-bar.is-hover{filter:brightness(1.1) saturate(1.1)}
  .viz-bar:focus-visible{stroke:var(--a-focus);stroke-width:2}
  .viz-cell{cursor:pointer;outline:none;transition:stroke var(--dur-1)}
  .viz-cell:hover,.viz-cell:focus-visible{stroke:var(--a-text);stroke-width:1.5}
  .viz-legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin-bottom:12px}
  .viz-legend__item{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:var(--a-text-2)}
  .viz-key{display:inline-block;flex:none}
  .viz-key--box{width:10px;height:10px;border-radius:3px}
  .viz-key--line{width:14px;height:2.5px;border-radius:2px}
  .viz-key--dot{width:8px;height:8px;border-radius:50%}
  .viz-table{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
  .viz.show-table .viz-table{position:static;width:auto;height:auto;clip:auto;overflow:auto;max-height:260px;margin-top:8px}
  .viz.show-table > svg, .viz.show-table > .viz-legend{display:none}

  /* animation: draw-in on first reveal */
  .viz .viz-line{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset var(--dur-4) var(--ease-out);transition-delay:calc(var(--i,0) * 120ms)}
  .viz .viz-line--forecast{stroke-dasharray:2 5;stroke-dashoffset:0;opacity:0;transition:opacity 400ms ease var(--dur-4)}
  .viz.viz-in .viz-line{stroke-dashoffset:0}
  .viz.viz-in .viz-line--forecast{opacity:1}
  .viz .viz-area,.viz .viz-band,.viz .viz-dot--end,.viz .viz-endlabel,.viz .viz-dot--net{opacity:0;transition:opacity 500ms ease calc(var(--dur-4) * .6)}
  .viz.viz-in .viz-area{opacity:var(--viz-area-opacity)}
  .viz.viz-in .viz-band{opacity:.14}
  .viz.viz-in .viz-dot--end,.viz.viz-in .viz-endlabel,.viz.viz-in .viz-dot--net{opacity:1}
  .viz .viz-bar{transform:scaleY(0);transition:transform 700ms var(--ease-out),filter var(--dur-1);transition-delay:calc(var(--i,0) * 35ms)}
  .viz.viz-in .viz-bar{transform:scaleY(1)}
  .viz .viz-cell{opacity:0;transition:opacity 400ms ease;transition-delay:calc(var(--i,0) * 18ms)}
  .viz.viz-in .viz-cell{opacity:1}
  .viz.viz-static *{transition-delay:0ms!important;transition-duration:0ms!important}

  /* stack */
  .viz-stack{display:flex;gap:2px;border-radius:6px;overflow:hidden}
  .viz-stack__seg{min-width:3px;height:100%;cursor:pointer;outline:none;transform-origin:left;transform:scaleX(0);transition:transform 700ms var(--ease-out),filter var(--dur-1);transition-delay:calc(var(--i) * 70ms)}
  .viz.viz-in .viz-stack__seg{transform:none}
  .viz-stack__seg:hover,.viz-stack__seg:focus-visible{filter:brightness(1.12)}
  .viz-stack-legend{display:grid;gap:2px;margin-top:16px}
  .viz-stack-legend__row{display:grid;grid-template-columns:10px 1fr auto 44px;align-items:center;gap:10px;font-size:13px;padding:6px 0;border-bottom:1px solid var(--a-border)}
  .viz-stack-legend__row:last-child{border-bottom:0}
  .viz-stack-legend__row span{color:var(--a-text-2);font-weight:500}
  .viz-stack-legend__row b{font-weight:700}
  .viz-stack-legend__row em{font-style:normal;color:var(--a-text-3);text-align:right;font-size:12px}

  /* donut */
  .viz-donut{position:relative;margin-inline:auto}
  .viz-donut__track{fill:none;stroke:var(--a-surface-sunk)}
  .viz-donut__seg{fill:none;cursor:pointer;outline:none;transition:stroke-width var(--dur-2) var(--ease-out),opacity 600ms ease;opacity:0;transition-delay:0ms,calc(var(--i)*90ms)}
  .viz.viz-in .viz-donut__seg{opacity:1}
  .viz-donut__seg.is-hover,.viz-donut__seg:focus-visible{stroke-width:30}
  .viz-donut__center{position:absolute;inset:0;display:grid;place-content:center;text-align:center;pointer-events:none}
  .viz-donut__value{font:700 clamp(18px,4vw,26px)/1.1 var(--font-sans);letter-spacing:-.02em}
  .viz-donut__label{font-size:12px;color:var(--a-text-3);font-weight:600;margin-top:4px}

  /* gauge */
  .viz-gauge{position:relative;margin-inline:auto}
  .viz-gauge__track{fill:none;stroke:var(--a-surface-sunk);stroke-width:16;stroke-linecap:round}
  .viz-gauge__tick{stroke:var(--viz-surface);stroke-width:3}
  .viz-gauge__fill{fill:none;stroke-width:16;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1100ms var(--ease-out)}
  .viz.viz-in .viz-gauge__fill{stroke-dashoffset:0}
  .viz-gauge__knob{fill:var(--viz-surface);stroke:var(--a-text-ink);stroke-width:3.5;opacity:0;transition:opacity 300ms ease 1000ms}
  .viz.viz-in .viz-gauge__knob{opacity:1}
  .viz-gauge__center{position:absolute;left:0;right:0;top:34%;text-align:center}
  .viz-gauge__value{font:800 clamp(30px,8vw,46px)/1 var(--font-sans);letter-spacing:-.03em}
  .viz-gauge__grade{display:inline-block;margin-top:6px;font-size:12px;font-weight:800;padding:2px 10px;border-radius:99px;background:var(--a-accent-soft);color:var(--a-text-brand)}
  .viz-gauge__label{font-size:12px;color:var(--a-text-3);font-weight:600;margin-top:4px}

  /* ring */
  .viz-ring{position:relative;flex:none}
  .viz-ring__track{fill:none;stroke:var(--a-surface-sunk);stroke-width:9}
  .viz-ring__fill{fill:none;stroke-width:9;stroke-linecap:round;stroke-dasharray:100;stroke-dashoffset:100;transition:stroke-dashoffset 1100ms var(--ease-out)}
  .viz.viz-in .viz-ring__fill{stroke-dashoffset:var(--v)}
  .viz-ring__value{position:absolute;inset:0;display:grid;place-items:center;font:800 15px/1 var(--font-sans);letter-spacing:-.02em}

  /* budget */
  .viz-budget{display:grid;gap:14px}
  .viz-budget__row{display:grid;grid-template-columns:36px 1fr;grid-template-rows:auto auto auto;column-gap:12px;row-gap:6px;align-items:center;opacity:0;transform:translateY(8px);transition:opacity 400ms ease,transform 500ms var(--ease-out);transition-delay:calc(var(--i)*70ms)}
  .viz.viz-in .viz-budget__row{opacity:1;transform:none}
  .viz-budget__icon{grid-row:1/4;width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:var(--a-surface-sunk);color:var(--a-text-2)}
  .viz-budget__top{display:flex;justify-content:space-between;gap:8px;font-size:13px}
  .viz-budget__label{font-weight:700}
  .viz-budget__amt{color:var(--a-text-3)}
  .viz-budget__amt b{color:var(--a-text);font-weight:700}
  .viz-budget__meter{height:8px;border-radius:99px;background:var(--a-accent-soft);overflow:hidden}
  .viz-budget__meter span{display:block;height:100%;width:0;border-radius:inherit;background:var(--a-accent);transition:width 900ms var(--ease-out);transition-delay:calc(var(--i)*70ms + 150ms)}
  .viz.viz-in .viz-budget__meter span{width:var(--w)}
  .viz-budget__row--warn .viz-budget__meter{background:var(--a-warn-soft)}
  .viz-budget__row--warn .viz-budget__meter span{background:var(--a-warn)}
  .viz-budget__row--bad .viz-budget__meter{background:var(--a-bad-soft)}
  .viz-budget__row--bad .viz-budget__meter span{background:var(--a-bad)}
  .viz-budget__status{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--a-good-text)}
  .viz-budget__row--warn .viz-budget__status{color:var(--a-warn-text)}
  .viz-budget__row--bad .viz-budget__status{color:var(--a-bad-text)}
  `;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  window.AureumViz = { line, bars, cashflow, stack, donut, spark, gauge, ring, heatmap, budget, countUp, fmt, niceTicks };
})();
