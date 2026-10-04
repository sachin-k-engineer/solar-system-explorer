/* =========================================================================
   3D Solar System Explorer — main.js
   - Three.js (r160) loaded from CDN with automatic fallback
   - All planet textures are generated procedurally at runtime (no image files)
   - Custom orbit/pan/zoom controls (no external control dependency)
   ========================================================================= */

const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'https://unpkg.com/three@0.160.0/build/three.module.js',
];

let THREE = null;
for (const url of CDN_URLS) {
  try { THREE = await import(url); break; }
  catch (e) { console.warn('Failed to load Three.js from', url, e); }
}
if (!THREE) {
  const msg = document.getElementById('loading-msg');
  if (msg) msg.innerHTML = 'Could not load the Three.js library.<br>Please check your internet connection and reload the page.';
  throw new Error('Three.js could not be loaded from any CDN.');
}

/* =========================================================================
   1. DATA — edit facts / descriptions / add planets & moons here
   ========================================================================= */

const SUN = {
  id: 'sun', name: 'Sun', type: 'Star', radius: 5, dist: 0, orbitSpeed: 0, spinSpeed: 0.02,
  tex: { kind: 'sun' }, color: '#ffb84d',
  facts: {
    'Diameter': '1,392,700 km',
    'Distance from Sun': '— (it is the Sun)',
    'Orbital Period': '—',
    'Rotation Period': '~27 days (equator)',
    'Moons': '8 planets orbit it',
  },
  description:
    'The Sun is a G-type main-sequence star containing 99.86% of the mass of our solar system. ' +
    'Its core fuses about 600 million tonnes of hydrogen into helium every second, producing the light ' +
    'and heat that make life on Earth possible.',
};

