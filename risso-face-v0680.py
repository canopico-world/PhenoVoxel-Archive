"""Edit the actual archive Risso eye apertures and closed oral margin in Blender.
The Ivan Geraldo CC BY 4.0 source lineage and existing body/rig are retained.
Run with Blender --background --threads 4 --python risso-face-v0680.py.
"""
import bpy,bmesh,pathlib,math,json
import numpy as np
from mathutils import Vector,Matrix
R=pathlib.Path(__file__).resolve().parent;P=R/'research-cache/risso-face-v0680';P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(R/'risso-editable-v0679.blend'))
scene=bpy.context.scene;scene.frame_set(1)
body=max((o for o in scene.objects if o.type=='MESH'),key=lambda o:len(o.data.vertices));rig=next(o for o in scene.objects if o.type=='ARMATURE')
for o in list(scene.objects):
 if o.type=='MESH'and o!=body:bpy.data.objects.remove(o,do_unlink=True)
for mod in list(body.modifiers):body.modifiers.remove(mod)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body

# Retain the original body texture at the edges of the small periorbital edit.
portable_mat=body.data.materials[0];source_image=next(n.image for n in portable_mat.node_tree.nodes if n.type=='TEX_IMAGE'and n.image and 'color'in n.image.name.lower())
source_mat=bpy.data.materials.get('Smooth Risso epidermis — authored pigment')
assert source_mat and source_mat.use_nodes,'Original editable body-space epidermis material missing'
uv=body.data.uv_layers.active;eye_uv={};source=body.copy();source.data=body.data.copy();source.name='Temporary unchanged skin for local transfer';scene.collection.objects.link(source);source.hide_render=True;source.hide_viewport=False;bpy.context.view_layer.update()
for side in [-1,1]:
 eye_uv[side]=[]
 for x,z in [(1.245,1.44),(1.385,1.44),(1.315,1.485),(1.315,1.395)]:
  target=Vector((x,side*.275,z));vi=min(range(len(body.data.vertices)),key=lambda i:(body.data.vertices[i].co-target).length_squared)
  li=next(l.index for l in body.data.loops if l.vertex_index==vi);eye_uv[side].append(uv.data[li].uv[:])

def old_mouth(x):return 1.337-.037*math.sin(max(0,min(1,(x-1.355)/.485))*math.pi*.52)
def mouth_height(x):return 1.310+.087*math.exp(-((x-1.265)/.116)**2)
def source_y(x,z,side):
 hit,loc,no,_=source.ray_cast(Vector((x,side*3,z)),Vector((0,-side,0)))
 return abs(loc.y)if hit else None
def smooth_old_surface(x,z,side):
 cz=old_mouth(x);samples=[(cz+d,source_y(x,cz+d,side))for d in [-.027,.019,.034]]
 if any(y is None for _,y in samples):return None
 return sum(y*math.prod((z-q)/(zz-q)for q,_ in samples if q!=zz)for zz,y in samples)

# Fit the unbroken neighboring skin to place each eye at the actual skin
# surface, rather than taking its position from an already recessed socket.
eye_surfaces={};eye_polys={}
for side in [-1,1]:
 rows=[];values=[]
 for dx in [-.065,-.045,0,.045,.065]:
  for dz in [-.042,-.028,.028,.042,.060]:
   if abs(dx)<.045 and abs(dz)<.035:continue
   value=source_y(1.315+dx,1.44+dz,side)
   if value is not None:rows.append([1,dx,dz,dx*dx,dx*dz,dz*dz]);values.append(value)
 co=np.linalg.lstsq(np.array(rows),np.array(values),rcond=None)[0]
 no=Vector((-float(co[1]),side,-float(co[2]))).normalized();eye_surfaces[side]=(Vector((1.315,side*float(co[0]),1.44)),no)
 eye_polys[side]=co
# Restore the old creases to the unbroken neighboring skin, then rebuild a
# closed volume. This removes the folded old incision instead of covering it.
for v in body.data.vertices:
 x,y,z=v.co;side=1 if y>0 else -1
 if 1.33<x<1.878 and abs(z-old_mouth(x))<.019 and abs(y)>.012:
  target=smooth_old_surface(x,z,side)
  if target is not None:v.co.y=math.copysign(target,y)
 dx=x-1.315;dz=z-1.44
 if abs(dx)<.044 and abs(dz)<.031:
  co=eye_polys[side];v.co.y=side*float(np.dot(co,[1,dx,dz,dx*dx,dx*dz,dz*dz]))
