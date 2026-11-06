"""Focused Blender revision: eye apertures, oral edge and pale chin pigment.
Pigment is authored on the connected skin, not pasted photographic lighting.
"""
import bpy,bmesh,pathlib,math,json,sys
import numpy as np
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parent;P=R/'research-cache/risso-face-v0681';P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(R/'research-cache/risso-face-v0680/risso-finished.blend'))
s=bpy.context.scene;s.frame_set(1)
body=max((o for o in s.objects if o.type=='MESH'),key=lambda o:len(o.data.vertices));eyes=[o for o in s.objects if o.type=='MESH'and o!=body]
rig=next(o for o in s.objects if o.type=='ARMATURE')
for mod in list(body.modifiers):body.modifiers.remove(mod)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
def mouth(x):return 1.310+.087*math.exp(-((x-1.265)/.116)**2)
g=body.vertex_groups.new(name='Oral edge local fairing')
for v in body.data.vertices:
 x,y,z=v.co;w=math.exp(-((z-mouth(x))/.012)**2) if 1.29<x<1.88 else 0
 g.add([v.index],w,'REPLACE')
sm=body.modifiers.new('Soften angular oral incision edges','SMOOTH');sm.factor=.28;sm.iterations=8;sm.vertex_group=g.name;bpy.ops.object.modifier_apply(modifier=sm.name)
body.vertex_groups.remove(body.vertex_groups.get('Oral edge local fairing'))
# Open the flattened apertures into small natural almond shapes. Both the
# surrounding skin and existing inset cornea are changed together.
for v in body.data.vertices:
 x,y,z=v.co;dx=x-1.315;dz=z-1.44
 if abs(dx)<.075 and abs(dz)<.055 and abs(y)>.1:
  v.co.z=1.44+dz*(1+.58*math.exp(-(dx/.044)**4-(dz/.030)**4))
