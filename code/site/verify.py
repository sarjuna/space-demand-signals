"""Check every hard-coded figure in page text against the analysis outputs / raw files."""
import json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from paths import *
U=json.load(open(DER_US / 'us_page.json')); S=U['stats']; I=json.load(open(DER_IN / 'dash.json')); IS=I['stats']
E={e['label'].split(' (')[0]:e for e in U['events']}; H={e['label']:e for e in S['hn_events']}
A={a['year']:a for a in U['annual']}
mk=open(RAW_US / 'markets_us.txt').read()
fund=I['funding']
X=json.load(open(ROOT/'data/derived/index/index_page.json'))
VR={o['id']:o for o in json.load(open(ROOT/'data/derived/var/var_results.json'))}
import pandas as _pd
from statsmodels.tsa.stattools import adfuller as _adf
nsig=lambda o,k:sum(x[k]<0.05 for x in (o['aic'],o['bic'],o['fixed3'],o['robust']['no_dummies'],o['robust']['to_2026_05']))
checks=[
 # India
 ('IN R2 launches only 0.02', round(IS['monthly_PAI_ols']['R2_launches_only'],2)==0.02),
 ('IN R2 full 66%', round(IS['monthly_PAI_ols']['R2_full']*100)==66),
 ('IN annual rho -0.04', round(IS['annual_PAI_vs_launches']['rho'],2)==-0.04),
 ('IN granger att->ret min 0.43', min(IS['granger_attention_to_returns_p'].values())==0.43),
 ('IN parl 6.9/26.4', [round(e['ns_share']*100,1) for e in I['parl']['eras']][:2]==[6.9,26.4]),
 ('Q event coef 1.663 t 3.53', (lambda q: q['q1_event']['coef']==1.663 and q['q1_event']['t']==3.53)(json.load(open(ROOT/'data/derived/quantum/quantum.json'))['stats'])),
    ('Q revenue rho level .678 change .429', (lambda q: q['q2_revenue']['level']['rho']==0.678 and q['q2_revenue']['change']['rho']==0.429)(json.load(open(ROOT/'data/derived/quantum/quantum.json'))['stats'])),
    ('Q IonQ share 35.3 -> 80.1', (lambda q: q['q3_rev_share_ionq']['2022']==35.3 and q['q3_rev_share_ionq']['2025']==80.1)(json.load(open(ROOT/'data/derived/quantum/quantum.json'))['stats'])),
    ('Q Nvidia remark CAR -53.56 t -5.2, BH < .001', (lambda e: e['c01']==-53.56 and e['t01']==-5.2 and e['p01_bh']<0.001)(next(e for e in json.load(open(ROOT/'data/derived/quantum/quantum.json'))['stats']['events'] if e['label']=='Nvidia CEO remark'))),
    ('Q Granger ret->firm lag3 .009', json.load(open(ROOT/'data/derived/quantum/quantum.json'))['stats']['q4']['ret_to_firm']['3']==0.009),
    ('US contracts total FY16 290 FY25 4476', U['contracts']['total'][0]==290 and U['contracts']['total'][-2]==4476),
    ('IN C3 corrected t0 24 Aug, +2.9 t1.5', any(e['t0']=='2023-08-24' and abs(e['car01']-2.88)<.01 and round(e['t01'],1)==1.5 for e in I['events'])),
 ('IN SP2023 +7.0 6-day', any(abs(e['car05']-6.95)<.01 for e in I['events'])),
 ('IN Tracxn 2021 96/37.6/43', sorted({f['usd'] for f in fund if f['year']=='2021'})==[37.6,43.0,96.0]),
 ('IN HN 286', S['hn_in_total']==286),
 ('IN launches 2016-25 = 51', sum(1 for r in I['launch_table'] if '2016'<=r['date']<'2026')==51),
 # US
 ('US launches 23->181, 136', (A[2016]['launches'],A[2025]['launches'],A[2026]['launches'])==(23,181,136)),
 ('US 2015 launches 20', sum(int(l.split()[1]) for l in open(RAW_US / 'gcat_launches_us.txt') if l.startswith('2015-'))==20),
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
 ('US wiki raw checksums', open(RAW_US / 'wikipedia_pageviews_us.txt').read().count('|')>=24),
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

 # Space Signals Index (overview)
 ('IDX latest quarter complete and same for both', X['india']['latest']['quarter']==X['us']['latest']['quarter']=='2026Q3'),
 ('IDX US attention decade high', abs(max(X['us']['q_att'])-X['us']['latest']['attention'])<0.06),
 ('IDX India gap within +-5 (in line), US >5', abs(X['india']['latest']['gap'])<=5 and X['us']['latest']['gap']>5),
 ('IDX India gap negative 2025Q1-2026Q2', all(g<0 for q,g in zip(X['india']['quarters'],X['india']['q_gap']) if '2025Q1'<=q<='2026Q2')),
 ('IDX India clearly-behind run 2025Q1-2026Q2 (6q), US 2025Q2-2026Q1 (4q)',
   [q for q,g in zip(X['india']['quarters'][:-1],X['india']['q_gap'][:-1])][-6:]==['2025Q1','2025Q2','2025Q3','2025Q4','2026Q1','2026Q2'] and all(g<-5 for g in X['india']['q_gap'][-7:-1]) and X['india']['q_gap'][-8]>=-5
   and all(g<-5 for g in X['us']['q_gap'][-6:-2]) and X['us']['q_gap'][-7]>=-5 and X['us']['quarters'][-6]=='2025Q2'),
 ('IDX US build-out eased 0.5, India rose 3.3, India attention +9.8', X['us']['latest']['d_buildout']==-0.5 and X['india']['latest']['d_buildout']==3.3 and X['india']['latest']['d_attention']==9.8),
 ('IDX US gap widest since 2021', max(g for q,g in zip(X['us']['quarters'][:-1],X['us']['q_gap'][:-1]) if q>='2021Q2')<X['us']['latest']['gap']<=max(g for q,g in zip(X['us']['quarters'],X['us']['q_gap']) if q[:4]=='2021')),
 ('IDX US build-out within 2 of decade high', max(X['us']['q_bo'])-X['us']['latest']['buildout']<2),
 ('IN commercial satellites 17', int(__import__('pandas').read_csv(ROOT/'data/csv/india/india_monthly.csv').sats_commercial.sum())==17),
 ('US launches 2016->2025 almost eightfold', 7.5<A[2025]['launches']/A[2016]['launches']<8),
 ('IN Tracxn 2021 spread 2.6-fold', round(96/37.6,1)==2.6),
 ('IN Vikram-1 private, orbital, successful', __import__('pandas').read_csv(ROOT/'data/csv/india/india_launches.csv').query("lv=='Vikram-1'")[['orbital','success','private']].all(axis=None)),
 # VAR (overview table/text is computed from var_results.json; these check the hard-coded copies in the comparison table and Methods)
 ('VAR IN-1 prices->attention p .002, 3 of 5', VR['IN-1']['aic']['b_to_a']==0.002 and nsig(VR['IN-1'],'b_to_a')==3 and VR['IN-1']['aic']['b_to_a']<0.05/8),
 ('VAR no attention-first lead robust (max 1 of 5)', max(nsig(o,'a_to_b') for o in VR.values())==1),
 ('VAR US both directions not robust', nsig(VR['US-1'],'a_to_b')<5 and nsig(VR['US-1'],'b_to_a')<5),
 ('VAR samples 73/62/129/129', [VR[k]['n'] for k in ('IN-1','US-1','IN-2','US-2')]==[73,62,129,129]),
 ('VAR stable all, whiteness main >=0.16, ADF <0.01', all(o[t]['stable'] for o in VR.values() for t in ('aic','bic','fixed3')) and min(o['aic']['white_p'] for o in VR.values())>=0.16 and max(v for o in VR.values() for v in o['adf'].values())<0.01),
 ('VAR US NAI level ADF p 0.62', round(_adf(_pd.read_csv(ROOT/'data/csv/us/us_monthly.csv').NAI.dropna(),autolag='AIC')[1],2)==0.62),
 ('VAR attention->launch/launch->attention all p>=0.33', min(x[k] for i in ('IN-2','US-2') for x in (VR[i]['aic'],VR[i]['bic'],VR[i]['fixed3'],VR[i]['robust']['no_dummies'],VR[i]['robust']['to_2026_05']) for k in ('a_to_b','b_to_a'))>=0.33),
 ('VAR lead-only IRFs: no attention->other band excludes zero', all(abs(m)<1.96*se+1e-9 for o in VR.values() for m,se in zip(o['irf_rev']['a_to_b'],o['irf_rev']['a_to_b_se']))),
 ('CSV audit 19,374 values', '19374' in __import__('subprocess').run([sys.executable,str(ROOT/'code/site/audit_csv.py')],capture_output=True,text=True).stdout.replace(',','')),
]
bad=[n for n,ok in checks if not ok]
for n,ok in checks: print('OK ' if ok else 'BAD', n)
print('FAILURES:',bad)
sys.exit(1 if bad else 0)