const PLANETS = [
  {
    id: 'mercury', name: 'Mercury', type: 'Rocky Planet',
    radius: 0.9, dist: 11.5, orbitSpeed: 0.32, spinSpeed: 0.25, tilt: 0.001,
    tex: { kind: 'rocky', base: '#9a938c', spots: ['#6e6a64', '#b5aea6', '#7d7871', '#5c5852'] },
    color: '#a8a29a',
    facts: {
      'Diameter': '4,879 km',
      'Distance from Sun': '57.9 million km (0.39 AU)',
      'Orbital Period': '88 days',
      'Rotation Period': '59 days',
      'Moons': '0',
    },
    description:
      'The smallest planet and closest to the Sun. Mercury has almost no atmosphere, so its surface ' +
      'is covered in craters and its temperature swings from -180°C at night to 430°C by day.',
    moons: [],
  },
  {
    id: 'venus', name: 'Venus', type: 'Rocky Planet',
    radius: 1.25, dist: 15.5, orbitSpeed: 0.24, spinSpeed: 0.12, tilt: 0.03,
    tex: { kind: 'gas', bands: ['#e8d5a8', '#dfc494', '#efdcb4', '#d6ba86', '#e6d0a0'] },
    color: '#e6cf9a',
    facts: {
      'Diameter': '12,104 km',
      'Distance from Sun': '108.2 million km (0.72 AU)',
      'Orbital Period': '225 days',
      'Rotation Period': '243 days (retrograde)',
      'Moons': '0',
    },
    description:
      'The hottest planet at ~465°C, trapped under a thick CO₂ atmosphere of sulfuric acid clouds. ' +
      'Venus spins backwards (retrograde) and a single day on Venus lasts longer than its year.',
    moons: [],
  },
  {
    id: 'earth', name: 'Earth', type: 'Rocky Planet',
    radius: 1.3, dist: 20, orbitSpeed: 0.185, spinSpeed: 0.6, tilt: 0.41,
    tex: { kind: 'earth' }, color: '#4d8fe0',
    facts: {
      'Diameter': '12,742 km',
      'Distance from Sun': '149.6 million km (1 AU)',
      'Orbital Period': '365.25 days',
      'Rotation Period': '23.9 hours',
      'Moons': '1',
    },
    description:
      'Our home — the only known world with liquid-water oceans and life. Earth’s magnetic field and ' +
      'oxygen-rich atmosphere shield the surface from harmful solar radiation.',
    moons: [
      {
        id: 'moon', name: 'Moon', radius: 0.32, dist: 2.5, speed: 1.1,
        tex: { kind: 'rocky', base: '#b3b3b3', spots: ['#7d7d7d', '#d6d6d6', '#8f8f8f'] },
        facts: {
          'Diameter': '3,474 km',
          'Distance from Earth': '384,400 km',
          'Orbital Period': '27.3 days',
          'Rotation Period': '27.3 days (tidally locked)',
        },
        description:
          'Earth’s only natural satellite. It is tidally locked, so the same face always points toward Earth. ' +
          'Its gravity drives ocean tides.',
      },
    ],
  },
  {
    id: 'mars', name: 'Mars', type: 'Rocky Planet',
    radius: 1.05, dist: 25, orbitSpeed: 0.15, spinSpeed: 0.55, tilt: 0.44,
    tex: { kind: 'rocky', base: '#c1572f', spots: ['#8a3a20', '#e08050', '#6f2f1a', '#a34a28'] },
    color: '#d4653a',
    facts: {
      'Diameter': '6,779 km',
      'Distance from Sun': '227.9 million km (1.52 AU)',
      'Orbital Period': '687 days',
      'Rotation Period': '24.6 hours',
      'Moons': '2',
    },
    description:
      'The "Red Planet", colored by iron oxide dust. Mars hosts Olympus Mons, the tallest volcano in the ' +
      'solar system, and valleys that once carried flowing water.',
    moons: [
      {
        id: 'phobos', name: 'Phobos', radius: 0.13, dist: 1.7, speed: 1.6,
        tex: { kind: 'rocky', base: '#8f7f72', spots: ['#5f544c', '#a89a8c'] },
        facts: {
          'Diameter': '22.5 km',
          'Distance from Mars': '9,376 km',
          'Orbital Period': '7.7 hours',
        },
        description: 'The larger and inner of Mars’ two moons. It orbits so fast it rises in the west and sets in the east.',
      },
      {
        id: 'deimos', name: 'Deimos', radius: 0.11, dist: 2.3, speed: 1.2,
        tex: { kind: 'rocky', base: '#9a8b7d', spots: ['#6b5f55', '#b0a294'] },
        facts: {
          'Diameter': '12.4 km',
          'Distance from Mars': '23,463 km',
          'Orbital Period': '30.3 hours',
        },
        description: 'The smaller and outer Martian moon, likely a captured asteroid covered in regolith.',
      },
    ],
  },
  {
    id: 'jupiter', name: 'Jupiter', type: 'Gas Giant',
    radius: 3.2, dist: 35, orbitSpeed: 0.095, spinSpeed: 1.2, tilt: 0.05,
    tex: {
      kind: 'gas',
      bands: ['#d8b89a', '#c9a17b', '#e6d3b3', '#b98a62', '#e0c9a6', '#c49b74', '#ead9bd', '#b08054', '#d2ac84'],
      spot: { x: 0.68, y: 0.62, rx: 60, ry: 30, color: '#c14e2e' },
    },
    color: '#d8b08a',
    facts: {
      'Diameter': '139,820 km',
      'Distance from Sun': '778.5 million km (5.20 AU)',
      'Orbital Period': '11.86 years',
      'Rotation Period': '9.9 hours',
      'Moons': '95 confirmed',
    },
    description:
      'The largest planet — more massive than all other planets combined. Its Great Red Spot is a storm ' +
      'larger than Earth that has raged for centuries.',
    moons: [
      {
        id: 'io', name: 'Io', radius: 0.28, dist: 3.6, speed: 1.5,
        tex: { kind: 'rocky', base: '#e0c84f', spots: ['#b09a30', '#f0e080', '#8f7a20'] },
        facts: { 'Diameter': '3,643 km', 'Distance from Jupiter': '421,700 km', 'Orbital Period': '1.77 days' },
        description: 'The most volcanically active body in the solar system, with hundreds of erupting volcanoes.',
      },
      {
        id: 'europa', name: 'Europa', radius: 0.26, dist: 4.2, speed: 1.25,
        tex: { kind: 'rocky', base: '#d8cfc0', spots: ['#b06a4a', '#efe8dc', '#8f5a40'] },
        facts: { 'Diameter': '3,122 km', 'Distance from Jupiter': '671,000 km', 'Orbital Period': '3.55 days' },
        description: 'An icy moon with a global subsurface ocean — one of the top candidates in the search for extraterrestrial life.',
      },
      {
        id: 'ganymede', name: 'Ganymede', radius: 0.36, dist: 4.95, speed: 1.0,
        tex: { kind: 'rocky', base: '#a8a29a', spots: ['#7d7871', '#c4beb6', '#5c5852'] },
        facts: { 'Diameter': '5,268 km', 'Distance from Jupiter': '1.07 million km', 'Orbital Period': '7.15 days' },
        description: 'The largest moon in the solar system — bigger than the planet Mercury — with its own magnetic field.',
      },
      {
        id: 'callisto', name: 'Callisto', radius: 0.33, dist: 5.7, speed: 0.85,
        tex: { kind: 'rocky', base: '#6f6a64', spots: ['#4a4640', '#98938c', '#b5aea6'] },
        facts: { 'Diameter': '4,821 km', 'Distance from Jupiter': '1.88 million km', 'Orbital Period': '16.7 days' },
        description: 'A dark, heavily cratered moon — the most cratered surface known in the solar system.',
      },
    ],
  },
  {
    id: 'saturn', name: 'Saturn', type: 'Gas Giant',
    radius: 2.7, dist: 46, orbitSpeed: 0.075, spinSpeed: 1.1, tilt: 0.47,
    tex: {
      kind: 'gas',
      bands: ['#e3d3ac', '#d3bd8e', '#e9dcc0', '#c9b283', '#ded0a8', '#d6c493'],
    },
    ring: true,
    color: '#e0d0a0',
    facts: {
      'Diameter': '116,460 km',
      'Distance from Sun': '1.43 billion km (9.58 AU)',
      'Orbital Period': '29.4 years',
      'Rotation Period': '10.7 hours',
      'Moons': '146 confirmed',
    },
    description:
      'Famous for its spectacular ring system of ice and rock particles. Saturn is the least dense planet — ' +
      'it would float in water.',
    moons: [
      {
        id: 'enceladus', name: 'Enceladus', radius: 0.18, dist: 3.6, speed: 1.5,
        tex: { kind: 'rocky', base: '#f2f6fa', spots: ['#cfdce8', '#ffffff', '#9fb8cc'] },
        facts: { 'Diameter': '504 km', 'Distance from Saturn': '238,000 km', 'Orbital Period': '1.37 days' },
        description: 'A bright icy moon that sprays geysers of water from a hidden ocean into space.',
      },
      {
        id: 'titan', name: 'Titan', radius: 0.34, dist: 4.8, speed: 1.05,
        tex: { kind: 'rocky', base: '#d8a04a', spots: ['#b07f30', '#e8c070', '#8f6524'] },
        facts: { 'Diameter': '5,150 km', 'Distance from Saturn': '1.22 million km', 'Orbital Period': '15.9 days' },
        description: 'The only moon with a thick atmosphere and liquid lakes — of methane and ethane instead of water.',
      },
    ],
  },
  {
    id: 'uranus', name: 'Uranus', type: 'Ice Giant',
    radius: 1.8, dist: 57, orbitSpeed: 0.055, spinSpeed: 0.9, tilt: 1.71,
    tex: { kind: 'gas', bands: ['#9fd8d4', '#8fcfcb', '#b0e2de', '#93d2ce', '#a6ddd9'] },
    color: '#9fd8d4',
    facts: {
      'Diameter': '50,724 km',
      'Distance from Sun': '2.87 billion km (19.2 AU)',
      'Orbital Period': '84 years',
      'Rotation Period': '17.2 hours (retrograde)',
      'Moons': '28',
    },
    description:
      'An ice giant tilted 98°, so it essentially rolls around the Sun on its side. Methane in its ' +
      'atmosphere gives it a pale cyan color.',
    moons: [
      {
        id: 'titania', name: 'Titania', radius: 0.23, dist: 3.1, speed: 1.2,
        tex: { kind: 'rocky', base: '#a8a8b0', spots: ['#787880', '#c8c8d0', '#5c5c64'] },
        facts: { 'Diameter': '1,578 km', 'Distance from Uranus': '435,900 km', 'Orbital Period': '8.7 days' },
        description: 'The largest moon of Uranus, with a surface carved by canyons and fault valleys.',
      },
    ],
  },
  {
    id: 'neptune', name: 'Neptune', type: 'Ice Giant',
    radius: 1.7, dist: 66, orbitSpeed: 0.042, spinSpeed: 0.85, tilt: 0.49,
    tex: {
      kind: 'gas',
      bands: ['#3f66d4', '#2f4fb0', '#4f78e8', '#28409a', '#4468dc'],
      spot: { x: 0.6, y: 0.42, rx: 42, ry: 22, color: '#1e2f70' },
    },
    color: '#3f66d4',
    facts: {
      'Diameter': '49,244 km',
      'Distance from Sun': '4.50 billion km (30.1 AU)',
      'Orbital Period': '164.8 years',
      'Rotation Period': '16.1 hours',
      'Moons': '16',
    },
    description:
      'The most distant planet, a deep-blue ice giant with the strongest winds in the solar system — ' +
      'over 2,000 km/h. It was the first planet found by mathematical prediction.',
    moons: [
      {
        id: 'triton', name: 'Triton', radius: 0.26, dist: 3.0, speed: 1.3,
        tex: { kind: 'rocky', base: '#d8d8e4', spots: ['#a8a8bc', '#f0f0f8', '#787890'] },
        facts: { 'Diameter': '2,707 km', 'Distance from Neptune': '354,800 km', 'Orbital Period': '5.9 days (retrograde)' },
        description: 'Neptune’s largest moon orbits backwards (retrograde) — strong evidence it is a captured Kuiper Belt object.',
      },
    ],
  },
];