bpy.data.objects.remove(source,do_unlink=True)
body.data.remesh_voxel_size=.004;bpy.context.view_layer.objects.active=body;bpy.ops.object.voxel_remesh()
fair=body.modifiers.new('Continuous healed head skin','SMOOTH');fair.factor=.5;fair.iterations=6;bpy.ops.object.modifier_apply(modifier=fair.name)

# Add density only around the new facial details.
bm=bmesh.new();bm.from_mesh(body.data)
edges=[e for e in bm.edges if all(v.co.x>1.24 and 1.245<v.co.z<1.51 for v in e.verts)]
bmesh.ops.subdivide_edges(bm,edges=edges,cuts=1,use_grid_fill=True)
bm.to_mesh(body.data);bm.free();body.data.update()
# Cut narrow skin openings into the healed body, using the real local surface.
for side in [-1,1]:
 hit,loc,no,_=body.ray_cast(Vector((1.315,side*3,1.44)),Vector((0,-side,0)));assert hit
 no.normalize();eye_surfaces[side]=(loc.copy(),no.copy());tangent=(Vector((1,0,0))-no*no.x).normalized();vertical=no.cross(tangent).normalized()
 bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32,location=loc-no*.006)
 cutter=bpy.context.object;cutter.rotation_euler=Matrix((tangent,vertical,no)).transposed().to_euler();cutter.scale=(.0235,.0068,.015)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 bpy.context.view_layer.objects.active=body;mod=body.modifiers.new('Narrow native skin eye opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
# Upper/lower skin margins meet at canthi. Keep their volume on the body.
for v in body.data.vertices:
 x,y,z=v.co;dx=x-1.315;dz=z-1.44
 if abs(dx)<.08 and abs(dz)<.055:
  u=dx/.023
  if abs(u)<1.35:
   h=.0061*max(0,1-min(1,abs(u))**2)**.55
   roll=math.exp(-((abs(dz)-h)/.0027)**2)*math.exp(-(dx/.027)**8)
   v.co.y+=(1 if y>0 else -1)*roll*(.00155 if dz>0 else .00065)
 # Subtle skin volume above/below the new oral margin, with buried roots.
 if 1.295<x<1.875 and abs(y)>.014:
  dz=z-mouth_height(x)
  edge=math.sin(math.pi*max(0,min(1,(x-1.295)/.58)))**.35
  lift=(.0008*math.exp(-((dz-.0035)/.0035)**2)+.0012*math.exp(-((dz+.004)/.004)**2))*edge
  v.co.y+=(1 if y>0 else -1)*lift
body.data.update()

def cast(x,z,side):
 hit,loc,no,_=body.ray_cast(Vector((x,side*3,z)),Vector((0,-side,0)))
 return (loc,no.normalized())if hit else None
def cut_curve(points):
 c=bpy.data.curves.new('Closed curved oral seam cutter','CURVE');c.dimensions='3D';c.bevel_depth=.00125;c.bevel_resolution=4;c.use_fill_caps=True
 s=c.splines.new('POLY');s.points.add(len(points)-1)
 for i,(p,co) in enumerate(zip(s.points,points)):p.co=(*co,1);p.radius=min(1,(i+1)/8,(len(points)-i)/8)
 o=bpy.data.objects.new('Temporary oral seam cutter',c);scene.collection.objects.link(o)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
 bpy.context.view_layer.objects.active=body;m=body.modifiers.new('Upturned closed mouth with continuous skin lips','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=o
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(o,do_unlink=True)
points=[]
for k in range(161):
 x=1.295+(1.86-1.295)*k/160;result=cast(x,mouth_height(x),-1)
 if result:loc,no=result;points.append(loc-no*.00045)
# Continue around the front of the jaw, rather than ending two cheek lines.
for k in range(41):
 y=-.037+.074*k/40;hit,loc,no,_=body.ray_cast(Vector((3,y,1.310)),Vector((-1,0,0)))
 if hit:points.append(loc-no*.00045)
for k in range(161):
 x=1.86-(1.86-1.295)*k/160;result=cast(x,mouth_height(x),1)
 if result:loc,no=result;points.append(loc-no*.00045)
cut_curve(points)
for polygon in body.data.polygons:polygon.use_smooth=True;polygon.material_index=0
body.data.update();print('Face skin sculpted',len(body.data.vertices),flush=True)
bm=bmesh.new();bm.from_mesh(body.data);boundary_count=sum(e.is_boundary for e in bm.edges);bm.free();assert boundary_count==0,('Facial surface must remain closed',boundary_count)

# The replacement periorbital pigment samples adjacent skin from the existing
# native material. No new photograph or external-model pixel is used.
mat=source_mat.copy();mat.name='Risso epidermis with same-skin eyelid tissue';body.data.materials.clear();body.data.materials.append(mat)
n=mat.node_tree.nodes;l=mat.node_tree.links;bsdf=next(o for o in n if o.type=='BSDF_PRINCIPLED');original=bsdf.inputs['Base Color'].links[0].from_socket
def node(t,label):o=n.new(t);o.label=label;return o
def mathn(op,a,b=None):
 o=node('ShaderNodeMath',op);o.operation=op
 for i,v in enumerate([a,b]):
  if v is None:continue
  if isinstance(v,(int,float)):o.inputs[i].default_value=v
  else:l.new(v,o.inputs[i])
 return o.outputs[0]
tex=node('ShaderNodeTexCoord','Actual body-space coordinates');sep=node('ShaderNodeSeparateXYZ','Face axes');l.new(tex.outputs['Object'],sep.inputs[0]);X,Y,Z=[sep.outputs[k]for k in 'XYZ']
dx=mathn('DIVIDE',mathn('SUBTRACT',X,1.315),.062);dz=mathn('DIVIDE',mathn('SUBTRACT',Z,1.44),.040)
r2=mathn('ADD',mathn('MULTIPLY',dx,dx),mathn('MULTIPLY',dz,dz))
ramp=node('ShaderNodeValToRGB','Periorbital skin blend');ramp.color_ramp.elements[0].position=.65;ramp.color_ramp.elements[0].color=(1,1,1,1);ramp.color_ramp.elements[1].position=1.35;ramp.color_ramp.elements[1].color=(0,0,0,1);l.new(r2,ramp.inputs[0]);mask=ramp.outputs['Color']
samples=[]
for side in [-1,1]:
 colors=[]
 for uu,vv in eye_uv[side]:
  c=node('ShaderNodeCombineXYZ','Adjacent epidermis sample');c.inputs['X'].default_value=uu;c.inputs['Y'].default_value=vv
  t=node('ShaderNodeTexImage','Same existing epidermis pigment');t.image=source_image;l.new(c.outputs[0],t.inputs['Vector']);colors.append(t.outputs['Color'])
 ab=node('ShaderNodeMixRGB','Adjacent skin average');ab.inputs[0].default_value=.5;l.new(colors[0],ab.inputs[1]);l.new(colors[1],ab.inputs[2])
 cd=node('ShaderNodeMixRGB','Adjacent skin average');cd.inputs[0].default_value=.5;l.new(colors[2],cd.inputs[1]);l.new(colors[3],cd.inputs[2])
 mean=node('ShaderNodeMixRGB','Local epidermal pigment');mean.inputs[0].default_value=.5;l.new(ab.outputs[0],mean.inputs[1]);l.new(cd.outputs[0],mean.inputs[2]);samples.append(mean.outputs[0])
select=node('ShaderNodeMixRGB','Actual left/right skin');l.new(mathn('GREATER_THAN',Y,0),select.inputs[0]);l.new(samples[0],select.inputs[1]);l.new(samples[1],select.inputs[2])
blend=node('ShaderNodeMixRGB','Remove the painted black eye ring');l.new(mask,blend.inputs[0]);l.new(original,blend.inputs[1]);l.new(select.outputs[0],blend.inputs[2]);l.new(blend.outputs[0],bsdf.inputs['Base Color'])
noise=node('ShaderNodeTexNoise','Subtle epidermal microrelief');noise.inputs['Scale'].default_value=1450;noise.inputs['Detail'].default_value=1;l.new(tex.outputs['Object'],noise.inputs['Vector'])
bump=node('ShaderNodeBump','Fine skin continuity across the eyelid');bump.inputs['Strength'].default_value=.11;bump.inputs['Distance'].default_value=.000025;l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],bsdf.inputs['Normal'])

