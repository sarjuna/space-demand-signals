/* Shared chart helpers for Space Demand Signals (Chart.js 4). */
(function () {
  const SANS = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif", MONO = "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace";
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const C = () => ({ ink: css('--ink'), ink2: css('--ink-2'), muted: css('--muted'), grid: css('--grid'), axis: css('--axis'), surface: css('--surface'),
    s1: css('--s1'), s2: css('--s2'), s3: css('--s3'), s4: css('--s4'), s7: css('--s7'), bad: css('--bad'), good: css('--good'), accent: css('--accent') });
  function deepMerge(a, b) { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && !(b[k] instanceof Function)) { a[k] = deepMerge(a[k] || {}, b[k]) } else a[k] = b[k] } return a }
  function base(c, extra = {}) {
    const o = { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: c.surface, titleColor: c.ink, bodyColor: c.ink2, borderColor: c.axis, borderWidth: 1, padding: 10,
        titleFont: { family: MONO, size: 12 }, bodyFont: { family: SANS, size: 12.5 }, boxPadding: 4 } },
      scales: { x: { grid: { display: false }, border: { color: c.axis }, ticks: { color: c.muted, font: { family: MONO, size: 11 }, maxRotation: 0, autoSkip: true, autoSkipPadding: 14 } },
        y: { grid: { color: c.grid }, border: { display: false }, ticks: { color: c.muted, font: { family: MONO, size: 11 } } } } };
    return deepMerge(o, extra);
  }
  const charts = {};
  function mk(id, cfg) { if (charts[id]) charts[id].destroy(); const el = document.getElementById(id); if (!el) return; charts[id] = new Chart(el, cfg) }
  const fmt = (v, d = 1) => (v > 0 ? '+' : '') + Number(v).toFixed(d);
  const yearTick = function (v) { const l = this.getLabelForValue(v); return l && l.endsWith('-01') ? l.slice(0, 4) : '' };
  const axisTitle = (c, t) => ({ display: true, text: t, color: c.muted, font: { family: MONO, size: 11 } });
  function onTheme(draw) {
    const run = () => { if (window.Chart) { Chart.defaults.font.family = SANS; draw() } };
    run();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', run);
    new MutationObserver(run).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (document.fonts) document.fonts.ready.then(run);
  }
  window.SDS = { C, base, mk, fmt, yearTick, axisTitle, onTheme, deepMerge };
})();