/* =========================================================================
   2. PROCEDURAL TEXTURES (canvas-based — zero external image files)
   ========================================================================= */

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function addNoise(ctx, w, h, amount) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function rockyTexture(tex) {
  const w = 512, h = 256;
  const [c, x] = makeCanvas(w, h);
  x.fillStyle = tex.base;
  x.fillRect(0, 0, w, h);
  // large blotches / craters
  for (let i = 0; i < 240; i++) {
    x.globalAlpha = 0.05 + Math.random() * 0.12;
    x.fillStyle = tex.spots[Math.floor(Math.random() * tex.spots.length)];
    const r = 4 + Math.random() * 34;
    x.beginPath();
    x.ellipse(Math.random() * w, Math.random() * h, r, r * (0.4 + Math.random() * 0.6),
      Math.random() * Math.PI, 0, Math.PI * 2);
    x.fill();
  }
  // small craters
  for (let i = 0; i < 160; i++) {
    x.globalAlpha = 0.10 + Math.random() * 0.15;
    x.strokeStyle = tex.spots[Math.floor(Math.random() * tex.spots.length)];
    x.lineWidth = 1;
    const r = 1 + Math.random() * 5;
    x.beginPath();
    x.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
    x.stroke();
  }
  x.globalAlpha = 1;
  addNoise(x, w, h, 22);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function gasTexture(tex) {
  const w = 1024, h = 512;
  const [c, x] = makeCanvas(w, h);
  const bands = tex.bands;
  const bandH = h / bands.length;
  for (let i = 0; i < bands.length; i++) {
    x.fillStyle = bands[i];
    x.fillRect(0, i * bandH - 1, w, bandH + 2);
  }
  // wavy turbulent streaks
  for (let i = 0; i < 420; i++) {
    x.globalAlpha = 0.04 + Math.random() * 0.09;
    x.fillStyle = bands[Math.floor(Math.random() * bands.length)];
    const y = Math.random() * h;
    const bh = 1 + Math.random() * 7;
    const off = Math.sin(y * 0.045) * 14;
    x.fillRect(-20 + off, y, w + 40, bh);
  }
  // storm spot (Great Red Spot style)
  if (tex.spot) {
    x.globalAlpha = 0.9;
    x.fillStyle = tex.spot.color;
    x.beginPath();
    x.ellipse(w * tex.spot.x, h * tex.spot.y, tex.spot.rx, tex.spot.ry, 0, 0, Math.PI * 2);
    x.fill();
    x.globalAlpha = 0.35;
    x.strokeStyle = '#ffffff';
    x.lineWidth = 4;
    x.beginPath();
    x.ellipse(w * tex.spot.x, h * tex.spot.y, tex.spot.rx + 6, tex.spot.ry + 4, 0, 0, Math.PI * 2);
    x.stroke();
  }
  x.globalAlpha = 1;
  addNoise(x, w, h, 10);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function earthTexture() {
  const w = 1024, h = 512;
  const [c, x] = makeCanvas(w, h);
  // oceans
  x.fillStyle = '#1c5fbf';
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    x.globalAlpha = 0.12 + Math.random() * 0.15;
    x.fillStyle = Math.random() < 0.5 ? '#174ea8' : '#2a74d8';
    const r = 10 + Math.random() * 60;
    x.beginPath();
    x.ellipse(Math.random() * w, Math.random() * h, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
    x.fill();
  }
  // continents: random-walk blobs
  const greens = ['#3f8f4f', '#5aa85a', '#8a9a4a', '#7a6f3f', '#4a7a44'];
  for (let i = 0; i < 11; i++) {
    let px = Math.random() * w;
    let py = h * 0.15 + Math.random() * h * 0.7;
    const steps = 60 + Math.floor(Math.random() * 120);
    for (let s = 0; s < steps; s++) {
      const r = 6 + Math.random() * 22;
      x.globalAlpha = 0.9;
      x.fillStyle = greens[Math.floor(Math.random() * greens.length)];
      x.beginPath();
      x.arc(px, py, r, 0, Math.PI * 2);
      x.fill();
      px += (Math.random() - 0.5) * 28;
      py += (Math.random() - 0.5) * 16;
      py = Math.max(h * 0.08, Math.min(h * 0.92, py));
      if (px < 0) px += w;
      if (px > w) px -= w;
    }
  }
  // polar caps
  x.globalAlpha = 0.95;
  x.fillStyle = '#eef6ff';
  x.beginPath(); x.ellipse(w / 2, -6, w / 2, 30 + Math.random() * 12, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.ellipse(w / 2, h + 6, w / 2, 38 + Math.random() * 12, 0, 0, Math.PI * 2); x.fill();
  // clouds
  for (let i = 0; i < 70; i++) {
    x.globalAlpha = 0.10 + Math.random() * 0.14;
    x.fillStyle = '#ffffff';
    const cx = Math.random() * w, cy = Math.random() * h;
    x.beginPath();
    x.ellipse(cx, cy, 18 + Math.random() * 46, 4 + Math.random() * 9, Math.random() * 0.6, 0, Math.PI * 2);
    x.fill();
  }
  x.globalAlpha = 1;
  addNoise(x, w, h, 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function sunTexture() {
  const w = 512, h = 256;
  const [c, x] = makeCanvas(w, h);
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ffcf5e');
  g.addColorStop(0.5, '#ff9a1f');
  g.addColorStop(1, '#ff7a10');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {
    x.globalAlpha = 0.06 + Math.random() * 0.14;
    x.fillStyle = Math.random() < 0.5 ? '#ffe89a' : '#e86a00';
    const r = 4 + Math.random() * 30;
    x.beginPath();
    x.ellipse(Math.random() * w, Math.random() * h, r, r * 0.5, 0, 0, Math.PI * 2);
    x.fill();
  }
  x.globalAlpha = 1;
  addNoise(x, w, h, 26);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeTexture(texDef) {
  switch (texDef.kind) {
    case 'sun': return sunTexture();
    case 'earth': return earthTexture();
    case 'gas': return gasTexture(texDef);
    case 'rocky':
    default: return rockyTexture(texDef);
  }
}

function glowTexture() {
  const s = 256;
  const [c, x] = makeCanvas(s, s);
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,220,140,0.9)');
  g.addColorStop(0.25, 'rgba(255,170,60,0.45)');
  g.addColorStop(0.6, 'rgba(255,120,20,0.12)');
  g.addColorStop(1, 'rgba(255,120,20,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}

function ringTexture() {
  const s = 512;
  const [c, x] = makeCanvas(s, s);
  const cx = s / 2;
  const rIn = s * 0.315, rOut = s / 2 - 1;
  const palette = ['#cbb98a', '#e8dcb8', '#a89878', '#d8caa0', '#bfae84'];
  for (let r = rIn; r <= rOut; r += 1.4) {
    const t = (r - rIn) / (rOut - rIn);
    let a = 0.5 + 0.3 * Math.sin(t * 42) + (Math.random() * 0.12);
    if (r > s * 0.435 && r < s * 0.472) a = 0; // Cassini division
    x.globalAlpha = Math.max(0, Math.min(0.95, a));
    x.strokeStyle = palette[Math.floor(t * palette.length) % palette.length];
    x.lineWidth = 1.6;
    x.beginPath();
    x.arc(cx, cx, r, 0, Math.PI * 2);
    x.stroke();
  }
  x.globalAlpha = 1;
  const t2 = new THREE.CanvasTexture(c);
  t2.colorSpace = THREE.SRGBColorSpace;
  return t2;
}

/* =========================================================================
   3. SCENE SETUP
   ========================================================================= */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 4000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.prepend(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const sunLight = new THREE.PointLight(0xfff2dd, 2.2, 0, 0);
scene.add(sunLight);

// Stars background
(function createStars() {
  const N = 2600;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 900 + Math.random() * 800;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(p) * Math.cos(t);
    pos[i * 3 + 1] = r * Math.cos(p);
    pos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    color: 0xffffff, size: 1.6, sizeAttenuation: false,
    transparent: true, opacity: 0.85,
  });
  scene.add(new THREE.Points(g, m));
})();

/* ---------- Registry of selectable bodies ---------- */
const bodies = [];       // { id, kind, data, mesh, parentName }
const orbitLines = [];
const labelItems = [];   // { el, obj, isMoon }

function registerBody(id, kind, data, mesh, parentName) {
  const ref = { id, kind, data, mesh, parentName: parentName || null };
  mesh.userData.ref = ref;
  bodies.push(ref);
  return ref;
}

function makeLabelEl(name) {
  const el = document.createElement('div');
  el.className = 'label';
  el.textContent = name;
  document.getElementById('labels').appendChild(el);
  return el;
}

/* ---------- Sun ---------- */
const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(SUN.radius, 48, 32),
  new THREE.MeshBasicMaterial({ map: makeTexture(SUN.tex) })
);
scene.add(sunMesh);
const sunRef = registerBody(SUN.id, 'sun', SUN, sunMesh);

const glow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTexture(), blending: THREE.AdditiveBlending,
  depthWrite: false, transparent: true,
}));
glow.scale.set(SUN.radius * 5.2, SUN.radius * 5.2, 1);
scene.add(glow);

labelItems.push({ el: makeLabelEl(SUN.name), obj: sunMesh, isMoon: false });

/* ---------- Planets + moons + orbits ---------- */
const planets = [];

function makeOrbitLine(dist) {
  const seg = 180;
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * dist, 0, Math.sin(a) * dist));
  }
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x4a5f8f, transparent: true, opacity: 0.45 })
  );
  scene.add(line);
  orbitLines.push(line);
  return line;
}

