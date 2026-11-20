import bpy,json,sys
from collections import Counter
from pathlib import Path
from mathutils import Vector

destination=Path(sys.argv[sys.argv.index('--')+1])
records=[]
minimum=[float('inf')]*3
maximum=[-float('inf')]*3
for obj in bpy.data.objects:
    if obj.type!='MESH':continue
    corners=[obj.matrix_world@Vector(p) for p in obj.bound_box]
    low=[min(p[k]for p in corners)for k in range(3)]
    high=[max(p[k]for p in corners)for k in range(3)]
    for k in range(3):minimum[k]=min(minimum[k],low[k]);maximum[k]=max(maximum[k],high[k])
    props={}
    for key in obj.keys():
        try:props[key]=str(obj[key])[:1500]
        except Exception:pass
    records.append(dict(name=obj.name,vertices=len(obj.data.vertices),faces=len(obj.data.polygons),
        materials=[m.name for m in obj.data.materials if m],collections=[c.name for c in obj.users_collection],
        low=low,high=high,groups=[g.name for g in obj.vertex_groups],properties=props,
        modifiers=[{'name':m.name,'type':m.type}for m in obj.modifiers]))
rigs=[]
for obj in bpy.data.objects:
    if obj.type=='ARMATURE':
        rigs.append({'name':obj.name,'bones':[{'name':b.name,'parent':b.parent.name if b.parent else None,'head':list(obj.matrix_world@b.head_local),'tail':list(obj.matrix_world@b.tail_local)}for b in obj.data.bones]})
summary=dict(objects=len(bpy.data.objects),meshes=len(records),vertices=sum(r['vertices']for r in records),faces=sum(r['faces']for r in records),
    units=bpy.context.scene.unit_settings.system,unitScale=bpy.context.scene.unit_settings.scale_length,bounds=[minimum,maximum],
    collections=[{'name':c.name,'children':[x.name for x in c.children],'objects':len(c.objects)}for c in bpy.data.collections],
    rigs=rigs,actions=[a.name for a in bpy.data.actions],records=records)
destination.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:summary[k]for k in ['objects','meshes','vertices','faces','bounds','units','unitScale']},ensure_ascii=True),flush=True)
print('Rigs',[(r['name'],len(r['bones']))for r in rigs],flush=True)
print('Actions',summary['actions'][:30],flush=True)
print('Collections',Counter(x for r in records for x in r['collections']).most_common(24),flush=True)
