import './risso-reference.css';

export function mountRissoStudy({species,pauseStudy}){
 if(species.id!=='grampus-griseus')return()=>{};
 const layout=document.querySelector('.specimen-layout'),study=document.querySelector('.viewer-panel'),behavior=document.querySelector('.behavior-panel');
 const note=document.createElement('p');note.id='risso-study-note';note.className='risso-study-note';
 note.textContent='Archive model · editable in Blender. Based on ivan.geraldo’s CC BY 4.0 source, with archive sculpting, materials and authored movement.';
 layout.before(note);study.hidden=false;behavior.hidden=false;pauseStudy();
 const tag=study.querySelector('.schematic-tag');if(tag)tag.textContent='Editable archive model';
 document.body.dataset.rissoView='study';
 return()=>{note.remove();delete document.body.dataset.rissoView;};
}
