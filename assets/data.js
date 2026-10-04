/* Aureum demo data — illustrative, deterministic (seeded), shared by every page.
   Story: Emily Johnson, marketing specialist, saving for a home down payment. */
(function () {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

  // Net worth / total balance, 12 months
  const netWorth = [131200, 133900, 132400, 136800, 140100, 143600, 142900, 148300, 152700, 157400, 162100, 168508];
  const savings = [9800, 10400, 10900, 11600, 12200, 12900, 13400, 14300, 15200, 16200, 17300, 18374];
  const investments = [112400, 114600, 112300, 116100, 118700, 121300, 119800, 124400, 127600, 131000, 134300, 150134];

  // Cashflow
  const income = [6420, 7980, 6420, 6420, 6610, 6420, 6420, 6900, 6420, 6420, 6650, 6420];
  const spend = [5180, 7420, 4710, 4890, 5320, 5060, 6930, 5240, 4980, 5110, 4870, 5020];

  // This month by category (≤6 for donut, rest in Other)
  const categories = [
    { label: "Housing", value: 1950, icon: "home" },
    { label: "Groceries", value: 640, icon: "cart" },
    { label: "Dining out", value: 450, icon: "food" },
    { label: "Transport", value: 380, icon: "car" },
    { label: "Utilities", value: 260, icon: "bolt" },
    { label: "Other", value: 1340, icon: "wallet" },
  ];

  const budgets = [
    { label: "Groceries", icon: "cart", spent: 512, limit: 650 },
    { label: "Dining out", icon: "food", spent: 450, limit: 300 },
    { label: "Transport", icon: "car", spent: 318, limit: 360 },
    { label: "Entertainment", icon: "film", spent: 96, limit: 150 },
    { label: "Utilities", icon: "bolt", spent: 248, limit: 280 },
  ];

  // 18 weeks of daily spending, with weekend & payday rhythm
  const daily = Array.from({ length: 18 * 7 }, (_, i) => {
    const dow = i % 7; // 0 = Mon
    const weekend = dow >= 4 ? 1.8 : 1;
    const spike = rnd() > 0.93 ? 3.2 : 1;
    const zero = rnd() > 0.86;
    return zero ? 0 : Math.round((14 + rnd() * 48) * weekend * spike);
  });

  // Down-payment goal projection: actual (0–9) then forecast (9–23) with a widening band
  const goalLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan ’27", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec ’27"];
  const goalActual = [21000, 22400, 23300, 24900, 25600, 27500, 28900, 30800, 32300, 34100];
  const goalPlan = goalActual.concat(Array.from({ length: 14 }, (_, k) => Math.round(34100 + (k + 1) * 1850)));
  const goalLo = goalPlan.map((v, i) => (i < 9 ? v : Math.round(v - (i - 9) * 520)));
  const goalHi = goalPlan.map((v, i) => (i < 9 ? v : Math.round(v + (i - 9) * 430)));

  // "What's about to go wrong": 30-day projected checking balance with a dip
  const days = Array.from({ length: 31 }, (_, i) => `Oct ${i + 1}`);
  const checking = [4120, 3980, 3910, 3720, 3650, 3580, 3400, 3290, 3220, 3110, 2960, 2840, 2790, 2650, 1180, 980, 820, 740, 610, 480, 3880, 3760, 3640, 3510, 3420, 3300, 3190, 3060, 2980, 2890, 2810];

  const personas = [
    { name: "Emily Johnson", role: "Marketing specialist", goal: "Home down payment", saved: 34100, target: 60000, color: "var(--viz-1)", illo: "target", initials: "EJ" },
    { name: "Michael Chen", role: "Software engineer", goal: "Investing autopilot", saved: 150134, target: 200000, color: "var(--viz-2)", illo: "growth", initials: "MC" },
    { name: "Sarah Martinez", role: "Small business owner", goal: "6-month cash runway", saved: 21600, target: 36000, color: "var(--viz-3)", illo: "insight", initials: "SM" },
    { name: "David Lee", role: "High school teacher", goal: "Student loans paid off", saved: 18400, target: 27000, color: "var(--viz-4)", illo: "payoff", initials: "DL" },
    { name: "Lisa Robinson", role: "Retired nurse", goal: "Healthcare reserve", saved: 11200, target: 15000, color: "var(--viz-6)", illo: "shield", initials: "LR" },
  ];

  window.AureumData = { months, netWorth, savings, investments, income, spend, categories, budgets, daily, goalLabels, goalActual, goalPlan, goalLo, goalHi, days, checking, personas };
})();
