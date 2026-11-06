const O=JSON.parse(document.getElementById('data').textContent);
const {C,base,mk,onTheme}=SDS;
const kv=(id,rows)=>document.getElementById(id).innerHTML=rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('');
kv('kv-in',[['Orbital launches 2016–25',O.in_total],['Listed NewSpace firms','none'],['Hacker News stories',O.hn_in.toLocaleString('en-GB')],['Key policy shift','June 2020 reforms']]);
kv('kv-us',[['Orbital launches 2016–25',O.us_total],['Listed NewSpace firms','10, plus SpaceX'],['Hacker News stories',O.hn_us.toLocaleString('en-GB')],['Key policy shift','2015 Commercial Space Launch Competitiveness Act']]);

document.getElementById('verdict-text').innerHTML=`
<p><b>Attention is a poor proxy for build-out in both countries.</b> In India launch counts explain ${O.in_r2}% of monthly public attention; in the US attention rises with launches across the decade but does not move with them month to month. Wikipedia reading of the national space agency (ISRO, NASA) has declined in both countries, whether launches stalled (India) or soared (US). In both, attention spikes on a handful of spectacles (Chandrayaan-3; Crew Dragon, Artemis and the SpaceX listing).</p>
<p><b>Markets carry real information, but about different things.</b> Indian listed suppliers priced the Chandrayaan-3 landing (+7.1%, t = 3.8) and nothing NewSpace, because India's NewSpace firms are not listed. In the US the market's sharpest move was a reallocation: other NewSpace stocks fell ${O.ipo_c}% against the S&amp;P 500 on SpaceX's first trading days (t = ${O.ipo_t}). US price moves are followed by searches for the companies, not the other way round.</p>
<p><b>Policy discourse moves first.</b> India's parliamentary questions turned towards NewSpace right after the 2020 reforms (7% → 26% of space questions). US law turned commercial a decade earlier, in 2015, before the launch boom; US regulators have scaled with it since.</p>
<p><b>Capital is the weakest link.</b> India has no reliable private-investment series: tracker figures for the same year differ 2.6-fold. The US has market prices and SEC filings, but no official US-only series either; the most-cited tracker reports global totals.</p>`;

const T=[
 ['Does public attention track launch cadence?',
  ['no','No','Launches explain 2% of monthly attention (R² 0.02); 66% once three flagship missions are added. Annual ρ = −0.04.'],
  ['mixed','Trend only','Annual ρ = 0.82 for NewSpace attention, but launches add nothing month to month once the shared trend is removed (t = −1.42). Flagship months add +2.1 SD to public attention. NASA\'s share of Wikipedia reading fell 30% as launches rose eightfold.']],
 ['Do investors price space events?',
  ['yes','Landmarks only','Chandrayaan-3 landing: +7.1% vs the Nifty over two days (t = 3.8). Space Policy 2023: +7.0% over six days, not robust. Launch failures: no reaction.'],
  ['yes','Yes, selectively','SpaceX IPO: peers −18.3% over two days (t = −2.5). Artemis II: UFO ETF +6.1% (t = 2.1). Starship tests, lunar landings and the 2025 executive order: no significant reaction.']],
 ['Does attention lead prices?',
  ['mixed','No lead','NewSpace attention does not predict basket returns (p ≥ 0.43). The listed basket is mainly defence and aerospace suppliers.'],
  ['no','Prices lead searches','Basket returns Granger-cause Google searches for space firms at lags 1–3 (p ≈ 0.02), but not Wikipedia reading or Hacker News volume. No attention measure predicts returns.']],
 ['Does policy activity lead or follow build-out?',
  ['yes','Leads','NewSpace share of Lok Sabha space questions: 6.9% before the 2020 reforms, 26.4% after (p < 10⁻⁶), ahead of private launches.'],
  ['mixed','Led early','Commercial legislating peaked in 2015–16. Commercial share of space bills 6.1% → 11.0% (not significant). FCC space rulemaking tracks launch cadence (ρ = 0.88).']],
 ['What does sentiment say?',
  ['no','Too thin to measure','Only 286 Hacker News stories in a decade; GDELT news tone available for three months only.'],
  ['mixed','Cooling','17,640 Hacker News titles. Tone drifted down from 2016–19 to 2023–26. Starship\'s January 2025 loss: sharpest negative shift (p = 0.002); Artemis II: positive (p = 0.015).']],
 ['Is private capital observable?',
  ['no','No','Tracxn-cited 2021 funding appears as $96M, $37.6M and $43M in three publications. Government and Tracxn cumulative totals differ by $252M.'],
  ['mixed','Partly','Listed prices and SEC filings are public; "space economy" in filings spikes with the 2021 SPAC wave and the 2026 IPO. No official US-only investment series.']],
 ['How concentrated is capacity?',
  ['mixed','State-led','ISRO and NSIL flew every orbital launch from 2016 until Skyroot\'s Vikram-1 (July 2026).'],
  ['mixed','One firm','SpaceX flew 94% of US launches in 2025; Starlink was 82% of US-owned satellites launched 2016–2025.']]
];
const lab={yes:'t-yes',no:'t-no',mixed:'t-mixed'};
document.getElementById('cmp-body').innerHTML=T.map(([q,a,b])=>`<tr><td>${q}</td>${[a,b].map(([t,h,p])=>`<td><span class="tag ${lab[t]}"><i></i>${h}</span><div>${p}</div></td>`).join('')}</tr>`).join('');

function bars(id,rows){const c=C();mk(id,{type:'bar',data:{labels:rows.map(r=>String(r.year)),datasets:[{label:'Orbital launch attempts',data:rows.map(r=>r.launches),backgroundColor:c.s1,borderRadius:3}]},
  options:base(c,{scales:{y:{beginAtZero:true,title:SDS.axisTitle(c,'launches')}},plugins:{tooltip:{callbacks:{label:i=>{const r=rows[i.dataIndex];return `${r.launches} attempts, ${r.fails} failed${r.year===2026?' (to October)':''}`}}}}})})}
onTheme(()=>{bars('c-in',O.in_annual);bars('c-us',O.us_annual)});
