
const D=JSON.parse(document.getElementById('data').textContent);
const S=D.stats;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fmt=(v,d=1)=>(v>0?'+':'')+v.toFixed(d);
const charts={};
function C(){return{ink:css('--ink'),ink2:css('--ink-2'),muted:css('--muted'),grid:css('--grid'),axis:css('--axis'),surface:css('--surface'),s1:css('--s1'),s2:css('--s2'),s3:css('--s3'),s4:css('--s4'),s7:css('--s7'),bad:css('--bad'),good:css('--good'),accent:css('--accent')}}
function base(c,extra={}){
  const o={responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},
  plugins:{legend:{display:false},tooltip:{backgroundColor:c.surface,titleColor:c.ink,bodyColor:c.ink2,borderColor:c.axis,borderWidth:1,padding:10,titleFont:{family:'IBM Plex Mono',size:12},bodyFont:{family:'IBM Plex Sans',size:12.5},boxPadding:4}},
  scales:{x:{grid:{display:false},border:{color:c.axis},ticks:{color:c.muted,font:{family:'IBM Plex Mono',size:11},maxRotation:0,autoSkip:true,autoSkipPadding:14}},
          y:{grid:{color:c.grid},border:{display:false},ticks:{color:c.muted,font:{family:'IBM Plex Mono',size:11}}}}};
  return deepMerge(o,extra)}
function deepMerge(a,b){for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&!(b[k] instanceof Function)){a[k]=deepMerge(a[k]||{},b[k])}else a[k]=b[k]}return a}
function mk(id,cfg){if(charts[id])charts[id].destroy();charts[id]=new Chart(document.getElementById(id),cfg)}

/* ---------- findings ---------- */
const eras=D.parl.eras;
const pre=eras[0],post=eras[1],late=eras[2];
const F=[
 {k:`R² ${S.monthly_PAI_ols.R2_launches_only.toFixed(2)}`,s:'',t:'no',tt:'Attention ≠ cadence',p:`Launch counts explain ${(S.monthly_PAI_ols.R2_launches_only*100).toFixed(0)}% of monthly public attention. Adding three flagship lunar/solar/crew-test windows lifts it to ${(S.monthly_PAI_ols.R2_full*100).toFixed(0)}%. Annual ρ(attention, launches) = ${S.annual_PAI_vs_launches.rho.toFixed(2)}.`},
 {k:'+2.9%',s:' 2-day',t:'no',tt:'No clear reaction to landmarks',p:'The Chandrayaan-3 landing came after the market closed. From the next trading session, the space-supplier basket beat the Nifty by 2.9% over two days (t = 1.5, not significant). Its 3.8% rise on landing day came before the outcome was known. The Space Policy 2023 approval shows +7.0% over six days (t = 2.1), but this is not robust to dropping the two defence-led firms. Launch failures show no significant drop.'},
 {k:`${(pre.ns_share*100).toFixed(0)}% → ${(post.ns_share*100).toFixed(0)}%`,s:'',t:'yes',tt:'Policy discourse shifted',p:`NewSpace share of Lok Sabha space questions, before vs after the June 2020 reforms (Fisher p < 10⁻⁶). It has held near ${(late.ns_share*100).toFixed(0)}% since, while total space questions did not grow.`},
 {k:'2.6×',s:' spread',t:'no',tt:'Capital data unstable',p:'Tracxn-cited 2021 funding appears as $96M, $37.6M and $43M in three publications. Government cumulative $618.5M (Mar 2026) vs Tracxn $871M (Jul 2026).'},
 {k:'No lead',s:'',t:'mixed',tt:'Attention vs prices',p:'NewSpace attention does not Granger-cause basket returns (p ≥ 0.43). Public-attention surges precede slightly weaker next-month returns (p = 0.03), a pattern that fades after 2021.'}
];
document.getElementById('findings').innerHTML=F.map(f=>`<div class="finding"><span class="tag t-${f.t}"><i></i>${f.tt}</span><div class="k">${f.k}<small>${f.s}</small></div><p>${f.p}</p></div>`).join('');

