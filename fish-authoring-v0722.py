import bpy,pathlib,json
R=pathlib.Path(__file__).resolve().parent; P=R/'research-cache/fish-v0722'
for n,f,tex in [('sturgeon',P/'model-66a-atlantic-sturgeon/source/atlaSturgeon_038_johnson_sketchfab.blend',P/'model-66a-atlantic-sturgeon/textures'),('eel',P/'model-71a-american-eel/source/unpacked/eelAmerican_024_johnson_sketchfab.blend',P/'model-71a-american-eel/textures')]:
 bpy.ops.wm.open_mainfile(filepath=str(f),load_ui=False);s=bpy.context.scene
 if n=='eel':
  for i in bpy.data.images:
   if 'albedo' in i.name:i.filepath=str(tex/'eel_albedo11.png');i.reload()
   elif 'normal' in i.name and 'normalbake'!=i.name:i.filepath=str(tex/'eel_normal4.png');i.reload()
   elif 'rough' in i.name:i.filepath=str(f.parent/'eel_roughness.png');i.reload()
 for i in bpy.data.images:
  if i.size[0]>0:i.pack()
 # Apply the source mirror/subdivision before exporting weights; never bake a pose into a rest mesh.
 for o in s.objects:
  if o.type!='MESH':continue
  bpy.context.view_layer.objects.active=o;o.select_set(True)
  for m in list(o.modifiers):
   if m.type!='ARMATURE':bpy.ops.object.modifier_apply(modifier=m.name)
  o.select_set(False)
 # Exit the source's saved NLA tweak mode before evaluating or exporting actions.
 for arm in [o for o in s.objects if o.type=='ARMATURE']:
  arm.animation_data.use_tweak_mode=False
  for track in list(arm.animation_data.nla_tracks):arm.animation_data.nla_tracks.remove(track)
  arm.animation_data.action=bpy.data.actions['slow_swim_steady_baked' if n=='sturgeon' else 'Action']
  arm.animation_data.action_slot=arm.animation_data.action.slots[0]
 # Pre-bake control actions are not finished studies.
 for a in list(bpy.data.actions):
  if 'preBake' in a.name:bpy.data.actions.remove(a)
 s.frame_set(s.frame_start)
 bpy.ops.wm.save_as_mainfile(filepath=str(R/('fish-'+n+'-editable-v0722.blend')))
 bpy.ops.export_scene.gltf(filepath=str(P/(n+'-raw.glb')),export_format='GLB',export_animations=True,export_frame_range=False,export_force_sampling=True,export_animation_mode='ACTIONS',export_rest_position_armature=True,export_extras=True,export_yup=True,export_apply=False,export_cameras=False,export_lights=False,export_image_format='AUTO',export_optimize_animation_size=False)
 print('EXPORTED',n,flush=True)

