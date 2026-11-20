"""Extract named, co-registered Z-Anatomy surfaces without running its add-ons."""
import bpy
import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np

root=Path.cwd()
output=root/'research-cache/anatomy-v0728/raw'
output.mkdir(exist_ok=True)
source=root/'research-cache/anatomy-v0728/source'
terms={}
ambiguous_terms=set()
with (source/'TA2.csv').open(encoding='utf-8-sig',newline='')as f:
    for outer in csv.reader(f):
        if len(outer)!=1:continue
        row=next(csv.reader([outer[0]],delimiter=';'))
        if len(row)>3 and row[0].isdigit():
            key=row[1].strip().lower()
            if key in terms and terms[key]['latin']!=row[2]:ambiguous_terms.add(key)
            if key not in terms:terms[key]={'id':row[0],'latin':row[2]}
for key in ambiguous_terms:terms.pop(key,None)

for obj in bpy.data.objects:
    if obj.parent and obj.parent.type=='CURVE':
        matrix=obj.matrix_world.copy()
        obj.parent=None
        obj.matrix_world=matrix
    obj.animation_data_clear()
    for modifier in obj.modifiers:
        if modifier.type in {'SUBSURF','MULTIRES'}:modifier.show_viewport=False

def reveal(collection):
    collection.exclude=False
    collection.hide_viewport=False
    for child in collection.children:reveal(child)
reveal(bpy.context.view_layer.layer_collection)
depsgraph=bpy.context.evaluated_depsgraph_get()

def system_for(obj):
    collections=[c.name for c in obj.users_collection]
    roots=[c[:1]for c in collections if re.match(r'^[1-9]:',c)]
    if not roots:return None
    primary=roots[0]
    name=obj.name.lower()
    materials=[m.name.lower()for m in obj.data.materials if m]
    if name.endswith('-line'):return 'landmarks'
    if primary=='1':return 'skeleton'
    if primary=='2':return 'attachments'
    if primary=='3':return 'connective'
    if primary=='4':return 'connective' if any(c in collections for c in ['Fascia','Bursae','Tendons'])else 'muscles'
    if primary=='5':
        if any('vein'in m for m in materials)or 'vein' in name or 'venous'in name:return 'veins'
        if any('arter'in m for m in materials)or any(x in name for x in ['artery','arterial','aorta','trunk']):return 'arteries'
        return 'organs'
    if primary=='6':return 'lymphatic'
    if primary=='7':
        if any(c in collections for c in ['Brain','Central nervous system','Spinal cord']):return 'cns'
        if any(x in name for x in ['eye','retina','lens','ear','cochle','tympan','semicircular','ossicle','sclera','cornea','iris','ciliary','lacrimal']):return 'senses'
        return 'nerves'
    if primary=='8':return 'organs'
    if primary=='9':return 'surface'

def region_for(name,collections,center):
    if 'Head'in collections or 'Neck'in collections or center[2]>1.48:return 'head-neck'
    for label,key in [('Left upper limb','left-arm'),('Right upper limb','right-arm'),('Left lower limb','left-leg'),('Right lower limb','right-leg')]:
        if label in collections:return key
    if abs(center[0])>.195 and center[2]>.74:return 'left-arm' if center[0]>0 else 'right-arm'
    if center[2]<.83:return 'left-leg' if center[0]>0 else 'right-leg'
    return 'chest' if center[2]>1.14 else 'abdomen-pelvis'

def clean_label(name):
    label=re.sub(r'\.[lr]$','',name).strip().rstrip("'")
    return label

def matrix_array(matrix):return np.array([list(row)for row in matrix],dtype=np.float32)

