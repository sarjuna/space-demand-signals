const D=JSON.parse(document.getElementById('data').textContent);
const S=D.stats;const {C,base,mk,fmt,yearTick,axisTitle,onTheme}=SDS;
const A=D.annual;const Ay=y=>A.find(a=>a.year===y);
const ev=D.events;const E=lbl=>ev.find(e=>e.label.startsWith(lbl));
const pct=v=>(v*100).toFixed(1)+'%';
const hnE=S.hn_events;const HE=l=>hnE.find(e=>e.label.startsWith(l));

/* ---------- findings ---------- */
const ipo=E('SpaceX IPO'),art=E('Artemis II');
const g=S.granger_ret_to_NAI,g2=S.granger_NAI_to_ret,GS=S.granger_by_source,WP=S.wiki_per_million,WR=S.wiki_vs_launch,RB=S.robust_noWiki;
const nasaDrop=Math.round((1-WP.NASA['2025']/WP.NASA['2016'])*100);
const gs=GS.search.ret_to_att;
const F=[
 {t:'mixed',tt:'Attention co-trends',k:`${(Ay(2025).launches/Ay(2016).launches).toFixed(1)}×`,s:' launches',p:`US launches rose from ${Ay(2016).launches} (2016) to ${Ay(2025).launches} (2025), and NewSpace attention rose with them (annual ρ = ${S.annual_spearman.NAI.rho.toFixed(2)}). Month to month, once the shared trend is removed, launch count adds nothing (t = ${S.ols_NAI_trend.launches.t}). NASA's share of Wikipedia reading fell ${nasaDrop}% over the same decade.`},
 {t:'mixed',tt:'Prices lead searches',k:`p ≈ ${Math.max(gs[1],gs[2],gs[3]).toFixed(2)}`,s:'',p:`NewSpace stock returns Granger-cause the next months' Google searches for space firms at lags 1–3 (p = ${gs[1]}, ${gs[2]}, ${gs[3]}). For the full attention index, which adds Wikipedia and Hacker News, this holds only at lag 1 (p = ${g[1]}). Attention never leads prices (p ≥ ${Math.min(g2[1],g2[2],g2[3]).toFixed(2)}).`},
 {t:'yes',tt:'SpaceX IPO drained peers',k:`${fmt(ipo.b_c01,1)}%`,s:' 2-day',p:`On SpaceX's first trading day the other listed NewSpace stocks fell ${Math.abs(ipo.b_c01).toFixed(1)}% against the S&P 500 over two days (t = ${ipo.b_t01}). Artemis II lifted the UFO space ETF ${fmt(art.u_c01,1)}% (t = ${art.u_t01}).`},
 {t:'mixed',tt:'Policy moved first',k:'114th',s:' Congress',p:`Commercial-space legislating peaked in 2015–16, years before the launch boom. The commercial share of space bills rose from ${pct(S.bills_com_share_eras.pre_113_115)} to ${pct(S.bills_com_share_eras.post_117_119)} (not significant, p = ${S.bills_fisher_p}). FCC space rulemaking tracks launch cadence (ρ = ${S.fcc_vs_launch.rho.toFixed(2)}).`},
 {t:'no',tt:'Sentiment cooled',k:`${S.hn_sent_era.pre_2016_19.toFixed(3)} → ${S.hn_sent_era.post_2023_26.toFixed(3)}`,s:'',p:`Mean title sentiment on Hacker News fell from 2016–19 to 2023–26 and the negative share rose from ${pct(S.hn_sent_era.neg_pre)} to ${pct(S.hn_sent_era.neg_post)}, while capacity grew. Starship's January 2025 loss produced the sharpest drop (p = ${HE('Starship IFT-7').p}).`},
 {t:'mixed',tt:'Capacity is concentrated',k:`${Math.round(S.launch_growth.spacex_share_2025*100)}%`,s:' SpaceX',p:`SpaceX flew ${Ay(2025).spacex} of ${Ay(2025).launches} US launches in 2025, and Starlink was ${Math.round(S.payloads.starlink_share_2016_2025*100)}% of US-owned satellites launched 2016–2025. Most "US demand" indicators are partly indicators of one company.`}
];
document.getElementById('findings').innerHTML=F.map(f=>`<div class="finding"><span class="tag t-${f.t}"><i></i>${f.tt}</span><div class="k">${f.k}<small>${f.s}</small></div><p>${f.p}</p></div>`).join('');

