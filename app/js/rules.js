/* ==========================================================================
   Aureum coach — insight rules + governor
   Rules never do math themselves; they read the engine's outputs (ctx) and
   decide whether there's something worth saying. The governor then picks the
   few that matter most, respecting the user's nudge level and cooldowns.

   Rule shape:
     id, family (one per family shown at a time), severity: urgent|suggest|celebrate|learn,
     cooldown (days after dismiss), when(ctx) → data | null,
     title(d), body(d), action(d) → {label, route} | null, impact(d) → $/yr, why, source
   ========================================================================== */
import * as E from "./engine.js";
const { money, pct, compact } = E;

/* ---------- context: computed once, shared by every rule ---------- */
export function buildContext(state) {
  const t = E.today();
  const month = E.txnsInMonth(state);
  const spend = E.spendByCategory(month);
  const dayOfMonth = t.getDate(), dim = E.daysInMonth();
  const frac = dayOfMonth / dim;
  const income = E.monthlyIncome(state);
  const prev = [1, 2, 3].map((k) => E.spendByCategory(E.txnsInMonth(state, E.addMonths(E.startOfMonth(t), -k))));
  const avgPrev = (cat) => prev.reduce((s, m) => s + (m[cat] || 0), 0) / 3;
  const cards = E.debts(state).filter((d) => d.type === "credit");
  const cardBal = cards.reduce((s, d) => s + d.balance, 0), cardLimit = cards.reduce((s, d) => s + (d.limit || 0), 0);
  const last = (days) => state.transactions.filter((x) => (t - E.pd(x.date)) / E.DAY <= days);
  return {
    state, t, month, spend, dayOfMonth, dim, frac, income, avgPrev, last,
    map: E.moneyMap(state), plan: E.monthlyPlan(state), ef: E.emergencyTargets(state), efSaved: E.emergencySaved(state),
    fc: E.forecast(state, 30), sts: E.safeToSpend(state), health: E.healthScore(state), match: E.matchGap(state),
    debts: E.debts(state), cards, cardBal, cardLimit, util: cardLimit ? cardBal / cardLimit : 0,
    wantsSpent: Object.entries(spend).filter(([k]) => E.CATEGORIES[k]?.group === "want").reduce((s, [, v]) => s + v, 0),
    needsBudget: E.monthlyEssentials(state),
  };
}
const fmtDate = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const S = { CFPB: "CFPB, “An essential guide to building an emergency fund”", SHED: "Federal Reserve, SHED 2025 (published May 2026)", FICO: "FICO score factors: payment history ≈35%, amounts owed ≈30%", FID: "Fidelity retirement guideline: save 15% from age 25", WARREN: "Warren & Tyagi, All Your Worth (2005): 50/30/20", KELLOGG: "Gal & McShane (Kellogg, 2012), debt repayment & motivation", SMART: "Thaler & Benartzi (2004), Save More Tomorrow", G19: "Federal Reserve G.19: ~22% APR on cards assessed interest (Q2 2026)", POF: "Common financial order of operations (r/personalfinance flowchart)" };

/* ======================================================================
   RULE CATALOG (46)
   ====================================================================== */