for (const p of PLANETS) {
  const group = new THREE.Group();
  scene.add(group);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.radius, 48, 32),
    new THREE.MeshLambertMaterial({ map: makeTexture(p.tex) })
  );
  mesh.rotation.z = p.tilt || 0;
  group.add(mesh);
  registerBody(p.id, 'planet', p, mesh);

  if (p.ring) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(p.radius * 1.25, p.radius * 1.95, 128),
      new THREE.MeshBasicMaterial({ map: ringTexture(), transparent: true, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.y = 0.12;
    mesh.add(ring); // inherits Saturn's axial tilt
  }

  const moons = [];
  for (const m of p.moons) {
    const pivot = new THREE.Group();
    group.add(pivot);
    const mmesh = new THREE.Mesh(
      new THREE.SphereGeometry(m.radius, 32, 24),
      new THREE.MeshLambertMaterial({ map: makeTexture(m.tex) })
    );
    pivot.add(mmesh);
    registerBody(m.id, 'moon', m, mmesh, p.name);
    moons.push({ data: m, pivot, mesh: mmesh, angle: Math.random() * Math.PI * 2 });
    labelItems.push({ el: makeLabelEl(m.name), obj: mmesh, isMoon: true });
  }

  makeOrbitLine(p.dist);
  labelItems.push({ el: makeLabelEl(p.name), obj: mesh, isMoon: false });
  planets.push({ data: p, group, mesh, moons, angle: Math.random() * Math.PI * 2 });
}