/* ---------- RQ1 ---------- */
let view='idx';
function drawIndex(){
  const c=C();const X=D.PAI.x;const al=s=>{const m=Object.fromEntries(s.x.map((x,i)=>[x,s.y[i]]));return X.map(x=>m[x]??null)};
  let ds=[],leg=[];
  if(view==='idx'){ds=[{label:'Public Attention Index',data:al(D.PAI),borderColor:c.s1,backgroundColor:c.s1,borderWidth:2,pointRadius:0,tension:.15},{label:'NewSpace Attention Index',data:al(D.NAI),borderColor:c.s2,backgroundColor:c.s2,borderWidth:2,pointRadius:0,tension:.15}];leg=[[c.s1,'Public Attention Index'],[c.s2,'NewSpace Attention Index']]}
  else{const Z=view==='pai'?D.PAIZ:D.NAIZ;const cols=[c.s1,c.s2,c.s3,c.s4,c.s7,c.ink2];ds=Object.keys(Z).map((k,i)=>({label:k,data:al(Z[k]),borderColor:cols[i%cols.length],backgroundColor:cols[i%cols.length],borderWidth:1.5,pointRadius:0,tension:.15}));leg=Object.keys(Z).map((k,i)=>[cols[i%cols.length],k])}
  document.getElementById('lg1').innerHTML=leg.map(([col,l])=>`<span><i class="sw" style="background:${col}"></i>${l}</span>`).join('');
  mk('c-index',{type:'line',data:{labels:X,datasets:ds},options:base(c,{scales:{y:{title:axisTitle(c,'z-score')},x:{ticks:{callback:yearTick,autoSkip:false}}},plugins:{tooltip:{filter:i=>i.raw!==null,callbacks:{label:i=>`${i.dataset.label}: ${i.raw.toFixed(2)}`}}}})});
}
['idx','pai','nai'].forEach(v=>document.getElementById('v-'+v).onclick=()=>{view=v;['idx','pai','nai'].forEach(w=>document.getElementById('v-'+w).setAttribute('aria-pressed',w===v));drawIndex()});
function drawWiki(){
  const c=C();const yrs=Object.keys(WP.NASA);const sets=[['NASA','NASA',c.s1],['SpaceX','SpaceX',c.s2],['Starlink','Starlink',c.s4],['SpaceX_Starship','Starship',c.s7],['United_States_Space_Force','Space Force',c.s3],['Rocket_Lab','Rocket Lab',c.ink2]];
  document.getElementById('lg-wiki').innerHTML=sets.map(([,l,col])=>`<span><i class="sw" style="background:${col}"></i>${l}</span>`).join('');
  mk('c-wiki',{type:'line',data:{labels:yrs,datasets:sets.map(([k,l,col])=>({label:l,data:yrs.map(y=>{const v=WP[k][y];return v==null?null:v}),borderColor:col,backgroundColor:col,borderWidth:2,pointRadius:2.5,tension:0,spanGaps:false}))},
    options:base(c,{scales:{y:{type:'logarithmic',min:0.3,max:40,title:axisTitle(c,'views per million (log scale)'),ticks:{callback:v=>[0.3,0.5,1,2,5,10,20,40].some(t=>Math.abs(t-v)<1e-6)?v:''}}},plugins:{tooltip:{filter:i=>i.raw!=null,callbacks:{label:i=>`${i.dataset.label}: ${i.raw.toFixed(1)} per million`,footer:it=>it[0].label==='2026'?'2026 to October':''}}}})});
}
function drawLaunchM(){
  const c=C();const X=D.launches.x;const fm=Object.fromEntries(D.fails.x.map((x,i)=>[x,D.fails.y[i]]));const fl={};D.failures.forEach(f=>{const m=f.date.slice(0,7);(fl[m]=fl[m]||[]).push(f.lv+' · '+f.flight)});
  mk('c-lm',{type:'bar',data:{labels:X,datasets:[{label:'Launch attempts',data:D.launches.y,backgroundColor:X.map(x=>fm[x]?c.bad:c.s1),borderRadius:2}]},
    options:base(c,{scales:{x:{ticks:{callback:yearTick,autoSkip:false}},y:{title:axisTitle(c,'launches')}},plugins:{tooltip:{callbacks:{label:i=>[`${i.raw} orbital attempts`].concat((fl[i.label]||[]).map(s=>'✕ failure: '+s))}}}})});
}
function drawLY(){
  const c=C();const yrs=A.map(a=>String(a.year));
  document.getElementById('lg-ly').innerHTML=[[c.s1,'SpaceX'],[c.s3,'Other US commercial'],[c.s7,'Government (SLS, ORS)'],[c.axis,'Rocket Lab, launched from New Zealand (not in US total)']].map(([col,l])=>`<span><i class="sw dot" style="background:${col}"></i>${l}</span>`).join('');
  const gov=A.map(a=>a.launches-a.spacex-a.other_com);
  mk('c-ly',{type:'bar',data:{labels:yrs,datasets:[{label:'SpaceX',data:A.map(a=>a.spacex),backgroundColor:c.s1,stack:'us',borderRadius:2},{label:'Other US commercial',data:A.map(a=>a.other_com),backgroundColor:c.s3,stack:'us',borderRadius:2},{label:'Government',data:gov,backgroundColor:c.s7,stack:'us',borderRadius:2},{label:'Rocket Lab (NZ)',data:A.map(a=>a.rocketlab_nz),backgroundColor:c.axis,stack:'nz',borderRadius:2}]},
    options:base(c,{scales:{x:{stacked:true},y:{stacked:true,title:axisTitle(c,'launch attempts')}},plugins:{tooltip:{callbacks:{footer:it=>{const a=A[it[0].dataIndex];return `US total ${a.launches}, failures ${a.fails} · mean PAI ${a.PAI.toFixed(2)}, NAI ${a.NAI.toFixed(2)}`}}}}})});
}
const o1=S.ols_PAI,o2=S.ols_NAI,o3=S.ols_NAI_trend;
document.getElementById('sl1').innerHTML=`<span>PAI: flagship month <b>+${o1.flagship.coef.toFixed(2)} z</b> (t ${o1.flagship.t}); R² launches only <b>${o1.R2_launch_only}</b>, with flagships <b>${o1.R2}</b></span><span>NAI: SpaceX IPO month <b>+${o2.spacex_ipo.coef.toFixed(2)} z</b> (t ${o2.spacex_ipo.t}); Starship-flight month <b>+${o2.starship_flight.coef.toFixed(2)} z</b> (t ${o2.starship_flight.t})</span><span>NAI on launches + linear trend: launches <b>${o3.launches.coef.toFixed(3)}</b> (t ${o3.launches.t})</span>`;
document.getElementById('read1').innerHTML=`
<p>The US is the case India is not: build-out has been enormous and sustained. Orbital launch attempts went from ${Ay(2016).launches} in 2016 to ${Ay(2025).launches} in 2025, and ${Ay(2026).launches} by October 2026. Across years, NewSpace attention rises with cadence (ρ = ${S.annual_spearman.NAI.rho.toFixed(2)}, p = ${S.annual_spearman.NAI.p}, ${S.annual_spearman.n} years); public attention to NASA and the state programmes does so only weakly (ρ = ${S.annual_spearman.PAI.rho.toFixed(2)}, p = ${S.annual_spearman.PAI.p}).</p>
<p>Month to month the link disappears. A regression of NewSpace attention on launches and a linear time trend gives launches a coefficient of ${o3.launches.coef.toFixed(3)} (t = ${o3.launches.t}): attention and launches share an upward drift but do not move together. What does move attention is spectacle. Crewed and lunar flagship months (Crew Dragon Demo-2, Artemis I, Artemis II) add ${o1.flagship.coef.toFixed(1)} standard deviations to public attention; the SpaceX IPO month adds ${o2.spacex_ipo.coef.toFixed(1)} to NewSpace attention. Starship test-flight months add a smaller ${o2.starship_flight.coef.toFixed(2)} (t = ${o2.starship_flight.t}${Math.abs(o2.starship_flight.t)<1.96?', not significant':''}).</p>
<p><b>Wikipedia.</b> Reading tells a quieter story than searching. Per million English-Wikipedia views, the NASA article fell from ${WP.NASA['2016'].toFixed(1)} in 2016 to ${WP.NASA['2025'].toFixed(1)} in 2025, moving opposite to launch cadence (ρ = ${WR.NASA.rho.toFixed(2)}, p = ${WR.NASA.p}), the same slow fade seen for ISRO in India. SpaceX reading is flat (ρ = ${WR.SpaceX.rho.toFixed(2)}); only Rocket Lab's grows with cadence (${WP.Rocket_Lab['2016'].toFixed(1)} → ${WP.Rocket_Lab['2025'].toFixed(1)}, ρ = ${WR.Rocket_Lab.rho.toFixed(2)}). Adding Wikipedia does not change the month-to-month result; without it, annual ρ is ${RB.annual_spearman.NAI.rho.toFixed(2)} (NewSpace) and ${RB.annual_spearman.PAI.rho.toFixed(2)} (public).</p>
<p>Same pattern as India: attention follows a few dramatic moments. The difference is the long upward drift in NewSpace attention, which in the US reflects a decade of SpaceX, Starlink and a listed space sector.</p>`;

