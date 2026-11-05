"""Free, editable Risso behavior surface. Run with Blender --background --python.

Source body: ivan.geraldo, CC BY 4.0, retained via the archive's v0.6.78
derivative. Major's model is a separate official embed; no Major geometry or
texture pixels are copied here. Skin and motion remain authored illustrations.
"""
import bpy, bmesh, pathlib, math, json, random, sys
from mathutils import Vector

ROOT=pathlib.Path(__file__).resolve().parent
OUT=ROOT/'research-cache/risso-blender-v0679'
OUT.mkdir(parents=True,exist_ok=True)
FAST='--preview-only' in sys.argv
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'model-cetacean-grampus-griseus-v0678.glb'))
body=max((o for o in bpy.context.scene.objects if o.type=='MESH'),key=lambda o:len(o.data.polygons))
for o in list(bpy.context.scene.objects):
    if o!=body:bpy.data.objects.remove(o,do_unlink=True)
bpy.context.view_layer.objects.active=body;body.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
body.name='Risso — editable source-derived skin'
bm=bmesh.new();bm.from_mesh(body.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bm.to_mesh(body.data);bm.free()
# The closed forehead is broadened and softened without adding a beak.
for v in body.data.vertices:
    x,y,z=v.co
    head=math.exp(-((x-1.61)/.26)**4)
    v.co.y*=1+.055*head
    v.co.z+=.030*head*max(0,min(1,(z-1.38)/.18))
    # A shallow median crease on the frontal melon.
    v.co.x-=.004*math.exp(-(y/.019)**2)*math.exp(-((x-1.78)/.12)**2)*max(0,min(1,(z-1.43)/.12))
# Fair the coarse rings in the source before rebuilding a closed shell.
fair=body.modifiers.new('Fair original source ring spacing','SMOOTH');fair.factor=.7;fair.iterations=22
bpy.ops.object.modifier_apply(modifier=fair.name)
# Close source seam cracks and fair uneven rings before facial recesses.
body.data.remesh_voxel_size=.004
bpy.ops.object.voxel_remesh()
smooth=body.modifiers.new('Fair uneven source rings','SMOOTH');smooth.factor=.65;smooth.iterations=12
bpy.ops.object.modifier_apply(modifier=smooth.name)
print('Closed source shell',len(body.data.vertices),'vertices',flush=True)
for p in body.data.polygons:p.use_smooth=True

def cast(x,z,side):
    hit,loc,no,_=body.ray_cast(Vector((x,side*3,z)),Vector((0,-side,0)))
    if not hit:raise RuntimeError('Missing face surface '+str((x,z,side)))
    return loc,no.normalized()

def difference(cutter,name):
    bpy.context.view_layer.objects.active=body
    m=body.modifiers.new(name,'BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cutter
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cutter,do_unlink=True)

eyes=[]
for side in (-1,1):
    hit,no=cast(1.315,1.44,side)
    # The aperture is cut into the body. Its globe sits behind the skin,
    # with only a small elliptic corneal surface exposed through the opening.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=hit-no*.010)
    cut=bpy.context.object;cut.name='Temporary recessed eye cutter';cut.rotation_euler=no.to_track_quat('Z','Y').to_euler();cut.scale=(.021,.0105,.019)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    difference(cut,'Integrated eye aperture')
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=hit-no*.0105)
    eye=bpy.context.object;eye.name=('Anatomical left' if side>0 else 'Anatomical right')+' recessed corneal surface';eye.rotation_euler=no.to_track_quat('Z','Y').to_euler();eye.scale=(.019,.0091,.012)
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    for p in eye.data.polygons:p.use_smooth=True
    eyes.append(eye)

def cut_curve(name,points,radius):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=3;c.use_fill_caps=True
    s=c.splines.new('POLY');s.points.add(len(points)-1)
    for p,co in zip(s.points,points):p.co=(*co,1)
    o=bpy.data.objects.new(name,c);bpy.context.scene.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
    difference(bpy.context.object,name)