export const RULES = [
  /* ---------------- SAFETY (7) ---------------- */
  { id: "S1-overdraft", family: "cash", severity: "urgent", cooldown: 2, source: S.CFPB,
    when: (c) => c.fc.low.value < 0 ? c.fc.low : null,
    title: (d) => `Checking could dip below $0 on ${fmtDate(d.date)}.`,
    body: (d, c) => `Based on upcoming bills and your usual spending, you'd hit about ${money(d.value)}. Moving ${money(Math.ceil((-d.value + E.ASSUMPTIONS.cushion) / 50) * 50)} from savings now avoids overdraft fees.`,
    action: (d) => ({ label: `Move ${money(Math.ceil((-d.value + E.ASSUMPTIONS.cushion) / 50) * 50)}`, op: "transfer", amount: Math.ceil((-d.value + E.ASSUMPTIONS.cushion) / 50) * 50 }),
    impact: () => 35 * 12, why: "Overdraft fees commonly run about $35 each. A transfer now costs nothing." },
  { id: "S2-low-cushion", family: "cash", severity: "urgent", cooldown: 3,
    when: (c) => c.fc.low.value >= 0 && c.fc.low.value < E.ASSUMPTIONS.cushion ? c.fc.low : null,
    title: (d) => `Things get tight around ${fmtDate(d.date)}.`,
    body: (d) => `Checking is projected to drop to ${money(d.value)}, under your ${money(E.ASSUMPTIONS.cushion)} cushion. Easing up on extras this week keeps you covered.`,
    action: () => ({ label: "See forecast", route: "#/home" }), impact: () => 0, why: "We keep a small cushion in checking so timing quirks don't cause fees." },
  { id: "S3-bills-before-pay", family: "cash", severity: "urgent", cooldown: 3,
    when: (c) => c.sts.bills > c.sts.balance ? c.sts : null,
    title: (d) => `Bills before payday exceed what's in checking.`,
    body: (d) => `${money(d.bills)} is due before ${fmtDate(d.until)}, and you have ${money(d.balance)}. Consider moving ${money(d.bills - d.balance + E.ASSUMPTIONS.cushion)} or asking a biller for a new due date.`,
    action: (d) => ({ label: "Move money", op: "transfer", amount: Math.ceil((d.bills - d.balance + E.ASSUMPTIONS.cushion) / 50) * 50 }), impact: () => 0, why: "Late payments are the biggest single hit to a credit score." },
  { id: "S4-no-fund", family: "fund", step: ["starter"], severity: "suggest", cooldown: 7, source: S.CFPB,
    when: (c) => c.efSaved < 100 ? {} : null,
    title: () => "Start your safety net with $10 a week.",
    body: () => "The CFPB suggests starting tiny and automating it. $10 a week becomes $520 by this time next year, enough to handle most surprise bills.",
    action: () => ({ label: "Automate $10/week", op: "automate", amount: 43 }), impact: () => 520, why: "37% of U.S. adults couldn't cover a $400 surprise with cash in 2025." },
  { id: "S5-overspend-month", family: "control", severity: "urgent", cooldown: 5,
    when: (c) => { const proj = E.projectedMonthSpend(c.state); return c.dayOfMonth >= 8 && proj > c.income * 1.02 ? { proj } : null; },
    title: (d) => "You're on pace to spend more than you earn this month.",
    body: (d, c) => `At this rate you'll spend about ${money(d.proj)} against ${money(c.income)} of take-home pay. Which category could you pause for two weeks?`,
    action: () => ({ label: "Review budget", route: "#/budget" }), impact: (d, c) => (d.proj - c.income) * 12, why: "Spending more than you earn is the one pattern every other goal depends on fixing." },
  { id: "S6-income-gap", family: "control", severity: "urgent", cooldown: 14,
    when: (c) => c.needsBudget > c.income ? { gap: c.needsBudget - c.income } : null,
    title: (d) => `Essentials cost ${money(d.gap)} more than you bring home.`,
    body: () => "Let's look for the biggest lever: housing, transport or a debt payment that could be restructured. Small trims elsewhere rarely close a gap like this.",
    action: () => ({ label: "Rework essentials", route: "#/budget" }), impact: (d) => d.gap * 12, why: "Essentials first is step 1 of the Money Map." },
  { id: "S7-payday", family: "payday", severity: "suggest", cooldown: 10, source: S.SMART,
    when: (c) => { const p = c.last(2).find((x) => x.category === "income" && x.amount > 300); return p && c.plan.surplus > 0 ? { p } : null; },
    title: (d, c) => `Payday! Pay yourself first: ${money(Math.round(c.plan.surplus / 2))} toward ${c.map.active.short.toLowerCase()}.`,
    body: () => "Moving it now, before spending starts, is the single most reliable savings habit.",
    action: (d, c) => ({ label: `Move ${money(Math.round(c.plan.surplus / 2))}`, op: "save", amount: Math.round(c.plan.surplus / 2) }), impact: () => 0, why: "Automatic, first-thing transfers beat end-of-month leftovers." },

  /* ---------------- MONEY MAP / PLAN (11) ---------------- */
  { id: "P1-match", family: "match", step: ["match", "starter"], severity: "suggest", cooldown: 14, source: S.POF,
    when: (c) => c.match && !c.match.captured ? c.match : null,
    title: (d) => `You're leaving ${money(d.freeAnnual)} a year of free money on the table.`,
    body: (d) => `Raising your retirement contribution by ${pct(d.gapPct)} claims your full employer match. Your paycheck shrinks by less than that, because contributions are pre-tax.`,
    action: () => ({ label: "Show me how", route: "#/plan" }), impact: (d) => d.freeAnnual, why: "An employer match is an instant 50–100% return. It comes before everything except essentials and a starter cushion." },
  { id: "P2-starter-close", family: "fund", step: ["starter"], severity: "suggest", cooldown: 5,
    when: (c) => c.map.active.id === "starter" && c.ef.starter - c.efSaved <= c.ef.starter * 0.35 ? { left: c.ef.starter - c.efSaved } : null,
    title: (d) => `Only ${money(d.left)} to your starter cushion.`,
    body: () => "One or two transfers and you're there. That unlocks the next step on your Money Map.",
    action: (d) => ({ label: `Add ${money(Math.min(d.left, 100))}`, op: "save", amount: Math.min(d.left, 100) }), impact: () => 0, why: "Hitting a first milestone quickly is strongly linked to sticking with the plan." },
  { id: "P3-high-apr", family: "debt", step: ["highdebt", "starter", "match"], severity: "suggest", cooldown: 10, source: S.G19,
    when: (c) => { const h = c.debts.filter((d) => d.apr >= E.ASSUMPTIONS.highInterestAPR); return h.length ? { h, interest: h.reduce((s, d) => s + d.balance * d.apr / 100, 0) } : null; },
    title: (d) => `High-interest debt costs you about ${money(d.interest)} a year.`,
    body: (d) => `${d.h.map((x) => `${x.name} at ${x.apr}%`).join(", ")}. Every extra dollar here earns a guaranteed ${Math.round(Math.max(...d.h.map((x) => x.apr)))}% return.`,
    action: () => ({ label: "Open payoff plan", route: "#/debt" }), impact: (d) => d.interest, why: "Above about 8% APR, paying debt beats the expected return of investing, with zero risk." },
  { id: "P4-extra-payment", family: "debt", step: ["highdebt", "middebt"], severity: "suggest", cooldown: 10,
    when: (c) => { if (!c.debts.length) return null; const base = E.simulateDebts(c.debts, 0), more = E.simulateDebts(c.debts, 50); const saved = base.interest - more.interest; return saved > 60 ? { saved, months: base.months - more.months, years: base.months / 12 } : null; },
    title: (d) => `$50 extra a month saves ${money(d.saved)} in interest.`,
    body: (d) => `You'd also be debt-free ${d.months} months sooner. That's the price of about one takeout meal a week.`,
    action: () => ({ label: "Try it", route: "#/debt" }), impact: (d) => d.saved / Math.max(1, d.years), why: "Minimum payments are designed to stretch repayment out. Small extras compound in your favor." },
  { id: "P5-method", family: "debt-method", severity: "learn", cooldown: 30, source: S.KELLOGG,
    when: (c) => { if (c.debts.length < 2) return null; const a = E.simulateDebts(c.debts, 100, "avalanche"), s = E.simulateDebts(c.debts, 100, "snowball"); return { diff: s.interest - a.interest }; },
    title: (d) => d.diff < 150 ? "Snowball or avalanche? For you, snowball wins." : "Avalanche saves you real money here.",
    body: (d) => d.diff < 150 ? `Paying smallest balances first costs only ${money(d.diff)} more, and research shows the quick wins help people finish.` : `Highest-rate-first saves ${money(d.diff)} versus smallest-first. Worth it if you can stay motivated.`,
    action: () => ({ label: "Compare methods", route: "#/debt" }), impact: () => 0, why: "A Kellogg study of 6,000 borrowers found people who cleared small balances first were more likely to eliminate their debt." },
  { id: "P6-escalate", family: "retire", severity: "suggest", cooldown: 30, source: S.SMART,
    when: (c) => { const s = c.map.steps.find((x) => x.id === "retire15"); return s && !s.done && ["fullfund", "retire15", "goals", "middebt"].includes(c.map.active.id) ? {} : null; },
    title: () => "Turn on auto-increase: +1% each year.",
    body: () => "You'll barely notice 1%, especially timed with a raise. In the original Save More Tomorrow study, savers went from 3.5% to 13.6% this way.",
    action: () => ({ label: "Set reminder", op: "remind" }), impact: (d, c) => E.grossMonthly(c.state) * 0.12, why: "Committing future raises, not today's pay, sidesteps the feeling of loss." },
  { id: "P7-retire-under", family: "retire", severity: "learn", cooldown: 45, source: S.FID,
    when: (c) => { const s = c.map.steps.find((x) => x.id === "retire15"); return s && !s.done ? { p: s.progress } : null; },
    title: () => "Retirement: the 15% guideline, explained.",
    body: (d) => `You're about ${pct(d.p)} of the way there. Starting in your 20s, 15% of pay (match included) is the benchmark for retiring comfortably.`,
    action: () => ({ label: "Read the 3-min lesson", route: "#/learn/retire" }), impact: () => 0, why: "Fidelity's milestones (1× salary by 30, 10× by 67) assume roughly 15% savings." },
  { id: "P8-automate", family: "automate", severity: "suggest", cooldown: 21,
    when: (c) => !c.state.recurring.some((r) => r.category === "savings") && c.plan.surplus > 25 ? {} : null,
    title: (d, c) => `Automate ${money(Math.round(c.plan.surplus * 0.5 / 5) * 5)} on each payday.`,
    body: () => "Set it once and your plan runs itself. Automatic transfers are the most consistent predictor of who actually saves.",
    action: (d, c) => ({ label: "Set up transfer", op: "automate", amount: Math.round(c.plan.surplus * 0.5 / 5) * 5 }), impact: () => 0, why: "The CFPB recommends automating savings so it happens without a decision." },
  { id: "P9-hysa", family: "hysa", severity: "suggest", cooldown: 60,
    when: (c) => { const a = E.emergencyAccount(c.state); return a && a.balance > 300 && (a.apy || 0) < 0.01 ? { a, gain: a.balance * (E.ASSUMPTIONS.savingsAPY - (a.apy || 0)) } : null; },
    title: (d) => `Your savings could earn about ${money(d.gain)} more a year.`,
    body: () => "Many high-yield savings accounts pay several percent, FDIC-insured, versus near zero at big banks. Same safety, more growth.",
    action: () => ({ label: "Learn what to look for", route: "#/learn/hysa" }), impact: (d) => d.gain, why: "Emergency money should be safe and liquid, but it doesn't have to sit idle." },
  { id: "P10-step-done", family: "milestone", severity: "celebrate", cooldown: 365,
    when: (c) => { const done = c.map.steps.filter((s) => s.done && s.id !== "essentials").pop(); return done && !c.state.settings.celebrated?.[done.id] ? done : null; },
    title: (d) => `Step complete: ${d.short}! 🎉`,
    body: (d, c) => `That's ${c.map.completed} of ${c.map.steps.length} on your Money Map. Next up: ${c.map.active.short.toLowerCase()}.`,
    action: (d) => ({ label: "See what's next", route: "#/plan", op: "celebrate", step: d.id }), impact: () => 0, why: "Celebrating progress, not just pointing out gaps, keeps people going." },
  { id: "P11-idle-cash", family: "cash-idle", severity: "suggest", cooldown: 14,
    when: (c) => { const bal = E.checking(c.state)?.balance || 0; const extra = bal - c.needsBudget * 1.5; return extra > 300 && c.efSaved < c.ef.full ? { extra: Math.floor(extra / 50) * 50 } : null; },
    title: (d) => `${money(d.extra)} is sitting idle in checking.`,
    body: () => "You have more than a month and a half of essentials there. Moving the extra to savings grows your safety net, and it's still one tap away.",
    action: (d) => ({ label: `Move ${money(d.extra)}`, op: "save", amount: d.extra }), impact: (d) => d.extra * E.ASSUMPTIONS.savingsAPY, why: "Out of sight, out of spend." },

  /* ---------------- SPENDING (12) ---------------- */
  ...Object.keys(E.CATEGORIES).filter((k) => E.CATEGORIES[k].group === "want" || ["groceries", "transport"].includes(k)).flatMap((cat) => [
    { id: `B1-over-${cat}`, family: `cat-${cat}`, severity: "suggest", cooldown: 7,
      when: (c) => { const lim = c.state.budgets[cat], sp = c.spend[cat] || 0; return lim && sp > lim ? { over: sp - lim, lim, sp } : null; },
      title: (d) => `${E.CATEGORIES[cat].label} is ${money(d.over)} over budget.`,
      body: (d, c) => `You've spent ${money(d.sp)} of ${money(d.lim)}. Want to cover it from ${bestDonor(c, cat)} so the rest of the plan stays intact?`,
      action: () => ({ label: "Rebalance", route: "#/budget" }), impact: (d) => d.over * 12, why: "A budget that bends is one you keep. Moving money between categories beats abandoning the plan." },
    { id: `B2-pace-${cat}`, family: `cat-${cat}`, severity: "suggest", cooldown: 7,
      when: (c) => { const lim = c.state.budgets[cat], sp = c.spend[cat] || 0; const proj = sp / Math.max(c.frac, 0.1); return lim && c.dayOfMonth >= 6 && sp <= lim && proj > lim * 1.12 ? { proj, lim, perDay: Math.max(0, (lim - sp) / (c.dim - c.dayOfMonth + 1)) } : null; },
      title: (d) => `${E.CATEGORIES[cat].label} is running hot.`,
      body: (d) => `At this pace you'll spend ${money(d.proj)} of ${money(d.lim)}. Keeping it to about ${money(d.perDay)} a day lands you on budget.`,
      action: () => ({ label: "See category", route: "#/budget" }), impact: (d) => (d.proj - d.lim) * 12, why: "Mid-month course corrections are much easier than end-of-month regret." },
  ]),
  { id: "B3-needs-heavy", family: "split", severity: "learn", cooldown: 60, source: S.WARREN,
    when: (c) => c.needsBudget / c.income > 0.55 ? { p: c.needsBudget / c.income } : null,
    title: (d) => `Essentials take ${pct(d.p)} of your pay.`,
    body: () => "The 50/30/20 guideline puts needs at about half. You're not doing anything wrong. In high-cost areas this is common. The biggest levers are housing and transport.",
    action: () => ({ label: "Read: 50/30/20, adapted", route: "#/learn/split" }), impact: () => 0, why: "Knowing where the pressure comes from points to the fix that actually moves the needle." },
  { id: "B4-wants-heavy", family: "split", severity: "suggest", cooldown: 21,
    when: (c) => { const proj = c.wantsSpent / Math.max(c.frac, 0.2); return c.dayOfMonth >= 10 && proj > c.income * 0.3 ? { proj } : null; },
    title: (d) => "Wants are trending above 30% of pay.",
    body: (d, c) => `On pace for ${money(d.proj)} this month. Trimming 10% would free up ${money(d.proj * 0.1)} for your ${c.map.active.short.toLowerCase()}.`,
    action: () => ({ label: "Review wants", route: "#/budget" }), impact: (d) => d.proj * 0.1 * 12, why: "Enjoying life is part of the plan. The 30% guardrail just keeps it from crowding out savings." },
  { id: "B5-save-rate", family: "rate", severity: "suggest", cooldown: 30,
    when: (c) => c.health.saveRate < 0.1 ? { r: c.health.saveRate } : null,
    title: (d) => `You're saving about ${pct(Math.max(0, d.r))} of your pay.`,
    body: () => "Getting to 10% is a great first target, and 20% is the 50/30/20 goal. Start with +2% and raise it as debts clear.",
    action: () => ({ label: "Adjust plan", route: "#/budget" }), impact: (d, c) => c.income * 0.02 * 12, why: "Savings rate is the number that most predicts long-term progress." },
  { id: "B6-subscriptions", family: "subs", severity: "suggest", cooldown: 45,
    when: (c) => { const subs = c.state.recurring.filter((r) => r.category === "subscriptions"); const total = subs.reduce((s, r) => s + r.amount, 0); return subs.length >= 3 || total > 50 ? { subs, total } : null; },
    title: (d) => `${d.subs.length} subscriptions cost ${money(d.total)} a month.`,
    body: (d) => `That's ${money(d.total * 12)} a year. Which ones did you actually use last week? Cancelling one funds a month of your starter cushion.`,
    action: () => ({ label: "Review subscriptions", route: "#/budget" }), impact: (d) => d.total * 12 * 0.3, why: "Subscriptions are easy to forget because they never ask for a decision." },
  { id: "B7-dining-spike", family: "cat-dining", severity: "learn", cooldown: 21,
    when: (c) => { const avg = c.avgPrev("dining"); const proj = (c.spend.dining || 0) / Math.max(c.frac, 0.2); return avg > 50 && c.dayOfMonth >= 7 && proj > avg * 1.3 ? { proj, avg } : null; },
    title: (d) => "Eating out is up 30%+ versus your usual.",
    body: (d) => `Usually about ${money(d.avg)} a month. This month is pacing ${money(d.proj)}. Busy stretch? Batch-cooking twice a week usually closes the gap.`,
    action: () => ({ label: "See dining", route: "#/budget" }), impact: (d) => (d.proj - d.avg) * 12, why: "Comparing to your own history is more useful than comparing to anyone else." },
  { id: "B8-weekend", family: "pattern", severity: "learn", cooldown: 45,
    when: (c) => { const t = c.last(30).filter((x) => x.amount < 0 && !x.recurringId && x.category !== "savings"); const tot = t.reduce((s, x) => s - x.amount, 0); const wk = t.filter((x) => [0, 5, 6].includes(E.pd(x.date).getDay())).reduce((s, x) => s - x.amount, 0); return tot > 200 && wk / tot > 0.55 ? { share: wk / tot } : null; },
    title: (d) => `${pct(d.share)} of your flexible spending happens Fri–Sun.`,
    body: () => "Totally normal! A weekend fun budget, set aside on Friday morning, keeps it guilt-free and contained.",
    action: () => ({ label: "Set a weekend budget", route: "#/budget" }), impact: () => 0, why: "Spending patterns are easier to manage when you plan around them." },
  { id: "B9-small-leaks", family: "pattern", severity: "learn", cooldown: 45,
    when: (c) => { const small = c.month.filter((x) => x.amount < 0 && -x.amount < 12 && !x.recurringId); return small.length >= 12 ? { n: small.length, total: small.reduce((s, x) => s - x.amount, 0) } : null; },
    title: (d) => `${d.n} small purchases added up to ${money(d.total)} this month.`,
    body: () => "No judgment. Small treats matter. Just know where they add up so you can choose them on purpose.",
    action: () => ({ label: "See them", route: "#/budget" }), impact: (d) => d.total * 0.25 * 12, why: "Awareness, not deprivation, changes small-purchase habits." },
  { id: "B10-under-week", family: "streak", severity: "celebrate", cooldown: 7,
    when: (c) => { const wk = c.last(7).filter((x) => x.amount < 0 && !x.recurringId && x.category !== "savings").reduce((s, x) => s - x.amount, 0); const weeklyWants = E.wantsBudget(c.state) / 4.33 + ((c.state.budgets.groceries || 0) + (c.state.budgets.transport || 0)) / 4.33; return c.dayOfMonth > 7 && wk < weeklyWants * 0.85 ? { wk, under: weeklyWants - wk } : null; },
    title: (d) => `Under budget this week by ${money(d.under)}. Nice.`,
    body: () => "Want to bank the difference? Moving it now locks in the win.",
    action: (d) => ({ label: `Save ${money(Math.floor(d.under / 5) * 5)}`, op: "save", amount: Math.floor(d.under / 5) * 5 }), impact: () => 0, why: "Saving the 'leftover' right away turns good weeks into progress." },
  { id: "B11-unbudgeted", family: "unbudgeted", severity: "suggest", cooldown: 21,
    when: (c) => { const k = Object.keys(c.spend).find((cat) => !c.state.budgets[cat] && c.spend[cat] > 50 && E.CATEGORIES[cat]?.group !== "income"); return k ? { k, v: c.spend[k] } : null; },
    title: (d) => `${E.CATEGORIES[d.k]?.label || d.k} has no budget yet.`,
    body: (d) => `You've spent ${money(d.v)} there this month. Giving it a home makes your safe-to-spend more accurate.`,
    action: () => ({ label: "Add budget", route: "#/budget" }), impact: () => 0, why: "Every dollar with a job = fewer surprises." },
  { id: "B12-big-purchase", family: "big", severity: "learn", cooldown: 14,
    when: (c) => { const b = c.last(3).find((x) => x.amount < 0 && -x.amount > c.income * 0.1 && !x.recurringId); return b ? b : null; },
    title: (d) => `Big purchase logged: ${money(-d.amount)} at ${d.merchant}.`,
    body: () => "We've updated your forecast. Next time, a 24-hour pause before big non-essential buys is a simple way to make sure it's a 'yes'.",
    action: () => ({ label: "View forecast", route: "#/home" }), impact: () => 0, why: "A short cooling-off period reduces regret purchases." },

  /* ---------------- DEBT & CREDIT (6) ---------------- */
  { id: "D1-util-high", family: "util", severity: "suggest", cooldown: 14, source: S.FICO,
    when: (c) => c.util > E.ASSUMPTIONS.utilizationWarn ? { pay: c.cardBal - c.cardLimit * 0.3 } : null,
    title: (d, c) => `Card utilization is ${pct(c.util)}. Under 30% helps your score.`,
    body: (d) => `Paying ${money(d.pay)} toward your cards (or paying before the statement closes) brings you under 30%. Amounts owed make up about 30% of a FICO score.`,
    action: () => ({ label: "Open payoff plan", route: "#/debt" }), impact: () => 0, why: "Lower utilization signals you're not stretched, and it's one of the fastest score levers." },
  { id: "D2-util-mid", family: "util", severity: "learn", cooldown: 60,
    when: (c) => c.util > E.ASSUMPTIONS.utilizationGreat && c.util <= E.ASSUMPTIONS.utilizationWarn ? {} : null,
    title: (d, c) => `Utilization ${pct(c.util)}: good. Under 10% is excellent.`,
    body: () => "People with the highest scores usually keep utilization in single digits. Paying mid-cycle is an easy trick.",
    action: () => ({ label: "Read: credit score basics", route: "#/learn/credit" }), impact: () => 0, why: "Small habit, measurable score impact." },
  { id: "D3-due-soon", family: "due", severity: "urgent", cooldown: 3, source: S.FICO,
    when: (c) => { const u = E.upcoming(c.state, 3).find((e) => e.category === "debt"); return u ? u : null; },
    title: (d) => `${d.name} payment due ${fmtDate(d.date)}.`,
    body: (d) => `Minimum is ${money(d.amount)}. Autopay for at least the minimum means you'll never miss one. Payment history is about 35% of your score.`,
    action: () => ({ label: "Mark as scheduled", op: "dismiss" }), impact: () => 0, why: "One missed payment can stay on a credit report for years." },
  { id: "D4-dti", family: "dti", severity: "learn", cooldown: 60,
    when: (c) => c.health.dti > 0.2 ? { dti: c.health.dti } : null,
    title: (d) => `Debt payments take ${pct(d.dti)} of your income.`,
    body: () => "Lenders like to see total debt payments under about 36% of income. Every debt you clear frees that money for good.",
    action: () => ({ label: "See debt-free date", route: "#/debt" }), impact: () => 0, why: "Lower debt-to-income means more choices, from housing to career moves." },
  { id: "D5-paid-off", family: "milestone", severity: "celebrate", cooldown: 365,
    when: (c) => { const d = c.state.accounts.find((a) => (a.type === "credit" || a.type === "loan") && a.balance <= 0 && a.original && !c.state.settings.celebrated?.["paid-" + a.id]); return d || null; },
    title: (d) => `${d.name} is paid off! 🎉`,
    body: (d) => `That's ${money(d.original)} gone and ${money(d.minPayment)} a month freed up. Roll it into your next debt to keep the snowball going.`,
    action: (d) => ({ label: "Roll it forward", route: "#/debt", op: "celebrate", step: "paid-" + d.id }), impact: (d) => d.minPayment * 12, why: "Rolling freed payments forward is what makes the snowball accelerate." },
  { id: "D6-halfway", family: "debt-progress", severity: "celebrate", cooldown: 120,
    when: (c) => { const d = c.debts.find((x) => x.original && x.balance / x.original <= 0.5); return d ? d : null; },
    title: (d) => `Halfway through ${d.name}!`,
    body: (d) => `${money(d.original - d.balance)} paid down. The second half goes faster, because less interest is piling on.`,
    action: () => ({ label: "View progress", route: "#/debt" }), impact: () => 0, why: "Visible progress keeps repayment going." },

  /* ---------------- GOALS (7) ---------------- */
  { id: "G1-no-goals", family: "goals", severity: "suggest", cooldown: 21,
    when: (c) => !c.state.goals.some((g) => g.kind !== "emergency") && ["fullfund", "retire15", "goals", "middebt", "highdebt"].includes(c.map.active.id) ? {} : null,
    title: () => "What are you saving for?",
    body: () => "Goals with a name and a date are twice as likely to get funded. Even a small one, like a weekend trip, works.",
    action: () => ({ label: "Create a goal", route: "#/goals/new" }), impact: () => 0, why: "Specific goals make saving feel like getting something, not giving something up." },
  { id: "G2-behind", family: "goal-pace", severity: "suggest", cooldown: 14,
    when: (c) => { const g = c.state.goals.find((x) => x.kind !== "emergency" && E.goalPace(x).status === "behind"); return g ? { g, p: E.goalPace(g) } : null; },
    title: (d) => `${d.g.name} is behind pace.`,
    body: (d) => `To hit ${money(d.g.target)} by ${E.pd(d.g.targetDate).toLocaleString("en-US", { month: "short", year: "numeric" })}, you need ${money(d.p.need)}/mo (you're at ${money(d.g.monthly || 0)}). Bump it, or push the date. Either is a fine choice.`,
    action: (d) => ({ label: "Adjust goal", route: `#/goals/${d.g.id}` }), impact: () => 0, why: "A goal you adjust is better than one you abandon." },
  { id: "G3-ahead", family: "goal-pace", severity: "celebrate", cooldown: 30,
    when: (c) => { const g = c.state.goals.find((x) => x.kind !== "emergency" && E.goalPace(x).status === "ahead"); return g ? { g, p: E.goalPace(g) } : null; },
    title: (d) => `${d.g.name} is ahead of schedule.`,
    body: (d) => `At this pace you'll finish in ${E.monthsToText(d.p.eta)}, ${d.p.months - d.p.eta} months early.`,
    action: (d) => ({ label: "View goal", route: `#/goals/${d.g.id}` }), impact: () => 0, why: "Celebrating progress keeps the habit going." },
  { id: "G4-reached", family: "milestone", severity: "celebrate", cooldown: 365,
    when: (c) => { const g = c.state.goals.find((x) => x.saved >= x.target && !c.state.settings.celebrated?.["goal-" + x.id]); return g || null; },
    title: (d) => `You reached ${d.name}! 🎉`,
    body: (d) => `${money(d.target)} saved. Enjoy it, you earned it. Want to point that ${money(d.monthly || 0)}/mo at the next thing?`,
    action: (d) => ({ label: "Celebrate", op: "celebrate", step: "goal-" + d.id, route: `#/goals/${d.id}` }), impact: () => 0, why: "Finishing is the best motivator for the next goal." },
  { id: "G5-unfunded", family: "goal-pace", severity: "suggest", cooldown: 14,
    when: (c) => { const g = c.state.goals.find((x) => x.kind !== "emergency" && !x.monthly && x.saved < x.target); return g || null; },
    title: (d) => `${d.name} doesn't have a monthly amount yet.`,
    body: (d) => `Even ${money(Math.max(10, Math.round((d.target - d.saved) / 24 / 5) * 5))}/mo gets you there in about two years. Automating it is the key.`,
    action: (d) => ({ label: "Set monthly", route: `#/goals/${d.id}` }), impact: () => 0, why: "Goals with automatic contributions get funded. Goals without them usually don't." },
  { id: "G6-windfall", family: "windfall", severity: "suggest", cooldown: 30,
    when: (c) => { const typical = Math.max(...c.state.recurring.filter((r) => r.kind === "income").map((r) => r.amount), 0); const w = c.last(5).find((x) => x.category === "income" && x.amount > typical * 1.4 && !x.recurringId); return w || null; },
    title: (d) => `Extra ${money(d.amount)} came in. Nice!`,
    body: (d, c) => `A popular split: 80% to your plan (${money(d.amount * 0.8)} toward ${c.map.active.short.toLowerCase()}), 20% for something fun, guilt-free.`,
    action: (d) => ({ label: `Save ${money(Math.round(d.amount * 0.8))}`, op: "save", amount: Math.round(d.amount * 0.8) }), impact: (d) => d.amount * 0.8, why: "Deciding the split up front keeps windfalls from disappearing." },
  { id: "G7-roundups", family: "roundups", severity: "learn", cooldown: 60,
    when: (c) => !c.state.settings.roundUps && c.month.filter((x) => x.amount < 0).length > 15 ? { est: c.month.filter((x) => x.amount < 0).length / Math.max(c.frac, 0.2) * 0.5 } : null,
    title: (d) => `Round-ups could add about ${money(d.est)} a month.`,
    body: () => "Each purchase rounds up to the next dollar and the change goes to savings. It's small, automatic, and it adds up.",
    action: () => ({ label: "Turn on round-ups", op: "roundups" }), impact: (d) => d.est * 12, why: "Painless, automatic micro-savings build the habit." },

  /* ---------------- HABITS & MILESTONES (3) ---------------- */
  { id: "H1-first-1000", family: "milestone", severity: "celebrate", cooldown: 365,
    when: (c) => c.efSaved >= 1000 && !c.state.settings.celebrated?.first1000 ? {} : null,
    title: () => "Your first $1,000 saved! 🎉",
    body: () => "That puts you ahead of a lot of people. Most surprise expenses now have a home that isn't a credit card.",
    action: () => ({ label: "Celebrate", op: "celebrate", step: "first1000" }), impact: () => 0, why: "Milestones are worth marking." },
  { id: "H2-fund-months", family: "milestone", severity: "celebrate", cooldown: 90,
    when: (c) => { const m = Math.floor(c.efSaved / Math.max(c.needsBudget, 1)); return m >= 1 && !c.state.settings.celebrated?.["months-" + m] ? { m } : null; },
    title: (d) => `${d.m} month${d.m > 1 ? "s" : ""} of essentials, covered.`,
    body: (d, c) => `Your safety net could carry you ${d.m} month${d.m > 1 ? "s" : ""} with no income. Goal: ${c.ef.months}.`,
    action: (d) => ({ label: "Nice!", op: "celebrate", step: "months-" + d.m }), impact: () => 0, why: "Translating dollars into time makes a safety net feel real." },
  { id: "H3-health-up", family: "health", severity: "celebrate", cooldown: 30,
    when: (c) => { const prev = c.state.settings.lastScore; return prev && c.health.score >= prev + 3 ? { from: prev, to: c.health.score } : null; },
    title: (d) => `Health score up ${d.to - d.from} points.`,
    body: (d) => `From ${d.from} to ${d.to}. The habits are working.`,
    action: () => ({ label: "See breakdown", route: "#/coach" }), impact: () => 0, why: "Progress you can see is progress you keep." },

  /* ---------------- LEARN (stage-matched lesson) ---------------- */
  { id: "L1-lesson", family: "lesson", severity: "learn", cooldown: 14,
    when: (c) => ({ starter: "fund", essentials: "split", match: "match", highdebt: "debt", fullfund: "fund", retire15: "retire", middebt: "debt", goals: "compound" })[c.map.active.id] ? { k: ({ starter: "fund", essentials: "split", match: "match", highdebt: "debt", fullfund: "fund", retire15: "retire", middebt: "debt", goals: "compound" })[c.map.active.id] } : null,
    title: (d) => `3-minute lesson: ${LESSON_TITLES[d.k]}`,
    body: () => "Picked for the step you're on right now.",
    action: (d) => ({ label: "Start lesson", route: `#/learn/${d.k}` }), impact: () => 0, why: "Learning that matches what you're doing right now sticks." },
];

