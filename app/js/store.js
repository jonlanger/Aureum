/* ==========================================================================
   Aureum store — app state, persistence, demo seed, and actions.
   State lives in localStorage on this device (a prototype stand-in for a
   backend + account aggregation). Every read/write is wrapped in try/catch.
   ========================================================================== */
import { DAY, today, ymd, suggestSplit } from "./engine.js";

const KEY = "aureum-app-v1";
const listeners = new Set();
let state = null;

export const getState = () => state;
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
function emit() { save(); listeners.forEach((fn) => fn(state)); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
export function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw); } catch (e) { state = null; }
  return state;
}
export function reset() { try { localStorage.removeItem(KEY); } catch (e) {} state = null; }
const uid = () => Math.random().toString(36).slice(2, 9);

const baseSettings = () => ({ nudgeLevel: "balanced", dismissed: {}, snoozed: {}, celebrated: {}, roundUps: false, theme: null });

/* ---------------- demo: David Lee, high school teacher (from the research personas) ---------------- */
export function seedDemo() {
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const t = today();
  const recurring = [
    { id: "pay", name: "Paycheck · Lincoln High", amount: 2050, every: "semimonthly", day: 1, kind: "income", category: "income" },
    { id: "rent", name: "Rent", amount: 1350, every: "monthly", day: 1, kind: "bill", category: "housing" },
    { id: "util", name: "Electric & internet", amount: 140, every: "monthly", day: 12, kind: "bill", category: "utilities" },
    { id: "phone", name: "Phone", amount: 65, every: "monthly", day: 18, kind: "bill", category: "utilities" },
    { id: "ins", name: "Car insurance", amount: 118, every: "monthly", day: 20, kind: "bill", category: "insurance" },
    { id: "loan", name: "Student loan", amount: 210, every: "monthly", day: 22, kind: "bill", category: "debt", accountId: "loan" },
    { id: "cardmin", name: "Visa minimum", amount: 95, every: "monthly", day: 25, kind: "bill", category: "debt", accountId: "visa" },
    { id: "stream1", name: "StreamFlix", amount: 16, every: "monthly", day: 8, kind: "bill", category: "subscriptions" },
    { id: "stream2", name: "TuneBox", amount: 11, every: "monthly", day: 14, kind: "bill", category: "subscriptions" },
    { id: "gym", name: "Gym membership", amount: 35, every: "monthly", day: 3, kind: "bill", category: "subscriptions" },
  ];
  const tx = [];
  const merchants = {
    groceries: [["Trader Joe's", 55, 95], ["Kroger", 40, 120], ["Aldi", 30, 70]],
    dining: [["Chipotle", 11, 16], ["Corner Café", 4, 8], ["Thai Basil", 22, 48], ["Pizza Place", 18, 34], ["Coffee Co.", 4, 7]],
    transport: [["Shell", 32, 52], ["Metro card", 20, 20]],
    shopping: [["Target", 18, 70], ["Amazon", 12, 60]],
    entertainment: [["Cinema 8", 14, 28], ["Bowling Alley", 25, 40]],
    personal: [["Barber", 25, 30], ["Pharmacy", 8, 25]],
    health: [["Copay", 25, 40]],
  };
  const freq = { groceries: 0.32, dining: 0.62, transport: 0.18, shopping: 0.12, entertainment: 0.06, personal: 0.05, health: 0.02 };
  for (let back = 95; back >= 0; back--) {
    const d = new Date(t.getTime() - back * DAY);
    const weekend = [0, 5, 6].includes(d.getDay());
    for (const [cat, p] of Object.entries(freq)) {
      const boost = cat === "dining" && back < 12 ? 1.35 : 1; // dining running hot this month → triggers coach
      if (rnd() < p * (weekend ? 1.5 : 0.85) * boost) {
        const list = merchants[cat]; const [m, lo, hi] = list[Math.floor(rnd() * list.length)];
        tx.push({ id: uid(), date: ymd(d), merchant: m, category: cat, amount: -Math.round((lo + rnd() * (hi - lo)) * 100) / 100 });
      }
    }
    recurring.forEach((r) => {
      const days = r.every === "semimonthly" ? [r.day, r.day + 14] : [r.day];
      if (days.includes(d.getDate())) tx.push({ id: uid(), date: ymd(d), merchant: r.name, category: r.category, amount: r.kind === "income" ? r.amount : -r.amount, recurringId: r.id });
    });
  }
  state = {
    version: 1, demo: true, onboarded: true, createdAt: Date.now(),
    profile: { name: "David", ageBand: "25-34", incomeStability: "stable", dependents: 0, earners: 1, grossAnnual: 62000, hasMatch: true, matchUpTo: 0.04, matchRate: 1, retirementPct: 0.02, stage: "starting" },
    accounts: [
      { id: "chk", name: "Everyday checking", type: "checking", balance: 1240, institution: "Community CU" },
      { id: "sav", name: "Emergency savings", type: "savings", balance: 650, apy: 0.0001, emergency: true, institution: "Community CU" },
      { id: "visa", name: "Visa card", type: "credit", balance: 3400, original: 4800, limit: 6000, apr: 24.9, minPayment: 95 },
      { id: "loan", name: "Student loan", type: "loan", balance: 18600, original: 26000, apr: 5.5, minPayment: 210 },
      { id: "ret", name: "403(b)", type: "retirement", balance: 6200 },
    ],
    recurring,
    transactions: tx.sort((a, b) => b.date.localeCompare(a.date)),
    budgets: { housing: 1350, utilities: 205, groceries: 420, transport: 170, insurance: 118, health: 40, dining: 180, shopping: 120, entertainment: 60, subscriptions: 62, personal: 50 },
    goals: [
      { id: "ef", name: "Emergency fund", kind: "emergency", target: 1000, saved: 650, monthly: 150, icon: "shield", linked: "sav" },
      { id: "trip", name: "Visit family in June", kind: "custom", target: 1200, saved: 180, monthly: 0, targetDate: ymd(new Date(t.getFullYear() + 1, 5, 15)), icon: "plane" },
    ],
    settings: baseSettings(),
  };
  emit();
  return state;
}