for side in (-1,1):
    points=[]
    for k in range(81):
        t=k/80;x=1.355+.485*t;z=1.337-.037*math.sin(t*math.pi*.52)
        hit,no=cast(x,z,side);points.append(hit-no*.001)
    cut_curve('Incised closed mouth margin '+str(side),points,.0018)

# A closed crescent blowhole on the dorsal head, without a raised black rim.
points=[]
for k in range(33):
    t=k/32;y=(t-.5)*.077;x=1.075+.012*math.cos((t-.5)*math.pi*2)
    hit,loc,no,_=body.ray_cast(Vector((x,y,3)),Vector((0,0,-1)))
    if hit:points.append(loc-no*.001)
cut_curve('Closed blowhole crease',points,.0023)
print('Integrated facial recesses complete',flush=True)
for p in body.data.polygons:p.use_smooth=True
body.data.update()

# Purely authored pigmentation in body space; no lit photograph or synthetic
# surface image is projected into the albedo. Optical detail is independent.
mat=bpy.data.materials.new('Smooth Risso epidermis — authored pigment');mat.use_nodes=True;mat.use_fake_user=True
body.data.materials.clear();body.data.materials.append(mat)
n=mat.node_tree.nodes;l=mat.node_tree.links;n.clear()
def node(kind,name):o=n.new(kind);o.label=name;return o
def mathn(op,a,b=None):
    o=node('ShaderNodeMath',op);o.operation=op
    for i,v in enumerate((a,b)):
        if v is None:continue
        if isinstance(v,(float,int)):o.inputs[i].default_value=v
        else:l.new(v,o.inputs[i])
    return o.outputs[0]
def ramp(value,stops):
    lo=min(s[0] for s in stops);hi=max(s[0] for s in stops)
    value=mathn('DIVIDE',mathn('SUBTRACT',value,lo),hi-lo)
    stops=[((pos-lo)/(hi-lo),color) for pos,color in stops]
    o=node('ShaderNodeValToRGB','Soft pigment transition');o.color_ramp.interpolation='EASE'
    for e in list(o.color_ramp.elements)[2:]:o.color_ramp.elements.remove(e)
    for i,(pos,color) in enumerate(stops):
        e=o.color_ramp.elements[i] if i<2 else o.color_ramp.elements.new(pos)
        e.position=pos;e.color=(*color,1)
    l.new(value,o.inputs[0]);return o.outputs['Color']
def mix(a,b,f):
    o=node('ShaderNodeMixRGB','Epidermal pigment');o.blend_type='MIX'
    for inp,v in [(o.inputs[0],f),(o.inputs[1],a),(o.inputs[2],b)]:
        if hasattr(v,'node'):l.new(v,inp)
        elif isinstance(v,(tuple,list)):inp.default_value=(*v,1)
        else:inp.default_value=v
    return o.outputs[0]
