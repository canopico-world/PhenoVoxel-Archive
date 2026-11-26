export const HOLD_MS = 2000;
const TOUCH_SLOP = 10;
const MOUSE_SLOP = 7;

export function createBeyondHold(onLift, {schedule=setTimeout, clear=clearTimeout}={}) {
  let pending=null;
  let timer;

  function cancel(id) {
    if(!pending || (id!==undefined && pending.id!==id))return;
    clear(timer);
    pending=null;
  }

  return {
    start(contact) {
      cancel();
      pending={...contact};
      timer=schedule(()=>{
        const lifted=pending;
        pending=null;
        if(lifted)onLift(lifted);
      },HOLD_MS);
    },
    move({id,x,y}) {
      if(pending?.id!==id)return;
      const slop=pending.kind==='touch'?TOUCH_SLOP:MOUSE_SLOP;
      if(Math.hypot(x-pending.x,y-pending.y)>slop)cancel(id);
    },
    cancel,
    get pending(){return pending;}
  };
}