export const LESSON_TITLES = { fund: "Emergency funds 101", split: "50/30/20, adapted to real life", match: "What an employer match is worth", debt: "Avalanche vs. snowball", retire: "The 15% retirement guideline", compound: "How compound growth works", credit: "Credit scores, demystified", hysa: "Picking a high-yield savings account" };

function bestDonor(c, cat) {
  const options = Object.keys(c.state.budgets).filter((k) => k !== cat && E.CATEGORIES[k]?.group === "want" && (c.state.budgets[k] - (c.spend[k] || 0)) > 20);
  options.sort((a, b) => (c.state.budgets[b] - (c.spend[b] || 0)) - (c.state.budgets[a] - (c.spend[a] || 0)));
  return options[0] ? E.CATEGORIES[options[0]].label.toLowerCase() : "your buffer";
}

/* ======================================================================
   GOVERNOR — few, timely, relevant
   ====================================================================== */
export const NUDGE_LEVELS = {
  gentle:    { label: "Gentle",    caps: { urgent: 1, suggest: 1, celebrate: 1, learn: 0 }, desc: "Only what really matters. About one or two cards." },
  balanced:  { label: "Balanced",  caps: { urgent: 2, suggest: 3, celebrate: 1, learn: 1 }, desc: "Timely suggestions plus the occasional lesson." },
  proactive: { label: "Proactive", caps: { urgent: 3, suggest: 6, celebrate: 2, learn: 2 }, desc: "Every opportunity we spot. Good for a fresh start." },
};
const BASE = { urgent: 1000, celebrate: 600, suggest: 300, learn: 100 };

