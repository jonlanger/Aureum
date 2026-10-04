/* Aureum app — small UI helpers: escaping, icons, sheets, toasts, confetti. */
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const ic = (name, size = 24) => window.AureumArt.icon(name, size);
export const illo = (name, opts) => `<div class="ill" aria-hidden="true">${window.AureumArt.illo(name, opts)}</div>`;
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- bottom sheet built on <dialog> (native focus trap + Esc) ---------- */
export function sheet({ title, body, foot, onMount, onClose }) {
  const d = document.createElement("dialog");
  d.className = "sheet";
  d.setAttribute("aria-label", title);
  d.innerHTML = `<div class="sheet__grab" aria-hidden="true"></div>
    <div class="sheet__head"><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="Close">${ic("x", 20)}</button></div>
    <div class="sheet__body">${body}</div>${foot ? `<div class="sheet__foot">${foot}</div>` : ""}`;
  document.body.appendChild(d);
  const close = () => { d.close(); };
  d.addEventListener("close", () => { d.remove(); onClose && onClose(); });
  d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) close(); });
  d.showModal();
  onMount && onMount(d, close);
  return { el: d, close };
}

let toastTimer;
export function toast(msg, icon = "check") {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.innerHTML = `${ic(icon, 20)}<span>${esc(msg)}</span>`;
  requestAnimationFrame(() => t.classList.add("is-on"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-on"), 2600);
}

export function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("div"); c.className = "confetti"; c.setAttribute("aria-hidden", "true");
  const colors = ["#00918b", "#8fdcd7", "#f6b93b", "#3d3db8", "#f7a785", "#5fb83a"];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.setProperty("--dx", (Math.random() - 0.5) * 200 + "px");
    p.style.setProperty("--r", Math.random() * 720 + "deg");
    p.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
    p.style.animationDelay = Math.random() * 0.3 + "s";
    c.appendChild(p);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 3800);
}

/** Parse a currency-ish string to a number ("$1,250.50" → 1250.5). */
export const num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isFinite(n) ? n : 0; };

/** Money input markup. */
export const fmtNum = (v) => { const n = typeof v === "number" ? v : num(v); return v === "" || v == null ? "" : n.toLocaleString("en-US", { maximumFractionDigits: 2 }); };
document.addEventListener("focusout", (e) => { const i = e.target; if (i.matches?.(".money-input input") && i.value.trim() && !i.closest("[data-pct]")) i.value = fmtNum(i.value); });
export const moneyField = (id, label, value = "", { hint, size = "", placeholder = "0" } = {}) => `
  <div><label class="field-label" for="${id}">${esc(label)}</label>
  <div class="money-input ${size}"><span>$</span><input id="${id}" name="${id}" inputmode="decimal" autocomplete="off" placeholder="${placeholder}" value="${value === "" ? "" : esc(fmtNum(value))}"></div>
  ${hint ? `<div class="field-hint">${esc(hint)}</div>` : ""}</div>`;