/* ---------- RQ2 ---------- */
function drawCum(){
  const c=C();const X=D.cum_ufo.x;const bm=Object.fromEntries(D.cum_excess.x.map((x,i)=>[x,D.cum_excess.y[i]]));const rel=v=>+((Math.exp(v)-1)*100).toFixed(1);
  document.getElementById('lg-cum').innerHTML=`<span><i class="sw" style="background:${c.s2}"></i>NewSpace basket</span><span><i class="sw" style="background:${c.s1}"></i>UFO space ETF</span>`;
  mk('c-cum',{type:'line',data:{labels:X,datasets:[{label:'NewSpace basket',data:X.map(x=>bm[x]!=null?rel(bm[x]):null),borderColor:c.s2,backgroundColor:c.s2,borderWidth:2,pointRadius:0},{label:'UFO ETF',data:D.cum_ufo.y.map(rel),borderColor:c.s1,backgroundColor:c.s1,borderWidth:2,pointRadius:0}]},
    options:base(c,{scales:{x:{ticks:{callback:yearTick,autoSkip:false}},y:{title:axisTitle(c,'cumulative return vs S&P 500, %')}},plugins:{tooltip:{filter:i=>i.raw!==null,callbacks:{label:i=>`${i.dataset.label}: ${fmt(i.raw,1)}%`}}}})});
}
function drawXC(){
  const c=C();const xc=S.xcorr_dNAI_exc;const ks=Object.keys(xc).map(Number).sort((a,b)=>a-b);
  mk('c-xc',{type:'bar',data:{labels:ks.map(k=>(k>0?'+':'')+k),datasets:[{label:'r',data:ks.map(k=>xc[k].r),backgroundColor:ks.map(k=>xc[k].p<0.05?c.s1:'transparent'),borderColor:c.s1,borderWidth:1.5,borderRadius:3}]},
    options:base(c,{scales:{y:{min:-0.4,max:0.4,title:axisTitle(c,'Pearson r')},x:{title:axisTitle(c,'k (months)')}},plugins:{tooltip:{callbacks:{label:i=>{const k=ks[i.dataIndex];return `r = ${xc[k].r.toFixed(3)}, p = ${xc[k].p.toFixed(3)}, n = ${xc[k].n}`}}}}})});
}
const sig=t=>Math.abs(t)>=1.96;
document.querySelector('#t-events tbody').innerHTML=ev.map(e=>{const cell=(v,t)=>`<td class="num ${sig(t)?'sig':''}">${v==null?'–':fmt(v,2)+'%'}</td><td class="num ${sig(t)?'sig':'dim'}">${t==null?'–':t.toFixed(2)}</td>`;
 return `<tr><td>${e.label}${e.excl&&e.excl!=='-'?` <span class="dim">(excl. ${e.excl})</span>`:''}</td><td class="mono" style="white-space:nowrap">${e.b_t0}</td><td class="num">${e.b_n}</td>${cell(e.b_c01,e.b_t01)}${cell(e.b_c05,e.b_t05)}${cell(e.u_c01,e.u_t01)}${cell(e.u_c05,e.u_t05)}</tr>`}).join('');
