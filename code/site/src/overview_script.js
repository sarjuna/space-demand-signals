const O=JSON.parse(document.getElementById('data').textContent);
const {C,base,mk,onTheme}=SDS;
const kv=(id,rows)=>document.getElementById(id).innerHTML=rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('');
kv('kv-in',[['Orbital launches 2016–25',O.in_total],['Listed NewSpace firms','none'],['Hacker News stories',O.hn_in.toLocaleString('en-GB')],['Key policy shift','June 2020 reforms']]);
kv('kv-us',[['Orbital launches 2016–25',O.us_total],['Listed NewSpace firms','10, plus SpaceX'],['Hacker News stories',O.hn_us.toLocaleString('en-GB')],['Key policy shift','2015 Commercial Space Launch Competitiveness Act']]);

document.getElementById('verdict-text').innerHTML=`
<p><b>Attention is a poor proxy for build-out in both countries.</b> In India launch counts explain ${O.in_r2}% of monthly public attention; in the US attention rises with launches across the decade but does not move with them month to month. Wikipedia reading of the national space agency (ISRO, NASA) has declined in both countries, whether launches stalled (India) or soared (US). In both, attention spikes on a handful of spectacles (Chandrayaan-3; Crew Dragon, Artemis and the SpaceX listing).</p>
<p><b>Markets react to few events.</b> Indian listed suppliers show no clear reaction to the Chandrayaan-3 landing once it is timed correctly (+2.9% over two days, t = 1.5; the landing came after the market closed), and India's NewSpace firms are not listed. In the US the sharpest move came when SpaceX itself listed: other NewSpace stocks fell ${O.ipo_c}% against the S&amp;P 500 on SpaceX's first trading days (t = ${O.ipo_t}). US price moves are followed by searches for the companies, not the other way round.</p>
<p><b>Policy discourse moves first.</b> India's parliamentary questions turned towards NewSpace right after the 2020 reforms (7% → 26% of space questions). US law turned commercial a decade earlier, in 2015, before the launch boom; US regulators have scaled with it since.</p>
<p><b>Capital is the weakest link.</b> India has no reliable private-investment series: tracker figures for the same year differ 2.6-fold. The US has market prices and SEC filings, but no official US-only series either; the most-cited tracker reports global totals.</p>`;

