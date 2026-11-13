const D=JSON.parse(document.getElementById('data').textContent);
const S=D.stats,K=D.countries;const {C,base,mk,axisTitle,onTheme}=SDS;
const by=Object.fromEntries(K.map(r=>[r.iso_num,r])),byIso=Object.fromEntries(K.map(r=>[r.iso3,r]));
const nf=v=>Number(v).toLocaleString('en-GB');
const sorted=[...K].sort((a,b)=>b.filings-a.filings);
const IN=byIso.IND,CN=byIso.CHN,US=byIso.USA,RW=byIso.RWA,DE=byIso.DEU,FR=byIso.FRA;
const pc=(a,b)=>Math.round(100*a/b);

/* ---------- findings ---------- */
const F=[
 {t:'yes',tt:'Many countries are filing',k:`${S.countries}`,s:' countries',p:`${S.countries} national administrations hold at least one active ITU filing for a satellite system in low Earth orbit: ${nf(S.filings)} filings covering ${nf(S.networks)} distinct satellite networks. ${S.ten_plus} countries hold ten or more; ${S.one_filing} hold exactly one.`},
 {t:'mixed',tt:'But two countries lead',k:`${S.top2_filings_share}%`,s:' China + US',p:`China (${nf(CN.filings)} filings) and the United States (${nf(US.filings)}) hold ${S.top2_filings_share}% of all active LEO filings; the top five, with Germany, Japan and France, hold ${S.top5_filings_share}%.`},
 {t:'mixed',tt:'A recent boom',k:`${S.y2017} → ${S.y2025}`,s:' a year',p:`Active filings received in 2017: ${S.y2017}. In 2025: ${S.y2025}. ${S.recent_share}% of all active LEO filings were received from 2023 onwards. Most are at the first stage: ${pc(S.stage.A,S.filings)}% are advance publications, which commit the filer to little.`},
 {t:'no',tt:'Millions of satellites on paper',k:`${(S.satellites/1e6).toFixed(2)}m`,s:' satellites',p:`Together the filings describe up to ${nf(S.satellites)} satellites. Three administrations account for ${S.top3_sat_share}%: Rwanda (${nf(RW.satellites)}), Germany (${nf(DE.satellites)}) and France (${nf(FR.satellites)}). Filing numbers are an upper bound, not a forecast.`},
 {t:'mixed',tt:'India ranks seventh',k:`#${S.rank_filings.IND}`,s:' by filings',p:`India holds ${IN.filings} active LEO filings (${IN.networks} networks), seventh in the world, but they describe only ${nf(IN.satellites)} satellites; ${IN.nets_ge100} of its networks plan 100 or more satellites, against ${CN.nets_ge100} for China and ${US.nets_ge100} for the United States.`}
];
document.getElementById('findings').innerHTML=F.map(f=>`<div class="finding"><span class="tag t-${f.t}"><i></i>${f.tt}</span><div class="k">${f.k}<small>${f.s}</small></div><p>${f.p}</p></div>`).join('');