records=[]
skipped=Counter()
for obj in sorted(bpy.data.objects,key=lambda o:o.name):
    if obj.type not in {'MESH','CURVE'}:continue
    system=system_for(obj)
    if not system:continue
    if obj.type=='CURVE'and not(obj.data.bevel_depth>0 or obj.data.bevel_object or obj.data.extrude>0):
        skipped['unfilled annotation curves']+=1
        continue
    name=obj.name
    # The pilot uses the source adult male body; alternate reproductive organs
    # in the atlas are recorded as excluded, preserving their source files.
    if any(word in name.lower()for word in ['uterus','uterine','ovary','ovarian','vagina','clitoris','labium majus','labium minus']):
        skipped['alternate reproductive reference']+=1
        continue
    obj.hide_viewport=False
    obj.hide_set(False)
    if obj.type=='CURVE':
        obj.data.resolution_u=min(obj.data.resolution_u,8)
        obj.data.bevel_resolution=min(obj.data.bevel_resolution,2)
    evaluated=obj.evaluated_get(depsgraph)
    mesh=evaluated.to_mesh(preserve_all_data_layers=False,depsgraph=depsgraph)
    if mesh is None or len(mesh.polygons)==0:
        if mesh:evaluated.to_mesh_clear()
        skipped['empty surfaces']+=1
        continue
    mesh.calc_loop_triangles()
    count=len(mesh.vertices)
    positions=np.empty(count*3,dtype=np.float32)
    normals=np.empty(count*3,dtype=np.float32)
    mesh.vertices.foreach_get('co',positions)
    mesh.vertices.foreach_get('normal',normals)
    positions=positions.reshape(-1,3)
    normals=normals.reshape(-1,3)
    matrix=matrix_array(obj.matrix_world)
    positions=positions@matrix[:3,:3].T+matrix[:3,3]
    # Reference objects kept beside the atlas fall outside its registered body.
    if np.max(np.abs(positions[:,0]))>.56 or positions[:,2].max()>1.91:
        evaluated.to_mesh_clear()
        skipped['unregistered reference objects']+=1
        continue
    normals=normals@np.linalg.inv(matrix[:3,:3])
    normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-8)
    faces=np.empty(len(mesh.loop_triangles)*3,dtype=np.int32)
    mesh.loop_triangles.foreach_get('vertices',faces)
    faces=faces.reshape(-1,3)
    material_indices=np.empty(len(faces),dtype=np.int32)
    mesh.loop_triangles.foreach_get('material_index',material_indices)
    materials=[m for m in mesh.materials]
    material_count=max(1,len(materials))
    colors=np.array([list(m.diffuse_color[:3]) if m else [.65,.65,.65]for m in materials]or [[.65,.65,.65]],dtype=np.float32)
    unique,inverse=np.unique((faces*material_count+material_indices[:,None]).ravel(),return_inverse=True)
    vertices=unique//material_count
    color=colors[unique%material_count]
    positions=positions[vertices]
    normals=normals[vertices]
    indices=inverse.reshape(-1,3).astype('<u4')
    if np.linalg.det(matrix[:3,:3])<0:indices=indices[:,[0,2,1]]
    center=(positions.min(axis=0)+positions.max(axis=0))*.5
    collections=sorted(c.name for c in obj.users_collection)
    label=clean_label(name)
    side='left' if name.endswith('.l')else 'right' if name.endswith('.r')else None
    identifier=len(records)
    prefix=str(identifier).zfill(5)
    # Canonical coordinates match PhenoVoxel's front +X, up +Y convention.
    canonical=np.column_stack([-positions[:,1],positions[:,2]+.09,-positions[:,0]])
    normal=np.column_stack([-normals[:,1],normals[:,2],-normals[:,0]])
    canonical.astype('<f4').tofile(output/(prefix+'-position.bin'))
    normal.astype('<f4').tofile(output/(prefix+'-normal.bin'))
    color.astype('<f4').tofile(output/(prefix+'-color.bin'))
    indices.tofile(output/(prefix+'-index.bin'))
    record=dict(index=identifier,id='za-'+prefix,sourceName=name,name=label,side=side,system=system,
        region=region_for(name,collections,center),collections=collections,term=terms.get(label.lower()),
        vertices=len(canonical),triangles=len(indices),low=canonical.min(axis=0).tolist(),high=canonical.max(axis=0).tolist(),
        prefix=prefix,materials=[m.name for m in materials if m],sourceType=obj.type)
    if 'kidney'in name.lower()or 'cochle'in name.lower()or 'semicircular'in name.lower():
        record['componentNotice']='See upstream kidney and inner-ear contributor licences in the source notices.'
    records.append(record)
    evaluated.to_mesh_clear()
    if len(records)%250==0:print('Extracted structures',len(records),flush=True)

manifest={'source':'Z-Anatomy / BodyParts3D','registration':{'mapping':'(-Blender Y, Blender Z + 0.09 m, -Blender X)','units':'metres'},
    'sourceManifest':json.loads((source/'source-manifest.json').read_text()),'skipped':dict(skipped),'structures':records}
(output/'structures.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Atlas surfaces',len(records),'triangles',sum(r['triangles']for r in records),'systems',dict(Counter(r['system']for r in records)),flush=True)
