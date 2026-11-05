"""Finish the Blender project and write a static glTF 2 GLB without add-ons.
The alpha Blender build's bundled glTF exporter is incomplete. This exporter
writes the selected static meshes, UVs, smooth normals and portable materials.
The editable armature and authored action are retained in the .blend project.
"""
import bpy,pathlib,math,json,struct,gc
import numpy as np
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parent;P=R/'research-cache/risso-blender-v0679'
bpy.ops.wm.open_mainfile(filepath=str(P/'risso-polished-intermediate.blend'))
scene=bpy.context.scene;scene.frame_set(1)
body=max((o for o in scene.objects if o.type=='MESH'),key=lambda o:len(o.data.polygons))
rig=next(o for o in scene.objects if o.type=='ARMATURE')
eyes=[o for o in scene.objects if o.type=='MESH' and o!=body]
sculpt_dir=pathlib.Path.home()/'PhenoVoxel-Blender';sculpt_dir.mkdir(exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(sculpt_dir/'risso-sculpt-v0679.blend'),compress=True)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
# Zero influence protects the small apertures from edge collapse. Keep their
# original surface samples while simplifying the rest of the connected shell.
protected=body.vertex_groups.new(name='Portable reduction excluding face apertures')
for v in body.data.vertices:
    x,y,z=v.co;t=max(0,min(1,(x-1.355)/.485));mz=1.337-.037*math.sin(t*math.pi*.52)
    keep_mouth=x>1.33 and abs(z-mz)<.018
    keep_eye=abs(x-1.315)<.055 and abs(z-1.44)<.04
    protected.add([v.index],0 if keep_mouth or keep_eye else 1,'REPLACE')
dec=body.modifiers.new('Portable behavior mesh with protected face','DECIMATE');dec.decimate_type='COLLAPSE';dec.ratio=min(1,150000/(len(body.data.polygons)*2));dec.use_collapse_triangulate=True
dec.vertex_group=protected.name;dec.vertex_group_factor=1
bpy.ops.object.modifier_apply(modifier=dec.name)
for p in body.data.polygons:p.use_smooth=True
body.data.update();body.vertex_groups.clear()
segments=['Head','Trunk','Peduncle','Flukes'];centers=[1,-.2,-1.035,-1.66];groups={name:body.vertex_groups.new(name=name)for name in segments}
for v in body.data.vertices:
    x,y,z=v.co;weights=[math.exp(-((x-c)/(.6 if k<2 else .37))**2)for k,c in enumerate(centers)]
    if abs(y)>.27 and x>0:weights=[1,0,0,0]
    total=sum(weights)
    for name,w in zip(segments,weights):
        if w/total>.0001:groups[name].add([v.index],w/total,'REPLACE')
mod=body.modifiers.new('Editable axial swimming rig','ARMATURE');mod.object=rig
# Restore explicit credit and a neutral material-preview view for editing.
body['source']='https://sketchfab.com/3d-models/e9d97f00de3948218f0388e8a2a117df';body['author']='ivan.geraldo';body['license']='CC BY 4.0'
body['modifications']='Remeshed and faired source shell; integrated recessed eyes and closed mouth/blowhole grooves; authored smooth skin and separate optical channels.'
body.data.materials[0].diffuse_color=(.15,.17,.18,1)
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':
            a.spaces.active.shading.type='MATERIAL';a.spaces.active.region_3d.view_location=(.3,0,1.45);a.spaces.active.region_3d.view_distance=4.5
scene['source_policy']='Major’s artist model is displayed only through the official Sketchfab embed. It is not included in this file.'
scene['study_policy']='Frame 1 is neutral. Frames 1–121 are an authored 5-second axial swimming illustration at 24 fps, not measured animal motion.'
for image in bpy.data.images:
    if image.source=='FILE' and image.has_data and not image.packed_file:
        try:image.pack()
        except Exception:pass
bpy.ops.wm.save_as_mainfile(filepath=str(R/'risso-editable-v0679.blend'),compress=True)

scene.cycles.samples=16;scene.render.resolution_x=1100;scene.render.resolution_y=700
camera=scene.camera
def render(name,loc,target,scale):
    camera.location=loc;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale;scene.render.filepath=str(P/name);bpy.ops.render.render(write_still=True)
render('final-head.png',(2.7,-5,2.15),(.95,0,1.47),2.38)
render('final-whole.png',(1,-6,2.6),(0,0,1.45),4.55)
scene.frame_set(20)
render('final-stroke.png',(1,-6,2.6),(0,0,1.45),4.55)
scene.frame_set(1)

# The native project retains the detailed surface. The interactive derivative
# uses a second reduction, preserving aperture samples for small-screen use.
for modifier in list(body.modifiers):body.modifiers.remove(modifier)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
portable=body.vertex_groups.new(name='Browser reduction excluding apertures')
for v in body.data.vertices:
    x,y,z=v.co;t=max(0,min(1,(x-1.355)/.485));mz=1.337-.037*math.sin(t*math.pi*.52)
    protect=(x>1.33 and abs(z-mz)<.012)or(abs(x-1.315)<.04 and abs(z-1.44)<.028)
    portable.add([v.index],0 if protect else 1,'REPLACE')
