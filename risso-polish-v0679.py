import bpy,pathlib,math,json
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parent;P=R/'research-cache/risso-blender-v0679'
bpy.ops.wm.open_mainfile(filepath=str(R/'risso-editable-v0679.blend'))
body=max((o for o in bpy.context.scene.objects if o.type=='MESH'),key=lambda o:len(o.data.polygons))
old=body.data;coords=[v.co[:] for v in old.vertices];faces=[p.vertices[:] for p in old.polygons];uvs=[d.uv[:] for d in old.uv_layers.active.data]
clean=bpy.data.meshes.new('Risso clean connected surface');clean.from_pydata(coords,[],faces);clean.update();uv=clean.uv_layers.new(name='Skin UV')
for i,v in enumerate(uvs):uv.data[i].uv=v
for mat in old.materials:clean.materials.append(mat)
body.data=clean
for p in clean.polygons:p.use_smooth=True
print('Fresh normals',clean.has_custom_normals,len(clean.vertices),len(clean.polygons),flush=True)
for mat in clean.materials:
    if not mat.use_nodes:continue
    for n in mat.node_tree.nodes:
        if n.type=='BSDF_PRINCIPLED':
            for link in list(n.inputs['Normal'].links):mat.node_tree.links.remove(link)
            n.inputs['Roughness'].default_value=.34
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
for m in list(body.modifiers):body.modifiers.remove(m)
weights=body.vertex_groups.new(name='Surface fairing influence')
for v in clean.vertices:
    x,y,z=v.co
    eye=math.exp(-((x-1.315)/.045)**2-((z-1.44)/.03)**2)
    t=max(0,min(1,(x-1.355)/.485));mz=1.337-.037*math.sin(t*math.pi*.52)
    mouth=math.exp(-((z-mz)/.014)**2) if x>1.33 else 0
    weight=(1-eye)*(1-mouth)
    if abs(y)>.28 and z<1.25:weight*=.12
    if z>1.78:weight*=.2
    if x<-1.4 and abs(y)>.1:weight*=.1
    weights.add([v.index],max(.0,weight),'REPLACE')
smooth=body.modifiers.new('Continuous fairing with protected apertures','SMOOTH');smooth.factor=.62;smooth.iterations=100;smooth.vertex_group=weights.name
bpy.ops.object.modifier_apply(modifier=smooth.name)
for p in body.data.polygons:p.use_smooth=True
scene=bpy.context.scene;scene.cycles.samples=12;scene.render.resolution_x=1000;scene.render.resolution_y=650
cam=scene.camera;cam.location=(2.7,-5,2.15);cam.rotation_euler=(Vector((.95,0,1.47))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.38
scene.render.filepath=str(P/'polished-head.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'risso-polished-intermediate.blend'),compress=True)
