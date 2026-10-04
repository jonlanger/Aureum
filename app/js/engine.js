/* ==========================================================================
   Aureum engine — the math. Pure functions only: state in, numbers out.
   Every threshold lives in ASSUMPTIONS so it can be tuned (and cited) in one
   place. See docs/financial-rules.md for sources behind each default.
   ========================================================================== */

export const ASSUMPTIONS = {
  starterEmergency: 1000,      // r/personalfinance "starter" fund; CFPB suggests starting at $500
  starterEmergencyFloor: 500,  // never ask for less than this as a first milestone
  emergencyMonthsStable: 3,    // 3–6 months of essentials is the common range
  emergencyMonthsVariable: 6,  // variable income, single earner w/ dependents → top of range
  highInterestAPR: 8,          // debts at/above this APR beat investing on expected return
  moderateInterestAPR: 4,
  retirementTarget: 0.15,      // Fidelity: 15% of gross incl. employer match
  split: { need: 0.5, want: 0.3, save: 0.2 }, // Warren & Tyagi 50/30/20
  utilizationWarn: 0.30,       // FICO "amounts owed" ≈30% of score; keep under 30%, ideally <10%
  utilizationGreat: 0.10,
  cushion: 200,                // checking floor we plan around (overdraft buffer)
  savingsAPY: 0.035,           // editable default for a high-yield savings account
  escalateStep: 0.01,          // Save More Tomorrow: +1% per raise/quarter
};

export const CATEGORIES = {
  housing:       { label: "Rent & housing",  group: "need", icon: "home" },
  utilities:     { label: "Utilities & phone", group: "need", icon: "bolt" },
  groceries:     { label: "Groceries",       group: "need", icon: "cart" },
  transport:     { label: "Transport",       group: "need", icon: "car" },
  insurance:     { label: "Insurance",       group: "need", icon: "shield" },
  health:        { label: "Health",          group: "need", icon: "medical" },
  debt:          { label: "Debt minimums",   group: "need", icon: "card" },
  dining:        { label: "Dining out",      group: "want", icon: "food" },
  shopping:      { label: "Shopping",        group: "want", icon: "wallet" },
  entertainment: { label: "Entertainment",   group: "want", icon: "film" },
  subscriptions: { label: "Subscriptions",   group: "want", icon: "play" },
  personal:      { label: "Personal & gifts", group: "want", icon: "heart" },
  travel:        { label: "Travel",          group: "want", icon: "plane" },
  income:        { label: "Income",          group: "income", icon: "briefcase" },
  savings:       { label: "Savings transfer", group: "save", icon: "piggy" },
};

/* ---------------- dates ---------------- */
export const DAY = 86400000;
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** Parse "YYYY-MM-DD" as a LOCAL date (plain new Date("YYYY-MM-DD") is UTC and shifts days). */
export const pd = (s) => (s instanceof Date ? s : new Date(String(s).slice(0, 10) + "T00:00:00"));
export const startOfMonth = (d = today()) => new Date(d.getFullYear(), d.getMonth(), 1);
export const daysInMonth = (d = today()) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
export const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
export const monthLabel = (d) => d.toLocaleString("en-US", { month: "short", year: "numeric" });

/* ---------------- basic aggregates ---------------- */
const sum = (a, f = (x) => x) => a.reduce((t, x) => t + f(x), 0);
export const byType = (state, ...types) => state.accounts.filter((a) => types.includes(a.type));
export const debts = (state) => byType(state, "credit", "loan").filter((d) => d.balance > 0);
export const checking = (state) => byType(state, "checking")[0];
export const emergencyAccount = (state) => state.accounts.find((a) => a.emergency) || byType(state, "savings")[0];

export function monthlyIncome(state) {
  // Net (take-home). Recurring income normalized to a month.
  const rec = state.recurring.filter((r) => r.kind === "income");
  if (rec.length) return sum(rec, (r) => r.amount * perMonth(r.every));
  return state.profile.netMonthly || 0;
}
export const perMonth = (every) => ({ weekly: 52 / 12, biweekly: 26 / 12, semimonthly: 2, monthly: 1 }[every] || 1);
export const grossMonthly = (state) => state.profile.grossAnnual ? state.profile.grossAnnual / 12 : monthlyIncome(state) / 0.78;