function drawWin(){
  const c=C();const w1=D.windows['SPACEX-IPO'],w2=D.windows['ARTEMIS-II'];const cum=w=>{let s=0;return w.map(r=>{s+=r.ar;return +s.toFixed(2)})};
  document.getElementById('lg-win').innerHTML=`<span><i class="sw" style="background:${c.s2}"></i>SpaceX IPO (12 Jun 2026)</span><span><i class="sw" style="background:${c.s1}"></i>Artemis II (t0 = 2 Apr 2026)</span>`;
  mk('c-win',{type:'line',data:{labels:w1.map(r=>r.k),datasets:[{label:'SpaceX IPO',data:cum(w1),borderColor:c.s2,backgroundColor:c.s2,borderWidth:2,pointRadius:w1.map(r=>r.k===0?5:0),pointBorderColor:c.surface,pointBorderWidth:2},{label:'Artemis II',data:cum(w2),borderColor:c.s1,backgroundColor:c.s1,borderWidth:2,pointRadius:w2.map(r=>r.k===0?5:0),pointBorderColor:c.surface,pointBorderWidth:2}]},
    options:base(c,{scales:{x:{title:axisTitle(c,'trading days from t0')},y:{title:axisTitle(c,'cumulative %')}},plugins:{tooltip:{callbacks:{title:i=>'day '+i[0].label,label:i=>{const w=i.datasetIndex?w2:w1;const r=w[i.dataIndex];return `${i.dataset.label}: ${fmt(i.raw,1)}% cumulative (${r.date}, daily ${fmt(r.ar,1)}%)`}}}}})});
}
const ift7=E('Starship IFT-7'),bg=E('Blue Ghost'),asat=E('Russian ASAT'),demo=E('Crew Dragon');
document.getElementById('read2').innerHTML=`
<p><b>Events.</b> Of 14 dated events, the clearest is the SpaceX listing: on its first day of trading the ten other NewSpace stocks lost ${Math.abs(ipo.b_c01).toFixed(1)}% against the S&P 500 over two days (t = ${ipo.b_t01}) and ${Math.abs(ipo.b_c05).toFixed(1)}% over six (t = ${ipo.b_t05}); the UFO ETF fell ${Math.abs(ipo.u_c01).toFixed(1)}% (t = ${ipo.u_t01}). The day before, the basket had risen ${D.windows['SPACEX-IPO'].find(r=>r.k===-1).ar.toFixed(1)}%. Smaller listed firms had served as stand-ins for SpaceX exposure; once the real thing could be bought, money moved.</p>
<p>Artemis II lifted the UFO ETF ${fmt(art.u_c01,1)}% (t = ${art.u_t01}); the NewSpace basket rose ${fmt(art.b_c01,1)}% (t = ${art.b_t01}). Starship tests, the IM-1 and Blue Ghost landings, the FCC debris rule and Executive Order 14335 show no significant two-day reaction. The large positive window after the January 2025 Starship loss (basket ${fmt(ift7.b_c01,1)}%, t = ${ift7.b_t01}; UFO ${fmt(ift7.u_c01,1)}%, t = ${ift7.u_t01}) is not about Starship: its second day is 21 January, the first session after the presidential inauguration pledging astronauts to Mars, when Rocket Lab rose 25.6% and Redwire 40.6% above the market. The six-day falls after Blue Ghost (${fmt(bg.b_c05,1)}%) and the Russian ASAT test (UFO ${fmt(asat.u_c05,1)}%) coincide with broad sell-offs and are not attributed to those events. With 56 tests, about three would clear |t| ≥ 1.96 by chance.</p>
<p><b>Lead–lag.</b> Where there is an arrow, it runs from prices to attention, and it runs through search. Basket returns Granger-cause the following months' Google searches for space firms at every lag tested (p = ${gs[1]}, ${gs[2]}, ${gs[3]}), but not Wikipedia reading (p ≥ ${Math.min(...Object.values(GS.wikipedia.ret_to_att)).toFixed(2)}) or Hacker News volume (p ≥ ${Math.min(...Object.values(GS.hackernews.ret_to_att)).toFixed(2)}). For the combined index the effect survives only at one month (p = ${g[1]}, ${g[2]}, ${g[3]} at lags 1–3); without Wikipedia it held at all three (p = ${RB.granger_ret_to_NAI[1]}, ${RB.granger_ret_to_NAI[2]}, ${RB.granger_ret_to_NAI[3]}). No attention measure predicts returns (combined p = ${g2[1]}, ${g2[2]}, ${g2[3]}). The reading: when space stocks move, people go and search for the companies; they do not read up on them or discuss them more, and none of this attention tells you where prices go next.</p>`;