const T=[
 ['Does public attention track launch cadence?',
  ['no','No','Launches explain 2% of monthly attention (R² 0.02); 66% once three flagship missions are added. Annual ρ = −0.04.'],
  ['mixed','Trend only','Annual ρ = 0.82 for NewSpace attention, but launches add nothing month to month once the shared trend is removed (t = −1.42). Flagship months add +2.1 SD to public attention. NASA\'s share of Wikipedia reading fell 30% as launches rose eightfold.']],
 ['Do investors price space events?',
  ['no','No clear reaction','Chandrayaan-3 landing: +2.9% vs the Nifty over two days from the first session after the landing (t = 1.5). Space Policy 2023: +7.0% over six days, not robust. Launch failures: no reaction.'],
  ['yes','Yes, selectively','SpaceX IPO: peers −18.3% over two days (t = −2.5). Artemis II: UFO ETF +6.1% (t = 2.1), borderline. Starship tests, lunar landings and the 2025 executive order: no significant reaction.']],
 ['Does attention lead prices?',
  ['mixed','No lead; prices lead','NewSpace attention does not predict basket returns (p ≥ 0.43). In a VAR, share-price rises are followed by more NewSpace attention about three months later (p = 0.002; 3 of 5 versions). The listed basket is mainly defence and aerospace suppliers.'],
  ['no','Prices lead searches','Basket returns Granger-cause Google searches for space firms at lags 1–3 (p ≈ 0.02), but not Wikipedia reading or Hacker News volume. No attention measure predicts returns, and in a VAR neither direction is robust.']],
 ['Does policy activity lead or follow build-out?',
  ['yes','Leads','NewSpace share of Lok Sabha space questions: 6.9% before the 2020 reforms, 26.4% after (p < 10⁻⁶), ahead of private launches.'],
  ['mixed','Led early','Commercial legislating came early, in 2015–16. Commercial share of space bills 6.1% → 11.0% (not significant). FCC space rulemaking tracks launch cadence (ρ = 0.88).']],
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
document.getElementById('hl-sub').innerHTML=`In the US, attention ${usMax?'has reached its highest level of the decade':'has jumped'}, following Artemis II and the SpaceX listing, while build-out ${Math.abs(L.us.d_buildout)<1?'has held steady':(L.us.d_buildout>0?'has kept rising':'has eased')}${boMax('us')-L.us.buildout<2?', close to its own decade high':''}${wu?`; the gap of ${sg(L.us.gap)} points is the widest since ${wu}`:''}. In India, attention rose ${Math.abs(L.india.d_attention).toFixed(1)} points in the quarter of Skyroot’s Vikram-1, India’s first private orbital launch${negRun('india')?`, after ${negRun('india')[0]} quarters in which build-out was clearly ahead`:''}. Time-series tests find no case in which attention reliably leads share prices or launches. <b>The index is a signal to watch, not a trading signal.</b>`;
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
  `<b>Watch the gap.</b> US attention is ${Math.abs(L.us.gap).toFixed(1)} points ahead of build-out; in India the two are ${ST('india')==='level'?'level':sg(L.india.gap)+' points apart'}. The gap has swung both ways in both countries since 2016, so read it as a temperature check, not a forecast. India's gap is small, and its label changes under reasonable alternative ways of building the index, so treat it as uncertain.`,
  `<b>Markets rarely price single events.</b> Timed from the first session after the landing, the Chandrayaan-3 result for Indian listed suppliers is +2.9% over two days (t = 1.5, not significant), and launch failures produced no significant move. The one large US reaction came when SpaceX itself listed.`,
  `<b>Attention does not lead prices.</b> Time-series (VAR) tests find no case in which attention reliably leads share prices. There is some evidence of the reverse (in India, price rises are followed by more attention about three months later), but it holds in only some model versions.`,
  `<b>Mind concentration.</b> SpaceX flew 94% of US launches in 2025, and India’s NewSpace firms are not listed.`]],
 ['For policymakers','Read public interest and private capital directly.',[
  `<b>Reform moves the conversation first.</b> After India’s 2020 reforms, NewSpace questions in the Lok Sabha rose from 6.9% to 26.4% of space questions, ahead of private launches.`,
  `<b>More launches have not meant more attention.</b> The share of Wikipedia reading going to NASA fell 30% from 2016 to 2025 while US launches rose almost eightfold.`,
  `<b>Private capital is not measured.</b> Published figures for India’s 2021 start-up funding differ 2.6-fold, and the US has no official US-only series. An official investment series would be the biggest single data gain.`,
  `<b>A quarterly check.</b> The index shows whether public interest is keeping pace with programmes and reforms.`]],
 ['For researchers','An open panel, built to be tested.',[
  `<b>Open data:</b> monthly series for two countries, 2016–2026, in 30+ CSVs with code; an audit ties all 19,374 raw values to the tables.`,
  `<b>A transparent index:</b> a fixed 2016–2025 baseline, so new data do not rewrite history; equal weights; and robustness to component choice reported on the chart.`,
  `<b>Time-series tests:</b> VARs with Granger tests and impulse responses for each pair, each checked five ways; results and code are included. Next: whether the index gap predicts returns or investment.`,
  `<b>Extendable:</b> the same pipeline can add further countries and signals.`]]];