/* =========================================================================
   4. CUSTOM ORBIT CONTROLS (drag rotate / wheel zoom / right-drag or shift pan)
   ========================================================================= */

class SimpleOrbitControls {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.target = new THREE.Vector3();
    this.desiredTarget = new THREE.Vector3();
    this.radius = 95; this.desiredRadius = 95;
    this.theta = -0.9; this.desiredTheta = -0.9;
    this.phi = 1.12; this.desiredPhi = 1.12;
    this.minRadius = 6; this.maxRadius = 420;
    this.minPhi = 0.06; this.maxPhi = Math.PI - 0.06;
    this.onTap = null; // (x, y) => {}
    this._ptrs = new Map();
    this._pinch = 0;
    this._mid = null;
    this._down = null;
    dom.style.touchAction = 'none';
    dom.addEventListener('pointerdown', (e) => this._downHandler(e));
    window.addEventListener('pointermove', (e) => this._moveHandler(e));
    window.addEventListener('pointerup', (e) => this._upHandler(e));
    window.addEventListener('pointercancel', (e) => this._upHandler(e));
    dom.addEventListener('wheel', (e) => this._wheelHandler(e), { passive: false });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _downHandler(e) {
    try { this.dom.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    this._ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, button: e.button });
    if (this._ptrs.size === 2) {
      const [a, b] = [...this._ptrs.values()];
      this._pinch = Math.hypot(a.x - b.x, a.y - b.y);
      this._mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
    this._down = { x: e.clientX, y: e.clientY, t: performance.now(), button: e.button };
  }