/* ---------- map ---------- */
let measure='filings';
const MEAS={filings:['Filings','filings'],networks:['Networks','networks'],satellites:['Satellites in filings','satellites']};
function drawMap(){
  const c=C();const W=960,H=500;const svg=d3.select('#worldmap').attr('viewBox',`0 0 ${W} ${H}`);svg.selectAll('*').remove();
  const feats=topojson.feature(D.geo,D.geo.objects.countries).features.filter(f=>f.id!=='010');
  const proj=d3.geoNaturalEarth1().fitExtent([[4,4],[W-4,H-4]],{type:'FeatureCollection',features:feats});const path=d3.geoPath(proj);
  const vals=K.map(r=>r[measure]).filter(v=>v>0);const mx=d3.max(vals);
  const col=d3.scaleSequentialLog([1,mx],d3.interpolateYlGnBu);
  const empty=getComputedStyle(document.documentElement).getPropertyValue('--grid').trim()||'#ddd';
  const tip=document.getElementById('tip');const box=document.getElementById('mapbox');
  svg.append('path').attr('d',path({type:'Sphere'})).attr('fill','none').attr('stroke',c.axis).attr('stroke-width',.5);
  svg.append('g').selectAll('path').data(feats).join('path').attr('d',path)
    .attr('fill',f=>{const r=by[f.id];return r&&r[measure]>0?col(r[measure]):empty}).attr('stroke',c.surface).attr('stroke-width',.4)
    .on('mousemove',(e,f)=>{const r=by[f.id];const b=box.getBoundingClientRect();
      tip.innerHTML=r?`<b>${r.country}</b><br>${nf(r.filings)} filings (API ${r.A}, coordination ${r.C}, notification ${r.N})<br>${nf(r.networks)} networks · ${nf(r.satellites)} satellites in filings<br>Rank ${S.rank_filings[r.iso3]} of ${S.countries} by filings`:`<b>${f.properties.name}</b><br>No active LEO filing`;
      tip.style.display='block';const x=e.clientX-b.left+12,y=e.clientY-b.top+12;tip.style.left=Math.min(x,b.width-270)+'px';tip.style.top=y+'px';})
    .on('mouseleave',()=>{tip.style.display='none'});
  // legend
  const ticks=[1,10,100,1000,10000,100000,1000000].filter(t=>t<=mx*1.01);
  document.getElementById('maplegend').innerHTML=`<div class="sub" style="margin-bottom:4px">${MEAS[measure][0]} per country (log scale). Grey: none.</div><div style="display:flex;align-items:center;gap:0;max-width:520px">`+
    ticks.map((t,i)=>`<div style="flex:1;text-align:center"><div style="height:10px;background:${col(Math.min(t*3,mx))}"></div><div class="note" style="font-family:var(--f-mono)">${t>=1e6?'1m':t>=1000?(t/1000)+'k':t}${i===ticks.length-1?'+':''}</div></div>`).join('')+'</div>';
}
for(const [id,m] of [['m-f','filings'],['m-n','networks'],['m-s','satellites']])document.getElementById(id).onclick=()=>{measure=m;for(const b of ['m-f','m-n','m-s'])document.getElementById(b).setAttribute('aria-pressed',b===id);drawMap()};
document.getElementById('sl-map').innerHTML=`<span><b>${nf(S.filings)}</b> active LEO filings</span><span><b>${nf(S.networks)}</b> networks</span><span><b>${S.countries}</b> countries</span><span>Concentration (HHI) of filings <b>${S.hhi_filings}</b>, of satellites <b>${S.hhi_sats}</b></span>`;

/* ---------- ranking ---------- */
function drawRank(){
  const c=C();const T=sorted.slice(0,20);
  document.getElementById('lg-rank').innerHTML=[[c.s3,'Advance publication (API)'],[c.s2,'Coordination request'],[c.s1,'Notification']].map(([col,l])=>`<span><i class="sw dot" style="background:${col}"></i>${l}</span>`).join('');
  mk('c-rank',{type:'bar',data:{labels:T.map(r=>r.country),datasets:[{label:'API',data:T.map(r=>r.A),backgroundColor:c.s3},{label:'Coordination',data:T.map(r=>r.C),backgroundColor:c.s2},{label:'Notification',data:T.map(r=>r.N+r.other),backgroundColor:c.s1}]},
    options:base(c,{indexAxis:'y',scales:{x:{stacked:true,grid:{color:c.grid,display:true},title:axisTitle(c,'active LEO filings')},y:{stacked:true,grid:{display:false},ticks:{autoSkip:false,color:c.ink2}}}})});
}
const nonNotif=r=>r.A+r.C;
document.getElementById('read1').innerHTML=`
<p><b>Filing is widespread; scale is not.</b> ${S.countries} countries file for low Earth orbit, from China and the United States to Bhutan and Tonga. But ${S.top2_filings_share}% of filings come from two countries and ${S.top5_filings_share}% from five.</p>
<p><b>Most filings are early-stage.</b> ${nf(S.stage.A)} of the ${nf(S.filings)} active filings (${pc(S.stage.A,S.filings)}%) are advance publications, ${nf(S.stage.C)} (${pc(S.stage.C,S.filings)}%) are coordination requests and ${nf(S.stage.N)} (${pc(S.stage.N,S.filings)}%) are notifications. Advance publications and coordination requests make up ${pc(nonNotif(CN),CN.filings)}% of China's filings, ${pc(nonNotif(US),US.filings)}% of the United States' and ${pc(nonNotif(IN),IN.filings)}% of India's.</p>
<p><b>India</b> is seventh, with ${IN.filings} filings (${IN.A} API, ${IN.C} coordination, ${IN.N} notification). ${IN.rcv_2023_26} of them were received from 2023 onwards. India has no LEO filing at the coordination stage: its filings are advance publications or notifications, mostly for small systems.</p>`;