document.getElementById('aud').innerHTML=AUD.map(([h,s,li])=>`<div class="panel"><h3>${h}</h3><div class="sub">${s}</div><ul>${li.map(x=>`<li>${x}</li>`).join('')}</ul></div>`).join('');
// citation
document.getElementById('cite-text').innerHTML=`Sathiaseelan, A. (2026). <i>Space Demand Signals: Space Signals Index for India and the United States</i> [Dashboard and dataset]. Space Economy Initiative, Centre for India and Global Business, Cambridge Judge Business School, University of Cambridge. https://sarjuna.github.io/space-demand-signals/`;
document.getElementById('cite-bib').textContent=`@misc{sathiaseelan2026sds,
  author       = {Sathiaseelan, Arjuna},
  title        = {Space Demand Signals: Space Signals Index for India and the United States},
  year         = {2026},
  howpublished = {Dashboard and dataset, Space Economy Initiative, Centre for India and Global Business, Cambridge Judge Business School, University of Cambridge},
  url          = {https://sarjuna.github.io/space-demand-signals/},
  note         = {Index to ${qlab(L.us.quarter)}}
}`;
document.getElementById('foot').textContent=`Dr Arjuna Sathiaseelan · Space Economy Initiative, Centre for India and Global Business, Cambridge Judge Business School · Data pulled on ${O.pulled} · Index reported by quarter`;

/* ---------- VAR lead-lag ---------- */
const V=O.var, VM={}; V.forEach(v=>VM[v.id]=v);
const SPECS=v=>[['AIC lags',v.aic],['BIC lags',v.bic],['3 lags',v.fixed3],['no event controls',v.robust.no_dummies],['to May 2026',v.robust.to_2026_05]];
const nsig=(v,k)=>SPECS(v).filter(([,x])=>x[k]<0.05).length;
const fp=x=>x<0.001?'< 0.001':x.toFixed(3);
const verdict=(v,k)=>{const n=nsig(v,k);return n===5?['yes','Robust lead']:n>=3?['mixed','Some evidence']:n>=1?['mixed','Weak, not robust']:['no','No lead']};
const VLAB={'IN-1':['India','NewSpace attention vs listed space suppliers (share prices vs Nifty 50)'],'US-1':['United States','NewSpace attention vs NewSpace stocks (vs S&P 500)'],
 'IN-2':['India','Public space attention vs orbital launches'],'US-2':['United States','NewSpace attention vs orbital launches']};
const OTHER={'IN-1':'prices','US-1':'prices','IN-2':'launches','US-2':'launches'};
const per=v=>`${mlab(v.start)} – ${mlab(v.end)}, ${v.n} months`;
document.getElementById('var-body').innerHTML=['IN-1','US-1','IN-2','US-2'].map(id=>{const v=VM[id];
 const cell=k=>{const [t,h]=verdict(v,k);return `<td><span class="tag ${lab[t]}"><i></i>${h}</span><div>p = ${fp(v.aic[k])} in the main model (${v.aic.p} lags); significant in ${nsig(v,k)} of 5 versions</div></td>`};
 return `<tr><td>${VLAB[id][0]}<div class="dim" style="font-weight:400">${VLAB[id][1]}. ${per(v)}</div></td>${cell('a_to_b')}${cell('b_to_a')}</tr>`}).join('');
// impulse responses
let vm='IN-1',vd='b_to_a';
const segV=document.getElementById('irf-seg');
segV.innerHTML=['IN-1','US-1','IN-2','US-2'].map(id=>`<button type="button" data-m="${id}" aria-pressed="${id===vm}">${id.startsWith('IN')?'India':'US'}: ${OTHER[id]}</button>`).join('');
const unitOf=(v,d)=>d==='b_to_a'?'attention (index units)':(v.q==='attention_prices'?'cumulative excess return, %':(v.id==='US-2'?'launches, log change':'launches'));
function drawIrf(){const c=C(),v=VM[vm],src=vd==='a_to_b'?v.irf_rev:v.irf,m=src[vd],se=src[vd+'_se'],H=m.map((_,h)=>String(h));
 const lo=m.map((x,h)=>x-1.96*se[h]),hi=m.map((x,h)=>x+1.96*se[h]);
 const shock=vd==='b_to_a'?(v.q==='attention_prices'?'share-price':'launch'):'attention';
 document.getElementById('irf-sub').textContent=`Cumulative response over 12 months to a one-standard-deviation surprise in ${shock}s (${VLAB[vm][0]}). Where the band includes zero, the effect cannot be told apart from none. The surprise is not allowed to move the other series in its own month, so the chart shows leads only.`;
 mk('c-irf',{type:'line',data:{labels:H,datasets:[
  {label:'lo',data:lo,borderWidth:0,pointRadius:0,fill:false},
  {label:'hi',data:hi,borderWidth:0,pointRadius:0,fill:'-1',backgroundColor:rgba(c.s7,.18)},
  {label:'Cumulative response',data:m,borderColor:c.s7,borderWidth:2.2,pointRadius:2,fill:false},
  {label:'zero',data:m.map(()=>0),borderColor:c.axis,borderWidth:1,pointRadius:0,fill:false}]},
  options:base(c,{plugins:{tooltip:{filter:i=>i.datasetIndex===2,callbacks:{title:t=>`Month ${t[0].label}`,label:i=>{const h=i.dataIndex;return `${i.parsed.y.toFixed(2)} (95%: ${lo[h].toFixed(2)} to ${hi[h].toFixed(2)})`}}}},
   scales:{x:{title:SDS.axisTitle(c,'months after the surprise')},y:{title:SDS.axisTitle(c,unitOf(v,vd))}}})});
 document.getElementById('irf-stat').innerHTML=`<span>Granger p (main) <b>${fp(v.aic[vd])}</b></span><span>Lags <b>${v.aic.p}</b> (AIC)</span><span>Stable <b>${v.aic.stable?'yes':'no'}</b></span><span>Residual autocorrelation p <b>${v.aic.white_p.toFixed(2)}</b></span>`}
