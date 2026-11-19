const D=JSON.parse(document.getElementById('data').textContent);
const S=D.stats,SP=D.space;const {C,base,mk,fmt,yearTick,axisTitle,onTheme}=SDS;
const fp=p=>p<0.001?'<0.001':Number(p).toFixed(3),f2=v=>Number(v).toFixed(2),f1=v=>Number(v).toFixed(1),neg=s=>String(s).replace('-','−');
const ev=S.events,EV=l=>ev.find(e=>e.label===l);
const wil=EV('Willow chip'),hua=EV('Nvidia CEO remark'),maj=EV('Majorana 1');
const q1=S.q1_event,q2=S.q2_revenue,q4=S.q4;
const simple=c=>100*(Math.exp(c/100)-1);
const RS=S.q3_rev_annual_m,shareOf=(y,f)=>100*RS[y][f]/Object.values(RS[y]).reduce((a,b)=>a+b,0);
const ionq22=shareOf(2022,'IonQ'),ionq25=shareOf(2025,'IonQ');
const QM=(()=>{const o={};for(const [m,v] of Object.entries(D.FAI)){if(v==null)continue;const y=m.slice(0,4),q=Math.floor((+m.slice(5,7)-1)/3)+1,k=`${y}Q${q}`;(o[k]=o[k]||[]).push(v)}const r={};for(const k in o)r[k]=o[k].reduce((a,b)=>a+b,0)/o[k].length;return r})();
const revQ=Object.keys(S.rev_total_m);
const fedTot=Object.values(S.fed_by_firm_total_m).reduce((a,b)=>a+b,0);

/* ---------- findings ---------- */
const F=[
 {t:'yes',tt:'Events move attention',k:'+2.56 SD',s:' event months',p:`The four pre-specified event months lift the Field Attention Index by 2.56 standard deviations (95% CI 1.14 to 3.99), on top of its trend. The single highest month is October 2019, when Google claimed "quantum supremacy". In US space, flagship-mission months add 3.67.`},
 {t:'mixed',tt:'Co-trend, not co-movement',k:`ρ = ${f2(q2.level.rho)}`,s:' levels',p:`Attention and the listed firms' revenue rose together over ${revQ.length} quarters (Spearman ρ = ${f2(q2.level.rho)}), but quarter-to-quarter changes are not reliably related (ρ = ${f2(q2.change.rho)}, p = ${fp(q2.change.p)}). US space shows the same: attention and launches share an upward drift but do not move together month to month.`},
 {t:'mixed',tt:'One firm\'s revenue, others\' headlines',k:`${Math.round(ionq25)}%`,s:' IonQ, 2025',p:`IonQ's share of the four listed firms' revenue rose from ${Math.round(ionq22)}% in 2022 to ${Math.round(ionq25)}% in 2025, partly through acquisitions. But the largest attention spikes followed announcements by Google and Microsoft, which are not quantum pure-plays. In space, SpaceX receives most of the attention paid to private firms, but its share of attention moves independently of its share of launches.`},
 {t:'mixed',tt:'Prices lead attention',k:`p = ${q4.ret_to_firm[3]}`,s:' lag 3',p:`Basket returns precede changes in attention to the listed firms at lags of 1, 3 and 6 months (p = ${q4.ret_to_firm[1]}, ${q4.ret_to_firm[3]}, ${q4.ret_to_firm[6]}); attention never precedes returns (p ≥ ${Math.min(...Object.values(q4.firm_to_ret),...Object.values(q4.field_to_ret)).toFixed(2)}). The same direction as in space, and somewhat stronger.`},
 {t:'yes',tt:'A remark repriced the sector',k:`${neg(f1(hua.c01_simple))}%`,s:' 2-day',p:`After Nvidia's chief executive said useful quantum computers were 15 to 30 years away, the listed pure-plays fell ${Math.abs(hua.c01_simple).toFixed(1)}% against the market over two days (cumulative abnormal log return ${neg(f1(hua.c01))}, t = ${neg(hua.t01)}), the only one of three events to survive the multiple-testing correction. Google's Willow chip and Microsoft's Majorana 1 produced no significant two-day reaction.`}
];
document.getElementById('findings').innerHTML=F.map(f=>`<div class="finding"><span class="tag t-${f.t}"><i></i>${f.tt}</span><div class="k">${f.k}<small>${f.s}</small></div><p>${f.p}</p></div>`).join('');