export function txnsInMonth(state, ref = today()) {
  const s = startOfMonth(ref), e = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
  return state.transactions.filter((t) => { const d = pd(t.date); return d >= s && d < e; });
}
export function spendByCategory(txns) {
  const out = {};
  txns.forEach((t) => { if (t.amount < 0 && t.category !== "savings") out[t.category] = (out[t.category] || 0) - t.amount; });
  return out;
}

/** Essentials = need-group budgets (falls back to need-group recurring bills) + debt minimums. */
export function monthlyEssentials(state) {
  const needBudget = sum(Object.entries(state.budgets).filter(([k]) => CATEGORIES[k]?.group === "need" && k !== "debt"), ([, v]) => v);
  const mins = sum(debts(state), (d) => d.minPayment || 0);
  return Math.round(needBudget + mins);
}
export const wantsBudget = (state) => Math.round(sum(Object.entries(state.budgets).filter(([k]) => CATEGORIES[k]?.group === "want"), ([, v]) => v));

/** Month-end spend projection: scheduled bills count once, only flexible spending is extrapolated. */
export function projectedMonthSpend(state, ref = today()) {
  const frac = Math.max(ref.getDate() / daysInMonth(ref), 0.15);
  const month = txnsInMonth(state, ref).filter((t) => t.amount < 0 && t.category !== "savings" && !t.internal);
  const flexible = sum(month.filter((t) => !t.recurringId), (t) => -t.amount);
  const bills = sum(state.recurring.filter((r) => r.kind === "bill"), (r) => r.amount * perMonth(r.every));
  return Math.round(flexible / frac + bills);
}

/* ---------------- 1. Budget allocator (adapted 50/30/20) ----------------
   Needs are what they are; we don't pretend rent is 50% if it's 62%.
   Savings floor first, wants absorb the difference, then flag if needs > 50%. */
export function suggestSplit(netMonthly, essentials) {
  const S = ASSUMPTIONS.split;
  const need = Math.max(essentials, 0);
  const remaining = Math.max(netMonthly - need, 0);
  // Room to spare → classic 20% savings. Squeezed → savings keeps 40% of whatever is left.
  const save = Math.round(need <= netMonthly * S.need ? netMonthly * S.save : remaining * 0.4);
  const want = Math.round(remaining - save);
  return { need: Math.round(need), want, save, needPct: need / netMonthly, wantPct: want / netMonthly, savePct: save / netMonthly };
}

/* ---------------- 2. Emergency fund ladder ---------------- */
export function emergencyTargets(state) {
  const ess = monthlyEssentials(state);
  const A = ASSUMPTIONS;
  const variable = state.profile.incomeStability === "variable" || (state.profile.dependents > 0 && state.profile.earners === 1);
  const months = variable ? A.emergencyMonthsVariable : A.emergencyMonthsStable;
  const starter = Math.max(A.starterEmergencyFloor, Math.min(A.starterEmergency, Math.round(ess / 50) * 50));
  const full = Math.max(Math.round(ess * months / 50) * 50, starter * 3);
  return { starter, full, months, essentials: ess, variable };
}
export const emergencySaved = (state) => emergencyAccount(state)?.balance || 0;
export const emergencyMonths = (state) => { const e = monthlyEssentials(state); return e ? emergencySaved(state) / e : 0; };

/* ---------------- 3. Employer match ---------------- */
export function matchGap(state) {
  const p = state.profile;
  if (!p.hasMatch) return null;
  const gross = grossMonthly(state);
  const gapPct = Math.max(0, (p.matchUpTo || 0) - (p.retirementPct || 0));
  const freeMonthly = gross * gapPct * (p.matchRate ?? 1);
  return { gapPct, contributeMonthly: gross * gapPct, freeMonthly, freeAnnual: freeMonthly * 12, captured: gapPct === 0 };
}

/* ---------------- 4. Money Map — the priority waterfall ----------------
   One ordered list of "where the next dollar goes", the backbone of every
   suggestion. Mirrors the widely used financial order of operations. */