  _moveHandler(e) {
    if (!this._ptrs.has(e.pointerId)) return;
    const p = this._ptrs.get(e.pointerId);
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;

    if (this._ptrs.size === 2) {
      const [a, b] = [...this._ptrs.values()];
      const pinch = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (this._pinch > 0) {
        this.desiredRadius = clamp(this.desiredRadius * (this._pinch / pinch), this.minRadius, this.maxRadius);
      }
      if (this._mid) this._pan(mid.x - this._mid.x, mid.y - this._mid.y);
      this._pinch = pinch;
      this._mid = mid;
      return;
    }

    if (e.shiftKey || p.button === 2 || p.button === 1) {
      this._pan(dx, dy);
    } else {
      this.desiredTheta -= dx * 0.0052;
      this.desiredPhi = clamp(this.desiredPhi - dy * 0.0052, this.minPhi, this.maxPhi);
    }
  }

  _upHandler(e) {
    if (this._ptrs.has(e.pointerId)) {
      const p = this._ptrs.get(e.pointerId);
      if (this._down && p.button === 0 && this._ptrs.size === 1) {
        const moved = Math.hypot(e.clientX - this._down.x, e.clientY - this._down.y);
        const dt = performance.now() - this._down.t;
        if (moved < 6 && dt < 450 && this.onTap) this.onTap(e.clientX, e.clientY);
      }
      this._ptrs.delete(e.pointerId);
    }
    if (this._ptrs.size < 2) { this._pinch = 0; this._mid = null; }
    if (this._ptrs.size === 0) this._down = null;
  }

  _wheelHandler(e) {
    e.preventDefault();
    const factor = Math.exp(e.deltaY * 0.0011);
    this.desiredRadius = clamp(this.desiredRadius * factor, this.minRadius, this.maxRadius);
  }

