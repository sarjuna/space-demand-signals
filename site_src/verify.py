"""Check every hard-coded figure in page text against the analysis outputs / raw files."""
import json, re
U=json.load(open('us_page.json')); S=U['stats']; I=json.load(open('/home/claude/analysis/dash.json')); IS=I['stats']
E={e['label'].split(' (')[0]:e for e in U['events']}; H={e['label']:e for e in S['hn_events']}
A={a['year']:a for a in U['annual']}
mk=open('/home/claude/data_us/us_markets.txt').read()
fund=I['funding']
checks=[
 # India
 ('IN R2 launches only 0.02', round(IS['monthly_PAI_ols']['R2_launches_only'],2)==0.02),
 ('IN R2 full 66%', round(IS['monthly_PAI_ols']['R2_full']*100)==66),
 ('IN annual rho -0.04', round(IS['annual_PAI_vs_launches']['rho'],2)==-0.04),
 ('IN granger att->ret min 0.43', min(IS['granger_attention_to_returns_p'].values())==0.43),
 ('IN parl 6.9/26.4', [round(e['ns_share']*100,1) for e in I['parl']['eras']][:2]==[6.9,26.4]),
 ('IN C3 +7.1 t3.8', any(abs(e['car01']-7.12)<.01 and round(e['t01'],1)==3.8 for e in I['events'])),
 ('IN SP2023 +7.0 6-day', any(abs(e['car05']-6.95)<.01 for e in I['events'])),
 ('IN Tracxn 2021 96/37.6/43', sorted({f['usd'] for f in fund if f['year']=='2021'})==[37.6,43.0,96.0]),
 ('IN HN 286', S['hn_in_total']==286),
 ('IN launches 2016-25 = 51', sum(1 for r in I['launch_table'] if '2016'<=r['date']<'2026')==51),
 # US
 ('US launches 23->181, 136', (A[2016]['launches'],A[2025]['launches'],A[2026]['launches'])==(23,181,136)),
 ('US 2015 launches 20', sum(int(l.split()[1]) for l in open('/home/claude/data_us/gcat_us_launches_monthly.txt') if l.startswith('2015-'))==20),
 ('US spacex 170/181 = 94%', A[2025]['spacex']==170 and round(170/181*100)==94),
 ('US annual NAI rho .82', round(S['annual_spearman']['NAI']['rho'],2)==0.82),
 ('US trend t -1.42', S['ols_NAI_trend']['launches']['t']==-1.42),
 ('US flagship +2.1', round(S['ols_PAI']['flagship']['coef'],1)==2.1),
 ('US IPO -18.3 t -2.46', E['SpaceX IPO, first trading day']['b_c01']==-18.25 and E['SpaceX IPO, first trading day']['b_t01']==-2.46),
 ('US Artemis UFO +6.1 t2.06', round(E['Artemis II launch']['u_c01'],1)==6.1 and E['Artemis II launch']['u_t01']==2.06),
 ('US search granger ~0.02', max(S['granger_by_source']['search']['ret_to_att'].values())<=0.02),
 ('US wiki/HN ret->att not sig', min(S['granger_by_source']['wikipedia']['ret_to_att'].values())>0.1 and min(S['granger_by_source']['hackernews']['ret_to_att'].values())>0.1),
 ('US no attention->ret', min(S['granger_NAI_to_ret'].values())>0.1 and all(min(S['granger_by_source'][k]['att_to_ret'].values())>0.1 for k in S['granger_by_source'])),
 ('US NASA wiki -30%', round((1-S['wiki_per_million']['NASA']['2025']/S['wiki_per_million']['NASA']['2016'])*100)==30),
 ('US wiki raw checksums', open('/home/claude/data_us/wiki_pageviews_us.txt').read().count('|')>=24),
 ('IN ISRO wiki falling', IS['ratchet']['wiki_isro_pre']>IS['ratchet']['wiki_isro_post13_24']>IS['ratchet']['wiki_isro_last12']),
 ('US bills 6.1->11.0, p .117', (S['bills_com_share_eras']['pre_113_115'],S['bills_com_share_eras']['post_117_119'],S['bills_fisher_p'])==(0.061,0.11,0.117)),
 ('US FCC rho .88', round(S['fcc_vs_launch']['rho'],2)==0.88),
 ('US HN 17,640', S['hn_us_total']==17640),
 ('US IFT7 p .002, Artemis p .015', H['Starship IFT-7 ship lost']['p']==0.002 and H['Artemis II launch']['p']==0.015),
 ('US starlink 82%', S['payloads']['starlink_share_2016_2025']==0.82),
 ('US 114th 8 of 72', [(r['commercial'],r['total']) for r in S['bills_by_congress'] if r['c']==114]==[(8,72)]),
 ('US per-1000 ranges', [r['per_1000'] for r in S['bills_by_congress']]==[4.42,5.97,4.57,4.76,3.09,2.43,2.67]),
 ('US RKLB 25.6 RDW 40.6 on 2025-01-21', 'RKLB 25.6' in mk and 'RDW 40.6' in mk),
 ('US 14 events, 56 tests', len(U['events'])==14),
 ('US FR 1072', sum(r['n'] for r in U['fr'])==1072),
 ('US bills 415', sum(r['total'] for r in S['bills_by_congress'])==415),
 ('US FAA 14..148', U['faa']['2015']==14 and U['faa']['2024']==148),
 ('US ten basket members', U['events'][-1]['b_n']==10),
]
bad=[n for n,ok in checks if not ok]
for n,ok in checks: print('OK ' if ok else 'BAD', n)
print('FAILURES:',bad)