segV.querySelectorAll('button[data-m]').forEach(b=>b.addEventListener('click',()=>{vm=b.dataset.m;segV.querySelectorAll('button[data-m]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));drawIrf()}));
document.querySelectorAll('#irf-dir button').forEach(b=>b.addEventListener('click',()=>{vd=b.dataset.d;document.querySelectorAll('#irf-dir button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));drawIrf()}));
onTheme(drawIrf);
// reading
const aMax=Math.max(...V.map(v=>nsig(v,'a_to_b')));
const lMin=Math.min(...['IN-2','US-2'].flatMap(id=>SPECS(VM[id]).flatMap(([,x])=>[x.a_to_b,x.b_to_a])));
const I1=VM['IN-1'],U1=VM['US-1'],nTests=V.length*2;
const ex=(id,e)=>VM[id].exog_effects[e];
document.getElementById('var-read').innerHTML=`<h3>What the tests say</h3>
<p><b>Attention does not lead.</b> In none of the four pairs does a change in attention reliably come before a move in share prices or launches: the attention-first test is significant in at most ${aMax} of 5 versions${aMax?` (US prices, sample ending before the SpaceX listing: p = ${fp(U1.robust.to_2026_05.a_to_b)})`:''}.</p>
<p><b>In India, prices lead attention.</b> A rise in listed space suppliers’ shares is followed about three months later by a rise in NewSpace attention (p = ${fp(I1.aic.b_to_a)}, significant in ${nsig(I1,'b_to_a')} of 5 versions). It passes a correction for the ${nTests} main tests (0.05 ÷ ${nTests} = ${(0.05/nTests).toFixed(4)}), but weakens if the sample ends before Vikram-1 (p = ${fp(I1.robust.to_2026_05.b_to_a)}).</p>
<p><b>In the US the same direction is weak</b> (p = ${fp(U1.aic.b_to_a)} in the main model, ${nsig(U1,'b_to_a')} of 5 versions), in line with the country page, where the effect runs through Google searches only.</p>
<p><b>Attention and launches move independently</b> month to month in both countries (every p ≥ ${lMin.toFixed(2)}).</p>
<p><b>Events move attention.</b> Flagship-mission months raise public attention in India (t = ${ex('IN-2','d_flagship_month').t_a.toFixed(1)}) and NewSpace attention in the US (t = ${ex('US-1','d_flagship_month').t_a.toFixed(1)}), as do Starship flight months (t = ${ex('US-1','d_starship_flight_month').t_a.toFixed(1)}). Price reactions to events are measured more precisely with the daily event studies on the country pages.</p>
<p class="note">Granger tests show timing, not cause. Samples are short (${U1.n} months for US prices), so modest effects can be missed. Details on the <a href="methods.html#var-method">Methods</a> page.</p>`;