eye_mat=bpy.data.materials.new('Risso cornea — dark iris under skin margins');eye_mat.use_nodes=True;en=eye_mat.node_tree.nodes;el=eye_mat.node_tree.links;ep=en.get('Principled BSDF')
ep.inputs['Base Color'].default_value=(.0034,.0027,.0021,1);ep.inputs['Roughness'].default_value=.13;ep.inputs['IOR'].default_value=1.376;ep.inputs['Coat Weight'].default_value=.65;ep.inputs['Coat Roughness'].default_value=.10
ec=en.new('ShaderNodeTexCoord');es=en.new('ShaderNodeSeparateXYZ');el.new(ec.outputs['Generated'],es.inputs[0])
# A restrained warm iris is visible around the dark pupil, with no white sclera.
dist=en.new('ShaderNodeVectorMath');dist.operation='DISTANCE';el.new(ec.outputs['Generated'],dist.inputs[0]);dist.inputs[1].default_value=(.5,.5,1)
er=en.new('ShaderNodeValToRGB');er.color_ramp.elements[0].position=.05;er.color_ramp.elements[0].color=(.0015,.0018,.0018,1);er.color_ramp.elements[1].position=.27;er.color_ramp.elements[1].color=(.008,.0060,.0042,1);el.new(dist.outputs['Value'],er.inputs[0]);el.new(er.outputs['Color'],ep.inputs['Base Color'])
eyes=[];eye_proof=[]
for side in [-1,1]:
 # Sample beside the opening, where the skin still has a well-defined normal.
 surface,no=eye_surfaces[side];centre=surface-no*.0099
 bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=40,location=centre)
 eye=bpy.context.object;eye.name=('Left'if side>0 else'Right')+' iris and cornea behind skin lids'
 tangent=(Vector((1,0,0))-no*no.x).normalized();vertical=no.cross(tangent).normalized();eye.rotation_euler=Matrix((tangent,vertical,no)).transposed().to_euler();eye.scale=(.025,.0092,.0132)
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 for polygon in eye.data.polygons:polygon.use_smooth=True
 eye.data.materials.append(eye_mat);g=eye.vertex_groups.new(name='Head');g.add(list(range(len(eye.data.vertices))),1,'REPLACE');m=eye.modifiers.new('Attached to head','ARMATURE');m.object=rig;eyes.append(eye)
 eye_proof.append({'side':side,'centre':list(centre),'visibleApertureApprox':[.046,.012],'raisedBlackRing':False,'skinLidsPartOfBody':True})