/* ---------- Q1 ---------- */
const EVM={'2019-10':'Sycamore','2024-12':'Willow','2025-01':'Nvidia CEO','2025-02':'Majorana 1'};
function drawQ1(){
  const c=C();const X=Object.keys(D.FAI);
  document.getElementById('lg-q1').innerHTML=[[c.s1,'Field Attention Index'],[c.s2,'Firm Attention Index (IonQ, Rigetti, D-Wave)'],[c.bad,'Pre-specified event month']].map(([col,l])=>`<span><i class="sw dot" style="background:${col}"></i>${l}</span>`).join('');
  mk('c-q1',{type:'line',data:{labels:X,datasets:[
    {label:'Field Attention Index',data:X.map(m=>D.FAI[m]),borderColor:c.s1,backgroundColor:c.s1,borderWidth:2,tension:.15,pointRadius:X.map(m=>EVM[m]?5:0),pointBackgroundColor:c.bad,pointBorderColor:c.bad},
    {label:'Firm Attention Index',data:X.map(m=>D.FIRM[m]),borderColor:c.s2,backgroundColor:c.s2,borderWidth:1.6,pointRadius:0,tension:.15}]},
    options:base(c,{scales:{x:{ticks:{callback:yearTick}},y:{title:axisTitle(c,'z-score')}},plugins:{tooltip:{callbacks:{afterTitle:it=>EVM[it[0].label]?'Event: '+EVM[it[0].label]:''}}}})});
}
document.getElementById('sl-q1').innerHTML=`<span>Event months: <b>+2.56 SD</b> (95% CI 1.14 to 3.99)</span><span>R² trend only <b>${q1.R2_trend_only}</b>, with event months <b>${q1.R2}</b></span><span>n = ${q1.n} months, HAC standard errors</span>`;
document.getElementById('t-top').innerHTML='<div class="tablewrap"><table><thead><tr><th>Month</th><th class="num">Field index</th><th>Pre-specified event</th></tr></thead><tbody>'+S.q1_top_months.map(([m,v])=>`<tr><td>${EVM[m]?'<b>'+m+'</b>':m}</td><td class="num">${f2(v)}</td><td>${EVM[m]||''}</td></tr>`).join('')+'</tbody></table></div>';
const fe=S.fai_event_months;
document.getElementById('read1').innerHTML=`
<p><b>Attention is event-driven, as in space.</b> All four months picked in advance are among the eight highest-attention months of the decade: Google's "quantum supremacy" paper (October 2019, z = ${f2(fe['2019-10'])}), Google's Willow chip (December 2024, ${f2(fe['2024-12'])}), the Nvidia chief executive's remark (January 2025, ${f2(fe['2025-01'])}) and Microsoft's Majorana 1 (February 2025, ${f2(fe['2025-02'])}). Adding them roughly doubles the share of monthly variation explained (R² from ${q1.R2_trend_only} to ${q1.R2}).</p>
<p>Three of these four events were announcements by large technology firms that are not quantum pure-plays, and the fourth was a comment by one. Attention to the listed firms (orange) rose only from late 2024, when their share prices did.</p>
<p>Some high months were not pre-specified (September and November 2019, April and May 2026). They are reported, but not used to fit the model.</p>`;

