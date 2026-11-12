# Data

Pulled 5 Nov 2026 (India) and 6 Nov 2026 (US). Monthly window: January 2016 to October 2026.

| Folder | What it holds |
|---|---|
| `raw/india/` | Source files for India, as pulled |
| `raw/us/` | Source files for the United States, as pulled |
| `raw/shared/` | Sources covering both countries |
| `derived/india/`, `derived/us/` | Analysis outputs; the `*_page.json` / `dash.json` files are the data embedded in the web pages |
| `csv/us/`, `csv/india/`, `csv/shared/` | Analysis-ready CSV tables holding every raw value, with a data dictionary (`csv/README.md`) |

Every raw file starts with `#` header lines giving its source, query, pull date and any caveats. Series pulled through a browser were checksummed (sum and index-weighted sum) at the source and after transcription; the checksums are in the headers where relevant.

## Raw files

### India (`raw/india/`)
| File | Source | Contents |
|---|---|---|
| `gcat_launches_india.txt` | GCAT launch catalogue (J. McDowell, planet4589.org), updated 2 Nov 2026 | Every launch from Indian sites or by Indian agencies, 2015 onward |
| `gcat_satellites_india.txt` | GCAT satellite catalogue, updated 2 Nov 2026 | Indian satellites by owner class: annual counts and the list of non-government satellites |
| `google_trends_india.txt` | Google Trends, geo India | 10 terms, monthly, each on its own 0–100 scale |
| `wikipedia_pageviews_india.txt` | Wikimedia pageviews API, English Wikipedia | 13 articles plus total English-Wikipedia views, monthly |
| `markets_monthly_india.txt` | Yahoo Finance (NSE) | Monthly equal-weight log return of seven listed aerospace and defence suppliers, and the Nifty 50 |
| `event_study_india.txt` | Yahoo Finance daily prices | Abnormal returns for nine dated events, the daily Chandrayaan-3 window and a five-firm robustness check |
| `lok_sabha_questions_india.txt` | Digital Sansad (Lok Sabha) | 602 Department of Space questions: session totals, topic counts, NewSpace titles |
| `funding_reports_india.txt` | Press reports citing Tracxn; Lok Sabha replies | Space start-up funding as reported by each publication, with URLs |
| `gdelt_tone_india.txt` | GDELT DOC 2.0 API | Daily news tone for "isro", last three months only |

### United States (`raw/us/`)
| File | Source | Contents |
|---|---|---|
| `gcat_launches_us.txt` | GCAT launch catalogue, updated 2 Nov 2026 | US orbital launch attempts per month by provider type, and every failure |
| `gcat_satellites_us.txt` | GCAT satellite catalogue, updated 2 Nov 2026 | US-owned satellites per month: Starlink, other commercial, government, other |
| `google_trends_us.txt` | Google Trends, geo US | 11 terms, monthly, each on its own 0–100 scale |
| `wikipedia_pageviews_us.txt` | Wikimedia pageviews API, English Wikipedia | 11 articles plus total English-Wikipedia views, monthly |
| `markets_us.txt` | Yahoo Finance daily prices | Monthly returns for ten NewSpace firms, the S&P 500, the UFO ETF and SpaceX; 14-event study; daily event windows |
| `congress_bills_us.txt` | GovTrack (Library of Congress subject index) | 415 space-indexed bills and resolutions, 113th–119th Congress, and all-bill totals |
| `federal_register_us.txt` | Federal Register API | 1,072 space-related documents: annual counts by type and agency, and 99 rules and presidential documents |
| `sec_edgar_us.txt` | SEC EDGAR full-text search | Yearly hits for "low Earth orbit" in 10-Ks and "space economy" in all filings |
| `faa_licensed_operations_us.txt` | FAA Aerospace Forecast FY2025–2045 | Licensed commercial launches and re-entries per fiscal year, FY2015–FY2024 |

### Both countries (`raw/shared/`)
| File | Source | Contents |
|---|---|---|
| `hackernews_titles.txt` | Hacker News Search API (Algolia) | Monthly story counts and VADER title sentiment for US (17,640 stories) and India (286), event windows and top stories |

## Derived files
| File | Made by | Contents |
|---|---|---|
| `derived/india/out.json` | `code/india/analyse.py` | Indices, regressions, Granger tests, annual table |
| `derived/india/parl.json` | `code/india/parl.py` | Lok Sabha topic counts by session, year and era |
| `derived/india/dash.json` | `code/india/make_dash.py` | Everything embedded in `india.html` |
| `derived/us/us_noWiki.json` | `code/us/analyse_us.py` (run with `NO_WIKI=1`) | US analysis without Wikipedia (robustness check) |
| `derived/us/us.json` | `code/us/analyse_us.py` | Full US analysis |
| `derived/us/us_page.json` | `code/us/make_page_data.py` | Everything embedded in `us.html` |
| `derived/index/index_page.json` | `code/index/build_index.py` | Space Signals Index data embedded in `index.html` |
| `derived/index/*_space_signals_index_*.csv`, `robustness.json` | `code/index/build_index.py` | Index working files (published copies are in `csv/shared/`) |

## Not collected
X (paid API); Reddit; GDELT history (needs BigQuery); Tracxn deal-level data (paywalled); earnings-call transcripts (paywalled); ITU filings (subscription).
