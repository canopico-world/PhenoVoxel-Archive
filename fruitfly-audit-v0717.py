"""Frozen-model external kinematic audit. Python 3.11+, numpy, scipy, mujoco.
No fitting, no neural simulation, no population confidence interval.
Download inputs listed in fruitfly-inputs-v0717.json into the cache directory.
Code: MIT; upstream files retain their separately identified licenses.
"""
import json, pathlib, sys, pickle, importlib, hashlib, csv
ROOT = pathlib.Path(__file__).resolve().parent
CACHE = ROOT / 'research-cache/fruitfly-v0717'
deps = ROOT / 'research-cache/fruitfly-v0716/pydeps'
if deps.exists(): sys.path.insert(0, str(deps))
import numpy as np
from scipy.io import loadmat
from scipy.signal import welch
from scipy.stats import wasserstein_distance
import mujoco

class ArrayOnly(pickle.Unpickler):
    def find_class(self, module, name):
        if module in ('numpy', 'numpy.core.multiarray', 'numpy._core.multiarray') and name in ('ndarray', 'dtype', '_reconstruct', 'scalar'):
            return getattr(importlib.import_module(module), name)
        raise ValueError('Unapproved pickle global: ' + module + '.' + name)

def interior(a, b, c):
    u, v = a-b, c-b
    return np.degrees(np.arccos(np.clip(np.sum(u*v, axis=-1) / (np.linalg.norm(u, axis=-1)*np.linalg.norm(v, axis=-1)), -1, 1)))

def workspace(coxa, claw, femur, tibia):
    rel = claw-coxa
    length = np.median(np.linalg.norm(tibia-femur, axis=-1))
    return float(np.sqrt(np.mean(np.sum((rel-rel.mean(axis=0))**2, axis=-1))) / length)

def quantiles(x): return np.percentile(x, [5, 50, 95]).round(4).tolist()

