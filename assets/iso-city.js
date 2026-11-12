/* Vibe Coding 页首屏：2.5D（等角）小城
   中间一台电脑在写代码，每写一行就盖起一栋楼；接着填满街区、种树、车开起来、飞机飞过，
   最后入夜亮灯。盖完后可以拖动旋转，也可以切换白天和夜晚 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const box = document.getElementById('iso');
const canvas = document.getElementById('isoCanvas');
const hudLine = document.getElementById('isoLine');
const hudCount = document.getElementById('isoCount');
const replayBtn = document.getElementById('isoReplay');
const modeBtn = document.getElementById('isoMode');
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;
const en = () => window.Site && window.Site.lang === 'en';
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 基本设定 ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const VIEW = 16.2;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 100);
const HOME = new THREE.Vector3(14, 12.5, 14);
camera.position.copy(HOME);
const target = new THREE.Vector3(0, 1.2, 0);
camera.lookAt(target);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(target);
controls.enableZoom = false;
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = .08;
controls.rotateSpeed = .7;
const polar = Math.atan2(Math.hypot(HOME.x, HOME.z), HOME.y - target.y);
controls.minPolarAngle = polar - .2;
controls.maxPolarAngle = polar + .08;
controls.enabled = false;
controls.update();
controls.addEventListener('start', () => { controls.autoRotate = false; });
/* 手机上：上下滑动照常卷动页面，左右拖动才旋转小城 */
canvas.style.touchAction = 'pan-y';

function resize() {
  const w = box.clientWidth, h = box.clientHeight, a = w / h;
  /* 手机上窗口比较窄：把视野放大，整座小城才放得下 */
  const v = a < 1.18 ? VIEW * 1.18 / a : VIEW;
  camera.left = -v * a / 2; camera.right = v * a / 2;
  camera.top = v / 2; camera.bottom = -v / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
resize();
new ResizeObserver(resize).observe(box);

/* ---------- 灯光（白天 / 夜晚在下面的 applyMode 里调） ---------- */
const hemi = new THREE.HemisphereLight(0xdfefff, 0x8a7c66, 1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 2);
sun.position.set(9, 15, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 });
sun.shadow.bias = -.0008;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x9fc0ff, .4);
fill.position.set(-8, 6, -6);
scene.add(fill);

const std = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .85, metalness: 0 }, extra || {}));
function add(geo, mat, x, y, z, shadow) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
  scene.add(m);
  return m;
}

/* ---------- 底座、道路 ---------- */
const S = 15;
const plateMat = std(0xd8d2c6);
const plate = add(new THREE.BoxGeometry(S, .6, S), plateMat, 0, -.3, 0);
plate.castShadow = false;
const rim = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(S, .6, S)), new THREE.LineBasicMaterial({ color: 0xf2d67c, transparent: true, opacity: .3 }));
rim.position.y = -.3;
scene.add(rim);

const roadMat = std(0x50545d);
function road(w, d, x, z) { const m = add(new THREE.BoxGeometry(w, .04, d), roadMat, x, .02, z); m.castShadow = false; return m; }
const R = 2.2, H = S / 2;
road(2 * R + .8, .8, 0, R); road(2 * R + .8, .8, 0, -R);
road(.8, 2 * R + .8, R, 0); road(.8, 2 * R + .8, -R, 0);
road(.8, H - R - .4, 0, (H + R + .4) / 2); road(.8, H - R - .4, 0, -(H + R + .4) / 2);
road(H - R - .4, .8, (H + R + .4) / 2, 0); road(H - R - .4, .8, -(H + R + .4) / 2, 0);
const dashMat = std(0xf2d67c, { emissive: 0xf2d67c, emissiveIntensity: .2 });
for (let k = -H + .5; k <= H - .5; k += .9) {
  if (Math.abs(k) < R + .5) continue;
  add(new THREE.BoxGeometry(.06, .02, .32), dashMat, 0, .05, k, false);
  add(new THREE.BoxGeometry(.32, .02, .06), dashMat, k, .05, 0, false);
}
/* 中间的小广场 */
const pad = add(new THREE.BoxGeometry(3.5, .14, 3.5), std(0xefe9dd), 0, .07, 0);
pad.castShadow = false;

/* ---------- 中间的电脑：屏幕上的代码是一张会更新的画布 ---------- */
const codeCanvas = document.createElement('canvas');
codeCanvas.width = 640; codeCanvas.height = 400;
const cx = codeCanvas.getContext('2d');
const codeTex = new THREE.CanvasTexture(codeCanvas);
codeTex.colorSpace = THREE.SRGBColorSpace;
codeTex.anisotropy = 4;
const computer = new THREE.Group();
const dark = std(0x24272d, { roughness: .5, metalness: .2 });
const part = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; computer.add(m); return m; };
part(new THREE.BoxGeometry(2.5, 1.56, .14), dark, 0, 1.62, 0);
const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.34, 1.4), new THREE.MeshBasicMaterial({ map: codeTex, toneMapped: false }));
screenMesh.position.set(0, 1.62, .071);
computer.add(screenMesh);
part(new THREE.BoxGeometry(.18, .7, .14), dark, 0, .62, -.06);
part(new THREE.BoxGeometry(.9, .06, .55), dark, 0, .17, -.02);
part(new THREE.BoxGeometry(1.6, .06, .5), std(0xd9d4ca), 0, .17, .75);
part(new THREE.BoxGeometry(.18, .06, .28), std(0xd9d4ca), 1.05, .17, .78);
const screenGlow = new THREE.PointLight(0x9ad7ff, 0, 5, 2);
screenGlow.position.set(0, 1.6, .9);
computer.add(screenGlow);
computer.rotation.y = Math.PI / 4;
computer.scale.setScalar(1.3);
scene.add(computer);

