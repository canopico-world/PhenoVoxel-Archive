"""Reproduce PhenoVoxel's scoped secondary analysis. Python 3; numpy, openpyxl, pandas, pyarrow.
Inputs stay in research-cache/motor-lab-v0719. Outputs are versioned JSON/CSV.
Run: python motor-lab-prepare-v0719.py [--download]
Source tables/code are read as data, never executed. No neural dynamics are fitted.
"""
from pathlib import Path
import json, hashlib, urllib.request, zipfile, sys, csv
import numpy as np
import openpyxl
import pyarrow as pa
import pyarrow.feather as feather
import pyarrow.ipc as ipc
import pyarrow.compute as pc

ROOT=Path(__file__).resolve().parent
CACHE=ROOT/'research-cache/motor-lab-v0719'
CACHE.mkdir(parents=True,exist_ok=True)
BASE='https://storage.googleapis.com/flyem-male-cns/v1.0/'
URLS={
 'annotations.feather':BASE+'connectome-data/flat-connectome/body-annotations-male-cns-v1.0-minconf-0.5.feather',
 'weights.feather':BASE+'connectome-data/flat-connectome/connectome-weights-male-cns-v1.0-minconf-0.5.feather',
 'source-data.zip':'https://static-content.springer.com/esm/art%3A10.1038%2Fs41467-024-53173-w/MediaObjects/41467_2024_53173_MOESM10_ESM.zip'
}
IDS=[10360,801437,801469,11074,802562,805313]
for i in IDS:URLS[f'{i}.swc']=BASE+f'segmentation/skeletons-malecns/skeletons-swc/{i}.swc'
if '--download' in sys.argv:
 for name,url in URLS.items():
  if not (CACHE/name).exists():urllib.request.urlretrieve(url,CACHE/name)