export function moneyMap(state) {
  const A = ASSUMPTIONS;
  const ef = emergencyTargets(state);
  const saved = emergencySaved(state);
  const mg = matchGap(state);
  const ds = debts(state);
  const high = ds.filter((d) => d.apr >= A.highInterestAPR);
  const mid = ds.filter((d) => d.apr >= A.moderateInterestAPR && d.apr < A.highInterestAPR);
  const income = monthlyIncome(state);
  const ess = ef.essentials;
  const retPct = (state.profile.retirementPct || 0) + (mg ? Math.min(state.profile.retirementPct || 0, state.profile.matchUpTo || 0) * (state.profile.matchRate ?? 1) : 0);

  const steps = [
    { id: "essentials", title: "Cover the essentials", short: "Essentials", illo: "shield",
      why: "Rent, food, utilities, transport and minimum debt payments come first. Missing a minimum payment hurts your credit more than anything else (payment history is about 35% of a FICO score).",
      progress: Math.min(1, income / Math.max(ess, 1)), done: income >= ess,
      detail: income >= ess ? `Your essentials (${money(ess)}) fit inside your take-home pay (${money(income)}).` : `Essentials are ${money(ess - income)} more than take-home pay. Let's find room.` },
    { id: "starter", title: `Save a ${money(ef.starter)} starter cushion`, short: "Starter fund", illo: "piggy",
      why: "A small buffer keeps a flat tire or vet bill off a credit card. In 2025, 37% of U.S. adults couldn't cover a $400 surprise with cash.",
      target: ef.starter, current: Math.min(saved, ef.starter), progress: Math.min(1, saved / ef.starter), done: saved >= ef.starter },
    { id: "match", title: "Get your full employer match", short: "Free money", illo: "growth", skip: !mg,
      why: "A match is an instant, guaranteed return, often 50–100% on every dollar. Nothing else you can do with money beats it.",
      progress: mg ? (mg.captured ? 1 : (state.profile.retirementPct || 0) / state.profile.matchUpTo) : 1, done: !mg || mg.captured,
      detail: mg && !mg.captured ? `Raise your contribution by ${pct(mg.gapPct)} to claim about ${money(mg.freeAnnual)} a year in free money.` : "You're capturing every matched dollar." },
    { id: "highdebt", title: "Pay off high-interest debt", short: "High-interest debt", illo: "payoff", skip: !high.length && !ds.some((d) => d.paidOff && d.apr >= A.highInterestAPR),
      why: `Card interest averages around 22% APR. Paying it off is a guaranteed return at that rate, which is better than the market's long-run average.`,
      target: sum(high, (d) => d.original || d.balance), current: sum(high, (d) => (d.original || d.balance) - d.balance),
      progress: high.length ? sum(high, (d) => (d.original || d.balance) - d.balance) / Math.max(1, sum(high, (d) => d.original || d.balance)) : 1, done: !high.length },
    { id: "fullfund", title: `Grow your fund to ${ef.months} months`, short: `${ef.months}-month fund`, illo: "shield",
      why: ef.variable ? "With variable income or dependents on one paycheck, aim for the top of the 3–6 month range." : "Three months of essentials covers most job changes and big surprises. Only about 55% of U.S. adults have that.",
      target: ef.full, current: Math.min(saved, ef.full), progress: Math.min(1, saved / Math.max(ef.full, 1)), done: saved >= ef.full },
    { id: "retire15", title: "Save 15% for retirement", short: "15% retirement", illo: "growth",
      why: "Saving about 15% of pay from your mid-20s (including any match) is the guideline behind having roughly 10× your salary by 67.",
      progress: Math.min(1, retPct / A.retirementTarget), done: retPct >= A.retirementTarget,
      detail: `You're at about ${pct(retPct)} including the match. Raising it 1% a year gets you there painlessly.` },
    { id: "goals", title: "Fund your goals", short: "Goals", illo: "target",
      why: "With the foundations in place, every extra dollar can go toward the life stuff: a trip, a home, a degree.",
      progress: goalsProgress(state), done: false },
  ];
  if (mid.length) steps.splice(6, 0, { id: "middebt", title: "Knock out moderate-interest debt", short: "Other debt", illo: "payoff",
    why: "Loans between 4% and 8% sit in the gray zone. Paying extra is a solid, risk-free return once the steps above are done.",
    progress: sum(mid, (d) => (d.original || d.balance) - d.balance) / Math.max(1, sum(mid, (d) => d.original || d.balance)), done: false });

  const visible = steps.filter((s) => !s.skip);
  const activeIdx = visible.findIndex((s) => !s.done);
  visible.forEach((s, i) => { s.status = s.done ? "done" : i === activeIdx ? "active" : "next"; s.n = i + 1; });
  return { steps: visible, active: visible[activeIdx] || visible[visible.length - 1], completed: visible.filter((s) => s.done).length };
}
function goalsProgress(state) {
  const g = state.goals.filter((x) => x.kind !== "emergency");
  if (!g.length) return 0;
  return sum(g, (x) => Math.min(1, x.saved / x.target)) / g.length;
}