body.data.calc_loop_triangles()
reduce=body.modifiers.new('Lighter interactive derivative','DECIMATE');reduce.decimate_type='COLLAPSE';reduce.ratio=min(1,48000/len(body.data.loop_triangles));reduce.vertex_group=portable.name;reduce.vertex_group_factor=1;reduce.use_collapse_triangulate=True
bpy.ops.object.modifier_apply(modifier=reduce.name)
for p in body.data.polygons:p.use_smooth=True

doc={'asset':{'version':'2.0','generator':'PhenoVoxel Blender static export v0.6.79'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'accessors':[],'bufferViews':[],'buffers':[],'images':[],'textures':[],'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071}],'materials':[],'extensionsUsed':['KHR_materials_clearcoat'],'extras':{'source':body['source'],'author':'ivan.geraldo','license':'CC BY 4.0','appearanceReferenceOnly':'Major’s separate official Sketchfab embed; no Major mesh or textures included.','blenderVersion':bpy.app.version_string,'photorealismValidated':False}}
binary=bytearray()
def view(data,target=None):
    while len(binary)%4:binary.append(0)
    start=len(binary);binary.extend(data);obj={'buffer':0,'byteOffset':start,'byteLength':len(data)}
    if target:obj['target']=target
    doc['bufferViews'].append(obj);return len(doc['bufferViews'])-1
def acc(data,kind,component,target):
    arr=np.asarray(data,dtype=np.float32 if component==5126 else np.uint32);o={'bufferView':view(arr.tobytes(),target),'componentType':component,'count':len(arr),'type':kind}
    if kind=='VEC3':o['min']=arr.min(axis=0).tolist();o['max']=arr.max(axis=0).tolist()
    doc['accessors'].append(o);return len(doc['accessors'])-1
def texture(path):
    doc['images'].append({'bufferView':view(path.read_bytes()),'mimeType':'image/png'});doc['textures'].append({'source':len(doc['images'])-1,'sampler':0});return len(doc['textures'])-1
color=texture(P/'risso-color.png');rough=texture(P/'risso-roughness.png')
# The RGB roughness bake is grayscale: its green channel supplies glTF
# roughness. Metallic is explicitly zero, so its blue channel has no effect.
doc['materials'].append({'name':'Smooth authored Risso skin','pbrMetallicRoughness':{'baseColorTexture':{'index':color},'metallicFactor':0,'roughnessFactor':1,'metallicRoughnessTexture':{'index':rough}},'extensions':{'KHR_materials_clearcoat':{'clearcoatFactor':.20,'clearcoatRoughnessFactor':.20}}})
doc['materials'].append({'name':'Dark corneal surface inside skin aperture','pbrMetallicRoughness':{'baseColorFactor':[.0028,.0035,.0038,1],'metallicFactor':0,'roughnessFactor':.11},'extensions':{'KHR_materials_clearcoat':{'clearcoatFactor':.65,'clearcoatRoughnessFactor':.07}}})
stats=[]
for obj in [body,*eyes]:
    mesh=obj.data;mesh.calc_loop_triangles();uv=mesh.uv_layers.active
    positions=[];normals=[];texcoords=[]
    for tri in mesh.loop_triangles:
        for li in tri.loops:
            loop=mesh.loops[li];p=obj.matrix_world@mesh.vertices[loop.vertex_index].co;n=obj.matrix_world.to_3x3()@mesh.corner_normals[li].vector;n.normalize()
            positions.append((p.x,p.z,-p.y));normals.append((n.x,n.z,-n.y));a=uv.data[li].uv if uv else (0,0);texcoords.append((a[0],1-a[1]))
    pr={'attributes':{'POSITION':acc(positions,'VEC3',5126,34962),'NORMAL':acc(normals,'VEC3',5126,34962),'TEXCOORD_0':acc(texcoords,'VEC2',5126,34962)},'indices':acc(np.arange(len(positions)),'SCALAR',5125,34963),'material':0 if obj==body else 1}
    doc['meshes'].append({'name':obj.name,'primitives':[pr]});doc['nodes'].append({'name':obj.name,'mesh':len(doc['meshes'])-1});doc['scenes'][0]['nodes'].append(len(doc['nodes'])-1)
    stats.append({'name':obj.name,'triangles':len(mesh.loop_triangles),'exportVertices':len(positions)})
doc['buffers']=[{'byteLength':len(binary)}]
data=json.dumps(doc,separators=(',',':')).encode();data+=b' '*((-len(data))%4);binary+=b'\x00'*((-len(binary))%4)
glb=struct.pack('<III',0x46546c67,2,12+8+len(data)+8+len(binary))+struct.pack('<II',len(data),0x4e4f534a)+data+struct.pack('<II',len(binary),0x004e4942)+binary
(P/'risso-export.glb').write_bytes(glb)
(P/'blender-build.json').write_text(json.dumps({'version':bpy.app.version_string,'source':'model-cetacean-grampus-griseus-v0678.glb','meshes':stats,'bytes':len(glb),'maps':{'color':[4096,4096],'roughness':[2048,2048]},'fineNormalMap':'The rejected coarse normal bake is omitted; the portable skin uses smooth geometry and independent roughness.','bodyIntegratedFace':True,'rigBones':segments,'localSculpt':str(sculpt_dir/'risso-sculpt-v0679.blend'),'nativeProject':'risso-editable-v0679.blend','animation':'Authored 5-second study; not measured'},indent=2))
print('EXPORTED',len(glb),'bytes',stats,flush=True)
