"""Pack the edited native project and export its actual neutral geometry/maps."""
import bpy,bmesh,pathlib,math,json,struct
import numpy as np
R=pathlib.Path(__file__).resolve().parent;P=R/'research-cache/risso-face-v0681'
bpy.ops.wm.open_mainfile(filepath=str(P/'risso-finished.blend'))
scene=bpy.context.scene;scene.frame_set(1);body=max((o for o in scene.objects if o.type=='MESH'),key=lambda o:len(o.data.vertices));eyes=[o for o in scene.objects if o.type=='MESH'and o!=body];rig=next(o for o in scene.objects if o.type=='ARMATURE')
sculpt_dir=pathlib.Path.home()/'PhenoVoxel-Blender';sculpt_dir.mkdir(exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(sculpt_dir/'risso-sculpt-v0681.blend'),compress=True)
for modifier in list(body.modifiers):body.modifiers.remove(modifier)
def mouth_height(x):return 1.310+.087*math.exp(-((x-1.265)/.116)**2)
def reduce_body(target,name):
 bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
 protected=body.vertex_groups.new(name=name)
 for v in body.data.vertices:
  x,y,z=v.co;eye=abs(x-1.315)<.044 and abs(z-1.44)<.040;mouth=1.29<x<1.89 and abs(z-mouth_height(x))<.014
  protected.add([v.index],0 if eye or mouth else 1,'REPLACE')
 body.data.calc_loop_triangles();dec=body.modifiers.new(name,'DECIMATE');dec.ratio=min(1,target/len(body.data.loop_triangles));dec.vertex_group=protected.name;dec.vertex_group_factor=1;dec.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=dec.name)
 protected=body.vertex_groups.get(name)
 if protected:body.vertex_groups.remove(protected)
 for polygon in body.data.polygons:polygon.use_smooth=True
reduce_body(220000,'Retain eye margins and curved mouth')
bm=bmesh.new();bm.from_mesh(body.data);closed_skin_edges=sum(e.is_boundary for e in bm.edges);bm.free();assert closed_skin_edges==0,('Skin has open edges',closed_skin_edges)
print('Native retained triangles',len(body.data.polygons),flush=True)

# Repack the new connected surface. Pigment comes from its editable body-space
# shader, so the new mouth skin does not inherit disconnected old UV seams.
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.1519,island_margin=.006);bpy.ops.object.mode_set(mode='OBJECT')
scene.render.engine='CYCLES';scene.cycles.samples=1;scene.render.bake.margin=12;scene.render.bake.use_clear=True
def bake(obj,label,size,input_name,space):
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
 mat=obj.data.materials[0];n=mat.node_tree.nodes;l=mat.node_tree.links;out=next(o for o in n if o.type=='OUTPUT_MATERIAL');bsdf=next(o for o in n if o.type=='BSDF_PRINCIPLED');surface=out.inputs['Surface'].links[0].from_socket
 image=bpy.data.images.new('Risso v681 '+label,width=size,height=size,alpha=False);image.colorspace_settings.name=space
 target=n.new('ShaderNodeTexImage');target.image=image;target.label='Portable '+label;n.active=target
 emission=n.new('ShaderNodeEmission');socket=bsdf.inputs[input_name]
 if input_name=='Normal':pass
 elif socket.is_linked:l.new(socket.links[0].from_socket,emission.inputs['Color'])
 else:
  value=socket.default_value;emission.inputs['Color'].default_value=(*([value]*3 if isinstance(value,float)else value[:3]),1)
 if input_name=='Normal':bpy.ops.object.bake(type='NORMAL')
 else:
  l.new(emission.outputs[0],out.inputs['Surface']);bpy.ops.object.bake(type='EMIT')
 l.new(surface,out.inputs['Surface']);n.remove(emission)
 image.filepath_raw=str(P/(label+'.png'));image.file_format='PNG';image.save();image.pack();image.use_fake_user=True
 print('Baked',label,flush=True);return image
color=bake(body,'skin-color',4096,'Base Color','sRGB');rough=bake(body,'skin-roughness',2048,'Roughness','Non-Color');normal=bake(body,'skin-normal',2048,'Normal','Non-Color');eye_color=bake(eyes[0],'eye-color',1024,'Base Color','sRGB')
arm=body.modifiers.new('Editable axial swimming rig','ARMATURE');arm.object=rig
for image in bpy.data.images:
 if image.has_data and image.source=='FILE'and not image.packed_file:image.pack()