/* ---------- Q2 ---------- */
const FIRMS=['IonQ','Rigetti','D-Wave','QCI'];
function drawRev(){
  const c=C();const cols=[c.s1,c.s2,c.s3,c.s7];
  document.getElementById('lg-rev').innerHTML=FIRMS.map((f,i)=>`<span><i class="sw dot" style="background:${cols[i]}"></i>${f==='QCI'?'Quantum Computing Inc':f}</span>`).join('')+`<span><i class="sw dot" style="background:${c.ink2}"></i>Field attention (right axis)</span>`;
  mk('c-rev',{type:'bar',data:{labels:revQ,datasets:[...FIRMS.map((f,i)=>({label:f,data:revQ.map(q=>S.rev_by_firm_m[f][q]),backgroundColor:cols[i],borderRadius:1,stack:'r',yAxisID:'y'})),
    {type:'line',label:'Field attention',data:revQ.map(q=>QM[q]),borderColor:c.ink2,backgroundColor:c.ink2,borderWidth:2,pointRadius:2,yAxisID:'y2'}]},
    options:base(c,{scales:{x:{stacked:true,ticks:{callback:function(v){const l=this.getLabelForValue(v);return l.endsWith('Q1')?l.slice(0,4):''}}},y:{stacked:true,title:axisTitle(c,'US$ millions')},y2:{position:'right',grid:{display:false},title:axisTitle(c,'z-score'),ticks:{color:c.muted}}}})});
}
function drawSEC(){
  const c=C();const R=S.sec;const yrs=R.map(r=>String(r.year));
  mk('c-sec',{type:'bar',data:{labels:yrs,datasets:[{label:'10-K hits',data:R.map(r=>r.k10),backgroundColor:c.s1,borderRadius:2,yAxisID:'y'},{type:'line',label:'All forms',data:R.map(r=>r.all),borderColor:c.s2,backgroundColor:c.s2,borderWidth:2,pointRadius:2,yAxisID:'y2'}]},
    options:base(c,{scales:{y:{title:axisTitle(c,'10-K hits')},y2:{position:'right',grid:{display:false},title:axisTitle(c,'all forms'),ticks:{color:c.muted}}}})});
}
document.getElementById('t-fed').innerHTML='<div class="tablewrap" style="margin:8px 0 10px"><table><thead><tr><th>Firm</th><th class="num">US$m</th></tr></thead><tbody>'+Object.entries(S.fed_by_firm_total_m).map(([f,v])=>`<tr><td>${f==='QCI'?'Quantum Computing Inc':f}</td><td class="num">${v.toFixed(2)}</td></tr>`).join('')+`<tr><td><b>Total</b></td><td class="num"><b>${fedTot.toFixed(2)}</b></td></tr></tbody></table></div>`;
const rt=S.rev_total_m,sec=y=>S.sec.find(r=>r.year===y);
document.getElementById('read2').innerHTML=`
<p><b>Co-trend, not co-movement.</b> Combined quarterly revenue of the four listed firms grew from $${f1(rt[revQ[0]])}m in ${revQ[0]} to $${f1(rt[revQ.at(-1)])}m in ${revQ.at(-1)}, and the quarterly level of field attention rose with it (ρ = ${f2(q2.level.rho)}, p = ${fp(q2.level.p)}, n = ${q2.n}). Quarter to quarter the link is weak: changes in attention and in log revenue have ρ = ${f2(q2.change.rho)} (p = ${fp(q2.change.p)}), and for attention to the listed firms ρ = ${f2(q2.firm_change.rho)}. Two series that both grow will correlate in levels; that alone does not show that attention tracks revenue.</p>
<p>Revenue is commercial activity, not physical capacity, and it is concentrated (Q3). IonQ's revenue from mid-2025 includes companies it acquired.</p>
<p><b>Filings.</b> Annual reports mentioning quantum computing rose from ${sec(2016).k10} in 2016 to ${sec(2025).k10} in 2025 and track annual attention (ρ = ${f2(S.q2_sec10k.rho)}, p = ${fp(S.q2_sec10k.p)}). Mentions across all filings jumped from ${sec(2024).all.toLocaleString()} in 2024 to ${sec(2025).all.toLocaleString()} in 2025, after the price surge of late 2024.</p>
<p><b>Government contracts</b> to quantum firms are small: $${fedTot.toFixed(0)}m in standard contracts over the decade, against $${SP.ct_spacex_total.toLocaleString()}m to SpaceX alone. They show no reliable link with attention (annual ρ = ${f2(S.q2_fed.rho)}, p = ${fp(S.q2_fed.p)}).</p>`;

/* ---------- Q3 ---------- */
const WS=S.q3_wiki_share;
document.getElementById('t-share').innerHTML='<div class="tablewrap"><table><thead><tr><th>Year</th><th class="num">IonQ revenue</th><th class="num">Rigetti</th><th class="num">D-Wave</th><th class="num">QCI</th><th class="num">IonQ reading</th><th class="num">Rigetti</th><th class="num">D-Wave</th></tr></thead><tbody>'+
 [2022,2023,2024,2025,2026].map(y=>`<tr><td>${y}</td>${RS[y]?FIRMS.map(f=>`<td class="num">${Math.round(shareOf(y,f))}%</td>`).join(''):'<td class="num">·</td><td class="num">·</td><td class="num">·</td><td class="num">·</td>'}${['IonQ','Rigetti','D-Wave'].map(f=>`<td class="num">${Math.round(WS[y][f])}%</td>`).join('')}</tr>`).join('')+'</tbody></table></div>';
