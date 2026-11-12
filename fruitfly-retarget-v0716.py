"""Reproduce body-fixed kinematic retargeting; no dynamics or neural simulation.
Python 3.11+, numpy, scipy, h5py (extraction only), mujoco. GPL-3.0-or-later
for the derived movement dataset; source geometry/XML remains Apache-2.0.
"""
import sys,json,pathlib,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parent
CACHE=ROOT/'research-cache/fruitfly-v0716'
if (CACHE/'pydeps').exists():sys.path.insert(0,str(CACHE/'pydeps'))
import numpy as np
from scipy.spatial.transform import Rotation
import mujoco

def matrix(pos,quat):
 m=np.eye(4);m[:3,3]=pos;m[:3,:3]=Rotation.from_quat([*quat[1:],quat[0]]).as_matrix();return m

def main():
 src=json.loads((ROOT/'fruitfly-motion-source-v0716.json').read_text())
 rig=json.loads((CACHE/'rig-inspection.json').read_text())['bones']
 m=mujoco.MjModel.from_xml_path(str(ROOT/'fruitfly-kinematics-v0716.xml'));d=mujoco.MjData(m)
 mujoco.mj_forward(m,d)
 bodyNames=[mujoco.mj_id2name(m,mujoco.mjtObj.mjOBJ_BODY,i) for i in range(m.nbody)]
 initial=[matrix(d.xpos[i],d.xquat[i]) for i in range(m.nbody)]
 # Source XML applies this transform to original Blender-space mesh coordinates.
 A=np.diag([-.1,-.1,.1,1.]);A[:3,3]=[-.00791,0,-.123];Ai=np.linalg.inv(A)
 def mapbody(name):
  if name=='abdomen_1':return 'abdomen'
  if name=='abdomen_8':return 'abdomen_7'
  if name.startswith('tarsal_claw_'):return name.replace('tarsal_claw_','claw_')
  if name.startswith('tarsus_T'):
   _,leg,number,side=name.split('_');return ('tarsus' if number=='1' else 'tarsus'+number)+'_'+leg+'_'+side
  if name in bodyNames:return name
  parent=rig[name]['parent'];return mapbody(parent) if parent else 'world'
 maps={name:bodyNames.index(mapbody(name)) for name in rig}
 # Apply recorded scalar joints by name, never by an assumed array ordering.
 indices=[m.jnt_qposadr[mujoco.mj_name2id(m,mujoco.mjtObj.mjOBJ_JOINT,n)] for n in src['jointNames']]
 def poses(q):
  d.qpos[:]=q;mujoco.mj_forward(m,d)
  deltas=[Ai@matrix(d.xpos[i],d.xquat[i])@np.linalg.inv(initial[i])@A for i in range(m.nbody)]
  return [(deltas[maps[n]]@np.array(b['matrix'])).round(7).tolist() for n,b in rig.items()]
 walk=[]
 for a in src['walk']['qpos']:
  q=m.qpos0.copy();q[indices]=a;walk.append(poses(q))
 flight=[];n=101
 for i in range(n):
  phase=(i%50)/50;sample=src['wing']['angles'][int(round(phase*500))%500]
  q=m.qpos0.copy()
  for joint in range(m.njnt):
   name=mujoco.mj_id2name(m,mujoco.mjtObj.mjOBJ_JOINT,joint)
   if any(x in name for x in ['coxa','femur','tibia','tarsus']):q[m.jnt_qposadr[joint]]=m.qpos_spring[m.jnt_qposadr[joint]]
  # Published source hover-up frame: fixed presentation, not tracked flight path.
  q[3:7]=[.915,0,-.403,0];q[3:7]/=np.linalg.norm(q[3:7])
  for side in ['left','right']:
   for axis,value in zip(['yaw','roll','pitch'],sample):q[m.jnt_qposadr[mujoco.mj_name2id(m,mujoco.mjtObj.mjOBJ_JOINT,'wing_'+axis+'_'+side)]]=value
   # Literature-guided ~180 degree excursion, opposite the wing yaw stroke.
   # The source spring limits are not used: this is kinematic illustration,
   # not a claim that the source dynamics reproduce haltere oscillation.
   q[m.jnt_qposadr[mujoco.mj_name2id(m,mujoco.mjtObj.mjOBJ_JOINT,'haltere_'+side)]]=(np.pi/2)*np.cos(2*np.pi*phase)
  flight.append(poses(q))
 out={'boneNames':list(rig),'boneBodyMap':{k:bodyNames[v] for k,v in maps.items()},'clips':[
  {'name':'Walk_source_092','fps':50,'frames':list(range(len(walk))),'displayDuration':(len(walk)-1)/50,'sourceDuration':src['walk']['sourceDuration'],'matrices':walk},
  {'name':'Flight_wingbeat_study','fps':50,'frames':[i*2 for i in range(n)],'displayDuration':4,'sourceDuration':2/218,'matrices':flight}]}
 (CACHE/'retargeted-matrices.json').write_text(json.dumps(out,separators=(',',':')))
 print('Retargeted',len(walk),'walking frames and',len(flight),'flight poses;',len(rig),'bones')

if __name__=='__main__':main()
