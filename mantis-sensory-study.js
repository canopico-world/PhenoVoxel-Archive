const archiveEyes = {
  'squilla-empusa': {
    finding: 'In the adult Atlantic mantis shrimp, researchers measured peak absorbance near 517 nm across the sampled retina. Its several opsin transcripts do not count as separate colour channels.',
    source: 'https://doi.org/10.1093/icb/icy007'
  },
  'oratosquilla-oratoria': {
    finding: 'The Japanese mantis shrimp has two rows in the central band of its eye. Researchers studied retinal structure and molecular responses to polarized light. Those results leave its ability to tell left from right circular polarization unresolved.',
    source: 'https://www.sciencedirect.com/science/article/pii/S0141813023059524'
  }
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
  panel.innerHTML = `<h3>What can a mantis shrimp see underwater?</h3>
    <p>${eye.finding} <a href="${eye.source}">Study of this specimen’s species</a></p>
    <details><summary>Compare three reef species’ eyes</summary>
    <label>Research example <select data-mantis-case></select></label>
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
  section.querySelector('#sense-vision').prepend(panel);
  const find = selector => panel.querySelector(selector);
  const select = find('[data-mantis-case]'), slider = find('[data-stimulus]');
  for (const [key, study] of Object.entries(comparisons)) select.add(new Option(study.name, key));
  select.value = id === 'oratosquilla-oratoria' ? 'circular' : 'colour';

  function updateReadings() {
    const result = compareSignals(select.value, slider.value);
    find('[data-setting]').value = slider.value + ' ' + comparisons[select.value].unit;
    const mode = select.value;
    if (mode !== 'colour') {
      const instrument = find('[data-detector]').value === 'instrument';
      find('[data-target-note]').textContent = instrument
        ? 'Calculated signal in grayscale. The readings below give the exact values.'
        : 'Both targets have equal visible brightness. Select the instrument to reveal the chosen physical cue.';
      panel.querySelectorAll('.mantis-pair span').forEach((target, i) => {
        const signal = instrument ? result.values[i] : 50;
        const gray = Math.round(255 * Math.sqrt(signal / 100));
        target.style.backgroundColor = `rgb(${gray}, ${gray}, ${gray})`;
      });
    }
    result.values.forEach((value, i) => {
      const meter = panel.querySelectorAll('meter')[i];
      meter.value = value;
      meter.nextElementSibling.value = Number(value.toFixed(1)) + ' ' + result.unit;
    });
  }
  function changeCase() {
    const study = comparisons[select.value];
    find('[data-finding]').textContent = study.finding;
    find('[data-control-name]').textContent = study.control;
    find('[data-targets]').hidden = select.value === 'colour';
    find('[data-detector]').value = 'visible';
    find('[data-detector]').options[1].textContent = select.value === 'uv' ? 'UV detector' : 'Left-circular analyzer';
    slider.max = study.max;
    slider.value = study.initial;
    const result = compareSignals(select.value, slider.value);
    find('[data-readings]').innerHTML = result.labels.map(label =>
      `<div class="mantis-reading"><span>${label}</span><meter aria-label="${label}" min="${result.min}" max="${result.max}"></meter><output></output></div>`
    ).join('');
    find('[data-caption]').textContent = study.caption;
    find('[data-sources]').innerHTML = `<a href="${study.source}">Read the original experiment</a>` +
      (study.additional ? ` · <a href="${study.additional}">Follow-up colour experiment</a>` : '');
    updateReadings();
  }
  select.onchange = changeCase;
  slider.oninput = updateReadings;
  find('[data-detector]').onchange = updateReadings;
  changeCase();
}
