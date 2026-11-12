# Space Demand Signals: CSV exports

Analysis-ready tables behind the India and US dashboards. They are generated from the raw files in `data/raw/` by `code/site/export_csv.py`, which re-runs both analyses. US tables are in `us/`, India tables in `india/`, and tables covering both in `shared/`. Data pulled 5 Nov 2026 (India) and 6 Nov 2026 (US).

Conventions:
- `month` is `YYYY-MM`, and monthly panels run from 2016-01 to 2026-10 (130 rows).
- An empty cell means the value is missing, not zero.
- Returns are **log returns**. A monthly return is the sum of daily log returns within the calendar month.

## Notes for time-series work (VAR, Granger, impulse responses)

- **Stationarity.** The attention indices (`PAI`, `NAI`, `CAI`) and the raw search and Wikipedia series trend. The dashboards difference attention (ΔNAI) and use excess returns, which pass ADF tests.
  - Excess returns are `basket_excess_logret` = basket minus benchmark.
  - Launch counts are close to stationary month to month, but trend upward in the US.
- **Index construction.**
  - Each component is computed as log(1 + x) and then z-scored over its own full 2016–2026 history.
  - The index is the mean of the z-scored components available that month.
  - Because the z-scores use the full sample, they contain look-ahead. For out-of-sample forecasting, rebuild them from the raw `gt_*` and `wiki_*` columns with expanding-window standardisation.
  - Component z-scores are in `*_index_components_z.csv`.