/* ---------- RQ1 ---------- */
let view='idx';
function drawIndex(){
  const c=C();const X=D.PAI.x;
  const al=(s)=>{const m=Object.fromEntries(s.x.map((x,i)=>[x,s.y[i]]));return X.map(x=>m[x]??null)};
  const L=D.launch_table;const lm={},fm={};
  L.forEach(r=>{const m=r.date.slice(0,7);(r.success?lm:fm)[m]=(r.success?lm:fm)[m]||[];(r.success?lm:fm)[m].push(r.flight+' · '+r.mission)});
  let ds=[],leg=[];
  if(view==='idx'){
    ds=[{label:'Public Attention Index',data:al(D.PAI),borderColor:c.s1,backgroundColor:c.s1,borderWidth:2,pointRadius:0,tension:.15},
        {label:'NewSpace Attention Index',data:al(D.CAI),borderColor:c.s2,backgroundColor:c.s2,borderWidth:2,pointRadius:0,tension:.15}];
    leg=[[c.s1,'Public Attention Index'],[c.s2,'NewSpace Attention Index']];
  }else{
    const Z=view==='pai'?D.PAIZ:D.CAIZ;const cols=[c.s1,c.s2,c.s3,c.s4,c.s7,c.ink2,c.muted,c.accent,c.bad];
    ds=Object.keys(Z).map((k,i)=>({label:k,data:al(Z[k]),borderColor:cols[i%cols.length],backgroundColor:cols[i%cols.length],borderWidth:1.5,pointRadius:0,tension:.15}));
    leg=Object.keys(Z).map((k,i)=>[cols[i%cols.length],k]);
  }
  const yMin=-2.6;
  ds.push({type:'scatter',label:'Orbital launch (success)',data:X.map(x=>lm[x]?yMin:null),pointStyle:'triangle',rotation:0,pointRadius:X.map(x=>lm[x]?5:0),borderColor:c.ink2,backgroundColor:c.ink2,showLine:false,_info:lm});
  ds.push({type:'scatter',label:'Launch failure',data:X.map(x=>fm[x]?yMin:null),pointStyle:'triangle',rotation:180,pointRadius:X.map(x=>fm[x]?6:0),borderColor:c.bad,backgroundColor:c.bad,showLine:false,_info:fm});
  document.getElementById('lg1').innerHTML=leg.map(([col,l])=>`<span><i class="sw" style="background:${col}"></i>${l}</span>`).join('')+`<span><i class="sw dot" style="background:${c.ink2}"></i>Orbital launch</span><span><i class="sw tri"></i>Launch failure</span>`;
  mk('c-index',{type:'line',data:{labels:X,datasets:ds},options:base(c,{
    scales:{y:{min:yMin-0.4,title:{display:true,text:'z-score',color:c.muted,font:{family:'IBM Plex Mono',size:11}}},x:{ticks:{callback:function(v){const l=this.getLabelForValue(v);return l.endsWith('-01')?l.slice(0,4):''},autoSkip:false}}},
    plugins:{tooltip:{filter:i=>i.raw!==null,callbacks:{label:(i)=>{const d=i.dataset;if(d._info){return (d._info[i.label]||[]).map(s=>(d.label.includes('fail')?'✕ ':'▲ ')+s)}return `${d.label}: ${i.raw.toFixed(2)}`}}}}})});
}
['idx','pai','nai'].forEach(v=>document.getElementById('v-'+v).onclick=()=>{view=v;['idx','pai','nai'].forEach(w=>document.getElementById('v-'+w).setAttribute('aria-pressed',w===v));drawIndex()});
const o=S.monthly_PAI_ols;
document.getElementById('sl1').innerHTML=`<span>Flagship-mission month <b>+${o.flagship_mission_month.coef.toFixed(2)} z</b> (t ${o.flagship_mission_month.t})</span><span>Each extra launch <b>+${o.launches.coef.toFixed(2)} z</b> (t ${o.launches.t})</span><span>Failure <b>${o.failures.coef.toFixed(2)} z</b> (t ${o.failures.t})</span><span>R² launches only <b>${o.R2_launches_only}</b> · with flagship <b>${o.R2_full}</b></span>`;
function drawYear(){
  const c=C();const A=D.annual;const yrs=A.map(a=>String(a.year));
  mk('c-launch-yr',{type:'bar',data:{labels:yrs,datasets:[{label:'Successful',data:A.map(a=>a.launches-a.fails),backgroundColor:c.s1,borderRadius:3,stack:'s'},{label:'Failed',data:A.map(a=>a.fails),backgroundColor:c.bad,borderRadius:3,stack:'s'}]},
    options:base(c,{scales:{x:{stacked:true},y:{stacked:true,title:{display:true,text:'launches',color:c.muted,font:{size:11}}}},plugins:{tooltip:{callbacks:{}}}})});
  mk('c-pai-yr',{type:'line',data:{labels:yrs,datasets:[{label:'Mean PAI',data:A.map(a=>a.PAI),borderColor:c.ink2,backgroundColor:c.s1,borderWidth:1,pointRadius:5,pointBorderColor:c.surface,pointBorderWidth:2,showLine:false}]},
    options:base(c,{scales:{x:{offset:true},y:{title:{display:true,text:'mean PAI (z)',color:c.muted,font:{size:11}}}},plugins:{tooltip:{callbacks:{label:i=>`Mean PAI ${i.raw.toFixed(2)}`}}}})});
}
const R=S.ratchet;
document.getElementById('read1').innerHTML=`
<p>Attention is driven by a handful of spectacles, not by how often India flies. 2019 and 2023, the two lunar-landing years, are the only years with high attention, yet 2016, 2018 and 2023 all had seven orbital launches. Each extra launch in a month adds about 0.1 to the index (z units); a flagship-mission month adds 2.6.</p>
<p>There is no clear sign that Chandrayaan-3 lifted the baseline. Google Trends interest in ISRO (India) had a median of ${R.gt_isro_pre} in the year before July 2023 and ${R.gt_isro_last12} in the last twelve months; similar medians cannot by themselves rule out a lasting effect once the longer-run trend is allowed for. Normalised Wikipedia views fell over the same period (${R.wiki_isro_pre.toFixed(1)} → ${R.wiki_isro_last12.toFixed(1)} per million), a gap that probably reflects readers moving from Wikipedia to search and AI answers rather than lost interest.</p>
<p>NewSpace attention behaves differently: it climbs in steps with private firsts (Vikram-S, Nov 2022; Agnibaan, May 2024; Vikram-1 orbital, Jul 2026) and its 2026 average is the highest in the series.</p>`;

