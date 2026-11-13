import bpy,os,json
from mathutils import Vector
ROOT=r'C:/Users/Fourthyz/PhenoVoxel-Archive-quality-2026-10-19/'
P=ROOT+'research-cache/salamander-v0721/'
bpy.ops.wm.open_mainfile(filepath=P+'imported-fbx.blend')
s=bpy.context.scene;s.frame_start=1;s.frame_end=320;s.render.fps=30;s.frame_set(1)
def image(name,space):
 i=bpy.data.images.load(P+'author-source/textures/'+name,check_existing=False);i.colorspace_settings.name=space
 if 'normal' in name:i.scale(2048,2048)
 if 'rough' in name:i.scale(2048,2048)
 i.pack();return i
albedo=image('andrias_albedo_17.jpg','sRGB');normal=image('andrias_normal_08.png','Non-Color');rough=image('andrias_rough_01.png','Non-Color')
for o in s.objects:
 if o.type!='MESH':continue
 eye='eyes' in o.name
 m=bpy.data.materials.new('Source photographic eyes' if eye else 'Source photographic skin');m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.24 if eye else .65
 c=n.new('ShaderNodeTexImage');c.image=albedo
 if eye:
  tint=n.new('ShaderNodeMixRGB');tint.blend_type='MULTIPLY';tint.inputs[0].default_value=1;tint.inputs[2].default_value=(.02,.015,.01,1);l.new(c.outputs['Color'],tint.inputs[1]);l.new(tint.outputs[0],bs.inputs['Base Color'])
 else:l.new(c.outputs['Color'],bs.inputs['Base Color'])
 if not eye:
  r=n.new('ShaderNodeTexImage');r.image=rough;l.new(r.outputs['Color'],bs.inputs['Roughness']);nm=n.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=1;t=n.new('ShaderNodeTexImage');t.image=normal;l.new(t.outputs['Color'],nm.inputs['Color']);l.new(nm.outputs['Normal'],bs.inputs['Normal'])
 o.data.materials.clear();o.data.materials.append(m)
for a in bpy.data.actions:a.name='Underwater walking - source reconstruction'
s['source']='DigitalLife Model 98A; Johnson Martin et al; Kawano et al. 2024, doi:10.1093/icb/icae129';s['license']='CC BY-NC 4.0';s['scope']='Re-exported original FBX with source photographic pigment, normal and roughness. Not independent validation of gait or live reflectance.'
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'salamander-editable-v0721.blend')
bpy.ops.export_scene.gltf(filepath=P+'repaired-raw.glb',export_format='GLB',export_animations=True,export_frame_range=True,export_force_sampling=True,export_animation_mode='ACTIVE_ACTIONS',export_anim_single_armature=True,export_rest_position_armature=True,export_extras=True,export_yup=True,export_apply=False,export_cameras=False,export_lights=False,export_image_format='AUTO',export_optimize_animation_size=False)
# Posed bounds, not unposed object bounds, for verification renders.
s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';s.display.shading.show_shadows=True;s.display.shading.show_cavity=True
s.render.resolution_x=1200;s.render.resolution_y=700;s.render.resolution_percentage=100
cam=bpy.data.objects.new('Inspection camera',bpy.data.cameras.new('Inspection camera'));s.collection.objects.link(cam);s.camera=cam;cam.data.type='ORTHO'
for fr in [1,40,80,160,320]:
 s.frame_set(fr);dg=bpy.context.evaluated_depsgraph_get();pts=[o.matrix_world@Vector(c) for o in s.objects if o.type=='MESH' for c in o.evaluated_get(dg).bound_box];low=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)]);c=(low+hi)/2;span=max(hi-low)
 cam.data.ortho_scale=span*1.65;cam.location=c+Vector((.2,-.3,2))*span;cam.rotation_euler=(c-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=P+'source-pose-'+str(fr)+'.png';bpy.ops.render.render(write_still=True)
print('EXPORT_COMPLETE',os.path.getsize(P+'repaired-raw.glb'),flush=True)
