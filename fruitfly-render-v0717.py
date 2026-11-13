"""Matched-light material comparison, Blender 5.x. No model edits. CC0."""
import bpy, pathlib, mathutils
ROOT=pathlib.Path(__file__).resolve().parent
for version in ['0716','0717']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/f'model-source-drosophila-melanogaster-v{version}.glb'))
    scene=bpy.context.scene
    for mat in bpy.data.materials:
        if mat.name.endswith('_membrane'):
            print(mat.name,[(n.name,n.inputs['Alpha'].default_value) for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'],flush=True)
    for obj in scene.objects:
        if obj.type=='ARMATURE': obj.data.pose_position='REST'
    bpy.context.view_layer.update()
    meshes=[o for o in scene.objects if o.type=='MESH']
    points=[o.matrix_world@mathutils.Vector(c) for o in meshes for c in o.bound_box]
    lo=mathutils.Vector([min(p[i] for p in points) for i in range(3)])
    hi=mathutils.Vector([max(p[i] for p in points) for i in range(3)])
    center=(lo+hi)/2;span=max(hi-lo)
    bpy.ops.object.camera_add(location=center+mathutils.Vector((-1.1,-1.8,1.0))*span)
    camera=bpy.context.object;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=span*1.18;scene.camera=camera
    for pos,energy,size in [((-1,-1,2),50,2),((1,2,1),25,2)]:
        bpy.ops.object.light_add(type='AREA',location=center+mathutils.Vector(pos)*span)
        light=bpy.context.object;light.data.energy=energy*span*span;light.data.shape='DISK';light.data.size=size*span
        light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
    world=bpy.data.worlds.new('Matched teal studio');world.use_nodes=True
    world.node_tree.nodes['Background'].inputs['Color'].default_value=(.025,.055,.065,1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5;scene.world=world
    scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
    scene.view_settings.view_transform='AgX'
    scene.render.resolution_x=1000;scene.render.resolution_y=700;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/f'fruitfly-surface-{version}-v0717.png')
    bpy.ops.render.render(write_still=True)
