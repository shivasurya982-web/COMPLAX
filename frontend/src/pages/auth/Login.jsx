import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';
import Logo from '../../components/Logo';

/* ------------------------------------------------------------------ */
/*  3D scene: an animated human character (changes with role)         */
/*  - USER          -> casual hoodie, holding a complaint form         */
/*  - ORGANIZATION  -> business suit + tie, holding an admin tablet    */
/*  - waves, blinks, looks at your cursor, nods while signing in,      */
/*    shakes head when login fails; drag to rotate                      */
/* ------------------------------------------------------------------ */
const loadThree = (onReady) => {
  if (window.THREE) { onReady(); return; }
  const add = (src, onFail) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = onReady;
    s.onerror = onFail || (() => {});
    document.body.appendChild(s);
  };
  add('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    () => add('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'));
};

const Login3D = ({ role, submitting, failed }) => {
  const canvasRef = useRef(null);
  const state = useRef({ role, submitting, failed });

  useEffect(() => { state.current = { role, submitting, failed }; }, [role, submitting, failed]);

  useEffect(() => {
    let active = true;
    let cleanup = () => {};

    const init = () => {
      const cv = canvasRef.current;
      if (!active || !cv || !window.THREE) return;
      const THREE = window.THREE;
      const O = 0xE06D43, P = 0x6B46C1, GR = 0x34d399;

      const M = (c, e, m, r) => new THREE.MeshStandardMaterial({ color: c, emissive: e || 0, metalness: m == null ? .1 : m, roughness: r == null ? .6 : r });
      const add = (p, g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
      const tex = (c) => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; };
      // limb hanging down from its pivot (top at origin)
      const limb = (p, r0, r1, len, mat, x, y, z) => { const g = new THREE.CylinderGeometry(r0, r1, len, 20); g.translate(0, -len / 2, 0); return add(p, g, mat, x, y, z); };

      const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      R.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      R.outputEncoding = THREE.sRGBEncoding;
      R.toneMapping = THREE.NoToneMapping;
      R.shadowMap.enabled = true;
      R.shadowMap.type = THREE.PCFSoftShadowMap;

      const S = new THREE.Scene();
      const C = new THREE.PerspectiveCamera(42, 1, .1, 100);
      C.position.set(0, 1.2, 12.5); C.lookAt(0, .6, 0);

      const ec = document.createElement('canvas'); ec.width = 512; ec.height = 256;
      const ex = ec.getContext('2d'); const gr = ex.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#3a4a7a'); gr.addColorStop(.55, '#4a3f5c'); gr.addColorStop(1, '#14101c');
      ex.fillStyle = gr; ex.fillRect(0, 0, 512, 256);
      [[40, 50, 120, 60, '#ffd9bd'], [300, 40, 130, 50, '#d2c6ff'], [200, 110, 90, 30, '#ffffff'], [430, 90, 60, 80, '#ffb08a']].forEach((b) => { ex.fillStyle = b[4]; ex.fillRect(b[0], b[1], b[2], b[3]); });
      const et = new THREE.CanvasTexture(ec); et.mapping = THREE.EquirectangularReflectionMapping; et.encoding = THREE.sRGBEncoding;
      const pm = new THREE.PMREMGenerator(R);
      S.environment = pm.fromEquirectangular(et).texture;

      S.add(new THREE.AmbientLight(0xffffff, .55));
      const k = new THREE.DirectionalLight(0xffffff, 1.5); k.position.set(5, 11, 9); k.castShadow = true; k.shadow.mapSize.set(1024, 1024);
      const sc = k.shadow.camera; sc.left = sc.bottom = -8; sc.right = sc.top = 8; sc.near = 1; sc.far = 40; k.shadow.bias = -.0006; S.add(k);
      const a = new THREE.PointLight(O, 1.3, 60); a.position.set(-6, 3, 7); S.add(a);
      const fillL = new THREE.PointLight(0xffffff, .9, 60); fillL.position.set(0, 3, 12); S.add(fillL);
      const b = new THREE.PointLight(P, 1.6, 60); b.position.set(7, 1, -5); S.add(b);

      const G = new THREE.Group(); S.add(G);

      // platform
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: .5 }));
      fl.rotation.x = -Math.PI / 2; fl.position.y = -2.62; fl.receiveShadow = true; G.add(fl);
      add(G, new THREE.CylinderGeometry(3.6, 3.8, .22, 64), M(0x2b2b3a, 0, .5, .4), 0, -2.5, 0);
      const rim = add(G, new THREE.TorusGeometry(3.62, .05, 10, 80), M(O, 0x5a2410, .6, .3), 0, -2.39, 0); rim.rotation.x = Math.PI / 2;

      // ---------------- the human: a boy, vivid clothing colours ----------------
      const ch = new THREE.Group(); ch.position.y = -2.38; ch.scale.setScalar(1.02); G.add(ch);
      const skin = new THREE.MeshPhysicalMaterial({ color: 0xdc9a6e, emissive: 0x1a0a04, roughness: .55, metalness: 0, clearcoat: .1, clearcoatRoughness: .6 });
      const hairM = M(0x2a1a10, 0x0a0503, .2, .45);
      const cloth = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: .8, metalness: 0, side: THREE.DoubleSide });
      const upper = cloth(0xFF5A1F), lower = cloth(0x1D6BFF), shoe = M(0xffffff, 0, .1, .5);
      const white = M(0xffffff, 0, 0, .5);

      [-1, 1].forEach((s) => {
        const hip = new THREE.Group(); hip.position.set(s * .26, 1.5, 0); ch.add(hip);
        limb(hip, .25, .2, .78, lower);
        const kn = new THREE.Group(); kn.position.y = -.78; hip.add(kn);
        add(kn, new THREE.SphereGeometry(.2, 16, 12), lower, 0, 0, 0);
        limb(kn, .2, .16, .72, lower);
        add(kn, new THREE.BoxGeometry(.38, .07, .7), white, 0, -.69, .1);
        add(kn, new THREE.BoxGeometry(.35, .15, .52), shoe, 0, -.6, .06);
        add(kn, new THREE.SphereGeometry(.18, 16, 12), shoe, 0, -.62, .35).scale.set(1, .7, 1);
        add(kn, new THREE.BoxGeometry(.365, .04, .22), M(O, 0x3a1508, 0, .6), 0, -.64, .1);
      });
      add(ch, new THREE.CylinderGeometry(.5, .47, .42, 32), lower, 0, 1.6, 0).scale.z = .68;
      const tp = [[.47, 0], [.44, .3], [.43, .55], [.48, .85], [.56, 1.12], [.53, 1.36], [.32, 1.47], [.19, 1.52]].map((p) => new THREE.Vector2(p[0], p[1]));
      const torso = add(ch, new THREE.LatheGeometry(tp, 40), upper, 0, 1.62, 0); torso.scale.z = .62;
      add(ch, new THREE.CylinderGeometry(.19, .22, .42, 20), skin, 0, 3.2, 0);

      const mkHand = (par, s) => {
        const hd = new THREE.Group(); hd.position.set(0, -.66, 0); par.add(hd);
        add(hd, new THREE.SphereGeometry(.13, 18, 14), skin, 0, -.07, 0).scale.set(1.1, 1.15, .55);
        const fingers = [];
        [-.08, -.027, .027, .08].forEach((fx, i) => {
          const f = new THREE.Group(); f.position.set(fx, -.15, 0); hd.add(f);
          limb(f, .029, .025, .12 + (i === 1 || i === 2 ? .02 : 0), skin);
          const f2 = new THREE.Group(); f2.position.y = -.13; f.add(f2); limb(f2, .025, .02, .1, skin);
          add(f2, new THREE.SphereGeometry(.02, 8, 8), skin, 0, -.1, 0);
          fingers.push([f, f2]);
        });
        const th = new THREE.Group(); th.position.set(-s * .11, -.07, .03); th.rotation.z = s * .7; hd.add(th); limb(th, .033, .027, .13, skin);
        return { hd, fingers };
      };
      const mkArm = (s) => {
        const sh = new THREE.Group(); sh.position.set(s * .7, 2.95, 0); ch.add(sh);
        add(sh, new THREE.SphereGeometry(.24, 20, 16), upper, 0, 0, 0);
        limb(sh, .17, .145, .72, upper);
        const el = new THREE.Group(); el.position.y = -.72; sh.add(el);
        add(el, new THREE.SphereGeometry(.145, 14, 12), upper, 0, 0, 0);
        limb(el, .145, .115, .62, upper);
        const hand = mkHand(el, s);
        return { sh, el, fingers: hand.fingers };
      };
      const rA = mkArm(1), lA = mkArm(-1);
      lA.sh.rotation.z = -.35; lA.el.rotation.x = -1.3;
      lA.fingers.forEach((f) => { f[0].rotation.x = -.5; f[1].rotation.x = -.7; });

      const head = new THREE.Group(); head.position.set(0, 3.3, 0); ch.add(head);
      const hg = new THREE.SphereGeometry(.5, 48, 36), hp = hg.attributes.position;
      for (let i = 0; i < hp.count; i++) {
        let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i);
        if (y < 0) { const kk = 1 - .22 * Math.pow(-y / .5, 1.5); x *= kk; z *= (kk * .5 + .5); }
        hp.setXYZ(i, x * .97, y * 1.13, z);
      }
      hg.computeVertexNormals();
      add(head, hg, skin, 0, .58, 0);
      [-1, 1].forEach((s) => add(head, new THREE.SphereGeometry(.095, 12, 10), skin, s * .49, .55, 0).scale.set(.5, 1, .8));
      const nose = add(head, new THREE.ConeGeometry(.07, .21, 14), skin, 0, .53, .5); nose.rotation.x = Math.PI / 2;
      [-1, 1].forEach((s) => add(head, new THREE.SphereGeometry(.018, 8, 8), M(0x5a2418, 0, 0, .8), s * .037, .49, .5));
      add(head, new THREE.SphereGeometry(.05, 16, 12), M(0xb8606a, 0x1a0608, 0, .4), 0, .405, .45).scale.set(1.8, .45, .7);
      add(head, new THREE.SphereGeometry(.05, 16, 12), M(0xc4707a, 0x1a0608, 0, .4), 0, .365, .45).scale.set(1.55, .5, .7);
      const eyes = [];
      [-1, 1].forEach((s) => {
        const eg = new THREE.Group(); eg.position.set(s * .2, .66, .41); head.add(eg);
        add(eg, new THREE.SphereGeometry(.088, 18, 14), M(0xffffff, 0, 0, .2), 0, 0, 0).scale.z = .7;
        add(eg, new THREE.SphereGeometry(.054, 16, 12), M(0x4a2a12, 0x120802, 0, .25), 0, 0, .05);
        add(eg, new THREE.SphereGeometry(.027, 10, 8), M(0x000000, 0, 0, .2), 0, 0, .088);
        const hl = new THREE.Mesh(new THREE.SphereGeometry(.014, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(.02, .02, .1); eg.add(hl);
        add(eg, new THREE.TorusGeometry(.092, .012, 6, 20, Math.PI), M(0x1a0f0a, 0, 0, .6), 0, .005, .03);
        add(head, new THREE.BoxGeometry(.23, .045, .05), hairM, s * .2, .8, .44).rotation.z = -s * .1;
        eyes.push(eg);
      });
      // short boy hair: cap + swept quiff + sideburns
      const hair = add(head, new THREE.SphereGeometry(.535, 36, 28, 0, Math.PI * 2, 0, Math.PI * .55), hairM, 0, .6, -.02);
      hair.scale.set(1.0, 1.14, 1.05); hair.rotation.x = -.28;
      for (let i = -2; i <= 2; i++) { const q = add(head, new THREE.SphereGeometry(.16, 14, 12), hairM, i * .15 + .06, 1.04 - Math.abs(i) * .045, .26); q.scale.set(.9, .85, 1); q.rotation.z = -i * .2; }
      add(head, new THREE.SphereGeometry(.2, 14, 12), hairM, .2, 1.1, .12).scale.set(1.2, .7, 1);
      [-1, 1].forEach((s) => add(head, new THREE.BoxGeometry(.05, .2, .09), hairM, s * .47, .46, .12));

      const userX = new THREE.Group(), orgX = new THREE.Group(); ch.add(userX, orgX);
      const hood = add(userX, new THREE.TorusGeometry(.35, .13, 14, 28), upper, 0, 3.05, -.05); hood.rotation.x = Math.PI / 2 - .35;
      add(userX, new THREE.BoxGeometry(.85, .3, .05), M(0xe0480f, 0, 0, .9), 0, 1.98, .35);
      [-1, 1].forEach((s) => add(userX, new THREE.CylinderGeometry(.013, .013, .55, 8), white, s * .1, 2.78, .34));
      const lapel = M(0x0f2fc0, 0, 0, .7), tieM = M(0xb23cff, 0x2a1060, .1, .5);
      add(orgX, new THREE.BoxGeometry(.52, .75, .04), white, 0, 2.7, .35);
      [-1, 1].forEach((s) => { const lp = add(orgX, new THREE.BoxGeometry(.2, .85, .05), lapel, s * .32, 2.62, .37); lp.rotation.z = -s * .22; });
      add(orgX, new THREE.BoxGeometry(.15, .72, .05), tieM, 0, 2.5, .38);
      add(orgX, new THREE.BoxGeometry(.19, .15, .07), tieM, 0, 2.96, .38);
      add(orgX, new THREE.BoxGeometry(.34, .46, .03), white, .28, 2.15, .39);
      add(orgX, new THREE.BoxGeometry(.34, .09, .035), M(O, 0x3a1508), .28, 2.34, .395);

      // held props: complaint paper (user) / tablet (organization)
      const pc = document.createElement('canvas'); pc.width = 256; pc.height = 340; const px = pc.getContext('2d');
      px.fillStyle = '#f4f1e8'; px.fillRect(0, 0, 256, 340); px.fillStyle = '#E06D43'; px.fillRect(16, 16, 224, 30);
      px.fillStyle = '#fff'; px.font = 'bold 17px Arial'; px.fillText('COMPLAINT FORM', 28, 38);
      for (let y = 70; y < 250; y += 16) { px.fillStyle = '#94A3B8'; px.fillRect(16, y, 120 + Math.random() * 104, 6); }
      px.strokeStyle = '#6B46C1'; px.lineWidth = 4; px.strokeRect(130, 270, 100, 40);
      const paper = add(ch, new THREE.PlaneGeometry(.95, 1.25), new THREE.MeshStandardMaterial({ map: tex(pc), roughness: .9, side: THREE.DoubleSide }), -.94, 2.3, .74);
      paper.rotation.set(-.08, .35, .04);
      const tc = document.createElement('canvas'); tc.width = 256; tc.height = 340; const tx2 = tc.getContext('2d');
      tx2.fillStyle = '#111116'; tx2.fillRect(0, 0, 256, 340); tx2.fillStyle = '#E06D43'; tx2.fillRect(0, 0, 256, 38);
      tx2.fillStyle = '#fff'; tx2.font = 'bold 18px Arial'; tx2.fillText('ORG ADMIN', 14, 26);
      for (let i = 0; i < 4; i++) { tx2.fillStyle = '#1C1C24'; tx2.fillRect(12, 54 + i * 62, 232, 50); tx2.fillStyle = '#94A3B8'; tx2.fillRect(24, 68 + i * 62, 110, 8); tx2.fillStyle = ['#E06D43', '#6B46C1', '#34d399', '#E06D43'][i]; tx2.fillRect(168, 66 + i * 62, 64, 22); }
      const tablet = new THREE.Group(); tablet.position.set(-.94, 2.3, .74); tablet.rotation.set(-.08, .35, .04); ch.add(tablet);
      add(tablet, new THREE.BoxGeometry(.95, 1.25, .05), M(0x15151c, 0, .9, .3));
      const tscr = new THREE.Mesh(new THREE.PlaneGeometry(.85, 1.13), new THREE.MeshBasicMaterial({ map: tex(tc), toneMapped: false })); tscr.position.z = .03; tablet.add(tscr);

      // complaints orbiting around the person
      const sheets = [];
      for (let i = 0; i < 6; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.05), new THREE.MeshStandardMaterial({ map: tex(pc), side: THREE.DoubleSide, roughness: .9 }));
        m.castShadow = true; m.userData = { a: i / 6 * 6.283, y: -.6 + (i % 3) * 1.5, ph: i }; G.add(m); sheets.push(m);
      }

      // speech bubble (always faces the camera)
      const bc = document.createElement('canvas'); bc.width = 512; bc.height = 200; const bx = bc.getContext('2d');
      const bt = tex(bc);
      const bubbleText = {
        USER: ['Hey there!', 'Sign in to track', 'your complaints'],
        SECONDARY_ADMIN: ['Welcome back!', 'Manage your organization', 'complaints here'],
        sub: ['Signing you in...', 'Please wait'],
        err: ['Oops!', 'Check your details', 'and try again']
      };
      let bKey = '';
      const drawBubble = (key) => {
        const ls = bubbleText[key]; bx.clearRect(0, 0, 512, 200);
        bx.fillStyle = key === 'err' ? '#fee2e2' : '#f4f1e8'; bx.beginPath(); bx.moveTo(30, 6); bx.arcTo(506, 6, 506, 170, 30); bx.arcTo(506, 170, 30, 170, 30);
        bx.lineTo(120, 170); bx.lineTo(70, 198); bx.lineTo(80, 170); bx.arcTo(6, 170, 6, 6, 30); bx.arcTo(6, 6, 506, 6, 30); bx.closePath(); bx.fill();
        bx.textAlign = 'center'; ls.forEach((l, i) => { bx.fillStyle = i === 0 ? (key === 'err' ? '#dc2626' : '#E06D43') : '#334155'; bx.font = (i === 0 ? 'bold 38px' : '26px') + ' Arial'; bx.fillText(l, 256, 62 + i * 40); });
        bt.needsUpdate = true; bKey = key;
      };
      const bubble = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.29), new THREE.MeshBasicMaterial({ map: bt, transparent: true, toneMapped: false }));
      bubble.position.set(2.2, 3.6, 2); S.add(bubble);

      // ---------------- interaction ----------------
      let ry = -.2, rx = .05, vy = 0, vx = 0, dr = false, lx = 0, ly = 0, vis = true, w = 0, h = 0, mx = 0, my = 0;
      const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; }); io.observe(cv);
      const down = (e) => { dr = true; lx = e.clientX; ly = e.clientY; if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; };
      const move = (e) => { if (!dr) return; vy = (e.clientX - lx) * .009; vx = (e.clientY - ly) * .009; lx = e.clientX; ly = e.clientY; ry += vy; rx = Math.max(-.5, Math.min(.5, rx + vx)); };
      const up = () => { dr = false; cv.style.cursor = 'grab'; };
      const gmove = (e) => { const r = cv.getBoundingClientRect(); mx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2))); my = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 3)) / (window.innerHeight / 2))); };
      cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move);
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); window.addEventListener('pointermove', gmove);

      const tgt = {
        USER: { u: new THREE.Color(0xFF5A1F), l: new THREE.Color(0x1D6BFF), s: new THREE.Color(0xffffff) },
        SECONDARY_ADMIN: { u: new THREE.Color(0x1747E8), l: new THREE.Color(0x14204f), s: new THREE.Color(0x23232e) }
      };
      let lastRole = '', popT = -10, lastFail = false, failT = -10, raf = 0, hy = 0, hx = 0;
      const t0 = performance.now();
      const loop = () => {
        if (!active) return;
        raf = requestAnimationFrame(loop);
        if (!vis) return;
        const t = (performance.now() - t0) / 1000;
        if (cv.clientWidth !== w || cv.clientHeight !== h) {
          w = cv.clientWidth; h = cv.clientHeight; R.setSize(w, h, false); C.aspect = w / h; C.updateProjectionMatrix();
        }
        if (!dr) { ry += vy; rx = Math.max(-.5, Math.min(.5, rx + vx)); vy *= .94; vx *= .94; }
        G.rotation.y = ry; G.rotation.x = rx;

        const st = state.current, isUser = st.role === 'USER';
        if (st.role !== lastRole) { lastRole = st.role; popT = t; userX.visible = paper.visible = isUser; orgX.visible = tablet.visible = !isUser; }
        if (st.failed && !lastFail) failT = t; lastFail = st.failed;
        const T = tgt[st.role] || tgt.USER;
        upper.color.lerp(T.u, .1); lower.color.lerp(T.l, .1); shoe.color.lerp(T.s, .1);
        const pk = (t - popT) / .5; ch.scale.setScalar(1.02 * (pk < 1 ? 1 + Math.sin(pk * Math.PI) * .05 : 1));

        // life: breathing, blinking, waving, looking at the cursor
        torso.scale.y = 1 + Math.sin(t * 1.8) * .012;
        const bl = t % 4.2; const bs = bl < .14 ? Math.max(.08, Math.abs(bl - .07) / .07) : 1; eyes.forEach((e) => { e.scale.y = bs; });
        rA.sh.rotation.z = 2.45 + Math.sin(t * 1.5) * .05; rA.el.rotation.z = .5 + Math.sin(t * 7) * .4;
        lA.sh.rotation.z = -.35 + Math.sin(t * 1.8) * .01;
        hy += (mx * .55 - hy) * .08; hx += (my * .3 - hx) * .08;
        const fk = t - failT, fd = fk < .9 ? 1 - fk / .9 : 0;
        head.rotation.y = hy + Math.sin(t * 16) * .35 * fd;
        head.rotation.x = hx + (st.submitting ? Math.sin(t * 6) * .12 : 0);
        rA.fingers.forEach((f, i) => { f[0].rotation.z = (i - 1.5) * .14 + Math.sin(t * 7 + i) * .05; });
        ch.rotation.y = Math.sin(t * .6) * .07;

        sheets.forEach((s) => { const d = s.userData, an = d.a + t * .35; s.position.set(Math.cos(an) * 3.1, d.y + Math.sin(t + d.ph) * .25, Math.sin(an) * 3.1); s.rotation.set(.3, -an + 1.2, Math.sin(t + d.ph) * .3); });

        const key = st.submitting ? 'sub' : (fd > 0 || st.failed ? 'err' : st.role);
        if (key !== bKey) drawBubble(key);
        bubble.position.y = 3.6 + Math.sin(t * 1.5) * .08;

        R.render(S, C);
      };
      drawBubble('USER');
      loop();

      cleanup = () => {
        cancelAnimationFrame(raf); io.disconnect();
        cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move);
        cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up);
        window.removeEventListener('pointermove', gmove);
        R.dispose();
      };
    };

    loadThree(() => { if (active) init(); });
    return () => { active = false; cleanup(); };
  }, []);

  return (
    <div className="login-stage">
      <canvas ref={canvasRef} className="login-gl" />
    </div>
  );
};