/* ---------- RQ2 ---------- */
function drawC3(){
  const c=C();let cum=0;const pts=D.c3.map(r=>{cum+=r.ar;return {x:r.d,y:+cum.toFixed(3),date:r.date,ar:r.ar}});
  mk('c-c3',{type:'line',data:{labels:pts.map(p=>p.x),datasets:[{label:'Cumulative abnormal return',data:pts.map(p=>p.y),borderColor:c.s2,backgroundColor:c.s2,borderWidth:2,pointRadius:pts.map(p=>p.x>=-1&&p.x<=1?5:0),pointBackgroundColor:c.s2,pointBorderColor:c.surface,pointBorderWidth:2,tension:0}]},
    options:base(c,{scales:{y:{title:{display:true,text:'cumulative %',color:c.muted,font:{size:11}}},x:{title:{display:true,text:'trading days from 24 Aug 2023 (first session after landing)',color:c.muted,font:{size:11}}}},
    plugins:{tooltip:{callbacks:{title:i=>pts[i[0].dataIndex].date+' (day '+pts[i[0].dataIndex].x+')',label:i=>[`Daily AR ${fmt(pts[i.dataIndex].ar,2)}%`,`Cumulative ${fmt(i.raw,2)}%`]}}}})});
}
function drawXC(){
  const c=C();const xc=S.xcorr_dCAI_excess;const ks=Object.keys(xc).map(Number).sort((a,b)=>a-b);
  mk('c-xc',{type:'bar',data:{labels:ks.map(k=>(k>0?'+':'')+k),datasets:[{label:'r',data:ks.map(k=>xc[k].r),backgroundColor:ks.map(k=>xc[k].p<0.05?c.s1:'transparent'),borderColor:c.s1,borderWidth:1.5,borderRadius:3}]},
    options:base(c,{scales:{y:{min:-0.4,max:0.4,title:{display:true,text:'Pearson r',color:c.muted,font:{size:11}}},x:{title:{display:true,text:'k (months); positive = attention leads',color:c.muted,font:{size:11}}}},
    plugins:{tooltip:{callbacks:{label:i=>{const k=ks[i.dataIndex];return `r = ${xc[k].r.toFixed(3)}, p = ${xc[k].p.toFixed(3)}, n = ${xc[k].n}`}}}}})});
}
document.querySelector('#t-events tbody').innerHTML=D.events.map(e=>{const s1=Math.abs(e.t01)>=1.96,s5=Math.abs(e.t05)>=1.96;
 return `<tr><td>${e.label}</td><td class="mono">${e.t0}</td><td class="num ${s1?'sig':''}">${fmt(e.car01,2)}%</td><td class="num ${s1?'sig':'dim'}">${e.t01.toFixed(2)}</td><td class="num ${s5?'sig':''}">${fmt(e.car05,2)}%</td><td class="num ${s5?'sig':'dim'}">${e.t05.toFixed(2)}</td><td class="num dim">${fmt(e.pre,2)}%</td></tr>`}).join('');