  _pan(dx, dy) {
    const scale = this.radius * 0.0011;
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    const right = new THREE.Vector3().crossVectors(fwd, this.camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    this.desiredTarget.addScaledVector(right, -dx * scale).addScaledVector(up, dy * scale);
  }

  update(dt) {
    const k = 1 - Math.pow(0.0001, dt); // smooth damping
    this.radius += (this.desiredRadius - this.radius) * k;
    this.theta += (this.desiredTheta - this.theta) * k;
    this.phi += (this.desiredPhi - this.phi) * k;
    this.target.lerp(this.desiredTarget, k);
    const sp = Math.sin(this.phi), cp = Math.cos(this.phi);
    this.camera.position.set(
      this.target.x + this.radius * sp * Math.sin(this.theta),
      this.target.y + this.radius * cp,
      this.target.z + this.radius * sp * Math.cos(this.theta)
    );
    this.camera.lookAt(this.target);
  }
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

const controls = new SimpleOrbitControls(camera, renderer.domElement);

/* =========================================================================
   5. SELECTION, RAYCASTING, INFO PANEL, LABELS
   ========================================================================= */

const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2(-10, -10);
const tmpV = new THREE.Vector3();
let focusedRef = null;
let selectedRef = null;
let hoveredRef = null;
let speed = 1;
let paused = false;
let labelsOn = true;

const selectableMeshes = bodies.map((b) => b.mesh);
const tooltip = document.getElementById('tooltip');

function select(ref) {
  // clear previous highlight
  if (selectedRef && selectedRef.mesh.material.emissive) {
    selectedRef.mesh.material.emissive.setHex(0x000000);
  }
  selectedRef = ref;
  focusedRef = ref;
  if (ref && ref.mesh.material.emissive) {
    ref.mesh.material.emissive.setHex(0x2a3f5f);
  }
  document.querySelectorAll('.body-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.id === (ref ? ref.id : '')));
  if (ref) showInfo(ref);
}

function showInfo(ref) {
  const d = ref.data;
  document.getElementById('info-name').textContent = d.name;
  const rows = Object.entries(d.facts)
    .map(([k, v]) => '<dt>' + k + '</dt><dd>' + v + '</dd>')
    .join('');
  let html = '<span class="tag">' + d.type + '</span><dl>' + rows + '</dl>';
  if (ref.kind === 'moon') {
    html = '<span class="tag">Moon of ' + ref.parentName + '</span><dl>' + rows + '</dl>';
  }
  if (d.description) html += '<p class="desc">' + d.description + '</p>';
  if (d.moons && d.moons.length) {
    html += '<div class="moon-chips">' + d.moons
      .map((m) => '<button data-moon="' + m.id + '">&#9790; ' + m.name + '</button>')
      .join('') + '</div>';
  }
  document.getElementById('info-content').innerHTML = html;
}

// moon chip clicks (delegated)
document.getElementById('info-content').addEventListener('click', (e) => {
  const id = e.target.dataset && e.target.dataset.moon;
  if (!id) return;
  const ref = bodies.find((b) => b.id === id);
  if (ref) select(ref);
});

function pickAt(clientX, clientY) {
  mouseNDC.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(mouseNDC, camera);
  const hits = raycaster.intersectObjects(selectableMeshes, false);
  return hits.length ? hits[0].object.userData.ref : null;
}

controls.onTap = (x, y) => {
  const ref = pickAt(x, y);
  if (ref) select(ref);
};

window.addEventListener('pointermove', (e) => {
  mouseNDC.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  tooltip.style.left = e.clientX + 'px';
  tooltip.style.top = e.clientY + 'px';
});

function updateHover() {
  raycaster.setFromCamera(mouseNDC, camera);
  const hits = raycaster.intersectObjects(selectableMeshes, false);
  hoveredRef = hits.length ? hits[0].object.userData.ref : null;
  if (hoveredRef) {
    tooltip.style.display = 'block';
    tooltip.textContent = hoveredRef.data.name;
    document.body.style.cursor = 'pointer';
  } else {
    tooltip.style.display = 'none';
    document.body.style.cursor = 'default';
  }
}

function updateLabels() {
  for (const L of labelItems) {
    let visible = labelsOn;
    if (L.isMoon && controls.radius > 50) visible = false;
    if (!visible) { L.el.style.display = 'none'; continue; }
    L.obj.getWorldPosition(tmpV);
    tmpV.project(camera);
    if (tmpV.z > 1) { L.el.style.display = 'none'; continue; }
    const x = (tmpV.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-tmpV.y * 0.5 + 0.5) * window.innerHeight;
    L.el.style.display = 'block';
    L.el.style.transform = 'translate(-50%,-130%) translate(' + x + 'px,' + y + 'px)';
  }
}

/* =========================================================================
   6. SIDEBAR LIST + SEARCH
   ========================================================================= */

(function buildList() {
  const list = document.getElementById('body-list');

  function btn(ref, isMoon) {
    const b = document.createElement('button');
    b.className = 'body-btn' + (isMoon ? ' moon-btn' : '');
    b.dataset.id = ref.id;
    b.dataset.name = ref.data.name.toLowerCase();
    const color = ref.data.color || '#888888';
    b.innerHTML = '<span class="dot" style="background:' + color + '"></span>' +
      ref.data.name + '<small>' + (isMoon ? 'Moon' : ref.data.type) + '</small>';
    b.addEventListener('click', () => select(ref));
    return b;
  }

  const secStar = document.createElement('div');
  secStar.className = 'list-section'; secStar.textContent = 'Star';
  list.appendChild(secStar);
  list.appendChild(btn(sunRef, false));

  const secPlan = document.createElement('div');
  secPlan.className = 'list-section'; secPlan.textContent = 'Planets';
  list.appendChild(secPlan);

  for (const p of planets) {
    const ref = bodies.find((b) => b.id === p.data.id);
    list.appendChild(btn(ref, false));
    for (const m of p.moons) {
      const mref = bodies.find((b) => b.id === m.data.id);
      list.appendChild(btn(mref, true));
    }
  }

  document.getElementById('search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    list.querySelectorAll('.body-btn').forEach((b) => {
      b.style.display = b.dataset.name.includes(q) ? '' : 'none';
    });
    list.querySelectorAll('.list-section').forEach((s) => {
      s.style.display = q ? 'none' : '';
    });
  });
})();

