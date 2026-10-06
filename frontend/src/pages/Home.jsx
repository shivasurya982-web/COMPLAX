import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { loadThree } from '../utils/threeLoader';

const Home = () => {
  useEffect(() => {
    let active = true;
    const cleanups = [];

    const initThreeScenes = () => {
      if (!window.THREE) return;
      const THREE = window.THREE;
var O=0xE06D43,P=0x6B46C1,D=0x2b2b3a,GR=0x34d399;
function M(c,e,m,r){return new THREE.MeshStandardMaterial({color:c,emissive:e||0,metalness:m==null?.3:m,roughness:r==null?.45:r})}
function add(p,g,m,x,y,z){var o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);o.castShadow=o.receiveShadow=true;p.add(o);return o}
function tex(c,rep){var t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}return t}
function floor(G,y,s){var f=new THREE.Mesh(new THREE.PlaneGeometry(s,s),new THREE.ShadowMaterial({opacity:.45}));f.rotation.x=-Math.PI/2;f.position.y=y;f.receiveShadow=true;G.add(f)}
function ptex(kind){var c=document.createElement('canvas');c.width=256;c.height=340;var x=c.getContext('2d');
  x.fillStyle='#f4f1e8';x.fillRect(0,0,256,340);
  for(var i=0;i<340;i+=2){x.fillStyle='rgba(0,0,0,'+(Math.random()*.025)+')';x.fillRect(0,i,256,1)}
  x.fillStyle='#E06D43';x.fillRect(16,16,224,30);x.fillStyle='#fff';x.font='bold 17px Arial';x.fillText('COMPLAINT FORM',28,38);
  x.fillStyle='#6b7280';x.fillRect(16,62,90,7);x.fillStyle='#cbd5e1';x.fillRect(16,76,224,20);
  for(var y=112;y<250;y+=15){x.fillStyle='#94A3B8';x.fillRect(16,y,120+Math.random()*104,6)}
  x.strokeStyle='#94A3B8';x.lineWidth=2;x.strokeRect(18,262,14,14);x.strokeRect(18,286,14,14);x.fillStyle='#94A3B8';x.fillRect(42,266,70,6);x.fillRect(42,290,90,6);
  var col=['#6B46C1','#34d399','#E06D43'][kind],tx=['FILED','RESOLVED','OPEN'][kind];
  x.save();x.translate(184,290);x.rotate(-.3);x.strokeStyle=col;x.fillStyle=col;x.lineWidth=4;x.strokeRect(-46,-20,92,40);x.font='bold 17px Arial';x.textAlign='center';x.fillText(tx,0,6);x.restore();
  return tex(c)}
function rig(id,z,build){
  var cv=document.getElementById(id);if(!cv)return;var R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
  R.setPixelRatio(Math.min(devicePixelRatio,2));R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.15;
  R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
  var S=new THREE.Scene(),C=new THREE.PerspectiveCamera(42,1,.1,100);C.position.set(0,1,z);C.lookAt(0,0,0);
  // studio environment for realistic reflections
  var ec=document.createElement('canvas');ec.width=512;ec.height=256;var ex=ec.getContext('2d'),gr=ex.createLinearGradient(0,0,0,256);
  gr.addColorStop(0,'#2a3358');gr.addColorStop(.55,'#3b3550');gr.addColorStop(1,'#0e0e16');ex.fillStyle=gr;ex.fillRect(0,0,512,256);
  [[40,50,120,60,'#ffd9bd'],[300,40,130,50,'#d2c6ff'],[200,110,90,30,'#ffffff'],[430,90,60,80,'#ffb08a']].forEach(function(b){ex.fillStyle=b[4];ex.fillRect(b[0],b[1],b[2],b[3])});
  var et=new THREE.CanvasTexture(ec);et.mapping=THREE.EquirectangularReflectionMapping;et.encoding=THREE.sRGBEncoding;
  var pm=new THREE.PMREMGenerator(R);S.environment=pm.fromEquirectangular(et).texture;
  S.add(new THREE.AmbientLight(0x9999bb,.35));
  var k=new THREE.DirectionalLight(0xffffff,1.8);k.position.set(6,12,8);k.castShadow=true;k.shadow.mapSize.set(1024,1024);
  var sc=k.shadow.camera;sc.left=sc.bottom=-10;sc.right=sc.top=10;sc.near=1;sc.far=40;k.shadow.bias=-.0006;S.add(k);
  var a=new THREE.PointLight(O,1.4,60);a.position.set(-6,3,7);S.add(a);
  var b=new THREE.PointLight(P,1.6,60);b.position.set(7,-2,-5);S.add(b);
  var G=new THREE.Group();S.add(G);
  var upd=build(G),ry=-.6,rx=.25,vy=0,vx=0,dr=false,lx=0,ly=0,vis=true,w=0,h=0;
  var io=new IntersectionObserver(function(e){vis=e[0].isIntersecting});io.observe(cv);
  cv.addEventListener('pointerdown',function(e){dr=true;lx=e.clientX;ly=e.clientY;cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing'});
  cv.addEventListener('pointermove',function(e){if(!dr)return;vy=(e.clientX-lx)*.009;vx=(e.clientY-ly)*.009;lx=e.clientX;ly=e.clientY;ry+=vy;rx=Math.max(-1.1,Math.min(1.1,rx+vx))});
  function up(){dr=false;cv.style.cursor='grab'}cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  var t0=performance.now();
  var raf=0;(function loop(){if(!active)return;raf=requestAnimationFrame(loop);if(!vis)return;
    var t=(performance.now()-t0)/1000;
    if(cv.clientWidth!==w||cv.clientHeight!==h){w=cv.clientWidth;h=cv.clientHeight;R.setSize(w,h,false);C.aspect=w/h;C.updateProjectionMatrix()}
    if(!dr){ry+=vy;rx=Math.max(-1.1,Math.min(1.1,rx+vx));vy*=.94;vx*=.94}
    G.rotation.y=ry;G.rotation.x=rx;upd(t);R.render(S,C)})();cleanups.push(function(){cancelAnimationFrame(raf);io.disconnect();R.dispose()});
}
// 1. REALISTIC CITY + paper sheets
rig('city',17.5,function(G0){var G=new THREE.Group();G.position.y=-2.5;G0.add(G);
  var tx=[ptex(0),ptex(1),ptex(2)];
  function wtex(emit){var c=document.createElement('canvas');c.width=64;c.height=128;var x=c.getContext('2d');x.fillStyle=emit?'#000':'#e4e9f2';x.fillRect(0,0,64,128);
    var s=7;for(var r=0;r<8;r++)for(var q=0;q<4;q++){s=(s*9301+49297)%233280;var on=s/233280>.5;x.fillStyle=emit?(on?'#ffd9a0':'#000'):'#1c2536';x.fillRect(5+q*15,5+r*15,10,10)}
    return tex(c,true)}
  var wm=wtex(0),we=wtex(1);
  function fac(col,rx,ry){var a=wm.clone(),e=we.clone();a.needsUpdate=e.needsUpdate=true;a.repeat.set(rx,ry);e.repeat.set(rx,ry);
    return new THREE.MeshStandardMaterial({color:col,map:a,emissive:0xffffff,emissiveMap:e,emissiveIntensity:.85,metalness:.55,roughness:.28})}
  // ground with roads, parks
  var gc=document.createElement('canvas');gc.width=gc.height=512;var g=gc.getContext('2d');g.fillStyle='#22252e';g.fillRect(0,0,512,512);
  g.fillStyle='#2b4a3b';[[40,40,110,110],[360,40,110,110],[40,360,110,110],[360,360,110,110]].forEach(function(p){g.fillRect(p[0],p[1],p[2],p[3])});
  g.fillStyle='#3a3d48';g.fillRect(0,232,512,48);g.fillRect(232,0,48,512);g.beginPath();g.arc(256,256,215,0,7);g.lineWidth=26;g.strokeStyle='#3a3d48';g.stroke();
  g.fillStyle='#dfe3ea';for(var i=0;i<512;i+=32){g.fillRect(i,254,16,4);g.fillRect(254,i,4,16)}
  var gt=tex(gc);
  var base=add(G,new THREE.CylinderGeometry(5,5.25,.5,64),[M(0x2b2b3a,0,.5,.4),new THREE.MeshStandardMaterial({map:gt,roughness:.85,metalness:.05}),M(0x15151c)],0,-.25,0);
  var rim=add(G,new THREE.TorusGeometry(5.02,.06,10,80),M(O,0x5a2410,.6,.3),0,0,0);rim.rotation.x=Math.PI/2;
  function bld(x,z,w,h,col){var b=new THREE.Group();b.position.set(x,0,z);G.add(b);
    add(b,new THREE.BoxGeometry(w,h*.68,w),fac(col,w*1.4,h*.5),0,h*.34,0);
    add(b,new THREE.BoxGeometry(w*.72,h*.32,w*.72),fac(col,w,h*.25),0,h*.68+h*.16,0);
    add(b,new THREE.BoxGeometry(w*.75,.05,w*.75),M(0x9aa3b5,0,.8,.3),0,h+.02,0);
    add(b,new THREE.BoxGeometry(w*.25,.14,w*.22),M(0x6b7280,0,.7,.4),w*.15,h+.1,w*.1);
    if(h>1.9)add(b,new THREE.CylinderGeometry(.015,.03,.55,8),M(0xcbd5e1,0,.9,.2),0,h+.32,0);
    return new THREE.Vector3(x,h+.1,z)}
  var tops=[bld(-2.7,-1.7,1.1,2.4,0x9fb4d8),bld(-2.9,1.5,1.2,1.5,0xc5c0e6),bld(2.7,-1.9,1.3,3,0xf0c4b0),bld(2.8,1.7,1.1,1.8,0xb4a7e6),
    bld(.3,3.1,1.4,1.3,0xa6b5c9),bld(-.4,-3.3,1.1,2.1,0xf0c4b0),bld(-1.5,2.9,.9,1.1,0xb4c4dd),bld(1.9,3.0,.9,1.0,0xc5c0e6)];
  // HQ tower
  var hq=add(G,new THREE.CylinderGeometry(.55,.85,3.4,6),fac(0xf4b89e,1.8,3.2),0,1.7,0);
  add(G,new THREE.CylinderGeometry(.42,.55,.7,6),M(O,0x7a3416,.7,.25),0,3.75,0);
  var cr=add(G,new THREE.TorusGeometry(.5,.04,8,30),new THREE.MeshBasicMaterial({color:0xffc7a8}),0,3.4,0);cr.rotation.x=Math.PI/2;
  add(G,new THREE.CylinderGeometry(.03,.06,.9,8),M(0xe2e8f0,0,.9,.2),0,4.4,0);
  var bc=add(G,new THREE.SphereGeometry(.22,20,20),new THREE.MeshBasicMaterial({color:0xffb08a}),0,4.95,0);
  var bl=new THREE.PointLight(O,1.6,9);bl.position.set(0,5,0);G.add(bl);
  tops.forEach(function(v){G.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,4.95,0),v]),new THREE.LineBasicMaterial({color:0x9f7aea,transparent:true,opacity:.55})))});
  for(var i=0;i<18;i++){var an=i/18*6.283,rr=4.35,tr=new THREE.Group();tr.position.set(Math.cos(an)*rr,0,Math.sin(an)*rr);G.add(tr);
    add(tr,new THREE.CylinderGeometry(.04,.05,.3,6),M(0x5b3a24,0,0,.9),0,.15,0);add(tr,new THREE.ConeGeometry(.22,.5,8),M(0x2f7a4f,0,0,.8),0,.5,0);add(tr,new THREE.ConeGeometry(.16,.4,8),M(0x3a8f5c,0,0,.8),0,.75,0)}
  // paper sheets
  var sheets=[];
  for(var i=0;i<34;i++){
    var gm=new THREE.PlaneGeometry(1.4,1.9,10,14),sd=Math.random()*6,cu=(Math.random()-.5)*2,p=gm.attributes.position;
    for(var j=0;j<p.count;j++){var px=p.getX(j),py=p.getY(j);p.setZ(j,Math.sin(px*2.4+sd)*.11+py*py*.13*cu+(px>.3&&py>.5?.1:0))}
    gm.computeVertexNormals();
    var m=new THREE.Mesh(gm,new THREE.MeshStandardMaterial({map:tx[i%3],side:THREE.DoubleSide,roughness:.9,metalness:0}));m.castShadow=true;
    m.rotation.order='YXZ';m.userData={a:Math.random()*6.283,sp:.16+Math.random()*.22,r:5.6+Math.random()*1.8,y:.6+Math.random()*6,ph:Math.random()*6.283,fun:i%3===0,k:Math.random()};
    G.add(m);sheets.push(m)}
  return function(t){bc.scale.setScalar(1+Math.sin(t*3)*.2);bl.intensity=1.4+Math.sin(t*3)*.5;
    sheets.forEach(function(s){var d=s.userData,a=d.a+t*d.sp,r,y,sc=1;
      if(d.fun){var k=(t*.1+d.k)%1;r=7-k*6.2;y=.8+k*4.1+Math.sin(t+d.ph)*.3;sc=1-k*.6;a=d.a+t*.5+k*2}
      else{r=d.r+Math.sin(t*.7+d.ph)*.5;y=d.y+Math.sin(t*1.1+d.ph)*.45}
      s.position.set(Math.cos(a)*r,y,Math.sin(a)*r);s.scale.setScalar(sc);
      s.rotation.set(.35+Math.sin(t*1.3+d.ph)*.4,Math.PI/2-a+.7,Math.sin(t*.9+d.ph)*.45)})}
});
// 2. SUBMIT: real paper airplane over a stack of complaint sheets
rig('plane',10,function(G){
  floor(G,-1.25,9);
  var pile=new THREE.Group();G.add(pile);pile.position.y=-1.2;
  for(var i=0;i<18;i++){var sh=add(pile,new THREE.BoxGeometry(2.8,.03,2),M(0xf4f1e8,0,0,.9),(Math.random()-.5)*.08,i*.03,(Math.random()-.5)*.08);sh.rotation.y=(Math.random()-.5)*.08}
  var top=add(pile,new THREE.PlaneGeometry(2.6,1.9),new THREE.MeshStandardMaterial({map:ptex(0),roughness:.9}),0,.56,0);top.rotation.x=-Math.PI/2;
  var v=[0,0,2.2, -1.4,.3,-1.3, 0,-.15,-1.2, 0,0,2.2, 0,-.15,-1.2, 1.4,.3,-1.3, 0,0,2.2, 0,-.85,-1, 0,-.15,-1.2, 0,0,2.2, 0,-.15,-1.2, 0,-.85,-1];
  var pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(v,3));pg.computeVertexNormals();
  var pl=new THREE.Group();G.add(pl);
  var pm=add(pl,pg,new THREE.MeshStandardMaterial({color:0xf7f4ec,side:THREE.DoubleSide,roughness:.85,flatShading:true}));
  pl.add(new THREE.LineSegments(new THREE.EdgesGeometry(pg),new THREE.LineBasicMaterial({color:0xb7bcc9})));
  add(pl,new THREE.PlaneGeometry(.7,.2),new THREE.MeshBasicMaterial({color:O,side:THREE.DoubleSide}),-.55,.17,-.45).rotation.set(-Math.PI/2+.25,0,.2);
  function pos(t){var a=t*.9;return [Math.sin(a)*2.4,1.5+Math.sin(t*1.6)*.35,Math.cos(a)*1.6,Math.cos(a)*2.4,-Math.sin(a)*1.6]}
  var dots=[];for(var i=0;i<22;i++)dots.push(add(G,new THREE.SphereGeometry(.07-i*.002,8,8),new THREE.MeshBasicMaterial({color:i%2?P:O,transparent:true,opacity:1-i*.04})));
  return function(t){var q=pos(t);pl.position.set(q[0],q[1],q[2]);pl.rotation.set(0,Math.atan2(q[3],q[4]),-.35);
    dots.forEach(function(d,i){var r=pos(t-(i+1)*.09);d.position.set(r[0],r[1]-.05,r[2])})}});
