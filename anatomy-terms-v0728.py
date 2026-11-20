"""Attach exact, unambiguous English-to-Latin matches from the pinned TA2 CSV."""
import csv,hashlib,json
from collections import defaultdict
from pathlib import Path

source=Path('research-cache/anatomy-v0728/source/TA2.csv')
manifest=json.loads(Path('anatomy-source-v0728.json').read_text(encoding='utf-8'))
assert hashlib.sha256(source.read_bytes()).hexdigest()==manifest['files']['TA2.csv']['sha256']
candidates=defaultdict(list)
with source.open(encoding='utf-8-sig',newline='')as stream:
    for outer in csv.reader(stream):
        if len(outer)!=1:continue
        row=next(csv.reader([outer[0]],delimiter=';'))
        if len(row)>=3 and row[0].isdigit()and row[1].strip()and row[2].strip():
            candidates[row[1].strip().lower()].append({'id':row[0],'latin':row[2].strip()})
terms={key:rows[0]for key,rows in candidates.items()if len({r['latin']for r in rows})==1}
path=Path('anatomy-assets-v0728/human-anatomy-catalog-v0728.json')
catalog=json.loads(path.read_text(encoding='utf-8'))
count=0
for record in catalog['structures']:
    record.pop('latin',None);record.pop('ta2',None)
    term=terms.get(record['name'].lower().strip())
    if term and record['system']!='neuron':
        record['latin']=term['latin'];record['ta2']=term['id'];count+=1
catalog['terminology']={'source':'Pinned Z-Anatomy TA2.csv','matching':'Exact English label; ambiguous Latin matches omitted','componentsMatched':count,'sourceSha256':manifest['files']['TA2.csv']['sha256']}
data=json.dumps(catalog,ensure_ascii=False,separators=(',',':')).encode('utf-8');path.write_bytes(data)
delivery_path=Path('anatomy-delivery-v0728.json');delivery=json.loads(delivery_path.read_text())
delivery['catalog']={'file':path.name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
delivery_path.write_text(json.dumps(delivery,indent=2)+'\n',encoding='utf-8')
print('Attached exact source Latin terms to',count,'components;',len(data),'catalog bytes')