tex=node('ShaderNodeTexCoord','Body-space skin');sep=node('ShaderNodeSeparateXYZ','Body axes');l.new(tex.outputs['Object'],sep.inputs[0]);X,Y,Z=[sep.outputs[k] for k in 'XYZ']
noise=node('ShaderNodeTexNoise','Restrained subsurface pigment variation');noise.inputs['Scale'].default_value=13;noise.inputs['Detail'].default_value=2;l.new(tex.outputs['Object'],noise.inputs['Vector'])
base=ramp(noise.outputs['Fac'],[(.1,(.045,.052,.056)),(.9,(.068,.075,.077))])
headmask=ramp(X,[(1.08,(0,0,0)),(1.80,(1,1,1))])
belly=ramp(Z,[(1.02,(1,1,1)),(1.42,(0,0,0))])
color=mix(base,(.34,.35,.33),headmask);color=mix(color,(.39,.405,.38),mathn('MULTIPLY',belly,.84))
az=mathn('ABSOLUTE',Y)
dorsal=mathn('MULTIPLY',ramp(Z,[(1.72,(0,0,0)),(1.91,(1,1,1))]),ramp(az,[(.08,(1,1,1)),(.16,(0,0,0))]))
pectoral=mathn('MULTIPLY',ramp(az,[(.28,(0,0,0)),(.40,(1,1,1))]),ramp(Z,[(1.04,(1,1,1)),(1.24,(0,0,0))]))
pectoral=mathn('MULTIPLY',pectoral,ramp(X,[(-.05,(0,0,0)),(.30,(1,1,1))]))
fluke=mathn('MULTIPLY',ramp(X,[(-1.65,(1,1,1)),(-1.35,(0,0,0))]),ramp(az,[(.04,(0,0,0)),(.12,(1,1,1))]))
finmask=mathn('MAXIMUM',mathn('MAXIMUM',dorsal,pectoral),fluke)
color=mix(color,(.015,.021,.025),finmask)
# Healed, fine irregular rake marks are drawn in a wrap chart and kept flat.
scar_path=ROOT/'risso-rake-mask-v0679.png'
if not scar_path.exists():scar_path=OUT/'authored-rake-mask.png'
if scar_path.exists():
    sc=node('ShaderNodeTexImage','Original individual rake-scar mask');sc.image=bpy.data.images.load(str(scar_path));sc.image.colorspace_settings.name='Non-Color';sc.image.pack();sc.extension='EXTEND'
    coords=node('ShaderNodeCombineXYZ','Cylindrical scar coordinates')
    l.new(mathn('SUBTRACT',.5,mathn('DIVIDE',X,3.85)),coords.inputs['X'])
    l.new(mathn('ADD',.5,mathn('DIVIDE',mathn('ARCTAN2',Y,mathn('SUBTRACT',Z,1.4)),math.pi*2)),coords.inputs['Y'])
    l.new(coords.outputs[0],sc.inputs['Vector'])
    scar=mathn('MULTIPLY',sc.outputs['Color'],mathn('SUBTRACT',1,mathn('MULTIPLY',finmask,.95)))
    color=mix(color,(.53,.55,.52),scar)
# Small dark periorbital tissue stays on the body, around the recessed opening.
ex=mathn('DIVIDE',mathn('SUBTRACT',X,1.315),.038);ez=mathn('DIVIDE',mathn('SUBTRACT',Z,1.44),.021)
eyefield=mathn('ADD',mathn('MULTIPLY',ex,ex),mathn('MULTIPLY',ez,ez))
eyeMask=ramp(eyefield,[(.05,(1,1,1)),(1.5,(0,0,0))]);color=mix(color,(.008,.012,.014),eyeMask)
fine=node('ShaderNodeTexNoise','Microscopic smooth skin detail');fine.inputs['Scale'].default_value=1600;fine.inputs['Detail'].default_value=1;l.new(tex.outputs['Object'],fine.inputs['Vector'])
bump=node('ShaderNodeBump','Very low epidermal relief');bump.inputs['Strength'].default_value=.13;bump.inputs['Distance'].default_value=.000035;l.new(fine.outputs['Fac'],bump.inputs['Height'])
rough=mathn('ADD',.285,mathn('MULTIPLY',noise.outputs['Fac'],.035))
bsdf=node('ShaderNodeBsdfPrincipled','Wet nonmetallic skin');l.new(color,bsdf.inputs['Base Color']);l.new(rough,bsdf.inputs['Roughness']);l.new(bump.outputs['Normal'],bsdf.inputs['Normal']);bsdf.inputs['IOR'].default_value=1.38;bsdf.inputs['Coat Weight'].default_value=.32;bsdf.inputs['Coat Roughness'].default_value=.16
out=node('ShaderNodeOutputMaterial','Skin output');l.new(bsdf.outputs[0],out.inputs['Surface'])
eyeMat=bpy.data.materials.new('Dark cornea inside skin aperture');eyeMat.use_nodes=True
p=eyeMat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.0028,.0035,.0038,1);p.inputs['Roughness'].default_value=.11;p.inputs['IOR'].default_value=1.376;p.inputs['Coat Weight'].default_value=.65;p.inputs['Coat Roughness'].default_value=.07
for eye in eyes:eye.data.materials.clear();eye.data.materials.append(eyeMat)

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8 if FAST else 24;scene.cycles.use_denoising=True
scene.world.color=(.11,.11,.11);scene.view_settings.view_transform='AgX'
scene.render.resolution_x=900 if FAST else 1200;scene.render.resolution_y=570 if FAST else 760;scene.render.resolution_percentage=100
def area(name,loc,power,size,color):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((.5,0,1.45))-o.location).to_track_quat('-Z','Y').to_euler()
area('Broad studio key',(0,-3.8,5),350,4,(.92,.96,1));area('Soft side fill',(2,3.5,3),250,4,(1,.97,.93));area('Dorsal rim',(-1,1,4),300,3,(.8,.9,1))
cam=bpy.data.cameras.new('Inspection camera');camera=bpy.data.objects.new('Inspection camera',cam);scene.collection.objects.link(camera);scene.camera=camera;cam.type='ORTHO'
def render(name,position,target,scale):
    camera.location=position;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();cam.ortho_scale=scale;scene.render.filepath=str(OUT/name);bpy.ops.render.render(write_still=True)
