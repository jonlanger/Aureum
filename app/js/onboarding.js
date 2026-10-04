/* Aureum onboarding — one question per screen, value before commitment.
   Collects just enough to run the Money Map, then hands off to the plan. */
import { esc, ic, illo, $, $$, moneyField, num } from "./ui.js";
import * as Store from "./store.js";
import { money } from "./engine.js";

const answers = { payFrequency: "semimonthly", incomeStability: "stable", hasMatch: "unsure", goal: "none", nudgeLevel: "balanced", debts: [], hasDebt: null };

const STEPS = [
  { id: "welcome" }, { id: "name" }, { id: "pay" }, { id: "stability" }, { id: "essentials" },
  { id: "balances" }, { id: "debt" }, { id: "retire" }, { id: "goal" }, { id: "nudges" }, { id: "building" },
];

export function renderOnboarding(root, step = 0, onDone) {
  const s = STEPS[step];
  const pct = Math.round((step / (STEPS.length - 1)) * 100);
  const back = step > 0 && s.id !== "building";
  const top = s.id === "welcome" || s.id === "building" ? "" : `
    <div class="ob__top">
      ${back ? `<button class="icon-btn" data-back aria-label="Back">${ic("chevronLeft", 22)}</button>` : ""}
      <div class="ob__bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Setup progress"><span style="width:${pct}%"></span></div>
      <button class="link-btn" data-skip>Skip</button>
    </div>`;
  root.innerHTML = `<div class="ob">${top}<form class="ob__body enter ${s.id === "welcome" ? "ob__welcome" : ""} ${s.id === "building" ? "building" : ""}" novalidate>${body(s.id)}</form>${foot(s.id)}</div>`;
  const form = $("form", root);
  const go = (n) => { collect(form, s.id); renderOnboarding(root, n, onDone); window.scrollTo(0, 0); };
  root.querySelector("[data-back]")?.addEventListener("click", () => go(step - 1));
  root.querySelector("[data-skip]")?.addEventListener("click", () => go(STEPS.length - 1));
  root.querySelector("[data-next]")?.addEventListener("click", () => go(step + 1));
  form.addEventListener("submit", (e) => { e.preventDefault(); go(step + 1); });
  root.querySelector("[data-demo]")?.addEventListener("click", () => { Store.seedDemo(); onDone("#/home"); });

  // single-select choice groups
  $$("[data-choice]", root).forEach((b) => b.addEventListener("click", () => {
    const key = b.dataset.choice;
    $$(`[data-choice="${key}"]`, root).forEach((x) => x.setAttribute("aria-checked", x === b));
    answers[key] = b.dataset.value;
    if (key === "hasMatch") $("#matchFields", root).hidden = b.dataset.value !== "yes";
    if (key === "hasDebt") { $("#debtFields", root).hidden = b.dataset.value !== "yes"; if (b.dataset.value === "yes" && !answers.debts.length) addDebt(root); }
  }));
  root.querySelector("[data-add-debt]")?.addEventListener("click", () => addDebt(root));

  const first = $("input", form);
  if (first && s.id !== "welcome") setTimeout(() => first.focus({ preventScroll: true }), 350);

  if (s.id === "building") {
    if (answers.hasDebt !== "yes") answers.debts = [];
    setTimeout(() => { Store.createFromOnboarding(answers); onDone("#/plan?new=1"); }, 2600);
  }
}

