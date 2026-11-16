/* hero.js — Three.js hero for jakecushway.ca
 * Glossy near-black inflated tubes with indigo reflections, in the spirit of metalab.com.
 * Moving the pointer over it throws off beams of light (see createCursorBeams).
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

/* Cursor beams: streaks of light that shoot away from the pointer as it moves, and a small
 * light that follows it so the glossy tubes pick up a moving highlight. A click or tap fires
 * a ring of beams. Each beam is one instance of a ribbon strip, and its whole flight is worked
 * out in the vertex shader from a few spawn values, so the CPU only writes data when a beam
 * is born. `on` is the hero's listener helper, so everything is removed on dispose. */
function createCursorBeams(THREE, { scene, camera, canvas, on, max = 260, segments = 10 }) {
  const FRONT = 0.12;        // strip length ahead of the head, used for the round flare
  const PLANE_Z = 4;         // the pointer sits on this plane, just in front of the tubes
  const SPACING = 0.15;      // world units of pointer travel per beam
  const MAX_PER_FRAME = 8;

  // Base strip. x: -FRONT ahead of the head, 0 at the head, 1 at the tail. y: side (-1 / +1).
  const us = [-FRONT];
  for (let i = 0; i <= segments; i++) us.push(i / segments);
  const strip = new Float32Array(us.length * 6);
  const index = [];
  us.forEach((u, i) => {
    strip.set([u, -1, 0, u, 1, 0], i * 6);
    if (i < us.length - 1) { const a = i * 2; index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(strip, 3));
  geo.setIndex(index);
  geo.instanceCount = max;
  const attr = (name, size) => {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(max * size), size);
    a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute(name, a);
    return a;
  };
  const aOrigin = attr('iOrigin', 3), aDir = attr('iDir', 3), aBend = attr('iBend', 3);
  const aA = attr('iA', 4);  // birth time, life, launch speed, curvature
  const aB = attr('iB', 4);  // half width, colour seed, trail duration, drag
  for (let i = 0; i < max; i++) { aDir.setXYZ(i, 1, 0, 0); aBend.setXYZ(i, 0, 1, 0); aA.setXYZW(i, -1e4, 0.1, 1, 0.1); aB.setXYZW(i, 0.1, 0, 0.1, 1); }

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAspect: { value: 1 }, uOpacity: { value: 1 } },
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 iOrigin; attribute vec3 iDir; attribute vec3 iBend; attribute vec4 iA; attribute vec4 iB;
      uniform float uTime; uniform float uAspect;
      varying float vU; varying float vSide; varying float vFade; varying float vSeed;
      const float FRONT = ${FRONT.toFixed(2)};
      void main() {
        float u = position.x, side = position.y;
        float life = iA.y, k = iA.w, halfW = iB.x, trail = iB.z, drag = iB.w;
        float age = uTime - iA.x;
        float alive = step(0.0, age) * step(age, life + trail);
        // The head flies for "life" seconds and slows with drag; the tail follows "trail" seconds
        // behind and catches up at the end, so a beam grows out of the pointer and retracts.
        float tt = clamp(age - max(u, 0.0) * trail, 0.0, life);
        float s = iA.z * (1.0 - exp(-drag * tt)) / drag;
        float ks = k * s;
        vec3 p = iOrigin + iDir * (sin(ks) / k) + iBend * ((1.0 - cos(ks)) / k);   // arc of curvature k
        vec3 tang = normalize(iDir * cos(ks) + iBend * sin(ks));
        p += tang * (max(-u, 0.0) / FRONT) * halfW;
        float w = halfW * (0.3 + 0.7 * pow(1.0 - clamp(u, 0.0, 1.0), 1.4));
        // widen the strip in screen space, at right angles to its direction of travel
        vec4 c0 = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        vec4 c1 = projectionMatrix * modelViewMatrix * vec4(p + tang * 0.05, 1.0);
        vec2 d2 = (c1.xy / c1.w - c0.xy / c0.w) * vec2(uAspect, 1.0);
        float len = length(d2);
        vec2 dir2 = len > 1e-6 ? d2 / len : vec2(1.0, 0.0);
        vec2 off = vec2(-dir2.y, dir2.x) * w * projectionMatrix[1][1] * side;
        off.x /= uAspect;
        c0.xy += off;
        gl_Position = mix(vec4(2.0, 2.0, 2.0, 1.0), c0, alive);   // dead beams sit outside the view
        vU = u; vSide = side; vSeed = iB.y;
        vFade = smoothstep(0.0, 0.05, age) * (1.0 - smoothstep(life * 0.6, life + trail, age));
      }`,
    fragmentShader: /* glsl */`
      uniform float uOpacity;
      varying float vU; varying float vSide; varying float vFade; varying float vSeed;
      const float FRONT = ${FRONT.toFixed(2)};
      vec3 palette(float s) {
        if (s < 0.45) return vec3(0.35, 0.30, 1.00);   // indigo (site accent)
        if (s < 0.75) return vec3(0.68, 0.60, 1.00);   // lilac
        if (s < 0.90) return vec3(0.42, 0.78, 1.00);   // ice blue
        return vec3(1.00, 0.50, 0.78);                 // the odd rose one
      }
      void main() {
        float d = abs(vSide);
        float along = clamp(vU, 0.0, 1.0);
        float front = clamp(-vU / FRONT, 0.0, 1.0);
        float r = length(vec2(front, d));
        float tail = pow(1.0 - along, 1.8);
        float head = exp(-along * 22.0);
        float core = (1.0 - smoothstep(0.05, 0.2, d)) * (1.0 - smoothstep(0.0, 0.25, front));
        float halo = exp(-r * r * 9.0);
        vec3 tint = palette(vSeed);
        vec3 col = tint * (core * tail * 1.35 + halo * (0.14 * tail + 0.8 * head))
                 + vec3(1.0) * core * (0.9 * head + 0.28 * tail);
        col *= 1.0 - smoothstep(0.85, 1.0, r);
        gl_FragColor = vec4(col * vFade * uOpacity, 1.0);
      }`
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  scene.add(mesh);

  // Light and soft glow that ride with the pointer
  const light = new THREE.PointLight(0x8f84ff, 0, 15, 2);
  light.position.set(0, 0, PLANE_Z);
  scene.add(light);
  const gc = document.createElement('canvas');
  gc.width = gc.height = 128;
  const g2 = gc.getContext('2d');
  const grad = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,255,255,.42)');
  grad.addColorStop(0.5, 'rgba(255,255,255,.1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g2.fillStyle = grad;
  g2.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(gc);
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0x7468ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
  const glow = new THREE.Sprite(glowMat);
  glow.position.copy(light.position);
  scene.add(glow);

  // ---- spawning ----
  const rand = (a, b) => a + Math.random() * (b - a);
  const vD = new THREE.Vector3(), vN = new THREE.Vector3(), vAxis = new THREE.Vector3();
  let next = 0, dirty = false;
  function spawn(origin, dir, birth, energy) {
    const i = next;
    next = (next + 1) % max;
    vD.copy(dir).normalize();
    vAxis.set(rand(-0.3, 0.3), rand(-0.3, 0.3), Math.random() < 0.5 ? 1 : -1);   // bend mostly within the screen plane
    vN.crossVectors(vD, vAxis);
    if (vN.lengthSq() < 1e-6) vN.set(0, 1, 0);
    vN.normalize();
    aOrigin.setXYZ(i, origin.x, origin.y, origin.z);
    aDir.setXYZ(i, vD.x, vD.y, vD.z);
    aBend.setXYZ(i, vN.x, vN.y, vN.z);
    aA.setXYZW(i, birth, rand(0.8, 1.45), rand(4.2, 9.5) * energy, rand(0.03, 0.2));
    aB.setXYZW(i, rand(0.09, 0.17), Math.random(), rand(0.13, 0.24), rand(1.8, 2.6));
    dirty = true;
  }

  // ---- pointer ----
  const ptr = { x: 0, y: 0, active: false };
  let wantBurst = false;
  const blocked = (el) => !!(el && el.closest && el.closest('.overlay, .panel, .backdrop, .drawer'));
  on(window, 'pointermove', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = !blocked(e.target); }, { passive: true });
  on(window, 'pointerdown', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = !blocked(e.target); wantBurst = ptr.active; }, { passive: true });
  const release = (e) => { if (e.pointerType !== 'mouse') ptr.active = false; };   // a finger lifts; a mouse stays put
  on(window, 'pointerup', release, { passive: true });
  on(window, 'pointercancel', release, { passive: true });
  on(document, 'mouseleave', () => { ptr.active = false; });
  on(window, 'blur', () => { ptr.active = false; });

  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -PLANE_Z);
  const ndc = new THREE.Vector2();
  const cur = new THREE.Vector3(), prev = new THREE.Vector3(), origin = new THREE.Vector3(), dir = new THREE.Vector3(), motion = new THREE.Vector3();
  let hasPrev = false, carry = 0, speed = 0;

  function burst(now, count = 16) {
    const a0 = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const a = a0 + ((i + rand(-0.3, 0.3)) / count) * Math.PI * 2;
      dir.set(Math.cos(a), Math.sin(a), rand(-0.45, 0.2));
      spawn(cur, dir, now, rand(1.0, 1.5));
    }
  }

  function update(dt, now) {
    mat.uniforms.uTime.value = now;
    mat.uniforms.uAspect.value = camera.aspect;

    let inside = false;
    if (ptr.active) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && ptr.x >= rect.left && ptr.x <= rect.right && ptr.y >= rect.top && ptr.y <= rect.bottom) {
        ndc.set(((ptr.x - rect.left) / rect.width) * 2 - 1, -((ptr.y - rect.top) / rect.height) * 2 + 1);
        camera.updateWorldMatrix(true, false);
        ray.setFromCamera(ndc, camera);
        inside = !!ray.ray.intersectPlane(plane, cur);
      }
    }

    speed *= Math.pow(0.03, dt);   // settles to rest within about a second of the pointer stopping
    if (inside && dt > 0) {
      if (!hasPrev) { prev.copy(cur); hasPrev = true; carry = 0; }
      const dist = cur.distanceTo(prev);
      if (dist > 7) prev.copy(cur);   // the pointer left and came back somewhere else
      else if (dist > 1e-4) {
        const v = dist / Math.max(dt, 1 / 240);
        speed = Math.max(speed, Math.min(v, 30));
        const energy = THREE.MathUtils.clamp(v / 12, 0.75, 1.5);   // slow drifts still throw visible beams
        motion.subVectors(cur, prev).divideScalar(dist);
        let d = SPACING - carry, n = 0;
        while (d <= dist && n < MAX_PER_FRAME) {
          const f = d / dist;
          origin.lerpVectors(prev, cur, f);
          const a = Math.random() * Math.PI * 2;
          dir.set(Math.cos(a), Math.sin(a), 0).addScaledVector(motion, 0.4);
          dir.z = rand(-0.5, 0.2);
          spawn(origin, dir, now - dt * (1 - f), energy * rand(0.75, 1.15));
          d += SPACING; n++;
        }
        carry = n === MAX_PER_FRAME ? 0 : dist - (d - SPACING);
        prev.copy(cur);
      }
      if (wantBurst) burst(now);
    } else if (!inside) hasPrev = false;
    wantBurst = false;

    // the light eases after the pointer and flares with its speed
    const moving = inside ? Math.min(speed / 9, 1) : 0;
    const k = dt > 0 ? 1 - Math.pow(0.0004, dt) : 1;
    if (inside) { light.position.lerp(cur, k); glow.position.copy(light.position); }
    const ease = dt > 0 ? 1 - Math.pow(0.02, dt) : 0;
    light.intensity += ((inside ? 9 + moving * 32 : 0) - light.intensity) * ease;
    glowMat.opacity += ((inside ? 0.1 + moving * 0.3 : 0) - glowMat.opacity) * ease;
    glow.scale.setScalar(1.5 + moving * 1.3);

    if (dirty) { aOrigin.needsUpdate = aDir.needsUpdate = aBend.needsUpdate = aA.needsUpdate = aB.needsUpdate = true; dirty = false; }
  }

  return {
    update, light, glow, mesh,
    dispose() { scene.remove(mesh, light, glow); geo.dispose(); mat.dispose(); glowTex.dispose(); glowMat.dispose(); }
  };
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
  let beams = null;            // cursor light beams; left out under reduced motion

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
    if (beams) beams.update(dt, t);
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
  if (!reduced) beams = createCursorBeams(THREE, { scene, camera, canvas, on });
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
    if (beams) beams.dispose();
    disposables.forEach((d) => d.dispose && d.dispose());
    envRT.dispose();
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (_) { /* ignore */ }
  }
  // Back/forward cache: a persisted page comes back with this same instance, so only pause it.
  on(window, 'pagehide', (e) => { if (e.persisted) setRunning(false); else dispose(); });
  on(window, 'pageshow', (e) => { if (e.persisted && !disposed) { evaluate(); if (reduced) render(); } });

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
    three: { renderer, scene, camera, group, beams }
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