render('after-head.png',(2.7,-5,2.15),(.95,0,1.47),2.38)
render('after-whole.png',(1,-6,2.6),(0,0,1.45),4.55)
if FAST:
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'risso-material-preview.blend'));sys.exit(0)

# Bake only authored albedo/roughness and tiny normal detail into portable maps.
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.1519,island_margin=.006);bpy.ops.object.mode_set(mode='OBJECT')
scene.render.bake.margin=12;scene.render.bake.use_clear=True;scene.cycles.samples=4
em=node('ShaderNodeEmission','Portable bake output');oldSurface=bsdf.outputs[0]
for label,socket,kind,space in [('color',color,'EMIT','sRGB'),('roughness',rough,'EMIT','Non-Color'),('normal',None,'NORMAL','Non-Color')]:
    size=4096 if label=='color' else 2048
    image=bpy.data.images.new('Risso '+label,width=size,height=size,alpha=False);image.colorspace_settings.name=space
    target=node('ShaderNodeTexImage','Bake target '+label);target.image=image;n.active=target
    if socket:l.new(socket,em.inputs['Color']);l.new(em.outputs[0],out.inputs['Surface'])
    else:l.new(bsdf.outputs[0],out.inputs['Surface'])
    bpy.ops.object.bake(type=kind)
    print('Baked',label,flush=True)
    image.filepath_raw=str(OUT/('risso-'+label+'.png'));image.file_format='PNG';image.save()
    image.pack()
    if label=='color':colorImg=image
    elif label=='roughness':roughImg=image
    else:normalImg=image
l.new(bsdf.outputs[0],out.inputs['Surface'])
# GLB material uses the same baked channels; the editable shader is retained.
baked=bpy.data.materials.new('Portable smooth Risso skin');baked.use_nodes=True;bn=baked.node_tree.nodes;bl=baked.node_tree.links;bp=bn.get('Principled BSDF')
for image,inputName in [(colorImg,'Base Color'),(roughImg,'Roughness')]:
    t=bn.new('ShaderNodeTexImage');t.image=image;bl.new(t.outputs['Color'],bp.inputs[inputName])
