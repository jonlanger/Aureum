# Aureum: financial rules, research and recommendation

*How the coach decides what to tell someone who is just starting to save. Last updated October 2026.*

## Recommendation: about 8 engines and 60 rules, not 300

**Don't target 300 rules.** Rule count is the wrong measure of "real functionality." What makes guidance useful is (a) correct math underneath, (b) the right *order* of priorities, and (c) showing only the few things that matter today. Past roughly 50–60 well-built rules you mostly get:

- **Overlap and contradiction.** "Pay down the card" and "build savings" fire together with no tiebreaker.
- **Noise.** Research on savings nudges shows personalized, goal-specific reminders work, roughly twice as well as generic ones. Generic volume doesn't, and effects fade once messaging stops. Our own persona research said the same thing: nudges should "assist without overwhelming."
- **Maintenance and review cost.** Every rule needs copy, thresholds, tests, a source and, eventually, compliance review.
- **Dead weight.** A typical user triggers 10–15 rules. The rest exist for edge cases.

**What we built instead: three layers.**

| Layer | Count | What it is |
|---|---|---|
| **Engines** (`app/js/engine.js`) | 9 | Pure math: budget allocator, emergency-fund ladder, employer match, **Money Map** (priority waterfall), monthly allocation, goal math, debt simulator, cash-flow forecast + safe-to-spend, health score |
| **Rules** (`app/js/rules.js`) | 61 (45 hand-written + 16 generated per-category) | Each reads engine output and decides *if* something is worth saying: trigger, copy, one action, dollar impact, "why", and a source |
| **Governor** | 1 | Ranks by severity, dollar impact and relevance to your current Money Map step. Shows one card per topic. Caps by nudge level (Gentle / Balanced / Proactive). Respects dismiss cooldowns and snoozes. |

Parameterized rules multiply naturally. 61 rules across 8 categories and varying amounts already produce hundreds of distinct, specific messages. If we ever want "300," the honest path is more *parameterization* (per-category, per-debt, per-goal variants), not 300 hand-written rules.

**Suggested growth path:** v1 at about 60 rules → instrument which ones fire, get acted on, or get dismissed → retire the bottom 20% each quarter and add rules only for real gaps (e.g., irregular-income smoothing, tax-refund timing, annual bill sinking funds).

---

## The research behind the defaults

Every threshold lives in `ASSUMPTIONS` (top of `engine.js`) so it can be tuned in one place.

| Guideline | Default in Aureum | Basis |
|---|---|---|
| Start an emergency fund small and automate it | Starter milestone **$1,000** (floor $500, or one month of essentials if lower). Rule S4 suggests **$10/week**. | CFPB recommends starting with small automatic transfers ($5–$10/week) and a first goal of around $500. The $1,000 starter is the common "order of operations" milestone. |
| Why it matters | Shown as copy on the starter step | Federal Reserve SHED 2025 (released May 2026): **63%** of adults could cover a $400 emergency with cash or equivalent, so **37% couldn't**. **55%** had 3 months of savings. |
| Full emergency fund | **3 months** of essentials, **6** if income varies or one earner has dependents | Standard 3–6 month guidance. Aureum measures the fund in *months covered*. |
| Order of operations | Essentials → starter fund → employer match → high-interest debt → 3–6 mo fund → 15% retirement → moderate debt → goals | Mirrors the widely used r/personalfinance "Prime Directive" flowchart and mainstream planner guidance |
| Employer match | Always prioritized right after the starter cushion | Instant 50–100% return. Nothing else reliably beats it. |
| High-interest threshold | **≥ 8% APR** = pay before investing. 4–8% = gray zone. | Card APR on accounts assessed interest averaged **~22%** in Q2 2026 (Federal Reserve G.19) |
| Retirement savings | **15% of gross**, match included | Fidelity: save ~15% from age 25 toward ~10× salary by 67 (1× by 30, 3× by 40, 6× by 50…) |
| 2026 contribution limits (reference) | Not enforced yet | IRS: 401(k) **$24,500**, IRA **$7,500**, 50+ catch-up $8,000 / $1,100 |
| Budget split | **50 / 30 / 20**, adapted: real essentials first, protect a savings slice, wants absorb the rest | Warren & Tyagi, *All Your Worth* (2005) |
| Debt method | Show both. Recommend **snowball** when it costs < $150 more, **avalanche** otherwise. | Avalanche minimizes interest. Kellogg (Gal & McShane, 2012; ~6,000 borrowers) found small-balance-first payers were more likely to eliminate debt. |
| Raising savings over time | +1% per year / per raise | Thaler & Benartzi, *Save More Tomorrow*: savings went from 3.5% to 13.6% over ~4 years |
| Credit utilization | Warn > **30%**, praise < **10%** | FICO: payment history ≈ 35%, amounts owed ≈ 30%. Top scorers typically stay in single digits. |
| Health score | 4 pillars, 25% each | Modeled on the CFPB Financial Well-Being elements: control, shock capacity, on track, freedom of choice. *Not* the official CFPB scale. |
| Savings APY | 3.5% editable default | Assumption for projections. Real rates vary. |
| Checking cushion | $200 | Product assumption. Protects against overdraft timing. |

