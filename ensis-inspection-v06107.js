import * as T from 'three';import {buildEnsisShell} from './ensis-shell-v06107.js';import {buildEnsisSiphons} from './ensis-siphons-v06107.js';
export function buildEnsisInspection(k,r){const shell=buildEnsisShell(),soft=buildEnsisSiphons();shell.root.add(soft.root);shell.root.rotation.x=Math.PI/2;k.root.add(shell.root);k.root.userData.hideStudioGround=true;
r.valves=shell.valves.map(v=>({...v,shell:v.meshes[0],inner:v.meshes[1]}));r.hingeAxis=shell.axis;r.upper=r.valves[1].parent;r.lower=r.valves[0].parent;r.upperNeutral=0;
r.ensis={shell,soft,pose(t){const q=shell.pose(t);soft.pose(t);return {...q,stage:q.time<4?'External valves and siphons — uncalibrated inspection':'Inspection complete — filtration not simulated'};}};
r.targets=()=>[{mesh:r.valves[0].shell,point:new T.Vector3(0,.17,-.08)},{mesh:r.valves[0].shell,point:new T.Vector3(-1.2,0,-.08)},{mesh:soft.wall,point:new T.Vector3(1.46,0,-.065)}];return [[0,.17,-.08],[-1.2,0,-.08],[1.46,0,-.065]];
}
