// Direct memberships in the source are asymmetric. Use tissue, name and
// membership together so right cerebral regions remain in the CNS layer.
export function anatomySystem(record){
  let system=record.system;
  if(system==='landmarks'&&!record.sourceName.endsWith('-line'))return 'skeleton';
  if(!['cns','nerves','senses'].includes(system))return system;
  const name=record.name.toLowerCase();
  const memberships=(record.collections||[]).filter(c=>!/^\d:/.test(c)).join(' ').toLowerCase();
  const materials=(record.materials||[]).join(' ').toLowerCase();
  if(/brain|cerebr|cerebell|telenceph|neo-cortex|white matter/.test(memberships+' '+materials)||/spinal cord|spinal tract|spinocerebellar|spinothalamic|corticospinal|fasciculus proprius|cuneate fasciculus|gracile fasciculus|central canal|intermediolateral nucleus|intermediomedial nucleus|spinal reticular|salivatory nucleus|posterior nucleus of vagus/.test(name))return 'cns';
  if(system==='senses'||/sense organs/.test(memberships)||/auditory tube|vitreous body|zonular fibres/.test(name))return 'senses';
  return system;
}
