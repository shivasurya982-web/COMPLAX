import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Eye, EyeOff, User, Mail, Phone, Building, Hash, Lock, Zap, ArrowLeft } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  3D scene: the CITIZEN VOICE PASS                                   */
/*  - a floating ID pass shows your name, ID, organization, category,  */
/*    avatar initial and a barcode that "grows" as you fill the form   */
/*  - 7 orbs on the pedestal light up, one per completed field, and    */
/*    the light beam under the pass gets stronger                      */
/*  - a megaphone sends out sound waves (your voice) at all times      */
/*  - complaint tickets orbit the pass                                 */
/*  - pressing Create Account: the pass spins and a scanner sweeps it  */
/*  - on error the pass turns red; drag to rotate the whole scene      */
/* ------------------------------------------------------------------ */
const loadThree = (onReady) => {
  if (window.THREE) { onReady(); return; }
  const add = (src, onFail) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = onReady; s.onerror = onFail || (() => {});
    document.body.appendChild(s);
  };
  add('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    () => add('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'));
};

const FIELD_COUNT = 7;

const PassScene = ({ filled, name, studentId, orgName, category, email, phone, submitting, failed }) => {
  const canvasRef = useRef(null);
  const state = useRef({});
  useEffect(() => { state.current = { filled, name, studentId, orgName, category, email, phone, submitting, failed }; });

  useEffect(() => {
    let active = true;
    let cleanup = () => {};

    const init = () => {
      const cv = canvasRef.current;
      if (!active || !cv || !window.THREE) return;
      const THREE = window.THREE;
      const O = 0xE06D43, P = 0x6B46C1, GREEN = 0x34d399;

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
      C.position.set(0, 4.6, 14); C.lookAt(0, 2.6, 0);

      // soft studio reflections
      const ec = document.createElement('canvas'); ec.width = 512; ec.height = 256;
      const ex = ec.getContext('2d'); const gr = ex.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#3a4a7a'); gr.addColorStop(.55, '#4a3f5c'); gr.addColorStop(1, '#14101c');
      ex.fillStyle = gr; ex.fillRect(0, 0, 512, 256);
      [[40, 50, 120, 60, '#ffd9bd'], [300, 40, 130, 50, '#d2c6ff'], [200, 110, 90, 30, '#ffffff']].forEach((b) => { ex.fillStyle = b[4]; ex.fillRect(b[0], b[1], b[2], b[3]); });
      const et = new THREE.CanvasTexture(ec); et.mapping = THREE.EquirectangularReflectionMapping; et.encoding = THREE.sRGBEncoding;
      S.environment = new THREE.PMREMGenerator(R).fromEquirectangular(et).texture;
      S.add(new THREE.AmbientLight(0xffffff, .6));
      const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(5, 13, 9); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
      const sc = key.shadow.camera; sc.left = sc.bottom = -9; sc.right = sc.top = 9; sc.near = 1; sc.far = 40; key.shadow.bias = -.0006; S.add(key);
      const la = new THREE.PointLight(O, 1.3, 60); la.position.set(-7, 4, 8); S.add(la);
      const lb = new THREE.PointLight(P, 1.5, 60); lb.position.set(7, 3, -6); S.add(lb);
      const lf = new THREE.PointLight(0xffffff, .7, 60); lf.position.set(0, 4, 14); S.add(lf);

      const G = new THREE.Group(); S.add(G);

      // platform
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.ShadowMaterial({ opacity: .5 })); fl.rotation.x = -Math.PI / 2; fl.position.y = -.26; fl.receiveShadow = true; G.add(fl);
      add(G, new THREE.CylinderGeometry(5, 5.2, .24, 64), M(0x2b2b3a, 0, .5, .4), 0, -.12, 0);
      const rim = add(G, new THREE.TorusGeometry(5.02, .05, 10, 80), M(O, 0x5a2410, .6, .3), 0, 0, 0); rim.rotation.x = Math.PI / 2;

      // pedestal
      add(G, new THREE.CylinderGeometry(1.5, 1.8, .5, 40), M(0x1a1a22, 0, .8, .35), 0, .25, 0);
      add(G, new THREE.CylinderGeometry(1.2, 1.5, .25, 40), M(0x2b2b3a, 0, .7, .35), 0, .62, 0);
      const padRing = add(G, new THREE.TorusGeometry(1.2, .04, 10, 60), M(P, 0x3a1f80, .5, .3), 0, .76, 0); padRing.rotation.x = Math.PI / 2;

      // light beam from pedestal to the pass
      const beamMat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: .05, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.15, 2.2, 36, 1, true), beamMat); beam.position.y = 1.9; G.add(beam);

      // progress orbs (one per field)
      const orbs = [];
      for (let i = 0; i < FIELD_COUNT; i++) {
        const ang = (i / FIELD_COUNT) * Math.PI * 2 + .3;
        const mat = new THREE.MeshStandardMaterial({ color: 0x2b2b3a, emissive: GREEN, emissiveIntensity: 0, metalness: .3, roughness: .3 });
        const o = add(G, new THREE.SphereGeometry(.2, 20, 16), mat, Math.cos(ang) * 3.3, .22, Math.sin(ang) * 3.3);
        const st = add(G, new THREE.CylinderGeometry(.07, .12, .3, 10), M(0x1a1a22, 0, .8, .35), Math.cos(ang) * 3.3, .1, Math.sin(ang) * 3.3);
        st.castShadow = false;
        orbs.push({ o, mat, k: 0 });
      }

      // ---------- the Citizen Voice Pass ----------
      const pcv = document.createElement('canvas'); pcv.width = 700; pcv.height = 450; const px = pcv.getContext('2d'); const ptx = tex(pcv);
      const rr = (x, y, w, h, r) => { px.beginPath(); px.moveTo(x + r, y); px.arcTo(x + w, y, x + w, y + h, r); px.arcTo(x + w, y + h, x, y + h, r); px.arcTo(x, y + h, x, y, r); px.arcTo(x, y, x + w, y, r); px.closePath(); };
      const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '...' : s);
      const drawPass = (st, cnt, status, col) => {
        px.clearRect(0, 0, 700, 450);
        rr(0, 0, 700, 450, 34); px.fillStyle = '#16161d'; px.fill();
        px.save(); rr(0, 0, 700, 450, 34); px.clip();
        const hg = px.createLinearGradient(0, 0, 700, 0); hg.addColorStop(0, '#E06D43'); hg.addColorStop(1, '#6B46C1');
        px.fillStyle = hg; px.fillRect(0, 0, 700, 86);
        px.restore();
        px.fillStyle = '#fff'; px.font = 'bold 30px Arial'; px.textAlign = 'left'; px.fillText('COMPLAX', 36, 54);
        px.font = '15px Arial'; px.fillText('Citizen Voice Pass', 190, 52);
        px.fillStyle = 'rgba(0,0,0,.35)'; rr(430, 24, 238, 38, 19); px.fill();
        px.fillStyle = col; px.font = 'bold 15px Arial'; px.textAlign = 'center'; px.fillText(status, 549, 49); px.textAlign = 'left';

        // avatar
        const ini = (st.name || '').trim().charAt(0).toUpperCase();
        px.beginPath(); px.arc(112, 205, 62, 0, 6.283); px.fillStyle = ini ? '#6B46C1' : '#2b2b3a'; px.fill();
        px.lineWidth = 5; px.strokeStyle = st.failed ? '#ef4444' : (cnt === FIELD_COUNT ? '#34d399' : '#E06D43'); px.stroke();
        px.fillStyle = '#fff'; px.font = 'bold 56px Arial'; px.textAlign = 'center'; px.fillText(ini || '?', 112, 225); px.textAlign = 'left';

        // text
        const line = (label, val, ph, y, big) => {
          px.fillStyle = '#64748b'; px.font = '12px Arial'; px.fillText(label, 210, y - (big ? 34 : 20));
          px.fillStyle = val ? '#f1f5f9' : '#475569'; px.font = (big ? 'bold 34px' : '20px') + ' Arial'; px.fillText(clip(val || ph, big ? 20 : 30), 210, y);
        };
        line('FULL NAME', st.name, 'Your full name', 150, true);
        line('STUDENT / RESIDENT ID', st.studentId, 'ID number', 205);
        line('ORGANIZATION', st.orgName, 'Select organization', 255);
        px.fillStyle = '#6B46C1'; rr(210, 272, 240, 30, 15); px.fill();
        px.fillStyle = '#fff'; px.font = 'bold 14px Arial'; px.fillText(clip(st.category || 'Category auto-filled', 28), 226, 292);

        px.fillStyle = '#94a3b8'; px.font = '15px Arial';
        px.fillText(clip(st.email || 'email@example.com', 30), 36, 345);
        px.fillText(clip(st.phone || 'Phone number', 30), 36, 372);

        // barcode grows with progress
        const bars = Math.round(46 * cnt / FIELD_COUNT);
        for (let i = 0; i < 46; i++) {
          const wd = 2 + ((i * 7 + 3) % 5);
          px.fillStyle = i < bars ? '#f1f5f9' : '#2b2b3a';
          px.fillRect(300 + i * 8.2, 340, wd, 70);
        }
        px.fillStyle = '#64748b'; px.font = '11px Arial'; px.fillText(cnt + ' / ' + FIELD_COUNT + ' fields verified', 36, 420);
        ptx.needsUpdate = true;
      };

      const back = document.createElement('canvas'); back.width = 700; back.height = 450; const bx = back.getContext('2d');
      const bg = bx.createLinearGradient(0, 0, 700, 450); bg.addColorStop(0, '#6B46C1'); bg.addColorStop(1, '#E06D43');
      bx.fillStyle = bg; bx.fillRect(0, 0, 700, 450); bx.fillStyle = 'rgba(255,255,255,.9)'; bx.font = 'bold 54px Arial'; bx.textAlign = 'center'; bx.fillText('COMPLAX', 350, 215);
      bx.font = '22px Arial'; bx.fillText('Every complaint deserves to be heard', 350, 262);

      const card = new THREE.Group(); card.position.y = 3.5; G.add(card);
      add(card, new THREE.BoxGeometry(3.2, 2.05, .08), M(0x16161d, 0x1a0e2e, .8, .3), 0, 0, 0);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(3.12, 2.0), new THREE.MeshBasicMaterial({ map: ptx, transparent: true, toneMapped: false })); front.position.z = .045; card.add(front);
      const bk = new THREE.Mesh(new THREE.PlaneGeometry(3.12, 2.0), new THREE.MeshBasicMaterial({ map: tex(back), toneMapped: false })); bk.position.z = -.045; bk.rotation.y = Math.PI; card.add(bk);
      // lanyard clip + strap
      add(card, new THREE.BoxGeometry(.5, .14, .12), M(0xc3c9d4, 0, 1, .3), 0, 1.1, 0);
      const strap = add(card, new THREE.BoxGeometry(.16, 1.6, .02), M(O, 0x5a2410, .2, .6), 0, 1.95, 0); strap.castShadow = false;
      // scanner line
      const scanMat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const scan = new THREE.Mesh(new THREE.PlaneGeometry(3.3, .07), scanMat); scan.position.z = .07; scan.visible = false; card.add(scan);

      // ---------- megaphone with sound waves ----------
      const mega = new THREE.Group(); mega.position.set(-3.7, 1.3, 1.4); mega.rotation.z = -Math.PI / 2 + .55; G.add(mega);
      add(mega, new THREE.CylinderGeometry(.62, .2, 1.1, 28, 1, true), new THREE.MeshStandardMaterial({ color: O, emissive: 0x5a2410, metalness: .5, roughness: .35, side: THREE.DoubleSide }), 0, 0, 0);
      add(mega, new THREE.CylinderGeometry(.2, .2, .5, 20), M(0x1a1a22, 0, .8, .35), 0, -.8, 0);
      add(mega, new THREE.TorusGeometry(.62, .05, 10, 30), M(0xf1f5f9, 0, .6, .3), 0, .55, 0).rotation.x = Math.PI / 2;
      add(mega, new THREE.BoxGeometry(.14, .5, .14), M(0x1a1a22, 0, .8, .35), .2, -.35, 0).rotation.z = -.5;
      const waves = [];
      for (let i = 0; i < 3; i++) {
        const wm = new THREE.MeshBasicMaterial({ color: 0xffb08a, transparent: true, opacity: 0, depthWrite: false });
        const w = new THREE.Mesh(new THREE.TorusGeometry(.6, .035, 8, 40), wm); w.rotation.x = Math.PI / 2; mega.add(w); waves.push({ w, wm, o: i / 3 });
      }

      // ---------- orbiting complaint tickets ----------
      const tcv = document.createElement('canvas'); tcv.width = 200; tcv.height = 260; const tx = tcv.getContext('2d');
      tx.fillStyle = '#f4f1e8'; tx.fillRect(0, 0, 200, 260); tx.fillStyle = '#E06D43'; tx.fillRect(12, 12, 176, 28); tx.fillStyle = '#fff'; tx.font = 'bold 15px Arial'; tx.fillText('COMPLAINT', 24, 32);
      for (let y = 62; y < 200; y += 15) { tx.fillStyle = '#94A3B8'; tx.fillRect(14, y, 90 + ((y * 7) % 80), 6); }
      tx.strokeStyle = '#6B46C1'; tx.lineWidth = 4; tx.strokeRect(110, 214, 76, 30);
      const ticketTex = tex(tcv);
      const tickets = [];
      for (let i = 0; i < 6; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(.62, .8), new THREE.MeshStandardMaterial({ map: ticketTex, side: THREE.DoubleSide, roughness: .9 }));
        m.castShadow = true; G.add(m); tickets.push({ m, a: (i / 6) * Math.PI * 2, y: 2.4 + (i % 3) * .9 });
      }

      // ---------- interaction ----------
      let ry = -.25, rx = .12, vy = 0, vx = 0, dr = false, lx = 0, ly = 0, vis = true, w = 0, h = 0, raf = 0;
      const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; }); io.observe(cv);
      const down = (e) => { dr = true; lx = e.clientX; ly = e.clientY; if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; };
      const move = (e) => { if (!dr) return; vy = (e.clientX - lx) * .009; vx = (e.clientY - ly) * .009; lx = e.clientX; ly = e.clientY; ry += vy; rx = Math.max(-.1, Math.min(.6, rx + vx)); };
      const up = () => { dr = false; cv.style.cursor = 'grab'; };
      cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move);
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

      let sKey = '', cardRY = 0, beamK = 0;
      const t0 = performance.now();
      const loop = () => {
        if (!active) return;
        raf = requestAnimationFrame(loop);
        if (!vis) return;
        const t = (performance.now() - t0) / 1000;
        if (cv.clientWidth !== w || cv.clientHeight !== h) { w = cv.clientWidth; h = cv.clientHeight; R.setSize(w, h, false); C.aspect = w / h; C.position.z = Math.max(13, 11.5 / (w / h)); C.updateProjectionMatrix(); }
        if (!dr) { ry += vy; rx = Math.max(-.1, Math.min(.6, rx + vx)); vy *= .94; vx *= .94; }
        G.rotation.y = ry; G.rotation.x = rx;

        const st = state.current; if (!st.filled) { R.render(S, C); return; }
        const cnt = st.filled.filter(Boolean).length;
        const status = st.submitting ? 'ISSUING PASS...' : (st.failed ? 'CHECK THE FORM' : (cnt === FIELD_COUNT ? 'READY TO ISSUE' : 'UNVERIFIED'));
        const col = st.submitting ? '#c4b5fd' : (st.failed ? '#fca5a5' : (cnt === FIELD_COUNT ? '#6ee7b7' : '#fcd9c9'));
        const k = [st.filled.join(''), st.name, st.studentId, st.orgName, st.category, st.email, st.phone, status].join('|');
        if (k !== sKey) { sKey = k; drawPass(st, cnt, status, col); }

        // pass: floats, sways, spins while submitting
        card.position.y = 3.5 + Math.sin(t * 1.3) * .12;
        if (st.submitting) cardRY += .13;
        else { cardRY = cardRY % 6.2832; if (cardRY > Math.PI) cardRY -= 6.2832; cardRY += (Math.sin(t * .7) * .18 - cardRY) * .1; }
        card.rotation.y = cardRY; card.rotation.z = Math.sin(t * .9) * .02;
        scan.visible = st.submitting; scan.position.y = Math.sin(t * 5) * .95;
        scanMat.opacity = .5 + Math.sin(t * 20) * .2;

        // orbs + beam react to progress
        orbs.forEach((ob, i) => {
          const on = st.filled[i] ? 1 : 0; ob.k += (on - ob.k) * .12;
          ob.mat.emissiveIntensity = ob.k * 1.4; ob.mat.color.setHex(on ? GREEN : 0x2b2b3a);
          ob.o.position.y = .22 + ob.k * (.12 + Math.sin(t * 2 + i) * .05);
        });
        beamK += (cnt / FIELD_COUNT - beamK) * .1;
        beamMat.opacity = .04 + beamK * .16; beamMat.color.setHex(st.failed ? 0xef4444 : GREEN);
        padRing.rotation.z = t * .6;

        // megaphone sound waves
        waves.forEach((v) => {
          const p = (t * .55 + v.o) % 1;
          v.w.position.y = .6 + p * 3.2; v.w.scale.setScalar(.7 + p * 1.6); v.wm.opacity = (1 - p) * .5;
        });
        mega.position.y = 1.3 + Math.sin(t * 1.6) * .05;

        // orbiting complaint tickets
        tickets.forEach((tk, i) => {
          const a = tk.a + t * (.28 + (st.submitting ? .5 : 0));
          tk.m.position.set(Math.cos(a) * 3.1, tk.y + Math.sin(t * 1.4 + i) * .15, Math.sin(a) * 3.1);
          tk.m.lookAt(0, tk.m.position.y, 0); tk.m.rotation.z += Math.sin(t + i) * .02;
        });

        R.render(S, C);
      };
      drawPass({ filled: [], name: '', studentId: '', orgName: '', category: '', email: '', phone: '' }, 0, 'UNVERIFIED', '#fcd9c9');
      loop();

      cleanup = () => {
        cancelAnimationFrame(raf); io.disconnect();
        cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move);
        cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up);
        R.dispose();
      };
    };

    loadThree(() => { if (active) init(); });
    return () => { active = false; cleanup(); };
  }, []);

  return (
    <div className="reg-stage">
      <canvas ref={canvasRef} className="reg-gl" />
    </div>
  );
};