function drawCode(lines, typing) {
  const W = codeCanvas.width, Hh = codeCanvas.height;
  cx.fillStyle = '#0f1218'; cx.fillRect(0, 0, W, Hh);
  cx.fillStyle = '#1b1f27'; cx.fillRect(0, 0, W, 34);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, k) => { cx.fillStyle = c; cx.beginPath(); cx.arc(20 + k * 20, 17, 6, 0, Math.PI * 2); cx.fill(); });
  cx.fillStyle = '#8d9098'; cx.font = '16px "JetBrains Mono", monospace'; cx.fillText('city.js', 290, 23);
  cx.font = '19px "JetBrains Mono", monospace';
  const show = lines.slice(-12);
  const first = lines.length - show.length;
  show.forEach((l, k) => {
    const y = 64 + k * 28;
    cx.fillStyle = '#4b505b'; cx.fillText(String(first + k + 1).padStart(2, ' '), 14, y);
    let x = 52;
    l.split(/('[^']*'|\b\d+\b|\b(?:const|new|import|from)\b|\/\/.*)/).forEach(p => {
      if (!p) return;
      cx.fillStyle = /^'/.test(p) ? '#8fe3a7' : /^\d+$/.test(p) ? '#f2d67c' : /^(const|new|import|from)$/.test(p) ? '#ff8fb1' : /^\/\//.test(p) ? '#6b7280' : '#e4e6ea';
      cx.fillText(p, x, y);
      x += cx.measureText(p).width;
    });
    if (typing && k === show.length - 1) { cx.fillStyle = '#8fe3a7'; cx.fillRect(x + 3, y - 17, 10, 21); }
  });
  codeTex.needsUpdate = true;
}

/* ---------- 楼：窗户贴图（白天看到窗格，夜里窗户发光） ---------- */
function windowTextures(seed) {
  const a = document.createElement('canvas'), b = document.createElement('canvas');
  a.width = b.width = 64; a.height = b.height = 64;
  const x = a.getContext('2d'), y = b.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 64, 64);
  y.fillStyle = '#000000'; y.fillRect(0, 0, 64, 64);
  let r = seed * 9301 + 49297;
  const rand = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const px = 8 + i * 30, py = 8 + j * 30;
    x.fillStyle = '#5b6170'; x.fillRect(px, py, 18, 20);
    x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(px, py, 18, 3);
    if (rand() > .35) { y.fillStyle = rand() > .5 ? '#ffd08a' : '#ffe7b8'; y.fillRect(px, py, 18, 20); }
  }
  const map = new THREE.CanvasTexture(a), lit = new THREE.CanvasTexture(b);
  [map, lit].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; });
  return [map, lit];
}
const FACADES = [1, 2, 3, 4, 5].map(windowTextures);
const PALETTE = [0xe9e1d3, 0x9a9184, 0x2f3d70, 0xb85a42, 0x3f8f86, 0x44474f, 0xd9c7a7, 0xc98a5b];
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

/* 地块：四个象限各 4×4 格，扣掉环形路里面那一格 */
const V = [1.55, 3.35, 5.1, 6.75];
const LOTS = [];
[-1, 1].forEach(sx => [-1, 1].forEach(sz => V.forEach(a => V.forEach(b => {
  if (a < 2.7 && b < 2.7) return;
  LOTS.push({ x: sx * a, z: sz * b, d: Math.hypot(a, b) });
}))));

/* ---------- 各种建筑：商场、公司、庙、教堂、清真寺、医院、学校、住家、店屋…… ---------- */
const glowMat = (color, k) => { const m = std(color, { emissive: color, emissiveIntensity: 0 }); m.userData.k = k; return m; };
function addTo(g, geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; }
/* 立方体：y 是底部高度 */
function cube(g, w, h, d, mat, x, y, z) { return addTo(g, new THREE.BoxGeometry(w, h, d), mat, x || 0, (y || 0) + h / 2, z || 0); }
/* 人字屋顶：屋脊沿 z 方向；rot 转 90 度就沿 x 方向 */
function gable(g, w, h, d, mat, x, y, z, rot) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  geo.translate(0, 0, -d / 2);
  const m = addTo(g, geo, mat, x || 0, y || 0, z || 0);
  if (rot) m.rotation.y = Math.PI / 2;
  return m;
}
/* 四角攒尖屋顶 */
function pyramid(g, w, h, d, mat, x, y, z) {
  const geo = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
  geo.rotateY(Math.PI / 4);
  const m = addTo(g, geo, mat, x || 0, (y || 0) + h / 2, z || 0);
  m.scale.set(w, h, d);
  return m;
}
function cyl(g, rt, rb, h, mat, x, y, z, seg) { return addTo(g, new THREE.CylinderGeometry(rt, rb, h, seg || 14), mat, x || 0, (y || 0) + h / 2, z || 0); }
/* 有窗户的墙：白天看到窗格，夜里窗户亮 */
function facade(ctx, color, w, floors) {
  const [map0, lit0] = FACADES[Math.floor(rnd() * FACADES.length)];
  const map = map0.clone(), lit = lit0.clone();
  map.repeat.set(Math.max(1, Math.round(w * 1.4)), Math.max(1, floors / 2));
  lit.repeat.copy(map.repeat);
  map.needsUpdate = lit.needsUpdate = true;
  const m = std(color, { map, emissive: 0xffcf8a, emissiveMap: lit, emissiveIntensity: 0 });
  ctx.sides.push(m);
  return m;
}
function fbox(g, ctx, w, h, d, color, x, y, z, floors, roofColor) {
  const side = facade(ctx, color, w, floors || Math.round(h / .6));
  const roof = std(roofColor || new THREE.Color(color).multiplyScalar(.8).getHex());
  return addTo(g, new THREE.BoxGeometry(w, h, d), [side, side, roof, roof, side, side], x || 0, (y || 0) + h / 2, z || 0);
}
const C_ROOF = [0xb85a42, 0x8a4a3a, 0x5d6b7a, 0x3f6f68, 0xc98a5b];
const C_PASTEL = [0xf1d8c4, 0xd9e5d6, 0xf3e6b8, 0xcfe0ea, 0xead2dc, 0xe9e1d3];
const pick = arr => arr[Math.floor(rnd() * arr.length)];