def main():
    inputs = json.loads((ROOT/'fruitfly-inputs-v0717.json').read_text())
    for item in inputs['files']:
        p = (ROOT if item.get('root') else CACHE)/item['file']
        b = p.read_bytes()
        if hashlib.sha256(b).hexdigest() != item['sha256']: raise ValueError('Input hash mismatch: '+str(p))
    source = json.loads((ROOT/'fruitfly-motion-source-v0716.json').read_text())
    m = mujoco.MjModel.from_xml_path(str(ROOT/'fruitfly-kinematics-v0716.xml'))
    d = mujoco.MjData(m)
    indices = [m.jnt_qposadr[mujoco.mj_name2id(m,mujoco.mjtObj.mjOBJ_JOINT,n)] for n in source['jointNames']]
    # DeepFly3D's 38-landmark order, not the newer 30-landmark prism order.
    legs = {'RF':(0,'T1_right'), 'RM':(5,'T2_right'), 'RH':(10,'T3_right'),
            'LF':(19,'T1_left'), 'LM':(24,'T2_left'), 'LH':(29,'T3_left')}
    model = {leg:[] for leg in legs}
    for row in source['walk']['qpos']:
        d.qpos[:] = m.qpos0; d.qpos[indices] = row; mujoco.mj_forward(m,d)
        for leg, (_, suffix) in legs.items():
            model[leg].append([d.xpos[mujoco.mj_name2id(m,mujoco.mjtObj.mjOBJ_BODY,part+'_'+suffix)].copy() for part in ['coxa','femur','tibia','tarsus','claw']])
    comparisons=[]
    for fly in (1,2,3):
        with (CACHE/f'nmf-fly{fly}-pose.pkl').open('rb') as f: raw = ArrayOnly(f).load()['points3d']
        assert raw.shape == (1000,38,3) and np.isfinite(raw).all()
        for leg,(offset,_) in legs.items():
            measured=raw[:,offset:offset+5,:]; predicted=np.asarray(model[leg])
            x=interior(predicted[:,1],predicted[:,2],predicted[:,3])
            y=interior(measured[:,1],measured[:,2],measured[:,3])
            a=workspace(predicted[:,0],predicted[:,4],predicted[:,1],predicted[:,2])
            b=workspace(measured[:,0],measured[:,4],measured[:,1],measured[:,2])
            comparisons.append({'fly':fly,'leg':leg,'modelAngleP05MedianP95':quantiles(x),'recordedAngleP05MedianP95':quantiles(y),
                'angleWassersteinDeg':float(wasserstein_distance(x,y)), 'modelFootSpread':a, 'recordedFootSpread':b,
                'footSpreadDifference':a-b,'recordedFrames':len(y),'modelFrames':len(x)})
    # Keep each recording separate. Repeated recordings are not independent flies.
    halts=loadmat(CACHE/'untreatedhalteredata.mat',simplify_cells=True)['halts']
    selected=[h for h in halts if bool(h['untreatedanimal'])]
    haltere=[{'recording':h['fname'],'sourceFrequencyHz':float(h['hbf']),
              'observedElevationRangeDeg':float(np.ptp(h['haltang'])), 'frames':len(h['haltang']),
              'fps':int(h['fps']), 'modelFrequencyDifferenceHz':218-float(h['hbf'])} for h in selected]
    wings=loadmat(CACHE/'wingbeatdata.mat',simplify_cells=True)['wings']
    flight=[]
    for w in wings:
        if w['treatment']!=0: continue
        beat=np.asarray(w['beat']); valid=np.isfinite(beat)
        # Longest continuous finite segment; never concatenate across missing frames.
        edges=np.diff(np.r_[False,valid,False].astype(int)); starts=np.flatnonzero(edges==1); stops=np.flatnonzero(edges==-1)
        if not len(starts): continue
        j=np.argmax(stops-starts); x=beat[starts[j]:stops[j]]; fs=float(w['fs'])
        if len(x)<fs: continue
        f,p=welch(x,fs=fs,nperseg=min(len(x),int(fs*2)),detrend='constant')
        band=(f>=100)&(f<=min(350,fs*.45)); hz=float(f[band][np.argmax(p[band])])
        flight.append({'recording':w['fname'],'dominantFrequencyHz':hz,'fs':fs,'finiteSeconds':len(x)/fs,'modelDifferenceHz':218-hz})
    result={'version':'0.7.17','species':'Drosophila melanogaster','scope':'Descriptive external comparison of frozen v0.7.16 motion; no optimization on these recordings.',
      'validatedPhysiology':False,'independentPopulationValidation':False,'confidenceInterval95':None,
      'walking':{'source':'https://doi.org/10.1038/s41592-022-01466-7','recordedFlies':3,'recordedSecondsPerFly':10,'recordedSamplingHz':100,
        'modelSeconds':source['walk']['sourceDuration'],'modelSamplingHz':1/source['walk']['timestep'],'originalModelRecordingHz':150,
        'modelInference':'FlyBody fits 13 top-view 2D landmarks, including six leg tips; knee locations and vertical swing paths are inferred, not directly tracked 3D joints. Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC12310536/#Sec20',
        'metric':'Physical femur–tibia interior angle between three landmarks; Wasserstein distribution distance in degrees. Foot spread is RMS claw displacement relative to coxa, centered on its mean, divided by median femur length.',
        'limitations':'Different individuals, recording contexts, speeds and durations; no synchronized frames, foot-contact forces or matched locomotor condition. Distribution distance is not pointwise reconstruction error. Three flies are insufficient for a general population accuracy claim.',
        'comparisons':comparisons},
      'flight':{'source':'https://doi.org/10.5061/dryad.g1jwstqwj','modelFrequencyHz':218,'untreatedHaltereRecords':haltere,'untreatedWingRecords':flight,
        'metric':'Published annotated haltere frequency; Welch dominant frequency of the longest finite untreated wing signal (at least 1 s), 100–min(350,0.45fs) Hz search band. Both are recording-level summaries.',
        'limitations':'Tethered flight. Repeated recordings from the same flies; no independent-individual confidence interval. The supplied fly identifier table is MATLAB opaque and not decoded here. The haltere file lacks the README-described treat field: untreatedanimal is the supplied inclusion flag. Lateral 2D haltere angles and normalized wing signals cannot validate 3D wing trajectories or our haltere joint excursion.',
        'trajectoryError3D':None},
      'failures':['No matched free-walking or free-flight ground truth for this individual.', 'No full 3D wing trajectory error, ground contact/slip error, neural controller validation, or physiological validation.', 'Photo-guided material changes have no calibrated color/reflectance error.', 'Drosophila simulans in the 2026 Diptera archive excluded from species-specific comparison.'],
      'interpretation':'Do not interpret a frequency inside an observed range as proof of accurate flight. This audit can reveal mismatch, not establish universal biological validity.'}
    (ROOT/'fruitfly-audit-v0717.json').write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding='utf-8')
    with (ROOT/'fruitfly-walking-v0717.csv').open('w',newline='') as f:
        keys=['fly','leg','angleWassersteinDeg','modelFootSpread','recordedFootSpread','footSpreadDifference']
        writer=csv.DictWriter(f,fieldnames=keys,extrasaction='ignore');writer.writeheader();writer.writerows(comparisons)
    print(json.dumps({'walkingDistanceDeg':quantiles([r['angleWassersteinDeg'] for r in comparisons]),'untreatedHaltereRecords':len(haltere),'haltereHz':quantiles([r['sourceFrequencyHz'] for r in haltere]),'untreatedWingRecords':len(flight),'wingHz':quantiles([r['dominantFrequencyHz'] for r in flight])}))

if __name__=='__main__': main()