const Login = () => {
  const [role, setRole] = useState('USER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'MAIN_ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'SECONDARY_ADMIN') {
        navigate('/secondary-admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await api.post('/auth/login', { email, password, requestedRole: role });
      login(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (authLoading || (isAuthenticated && user)) {
    return null;
  }

  return (
    <div className="auth-wrapper">
      <style>{`
        .login-split { display: flex; align-items: center; justify-content: center; gap: 40px; width: 100%; max-width: 1100px; margin: 0 auto; padding: 20px; }
        .login-stage { flex: 1 1 460px; min-width: 320px; height: min(580px, 78vh); border-radius: 24px; background: linear-gradient(160deg, rgba(33,33,43,.7), rgba(15,15,20,.4)); border: 1px solid rgba(255,255,255,.08); }
        .login-gl { width: 100%; height: 100%; display: block; cursor: grab; touch-action: pan-y; border-radius: inherit; }
        .login-card-wrap { flex: 0 1 440px; width: 100%; }
        @media (max-width: 900px) { .login-stage { display: none; } .login-split { padding: 0; } }
      `}</style>

      <div className="login-split">
        <Login3D role={role} submitting={submitting} failed={!!error} />

        <div className="login-card-wrap">
          <div className="card auth-card animate-fade">
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '1.25rem',
                padding: '6px 10px',
                borderRadius: '8px',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <Logo height={42} showTagline={true} />
              </div>
            </div>

            <div className="role-selector">
              <button
                className={`role-btn ${role === 'USER' ? 'active' : ''}`}
                onClick={() => setRole('USER')}
              >
                USER
              </button>
              <button
                className={`role-btn ${role === 'SECONDARY_ADMIN' ? 'active' : ''}`}
                onClick={() => setRole('SECONDARY_ADMIN')}
              >
                ORGANIZATION
              </button>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                textAlign: 'center',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: '48px' }}
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    style={{ paddingLeft: '48px', paddingRight: '48px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
                {submitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {role === 'USER' ? (
                <span>New user? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Create an account</Link></span>
              ) : (
                <span>New organization? <Link to="/register-org" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Register organization</Link></span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