/* ---------------- 5. Monthly plan: where this month's surplus goes ---------------- */
export function monthlyPlan(state) {
  const income = monthlyIncome(state);
  const ess = monthlyEssentials(state);
  const wants = wantsBudget(state);
  const surplus = Math.max(0, income - ess - wants);
  const map = moneyMap(state);
  const mg = matchGap(state);
  const alloc = [];
  let left = surplus;
  const take = (id, label, amount, color) => { const a = Math.max(0, Math.min(left, Math.round(amount))); if (a > 0) { alloc.push({ id, label, amount: a, color }); left -= a; } };
  // Match is captured from gross via payroll, so it doesn't use the checking surplus, but it reduces take-home slightly.
  const ef = emergencyTargets(state), saved = emergencySaved(state);
  const active = map.active.id;
  if (["essentials", "starter"].includes(active)) take("starter", "Starter fund", Math.min(ef.starter - saved, left), "var(--viz-1)");
  if (["starter", "match", "highdebt"].includes(active)) {
    const hi = debts(state).filter((d) => d.apr >= ASSUMPTIONS.highInterestAPR);
    if (hi.length) take("highdebt", "Extra on high-interest debt", left * (active === "starter" ? 0.5 : 0.85), "var(--viz-3)");
  }
  if (["fullfund", "highdebt", "match"].includes(active) && saved < ef.full) take("fullfund", "Emergency fund", left * (active === "fullfund" ? 0.8 : 0.6), "var(--viz-2)");
  const goals = state.goals.filter((g) => g.kind !== "emergency" && g.saved < g.target);
  goals.forEach((g, i) => take("goal-" + g.id, g.name, Math.min(g.monthly || left / (goals.length - i), g.target - g.saved), `var(--viz-${(i % 3) + 4})`));
  if (left > 0) take("buffer", "Flexible buffer", left, "var(--viz-muted)");
  return { income, essentials: ess, wants, surplus, alloc, matchContribution: mg && !mg.captured ? mg.contributeMonthly : 0 };
}

/* ---------------- 6. Goal math ---------------- */
const mrate = (apy) => Math.pow(1 + apy, 1 / 12) - 1;
export function monthsToGoal(saved, target, monthly, apy = ASSUMPTIONS.savingsAPY) {
  if (saved >= target) return 0;
  if (monthly <= 0 && apy <= 0) return Infinity;
  const r = mrate(apy); let b = saved, m = 0;
  while (b < target && m < 600) { b = b * (1 + r) + monthly; m++; }
  return m >= 600 ? Infinity : m;
}
export function requiredMonthly(saved, target, months, apy = ASSUMPTIONS.savingsAPY) {
  if (months <= 0) return target - saved;
  const r = mrate(apy);
  if (r === 0) return Math.max(0, (target - saved) / months);
  const g = Math.pow(1 + r, months);
  return Math.max(0, ((target - saved * g) * r) / (g - 1));
}
export function projectGoal(saved, monthly, months, apy = ASSUMPTIONS.savingsAPY) {
  const r = mrate(apy); const out = [saved]; let b = saved;
  for (let i = 0; i < months; i++) { b = b * (1 + r) + monthly; out.push(Math.round(b)); }
  return out;
}
export function goalPace(goal, ref = today()) {
  if (!goal.targetDate) return { status: goal.monthly > 0 ? "steady" : "unfunded" };
  const months = Math.max(0, Math.round((pd(goal.targetDate) - ref) / (DAY * 30.44)));
  const need = requiredMonthly(goal.saved, goal.target, months);
  const eta = monthsToGoal(goal.saved, goal.target, goal.monthly || 0);
  const status = goal.saved >= goal.target ? "done" : eta <= months ? (eta < months - 1 ? "ahead" : "on-track") : "behind";
  return { months, need: Math.round(need), eta, status };
}