scene['source_policy']='The viewer and exports use the archive’s edited Ivan Geraldo CC BY 4.0 derivative. No embedded model or Major geometry/textures are included.'
scene['face_revision']='Inset corneal/iris surfaces with same-body skin margins; replacement curved closed oral margin. Anatomy and timing are authored and unvalidated.'
bpy.ops.wm.save_as_mainfile(filepath=str(R/'risso-editable-v0681.blend'),compress=True)
for modifier in list(body.modifiers):body.modifiers.remove(modifier)
reduce_body(100000,'Interactive face detail protection')

# Independent static glTF writer, avoiding the alpha build's incomplete add-on.
doc={'asset':{'version':'2.0','generator':'PhenoVoxel native Blender facial revision 0.6.81'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'accessors':[],'bufferViews':[],'buffers':[],'images':[],'textures':[],'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071}],'materials':[],'extensionsUsed':['KHR_materials_clearcoat'],'extras':{'author':'ivan.geraldo','license':'CC BY 4.0','source':'https://sketchfab.com/3d-models/e9d97f00de3948218f0388e8a2a117df','changes':'Archive skin eyelid sculpt, inset iris/cornea and replacement curved closed mouth; original body-space pigment and independent roughness baked from Blender.','localArchiveModel':True,'embeddedViewer':False,'photorealismValidated':False}}
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
c=texture(P/'skin-color.png');r=texture(P/'skin-roughness.png');e=texture(P/'eye-color.png')
normal_index=texture(P/'skin-normal.png')
doc['materials']=[{'name':'Archive same-skin facial tissue','pbrMetallicRoughness':{'baseColorTexture':{'index':c},'metallicFactor':0,'roughnessFactor':1,'metallicRoughnessTexture':{'index':r}},'extensions':{'KHR_materials_clearcoat':{'clearcoatFactor':.32,'clearcoatRoughnessFactor':.16}}},{'name':'Risso cornea with inset dark iris','pbrMetallicRoughness':{'baseColorTexture':{'index':e},'metallicFactor':0,'roughnessFactor':.25},'extensions':{'KHR_materials_clearcoat':{'clearcoatFactor':.12,'clearcoatRoughnessFactor':.22}}}]
doc['materials'][0]['normalTexture']={'index':normal_index,'scale':.3}
doc['materials'][0]['extensions']['KHR_materials_clearcoat']={'clearcoatFactor':.09,'clearcoatRoughnessFactor':.30}
stats=[]
for obj in [body,*eyes]:
 mesh=obj.data;mesh.calc_loop_triangles();uv=mesh.uv_layers.active;positions=[];normals=[];texcoords=[]
 for tri in mesh.loop_triangles:
  for li in tri.loops:
   loop=mesh.loops[li];p=obj.matrix_world@mesh.vertices[loop.vertex_index].co;no=obj.matrix_world.to_3x3()@mesh.corner_normals[li].vector;no.normalize();a=uv.data[li].uv
   positions.append((p.x,p.z,-p.y));normals.append((no.x,no.z,-no.y));texcoords.append((a.x,1-a.y))
 pr={'attributes':{'POSITION':acc(positions,'VEC3',5126,34962),'NORMAL':acc(normals,'VEC3',5126,34962),'TEXCOORD_0':acc(texcoords,'VEC2',5126,34962)},'indices':acc(np.arange(len(positions)),'SCALAR',5125,34963),'material':0 if obj==body else 1}
 doc['meshes'].append({'name':obj.name,'primitives':[pr]});doc['nodes'].append({'name':obj.name,'mesh':len(doc['meshes'])-1});doc['scenes'][0]['nodes'].append(len(doc['nodes'])-1);stats.append({'name':obj.name,'triangles':len(mesh.loop_triangles)})
doc['buffers']=[{'byteLength':len(binary)}];data=json.dumps(doc,separators=(',',':')).encode();data+=b' '*((-len(data))%4);binary+=b'\0'*((-len(binary))%4)
glb=struct.pack('<III',0x46546c67,2,12+8+len(data)+8+len(binary))+struct.pack('<II',len(data),0x4e4f534a)+data+struct.pack('<II',len(binary),0x004e4942)+binary
(P/'export.glb').write_bytes(glb);proof=json.loads((P/'face-build.json').read_text());proof.update(portableMeshes=stats,colorSize=4096,roughnessSize=2048,eyeColorSize=1024,embeddedViewer=False)
proof['closedSkinBoundaryEdges']=closed_skin_edges
(P/'face-build.json').write_text(json.dumps(proof,indent=2));print('EXPORTED',len(glb),stats,flush=True)