/* ---------------- onboarding → a fresh, real plan ---------------- */
export function createFromOnboarding(a) {
  const net = +a.netMonthly || 0;
  const every = a.payFrequency || "semimonthly";
  const perPay = { weekly: net * 12 / 52, biweekly: net * 12 / 26, semimonthly: net / 2, monthly: net }[every];
  const essentials = (+a.rent || 0) + (+a.bills || 0) + (+a.groceries || 0) + (+a.transport || 0);
  const debts = (a.debts || []).filter((d) => +d.balance > 0);
  const mins = debts.reduce((s, d) => s + (+d.minPayment || 0), 0);
  const split = suggestSplit(net, essentials + mins);
  const want = split.want;
  state = {
    version: 1, demo: false, onboarded: true, createdAt: Date.now(),
    profile: { name: a.name || "there", ageBand: a.ageBand, incomeStability: a.incomeStability || "stable", dependents: +a.dependents || 0, earners: 1, grossAnnual: a.grossAnnual ? +a.grossAnnual : Math.round(net * 12 / 0.78), hasMatch: a.hasMatch === "yes", matchUpTo: (+a.matchUpTo || 0) / 100, matchRate: 1, retirementPct: (+a.retirementPct || 0) / 100, stage: "starting" },
    accounts: [
      { id: "chk", name: "Checking", type: "checking", balance: +a.checking || 0 },
      { id: "sav", name: "Emergency savings", type: "savings", balance: +a.savings || 0, apy: 0, emergency: true },
      ...debts.map((d, i) => ({ id: "debt" + i, name: d.name || (d.type === "credit" ? "Credit card" : "Loan"), type: d.type || "credit", balance: +d.balance, original: +d.balance, apr: +d.apr || 0, minPayment: +d.minPayment || Math.max(25, Math.round(d.balance * 0.02)), limit: d.type === "credit" ? +d.limit || Math.round(+d.balance * 1.6) : undefined })),
    ],
    recurring: [
      { id: "pay", name: "Paycheck", amount: Math.round(perPay), every, day: 1, kind: "income", category: "income", anchor: ymd(today()) },
      a.rent ? { id: "rent", name: "Rent / housing", amount: +a.rent, every: "monthly", day: 1, kind: "bill", category: "housing" } : null,
      a.bills ? { id: "bills", name: "Bills & utilities", amount: +a.bills, every: "monthly", day: 15, kind: "bill", category: "utilities" } : null,
      ...debts.map((d, i) => ({ id: "min" + i, name: (d.name || "Debt") + " minimum", amount: +d.minPayment || Math.max(25, Math.round(d.balance * 0.02)), every: "monthly", day: 20, kind: "bill", category: "debt", accountId: "debt" + i })),
    ].filter(Boolean),
    transactions: [],
    budgets: {
      housing: +a.rent || 0, utilities: +a.bills || 0, groceries: +a.groceries || 0, transport: +a.transport || 0,
      dining: Math.round(want * 0.35), shopping: Math.round(want * 0.25), entertainment: Math.round(want * 0.2), personal: Math.round(want * 0.2),
    },
    goals: [{ id: "ef", name: "Emergency fund", kind: "emergency", target: 1000, saved: +a.savings || 0, monthly: Math.round(split.save * 0.5), icon: "shield", linked: "sav" }],
    settings: { ...baseSettings(), nudgeLevel: a.nudgeLevel || "balanced" },
  };
  if (a.goal && a.goal !== "none") {
    const presets = { trip: ["A trip", 1500, "plane"], home: ["Home down payment", 20000, "home"], car: ["Car fund", 5000, "car"], school: ["Education", 4000, "grad"] };
    const [name, target, icon] = presets[a.goal] || ["My goal", 1000, "target"];
    state.goals.push({ id: uid(), name, kind: "custom", target, saved: 0, monthly: 0, icon, targetDate: ymd(new Date(today().getFullYear() + 1, today().getMonth(), 1)) });
  }
  emit();
  return state;
}