const TYPES = {
  office(g, c) {
    const f = 6 + Math.floor(rnd() * 3), h = f * .6;
    fbox(g, c, .95, h, .95, pick([0x6f8fb0, 0x5d7896, 0x8aa3b8]), 0, 0, 0, f, 0x3a3d44);
    cube(g, .7, .14, .7, std(0x2b2e35), 0, h, 0);
    return 'tall';
  },
  tower(g, c) {
    const f = 11, h = f * .6;
    fbox(g, c, .95, h, .95, 0x2f3d70, 0, 0, 0, f, 0x22262e);
    cube(g, .6, .2, .6, std(0x22262e), 0, h, 0);
    cyl(g, .03, .03, 1, std(0xd9d4ca), 0, h + .2, 0);
    c.beacon = addTo(g, new THREE.SphereGeometry(.08), new THREE.MeshBasicMaterial({ color: 0xff5040 }), 0, h + 1.25, 0);
    return 'tall';
  },
  apartment(g, c) {
    const f = 7, h = f * .55, col = pick(C_PASTEL);
    fbox(g, c, .85, h, .8, col, 0, 0, 0, f);
    const white = std(0xf6f3ec);
    for (let k = 1; k < f; k++) cube(g, .9, .04, .14, white, 0, k * .55 - .02, .43);
    cube(g, .4, .3, .3, std(0x9aa0aa), .15, h, -.1);
    return 'tall';
  },
  mall(g, c) {
    fbox(g, c, 1.35, .85, 1.25, 0xe9e1d3, 0, 0, 0, 1, 0xcfc8bb);
    cube(g, 1.38, .24, 1.28, glowMat(0x7cc0e8, .9), 0, .3, 0);
    cube(g, .56, .2, .06, glowMat(0xe8574a, 1.6), 0, .66, .65);
    cube(g, .3, .14, .3, std(0x9aa0aa), -.35, .85, -.25);
    cube(g, .3, .14, .3, std(0x9aa0aa), .3, .85, -.3);
    return 'low';
  },
  temple(g, c) {
    const red = std(0xb3352b), tile = std(0xd77b2a), gold = std(0xe6b450);
    cube(g, 1.3, .12, 1.1, std(0xb9b2a6));
    cube(g, .95, .42, .62, red, 0, .12, 0);
    gable(g, .9, .3, 1.25, tile, 0, .54, 0, true);
    cube(g, 1.18, .05, .05, gold, 0, .84, 0);
    cube(g, .5, .2, .36, red, 0, .86, 0);
    gable(g, .5, .2, .72, tile, 0, 1.06, 0, true);
    [-.6, .6].forEach(x => addTo(g, new THREE.ConeGeometry(.04, .18, 6), gold, x, .9, 0));
    [-.3, .3].forEach(x => addTo(g, new THREE.SphereGeometry(.07, 10, 8), glowMat(0xff4a3a, 1.8), x, .42, .36));
    cube(g, .22, .3, .02, gold, 0, .12, .32);
    return 'low';
  },
  church(g, c) {
    const white = std(0xf1ede4), slate = std(0x6b6f78), gold = std(0xe6b450);
    cube(g, .62, .55, .95, white, 0, 0, -.12);
    gable(g, .7, .35, 1.02, slate, 0, .55, -.12);
    cube(g, .34, 1.05, .34, white, 0, 0, .42);
    pyramid(g, .38, .6, .38, slate, 0, 1.05, .42);
    cube(g, .03, .24, .03, gold, 0, 1.65, .42);
    cube(g, .14, .03, .03, gold, 0, 1.73, .42);
    const rose = addTo(g, new THREE.CylinderGeometry(.08, .08, .02, 16), glowMat(0x9fd0ff, 1.4), 0, .78, .6);
    rose.rotation.x = Math.PI / 2;
    return 'tall';
  },
  mosque(g, c) {
    const white = std(0xf3efe6), dome = std(0x3f8f86, { roughness: .4 }), gold = std(0xe6b450);
    cube(g, 1.05, .5, 1.05, white);
    cyl(g, .3, .3, .14, white, 0, .5, 0);
    addTo(g, new THREE.SphereGeometry(.33, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), dome, 0, .64, 0);
    cyl(g, .015, .015, .2, gold, 0, .95, 0);
    cyl(g, .07, .085, 1.45, white, .42, 0, .42);
    cyl(g, .12, .12, .05, white, .42, 1.05, .42);
    addTo(g, new THREE.SphereGeometry(.09, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold, .42, 1.45, .42);
    [[-.42, -.42], [.42, -.42], [-.42, .42]].forEach(([x, z]) => addTo(g, new THREE.SphereGeometry(.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), dome, x, .5, z));
    cube(g, .3, .32, .02, glowMat(0xffd58a, 1), 0, 0, .53);
    return 'tall';
  },
  hospital(g, c) {
    fbox(g, c, 1.2, 1.5, 1.0, 0xf4f4f2, 0, 0, 0, 3, 0xd9dadc);
    const red = glowMat(0xe23b30, 1.6);
    cube(g, .32, .08, .02, red, 0, 1.12, .51);
    cube(g, .08, .32, .02, red, 0, 1.0, .51);
    cyl(g, .32, .32, .02, std(0x3f6f68), 0, 1.5, 0, 24);
    cube(g, .9, .14, .14, std(0xe23b30), 0, .62, .56);
    return 'tall';
  },
  school(g, c) {
    fbox(g, c, 1.3, .85, .62, 0xf2d6a2, 0, 0, -.28, 2, 0xc98a5b);
    cube(g, 1.34, .05, .66, std(0xc98a5b), 0, .85, -.28);
    cube(g, 1.3, .03, .52, std(0x6e9f6a), 0, 0, .34);
    cube(g, .9, .02, .02, std(0xffffff), 0, .03, .34);
    cyl(g, .012, .012, .95, std(0xd9d4ca), .56, 0, .5);
    cube(g, .22, .13, .01, std(0xe23b30), .45, .78, .5);
    return 'low';
  },
  clocktower(g, c) {
    cube(g, 1.1, .06, 1.1, std(0xb9b2a6));
    cube(g, .5, 1.9, .5, std(0xb7704f), 0, .06, 0);
    const face = glowMat(0xfff4dc, 1.1);
    [[0, .26, 0], [0, -.26, Math.PI], [.26, 0, Math.PI / 2], [-.26, 0, -Math.PI / 2]].forEach(([x, z, r]) => {
      const geo = new THREE.CylinderGeometry(.16, .16, .02, 20);
      geo.rotateX(Math.PI / 2);
      const f = addTo(g, geo, face, x, 1.62, z);
      f.rotation.y = r;
    });
    pyramid(g, .62, .55, .62, std(0x3f6f68), 0, 1.96, 0);
    return 'tall';
  },
  cinema(g, c) {
    cube(g, 1.2, .78, 1.0, std(0x2b2f38));
    cube(g, 1.26, .12, .32, glowMat(0xffd27a, 1.6), 0, .46, .38);
    cube(g, .08, .62, .26, glowMat(0xe8574a, 1.5), .56, .28, .38);
    [-.3, .15].forEach(x => cube(g, .2, .28, .02, glowMat(0x9fd0ff, .8), x, .1, .51));
    return 'low';
  },
  library(g, c) {
    const stone = std(0xece6da);
    cube(g, 1.25, .08, 1.05, std(0xcfc8bb));
    cube(g, 1.15, .08, .95, std(0xd9d3c7), 0, .08, 0);
    cube(g, 1.0, .58, .6, stone, 0, .16, -.14);
    [-.36, -.12, .12, .36].forEach(x => cyl(g, .045, .05, .55, stone, x, .16, .32, 10));
    cube(g, 1.05, .08, .42, stone, 0, .71, .1);
    gable(g, 1.05, .22, .42, std(0xd9d3c7), 0, .79, .1);
    cube(g, .3, .36, .02, glowMat(0xffd58a, .9), 0, .16, .17);
    return 'low';
  },
  cafe(g, c) {
    cube(g, .9, .5, .8, std(0xf2e3c6), 0, 0, -.12);
    gable(g, .98, .3, .88, std(pick(C_ROOF)), 0, .5, -.12);
    const awn = cube(g, .9, .04, .32, std(0x3f8f86), 0, .38, .42);
    awn.rotation.x = .35;
    cube(g, .5, .26, .02, glowMat(0xffd58a, 1.2), 0, .06, .29);
    [[-.25, .5], [.25, .52]].forEach(([x, z]) => cyl(g, .07, .07, .16, std(0xf6f3ec), x, 0, z, 10));
    return 'low';
  },
  watertower(g, c) {
    const steel = std(0x9aa0aa);
    [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]].forEach(([x, z]) => cyl(g, .025, .025, .95, steel, x, 0, z, 6));
    cyl(g, .34, .34, .42, std(0xd9d4ca), 0, .95, 0, 18);
    addTo(g, new THREE.ConeGeometry(.36, .18, 18), std(0x8a4a3a), 0, 1.46, 0);
    cube(g, .55, .4, .5, std(pick(C_PASTEL)), -.35, 0, .35);
    return 'tall';
  },
  /* 小地块用的 */
  houses(g, c) {
    [-.33, .33].forEach(x => {
      const w = .52, h = .42 + rnd() * .2, d = .7 + rnd() * .2;
      cube(g, w, h, d, std(pick(C_PASTEL)), x, 0, 0);
      gable(g, w + .08, .26, d + .08, std(pick(C_ROOF)), x, h, 0);
      cube(g, .12, .2, .02, std(0x6b4a33), x, 0, d / 2 + .01);
      cube(g, .14, .1, .02, glowMat(0xffd58a, 1), x, h * .55, d / 2 + .01);
    });
    return 'low';
  },
  shophouses(g, c) {
    [-.44, 0, .44].forEach(x => {
      const col = pick(C_PASTEL);
      fbox(g, c, .42, .78, .95, col, x, 0, 0, 2);
      gable(g, .44, .2, 1.0, std(0xb85a42), x, .78, 0);
      cube(g, .42, .05, .18, std(0xf6f3ec), x, .36, .55);
    });
    return 'low';
  },
  block(g, c) {
    const f = 2 + Math.floor(rnd() * 3), h = f * .6;
    fbox(g, c, .9 + rnd() * .3, h, .9 + rnd() * .3, pick([0xe9e1d3, 0x9a9184, 0xd9c7a7, 0xc98a5b, 0x44474f]), 0, 0, 0, f);
    cube(g, .35, .24, .35, std(0x3a3d44), (rnd() - .5) * .3, h, (rnd() - .5) * .3);
    return f > 3 ? 'tall' : 'low';
  }
};