const gA=S.granger_attention_to_returns_p,gR=S.granger_returns_to_attention_p,gP=S.granger_PAI_to_returns_p;
document.getElementById('read2').innerHTML=`
<p><b>Events.</b> Only one of nine events clears |t| ≥ 1.96 (bold): the Cabinet's approval of the Indian Space Policy 2023 (six days, t = 2.1), which falls to t = 1.9 when the basket is restricted to the five space-exposed firms; with 18 tests, one such result could arise by chance. The Chandrayaan-3 landing (18:04 IST, after the 15:30 close) is measured from 24 August, the first session at which the outcome could be traded: +2.9% over two days (t = 1.5). The basket's 3.8% rise on 23 August came before the landing and reflects anticipation, not the result. Policy steps aimed at capital (FDI liberalisation, the ₹1,000 crore VC fund) and private-launch milestones did not move these listed stocks. The PSLV-C61 window is dominated by a +12.5% pre-event run-up in defence stocks during May 2025, so it cannot be read as a space signal.</p>
<p><b>Lead–lag.</b> Monthly changes in NewSpace attention do not predict basket returns (Granger p = ${gA[1]}, ${gA[2]}, ${gA[3]} at lags 1–3). Returns appear to lead attention at lag 3 (p = ${gR[3]}), but that is one hit among six tests and weakens to p = 0.046 when the Vikram-1 months are dropped. Over the longer 2016–2026 sample, a one-unit (z) rise in public attention is followed by an excess return about 2.8 percentage points lower the next month (Granger p = ${gP[1]}, permutation p = 0.04), consistent with attention-driven over-reaction that reverses. It does not hold in the 2021–2026 sub-sample (t = −1.3).</p>
<p><b>Implication.</b> Listed Indian equities show no reliable reaction to either state flagship success or NewSpace progress. The firms that embody NewSpace (Skyroot, Pixxel, Digantara, AgniKul) are unlisted, so no market price exists for the segment the reforms target.</p>`;

