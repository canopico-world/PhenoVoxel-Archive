// Keep the WebGL canvas and its current selection when switching between the two views.
export function mountStudyLayout(viewer, dialog) {
  const home = document.createElement('div');
  home.className = 'model-home';
  viewer.before(home);
  home.append(viewer);

  let atlas, slot, frame, loadObserver;
  const toggles = new Map();

  function disclosure(panel, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'study-fold';
    button.textContent = label;
    panel.prepend(button);
    const set = open => {
      panel.dataset.studyOpen = String(open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', (open ? 'Collapse ' : 'Expand ') + label);
    };
    set(true);
    button.onclick = () => {
      set(panel.dataset.studyOpen !== 'true');
      sync();
    };
    toggles.set(panel, set);
  }

  function restore() {
    if (!dialog.open && viewer.parentNode !== home) home.append(viewer);
    home.style.minHeight = '';
    home.classList.remove('model-away');
  }

  function sync() {
    if (dialog.open) return;
    if (!atlas?.isConnected || atlas.dataset.studyOpen === 'false') { restore(); return; }
    const bounds = atlas.getBoundingClientRect();
    const nav = document.querySelector('.study-jumps');
    const top = getComputedStyle(nav).position === 'sticky'
      ? parseFloat(getComputedStyle(nav).top) + nav.offsetHeight : 0;
    atlas.style.setProperty('--atlas-top', top + 'px');
    if (bounds.top < innerHeight * .7 && bounds.bottom > top + 70) {
      if (viewer.parentNode !== slot) {
        const height = home.offsetHeight;
        if (height) home.style.minHeight = height + 'px';
        home.classList.add('model-away');
        slot.append(viewer);
      }
      const launch = atlas.querySelector('[data-open-interior]');
      if (launch && !launch.hidden && !launch.disabled && !atlas.dataset.requestedInterior) {
        atlas.dataset.requestedInterior = 'true';
        launch.click();
      }
    } else restore();
  }

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => {frame = 0; sync();});
  }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  const navSize = new ResizeObserver(schedule);
  navSize.observe(document.querySelector('.study-jumps'));

  function reveal(panel) {
    toggles.get(panel)?.(true);
  }
  function speciesChanged() {
    loadObserver?.disconnect();
    restore();
    for (const [panel, set] of toggles) {
      if (!panel.isConnected) toggles.delete(panel);
      else set(true);
    }
    for (const [panel, label] of [
      [home,'Specimen model'], [document.querySelector('.science-panel'),'Specimen notes'],
      [document.querySelector('.behavior-panel'),'Behavior'], [document.querySelector('.reference-panel'),'Scientific record'],
      [document.querySelector('.study-strip'),'Reconstruction'],
      [document.querySelector('#sense-lab[data-sensory-status="maintenance"]'),'Sense & Sensibility']
    ]) if (panel && !toggles.has(panel)) disclosure(panel, label);
    const lab = document.querySelector('#anatomy-lab');
    atlas = lab?.parentElement;
    if (atlas && !toggles.has(atlas)) {
      atlas.classList.add('atlas-pair');
      slot = document.createElement('div');
      slot.className = 'atlas-model';
      atlas.prepend(slot);
      disclosure(atlas, 'Anatomy');
      const launch = lab.querySelector('[data-open-interior]');
      if (launch) {
        loadObserver = new MutationObserver(schedule);
        loadObserver.observe(launch, {attributes:true, attributeFilter:['disabled']});
      }
    }
    const map = document.querySelector('#biogeography-lab .explorer-disclosure');
    if (map) map.open = true;
    schedule();
  }
  return {home, reveal, restore, sync, speciesChanged};
}