/* ---------- RQ3 ---------- */
function drawBills(){
  const c=C();const R=S.bills_by_congress;const lab=R.map(r=>`${r.c}th`);const yrs={113:'2013–14',114:'2015–16',115:'2017–18',116:'2019–20',117:'2021–22',118:'2023–24',119:'2025–26'};
  mk('c-bills',{type:'bar',data:{labels:lab,datasets:[{label:'Commercial share',data:R.map(r=>+(r.com_share*100).toFixed(1)),backgroundColor:R.map(r=>r.c===119?c.axis:c.s2),borderRadius:3}]},
    options:base(c,{scales:{y:{min:0,title:axisTitle(c,'% of space-indexed measures')}},plugins:{tooltip:{callbacks:{title:i=>`${R[i[0].dataIndex].c}th Congress (${yrs[R[i[0].dataIndex].c]})`,label:i=>{const r=R[i.dataIndex];return [`${r.commercial} of ${r.total} measures commercial (${i.raw}%)`,`${r.per_1000} space measures per 1,000 bills`,`excluding appropriations and commemorations: ${(r.com_share_subst*100).toFixed(0)}%`]}}}}})});
}
function drawFR(){
  const c=C();const R=D.fr;const yrs=R.map(r=>String(r.year));const oth=R.map(r=>r.n-r.FAA-r.FCC);
  document.getElementById('lg-fr').innerHTML=[[c.s1,'FAA'],[c.s3,'FCC'],[c.axis,'All other agencies']].map(([col,l])=>`<span><i class="sw dot" style="background:${col}"></i>${l}</span>`).join('');
  mk('c-fr',{type:'bar',data:{labels:yrs,datasets:[{label:'FAA',data:R.map(r=>r.FAA),backgroundColor:c.s1,stack:'a'},{label:'FCC',data:R.map(r=>r.FCC),backgroundColor:c.s3,stack:'a'},{label:'Other',data:oth,backgroundColor:c.axis,stack:'a'}]},
    options:base(c,{scales:{x:{stacked:true},y:{stacked:true,title:axisTitle(c,'documents')}},plugins:{tooltip:{callbacks:{footer:it=>{const r=R[it[0].dataIndex];return `Total ${r.n} · ${r.rule} rules, ${r.prop} proposed rules · US launches that year: ${r.launches??'n/a'}`}}}}})});
}
document.querySelector('#t-fr tbody').innerHTML=D.fr_sel.slice().reverse().map(r=>`<tr><td class="mono" style="white-space:nowrap">${r.date}</td><td>${r.type==='PropRule'?'Proposed rule':r.type==='Pres'?'Presidential':'Rule'}</td><td>${r.agency}</td><td>${r.title}</td></tr>`).join('');
document.querySelector('#t-bills tbody').innerHTML=D.bills_com.map(b=>`<tr><td class="mono" style="white-space:nowrap">${b.c}th</td><td class="mono" style="white-space:nowrap">${b.bill}</td><td>${b.title}</td></tr>`).join('');
const bce=S.bills_com_share_eras,b114=S.bills_by_congress.find(r=>r.c===114),fre=S.fr_era;
document.getElementById('read3').innerHTML=`
<p><b>Congress.</b> US commercial-space legislating came early. The 114th Congress (2015–16), which passed the U.S. Commercial Space Launch Competitiveness Act, already had ${b114.commercial} commercial measures out of ${b114.total} space-indexed ones, when the US flew about 20 orbital launches a year. Across eras the commercial share rose from ${bce.pre_n} of ${bce.pre_tot} (${pct(bce.pre_113_115)}, 2013–18) to ${bce.post_n} of ${bce.post_tot} (${pct(bce.post_117_119)}, 2021–26), a change that is not statistically significant (Fisher p = ${S.bills_fisher_p}). Congressional attention to space overall fell, from 4.4–6.0 indexed measures per 1,000 bills in 2013–2020 to 2.4–3.1 since.</p>
<p><b>Regulators.</b> Federal Register activity rose with the build-out: about ${Math.round(fre.mean_2014_2021)} space-related documents a year in 2014–2021 against ${Math.round(fre.mean_2022_2024)} in 2022–2024. FCC space documents track launch cadence closely (ρ = ${S.fcc_vs_launch.rho.toFixed(2)}, 2016–2025), driven by satellite licensing, spectrum for launches and the orbital-debris rules. Major executive actions also came before the peak: commercial streamlining (May 2018), the FAA's Part 450 licensing rule (published December 2020), and Executive Order 14335 (August 2025).</p>
<p>As in India, policy discourse moved first. The US difference is timing: the commercial turn in law came in 2015–2018, five years before launch cadence took off, and regulators have been scaling up behind the industry since.</p>`;

