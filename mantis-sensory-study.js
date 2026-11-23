const archiveEyes = {
  'squilla-empusa': {name:'Atlantic mantis shrimp', finding:'Adult main-rhabdom pigment peaked at 507 nm in the original absorbance study. The later opsin paper cites 517 nm. The spectral workbench uses the original measurement. Several opsin transcripts alone cannot establish colour discrimination.', source:'https://doi.org/10.1007/BF00619117'},
  'oratosquilla-oratoria': {name:'Japanese mantis shrimp', finding:'Researchers described a two-row midband and compared gene and protein expression after natural-light, dark, linear, left-circular and right-circular treatments. This experiment leaves behavioural discrimination of handedness open.', source:'https://pubmed.ncbi.nlm.nih.gov/38161015/'},
  'odontodactylus-scyllarus': {name:'Peacock mantis shrimp', finding:'In feeding-cube tests, animals learned to pick some colours among greys of different brightness. A separate experiment tested which way light rotates. Retinal recordings also identified cells sensitive to linearly polarized ultraviolet light.', source:'https://doi.org/10.1016/j.cub.2008.02.066'}
};

const comparisons = {
  colour: {
    name: 'Colour discrimination · Haptosquilla trispinosa',
    finding: 'Four rows in the eye’s central band contain twelve spectral sensitivity classes. In a two-choice task, trained animals needed wavelength separations of roughly 12–25 nm across the tested conditions. Later colour-versus-grey trials provided evidence for comparisons between receptor signals.',
    source: 'https://doi.org/10.1126/science.1245824',
    additional: 'https://pubmed.ncbi.nlm.nih.gov/39670570/',
    control: 'Separation from a 570 nm training light', max: 50, initial: 20, unit: 'nm',
    caption: 'Compare two selected wavelengths. The bars share a 500–600 nm scale. The published range spans several training conditions.'
  },
  uv: {
    name: 'Ultraviolet · Neogonodactylus oerstedii',
    finding: 'Six ultraviolet receptor types have been reported in this species. Optical filters help produce their different sensitivities from two visual pigments. Two surfaces that look alike to a diver can reflect different amounts of UV.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/24998530/',
    control: 'UV illumination reaching the targets', max: 100, initial: 100, unit: '%',
    caption: 'Two hypothetical surfaces match in visible light and reflect 20% and 80% of a UV band. The bars show reflected UV relative to full illumination. The phone displays the calculated signal.'
  },
  circular: {
    name: 'Circular polarization · Odontodactylus scyllarus',
    finding: 'The peacock mantis shrimp distinguished opposite handedness of circularly polarized light when choosing between feeding tubes in a reward experiment. Handedness describes the direction in which the electric field rotates as the light travels.',
    source: 'https://doi.org/10.1016/j.cub.2008.02.066',
    control: 'Circularly polarized fraction of the light', max: 100, initial: 100, unit: '%',
    caption: 'Two targets have the same spectrum and total intensity. Their polarized fractions have opposite handedness. An ideal left-circular analyzer passes the left component and half the unpolarized light.'
  }
};

export function compareSignals(mode, setting) {
  const value = Number(setting);
  if (!Object.hasOwn(comparisons, mode) || !Number.isFinite(value) || value < 0 || value > comparisons[mode].max) {
    throw new RangeError('Choose a setting within the comparison range.');
  }
  if (mode === 'colour') {
    return {labels: ['Training light', 'Comparison light'], values: [570, 570 - value], min: 500, max: 600, unit: 'nm'};
  }
  if (mode === 'uv') {
    return {labels: ['Surface A', 'Surface B'], values: [0.2 * value, 0.8 * value], min: 0, max: 100, unit: '%'};
  }
  return {labels: ['Left-handed target', 'Right-handed target'], values: [50 + value / 2, 50 - value / 2], min: 0, max: 100, unit: '%'};
}

export function mountMantisComparison(section, id) {
  const eye = archiveEyes[id];
  if (!eye) return;
  const panel = document.createElement('article');
  panel.className = 'sense-species-view mantis-comparison';
  const host = section.querySelector('#sense-vision');
  if (id !== 'odontodactylus-scyllarus') {
    panel.innerHTML = `<h3>${eye.name} eye evidence</h3><p>${eye.finding} <a href="${eye.source}">Original study</a></p>`;
    if (id === 'oratosquilla-oratoria') panel.insertAdjacentHTML('beforeend','<p><a href="https://www.ncbi.nlm.nih.gov/bioproject/1001057">Explore the deposited expression dataset</a></p>');
    panel.insertAdjacentHTML('beforeend','<p><a href="#odontodactylus-scyllarus">Open the peacock specimen for its feeding-tube choice experiment →</a></p>');
    host.prepend(panel);
    return;
  }
  panel.innerHTML = `<h3>Peacock mantis shrimp eye evidence</h3>
    <p>${eye.finding} <a href="${eye.source}">Feeding-tube study</a> · <a href="https://doi.org/10.1007/BF00192314">Colour-choice study</a> · <a href="https://doi.org/10.1007/s00359-009-0491-y">UV recordings</a></p>
    <details><summary>Explore the feeding-tube choice</summary>

    <p data-finding></p>
    <fieldset><legend>Try the light experiment</legend>
    <label><span data-control-name></span> · <output data-setting></output>
    <input data-stimulus type="range" min="0" step="1"></label>
    <div data-targets hidden><label>Inspect the two targets
    <select data-detector><option value="visible">Visible brightness</option><option value="instrument">Instrument signal</option></select></label>
    <div class="mantis-pair" aria-hidden="true"><span>A</span><span>B</span></div>
    <small data-target-note></small></div>
    <div data-readings></div><p data-caption></p></fieldset>
    <p data-sources></p></details>`;
  section.querySelector('#sense-vision').append(panel);
  const find = selector => panel.querySelector(selector);
  const slider = find('[data-stimulus]');
  const detector = find('[data-detector]');
  const study = comparisons.circular;
  find('[data-finding]').textContent = study.finding;
  find('[data-control-name]').textContent = study.control;
  find('[data-caption]').textContent = study.caption + ' The readings show an ideal instrument response. The experiment did not measure the animal’s choice probability at each setting.';
  find('[data-targets]').hidden = false;
  detector.options[1].textContent = 'Left-circular analyzer';
  slider.max = study.max;
  slider.value = study.initial;
  const result = compareSignals('circular', slider.value);
  find('[data-readings]').innerHTML = result.labels.map(label =>
    `<div class="mantis-reading"><span>${label}</span><meter aria-label="${label}" min="0" max="100"></meter><output></output></div>`
  ).join('');
  find('[data-sources]').innerHTML = `<a href="${study.source}">Read the feeding-tube experiment</a>`;

  function updateReadings() {
    const {values} = compareSignals('circular', slider.value);
    find('[data-setting]').value = slider.value + ' %';
    const instrument = detector.value === 'instrument';
    find('[data-target-note]').textContent = instrument
      ? 'Calculated brightness through an ideal left-circular analyzer.'
      : 'Both targets have equal visible brightness. Switch to the analyzer to reveal the cue.';
    panel.querySelectorAll('.mantis-pair span').forEach((target, i) => {
      const gray = Math.round(255 * Math.sqrt((instrument ? values[i] : 50) / 100));
      target.style.backgroundColor = `rgb(${gray}, ${gray}, ${gray})`;
    });
    panel.querySelectorAll('meter').forEach((meter, i) => {
      meter.value = values[i];
      meter.nextElementSibling.value = values[i] + ' %';
    });
  }
  slider.oninput = updateReadings;
  detector.onchange = updateReadings;
  updateReadings();
}