/* ---------------- 7. Debt payoff simulator (avalanche / snowball) ---------------- */
export function simulateDebts(list, extra = 0, method = "avalanche", maxMonths = 480) {
  const ds = list.filter((d) => d.balance > 0).map((d) => ({ ...d, bal: d.balance, paidMonth: null, interest: 0 }));
  const order = () => ds.filter((d) => d.bal > 0).sort((a, b) => method === "snowball" ? a.bal - b.bal : b.apr - a.apr || a.bal - b.bal);
  const totals = [Math.round(sum(ds, (d) => d.bal))];
  let m = 0, interest = 0;
  const budget = sum(ds, (d) => d.minPayment) + extra;
  while (ds.some((d) => d.bal > 0.5) && m < maxMonths) {
    m++;
    ds.forEach((d) => { if (d.bal > 0) { const i = d.bal * (d.apr / 100 / 12); d.bal += i; d.interest += i; interest += i; } });
    let pool = budget;
    ds.forEach((d) => { if (d.bal > 0) { const p = Math.min(d.minPayment, d.bal); d.bal -= p; pool -= p; } });
    for (const d of order()) { if (pool <= 0) break; const p = Math.min(pool, d.bal); d.bal -= p; pool -= p; }
    ds.forEach((d) => { if (d.bal <= 0.5 && d.paidMonth == null) { d.bal = 0; d.paidMonth = m; } });
    totals.push(Math.round(sum(ds, (d) => Math.max(0, d.bal))));
  }
  return { months: m, interest: Math.round(interest), totals, order: ds.map((d) => ({ id: d.id, name: d.name, month: d.paidMonth, interest: Math.round(d.interest) })).sort((a, b) => a.month - b.month) };
}
export function minimumOnlyCost(list) { return simulateDebts(list, 0, "avalanche"); }