function makeStructure(type, lot) {
  const g = new THREE.Group();
  const ctx = { sides: [], beacon: null };
  const height = TYPES[type](g, ctx);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  /* 稍微转一下方向，免得每栋都面朝同一边 */
  g.rotation.y = lot.turn || 0;
  g.position.set(lot.x, .02, lot.z);
  scene.add(g);
  const glows = [];
  g.traverse(o => { if (o.isMesh && !Array.isArray(o.material) && o.material.userData.k) glows.push(o.material); });
  /* 线框：照整栋的外框画 */
  g.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(g);
  const size = bb.getSize(new THREE.Vector3());
  const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
  geo.translate(0, size.y / 2, 0);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x8fe3a7, transparent: true, opacity: 0 }));
  edges.position.set((bb.min.x + bb.max.x) / 2, .02, (bb.min.z + bb.max.z) / 2);
  scene.add(edges);
  return { mesh: g, edges, sides: ctx.sides, glows, beacon: ctx.beacon, name: type, height };
}

/* 地块分配：14 个主角建筑（每个写一行代码），其余是住家、店屋、小楼和公园
   靠近镜头那一角只放矮的，免得挡住中间的电脑 */
const HERO_TYPES = ['mall', 'office', 'temple', 'church', 'tower', 'mosque', 'hospital', 'school', 'cinema', 'clocktower', 'library', 'cafe', 'apartment', 'watertower'];
const TALL = { office: 1, tower: 1, church: 1, mosque: 1, hospital: 1, clocktower: 1, apartment: 1, watertower: 1 };
const shuffled = LOTS.map((l, i) => ({ l, k: (i * 37) % LOTS.length })).sort((a, b) => a.k - b.k).map(o => o.l);
const isFront = l => l.x > 0 && l.z > 0;
/* 面朝道路：转向离中心比较近的那条路 */
shuffled.forEach(l => { l.turn = Math.abs(l.x) > Math.abs(l.z) ? (l.x > 0 ? -Math.PI / 2 : Math.PI / 2) : (l.z > 0 ? Math.PI : 0); });
const heroLots = [], rest = [];
shuffled.forEach((l, i) => { (i % 4 === 0 && heroLots.length < HERO_TYPES.length ? heroLots : rest).push(l); });
const tallTypes = HERO_TYPES.filter(t => TALL[t]), lowTypes = HERO_TYPES.filter(t => !TALL[t]);
const heroes = [];
heroLots.forEach(l => {
  const list = isFront(l) ? (lowTypes.length ? lowTypes : tallTypes) : (tallTypes.length ? tallTypes : lowTypes);
  heroes.push(makeStructure(list.shift(), l));
});
/* 按代码顺序排：让建造时四处轮流出现 */
heroes.sort((a, b) => HERO_TYPES.indexOf(a.name) - HERO_TYPES.indexOf(b.name));
const fillers = [], parks = [];
rest.forEach((l, i) => {
  if (i % 6 === 3) { parks.push(l); return; }
  const r = rnd();
  const type = isFront(l) ? (r < .55 ? 'houses' : 'shophouses') : (r < .3 ? 'houses' : r < .55 ? 'shophouses' : 'block');
  const s = makeStructure(type, l);
  s.dist = l.d;
  fillers.push(s);
});
fillers.sort((a, b) => a.dist - b.dist);
const buildings = heroes.concat(fillers);

