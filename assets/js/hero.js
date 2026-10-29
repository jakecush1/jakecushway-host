/* hero.js — Three.js hero for jakecushway.ca
 * Glossy near-black inflated tubes with indigo reflections, in the spirit of metalab.com.
 * ES module. Requires an import map that resolves "three" and "three/addons/":
 *   three        -> https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js
 *   three/addons/-> https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/
 * Default export: initHero(canvas, opts) -> Promise<controller|null>
 * Fallback: on any failure (no WebGL, CDN down) the canvas is hidden and <html> gets .no-webgl.
 */

const DEFAULTS = {
  exposure: 1.15,
  fog: 0.036,
  parallaxX: 0.09,   // radians of camera yaw per unit of normalised mouse x
  parallaxY: 0.05,   // radians of camera pitch per unit of normalised mouse y
  scrollFade: true,  // hero.js owns canvas opacity while scrolling
  scrollElement: null // element whose height defines scroll progress (default: canvas.parentElement)
};

function fallback(canvas) {
  try {
    document.documentElement.classList.add('no-webgl');
    if (canvas) canvas.hidden = true;
  } catch (_) { /* ignore */ }
  return null;
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (_) { return false; }
}

export default async function initHero(canvas, opts = {}) {
  if (!canvas) return null;
  const o = { ...DEFAULTS, ...opts };
  if (!hasWebGL()) return fallback(canvas);

  let THREE, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
  } catch (err) {
    console.warn('[hero] three.js failed to load', err);
    return fallback(canvas);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const isPhone = () => window.matchMedia('(max-width: 640px)').matches || !finePointer;

  // ---------- renderer ----------
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (err) {
    console.warn('[hero] WebGLRenderer failed', err);
    return fallback(canvas);
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = o.exposure;
  renderer.setClearColor(0x000000, 1);

  // ---------- scene / camera ----------
  const disposables = [];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, o.fog);

  const rig = new THREE.Group();          // mouse parallax + scroll dolly live here
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  camera.position.set(0, 0, 16);
  rig.add(camera);
  scene.add(rig);

  // Environment for reflections (room is never shown; background stays black)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  // Indigo emitters added to the room so reflections carry Metalab's violet alongside crisp white strips
  const emitter = (hex, gain, w, h, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(gain), side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot); room.add(m);
    disposables.push(m.geometry, m.material);
  };
  emitter(0x584dff, 6, 10, 22, [13.5, 12, 2], [0, -Math.PI / 2, 0]);     // right wall, tall violet
  emitter(0x3b2bd6, 2.4, 24, 7, [-2, 3, -12.5], [0, 0, 0]);                // back wall, low indigo band
  emitter(0x8a7dff, 3, 6, 14, [-13.5, 16, -6], [0, Math.PI / 2, 0]);     // left wall, lilac
  emitter(0x2a1c8f, 1.4, 26, 12, [0, -0.9, 2], [-Math.PI / 2, 0, 0]);      // floor glow
  const envRT = pmrem.fromScene(room, 0.04);
  scene.environment = envRT.texture;
  pmrem.dispose();
  if (room.dispose) room.dispose();

  // ---------- lights ----------
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-7, 9, 7);
  const violet = new THREE.PointLight(0x584dff, 42, 34, 2);
  violet.position.set(7, -6, 5);
  const lilac = new THREE.PointLight(0x9f8bff, 32, 30, 2);
  lilac.position.set(8, 7, 3);
  const rim = new THREE.PointLight(0x3a2cff, 18, 26, 2);
  rim.position.set(-9, -4, 2);
  const ambient = new THREE.AmbientLight(0x1a1030, 0.6);
  scene.add(key, violet, lilac, rim, ambient);

  // ---------- material ----------
  const makeMat = (tint = 0x07040f) => new THREE.MeshPhysicalMaterial({
    color: tint, metalness: 0.55, roughness: 0.22,
    clearcoat: 1, clearcoatRoughness: 0.12,
    sheen: 0.4, sheenColor: new THREE.Color(0x584dff), sheenRoughness: 0.5,
    envMapIntensity: 1.4
  });

  // ---------- forms ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const group = new THREE.Group();
  scene.add(group);
  const forms = [];     // { mesh, axis, speed }

  function addTube(points, radius, speed, { cap = false, tint } = {}) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    const geo = new THREE.TubeGeometry(curve, 220, radius, 48, false);
    geo.computeBoundingBox();
    const centre = geo.boundingBox.getCenter(new THREE.Vector3());
    geo.translate(-centre.x, -centre.y, -centre.z);
    const mat = makeMat(tint);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(centre);
    disposables.push(geo, mat);
    if (cap) {
      const sGeo = new THREE.SphereGeometry(radius, 40, 24);
      const cap1 = new THREE.Mesh(sGeo, mat);
      cap1.position.copy(curve.getPoint(1)).sub(centre);
      mesh.add(cap1);
      disposables.push(sGeo);
    }
    const axis = points[points.length - 1].clone().sub(points[0]).normalize();
    forms.push({ mesh, axis, speed, base: mesh.quaternion.clone() });
    group.add(mesh);
    return mesh;
  }

  // Frame at z=0 (fov 36, cam z 15, aspect 1.6): x in [-7.8, 7.8], y in [-4.9, 4.9]
  // A: top-left -> lower-right, the front form of the X
  addTube([V(-12, 7.4, -1.6), V(-6.2, 4.2, -0.4), V(-1.2, 1.2, 0.5), V(2.6, -2.2, 0.2), V(5.6, -6.4, -1.2), V(8.5, -10, -2.6)], 1.55, 0.04);
  // B: top-centre-right -> bottom-left, behind A, completes the X
  addTube([V(5.5, 9, -3), V(2.6, 4.6, -2.4), V(-1.4, 0.6, -2), V(-5.6, -3.2, -1.4), V(-10, -7.5, -2.2)], 1.4, -0.05, { tint: 0x0a0618 });
  // C: capped tube entering from the top-right corner, above the paragraph
  addTube([V(13, 9.8, -3.6), V(8.8, 7.8, -3.3), V(5.4, 6.3, -3.1), V(2.8, 5.4, -3.1)], 1.25, 0.06, { cap: true, tint: 0x09051a });
  // D: low sweep grazing the bottom-left corner
  addTube([V(-12, -2.2, 1.2), V(-7.4, -4.2, 1.8), V(-3.4, -7.2, 1.2), V(0.5, -10.5, 0)], 1.35, 0.07, { tint: 0x06040e });
  // Capsule leaning at the far right edge for variety
  {
    const geo = new THREE.CapsuleGeometry(1.1, 6.5, 12, 48);
    const mat = makeMat(0x09051a);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(10.2, -3.4, -3.2);
    mesh.rotation.set(0.25, 0, -0.6);
    forms.push({ mesh, axis: new THREE.Vector3(0.1, 1, 0).normalize(), speed: 0.1, base: mesh.quaternion.clone() });
    group.add(mesh);
    disposables.push(geo, mat);
  }

  // ---------- sizing ----------
  function size() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isPhone() ? 1 : 1.5));
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    // keep the horizontal field roughly constant so portrait phones still see the crossing
    const baseAspect = 1.6;
    const vFov = 36;
    const hTan = Math.tan(THREE.MathUtils.degToRad(vFov / 2)) * baseAspect;
    const wanted = 2 * THREE.MathUtils.radToDeg(Math.atan(hTan / Math.max(aspect, 0.42)));
    camera.fov = THREE.MathUtils.clamp(wanted * (aspect < 1 ? 0.78 : 1), vFov, 78);
    camera.updateProjectionMatrix();
  }
  size();

  // ---------- state ----------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scroll = 0;              // 0 at top, 1 when hero fully scrolled out
  let externalScroll = false;
  let running = false, raf = 0, disposed = false;
  let inView = true, tabVisible = !document.hidden;
  const clock = new THREE.Clock(false);
  const startAt = performance.now();
  let t = 0;
  const q = new THREE.Quaternion();

  function readScroll() {
    if (externalScroll) return;
    const el = o.scrollElement || canvas.parentElement || canvas;
    const h = el.offsetHeight || window.innerHeight;
    scroll = Math.max(0, window.scrollY / Math.max(h, 1));
  }

  function update(dt) {
    t += dt;
    for (const f of forms) {
      q.setFromAxisAngle(f.axis, t * f.speed);
      f.mesh.quaternion.copy(f.base).premultiply(q);
    }
    const breathe = Math.sin((t / 9) * Math.PI * 2);
    group.scale.setScalar(1 + breathe * 0.012);
    group.rotation.z = breathe * 0.012 + Math.sin(t * 0.07) * 0.01;
    group.position.x = Math.sin(t * 0.05) * 0.25;

    // camera: mouse parallax (lerped) + scroll dolly
    const k = 1 - Math.pow(0.001, dt);          // framerate-independent lerp (~0.1 at 60fps)
    mouse.x += (mouse.tx - mouse.x) * k;
    mouse.y += (mouse.ty - mouse.y) * k;
    rig.rotation.y = -mouse.x * o.parallaxX + Math.sin(t * 0.06) * 0.015;
    rig.rotation.x = -mouse.y * o.parallaxY + Math.cos(t * 0.045) * 0.01;
    const s = Math.min(scroll, 1.4);
    rig.position.y = -s * 2.2;
    camera.position.z = 16 + s * 1.5;
    applyFade();
  }

  function applyFade() {
    if (!o.scrollFade) return;
    const s = Math.min(scroll, 1.4);
    const intro = reduced ? 1 : THREE.MathUtils.smoothstep((performance.now() - startAt) / 1000, 0.05, 1.3); // fade in on load
    const out = THREE.MathUtils.clamp(1 - (s - 0.1) / 1.1, 0, 1);
    canvas.style.opacity = (intro * out).toFixed(3);
  }

  function render() { renderer.render(scene, camera); }

  function frame() {
    raf = 0;
    if (!running || disposed) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    readScroll();
    update(dt);
    render();
    raf = requestAnimationFrame(frame);
  }

  function setRunning(on) {
    on = on && !reduced && !disposed;
    if (on === running) return;
    running = on;
    if (on) { clock.start(); clock.getDelta(); if (!raf) raf = requestAnimationFrame(frame); }
    else { clock.stop(); if (raf) cancelAnimationFrame(raf); raf = 0; }
  }
  const evaluate = () => setRunning(inView && tabVisible && scroll < 1.5);

  // ---------- events ----------
  const listeners = [];
  const on = (target, type, fn, options) => { target.addEventListener(type, fn, options); listeners.push([target, type, fn, options]); };

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { size(); if (reduced || !running) { readScroll(); update(0); render(); } }, 150);
  };
  on(window, 'resize', onResize);
  on(window, 'orientationchange', onResize);

  if (finePointer && !reduced) {
    on(window, 'pointermove', (e) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    on(document, 'mouseleave', () => { mouse.tx = 0; mouse.ty = 0; });
  }

  on(document, 'visibilitychange', () => { tabVisible = !document.hidden; evaluate(); });
  on(window, 'scroll', () => { if (!externalScroll) { readScroll(); evaluate(); if (!running) applyFade(); } }, { passive: true });

  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => { inView = entries.some((e) => e.isIntersecting); evaluate(); }, { threshold: 0 });
    io.observe(canvas);
  }

  on(canvas, 'webglcontextlost', (e) => { e.preventDefault(); setRunning(false); });
  on(canvas, 'webglcontextrestored', () => { evaluate(); if (reduced) render(); });

  function dispose() {
    if (disposed) return;
    disposed = true;
    setRunning(false);
    clearTimeout(resizeTimer);
    listeners.forEach(([tg, ty, fn, op]) => tg.removeEventListener(ty, fn, op));
    if (io) io.disconnect();
    disposables.forEach((d) => d.dispose && d.dispose());
    envRT.dispose();
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (_) { /* ignore */ }
  }
  on(window, 'pagehide', dispose, { once: true });

  // ---------- go ----------
  readScroll();
  update(0);
  render();                       // first frame synchronously (also the only frame under reduced motion)
  canvas.dataset.heroReady = '1';
  if (!reduced) evaluate();

  const controller = {
    setScroll(progress) { externalScroll = true; scroll = Math.max(0, +progress || 0); evaluate(); if (!running) applyFade(); },
    pause() { inView = false; evaluate(); },
    resume() { inView = true; evaluate(); },
    renderOnce() { update(0); render(); },
    dispose,
    get running() { return running; },
    three: { renderer, scene, camera, group }
  };
  canvas.__hero = controller;
  return controller;
}

// Auto-init when the page carries the hero canvas.
function autoInit() {
  const canvas = document.getElementById('hero-canvas');
  if (canvas && !canvas.__hero) initHero(canvas).catch((err) => { console.warn('[hero] init failed', err); fallback(canvas); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit, { once: true });
else autoInit();