# Keep the existing axial study editable on the revised connected body.
body.vertex_groups.clear();groups={name:body.vertex_groups.new(name=name)for name in ['Head','Trunk','Peduncle','Flukes']}
for v in body.data.vertices:
 x,y,z=v.co;weights=[math.exp(-((x-c)/(.6 if k<2 else .37))**2)for k,c in enumerate([1,-.2,-1.035,-1.66])]
 if abs(y)>.27 and x>0:weights=[1,0,0,0]
 total=sum(weights)
 for name,w in zip(groups,weights):
  if w/total>.0001:groups[name].add([v.index],w/total,'REPLACE')
mod=body.modifiers.new('Editable axial swimming rig','ARMATURE');mod.object=rig
body['face_revision']='Native skin eyelid margins; inset dark cornea/iris; curved upturned mouth, continuous around jaw tip, closed skin lips. Source-guided authored anatomy, not a specimen fit.'
scene['project_notes']='Editable archive model. No embedded viewer or third-party model is included. Ivan Geraldo source lineage, CC BY 4.0; PhenoVoxel facial modifications.'
scene.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(R/'risso-editable-v0680.blend'),compress=True)
scene.render.engine='CYCLES';scene.cycles.samples=6;scene.cycles.use_denoising=True;scene.render.resolution_x=1000;scene.render.resolution_y=650
cam=scene.camera
def render(name,loc,target,scale):
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;scene.render.filepath=str(P/name);bpy.ops.render.render(write_still=True)
render('after-face.png',(2.4,-5,1.95),(1.48,0,1.42),1.02)
render('after-eye.png',(1.48,-4,1.59),(1.315,-.26,1.44),.27)
render('after-mouth.png',(2.5,-4,1.61),(1.58,0,1.35),.83)
render('after-opposite.png',(2.4,5,1.95),(1.48,0,1.42),1.02)
(P/'face-build.json').write_text(json.dumps({'blender':bpy.app.version_string,'nativeProject':'risso-editable-v0680.blend','bodyVertices':len(body.data.vertices),'bodyFaces':len(body.data.polygons),'eyes':eye_proof,'mouth':{'posteriorX':1.295,'posteriorHeight':mouth_height(1.295),'anteriorHeight':1.310,'continuousAcrossFront':True,'radius':.00125,'oldStraightCreaseHealed':True},'skinPigment':'Adjacent same-source skin sampled in native material around lids; existing body otherwise retained','biologicalValidation':False},indent=2))
print('FACIAL_REVISION_SAVED',flush=True)
