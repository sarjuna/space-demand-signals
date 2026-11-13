# Quantum computing comparison: analysis plan
Written 13 November 2026 (21:58 UK), BEFORE any quantum data were pulled. Exploratory comparison; not externally preregistered.
Purpose: test whether the space-sector pattern (attention tracks salient events and a dominant firm, not build-out) appears in a second emerging technology.

## Scope
United States; monthly Jan 2016 - Oct 2026 (same window as the space dashboard).

## Attention (same construction as the space indices: log(1+x) or log share, z-scored, averaged)
- Field attention: Google Trends US "quantum computing", "quantum computer" (each pulled alone, own 0-100 scale);
  English Wikipedia user pageviews per million total views: Quantum_computing, Quantum_supremacy;
  Hacker News stories whose title matches /quantum comput|qubit/i (de-duplicated by story id).
- Firm attention (listed pure-plays): Google Trends "IonQ", "Rigetti", "D-Wave"; Wikipedia IonQ, Rigetti_Computing, D-Wave_Systems.

## Build-out / commercial activity (quantum has no equivalent of the launch catalogue; qubit counts have no consistent public series)
- B1 Combined quarterly revenue of IonQ, Rigetti, D-Wave and Quantum Computing Inc from SEC XBRL company facts (10-Q/10-K).
- B2 Federal contract obligations (USAspending, award types A-D, same rules as the space panel) to quantum firms:
  IonQ, Rigetti, D-Wave, Quantum Computing Inc, Quantinuum, PsiQuantum, Atom Computing, Infleqtion (ColdQuanta), QuEra.
- B3 SEC EDGAR full-text hits: "quantum computing" in 10-K filings (operational language) and in all forms (financing/hype language).

## Prices
- Basket: equal-weight daily log returns of IONQ (de-SPAC 2021-10-01), RGTI (2022-03-02), QBTS (2022-08-08), each entering the day after
  its first Yahoo trading day as a listed operating company. QUBT excluded from the main basket (OTC-to-Nasdaq history, photonics business);
  sensitivity including it from 2022-01-01. Broad ETF: QTUM (Defiance Quantum ETF). Benchmark: S&P 500.

## Events (chosen now, before looking at returns or attention)
- Sycamore "quantum supremacy" paper, Nature, 23 Oct 2019 (attention only; no basket then).
- Google Willow announcement, Mon 9 Dec 2024, ~11:00 ET (market open): day 0 = 9 Dec 2024.
- Nvidia CEO "15 to 30 years" remark, analyst Q&A Tue 7 Jan 2025; stocks fell Wed 8 Jan: day 0 = 8 Jan 2025 (alt 7 Jan).
- Microsoft Majorana 1, Wed 19 Feb 2025 (time not verified): day 0 = 19 Feb 2025 (alt 20 Feb).
Event months for attention tests: 2019-10, 2024-12, 2025-01, 2025-02.

## Tests (mirroring the space analysis)
- Q1 Event salience: OLS of monthly field attention on event-month dummies and a linear trend (HAC SEs).
- Q2 Attention vs build-out: quarterly field attention vs B1 revenue (Spearman on levels and on quarter-on-quarter changes);
  annual attention vs B2 obligations (fiscal-year alignment noted).
- Q3 Concentration: largest firm's share of B1 revenue, B2 obligations, and firm attention; whether field-attention spikes
  coincide with big-tech announcements (Google, Microsoft, Nvidia) rather than pure-play activity.
- Q4 Prices and attention: Granger tests at lags 1, 3, 6 between monthly basket excess return and field attention, both directions,
  from Nov 2021. Predictive precedence only.
- Q5 Event studies: market model estimated on [-120,-11]; CARs [0,+1] and [0,+5]; t = CAR/(sigma*sqrt(L)); Benjamini-Hochberg across
  the three [0,+1] basket tests; alternative day 0 reported.
## Rules
No causal language from Granger tests or event windows; p > 0.05 is not evidence of no effect; all choices above fixed before data.
