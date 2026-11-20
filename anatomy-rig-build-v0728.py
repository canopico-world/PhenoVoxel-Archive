import json
from pathlib import Path

folder=Path('research-cache/anatomy-v0728')
source=json.loads((folder/'biomechanics-inspection.json').read_text(encoding='utf8'))
rig=next(r for r in source['rigs']if r['name']=='Armature')
lookup={b['name']:b for b in rig['bones']}
definitions=[
    ('Pelvis',-1,'Hips'),('Lumbar spine',0,'LowerBack'),('Thorax',1,'Spine'),
    ('Neck',2,'Neck1'),('Head',3,'Head'),('Mandible',4,'Mandible'),
    ('Left shoulder',2,'LeftShoulder'),('Left upper arm',6,'LeftArm'),
    ('Left forearm',7,'LeftForeArm'),('Left hand',8,'LeftHand'),
    ('Right shoulder',2,'RightShoulder'),('Right upper arm',10,'RightArm'),
    ('Right forearm',11,'RightForeArm'),('Right hand',12,'RightHand'),
    ('Left hip',0,'LeftUpLeg'),('Left knee',14,'Tibia.l'),('Left ankle',15,'LeftFoot'),
    ('Right hip',0,'RightUpLeg'),('Right knee',17,'Tibia.r'),('Right ankle',18,'RightFoot')]
def canonical(v):return [-v[1],v[2]+.09,-v[0]]
bones=[]
for name,parent,original in definitions:
    item=lookup[original]
    bones.append(dict(name=name,parent=parent,point=canonical(item['head']),end=canonical(item['tail']),sourceJoint=original))
Path('anatomy-rig-v0728.json').write_text(json.dumps({'source':'Z-Biomechanics / Z-Anatomy','units':'metres','bones':bones},indent=2)+'\n')
