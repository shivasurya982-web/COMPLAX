import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Eye, EyeOff, User, Building, Mail, Phone, MapPin, Lock, FileUp, Zap, CheckCircle, ArrowLeft } from 'lucide-react';
import Logo from '../../components/Logo';

/* ------------------------------------------------------------------ */
/*  3D scene: the organization's COMPLAINT DESK                        */
/*  - the monitor shows the org name / category you type, and a        */
/*    registration checklist that ticks off as you fill each field     */
/*  - the complaint INBOX tray fills with complaint papers as you go   */
/*  - complaints keep flying into the inbox                            */
/*  - pressing Register: the stamp stamps "PENDING APPROVAL"           */
/*  - uploading the CSV dataset puts a CSV folder on the desk          */
/*  - drag to rotate                                                   */
/* ------------------------------------------------------------------ */
import { loadThree } from '../../utils/threeLoader';


const CHECKS = ['Owner name', 'Organization name', 'Category', 'Admin email', 'Phone', 'Address', 'Password', 'Confirm password'];

const OrgScene = ({ filled, orgName, category, hasData, submitting, failed }) => {
  const canvasRef = useRef(null);
  const state = useRef({ filled, orgName, category, hasData, submitting, failed });
  useEffect(() => { state.current = { filled, orgName, category, hasData, submitting, failed }; });

  useEffect(() => {
    let active = true;
    let cleanup = () => {};

    const init = () => {
      const cv = canvasRef.current;
      if (!active || !cv || !window.THREE) return;
      const THREE = window.THREE;
      const O = 0xE06D43, P = 0x6B46C1;

      const M = (c, e, m, r) => new THREE.MeshStandardMaterial({ color: c, emissive: e || 0, metalness: m == null ? .1 : m, roughness: r == null ? .6 : r });
      const add = (p, g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
      const tex = (c) => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; };

      const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      R.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      R.outputEncoding = THREE.sRGBEncoding;
      R.toneMapping = THREE.NoToneMapping;
      R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;

      const S = new THREE.Scene();
      const C = new THREE.PerspectiveCamera(42, 1, .1, 100);
      C.position.set(0, 5.6, 15); C.lookAt(0, 2.0, 0);

      const ec = document.createElement('canvas'); ec.width = 512; ec.height = 256;
      const ex = ec.getContext('2d'); const gr = ex.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#3a4a7a'); gr.addColorStop(.55, '#4a3f5c'); gr.addColorStop(1, '#14101c');
      ex.fillStyle = gr; ex.fillRect(0, 0, 512, 256);
      [[40, 50, 120, 60, '#ffd9bd'], [300, 40, 130, 50, '#d2c6ff'], [200, 110, 90, 30, '#ffffff'], [430, 90, 60, 80, '#ffb08a']].forEach((b) => { ex.fillStyle = b[4]; ex.fillRect(b[0], b[1], b[2], b[3]); });
      const et = new THREE.CanvasTexture(ec); et.mapping = THREE.EquirectangularReflectionMapping; et.encoding = THREE.sRGBEncoding;
      S.environment = new THREE.PMREMGenerator(R).fromEquirectangular(et).texture;
      S.add(new THREE.AmbientLight(0xffffff, .6));
      const k = new THREE.DirectionalLight(0xffffff, 1.5); k.position.set(5, 13, 9); k.castShadow = true; k.shadow.mapSize.set(1024, 1024);
      const sc = k.shadow.camera; sc.left = sc.bottom = -9; sc.right = sc.top = 9; sc.near = 1; sc.far = 40; k.shadow.bias = -.0006; S.add(k);
      const a = new THREE.PointLight(O, 1.3, 60); a.position.set(-7, 4, 8); S.add(a);
      const b = new THREE.PointLight(P, 1.5, 60); b.position.set(7, 3, -6); S.add(b);
      const fillL = new THREE.PointLight(0xffffff, .8, 60); fillL.position.set(0, 4, 14); S.add(fillL);

      const G = new THREE.Group(); S.add(G);

      // platform + desk
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.ShadowMaterial({ opacity: .5 })); fl.rotation.x = -Math.PI / 2; fl.position.y = -.26; fl.receiveShadow = true; G.add(fl);
      add(G, new THREE.CylinderGeometry(5, 5.2, .24, 64), M(0x2b2b3a, 0, .5, .4), 0, -.12, 0);
      const rim = add(G, new THREE.TorusGeometry(5.02, .05, 10, 80), M(O, 0x5a2410, .6, .3), 0, 0, 0); rim.rotation.x = Math.PI / 2;
      const DT = 1.2; // desk top height
      add(G, new THREE.BoxGeometry(6.8, .26, 3.6), M(0x8b5e3c, 0, .05, .65), 0, DT - .13, 0);
      [[-3.2, -1.5], [3.2, -1.5], [-3.2, 1.5], [3.2, 1.5]].forEach((p) => add(G, new THREE.BoxGeometry(.22, DT - .26, .22), M(0x2b2b3a, 0, .6, .4), p[0], (DT - .26) / 2, p[1]));

      // monitor with live registration screen
      const silver = M(0xc3c9d4, 0, 1, .3);
      add(G, new THREE.BoxGeometry(3.9, 2.4, .14), M(0x111118, 0, .9, .3), 0, 2.95, -.9);
      add(G, new THREE.BoxGeometry(.35, .8, .16), silver, 0, 1.6, -1.0);
      add(G, new THREE.CylinderGeometry(.8, .9, .07, 36), silver, 0, DT + .03, -.95);
      const sc2 = document.createElement('canvas'); sc2.width = 640; sc2.height = 380; const sx = sc2.getContext('2d'), stx = tex(sc2);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.72, 2.21), new THREE.MeshBasicMaterial({ map: stx, toneMapped: false })); scr.position.set(0, 2.95, -.82); G.add(scr);
      const nav = ['Dashboard', 'Complaints', 'Team', 'Settings'];
      const drawScreen = (name, cat, fl2, data, status, col) => {
        sx.fillStyle = '#111116'; sx.fillRect(0, 0, 640, 380); sx.fillStyle = '#16161D'; sx.fillRect(0, 0, 140, 380);
        sx.fillStyle = '#E06D43'; sx.fillRect(14, 14, 24, 24); sx.fillStyle = '#fff'; sx.font = 'bold 15px Arial'; sx.textAlign = 'left'; sx.fillText('COMPLAX', 46, 33);
        nav.forEach((n, i) => { sx.fillStyle = '#64748b'; sx.font = '14px Arial'; sx.fillText(n, 22, 84 + i * 36); });
        sx.fillStyle = '#94A3B8'; sx.font = '11px Arial'; sx.fillText('LOCKED UNTIL APPROVED', 14, 360);
        let n = name || 'Your Organization'; if (n.length > 20) n = n.slice(0, 19) + '...';
        sx.fillStyle = '#fff'; sx.font = 'bold 22px Arial'; sx.fillText(n, 160, 40);
        sx.fillStyle = '#6B46C1'; sx.fillRect(160, 50, 190, 22); sx.fillStyle = '#fff'; sx.font = 'bold 12px Arial'; sx.fillText(cat ? (cat.length > 22 ? cat.slice(0, 21) + '...' : cat) : 'Select category', 170, 66);
        sx.fillStyle = '#E06D43'; sx.fillRect(468, 22, 156, 26); sx.fillStyle = '#fff'; sx.font = 'bold 12px Arial'; sx.fillText('PENDING APPROVAL', 480, 40);
        sx.fillStyle = '#94A3B8'; sx.font = 'bold 11px Arial'; sx.fillText('REGISTRATION CHECKLIST', 160, 100);
        CHECKS.forEach((c, i) => {
          const cx = 160 + (i % 2) * 238, cy = 112 + Math.floor(i / 2) * 42;
          sx.fillStyle = '#1C1C24'; sx.fillRect(cx, cy, 226, 34);
          sx.beginPath(); sx.arc(cx + 20, cy + 17, 9, 0, 6.283); sx.fillStyle = fl2[i] ? '#34d399' : '#2b2b3a'; sx.fill();
          if (fl2[i]) { sx.fillStyle = '#052e1c'; sx.font = 'bold 13px Arial'; sx.fillText('\u2713', cx + 14, cy + 22); }
          sx.fillStyle = fl2[i] ? '#E2E8F0' : '#64748b'; sx.font = '14px Arial'; sx.fillText(c, cx + 38, cy + 22);
        });
        sx.fillStyle = '#1C1C24'; sx.fillRect(160, 286, 464, 32); sx.fillStyle = '#E2E8F0'; sx.font = '14px Arial'; sx.fillText('CSV training dataset', 176, 307);
        sx.fillStyle = data ? '#34d399' : '#64748b'; sx.font = 'bold 12px Arial'; sx.fillText(data ? 'ATTACHED \u2713' : 'OPTIONAL', 540, 307);
        const cnt = fl2.filter(Boolean).length;
        sx.fillStyle = '#0F0F14'; sx.fillRect(160, 330, 464, 10); sx.fillStyle = '#E06D43'; sx.fillRect(160, 330, 464 * cnt / 8, 10);
        sx.fillStyle = col; sx.font = 'bold 13px Arial'; sx.fillText(status, 160, 366);
        stx.needsUpdate = true;
      };

      // complaint papers
      const pcv = document.createElement('canvas'); pcv.width = 256; pcv.height = 340; const px = pcv.getContext('2d');
      px.fillStyle = '#f4f1e8'; px.fillRect(0, 0, 256, 340); px.fillStyle = '#E06D43'; px.fillRect(16, 16, 224, 30); px.fillStyle = '#fff'; px.font = 'bold 17px Arial'; px.fillText('COMPLAINT FORM', 28, 38);
      for (let y = 70; y < 260; y += 16) { px.fillStyle = '#94A3B8'; px.fillRect(16, y, 120 + Math.random() * 104, 6); }
      px.strokeStyle = '#E06D43'; px.lineWidth = 4; px.strokeRect(150, 280, 90, 36);
      const paperTex = tex(pcv);

      // complaint INBOX tray
      const tray = new THREE.Group(); tray.position.set(-2.35, DT, .85); tray.rotation.y = .2; G.add(tray);
      const tm = M(0x1a1a22, 0, .8, .35);
      add(tray, new THREE.BoxGeometry(1.9, .08, 1.4), tm, 0, .04, 0);
      [[0, -.7, 1.9, .5, .06], [-.95, 0, .06, .5, 1.4], [.95, 0, .06, .5, 1.4]].forEach((w) => add(tray, new THREE.BoxGeometry(w[2], w[3], w[4]), tm, w[0], .28, w[1]));
      add(tray, new THREE.BoxGeometry(1.9, .22, .06), M(O, 0x3a1508, .3, .5), 0, .12, .7);
      const lc = document.createElement('canvas'); lc.width = 256; lc.height = 64; const lx = lc.getContext('2d'); lx.fillStyle = '#E06D43'; lx.fillRect(0, 0, 256, 64); lx.fillStyle = '#fff'; lx.font = 'bold 30px Arial'; lx.textAlign = 'center'; lx.fillText('COMPLAINT INBOX', 128, 42);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .2), new THREE.MeshBasicMaterial({ map: tex(lc), toneMapped: false })); lab.position.set(0, .12, .735); tray.add(lab);
      const stack = [];
      for (let i = 0; i < 8; i++) {
        const s = add(tray, new THREE.BoxGeometry(1.55, .035, 1.1), M(0xf4f1e8, 0, 0, .9), (Math.random() - .5) * .08, .1 + i * .04, (Math.random() - .5) * .06);
        s.rotation.y = (Math.random() - .5) * .1; stack.push({ m: s, k: 0 });
      }
      const topSheet = add(tray, new THREE.PlaneGeometry(1.5, 1.05), new THREE.MeshStandardMaterial({ map: paperTex, roughness: .9 }), 0, .43, 0); topSheet.rotation.x = -Math.PI / 2; topSheet.visible = false;

      // flying complaints
      const fly = [];
      for (let i = 0; i < 7; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(.75, 1.0), new THREE.MeshStandardMaterial({ map: paperTex, side: THREE.DoubleSide, roughness: .9 }));
        m.castShadow = true; m.userData = { o: i / 7, y: (i % 3) * .8, z: ((i * 37) % 5) - 1 }; G.add(m); fly.push(m);
      }

      // stamp + form
      const form = add(G, new THREE.PlaneGeometry(1.8, 2.3), new THREE.MeshStandardMaterial({ map: paperTex, roughness: .9 }), 2.3, DT + .005, .4); form.rotation.set(-Math.PI / 2, 0, .12);
      const mc = document.createElement('canvas'); mc.width = 320; mc.height = 130; const mx = mc.getContext('2d'); const mtx = tex(mc);
      let mKey = '';
      const drawMark = (txt, col) => { mx.clearRect(0, 0, 320, 130); mx.fillStyle = '#f4f1e8'; mx.fillRect(0, 0, 320, 130); mx.strokeStyle = col; mx.fillStyle = col; mx.lineWidth = 9; mx.strokeRect(8, 8, 304, 114); mx.font = 'bold 38px Arial'; mx.textAlign = 'center'; mx.fillText(txt, 160, 78); mtx.needsUpdate = true; };
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .65), new THREE.MeshBasicMaterial({ map: mtx, transparent: true, opacity: 0, toneMapped: false })); mark.rotation.set(-Math.PI / 2, 0, .1); mark.position.set(2.35, DT + .012, .95); G.add(mark);
      const stamp = new THREE.Group(); stamp.position.set(2.35, DT + 1.4, .95); G.add(stamp);
      add(stamp, new THREE.BoxGeometry(1.2, .16, .65), M(0x111118, 0, 0, .9), 0, .08, 0); add(stamp, new THREE.BoxGeometry(1.1, .3, .55), M(0x7a4b2a, 0, .05, .6), 0, .3, 0);
      add(stamp, new THREE.CylinderGeometry(.16, .2, .6, 16), M(0x7a4b2a, 0, .05, .6), 0, .75, 0); add(stamp, new THREE.SphereGeometry(.28, 20, 16), M(0x5b3a24, 0, .05, .5), 0, 1.15, 0);

      // CSV folder, mug, lamp
      const folder = new THREE.Group(); folder.position.set(.3, DT, 1.1); folder.rotation.y = .2; G.add(folder);
      add(folder, new THREE.BoxGeometry(1.2, .06, 1.5), M(0x16a34a, 0, .1, .6), 0, .03, 0); add(folder, new THREE.BoxGeometry(.5, .06, .18), M(0x22c55e, 0, .1, .6), -.35, .03, -.84);
      const cc = document.createElement('canvas'); cc.width = 128; cc.height = 160; const cx2 = cc.getContext('2d'); cx2.fillStyle = '#f4f1e8'; cx2.fillRect(0, 0, 128, 160); cx2.fillStyle = '#16a34a'; cx2.font = 'bold 40px Arial'; cx2.textAlign = 'center'; cx2.fillText('CSV', 64, 70);
      for (let i = 0; i < 4; i++) { cx2.fillStyle = '#94A3B8'; cx2.fillRect(18, 90 + i * 15, 92, 6); }
      const cf = add(folder, new THREE.PlaneGeometry(1.0, 1.25), new THREE.MeshStandardMaterial({ map: tex(cc), roughness: .9 }), 0, .075, .02); cf.rotation.x = -Math.PI / 2; folder.visible = false;
      add(G, new THREE.CylinderGeometry(.3, .26, .6, 24), M(0xf1f5f9, 0, 0, .35), 3.0, DT + .3, -.4); add(G, new THREE.CylinderGeometry(.25, .25, .02, 24), M(0x3b2314, 0, 0, .3), 3.0, DT + .59, -.4);
      add(G, new THREE.TorusGeometry(.17, .045, 10, 20), M(0xf1f5f9, 0, 0, .35), 3.3, DT + .3, -.4);
      add(G, new THREE.CylinderGeometry(.35, .4, .07, 24), M(0x1a1a22, 0, .8, .3), -3.0, DT + .035, -1.1); add(G, new THREE.CylinderGeometry(.035, .035, 1.5, 10), silver, -3.0, DT + .8, -1.1);
      add(G, new THREE.ConeGeometry(.5, .5, 24, 1, true), new THREE.MeshStandardMaterial({ color: O, emissive: 0x5a2410, metalness: .6, roughness: .4, side: THREE.DoubleSide }), -3.0, DT + 1.6, -1.1);
      add(G, new THREE.SphereGeometry(.13, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffe1b0 }), -3.0, DT + 1.5, -1.1);
      const lp = new THREE.PointLight(0xffc98a, .9, 9); lp.position.set(-3.0, DT + 1.5, -1.1); G.add(lp);

      // interaction
      let ry = -.35, rx = .32, vy = 0, vx = 0, dr = false, lx2 = 0, ly = 0, vis = true, w = 0, h = 0, raf = 0;
      const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; }); io.observe(cv);
      const down = (e) => { dr = true; lx2 = e.clientX; ly = e.clientY; if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; };
      const move = (e) => { if (!dr) return; vy = (e.clientX - lx2) * .009; vx = (e.clientY - ly) * .009; lx2 = e.clientX; ly = e.clientY; ry += vy; rx = Math.max(.05, Math.min(.8, rx + vx)); };
      const up = () => { dr = false; cv.style.cursor = 'grab'; };
      cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move);
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

      let sKey = '';
      const t0 = performance.now();
      const loop = () => {
        if (!active) return;
        raf = requestAnimationFrame(loop);
        if (!vis) return;
        const t = (performance.now() - t0) / 1000;
        if (cv.clientWidth !== w || cv.clientHeight !== h) { w = cv.clientWidth; h = cv.clientHeight; R.setSize(w, h, false); C.aspect = w / h; C.position.z = Math.max(13, 11 / (w / h)); C.updateProjectionMatrix(); }
        if (!dr) { ry += vy; rx = Math.max(.05, Math.min(.8, rx + vx)); vy *= .94; vx *= .94; }
        G.rotation.y = ry; G.rotation.x = rx;

        const st = state.current, cnt = st.filled.filter(Boolean).length;
        const status = st.submitting ? 'Submitting registration...' : (st.failed ? 'Registration failed - check the form' : (cnt === 8 ? 'Ready to submit for approval' : cnt + ' of 8 details completed'));
        const col = st.submitting ? '#a78bfa' : (st.failed ? '#ef4444' : (cnt === 8 ? '#34d399' : '#94A3B8'));
        const key = [st.filled.join(''), st.orgName, st.category, st.hasData, status].join('|');
        if (key !== sKey) { sKey = key; drawScreen(st.orgName, st.category, st.filled, st.hasData, status, col); }

        // inbox fills with complaint papers as the form is completed
        stack.forEach((s, i) => { s.k += ((i < cnt ? 1 : 0) - s.k) * .15; s.m.scale.y = Math.max(.001, s.k); s.m.visible = s.k > .03; });
        topSheet.visible = cnt > 0; topSheet.position.y = .1 + cnt * .04 + .02;
        folder.visible = st.hasData; folder.position.y = DT + (st.hasData ? Math.sin(t * 2) * .01 : 0);

        // complaints keep flying into the inbox
        fly.forEach((m) => {
          const d = m.userData, kk = (t * .2 + d.o) % 1, e = kk * kk * (3 - 2 * kk);
          m.position.set(-8 + (-2.35 + 8) * e + Math.sin(t + d.o * 9) * .3, 6 + d.y - (6 + d.y - (DT + .6)) * e, 3 + d.z * .3 - (3 + d.z * .3 - .85) * e);
          m.scale.setScalar(kk > .92 ? Math.max(.01, (1 - kk) / .08) : 1 - e * .3);
          m.rotation.set(.5 + Math.sin(t * 2 + d.o * 6) * .4 * (1 - e), t * .8 * (1 - e) + d.o, Math.sin(t * 1.5 + d.o * 4) * .4 * (1 - e));
        });

        // stamp: presses while submitting, shows FAILED on error
        let sy = DT + 1.4 + Math.sin(t * 1.5) * .06, op = 0;
        if (st.submitting) { const c = t % 1.6; sy = c < .5 ? DT + 1.4 - (c / .5) * (1.4 - .01) : (c < .8 ? DT + .01 : DT + .01 + ((c - .8) / .8) * 1.39); op = c >= .5 ? 1 : (t > 1.6 ? 1 : 0); }
        else if (st.failed) op = 1;
        const mk = st.submitting ? 'PENDING' : (st.failed ? 'FAILED' : mKey || 'PENDING');
        if (mk !== mKey) { mKey = mk; drawMark(mk === 'FAILED' ? 'FAILED' : 'PENDING', mk === 'FAILED' ? '#dc2626' : '#6B46C1'); }
        stamp.position.y = sy; mark.material.opacity = op;

        R.render(S, C);
      };
      drawMark('PENDING', '#6B46C1'); mKey = 'PENDING';
      loop();

      cleanup = () => {
        cancelAnimationFrame(raf); io.disconnect();
        cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move);
        cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up);
        R.dispose();
      };
    };

    loadThree().then(() => { if (active) init(); }).catch(() => {});
    return () => { active = false; cleanup(); };
  }, []);

  return (
    <div className="reg-stage">
      <canvas ref={canvasRef} className="reg-gl" />
    </div>
  );
};