// 3. HANDLED: organization desk - laptop with complaint dashboard, stamp, files
rig('gears',13.5,function(G0){
  var G=new THREE.Group();G0.add(G);G.position.y=.9;G.scale.setScalar(.95);
  floor(G,-3.25,12);
  var silver=M(0xc3c9d4,0,1,.3),dark=M(0x1a1a22,0,.85,.3);
  add(G,new THREE.BoxGeometry(7.4,.3,4.2),M(0x8b5e3c,0,.05,.65),0,-1.35,0);
  [[-3.3,-1.8],[3.3,-1.8],[-3.3,1.8],[3.3,1.8]].forEach(function(p){add(G,new THREE.BoxGeometry(.25,1.9,.25),M(0x2b2b3a,0,.6,.4),p[0],-2.3,p[1])});
  // laptop + animated dashboard
  add(G,new THREE.BoxGeometry(2.7,.08,1.9),silver,-1.6,-1.16,-.2);
  var hg=new THREE.Group();hg.position.set(-1.6,-1.12,-1.15);hg.rotation.x=-.2;G.add(hg);
  add(hg,new THREE.BoxGeometry(2.7,1.75,.06),dark,0,.88,0);
  var sc=document.createElement('canvas');sc.width=512;sc.height=320;var sx=sc.getContext('2d'),st=tex(sc);
  var scr=new THREE.Mesh(new THREE.PlaneGeometry(2.5,1.55),new THREE.MeshBasicMaterial({map:st,toneMapped:false}));scr.position.set(0,.88,.035);hg.add(scr);
  var rows=['Water supply issue - Municipal Corp','Late delivery - Courier Co.','Billing error - Telecom','Road damage - City Works'];
  function draw(t){sx.fillStyle='#111116';sx.fillRect(0,0,512,320);sx.fillStyle='#16161D';sx.fillRect(0,0,512,40);
    sx.fillStyle='#E06D43';sx.fillRect(14,9,22,22);sx.fillStyle='#fff';sx.font='bold 17px Arial';sx.fillText('COMPLAX  |  Organization',46,27);
    var idx=Math.floor(t/2.5)%4;
    for(var i=0;i<4;i++){var y=54+i*64;sx.fillStyle='#1C1C24';sx.fillRect(14,y,484,54);
      if(i==idx){sx.strokeStyle='#E06D43';sx.lineWidth=2;sx.strokeRect(14,y,484,54)}
      sx.fillStyle='#E2E8F0';sx.font='15px Arial';sx.fillText(rows[i],28,y+22);sx.fillStyle='#64748b';sx.fillRect(28,y+34,140,6);
      var lab,col;if(i<idx){lab='RESOLVED';col='#34d399'}else if(i==idx){lab='REVIEWING';col='#6B46C1'}else{lab='NEW';col='#E06D43'}
      sx.fillStyle=col;sx.fillRect(390,y+12,96,28);sx.fillStyle='#fff';sx.font='bold 13px Arial';sx.fillText(lab,402,y+31);
      if(i==idx){sx.fillStyle='#0F0F14';sx.fillRect(200,y+34,170,8);sx.fillStyle='#E06D43';sx.fillRect(200,y+34,170*((t%2.5)/2.5),8)}}
    st.needsUpdate=true}
  draw(0);
  // complaint document + stamp mark
  var doc=add(G,new THREE.PlaneGeometry(1.7,2.2),new THREE.MeshStandardMaterial({map:ptex(0),roughness:.9}),1.5,-1.195,.5);doc.rotation.set(-Math.PI/2,0,.12);
  var mc=document.createElement('canvas');mc.width=256;mc.height=128;var mx=mc.getContext('2d');mx.strokeStyle='#6B46C1';mx.fillStyle='#6B46C1';mx.lineWidth=8;mx.strokeRect(10,10,236,108);mx.font='bold 40px Arial';mx.textAlign='center';mx.fillText('IN REVIEW',128,80);
  var mk=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.6),new THREE.MeshBasicMaterial({map:tex(mc),transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
  mk.position.set(1.7,-1.185,1.2);mk.rotation.set(-Math.PI/2,0,.1);G.add(mk);
  var sg=new THREE.Group();sg.position.set(1.7,-.4,1.2);G.add(sg);
  add(sg,new THREE.BoxGeometry(1.2,.16,.65),M(0x111118,0,0,.9),0,.08,0);add(sg,new THREE.BoxGeometry(1.1,.3,.55),M(0x7a4b2a,0,.05,.6),0,.3,0);
  add(sg,new THREE.CylinderGeometry(.16,.2,.6,16),M(0x7a4b2a,0,.05,.6),0,.75,0);add(sg,new THREE.SphereGeometry(.28,20,16),M(0x5b3a24,0,.05,.5),0,1.15,0);
  // mug, folders, lamp
  add(G,new THREE.CylinderGeometry(.4,.35,.8,28),M(0xf1f5f9,0,0,.35),3.1,-.8,.4);add(G,new THREE.CylinderGeometry(.33,.33,.02,28),M(0x3b2314,0,0,.3),3.1,-.4,.4);
  add(G,new THREE.TorusGeometry(.22,.06,10,20),M(0xf1f5f9,0,0,.35),3.5,-.8,.4);
  [[O,0],[P,.1],[0x4a4a5c,.2]].forEach(function(f,i){var b=add(G,new THREE.BoxGeometry(1.5,.09,2),M(f[0],0,.1,.6),-3,-1.15+i*.1,1.1);b.rotation.y=f[1]-.1});
  add(G,new THREE.CylinderGeometry(.4,.45,.08,24),dark,3,-1.16,-1.5);add(G,new THREE.CylinderGeometry(.04,.04,1.7,10),silver,3,-.3,-1.5);
  var sh=add(G,new THREE.ConeGeometry(.55,.55,24,1,true),new THREE.MeshStandardMaterial({color:O,emissive:0x5a2410,metalness:.6,roughness:.4,side:THREE.DoubleSide}),3,.6,-1.5);
  add(G,new THREE.SphereGeometry(.14,12,12),new THREE.MeshBasicMaterial({color:0xffe1b0}),3,.5,-1.5);
  var lp=new THREE.PointLight(0xffc98a,.9,9);lp.position.set(3,.4,-1.5);G.add(lp);
  var last=0;
  return function(t){if(t-last>.08){draw(t);last=t}
    var c=t%5,y=-.4;if(c>=1&&c<1.5)y=-.4-(c-1)/.5*.77;else if(c>=1.5&&c<1.8)y=-1.17;else if(c>=1.8&&c<2.3)y=-1.17+(c-1.8)/.5*.77;
    sg.position.y=y;mk.material.opacity=c<1.5?0:(c<4.4?1:Math.max(0,1-(c-4.4)/.6))}});
// 4. TRACK: smartphone showing live complaint status timeline
rig('bars',10.5,function(G0){
  var G=new THREE.Group();G0.add(G);G.scale.setScalar(.72);floor(G,-3.4,12);
  function rr(w,h,r){var s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
  var bg=new THREE.ExtrudeGeometry(rr(2.4,4.8,.36),{depth:.2,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:3,curveSegments:16});bg.translate(0,0,-.1);
  add(G,bg,M(0x2a2a34,0,1,.28));
  var pc=document.createElement('canvas');pc.width=256;pc.height=512;var px=pc.getContext('2d'),pt=tex(pc);
  var scr=new THREE.Mesh(new THREE.PlaneGeometry(2.2,4.4),new THREE.MeshBasicMaterial({map:pt,toneMapped:false}));scr.position.z=.16;G.add(scr);
  add(G,new THREE.PlaneGeometry(.7,.13),new THREE.MeshBasicMaterial({color:0}),0,2.05,.165).castShadow=false;
  function rrect(x,y,w,h,r,c){px.fillStyle=c;px.beginPath();px.moveTo(x+r,y);px.arcTo(x+w,y,x+w,y+h,r);px.arcTo(x+w,y+h,x,y+h,r);px.arcTo(x,y+h,x,y,r);px.arcTo(x,y,x+w,y,r);px.closePath();px.fill()}
  var labs=['Submitted','Under review','Resolved'],subs=['Complaint filed','Organization working','Issue closed'];
  function draw(t){var c=t%9,p=Math.min(1,c/6);px.fillStyle='#111116';px.fillRect(0,0,256,512);
    px.fillStyle='#fff';px.font='bold 16px Arial';px.fillText('COMPLAINT #1024',16,54);px.fillStyle='#94A3B8';px.font='12px Arial';px.fillText('Municipal Corporation',16,74);
    rrect(12,92,232,92,14,'#1C1C24');px.fillStyle='#E2E8F0';px.font='bold 15px Arial';px.fillText('Water supply issue',26,124);
    var lab=p>=1?'RESOLVED':(p>.5?'IN REVIEW':'SUBMITTED'),col=p>=1?'#34d399':(p>.5?'#6B46C1':'#E06D43');
    rrect(26,140,110,26,13,col);px.fillStyle='#fff';px.font='bold 12px Arial';px.fillText(lab,38,158);
    var y0=250,len=150;px.fillStyle='#2b2b3a';px.fillRect(39,y0,4,len);px.fillStyle='#E06D43';px.fillRect(39,y0,4,len*p);
    for(var i=0;i<3;i++){var yy=y0+i*len/2,on=p>=i/2-.001;px.beginPath();px.arc(41,yy,15,0,6.283);px.fillStyle=on?(i==2?'#34d399':'#E06D43'):'#2b2b3a';px.fill();
      if(on){px.fillStyle='#fff';px.font='bold 16px Arial';px.fillText('\u2713',34,yy+6)}
      px.fillStyle=on?'#fff':'#64748b';px.font='bold 15px Arial';px.fillText(labs[i],72,yy-1);px.fillStyle='#64748b';px.font='12px Arial';px.fillText(subs[i],72,yy+17)}
    if(p>=1){rrect(20,440,216,44,12,'#34d399');px.fillStyle='#062;';px.fillStyle='#052e1c';px.font='bold 16px Arial';px.fillText('ISSUE RESOLVED  \u2713',48,468)}
    else{rrect(20,440,216,10,5,'#0F0F14');rrect(20,440,Math.max(10,216*p),10,5,'#E06D43')}
    pt.needsUpdate=true}
  draw(0);
  // floating notification bell, location pin, check badge
  var pts=[new THREE.Vector2(0,0),new THREE.Vector2(.55,.02),new THREE.Vector2(.58,.12),new THREE.Vector2(.42,.55),new THREE.Vector2(.36,.95),new THREE.Vector2(.14,1.1),new THREE.Vector2(0,1.12)];
  var bell=new THREE.Group();bell.position.set(2.5,1.5,.9);G.add(bell);
  var bm=add(bell,new THREE.LatheGeometry(pts,28),M(O,0x3a1508,.9,.28),0,-.5,0);bm.material.side=THREE.DoubleSide;bm.scale.setScalar(.7);
  add(bell,new THREE.SphereGeometry(.13,12,12),M(O,0x3a1508,.9,.28),0,-.52,0);add(bell,new THREE.SphereGeometry(.14,14,14),new THREE.MeshBasicMaterial({color:0xff4d4d}),.32,.15,.2);
  var pin=new THREE.Group();pin.position.set(-2.6,.4,.9);G.add(pin);
  add(pin,new THREE.SphereGeometry(.4,24,20),M(P,0x2a1a5a,.6,.3),0,.35,0);var cn=add(pin,new THREE.ConeGeometry(.3,.75,20),M(P,0x2a1a5a,.6,.3),0,-.2,0);cn.rotation.x=Math.PI;add(pin,new THREE.SphereGeometry(.15,12,12),new THREE.MeshBasicMaterial({color:0xffffff}),0,.35,.3);
  var ck=new THREE.Group();ck.position.set(2.4,-1.5,.9);G.add(ck);
  add(ck,new THREE.TorusGeometry(.55,.08,14,40),M(GR,0x0f5a3f,.7,.3));var a1=add(ck,new THREE.BoxGeometry(.3,.1,.08),M(GR,0x0f5a3f),-.13,-.08,0);a1.rotation.z=-Math.PI/4;var a2=add(ck,new THREE.BoxGeometry(.6,.1,.08),M(GR,0x0f5a3f),.1,.05,0);a2.rotation.z=Math.PI/4;
  var last=0;
  return function(t){if(t-last>.06){draw(t);last=t}
    bell.rotation.z=Math.sin(t*6)*.25*(Math.sin(t*1.2)>0?1:.2);bell.position.y=1.5+Math.sin(t*1.5)*.15;
    pin.position.y=.4+Math.abs(Math.sin(t*2))*.35;ck.scale.setScalar(1+Math.sin(t*3)*.07);ck.position.y=-1.5+Math.sin(t*1.3)*.12}});
// 5. MY COMPLAINTS: case file folder stamped CASE CLOSED
rig('shield',12,function(G0){
  var G=new THREE.Group();G0.add(G);G.rotation.x=.55;G.scale.setScalar(.92);floor(G,-.32,12);
  add(G,new THREE.BoxGeometry(8.2,.3,5.6),M(0x8b5e3c,0,.05,.65),0,-.15,0);
  var man=M(0xdcb878,0,0,.85);
  add(G,new THREE.BoxGeometry(3,.06,3.9),man,-1.55,.03,0);add(G,new THREE.BoxGeometry(3,.06,3.9),man,1.55,.03,0);add(G,new THREE.BoxGeometry(.16,.07,3.9),M(0xc9a45f,0,0,.85),0,.03,0);
  var tc=document.createElement('canvas');tc.width=256;tc.height=64;var t=tc.getContext('2d');t.fillStyle='#e6c88a';t.fillRect(0,0,256,64);t.fillStyle='#3b2f1a';t.font='bold 22px Arial';t.textAlign='center';t.fillText('MY COMPLAINTS',128,40);
  add(G,new THREE.BoxGeometry(1.7,.06,.42),man,2.3,.03,-2.15);var tl=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.42),new THREE.MeshStandardMaterial({map:tex(tc),roughness:.85}));tl.rotation.x=-Math.PI/2;tl.position.set(2.3,.07,-2.15);G.add(tl);
  // right: complaint form, left: resolution report
  var rp=add(G,new THREE.PlaneGeometry(2.4,3.2),new THREE.MeshStandardMaterial({map:ptex(2),roughness:.9}),1.55,.075,.02);rp.rotation.set(-Math.PI/2,0,.03);
  var rc=document.createElement('canvas');rc.width=256;rc.height=340;var r=rc.getContext('2d');r.fillStyle='#f4f1e8';r.fillRect(0,0,256,340);
  r.fillStyle='#34d399';r.fillRect(16,16,224,30);r.fillStyle='#fff';r.font='bold 16px Arial';r.fillText('RESOLUTION REPORT',28,37);
  ['Complaint received','Assigned to organization','Issue fixed','Complaint closed'].forEach(function(s,i){var y=84+i*46;r.fillStyle='#34d399';r.beginPath();r.arc(34,y,13,0,6.283);r.fill();r.fillStyle='#fff';r.font='bold 16px Arial';r.fillText('\u2713',27,y+6);r.fillStyle='#475569';r.font='15px Arial';r.fillText(s,58,y+5);r.fillStyle='#cbd5e1';r.fillRect(58,y+14,120,5)});
  r.fillStyle='#94A3B8';for(var y=280;y<330;y+=14)r.fillRect(16,y,150+Math.random()*70,5);
  var lp=add(G,new THREE.PlaneGeometry(2.4,3.2),new THREE.MeshStandardMaterial({map:tex(rc),roughness:.9}),-1.55,.075,.02);lp.rotation.set(-Math.PI/2,0,-.02);
  // big CASE CLOSED mark
  var mc=document.createElement('canvas');mc.width=320;mc.height=170;var m=mc.getContext('2d');m.fillStyle='#f4f1e8';m.fillRect(0,0,320,170);m.strokeStyle='#16a34a';m.fillStyle='#16a34a';m.lineWidth=10;m.strokeRect(12,12,296,146);m.lineWidth=3;m.strokeRect(26,26,268,118);m.textAlign='center';m.font='bold 46px Arial';m.fillText('CASE CLOSED',160,92);m.font='bold 22px Arial';m.fillText('\u2713 RESOLVED',160,128);
  var mk=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.9),new THREE.MeshBasicMaterial({map:tex(mc),transparent:true,opacity:0,toneMapped:false}));mk.rotation.set(-Math.PI/2,0,.08);mk.position.set(1.98,.09,1.1);G.add(mk);
  var sg=new THREE.Group();sg.position.set(1.98,1.6,1.1);G.add(sg);
  add(sg,new THREE.BoxGeometry(1.3,.16,.75),M(0x111118,0,0,.9),0,.08,0);add(sg,new THREE.BoxGeometry(1.2,.3,.65),M(0x7a4b2a,0,.05,.6),0,.3,0);
  add(sg,new THREE.CylinderGeometry(.17,.21,.6,16),M(0x7a4b2a,0,.05,.6),0,.75,0);add(sg,new THREE.SphereGeometry(.3,20,16),M(0x5b3a24,0,.05,.5),0,1.15,0);
  // sticky note, clip, pen
  var nc=document.createElement('canvas');nc.width=nc.height=128;var n=nc.getContext('2d');n.fillStyle='#fde68a';n.fillRect(0,0,128,128);n.fillStyle='#3b2f1a';n.font='bold 18px Arial';n.textAlign='center';n.fillText('Follow up',64,52);n.fillText('done \u2713',64,82);
  var sn=add(G,new THREE.PlaneGeometry(.85,.85),new THREE.MeshStandardMaterial({map:tex(nc),roughness:.9}),-.4,.09,1.6);sn.rotation.set(-Math.PI/2,0,.25);
  var cl=add(G,new THREE.TorusGeometry(.2,.022,8,24),M(0xc3c9d4,0,1,.25),-2.6,.2,-1.3);cl.scale.set(.55,1.4,1);cl.rotation.x=-Math.PI/2+.1;
  var pen=new THREE.Group();pen.position.set(-3.4,.14,1.7);pen.rotation.y=.6;G.add(pen);
  var pb=add(pen,new THREE.CylinderGeometry(.07,.07,1.9,14),M(O,0,.6,.35));pb.rotation.z=Math.PI/2;var pt=add(pen,new THREE.ConeGeometry(.07,.25,14),M(0x1a1a22,0,.8,.3),1.05,0,0);pt.rotation.z=-Math.PI/2;
  return function(t){var c=t%5,y=1.6;if(c>=1&&c<1.5)y=1.6-(c-1)/.5*1.49;else if(c>=1.5&&c<1.8)y=.11;else if(c>=1.8&&c<2.3)y=.11+(c-1.8)/.5*1.49;
    sg.position.y=y;mk.material.opacity=c<1.5?0:(c<4.4?1:Math.max(0,1-(c-4.4)/.6))}});
