"""Build the learning exhibit from the frozen PV-SENSE-001 evidence bundle.
No new biological data, fitted parameters or camera measurements. Python stdlib only.
Run: python sense-learning-data-v0718.py
"""
import hashlib
import json
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent
bundle = json.loads((ROOT / 'sensory-benchmark-v0714.json').read_text(encoding='utf-8'))
files = {f['path']: f for f in bundle['files']}

def read(name):
    f = files[name]
    raw = f['content'].encode('utf-8')
    assert hashlib.sha256(raw).hexdigest() == f['sha256']
    return json.loads(raw)

atlas, curves, inputs, seq = map(read, ['atlas.json', 'curves.json', 'inputs.json', 'sequences.json'])
groups = defaultdict(list)
for r in inputs['behavior']['rows']:
    groups[(r['fish'], r['color'])].append(r)
observations = []
for (fish, color), rows in sorted(groups.items()):
    trials = [r for r in rows if r['jnd'] > 0]
    if not trials:
        continue
    observations.append({'fish': fish, 'color': color, 'n': len(trials),
                         'successes': sum(r['success'] for r in trials),
                         'condition': trials[0]['condition'],
                         'minJnd': min(r['jnd'] for r in trials),
                         'maxJnd': max(r['jnd'] for r in trials)})

configs = {
 'apis-mellifera': ('bee', [300,700], ['UV','Blue','Green'], 'Reference sensitivity', 'beeCurves'),
 'drosophila-melanogaster': ('fly', [315,550], ['Rh3','Rh4','Rh5'], 'Normalized ERG proxy', 'flyERG'),
 'amphiprion-ocellaris': ('clownfish', [300,700], ['U','M1','M2','L'], 'Pigment × lens model', 'fishBehavior'),
}
for s in atlas['species']:
    key, domain, channels, measure, ref = configs[s['id']]
    s.update({'domain': domain, 'channels': channels, 'curveKey': key, 'measure': measure, 'curveRef': ref})
    s['molecules'] = []
    for r in seq['records']:
        if r['accession'] in s['records']:
            s['molecules'].append({k:r.get(k) for k in ['accession','gene','sourceMolecule','codingSequence','protein','proteinAccession','url','translationCheck','proteinSha256']})
out = {'version':'0.7.18','sourceBenchmark':'PV-SENSE-001 v1.0',
       'sourceHashes':{n:files[n]['sha256'] for n in ['atlas.json','curves.json','inputs.json','sequences.json']},
       'species':atlas['species'],'references':atlas['references'],'curves':curves,
       'observations':observations,
       'behaviorScope':'Descriptive counts only: individual × color, nonzero-contrast trials pooled over contrast levels. Not a new prediction, causal UV comparison or independent replication.',
       'behaviorTotals':{'allTrials':4411,'nonzeroTrials':3921,'controls':490,'individuals':11},
       'terms':{'code':'MIT','beeCurves':'Vasas et al. (2024), Figure S17A supporting data; CC BY 4.0. Interpolated to 1 nm in the existing benchmark.',
                'flyCurves':'Sharkey et al. (2020); CC BY 4.0. Normalized short-range ERG means, 315–550 nm only.',
                'fishCurvesAndChoices':'Mitchell et al. (2024), Dryad 10.5061/dryad.wwpzgmsp9; CC0. Lens-weighted templates and descriptive trial aggregation.',
                'sequences':'NCBI source policies / UniProt CC BY 4.0; accession, source and sequence retained. Records do not establish protein abundance.',
                'note':'This exhibit does not include the separately restricted SPECTACLE phone-sensor curves. The linked original benchmark retains its own mixed data terms.'}}
(ROOT/'sense-learning-data-v0718.json').write_text(json.dumps(out,separators=(',',':'),ensure_ascii=False)+'\n',encoding='utf-8')
print('Built exhibit data:',len(observations),'fish/color groups; trials:',sum(r['n'] for r in observations))