const [ftop,fshare]=S.q3_fed_top_share;
document.getElementById('read3').innerHTML=`
<p><b>Revenue is concentrating, attention is not.</b> IonQ's share of the four firms' revenue rose from ${Math.round(ionq22)}% in 2022 to ${Math.round(ionq25)}% in 2025 (${RS[2025].IonQ.toFixed(1)} of ${Object.values(RS[2025]).reduce((a,b)=>a+b,0).toFixed(1)} US$m). Part of that came from acquisitions, including Capella Space (completed July 2025) and Oxford Ionics (September 2025). Reading of the three pure-plays' Wikipedia articles stayed spread out: IonQ had ${Math.round(WS[2025].IonQ)}% in 2025 and ${Math.round(WS[2026].IonQ)}% in 2026 so far.</p>
<p>Federal contracts are concentrated differently again: ${ftop} received ${fshare}% of the small total.</p>
<p><b>The dominant players sit outside the category.</b> The firms that moved attention (Google, Microsoft, Nvidia) are not quantum pure-plays, and their quantum activity cannot be separated in their accounts. In space, the dominant firm (SpaceX) is itself the category's leading operator: it flies most launches, deploys most satellites, wins most contracts and receives most corporate attention, although its share of attention does not track its share of launches.</p>`;

/* ---------- Q4 ---------- */
const rowsEv=[wil,EV('Willow chip (alt day 0)'),hua,EV('Nvidia CEO remark (alt day 0)'),maj,EV('Majorana 1 (alt day 0)')];
document.querySelector('#t-ev tbody').innerHTML=rowsEv.map(e=>{const alt=e.label.includes('alt');const sig=Math.abs(e.t01)>=1.96;return `<tr${alt?' style="opacity:.7"':''}><td>${e.label}</td><td>${e.t0}</td><td class="num">${sig?'<b>':''}${neg(fmt(e.c01,2))}${sig?'</b>':''}</td><td class="num">${neg(e.t01)}</td><td class="num">${e.p01_bh!=null?(e.p01_bh<0.001?'<0.001':e.p01_bh.toFixed(3)):'·'}</td><td class="num">${neg(fmt(e.c05,2))}</td><td class="num">${neg(e.t05)}</td><td class="num">${neg(fmt(e.pre,2))}</td><td class="num">${neg(fmt(e.q_c01,2))}</td></tr>`}).join('');
function drawMk(){
  const c=C();const M=D.market;let a=0,b=0;const X=M.map(r=>r.m),B=M.map(r=>(a+=r.b,a)),SPc=M.map(r=>(b+=r.sp,b));
  document.getElementById('lg-mk').innerHTML=[[c.s1,'Quantum basket'],[c.ink2,'S&P 500']].map(([col,l])=>`<span><i class="sw dot" style="background:${col}"></i>${l}</span>`).join('');
  mk('c-mk',{type:'line',data:{labels:X,datasets:[{label:'Quantum basket',data:B,borderColor:c.s1,backgroundColor:c.s1,borderWidth:2,pointRadius:0,tension:.1},{label:'S&P 500',data:SPc,borderColor:c.ink2,backgroundColor:c.ink2,borderWidth:1.5,pointRadius:0,tension:.1}]},
    options:base(c,{scales:{x:{ticks:{callback:yearTick}},y:{title:axisTitle(c,'cumulative log return')}}})});
}
const mkt=D.market;const cum=mkt.reduce((s,r)=>s+r.b,0),cumsp=mkt.reduce((s,r)=>s+r.sp,0);
document.getElementById('read4').innerHTML=`
<p><b>One event survives.</b> The Nvidia chief executive's remark at an analyst question-and-answer session on Tuesday 7 January 2025 was followed by a ${Math.abs(hua.c01_simple).toFixed(1)}% two-day fall in the basket against the market (CAR ${neg(f1(hua.c01))} log points, t = ${neg(hua.t01)}), with all three firms down (IonQ ${neg(f1(hua.firms.IONQ[0]))}, Rigetti ${neg(f1(hua.firms.RGTI[0]))}, D-Wave ${neg(f1(hua.firms.QBTS[0]))} log points). Moving day 0 to 7 January gives the same result. The broad quantum ETF fell ${Math.abs(hua.q_c01).toFixed(1)} log points.</p>
<p><b>Google's Willow chip</b> (Monday 9 December 2024) produced no significant two-day reaction (${fmt(wil.c01,1)}, t = ${wil.t01}), but the basket had already risen ${f1(wil.pre)} log points in the five days before (t = ${wil.pre_t}) and rose ${f1(wil.c05)} over six days (t = ${wil.t05}), driven by Rigetti. <b>Microsoft's Majorana 1</b> produced nothing significant.</p>
<p><b>Prices lead attention.</b> Monthly basket returns precede changes in attention to the listed firms (Granger p = ${q4.ret_to_firm[1]}, ${q4.ret_to_firm[3]}, ${q4.ret_to_firm[6]} at lags 1, 3, 6) and to the field at lag 1 (p = ${q4.ret_to_field[1]}); attention does not precede returns. Same month, returns and firm attention move together (r = ${f2(S.q4_contemp.firm[0])}). n = ${q4.n} months. This is predictive ordering, not proof that prices cause attention.</p>
<p>Over the whole period the basket's cumulative log return was ${f2(cum)}, against ${f2(cumsp)} for the S&amp;P 500, with very large swings in between.</p>`;