/* 公园和树 */
const trees = [];
function tree(x, z, s) {
  const t = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, .3), std(0x6b4a33));
  trunk.position.y = .15;
  const top = new THREE.Mesh(new THREE.ConeGeometry(.24 * s, .66 * s, 7), std(rnd() > .5 ? 0x4f8a5c : 0x5f9a62));
  top.position.y = .3 + .33 * s;
  trunk.castShadow = top.castShadow = true;
  t.add(trunk, top);
  t.position.set(x, .06, z);
  scene.add(t);
  trees.push(t);
}
const lawns = [];
parks.forEach(p => {
  const lawn = add(new THREE.BoxGeometry(1.4, .08, 1.4), std(0x6e9f6a), p.x, .04, p.z);
  lawn.castShadow = false;
  lawns.push(lawn);
  tree(p.x - .35, p.z - .3, 1); tree(p.x + .38, p.z + .1, 1.15); tree(p.x - .1, p.z + .42, .9);
});
/* 广场三个角的小树（留一角给镜头看电脑） */
[[-1.45, -1.45], [1.45, -1.45], [-1.45, 1.45]].forEach(([x, z]) => tree(x, z, .8));

/* 路灯：沿着四条大路 */
const lamps = [];
const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffd58a, emissiveIntensity: 0 });
[3.3, 5.0, 6.7].forEach(k => [[.55, k], [-.55, -k], [k, -.55], [-k, .55]].forEach(([x, z]) => {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.025, .03, .6), std(0x2b2e35));
  post.position.y = .3;
  post.castShadow = true;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), bulbMat);
  bulb.position.y = .64;
  g.add(post, bulb);
  g.position.set(x, .04, z);
  scene.add(g);
  lamps.push(g);
}));