/* ---------- years ---------- */
function drawYears(){
  const c=C();const Y=D.years.filter(r=>r.year>=2005);
  document.getElementById('lg-yr').innerHTML=[[c.s3,'API'],[c.s2,'Coordination'],[c.s1,'Notification']].map(([col,l])=>`<span><i class="sw dot" style="background:${col}"></i>${l}</span>`).join('');
  mk('c-yr',{type:'bar',data:{labels:Y.map(r=>r.year===2026?'2026*':String(r.year)),datasets:[{label:'API',data:Y.map(r=>r.A),backgroundColor:c.s3},{label:'Coordination',data:Y.map(r=>r.C),backgroundColor:c.s2},{label:'Notification',data:Y.map(r=>r.N+r.other),backgroundColor:c.s1}]},
    options:base(c,{scales:{x:{stacked:true},y:{stacked:true,title:axisTitle(c,'filings received')}}})});
}
const yt=y=>{const r=D.years.find(x=>x.year===y);return r.A+r.C+r.N+r.other};
document.getElementById('read2').innerHTML=`
<p><b>A step change from 2018.</b> Active filings received rose from ${yt(2017)} in 2017 to ${yt(2018)} in 2018 and ${yt(2019)} in 2019, and reached ${yt(2025)} in 2025. ${yt(2026)} were received in 2026 up to 10 November.</p>
<p>Much of the rise is advance publications, the cheapest and least binding step. Advance publication rose from ${D.years.find(x=>x.year===2017).A} in 2017 to ${D.years.find(x=>x.year===2025).A} in 2025.</p>
<p>The timing matches the commercial LEO broadband era, but this chart cannot show cause: it counts only filings that are still active, so systems filed and later abandoned are missing from earlier years.</p>`;

/* ---------- largest ---------- */
const T=D.top.slice(0,20);const STG={A:'API',C:'Coordination',N:'Notification'};
document.getElementById('t-top').innerHTML='<div class="tablewrap"><table><thead><tr><th>Country</th><th>Network</th><th>Stage</th><th class="num">Satellites</th><th>First received</th></tr></thead><tbody>'+T.map(r=>`<tr><td>${r.country}</td><td style="font-family:var(--f-mono);font-size:12px">${r.network}</td><td>${[...r.stages].map(s=>STG[s]).join(', ')}</td><td class="num">${nf(r.satellites)}</td><td>${r.first_receipt}</td></tr>`).join('')+'</tbody></table></div>';
const rwTop=D.top.filter(r=>r.adm==='RRW').length;
document.getElementById('read3').innerHTML=`
<p><b>Filed satellites far exceed deployment.</b> The active LEO filings describe up to ${nf(S.satellites)} satellites. For comparison, SpaceX, by far the largest operator, launched about 10,900 of its own satellites from 2016 to 2025 (GCAT launch catalogue). The largest single filings describe more than 100,000 each (${D.top[0].network} filed by ${D.top[0].country}, ${nf(D.top[0].satellites)}; ${D.top[1].network} filed by ${D.top[1].country}, ${nf(D.top[1].satellites)}).</p>
<p><b>Small administrations, huge filings.</b> Rwanda's ${RW.networks} networks describe ${nf(RW.satellites)} satellites, ${rwTop} of the 40 largest filings. Tonga's single filing describes ${nf(byIso.TON.satellites)}; Solomon Islands ${nf(byIso.SLB.satellites)}. A country can file on behalf of an operator based elsewhere, and the database records only the filing administration.</p>
<p>These numbers measure claims on orbit and spectrum, not demand or deployment. ${S.nets_ge1000} networks plan 1,000 or more satellites; most are at the advance-publication or coordination stage.</p>`;