export function evaluate(state, { all = false } = {}) {
  const c = buildContext(state);
  const now = Date.now();
  const st = state.settings;
  const fired = [];
  for (const r of RULES) {
    let d;
    try { d = r.when(c); } catch (e) { console.warn("rule failed", r.id, e); continue; }
    if (!d) continue;
    const dismissedAt = st.dismissed?.[r.id];
    const muted = dismissedAt && now - dismissedAt < r.cooldown * E.DAY;
    const snoozed = st.snoozed?.[r.id] && st.snoozed[r.id] > now;
    const impact = Math.max(0, r.impact ? r.impact(d, c) || 0 : 0);
    fired.push({
      id: r.id, family: r.family, severity: r.severity, muted: muted || snoozed,
      title: r.title(d, c), body: r.body(d, c), action: r.action ? r.action(d, c) : null,
      why: r.why, source: r.source, impact,
      priority: BASE[r.severity] + Math.min(250, Math.log10(1 + impact) * 70) + (r.step?.includes(c.map.active.id) ? (r.step[0] === c.map.active.id ? 200 : 60) : 0),
    });
  }
  fired.sort((a, b) => b.priority - a.priority);
  if (all) return { ctx: c, insights: fired, catalog: RULES.length };
  const caps = { ...NUDGE_LEVELS[st.nudgeLevel || "balanced"].caps };
  const families = new Set();
  const shown = [];
  for (const f of fired) {
    if (f.muted || families.has(f.family) || !caps[f.severity]) continue;
    caps[f.severity]--; families.add(f.family); shown.push(f);
  }
  return { ctx: c, insights: shown, total: fired.filter((f) => !f.muted).length, catalog: RULES.length };
}