/* ---------- 车 ---------- */
const CAR_COLORS = [0xe8574a, 0xf2d67c, 0x5aa9e6, 0xf4f1ea, 0x3f8f86, 0xd46a9a, 0x2b2f38];
const headMat = new THREE.MeshStandardMaterial({ color: 0xfff6dd, emissive: 0xfff1c0, emissiveIntensity: 0 });
const tailMat = new THREE.MeshStandardMaterial({ color: 0x7a1010, emissive: 0xff2a1a, emissiveIntensity: 0 });
function makeCar(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(.26, .14, .5), std(color, { roughness: .45 }));
  body.position.y = .13;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(.22, .11, .26), std(0x2a2f38, { roughness: .3 }));
  cabin.position.set(0, .25, -.03);
  body.castShadow = cabin.castShadow = true;
  g.add(body, cabin);
  [[-.14, .16], [.14, .16], [-.14, -.16], [.14, -.16]].forEach(([x, z]) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(.04, .09, .09), std(0x15171b));
    w.position.set(x, .07, z);
    g.add(w);
  });
  [-.08, .08].forEach(x => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(.05, .04, .02), headMat); h.position.set(x, .15, .26); g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(.05, .04, .02), tailMat); t.position.set(x, .15, -.26); g.add(t);
  });
  g.visible = false;
  scene.add(g);
  return g;
}
/* 环形路：外车道顺时针，内车道逆时针 */
function loopPos(s, r) {
  const L = 2 * r, P = 4 * L;
  s = ((s % P) + P) % P;
  const side = Math.floor(s / L), t = s - side * L;
  if (side === 0) return [-r + t, -r, Math.PI / 2];
  if (side === 1) return [r, -r + t, 0];
  if (side === 2) return [r - t, r, -Math.PI / 2];
  return [-r, r - t, Math.PI];
}
const cars = [];
for (let i = 0; i < 4; i++) cars.push({ g: makeCar(CAR_COLORS[i]), kind: 'loop', r: R + .18, s: i * 4.4, v: 1.15 });
for (let i = 0; i < 3; i++) cars.push({ g: makeCar(CAR_COLORS[i + 4]), kind: 'loop', r: R - .18, s: i * 5.9, v: -1 });
/* 四条通往边缘的路：从环形路开出去，开到边缘再从头开 */
[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz], i) => {
  cars.push({ g: makeCar(CAR_COLORS[(i + 2) % CAR_COLORS.length]), kind: 'axis', dx, dz, s: i * 1.3, v: 1.3 });
});
let driving = false;

/* ---------- 飞机和云 ---------- */
const plane = new THREE.Group();
const white = std(0xf4f1ea, { roughness: .4 });
const fus = new THREE.Mesh(new THREE.CylinderGeometry(.11, .07, 1.1, 10), white);
fus.rotation.x = Math.PI / 2;
const nose = new THREE.Mesh(new THREE.ConeGeometry(.11, .22, 10), white);
nose.rotation.x = Math.PI / 2; nose.position.z = .66;
const wing = new THREE.Mesh(new THREE.BoxGeometry(1.4, .03, .26), white);
wing.position.z = .05;
const tailWing = new THREE.Mesh(new THREE.BoxGeometry(.5, .03, .14), white);
tailWing.position.z = -.48;
const fin = new THREE.Mesh(new THREE.BoxGeometry(.03, .24, .18), std(0xe8574a));
fin.position.set(0, .13, -.48);
[fus, nose, wing, tailWing, fin].forEach(m => { m.castShadow = true; plane.add(m); });
const navR = new THREE.Mesh(new THREE.SphereGeometry(.04), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
navR.position.set(-.7, 0, .05);
const navG = new THREE.Mesh(new THREE.SphereGeometry(.04), new THREE.MeshBasicMaterial({ color: 0x3bff7a }));
navG.position.set(.7, 0, .05);
plane.add(navR, navG);
scene.add(plane);
plane.visible = false;

const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: .95, flatShading: true });
const clouds = [];
for (let i = 0; i < 5; i++) {
  const c = new THREE.Group();
  const n = 3 + (i % 2);
  for (let k = 0; k < n; k++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.45 + rnd() * .35, 0), cloudMat);
    p.position.set(k * .55 - n * .25, rnd() * .2, (rnd() - .5) * .4);
    c.add(p);
  }
  /* 云飘得高一点，免得在画面上盖住楼 */
  c.position.set(-11 + i * 5, 10 + rnd() * 1.4, -9 + rnd() * 6);
  c.userData.v = .25 + rnd() * .2;
  scene.add(c);
  clouds.push(c);
}

/* ---------- 白天 / 夜晚 ---------- */
const C = h => new THREE.Color(h);
const DAY = { hemiSky: C(0xdfefff), hemiGround: C(0x8a7c66), hemi: 1.05, sun: C(0xfff4e0), sunI: 2.1, fill: .45, plate: C(0xd8d2c6), road: C(0x50545d), lawn: C(0x7fb276), top: C(0xbcdcf2), bottom: C(0xf1f4ef) };
const NIGHT = { hemiSky: C(0x5f74b8), hemiGround: C(0x0d0b10), hemi: .42, sun: C(0x9fb4ff), sunI: .35, fill: .18, plate: C(0x1e2128), road: C(0x101216), lawn: C(0x203a2a), top: C(0x1c2130), bottom: C(0x0b0d11) };
const mode = { m: 0 };
const tmp = new THREE.Color();
function lerp(a, b, t) { return tmp.copy(a).lerp(b, t); }
function applyMode() {
  const t = mode.m;
  hemi.color.copy(lerp(DAY.hemiSky, NIGHT.hemiSky, t));
  hemi.groundColor.copy(lerp(DAY.hemiGround, NIGHT.hemiGround, t));
  hemi.intensity = DAY.hemi + (NIGHT.hemi - DAY.hemi) * t;
  sun.color.copy(lerp(DAY.sun, NIGHT.sun, t));
  sun.intensity = DAY.sunI + (NIGHT.sunI - DAY.sunI) * t;
  fill.intensity = DAY.fill + (NIGHT.fill - DAY.fill) * t;
  plateMat.color.copy(lerp(DAY.plate, NIGHT.plate, t));
  roadMat.color.copy(lerp(DAY.road, NIGHT.road, t));
  lawns.forEach(l => l.material.color.copy(lerp(DAY.lawn, NIGHT.lawn, t)));
  const lights = Math.max(0, (t - .35) / .65);
  buildings.forEach(b => { b.sides.forEach(m => { m.emissiveIntensity = lights * .7; }); b.glows.forEach(m => { m.emissiveIntensity = lights * m.userData.k; }); });
  bulbMat.emissiveIntensity = lights * 2.4;
  headMat.emissiveIntensity = lights * 2;
  tailMat.emissiveIntensity = lights * 1.6;
  screenGlow.intensity = lights * 2.2;
  cloudMat.opacity = .95 - t * .75;
  dashMat.emissiveIntensity = .2 + lights * .5;
  const top = '#' + lerp(DAY.top, NIGHT.top, t).getHexString();
  const bottom = '#' + lerp(DAY.bottom, NIGHT.bottom, t).getHexString();
  box.style.background = 'radial-gradient(95% 85% at 50% 35%, ' + top + ', ' + bottom + ')';
}
function setMode(night, dur) {
  gsap.killTweensOf(mode);
  if (calm || !dur) { mode.m = night ? 1 : 0; applyMode(); }
  else gsap.to(mode, { m: night ? 1 : 0, duration: dur, ease: 'power2.inOut', onUpdate: applyMode });
  modeBtn.textContent = night ? (en() ? '☀ Day' : '☀ 白天') : (en() ? '☾ Night' : '☾ 夜晚');
  modeBtn.dataset.night = night ? '1' : '';
}
/* 盖完后：白天停 5 秒变黑夜，黑夜停 5 秒再变白天，一直轮流；用户自己按过白天 / 黑夜按钮就不再自动切换 */
let autoCycle = false, cycleTimer = 0;
function stopCycle() { autoCycle = false; clearTimeout(cycleTimer); }
function startCycle() {
  stopCycle();
  if (calm) return;
  autoCycle = true;
  (function next() {
    cycleTimer = setTimeout(() => {
      if (!autoCycle) return;
      setMode(!modeBtn.dataset.night, 1.6);
      cycleTimer = setTimeout(next, 1600);
    }, 5000);
  })();
}
modeBtn.addEventListener('click', () => { stopCycle(); setMode(!modeBtn.dataset.night, 1.6); });