// 6. ORGANIZATION admin dashboard after main-admin approval
rig('org',12.5,function(G0){
  var G=new THREE.Group();G0.add(G);G.position.y=.4;floor(G,-2.55,12);
  var dark=M(0x111118,0,.9,.3),silver=M(0xc3c9d4,0,1,.3);
  add(G,new THREE.BoxGeometry(5.4,3.3,.16),dark,0,.4,0);
  var c=document.createElement('canvas');c.width=640;c.height=380;var x=c.getContext('2d'),st=tex(c);
  var scr=new THREE.Mesh(new THREE.PlaneGeometry(5.1,3.03),new THREE.MeshBasicMaterial({map:st,toneMapped:false}));scr.position.set(0,.4,.09);G.add(scr);
  add(G,new THREE.BoxGeometry(.45,1.1,.2),silver,0,-1.8,-.1);add(G,new THREE.CylinderGeometry(1.1,1.25,.1,40),silver,0,-2.45,-.1);
  var nav=['Dashboard','Complaints','Team','Settings'],rows=[['Water supply issue','NEW','#E06D43'],['Pipe leakage - Ward 4','IN PROGRESS','#6B46C1'],['Billing mismatch','RESOLVED','#34d399'],['Low water pressure','NEW','#E06D43'],['Meter fault','IN PROGRESS','#6B46C1']],mets=[['TOTAL','128'],['PENDING','24'],['IN PROGRESS','31'],['RESOLVED','73']];
  function draw(t){x.fillStyle='#111116';x.fillRect(0,0,640,380);x.fillStyle='#16161D';x.fillRect(0,0,150,380);
    x.fillStyle='#E06D43';x.fillRect(16,16,26,26);x.fillStyle='#fff';x.font='bold 15px Arial';x.fillText('COMPLAX',50,36);
    nav.forEach(function(n,i){var y=76+i*38;if(i==1){x.fillStyle='rgba(224,109,67,.16)';x.fillRect(8,y-6,134,30);x.fillStyle='#E06D43';x.fillRect(8,y-6,3,30)}x.fillStyle=i==1?'#fff':'#94A3B8';x.font='14px Arial';x.fillText(n,24,y+14)});
    x.fillStyle='#94A3B8';x.font='11px Arial';x.fillText('ORG ADMIN PANEL',16,360);
    x.fillStyle='#fff';x.font='bold 20px Arial';x.fillText('City Water Board',172,40);x.fillStyle='#6B46C1';x.fillRect(508,18,112,26);x.fillStyle='#fff';x.font='bold 12px Arial';x.fillText('ORG ADMIN',528,36);
    mets.forEach(function(m,i){var mx=172+i*118;x.fillStyle='#1C1C24';x.fillRect(mx,62,110,66);x.fillStyle='#94A3B8';x.font='10px Arial';x.fillText(m[0],mx+10,82);x.fillStyle='#fff';x.font='bold 26px Arial';x.fillText(m[1],mx+10,114)});
    x.fillStyle='#94A3B8';x.font='bold 11px Arial';x.fillText('RECENT COMPLAINTS',172,156);var idx=Math.floor(t/1.5)%5;
    rows.forEach(function(r,i){var y=166+i*40;x.fillStyle='#1C1C24';x.fillRect(172,y,448,34);if(i==idx){x.strokeStyle='#E06D43';x.lineWidth=2;x.strokeRect(172,y,448,34)}
      x.fillStyle='#E2E8F0';x.font='14px Arial';x.fillText(r[0],186,y+22);x.fillStyle=r[2];x.fillRect(498,y+6,108,22);x.fillStyle='#fff';x.font='bold 11px Arial';x.fillText(r[1],510,y+21)});
    st.needsUpdate=true}
  draw(0);
  var bc=document.createElement('canvas');bc.width=bc.height=256;var b=bc.getContext('2d');b.fillStyle='#0f2a20';b.beginPath();b.arc(128,128,120,0,6.283);b.fill();
  b.strokeStyle='#34d399';b.lineWidth=10;b.beginPath();b.arc(128,128,112,0,6.283);b.stroke();b.lineWidth=3;b.beginPath();b.arc(128,128,94,0,6.283);b.stroke();
  b.fillStyle='#34d399';b.textAlign='center';b.font='bold 44px Arial';b.fillText('\u2713',128,110);b.font='bold 32px Arial';b.fillText('APPROVED',128,156);b.font='bold 15px Arial';b.fillText('BY MAIN ADMIN',128,182);
  var bd=new THREE.Mesh(new THREE.CircleGeometry(.95,48),new THREE.MeshBasicMaterial({map:tex(bc),transparent:true,toneMapped:false}));bd.position.set(3,1.9,.9);G.add(bd);
  var kc=document.createElement('canvas');kc.width=320;kc.height=200;var k=kc.getContext('2d');k.fillStyle='#f4f1e8';k.fillRect(0,0,320,200);k.fillStyle='#E06D43';k.fillRect(0,0,320,44);k.fillStyle='#fff';k.font='bold 20px Arial';k.fillText('ORGANIZATION ACCESS',16,30);k.fillStyle='#64748b';k.fillRect(16,70,180,10);k.fillRect(16,96,140,8);k.fillStyle='#6B46C1';k.fillRect(16,140,90,26);k.fillStyle='#fff';k.font='bold 12px Arial';k.fillText('ADMIN',34,158);
  var kd=new THREE.Group();kd.position.set(-2.9,-2.38,1.4);kd.rotation.y=.3;G.add(kd);
  add(kd,new THREE.BoxGeometry(1.6,.04,1),M(0xf4f1e8,0,0,.6),0,0,0);var kp=add(kd,new THREE.PlaneGeometry(1.56,.97),new THREE.MeshStandardMaterial({map:tex(kc),roughness:.6}),0,.025,0);kp.rotation.x=-Math.PI/2;
  var last=0;
  return function(t){if(t-last>.1){draw(t);last=t}bd.position.y=1.9+Math.sin(t*1.6)*.15;bd.rotation.y=Math.sin(t*.9)*.35}});
    };

    loadThree().then(() => {
      if (active) initThreeScenes();
    }).catch(() => {});

    return () => {
      active = false;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <div className="complax-landing">
      <style>{`
.complax-landing{--bg:#111116;--side:#16161D;--card:#1C1C24;--card2:#21212B;--inp:#0F0F14;--o:#E06D43;--o2:#DD6B3D;--p:#6B46C1;--w:#fff;--t:#E2E8F0;--m:#94A3B8;--bd:rgba(255,255,255,.08);}
html{scroll-behavior:smooth}
.complax-landing *{box-sizing:border-box;margin:0}
.complax-landing{background:radial-gradient(900px 500px at 85% 5%,rgba(224,109,67,.12),transparent),radial-gradient(700px 500px at 5% 60%,rgba(107,70,193,.12),transparent),var(--bg);background-attachment:fixed;color:var(--t);font-family:'Inter','Segoe UI',system-ui,Arial,sans-serif;overflow-x:hidden}
.complax-landing nav{position:fixed;top:env(safe-area-inset-top,0px);left:0;right:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:14px 5vw;background:rgba(22,22,29,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--bd)}
.complax-landing .logo{display:flex;align-items:center;gap:10px;color:var(--w);font-weight:800;letter-spacing:3px;font-size:1.15rem}
.complax-landing .bolt{width:34px;height:34px;border-radius:10px;background:var(--o);display:grid;place-items:center;box-shadow:0 0 18px rgba(224,109,67,.5)}
.complax-landing .bolt svg{width:18px;height:18px;fill:#fff}
.complax-landing .links{display:flex;gap:26px}
.complax-landing .links a{color:var(--m);text-decoration:none;font-size:.92rem}
.complax-landing .links a:hover{color:var(--w)}
.complax-landing .nav-r{display:flex;gap:10px}
.complax-landing .btn{padding:10px 22px;border-radius:12px;text-decoration:none;font-weight:600;font-size:.92rem;transition:.25s;display:inline-block}
.complax-landing .ghost{color:var(--w);background:var(--card);border:1px solid var(--bd)}
.complax-landing .ghost:hover{border-color:var(--o);color:var(--o)}
.complax-landing .solid{color:#fff;background:var(--o);box-shadow:0 6px 22px rgba(224,109,67,.35)}
.complax-landing .solid:hover{background:var(--o2);transform:translateY(-2px)}
.complax-landing section{padding:110px 5vw 50px;max-width:1300px;margin:auto}
.complax-landing .two{display:grid;grid-template-columns:1fr 1.05fr;gap:30px;align-items:center;min-height:82vh}
.complax-landing .pill{display:inline-block;background:var(--p);color:#fff;font-size:.7rem;font-weight:700;letter-spacing:1.5px;padding:6px 14px;border-radius:999px;margin-bottom:18px}
.complax-landing h1{color:var(--w);font-size:clamp(2.3rem,5vw,4.1rem);line-height:1.08;margin-bottom:18px}
.complax-landing h1 span,.complax-landing h2 span{color:var(--o)}
.complax-landing .lead{color:var(--m);font-size:1.06rem;line-height:1.65;max-width:520px;margin-bottom:26px}
.complax-landing .cta{display:flex;gap:12px;flex-wrap:wrap}
.complax-landing .stage{position:relative;height:min(560px,70vh);border-radius:24px;background:linear-gradient(160deg,rgba(33,33,43,.7),rgba(15,15,20,.4));border:1px solid var(--bd)}
.complax-landing canvas.gl{width:100%;height:100%;display:block;cursor:grab;touch-action:pan-y;border-radius:inherit}
.complax-landing .step{display:flex;gap:16px;background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px 18px;margin-bottom:12px;transition:.3s}
.complax-landing .step:hover{border-color:var(--o)}
.complax-landing .step .n{flex:none;width:38px;height:38px;border-radius:11px;background:rgba(224,109,67,.14);border:1px solid rgba(224,109,67,.4);color:var(--o);display:grid;place-items:center;font-weight:800}
.complax-landing .step h4{color:var(--w);margin-bottom:4px}
.complax-landing .step p{color:var(--m);font-size:.92rem;line-height:1.5}
.complax-landing .sec{color:var(--m);font-size:.75rem;letter-spacing:2px;font-weight:700;text-transform:uppercase;margin-bottom:10px}
.complax-landing h2{color:var(--w);font-size:clamp(1.8rem,3.6vw,2.6rem)}
.complax-landing .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-top:30px}
.complax-landing .card{background:var(--card);border:1px solid var(--bd);border-radius:20px;padding:14px 14px 24px;transition:.3s}
.complax-landing .card:hover{border-color:var(--o);background:var(--card2)}
.complax-landing .card .stage{height:230px;border-radius:14px;margin-bottom:16px}
.complax-landing .card h3{color:var(--w);margin:0 8px 8px}
.complax-landing .card h3 i{color:var(--o);font-style:normal;margin-right:8px}
.complax-landing .card p{color:var(--m);line-height:1.55;font-size:.94rem;margin:0 8px}
.complax-landing .form{margin-top:24px;background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:24px;max-width:480px}
.complax-landing .inp{background:var(--inp);border:1px solid var(--bd);border-radius:10px;padding:13px 14px;color:var(--m);margin-top:12px;font-size:.9rem}
.complax-landing .bar{height:6px;border-radius:9px;background:var(--inp);margin-top:16px;overflow:hidden}
.complax-landing .bar i{display:block;height:100%;width:70%;background:linear-gradient(90deg,var(--o),var(--p))}
.complax-landing footer{text-align:center;padding:24px;color:var(--m);font-size:.85rem;border-top:1px solid var(--bd);background:var(--side)}
@media(max-width:860px){.complax-landing .two{grid-template-columns:1fr;min-height:0}
.complax-landing .links{display:none}
.complax-landing .btn{padding:9px 14px}
.complax-landing .stage{height:380px}
}

.complax-landing{margin:calc(-1 * clamp(1rem, 3vw, 2.5rem));min-height:100vh;width:calc(100% + 2 * clamp(1rem, 3vw, 2.5rem))}
@media(max-width:480px){.complax-landing .stage{height:280px}.complax-landing .btn{padding:8px 12px;font-size:0.85rem}}
      `}</style>

      <nav>
        <div style={{ width: '40px' }}></div>
        <div className="links">
          <a href="#how">How it works</a>
          <a href="#orgs">For organizations</a>
          <a href="#track">Resolved</a>
        </div>
        <div className="nav-r">
          <Link className="btn ghost" to="/login">Login</Link>
          <Link className="btn solid" to="/register">Register</Link>
        </div>
      </nav>

      <section className="two">
        <div>
          <div style={{ marginBottom: '2.5 rem' }}>
            <Logo height={150} showTagline={true} />
          </div>
          <h1>Every complaint. <span>One place.</span></h1>
          <p className="lead">Submit a complaint about any organization or service, let the concerned team handle it, and track its progress until it is resolved.</p>
          <div className="cta">
            <Link className="btn solid" to="/register">Get Started</Link>
            <a className="btn ghost" href="#how">See how it works</a>
          </div>
        </div>
        <div className="stage">
          <canvas className="gl" id="city"></canvas>
        </div>
      </section>

      <section id="how">
        <div className="sec">For users &middot; How it works</div>
        <h2>Three steps. <span>Zero confusion.</span></h2>
        <div className="grid">
          <div className="card">
            <div className="stage"><canvas className="gl" id="plane"></canvas></div>
            <h3><i>01</i>Submit</h3>
            <p>Register and send your complaint about any organization or service &ndash; it flies straight to the right place.</p>
          </div>
          <div className="card">
            <div className="stage"><canvas className="gl" id="gears"></canvas></div>
            <h3><i>02</i>Handled</h3>
            <p>The organization opens your complaint on its dashboard, reviews it, stamps it and gets to work.</p>
          </div>
          <div className="card">
            <div className="stage"><canvas className="gl" id="bars"></canvas></div>
            <h3><i>03</i>Track</h3>
            <p>Follow the status on your phone &ndash; Submitted, Under review, Resolved &ndash; with a notification at each step.</p>
          </div>
        </div>
      </section>

      <section id="orgs" className="two">
        <div>
          <div className="sec">For organizations</div>
          <h2>Bring your organization onto <span>Complax</span></h2>
          <p className="lead" style={{ marginTop: '14px' }}>Want to receive and manage complaints through Complax? Register your organization, get approved, and manage everything from your own admin page.</p>
          <div className="step"><div className="n">1</div><div><h4>Register your organization</h4><p>Send a registration request with your organization details.</p></div></div>
          <div className="step"><div className="n">2</div><div><h4>Main admin approval</h4><p>The Complax main admin reviews your request and approves it.</p></div></div>
          <div className="step"><div className="n">3</div><div><h4>Your own admin complaint page</h4><p>Get a separate admin page to view, assign, update and resolve complaints for your organization.</p></div></div>
          <div className="cta" style={{ marginTop: '20px' }}>
            <Link className="btn solid" to="/register-org">Register your organization</Link>
          </div>
        </div>
        <div className="stage">
          <canvas className="gl" id="org"></canvas>
        </div>
      </section>

      <section id="track" className="two">
        <div>
          <div className="sec">My complaints</div>
          <h2>Complaint <span>resolved.</span> Case closed.</h2>
          <p className="lead" style={{ marginTop: '14px' }}>Follow every update in your dashboard and see the exact moment your issue is resolved.</p>
          <div className="form">
            <span className="pill" style={{ marginBottom: '6px' }}>IN PROGRESS</span>
            <div className="inp">Complaint title…</div>
            <div className="inp">Select organization…</div>
            <div className="bar"><i></i></div>
          </div>
        </div>
        <div className="stage">
          <canvas className="gl" id="shield"></canvas>
        </div>
      </section>

      <footer>© 2026 COMPLAX</footer>
    </div>
  );
};

export default Home;
