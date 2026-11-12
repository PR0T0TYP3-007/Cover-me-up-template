/* CoverMe — flat spot illustrations (brand palette, theme-aware via CSS vars).
   Simple shapes so they stay tiny; swap for the final illustration set later. */
window.CM = window.CM || {};
CM.illus = (function () {
  const skin1 = '#8D5A3B', skin2 = '#6B4226', skin3 = '#A86B45';
  const person = function (x, y, s, skin, shirt, wrap) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M-30 120 C-30 70 -22 52 0 52 C22 52 30 70 30 120 Z" fill="' + shirt + '"/>' +
      '<rect x="-7" y="38" width="14" height="18" rx="6" fill="' + skin + '"/>' +
      '<circle cx="0" cy="24" r="20" fill="' + skin + '"/>' +
      (wrap ? '<path d="M-21 18 C-20 -2 20 -6 22 14 C14 6 -10 4 -21 18Z" fill="' + wrap + '"/>' : '<path d="M-19 16 C-18 2 18 0 20 14 C12 6 -8 6 -19 16Z" fill="#1B1F1D"/>') +
      '</g>';
  };
  return {
    rights: '<svg viewBox="0 0 320 272" class="illus" aria-hidden="true">' +
      '<ellipse cx="160" cy="246" rx="130" ry="14" fill="var(--line)"/>' +
      '<circle cx="160" cy="128" r="112" fill="var(--brand-50)"/>' +
      '<path d="M160 40 L222 63 C226 64 228 68 228 72 V118 C228 164 198 196 162 210 C161 210 159 210 158 210 C122 196 92 164 92 118 V72 C92 68 94 64 98 63 Z" fill="var(--brand-700)"/>' +
      '<rect x="122" y="92" width="76" height="60" rx="8" fill="var(--paper)"/>' +
      '<path d="M160 96 V148" stroke="var(--line)" stroke-width="3"/>' +
      '<path d="M132 108h20M132 118h20M132 128h14M168 108h20M168 118h20M168 128h14" stroke="var(--brand-500)" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="222" cy="186" r="26" fill="var(--success-600)"/><path d="m210 186 8 8 15-16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
      person(74, 128, .85, skin1, '#E89B0C', '#12876B') + '</svg>',

    desk: '<svg viewBox="0 0 320 272" class="illus" aria-hidden="true">' +
      '<ellipse cx="160" cy="246" rx="130" ry="14" fill="var(--line)"/>' +
      '<circle cx="160" cy="128" r="112" fill="var(--brand-50)"/>' +
      person(212, 108, .9, skin2, '#5E6A65') +
      '<rect x="150" y="168" width="140" height="70" rx="8" fill="var(--brand-700)"/><rect x="150" y="160" width="140" height="14" rx="5" fill="var(--brand-500)"/>' +
      '<path d="M206 202h28M220 188v28" stroke="var(--paper)" stroke-width="6" stroke-linecap="round"/>' +
      person(92, 118, 1, skin3, '#0B5D4B', '#E89B0C') +
      '<rect x="112" y="150" width="34" height="56" rx="6" fill="#1B1F1D" transform="rotate(-12 129 178)"/><rect x="116" y="156" width="26" height="40" rx="3" fill="var(--paper)" transform="rotate(-12 129 178)"/>' +
      '<path d="M128 40h96a12 12 0 0 1 12 12v30a12 12 0 0 1-12 12h-58l-18 14v-14h-20a12 12 0 0 1-12-12V52a12 12 0 0 1 12-12Z" fill="var(--surface)" stroke="var(--line)" stroke-width="2"/>' +
      '<path d="M134 58h80M134 70h60" stroke="var(--brand-500)" stroke-width="4" stroke-linecap="round"/></svg>',

    letter: '<svg viewBox="0 0 320 272" class="illus" aria-hidden="true">' +
      '<ellipse cx="160" cy="246" rx="130" ry="14" fill="var(--line)"/>' +
      '<circle cx="160" cy="128" r="112" fill="var(--brand-50)"/>' +
      '<rect x="98" y="44" width="124" height="164" rx="10" fill="var(--surface)" stroke="var(--line)" stroke-width="2" transform="rotate(-6 160 126)"/>' +
      '<g transform="rotate(-6 160 126)"><rect x="98" y="44" width="124" height="10" rx="5" fill="var(--brand-700)"/>' +
      '<path d="M116 76h88M116 92h88M116 108h64M116 124h88M116 140h52" stroke="var(--line)" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="114" y="158" width="58" height="12" rx="4" fill="#FFF2C7"/></g>' +
      '<circle cx="236" cy="78" r="34" fill="var(--surface)" stroke="var(--amber-500)" stroke-width="6"/>' +
      '<path d="M236 58v20l12 8" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      '<path d="M200 196 L284 160 L262 238 L240 212 Z" fill="var(--brand-500)"/><path d="M200 196 L240 212 L246 236Z" fill="var(--brand-700)"/>' +
      '</svg>',

    family: '<svg viewBox="0 0 240 180" class="illus" aria-hidden="true">' +
      '<ellipse cx="120" cy="164" rx="100" ry="10" fill="var(--line)"/>' +
      '<circle cx="120" cy="88" r="76" fill="var(--brand-50)"/>' +
      person(78, 42, .95, skin2, '#0B5D4B') + person(162, 44, .92, skin3, '#E89B0C', '#12876B') + person(120, 84, .6, skin1, '#4B5A9B') +
      '</svg>',

    search: '<svg viewBox="0 0 240 180" class="illus" aria-hidden="true">' +
      '<ellipse cx="120" cy="164" rx="100" ry="10" fill="var(--line)"/><circle cx="120" cy="88" r="76" fill="var(--brand-50)"/>' +
      '<circle cx="110" cy="80" r="36" fill="var(--surface)" stroke="var(--brand-700)" stroke-width="10"/><path d="m138 108 30 30" stroke="var(--brand-700)" stroke-width="14" stroke-linecap="round"/></svg>'
  };
})();