function body(id) {
  const a = answers;
  const choice = (key, value, label, sub = "", extra = "") => `<button type="button" class="choice" role="radio" data-choice="${key}" data-value="${value}" aria-checked="${a[key] === value}">${extra}<span>${label}${sub ? `<small>${sub}</small>` : ""}</span></button>`;
  switch (id) {
    case "welcome": return `
      <div class="ob__art">${illo("wizard", { wave: true })}</div>
      <h1>Hi, I'm Sprout. Let's make a plan that fits <em style="color:var(--a-text-brand)">your</em> life.</h1>
      <p class="lead">A few quick questions, about two minutes. You'll get a step-by-step Money Map and a number you can spend today without worry.</p>
      <div class="ob__privacy">${ic("lock", 20)}<span>Your answers stay on this device. No bank login needed to start, and we'll never sell your data.</span></div>`;
    case "name": return `
      <h1>First, what should I call you?</h1>
      <p class="lead">Just a first name or nickname.</p>
      <div class="ob__fields"><div><label class="field-label" for="name">Your name</label><input class="a-input big" id="name" name="name" autocomplete="given-name" value="${esc(a.name || "")}" placeholder="e.g. Sam"></div></div>`;
    case "pay": return `
      <h1>${a.name ? esc(a.name) + ", how" : "How"} much lands in your account each month?</h1>
      <p class="lead">Your take-home pay, after taxes and deductions. A rough number is fine.</p>
      <div class="ob__fields">${moneyField("netMonthly", "Monthly take-home pay", a.netMonthly || "", { placeholder: "3,800" })}
        <div><span class="field-label">How often are you paid?</span><div class="choices choices--row" role="radiogroup" aria-label="Pay frequency">
          ${choice("payFrequency", "weekly", "Weekly")}${choice("payFrequency", "biweekly", "Every 2 weeks")}${choice("payFrequency", "semimonthly", "Twice a month")}${choice("payFrequency", "monthly", "Monthly")}
        </div></div></div>`;
    case "stability": return `
      <h1>How steady is your income?</h1>
      <p class="lead">This sets how big your safety net should be.</p>
      <div class="choices" role="radiogroup" aria-label="Income stability">
        ${choice("incomeStability", "stable", "Pretty steady", "Salary or regular hours", ic("calendar", 26).replace("<svg", '<svg class="ic"'))}
        ${choice("incomeStability", "variable", "It varies", "Tips, gigs, commission, seasonal", ic("trendUp", 26).replace("<svg", '<svg class="ic"'))}
      </div>
      <div class="ob__fields" style="margin-top:22px"><div><label class="field-label" for="dependents">People who depend on your income</label><select class="a-select big" id="dependents" name="dependents">${[0, 1, 2, 3, 4].map((n) => `<option value="${n}" ${+a.dependents === n ? "selected" : ""}>${n === 0 ? "Just me" : n === 4 ? "4 or more" : n}</option>`).join("")}</select></div></div>`;
    case "essentials": return `
      <h1>What do the must-haves cost each month?</h1>
      <p class="lead">Best guesses are perfect. You can fine-tune anytime.</p>
      <div class="ob__fields">
        ${moneyField("rent", "Rent or mortgage", a.rent || "", { size: "sm", placeholder: "1,200" })}
        ${moneyField("bills", "Utilities, phone & insurance", a.bills || "", { size: "sm", placeholder: "250" })}
        ${moneyField("groceries", "Groceries", a.groceries || "", { size: "sm", placeholder: "400" })}
        ${moneyField("transport", "Gas, transit & car costs", a.transport || "", { size: "sm", placeholder: "150" })}
      </div>`;
    case "balances": return `
      <h1>Where are you starting from?</h1>
      <p class="lead">Every plan starts somewhere. $0 is a completely fine answer.</p>
      <div class="ob__fields">
        ${moneyField("checking", "In checking right now", a.checking || "", { size: "sm", placeholder: "900" })}
        ${moneyField("savings", "In savings", a.savings || "", { size: "sm", placeholder: "0", hint: "We'll treat this as the start of your emergency fund." })}
      </div>`;
    case "debt": return `
      <h1>Any credit card balances or loans?</h1>
      <p class="lead">No judgment here. Knowing the interest rates lets us find the fastest way out.</p>
      <div class="choices choices--row" role="radiogroup" aria-label="Has debt">
        ${choice("hasDebt", "yes", "Yes")}${choice("hasDebt", "no", "No debt")}
      </div>
      <div id="debtFields" ${a.hasDebt === "yes" ? "" : "hidden"} style="margin-top:18px">
        <div class="ob__fields" id="debtList">${a.debts.map((d, i) => debtRow(d, i)).join("")}</div>
        <button type="button" class="a-btn a-btn--secondary btn-lg2 btn-block" data-add-debt style="margin-top:12px">${ic("plus", 20)} Add another</button>
      </div>`;
    case "retire": return `
      <h1>Does your job offer a retirement match?</h1>
      <p class="lead">Like a 401(k) or 403(b) where your employer adds money when you contribute.</p>
      <div class="choices" role="radiogroup" aria-label="Employer match">
        ${choice("hasMatch", "yes", "Yes, there's a match")}${choice("hasMatch", "no", "No match / no plan")}${choice("hasMatch", "unsure", "Not sure", "We'll remind you to ask HR. It's often worth thousands.")}
      </div>
      <div id="matchFields" ${a.hasMatch === "yes" ? "" : "hidden"} class="ob__fields" style="margin-top:18px">
        <div class="debt-row"><div class="two">
          <div><label class="field-label" for="matchUpTo">They match up to</label><div class="money-input sm" data-pct><input id="matchUpTo" name="matchUpTo" inputmode="decimal" value="${esc(a.matchUpTo || "")}" placeholder="4"><span>%</span></div></div>
          <div><label class="field-label" for="retirementPct">You put in</label><div class="money-input sm" data-pct><input id="retirementPct" name="retirementPct" inputmode="decimal" value="${esc(a.retirementPct || "")}" placeholder="2"><span>%</span></div></div>
        </div></div>
      </div>`;
    case "goal": {
      const g = (v, label, il) => `<button type="button" class="choice" role="radio" data-choice="goal" data-value="${v}" aria-checked="${a.goal === v}"><span class="ill">${window.AureumArt.illo(il)}</span><span>${label}</span></button>`;
      return `<h1>Anything you're dreaming of?</h1><p class="lead">Pick one to start. You can add more later.</p>
        <div class="choices" role="radiogroup" aria-label="First goal">${g("trip", "A trip", "community")}${g("home", "A home", "target")}${g("car", "A car", "payoff")}${g("school", "School or a course", "learn")}${g("none", "Just get stable first", "shield")}</div>`;
    }
    case "nudges": return `
      <h1>How much should I check in?</h1>
      <p class="lead">You're in charge. Change it anytime in settings.</p>
      <div class="choices" role="radiogroup" aria-label="Nudge level">
        ${choice("nudgeLevel", "gentle", "Gentle", "Only what really matters")}
        ${choice("nudgeLevel", "balanced", "Balanced", "Timely tips plus the occasional lesson")}
        ${choice("nudgeLevel", "proactive", "Proactive", "Every opportunity I spot")}
      </div>`;
    case "building": return `
      <div class="ob__art">${illo("watering")}</div>
      <h1>Building your Money Map…</h1>
      <ul>${["Sizing your safety net", "Ranking your debts by cost", "Checking for free money", "Drafting a budget that fits"].map((t, i) => `<li style="animation-delay:${0.3 + i * 0.5}s">${ic("check", 22)}${t}</li>`).join("")}</ul>`;
  }
}
function foot(id) {
  if (id === "welcome") return `<div class="ob__foot"><button class="a-btn btn-xl btn-block" data-next>Let's build my plan ${ic("arrowRight", 22)}</button><button class="a-btn a-btn--ghost btn-lg2 btn-block" data-demo>Explore with demo data</button></div>`;
  if (id === "building") return "";
  return `<div class="ob__foot"><button class="a-btn btn-xl btn-block" data-next>Continue ${ic("arrowRight", 22)}</button></div>`;
}
function debtRow(d, i) {
  return `<div class="debt-row" data-debt="${i}">
    <div><label class="field-label" for="dn${i}">What is it?</label><select class="a-select big" id="dn${i}" data-k="type"><option value="credit" ${d.type !== "loan" ? "selected" : ""}>Credit card</option><option value="loan" ${d.type === "loan" ? "selected" : ""}>Loan (student, car, personal)</option></select></div>
    <div class="two">
      <div><label class="field-label" for="db${i}">Balance</label><div class="money-input sm"><span>$</span><input id="db${i}" data-k="balance" inputmode="decimal" value="${esc(d.balance || "")}" placeholder="2,500"></div></div>
      <div><label class="field-label" for="da${i}">Interest (APR)</label><div class="money-input sm" data-pct><input id="da${i}" data-k="apr" inputmode="decimal" value="${esc(d.apr || "")}" placeholder="22"><span>%</span></div></div>
    </div>
    <div><label class="field-label" for="dm${i}">Minimum payment</label><div class="money-input sm"><span>$</span><input id="dm${i}" data-k="minPayment" inputmode="decimal" value="${esc(d.minPayment || "")}" placeholder="75"></div></div>
  </div>`;
}
function addDebt(root) {
  collectDebts(root);
  answers.debts.push({ type: "credit" });
  $("#debtList", root).innerHTML = answers.debts.map((d, i) => debtRow(d, i)).join("");
}
function collectDebts(root) {
  $$("[data-debt]", root).forEach((row) => {
    const i = +row.dataset.debt; const d = answers.debts[i] || (answers.debts[i] = {});
    $$("[data-k]", row).forEach((inp) => { d[inp.dataset.k] = inp.dataset.k === "type" ? inp.value : num(inp.value); });
    d.name = d.type === "loan" ? "Loan" : "Credit card";
  });
}
function collect(form, id) {
  $$("input[name], select[name]", form).forEach((inp) => {
    answers[inp.name] = inp.name === "name" ? inp.value.trim() : inp.tagName === "SELECT" ? inp.value : num(inp.value);
  });
  if (id === "debt") collectDebts(form.parentElement);
}
export const _answers = answers;
