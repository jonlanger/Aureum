/* ==========================================================================
   Aureum app — router + views. Hash routes, one render per state change.
   ========================================================================== */
import * as E from "./engine.js";
import * as Store from "./store.js";
import { evaluate, NUDGE_LEVELS, LESSON_TITLES } from "./rules.js";
import { renderOnboarding } from "./onboarding.js";
import { LESSONS } from "./lessons.js";
import { esc, ic, illo, $, $$, sheet, toast, confetti, num, moneyField } from "./ui.js";

const { money, pct, compact } = E;
const V = window.AureumViz;
const root = document.documentElement;
const view = $("#view");

/* ---------------- theme ---------------- */
function applyTheme() {
  const t = Store.getState()?.settings?.theme;
  if (t) root.dataset.theme = t; else delete root.dataset.theme;
}

/* ---------------- routing ---------------- */
const TABS = [
  { route: "#/home", label: "Home", icon: "bank" },
  { route: "#/budget", label: "Budget", icon: "pie" },
  { route: "#/plan", label: "Plan", icon: "target" },
  { route: "#/goals", label: "Goals", icon: "piggy" },
  { route: "#/coach", label: "Coach", icon: "sparkle" },
];
function parse() {
  const [path, q] = (location.hash || "#/home").split("?");
  const parts = path.replace(/^#\//, "").split("/");
  return { path, parts, query: new URLSearchParams(q || "") };
}
let lastPath = null;
function render() {
  const st = Store.getState();
  const r = parse();
  if (!st || !st.onboarded || r.parts[0] === "welcome") { document.body.classList.add("is-onboarding"); return renderOnboarding($("#ob"), 0, (to) => { location.hash = to; document.body.classList.remove("is-onboarding"); render(); }); }
  if (st.settings.signedOut) { document.body.classList.add("is-onboarding"); return renderWelcomeBack(st); }
  document.body.classList.remove("is-onboarding");
  $("#ob").innerHTML = "";
  applyTheme();
  const ev = evaluate(st);
  Store.recordScore(ev.ctx.health.score);
  const key = r.parts[0] || "home";
  const fn = VIEWS[key] || VIEWS.home;
  const out = fn(st, ev, r);
  view.innerHTML = out.html + `<p class="disclaimer">Aureum is a financial coach, not a licensed financial advisor. Guidance is general and educational. ${st.demo ? "You're exploring demo data." : ""}</p>`;
  if (lastPath !== r.path) { view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter"); window.scrollTo(0, 0); }
  lastPath = r.path;
  window.AureumArt.hydrate(view);
  out.mount && out.mount(st, ev, r);
  chrome(st, ev, r, out.title);
}
function chrome(st, ev, r, title) {
  const tabRoute = "#/" + (["goals", "debt"].includes(r.parts[0]) ? "goals" : ["learn"].includes(r.parts[0]) ? "coach" : r.parts[0] || "home");
  $$(".tabs a, .side nav a").forEach((a) => a.setAttribute("aria-current", a.getAttribute("href") === tabRoute ? "page" : "false"));
  $("#topTitle").textContent = title || "";
  $("#topTitle").hidden = !title;
  $(".topbar .a-logo").style.visibility = title ? "hidden" : "visible";
  if (title) $(".topbar .a-logo").style.position = "absolute"; else $(".topbar .a-logo").style.position = "";
  const urgent = ev.insights.some((i) => i.severity === "urgent");
  $("#bellDot").hidden = !urgent;
  $$(".avatar-btn").forEach((b) => (b.textContent = (st.profile.name || "?").slice(0, 1).toUpperCase()));
  $("#sideHealth").innerHTML = `<b>${ev.ctx.health.score}</b><div><strong style="font-size:14px">Health score</strong><span>${ev.ctx.health.grade} · tap for details</span></div>`;
  $(".fab").classList.toggle("is-hidden", ["settings", "learn"].includes(r.parts[0]) || /^goals\/./.test(r.parts.join("/")));
  document.title = `${title || "Home"} · Aureum`;
}

/* ---------------- shared pieces ---------------- */
const SEV = { urgent: ["Heads up", "alert"], suggest: ["Suggestion", "sparkle"], celebrate: ["Nice work", "trendUp"], learn: ["Learn", "book"] };
function insightCard(i, idx = 0) {
  const [kicker, icon] = SEV[i.severity];
  const a = i.action;
  return `<article class="insight insight--${i.severity}" style="--i:${idx}" data-insight="${esc(i.id)}">
    <span class="insight__ico">${ic(icon, 24)}</span>
    <div class="insight__head"><div class="insight__kicker">${kicker}${i.impact > 50 && !i.title.includes("$") ? ` · ~${compact(i.impact)}/yr` : ""}</div><h3 class="insight__title">${esc(i.title)}</h3></div>
    <p class="insight__body">${esc(i.body)}</p>
    <div class="insight__actions">
      ${a ? `<button class="a-btn btn-lg2 primary ${i.severity === "learn" ? "btn-soft" : ""}" data-op='${esc(JSON.stringify(a))}' data-rule="${esc(i.id)}">${esc(a.label)}</button>` : ""}
      <button class="a-btn a-btn--ghost btn-lg2" data-why aria-expanded="false">Why?</button>
      ${i.severity !== "celebrate" ? `<button class="a-btn a-btn--ghost btn-lg2" data-snooze="${esc(i.id)}">Later</button>` : ""}
    </div>
    <div class="insight__why" hidden>${esc(i.why)}${i.source ? `<small>Source: ${esc(i.source)}</small>` : ""}</div>
    <button class="insight__x" data-dismiss="${esc(i.id)}" aria-label="Dismiss">${ic("x", 18)}</button>
  </article>`;
}
const coachRail = (ev) => `<div class="stack">
  <a class="health-mini" href="#/coach"><div id="railGauge" style="width:72px"></div><div><b>${ev.ctx.health.score}</b><span>Health score · ${ev.ctx.health.grade}</span></div></a>
  <div class="section-title" style="margin:8px 4px 0">Sprout says <a class="link-btn" href="#/coach">All</a></div>
  ${ev.insights.length ? ev.insights.map(insightCard).join("") : emptyCoach()}
</div>`;
const emptyCoach = () => `<div class="card empty">${illo("sleeping")}<h3>All quiet</h3><p class="muted">Nothing needs your attention. Enjoy your day.</p></div>`;
const txnRow = (t) => { const c = E.CATEGORIES[t.category] || { label: t.category, icon: "wallet" }; const d = new Date(t.date + "T00:00"); return `<div class="row"><span class="row__ico">${ic(c.icon, 21)}</span><div><div class="row__t">${esc(t.merchant)}</div><div class="row__s">${esc(c.label)} · ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div></div><div class="row__v ${t.amount > 0 ? "pos" : ""}">${t.amount > 0 ? "+" : ""}${money(t.amount, 2)}</div></div>`; };
const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
const efDisplay = (ctx) => { const tgt = ctx.efSaved < ctx.ef.starter ? ctx.ef.starter : ctx.ef.full; return { target: tgt, label: ctx.efSaved < ctx.ef.starter ? "Starter cushion" : `${ctx.ef.months}-month safety net` }; };
const fmtDay = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

function stepCTA(step, ctx) {
  switch (step.id) {
    case "essentials": return `<a class="a-btn btn-xl btn-block" href="#/budget">Review my budget ${ic("arrowRight", 22)}</a>`;
    case "starter": case "fullfund": return `<button class="a-btn btn-xl btn-block" data-act="add-fund">Add to my fund ${ic("plus", 22)}</button>`;
    case "match": return `<a class="a-btn btn-xl btn-block" href="#/plan#match">Claim my match ${ic("arrowRight", 22)}</a>`;
    case "highdebt": case "middebt": return `<a class="a-btn btn-xl btn-block" href="#/debt">Open my payoff plan ${ic("arrowRight", 22)}</a>`;
    case "retire15": return `<button class="a-btn btn-xl btn-block" data-op='{"op":"remind"}'>Remind me to add 1% ${ic("bell", 22)}</button>`;
    default: return `<a class="a-btn btn-xl btn-block" href="#/goals">Fund a goal ${ic("arrowRight", 22)}</a>`;
  }
}

/* ======================================================================
   VIEWS
   ====================================================================== */
const VIEWS = {
  /* ---------------- HOME ---------------- */
  home(st, ev) {
    const c = ev.ctx, s = c.sts, step = c.map.active;
    const up = E.upcoming(st, 14).slice(0, 4);
    const html = `
      <div class="page-head"><h1>${greeting()}, ${esc(st.profile.name)}.</h1><p>${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p></div>
      <div class="with-rail"><div class="stack">
        <section class="hero-card" aria-label="Safe to spend">
          <div class="lbl">${ic("wallet", 18)} Safe to spend until ${s.until.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
          <div class="big" id="sts">${money(s.amount)}</div>
          <div class="sub">About <b>${money(s.perDay)} a day</b> for the next ${s.days} days</div>
          <div class="chips"><span>${ic("check", 15)} ${money(s.bills)} bills covered</span><span>${ic("piggy", 15)} ${money(s.plannedSave)} set aside for your plan</span></div>
          <div class="sprout">${window.AureumArt.illo("mascot")}</div>
        </section>
        <div class="stack hide-desktop">${ev.insights.slice(0, 2).map(insightCard).join("")}
          ${ev.insights.length > 2 ? `<a class="a-btn a-btn--secondary btn-lg2 btn-block" href="#/coach">See ${ev.insights.length - 2} more from Sprout</a>` : ""}</div>
        <section class="next card" aria-label="Your next step">
          <div><div class="k">Step ${step.n} of ${c.map.steps.length} · Your next step</div><h2>${esc(step.title)}</h2></div>
          <div class="art">${window.AureumArt.illo(step.illo)}</div>
          <div class="a-progress a-progress--lg"><span style="--value:${Math.round(step.progress * 100)}%"></span></div>
          <div class="meta"><span>${step.target ? `${money(step.current)} of ${money(step.target)}` : pct(step.progress) + " there"}</span><a class="link-btn" href="#/plan" style="padding:0;min-height:0">See full map</a></div>
          ${stepCTA(step, c)}
        </section>
        <section class="card">
          <div class="card__head"><div><h2>Next 30 days</h2><p>Checking balance, based on bills, paychecks and your usual spending</p></div>
            ${c.fc.low.value < E.ASSUMPTIONS.cushion ? `<span class="a-chip a-chip--warn">${ic("alert", 14)} Low ${fmtDay(c.fc.low.date).replace(/^\w+, /, "")}</span>` : `<span class="a-chip a-chip--good">${ic("check", 14)} Covered</span>`}</div>
          <div id="fc"></div>
        </section>
        <div class="grid2">
          <section class="card"><div class="card__head"><h2>Coming up</h2></div><div class="rows">
            ${up.length ? up.map((e) => `<div class="row"><span class="row__ico">${ic(E.CATEGORIES[e.category]?.icon || "calendar", 21)}</span><div><div class="row__t">${esc(e.name)}</div><div class="row__s">${fmtDay(e.date)}</div></div><div class="row__v ${e.kind === "income" ? "pos" : ""}">${e.kind === "income" ? "+" : "−"}${money(e.amount)}</div></div>`).join("") : `<p class="muted">Nothing scheduled in the next two weeks.</p>`}
          </div></section>
          <section class="card"><div class="card__head"><h2>Recent</h2><a class="link-btn" href="#/budget">All ${ic("arrowRight", 16)}</a></div><div class="rows">
            ${st.transactions.slice(0, 4).map(txnRow).join("") || `<div class="empty"><p class="muted">No transactions yet. Tap <b>Add</b> to log your first one.</p></div>`}
          </div></section>
        </div>
      </div><aside>${coachRail(ev)}</aside></div>`;
    return { html, title: "", mount() {
      V.countUp($("#sts"), s.amount, { duration: 900, format: (v) => money(v) });
      V.line($("#fc"), { label: "Projected checking balance", labels: c.fc.labels, series: [{ name: "Checking", values: c.fc.series, color: "var(--viz-2)" }], area: true, height: 220, yMin: Math.min(0, c.fc.low.value), refLine: { value: E.ASSUMPTIONS.cushion, label: "Cushion" }, markers: c.fc.low.value < E.ASSUMPTIONS.cushion ? [{ i: c.fc.low.index, label: "Low point" }] : [] });
      mountRail(ev);
    } };
  },

  /* ---------------- PLAN (Money Map) ---------------- */
  plan(st, ev, r) {
    const c = ev.ctx, map = c.map, plan = c.plan, mg = c.match;
    const fresh = r.query.get("new");
    const html = `
      ${fresh ? `<section class="card next" style="margin-bottom:16px"><div><div class="k">Your plan is ready</div><h2>Here's your Money Map, ${esc(st.profile.name)}.</h2><p style="margin:8px 0 0;color:inherit;opacity:.85">One step at a time, in the order that does the most good. You're already ${map.completed} step${map.completed === 1 ? "" : "s"} in.</p></div><div class="art">${window.AureumArt.illo("wizard")}</div><a class="a-btn btn-xl btn-block" href="#/home">Take me home ${ic("arrowRight", 22)}</a></section>` : ""}
      <div class="page-head"><h1>Your Money Map</h1><p>${map.completed} of ${map.steps.length} steps done. Every extra dollar goes to the highlighted step.</p></div>
      <div class="with-rail"><div class="stack">
        <ol class="map" style="list-style:none;padding:0;margin:0">
          ${map.steps.map((s) => `<li class="step step--${s.status}">
            <span class="step__dot" aria-hidden="true">${s.status === "done" ? ic("check", 26) : s.n}</span>
            <div class="step__card">
              ${s.status === "active" ? `<div class="step__art">${window.AureumArt.illo(s.illo)}</div>` : ""}
              <h2 class="step__title">${esc(s.title)}</h2>
              <div class="step__meta">${s.status === "done" ? "Done ✓" : s.status === "active" ? "You are here" : "Up next"}${s.target ? ` · ${money(s.current)} of ${money(s.target)}` : ""}</div>
              ${s.status === "active" ? `<p class="step__why">${esc(s.why)}</p>${s.detail ? `<p class="step__why"><b>${esc(s.detail)}</b></p>` : ""}<div class="a-progress a-progress--lg"><span style="--value:${Math.round(s.progress * 100)}%"></span></div><div style="margin-top:16px;clear:both">${stepCTA(s, c)}</div>` : ""}
              ${s.status !== "active" ? `<details style="margin-top:6px"><summary class="link-btn" style="padding:4px 0;min-height:0">Why this step?</summary><p class="step__why" style="margin-top:6px">${esc(s.why)}</p></details>` : ""}
            </div></li>`).join("")}
        </ol>
        <section class="card">
          <div class="card__head"><div><h2>This month's money</h2><p>${money(plan.income)} take-home → essentials, wants, then your plan</p></div></div>
          <div class="kv"><span>Essentials & minimums</span><b>${money(plan.essentials)}</b></div>
          <div class="kv"><span>Wants budget</span><b>${money(plan.wants)}</b></div>
          <div class="kv"><span><b>Left for your plan</b></span><b style="color:var(--a-text-brand)">${money(plan.surplus)}</b></div>
          ${plan.alloc.length ? `<div id="allocStack" style="margin-top:18px"></div>` : `<div class="a-alert a-alert--warn" style="margin-top:14px">${ic("alert")}<div><strong>No room yet</strong>Essentials and wants use your whole paycheck. Trimming wants by even ${money(50)} starts the plan.</div></div>`}
        </section>
        ${mg ? `<section class="card" id="match">
          <div class="card__head"><div><h2>Employer match calculator</h2><p>Your employer matches ${pct(st.profile.matchRate ?? 1)} of contributions up to ${pct(st.profile.matchUpTo)} of pay</p></div></div>
          <div class="slider-block"><div class="top"><label class="field-label" for="retPct" style="margin:0">You contribute</label><output id="retOut">${pct(st.profile.retirementPct, 0)}</output></div>
            <input class="a-range" id="retPct" type="range" min="0" max="15" step="1" value="${Math.round(st.profile.retirementPct * 100)}"></div>
          <div class="grid2" style="margin-top:18px">
            <div class="card" style="box-shadow:none;background:var(--a-surface-sunk);border:0"><div class="muted" style="font-size:14px;font-weight:600">Your employer adds per year</div><div class="big-stat" id="matchFree"></div><div class="field-hint" id="matchFreeSub" style="font-weight:700"></div></div>
            <div class="card" style="box-shadow:none;background:var(--a-surface-sunk);border:0"><div class="muted" style="font-size:14px;font-weight:600">Change to take-home / month</div><div class="big-stat" id="matchCost"></div><div class="field-hint">Estimate assumes a 22% tax bracket</div></div>
          </div>
          <button class="a-btn btn-xl btn-block" id="saveRet" style="margin-top:16px">I've updated my contribution</button>
        </section>` : ""}
      </div><aside>${coachRail(ev)}</aside></div>`;
    return { html, title: "Plan", mount() {
      if (plan.alloc.length) V.stack($("#allocStack"), { items: plan.alloc.map((a) => ({ label: a.label, value: a.amount, color: a.color })), height: 18 });
      if (mg) {
        const inp = $("#retPct"); const gross = E.grossMonthly(st);
        const upd = () => {
          const p = +inp.value / 100; inp.style.setProperty("--fill", (p / 0.15) * 100 + "%");
          $("#retOut").textContent = inp.value + "%";
          const matched = Math.min(p, st.profile.matchUpTo) * (st.profile.matchRate ?? 1);
          $("#matchFree").textContent = money(gross * matched * 12);
          const delta = (p - st.profile.retirementPct) * gross * 0.78;
          $("#matchCost").textContent = Math.abs(delta) < 1 ? "$0" : (delta > 0 ? "−" : "+") + money(Math.abs(delta));
          const extra = (matched - Math.min(st.profile.retirementPct, st.profile.matchUpTo) * (st.profile.matchRate ?? 1)) * gross * 12;
          $("#matchFreeSub").textContent = extra > 1 ? `+${money(extra)} more than today` : p < st.profile.matchUpTo ? `${money((st.profile.matchUpTo - p) * gross * 12)} still unclaimed` : "Full match claimed ✓";
        };
        inp.addEventListener("input", upd); upd();
        $("#saveRet").addEventListener("click", () => { Store.setRetirementPct(+inp.value / 100); toast(+inp.value / 100 >= st.profile.matchUpTo ? "Full match unlocked! 🎉" : "Contribution updated"); if (+inp.value / 100 >= st.profile.matchUpTo) confetti(); });
        if (location.hash.includes("#match")) setTimeout(() => $("#match").scrollIntoView({ behavior: "smooth" }), 300);
      }
      mountRail(ev);
    } };
  },

  /* ---------------- BUDGET ---------------- */
  budget(st, ev, r) {
    const c = ev.ctx;
    const cats = Object.keys(E.CATEGORIES).filter((k) => st.budgets[k] || c.spend[k]);
    const totalBudget = Object.values(st.budgets).reduce((a, b) => a + b, 0) + E.debts(st).reduce((s, d) => s + d.minPayment, 0);
    const spent = Object.values(c.spend).reduce((a, b) => a + b, 0);
    const left = totalBudget - spent;
    const daysLeft = c.dim - c.dayOfMonth + 1;
    const need = Object.entries(c.spend).filter(([k]) => E.CATEGORIES[k]?.group === "need").reduce((s, [, v]) => s + v, 0);
    const want = c.wantsSpent;
    const filter = r.query.get("cat");
    const txns = c.month.filter((t) => !filter || t.category === filter);
    const showAll = r.query.get("all");
    const order = ["need", "want"];
    cats.sort((a, b) => order.indexOf(E.CATEGORIES[a].group) - order.indexOf(E.CATEGORIES[b].group));
    const catRow = (k) => {
      const cat = E.CATEGORIES[k], lim = st.budgets[k] || 0, sp = c.spend[k] || 0; const p = lim ? sp / lim : 1;
      const stt = !lim ? "none" : p > 1 ? "bad" : p > 0.85 ? "warn" : "good";
      return `<button class="row" data-edit-budget="${k}" aria-label="${esc(cat.label)}: ${money(sp)} of ${lim ? money(lim) : "no budget"}. Edit">
        <span class="row__ico">${ic(cat.icon, 21)}</span>
        <div style="min-width:0"><div class="row__t">${esc(cat.label)}</div>
          <div class="a-progress ${stt === "bad" ? "a-progress--bad" : stt === "warn" ? "a-progress--warn" : ""}" style="margin-top:8px"><span style="--value:${Math.min(100, Math.round(p * 100))}%"></span></div>
          <div class="row__s" style="margin-top:6px">${!lim ? "No budget yet. Tap to add." : stt === "bad" ? `<b style="color:var(--a-bad-text)">${money(sp - lim)} over</b>` : `${money(lim - sp)} left`}</div></div>
        <div class="row__v">${money(sp)}<small>of ${lim ? money(lim) : "—"}</small></div></button>`;
    };
    const html = `
      <div class="page-head"><h1>${new Date().toLocaleString("en-US", { month: "long" })} budget</h1><p>${daysLeft} days left in the month</p></div>
      <div class="with-rail"><div class="stack">
        <section class="card">
          <div class="grid2" style="align-items:center">
            <div><div class="muted" style="font-weight:700;font-size:14px">${left >= 0 ? "Left to spend this month" : "Over plan this month"}</div><div class="big-stat" style="margin:6px 0;color:${left >= 0 ? "var(--a-text)" : "var(--a-bad-text)"}">${money(Math.abs(left))}</div><div class="muted">${money(spent)} spent of ${money(totalBudget)}</div></div>
            <div>
              ${[["Needs", need, 0.5, "var(--viz-2)"], ["Wants", want, 0.3, "var(--viz-3)"], ["Saved", Math.max(0, c.plan.surplus), 0.2, "var(--viz-1)"]].map(([l, v, tgt, col]) => `<div class="split-row"><b>${l}</b><div class="split-track" title="Target ${pct(tgt)}"><span style="width:${Math.min(100, (v / c.income) * 100)}%;background:${col}"></span><i style="left:${tgt * 100}%" aria-hidden="true"></i></div><em>${pct(v / c.income)}</em></div>`).join("")}
              <div class="field-hint">Marks show the 50 / 30 / 20 guideline. ${c.frac < 0.9 ? "Needs and wants are month-to-date." : ""}</div>
            </div>
          </div>
        </section>
        <section class="card"><div class="card__head"><div><h2>Categories</h2><p>Tap any category to change its budget</p></div></div>
          <div class="rows">${cats.map(catRow).join("")}</div>
          <button class="a-btn a-btn--secondary btn-lg2 btn-block" data-act="add-category" style="margin-top:12px">${ic("plus", 20)} Add a category</button>
        </section>
        <section class="card"><div class="card__head"><div><h2>Transactions</h2><p>${filter ? esc(E.CATEGORIES[filter]?.label) + " · " : ""}${txns.length} this month</p></div>${filter ? `<a class="link-btn" href="#/budget">Clear filter</a>` : ""}</div>
          <div class="rows">${txns.slice(0, showAll ? 999 : 12).map(txnRow).join("") || `<div class="empty">${illo("mascot")}<h3>No transactions yet</h3><p class="muted">Log spending as it happens. It keeps your safe-to-spend accurate.</p></div>`}</div>
          ${txns.length > 12 && !showAll ? `<a class="a-btn a-btn--ghost btn-lg2 btn-block" href="#/budget?all=1${filter ? "&cat=" + filter : ""}">Show all ${txns.length}</a>` : ""}
        </section>
      </div><aside>${coachRail(ev)}</aside></div>`;
    return { html, title: "Budget", mount() { mountRail(ev); } };
  },

  /* ---------------- GOALS ---------------- */
  goals(st, ev, r) {
    if (r.parts[1] === "new") return goalForm(st, ev);
    if (r.parts[1]) return goalDetail(st, ev, r.parts[1]);
    const c = ev.ctx, efd = efDisplay(c);
    const goals = st.goals.filter((g) => g.kind !== "emergency");
    const ds = c.debts;
    const sim = ds.length ? E.simulateDebts(ds, Math.round(c.plan.alloc.find((a) => a.id === "highdebt")?.amount || 0)) : null;
    const pace = (g) => { const p = E.goalPace(g); return p.status === "ahead" ? `<span class="a-chip a-chip--good">${ic("trendUp", 14)} Ahead</span>` : p.status === "on-track" ? `<span class="a-chip a-chip--good">${ic("check", 14)} On track</span>` : p.status === "behind" ? `<span class="a-chip a-chip--warn">${ic("alert", 14)} Behind</span>` : p.status === "done" ? `<span class="a-chip a-chip--good">${ic("check", 14)} Done</span>` : p.status === "unfunded" ? `<span class="a-chip">Not funded yet</span>` : `<span class="a-chip a-chip--brand">${money(g.monthly)}/mo</span>`; };
    const html = `
      <div class="page-head"><h1>Goals</h1><p>Your safety net first, then the fun stuff.</p></div>
      <div class="with-rail"><div class="stack">
        <a class="card goal-card" href="#/goals/ef" style="background:var(--a-surface-mint);border:0">
          <div id="ringEf"></div>
          <div><div class="insight__kicker" style="color:var(--teal-800)">${esc(efd.label)}</div><h3 style="color:var(--indigo-900)">Emergency fund</h3><div style="font-size:14px;color:var(--teal-900);margin-top:2px">${money(c.efSaved)} of ${money(efd.target)} · ${E.emergencyMonths(st).toFixed(1)} months covered</div></div>
          <span class="chev" style="color:var(--teal-900)">${ic("chevronDown", 22).replace("<svg", '<svg style="transform:rotate(-90deg)"')}</span>
        </a>
        ${goals.map((g, i) => `<a class="card goal-card" href="#/goals/${esc(g.id)}"><div id="ring-${esc(g.id)}"></div><div><h3>${esc(g.name)}</h3><div class="muted" style="font-size:14px;margin:2px 0 8px">${money(g.saved)} of ${money(g.target)}${g.targetDate ? ` · by ${E.pd(g.targetDate).toLocaleString("en-US", { month: "short", year: "numeric" })}` : ""}</div>${pace(g)}</div><span class="chev">${ic("chevronDown", 22).replace("<svg", '<svg style="transform:rotate(-90deg)"')}</span></a>`).join("")}
        <a class="a-btn btn-xl btn-block" href="#/goals/new">${ic("plus", 22)} New goal</a>
        ${ds.length ? `<div class="section-title">Debt</div>
        <a class="card goal-card" href="#/debt"><span class="row__ico" style="width:64px;height:64px;border-radius:20px">${ic("card", 28)}</span><div><h3>Debt payoff plan</h3><div class="muted" style="font-size:14px;margin-top:2px">${money(ds.reduce((s, d) => s + d.balance, 0))} across ${ds.length} · debt-free ${E.dateIn(sim.months)}</div></div><span class="chev">${ic("chevronDown", 22).replace("<svg", '<svg style="transform:rotate(-90deg)"')}</span></a>` : ""}
      </div><aside>${coachRail(ev)}</aside></div>`;
    return { html, title: "Goals", mount() {
      V.ring($("#ringEf"), { value: Math.min(1, c.efSaved / efd.target), size: 76, color: "var(--teal-700)", label: "Emergency fund" });
      goals.forEach((g, i) => V.ring($("#ring-" + CSS.escape(g.id)), { value: Math.min(1, g.saved / g.target), size: 76, color: `var(--viz-${(i % 3) + 4})`, label: g.name }));
      mountRail(ev);
    } };
  },

  /* ---------------- DEBT ---------------- */
  debt(st, ev, r) {
    const c = ev.ctx, ds = c.debts;
    if (!ds.length) return { title: "Debt", html: `<div class="page-head"><h1>Debt payoff</h1></div><div class="card empty">${illo("payoff")}<h3>No debt on file</h3><p class="muted">Nice. If you have a card or loan, add it in Settings → Accounts.</p><a class="a-btn btn-lg2" href="#/settings">Open settings</a></div>` };
    const method = r.query.get("m") || (E.simulateDebts(ds, 100, "snowball").interest - E.simulateDebts(ds, 100, "avalanche").interest < 150 ? "snowball" : "avalanche");
    const startExtra = +(r.query.get("x") ?? Math.round((c.plan.alloc.find((a) => a.id === "highdebt")?.amount || 50) / 10) * 10);
    const html = `
      <div class="page-head"><h1>Debt payoff plan</h1><p>${money(ds.reduce((s, d) => s + d.balance, 0))} total · ${money(ds.reduce((s, d) => s + d.minPayment, 0))}/mo in minimums</p></div>
      <div class="with-rail"><div class="stack">
        <section class="card">
          <div class="grid2">
            <div><div class="muted" style="font-weight:700;font-size:14px">Debt-free by</div><div class="big-stat" id="dFree" style="margin-top:6px"></div><div class="muted" id="dSooner" style="margin-top:6px"></div></div>
            <div><div class="muted" style="font-weight:700;font-size:14px">Total interest</div><div class="big-stat" id="dInt" style="margin-top:6px"></div><div class="muted" id="dSaved" style="margin-top:6px;color:var(--a-good-text);font-weight:700"></div></div>
          </div>
          <div class="slider-block" style="margin-top:22px"><div class="top"><label class="field-label" for="extra" style="margin:0">Extra each month</label><output id="extraOut"></output></div><input class="a-range" id="extra" type="range" min="0" max="600" step="10" value="${startExtra}"></div>
          <div style="margin-top:18px"><span class="field-label">Method</span><div class="a-seg" role="group" aria-label="Payoff method" style="width:100%;display:grid;grid-template-columns:1fr 1fr">
            <button aria-pressed="${method === "avalanche"}" data-method="avalanche" style="min-height:48px;font-size:14px">Avalanche · highest rate</button><button aria-pressed="${method === "snowball"}" data-method="snowball" style="min-height:48px;font-size:14px">Snowball · smallest first</button></div>
            <div class="field-hint" id="methodHint"></div></div>
        </section>
        <section class="card"><div class="card__head"><div><h2>Balance over time</h2><p>Your plan vs. paying only the minimums</p></div></div><div id="dChart"></div></section>
        <section class="card"><div class="card__head"><div><h2>Payoff order</h2><p>Minimums on everything, extra on the target</p></div></div><div class="rows" id="dOrder"></div>
          <button class="a-btn btn-xl btn-block" data-act="pay-debt" style="margin-top:14px">Make an extra payment</button></section>
      </div><aside>${coachRail(ev)}</aside></div>`;
    return { html, title: "Debt", mount() {
      let m = method;
      const inp = $("#extra");
      const minOnly = E.simulateDebts(ds, 0, m);
      const upd = () => {
        const x = +inp.value; inp.style.setProperty("--fill", (x / 600) * 100 + "%"); $("#extraOut").textContent = money(x);
        const s = E.simulateDebts(ds, x, m), base = E.simulateDebts(ds, 0, m);
        $("#dFree").textContent = E.dateIn(s.months);
        $("#dSooner").textContent = x > 0 ? `${base.months - s.months} months sooner than minimums` : `${E.monthsToText(s.months)} at minimums`;
        $("#dInt").textContent = money(s.interest);
        $("#dSaved").textContent = x > 0 ? `You save ${money(base.interest - s.interest)}` : "";
        const other = E.simulateDebts(ds, x, m === "avalanche" ? "snowball" : "avalanche");
        $("#methodHint").textContent = m === "avalanche" ? `Saves ${money(Math.max(0, other.interest - s.interest))} vs. snowball. Best when rates differ a lot.` : `Costs ${money(Math.max(0, s.interest - other.interest))} more than avalanche, but you'll clear your first debt sooner. Research shows quick wins help people finish.`;
        $("#dOrder").innerHTML = s.order.map((o, i) => { const d = ds.find((x) => x.id === o.id); return `<div class="row"><span class="row__ico" style="font-weight:800">${i + 1}</span><div><div class="row__t">${esc(d.name)}</div><div class="row__s">${money(d.balance)} · ${d.apr}% APR · ${money(d.minPayment)} min</div></div><div class="row__v">${E.dateIn(o.month)}<small>paid off</small></div></div>`; }).join("");
        const len = Math.min(base.totals.length, 240);
        const labels = Array.from({ length: len }, (_, i) => E.addMonths(E.today(), i).toLocaleString("en-US", { month: "short", year: "2-digit" }));
        const pad = (a) => Array.from({ length: len }, (_, i) => a[i] ?? 0);
        $("#dChart").classList.add("viz-static");
        V.line($("#dChart"), { label: "Remaining debt", labels, series: [{ name: "Your plan", values: pad(s.totals), color: "var(--viz-1)" }, { name: "Minimums only", values: pad(base.totals), color: "var(--viz-muted)" }], height: 260, yMin: 0, endLabels: false });
      };
      inp.addEventListener("input", upd);
      $$("[data-method]").forEach((b) => b.addEventListener("click", () => { m = b.dataset.method; $$("[data-method]").forEach((x) => x.setAttribute("aria-pressed", x === b)); upd(); }));
      upd(); $("#dChart").classList.remove("viz-static");
      mountRail(ev);
    } };
  },

  /* ---------------- COACH ---------------- */
  coach(st, ev, r) {
    const all = r.query.get("all");
    const evAll = evaluate(st, { all: true });
    const h = ev.ctx.health;
    const list = all ? evAll.insights : ev.insights;
    const html = `
      <div class="page-head"><h1>Coach</h1><p>Sprout checks ${ev.catalog} money rules against your plan every day and shows you only the ones worth your time.</p></div>
      <div class="with-rail"><div class="stack">
        <section class="card"><div class="grid2" style="align-items:center">
          <div id="gauge"></div>
          <div class="pillars">${h.pillars.map((p) => `<div><div class="pillar__top">${esc(p.label)}<span>${esc(p.hint)}</span></div><div class="a-progress a-progress--lg ${p.value < 0.4 ? "a-progress--warn" : ""}"><span style="--value:${Math.round(p.value * 100)}%"></span></div></div>`).join("")}</div>
        </div><p class="field-hint" style="margin-top:14px">Four pillars modeled on the CFPB's Financial Well-Being elements: control, capacity to absorb a shock, being on track, and freedom of choice.</p></section>
        <section class="card"><div class="card__head"><div><h2>How often should I speak up?</h2><p>${esc(NUDGE_LEVELS[st.settings.nudgeLevel || "balanced"].desc)}</p></div></div>
          <div class="a-seg" role="group" aria-label="Nudge level" style="width:100%;display:grid;grid-template-columns:repeat(3,1fr)">${Object.entries(NUDGE_LEVELS).map(([k, v]) => `<button data-level="${k}" aria-pressed="${(st.settings.nudgeLevel || "balanced") === k}" style="min-height:48px;font-size:14px">${v.label}</button>`).join("")}</div></section>
        <div class="section-title">${all ? `Everything Sprout noticed (${evAll.insights.length})` : `For you now (${list.length})`}<a class="link-btn" href="#/coach${all ? "" : "?all=1"}">${all ? "Show top picks" : `See all ${ev.total}`}</a></div>
        ${list.length ? list.map((i, n) => insightCard(i, n).replace('class="insight ', `class="insight ${i.muted ? "is-muted" : ""} `)).join("") : emptyCoach()}
        <div class="section-title">Lessons</div>
        <div class="grid2">${Object.entries(LESSONS).map(([k, l]) => `<a class="card goal-card" href="#/learn/${k}" style="grid-template-columns:56px 1fr"><div class="ill" style="width:56px">${window.AureumArt.illo(l.illo)}</div><div><h3>${esc(l.title)}</h3><div class="muted" style="font-size:13px">${l.mins} min read</div></div></a>`).join("")}</div>
      </div><aside><div class="card"><h2 style="margin-bottom:8px">How Sprout decides</h2><p class="muted" style="font-size:14.5px;margin:0">Rules read your plan and fire when something is worth saying. Urgent items come first, then the biggest dollar impact. Only one card per topic is shown, and anything you dismiss stays quiet for a while.</p></div></aside></div>`;
    return { html, title: "Coach", mount() {
      V.gauge($("#gauge"), { value: h.score, grade: h.grade, label: "Financial health", size: 220 });
      $$("[data-level]").forEach((b) => b.addEventListener("click", () => { Store.updateSettings({ nudgeLevel: b.dataset.level }); toast(`Nudges set to ${NUDGE_LEVELS[b.dataset.level].label.toLowerCase()}`); }));
    } };
  },

  /* ---------------- LEARN ---------------- */
  learn(st, ev, r) {
    const l = LESSONS[r.parts[1]] || LESSONS.fund;
    return { title: "Lesson", html: `<article class="lesson">
      <a class="link-btn" href="#/coach">${ic("chevronLeft", 16)} Coach</a>
      <div class="art">${illo(l.illo)}</div>
      <div class="insight__kicker">${l.mins}-minute lesson</div>
      <h1 style="font-family:var(--font-display);font-weight:600;font-size:clamp(30px,6vw,40px);line-height:1.1;margin:6px 0 10px">${esc(l.title)}</h1>
      ${l.body}
      <a class="a-btn btn-xl btn-block" href="#/plan" style="margin-top:24px">Back to my Money Map</a></article>` };
  },

  /* ---------------- SETTINGS ---------------- */
  settings(st) {
    const pay = st.recurring.find((r) => r.kind === "income");
    const html = `<div class="page-head"><h1>Settings</h1><p>Your profile, accounts and preferences</p></div>
      <div class="stack" style="max-width:720px">
        <section class="card"><h2 style="margin-bottom:14px">Profile</h2>
          <div class="stack"><div><label class="field-label" for="sName">Name</label><input class="a-input big" id="sName" value="${esc(st.profile.name)}"></div>
          ${moneyField("sNet", "Monthly take-home pay", Math.round(E.monthlyIncome(st)), { size: "sm" })}
          <div><span class="field-label">Income</span><div class="choices choices--row" role="radiogroup">${["stable", "variable"].map((v) => `<button class="choice" role="radio" data-stab="${v}" aria-checked="${st.profile.incomeStability === v}">${v === "stable" ? "Steady" : "Varies"}</button>`).join("")}</div></div></div></section>
        <section class="card"><h2 style="margin-bottom:6px">Accounts</h2><p class="muted" style="margin:0 0 14px">Update balances anytime. In a production version these sync automatically with read-only access.</p>
          <div class="stack">${st.accounts.map((a) => `<div>${moneyField("acc-" + a.id, `${a.name}${a.apr ? ` · ${a.apr}% APR` : ""}`, a.balance, { size: "sm" })}</div>`).join("")}</div></section>
        <section class="card"><h2 style="margin-bottom:14px">Preferences</h2>
          <div class="stack">
            <div><span class="field-label">Coach nudges</span><div class="choices">${Object.entries(NUDGE_LEVELS).map(([k, v]) => `<button class="choice" role="radio" data-level="${k}" aria-checked="${(st.settings.nudgeLevel || "balanced") === k}"><span>${v.label}<small>${v.desc}</small></span></button>`).join("")}</div></div>
            <div><span class="field-label">Appearance</span><div class="a-seg" role="group" style="width:100%;display:grid;grid-template-columns:repeat(3,1fr)">${[["", "System"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => `<button data-theme-set="${v}" aria-pressed="${(st.settings.theme || "") === v}" style="min-height:48px;font-size:14px">${l}</button>`).join("")}</div></div>
            <label class="a-switch" style="min-height:48px"><input type="checkbox" id="roundups" ${st.settings.roundUps ? "checked" : ""}><span class="track"></span>Round-ups to savings</label>
          </div></section>
        <button class="a-btn btn-xl btn-block" id="saveSettings">Save changes</button>
        <section class="card"><h2 style="margin-bottom:6px">Account</h2><p class="muted" style="margin:0 0 10px">Signing out keeps your plan saved on this device.</p>
          <div class="menu-list">
            <a href="../index.html">${ic("home", 22)}<span>Aureum homepage<small>Features, security and more</small></span>${ic("arrowUpRight", 18).replace("<svg", '<svg class="ext"')}</a>
            <a href="../design-system.html">${ic("sparkle", 22)}<span>Design system</span>${ic("arrowUpRight", 18).replace("<svg", '<svg class="ext"')}</a>
          </div>
          <button class="a-btn a-btn--secondary btn-xl btn-block" data-act="signout" style="margin-top:12px">Sign out</button></section>
        <section class="card"><h2 style="margin-bottom:14px">Start over</h2><div class="grid2">
          <button class="a-btn a-btn--secondary btn-lg2" id="restart">Redo setup questions</button>
          <button class="a-btn a-btn--secondary btn-lg2" id="loadDemo">Load demo data (David)</button></div></section>
      </div>`;
    return { html, title: "Settings", mount() {
      let stab = st.profile.incomeStability;
      $$("[data-stab]").forEach((b) => b.addEventListener("click", () => { stab = b.dataset.stab; $$("[data-stab]").forEach((x) => x.setAttribute("aria-checked", x === b)); }));
      $$("[data-level]").forEach((b) => b.addEventListener("click", () => { $$("[data-level]").forEach((x) => x.setAttribute("aria-checked", x === b)); Store.updateSettings({ nudgeLevel: b.dataset.level }); }));
      $$("[data-theme-set]").forEach((b) => b.addEventListener("click", () => { Store.updateSettings({ theme: b.dataset.themeSet || null }); }));
      $("#roundups").addEventListener("change", (e) => Store.updateSettings({ roundUps: e.target.checked }));
      $("#saveSettings").addEventListener("click", () => {
        st.accounts.forEach((a) => { const v = num($("#acc-" + CSS.escape(a.id)).value); if (v !== a.balance) Store.updateAccount(a.id, { balance: v }); });
        const net = num($("#sNet").value);
        if (pay && Math.round(E.monthlyIncome(st)) !== net) pay.amount = Math.round(net / E.perMonth(pay.every));
        Store.updateProfile({ name: $("#sName").value.trim() || st.profile.name, incomeStability: stab });
        toast("Saved");
      });
      $("#restart").addEventListener("click", () => { Store.reset(); location.hash = "#/welcome"; render(); });
      $("#loadDemo").addEventListener("click", () => { Store.seedDemo(); location.hash = "#/home"; toast("Demo data loaded"); });
    } };
  },
};

/* ---------------- goal detail & form ---------------- */
function goalDetail(st, ev, id) {
  const c = ev.ctx;
  const isEf = id === "ef";
  const g = st.goals.find((x) => x.id === id) || st.goals[0];
  const target = isEf ? efDisplay(c).target : g.target;
  const saved = isEf ? c.efSaved : g.saved;
  const p = E.goalPace({ ...g, target, saved });
  const html = `
    <a class="link-btn" href="#/goals">${ic("chevronLeft", 16)} Goals</a>
    <div class="page-head" style="margin-top:0;${isEf ? "display:grid;grid-template-columns:1fr 96px;gap:12px;align-items:center" : ""}"><div><h1>${esc(g.name)}</h1><p>${isEf ? esc(efDisplay(c).label) + " · " + E.emergencyMonths(st).toFixed(1) + " months of essentials covered" : g.targetDate ? `Target ${E.pd(g.targetDate).toLocaleString("en-US", { month: "long", year: "numeric" })}` : "No deadline"}</p></div>${isEf ? illo("umbrella") : ""}</div>
    <div class="with-rail"><div class="stack">
      <section class="card"><div style="display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center">
        <div id="gRing"></div>
        <div><div class="big-stat">${money(saved)}</div><div class="muted" style="margin-top:6px">of ${money(target)} · ${money(Math.max(0, target - saved))} to go</div></div></div>
        <button class="a-btn btn-xl btn-block" data-act="add-money" data-goal="${esc(g.id)}" style="margin-top:18px">${ic("plus", 22)} Add money</button>
      </section>
      <section class="card">
        <div class="card__head"><div><h2>Plan it out</h2><p>Drag to see when you'll get there</p></div></div>
        <div class="slider-block"><div class="top"><label class="field-label" for="gMonthly" style="margin:0">Each month</label><output id="gOut"></output></div>
          <input class="a-range" id="gMonthly" type="range" min="0" max="${Math.max(500, Math.ceil((p.need || 0) * 2 / 50) * 50, (g.monthly || 0) * 2)}" step="5" value="${g.monthly || 0}"></div>
        <div class="grid2" style="margin-top:16px">
          <div class="card" style="box-shadow:none;background:var(--a-surface-sunk);border:0"><div class="muted" style="font-size:14px;font-weight:600">You'll get there</div><div class="big-stat" id="gEta" style="font-size:30px;margin-top:6px"></div></div>
          ${!isEf && g.targetDate ? `<div class="card" style="box-shadow:none;background:var(--a-surface-sunk);border:0"><div class="muted" style="font-size:14px;font-weight:600">Needed for your date</div><div class="big-stat" style="font-size:30px;margin-top:6px">${money(p.need)}/mo</div></div>` : ""}
        </div>
        <div id="gChart" style="margin-top:16px"></div>
        <button class="a-btn btn-lg2 btn-block" id="gSave" style="margin-top:14px">Save monthly amount</button>
      </section>
      ${!isEf ? `<button class="a-btn a-btn--ghost btn-lg2 btn-block" id="gDelete" style="color:var(--a-bad-text)">Delete goal</button>` : ""}
    </div><aside>${coachRail(ev)}</aside></div>`;
  return { html, title: "Goal", mount() {
    V.ring($("#gRing"), { value: Math.min(1, saved / target), size: 110, label: g.name });
    const inp = $("#gMonthly");
    const upd = () => {
      const m = +inp.value; inp.style.setProperty("--fill", (m / inp.max) * 100 + "%"); $("#gOut").textContent = money(m);
      const eta = E.monthsToGoal(saved, target, m);
      $("#gEta").textContent = isFinite(eta) ? E.dateIn(eta) : "Add a monthly amount";
      const n = isFinite(eta) ? Math.max(6, Math.min(eta + 2, 120)) : 24;
      const series = E.projectGoal(saved, m, n);
      $("#gChart").classList.add("viz-static");
      V.line($("#gChart"), { label: "Projected balance", labels: series.map((_, i) => E.addMonths(E.today(), i).toLocaleString("en-US", { month: "short", year: "2-digit" })), series: [{ name: "Projected", values: series }], area: true, height: 220, yMin: 0, refLine: { value: target, label: "Goal " + compact(target) } });
    };
    inp.addEventListener("input", upd); upd(); $("#gChart").classList.remove("viz-static");
    $("#gSave").addEventListener("click", () => { Store.upsertGoal({ id: g.id, monthly: +inp.value }); toast("Monthly amount saved"); });
    $("#gDelete")?.addEventListener("click", () => { if (confirm(`Delete “${g.name}”?`)) { Store.deleteGoal(g.id); location.hash = "#/goals"; } });
    mountRail(ev);
  } };
}
function goalForm(st, ev) {
  const presets = [["plane", "Trip", 1500], ["home", "Home", 20000], ["car", "Car", 5000], ["grad", "Education", 4000], ["heart", "Wedding", 10000], ["target", "Something else", 1000]];
  const html = `<a class="link-btn" href="#/goals">${ic("chevronLeft", 16)} Goals</a>
    <div class="page-head" style="margin-top:0"><h1>New goal</h1><p>Name it, size it, date it. That's what makes it real.</p></div>
    <form class="stack" id="goalForm" style="max-width:640px" novalidate>
      <div class="cat-grid" style="grid-template-columns:repeat(3,1fr)">${presets.map(([icn, l, t], i) => `<button type="button" class="cat-pick" data-preset="${i}" aria-pressed="${i === 0}">${ic(icn, 22)}${l}</button>`).join("")}</div>
      <div><label class="field-label" for="gName">Goal name</label><input class="a-input big" id="gName" value="Trip" required></div>
      ${moneyField("gTarget", "How much?", 1500)}
      <div><label class="field-label" for="gDate">By when?</label><input class="a-input big" id="gDate" type="month" value="${E.ymd(E.addMonths(E.today(), 12)).slice(0, 7)}"></div>
      <div class="card" style="background:var(--a-surface-mint);border:0;box-shadow:none"><div style="font-weight:700;color:var(--teal-900)">That's about</div><div class="big-stat" id="gNeed" style="color:var(--indigo-900);margin:4px 0"></div><div style="font-size:14px;color:var(--teal-900)" id="gNeedSub"></div></div>
      <button class="a-btn btn-xl btn-block" type="submit">Create goal</button>
    </form>`;
  return { html, title: "New goal", mount() {
    let icon = "plane";
    const calc = () => {
      const t = num($("#gTarget").value); const d = E.pd($("#gDate").value + "-01");
      const months = Math.max(1, Math.round((d - E.today()) / (E.DAY * 30.44)));
      const need = Math.ceil(E.requiredMonthly(0, t, months) / 5) * 5;
      $("#gNeed").textContent = money(need) + "/month";
      const surplus = ev.ctx.plan.surplus;
      $("#gNeedSub").textContent = `for ${months} months. ${surplus ? `That's ${pct(need / Math.max(surplus, 1))} of what's left in your monthly plan.` : ""}`;
      return { t, months, need, d };
    };
    $$("[data-preset]").forEach((b) => b.addEventListener("click", () => { const [icn, l, t] = presets[+b.dataset.preset]; icon = icn; $$("[data-preset]").forEach((x) => x.setAttribute("aria-pressed", x === b)); $("#gName").value = l === "Something else" ? "" : l; $("#gTarget").value = t; calc(); if (!$("#gName").value) $("#gName").focus(); }));
    $("#goalForm").addEventListener("input", calc); calc();
    $("#goalForm").addEventListener("submit", (e) => { e.preventDefault(); const { t, need, d } = calc(); const name = $("#gName").value.trim() || "My goal"; if (t <= 0) return toast("Add an amount first", "alert"); Store.upsertGoal({ name, target: t, monthly: need, targetDate: E.ymd(d), icon }); toast(`“${name}” created`); confetti(); location.hash = "#/goals"; });
  } };
}

function mountRail(ev) { const g = $("#railGauge"); if (g && getComputedStyle(g.closest("aside")).display !== "none") V.ring(g, { value: ev.ctx.health.score / 100, size: 64, label: "Health score" }); }

/* ======================================================================
   SHEETS: add expense, add money, budget edit, extra payment
   ====================================================================== */
function addExpenseSheet() {
  const cats = ["groceries", "dining", "transport", "shopping", "entertainment", "personal", "health", "income"];
  let cat = "groceries";
  sheet({ title: "Add a transaction", body: `
      ${moneyField("txAmt", "Amount", "", { placeholder: "0.00" })}
      <div><span class="field-label">Category</span><div class="cat-grid">${cats.map((k) => `<button type="button" class="cat-pick" data-cat="${k}" aria-pressed="${k === cat}">${ic(E.CATEGORIES[k].icon, 22)}${esc(E.CATEGORIES[k].label.split(" ")[0])}</button>`).join("")}</div></div>
      <div><label class="field-label" for="txName">Where? <span class="muted" style="font-weight:500">(optional)</span></label><input class="a-input big" id="txName" placeholder="e.g. Trader Joe's"></div>`,
    foot: `<button class="a-btn btn-xl btn-block" id="txSave">Add it</button>`,
    onMount(d, close) {
      setTimeout(() => $("#txAmt", d).focus(), 200);
      $$("[data-cat]", d).forEach((b) => b.addEventListener("click", () => { cat = b.dataset.cat; $$("[data-cat]", d).forEach((x) => x.setAttribute("aria-pressed", x === b)); }));
      const go = () => { const a = num($("#txAmt", d).value); if (!a) return toast("Enter an amount", "alert"); Store.addTransaction({ amount: a, category: cat, merchant: $("#txName", d).value.trim() || E.CATEGORIES[cat].label }); close(); toast(`${cat === "income" ? "Income" : "Expense"} added · safe-to-spend updated`); };
      $("#txSave", d).addEventListener("click", go);
      $("#txAmt", d).addEventListener("keydown", (e) => e.key === "Enter" && go());
    } });
}
function addMoneySheet(goalId = "ef", preset) {
  const st = Store.getState(); const g = st.goals.find((x) => x.id === goalId) || st.goals[0];
  const chk = E.checking(st)?.balance || 0;
  sheet({ title: `Add to ${g.name}`, body: `${moneyField("amt", "Amount", preset || "", { hint: `From checking · ${money(chk)} available`, placeholder: "50" })}
      <div class="choices choices--row">${[25, 50, 100, 250].map((v) => `<button type="button" class="choice" data-q="${v}" style="justify-content:center">${money(v)}</button>`).join("")}</div>`,
    foot: `<button class="a-btn btn-xl btn-block" id="go">Move money</button>`,
    onMount(d, close) {
      $$("[data-q]", d).forEach((b) => b.addEventListener("click", () => ($("#amt", d).value = b.dataset.q)));
      $("#go", d).addEventListener("click", () => {
        const a = num($("#amt", d).value); if (!a) return toast("Enter an amount", "alert");
        const before = E.moneyMap(Store.getState()).completed;
        Store.moveToSavings(a, goalId); close();
        const after = E.moneyMap(Store.getState()).completed;
        toast(`${money(a)} added to ${g.name}`); if (after > before) confetti();
      });
    } });
}
function editBudgetSheet(cat) {
  const st = Store.getState(); const c = E.CATEGORIES[cat];
  const avg = [1, 2, 3].reduce((s, k) => s + (E.spendByCategory(E.txnsInMonth(st, E.addMonths(E.startOfMonth(), -k)))[cat] || 0), 0) / 3;
  sheet({ title: c.label, body: `${moneyField("bAmt", "Monthly budget", st.budgets[cat] || "", { hint: avg ? `You've averaged ${money(avg)} over the last 3 months.` : "" })}
    <a class="a-btn a-btn--secondary btn-lg2" href="#/budget?cat=${cat}" data-close>See ${esc(c.label.toLowerCase())} transactions</a>`,
    foot: `<button class="a-btn btn-xl btn-block" id="bSave">Save budget</button>${st.budgets[cat] ? `<button class="a-btn a-btn--ghost btn-lg2" id="bDel">Remove budget</button>` : ""}`,
    onMount(d, close) {
      $("#bSave", d).addEventListener("click", () => { Store.setBudget(cat, num($("#bAmt", d).value)); close(); toast("Budget updated"); });
      $("#bDel", d)?.addEventListener("click", () => { Store.setBudget(cat, 0); close(); });
    } });
}
function addCategorySheet() {
  const st = Store.getState();
  const avail = Object.keys(E.CATEGORIES).filter((k) => !st.budgets[k] && !["income", "savings", "debt"].includes(k));
  sheet({ title: "Add a category", body: `<div class="cat-grid">${avail.map((k) => `<button type="button" class="cat-pick" data-cat="${k}" aria-pressed="false">${ic(E.CATEGORIES[k].icon, 22)}${esc(E.CATEGORIES[k].label)}</button>`).join("") || "<p class='muted'>Every category has a budget.</p>"}</div>`,
    onMount(d, close) { $$("[data-cat]", d).forEach((b) => b.addEventListener("click", () => { close(); editBudgetSheet(b.dataset.cat); })); } });
}
function payDebtSheet() {
  const st = Store.getState(); const ds = E.debts(st);
  const sorted = [...ds].sort((a, b) => b.apr - a.apr);
  let id = sorted[0].id;
  sheet({ title: "Extra debt payment", body: `
      <div class="choices">${sorted.map((d) => `<button type="button" class="choice" role="radio" data-d="${d.id}" aria-checked="${d.id === id}"><span>${esc(d.name)}<small>${money(d.balance)} · ${d.apr}% APR</small></span></button>`).join("")}</div>
      ${moneyField("pAmt", "Amount", 50, { hint: `From checking · ${money(E.checking(st)?.balance || 0)} available` })}`,
    foot: `<button class="a-btn btn-xl btn-block" id="pGo">Pay it</button>`,
    onMount(d, close) {
      $$("[data-d]", d).forEach((b) => b.addEventListener("click", () => { id = b.dataset.d; $$("[data-d]", d).forEach((x) => x.setAttribute("aria-checked", x === b)); }));
      $("#pGo", d).addEventListener("click", () => { const a = num($("#pAmt", d).value); if (!a) return; Store.payDebt(id, a); close(); toast(`${money(a)} paid. Less interest every month from here.`); });
    } });
}

function accountSheet() {
  const st = Store.getState();
  sheet({ title: "Account", body: `
    <div class="acct-head"><span class="avatar-btn" aria-hidden="true">${esc((st.profile.name || "?").slice(0, 1).toUpperCase())}</span><div><b>${esc(st.profile.name)}</b><span>${st.demo ? "Demo profile" : "Saved on this device"}</span></div></div>
    <div class="menu-list">
      <a href="#/settings" data-close>${ic("menu", 22)}<span>Settings<small>Profile, accounts, nudges, appearance</small></span></a>
      <a href="#/coach" data-close>${ic("gauge", 22)}<span>Health score<small>${E.healthScore(st).score} · see the breakdown</small></span></a>
      <a href="../index.html">${ic("home", 22)}<span>Aureum homepage</span>${ic("arrowUpRight", 18).replace("<svg", '<svg class="ext"')}</a>
    </div>`,
    foot: `<button class="a-btn a-btn--secondary btn-xl btn-block" data-act="signout">Sign out</button>` });
}
function signOut() { Store.signOut(); location.href = "../index.html"; }
function renderWelcomeBack(st) {
  $("#ob").innerHTML = `<div class="ob"><div class="ob__body ob__welcome enter" style="justify-content:center">
      <div class="ob__art">${illo("mascot", { wave: true })}</div>
      <h1>Welcome back, ${esc(st.profile.name)}.</h1>
      <p class="lead">Your Money Map is right where you left it.</p></div>
    <div class="ob__foot">
      <button class="a-btn btn-xl btn-block" id="wbGo">Continue as ${esc(st.profile.name)} ${ic("arrowRight", 22)}</button>
      <div class="grid2"><a class="a-btn a-btn--secondary btn-lg2" href="../index.html">Back to homepage</a><button class="a-btn a-btn--ghost btn-lg2" id="wbNew">Not you? Start fresh</button></div>
    </div></div>`;
  $("#wbGo").addEventListener("click", () => { location.hash = "#/home"; Store.signIn(); });
  $("#wbNew").addEventListener("click", () => { Store.reset(); location.hash = "#/welcome"; render(); });
}

/* ======================================================================
   EVENTS (delegated)
   ====================================================================== */
function runOp(a, ruleId) {
  const st = Store.getState();
  switch (a.op) {
    case "transfer": Store.moveToSavings(-a.amount); toast(`${money(a.amount)} moved to checking`); break;
    case "save": addMoneySheet("ef", a.amount); return;
    case "automate": Store.automate(a.amount); toast(`Auto-save of ${money(a.amount)} set for each payday`); break;
    case "remind": toast("Reminder set for your next raise", "bell"); break;
    case "roundups": Store.updateSettings({ roundUps: true }); toast("Round-ups on"); break;
    case "celebrate": Store.celebrate(a.step); confetti(); break;
    case "dismiss": break;
  }
  if (ruleId) Store.dismiss(ruleId);
  if (a.route) location.hash = a.route;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-op], [data-why], [data-dismiss], [data-snooze], [data-act], [data-edit-budget]");
  if (!t) return;
  if (t.dataset.op) { const a = JSON.parse(t.dataset.op); if (a.route && !a.op) { if (t.dataset.rule) Store.dismiss(t.dataset.rule); location.hash = a.route; } else runOp(a, t.dataset.rule); }
  else if (t.hasAttribute("data-why")) { const w = t.closest(".insight").querySelector(".insight__why"); w.hidden = !w.hidden; t.setAttribute("aria-expanded", !w.hidden); }
  else if (t.dataset.dismiss) { const card = t.closest(".insight"); card.style.transition = "opacity .25s, transform .25s"; card.style.opacity = 0; card.style.transform = "translateX(24px)"; setTimeout(() => { Store.dismiss(t.dataset.dismiss); toast("Got it. I'll stay quiet about that for a while."); }, 220); }
  else if (t.dataset.snooze) { Store.snooze(t.dataset.snooze, 3); toast("I'll bring it back in 3 days", "bell"); }
  else if (t.dataset.editBudget) editBudgetSheet(t.dataset.editBudget);
  else if (t.dataset.act === "add-fund") addMoneySheet("ef");
  else if (t.dataset.act === "add-money") addMoneySheet(t.dataset.goal);
  else if (t.dataset.act === "add-category") addCategorySheet();
  else if (t.dataset.act === "pay-debt") payDebtSheet();
  else if (t.dataset.act === "add-txn") addExpenseSheet();
  else if (t.dataset.act === "account") accountSheet();
  else if (t.dataset.act === "signout") signOut();
});

/* ---------------- boot ---------------- */
Store.load();
Store.subscribe(() => render());
addEventListener("hashchange", render);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
render();