def sha(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
manifest={n:{'url':u,'bytes':(CACHE/n).stat().st_size,'sha256':sha(CACHE/n)} for n,u in URLS.items()}
with zipfile.ZipFile(CACHE/'source-data.zip') as z:(CACHE/'Source Data 1.xlsx').write_bytes(z.read('Source Data 1.xlsx'))
workbook=openpyxl.load_workbook(CACHE/'Source Data 1.xlsx',read_only=True,data_only=True)
rows=list(workbook['1e'].values)
assert list(rows[0][2:])==list(range(421))
conditions=['FrontToBack','BackToFront','FullRotation']
flies=sorted({int(r[1]) for r in rows[1:]})
assert flies==list(range(1,18)) and len(rows)==1520
# 60 Hz author plotting convention, cropped from original frame 180; onset frame 120.
# Retain -2 to <5 s, discard endpoint 420; no extra smoothing or trial rejection.
traces=np.empty((17,3,420));counts=np.empty((17,3),int);trial_summaries=[]
for fi,fly in enumerate(flies):
 for ci,condition in enumerate(conditions):
  selected=[r for r in rows[1:] if int(r[1])==fly and r[0]==condition]
  a=np.asarray([r[2:422] for r in selected],float)
  assert np.isfinite(a).all() and len(a)>0
  corrected=a-a[:,:120].mean(axis=1)[:,None]
  traces[fi,ci]=corrected.mean(axis=0);counts[fi,ci]=len(a)
  for ti,value in enumerate(corrected[:,120:].mean(axis=1)):
   trial_summaries.append([fly,condition,ti+1,float(value)])
scalars=traces[:,:,120:].mean(axis=2)
mean=traces.mean(axis=0)
rng=np.random.default_rng(719)
resamples=rng.integers(0,17,(10000,17))
bootstrap=scalars[resamples].mean(axis=1)
ci=np.percentile(bootstrap,[2.5,97.5],axis=0).T
predictions=[]
for i,fly in enumerate(flies):
 train=np.delete(scalars,i,axis=0)
 predictions.append({'fly':fly,'observed':scalars[i].tolist(),'conditionMean':train.mean(axis=0).tolist(),'additiveFull':float(train[:,:2].sum(axis=1).mean()),'trainingFlies':[x for x in flies if x!=fly]})
condition_mae=np.mean(np.abs(np.asarray([p['conditionMean'] for p in predictions])-scalars),axis=0)
additive_mae=np.mean([abs(p['additiveFull']-p['observed'][2]) for p in predictions])
published={str(r[0]):[float(v) for v in r[1:]] for r in list(workbook['1g-h'].values)[1:]}
assert np.allclose(np.array(published['mean_FrontToBack'])+published['mean_BackToFront'],published['mean_linear_prediction'])
behavior={
 'version':'0.7.19','paper':'https://doi.org/10.1038/s41467-024-53173-w','license':'CC BY 4.0',
 'authors':'Pokusaeva, Satapathy, Symonova & Joesch (2024)',
 'source':manifest['source-data.zip'],'workbookSha256':sha(CACHE/'Source Data 1.xlsx'),'sheet':'1e',
 'conditions':conditions,'flies':flies,'counts':counts.tolist(),'trialCount':1519,
 'sampleHz':60,'onsetIndex':120,'sampleCount':420,'timeStart':-2,
 'traces':np.round(traces,5).tolist(),'scalarResponses':scalars.tolist(),'mean':np.round(mean,5).tolist(),
 'meanCI95':ci.tolist(),'bootstrap':{'unit':'fly','replicates':10000,'seed':719,'method':'paired percentile bootstrap of the across-fly mean'},
 'heldOut':predictions,'metrics':{'conditionMeanMAE':condition_mae.tolist(),'additiveFullMAE':float(additive_mae)},
 'publishedComparison':{'sheet':'1g-h','curves':published,'note':'Published aggregate curves retained separately; not substituted for the 17-fly secondary analysis. Author plotting code applies additional selection, including trial-count criteria.'},
 'method':{
  'population':'17 male Canton-S flies; study used 2–6-day-old males, raised at 18 C. Freely walking arena, 60 Hz tracking and green projector (~520 nm). Different specimens from MaleCNS and FlyBody.',
  'preprocessing':'All 1519 deposited sheet-1e trials. Per-trial mean over frames 0–119 subtracted; average trials within each fly and condition, then equally weight 17 flies. Frames 0–419 retained, onset at 120, 60 Hz. No additional smoothing or selection.',
  'sign':'Positive means turning with the source-normalized stimulus direction; negative means against it. Absolute clockwise/counterclockwise identity is not retained here.',
  'prediction':'For each held-out fly, condition-mean baseline averages the other 16 flies. Additive full-field hypothesis sums their front-to-back and back-to-front means. Target is mean angular speed during 0 to <5 s, in degrees/s.',
  'limits':'Post-hoc secondary analysis within one deposited dataset. No prospective validation, neural model or prediction of an arbitrary individual. CI concerns the sample mean, not individual outcomes. Stimulus speeds/contrasts and full trial-level provenance are not exposed by this figure table; no continuous tuning controls or exact arena reenactment are claimed.',
  'timingEvidence':'https://github.com/joesch-lab/Bilateral-course-control/blob/114dd16720501570ba0e6bfe27b04d6a39cba46b/Behaviour/FlyOptomotorResponse/draw_trace_plot.py',
  'timingReason':'Author plot functions label frame positions divided by 60 and use start=180, axvline=120 for the 7 s cropped view. Endpoint omitted to align 420 samples with published aggregate curves.'
 }
}
(ROOT/'motor-behavior-v0719.json').write_text(json.dumps(behavior,separators=(',',':')),encoding='utf-8')
with (ROOT/'motor-trials-v0719.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.writer(f);w.writerow(['fly_id','condition','within_condition_trial_index','baseline_corrected_mean_angular_speed_deg_s']);w.writerows(trial_summaries)

ann=feather.read_table(CACHE/'annotations.feather').to_pandas().set_index('bodyId')
paths=[{'id':'dna02','name':'DNa02 · right side','ids':[10360,801437,801469],'weights':[195,442]},
       {'id':'dng13','name':'DNg13 · left side','ids':[11074,802562,805313],'weights':[69,185]}]
expected={(p['ids'][j],p['ids'][j+1]):p['weights'][j] for p in paths for j in range(2)}
found={}
dn_ids=pa.array([10360,11074])
intrinsic_ids=pa.array(ann.index[ann['superclass']=='vnc_intrinsic'].tolist())
motor_ids=pa.array(ann.index[(ann['superclass']=='vnc_motor') & (ann['somaNeuromere']=='T1')].tolist())
outgoing={10360:[],11074:[]};motor_inputs={}
with pa.memory_map(str(CACHE/'weights.feather'),'r') as src:
 reader=ipc.open_file(src)
 for i in range(reader.num_record_batches):
  batch=reader.get_batch(i)
  for e in batch.filter(pc.is_in(batch.column(0),pa.array(sorted({k[0] for k in expected})))).to_pylist():
   key=(e['body_pre'],e['body_post'])
   if key in expected:found[key]=int(e['weight'])
  eligible=batch.filter(pc.and_(pc.greater_equal(batch.column(2),10),pc.or_(pc.is_in(batch.column(0),dn_ids),pc.and_(pc.is_in(batch.column(0),intrinsic_ids),pc.is_in(batch.column(1),motor_ids)))))
  for e in eligible.to_pylist():
   pre,post,weight=int(e['body_pre']),int(e['body_post']),int(e['weight'])
   if pre in outgoing:outgoing[pre].append((post,weight))
   else:motor_inputs.setdefault(pre,[]).append((post,weight))
assert found==expected
for path in paths:
 candidates=[]
 for mid,first in outgoing[path['ids'][0]]:
  for end,second in motor_inputs.get(mid,[]):candidates.append((min(first,second),first,second,mid,end))
 winner=max(candidates)
 assert list(winner[3:])==path['ids'][1:] and list(winner[1:3])==path['weights']
neurons=[]
for id in IDS:
 row=ann.loc[id];nodes=[]
 for line in (CACHE/f'{id}.swc').read_text().splitlines():
  if not line.strip() or line.startswith('#'):continue
  v=[float(x) for x in line.split()];nodes.append([int(v[0]),int(v[6]),*[int(x) if x.is_integer() else x for x in v[2:5]]])
 keys={n[0] for n in nodes};assert len(keys)==len(nodes)
 assert all(n[1]==-1 or n[1] in keys for n in nodes)
 neurons.append({'id':str(id),'name':row['instance'],'type':row['type'],'superclass':row['superclass'],'side':row['somaSide'],'statusLabel':row['statusLabel'],'neuromere':row['somaNeuromere'],'exitNerve':row['exitNerve'],'vfbId':row['vfbId'],'source':manifest[f'{id}.swc'],'nodes':nodes})
neural={'version':'0.7.19','dataset':'MaleCNS v1.0','license':'CC BY 4.0','download':'https://male-cns.janelia.org/download/','annotations':manifest['annotations.feather'],'weights':manifest['weights.feather'],'unitToMicrometres':.008,'nodeFormat':['id','parent','x','y','z'],'neurons':neurons,'paths':paths,
 'selection':'For each selected descending neuron, consider two-edge paths through annotated vnc_intrinsic cells to T1 vnc_motor cells, each edge at least 10 synapses. Display the path with highest bottleneck (minimum edge weight); ties use first-edge weight, second-edge weight, intermediary ID, endpoint ID, descending. This is a transparent illustration subset, not a proven functional route.',
 'limits':'Counts are reconstructed chemical connectivity at source minconf 0.5. No connection strength, neurotransmitter sign, neural activity, gap-junction inventory or causal leg trajectory is inferred. Skeletons preserve all source centerline nodes, not membranes. Cells share one male CNS coordinate system, but are not registered to the female FlyBody model. Experimental findings are cell-type-level from other flies.',
 'behaviorReference':'https://doi.org/10.1016/j.cell.2024.08.033'}
(ROOT/'motor-neurons-v0719.json').write_text(json.dumps(neural,separators=(',',':')),encoding='utf-8')
(CACHE/'input-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps({'files':{n:(ROOT/n).stat().st_size for n in ['motor-behavior-v0719.json','motor-neurons-v0719.json','motor-trials-v0719.csv']},'means':scalars.mean(axis=0).tolist(),'ci95':ci.tolist(),'heldOutMAE':behavior['metrics']}))