const UserRegister = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    studentResidentId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organizationId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await api.get('/organizations/approved');
        setOrganizations(response.data);
      } catch (err) {
        console.error('Failed to fetch organizations');
      }
    };
    fetchOrgs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'organizationId') {
      const org = organizations.find(o => o.organizationId === value);
      setSelectedOrg(org);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/user/register', formData);
      alert('Registration successful! Please login.');
      navigate('/');
    } catch (err) {
      const serverError = err.response?.data?.error;
      setError(serverError || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // which fields are filled -> orbs light up on the 3D pedestal + barcode grows on the pass
  const requiredKeys = ['fullName', 'studentResidentId', 'email', 'phone', 'organizationId', 'password', 'confirmPassword'];
  const filled = requiredKeys.map((k) => !!formData[k]);

  return (
    <div className="auth-wrapper">
      <div className="reg-split">
        <PassScene
          filled={filled}
          name={formData.fullName}
          studentId={formData.studentResidentId}
          orgName={selectedOrg?.name || ''}
          category={selectedOrg?.category || ''}
          email={formData.email}
          phone={formData.phone}
          submitting={loading}
          failed={!!error}
        />

        <div className="reg-card-wrap">
          <div className="card auth-card animate-fade" style={{ maxWidth: '650px' }}>
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
                alignItems: 'center',
                gap: '12px',
                marginBottom: '0.75rem',
                color: 'var(--primary)'
              }}>
                <Zap size={28} fill="var(--primary)" />
                <h1 style={{ fontSize: '2rem', letterSpacing: '-0.05em', color: 'var(--text-main)' }}>COMPLAX</h1>
              </div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>User Registration</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Create your account to start reporting issues.</p>
            </div>

            <div className="role-selector">
              <button type="button" className="role-btn active" onClick={() => {}}>USER</button>
              <button type="button" className="role-btn" onClick={() => navigate('/register-org')}>ORGANIZATION</button>
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
              <div className="reg-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" name="fullName" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Student / Resident ID</label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" name="studentResidentId" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div className="reg-grid">
                <div className="form-group">
                  <label>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" name="email" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" name="phone" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div className="reg-grid">
                <div className="form-group">
                  <label>Organization</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <select name="organizationId" className="form-control" style={{ paddingLeft: '40px' }} onChange={handleChange} required>
                      <option value="">Select Organization</option>
                      {organizations.map(org => (
                        <option key={org.organizationId} value={org.organizationId}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" className="form-control" value={selectedOrg?.category || 'Auto-filled from org'} disabled />
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

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                {loading ? 'Registering Account...' : 'Create Account'}
              </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Login here</Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .reg-split { display: flex; align-items: flex-start; justify-content: center; gap: 32px; width: 100%; max-width: 1320px; margin: 0 auto; padding: 20px; }
        .reg-stage { flex: 1 1 420px; min-width: 320px; position: sticky; top: 20px; height: min(640px, 86vh); border-radius: 24px; background: linear-gradient(160deg, rgba(33,33,43,.7), rgba(15,15,20,.4)); border: 1px solid rgba(255,255,255,.08); }
        .reg-gl { width: 100%; height: 100%; display: block; cursor: grab; touch-action: pan-y; border-radius: inherit; }
        .reg-card-wrap { flex: 0 1 650px; width: 100%; }
        .reg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        @media (max-width: 1000px) { .reg-stage { display: none; } .reg-split { padding: 0; } }
        @media (max-width: 560px) { .reg-grid { grid-template-columns: 1fr; gap: 0; } }
      `}</style>
    </div>
  );
};

export default UserRegister;