/* 从电脑射向地块的光线、地块上的光圈 */
const beamMat = new THREE.LineBasicMaterial({ color: 0x8fe3a7, transparent: true, opacity: 0 });
const beamGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
scene.add(new THREE.Line(beamGeo, beamMat));
const ringMat = new THREE.MeshBasicMaterial({ color: 0x8fe3a7, transparent: true, opacity: 0, side: THREE.DoubleSide });
const ring = new THREE.Mesh(new THREE.RingGeometry(.6, .7, 40), ringMat);
ring.rotation.x = -Math.PI / 2;
scene.add(ring);

/* ---------- 建造流程 ---------- */
let lines = [];
let running = 0;
let built = false;
function setHud(text, k) {
  hudLine.textContent = text;
  hudCount.textContent = String(k).padStart(2, '0') + ' / ' + String(buildings.length).padStart(2, '0');
}
function reset() {
  buildings.forEach(b => { b.mesh.scale.set(1, .001, 1); b.mesh.visible = false; b.edges.scale.set(1, .001, 1); b.edges.material.opacity = 0; });
  trees.concat(lamps).forEach(t => t.scale.setScalar(.001));
  cars.forEach(c => { c.g.visible = false; });
  driving = false;
  plane.visible = false;
  lines = ["import { City } from './vibe'", 'const city = new City(15)'];
  drawCode(lines, true);
  setHud(lines[1], 0);
  box.classList.remove('done');
  replayBtn.hidden = true;
  modeBtn.hidden = true;
  controls.enabled = false;
  controls.autoRotate = false;
  built = false;
  stopCycle();
  setMode(false, 0);
}
function typeLine(text, dur) {
  return new Promise(res => {
    lines.push('');
    const o = { n: 0 };
    gsap.to(o, { n: text.length, duration: dur, ease: 'none', onUpdate: () => { lines[lines.length - 1] = text.slice(0, Math.round(o.n)); drawCode(lines, true); }, onComplete: res });
  });
}
function raise(b, quick) {
  const p = b.mesh.position;
  if (!quick) {
    beamGeo.setFromPoints([new THREE.Vector3(0, 2.1, 0), new THREE.Vector3(p.x, .05, p.z)]);
    beamMat.opacity = .9;
    gsap.to(beamMat, { opacity: 0, duration: .5, delay: .15 });
    ring.position.set(p.x, .06, p.z);
    ring.scale.setScalar(.6);
    ringMat.opacity = .8;
    gsap.to(ring.scale, { x: 1.6, y: 1.6, z: 1.6, duration: .7, ease: 'power2.out' });
    gsap.to(ringMat, { opacity: 0, duration: .7 });
  }
  /* 先出现线框，再长出实体，线框淡出 */
  b.edges.material.opacity = .9;
  gsap.to(b.edges.scale, { y: 1, duration: quick ? .3 : .45, ease: 'power2.out' });
  b.mesh.visible = true;
  gsap.to(b.mesh.scale, { y: 1, duration: quick ? .7 : 1, delay: quick ? .12 : .25, ease: 'elastic.out(1, .55)' });
  gsap.to(b.edges.material, { opacity: 0, duration: .5, delay: quick ? .4 : .7 });
}
async function build() {
  const my = ++running;
  reset();
  if (calm) {
    buildings.forEach(b => { b.mesh.visible = true; b.mesh.scale.y = 1; });
    trees.concat(lamps).forEach(t => t.scale.setScalar(1));
    heroes.forEach(b => lines.push(`city.build('${b.name}')`));
    lines.push(`city.fill('blocks', ${fillers.length})`);
    drawCode(lines, false);
    finish();
    return;
  }
  await wait(500);
  for (let k = 0; k < heroes.length; k++) {
    if (my !== running) return;
    const b = heroes[k];
    const code = `city.build('${b.name}')`;
    setHud(code, k + 1);
    await typeLine(code, .3);
    if (my !== running) return;
    raise(b);
    await wait(220);
  }
  /* 一口气把其他街区填满：从里往外一圈圈长出来 */
  const fillCode = `city.fill('blocks', ${fillers.length})`;
  await typeLine(fillCode, .35);
  if (my !== running) return;
  fillers.forEach((b, k) => { setTimeout(() => { if (my === running) { raise(b, true); setHud(fillCode, heroes.length + k + 1); } }, k * 45); });
  await wait(fillers.length * 45 + 400);
  if (my !== running) return;
  await typeLine("city.plant('trees')", .3);
  trees.concat(lamps).forEach((t, k) => gsap.to(t.scale, { x: 1, y: 1, z: 1, duration: .7, delay: k * .02, ease: 'back.out(2.2)' }));
  await wait(600);
  if (my !== running) return;
  await typeLine('city.drive(' + cars.length + ')', .3);
  cars.forEach((c, k) => { c.g.visible = true; c.g.scale.setScalar(.001); gsap.to(c.g.scale, { x: 1, y: 1, z: 1, duration: .5, delay: k * .06, ease: 'back.out(2)' }); });
  driving = true;
  plane.visible = true;
  await wait(500);
  if (my !== running) return;
  await typeLine('city.cycle(5)', .3);
  await wait(500);
  if (my !== running) return;
  lines.push(en() ? '// done ✓ drag to rotate' : '// 完成 ✓ 拖动旋转');
  drawCode(lines, false);
  finish();
}
function doneText() { return en() ? `Done: ${buildings.length} buildings` : `完成：${buildings.length} 栋楼`; }
function finish() {
  built = true;
  box.classList.add('done');
  replayBtn.hidden = false;
  modeBtn.hidden = false;
  controls.enabled = true;
  controls.autoRotate = !calm;
  controls.autoRotateSpeed = .7;
  driving = true;
  plane.visible = true;
  cars.forEach(c => { c.g.visible = true; if (c.kind === 'loop') c.g.scale.setScalar(1); });
  setHud(doneText(), buildings.length);
  startCycle();
}
replayBtn.addEventListener('click', () => {
  controls.autoRotate = false;
  camera.position.copy(HOME);
  controls.update();
  build();
});
if (window.Site) window.Site.onLang(() => { if (built) { setHud(doneText(), buildings.length); setMode(!!modeBtn.dataset.night, 0); } });

