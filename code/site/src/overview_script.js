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

/* ---------- Space Signals Index ---------- */
const X=O.idx, NM={india:'India',us:'United States'};
const qlab=q=>q.replace(/(\d{4})Q(\d)/,'$1 Q$2');
const mlab=m=>new Date(m+'-01T00:00:00').toLocaleDateString('en-GB',{month:'short',year:'numeric'});
const sg=(v,d=1)=>(v>0?'+':v<0?'−':'')+Math.abs(v).toFixed(d);
const yrs=n=>{const y=n/4;return (Number.isInteger(y)?y:(Math.floor(y)+(y%1>=.5?'½':''))).toString()};
const L={india:X.india.latest,us:X.us.latest};
document.getElementById('meta').innerHTML=`<span>Latest quarter <b>${qlab(L.us.quarter)}</b></span><span>Monthly data to <b>${mlab(X.us.last_month)}</b></span><span>Data pulled <b>${O.pulled}</b></span><span>Reported <b>by quarter</b></span>`;
// headline
const both=c=>c.q_gap; const qs=X.us.quarters;
let since=null;{const gi=X.india.q_gap,gu=X.us.q_gap;let k=qs.length-1;while(k>=0&&gi[k]>0&&gu[k]>0)k--;for(let j=k;j>=0;j--){if(gi[j]>0&&gu[j]>0){since=qs[j];break}}}
const TH=5; // gap beyond ±5 points (half a standard deviation) counts as clearly ahead
const ST=c=>{const g=L[c].gap;return g>TH?'ahead':g<-TH?'behind':'level'};
const prevG=c=>X[c].q_gap[X[c].q_gap.length-2];
const phrase=c=>{const st=ST(c),n=NM[c].replace('United States','the United States');
 if(st==='ahead')return `has run well ahead of the build-out in ${n}`;
 if(st==='behind')return `is lagging the build-out in ${n}`;
 return prevG(c)<-TH?`has caught up with the build-out in ${n}`:`is level with the build-out in ${n}`};
const boMax=c=>Math.max(...X[c].q_bo);
const boMove=(c,unit='points')=>{const d=L[c].d_buildout;return Math.abs(d)<1?`was roughly flat (${sg(d)} ${unit})`:(d>0?'rose ':'eased ')+Math.abs(d).toFixed(1)+' '+unit};
const order=ST('us')==='ahead'?['us','india']:['india','us'];
document.getElementById('hl-eyebrow').textContent=`Space Signals Index · ${qlab(L.us.quarter)}`;
document.getElementById('headline').textContent=`Attention to space ${phrase(order[0])}, and ${phrase(order[1]).replace(/^(has|is) /,'$1 ').replace(/ the build-out in /,' it in ')}.`;
const usMax=Math.abs(Math.max(...X.us.q_att)-L.us.attention)<0.06;
const widest=c=>{const g=X[c].q_gap,k=g.length-1;for(let j=k-1;j>=0;j--)if(g[j]>=g[k])return X[c].quarters[j].slice(0,4);return null};
const wu=widest('us');
document.getElementById('hl-sub').innerHTML=`In the US, attention ${usMax?'has reached its highest level of the decade':'has jumped'}, following Artemis II and the SpaceX listing, while build-out ${Math.abs(L.us.d_buildout)<1?'has held steady':(L.us.d_buildout>0?'has kept rising':'has eased')}${boMax('us')-L.us.buildout<2?', close to its own decade high':''}${wu?`; the gap of ${sg(L.us.gap)} points is the widest since ${wu}`:''}. In India, attention rose ${Math.abs(L.india.d_attention).toFixed(1)} points in the quarter of Skyroot’s Vikram-1, India’s first private orbital launch${negRun('india')?`, after ${negRun('india')[0]} quarters in which build-out was clearly ahead`:''}. <b>The index is a signal to watch, not a trading signal:</b> whether the gap predicts prices or investment is the next test.`;
function posRun(c){const g=X[c].q_gap;let k=g.length-1,n=0;while(k>=0&&g[k]>TH){n++;k--}return n}
// consecutive quarters, ending just before the latest one, in which build-out was clearly ahead (gap below −TH)
function negRun(c){const g=X[c].q_gap;let k=g.length-2,n=0;const e=k;while(k>=0&&g[k]<-TH){n++;k--}return n?[n,X[c].quarters[k+1],X[c].quarters[e]]:null}
document.getElementById('prov').textContent=`${qlab(L.us.quarter)} values are provisional: they use satellite launches to July 2026, the latest complete month in the catalogue.`;
document.getElementById('idx-cards').innerHTML=['india','us'].map(c=>{const l=L[c],nr=negRun(c);
 const cell=(lab,v,d,extra='')=>`<div><span class="lab">${lab}</span><span class="val">${typeof v==='number'?v.toFixed(1):v}</span><span class="chg">${d}${extra}</span></div>`;
 const note=`Build-out ${boMove(c)} in the quarter.`;
 return `<div class="idx"><div class="idx-top"><h3>${NM[c]}</h3><span class="tag ${{ahead:'t-mixed',level:'t-level',behind:'t-yes'}[ST(c)]}"><i></i>${{ahead:'Attention ahead',level:'In line',behind:'Build-out ahead'}[ST(c)]}</span></div>
 <div class="idx-nums">${cell('Attention',l.attention,`${sg(l.d_attention)} vs ${qlab(l.prev_quarter)}`)}${cell('Build-out',l.buildout,`${sg(l.d_buildout)} vs ${qlab(l.prev_quarter)}`)}${cell('Gap',sg(l.gap),`${sg(l.d_gap)} vs ${qlab(l.prev_quarter)}`)}</div>
 <p>${note}${posRun(c)>1?` Attention has been clearly ahead (by more than ${TH} points) for ${posRun(c)} quarters, since ${qlab(X[c].quarters[X[c].quarters.length-posRun(c)])}.`:''}${nr?` Before this, build-out had been clearly ahead (by more than ${TH} points) for ${nr[0]} quarter${nr[0]>1?'s':''} (${qlab(nr[1])}${nr[0]>1?` to ${qlab(nr[2])}`:''}).`:''}</p></div>`}).join('');