/* ---------- RQ4 sentiment ---------- */
function roll(a,n){return a.map((v,i)=>{if(i<n-1)return null;const w=a.slice(i-n+1,i+1).filter(x=>x!=null);return w.length?+(w.reduce((p,x)=>p+x,0)/w.length).toFixed(4):null})}
function drawHN(){
  const c=C();const H=D.hn_us;const X=H.x;
  document.getElementById('lg-hnv').innerHTML=`<span><i class="sw dot" style="background:${c.s1}"></i>State programmes</span><span><i class="sw dot" style="background:${c.s2}"></i>NewSpace firms</span>`;
  mk('c-hnv',{type:'bar',data:{labels:X,datasets:[{label:'State',data:H.ns,backgroundColor:c.s1,stack:'a'},{label:'NewSpace',data:H.nn,backgroundColor:c.s2,stack:'a'}]},
    options:base(c,{scales:{x:{stacked:true,ticks:{callback:yearTick,autoSkip:false}},y:{stacked:true,title:axisTitle(c,'stories / month')}},plugins:{tooltip:{callbacks:{footer:it=>`Total ${H.n[it[0].dataIndex]} stories (some mention both)`}}}})});
  mk('c-hns',{type:'line',data:{labels:X,datasets:[{label:'Monthly mean',data:H.mean,borderColor:c.axis,backgroundColor:c.axis,borderWidth:1,pointRadius:0},{label:'12-month mean',data:roll(H.mean,12),borderColor:c.s7,backgroundColor:c.s7,borderWidth:2.5,pointRadius:0}]},
    options:base(c,{scales:{x:{ticks:{callback:yearTick,autoSkip:false}},y:{title:axisTitle(c,'VADER compound')}},plugins:{tooltip:{filter:i=>i.raw!=null,callbacks:{label:i=>`${i.dataset.label}: ${fmt(i.raw,3)}`}}}})});
  const E2=hnE.filter(e=>!isNaN(e.t)&&e.t!==null);
  mk('c-hne',{type:'bar',data:{labels:E2.map(e=>e.label),datasets:[{label:'Shift',data:E2.map(e=>+e.diff.toFixed(3)),backgroundColor:E2.map(e=>e.p<0.05?(e.diff<0?c.bad:c.s3):'transparent'),borderColor:E2.map(e=>e.diff<0?c.bad:c.s3),borderWidth:1.5,borderRadius:3,barThickness:12}]},
    options:base(c,{indexAxis:'y',interaction:{mode:'nearest',intersect:true},scales:{x:{min:-0.25,max:0.15,grid:{display:true,color:c.grid},title:axisTitle(c,'shift in mean VADER score')},y:{grid:{display:false},ticks:{color:c.ink2,font:{size:11.5},autoSkip:false}}},
      plugins:{tooltip:{callbacks:{label:i=>{const e=E2[i.dataIndex];const se=Math.abs(e.diff/(e.t||1e-9));return [`${e.date}: ${fmt(e.diff,3)} (95% CI ${fmt(e.diff-1.96*se,3)} to ${fmt(e.diff+1.96*se,3)})`,`t = ${e.t}, p = ${e.p}, ${e.wn} stories in window`,`volume ${e.vol_ratio}× the baseline daily rate`]}}}}}),
    plugins:[{id:'ci',afterDatasetsDraw(ch){const ctx=ch.ctx;const xs=ch.scales.x,ys=ch.scales.y;ctx.save();ctx.strokeStyle=C().ink2;ctx.lineWidth=1.25;E2.forEach((e,i)=>{const se=Math.abs(e.diff/(e.t||1e-9));const y=ys.getPixelForValue(i);const x1=xs.getPixelForValue(Math.max(xs.min,e.diff-1.96*se)),x2=xs.getPixelForValue(Math.min(xs.max,e.diff+1.96*se));ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.moveTo(x1,y-4);ctx.lineTo(x1,y+4);ctx.moveTo(x2,y-4);ctx.lineTo(x2,y+4);ctx.stroke()});const x0=xs.getPixelForValue(0);ctx.strokeStyle=C().muted;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x0,ch.chartArea.top);ctx.lineTo(x0,ch.chartArea.bottom);ctx.stroke();ctx.restore()}}]});
}
const lblOf=d=>(hnE.find(e=>e.date===d)||{}).label||d;
document.querySelector('#t-tops tbody').innerHTML=D.hn_tops.filter(t=>t.c==='US').map(t=>`<tr><td>${lblOf(t.event)} <span class="dim mono">${t.date}</span></td><td class="num">${t.pts}</td><td class="num">${(+t.s).toFixed(3)}</td><td>${t.title}</td></tr>`).join('');
const se=S.hn_sent_era,i7=HE('Starship IFT-7'),a2=HE('Artemis II'),i1=HE('Starship IFT-1'),d2=HE('Crew Dragon'),as=HE('Russian ASAT');
document.getElementById('read4').innerHTML=`
<p><b>Trend.</b> Over a decade in which US launch cadence rose almost eightfold, the tone of Hacker News headlines about US space drifted down: the story-weighted mean VADER score fell from ${se.pre_2016_19.toFixed(3)} in 2016–19 to ${se.post_2023_26.toFixed(3)} in 2023–26, and the share of negative headlines rose from ${pct(se.neg_pre)} to ${pct(se.neg_post)}. The linear trend is ${S.hn_sent_trend_per_year.slope.toFixed(4)} a year (p &lt; 0.001). Sentiment neither leads nor follows launch cadence in Granger tests (all p ≥ ${Math.min(...Object.values(S.granger_sent_to_launch),...Object.values(S.granger_launch_to_sent)).toFixed(2)}), and it does not move with stock returns in the same month (r = ${S.contemp_sent_exc[0]}).</p>
<p><b>Triggers.</b> Two events shift tone significantly. Starship's ship loss in January 2025 pulled the mean down by ${Math.abs(i7.diff).toFixed(2)} (p = ${i7.p}), with ${pct(i7.wneg)} of headlines negative against ${pct(i7.bneg)} before. Artemis II raised it by ${a2.diff.toFixed(2)} (p = ${a2.p}) on ${a2.vol_ratio}× the usual volume. Crew Dragon's first crewed launch (+${d2.diff.toFixed(2)}, p = ${d2.p}) and the Russian ASAT test (${as.diff.toFixed(2)}, p = ${as.p}) are borderline.</p>
<p><b>Limits.</b> VADER is a general-purpose lexicon. It scores "SpaceX Starship rocket explodes minutes after launch" as exactly neutral, so it misses the April 2023 explosion entirely (shift ${fmt(i1.diff,3)}, p = ${i1.p}). A space-domain lexicon or a fine-tuned model is the obvious next step before publication.</p>`;