const SecondaryAdminRegister = () => {
  const [formData, setFormData] = useState({
    ownerFullName: '',
    organizationName: '',
    category: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    recoveryHint: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dataset, setDataset] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setDataset(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    setError('');
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (dataset) data.append('dataset', dataset);

    try {
      await api.post('/organizations/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-wrapper">
        <div className="card auth-card animate-fade" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--low)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle size={64} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Registration Submitted</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
            Your organization details have been received.<br />
            A system administrator will review your request shortly.
          </p>
          <Link to="/login" className="btn-primary" style={{ width: '100%', textDecoration: 'none' }}>Return to Login</Link>
        </div>
      </div>
    );
  }

  // which fields are filled -> ticks on the 3D monitor + papers in the 3D inbox
  const requiredKeys = ['ownerFullName', 'organizationName', 'category', 'email', 'phone', 'address', 'password', 'confirmPassword'];
  const filled = requiredKeys.map((k) => !!formData[k]);

  return (
    <div className="auth-wrapper">
      <div className="reg-split">
        <OrgScene
          filled={filled}
          orgName={formData.organizationName}
          category={formData.category}
          hasData={!!dataset}
          submitting={loading}
          failed={!!error}
        />

        <div className="reg-card-wrap">
          <div className="card auth-card animate-fade" style={{ maxWidth: '700px' }}>
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
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{
                display: 'inline-flex',
                justifyContent: 'center',
                marginBottom: '0.75rem'
              }}>
                <Logo height={52} showTagline={true} />
              </div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Organization Registration</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Set up a managed environment for your organization.</p>
            </div>

            <div className="role-selector">
              <button
                type="button"
                className="role-btn"
                onClick={() => navigate('/register')}
              >
                USER
              </button>
              <button
                type="button"
                className="role-btn active"
                onClick={() => {}}
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
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '8px'
              }}>
                Organization Details
              </div>

              <div className="reg-grid">
                <div className="form-group">
                  <label>Owner Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" name="ownerFullName" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Organization Name</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" name="organizationName" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div className="reg-grid">
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" className="form-control" onChange={handleChange} required>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.categoryId} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Location / Address</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" name="address" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: '1rem',
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '8px'
              }}>
                Admin Account & Data
              </div>

              <div className="reg-grid">
                <div className="form-group">
                  <label>Admin Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" name="email" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" name="phone" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div className="reg-grid">
                <div className="form-group">
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-control"
                      style={{ paddingLeft: '40px', paddingRight: '40px' }}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      className="form-control"
                      style={{ paddingLeft: '40px', paddingRight: '40px' }}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label>Password Recovery Hint</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    name="recoveryHint"
                    className="form-control"
                    style={{ paddingLeft: '40px' }}
                    placeholder="e.g. Favorite pet, birth city, secret word"
                    value={formData.recoveryHint}
                    onChange={handleChange}
                    required
                  />
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  Used to verify your identity if you forget your password.
                </small>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  CSV Training Dataset <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Optional but recommended)</span>
                </label>
                <div style={{
                  position: 'relative',
                  border: '2px dashed var(--border)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  transition: 'var(--transition)'
                }} className="file-upload-zone">
                  <FileUp size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {dataset ? dataset.name : 'Drop your CSV here or click to browse'}
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                {loading ? 'Submitting Registration...' : 'Register Organization'}
              </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Back to <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .file-upload-zone:hover {
          border-color: var(--primary);
          background: rgba(224, 109, 67, 0.05);
        }
        .reg-split { display: flex; align-items: flex-start; justify-content: center; gap: 32px; width: 100%; max-width: 1320px; margin: 0 auto; padding: 20px; }
        .reg-stage { flex: 1 1 420px; min-width: 320px; position: sticky; top: 20px; height: min(640px, 86vh); border-radius: 24px; background: linear-gradient(160deg, rgba(33,33,43,.7), rgba(15,15,20,.4)); border: 1px solid rgba(255,255,255,.08); }
        .reg-gl { width: 100%; height: 100%; display: block; cursor: grab; touch-action: pan-y; border-radius: inherit; }
        .reg-card-wrap { flex: 0 1 700px; width: 100%; }
        @media (max-width: 1000px) { .reg-stage { display: none; } .reg-split { padding: 0; } }
      `}</style>
    </div>
  );
};

export default SecondaryAdminRegister;
