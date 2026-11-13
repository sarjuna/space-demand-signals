#!/usr/bin/env bash
# Re-run everything from the raw files: analyses -> page data -> web pages -> CSVs -> figure check.
set -euo pipefail
cd "$(dirname "$0")"
export PYTHONWARNINGS=ignore
echo "India: analysis";            python3 code/india/analyse.py > /dev/null
echo "India: parliament";          python3 code/india/parl.py > /dev/null
echo "India: page data";           python3 code/india/make_dash.py
echo "US: analysis (no Wikipedia)"; NO_WIKI=1 python3 code/us/analyse_us.py > /dev/null
echo "US: analysis";               python3 code/us/analyse_us.py > /dev/null
echo "US: page data";              python3 code/us/make_page_data.py
echo "Global: ITU LEO filings";   python3 code/global/analyse_global.py > /dev/null
echo "Quantum: analysis";          python3 code/quantum/analyse_quantum.py > /dev/null
echo "Data: CSV exports";          python3 code/site/export_csv.py > /dev/null
echo "Quantum: CSV exports";       python3 code/quantum/export_quantum_csv.py > /dev/null
echo "Index: Space Signals Index"; python3 code/index/build_index.py > /dev/null
echo "Time series: VAR";          python3 code/var/run_var.py > /dev/null
echo "Site: pages (with index)";   python3 code/site/build.py > /dev/null
echo "Check: every raw value in CSVs"; python3 code/site/audit_csv.py | tail -1
echo "Check: figures in page text"; python3 code/site/verify.py | tail -1