/* ---------- comparison ---------- */
const CMP=[
 ['Do salient events move attention?',`Yes: flagship-mission months +3.67 SD (95% CI 2.45 to 4.88)`,`Yes: event months +2.56 SD (95% CI 1.14 to 3.99)`,'yes'],
 ['Does attention track the build-out?',`Co-trend only: attention and launches drift up together but do not move together month to month (launch-month response at most 0.06 SD)`,`Co-trend only: revenue and attention rise together (ρ ${f2(q2.level.rho)}), quarterly changes weakly related (ρ ${f2(q2.change.rho)}, p ${fp(q2.change.p)})`,'yes'],
 ['Does one firm dominate?',`Yes, and it is the category's own leader: SpaceX flew ${SP.spacex_2025} of ${SP.launches_2025} US launches in 2025 and received ${SP.ct_share_min}–${SP.ct_share_max}% of federal contract money to the firms tracked`,`Revenue increasingly IonQ (${Math.round(ionq25)}% in 2025, partly acquired); attention spikes came from Google, Microsoft and Nvidia, outside the listed category`,'partly'],
 ['Do prices lead attention?',`Some evidence: returns precede NewSpace attention at lag 1 (p ${SP.granger[1]}); attention never leads returns`,`Some evidence, stronger: returns precede firm attention at lags 1, 3, 6 (p ≤ ${Math.max(q4.ret_to_firm[1],q4.ret_to_firm[3],q4.ret_to_firm[6])}); attention never leads returns`,'yes'],
 ['Which event repriced the sector?',`The dominant firm's arrival: peers' two-day CAR ${neg(f1(SP.ipo_c))} on SpaceX's first trading day (t ${neg(SP.ipo_t)})`,`An outsider's opinion: the pure-plays' two-day CAR ${neg(f1(hua.c01))} (t ${neg(hua.t01)}), a ${Math.abs(simple(hua.c01)).toFixed(1)}% fall, after Nvidia's chief executive said useful machines were 15–30 years away`,'partly'],
 ['Do technical milestones move prices?','No robust reaction: Artemis II and Chandrayaan-3 not significant once correctly timed','No significant two-day reaction to Willow or Majorana 1','yes']];