### Guardrails

- **Coach, not advisor.** Guidance is general and educational. No specific securities, funds or products are recommended. Disclaimers appear on every screen.
- **Every insight has a "Why?"** with a plain-language rationale and its source. That's for trust, and so it reads as supportive rather than prescriptive.
- **Celebrate progress.** Milestones (first $1,000, step complete, debt paid, goal reached) are their own severity, with their own slot in the governor.

## Rule catalog (61)

| Group | Rules |
|---|---|
| **Safety (7)** | Overdraft forecast · below cushion · bills before payday exceed balance · no emergency fund yet · on pace to overspend income · essentials exceed income · payday "pay yourself first" |
| **Money Map (11)** | Missing employer match · starter fund almost there · high-APR debt cost · $50 extra-payment savings · snowball vs avalanche · auto-escalate +1% · 15% retirement lesson · automate savings · low-yield savings account · step completed 🎉 · idle cash in checking |
| **Spending (12 + 16 generated)** | Category over budget ×8 · category pacing hot ×8 · needs > 55% · wants > 30% · savings rate < 10% · subscriptions review · dining spike vs your average · weekend pattern · small-purchase leaks · under budget this week 🎉 · unbudgeted category · big purchase logged |
| **Debt & credit (6)** | Utilization > 30% · utilization 10–30% · payment due in 3 days · debt-to-income > 20% · debt paid off 🎉 · halfway through a debt 🎉 |
| **Goals (7)** | No goals yet · goal behind pace · goal ahead 🎉 · goal reached 🎉 · goal has no monthly amount · windfall split 80/20 · round-ups |
| **Milestones (3)** | First $1,000 🎉 · N months of essentials covered 🎉 · health score up 🎉 |
| **Learn (1)** | Lesson matched to your current step (8 lessons) |

## Sources

- [CFPB: building an emergency fund (via First Community Bank)](https://www.firstcbt.bank/blog/post/fcbt-and-cfpb-present-an-essential-guide-to-building-an-emergency-fund) · [HousingWire on CFPB "start small"](https://www.housingwire.com/articles/cfpb-prompts-americans-to-start-small-save-up/)
- [Federal Reserve, Survey of Household Economics and Decisionmaking](https://www.federalreserve.gov/consumerscommunities/shed.htm) · [SHED 2025 $400 summary](https://myfinancetools.io/insights/united-states/income/emergency-cushion/)
- [r/personalfinance flowchart overview](https://joingerald.com/learn/money-basics/r-personalfinance-guide) · [My Money Blog: flowchart version](https://mymoneyblog.com/standardized-personal-finance-advice-reddit-flowchart-version.html)
- [Fidelity 15% / 10× guideline (Motley Fool summary)](https://www.fool.com/retirement/2025/10/31/how-much-should-retirees-have-invested-by-age-67) · [CNBC: savings by age](https://www.cnbc.com/select/savings-by-age/)
- [IRS 2026 limits (401k Specialist)](https://401kspecialistmag.com/irs-announces-2026-401k-contribution-limit-increases-to-24500-ira-limit-up-to-7500/) · [PSCA](https://www.psca.org/news/psca-news/2025/11/irs-announces-2026-401k-contribution-limits/)
- [Debt snowball and the Kellogg study](https://en.wikipedia.org/wiki/Debt_snowball_method)
- [50/30/20 origin (Acorns)](https://www.acorns.com/learn/saving/50-30-20-budget-rule/)
- [Save More Tomorrow results (Allianz)](https://www.allianz.com/en/press/news/business/asset_management/news-2012-04-03.html)
- [FICO factors: payment history & utilization (Bankrate)](https://www.bankrate.com/finance/credit-cards/payment-history-credit-score) · [TD: credit utilization](https://www.td.com/us/en/personal-banking/learning/what-is-credit-utilization)
- [CFPB Financial Well-Being Scale guide (PDF)](https://files.consumerfinance.gov/f/201512_cfpb_financial-well-being-user-guide-scale.pdf)
- [Card APRs 2026, Fed G.19 (Motley Fool)](https://www.fool.com/money/research/average-credit-card-interest-rate/)
- [Tailored savings messages (The Decision Lab)](https://thedecisionlab.com/intervention/tailored-messages-and-savings) · [Social-norm savings nudge field experiment](https://behavioraleconomics.com/my-savings-buffer-is-more-than-yours)