/* ---------- 旁边的提示便利贴 ---------- */
const note = document.getElementById('isoNote');
const touch = window.matchMedia('(hover: none)').matches;
let noteSeen = false;
function noteText() {
  if (!note) return;
  const b = note.querySelector('b'), s = note.querySelector('span');
  if (noteSeen) {
    b.textContent = en() ? 'Tip' : '小提示';
    s.textContent = en() ? 'Drag left or right to spin the city. The day/night button is up top.' : '左右拖动可以旋转小城，右上角还能切换白天和黑夜。';
  } else if (touch) {
    b.textContent = en() ? 'Swipe sideways on the city' : '用手指左右拖动这座小城';
    s.textContent = en() ? 'It grows one line of code at a time; swipe to spin it around.' : '它会一行代码一栋楼地长出来，拖一拖就能转着看。';
  }
}
noteText();
box.addEventListener('pointerenter', () => { if (noteSeen) return; noteSeen = true; note && note.classList.add('seen'); noteText(); });
if (window.Site) window.Site.onLang(() => setTimeout(noteText, 0));
/* ---------- 每一帧：车、飞机、云、塔顶灯 ---------- */
const clock = new THREE.Clock();
let time = 0;
function animate(dt) {
  time += dt;
  if (driving) {
    cars.forEach(c => {
      c.s += c.v * dt;
      if (c.kind === 'loop') {
        const [x, z, a] = loopPos(c.s, c.r);
        c.g.position.set(x, .04, z);
        c.g.rotation.y = c.v > 0 ? a : a + Math.PI;
      } else {
        const span = H - R - .9;
        const t = ((c.s % span) + span) % span;
        const along = R + .5 + t, lane = .18;
        c.g.position.set(c.dx * along + (c.dz ? lane : 0), .04, c.dz * along + (c.dx ? -lane : 0));
        c.g.rotation.y = Math.atan2(c.dx, c.dz);
        /* 开到边缘缩小消失，再从路口重新出现 */
        const edge = Math.min(t, span - t);
        c.g.scale.setScalar(Math.min(1, edge / .4 + .001));
      }
    });
  }
  if (plane.visible) {
    const a = time * .22, rr = 9.5;
    plane.position.set(Math.cos(a) * rr, 7.6 + Math.sin(time * .7) * .25, Math.sin(a) * rr);
    plane.rotation.set(0, -a, 0);
    plane.rotateZ(-.28);
    const blink = (time % 1.2) < .12;
    navR.visible = navG.visible = blink || mode.m < .5;
  }
  clouds.forEach(c => {
    c.position.x += c.userData.v * dt;
    if (c.position.x > 12) c.position.x = -12;
  });
  heroes.forEach(b => { if (b.beacon) b.beacon.visible = (time % 1.6) < .8; });
}

/* ---------- 只在看得到时渲染 ---------- */
let visible = true;
let raf = 0;
new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(); }).observe(box);
/* 要换页时先停下 3D，转场动画会更顺 */
window.addEventListener('tr:leave', () => { visible = false; });
function loop() {
  if (raf) return;
  clock.getDelta();
  raf = requestAnimationFrame(function tick() {
    raf = 0;
    if (!visible) return;
    animate(Math.min(clock.getDelta(), .05));
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  });
}
document.fonts && document.fonts.ready.then(() => drawCode(lines, !built));
reset();
loop();
setTimeout(build, 1300);
window.__iso = { build, setMode, scene };