for eye in eyes:
 for v in eye.data.vertices:
  v.co.z=1.44+(v.co.z-1.44)*1.58
  v.co.y-=math.copysign(.0018,v.co.y)
 ep=next(n for n in eye.data.materials[0].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 ep.inputs['Roughness'].default_value=.25;ep.inputs['Coat Weight'].default_value=.12;ep.inputs['Coat Roughness'].default_value=.22
# Rebuild one closed skin surface so there is no separate eyelid ring.
body.data.remesh_voxel_size=.0024
bpy.context.view_layer.objects.active=body;bpy.ops.object.voxel_remesh()
g=body.vertex_groups.new(name='Smooth eyelid microfacets')
for v in body.data.vertices:
 x,y,z=v.co;w=math.exp(-((x-1.315)/.055)**8-((z-1.44)/.037)**8)
 g.add([v.index],w,'REPLACE')
sm=body.modifiers.new('Smooth continuous eye socket skin','SMOOTH');sm.factor=.48;sm.iterations=20;sm.vertex_group=g.name;bpy.ops.object.modifier_apply(modifier=sm.name)
body.vertex_groups.clear();groups={name:body.vertex_groups.new(name=name)for name in ['Head','Trunk','Peduncle','Flukes']}
for v in body.data.vertices:
 x,y,z=v.co;weights=[math.exp(-((x-c)/(.6 if k<2 else .37))**2)for k,c in enumerate([1,-.2,-1.035,-1.66])]
 if abs(y)>.27 and x>0:weights=[1,0,0,0]
 total=sum(weights)
 for name,w in zip(groups,weights):
  if w/total>.0001:groups[name].add([v.index],w/total,'REPLACE')
print('CONTINUOUS_FACE_REMESH',len(body.data.vertices),flush=True)
for p in body.data.polygons:p.use_smooth=True
body.data.update();arm=body.modifiers.new('Editable axial swimming rig','ARMATURE');arm.object=rig
mat=body.data.materials[0];n=mat.node_tree.nodes;l=mat.node_tree.links;bs=next(o for o in n if o.type=='BSDF_PRINCIPLED');original=bs.inputs['Base Color'].links[0].from_socket
def node(t,label):o=n.new(t);o.label=label;return o
def m(op,a,b=None):
 o=node('ShaderNodeMath',op);o.operation=op
 for i,v in enumerate([a,b]):
  if v is not None:
   if isinstance(v,(int,float)):o.inputs[i].default_value=v
   else:l.new(v,o.inputs[i])
 return o.outputs[0]
def ramp(v,a,b,c0,c1):
 o=node('ShaderNodeValToRGB','Soft living pigmentation boundary');o.color_ramp.interpolation='EASE'
 for e,pos,c in zip(o.color_ramp.elements,[0,1],[c0,c1]):e.position=pos;e.color=(*c,1)
 l.new(m('DIVIDE',m('SUBTRACT',v,a),b-a),o.inputs[0]);return o.outputs['Color']
def mix(a,b,f):
 o=node('ShaderNodeMixRGB','Continuous facial pigment');l.new(f,o.inputs[0]);l.new(a,o.inputs[1])
 if isinstance(b,tuple):o.inputs[2].default_value=(*b,1)
 else:l.new(b,o.inputs[2])
 return o.outputs[0]
tc=node('ShaderNodeTexCoord','Unbroken face coordinates');xyz=node('ShaderNodeSeparateXYZ','Face coordinates');l.new(tc.outputs['Object'],xyz.inputs[0]);X,Y,Z=[xyz.outputs[k]for k in 'XYZ']
noise=node('ShaderNodeTexNoise','Fine irregular chin boundary');noise.inputs['Scale'].default_value=90;noise.inputs['Detail'].default_value=2;l.new(tc.outputs['Object'],noise.inputs['Vector'])
border=m('ADD',m('ADD',1.31,m('MULTIPLY',m('SUBTRACT',X,1.86),.27)),m('MULTIPLY',m('SUBTRACT',noise.outputs['Fac'],.5),.006))
chin=m('MULTIPLY',ramp(m('SUBTRACT',border,Z),0,.014,(0,0,0),(1,1,1)),ramp(X,1.22,1.40,(0,0,0),(1,1,1)))
pigment=mix(original,(.57,.575,.54),chin)
# A diffuse periorbital shadow belongs to the skin; no black extruded ring.
dx=m('DIVIDE',m('SUBTRACT',X,1.315),.041);dz=m('DIVIDE',m('SUBTRACT',Z,1.44),.026)
orb=m('ADD',m('MULTIPLY',dx,dx),m('MULTIPLY',dz,dz));emask=ramp(orb,.12,1,(.70,.70,.70),(0,0,0));pigment=mix(pigment,(.022,.025,.025),emask)
# Preserve the curved closed oral margin with a narrow warm-dark crease,
# independent of a triangle's normal or an isolated black mesh strip.
q=m('DIVIDE',m('SUBTRACT',X,1.265),.116);height=m('ADD',1.310,m('MULTIPLY',m('EXPONENT',m('MULTIPLY',m('MULTIPLY',q,q),-1)),.087))
d=m('ABSOLUTE',m('SUBTRACT',Z,height));line=ramp(d,.0006,.0023,(.68,.68,.68),(0,0,0));line=m('MULTIPLY',line,ramp(X,1.285,1.315,(0,0,0),(1,1,1)))
pigment=mix(pigment,(.024,.022,.020),line);l.new(pigment,bs.inputs['Base Color'])
bs.inputs['Coat Weight'].default_value=.09;bs.inputs['Coat Roughness'].default_value=.30
s['face_revision']='v681: widened almond skin apertures; restrained corneal highlights; smoother closed oral edge; soft pale chin pigment wrapping continuously underneath jaw.'
s['biological_scope']='Illustrative individual. Pale mouth/chin and anchor chest pigmentation vary with age; no claim that every Risso has an identical triangle.'
P.joinpath('face-build.json').write_text(json.dumps({'version':'0.6.81','blender':bpy.app.version_string,'eyeApertureVerticalScale':1.58,'mouthFairingIterations':8,'chinPigment':'Soft-edged wedge on connected lower jaw, tapering into throat','biologicalValidation':False},indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'risso-finished.blend'),compress=True)
s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True;s.render.resolution_x=1200;s.render.resolution_y=760;s.render.resolution_percentage=100
cam=s.camera
def render(name,loc,target,scale):
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/('surface-'+name+'.png'));bpy.ops.render.render(write_still=True)
render('eye',(1.5,-4,1.55),(1.315,-.26,1.44),.23)
if '--eye-only' not in sys.argv:
 render('head',(2.25,-5,1.9),(1.44,0,1.44),1.12)
 render('chin',(2.5,-3,.4),(1.5,0,1.3),1.2)
 render('whole',(.6,-6,2.4),(0,0,1.45),4.3)
print('V681_FACIAL_CORRECTION_COMPLETE',flush=True)