/* ---------- table ---------- */
document.querySelector('#t-all tbody').innerHTML=sorted.map((r,i)=>`<tr><td>${i+1}</td><td>${r.country}</td><td class="num">${nf(r.filings)}</td><td class="num">${r.A}</td><td class="num">${r.C}</td><td class="num">${r.N+r.other}</td><td class="num">${nf(r.networks)}</td><td class="num">${nf(r.satellites)}</td><td class="num">${r.rcv_2023_26}</td></tr>`).join('');

document.getElementById('lim').innerHTML=`
<p><b>What is counted.</b> Every active notice in the ITU Space Networks System for a non-geostationary space station whose orbits include an apogee of 2,000 km or less, as published to BR IFIC No 3084 (10 November 2026): ${nf(S.filings)} notices. Three were excluded: one orbiting Mars and two with no orbit (a sun-observing spacecraft at L1 and a suborbital rocket). Twelve multi-orbit systems with both LEO and higher orbits are kept.</p>
<p><b>Filings, networks, satellites.</b> A <i>filing</i> is one notice. A <i>network</i> is a distinct system name filed by one administration; it can have several notices at different stages. <i>Satellites in filings</i> sums, for each network, the largest number of satellites in any of its notices. The same satellites can be filed under several network names, and many filed systems are never built, so this is an upper bound.</p>
<p><b>Country.</b> The map uses the notifying administration. Administrations can file on behalf of foreign or multinational operators: France and Germany, for example, file for the European Space Agency and EUMETSAT. The country on the map is where the filing was made, not necessarily where the operator is based.</p>
<p><b>Stages.</b> Notice type is the stage of each notice: advance publication (RR No. 9.1A), coordination request (RR No. 9.6) or notification (RR No. 11.2). Whether satellites were actually launched is not recorded here; compare with the launch catalogue on the United States and India pages.</p>
<p><b>Reproducibility.</b> The per-notice extract (3,026 rows before exclusions) has SHA-256 5cfa7daa…6fcd00e; the script re-runs the same public queries. The ITU database changes with every BR IFIC, so a later pull will differ.</p>`;

const src=[
 ['ITU Space Explorer: Networks Explorer (public)','https://www.itu.int/go/ITUSpaceExplorer'],
 ['ITU Radiocommunication Bureau: Space Networks Regulatory Hub','https://www.itu.int/en/ITU-R/space/snl/'],
 ['world-atlas 2.0.2 (Natural Earth 1:50m country boundaries)','https://github.com/topojson/world-atlas'],
 ['Query script (code/global/pull_itu_leo_filings.js)','code/global/pull_itu_leo_filings.js']
];
document.getElementById('src').innerHTML=src.map(([t,u])=>`<li><a href="${u}"${u.startsWith('http')?' target="_blank" rel="noopener"':''}>${t}</a></li>`).join('');

onTheme(()=>{for(const fn of [drawMap,drawRank,drawYears]){try{fn()}catch(e){console.error(fn.name,e);if(fn===drawMap)document.getElementById('maplegend').innerHTML='<p class="note">The map could not be drawn in this browser; the table below lists every country.</p>'}}});