- **Google Trends.** Each `gt_*` series is on its own 0–100 scale (100 = that term's peak month in the US or India). Values are not comparable across terms. They are sampled, so a fresh pull will differ slightly.
- **Wikipedia.** `wiki_*_per_m` columns are monthly user views per million English-Wikipedia user views. Views are counted for the current article title only.
  - Months before an article first reached 1,000 views are blank. These are redirect placeholders or stubs.
  - `wiki_enwiki_total_views` is the normaliser.
- **Market samples.**
  - The US basket starts 2019-10 with one member, reaches six members in 2021-09 and ten in 2025-08. The dashboard's lead–lag tests use 2021-09 onward.
  - `basket_members` gives the count each month. SpaceX (`spcx_logret`) is excluded from the basket and starts 2026-06 (partial month).
  - The India basket is seven listed aerospace and defence suppliers, five of them with ISRO business. It is benchmarked against the Nifty 50.
- **Event dummies** (`d_*`) are the months used in the dashboard regressions:
  - US flagship: 2020-05, 2020-06, 2022-11, 2026-04.
  - US Starship flights: 14 months.
  - US SpaceX IPO: 2026-06.
  - India flagship: 2019-07 to 2019-09 (Chandrayaan-2) and 2023-07 to 2023-10 (Chandrayaan-3, Aditya-L1).
- **Survivorship.** Delisted US firms (Astra, Virgin Orbit, Terran Orbital, Maxar) are not in the US basket.

## Files

Every value in every raw file in `data/raw/` appears in these tables. `code/site/audit_csv.py` checks this value by value (16,049 values) and `run_all.sh` runs it.

### United States (`us/`)
| File | Rows | What it holds |
|---|---|---|
| `us_monthly.csv` | 130 | Main monthly panel. Launches (total, failures, SpaceX, other commercial, government, Rocket Lab NZ); US-owned satellites by owner; 11 Google Trends terms; 11 Wikipedia articles per million plus the total; Hacker News story counts, mean VADER score and negative/positive shares; `PAI` and `NAI`; basket, S&P 500, UFO and SPCX log returns and excess returns; event dummies |
| `us_index_components_z.csv` | 130 | z-scored components of PAI and NAI |
| `us_launches_monthly.csv` | 142 | Launches by provider type, full GCAT range from 2015-01 |
| `us_satellites_monthly.csv` | 142 | US-owned satellites by owner, full range from 2015-01 (catalogue complete only to 2026-07) |
| `us_launch_failures.csv` | 18 | Each failed US orbital launch, with GCAT launch code |
| `us_wikipedia_views.csv` | 130 | Raw monthly user views for the 11 articles and total English Wikipedia |
| `us_markets_monthly_2019_2026.csv` | 85 | Market series from 2019-10 |
| `us_events.csv` | 14 | Event study: t0, members, CAR [0,+1] and [0,+5] in %, t-statistics, for the basket and UFO |
| `us_event_windows_daily.csv` | 63 | Daily basket abnormal returns, days −10 to +10, for the IFT-5, SpaceX IPO and Artemis II windows |
| `us_congress_space_bills.csv` | 415 | Every space-indexed bill or resolution, 113th–119th Congress, with title and topic code |
| `us_congress_totals.csv` | 7 | All bills vs space bills per Congress |
| `us_federal_register_annual.csv` | 13 | Space-related Federal Register documents per year, by type and agency |
| `us_federal_register_selected.csv` | 99 | Rules, proposed rules and presidential documents with dates and titles |
| `us_faa_licensed_operations.csv` | 10 | FAA licensed launches and re-entries, FY2015–FY2024 |
| `us_annual.csv` | 11 | Annual launches, satellites, mean indices, FAA licensed operations (fiscal year) and SEC full-text hits, 2016–2026 |

### India (`india/`)
| File | Rows | What it holds |
|---|---|---|
| `india_monthly.csv` | 130 | Main monthly panel. Orbital launches and failures; commercial satellites; 10 Google Trends terms; 14 Wikipedia series per million plus the total; Hacker News count and sentiment; `PAI` and `CAI` (NewSpace index, from 2020-09); basket and Nifty log returns and excess; flagship dummy |
| `india_index_components_z.csv` | 130 | z-scored components of PAI and CAI |
| `india_launches.csv` | 84 | Each Indian launch from 2015: date, vehicle, flight, mission, agency, GCAT code, category, site, orbital/success/private flags |
| `india_satellites_annual.csv` | 12 | Indian satellites per year, government vs non-government, 2015–2026 |
| `india_nongov_payloads.csv` | 34 | Each non-government Indian satellite (academic and commercial), with launch ID |
| `india_wikipedia_views.csv` | 136 | Raw monthly user views for the 13 articles and total English Wikipedia, from 2015-07 |
| `india_markets_monthly.csv` | 130 | Basket and Nifty monthly log returns as pulled, months corrected for Yahoo's labelling; 2026-11 is a partial month not used in the analysis |
| `india_events.csv` | 9 | Event study results |
| `india_events_robustness_5firm.csv` | 9 | Same events with the basket limited to the five most space-exposed firms |
| `india_event_window_chandrayaan3_daily.csv` | 21 | Daily abnormal returns, days −10 to +10, around the Chandrayaan-3 landing |
| `india_funding_reports.csv` | 20 | Published space start-up funding figures by source and publication date, plus IN-SPACe application and authorisation counts |
| `india_lok_sabha_sessions.csv` | 37 | Lok Sabha space questions per session, by topic |
| `india_lok_sabha_newspace_titles.csv` | 86 | Titles of the questions classified as NewSpace |
| `india_gdelt_tone_daily.csv` | 61 | GDELT daily news tone for "isro" (last three months only) |

### Both countries (`shared/`)
| File | Rows | What it holds |
|---|---|---|
| `hackernews_monthly.csv` | 260 | Monthly Hacker News story counts (all, state, NewSpace), mean VADER score overall and by group, negative/positive shares and points, for the US and India |
| `hackernews_event_windows.csv` | 22 | Headline sentiment in the 7 days after each event vs days −60 to −8, US and India |
| `space_signals_index_india_quarterly.csv`, `space_signals_index_us_quarterly.csv` | 39 each | Space Signals Index by complete quarter: attention, build-out, gap, robustness variants (Google-only, Wikipedia-only, leave-one-out min/max) and component counts |
| `space_signals_index_india_monthly.csv`, `space_signals_index_us_monthly.csv` | 119 each | Same, monthly from 2016-12 (each value covers the trailing 12 months) |

### Space Signals Index

`code/index/build_index.py` builds it from `*_index_components_z.csv` (attention) and `*_monthly.csv` (launches and commercial satellites). Values are scaled so that 100 = the January 2016 to December 2025 average and 10 points = one standard deviation; gap = attention − build-out. The baseline is fixed, so new months never revise earlier values. August to October 2026 are provisional: the satellite component is held at its July 2026 value because the GCAT satellite catalogue is complete only to July. See the Methods page for details and robustness.
| `hackernews_top_stories.csv` | 17 | Most-upvoted stories in each event window, US and India |

Author: Dr Arjuna Sathiaseelan, Space Economy Initiative, Cambridge Judge Business School.