/* ---------- RQ3 ---------- */
function drawParl(){
  const c=C();const Y=D.parl.years;const yrs=Y.map(y=>String(y.year));
  const ann={id:'reform',afterDraw(ch){const x=ch.scales.x;const i=yrs.indexOf('2020');if(i<0)return;const px=x.getPixelForValue(i)+(x.getPixelForValue(i+1)-x.getPixelForValue(i))*0.48;const ctx=ch.ctx;ctx.save();ctx.strokeStyle=c.muted;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(px,ch.chartArea.top);ctx.lineTo(px,ch.chartArea.bottom);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=c.muted;ctx.font='11px IBM Plex Mono';ctx.fillText('reform',px+4,ch.chartArea.top+12);ctx.restore()}};
  mk('c-ns',{type:'bar',data:{labels:yrs,datasets:[{label:'NewSpace share',data:Y.map(y=>+(y.ns_share*100).toFixed(1)),backgroundColor:Y.map(y=>y.year>=2021?c.s2:c.axis),borderRadius:3}]},
    options:base(c,{scales:{y:{min:0,max:40,title:{display:true,text:'% of space questions',color:c.muted,font:{size:11}}}},plugins:{tooltip:{callbacks:{label:i=>{const y=Y[i.dataIndex];return `${i.raw}% (${y.newspace} of ${y.space_q} questions)`}}}}}),plugins:[ann]});
  mk('c-vol',{type:'line',data:{labels:yrs,datasets:[{label:'per 1,000',data:Y.map(y=>+y.space_per_1000.toFixed(2)),borderColor:c.s1,backgroundColor:c.s1,borderWidth:2,pointRadius:4,pointBorderColor:c.surface,pointBorderWidth:2}]},
    options:base(c,{scales:{y:{min:0,title:{display:true,text:'per 1,000 questions',color:c.muted,font:{size:11}}}},plugins:{tooltip:{callbacks:{label:i=>{const y=Y[i.dataIndex];return `${i.raw} per 1,000 (${y.space_q} of ${y.all_q})`}}}}}),plugins:[ann]});
  const T=[['newspace','NewSpace',c.s2],['exploration_hsf','Exploration & crew',c.s1],['launch_infra','Launch & infrastructure',c.s7],['applications','Applications',c.s3],['other','Other',c.axis]];
  const E=D.parl.eras;
  const val=(e,k)=>k==='other'?(e.policy+e.sustain_security+e.international+e.budget_workforce+e.general):e[k];
  document.getElementById('lg-topic').innerHTML=T.map(t=>`<span><i class="sw dot" style="background:${t[2]}"></i>${t[1]}</span>`).join('');
  mk('c-topic',{type:'bar',data:{labels:E.map(e=>e.era),datasets:T.map(t=>({label:t[1],data:E.map(e=>+(val(e,t[0])/e.space_q*100).toFixed(1)),backgroundColor:t[2],borderColor:c.surface,borderWidth:{right:2},borderSkipped:false}))},
    options:base(c,{indexAxis:'y',interaction:{mode:'nearest',intersect:true},scales:{x:{stacked:true,max:100,grid:{color:c.grid,display:true},ticks:{callback:v=>v+'%'}},y:{stacked:true,grid:{display:false},ticks:{color:c.ink2,font:{family:'IBM Plex Sans',size:12}}}},
    plugins:{tooltip:{mode:'nearest',callbacks:{label:i=>`${i.dataset.label}: ${i.raw}%`}}}})});
}
document.getElementById('read3').innerHTML=`
<p>Before the June 2020 reforms, ${pre.newspace} of ${pre.space_q} space questions (${(pre.ns_share*100).toFixed(1)}%) concerned private or commercial activity. From September 2020 to 2023 it was ${post.newspace} of ${post.space_q} (${(post.ns_share*100).toFixed(1)}%), and ${late.newspace} of ${late.space_q} (${(late.ns_share*100).toFixed(1)}%) in 2024–2026. Launch and infrastructure questions fell from ${(pre.launch_infra/pre.space_q*100).toFixed(0)}% to ${(late.launch_infra/late.space_q*100).toFixed(0)}%.</p>
<p>The volume of parliamentary attention to space did not rise; only its composition changed. NewSpace questions peaked in 2023, two years before the strongest capacity signals (record 2025 funding in the latest Tracxn vintage, nine commercial satellites in 2025, the first private orbital launch in 2026). With so few annual points this ordering is suggestive, not a test.</p>`;
document.querySelector('#t-ns tbody').innerHTML=D.parl_titles.map(r=>`<tr><td class="mono" style="white-space:nowrap">${r[0]}</td><td>${r[1]}</td></tr>`).join('');

