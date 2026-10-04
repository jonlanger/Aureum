/* ==========================================================================
   Aureum Finance — Logo, icons, and illustration system
   Usage:  <span data-logo></span>  <span data-icon="target"></span>
           <div data-illo="mascot" data-hat></div>
   Or programmatically: AureumArt.icon("target"), AureumArt.illo("piggy")
   Illustration palette is fixed (never themed) so characters stay on-model.
   ========================================================================== */
(function () {
  const C = {
    line: "#1b1b6f", teal: "#00918b", body: "#5fcac4", mint: "#8fdcd7", mintLite: "#bdebe8",
    white: "#ffffff", gold: "#f6b93b", goldLite: "#ffd27a", blush: "#f7a785", sky: "#9ccff2", indigo: "#5d5dc6",
  };
  const SW = 4; // illustration stroke weight @200 viewBox

  /* ---------- Logo: the twin-tree "Aa" mark (from the original brand) ---------- */
  const LOGO_PATH = "M24.8582 16C20.3007 16 16.6062 19.6945 16.6062 24.252V32.748C16.6062 36.8267 19.5652 40.2142 23.4536 40.8809V44.0269C23.4536 44.8701 24.1372 45.5537 24.9805 45.5537C25.8237 45.5537 26.5073 44.8701 26.5073 44.0269V40.8352C28.5332 40.4243 30.2897 39.2712 31.4807 37.672C32.4666 39.0249 33.9257 40.0109 35.6147 40.3867V44.0269C35.6147 44.8701 36.2983 45.5537 37.1416 45.5537C37.9849 45.5537 38.6685 44.8701 38.6685 44.0269V40.3867C41.8002 39.69 44.1416 36.8953 44.1416 33.5537V27.5537C44.1416 23.6877 41.0076 20.5537 37.1416 20.5537C35.5077 20.5537 34.0046 21.1135 32.8135 22.0517C31.8506 18.5624 28.6536 16 24.8582 16ZM25.911 37.895L24.9399 38.092L23.9606 37.9241C21.4881 37.5001 19.6062 35.3409 19.6062 32.748V24.252C19.6062 21.3514 21.9576 19 24.8582 19C27.7587 19 30.1101 21.3514 30.1101 24.252V32.748C30.1101 35.2857 28.3073 37.409 25.911 37.895ZM41.1416 33.5537V27.5537C41.1416 25.3446 39.3507 23.5537 37.1416 23.5537C34.9325 23.5537 33.1416 25.3446 33.1416 27.5537V33.5537C33.1416 35.2221 34.1631 36.652 35.6147 37.252V32.3003C35.6147 31.457 36.2983 30.7734 37.1416 30.7734C37.9849 30.7734 38.6685 31.457 38.6685 32.3003V37.252C40.1201 36.652 41.1416 35.2221 41.1416 33.5537Z";

  function logo(opts = {}) {
    const { tile = false, color = "currentColor", tileColor = "#008080", markColor = "#fff" } = opts;
    if (tile) {
      return `<svg viewBox="8 8 45 45" aria-hidden="true"><rect x="8" y="8" width="45" height="45" rx="11" fill="${tileColor}"/><path fill-rule="evenodd" clip-rule="evenodd" d="${LOGO_PATH}" fill="${markColor}"/></svg>`;
    }
    return `<svg viewBox="14 14 32.5 33.5" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="${LOGO_PATH}" fill="${color}"/></svg>`;
  }

  /* ---------- Icons: 24px, 2px stroke, round caps ---------- */
  const I = {
    bank: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 20h18"/>',
    pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUpRight: '<path d="M7 17L17 7M8 7h9v9"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.8" r=".6" fill="currentColor"/>',
    alert: '<path d="M10.3 4.2L2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 10v4"/><circle cx="12" cy="17.3" r=".6" fill="currentColor"/>',
    sparkle: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"/><path d="M19 16c.2 1.5.8 2.1 2.3 2.3-1.5.2-2.1.8-2.3 2.3-.2-1.5-.8-2.1-2.3-2.3 1.5-.2 2.1-.8 2.3-2.3z"/>',
    shield: '<path d="M12 3l8 3v6c0 4.6-3.3 8.2-8 9-4.7-.8-8-4.4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    wallet: '<path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4H5a2 2 0 0 0 0 4h14a1 1 0 0 1 1 1v3"/><path d="M3 6v12a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3"/><path d="M21 12h-4a2 2 0 0 0 0 4h4z"/>',
    piggy: '<path d="M19 9.5c1 .6 1.5 1.4 1.5 2.5h1v3h-1.6a7 7 0 0 1-2.4 2.6V20h-3v-1.5h-3V20h-3v-2.6A6.5 6.5 0 0 1 4 12c0-3.6 3.4-6.5 7.5-6.5 1.2 0 2.3.2 3.3.6L17.5 4v4"/><circle cx="15.5" cy="11" r=".7" fill="currentColor"/>',
    cart: '<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2.5 3.5h2.7l2.4 11.6a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/>',
    food: '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10"/><path d="M17 21V3c-2.2 1.2-3.5 3.6-3.5 7 0 1.7.9 3 3.5 3"/>',
    car: '<path d="M5 17h14v-4.5l-2-5H7l-2 5z"/><path d="M3.5 12.5h17"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>',
    home: '<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
    bolt: '<path d="M13 2.5L4.5 13.5H12l-1 8 8.5-11H12z"/>',
    film: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M10 9l5 3-5 3z"/>',
    plane: '<path d="M10.5 13.5L3 11l1.5-1.5 8 1 4.5-4.5a2 2 0 0 1 3 3L15.5 13.5l1 8L15 23l-2.5-7.5-3 3V21l-1.5 1.5-1-3.5-3.5-1L5 16.5h2.5z" transform="scale(.92) translate(1 -1)"/>',
    heart: '<path d="M12 20s-7.5-4.5-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.5-7.5 10-7.5 10z"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    trendUp: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    trendDown: '<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19M6 15h4"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="2.5"/><path d="M3 7v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7"/><path d="M9 17c-3.3 0-6-1.1-6-2.5v-3.5M15 13.5c3.3 0 6-1.1 6-2.5M21 11v4c0 1.4-2.7 2.5-6 2.5s-6-1.1-6-2.5"/>',
    grad: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
    medical: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/>',
    message: '<path d="M4 5.5h16v11H9l-5 4z"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    gauge: '<path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="M12 13l4-4"/><circle cx="12" cy="13" r="1.3" fill="currentColor"/>',
  };
  function icon(name, size = 24) {
    const p = I[name];
    if (!p) return "";
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  }

  /* ---------- Illustration helpers ---------- */
  const sparkle = (x, y, s, fill = C.white, cls = "ill-twinkle", delay = 0) =>
    `<path class="${cls}" style="--d:${delay}s;transform-origin:${x}px ${y}px" d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${fill}" stroke="${C.line}" stroke-width="2.5" stroke-linejoin="round"/>`;
  const dot = (x, y, r, fill = C.line, o = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${o}"/>`;
  const plus = (x, y, s, color = C.line) => `<path d="M${x - s} ${y}H${x + s}M${x} ${y - s}V${y + s}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
  const face = (cx, cy, scale = 1, mood = "happy") => {
    const k = scale;
    const eye = (x) => mood === "sleep"
      ? `<path d="M${x - 7 * k} ${cy}Q${x} ${cy + 6 * k} ${x + 7 * k} ${cy}" fill="none" stroke="${C.line}" stroke-width="${SW * k}" stroke-linecap="round"/>`
      : `<g class="ill-blink" style="transform-origin:${x}px ${cy}px"><ellipse cx="${x}" cy="${cy}" rx="${7 * k}" ry="${9 * k}" fill="${C.line}"/><circle cx="${x + 2.5 * k}" cy="${cy - 3.5 * k}" r="${2.6 * k}" fill="#fff"/></g>`;
    const mouth = mood === "sleep"
      ? `<ellipse cx="${cx}" cy="${cy + 17 * k}" rx="${3.5 * k}" ry="${3 * k}" fill="${C.line}"/>`
      : mood === "wow"
      ? `<ellipse cx="${cx}" cy="${cy + 17 * k}" rx="${5 * k}" ry="${6 * k}" fill="${C.line}"/>`
      : `<path d="M${cx - 9 * k} ${cy + 14 * k}Q${cx} ${cy + 24 * k} ${cx + 9 * k} ${cy + 14 * k}" fill="none" stroke="${C.line}" stroke-width="${SW * k}" stroke-linecap="round"/>`;
    return `${eye(cx - 17 * k)}${eye(cx + 17 * k)}
      <ellipse cx="${cx - 29 * k}" cy="${cy + 13 * k}" rx="${7 * k}" ry="${4.5 * k}" fill="${C.blush}" opacity=".85"/>
      <ellipse cx="${cx + 29 * k}" cy="${cy + 13 * k}" rx="${7 * k}" ry="${4.5 * k}" fill="${C.blush}" opacity=".85"/>${mouth}`;
  };
  const coin = (x, y, r, cls = "") => `<g class="${cls}"><circle cx="${x}" cy="${y}" r="${r}" fill="${C.gold}" stroke="${C.line}" stroke-width="${SW * .8}"/><circle cx="${x}" cy="${y}" r="${r * .66}" fill="none" stroke="${C.line}" stroke-width="2" opacity=".35"/><text x="${x}" y="${y + r * .36}" text-anchor="middle" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-weight="800" font-size="${r * 1.05}" fill="${C.line}">$</text></g>`;

  /* "Sprout" — the Aureum coach. A soft teal blob with a two-leaf sprout,
     a nod to the twin-tree logo mark. */
  function mascotBody({ hat = false, mood = "happy", wave = false, leaves = true, anim = "ill-bob" } = {}) {
    return `
      <ellipse cx="100" cy="182" rx="48" ry="7" fill="${C.line}" opacity=".14" class="ill-shadow"/>
      <g class="${anim}">
        ${hat || !leaves ? "" : `<path d="M100 60V40" stroke="${C.line}" stroke-width="${SW}" stroke-linecap="round"/>
        <path d="M100 48C88 48 78 40 77 28 90 27 99 35 100 48Z" fill="${C.teal}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
        <path d="M100 42C110 42 120 34 122 22 109 21 101 29 100 42Z" fill="${C.mint}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>`}
        <path d="M100 58C142 58 162 90 162 124 162 158 136 174 100 174 64 174 38 158 38 124 38 90 58 58 100 58Z" fill="${C.body}" stroke="${C.line}" stroke-width="${SW}"/>
        <path d="M58 104C61 88 72 76 86 71" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".55"/>
        <path d="M46 132C36 130 30 122 32 112" stroke="${C.line}" stroke-width="${SW}" stroke-linecap="round" fill="none"/>
        <g class="${wave ? "ill-wave" : ""}" style="transform-origin:156px 128px"><path d="M154 130C166 126 172 116 168 106" stroke="${C.line}" stroke-width="${SW}" stroke-linecap="round" fill="none"/></g>
        ${face(100, 116, 1, mood)}
        ${hat ? `<g class="ill-hat">
          <path d="M58 72C70 66 132 66 144 72 140 80 62 80 58 72Z" fill="${C.indigo}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
          <path d="M70 72L98 10C102 6 106 8 108 14L134 72Z" fill="${C.indigo}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
          <path d="M80 54C94 58 112 58 126 54" stroke="${C.gold}" stroke-width="6" fill="none"/>
          ${sparkle(104, 34, 7, C.gold, "")}
        </g>` : ""}
      </g>`;
  }


  /* ---------- People: a parametric bust so the cast can be genuinely diverse ----------
     Same outline weight and palette as the mascots, so people and Sprout sit together. */
  const SKIN = ["#f8dcc8", "#efc29f", "#d9a172", "#b37a4c", "#8b5636", "#5f3a25"];
  const HAIR = { black: "#1d1a2b", dark: "#3a2418", brown: "#6b4426", auburn: "#a0522d", blonde: "#e3b76a", gray: "#d5d9e0" };
  const st = (w = SW) => `stroke="${C.line}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const curls = (pts, r, fill) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${st()}/>`).join("") + pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r - 2.2}" fill="${fill}"/>`).join("");
  function bust(o = {}) {
    const skin = SKIN[o.skin ?? 2], hair = HAIR[o.hairColor || "dark"], shirt = o.shirt || C.teal, h = o.hair || "short";
    const hijab = h === "hijab";
    const eyeY = hijab ? 94 : 90;
    let back = "", front = "";
    if (h === "long" || h === "locs") back = `<path d="M60 92C56 50 78 38 100 38 124 38 146 50 140 92L146 150C130 158 116 152 112 140H88C84 152 70 158 54 150Z" fill="${hair}" ${st()}/>` + (h === "locs" ? `<path d="M68 108V148M78 112V154M122 112V154M132 108V148" stroke="${C.line}" stroke-width="2" opacity=".35" stroke-linecap="round"/>` : "");
    if (h === "bob") back = `<path d="M60 96C56 54 78 40 100 40 122 40 144 54 140 96 142 112 136 122 128 124H72C64 122 58 112 60 96Z" fill="${hair}" ${st()}/>`;
    if (h === "curly") back = curls([[64, 78], [74, 56], [96, 44], [120, 48], [136, 66], [140, 90], [60, 100]], 17, hair);
    if (h === "bun") back = `<circle cx="100" cy="36" r="15" fill="${hair}" ${st()}/>`;
    if (hijab) back = `<path d="M56 96C54 52 78 36 100 36 122 36 146 52 144 96 144 124 132 140 120 146L136 170H64L80 146C68 140 56 124 56 96Z" fill="${o.wrap || C.indigo}" ${st()}/>`;
    if (h === "short") front = `<path d="M66 84C62 54 80 44 100 44 124 44 140 58 134 84 128 70 116 64 100 64 86 64 74 70 66 84Z" fill="${hair}" ${st()}/>`;
    if (h === "long" || h === "locs" || h === "bob") front = `<path d="M66 86C64 56 82 46 100 46 120 46 138 58 134 88 120 80 112 68 108 60 96 72 80 80 66 86Z" fill="${hair}" ${st()}/>`;
    if (h === "curly") front = curls([[76, 62], [92, 54], [110, 54], [126, 64]], 12, hair);
    if (h === "bun") front = `<path d="M66 82C64 56 82 46 100 46 120 46 138 56 134 82 124 66 112 60 100 60 88 60 76 66 66 82Z" fill="${hair}" ${st()}/>`;
    const eyes = [100 - 13, 100 + 13].map((x) => `<g class="ill-blink" style="transform-origin:${x}px ${eyeY}px"><ellipse cx="${x}" cy="${eyeY}" rx="3.8" ry="4.8" fill="${C.line}"/></g>`).join("");
    return `<g>
      ${back}
      <path d="M38 200C38 158 64 140 100 140 136 140 162 158 162 200Z" fill="${shirt}" ${st()}/>
      ${hijab ? "" : `<path d="M88 116V142C92 148 108 148 112 142V116Z" fill="${skin}" ${st()}/><path d="M86 142L100 158 114 142" fill="none" ${st(3)}/>`}
      ${hijab ? "" : `<circle cx="66" cy="92" r="8" fill="${skin}" ${st()}/><circle cx="134" cy="92" r="8" fill="${skin}" ${st()}/>`}
      ${o.hearingAid ? `<path d="M140 82C148 86 148 100 140 104" fill="none" stroke="${C.teal}" stroke-width="5" stroke-linecap="round"/>` : ""}
      ${hijab ? `<ellipse cx="100" cy="94" rx="28" ry="32" fill="${skin}" ${st()}/>` : `<ellipse cx="100" cy="88" rx="34" ry="38" fill="${skin}" ${st()}/>`}
      ${h === "bald" ? `<path d="M80 62C86 56 94 54 102 54" stroke="#fff" stroke-width="5" opacity=".45" stroke-linecap="round" fill="none"/>` : ""}
      ${front}
      ${o.beard ? `<path d="M68 94C68 122 84 130 100 130 116 130 132 122 132 94 126 106 114 110 100 110 86 110 74 106 68 94Z" fill="${hair}" ${st()}/>` : ""}
      ${o.brows ? `<path d="M80 ${eyeY - 11}H92M108 ${eyeY - 11}H120" stroke="${o.brows}" stroke-width="3.5" stroke-linecap="round"/>` : ""}
      ${eyes}
      <ellipse cx="80" cy="${eyeY + 13}" rx="6" ry="3.5" fill="${C.blush}" opacity=".55"/><ellipse cx="120" cy="${eyeY + 13}" rx="6" ry="3.5" fill="${C.blush}" opacity=".55"/>
      <path d="M91 ${eyeY + 16}Q100 ${eyeY + 23} 109 ${eyeY + 16}" fill="none" stroke="${o.beard ? skin : C.line}" stroke-width="3.5" stroke-linecap="round"/>
      ${o.glasses ? `<circle cx="87" cy="${eyeY}" r="10.5" fill="#fff" fill-opacity=".22" ${st(3)}/><circle cx="113" cy="${eyeY}" r="10.5" fill="#fff" fill-opacity=".22" ${st(3)}/><path d="M97.5 ${eyeY}H102.5" ${st(3)}/>` : ""}
      ${o.earrings && !hijab ? `<circle cx="66" cy="104" r="3.6" fill="${C.gold}" ${st(2)}/><circle cx="134" cy="104" r="3.6" fill="${C.gold}" ${st(2)}/>` : ""}
    </g>`;
  }
  /* The cast. Labels describe appearance neutrally for alt text; no one is tied to a financial situation. */
  const PEOPLE = [
    { skin: 4, hair: "curly", hairColor: "black", shirt: C.teal, glasses: true, label: "Person with curly hair and glasses" },
    { skin: 0, hair: "long", hairColor: "auburn", shirt: C.blush, label: "Person with long auburn hair" },
    { skin: 5, hair: "bald", beard: true, hairColor: "black", shirt: C.gold, label: "Person with a shaved head and beard" },
    { skin: 2, hair: "hijab", wrap: C.indigo, shirt: C.mint, label: "Person wearing a hijab" },
    { skin: 1, hair: "bun", hairColor: "black", shirt: C.sky, earrings: true, label: "Person with hair in a bun and earrings" },
    { skin: 1, hair: "bob", hairColor: "gray", shirt: C.mint, glasses: true, brows: "#b9bec7", label: "Older person with gray hair and glasses" },
    { skin: 3, hair: "locs", hairColor: "dark", shirt: C.indigo, label: "Person with long locs" },
    { skin: 2, hair: "short", hairColor: "brown", shirt: C.teal, hearingAid: true, label: "Person with short hair and a hearing aid" },
  ];
  const person = (i = 0, extra = {}) => `<svg viewBox="0 0 200 200" fill="none" role="img" aria-label="${PEOPLE[i % PEOPLE.length].label}">${bust({ ...PEOPLE[i % PEOPLE.length], ...extra })}</svg>`;
  const at = (x, y, k, inner) => `<g transform="translate(${x} ${y}) scale(${k})">${inner}</g>`;
  const drop = (x, y, d) => `<path class="ill-rain" style="--d:${d}s" d="M${x} ${y}C${x - 4} ${y + 6} ${x - 4} ${y + 10} ${x} ${y + 10}C${x + 4} ${y + 10} ${x + 4} ${y + 6} ${x} ${y}Z" fill="${C.sky}" ${st(2)}/>`;

  const ILLOS = {
    mascot: (o) => `<svg viewBox="0 0 200 200" fill="none">${mascotBody(o)}
      ${sparkle(30, 50, 9, C.white, "ill-twinkle", 0)}${sparkle(172, 64, 7, C.gold, "ill-twinkle", .6)}${sparkle(176, 160, 6, C.white, "ill-twinkle", 1.2)}
      ${plus(28, 150, 5)}${dot(160, 30, 3.5)}</svg>`,

    wizard: () => `<svg viewBox="0 0 200 200" fill="none">${mascotBody({ hat: true, wave: true })}
      ${sparkle(30, 46, 9, C.gold, "ill-twinkle", 0)}${sparkle(170, 40, 8, C.white, "ill-twinkle", .5)}${sparkle(178, 150, 6, C.white, "ill-twinkle", 1.1)}
      ${coin(28, 140, 11, "ill-float-a")}${plus(160, 90, 5)}${dot(40, 92, 3.5)}</svg>`,

    piggy: () => `<svg viewBox="0 0 200 200" fill="none">
      <ellipse cx="100" cy="182" rx="62" ry="7" fill="${C.line}" opacity=".14"/>
      <g class="ill-coin-drop">${coin(100, 30, 15)}</g>
      <g class="ill-bob-soft">
        <path d="M60 160V176H76V164M120 164V176H136V160" fill="${C.teal}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
        <path d="M44 118C44 88 70 70 102 70 128 70 146 82 154 98L170 102C176 104 178 110 178 118 178 126 176 132 170 134L154 138C146 156 126 166 100 166 66 166 44 146 44 118Z" fill="${C.body}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
        <path d="M120 78L132 56 142 86" fill="${C.mint}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
        <ellipse cx="166" cy="118" rx="12" ry="15" fill="${C.mint}" stroke="${C.line}" stroke-width="${SW}"/>
        ${dot(162, 113, 2.8)}${dot(162, 123, 2.8)}
        <g class="ill-blink" style="transform-origin:138px 106px"><ellipse cx="138" cy="106" rx="6" ry="7.5" fill="${C.line}"/><circle cx="140" cy="103" r="2.2" fill="#fff"/></g>
        <ellipse cx="146" cy="128" rx="7" ry="4.5" fill="${C.blush}" opacity=".85"/>
        <rect x="84" y="74" width="34" height="8" rx="4" fill="${C.line}"/>
        <path d="M62 100C66 90 74 84 84 81" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".55"/>
        <path d="M46 114C34 112 30 102 36 98 42 94 46 104 38 108" stroke="${C.line}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      </g>
      ${sparkle(36, 56, 9, C.white, "ill-twinkle", 0)}${sparkle(170, 50, 7, C.gold, "ill-twinkle", .7)}${plus(178, 160, 5)}${dot(30, 150, 3.5)}</svg>`,

    growth: () => `<svg viewBox="0 0 200 200" fill="none">
      <path d="M22 176H178" stroke="${C.line}" stroke-width="${SW}" stroke-linecap="round"/>
      ${[[52, 3], [100, 5], [148, 7]].map(([x, n], i) => Array.from({ length: n }, (_, k) => {
        const y = 166 - k * 12;
        return `<g class="ill-stack" style="--d:${(i * n + k) * .06}s"><path d="M${x - 20} ${y}V${y + 6}C${x - 20} ${y + 10} ${x + 20} ${y + 10} ${x + 20} ${y + 6}V${y}" fill="${C.goldLite}" stroke="${C.line}" stroke-width="3"/><ellipse cx="${x}" cy="${y}" rx="20" ry="5.5" fill="${C.gold}" stroke="${C.line}" stroke-width="3"/></g>`;
      }).join("")).join("")}
      <g class="ill-sprout" style="transform-origin:148px 88px">
        <path d="M148 86V58" stroke="${C.line}" stroke-width="${SW}" stroke-linecap="round"/>
        <path d="M148 70C134 70 124 62 123 48 137 47 147 56 148 70Z" fill="${C.teal}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
        <path d="M148 62C160 62 170 53 172 40 158 39 149 48 148 62Z" fill="${C.mint}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
      </g>
      <path class="ill-draw" d="M26 120L62 96 88 108 122 66" stroke="${C.indigo}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M108 64L122 66 120 80" stroke="${C.indigo}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" class="ill-draw-tip"/>
      ${sparkle(40, 50, 9, C.white, "ill-twinkle", 0)}${sparkle(184, 100, 6, C.gold, "ill-twinkle", .8)}${dot(80, 40, 3.5)}${plus(30, 76, 5)}</svg>`,

    insight: () => `<svg viewBox="0 0 200 200" fill="none">
      <g class="ill-orbit" style="transform-origin:100px 88px">${coin(36, 88, 11)}${coin(164, 88, 11)}${coin(100, 22, 9)}</g>
      <g class="ill-bob-soft">
        <path d="M100 38C126 38 146 58 146 84 146 100 138 112 128 120 122 125 120 130 120 136V142H80V136C80 130 78 125 72 120 62 112 54 100 54 84 54 58 74 38 100 38Z" fill="${C.goldLite}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
        <path d="M70 76C72 64 80 56 90 52" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".8"/>
        <path d="M88 142V110L94 100 100 110 106 100 112 110V142" stroke="${C.line}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
        <rect x="78" y="142" width="44" height="12" rx="4" fill="${C.sky}" stroke="${C.line}" stroke-width="${SW}"/>
        <rect x="82" y="154" width="36" height="12" rx="4" fill="${C.sky}" stroke="${C.line}" stroke-width="${SW}"/>
        <path d="M92 166V172H108V166" fill="${C.line}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
      </g>
      <g class="ill-rays" stroke="${C.line}" stroke-width="${SW}" stroke-linecap="round"><path d="M100 14V6M48 34L42 28M152 34L158 28M26 84H18M174 84H182"/></g>
      ${sparkle(160, 150, 8, C.white, "ill-twinkle", .3)}${sparkle(40, 150, 6, C.gold, "ill-twinkle", 1)}</svg>`,

    shield: () => `<svg viewBox="0 0 200 200" fill="none">
      <ellipse cx="100" cy="184" rx="50" ry="6" fill="${C.line}" opacity=".14"/>
      <g class="ill-bob-soft">
        <path d="M100 22L160 44V96C160 134 134 162 100 176 66 162 40 134 40 96V44Z" fill="${C.teal}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
        <path d="M100 36L148 54V96C148 126 128 150 100 162Z" fill="#fff" opacity=".14"/>
        <path d="M84 96V84C84 75 91 68 100 68 109 68 116 75 116 84V96" stroke="${C.line}" stroke-width="${SW}" stroke-linecap="round"/>
        <path d="M84 96V84C84 75 91 68 100 68 109 68 116 75 116 84V96" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".0"/>
        <rect x="72" y="94" width="56" height="44" rx="10" fill="${C.goldLite}" stroke="${C.line}" stroke-width="${SW}"/>
        <circle cx="100" cy="112" r="6" fill="${C.line}"/><path d="M100 114V126" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
      </g>
      <g class="ill-pop" style="--d:.4s"><circle cx="152" cy="148" r="18" fill="#5fb83a" stroke="${C.line}" stroke-width="${SW}"/><path d="M144 148L150 154 161 142" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g>
      ${sparkle(30, 40, 9, C.white, "ill-twinkle", 0)}${sparkle(176, 30, 7, C.gold, "ill-twinkle", .6)}${plus(26, 130, 5)}${dot(178, 92, 3.5)}</svg>`,

    target: () => `<svg viewBox="0 0 200 200" fill="none">
      <ellipse cx="94" cy="184" rx="52" ry="6" fill="${C.line}" opacity=".14"/>
      <circle cx="94" cy="108" r="66" fill="#fff" stroke="${C.line}" stroke-width="${SW}"/>
      <circle cx="94" cy="108" r="46" fill="${C.mint}" stroke="${C.line}" stroke-width="${SW}"/>
      <circle cx="94" cy="108" r="26" fill="${C.teal}" stroke="${C.line}" stroke-width="${SW}"/>
      <circle cx="94" cy="108" r="8" fill="${C.gold}" stroke="${C.line}" stroke-width="3"/>
      <g class="ill-arrow">
        <path d="M96 106L168 34" stroke="${C.line}" stroke-width="${SW + 1}" stroke-linecap="round"/>
        <path d="M160 26L168 34 176 42 190 28 182 20 176 14Z" fill="${C.blush}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
        <path d="M168 34L182 20" stroke="${C.line}" stroke-width="3"/>
      </g>
      ${sparkle(30, 40, 9, C.gold, "ill-twinkle", 0)}${sparkle(176, 150, 7, C.white, "ill-twinkle", .6)}${plus(24, 170, 5)}</svg>`,

    community: () => `<svg viewBox="0 0 200 200" fill="none">
      <ellipse cx="100" cy="184" rx="78" ry="7" fill="${C.line}" opacity=".14"/>
      <g class="ill-bob" style="--d:.3s">
        <path d="M58 98C86 98 100 120 100 144 100 168 82 178 58 178 34 178 16 168 16 144 16 120 30 98 58 98Z" fill="${C.sky}" stroke="${C.line}" stroke-width="${SW}"/>
        ${face(58, 134, .62)}
      </g>
      <g class="ill-bob">
        <path d="M142 92C172 92 186 116 186 142 186 168 166 178 142 178 118 178 98 168 98 142 98 116 112 92 142 92Z" fill="${C.body}" stroke="${C.line}" stroke-width="${SW}"/>
        ${face(142, 130, .62)}
      </g>
      <g class="ill-pop" style="--d:.2s">
        <path d="M70 22H130C138 22 144 28 144 36V56C144 64 138 70 130 70H108L96 82 94 70H70C62 70 56 64 56 56V36C56 28 62 22 70 22Z" fill="#fff" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
        <path d="M100 58S84 49 84 40A7 7 0 0 1 100 37 7 7 0 0 1 116 40C116 49 100 58 100 58Z" fill="${C.blush}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
      </g>
      ${sparkle(28, 52, 8, C.gold, "ill-twinkle", 0)}${sparkle(176, 44, 7, C.white, "ill-twinkle", .7)}</svg>`,

    learn: () => `<svg viewBox="0 0 200 200" fill="none">
      <ellipse cx="100" cy="182" rx="66" ry="7" fill="${C.line}" opacity=".14"/>
      <g class="ill-bob-soft">
        <path d="M100 86C82 76 56 74 30 80V168C56 162 82 164 100 174 118 164 144 162 170 168V80C144 74 118 76 100 86Z" fill="#fff" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
        <path d="M100 86V174" stroke="${C.line}" stroke-width="${SW}"/>
        <path d="M44 100C60 97 74 98 86 102M44 116C60 113 74 114 86 118M44 132C60 129 74 130 86 134M114 102C126 98 140 97 156 100M114 118C126 114 140 113 156 116" stroke="${C.mint}" stroke-width="5" stroke-linecap="round"/>
        <rect x="114" y="128" width="42" height="26" rx="4" fill="${C.teal}" stroke="${C.line}" stroke-width="3"/>
        <path d="M120 148L130 140 138 144 150 134" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <g class="ill-hat-float">
        <path d="M100 18L156 42 100 66 44 42Z" fill="${C.indigo}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
        <path d="M72 54V68C72 74 86 80 100 80 114 80 128 74 128 68V54L100 66Z" fill="${C.indigo}" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
        <path d="M156 42V66" stroke="${C.line}" stroke-width="3.5" stroke-linecap="round"/><circle cx="156" cy="70" r="5" fill="${C.gold}" stroke="${C.line}" stroke-width="3"/>
      </g>
      ${sparkle(26, 40, 8, C.white, "ill-twinkle", 0)}${sparkle(180, 110, 6, C.gold, "ill-twinkle", .8)}</svg>`,

    payoff: () => `<svg viewBox="0 0 200 200" fill="none">
      <path d="M20 56H62V92H100V128H140V164H182" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M20 56H62V92H100V128H140V164H182V180H20Z" fill="${C.mintLite}" opacity=".7"/>
      <g class="ill-bob-soft">
        <rect x="26" y="20" width="56" height="34" rx="6" fill="${C.indigo}" stroke="${C.line}" stroke-width="${SW}" transform="rotate(-8 54 37)"/>
        <path d="M30 32L84 24" stroke="${C.line}" stroke-width="5" transform="rotate(-8 54 37)"/>
      </g>
      <g class="ill-flag" style="transform-origin:162px 164px">
        <path d="M162 164V112" stroke="${C.line}" stroke-width="${SW}" stroke-linecap="round"/>
        <path d="M162 114H192L184 126 192 138H162Z" fill="#5fb83a" stroke="${C.line}" stroke-width="${SW}" stroke-linejoin="round"/>
      </g>
      ${coin(80, 74, 10, "ill-float-a")}${coin(120, 110, 10, "ill-float-b")}
      ${sparkle(120, 40, 8, C.gold, "ill-twinkle", .3)}${sparkle(180, 70, 6, C.white, "ill-twinkle", 1)}${plus(36, 150, 5)}</svg>`,

    connect: () => `<svg viewBox="0 0 200 200" fill="none">
      <rect x="62" y="26" width="76" height="148" rx="16" fill="#fff" stroke="${C.line}" stroke-width="${SW}"/>
      <rect x="72" y="44" width="56" height="108" rx="6" fill="${C.mintLite}"/>
      <rect x="88" y="34" width="24" height="5" rx="2.5" fill="${C.line}"/>
      <g transform="translate(70 62) scale(.3)">${logo().replace('viewBox="14 14 32.5 33.5"', 'viewBox="14 14 32.5 33.5" width="200" height="200"').replace('currentColor', C.teal)}</g>
      <rect x="80" y="134" width="40" height="10" rx="5" fill="${C.teal}"/>
      ${[[24, 60, C.sky, "bank"], [176, 70, C.goldLite, "card"], [28, 140, C.mint, "wallet"], [172, 146, C.blush, "trendUp"]].map(([x, y, f, ic], i) => `
        <path class="ill-dash" d="M${x < 100 ? x + 18 : x - 18} ${y}L${x < 100 ? 70 : 130} ${100}" stroke="${C.line}" stroke-width="2.5" stroke-dasharray="4 6" stroke-linecap="round"/>
        <g class="ill-pop" style="--d:${i * .15}s"><circle cx="${x}" cy="${y}" r="18" fill="${f}" stroke="${C.line}" stroke-width="${SW}"/>
        <g transform="translate(${x - 10} ${y - 10}) scale(.83)" stroke="${C.line}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">${I[ic]}</g></g>`).join("")}
    </svg>`,

    /* ---------- people scenes ---------- */
    celebrate: (o = {}) => { const p = PEOPLE[o.who ?? 4]; return `<svg viewBox="0 0 200 200" fill="none">
      <g class="ill-cheer">
        <path d="M60 172C46 150 38 122 42 96" fill="none" stroke="${C.line}" stroke-width="20" stroke-linecap="round"/><path d="M60 172C46 150 38 122 42 96" fill="none" stroke="${p.shirt}" stroke-width="12" stroke-linecap="round"/>
        <path d="M140 172C154 150 162 122 158 96" fill="none" stroke="${C.line}" stroke-width="20" stroke-linecap="round"/><path d="M140 172C154 150 162 122 158 96" fill="none" stroke="${p.shirt}" stroke-width="12" stroke-linecap="round"/>
        <circle cx="42" cy="88" r="10" fill="${SKIN[p.skin]}" ${st()}/><circle cx="158" cy="88" r="10" fill="${SKIN[p.skin]}" ${st()}/>
        ${at(10, 22, .9, bust(p))}
      </g>
      ${[[30, 30, C.gold, 0], [70, 14, C.teal, .5], [128, 18, C.blush, .9], [170, 34, C.sky, .3], [100, 6, C.mint, 1.2], [182, 70, C.gold, 1.6], [18, 66, C.indigo, 1.9]].map(([x, y, f, d]) => `<rect class="ill-confetti" style="--d:${d}s" x="${x}" y="${y}" width="9" height="13" rx="2" fill="${f}" ${st(2)}/>`).join("")}
    </svg>`; },

    wheelchair: (o = {}) => { const p = { ...PEOPLE[o.who ?? 0] }; return `<svg viewBox="0 0 200 200" fill="none">
      <path d="M8 186H192" ${st()}/>
      <path class="ill-dash" d="M10 118H34M4 136H26M14 154H34" stroke="${C.line}" stroke-width="3" stroke-dasharray="6 8" stroke-linecap="round" opacity=".5"/>
      <path d="M66 122H128L148 170M68 122L62 74H48" fill="none" ${st()}/>
      <path d="M110 118L142 126 146 160" fill="none" stroke="${C.line}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M110 118L142 126 146 160" fill="none" stroke="#3b4a8c" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
      <ellipse cx="154" cy="166" rx="11" ry="6" fill="${C.line}"/>
      ${at(48, 22, .5, bust(p))}
      <g class="ill-wheel" style="transform-origin:92px 146px"><circle cx="92" cy="146" r="38" fill="#fff" fill-opacity=".35" ${st()}/><circle cx="92" cy="146" r="31" ${st(2)} opacity=".35"/>
        <path d="M92 108V184M54 146H130M65 119L119 173M119 119L65 173" stroke="${C.line}" stroke-width="2" opacity=".55"/><circle cx="92" cy="146" r="6" fill="${C.gold}" ${st(2.5)}/></g>
      <circle cx="152" cy="178" r="8" fill="#fff" ${st()}/>
      ${coin(176, 88, 12, "ill-float-a")}${sparkle(150, 52, 7, C.white, "ill-twinkle", .4)}
    </svg>`; },

    family: () => `<svg viewBox="0 0 200 200" fill="none">
      <path d="M104 104L148 70 192 104V168H104Z" fill="${C.mintLite}" ${st()}/><rect x="136" y="128" width="22" height="40" rx="3" fill="${C.teal}" ${st()}/>
      ${at(-6, 46, .78, bust(PEOPLE[6]))}
      ${at(86, 90, .55, bust({ skin: 3, hair: "curly", hairColor: "dark", shirt: C.gold }))}
      <g class="ill-float-b"><path d="M104 44S92 36 92 28A6 6 0 0 1 104 25 6 6 0 0 1 116 28C116 36 104 44 104 44Z" fill="${C.blush}" ${st(3)}/></g>
      ${sparkle(30, 30, 7, C.gold, "ill-twinkle", 0)}${plus(184, 40, 5)}
    </svg>`,

    elder: () => `<svg viewBox="0 0 200 200" fill="none">
      ${at(-16, 4, 1, bust(PEOPLE[5]))}
      <g class="ill-float-a"><circle cx="160" cy="58" r="22" fill="#fff" ${st()}/><path d="M160 70S148 62 148 54A6 6 0 0 1 160 51 6 6 0 0 1 172 54C172 62 160 70 160 70Z" fill="${C.blush}" ${st(3)}/></g>
      <g class="ill-float-b"><path d="M168 104L188 112V128C188 140 180 148 168 152 156 148 148 140 148 128V112Z" fill="${C.teal}" ${st()}/><path d="M160 128L166 134 176 122" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>
      ${sparkle(140, 20, 6, C.gold, "ill-twinkle", .6)}
    </svg>`,

    student: () => `<svg viewBox="0 0 200 200" fill="none">
      ${at(0, 0, 1, bust(PEOPLE[3]))}
      <rect x="54" y="134" width="92" height="52" rx="7" fill="${C.indigo}" ${st()}/>
      <path d="M100 152V166M100 158C94 158 90 154 90 148 96 148 100 152 100 158ZM100 155C105 155 109 151 109 146 104 146 100 150 100 155Z" fill="${C.mint}" stroke="${C.mint}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M40 196H160L150 186H50Z" fill="#c3cbca" ${st()}/>
      <g class="ill-float-a"><rect x="138" y="22" width="52" height="38" rx="8" fill="#fff" ${st()}/><path class="ill-draw" d="M146 50L156 42 166 46 182 32" stroke="${C.teal}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:60"/></g>
      ${sparkle(22, 40, 7, C.gold, "ill-twinkle", 0)}
    </svg>`,

    /* ---------- mascot friends ---------- */
    penny: () => `<svg viewBox="0 0 200 200" fill="none">
      <ellipse class="ill-hop-shadow" cx="100" cy="182" rx="40" ry="6" fill="${C.line}" opacity=".14"/>
      <g class="ill-hop">
        <ellipse cx="80" cy="168" rx="11" ry="7" fill="${C.line}"/><ellipse cx="120" cy="168" rx="11" ry="7" fill="${C.line}"/>
        <path d="M48 112C36 106 32 96 36 88M152 112C164 106 168 96 164 88" fill="none" ${st()}/>
        <circle cx="100" cy="106" r="58" fill="${C.gold}" ${st()}/>
        <circle cx="100" cy="106" r="46" stroke="${C.line}" stroke-width="2.5" opacity=".3"/>
        <path d="M64 86C68 72 78 62 92 58" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".6"/>
        ${face(100, 104, .85)}
      </g>
      ${sparkle(36, 40, 8, C.white, "ill-twinkle", 0)}${sparkle(168, 52, 7, C.gold, "ill-twinkle", .8)}${plus(176, 150, 5)}
    </svg>`,

    owl: () => `<svg viewBox="0 0 200 200" fill="none">
      <rect x="44" y="168" width="112" height="18" rx="4" fill="${C.teal}" ${st()}/><path d="M52 177H148" stroke="#fff" stroke-width="3" opacity=".6"/>
      <g class="ill-tilt">
        <path d="M66 70L58 44 84 58M134 70L142 44 116 58" fill="${C.indigo}" ${st()}/>
        <path d="M100 52C140 52 154 88 154 124 154 156 132 172 100 172 68 172 46 156 46 124 46 88 60 52 100 52Z" fill="${C.indigo}" ${st()}/>
        <ellipse cx="100" cy="136" rx="32" ry="28" fill="${C.mintLite}" ${st(3)}/>
        <path d="M88 128L92 134 96 128M104 128L108 134 112 128M96 142L100 148 104 142" stroke="${C.line}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>
        <path d="M48 116C34 128 38 150 54 156M152 116C166 128 162 150 146 156" fill="${C.indigo}" ${st()}/>
        <circle cx="80" cy="96" r="19" fill="#fff" ${st()}/><circle cx="120" cy="96" r="19" fill="#fff" ${st()}/>
        <g class="ill-blink" style="transform-origin:80px 96px"><circle cx="82" cy="97" r="8" fill="${C.line}"/><circle cx="85" cy="94" r="2.6" fill="#fff"/></g>
        <g class="ill-blink" style="transform-origin:120px 96px"><circle cx="122" cy="97" r="8" fill="${C.line}"/><circle cx="125" cy="94" r="2.6" fill="#fff"/></g>
        <path d="M94 112L100 122 106 112Z" fill="${C.gold}" ${st(3)}/>
      </g>
      <path d="M84 170V176M92 170V176M108 170V176M116 170V176" stroke="${C.gold}" stroke-width="5" stroke-linecap="round"/>
      ${sparkle(30, 46, 8, C.gold, "ill-twinkle", 0)}${sparkle(172, 60, 6, C.white, "ill-twinkle", .7)}
    </svg>`,

    umbrella: () => `<svg viewBox="0 0 200 200" fill="none">
      ${drop(18, 70, 0)}${drop(36, 104, .6)}${drop(166, 84, .3)}${drop(186, 116, .9)}${drop(14, 136, 1.2)}
      <g transform="translate(22 46) scale(.78)">${mascotBody({ leaves: false, anim: "ill-breathe" })}</g>
      <path d="M100 66V124C100 132 108 134 112 128" fill="none" ${st()}/>
      <g class="ill-sway"><path d="M28 72C38 32 68 14 100 14 132 14 162 32 172 72 162 64 152 64 136 72 124 64 112 64 100 72 88 64 76 64 64 72 48 64 38 64 28 72Z" fill="${C.teal}" ${st()}/>
        <path d="M100 14C88 30 82 50 82 70M100 14C112 30 118 50 118 70" ${st(2.5)} opacity=".5"/><path d="M100 14V8" ${st()}/></g>
    </svg>`,

    /* ---------- small states ---------- */
    sleeping: () => `<svg viewBox="0 0 200 200" fill="none">${mascotBody({ mood: "sleep", anim: "ill-breathe" })}
      <text class="ill-zzz" style="--d:0s" x="150" y="62" font-family="Lora, Georgia, serif" font-style="italic" font-weight="600" font-size="22" fill="${C.line}">z</text>
      <text class="ill-zzz" style="--d:1.1s" x="164" y="44" font-family="Lora, Georgia, serif" font-style="italic" font-weight="600" font-size="17" fill="${C.line}">z</text>
      <text class="ill-zzz" style="--d:2.2s" x="176" y="28" font-family="Lora, Georgia, serif" font-style="italic" font-weight="600" font-size="13" fill="${C.line}">z</text>
    </svg>`,

    watering: () => `<svg viewBox="0 0 200 200" fill="none">
      <g transform="translate(-14 62) scale(.66)">${mascotBody({ anim: "ill-breathe" })}</g>
      <g class="ill-water">
        <path d="M102 104H138V136C138 142 134 146 128 146H112C106 146 102 142 102 136Z" fill="${C.sky}" ${st()}/>
        <path d="M138 112L162 98" ${st(6)}/><path d="M138 112L162 98" stroke="${C.sky}" stroke-width="2"/>
        <path d="M102 112C92 112 90 128 102 130" fill="none" ${st()}/>
      </g>
      ${[0, .25, .5].map((d, i) => `<circle class="ill-drip" style="--d:${d}s" cx="${164 + i * 3}" cy="${110 + i * 4}" r="3" fill="${C.sky}" ${st(1.5)}/>`).join("")}
      <path d="M144 158H184L178 186H150Z" fill="${C.blush}" ${st()}/>
      <g class="ill-grow-soft"><path d="M164 158V140" ${st()}/><path d="M164 148C156 148 150 142 150 134 158 134 164 140 164 148Z" fill="${C.teal}" ${st(3)}/><path d="M164 144C171 144 176 138 176 131 169 131 164 137 164 144Z" fill="${C.mint}" ${st(3)}/></g>
    </svg>`,
  };

  function illo(name, opts = {}) {
    const f = ILLOS[name];
    return f ? f(opts) : "";
  }

  /* Illustration motion — scoped by class so every page gets it */
  const css = `
    .ill-bob{animation:a-bob 3.6s var(--ease-in-out,ease-in-out) infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center bottom}
    .ill-bob-soft{animation:a-float 4.5s ease-in-out infinite}
    .ill-blink{animation:a-blink 5s infinite;transform-box:fill-box}
    .ill-twinkle{animation:a-twinkle 2.4s ease-in-out infinite;animation-delay:var(--d,0s)}
    .ill-wave{animation:ill-wave 1.6s ease-in-out infinite;transform-box:view-box}
    .ill-coin-drop{animation:ill-drop 2.8s cubic-bezier(.55,0,.75,.2) infinite}
    .ill-orbit{animation:ill-spin 18s linear infinite}
    .ill-orbit > g{animation:ill-spin 18s linear infinite reverse;transform-box:fill-box;transform-origin:center}
    .ill-float-a{animation:a-float 3.2s ease-in-out infinite}
    .ill-float-b{animation:a-float 3.8s ease-in-out .6s infinite}
    .ill-hat-float{animation:a-float 3s ease-in-out infinite}
    .ill-arrow{animation:ill-thunk 3.6s var(--ease-out,ease-out) infinite}
    .ill-flag{animation:ill-flutter 2s ease-in-out infinite;transform-box:view-box}
    .ill-pop{animation:a-pop .6s var(--ease-spring,ease-out) both;animation-delay:var(--d,0s)}
    .ill-sprout{animation:ill-grow 3.6s var(--ease-spring,ease-out) infinite;transform-box:view-box}
    .ill-stack{animation:a-pop .5s var(--ease-spring,ease-out) both;animation-delay:var(--d,0s)}
    .ill-draw{stroke-dasharray:160;animation:ill-draw 3.6s var(--ease-out,ease-out) infinite}
    .ill-dash{animation:ill-march 1.2s linear infinite}
    .ill-rays{animation:a-twinkle 2.4s ease-in-out infinite}
    @keyframes ill-wave{0%,100%{transform:rotate(0)}50%{transform:rotate(-14deg)}}
    @keyframes ill-drop{0%{transform:translateY(-20px);opacity:0}15%{opacity:1}60%{transform:translateY(44px);opacity:1}72%,100%{transform:translateY(50px);opacity:0}}
    @keyframes ill-spin{to{transform:rotate(360deg)}}
    @keyframes ill-thunk{0%{transform:translate(40px,-40px);opacity:0}18%{transform:translate(0,0);opacity:1}22%{transform:translate(-2px,2px)}26%,85%{transform:none;opacity:1}100%{opacity:0}}
    @keyframes ill-flutter{0%,100%{transform:skewY(0)}50%{transform:skewY(-4deg)}}
    @keyframes ill-grow{0%{transform:scale(0)}25%,85%{transform:scale(1)}100%{transform:scale(1)}}
    @keyframes ill-draw{0%{stroke-dashoffset:160}40%,100%{stroke-dashoffset:0}}
    @keyframes ill-march{to{stroke-dashoffset:-20}}
    .ill-hop{animation:ill-hop 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center bottom}
    .ill-hop-shadow{animation:ill-hop-shadow 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
    .ill-tilt{animation:ill-tilt 5s ease-in-out infinite;transform-box:view-box;transform-origin:100px 130px}
    .ill-rain{animation:ill-rain 1.8s linear infinite;animation-delay:var(--d,0s)}
    .ill-zzz{animation:ill-zzz 3.3s ease-in-out infinite;animation-delay:var(--d,0s);opacity:0}
    .ill-breathe{animation:ill-breathe 4.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center bottom}
    .ill-wheel{animation:ill-spin 4s linear infinite;transform-box:view-box}
    .ill-confetti{animation:ill-confetti 2.8s ease-in infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
    .ill-cheer{animation:ill-cheer 1.6s ease-in-out infinite}
    .ill-sway{animation:ill-sway 4s ease-in-out infinite;transform-box:view-box;transform-origin:100px 70px}
    .ill-water{animation:ill-pour 2.6s ease-in-out infinite;transform-box:view-box;transform-origin:110px 120px}
    .ill-drip{animation:ill-drip 2.6s ease-in infinite;animation-delay:var(--d,0s);opacity:0}
    .ill-grow-soft{animation:ill-grow-soft 5.2s ease-in-out infinite;transform-box:view-box;transform-origin:164px 158px}
    @keyframes ill-hop{0%,100%{transform:translateY(0) scale(1)}12%{transform:translateY(0) scale(1.04,.95)}42%{transform:translateY(-14px) scale(.98,1.03)}70%{transform:translateY(0) scale(1.03,.97)}82%{transform:none}}
    @keyframes ill-hop-shadow{0%,100%,70%{transform:scale(1)}42%{transform:scale(.78);opacity:.08}}
    @keyframes ill-tilt{0%,55%,100%{transform:rotate(0)}68%{transform:rotate(-7deg)}84%{transform:rotate(5deg)}}
    @keyframes ill-rain{0%{transform:translateY(-10px);opacity:0}20%{opacity:1}100%{transform:translateY(40px);opacity:0}}
    @keyframes ill-zzz{0%{transform:translate(0,8px);opacity:0}30%{opacity:1}100%{transform:translate(10px,-20px);opacity:0}}
    @keyframes ill-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,.975)}}
    @keyframes ill-confetti{0%{transform:translateY(-12px) rotate(0);opacity:0}15%{opacity:1}100%{transform:translateY(36px) rotate(170deg);opacity:0}}
    @keyframes ill-cheer{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
    @keyframes ill-sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
    @keyframes ill-pour{0%,100%{transform:rotate(0)}40%,70%{transform:rotate(-18deg)}}
    @keyframes ill-drip{0%,38%{transform:translateY(0);opacity:0}46%{opacity:1}80%{transform:translateY(40px);opacity:0}100%{opacity:0}}
    @keyframes ill-grow-soft{0%,100%{transform:scale(.6)}45%,90%{transform:scale(1)}}
    /* Off-screen art pauses; data-still art never moves. Keeps the page calm. */
    .ill-offscreen *{animation-play-state:paused!important}
    [data-still] *{animation:none!important}
    @media (prefers-reduced-motion: reduce){[class^="ill-"],[class*=" ill-"]{animation:none!important}}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("ill-offscreen", !e.isIntersecting)), { rootMargin: "80px" }) : null;
  function hydrate(root = document) {
    root.querySelectorAll("[data-person]").forEach((el) => { el.innerHTML = person(+el.dataset.person || 0); });
    root.querySelectorAll("[data-logo]").forEach((el) => {
      el.innerHTML = logo({ tile: el.hasAttribute("data-tile"), color: el.dataset.color || "currentColor" });
    });
    root.querySelectorAll("[data-icon]").forEach((el) => { el.innerHTML = icon(el.dataset.icon, el.dataset.size || 24); });
    root.querySelectorAll("[data-illo]").forEach((el) => {
      el.innerHTML = illo(el.dataset.illo, { hat: el.hasAttribute("data-hat"), wave: el.hasAttribute("data-wave"), mood: el.dataset.mood, who: el.dataset.who != null ? +el.dataset.who : undefined });
      el.setAttribute("role", "img");
      if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", `${el.dataset.illo} illustration`);
    });
    if (io) root.querySelectorAll("[data-illo], [data-person], .ill").forEach((el) => io.observe(el));
  }

  window.AureumArt = { logo, icon, illo, person, hydrate, ICONS: Object.keys(I), ILLOS: Object.keys(ILLOS), PEOPLE: PEOPLE.map((p) => p.label), palette: C };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => hydrate());
  else hydrate();
})();