t=bn.new('ShaderNodeTexImage');t.image=normalImg;nm=bn.new('ShaderNodeNormalMap');bl.new(t.outputs['Color'],nm.inputs['Color']);bl.new(nm.outputs['Normal'],bp.inputs['Normal']);bp.inputs['Coat Weight'].default_value=.32;bp.inputs['Coat Roughness'].default_value=.16;bp.inputs['IOR'].default_value=1.38
body.data.materials[0]=baked

# A simple editable axial rig is saved in Blender, with a neutral static GLB
# for the archive's existing source-linked deformation controller.
arm=bpy.data.armatures.new('Risso axial study rig');rig=bpy.data.objects.new('Risso editable swimming study',arm);scene.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);body.select_set(False)
bpy.ops.object.mode_set(mode='EDIT')
segments=[('Head',1.85,.25),('Trunk',.25,-.65),('Peduncle',-.65,-1.42),('Flukes',-1.42,-1.9)]
previous=None
for name,a,b in segments:
    bone=arm.edit_bones.new(name);bone.head=(a,0,1.45);bone.tail=(b,0,1.45)
    if previous:bone.parent=previous;bone.use_connect=True
    previous=bone
bpy.ops.object.mode_set(mode='OBJECT')
groups={name:body.vertex_groups.new(name=name) for name,_,_ in segments}
centers=[1.0,-.2,-1.035,-1.66]
for v in body.data.vertices:
    x,y,z=v.co;weights=[math.exp(-((x-c)/(.6 if k<2 else .37))**2) for k,c in enumerate(centers)]
    if abs(y)>.27 and x>0:weights=[1,0,0,0]
    total=sum(weights)
    for (name,_,_),w in zip(segments,weights):
        if w/total>.0001:groups[name].add([v.index],w/total,'REPLACE')
mod=body.modifiers.new('Editable axial skin deformation','ARMATURE');mod.object=rig
for eye in eyes:
    g=eye.vertex_groups.new(name='Head');g.add(list(range(len(eye.data.vertices))),1,'REPLACE');m=eye.modifiers.new('Head attachment','ARMATURE');m.object=rig
for name in ('Trunk','Peduncle','Flukes'):
    bone=rig.pose.bones[name];bone.rotation_mode='XYZ'
    for frame in range(1,122,5):
        phase=(frame-1)/120*math.pi*4;amplitude={'Trunk':.035,'Peduncle':.15,'Flukes':.13}[name]
        bone.rotation_euler.x=amplitude*math.sin(phase-{'Trunk':0,'Peduncle':.45,'Flukes':.8}[name])*min(1,(frame-1)/10)
        bone.keyframe_insert(data_path='rotation_euler',frame=frame,group=name)
scene.render.fps=24;scene.frame_start=1;scene.frame_end=121;scene.frame_set(1)
body['source']='ivan.geraldo — https://sketchfab.com/3d-models/e9d97f00de3948218f0388e8a2a117df';body['license']='CC BY 4.0';body['changes']='Blender-smoothed source body, integrated eye openings and closed oral grooves, original skin material and editable axial study rig.'
rig['study_limit']='Authored 5-second posture loop; not measured animal motion. Major appearance viewer is a separate hosted artwork.'
scene['project_notes']='Risso source credit and limitations are attached to the body and rig. Major model is not included. All textures packed.'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'risso-editable-v0679.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in [body,*eyes]:o.select_set(True)
bpy.context.view_layer.objects.active=body
print('Native build saved. Run risso-polish-v0679.py, then risso-export-v0679.py for the portable static GLB.',flush=True)
(OUT/'blender-build.json').write_text(json.dumps({'version':bpy.app.version_string,'source':'model-cetacean-grampus-griseus-v0678.glb','bodyVertices':len(body.data.vertices),'bodyFaces':len(body.data.polygons),'eyeSurfaces':len(eyes),'integratedFacialGrooves':True,'textureMaps':{'color':[4096,4096],'normal':[2048,2048],'roughness':[2048,2048]},'rigBones':[s[0] for s in segments],'animation':'Authored 5-second study; not measured'},indent=2))
