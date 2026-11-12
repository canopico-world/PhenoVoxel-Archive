"""Run in Blender with the pinned original drosophila.blend opened.
Build PBR cuticle materials, bake embedded maps, and retarget source kinematics.
Original geometry/rig Apache-2.0; authored surfaces CC0; movement derivative GPL-3.0-or-later.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Matrix
ROOT=Path(__file__).resolve().parent;CACHE=ROOT/'research-cache/fruitfly-v0716'
scene=bpy.context.scene;arm=next(o for o in scene.objects if o.type=='ARMATURE')
meshes=[o for o in scene.objects if o.type=='MESH' and o.parent==arm]
for o in scene.objects:o.select_set(False)
for o in meshes:o.hide_set(False);o.hide_render=False;o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
# One non-overlapping atlas; topology, positions and weights remain unchanged.
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.002,area_weight=.5)
bpy.ops.object.mode_set(mode='OBJECT')

def lin(hexstr):
 vals=[int(hexstr[i:i+2],16)/255 for i in (0,2,4)]
 return [v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vals]+[1]

newmats=[]
for obj in meshes:
 bounds=[obj.matrix_world@v.co for v in obj.data.vertices];lo=min(v.x for v in bounds);hi=max(v.x for v in bounds)
 for slot in obj.material_slots:
  if not slot.material:continue
  old=slot.material.name;mat=bpy.data.materials.new('PV716_'+obj.name+'_'+old);mat.use_nodes=True;slot.material=mat
  ns=mat.node_tree.nodes;ns.clear();lk=mat.node_tree.links
  out=ns.new('ShaderNodeOutputMaterial');bs=ns.new('ShaderNodeBsdfPrincipled');lk.new(bs.outputs['BSDF'],out.inputs['Surface'])
  base={'body':'94663B','lower':'BFA67B','red':'A3321B','black':'16110C','brown':'59452B','bristle-brown':'443323','membrane':'D6D8C4','ocelli':'36291C','base':'806340'}.get(old,'94663B')
  bs.inputs['Base Color'].default_value=lin(base);bs.inputs['Metallic'].default_value=0
  bs.inputs['Roughness'].default_value=.42 if old not in ['red','ocelli','membrane'] else .27
  bs.inputs['Coat Weight'].default_value=.18;bs.inputs['Coat Roughness'].default_value=.3
  if old=='membrane':
   bs.inputs['Alpha'].default_value=.2;mat.surface_render_method='DITHERED';mat.use_backface_culling=False
  pos=ns.new('ShaderNodeNewGeometry');sep=ns.new('ShaderNodeSeparateXYZ');lk.new(pos.outputs['Position'],sep.inputs[0])
  noise=ns.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=95;noise.inputs['Detail'].default_value=2;noise.inputs['Roughness'].default_value=.7;lk.new(pos.outputs['Position'],noise.inputs['Vector'])
  ramp=ns.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=[x*.72 for x in lin(base)[:3]]+[1];ramp.color_ramp.elements[1].color=[min(1,x*1.16) for x in lin(base)[:3]]+[1];lk.new(noise.outputs['Fac'],ramp.inputs[0]);color=ramp.outputs['Color']
  if obj.name.startswith('abdomen_') and old=='body':
   index=int(obj.name.split('_')[-1]);edge=ns.new('ShaderNodeMapRange');edge.clamp=True
   edge.inputs['From Min'].default_value=lo+(hi-lo)*(.62 if index<7 else .72);edge.inputs['From Max'].default_value=lo+(hi-lo)*(.73 if index<7 else .84)
   lk.new(sep.outputs['X'],edge.inputs['Value']);mix=ns.new('ShaderNodeMixRGB');mix.inputs[2].default_value=lin('292116');lk.new(edge.outputs[0],mix.inputs[0]);lk.new(color,mix.inputs[1]);color=mix.outputs[0]
  if obj.name=='thorax' and old=='body':
   edge=ns.new('ShaderNodeMapRange');edge.inputs['From Min'].default_value=1.16;edge.inputs['From Max'].default_value=1.65;edge.clamp=True;lk.new(sep.outputs['Z'],edge.inputs['Value']);mix=ns.new('ShaderNodeMixRGB');mix.inputs[2].default_value=lin('654422');lk.new(edge.outputs[0],mix.inputs[0]);lk.new(color,mix.inputs[1]);color=mix.outputs[0]
  if old not in ['membrane','ocelli']:lk.new(color,bs.inputs['Base Color'])
  fine=ns.new('ShaderNodeTexNoise');fine.inputs['Scale'].default_value=235;fine.inputs['Detail'].default_value=2;lk.new(pos.outputs['Position'],fine.inputs['Vector'])
  bump=ns.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.0012;lk.new(fine.outputs['Fac'],bump.inputs['Height'])
  if old not in ['membrane','black','bristle-brown','red','ocelli']:lk.new(bump.outputs['Normal'],bs.inputs['Normal'])
  rough=ns.new('ShaderNodeMapRange');rough.inputs['To Min'].default_value=.27 if old=='red' else .33;rough.inputs['To Max'].default_value=.35 if old=='red' else .49;lk.new(noise.outputs['Fac'],rough.inputs['Value']);lk.new(rough.outputs[0],bs.inputs['Roughness'])
  newmats.append((mat,bs,old))

scene.render.engine='CYCLES';scene.cycles.samples=1;scene.render.bake.use_clear=False;scene.render.bake.margin=12
images={}
for kind,size in [('DIFFUSE',2048),('ROUGHNESS',1024),('NORMAL',1024)]:
 image=bpy.data.images.new('Fly716_'+kind,width=size,height=size,alpha=False)
 if kind!='DIFFUSE':image.colorspace_settings.name='Non-Color'
 for mat,bs,old in newmats:
  node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;mat.node_tree.nodes.active=node
 scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True
 bpy.ops.object.bake(type=kind)
 image.filepath_raw=str(CACHE/('surface-'+kind+'.png'));image.file_format='PNG';image.save();image.pack();images[kind]=image
 print('BAKED',kind,flush=True)
for mat,bs,old in newmats:
 for socket in ['Base Color','Roughness','Normal']:
  for link in list(bs.inputs[socket].links):mat.node_tree.links.remove(link)
 if old not in ['membrane','ocelli']:
  tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=images['DIFFUSE'];mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
 rough=mat.node_tree.nodes.new('ShaderNodeTexImage');rough.image=images['ROUGHNESS'];mat.node_tree.links.new(rough.outputs['Color'],bs.inputs['Roughness'])
 if old not in ['membrane','black','bristle-brown','red','ocelli']:
  tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=images['NORMAL'];norm=mat.node_tree.nodes.new('ShaderNodeNormalMap');mat.node_tree.links.new(tex.outputs['Color'],norm.inputs['Color']);mat.node_tree.links.new(norm.outputs['Normal'],bs.inputs['Normal'])

# Permit fitted translations while preserving bone parents, rest matrices and weights.
bpy.context.view_layer.objects.active=arm;arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for bone in arm.data.edit_bones:bone.use_connect=False
bpy.ops.object.mode_set(mode='OBJECT')
# Source IK targets are authoring controls, not part of fitted forward kinematics.
for pb in arm.pose.bones:
 for constraint in list(pb.constraints):pb.constraints.remove(constraint)
motion=json.loads((CACHE/'retargeted-matrices.json').read_text())
for action in list(bpy.data.actions):bpy.data.actions.remove(action)
arm.animation_data_create();scene.render.fps=50
for clip in motion['clips']:
 action=bpy.data.actions.new(clip['name']);action.use_fake_user=True;arm.animation_data.action=action
 for frame,matrices in zip(clip['frames'],clip['matrices']):
  scene.frame_set(frame)
  for name,mat in zip(motion['boneNames'],matrices):
   pb=arm.pose.bones[name];pb.rotation_mode='QUATERNION';pb.matrix=Matrix(mat)
   # Evaluate ancestors before their children, preserving source joint frames.
   bpy.context.view_layer.update()
   pb.keyframe_insert(data_path='location',frame=frame);pb.keyframe_insert(data_path='rotation_quaternion',frame=frame);pb.keyframe_insert(data_path='scale',frame=frame)
 print('ACTION',clip['name'],flush=True)
arm.animation_data.action=None
for pb in arm.pose.bones:pb.matrix_basis=Matrix.Identity(4)
scene.frame_start=0;scene.frame_end=305;bpy.context.view_layer.update()
for o in scene.objects:o.select_set(False)
for o in [arm]+meshes:o.select_set(True)
bpy.context.view_layer.objects.active=arm
bpy.ops.wm.save_as_mainfile(filepath=str(CACHE/'fruitfly-authored-v0716.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'model-source-drosophila-melanogaster-v0716.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_frame_range=False,export_force_sampling=True,export_optimize_animation_size=True,export_yup=True,export_skins=True,export_materials='EXPORT',export_extras=True)
print('EXPORT COMPLETE',flush=True)