/* ---------- RQ5 ---------- */
function drawPL(){
  const c=C();const yrs=A.map(a=>String(a.year));
  document.getElementById('lg-pl').innerHTML=[[c.s4,'Starlink'],[c.s3,'Other commercial'],[c.s1,'Government (civil and defence)'],[c.axis,'Academic and other']].map(([col,l])=>`<span><i class="sw dot" style="background:${col}"></i>${l}</span>`).join('');
  mk('c-pl',{type:'bar',data:{labels:yrs,datasets:[{label:'Starlink',data:A.map(a=>a.starlink),backgroundColor:c.s4,stack:'p'},{label:'Other commercial',data:A.map(a=>a.com),backgroundColor:c.s3,stack:'p'},{label:'Government',data:A.map(a=>a.gov),backgroundColor:c.s1,stack:'p'},{label:'Academic/other',data:A.map(a=>a.oth),backgroundColor:c.axis,stack:'p'}]},
    options:base(c,{scales:{x:{stacked:true},y:{stacked:true,title:axisTitle(c,'satellites')}},plugins:{tooltip:{callbacks:{footer:it=>{const a=A[it[0].dataIndex];return `Total ${a.starlink+a.com+a.gov+a.oth}${a.year===2026?' (catalogue to July)':''}`}}}}})});
}
function drawFAA(){
  const c=C();const yrs=Object.keys(D.faa);const L={};D.launches.x.forEach((x,i)=>{const y=x.slice(0,4);L[y]=(L[y]||0)+D.launches.y[i]});L['2015']=20;
  document.getElementById('lg-faa').innerHTML=`<span><i class="sw dot" style="background:${c.s1}"></i>FAA licensed operations (fiscal year)</span><span><i class="sw dot" style="background:${c.s2}"></i>GCAT US launches (calendar year)</span>`;
  mk('c-faa',{type:'bar',data:{labels:yrs,datasets:[{label:'FAA licensed operations',data:yrs.map(y=>D.faa[y]),backgroundColor:c.s1,borderRadius:2},{label:'GCAT US launches',data:yrs.map(y=>L[y]),backgroundColor:c.s2,borderRadius:2}]},
    options:base(c,{scales:{y:{title:axisTitle(c,'count')}}})});
}
function drawSEC(){
  const c=C();const R=D.sec;const yrs=R.map(r=>String(r.year));
  mk('c-sec1',{type:'bar',data:{labels:yrs,datasets:[{label:'"space economy" hits',data:R.map(r=>r.spaceecon),backgroundColor:yrs.map(y=>y==='2026'?c.s2:c.s7),borderRadius:2}]},options:base(c,{scales:{y:{title:axisTitle(c,'hits')}}})});
  mk('c-sec2',{type:'bar',data:{labels:yrs,datasets:[{label:'"low Earth orbit" in 10-Ks',data:R.map(r=>r.leo10k),backgroundColor:c.s1,borderRadius:2}]},options:base(c,{scales:{y:{title:axisTitle(c,'hits')}}})});
}
const P5=S.payloads,sec=D.sec,secy=y=>sec.find(r=>r.year===y);
document.getElementById('read5').innerHTML=`
<p><b>Capacity.</b> The physical record is unambiguous and well measured. FAA-licensed launch and re-entry operations rose from ${D.faa['2015']} in FY2015 to ${D.faa['2024']} in FY2024, and track GCAT's launch count almost exactly (ρ = ${S.faa_vs_gcat.rho.toFixed(2)}). But it is concentrated: SpaceX flew ${Ay(2025).spacex} of ${Ay(2025).launches} US launches in 2025, and Starlink made up ${Math.round(P5.starlink_share_2016_2025*100)}% of US-owned satellites launched from 2016 to 2025. Non-Starlink commercial satellites still grew, from ${P5.non_starlink_com_2016_19} in 2016–19 to ${P5.non_starlink_com_2022_25} in 2022–25, and government-owned satellites (civil and defence) jumped to ${Ay(2024).gov} in 2024 and ${Ay(2025).gov} in 2025, from ${Math.min(...A.filter(a=>a.year<2024).map(a=>a.gov))}–${Math.max(...A.filter(a=>a.year<2024).map(a=>a.gov))} a year before.</p>
<p><b>Capital.</b> Unlike India, US space capital leaves a public trail. Filings that use the phrase "space economy" went from ${secy(2016).spaceecon} in 2016 to ${secy(2021).spaceecon} in 2021, the year of the space SPAC wave, fell back to ${secy(2024).spaceecon} in 2024, and reached ${secy(2026).spaceecon} in 2026, the year of the SpaceX listing. Annual reports mentioning low Earth orbit rose from ${secy(2016).leo10k} in 2016 to ${secy(2026).leo10k} in 2026, and track launch cadence (ρ = ${S.leo_vs_launch.rho.toFixed(2)}). Hype-sensitive language spikes with financing windows; operational language grows with capacity.</p>
<p>What the US also lacks is an official, US-only series for private space investment. The most-cited tracker, Space Capital, reports global totals ($26 billion in 2024 in its January 2025 report; a record $55.3 billion in 2025 in January 2026), and its scope covers applications as well as hardware. Public-market prices are the cleanest capital signal the US has, and they are now dominated by one stock.</p>`;

