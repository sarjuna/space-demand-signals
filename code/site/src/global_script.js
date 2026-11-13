const D=JSON.parse(document.getElementById('data').textContent);
const S=D.stats,K=D.countries;const {C,base,mk,axisTitle,onTheme}=SDS;
const by=Object.fromEntries(K.map(r=>[r.iso_num,r])),byIso=Object.fromEntries(K.map(r=>[r.iso3,r]));
const nf=v=>Number(v).toLocaleString('en-GB');
const sorted=[...K].sort((a,b)=>b.filings-a.filings);
const IN=byIso.IND,CN=byIso.CHN,US=byIso.USA,RW=byIso.RWA,DE=byIso.DEU,FR=byIso.FRA;
const pc=(a,b)=>Math.round(100*a/b);
const ordw=['','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'];const rankTxt=iso=>(S.tied_filings[iso]>1?'joint ':'')+ordw[S.rank_filings[iso]];

/* ---------- findings ---------- */
const F=[
 {t:'yes',tt:'Many countries are filing',k:`${S.countries}`,s:' countries',p:`${S.countries} national administrations hold at least one active ITU filing for a satellite system in low Earth orbit: ${nf(S.filings)} filings covering ${nf(S.networks)} distinct satellite networks. ${S.ten_plus} countries hold ten or more; ${S.one_filing} hold exactly one.`},
 {t:'mixed',tt:'But two countries lead',k:`${S.top2_filings_share}%`,s:' China + US',p:`China (${nf(CN.filings)} filings) and the United States (${nf(US.filings)}) hold ${S.top2_filings_share}% of all active LEO filings; the top five, with Germany, Japan and France, hold ${S.top5_filings_share}%.`},
 {t:'mixed',tt:'A recent boom',k:`${S.y2017} → ${S.y2025}`,s:' a year',p:`Active filings received in 2017: ${S.y2017}. In 2025: ${S.y2025}. ${S.recent_share}% of all active LEO filings were received from 2023 onwards. Most are at the first stage: ${pc(S.stage.A,S.filings)}% are advance publications, which commit the filer to little.`},
 {t:'no',tt:'Millions of satellites on paper',k:`${(S.satellites/1e6).toFixed(2)}m`,s:' satellites',p:`Together the filings describe up to ${nf(S.satellites)} satellites. Most of this upper bound comes from ${[...K].sort((a,b)=>b.satellites-a.satellites).slice(0,3).map(r=>r.country).join(', ').replace(/, ([^,]*)$/,' and $1')}. The same system is often filed under several names, so the real number planned is lower; for Rwanda a cautious count gives about ${nf(Math.round(S.rwanda.cautious/1000)*1000)} rather than ${nf(S.rwanda.upper)}.`},
 {t:'mixed',tt:`India ranks ${rankTxt('IND')}`,k:`#${S.rank_filings.IND}`,s:' by filings',p:`India holds ${IN.filings} active LEO filings (${IN.networks} networks), ${rankTxt('IND')} in the world${S.tied_filings.IND>1?' with the United Kingdom':''}, but they describe only ${nf(IN.satellites)} satellites; ${IN.nets_ge100} of its networks plan 100 or more satellites, against ${CN.nets_ge100} for China and ${US.nets_ge100} for the United States.`}
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
<p><b>India</b> is ${rankTxt('IND')}${S.tied_filings.IND>1?' with the United Kingdom':''}, with ${IN.filings} filings (${IN.A} API, ${IN.C} coordination, ${IN.N} notification). ${IN.rcv_2023_26} of them were received from 2023 onwards. India has no LEO filing at the coordination stage: its filings are advance publications or notifications, mostly for small systems.</p>`;

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
document.getElementById('t-top').innerHTML='<div class="tablewrap"><table><thead><tr><th>Country</th><th>Network</th><th>Stage</th><th class="num">Satellites</th><th>First received</th></tr></thead><tbody>'+T.map(r=>`<tr><td>${r.country}</td><td style="font-family:var(--f-mono);font-size:12px">${r.network}${r.multiorbit==='yes'?' †':''}</td><td>${[...r.stages].map(s=>STG[s]).join(', ')}</td><td class="num">${nf(r.satellites)}</td><td>${r.first_receipt}</td></tr>`).join('')+'</tbody></table></div><p class="note">† Multi-orbit or elliptical system: the satellite number covers all its orbits, not only those in low Earth orbit.</p>';
const rwTop=D.top.filter(r=>r.adm==='RRW').length;
document.getElementById('read3').innerHTML=`
<p><b>Filed satellites far exceed deployment.</b> The active LEO filings describe up to ${nf(S.satellites)} satellites. For comparison, SpaceX, by far the largest operator, launched about 10,900 of its own satellites from 2016 to 2025 (GCAT launch catalogue). The largest single filings describe more than 100,000 each (${D.top[0].network} filed by ${D.top[0].country}, ${nf(D.top[0].satellites)}; ${D.top[1].network} filed by ${D.top[1].country}, ${nf(D.top[1].satellites)}). China's CTC-1 and CTC-2, received on 29 December 2025, describe ${nf(D.top.find(r=>r.network==='CTC-1').satellites)} satellites each in orbits from 300 km up to 39,700 km.</p>
<p><b>Not yet in the ITU data.</b> The ITU database shows filings only once an administration has submitted them and the ITU has recorded them. Two widely reported plans are not in it as of 10 November 2026. SpaceX applied to the US Federal Communications Commission (FCC) in late January 2026 for up to one million satellites at 500–2,000 km for orbital data centres; no corresponding ITU filing appears yet; the largest US filings in the database describe ${nf(D.top.filter(r=>r.adm==='USA')[0].satellites)} satellites each. Reflect Orbital says it plans up to 50,000 sunlight-reflecting satellites by 2035, but its FCC application covers a single test satellite (EARENDIL-1), and no ITU filing for the constellation appears. If SpaceX's application reaches the ITU in that form, it would be about ${Math.round(1e6/D.top[0].satellites)} times larger than the largest single filing now recorded.</p>
<p><b>Small administrations, huge filings.</b> Rwanda's ${RW.networks} networks describe up to ${nf(RW.satellites)} satellites, ${rwTop} of the 40 largest filings. Tonga's single filing describes ${nf(byIso.TON.satellites)}; Solomon Islands ${nf(byIso.SLB.satellites)}. A country can file on behalf of an operator based elsewhere, and the database records only the filing administration.</p>
<p><b>Rwanda in detail.</b> Rwanda's ${RW.filings} LEO filings are almost all at the first two stages; only its small SKY-G networks (209 satellites at most) are recorded in the ITU's Master Register. Summing its ${S.rwanda.networks} networks gives ${nf(S.rwanda.upper)} satellites, but several look like versions of the same constellation: CINNAMON-217 is reported as a subset of CINNAMON-937; GUHUZA-1, GUHUZA-2 and ANTON-1N0 each describe exactly 43,440 satellites; and the four UMUTEKANO filings are similar. Counting each such family once, at its largest filing, and adding the seven numbered shells INGAGI-1 to INZOVU-7 as layers of one system, gives about ${nf(Math.round(S.rwanda.cautious/1000)*1000)}. The grouping is our judgement; the ITU does not link filings, so the true figure is uncertain. CINNAMON-937 was widely reported in 2021 as a 327,320-satellite filing; the ITU's current record for it shows ${nf(D.top.find(r=>r.network==='CINNAMON-937').satellites)}, and this page uses the current record. Press reports link the Cinnamon filings, and France's 116,640-satellite SEMAPHORE-C filing, to the company E-Space.</p>
<p>These numbers measure claims on orbit and spectrum, not demand or deployment. ${S.nets_ge1000} networks plan 1,000 or more satellites; most are at the advance-publication or coordination stage.</p>`;

/* ---------- table ---------- */
document.querySelector('#t-all tbody').innerHTML=sorted.map((r,i)=>`<tr><td>${i+1}</td><td>${r.country}</td><td class="num">${nf(r.filings)}</td><td class="num">${r.A}</td><td class="num">${r.C}</td><td class="num">${r.N+r.other}</td><td class="num">${nf(r.networks)}</td><td class="num">${nf(r.satellites)}</td><td class="num">${r.rcv_2023_26}</td></tr>`).join('');

document.getElementById('lim').innerHTML=`
<p><b>What is counted.</b> All 3,718 active notices for non-geostationary space stations in the ITU Space Networks System, as published to BR IFIC No 3084 (10 November 2026), were checked. Kept: the ${nf(S.filings)} that orbit Earth with at least one orbit reaching low Earth orbit altitudes (perigee of 2,000 km or less). Of these, ${nf(S.filings-S.multi_filings)} have all their orbits below 2,000 km and ${S.multi_filings} are multi-orbit or elliptical systems that also go higher (for example China's CTC-1 and CTC-2); their satellite numbers (${nf(S.multi_satellites)} in all) cover every orbit. An earlier version of this page used the database's own apogee filter, which missed 101 of these multi-orbit filings.</p>
<p><b>Filings, networks, satellites.</b> A <i>filing</i> is one notice. A <i>network</i> is a distinct system name filed by one administration; it can have several notices at different stages. <i>Satellites in filings</i> sums, for each network, the largest number of satellites in any of its notices. The same satellites can be filed under several network names, and many filed systems are never built, so this is an upper bound. The global total and the country totals for satellites should be read as the scale of claims, not as planned deployments.</p>
<p><b>Country.</b> The map uses the notifying administration. Administrations can file on behalf of foreign or multinational operators: France and Germany, for example, file for the European Space Agency and EUMETSAT. The country on the map is where the filing was made, not necessarily where the operator is based.</p>
<p><b>Stages.</b> Notice type is the stage of each notice: advance publication (RR No. 9.1A), coordination request (RR No. 9.6) or notification (RR No. 11.2). Whether satellites were actually launched is not recorded here; compare with the launch catalogue on the United States and India pages.</p>
<p><b>Reproducibility.</b> The per-notice extract of all 3,718 non-geostationary notices has SHA-256 6876a694…727dbcaf1; the script re-runs the same public queries. The ITU database changes with every BR IFIC, so a later pull will differ.</p>`;

const src=[
 ['ITU Space Explorer: Networks Explorer (public)','https://www.itu.int/go/ITUSpaceExplorer'],
 ['ITU Radiocommunication Bureau: Space Networks Regulatory Hub','https://www.itu.int/en/ITU-R/space/snl/'],
 ['Space in Africa: Rwanda has submitted ITU filing for 27 orbital shells of 327,320 satellites (14 Oct 2021)','https://spaceinafrica.com/2021/10/14/rwanda-has-submitted-itu-filing-for-27-orbital-shells-of-327320-satellites/'],
 ['Advanced Television: Wyler now involved with 400,000+ satellites (30 Jun 2023)','https://www.advanced-television.com/2023/06/30/wyler-now-involved-with-400000-satellites/'],
 ['Reuters via Engadget: SpaceX wants to launch a constellation of a million satellites (Jan 2026)','https://www.engadget.com/science/space/spacex-wants-to-launch-a-constellation-of-a-million-satellites-to-power-ai-needs-175607771.html'],
 ['Sky & Telescope: Reflect Orbital\'s space mirrors approved for launch','https://skyandtelescope.org/astronomy-news/observers-beware-reflect-orbitals-space-mirrors-approved-for-launch/'],
 ['LightNow: Reflect Orbital seeking FCC approval for satellite mirrors (Mar 2026)','https://www.lightnowblog.com/2026/03/reflect-orbital-seeking-fcc-approval-for-satellite-mirrors/'],
 ['Gigazine: China submits ITU documents for about 200,000 satellites (13 Jan 2026)','https://gigazine.net/gsc_news/en/20260113-china-200000-satellites'],
 ['world-atlas 2.0.2 (Natural Earth 1:50m country boundaries)','https://github.com/topojson/world-atlas'],
 ['Query script (code/global/pull_itu_leo_filings.js)','code/global/pull_itu_leo_filings.js']
];
document.getElementById('src').innerHTML=src.map(([t,u])=>`<li><a href="${u}"${u.startsWith('http')?' target="_blank" rel="noopener"':''}>${t}</a></li>`).join('');

onTheme(()=>{for(const fn of [drawMap,drawRank,drawYears]){try{fn()}catch(e){console.error(fn.name,e);if(fn===drawMap)document.getElementById('maplegend').innerHTML='<p class="note">The map could not be drawn in this browser; the table below lists every country.</p>'}}});