const lab={yes:['st-ok','Same'],partly:['st-part','Partly'],no:['st-no','Different']};
document.querySelector('#t-cmp tbody').innerHTML=CMP.map(([q,a,b,s])=>`<tr><td><b>${q}</b></td><td>${a}</td><td>${b}</td><td><span class="status ${lab[s][0]}"><i></i>${lab[s][1]}</span></td></tr>`).join('');
document.getElementById('read5').innerHTML=`
<p class="note">Two-day CARs in this table are market-model abnormal returns, the measure used on the space pages and in the working paper.</p>
<p>The core of the space finding holds in a second technology. In both, public attention spikes around a few salient events, rises with the build-out only as a shared trend, and follows share prices rather than leading them. In both, a sudden repricing of the whole listed group came not from a technical milestone but from a single, highly visible moment.</p>
<p>The difference is <b>where the dominant player sits</b>. In space, SpaceX is the category's leading operator, so attention, launches, contracts and market reactions all point to one firm inside the category. In quantum computing, the companies that move attention (Google, Microsoft, Nvidia) are outside the listed category, while revenue among the listed firms is concentrating in IonQ. Attention-based indicators can therefore be captured by a dominant firm inside an industry or by large players outside it.</p>
<p>This is a comparison of patterns, not levels: launches, revenue and contracts measure different things, and the samples are short. It strengthens the case that the space pattern is not unique to space; it does not establish a general law.</p>`;

document.getElementById('lim').innerHTML=`
<p><b>Build-out.</b> Quantum computing has no public catalogue of machines or qubits comparable to the launch catalogue. Revenue of four listed firms is a commercial measure, not physical capacity; IonQ's revenue from mid-2025 includes acquired companies, and D-Wave reported a single $15.0m quarter in early 2025. Large firms' quantum activity (Google, IBM, Microsoft) cannot be separated from their accounts.</p>
<p><b>Attention.</b> Google Trends values are single samples on each term's own scale; "D-Wave" may include unrelated searches. Wikipedia is English-only. Hacker News reflects a technology audience.</p>
<p><b>Government money.</b> The contract figures miss grants, national-laboratory funding and other transaction agreements, which carry most federal quantum funding.</p>
<p><b>Samples.</b> ${q2.n} quarters of revenue, ${q4.n} months of prices, 3 events and 10 years of contracts. Results are reported as estimates with their uncertainty; a non-significant result is not evidence of no effect.</p>
<p><b>Order of work.</b> The plan was written before any quantum data were pulled, but after the space results were known, so the questions mirror what was found in space.</p>`;

const src=[
 ['Analysis plan (code/quantum/PLAN.md, 13 Nov 2026)','code/quantum/PLAN.md'],
 ['Google Trends, United States: quantum computing','https://trends.google.com/trends/explore?geo=US&q=quantum%20computing'],
 ['Wikimedia REST pageviews API','https://wikimedia.org/api/rest_v1/'],
 ['Hacker News Search API (Algolia)','https://hn.algolia.com/api'],
 ['Yahoo Finance chart data','https://finance.yahoo.com/quote/IONQ/'],
 ['SEC XBRL company facts API','https://www.sec.gov/search-filings/edgar-application-programming-interfaces'],
 ['SEC EDGAR full-text search','https://efts.sec.gov/LATEST/search-index?q=%22quantum%20computing%22'],
 ['USAspending.gov federal award data (API v2)','https://api.usaspending.gov/'],
 ['Arute et al. (2019) Quantum supremacy using a programmable superconducting processor, Nature 574, 505–510','https://doi.org/10.1038/s41586-019-1666-5'],
 ['Google: Meet Willow, our state-of-the-art quantum chip (9 Dec 2024)','https://blog.google/technology/research/google-willow-quantum-chip/'],
 ['Axios: Quantum computing stock bubble pops after Nvidia CEO warning (8 Jan 2025)','https://www.axios.com/2025/01/08/quantum-computing-stock-nvidia-jensen-huang'],
 ['Microsoft: Microsoft unveils Majorana 1 (19 Feb 2025)','https://azure.microsoft.com/en-us/blog/quantum/2025/02/19/microsoft-unveils-majorana-1-the-worlds-first-quantum-processor-powered-by-topological-qubits/'],
 ['The Quantum Insider: IonQ completes acquisition of Capella Space (15 Jul 2025)','https://thequantuminsider.com/2025/07/15/ionq-completes-acquisition-of-capella-space/'],
 ['Business Wire: IonQ completes acquisition of Oxford Ionics (17 Sep 2025)','https://www.businesswire.com/news/home/20250917776178/en/ionq-completes-acquisition-of-oxford-ionics-rapidly-accelerating-its-quantum-computing-roadmap']
];
document.getElementById('src').innerHTML=src.map(([t,u])=>`<li><a href="${u}"${u.startsWith('http')?' target="_blank" rel="noopener"':''}>${t}</a></li>`).join('');

onTheme(()=>{drawQ1();drawRev();drawSEC();drawMk()});