// chart
const evPlugin={id:'ev',afterDatasetsDraw(ch,_,o){const {ctx,chartArea:a,scales:{x}}=ch;const c=C();ctx.save();ctx.font="11px 'IBM Plex Mono', monospace";
 (o.ev||[]).forEach(([m,t],i)=>{const k=ch.data.labels.indexOf(m);if(k<0)return;const px=x.getPixelForValue(k);ctx.strokeStyle=c.muted;ctx.setLineDash([3,3]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px,a.top+14+(i%2)*14);ctx.lineTo(px,a.bottom);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle=c.ink2;const w=ctx.measureText(t).width;let tx=px-w/2;tx=Math.max(a.left,Math.min(a.right-w,tx));ctx.fillText(t,tx,a.top+10+(i%2)*14)});ctx.restore()}};
const rgba=(h,a)=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`};
let cur='india';
function drawIdx(){const c=C(),d=X[cur];
 mk('c-idx',{type:'line',plugins:[evPlugin],data:{labels:d.month,datasets:[
  {label:'lo',data:d.att_lo,borderWidth:0,pointRadius:0,fill:false},
  {label:'hi',data:d.att_hi,borderWidth:0,pointRadius:0,fill:'-1',backgroundColor:rgba(c.s2,.12)},
  {label:'Attention',data:d.attention,borderColor:c.s2,borderWidth:2.2,pointRadius:0,fill:{target:3,above:rgba(c.s2,.22),below:rgba(c.s1,.18)}},
  {label:'Build-out',data:d.buildout,borderColor:c.s1,borderWidth:2.2,pointRadius:0,fill:false}]},
  options:base(c,{plugins:{ev:{ev:d.events},tooltip:{filter:i=>i.datasetIndex>1,callbacks:{title:t=>mlab(t[0].label),label:i=>`${i.dataset.label}: ${i.parsed.y.toFixed(1)}`,
   afterBody:t=>{const k=t[0].dataIndex;return `Gap: ${sg(d.attention[k]-d.buildout[k])}`}}}},
   scales:{x:{ticks:{callback:SDS.yearTick,autoSkip:false}},y:{title:SDS.axisTitle(c,'index (100 = 2016–25 average)')}}})});
 const r=d.robustness;
 document.getElementById('idx-stat').innerHTML=`<span>Latest month <b>${mlab(d.last_month)}</b></span><span>Attention vs Google-only version <b>r = ${r.r_google.toFixed(2)}</b></span><span>vs Wikipedia-only <b>r = ${r.r_wiki.toFixed(2)}</b></span><span>Dropping any one component moves attention by at most <b>${r.loo_max_abs_diff.toFixed(1)} points</b></span><span>Aug–Oct 2026 provisional: <b>satellites held at July value</b> (catalogue complete to July)</span>`}
document.querySelectorAll('#idx-seg button').forEach(b=>b.addEventListener('click',()=>{cur=b.dataset.c;document.querySelectorAll('#idx-seg button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));drawIdx()}));
onTheme(drawIdx);
// audiences
const AUD=[
 ['For investors','Separate spectacle from substance.',[
  `<b>Watch the gap.</b> US attention is ${Math.abs(L.us.gap).toFixed(1)} points ahead of build-out; in India the two are ${ST('india')==='level'?'level':sg(L.india.gap)+' points apart'}. The gap has swung both ways in both countries since 2016, so read it as a temperature check, not a forecast.`,
  `<b>Markets price landmarks, not routine progress.</b> Indian listed suppliers beat the Nifty 50 by 7.1% in the two days after the Chandrayaan-3 landing (t = 3.8); launch failures produced no significant move.`,
  `<b>Searches follow prices, not the reverse.</b> In the US, stock moves are followed by searches for the firms; no attention measure predicted returns.`,
  `<b>Mind concentration.</b> SpaceX flew 94% of US launches in 2025, and India’s NewSpace firms are not listed.`]],
 ['For policymakers','Read public interest and private capital directly.',[
  `<b>Reform moves the conversation first.</b> After India’s 2020 reforms, NewSpace questions in the Lok Sabha rose from 6.9% to 26.4% of space questions, ahead of private launches.`,
  `<b>More launches have not meant more attention.</b> The share of Wikipedia reading going to NASA fell 30% from 2016 to 2025 while US launches rose almost eightfold.`,
  `<b>Private capital is not measured.</b> Published figures for India’s 2021 start-up funding differ 2.6-fold, and the US has no official US-only series. An official investment series would be the biggest single data gain.`,
  `<b>A quarterly check.</b> The index shows whether public interest is keeping pace with programmes and reforms.`]],
 ['For researchers','An open panel, built to be tested.',[
  `<b>Open data:</b> monthly series for two countries, 2016–2026, in 30+ CSVs with code; an audit ties all 16,049 raw values to the tables.`,
  `<b>A transparent index:</b> a fixed 2016–2025 baseline, so new data do not rewrite history; equal weights; and robustness to component choice reported on the chart.`,
  `<b>Next test:</b> vector autoregression on these series, to ask whether attention leads build-out, prices or capital, or follows them.`,
  `<b>Extendable:</b> the same pipeline can add further countries and signals.`]]];
document.getElementById('aud').innerHTML=AUD.map(([h,s,li])=>`<div class="panel"><h3>${h}</h3><div class="sub">${s}</div><ul>${li.map(x=>`<li>${x}</li>`).join('')}</ul></div>`).join('');
// citation
const acc=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
document.getElementById('cite-text').innerHTML=`Sathiaseelan, A. (2026). <i>Space Demand Signals: Space Signals Index for India and the United States</i> [Dashboard and dataset]. Space Economy Initiative, Cambridge Judge Business School, University of Cambridge. https://sarjuna.github.io/space-demand-signals/ (accessed ${acc}).`;
document.getElementById('cite-bib').textContent=`@misc{sathiaseelan2026sds,
  author       = {Sathiaseelan, Arjuna},
  title        = {Space Demand Signals: Space Signals Index for India and the United States},
  year         = {2026},
  howpublished = {Dashboard and dataset, Space Economy Initiative, Cambridge Judge Business School, University of Cambridge},
  url          = {https://sarjuna.github.io/space-demand-signals/},
  note         = {Index to ${qlab(L.us.quarter)}}
}`;
document.getElementById('foot').textContent=`Dr Arjuna Sathiaseelan · Space Economy Initiative, Cambridge Judge Business School · Data pulled on ${O.pulled} · Index reported by quarter`;
