"""Finish facial surface fairing and restrained adult pigment in Blender."""
import bpy,pathlib,math
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parent;P=R/'research-cache/risso-face-v0680'
bpy.ops.wm.open_mainfile(filepath=str(P/'risso-surface.blend'))
s=bpy.context.scene;s.frame_set(1);body=max((o for o in s.objects if o.type=='MESH'),key=lambda o:len(o.data.vertices));rig=next(o for o in s.objects if o.type=='ARMATURE')
for mod in list(body.modifiers):body.modifiers.remove(mod)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
g=body.vertex_groups.new(name='Facial edge fairing')
for v in body.data.vertices:
 x,y,z=v.co;g.add([v.index],max(0,min(1,(x-1.2)/.1)),'REPLACE')
sm=body.modifiers.new('Smooth small lip and eyelid edge irregularities','SMOOTH');sm.factor=.38;sm.iterations=12;sm.vertex_group=g.name;bpy.ops.object.modifier_apply(modifier=sm.name)
g=body.vertex_groups.get('Facial edge fairing')
if g:body.vertex_groups.remove(g)
print('FACIAL_FAIRING_COMPLETE',len(body.data.vertices),flush=True)
arm=body.modifiers.new('Editable axial swimming rig','ARMATURE');arm.object=rig
n=body.data.materials[0].node_tree.nodes;l=body.data.materials[0].node_tree.links;bs=next(x for x in n if x.type=='BSDF_PRINCIPLED');tc=next(x for x in n if x.type=='TEX_COORD')
original=bs.inputs['Base Color'].links[0].from_socket
dark=n.new('ShaderNodeMixRGB');dark.blend_type='MULTIPLY';dark.inputs[0].default_value=1;dark.inputs[2].default_value=(.65,.66,.67,1);l.new(original,dark.inputs[1])
no=n.new('ShaderNodeTexNoise');no.label='Irregular faded healed pigment';no.inputs['Scale'].default_value=24;no.inputs['Detail'].default_value=4;no.inputs['Roughness'].default_value=.7;l.new(tc.outputs['Object'],no.inputs['Vector'])
r=n.new('ShaderNodeValToRGB');r.color_ramp.elements[0].position=.56;r.color_ramp.elements[0].color=(0,0,0,1);r.color_ramp.elements[1].position=.73;r.color_ramp.elements[1].color=(.20,.20,.20,1);l.new(no.outputs['Fac'],r.inputs[0])
mix=n.new('ShaderNodeMixRGB');l.new(r.outputs['Color'],mix.inputs[0]);l.new(dark.outputs[0],mix.inputs[1]);mix.inputs[2].default_value=(.32,.33,.32,1);l.new(mix.outputs[0],bs.inputs['Base Color'])
for o in s.objects:
 if o.type=='MESH'and o!=body:
  ep=next(x for x in o.data.materials[0].node_tree.nodes if x.type=='BSDF_PRINCIPLED');ep.inputs['Roughness'].default_value=.17;ep.inputs['Coat Weight'].default_value=.3
s.cycles.samples=32;s.render.resolution_x=1200;s.render.resolution_y=760
cam=s.camera
def render(name,loc,target,scale):
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/name);bpy.ops.render.render(write_still=True)
render('surface-whole.png',(.6,-6,2.4),(0,0,1.45),4.3)
render('surface-head.png',(2.25,-5,1.9),(1.44,0,1.44),1.12)
render('surface-eye.png',(1.5,-4,1.55),(1.315,-.26,1.44),.23)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'risso-finished.blend'),compress=True)
print('FINISHED_SKIN',flush=True)