/* ---------- RQ4 ---------- */
function drawFund(){
  const c=C();const fv=D.funding.filter(f=>/^\d{4}$/.test(f.year)&&!/YTD/.test(f.note));
  const vint=[...new Set(fv.map(f=>f.vintage))].sort();const cols=[c.s1,c.s2,c.s3,c.s7];
  const lab={'2023-08-26':'Aug 2023 (IANS)','2024-07-31':'Jul 2024 (Tele.net)','2025-01-06':'Jan 2025 (Reuters)','2026-07-29':'Jul 2026 (Entrepreneur)'};
  document.getElementById('lg-fund').innerHTML=vint.map((v,i)=>`<span><i class="sw dot" style="background:${cols[i]}"></i>${lab[v]||v}</span>`).join('');
  mk('c-fund',{type:'scatter',data:{datasets:vint.map((v,i)=>({label:lab[v]||v,data:fv.filter(f=>f.vintage===v).map(f=>({x:+f.year+(i-1.5)*0.09,y:f.usd,f})),backgroundColor:cols[i],borderColor:c.surface,borderWidth:2,pointRadius:7,pointHoverRadius:9}))},
    options:base(c,{interaction:{mode:'nearest',intersect:true},scales:{x:{type:'linear',min:2019.5,max:2025.5,grid:{display:false},ticks:{stepSize:1,callback:v=>Number.isInteger(v)?String(v):''}},y:{min:0,title:{display:true,text:'USD million',color:c.muted,font:{size:11}}}},
    plugins:{tooltip:{mode:'nearest',callbacks:{title:i=>i[0].raw.f.year+' funding',label:i=>[`$${i.raw.f.usd}M${i.raw.f.rounds?' · '+i.raw.f.rounds+' rounds':''}`,`${i.raw.f.pub}, ${i.raw.f.vintage}`,i.raw.f.note.includes('derived')?'derived from reported growth rate':'']}}}})});
}
function drawComm(){
  const c=C();const yrs=['2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','2026'];const cnt={};
  D.payload_table.filter(p=>p.cls==='C').forEach(p=>{const y=p.date.slice(0,4);cnt[y]=cnt[y]||[];cnt[y].push(p.name+' ('+p.owner+')')});
  mk('c-comm',{type:'bar',data:{labels:yrs,datasets:[{label:'Commercial payloads',data:yrs.map(y=>(cnt[y]||[]).length),backgroundColor:yrs.map(y=>y==='2026'?c.axis:c.s3),borderRadius:3}]},
    options:base(c,{scales:{y:{min:0,ticks:{stepSize:2},title:{display:true,text:'satellites',color:c.muted,font:{size:11}}}},plugins:{tooltip:{callbacks:{label:i=>(cnt[yrs[i.dataIndex]]||['none']).concat(yrs[i.dataIndex]==='2026'?['(catalogue incomplete)']:[])}}}})});
}
const reg=D.funding.filter(f=>['applications','authorisations','all-time'].includes(f.year));
document.querySelector('#t-reg tbody').innerHTML=reg.map(r=>`<tr><td class="mono">${r.vintage}</td><td>${r.year==='all-time'?'Cumulative start-up funding ('+r.src+')':r.year[0].toUpperCase()+r.year.slice(1)}<div class="dim" style="font-size:12px">${r.note}</div></td><td class="num">${r.year==='all-time'?'$'+r.usd+'M':r.usd}</td></tr>`).join('');
document.getElementById('read4').innerHTML=`
<p>The investment series that the correlation test needs does not exist in stable form. Every annual figure in public circulation traces to one vendor, Tracxn, and the vendor's own numbers are revised heavily as deals are back-filled: 2021 has been reported as $96M, $37.6M and $43M; 2022 as $112M, $118M and about $98M. A sentiment-versus-capital correlation run on any single vintage would partly measure the vintage.</p>
<p>The Government's cumulative figure ($618.5M to March 2026) and Tracxn's ($871M to July 2026) differ by $252M, more than Tracxn's entire 2026 year-to-date total of $113M, so the gap is definitional rather than timing. IN-SPACe publishes no dated authorisation register; only three cumulative counts surface through Parliament.</p>
<p>The physical indicators are clean. GCAT records 60 orbital attempts from Indian soil since 2015 (5 failures), and commercial payloads jumped to nine in 2025 from at most four in any earlier year. For the published version of this study, the defensible design is to test discourse against these physical series and to treat funding as a vintage-dependent range.</p>`;