/* ---------------- 8. Cash-flow forecast & safe-to-spend ---------------- */
export function avgDailyDiscretionary(state, days = 30) {
  const since = new Date(today() - days * DAY);
  const t = state.transactions.filter((x) => pd(x.date) >= since && x.amount < 0 && !x.recurringId && x.category !== "savings");
  return sum(t, (x) => -x.amount) / days;
}
function occurrences(r, from, to) {
  // Day-of-month based schedule; semimonthly = day and day+14.
  const days = r.every === "semimonthly" ? [r.day, Math.min(r.day + 14, 28)] : [r.day];
  const out = [];
  for (let d = new Date(from); d <= to; d = new Date(d.getTime() + DAY)) {
    if (r.every === "weekly" || r.every === "biweekly") {
      const anchor = new Date(r.anchor || "2026-01-02");
      const diff = Math.round((d - anchor) / DAY);
      if (diff % (r.every === "weekly" ? 7 : 14) === 0) out.push(new Date(d));
    } else if (days.includes(d.getDate())) out.push(new Date(d));
  }
  return out;
}
export function upcoming(state, days = 30) {
  const from = new Date(today().getTime() + DAY), to = new Date(today().getTime() + days * DAY);
  const ev = [];
  state.recurring.forEach((r) => occurrences(r, from, to).forEach((d) => ev.push({ ...r, date: d, signed: r.kind === "income" ? r.amount : -r.amount })));
  return ev.sort((a, b) => a.date - b.date);
}
export function forecast(state, days = 30) {
  const daily = avgDailyDiscretionary(state);
  const ev = upcoming(state, days);
  let bal = checking(state)?.balance || 0;
  const series = [bal], labels = ["Today"], dates = [today()];
  for (let i = 1; i <= days; i++) {
    const d = new Date(today().getTime() + i * DAY);
    ev.filter((e) => e.date.getTime() === d.getTime()).forEach((e) => (bal += e.signed));
    bal -= daily;
    series.push(Math.round(bal)); dates.push(d);
    labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
  const minV = Math.min(...series), minI = series.indexOf(minV);
  return { series, labels, dates, low: { value: minV, index: minI, date: dates[minI] }, daily };
}
export function safeToSpend(state) {
  const ev = upcoming(state, 35);
  const nextPay = ev.find((e) => e.kind === "income");
  const until = nextPay ? nextPay.date : new Date(today().getTime() + 14 * DAY);
  const bills = sum(ev.filter((e) => e.kind !== "income" && e.date <= until), (e) => e.amount);
  const plan = monthlyPlan(state);
  const days = Math.max(1, Math.round((until - today()) / DAY));
  const plannedSave = Math.round((plan.surplus - (plan.alloc.find((a) => a.id === "buffer")?.amount || 0)) * Math.min(1, days / 30.44));
  const bal = checking(state)?.balance || 0;
  const amount = Math.max(0, Math.round(bal - bills - plannedSave - ASSUMPTIONS.cushion));
  return { amount, perDay: Math.floor(amount / days), days, bills, plannedSave, until, nextPay, balance: bal };
}

/* ---------------- 9. Health score (0–100) ----------------
   Four pillars mirror the CFPB Financial Well-Being elements:
   control · shock capacity · on track for goals · freedom to make choices. */
export function healthScore(state) {
  const income = monthlyIncome(state);
  const projectedSpend = projectedMonthSpend(state);
  const budgetTotal = monthlyEssentials(state) + wantsBudget(state);
  const control = clamp01(1 - Math.max(0, projectedSpend - budgetTotal) / Math.max(budgetTotal, 1) * 2) * 0.6 + (income >= monthlyEssentials(state) ? 0.4 : 0);
  const shock = clamp01(emergencyMonths(state) / emergencyTargets(state).months);
  const plan = monthlyPlan(state);
  const mg = matchGap(state);
  const saveRate = (plan.surplus + (mg ? 0 : 0)) / Math.max(income, 1);
  const onTrack = clamp01(saveRate / ASSUMPTIONS.split.save) * 0.7 + (mg && !mg.captured ? 0 : 0.3);
  const ds = debts(state);
  const cards = ds.filter((d) => d.type === "credit");
  const util = cards.length ? sum(cards, (d) => d.balance) / Math.max(1, sum(cards, (d) => d.limit || 0)) : 0;
  const highDebt = sum(ds.filter((d) => d.apr >= ASSUMPTIONS.highInterestAPR), (d) => d.balance);
  const dti = sum(ds, (d) => d.minPayment) / Math.max(income, 1);
  const freedom = clamp01(1 - highDebt / Math.max(income * 3, 1)) * 0.5 + clamp01(1 - util / 0.6) * 0.25 + clamp01(1 - dti / 0.36) * 0.25;
  const pillars = [
    { id: "control", label: "In control", value: control, hint: "Spending inside your plan" },
    { id: "shock", label: "Shock-ready", value: shock, hint: "Emergency fund coverage" },
    { id: "ontrack", label: "On track", value: onTrack, hint: "Saving rate & free money" },
    { id: "freedom", label: "Free to choose", value: freedom, hint: "Debt & credit health" },
  ];
  const score = Math.round(sum(pillars, (p) => p.value) / 4 * 100);
  const grade = score >= 90 ? "A" : score >= 80 ? "B+" : score >= 70 ? "B" : score >= 60 ? "C+" : score >= 50 ? "C" : "Building";
  return { score, grade, pillars, utilization: util, dti, saveRate };
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/* ---------------- formatting ---------------- */
export const money = (v, d = 0) => (v < 0 ? "−$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (v, d = 0) => (v * 100).toFixed(d).replace(/\.0+$/, "") + "%";
export const compact = (v) => { const a = Math.abs(v); const s = v < 0 ? "−$" : "$"; return a >= 1e6 ? s + (a / 1e6).toFixed(1) + "M" : a >= 1e4 ? s + Math.round(a / 1e3) + "K" : a >= 1e3 ? s + (a / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : s + Math.round(a); };
export const monthsToText = (m) => !isFinite(m) ? "not at this pace" : m <= 0 ? "now" : m < 12 ? `${m} month${m === 1 ? "" : "s"}` : `${Math.floor(m / 12)} yr${m >= 24 ? "s" : ""}${m % 12 ? ` ${m % 12} mo` : ""}`;
export const dateIn = (m) => addMonths(today(), m).toLocaleString("en-US", { month: "short", year: "numeric" });