/* ---------- coverage ---------- */
const cov=[
 ['ok','Google Trends (US)','11 terms, monthly, Jan 2016–Oct 2026, each on its own 0–100 scale. "Starship" is excluded from the indices because the word has unrelated meanings (delivery robots, a band).'],
 ['ok','Hacker News (Algolia API)','17,640 story titles matching US space terms, scored with VADER. Substitutes for X and Reddit; skews to an English-language tech audience.'],
 ['ok','Congress (Library of Congress subjects)','415 measures indexed under space subjects, 113th–119th Congresses, read through GovTrack because Congress.gov blocks automated access with a bot check. 119th Congress indexing is incomplete.'],
 ['ok','Federal Register API','1,072 documents, 2014–Oct 2026, with type and agency. Full-text matching picks up some incidental mentions (export-control lists, hazmat rules).'],
 ['ok','Stock prices (Yahoo Finance)','Daily adjusted closes for ten NewSpace firms, SpaceX, the UFO ETF and the S&P 500. Delisted firms (Astra, Virgin Orbit, Terran Orbital, Maxar) are unavailable, so the basket has survivorship bias.'],
 ['ok','SEC EDGAR full-text search','Yearly hit counts for two phrases. Earnings-call transcripts are paywalled and were not collected.'],
 ['ok','GCAT launch and satellite catalogue','Every US orbital launch attempt and US-owned payload. The satellite catalogue lags: it is complete only to July 2026.'],
 ['part','FAA licensed operations','FY2015–FY2024 actuals from the FAA 2025 Aerospace Forecast. FY2025 actuals were not in that document.'],
 ['part','Private investment','No US-only official series. Space Capital publishes global totals with a wider scope; these are quoted, not analysed.'],
 ['ok','Wikipedia page views','11 English-Wikipedia articles (eight enter the indices; ISS, SLS and Commercial Crew are kept in the raw file), monthly user views per million total views, 2016–Oct 2026. Current titles only: views of earlier titles (before a page was renamed) are not added, and months before an article reached 1,000 views are treated as missing.'],
 ['no','X (Twitter) and Reddit','Not collected: X\'s API is paid and Reddit was not collected in this study.'],
 ['no','News tone (GDELT)','The free GDELT API covers only the last three months, too short for these tests; it would need GDELT\'s BigQuery tables.']
];
const stl={ok:['st-ok','Collected'],part:['st-part','Partial'],no:['st-no','Not available']};
document.getElementById('cov').innerHTML=cov.map(([s,h,p])=>`<div class="panel"><span class="status ${stl[s][0]}"><i></i>${stl[s][1]}</span><h3 style="margin:6px 0 4px">${h}</h3><p>${p}</p></div>`).join('');
const src=[
 ['GCAT launch and satellite catalogues (J. McDowell)','https://planet4589.org/space/gcat/'],
 ['Wikimedia REST pageviews API','https://wikimedia.org/api/rest_v1/'],
 ['Google Trends, United States','https://trends.google.com/trends/explore?geo=US&q=NASA'],
 ['Hacker News Search API (Algolia)','https://hn.algolia.com/api'],
 ['VADER sentiment (Hutto & Gilbert, 2014)','https://github.com/cjhutto/vaderSentiment'],
 ['GovTrack bill search (Library of Congress subjects)','https://www.govtrack.us/congress/bills/browse'],
 ['Federal Register API','https://www.federalregister.gov/developers/documentation/api/v1'],
 ['SEC EDGAR full-text search','https://efts.sec.gov/LATEST/search-index?q=%22space%20economy%22'],
 ['Yahoo Finance chart data','https://finance.yahoo.com/quote/%5EGSPC/'],
 ['FAA 2025 Aerospace Forecast: commercial space','https://www.faa.gov/data_research/aviation/aerospace_forecasts/2025-commercial-space.pdf'],
 ['Space Capital, Space Investment Quarterly Q4 2025','https://www.spacecapital.com/reports/space-investment-quarterly-q4-2025'],
 ['Via Satellite: Space Capital 2024 totals (23 Jan 2025)','https://satellitetoday.com/finance/2025/01/23/space-capital-tracks-rebound-in-space-investment-in-24-expects-more-interest-in-25'],
 ['Initial public offering of SpaceX (Wikipedia)','https://en.wikipedia.org/wiki/Initial_public_offering_of_SpaceX'],
 ['Office of Space Commerce: Executive Order of 13 Aug 2025','https://space.commerce.gov/president-trump-signs-executive-order-to-enable-competition-in-the-commercial-space-industry/'],
 ['Via Satellite: FCC adopts 5-year deorbit rule (29 Sep 2022)','https://www.satellitetoday.com/government-military/2022/09/30/fcc-adopts-5-year-rule-for-deorbiting-satellites/'],
 ['Intelsat 33e breakup (Wikipedia)','https://en.wikipedia.org/wiki/Intelsat_33e'],
 ['Space.com: Russian anti-satellite test (15 Nov 2021)','https://www.space.com/russia-anti-satellite-missile-test-first-of-its-kind'],
 ['Rocket Lab completes merger, begins trading (25 Aug 2021)','https://rocketlabcorp.com/updates/rocket-lab-completes-merger-with-vector-acquisition-corporation-to-become-publicly-traded-end-to-end-space-company/'],
 ['Planet closes business combination (Dec 2021)','https://investors.planet.com/news/news-details/2021/Planet-Announces-Closing-of-Business-Combination-with-dMY-Technology-Group-Inc.-IV/default.aspx'],
 ['Space stocks rise after inaugural Mars pledge (21 Jan 2025)','https://newsable.asianetnews.com/markets/space-stocks-already-reach-mars-as-trump-pursues-manifest-destiny-into-the-stars-rocket-lab-hits-record-high-sqg9av']
];
document.getElementById('src').innerHTML=src.map(([t,u])=>`<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('');

onTheme(()=>{drawIndex();drawWiki();drawLaunchM();drawLY();drawCum();drawXC();drawWin();drawBills();drawFR();drawHN();drawPL();drawFAA();drawSEC()});
