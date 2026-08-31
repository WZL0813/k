/* =========================================================
   木语 · 榫卯 — 木作技艺数字典藏  (v5)
   封面=真实图片 · 点开=可旋转3D模型 · 内置旋转 · 无宗教元素
   ========================================================= */
(function(){
  "use strict";
  var THREE_OK = typeof THREE!=="undefined" && THREE.WebGLRenderer;

  /* ---- 木纹 ---- */
  function grainLine(x,size,a,col){var px=Math.random()*size;x.strokeStyle=col+a+")";x.lineWidth=0.6+Math.random()*1.8;x.beginPath();x.moveTo(px,0);for(var y=0;y<=size;y+=5){px+=(Math.random()-0.5)*3.2;x.lineTo(px,y);}x.stroke();}
  function knot(x,size){var cx=30+Math.random()*(size-60),cy=30+Math.random()*(size-60);for(var i=5;i>0;i--){x.beginPath();x.strokeStyle="rgba(40,20,5,"+(0.04+0.06*i)+")";x.lineWidth=1+i*0.5;x.ellipse(cx,cy,i*3,i*4.4,0,0,Math.PI*2);x.stroke();}}
  function makeWoodTex(base){var size=256,c=document.createElement("canvas");c.width=c.height=size;var x=c.getContext("2d");var r=(base>>16)&255,g=(base>>8)&255,b=base&255;
    x.fillStyle="rgb("+r+","+g+","+b+")";x.fillRect(0,0,size,size);var i;
    for(i=0;i<size;i+=3){x.fillStyle="rgba(0,0,0,"+(Math.random()*0.06)+")";x.fillRect(i,0,3,size);}
    for(i=0;i<95;i++){grainLine(x,size,0.03+Math.random()*0.08,Math.random()<0.5?"rgba(0,0,0,":"rgba(255,240,220,");}
    for(i=0;i<4;i++){knot(x,size);}
    var map=new THREE.CanvasTexture(c);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.encoding=THREE.sRGBEncoding;
    var cb=document.createElement("canvas");cb.width=cb.height=size;var xb=cb.getContext("2d");xb.fillStyle="#808080";xb.fillRect(0,0,size,size);
    for(i=0;i<95;i++){grainLine(xb,size,0.18+Math.random()*0.24,"rgba(255,255,255,");}
    var bump=new THREE.CanvasTexture(cb);bump.wrapS=bump.wrapT=THREE.RepeatWrapping;return {map:map,bump:bump};}
  function mat(base){var t=makeWoodTex(base);var m=new THREE.MeshStandardMaterial({map:t.map,bumpMap:t.bump,bumpScale:0.02,roughness:0.6,metalness:0.02});m.side=THREE.DoubleSide;return m;}
  function box(w,h,d,m){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);}
  function cyl(rt,rb,h,seg,m){return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m);}
  function sph(r,m){return new THREE.Mesh(new THREE.SphereGeometry(r,24,18),m);}
  function put(g,m,x,y,z,rot){m.position.set(x,y,z);if(rot){if(rot.x)m.rotation.x=rot.x;if(rot.y)m.rotation.y=rot.y;if(rot.z)m.rotation.z=rot.z;}g.add(m);return m;}
  function latheMesh(pts,seg,m){return new THREE.Mesh(new THREE.LatheGeometry(pts.map(function(p){return new THREE.Vector2(p[0],p[1]);}),seg||36),m);}
  function noop(){}

  /* ============ 模型(返回 {root, r},调用方统一居中) ============ */
  function buildDougong(c){var g=new THREE.Group(),m=mat(c),subs=[];function sub(it,base,lift){var gr=new THREE.Group();it.forEach(function(o){gr.add(o);});gr.position.y=base;g.add(gr);subs.push([gr,base,lift]);}
    sub([box(1.05,0.18,0.85,m)],-1.05,0);sub([box(0.40,0.34,0.40,m)],-0.79,0.55);sub([box(1.5,0.18,0.22,m)],-0.53,1.10);
    var l=new THREE.Group();l.add(put(new THREE.Group(),box(0.26,0.26,0.30,m),-0.60,0,0));l.add(put(new THREE.Group(),box(0.26,0.26,0.30,m),0.60,0,0));sub([l],-0.31,1.70);
    sub([box(0.30,0.22,0.30,m)],-0.33,1.70);sub([box(1.9,0.18,0.24,m)],-0.09,2.30);
    g.userData.explode=function(t){subs.forEach(function(s){s[0].position.y=s[1]+t*s[2];});};return {root:g,r:1};}
  function buildYanwei(c){var g=new THREE.Group(),m=mat(c),L=2.0,W=0.66,H=0.34,C=0.40,seg=L/2-C,A=new THREE.Group(),B=new THREE.Group();
    A.add(put(new THREE.Group(),box(seg,W,H,m),-(C+seg/2),0,0));A.add(put(new THREE.Group(),box(seg,W,H,m),(C+seg/2),0,0));A.add(put(new THREE.Group(),box(2*C,W,H/2,m),0,-H/4,0));
    B.add(put(new THREE.Group(),box(W,seg,H,m),0,-(C+seg/2),0));B.add(put(new THREE.Group(),box(W,seg,H,m),0,(C+seg/2),0));B.add(put(new THREE.Group(),box(W,2*C,H/2,m),0,H/4,0));
    var sh=new THREE.Shape();sh.moveTo(-0.26,0);sh.lineTo(0.26,0);sh.lineTo(0.18,0.30);sh.lineTo(-0.18,0.30);sh.closePath();
    var key=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:0.26,bevelEnabled:false}),m);key.rotation.x=-Math.PI/2;key.position.set(0,0.17,0);
    g.add(A);g.add(B);g.add(key);g.userData.explode=function(t){A.position.z=-t*1.35;B.position.z=t*1.35;key.position.y=0.17+t*0.85;};return {root:g,r:1};}
  function buildCross(c){var g=new THREE.Group(),m=mat(c),L=2.0,W=0.78,H=0.34,C=0.42,seg=L/2-C,A=new THREE.Group(),B=new THREE.Group();
    A.add(put(new THREE.Group(),box(seg,W,H,m),-(C+seg/2),0,0));A.add(put(new THREE.Group(),box(seg,W,H,m),(C+seg/2),0,0));A.add(put(new THREE.Group(),box(2*C,W,H/2,m),0,-H/4,0));
    B.add(put(new THREE.Group(),box(W,seg,H,m),0,-(C+seg/2),0));B.add(put(new THREE.Group(),box(W,seg,H,m),0,(C+seg/2),0));B.add(put(new THREE.Group(),box(W,2*C,H/2,m),0,H/4,0));
    g.add(A);g.add(B);g.userData.explode=function(t){A.position.z=-t*1.35;B.position.z=t*1.35;};return {root:g,r:1};}
  function buildWell(c){var m=mat(c),a=box(1.8,0.5,0.26,m),b=box(0.5,1.8,0.26,m),d=box(1.8,0.5,0.26,m);a.position.z=-0.26;b.position.z=0;d.position.z=0.26;var g=new THREE.Group();g.add(a);g.add(b);g.add(d);
    g.userData.explode=function(t){a.position.z=-0.26-t*0.95;d.position.z=0.26+t*0.95;};return {root:g,r:1};}
  function buildLuban(c){var m=mat(c),x=new THREE.Group(),y=new THREE.Group(),z=new THREE.Group();put(x,box(1.9,0.30,0.30,m),0,0,0.26);put(y,box(0.30,1.9,0.30,m),0.26,0,0);put(z,box(0.30,0.30,1.9,m),0,0.26,0);
    [-0.86,0.86].forEach(function(dd){put(x,box(0.56,0.36,0.36,m),dd,0,0.26);put(y,box(0.36,0.56,0.36,m),0.26,dd,0);put(z,box(0.36,0.36,0.56,m),0,0.26,dd);});var g=new THREE.Group();g.add(x);g.add(y);g.add(z);
    g.userData.explode=function(t){x.position.x=-t*1.3;y.position.y=t*1.3;z.position.z=t*1.1;};return {root:g,r:1};}
  function buildTongue(c){var m=mat(c),A=new THREE.Group(),B=new THREE.Group();A.add(put(new THREE.Group(),box(1.7,0.5,0.2,m),0,0,-0.4));A.add(put(new THREE.Group(),box(1.7,0.14,0.9,m),0,0,0.05));
    B.add(put(new THREE.Group(),box(1.7,0.18,0.2,m),0,0.18,0.4));B.add(put(new THREE.Group(),box(1.7,0.18,0.2,m),0,-0.18,0.4));var g=new THREE.Group();g.add(A);g.add(B);
    g.userData.explode=function(t){A.position.z=-t*1.4;B.position.z=t*1.3;};return {root:g,r:1};}
  // 家具
  function fChair(c){var g=new THREE.Group(),m=mat(c);put(g,box(1.4,0.16,1.2,m),0,0.62,0);[[-0.62,-0.52],[0.62,-0.52],[-0.62,0.52],[0.62,0.52]].forEach(function(p){put(g,box(0.14,0.56,0.14,m),p[0],0.25,p[1]);});
    put(g,box(0.14,0.84,0.14,m),-0.62,1.12,-0.52);put(g,box(0.14,0.84,0.14,m),0.62,1.12,-0.52);put(g,box(1.4,0.16,0.14,m),0,1.52,-0.52);put(g,box(1.06,0.56,0.07,m),0,1.10,-0.52);put(g,box(0.1,0.36,0.94,m),-0.62,0.94,-0.02);put(g,box(0.1,0.36,0.94,m),0.62,0.94,-0.02);return {root:g,r:1};}
  function fTable(c){var g=new THREE.Group(),m=mat(c);put(g,box(1.9,0.16,1.2,m),0,0.78,0);[[-0.82,-0.48],[0.82,-0.48],[-0.82,0.48],[0.82,0.48]].forEach(function(p){put(g,box(0.14,0.70,0.14,m),p[0],0.34,p[1]);});put(g,box(1.68,0.1,0.12,m),0,0.64,-0.48);put(g,box(1.68,0.1,0.12,m),0,0.64,0.48);return {root:g,r:1};}
  function fBench(c){var g=new THREE.Group(),m=mat(c);put(g,box(2.0,0.14,0.5,m),0,0.62,0);[-0.78,0.78].forEach(function(x){put(g,box(0.12,0.55,0.48,m),x,0.29,0);});put(g,box(1.65,0.1,0.12,m),0,0.02,0);return {root:g,r:1};}
  function fStool(c){var g=new THREE.Group(),m=mat(c);g.add(latheMesh([[0,-0.5],[0.34,-0.5],[0.42,-0.30],[0.44,0.0],[0.42,0.30],[0.34,0.5],[0.30,0.5],[0,0.5]],40,m));for(var i=0;i<12;i++){var a=i/12*Math.PI*2;put(g,sph(0.05,m),Math.cos(a)*0.44,0.34,Math.sin(a)*0.44);}return {root:g,r:1};}
  function fCabinet(c){var g=new THREE.Group(),m=mat(c);put(g,box(1.5,1.6,0.6,m),0,0.6,0);put(g,box(0.72,1.4,0.04,m),-0.37,0.62,0.32);put(g,box(0.72,1.4,0.04,m),0.37,0.62,0.32);put(g,box(1.5,0.1,0.6,m),0,1.44,0);put(g,box(1.5,0.1,0.6,m),0,-0.24,0);[[-0.6,-0.2],[0.6,-0.2],[-0.6,0.2],[0.6,0.2]].forEach(function(p){put(g,box(0.1,0.16,0.1,m),p[0],-0.36,p[1]);});return {root:g,r:1};}
  function fShelf(c){var g=new THREE.Group(),m=mat(c);[-0.7,0.7].forEach(function(x){put(g,box(0.14,1.8,0.14,m),x,0,0);});[-0.6,0.1,0.8].forEach(function(y){put(g,box(1.26,0.12,0.4,m),0,y,0.05);});put(g,box(0.14,0.12,0.4,m),0,0.9,-0.2);return {root:g,r:1};}
  function fScreen(c){var g=new THREE.Group(),m=mat(c);[[-0.85,0.15],[0,0.05],[0.85,0.15]].forEach(function(p){put(g,box(0.8,1.7,0.08,m),p[0],0,p[1]).rotation.y=(p[0]/0.85)*0.4;});return {root:g,r:1};}
  function fBed(c){var g=new THREE.Group(),m=mat(c);put(g,box(2.0,0.24,1.4,m),0,0.4,0);[[-0.9,-0.6],[0.9,-0.6],[-0.9,0.6],[0.9,0.6]].forEach(function(p){put(g,box(0.16,0.4,0.16,m),p[0],0,p[1]);});put(g,box(2.0,0.5,0.06,m),0,0.9,-0.7);put(g,box(0.06,0.5,1.4,m),-1.0,0.9,0);return {root:g,r:1};}
  // 建筑
  function bLattice(c){var g=new THREE.Group(),m=mat(c);put(g,box(1.6,0.12,0.12,m),0,0.74,0);put(g,box(1.6,0.12,0.12,m),0,-0.74,0);put(g,box(0.12,1.6,0.12,m),-0.74,0,0);put(g,box(0.12,1.6,0.12,m),0.74,0,0);for(var i=-0.45;i<=0.45;i+=0.28){put(g,box(0.05,1.35,0.06,m),i,0,0.05);}for(i=-0.4;i<=0.4;i+=0.3){put(g,box(1.35,0.05,0.06,m),0,i,-0.05);}return {root:g,r:1};}
  function bColumn(c){var g=new THREE.Group(),m=mat(c);put(g,box(1.0,0.14,1.0,m),0,-1.0,0);put(g,cyl(0.5,0.42,0.18,8,m),0,-0.86,0);put(g,cyl(0.30,0.34,1.55,28,m),0,0.05,0);put(g,cyl(0.36,0.33,0.16,28,m),0,0.78,0);return {root:g,r:1};}
  function bPendant(c){var g=new THREE.Group(),m=mat(c);put(g,box(0.9,0.5,0.5,m),0,0.72,0);put(g,cyl(0.16,0.22,0.5,14,m),0,0.3,0);put(g,cyl(0.34,0.14,0.5,14,m),0,-0.15,0);put(g,box(0.44,0.18,0.44,m),0,0.9,0);return {root:g,r:1};}
  function bDoor(c){var g=new THREE.Group(),m=mat(c);put(g,box(1.4,2.0,0.12,m),0,0,0);put(g,box(0.9,1.5,0.05,m),0,0.2,0.09);put(g,box(0.12,2.0,0.16,m),0,0,0.02);put(g,sph(0.06,m),0.4,0,0.12);return {root:g,r:1};}
  function bPlaque(c){var g=new THREE.Group(),m=mat(c);put(g,box(1.8,0.7,0.14,m),0,0,0);put(g,box(1.6,0.5,0.44,m),0,0,0);return {root:g,r:1};}
  function bBeam(c){var g=new THREE.Group(),m=mat(c);put(g,box(2.4,0.4,0.4,m),0,0,0);put(g,box(0.5,0.2,0.5,m),-0.9,-0.3,0);put(g,box(0.5,0.2,0.5,m),0.9,-0.3,0);return {root:g,r:1};}
  // 木器
  function wBowl(c){var g=new THREE.Group(),m=mat(c);g.add(latheMesh([[0,-0.34],[0.20,-0.34],[0.18,-0.28],[0.24,-0.16],[0.50,0.10],[0.60,0.26],[0.60,0.28],[0.48,0.20],[0.30,0.02],[0.18,-0.12],[0,-0.14]],44,m));return {root:g,r:1};}
  function wJar(c){var g=new THREE.Group(),m=mat(c);g.add(latheMesh([[0,-0.5],[0.32,-0.5],[0.30,-0.42],[0.24,-0.16],[0.42,0.16],[0.38,0.30],[0.20,0.34],[0,0.34]],44,m));return {root:g,r:1};}
  function wVessel(c){var g=new THREE.Group(),m=mat(c);g.add(latheMesh([[0,-0.5],[0.32,-0.5],[0.36,-0.30],[0.36,0.30],[0.32,0.5],[0.28,0.5],[0,0.5]],40,m));return {root:g,r:1};}
  function wBox(c){var g=new THREE.Group(),m=mat(c);put(g,box(1.4,0.7,0.9,m),0,0,0);put(g,box(1.5,0.16,1.0,m),0,0.42,0);put(g,sph(0.08,m),0,0.5,0);put(g,box(1.2,0.1,0.6,m),0,-0.3,0);return {root:g,r:1};}
  function wTray(c){var g=new THREE.Group(),m=mat(c);put(g,box(1.8,0.1,1.2,m),0,0,0);put(g,box(1.8,0.14,0.1,m),0,0.08,-0.55);put(g,box(1.8,0.14,0.1,m),0,0.08,0.55);put(g,box(0.1,0.14,1.2,m),-0.85,0.08,0);put(g,box(0.1,0.14,1.2,m),0.85,0.08,0);return {root:g,r:1};}
  function wVase(c){var g=new THREE.Group(),m=mat(c);g.add(latheMesh([[0,-0.5],[0.28,-0.5],[0.30,-0.42],[0.22,-0.20],[0.16,0.10],[0.26,0.30],[0.32,0.46],[0.28,0.54],[0.14,0.54],[0,0.44]],44,m));return {root:g,r:1};}
  function wCup(c){var g=new THREE.Group(),m=mat(c);g.add(latheMesh([[0,-0.30],[0.22,-0.30],[0.22,-0.24],[0.18,0.10],[0.22,0.26],[0.24,0.30],[0.20,0.30],[0.12,0.06],[0,-0.06]],36,m));return {root:g,r:1};}
  function wPanel(c){var g=new THREE.Group(),m=mat(c);put(g,box(1.6,0.12,0.12,m),0,0.8,0);put(g,box(1.6,0.12,0.12,m),0,-0.8,0);put(g,box(0.12,1.6,0.12,m),-0.8,0,0);put(g,box(0.12,1.6,0.12,m),0.8,0,0);put(g,box(1.5,1.5,0.06,m),0,0,0);return {root:g,r:1};}

  function addLights(sc){sc.add(new THREE.HemisphereLight(0xfff6ea,0x8a6b4a,0.8));var k=new THREE.DirectionalLight(0xffffff,1.15);k.position.set(4,6,5);sc.add(k);var rim=new THREE.DirectionalLight(0xffc9a0,0.6);rim.position.set(-4,3,-5);sc.add(rim);var f=new THREE.DirectionalLight(0xa8c0ff,0.22);f.position.set(0,-2,-3);sc.add(f);}
  function addGround(sc,r){var c=document.createElement("canvas");c.width=c.height=128;var x=c.getContext("2d");var gr=x.createRadialGradient(64,64,6,64,64,64);gr.addColorStop(0,"rgba(60,32,12,0.5)");gr.addColorStop(1,"rgba(60,32,12,0)");x.fillStyle=gr;x.fillRect(0,0,128,128);var m=new THREE.Mesh(new THREE.PlaneGeometry(r*2.4,r*2.4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=-r*1.04;sc.add(m);}
  function makeRenderer(canvas,px){var r=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});r.setPixelRatio(px||Math.min(window.devicePixelRatio||1,2));r.setClearColor(0x000000,0);r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.05;return r;}
  function orbit(cam,dom,r){var az=Math.PI/4,pol=Math.PI/2.5,dist=r*2.7,down=false,px=0,py=0,t0=null;
    function apply(){cam.position.set(dist*Math.sin(pol)*Math.sin(az),dist*Math.cos(pol),dist*Math.sin(pol)*Math.cos(az));cam.lookAt(0,0,0);}
    dom.addEventListener("mousedown",function(e){down=true;px=e.clientX;py=e.clientY;});window.addEventListener("mousemove",function(e){if(!down)return;az-=(e.clientX-px)*0.01;pol-=(e.clientY-py)*0.01;pol=Math.max(0.12,Math.min(Math.PI-0.12,pol));px=e.clientX;py=e.clientY;apply();});window.addEventListener("mouseup",function(){down=false;});
    dom.addEventListener("wheel",function(e){dist*=(e.deltaY>0?1.1:0.9);dist=Math.max(r*0.8,Math.min(r*5,dist));apply();},{passive:true});
    dom.addEventListener("touchstart",function(e){if(e.touches.length===1){t0={x:e.touches[0].clientX,y:e.touches[0].clientY};}},{passive:true});
    dom.addEventListener("touchmove",function(e){if(e.touches.length===1&&t0){az-=(e.touches[0].clientX-t0.x)*0.01;pol-=(e.touches[0].clientY-t0.y)*0.01;pol=Math.max(0.12,Math.min(Math.PI-0.12,pol));t0={x:e.touches[0].clientX,y:e.touches[0].clientY};apply();}},{passive:true});
    dom.addEventListener("touchend",function(){t0=null;});
    apply();return {update:function(){},dispose:function(){}};}

  /* ============ 本地真实图片(封面,已无宗教图) ============ */
  var IMGS={
    "榫卯":["images/太和殿斗拱.JPG","images/太和殿轉角柱頭榫卯.JPG"],
    "家具":["images/Folding_Armchair_with_Curved_Rest_in_Shanghai_Museum_2014-07.JPG","images/Chinese_(probably_Canton)_armchair,_c._1830-1840,_wood,_black_and_gold_lacquer_decoration_with_cane_seat,_HAA.JPG","images/Chinese_sidechair_in_English_style,_c._1740,_HAA.jfif","images/Huanghuali_wood_furniture,_China,_-_Nelson-Atkins_Museum_of_Art_-_DSC09138.JPG","images/Testered_Bed_with_Alcove,_Ming_Dynasty,_15th-16_century,_huanghuali_wood_-_Nelson-Atkins_Museum_of_Art_-_DSC09140.JPG","images/上海博物馆藏明式家具.JPG","images/上海博物馆藏明式榻.JPG","images/Chinese_side_table,_Qing_dynasty,_Kangxi_period,_huanghuali_wood,_HAA.JPG","images/Chinese_bench_(ban_deng),_Qing_dynasty,_late_17th_century,_hongmu_wood,_HAA.JPG","images/Wooden_wardrobe_with_mother-of-pearl,_amber,_glass_and_ivory,_Ming_Dynasty.JPG","images/Chinese_landscape_screen.jpg","images/Hofmobiliendepot_-_Chinesischer_Paravent.jpg"],
    "围屋木作":["images/从关西新围眺望西昌围.JPG","images/关西新围府第正门1.JPG","images/太和殿金柱之一.JPG","images/苏州东山镇雕花楼格子门.JPG","images/碧云寺匾额.JPG"],
    "赣南木器":["images/Black_lacquer_box_from_China,_lacquer_on_wood_with_silver,_20th_century,_East-West_Center.JPG","images/Chinese_incense_burner-MHS_2004-IMG_9936.JPG","images/Chinese_side_table,_Qing_dynasty,_Kangxi_period,_huanghuali_wood,_HAA.JPG","images/Chinese_bench_(ban_deng),_Qing_dynasty,_late_17th_century,_hongmu_wood,_HAA.JPG"],
    "江西木艺":["images/Huanghuali_wood_furniture,_China,_-_Nelson-Atkins_Museum_of_Art_-_DSC09138.JPG","images/Black_lacquer_box_from_China,_lacquer_on_wood_with_silver,_20th_century,_East-West_Center.JPG","images/上海博物馆藏明式家具.JPG","images/Pigment_of_chaozhou_woodcarving.JPG"],
    "广东木艺":["images/Pigment_of_chaozhou_woodcarving.JPG","images/Chinese_(probably_Canton)_armchair,_c._1830-1840,_wood,_black_and_gold_lacquer_decoration_with_cane_seat,_HAA.JPG","images/Huanghuali_wood_furniture,_China,_-_Nelson-Atkins_Museum_of_Art_-_DSC09138.JPG","images/Chinese_side_table,_Qing_dynasty,_Kangxi_period,_huanghuali_wood,_HAA.JPG","images/Chinese_landscape_screen.jpg"],
    "湖南木艺":["images/Chinese_sidechair_in_English_style,_c._1740,_HAA.jfif","images/Chinese_bench_(ban_deng),_Qing_dynasty,_late_17th_century,_hongmu_wood,_HAA.JPG","images/Black_lacquer_box_from_China,_lacquer_on_wood_with_silver,_20th_century,_East-West_Center.JPG","images/Hofmobiliendepot_-_Chinesischer_Paravent.jpg"]
  };

  /* ============ 教学步骤 ============ */
  var CRAFT=[{label:"选材",icon:"🪵",desc:"挑选纹理均匀、无裂无节的木材,顺纹下料。"},{label:"开料",icon:"🪚",desc:"按尺寸锯切毛料,规方找平。"},{label:"成型",icon:"🔧",desc:"车旋器型或开凿榫卯,构件成型。"},{label:"打磨",icon:"🪵",desc:"由粗到细多道打磨,表面光洁。"},{label:"上蜡",icon:"✨",desc:"蜂蜡养护,凸显温润木纹。"}];
  var JOIN_STEPS={dougong:[{label:"立柱承托",icon:"🏛️",desc:"底座大斗立于柱头承重。"},{label:"安拱",icon:"➖",desc:"拱木插入斗口向外挑出。"},{label:"置升",icon:"🔲",desc:"拱端各置升承上层。"},{label:"装梁枋",icon:"🏗️",desc:"梁枋逐层落位、层层锁紧。"}],yanwei:[{label:"开榫槽",icon:"🔩",desc:"榫头外宽内窄形似燕尾。"},{label:"插入卡紧",icon:"🔗",desc:"榫头入槽越拉越紧。"},{label:"耐震抗拔",icon:"💪",desc:"承受拉力不脱,梁架加固之选。"}],cross:[{label:"凿半榫口",icon:"🪓",desc:"两方木各凿一半厚榫口。"},{label:"十字咬合",icon:"➕",desc:"榫口交错严丝合缝。"},{label:"交接锁紧",icon:"🔒",desc:"结构简单却异常牢固。"}],well:[{label:"下层横木",icon:"⬅️",desc:"先置下层横木。"},{label:"中层纵木",icon:"↔️",desc:"交叠中层纵木。"},{label:"上层横木",icon:"➡️",desc:"叠压上层横木。"},{label:"三层叠锁",icon:"🗼",desc:"井字交错层层锁定。"}],luban:[{label:"三轴交叠",icon:"🧊",desc:"三根木条按XYZ轴交叠。"},{label:"穿插锁定",icon:"🔒",desc:"端部互卡牵一发动全身。"},{label:"机关巧解",icon:"🧩",desc:"找对顺序方可拆开。"}],tongue:[{label:"开企口",icon:"🪚",desc:"一板留舌一板开槽。"},{label:"舌槽咬合",icon:"🔗",desc:"舌入槽严丝合缝。"},{label:"镶入拼板",icon:"🧱",desc:"多板镶接成整面不透缝。"}]};

  /* ============ 数据(无宗教,80件,均配3D模型) ============ */
  var COLORS=[0xb8864a,0xc98a4b,0x8a5a2f,0xa9723f,0xd6a55c,0x7a4632,0xc59a63,0xb0713a,0x9c6b3c,0xa2592f];
  function genData(){
    var out=[],SEQ={},ERAS=["明","清","明","清","民国","近现代","宋","清","明","现代"];
    var CATS=[
      {cat:"榫卯",shop:"赣南·龙南",wood:["楠木","榉木","樟木","杉木"],badge:true,join:true,
        names:[["一斗三升斗拱","dougong"],["燕尾榫连接件","yanwei"],["十字榫方木","cross"],["井字榫木架","well"],["鲁班锁","luban"],["企口拼板","tongue"]],
        builders:{dougong:buildDougong,yanwei:buildYanwei,cross:buildCross,well:buildWell,luban:buildLuban,tongue:buildTongue},bio:"数千年木构不施一钉,全赖榫卯咬合,是东方木作的灵魂。"},
      {cat:"家具",shop:"赣南·南康",wood:["榉木","樟木","榆木","楠木","红木"],badge:true,
        names:["南康实木餐桌","南康实木大床","黄花梨圈椅","官帽椅","罗汉床","八仙桌","条案","太师椅","顶箱柜","南康书桌","博古架","折叠屏风","平头长凳","实木摇椅","圆鼓凳","多格斗柜"],
        builders:[fChair,fTable,fBench,fStool,fCabinet,fShelf,fScreen,fBed,fChair,fTable,fBench,fStool,fCabinet,fShelf,fScreen,fBed],bio:"南康是中国实木家具之都,器型经典、榫卯精良、木纹天成。"},
      {cat:"围屋木作",shop:"赣南·龙南",wood:["楠木","杉木","樟木","黄杨木"],badge:true,
        names:["关西新围格栅窗","燕翼围木柱础","客家围屋斗拱","垂花门簪","雀替","月梁","门楣匾额","宗祠穿枋","天井格栅","檐下斜撑","围屋木门扇","祠堂梁架"],
        builders:[bLattice,bColumn,buildDougong,bPendant,bBeam,bBeam,bPlaque,bBeam,bLattice,bBeam,bDoor,bBeam],bio:"客家围屋木构件,承载‘墙倒屋不塌’的营造智慧。"},
      {cat:"赣南木器",shop:"赣南·南康",wood:["樟木","杉木","楠木","榆木"],badge:false,
        names:["南康樟木箱","茶水木桶","木洗脸盆架","木摇篮","竹编木框篮","米缸木盖","木砧板","木蒸笼","木提盒","木鞋楦","木扁担","木水瓢","实木矮凳","木马扎"],
        builders:[wBox,wVessel,wBox,fStool,wBox,wJar,wTray,wJar,wBox,wBox,wTray,wCup,fBench,wBox],bio:"赣南日常木器,就地取材、朴实耐用,尽显民间匠心。"},
      {cat:"江西木艺",shop:"江西木作",wood:["樟木","楠木","黄杨木","松木"],badge:false,
        names:["婺源木雕屏风","木胎食盒","庐山木刻笔筒","井冈竹木器","樟树木箱","赣南木刻面具","万载木偶","南昌木梳","萍乡木凳","吉安木刻匾"],
        builders:[wPanel,wBox,wVase,wBowl,wBox,wPanel,wCup,wCup,fBench,wPanel],bio:"江西木艺兼具文人雅趣与民间烟火,雕刻细腻含蓄。"},
      {cat:"广东木艺",shop:"广东木作",wood:["酸枝","花梨","红木","樟木"],badge:true,
        names:["潮州金漆木雕挂屏","广式酸枝圈椅","潮州镂空花板","广式螺钿柜","潮州木雕门楣","广东红木茶盘","岭南木雕摆件","酸枝八仙桌","潮州栋梁雕","广式梳妆台","潮州木雕屏风","广式条案"],
        builders:[wPanel,fChair,wPanel,fCabinet,bPlaque,wTray,wVase,fTable,wPanel,fCabinet,fScreen,fTable],bio:"粤地木雕金漆髹饰、繁缛富丽,广作家具雍容大气。"},
      {cat:"湖南木艺",shop:"湖南木作",wood:["樟木","楠木","竹","黄杨木"],badge:false,
        names:["湘西竹木雕","常德木雕屏风","湘西木桶","湖南竹编盒","湘南木箱","湘潭木梳","湘西鱼形木雕","湖南木蒸笼","湘西木雕箱","湘西木雕摆件"],
        builders:[wBowl,wPanel,wVessel,wBox,wBox,wCup,wBowl,wJar,wBox,wVase],bio:"湘西木作山野质朴、刀法浑厚,竹木相生别具一格。"}
    ];
    CATS.forEach(function(c){
      c.names.forEach(function(nm,i){
        if(!SEQ[c.cat])SEQ[c.cat]=0;
        var id=(c.cat==="榫卯"?"SM":"WG")+"-"+(100+i),pool=IMGS[c.cat]||[];
        var isJoin=!!c.join, key=isJoin?nm[1]:"";var build=isJoin?c.builders[key]:c.builders[i%c.builders.length];
        var multi=isJoin, steps=isJoin?JOIN_STEPS[key]:CRAFT, col=COLORS[SEQ[c.cat]++ % COLORS.length];
        out.push({id:id,name:isJoin?nm[0]:nm,cat:c.cat,era:ERAS[(SEQ[c.cat])%ERAS.length],shop:c.shop,wood:c.wood[i%c.wood.length],
          size:(24+((i*7)%70))+"×"+((14+((i*5)%50)))+"×"+((10+((i*3)%30)))+" cm",no:id,img:pool[i%pool.length]||"",
          desc:(isJoin?nm[0]:nm)+"。"+(c.bio||""),badge:c.badge?"非遗木作":"",hasModel:true,build:build,bcolor:col,multiPart:multi,steps:steps});
      });
    });
    return out;
  }
  var DATA=genData();
  // 交叉排列:首屏各品类各出一张,头图不重复;同类内也轮换
  (function(){var groups={},keys=[],order=[];DATA.forEach(function(a){if(!groups[a.cat]){groups[a.cat]=[];keys.push(a.cat);}groups[a.cat].push(a);});
    var max=0;keys.forEach(function(k){max=Math.max(max,groups[k].length);});
    for(var i=0;i<max;i++){keys.forEach(function(k){if(groups[k][i])order.push(groups[k][i]);});}
    DATA=order;})();

  /* ============ UI ============ */
  var state={cat:"全部",era:"全部年代",shop:"全部工坊",kw:""},detail=null,searchTimer=null;
  function el(id){return document.getElementById(id);}
  function filtered(){return DATA.filter(function(a){if(state.cat!=="全部"&&state.cat!=="更多"&&a.cat!==state.cat)return false;if(state.era!=="全部年代"&&a.era!==state.era)return false;if(state.shop!=="全部工坊"&&a.shop!==state.shop)return false;if(state.kw){var k=state.kw.toLowerCase();if(a.name.toLowerCase().indexOf(k)<0&&a.shop.toLowerCase().indexOf(k)<0&&a.wood.toLowerCase().indexOf(k)<0)return false;}return true;});}
  function renderGrid(){
    var list=filtered();el("count").textContent=list.length+" 件";grid.innerHTML="";
    if(!list.length){emptyEl.classList.remove("hidden");return;}emptyEl.classList.add("hidden");
    list.forEach(function(a){
      var card=document.createElement("article");card.className="card";card.setAttribute("data-id",a.id);
      card.innerHTML='<div class="thumb"><div class="ph">'+a.name.charAt(0)+'</div>'+((a.img)?'<img class="thumb-img" src="'+a.img+'" alt="'+a.name+'" loading="lazy" onerror="this.style.display=\'none\'">':'')+'<span class="v">3D</span></div>'+'<div class="card-body">'+(a.badge?'<span class="badge">'+a.badge+'</span>':'')+'<h3 class="name">'+a.name+'</h3><div class="sub">'+a.era+' ｜ '+a.shop+'</div></div>';
      card.addEventListener("click",function(){openDetail(a);});grid.appendChild(card);
    });
  }
  function openDetail(a){
    if(detail)closeDetailScene();el("overlay").classList.remove("hidden");document.body.style.overflow="hidden";
    el("dTitle").textContent=a.name;el("dMeta").textContent=a.era+" ｜ "+a.shop+" ｜ "+a.wood;
    var b=el("dBadge");if(a.badge){b.textContent=a.badge;b.style.display="inline-block";}else{b.style.display="none";}
    el("dMat").textContent=a.wood;el("dSize").textContent=a.size;el("dNo").textContent=a.no;el("dDesc").textContent=a.desc;showPanel("info");
    var canvas=el("viewCanvas"),imgE=el("viewImg"),hint=el("viewHint");
    if(a.build&&THREE_OK){
      canvas.classList.remove("hidden");imgE.classList.add("hidden");hint.style.display="";
      var renderer=makeRenderer(canvas),scene=new THREE.Scene();addLights(scene);
      var built=a.build(a.bcolor);
      var bx=new THREE.Box3().setFromObject(built.root),ctr=bx.getCenter(new THREE.Vector3());built.root.position.set(-ctr.x,-ctr.y,-ctr.z);
      var rr=bx.getBoundingSphere(new THREE.Sphere()).radius||1;built.r=rr;scene.add(built.root);addGround(scene,rr);
      var w=canvas.clientWidth||320,h=canvas.clientHeight||320,camera=new THREE.PerspectiveCamera(42,w/h,0.01,100);camera.position.set(rr*1.7,rr*1.45,rr*1.9);
      var controls=orbit(camera,renderer.domElement,rr);renderer.setSize(w,h,false);
      detail={renderer:renderer,scene:scene,camera:camera,controls:controls,built:built,canvas:canvas,multiPart:!!a.multiPart,steps:a.steps,t:0,play:false,mode:"info",stepIdx:0,hasExplode:!!a.multiPart};
    } else {
      canvas.classList.add("hidden");hint.style.display="none";imgE.classList.remove("hidden");if(a.img){imgE.src=a.img;imgE.style.display="";}else{imgE.style.display="none";}
      detail={mode:"info",steps:a.steps,t:0,play:false,stepIdx:0,multiPart:false,hasExplode:false};
    }
  }
  function closeDetailScene(){if(!detail||!detail.renderer)return;try{detail.controls&&detail.controls.dispose();}catch(e){}try{detail.renderer.dispose();}catch(e){}detail=null;}
  function closeDetail(){el("overlay").classList.add("hidden");document.body.style.overflow="";closeDetailScene();}
  function showPanel(which){el("infoPanel").classList.toggle("hidden",which!=="info");el("teachPanel").classList.toggle("hidden",which!=="teach");if(detail){detail.mode=which;if(which==="info"){detail.play=false;detail.t=0;}}}
  function openTeach(){if(!detail)return;showPanel("teach");detail.play=false;detail.t=0;detail.stepIdx=0;el("tKicker").textContent=detail.multiPart?"榫卯拆解演示":"工艺步骤演示";el("tName").textContent=el("dTitle").textContent;el("tNote").textContent=detail.multiPart?"拖动进度条或点『自动』,看着构件逐步拆解/组装":"拖动进度条或点『自动』,按工序讲解制作步骤";renderStepList(0);setPlayBtn(false);updateTeach();}
  function renderStepList(idx){var ol=el("tSteps");ol.innerHTML="";detail.steps.forEach(function(s,i){var li=document.createElement("li");li.className=i===idx?"active":"";li.innerHTML='<span class="n">'+(i+1)+'</span><span class="tl">'+s.icon+' '+s.label+'</span>';ol.appendChild(li);});}
  function updateTeach(){if(!detail||detail.mode!=="teach")return;var n=detail.steps.length;var idx=detail.multiPart?Math.min(n-1,Math.floor(detail.t*n)):Math.min(n-1,Math.round(detail.t*(n-1)));if(idx!==detail.stepIdx){detail.stepIdx=idx;renderStepList(idx);}var s=detail.steps[idx];el("tIcon").textContent=s.icon;el("tLabel").textContent=s.label;el("tDesc").textContent=s.desc;el("tRange").value=Math.round(detail.t*100);if(detail.hasExplode)detail.target=detail.t;else detail.target=0;}
  function setPlayBtn(p){el("tPlay").textContent=p?"⏸ 暂停":"▶ 自动拆解";}function togglePlay(){if(!detail)return;detail.play=!detail.play;setPlayBtn(detail.play);}
  function tick(){requestAnimationFrame(tick);if(detail&&detail.renderer){if(detail.mode==="teach"&&detail.play){detail.t+=0.006;if(detail.t>=1){detail.t=1;detail.play=false;setPlayBtn(false);}updateTeach();}if(detail.hasExplode)detail.target=detail.mode==="teach"?detail.t:0;detail.explode=(detail.explode||0)+((detail.target||0)-(detail.explode||0))*0.12;if(detail.built.root.userData.explode)detail.built.root.userData.explode(detail.explode);detail.renderer.render(detail.scene,detail.camera);}}
  function sizeDetail(){if(!detail||!detail.renderer)return;var w=detail.canvas.clientWidth||300,h=detail.canvas.clientHeight||300;detail.renderer.setSize(w,h,false);detail.camera.aspect=w/h;detail.camera.updateProjectionMatrix();}
  var grid=el("grid"),emptyEl=el("empty");
  document.querySelectorAll(".cat").forEach(function(btn){btn.addEventListener("click",function(){document.querySelectorAll(".cat").forEach(function(x){x.classList.remove("active");});btn.classList.add("active");state.cat=btn.getAttribute("data-cat");renderGrid();});});
  el("searchInput").addEventListener("input",function(e){clearTimeout(searchTimer);searchTimer=setTimeout(function(){state.kw=e.target.value.trim();renderGrid();},170);});
  el("tf3d").addEventListener("click",function(){el("tf3d").classList.toggle("on");});
  function bindMenu(menu,chip,cb){chip.addEventListener("click",function(e){e.stopPropagation();(menu===el("eraMenu")?el("shopMenu"):el("eraMenu")).classList.add("hidden");menu.classList.toggle("hidden");});menu.querySelectorAll("button").forEach(function(btn){btn.addEventListener("click",function(e){e.stopPropagation();menu.querySelectorAll("button").forEach(function(x){x.classList.remove("active");});btn.classList.add("active");menu.classList.add("hidden");cb(btn.textContent);});});}
  bindMenu(el("eraMenu"),el("eraChip"),function(v){state.era=v;renderGrid();});bindMenu(el("shopMenu"),el("shopChip"),function(v){state.shop=v;renderGrid();});
  document.addEventListener("click",function(){el("eraMenu").classList.add("hidden");el("shopMenu").classList.add("hidden");});
  el("closeBtn").addEventListener("click",closeDetail);el("overlay").addEventListener("click",function(e){if(e.target===el("overlay"))closeDetail();});
  el("actFav").addEventListener("click",function(e){var b=e.currentTarget;b.textContent=b.textContent.indexOf("♥")<0?"♥ 已收藏":"♡ 收藏";});
  el("actShare").addEventListener("click",function(){alert("分享链接已复制(演示)。");});el("actLearn").addEventListener("click",openTeach);
  el("teachBack").addEventListener("click",function(){showPanel("info");});el("tPlay").addEventListener("click",togglePlay);
  el("tRange").addEventListener("input",function(e){if(!detail)return;detail.play=false;setPlayBtn(false);detail.t=e.target.value/100;updateTeach();});
  el("tMode").addEventListener("click",function(){if(!detail)return;detail.play=false;setPlayBtn(false);detail.t=detail.t<0.5?1:0;updateTeach();});
  window.addEventListener("resize",sizeDetail);document.addEventListener("keydown",function(e){if(e.key==="Escape")closeDetail();});
  renderGrid();tick();
})();