/* ---------- live tone ---------- */
function drawTone(){
  const c=C();const g=D.gdelt;
  mk('c-tone',{type:'bar',data:{labels:g.map(r=>r.d),datasets:[{label:'Tone',data:g.map(r=>r.tone),backgroundColor:g.map(r=>r.tone>=0?c.s1:c.s2),borderRadius:2}]},
   options:base(c,{scales:{y:{title:{display:true,text:'avg tone',color:c.muted,font:{size:11}}},x:{ticks:{callback:function(v){const l=this.getLabelForValue(v);return l.endsWith('-01')||l.endsWith('-15')?l.slice(5):''},autoSkip:false}}},plugins:{tooltip:{callbacks:{label:i=>`Tone ${i.raw.toFixed(2)}`}}}})});
  const v=g.map(r=>r.tone);const mean=v.reduce((a,b)=>a+b,0)/v.length;const neg=v.filter(x=>x<0).length;
  document.getElementById('sl-tone').innerHTML=`<span>Days with coverage <b>${v.length}</b></span><span>Mean tone <b>${fmt(mean,2)}</b></span><span>Negative days <b>${neg}</b></span><span>Most negative <b>${g.reduce((a,b)=>b.tone<a.tone?b:a).d}</b></span><span>Most positive <b>${g.reduce((a,b)=>b.tone>a.tone?b:a).d}</b></span>`;
}