/* ---------------- actions ---------------- */
const acct = (id) => state.accounts.find((a) => a.id === id);
function syncEmergencyGoal() {
  const g = state.goals.find((x) => x.kind === "emergency"); const a = state.accounts.find((x) => x.emergency);
  if (g && a) g.saved = a.balance;
}
export function addTransaction({ amount, category, merchant, date }) {
  const signed = category === "income" ? Math.abs(+amount) : -Math.abs(+amount);
  state.transactions.unshift({ id: uid(), date: date || ymd(today()), merchant: merchant || "Manual entry", category, amount: signed, manual: true });
  const chk = state.accounts.find((a) => a.type === "checking"); if (chk) chk.balance = Math.round((chk.balance + signed) * 100) / 100;
  emit();
}
export function deleteTransaction(id) {
  const t = state.transactions.find((x) => x.id === id); if (!t) return;
  const chk = state.accounts.find((a) => a.type === "checking"); if (chk && t.manual) chk.balance -= t.amount;
  state.transactions = state.transactions.filter((x) => x.id !== id); emit();
}
/** Move money checking → emergency savings (or the reverse with negative amount). */
export function moveToSavings(amount, goalId) {
  const chk = state.accounts.find((a) => a.type === "checking");
  const amt = Math.round(+amount);
  if (goalId && goalId !== "ef") {
    const g = state.goals.find((x) => x.id === goalId); g.saved += amt;
  } else {
    const sav = state.accounts.find((a) => a.emergency); sav.balance += amt;
  }
  chk.balance -= amt;
  state.transactions.unshift({ id: uid(), date: ymd(today()), merchant: amt > 0 ? "Transfer to savings" : "Transfer from savings", category: "savings", amount: -amt, internal: true });
  syncEmergencyGoal(); emit();
}
export function payDebt(accountId, amount) {
  const d = acct(accountId), chk = state.accounts.find((a) => a.type === "checking");
  const amt = Math.min(+amount, d.balance);
  d.balance = Math.round((d.balance - amt) * 100) / 100; chk.balance -= amt;
  state.transactions.unshift({ id: uid(), date: ymd(today()), merchant: `Extra payment · ${d.name}`, category: "debt", amount: -amt, internal: true });
  emit();
}
export function setBudget(cat, value) { if (+value > 0) state.budgets[cat] = Math.round(+value); else delete state.budgets[cat]; emit(); }
export function upsertGoal(g) {
  if (g.id) Object.assign(state.goals.find((x) => x.id === g.id), g);
  else state.goals.push({ ...g, id: uid(), saved: +g.saved || 0, kind: "custom" });
  emit();
}
export function deleteGoal(id) { state.goals = state.goals.filter((g) => g.id !== id); emit(); }
export function automate(amount) {
  state.recurring = state.recurring.filter((r) => r.id !== "autosave");
  const pay = state.recurring.find((r) => r.kind === "income");
  state.recurring.push({ id: "autosave", name: "Auto-save to emergency fund", amount: +amount, every: pay?.every || "monthly", day: (pay?.day || 1) + 1, kind: "transfer", category: "savings" });
  emit();
}
export function setRetirementPct(p) { state.profile.retirementPct = p; emit(); }
export function updateProfile(patch) { Object.assign(state.profile, patch); emit(); }
export function updateSettings(patch) { Object.assign(state.settings, patch); emit(); }
export function dismiss(ruleId) { state.settings.dismissed[ruleId] = Date.now(); emit(); }
export function snooze(ruleId, days = 3) { state.settings.snoozed[ruleId] = Date.now() + days * DAY; emit(); }
export function celebrate(key) { state.settings.celebrated[key] = Date.now(); emit(); }
export function recordScore(score) { if (state.settings.lastScoreAt && Date.now() - state.settings.lastScoreAt < 7 * DAY) return; state.settings.lastScore = score; state.settings.lastScoreAt = Date.now(); save(); }
export function updateAccount(id, patch) { Object.assign(acct(id), patch); syncEmergencyGoal(); emit(); }

/* Prototype session: signing out keeps data on this device but locks the app behind a welcome-back screen. */
export function signOut() { if (state) { state.settings.signedOut = true; save(); } }
export function signIn() { if (state) { state.settings.signedOut = false; emit(); } }
