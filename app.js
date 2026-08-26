/* =========================================================
   木语 · 榫卯 — 木作构件数字典藏  (v3)
   卡片=真实产品照 · 点击=可旋转3D · 教学实训=自动/手动拆解
   ========================================================= */
(function(){
  "use strict";
  var THREE_OK = typeof THREE!=="undefined" && THREE.WebGLRenderer && THREE.OrbitControls;

  /* ---------- 木纹 map+bump ---------- */
  function grainLine(x,size,a,col){var px=Math.random()*size;x.strokeStyle=col+a+")";x.lineWidth=0.6+Math.random()*1.8;x.beginPath();x.moveTo(px,0);for(var y=0;y<=size;y+=5){px+=(Math.random()-0.5)*3.2;x.lineTo(px,y);}x.stroke();}
  function knot(x,size){var cx=30+Math.random()*(size-60),cy=30+Math.random()*(size-60);for(var i=5;i>0;i--){x.beginPath();x.strokeStyle="rgba(40,20,5,"+(0.04+0.06*i)+")";x.lineWidth=1+i*0.5;x.ellipse(cx,cy,i*3,i*4.4,0,0,Math.PI*2);x.stroke();}}
  function makeWoodTex(base){
    var size=256,c=document.createElement("canvas");c.width=c.height=size;var x=c.getContext("2d");var r=(base>>16)&255,g=(base>>8)&255,b=base&255;
    x.fillStyle="rgb("+r+","+g+","+b+")";x.fillRect(0,0,size,size);var i;
    for(i=0;i<size;i+=3){x.fillStyle="rgba(0,0,0,"+(Math.random()*0.06)+")";x.fillRect(i,0,3,size);}
    for(i=0;i<95;i++){grainLine(x,size,0.03+Math.random()*0.08,Math.random()<0.5?"rgba(0,0,0,":"rgba(255,240,220,");}
    for(i=0;i<4;i++){knot(x,size);}
    var map=new THREE.CanvasTexture(c);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.encoding=THREE.sRGBEncoding;
    var cb=document.createElement("canvas");cb.width=cb.height=size;var xb=cb.getContext("2d");xb.fillStyle="#808080";xb.fillRect(0,0,size,size);
    for(i=0;i<95;i++){grainLine(xb,size,0.18+Math.random()*0.24,"rgba(255,255,255,");}
    var bump=new THREE.CanvasTexture(cb);bump.wrapS=bump.wrapT=THREE.RepeatWrapping;
    return {map:map,bump:bump};
  }
  function mat(base,rough){var t=makeWoodTex(base);var m=new THREE.MeshStandardMaterial({map:t.map,bumpMap:t.bump,bumpScale:0.02,roughness:rough||0.6,metalness:0.02});m.side=THREE.DoubleSide;return m;}
  function box(w,h,d,m){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);}
  function cyl(rt,rb,h,seg,m){return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m);}
  function sph(r,m){return new THREE.Mesh(new THREE.SphereGeometry(r,32,22),m);}
  function put(g,m,x,y,z,rot){m.position.set(x,y,z);if(rot){if(rot.x)m.rotation.x=rot.x;if(rot.y)m.rotation.y=rot.y;if(rot.z)m.rotation.z=rot.z;}g.add(m);return m;}

  function normalize(g){
    var wrap=new THREE.Group(),bx=new THREE.Box3().setFromObject(g),c=bx.getCenter(new THREE.Vector3());
    g.position.set(-c.x,-c.y,-c.z);wrap.add(g);
    if(g.userData.explode){var fn=g.userData.explode;wrap.userData.explode=function(t){fn(t);};}
    var sp=bx.getBoundingSphere(new THREE.Sphere());return {root:wrap,r:sp.radius||1};
  }
  function noop(){}
  function latheMesh(pts,seg,m){return new THREE.Mesh(new THREE.LatheGeometry(pts.map(function(p){return new THREE.Vector2(p[0],p[1]);}),seg||40),m);}
  // 车旋类单件
  function revolve(pts,color,seg){
    var g=new THREE.Group(),m=mat(color);g.add(latheMesh(pts,seg,m));
    g.userData.explode=noop;return normalize(g);
  }
  // 一组盒件
  function boxGroup(color){
    var g=new THREE.Group();g.userData.explode=noop;return {g:g,m:mat(color)};
  }

  function addLights(scene){scene.add(new THREE.HemisphereLight(0xfff6ea,0x8a6b4a,0.8));
    var key=new THREE.DirectionalLight(0xffffff,1.15);key.position.set(4,6,5);scene.add(key);
    var rim=new THREE.DirectionalLight(0xffc9a0,0.6);rim.position.set(-4,3,-5);scene.add(rim);
    var fill=new THREE.DirectionalLight(0xa8c0ff,0.22);fill.position.set(0,-2,-3);scene.add(fill);}
  function addGround(scene,r){
    var c=document.createElement("canvas");c.width=c.height=128;var x=c.getContext("2d");
    var gr=x.createRadialGradient(64,64,6,64,64,64);gr.addColorStop(0,"rgba(60,32,12,0.5)");gr.addColorStop(1,"rgba(60,32,12,0)");
    x.fillStyle=gr;x.fillRect(0,0,128,128);
    var m=new THREE.Mesh(new THREE.PlaneGeometry(r*2.4,r*2.4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
    m.rotation.x=-Math.PI/2;m.position.y=-r*1.04;scene.add(m);}
  function makeRenderer(canvas,px){
    var r=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
    r.setPixelRatio(px||Math.min(window.devicePixelRatio||1,2));r.setClearColor(0x000000,0);
    r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.05;return r;
  }

  /* =========================================================
     模型构建
     ========================================================= */
  // —— 榫卯(精细:接缝贴合,不穿模,可拆解) ——
  // 半榫交叉:两块扁方木各自在交叉处"去半厚",咬合后齐平不互插
  function lapBarX(L,W,H,C,m){var g=new THREE.Group(),seg=L/2-C;
    g.add(put(new THREE.Group(),box(seg,W,H,m),-(C+seg/2),0,0));
    g.add(put(new THREE.Group(),box(seg,W,H,m),(C+seg/2),0,0));
    g.add(put(new THREE.Group(),box(2*C,W,H/2,m),0,-H/4,0));return g;}
  function lapBarY(L,W,H,C,m){var g=new THREE.Group(),seg=L/2-C;
    g.add(put(new THREE.Group(),box(W,seg,H,m),0,-(C+seg/2),0));
    g.add(put(new THREE.Group(),box(W,seg,H,m),0,(C+seg/2),0));
    g.add(put(new THREE.Group(),box(W,2*C,H/2,m),0,H/4,0));return g;}
  function buildCross(color){var m=mat(color),A=lapBarX(2.0,0.78,0.34,0.42,m),B=lapBarY(2.0,0.78,0.34,0.42,m);
    var g=new THREE.Group();g.add(A);g.add(B);
    g.userData.explode=function(t){A.position.z=-t*1.35;B.position.z=t*1.35;};return normalize(g);}
  function buildYanwei(color){var m=mat(color),A=lapBarX(2.0,0.66,0.34,0.40,m),B=lapBarY(2.0,0.66,0.34,0.40,m);
    var sh=new THREE.Shape();sh.moveTo(-0.26,0);sh.lineTo(0.26,0);sh.lineTo(0.18,0.30);sh.lineTo(-0.18,0.30);sh.closePath();
    var key=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:0.26,bevelEnabled:false}),m);
    key.rotation.x=-Math.PI/2;key.position.set(0,0.17,0); // 燕尾楔骑在交叉顶
    var g=new THREE.Group();g.add(A);g.add(B);g.add(key);
    g.userData.explode=function(t){A.position.z=-t*1.35;B.position.z=t*1.35;key.position.y=0.17+t*0.85;};return normalize(g);}
  // 斗拱:分层堆叠,拆解时逐层升开(爆炸图式)
  function buildDougong(color){var g=new THREE.Group(),m=mat(color),subs=[];
    function sub(items,base,lift){var gr=new THREE.Group();items.forEach(function(it){gr.add(it);});gr.position.y=base;g.add(gr);subs.push([gr,base,lift]);}
    sub([box(1.05,0.18,0.85,m)],-1.05,0);                 // 座
    sub([box(0.40,0.34,0.40,m)],-0.79,0.55);              // 斗
    sub([box(1.5,0.18,0.22,m)],-0.53,1.10);               // 拱
    var l=new THREE.Group();l.add(put(new THREE.Group(),box(0.26,0.26,0.30,m),-0.60,0,0));l.add(put(new THREE.Group(),box(0.26,0.26,0.30,m),0.60,0,0));sub([l],-0.31,1.70); // 升
    sub([box(0.30,0.22,0.30,m)],-0.33,1.70);              // 上斗
    sub([box(1.9,0.18,0.24,m)],-0.09,2.30);               // 梁
    g.userData.explode=function(t){subs.forEach(function(s){s[0].position.y=s[1]+t*s[2];});};return normalize(g);}
  function buildWell(color){var m=mat(color);var a=box(1.8,0.5,0.26,m),b=box(0.5,1.8,0.26,m),c=box(1.8,0.5,0.26,m);
    a.position.z=-0.26;b.position.z=0;c.position.z=0.26;
    var g=new THREE.Group();g.add(a);g.add(b);g.add(c);
    g.userData.explode=function(t){a.position.z=-0.26-t*0.95;c.position.z=0.26+t*0.95;};return normalize(g);}
  // 鲁班锁:三根方木错位相扣(不穿心),拆解时沿各自轴向滑出
  function buildLuban(color){var m=mat(color),x=new THREE.Group(),y=new THREE.Group(),z=new THREE.Group();
    put(x,box(1.9,0.30,0.30,m),0,0,0.26);put(y,box(0.30,1.9,0.30,m),0.26,0,0);put(z,box(0.30,0.30,1.9,m),0,0.26,0);
    [-0.86,0.86].forEach(function(d){put(x,box(0.56,0.36,0.36,m),d,0,0.26);put(y,box(0.36,0.56,0.36,m),0.26,d,0);put(z,box(0.36,0.36,0.56,m),0,0.26,d);});
    var g=new THREE.Group();g.add(x);g.add(y);g.add(z);
    g.userData.explode=function(t){x.position.x=-t*1.3;y.position.y=t*1.3;z.position.z=t*1.1;};return normalize(g);}
  function buildTongue(color){var m=mat(color),A=new THREE.Group(),B=new THREE.Group();
    A.add(put(new THREE.Group(),box(1.7,0.5,0.2,m),0,0,-0.4));                 // A板
    A.add(put(new THREE.Group(),box(1.7,0.14,0.9,m),0,0,0.05));                // 企口舌(伸向槽内)
    B.add(put(new THREE.Group(),box(1.7,0.18,0.2,m),0,0.18,0.4));              // 上槽板
    B.add(put(new THREE.Group(),box(1.7,0.18,0.2,m),0,-0.18,0.4));             // 下槽板(中间为槽口)
    var g=new THREE.Group();g.add(A);g.add(B);
    g.userData.explode=function(t){A.position.z=-t*1.4;B.position.z=t*1.3;};return normalize(g);}

  // —— 家具(腿脚接合到位,不悬空不穿插) ——
  function buildBench(color){var g=new THREE.Group(),m=mat(color);put(g,box(2.0,0.14,0.5,m),0,0.62,0);
    [-0.78,0.78].forEach(function(x){put(g,box(0.12,0.55,0.48,m),x,0.29,0);});put(g,box(1.65,0.1,0.12,m),0,0.02,0);g.userData.explode=noop;return normalize(g);}
  function buildChair(color){var g=new THREE.Group(),m=mat(color);put(g,box(1.4,0.16,1.2,m),0,0.62,0);
    [[-0.62,-0.52],[0.62,-0.52],[-0.62,0.52],[0.62,0.52]].forEach(function(p){put(g,box(0.14,0.56,0.14,m),p[0],0.25,p[1]);});
    put(g,box(0.14,0.84,0.14,m),-0.62,1.12,-0.52);put(g,box(0.14,0.84,0.14,m),0.62,1.12,-0.52);put(g,box(1.4,0.16,0.14,m),0,1.52,-0.52);
    put(g,box(1.06,0.56,0.07,m),0,1.10,-0.52);put(g,box(0.1,0.36,0.94,m),-0.62,0.94,-0.02);put(g,box(0.1,0.36,0.94,m),0.62,0.94,-0.02);g.userData.explode=noop;return normalize(g);}
  function buildTable(color){var g=new THREE.Group(),m=mat(color);put(g,box(1.9,0.16,1.2,m),0,0.78,0);
    [[-0.82,-0.48],[0.82,-0.48],[-0.82,0.48],[0.82,0.48]].forEach(function(p){put(g,box(0.14,0.70,0.14,m),p[0],0.34,p[1]);});
    put(g,box(1.68,0.1,0.12,m),0,0.64,-0.48);put(g,box(1.68,0.1,0.12,m),0,0.64,0.48);g.userData.explode=noop;return normalize(g);}
  function buildDrumStool(color){var g=new THREE.Group(),m=mat(color);
    g.add(latheMesh([[0,-0.5],[0.34,-0.5],[0.42,-0.30],[0.44,0.0],[0.42,0.30],[0.34,0.5],[0.30,0.5],[0,0.5]],40,m));
    for(var i=0;i<12;i++){var a=i/12*Math.PI*2;put(g,sph(0.05,m),Math.cos(a)*0.44,0.34,Math.sin(a)*0.44);} // 鼓钉
    g.userData.explode=noop;return normalize(g);}
  function buildCabinet(color){var g=new THREE.Group(),m=mat(color);put(g,box(1.5,1.6,0.6,m),0,0.6,0);
    put(g,box(0.72,1.4,0.04,m),-0.37,0.62,0.32);put(g,box(0.72,1.4,0.04,m),0.37,0.62,0.32);
    put(g,box(1.5,0.1,0.6,m),0,1.44,0);put(g,box(1.5,0.1,0.6,m),0,-0.24,0);
    [[-0.6,-0.2],[0.6,-0.2],[-0.6,0.2],[0.6,0.2]].forEach(function(p){put(g,box(0.1,0.16,0.1,m),p[0],-0.36,p[1]);});
    put(g,sph(0.05,m),0,0.62,0.36);g.userData.explode=noop;return normalize(g);}
  function buildShelf(color){var g=new THREE.Group(),m=mat(color);
    [-0.7,0.7].forEach(function(x){put(g,box(0.14,1.8,0.14,m),x,0,0);});
    [-0.6,0.1,0.8].forEach(function(y){put(g,box(1.26,0.12,0.4,m),0,y,0.05);});
    put(g,box(0.14,0.12,0.4,m),0,0.9,-0.2);g.userData.explode=noop;return normalize(g);}

  // —— 建筑 ——
  function buildLattice(color){var g=new THREE.Group(),m=mat(color);
    put(g,box(1.6,0.12,0.12,m),0,0.74,0);put(g,box(1.6,0.12,0.12,m),0,-0.74,0);put(g,box(0.12,1.6,0.12,m),-0.74,0,0);put(g,box(0.12,1.6,0.12,m),0.74,0,0);
    for(var i=-0.45;i<=0.45;i+=0.28){put(g,box(0.05,1.35,0.06,m),i,0,0.05);}for(i=-0.4;i<=0.4;i+=0.3){put(g,box(1.35,0.05,0.06,m),0,i,-0.05);}g.userData.explode=noop;return normalize(g);}
  function buildColumn(color){var g=new THREE.Group(),m=mat(color),base=new THREE.Group(),col=new THREE.Group();
    put(base,box(1.0,0.14,1.0,m),0,-1.0,0);put(base,cyl(0.5,0.42,0.18,8,m),0,-0.86,0);put(col,cyl(0.30,0.34,1.55,32,m),0,0.05,0);put(col,cyl(0.36,0.33,0.16,32,m),0,0.78,0);g.add(base);g.add(col);
    g.userData.explode=function(t){col.position.y=t*1.0;};return normalize(g);}
  function buildPendant(color){var g=new THREE.Group(),m=mat(color);
    put(g,box(0.9,0.5,0.5,m),0,0.72,0);put(g,cyl(0.16,0.22,0.5,14,m),0,0.3,0);put(g,cyl(0.34,0.14,0.5,14,m),0,-0.15,0);put(g,box(0.44,0.18,0.44,m),0,0.9,0);g.userData.explode=noop;return normalize(g);}
  function buildSparrow(color){var g=new THREE.Group(),m=mat(color);
    put(g,box(1.6,0.18,0.18,m),0,-0.2,0);put(g,box(0.18,0.18,1.6,m),0,0,-0.2); // 纵横构件
    put(g,box(0.3,0.9,0.3,m),0,-0.4,-0.4); // 垂柱
    put(g,box(0.16,0.16,0.16,m),-0.6,-0.2,-0.2);g.userData.explode=noop;return normalize(g);}

  // —— 器具(车旋) ——
  function buildBowl(c){return revolve([[0,-0.34],[0.20,-0.34],[0.18,-0.28],[0.24,-0.16],[0.50,0.10],[0.60,0.26],[0.60,0.28],[0.48,0.20],[0.30,0.02],[0.18,-0.12],[0,-0.14]],c,44);}
  function buildPlate(c){return revolve([[0,-0.16],[0.50,-0.16],[0.58,-0.06],[0.66,0.02],[0.60,0.06],[0.30,0.06],[0,-0.02]],c,48);}
  function buildCup(c){return revolve([[0,-0.30],[0.22,-0.30],[0.22,-0.24],[0.18,0.10],[0.22,0.26],[0.24,0.30],[0.20,0.30],[0.12,0.06],[0,-0.06]],c,36);}
  function buildGoblet(c){return revolve([[0,-0.5],[0.14,-0.5],[0.12,-0.30],[0.05,-0.12],[0.08,0.06],[0.24,0.30],[0.26,0.42],[0.22,0.42],[0.12,0.10],[0,-0.02]],c,36);}
  function buildVase(c){return revolve([[0,-0.5],[0.28,-0.5],[0.30,-0.42],[0.22,-0.20],[0.16,0.10],[0.26,0.30],[0.32,0.46],[0.28,0.54],[0.14,0.54],[0,0.44]],c,44);}
  function buildJar(c){return revolve([[0,-0.5],[0.32,-0.5],[0.30,-0.42],[0.24,-0.16],[0.42,0.16],[0.38,0.30],[0.20,0.34],[0,0.34]],c,44);}
  function buildSmallJar(c){return revolve([[0,-0.30],[0.24,-0.30],[0.22,-0.24],[0.18,-0.02],[0.30,0.22],[0.26,0.30],[0.14,0.32],[0,0.30]],c,40);}
  // 香炉 / 棋罐 / 笔筒(带附加件,但按工艺步骤教学)
  function buildCenser(color){var g=new THREE.Group(),m=mat(color);
    g.add(latheMesh([[0,-0.40],[0.30,-0.40],[0.30,-0.32],[0.18,-0.28],[0.24,-0.08],[0.42,0.12],[0.46,0.28],[0.40,0.28],[0.34,0.08],[0,0.02]],40,m));
    for(var i=0;i<3;i++){var a=i/3*Math.PI*2;put(g,cyl(0.05,0.07,0.14,12,m),Math.cos(a)*0.2,-0.48,Math.sin(a)*0.2);}
    [-0.46,0.46].forEach(function(xx){var h=new THREE.Mesh(new THREE.TorusGeometry(0.11,0.028,12,24),m);h.position.set(xx,0.16,0);g.add(h);});
    g.add(latheMesh([[0,0.30],[0.46,0.30],[0.42,0.40],[0.28,0.52],[0,0.58]],36,m));put(g,sph(0.07,m),0,0.63,0);
    g.userData.explode=noop;return normalize(g);}
  function buildGoJar(color){var g=new THREE.Group(),m=mat(color);
    g.add(latheMesh([[0,-0.42],[0.28,-0.42],[0.26,-0.36],[0.16,-0.26],[0.22,0.02],[0.42,0.22],[0.44,0.30],[0.36,0.30],[0,0.26]],40,m));
    put(g,sph(0.30,m),0,0.40,0).scale.set(1,0.55,1);put(g,sph(0.07,m),0,0.55,0);g.userData.explode=noop;return normalize(g);}
  function buildBrushPot(color){var g=new THREE.Group(),m=mat(color);
    g.add(latheMesh([[0,-0.72],[0.30,-0.72],[0.30,-0.60],[0.24,-0.52],[0.22,-0.05],[0.24,0.40],[0.38,0.58],[0.38,0.66],[0.26,0.70],[0,0.70]],40,m));
    var band=new THREE.Mesh(new THREE.TorusGeometry(0.235,0.03,12,30),m);band.rotation.x=Math.PI/2;band.position.y=-0.02;g.add(band);g.userData.explode=noop;return normalize(g);}

  // —— 文房 ——
  function buildPaperweight(color){var g=new THREE.Group(),m=mat(color);
    put(g,box(1.6,0.22,0.5,m),0,0,0);put(g,box(1.7,0.08,0.6,m),0,-0.13,0);put(g,sph(0.06,m),0,0.14,0);g.userData.explode=noop;return normalize(g);}
  function buildSeal(color){var g=new THREE.Group(),m=mat(color);
    put(g,box(0.7,0.9,0.7,m),0,0.15,0);put(g,box(0.8,0.18,0.8,m),0,-0.35,0);put(g,sph(0.22,m),0,0.62,0).scale.set(1,0.7,1);g.userData.explode=noop;return normalize(g);}

  // —— 乐器 / 日用 ——
  function buildWoodfish(color){var g=new THREE.Group(),m=mat(color);
    var body=sph(0.5,m);body.scale.set(1.05,0.72,1.35);g.add(body);
    var slit=new THREE.Mesh(new THREE.TorusGeometry(0.22,0.05,12,24),m);slit.rotation.x=Math.PI/2;slit.position.set(0,0.16,0.18);g.add(slit);
    var mouth=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.12,0.4),mat(0x3a2110));mouth.position.set(0,-0.02,0.66);g.add(mouth);
    g.userData.explode=noop;return normalize(g);}
  function buildComb(color){var g=new THREE.Group(),m=mat(color);
    put(g,box(1.7,0.4,0.14,m),0,0.1,0); // 背
    for(var i=-0.7;i<=0.7;i+=0.14){put(g,box(0.07,0.5,0.1,m),i,-0.3,0);} // 齿
    g.userData.explode=noop;return normalize(g);}

  /* =========================================================
     教学步骤
     ========================================================= */
  var CRAFT=[
    {label:"选材",icon:"🪵",desc:"挑选纹理均匀、无裂无节的木材,顺纹下料,预留加工余量。"},
    {label:"开料",icon:"🪚",desc:"按构件尺寸锯切毛料,规方找平,定出基准面。"},
    {label:"成型",icon:"🔧",desc:"车床旋出器型,或开凿榫头榫眼,构件基本成型。"},
    {label:"打磨",icon:"🪵",desc:"由粗到细多道打磨,消除刀痕,使表面光洁。"},
    {label:"上蜡",icon:"✨",desc:"蜂蜡养护,封闭木孔,凸显温润包浆与木纹。"}
  ];
  var JOIN_STEPS={dougong:[
      {label:"立柱承托",icon:"🏛️",desc:"底座大斗安放于柱头,承托上部荷载。"},
      {label:"安拱",icon:"➖",desc:"横向拱木插入斗口,向外挑出。"},
      {label:"置升",icon:"🔲",desc:"拱端各置升,承托上层。"},
      {label:"装梁枋",icon:"🏗️",desc:"顶部梁枋逐层落位,榫卯层层锁紧。"}],
    yanwei:[{label:"开榫槽",icon:"🔩",desc:"榫头外宽内窄,形似燕尾。"},{label:"插入卡紧",icon:"🔗",desc:"榫头装入槽中,越拉越紧。"},{label:"耐震抗拔",icon:"💪",desc:"承受拉力不脱,是梁架加固之选。"}],
    cross:[{label:"凿半榫口",icon:"🪓",desc:"两方木各凿一半厚度的榫口。"},{label:"十字咬合",icon:"➕",desc:"榫口交错对合,严丝合缝。"},{label:"交接锁紧",icon:"🔒",desc:"结构简单却异常牢固。"}],
    well:[{label:"下层横木",icon:"⬅️",desc:"先置下层横木。"},{label:"中层纵木",icon:"↔️",desc:"再交叠中层纵木。"},{label:"上层横木",icon:"➡️",desc:"叠压上层横木。"},{label:"三层叠锁",icon:"🗼",desc:"井字交错,层层锁定。"}],
    luban:[{label:"三轴交叠",icon:"🧊",desc:"三根木条按 X/Y/Z 轴交叠。"},{label:"穿插锁定",icon:"🔒",desc:"端部小块互卡,牵一发而动全身。"},{label:"巧解机关",icon:"🧩",desc:"找对顺序方可拆开,机关巧妙。"}],
    tongue:[{label:"开企口",icon:"🪚",desc:"一板留舌、一板开槽。"},{label:"舌槽咬合",icon:"🔗",desc:"舌嵌入槽,严丝合缝。"},{label:"镶入拼板",icon:"🧱",desc:"多板镶接成整面,不透缝。"}]};

  /* =========================================================
     数据(30 件,跨流派)
     ========================================================= */
  var DATA=[
    // 榫卯(6,multiPart)
    {id:"dougong",name:"一斗三升斗拱",cat:"榫卯",era:"清",shop:"客家围屋工坊",wood:"楠木",size:"82×56×42cm",no:"MT-SM-001",color:0xb8864a,build:buildDougong,multiPart:true,badge:"非遗木作",desc:"客家围屋承重与出檐的核心构件。斗与升层层垒叠、拱木穿插咬合,不施一钉,把屋面荷载均匀传到柱上。"},
    {id:"yanwei",name:"燕尾榫连接构件",cat:"榫卯",era:"清",shop:"赣南围屋工坊",wood:"榉木",size:"48×22×12cm",no:"MT-SM-002",color:0xc98a4b,build:buildYanwei,multiPart:true,badge:"非遗木作",desc:"梁架最常用的加固榫。两端外宽内窄形似燕尾,装入槽后越拉越紧,耐震抗拔。"},
    {id:"cross",name:"十字榫方木",cat:"榫卯",era:"明",shop:"客家围屋工坊",wood:"樟木",size:"56×30×30cm",no:"MT-SM-003",color:0xd6a55c,build:buildCross,multiPart:true,desc:"两方木各凿一半厚度的榫口,十字交汇相互咬合,用于地梁与穿枋交接。"},
    {id:"well",name:"井字榫木架",cat:"榫卯",era:"清",shop:"客家围屋工坊",wood:"杉木",size:"90×70×18cm",no:"MT-SM-004",color:0xb07a45,build:buildWell,multiPart:true,badge:"非遗木作",desc:"三根方木以井字交错叠压,靠榫卯层层锁定,多用于井栏、晾架与仓架。"},
    {id:"luban",name:"鲁班锁",cat:"榫卯",era:"清",shop:"东阳木雕",wood:"榉木",size:"28×28×28cm",no:"MT-SM-005",color:0xc59a63,build:buildLuban,multiPart:true,badge:"非遗木作",desc:"由多根木条按三轴交叠、相互制约而成,外形严整,拆装机关巧妙,是榫卯智慧的趣味化身。"},
    {id:"tongue",name:"企口拼板",cat:"榫卯",era:"明",shop:"徽作",wood:"杉木",size:"90×60×20cm",no:"MT-SM-006",color:0xa97b4c,build:buildTongue,multiPart:true,desc:"一板留舌、一板开槽,相邻板材舌槽咬合后拼成整面,不渗缝、不变形。"},
    // 家具(6)
    {id:"bench",name:"榫卯长凳",cat:"家具",era:"近现代",shop:"江西木作",wood:"榉木",size:"160×42×52cm",no:"MT-JJ-001",color:0xd8b06a,build:buildBench,desc:"厅堂常见的坐具。凳面厚实、四腿以透榫贯穿固定,无钉无胶亦稳固耐用。"},
    {id:"chair",name:"圈背扶手椅",cat:"家具",era:"明",shop:"苏作",wood:"黄花梨",size:"112×64×52cm",no:"MT-JJ-002",color:0xb0713a,build:buildChair,badge:"非遗木作",desc:"明式家具经典。后背中空透气、搭脑圆润,榫卯精密,线条简练。"},
    {id:"table",name:"四平八稳方桌",cat:"家具",era:"明",shop:"苏作",wood:"榉木",size:"96×96×80cm",no:"MT-JJ-003",color:0xc0905a,build:buildTable,desc:"桌面平整、四腿坚实,牙条加固,是厅堂陈设与用餐的核心家具。"},
    {id:"stool",name:"鼓钉绣墩",cat:"家具",era:"清",shop:"江西木作",wood:"樟木",size:"46×46×44cm",no:"MT-JJ-004",color:0xb07a45,build:buildDrumStool,badge:"非遗木作",desc:"形似鼓,周身车旋成弧腹,上下满布鼓钉,稳重又不失圆润,是明清坐具名品。"},
    {id:"cabinet",name:"双门木柜",cat:"家具",era:"清",shop:"徽作",wood:"楠木",size:"120×100×52cm",no:"MT-JJ-005",color:0x9c6b3c,build:buildCabinet,desc:"双开门、四足落地,顶面与底座齐整,是柜类家具的基本型。"},
    {id:"shelf",name:"博古架",cat:"家具",era:"清",shop:"东阳木雕",wood:"楠木",size:"140×120×30cm",no:"MT-JJ-006",color:0xb8864a,build:buildShelf,badge:"非遗木作",desc:"多格错落,陈设古玩器物,格架以榫卯相连,是文人雅士书斋常见之物。"},
    // 建筑(4)
    {id:"lattice",name:"格栅窗棂",cat:"建筑",era:"清",shop:"龙南关西新围",wood:"楠木",size:"120×90×6cm",no:"MT-JZ-001",color:0x9c6b3c,build:buildLattice,badge:"非遗木作",desc:"围屋外墙的装饰木窗。方形格栅疏密有致,既利通风采光,又寄托‘方方正正’的寓意。"},
    {id:"column",name:"木柱与柱础",cat:"建筑",era:"明",shop:"赣南围屋工坊",wood:"杉木",size:"210×48×48cm",no:"MT-JZ-002",color:0x8a5a2f,build:buildColumn,desc:"廊道承重木柱立于鼓形石础之上,础既防水防潮又承托柱身。"},
    {id:"pendant",name:"垂花门簪",cat:"建筑",era:"清",shop:"赣州客家围屋",wood:"黄杨木",size:"38×22×22cm",no:"MT-JZ-003",color:0xa9723f,build:buildPendant,badge:"非遗木作",desc:"大门上方垂下的雕花木饰,形似花蕾倒悬,兼具结构与装饰之用。"},
    {id:"sparrow",name:"雀替",cat:"建筑",era:"清",shop:"东阳木雕",wood:"樟木",size:"62×46×20cm",no:"MT-JZ-004",color:0xa2592f,build:buildSparrow,desc:"柱与梁枋交接处的托座,承托并装饰,是中式古建的典型构件。"},
    // 器具(9)
    {id:"bowl",name:"木胎旋制大碗",cat:"器具",era:"宋",shop:"江西木作",wood:"榆木",size:"28×16×16cm",no:"MT-QJ-001",color:0xc59a63,build:buildBowl,desc:"整木车旋成型,薄壁圆润,保留天然木纹,是民间日用与茶席常用器物。"},
    {id:"plate",name:"木胎圆盘",cat:"器具",era:"宋",shop:"江西木作",wood:"椴木",size:"26×4×26cm",no:"MT-QJ-002",color:0xd8b06a,build:buildPlate,desc:"浅盘宽沿,车旋光洁,可盛果品点心,亦作茶席托盏。"},
    {id:"cup",name:"木胎茶杯",cat:"器具",era:"宋",shop:"建盏风格",wood:"紫檀",size:"8×7×7cm",no:"MT-QJ-003",color:0x7a4632,build:buildCup,badge:"非遗木作",desc:"深腹小杯,口沿微露,木色温润,配茶香而生雅趣。"},
    {id:"goblet",name:"高足木杯",cat:"器具",era:"唐",shop:"广东木作",wood:"楠木",size:"16×8×8cm",no:"MT-QJ-004",color:0xa97b4c,build:buildGoblet,desc:"高足托杯,杯身略深,是唐宋宴饮器具,木作工艺与器物形的结合。"},
    {id:"vase",name:"木胎梅瓶",cat:"器具",era:"明",shop:"苏作",wood:"黄杨木",size:"32×14×14cm",no:"MT-QJ-005",color:0xc6a15e,build:buildVase,badge:"非遗木作",desc:"小口、丰肩、瘦底,是经典的插花器形,木质润泽,久赏愈佳。"},
    {id:"jar",name:"木胎盖罐",cat:"器具",era:"清",shop:"徽作",wood:"楠木",size:"24×16×16cm",no:"MT-QJ-006",color:0xb07a45,build:buildJar,desc:"圆腹敛口,可储茶、贮物,器形饱满,车旋一丝不苟。"},
    {id:"censer",name:"三足木胎香炉",cat:"器具",era:"清",shop:"东阳木雕",wood:"红花梨",size:"20×16×16cm",no:"MT-QJ-007",color:0xa2592f,build:buildCenser,badge:"非遗木作",desc:"炉身车旋、三足鼎立、两侧炉耳,配穹顶盖与盖钮,是书斋清供之器。"},
    {id:"gojar",name:"木胎围棋罐",cat:"器具",era:"清",shop:"徽作",wood:"楠木",size:"18×14×14cm",no:"MT-QJ-008",color:0xa97b4c,build:buildGoJar,badge:"非遗木作",desc:"棋罐成对,罐盖圆拱、口沿饱满,是文人书房雅器。"},
    {id:"smalljar",name:"木胎小罐",cat:"器具",era:"清",shop:"江西木作",wood:"樟木",size:"16×11×11cm",no:"MT-QJ-009",color:0xc0905a,build:buildSmallJar,desc:"小巧圆罐,可贮茶、藏香,把玩实用两相宜。"},
    // 文房(3)
    {id:"bitong",name:"木胎笔筒",cat:"文房",era:"清",shop:"江西木作",wood:"紫檀",size:"18×12×12cm",no:"MT-WF-001",color:0x7a4632,build:buildBrushPot,badge:"非遗木作",desc:"书斋必备。整木车旋,口沿外翻、腰身微束,集车、磨、蜡等工序于一身。"},
    {id:"paperweight",name:"木镇纸",cat:"文房",era:"明",shop:"湖州文房",wood:"红木",size:"24×5×2cm",no:"MT-WF-002",color:0x8a5a2f,build:buildPaperweight,desc:"压纸镇尺,长方厚实,边角圆润,是书画案头小品。"},
    {id:"seal",name:"木质印章",cat:"文房",era:"唐",shop:"广东木作",wood:"黄杨木",size:"9×5×5cm",no:"MT-WF-003",color:0xc6a15e,build:buildSeal,desc:"书画家钤印之物。印钮圆润便于把持,木纹细腻,久用愈见包浆。"},
    // 乐器 / 日用(2)
    {id:"woodfish",name:"木鱼",cat:"乐器",era:"清",shop:"东阳木雕",wood:"香樟木",size:"22×18×14cm",no:"MT-YQ-001",color:0xa9723f,build:buildWoodfish,badge:"非遗木作",desc:"佛寺诵经击打乐器,声如木响、余韵清越,是木雕与声学结合的典型器物。"},
    {id:"comb",name:"木梳",cat:"器具",era:"近现代",shop:"江西木作",wood:"黄杨木",size:"16×6×2cm",no:"MT-YQ-002",color:0xc6a15e,build:buildComb,desc:"齿密而匀,梳背圆润,梳发养发,是随手可用的木作小器。"}
  ];
  DATA.forEach(function(a){a.steps=a.multiPart?JOIN_STEPS[a.id]:CRAFT;});

  /* =========================================================
     UI 逻辑
     ========================================================= */
  var state={cat:"全部",era:"全部年代",shop:"全部工坊",kw:""};
  var IMG={},detail=null,searchTimer=null;
  function el(id){return document.getElementById(id);}

  // 生成产品照(共享一个离屏 WebGL,逐一渲染)
  function snapshot(build,color){
    var cnv=snapCanvas,r=snapR,scene=new THREE.Scene();addLights(scene);
    var m=build(color);scene.add(m.root);addGround(scene,m.r);
    var cam=new THREE.PerspectiveCamera(42,1,0.01,100);cam.position.set(m.r*1.7,m.r*1.4,m.r*1.85);cam.lookAt(0,0,0);
    r.render(scene,cam);
    var url=cnv.toDataURL("image/png");
    return url;
  }
  var snapCanvas=document.createElement("canvas");snapCanvas.width=snapCanvas.height=460;
  var snapR=null;

  function initSnap(){ if(!THREE_OK)return; snapR=makeRenderer(snapCanvas,1); DATA.forEach(function(a){IMG[a.id]=snapshot(a.build,a.color);}); }

  function filtered(){
    return DATA.filter(function(a){
      if(state.cat!=="全部"&&state.cat!=="更多"&&a.cat!==state.cat)return false;
      if(state.era!=="全部年代"&&a.era!==state.era)return false;
      if(state.shop!=="全部工坊"&&a.shop!==state.shop)return false;
      if(state.kw){var k=state.kw.toLowerCase();if(a.name.toLowerCase().indexOf(k)<0&&a.shop.toLowerCase().indexOf(k)<0&&a.wood.toLowerCase().indexOf(k)<0)return false;}
      return true;
    });
  }
  function renderGrid(){
    var list=filtered();el("count").textContent=list.length+" 件";
    grid.innerHTML="";
    if(!list.length){emptyEl.classList.remove("hidden");return;}
    emptyEl.classList.add("hidden");
    list.forEach(function(a){
      var card=document.createElement("article");card.className="card";card.setAttribute("data-id",a.id);
      var img=IMG[a.id];
      card.innerHTML='<div class="thumb">'+(img?'<img class="thumb-img" src="'+img+'" alt="'+a.name+'">':'<div class="ph">木</div>')+'<span class="v">3D</span></div>'+
        '<div class="card-body">'+(a.badge?'<span class="badge">'+a.badge+'</span>':'')+'<h3 class="name">'+a.name+'</h3><div class="sub">'+a.era+' ｜ '+a.shop+'</div></div>';
      card.addEventListener("click",function(){openDetail(a);});
      grid.appendChild(card);
    });
  }

  function buildDetailScene(a){
    var canvas=el("viewCanvas"),renderer=makeRenderer(canvas),scene=new THREE.Scene();addLights(scene);
    var built=a.build(a.color);scene.add(built.root);addGround(scene,built.r);
    var w=canvas.clientWidth||300,h=canvas.clientHeight||300,camera=new THREE.PerspectiveCamera(42,w/h,0.01,100);
    camera.position.set(built.r*1.7,built.r*1.45,built.r*1.9);
    var controls=new THREE.OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;controls.dampingFactor=0.08;controls.minDistance=built.r*0.6;controls.maxDistance=built.r*4.5;controls.target.set(0,0,0);
    renderer.setSize(w,h,false);
    detail={renderer:renderer,scene:scene,camera:camera,controls:controls,built:built,canvas:canvas,
      multiPart:!!a.multiPart,steps:a.steps,t:0,play:false,mode:"info",stepIdx:0,hasExplode:!!a.multiPart};
  }
  function closeDetailScene(){if(!detail)return;try{detail.controls&&detail.controls.dispose();}catch(e){}try{detail.renderer.dispose();}catch(e){}detail=null;}

  function openDetail(a){
    if(detail)closeDetailScene();
    el("overlay").classList.remove("hidden");document.body.style.overflow="hidden";
    el("dTitle").textContent=a.name;el("dMeta").textContent=a.era+" ｜ "+a.shop+" ｜ "+a.wood;
    var b=el("dBadge");if(a.badge){b.textContent=a.badge;b.style.display="inline-block";}else{b.style.display="none";}
    el("dMat").textContent=a.wood;el("dSize").textContent=a.size;el("dNo").textContent=a.no;el("dDesc").textContent=a.desc;
    showPanel("info");if(THREE_OK)buildDetailScene(a);
  }
  function showPanel(which){
    el("infoPanel").classList.toggle("hidden",which!=="info");
    el("teachPanel").classList.toggle("hidden",which!=="teach");
    if(detail){detail.mode=which;if(which==="info"){detail.play=false;detail.t=0;}}
  }
  function closeDetail(){el("overlay").classList.add("hidden");document.body.style.overflow="";closeDetailScene();}

  // —— 教学实训 ——
  function openTeach(){
    if(!detail)return;
    showPanel("teach");
    detail.play=false;detail.t=0;detail.stepIdx=0;
    el("tKicker").textContent=detail.multiPart?"榫卯拆解演示":"工艺步骤演示";
    el("tName").textContent=el("dTitle").textContent;
    el("tNote").textContent=detail.multiPart?"拖动进度条或点『自动』,看着构件逐步拆解 / 组装":"拖动进度条或点『自动』,按工序讲解制作步骤";
    renderStepList(0);setPlayBtn(false);updateTeach();
  }
  function renderStepList(idx){
    var ol=el("tSteps");ol.innerHTML="";
    detail.steps.forEach(function(s,i){
      var li=document.createElement("li");li.className=i===idx?"active":"";
      li.innerHTML='<span class="n">'+(i+1)+'</span><span class="tl">'+s.icon+' '+s.label+'</span>';
      ol.appendChild(li);
    });
  }
  function updateTeach(){
    if(!detail||detail.mode!=="teach")return;
    var n=detail.steps.length;
    var idx=detail.multiPart?Math.min(n-1,Math.floor(detail.t*n)):Math.min(n-1,Math.round(detail.t*(n-1)));
    if(idx!==detail.stepIdx){detail.stepIdx=idx;renderStepList(idx);}
    var s=detail.steps[idx];
    el("tIcon").textContent=s.icon;el("tLabel").textContent=s.label;el("tDesc").textContent=s.desc;
    el("tRange").value=Math.round(detail.t*100);
    if(detail.hasExplode)detail.target=detail.t;else detail.target=0;
  }
  function setPlayBtn(playing){el("tPlay").textContent=playing?"⏸ 暂停":"▶ 自动拆解";}
  function togglePlay(){if(!detail)return;detail.play=!detail.play;setPlayBtn(detail.play);}

  function tick(){
    requestAnimationFrame(tick);
    if(detail){
      if(detail.mode==="teach"&&detail.play){detail.t+=0.006;if(detail.t>=1){detail.t=1;detail.play=false;setPlayBtn(false);}updateTeach();}
      if(detail.hasExplode){detail.target=detail.mode==="teach"?detail.t:0;}
      var tprev=detail._t||0;detail._t=(detail._t||0)+1;
      detail.explode=(detail.explode||0)+((detail.target||0)-(detail.explode||0))*0.12;
      if(detail.built.root.userData.explode)detail.built.root.userData.explode(detail.explode);
      detail.controls.update();detail.renderer.render(detail.scene,detail.camera);
    }
  }

  function sizeDetail(){if(!detail)return;var w=detail.canvas.clientWidth||300,h=detail.canvas.clientHeight||300;detail.renderer.setSize(w,h,false);detail.camera.aspect=w/h;detail.camera.updateProjectionMatrix();}

  /* ---------- 事件 ---------- */
  var grid=el("grid"),emptyEl=el("empty");
  document.querySelectorAll(".cat").forEach(function(btn){btn.addEventListener("click",function(){
    document.querySelectorAll(".cat").forEach(function(b){b.classList.remove("active");});btn.classList.add("active");
    state.cat=btn.getAttribute("data-cat");renderGrid();});});
  el("searchInput").addEventListener("input",function(e){clearTimeout(searchTimer);searchTimer=setTimeout(function(){state.kw=e.target.value.trim();renderGrid();},170);});
  el("tf3d").addEventListener("click",function(){var on=!el("tf3d").classList.contains("on");el("tf3d").classList.toggle("on",on);if(detail){detail.camera.position.set(detail.built.r*(on?1.9:2.6),detail.built.r*(on?1.45:1.1),detail.built.r*(on?1.9:2.2));}});
  function bindMenu(menu,chip,cb){chip.addEventListener("click",function(e){e.stopPropagation();(menu===el("eraMenu")?el("shopMenu"):el("eraMenu")).classList.add("hidden");menu.classList.toggle("hidden");});
    menu.querySelectorAll("button").forEach(function(btn){btn.addEventListener("click",function(e){e.stopPropagation();
      menu.querySelectorAll("button").forEach(function(b){b.classList.remove("active");});btn.classList.add("active");menu.classList.add("hidden");cb(btn.textContent);});});}
  bindMenu(el("eraMenu"),el("eraChip"),function(v){state.era=v;renderGrid();});
  bindMenu(el("shopMenu"),el("shopChip"),function(v){state.shop=v;renderGrid();});
  document.addEventListener("click",function(){el("eraMenu").classList.add("hidden");el("shopMenu").classList.add("hidden");});
  el("closeBtn").addEventListener("click",closeDetail);
  el("overlay").addEventListener("click",function(e){if(e.target===el("overlay"))closeDetail();});
  el("actFav").addEventListener("click",function(e){var b=e.currentTarget;b.textContent=b.textContent.indexOf("♥")<0?"♥ 已收藏":"♡ 收藏";});
  el("actShare").addEventListener("click",function(){alert("分享链接已复制(演示)。");});
  el("actLearn").addEventListener("click",openTeach);
  el("teachBack").addEventListener("click",function(){showPanel("info");});
  el("tPlay").addEventListener("click",togglePlay);
  el("tRange").addEventListener("input",function(e){if(!detail)return;detail.play=false;setPlayBtn(false);detail.t=e.target.value/100;updateTeach();});
  el("tMode").addEventListener("click",function(){if(!detail)return;detail.play=false;setPlayBtn(false);detail.t=detail.t<0.5?1:0;updateTeach();});
  window.addEventListener("resize",sizeDetail);
  document.addEventListener("keydown",function(e){if(e.key==="Escape")closeDetail();});

  if(!THREE_OK){grid.innerHTML='<div class="empty">3D 引擎加载失败,请联网后刷新页面。</div>';return;}
  initSnap();renderGrid();tick();
})();