/* ---------- coverage ---------- */
const cov=[
 ['ok','Google Trends (India)','Pulled via the Trends explore endpoint: 10 terms, monthly, Jan 2016–Oct 2026, each on its own 0–100 scale. Substitutes for the brief\'s Google Trends item.'],
 ['ok','Wikipedia pageviews','Wikimedia REST API, 13 articles plus total English-Wikipedia views for normalisation. A second public-attention measure, mostly English-reading.'],
 ['ok','Lok Sabha questions','Digital Sansad API, all 602 Department of Space questions 2014–2026. India\'s equivalent of Hansard / congress.gov for policy discourse.'],
 ['ok','Launch and satellite catalogue','Jonathan McDowell\'s GCAT, updated 2 Nov 2026: every launch from Indian soil and every Indian-owned payload.'],
 ['ok','NSE equity prices','Yahoo Finance chart API, monthly and daily adjusted closes for seven suppliers and the Nifty 50. Substitutes for SEC filings and earnings calls: India\'s space firms are unlisted.'],
 ['part','GDELT news tone','Free DOC API gives a rolling 3-month window only. Full 2015– history needs GDELT\'s BigQuery tables, which would enable a monthly news-sentiment series.'],
 ['part','Private funding','Tracxn is paywalled; only press-reported totals are available, and they disagree across vintages. Deal-level data would need a Tracxn or Venture Intelligence licence.'],
 ['part','IN-SPACe authorisations','Three cumulative counts from Parliament replies. A dated register (or an RTI request) would turn this into a usable series.'],
 ['no','X (Twitter)','Not collected. The API is paid and was not available here. Academic access or a licensed archive would be needed.'],
 ['no','Reddit','Not collected. Reddit endpoints were blocked from this environment and the Pushshift mirror was down on 5 Nov 2026.'],
 ['no','Spectrum / ITU filings','Not collected. ITU Space Network List filings by India would be a strong capacity indicator; the data is behind ITU\'s BR IFIC subscription.']
];
const stl={ok:['st-ok','Collected'],part:['st-part','Partial'],no:['st-no','Not available']};
document.getElementById('cov').innerHTML=cov.map(([s,h,p])=>`<div class="panel"><span class="status ${stl[s][0]}"><i></i>${stl[s][1]}</span><h3 style="margin:6px 0 4px">${h}</h3><p>${p}</p></div>`).join('');

/* ---------- sources ---------- */
const src=[
 ['Wikimedia REST pageviews API','https://wikimedia.org/api/rest_v1/'],
 ['Google Trends, India','https://trends.google.com/trends/explore?geo=IN&q=ISRO'],
 ['Digital Sansad, Lok Sabha questions','https://sansad.in/ls/questions/questions-and-answers'],
 ['GCAT launch and satellite catalogues (J. McDowell)','https://planet4589.org/space/gcat/'],
 ['Yahoo Finance chart data (NSE)','https://finance.yahoo.com/quote/%5ENSEI/'],
 ['GDELT DOC 2.0 API','https://api.gdeltproject.org/api/v2/doc/doc?query=isro&mode=timelinetone'],
 ['PIB: Cabinet approves space sector reforms (24 Jun 2020)','https://pib.gov.in/PressReleasePage.aspx?PRID=1633899'],
 ['Business Standard: Cabinet approves Indian Space Policy 2023 (6 Apr 2023)','https://business-standard.com/india-news/cabinet-gives-approval-to-indian-space-policy-2023-lays-roles-for-isro-123040601172_1.html'],
 ['PIB: Space FDI amendment (Feb 2024)','https://pib.gov.in/PressReleasePage.aspx?PRID=2007876'],
 ['ISRO: ₹1,000 crore VC fund approved (24 Oct 2024)','https://www.isro.gov.in/UnionCabinetapprovesestablishment_INSPACe.html'],
 ['Chandrayaan-3 landing time (18:04 IST, 23 Aug 2023)','https://thesouthfirst.com/news/604-pm-23-august-chandrayaan-3-all-set-to-soft-land-on-the-moon/']
].concat(D.funding.map(f=>[f.pub+' ('+f.vintage+')',f.url]).filter((v,i,a)=>a.findIndex(x=>x[1]===v[1])===i))
 .concat([['Millennium Post: Financing India\'s space future','https://www.millenniumpost.in/opinion/financing-indias-space-future-674267']]);
document.getElementById('src').innerHTML=src.map(([t,u])=>`<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('');

/* ---------- render & theme ---------- */
function drawAll(){if(!window.Chart)return;Chart.defaults.font.family='IBM Plex Sans';drawIndex();drawYear();drawC3();drawXC();drawParl();drawFund();drawComm();drawTone()}
drawAll();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',drawAll);
new MutationObserver(drawAll).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
document.fonts&&document.fonts.ready.then(drawAll);
