"""Blender-native revision of the licensed archive mesh and editable skin.
Scars are an original illustrative individual's markings, not a photo scan.
"""
import bpy, math, pathlib, random, json
import numpy as np
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parent
P=R/'research-cache/risso-face-v0680';P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(R/'risso-editable-v0680.blend'))
scene=bpy.context.scene;scene.frame_set(1)
body=max((o for o in scene.objects if o.type=='MESH'),key=lambda o:len(o.data.vertices))
rig=next(o for o in scene.objects if o.type=='ARMATURE')
for modifier in list(body.modifiers):body.modifiers.remove(modifier)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
# Remove fine remeshing corrugation while retaining the integrated apertures.
g=body.vertex_groups.new(name='Fair skin excluding mouth eyelids and fin tips')
for v in body.data.vertices:
 x,y,z=v.co
 mouth=1.310+.087*math.exp(-((x-1.265)/.116)**2)
 protect=(x>1.27 and abs(z-mouth)<.006) or (abs(x-1.315)<.027 and abs(z-1.44)<.010)
 weight=0 if protect else .9
 if z>1.85 or abs(y)>.34 or x<-1.45:weight*=.18
 g.add([v.index],weight,'REPLACE')
dec=body.modifiers.new('Uniform working surface density','DECIMATE');dec.ratio=.19;dec.vertex_group=g.name;dec.vertex_group_factor=1
bpy.ops.object.modifier_apply(modifier=dec.name)
sm=body.modifiers.new('Gentle continuous epidermal fairing','SMOOTH');sm.factor=.65;sm.iterations=100;sm.vertex_group='Fair skin excluding mouth eyelids and fin tips'
# Apply before the armature, always in neutral pose.
bpy.ops.object.modifier_apply(modifier=sm.name)
g=body.vertex_groups.get('Fair skin excluding mouth eyelids and fin tips')
if g:body.vertex_groups.remove(g)
arm=body.modifiers.new('Editable axial swimming rig','ARMATURE');arm.object=rig
for p in body.data.polygons:p.use_smooth=True
if body.data.has_custom_normals:body.data.normals_split_custom_set([(0,0,0)]*len(body.data.loops))

# An asymmetric cylindrical pigment chart. Many partially faded, curved rake
# groups replace repeated straight bright stamps; no reflected light is baked.
W,H=4096,2048;mask=np.zeros((H,W),dtype=np.float32);rng=random.Random(680)
def line(points,width,opacity):
 for seg,(a,b) in enumerate(zip(points,points[1:])):
  ax,ay=a;bx,by=b
  for off in [-H,0,H]:
   ya,yb=ay+off,by+off
   x0=max(0,int(min(ax,bx)-width-2));x1=min(W,int(max(ax,bx)+width+3))
   y0=max(0,int(min(ya,yb)-width-2));y1=min(H,int(max(ya,yb)+width+3))
   if x1<=x0 or y1<=y0:continue
   yy,xx=np.mgrid[y0:y1,x0:x1];dx=bx-ax;dy=yb-ya
   t=np.clip(((xx-ax)*dx+(yy-ya)*dy)/(dx*dx+dy*dy+1e-8),0,1)
   d=np.sqrt((xx-ax-t*dx)**2+(yy-ya-t*dy)**2)
   fade=math.sin(math.pi*(seg+.5)/(len(points)-1))**.35
   val=np.clip((width*fade+.7-d)/1.4,0,1)*opacity*fade*rng.uniform(.7,1)
   mask[y0:y1,x0:x1]=np.maximum(mask[y0:y1,x0:x1],val)
for k in range(620):
 u=rng.uniform(.035,.94);v=rng.uniform(0,1);length=rng.uniform(.006,.068)*W
 angle=rng.uniform(-1.25,1.25);cx=u*W;cy=v*H
 count=rng.choices([1,2,3,4,5],[48,22,17,10,3])[0]
 width=rng.uniform(.45,1.05);spacing=rng.uniform(2.2,4.5);alpha=rng.uniform(.1,.52)
 curve=rng.uniform(-.12,.12)*length
 for j in range(count):
  pts=[]
  trim=rng.uniform(.7,1);phase=rng.uniform(0,6)
  for t in np.linspace(0,1,18):
   along=(t-.5)*length*trim;cross=(j-(count-1)/2)*spacing+math.sin(t*math.pi)*curve+math.sin(t*13+phase)*.65
   pts.append((cx+along*math.cos(angle)-cross*math.sin(angle),cy+along*math.sin(angle)+cross*math.cos(angle)))
  line(pts,width,alpha*rng.uniform(.65,1))
rgba=np.ones((H,W,4),dtype=np.float32);rgba[:,:,:3]=mask[:,:,None]
im=bpy.data.images.new('Original asymmetric healed rake pigmentation',width=W,height=H,alpha=True)
im.colorspace_settings.name='Non-Color';im.pixels.foreach_set(rgba.ravel());im.pack()
del rgba,mask