/* =========================================================================
   7. CONTROL BAR + KEYBOARD + RESET
   ========================================================================= */

function resetView() {
  focusedRef = null;
  controls.desiredTarget.set(0, 0, 0);
  controls.desiredRadius = 95;
  controls.desiredTheta = -0.9;
  controls.desiredPhi = 1.12;
  if (selectedRef && selectedRef.mesh.material.emissive) {
    selectedRef.mesh.material.emissive.setHex(0x000000);
  }
  selectedRef = null;
  document.querySelectorAll('.body-btn').forEach((b) => b.classList.remove('active'));
  document.getElementById('info-name').textContent = 'Welcome!';
  document.getElementById('info-content').innerHTML =
    '<p>Click the Sun, a planet, or a moon to see its details and fly the camera to it.</p>' +
    '<p style="margin-top:8px">Drag to orbit &middot; scroll to zoom &middot; right-drag to pan.</p>';
}

function togglePause() {
  paused = !paused;
  document.getElementById('btn-pause').innerHTML = paused ? '&#9654; Play' : '&#10074;&#10074; Pause';
}

document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-reset').addEventListener('click', resetView);

document.getElementById('speed').addEventListener('input', (e) => {
  speed = parseFloat(e.target.value);
  document.getElementById('speed-val').textContent = speed.toFixed(1) + '×';
});

document.getElementById('btn-orbits').addEventListener('click', (e) => {
  const on = e.target.classList.toggle('active');
  orbitLines.forEach((l) => { l.visible = on; });
});

document.getElementById('btn-labels').addEventListener('click', (e) => {
  labelsOn = e.target.classList.toggle('active');
});

let wireOn = false;
document.getElementById('btn-wire').addEventListener('click', (e) => {
  wireOn = e.target.classList.toggle('active');
  scene.traverse((o) => {
    if (o.isMesh && o.material && 'wireframe' in o.material) o.material.wireframe = wireOn;
  });
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
    e.preventDefault();
    togglePause();
  }
  if (e.code === 'Escape') resetView();
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* =========================================================================
   8. ANIMATION LOOP
   ========================================================================= */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (!paused) {
    const s = speed * dt;
    sunMesh.rotation.y += SUN.spinSpeed * s;
    for (const p of planets) {
      p.angle += p.data.orbitSpeed * s;
      p.group.position.set(
        Math.cos(p.angle) * p.data.dist, 0, Math.sin(p.angle) * p.data.dist
      );
      p.mesh.rotation.y += p.data.spinSpeed * s;
      for (const m of p.moons) {
        m.angle += m.data.speed * s;
        m.pivot.position.set(
          Math.cos(m.angle) * m.data.dist, 0, Math.sin(m.angle) * m.data.dist
        );
        m.mesh.rotation.y += 0.5 * s;
      }
    }
  }

  // camera follows the selected body
  if (focusedRef) {
    focusedRef.mesh.getWorldPosition(tmpV);
    controls.desiredTarget.copy(tmpV);
  }

  controls.update(dt);
  updateHover();
  updateLabels();
  renderer.render(scene, camera);
}

// Remove loading overlay once everything is built
const loadingEl = document.getElementById('loading');
if (loadingEl) loadingEl.remove();

animate();