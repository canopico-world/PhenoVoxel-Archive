import bpy,json,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parent;report={'materials':[]}
for m in bpy.data.materials:
 report['materials'].append({'name':m.name,'diffuse':list(m.diffuse_color),'nodes':[(n.name,n.type) for n in m.node_tree.nodes] if m.use_nodes else [],'links':[(l.from_node.name,l.to_node.name,l.to_socket.name) for l in m.node_tree.links] if m.use_nodes else []})
for o in bpy.context.scene.objects:o.select_set(False)
selected=[]
for o in bpy.context.scene.objects:
 if o.type=='ARMATURE' or (o.type=='MESH' and o.parent and o.parent.type=='ARMATURE'):
  o.hide_set(False);o.hide_render=False;o.select_set(True);selected.append(o)
report['selected']=[o.name for o in selected];report['modifiers']={o.name:[(m.name,m.type) for m in o.modifiers] for o in selected}
# Convert legacy Glass nodes to explicit web-compatible optical presentation.
for name in ['membrane','ocelli']:
 m=bpy.data.materials[name];m.node_tree.nodes.clear();out=m.node_tree.nodes.new('ShaderNodeOutputMaterial');shader=m.node_tree.nodes.new('ShaderNodeBsdfPrincipled');m.node_tree.links.new(shader.outputs['BSDF'],out.inputs['Surface'])
 shader.inputs['Base Color'].default_value=tuple(m.diffuse_color);shader.inputs['Metallic'].default_value=0;shader.inputs['Roughness'].default_value=.3 if name=='membrane' else .16
 if name=='membrane':shader.inputs['Alpha'].default_value=.28;m.surface_render_method='DITHERED'
# Original source colors, geometry, vertex weights and armature otherwise retained.
bpy.ops.export_scene.gltf(filepath=str(root/'model-source-drosophila-melanogaster-v0715.glb'),export_format='GLB',use_selection=True,export_animations=False,export_yup=True,export_skins=True,export_materials='EXPORT',export_extras=True)
(root/'fruitfly-export-report-v0715.json').write_text(json.dumps(report,indent=2))