mat=bpy.data.materials.new('Risso adult epidermis - pigment roughness microrelief');mat.use_nodes=True
body.data.materials.clear();body.data.materials.append(mat);n=mat.node_tree.nodes;l=mat.node_tree.links;n.clear()
def node(t,name):o=n.new(t);o.label=name;return o
def linkval(v,inp):
 if hasattr(v,'node'):l.new(v,inp)
 elif isinstance(v,(tuple,list)):inp.default_value=(*v,1)
 else:inp.default_value=v
def m(op,a,b=0):
 o=node('ShaderNodeMath',op);o.operation=op;linkval(a,o.inputs[0]);linkval(b,o.inputs[1]);return o.outputs[0]
def ramp(v,lo,hi,a,b):
 o=node('ShaderNodeValToRGB','Smooth anatomical pigment transition');o.color_ramp.interpolation='EASE'
 o.color_ramp.elements[0].position=0;o.color_ramp.elements[0].color=(*a,1)
 o.color_ramp.elements[1].position=1;o.color_ramp.elements[1].color=(*b,1)
 l.new(m('DIVIDE',m('SUBTRACT',v,lo),hi-lo),o.inputs[0]);return o.outputs[0]
def mix(a,b,t):
 o=node('ShaderNodeMixRGB','Pigment only');linkval(t,o.inputs[0]);linkval(a,o.inputs[1]);linkval(b,o.inputs[2]);return o.outputs[0]
tc=node('ShaderNodeTexCoord','Continuous native coordinates');xyz=node('ShaderNodeSeparateXYZ','Body axes');l.new(tc.outputs['Object'],xyz.inputs[0]);X,Y,Z=[xyz.outputs[k]for k in 'XYZ']
def noise(scale,detail):
 o=node('ShaderNodeTexNoise','Low contrast epidermal variation');o.inputs['Scale'].default_value=scale;o.inputs['Detail'].default_value=detail;o.inputs['Roughness'].default_value=.65;l.new(tc.outputs['Object'],o.inputs['Vector']);return o.outputs['Fac']
macro=noise(5,3);fine=noise(170,2);micro=noise(1300,1)
base=ramp(macro,.1,.9,(.105,.112,.116),(.145,.153,.158))
head=ramp(X,.7,1.82,(0,0,0),(1,1,1))
base=mix(base,(.30,.307,.30),m('MULTIPLY',head,.82))
belly=ramp(Z,.98,1.42,(1,1,1),(0,0,0));base=mix(base,(.285,.29,.28),m('MULTIPLY',belly,.65))
ay=m('ABSOLUTE',Y)
dorsal=ramp(Z,1.73,2.10,(0,0,0),(1,1,1))
flipper=m('MULTIPLY',ramp(ay,.25,.52,(0,0,0),(1,1,1)),ramp(Z,1.1,1.38,(1,1,1),(0,0,0)))
fluke=ramp(X,-1.73,-1.37,(1,1,1),(0,0,0));fin=m('MAXIMUM',m('MAXIMUM',dorsal,flipper),fluke)
base=mix(base,(.029,.035,.039),fin)
chart=node('ShaderNodeCombineXYZ','Continuous wrap coordinates')
l.new(m('SUBTRACT',.5,m('DIVIDE',X,3.85)),chart.inputs['X'])
l.new(m('ADD',.5,m('DIVIDE',m('ARCTAN2',Y,m('SUBTRACT',Z,1.4)),2*math.pi)),chart.inputs['Y'])
sc=node('ShaderNodeTexImage','Original pale healed scars');sc.image=im;sc.extension='REPEAT';l.new(chart.outputs[0],sc.inputs['Vector'])
scar=m('MULTIPLY',sc.outputs['Color'],m('SUBTRACT',1,m('MULTIPLY',fin,.65)))
base=mix(base,(.49,.50,.48),scar)
base=mix(base,mix((.08,.087,.09),(.23,.24,.24),fine),.035)
bs=node('ShaderNodeBsdfPrincipled','Wet living skin');l.new(base,bs.inputs['Base Color'])
rough=m('ADD',.34,m('MULTIPLY',fine,.065));l.new(rough,bs.inputs['Roughness'])
bs.inputs['IOR'].default_value=1.4;bs.inputs['Coat Weight'].default_value=.16;bs.inputs['Coat Roughness'].default_value=.24
bump=node('ShaderNodeBump','Microscopic epidermis - no scales');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.000025;l.new(micro,bump.inputs['Height']);l.new(bump.outputs[0],bs.inputs['Normal'])
out=node('ShaderNodeOutputMaterial','Skin output');l.new(bs.outputs[0],out.inputs['Surface'])
scene['material_notes']='Original asymmetric healed scar pattern; separate pigment, roughness and fine microrelief. NOAA species traits, illustrative adult, not a scanned individual.'
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=760;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
cam=scene.camera
def render(name,loc,target,scale):
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;scene.render.filepath=str(P/name);bpy.ops.render.render(write_still=True)
render('surface-whole.png',(.6,-6,2.4),(0,0,1.45),4.3)
render('surface-head.png',(2.25,-5,1.9),(1.44,0,1.44),1.12)
render('surface-eye.png',(1.5,-4,1.55),(1.315,-.26,1.44),.23)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'risso-surface.blend'),compress=True)
print('SURFACE_SAVED',flush=True)
