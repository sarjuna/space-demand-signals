// Re-pull of data/raw/global/itu_leo_filings.txt. Run in a browser tab on
// https://www.itu.int/itu-r/space/apps/public/spaceexplorer/networks-explorer (the public ITU Space Explorer).
// Uses the same API calls the page makes. Written 13 Nov 2026. Returns the aggregate text and the SHA-256 of the per-notice extract.
async function pullLeoFilings() {
  const API = '/itu-r/space/apps/ep/spaceexplorer/v1';
  const body = {"general":{"network":"active","adm":[],"networkOrgCode":[],"satelliteName":[],"serviceType":"all"},
    "satNetworkTypes":{"geo":false,"geoFrom":null,"geoTo":null,"nonGeo":true,"apogeeFrom":null,"apogeeTo":2000,"perigeeFrom":null,"perigeeTo":null,
      "minAltitudeFrom":null,"minAltitudeTo":null,"referenceBody":null,"constelattion":false,"shortDurationMission":false},
    "frequencies":[],
    "regProcess":{"SuppressionStatus":"All","masterReg":false,"nonPlanBand":false,"bssPlanBand":false,"fssPlanBand":false,"esimPlanBand":false,
      "nonPlan":{"advancePublications":true,"coordination":true,"dueDiligence":true,"notification":true,"planNon":true,"res35":true,"res8":true,"BiuDate":false},
      "bssPlan":{"downRegion1and3":true,"feederRegion1and3":true,"overallRegion2":true,"planBssAll":true,"pendingArt4":true,"listArt4":true,"dueDiligence":true,
        "notificationArt5":true,"sofArt2aCoordination":true,"sofArt2aNotification":true,"planBss":true,"BiuDate":false},
      "fssPlan":{"planFssAll":true,"planFss":true,"pendingArt6":true,"listArt6":true,"dueDiligence":true,"notificationArt8":true,"BiuDate":false},
      "esimPlan":{"planEsimAll":true,"pending":true,"list":true,"notification":true,"BiuDate":false}},
    "publications":{"latestBrIfic":false,"brIficNumberFrom":null,"brIficNumberTo":null,"brIficDateFrom":null,"brIficDateTo":null,"specialSection":[],"specialSectionNumber":null},
    "regDates":{"brNoticeDateReceiptFrom":null,"brNoticeDateReceiptTo":null,"networkProtectionDateFrom":null,"networkProtectionDateTo":null,"useDateFrom":null,"useDateTo":null,"useLimitDateFrom":null,"useLimitDateTo":null},
    "orderBy":"","skip":0,"take":1000};
  const post = b => fetch(API + '/queries', {method:'POST', headers:{'Content-Type':'application/json','Cache-Control':'no-cache'}, body:JSON.stringify(b)}).then(r => r.json());
  const L = [];
  for (let s = 0; ; s += 1000) { const j = await post({...body, skip:s}); L.push(...j.table); if (L.length >= j.total || !j.table.length) break; }
  const OI = {}; const q = [...L];
  await Promise.all(Array.from({length:8}, async () => { while (q.length) { const x = q.shift();
    const j = await fetch(`${API}/dashboard/space-stations/nonGeo/orbitalInfo/non-plans/${encodeURIComponent(x.sat_name)}/${x.ntc_id}/orbitalInfo`).then(r => r.json());
    const c = (j.orbitalInfo && j.orbitalInfo.smallCard) || {};
    OI[x.ntc_id] = [c.perig_km ?? null, c.apog_km ?? null, c.nbr_sat ?? null, c.nbr_sat_notified ?? null, c.config_nbr_sat_min ?? null, c.config_nbr_sat_max ?? null, c.f_constell ?? null, c.ref_body ?? null]; } }));
  L.sort((a, b) => a.ntc_id - b.ntc_id);
  const tsv = L.map(n => [n.ntc_id, n.adm, n.ntwk_org || '', n.sat_name, n.ntf_rsn, n.prov, n.d_rcv, ...OI[n.ntc_id].map(v => v == null ? '' : v)].join('|')).join('\n');
  const sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tsv)))).map(b => b.toString(16).padStart(2, '0')).join('');
  // Exclusions and aggregation as documented in the raw file header
  const keep = L.filter(n => { const o = OI[n.ntc_id]; return o[7] === 'T' && o[1] != null && o[1] >= 100; });
  const nsat = n => { const o = OI[n.ntc_id]; return o[2] ?? o[5] ?? o[3] ?? 0; };
  return { notices: L.length, kept: keep.length, sha, tsv, keep, nsat };   // aggregate as in the raw file (per adm, per year, per network max satellites)
}
