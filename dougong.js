/* =========================================================
   辽金转角铺作 · 斗拱  —— 逐件可拆装的高清三维模型
   构件与装配依《营造法式》铺作做法:
     横拱(泥道拱/瓜子拱/慢拱/令拱)与各类斗(栌斗/交互斗/散斗/齐心斗)
       自上而下"坐"入卯口 —— 拆卸方向 = 向上
     出跳构件(华拱/下昂/耍头)由外向内"插"入 —— 拆卸方向 = 沿出跳向外
   标高已逐件核算: 每件底面均搭在其支承件顶面之上(搭接 0.05), 无悬空
   ========================================================= */
(function () {
  "use strict";
  if (typeof THREE === "undefined") { return; }

  /* ---------------- 木纹材质 ---------------- */
  function woodTex(base) {
    var S = 256, c = document.createElement("canvas");
    c.width = c.height = S;
    var x = c.getContext("2d");
    var r = (base >> 16) & 255, g = (base >> 8) & 255, b = base & 255;
    x.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
    x.fillRect(0, 0, S, S);
    var i;
    for (i = 0; i < S; i += 3) {
      x.fillStyle = "rgba(0,0,0," + (Math.random() * 0.07) + ")";
      x.fillRect(i, 0, 3, S);
    }
    for (i = 0; i < 90; i++) {
      var px = Math.random() * S;
      x.strokeStyle = "rgba(0,0,0," + (0.03 + Math.random() * 0.06) + ")";
      x.lineWidth = 0.6 + Math.random() * 1.6;
      x.beginPath(); x.moveTo(px, 0);
      for (var y = 0; y <= S; y += 6) { px += (Math.random() - 0.5) * 3; x.lineTo(px, y); }
      x.stroke();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  function baseMat(hex, rough) {
    return new THREE.MeshStandardMaterial({ map: woodTex(hex), roughness: rough, metalness: 0.02 });
  }

  /* ---------------- 构件几何 ---------------- */
  function gongGeo(L, H, W) {          // 拱: 两端卷杀
    var s = new THREE.Shape();
    var e = L / 2, t = H / 2, k = Math.min(H * 0.62, L * 0.10);
    s.moveTo(-e, t); s.lineTo(e, t); s.lineTo(e, -t + k);
    s.quadraticCurveTo(e - k * 0.55, -t, e - k, -t);
    s.lineTo(-e + k, -t);
    s.quadraticCurveTo(-e + k * 0.55, -t, -e, -t + k);
    s.closePath();
    var g = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: false, curveSegments: 8 });
    g.translate(0, 0, -W / 2);
    return g;
  }
  function angGeo(L, H, W) {           // 昂/耍头: 外端昂嘴
    var s = new THREE.Shape();
    var e = L / 2, t = H / 2;
    s.moveTo(-e, t); s.lineTo(e, t); s.lineTo(e, t - H * 0.30);
    s.lineTo(e - L * 0.22, -t); s.lineTo(-e, -t);
    s.closePath();
    var g = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: false, curveSegments: 4 });
    g.translate(0, 0, -W / 2);
    return g;
  }
  function douMesh(sz, mat) {          // 斗: 欹 + 平 + 耳
    var g = new THREE.Group();
    var base = new THREE.Mesh(new THREE.CylinderGeometry(sz * 0.54, sz * 0.44, sz * 0.30, 4), mat);
    base.rotation.y = Math.PI / 4; base.position.y = -sz * 0.36;
    var mid = new THREE.Mesh(new THREE.BoxGeometry(sz * 0.86, sz * 0.08, sz * 0.86), mat);
    mid.position.y = -sz * 0.18;
    var top = new THREE.Mesh(new THREE.BoxGeometry(sz * 0.80, sz * 0.30, sz * 0.80), mat);
    top.position.y = sz * 0.02;
    g.add(base, mid, top);
    return g;
  }

  /* ---------------- 标高链(逐件核算) ----------------
     斗(sz)总高 0.68sz, 底面 -0.51sz, 顶面 +0.17sz
     普拍枋顶 0.070 → 栌斗 → 一层拱 → 交互斗/散斗 → 瓜子拱慢拱 →
     齐心斗散斗 → 华拱二跳 → 下昂 → 昂上交互斗 → 令拱 → 耍头/撩檐枋   */
  var Y_PF = 0.000;    // 普拍枋(顶 0.070)
  var Y_LD = 0.479;    // 栌斗 sz0.90
  var Y_G1 = 0.722;    // 一层拱 H0.28
  var Y_D1 = 1.108;    // 交互斗 sz0.58
  var Y_D1s = 1.115;   // 散斗(一层) sz0.54
  var Y_G2 = 1.287;    // 瓜子拱/慢拱 H0.26
  var Y_D2 = 1.571;    // 齐心斗/散斗 sz0.40
  var Y_G3 = 1.719;    // 华拱二跳 H0.26
  var Y_ANG = 2.041;   // 下昂 H0.34
  var Y_D3 = 2.372;    // 昂上交互斗 sz0.50
  var Y_LG = 2.527;    // 令拱 H0.24
  var Y_SH = 2.420;    // 耍头 H0.26
  var Y_LYF = 2.707;   // 撩檐枋 h0.18

  var U = [0, 1, 0];   // 向上提(横拱与斗)
  var DN = [0, -1, 0]; // 向下抽(柱础与柱)
  var PARTS = [
    { n: "柱础", k: "cyl", p: [0, -1.07, 0], r: 0.44, h: 0.14, dir: DN, ord: 1, out: 0.8 },
    { n: "柱", k: "cyl", p: [0, -0.53, 0], r: 0.28, h: 0.92, dir: DN, ord: 2, out: 1.0 },

    { n: "普拍枋(纵)", k: "box", p: [0.30, Y_PF, 0], s: [2.00, 0.14, 0.40], dir: U, ord: 3, out: 1.3 },
    { n: "普拍枋(横)", k: "box", p: [0, Y_PF, 0.30], s: [0.40, 0.14, 2.00], dir: U, ord: 4, out: 1.3 },

    { n: "栌斗", k: "dou", p: [0, Y_LD, 0], sz: 0.90, dir: U, ord: 5, out: 1.1 },
    { n: "驼峰", k: "box", p: [0, 1.01, 0], s: [0.50, 0.34, 0.50], dir: U, ord: 6, out: 0.9 },

    { n: "泥道拱(纵)", k: "gong", p: [-0.34, Y_G1, 0], L: 1.10, H: 0.28, W: 0.32, dir: U, ord: 7, out: 0.95 },
    { n: "泥道拱(横)", k: "gong", p: [0, Y_G1, -0.34], L: 1.10, H: 0.28, W: 0.32, ry: 90, dir: U, ord: 8, out: 0.95 },
    { n: "华拱(纵)", k: "gong", p: [0.64, Y_G1, 0], L: 1.10, H: 0.28, W: 0.32, dir: [1, 0, 0], ord: 9, out: 1.4 },
    { n: "华拱(横)", k: "gong", p: [0, Y_G1, 0.64], L: 1.10, H: 0.28, W: 0.32, ry: 90, dir: [0, 0, 1], ord: 10, out: 1.4 },
    { n: "角拱", k: "gong", p: [0.44, Y_G1, 0.44], L: 1.00, H: 0.26, W: 0.28, ry: -45, dir: [0.707, 0, 0.707], ord: 11, out: 1.4 },

    { n: "交互斗(纵)", k: "dou", p: [1.14, Y_D1, 0], sz: 0.58, dir: U, ord: 12, out: 0.85 },
    { n: "交互斗(横)", k: "dou", p: [0, Y_D1, 1.14], sz: 0.58, dir: U, ord: 13, out: 0.85 },
    { n: "交互斗(角)", k: "dou", p: [0.70, Y_D1, 0.70], sz: 0.50, dir: U, ord: 14, out: 0.85 },
    { n: "散斗(纵)", k: "dou", p: [-0.78, Y_D1s, 0], sz: 0.54, dir: U, ord: 15, out: 0.85 },
    { n: "散斗(横)", k: "dou", p: [0, Y_D1s, -0.78], sz: 0.54, dir: U, ord: 16, out: 0.85 },

    { n: "瓜子拱(纵)", k: "gong", p: [1.14, Y_G2, 0], L: 1.00, H: 0.26, W: 0.30, ry: 90, dir: U, ord: 17, out: 0.95 },
    { n: "瓜子拱(横)", k: "gong", p: [0, Y_G2, 1.14], L: 1.00, H: 0.26, W: 0.30, dir: U, ord: 18, out: 0.95 },
    { n: "角瓜子拱", k: "gong", p: [0.92, Y_G2, 0.92], L: 0.75, H: 0.26, W: 0.28, ry: -45, dir: U, ord: 19, out: 0.95 },
    { n: "慢拱(纵)", k: "gong", p: [-0.60, Y_G2, 0], L: 1.35, H: 0.26, W: 0.30, dir: U, ord: 20, out: 0.95 },
    { n: "慢拱(横)", k: "gong", p: [0, Y_G2, -0.60], L: 1.35, H: 0.26, W: 0.30, ry: 90, dir: U, ord: 21, out: 0.95 },

    { n: "齐心斗(纵)", k: "dou", p: [1.14, Y_D2, 0], sz: 0.40, dir: U, ord: 22, out: 0.8 },
    { n: "齐心斗(横)", k: "dou", p: [0, Y_D2, 1.14], sz: 0.40, dir: U, ord: 23, out: 0.8 },
    { n: "角齐心斗", k: "dou", p: [1.08, Y_D2, 1.08], sz: 0.40, dir: U, ord: 24, out: 0.8 },
    { n: "散斗(纵前)", k: "dou", p: [1.14, Y_D2, 0.50], sz: 0.36, dir: U, ord: 25, out: 0.8 },
    { n: "散斗(纵后)", k: "dou", p: [1.14, Y_D2, -0.50], sz: 0.36, dir: U, ord: 26, out: 0.8 },
    { n: "散斗(横前)", k: "dou", p: [0.50, Y_D2, 1.14], sz: 0.36, dir: U, ord: 27, out: 0.8 },
    { n: "散斗(横后)", k: "dou", p: [-0.50, Y_D2, 1.14], sz: 0.36, dir: U, ord: 28, out: 0.8 },
    { n: "散斗(慢纵)", k: "dou", p: [-1.22, Y_D2, 0], sz: 0.36, dir: U, ord: 29, out: 0.8 },
    { n: "散斗(慢横)", k: "dou", p: [0, Y_D2, -1.22], sz: 0.36, dir: U, ord: 30, out: 0.8 },

    { n: "华拱二跳(纵)", k: "gong", p: [1.50, Y_G3, 0], L: 0.90, H: 0.26, W: 0.30, dir: [1, 0, 0], ord: 31, out: 1.6 },
    { n: "华拱二跳(横)", k: "gong", p: [0, Y_G3, 1.50], L: 0.90, H: 0.26, W: 0.30, ry: 90, dir: [0, 0, 1], ord: 32, out: 1.6 },
    { n: "角拱二跳", k: "gong", p: [1.05, Y_G3, 1.05], L: 0.85, H: 0.24, W: 0.28, ry: -45, dir: [0.707, 0, 0.707], ord: 33, out: 1.6 },

    { n: "下昂(纵)", k: "ang", p: [2.05, Y_ANG, 0], L: 1.20, H: 0.34, W: 0.30, rz: -8, dir: [1, 0.20, 0], ord: 34, out: 1.7 },
    { n: "下昂(横)", k: "ang", p: [0, Y_ANG, 2.05], L: 1.20, H: 0.34, W: 0.30, ry: 90, rz: 8, dir: [0, 0.20, 1], ord: 35, out: 1.7 },
    { n: "角昂", k: "ang", p: [1.60, Y_ANG, 1.60], L: 1.10, H: 0.32, W: 0.28, ry: -45, rz: -8, dir: [0.707, 0.20, 0.707], ord: 36, out: 1.7 },

    { n: "交互斗(昂纵)", k: "dou", p: [2.35, Y_D3, 0], sz: 0.50, dir: U, ord: 37, out: 0.85 },
    { n: "交互斗(昂横)", k: "dou", p: [0, Y_D3, 2.35], sz: 0.50, dir: U, ord: 38, out: 0.85 },
    { n: "令拱(纵)", k: "gong", p: [2.35, Y_LG, 0], L: 1.00, H: 0.24, W: 0.28, ry: 90, dir: U, ord: 39, out: 0.95 },
    { n: "令拱(横)", k: "gong", p: [0, Y_LG, 2.35], L: 1.00, H: 0.24, W: 0.28, dir: U, ord: 40, out: 0.95 },

    { n: "耍头(纵)", k: "ang", p: [2.55, Y_SH, 0], L: 1.20, H: 0.26, W: 0.28, rz: -6, dir: [1, 0.12, 0], ord: 41, out: 1.8 },
    { n: "耍头(横)", k: "ang", p: [0, Y_SH, 2.55], L: 1.20, H: 0.26, W: 0.28, ry: 90, rz: 6, dir: [0, 0.12, 1], ord: 42, out: 1.8 },
    { n: "角耍头", k: "ang", p: [2.00, Y_SH, 2.00], L: 1.10, H: 0.24, W: 0.26, ry: -45, rz: -6, dir: [0.707, 0.12, 0.707], ord: 43, out: 1.8 },

    { n: "撩檐枋(纵)", k: "box", p: [0.90, Y_LYF, 2.45], s: [2.60, 0.18, 0.30], dir: U, ord: 44, out: 1.2 },
    { n: "撩檐枋(横)", k: "box", p: [2.45, Y_LYF, 0.90], s: [0.30, 0.18, 2.60], dir: U, ord: 45, out: 1.2 },
    { n: "角枋", k: "box", p: [1.85, Y_LYF - 0.04, 1.85], s: [2.00, 0.16, 0.26], ry: -45, dir: U, ord: 46, out: 1.2 }
  ];

  /* ---------------- 柱头铺作(直) ----------------
     墙沿 X 方向, 出跳朝 +Z; 横拱沿墙一层层叠上去, 正面看是一整片实墙   */
  var Z = [0, 0, 1];
  var PARTS_Z = [
    { n: "柱础", k: "cyl", p: [0, -1.07, 0], r: 0.44, h: 0.14, dir: DN, ord: 1, out: 0.8 },
    { n: "柱", k: "cyl", p: [0, -0.53, 0], r: 0.28, h: 0.92, dir: DN, ord: 2, out: 1.0 },
    { n: "普拍枋", k: "box", p: [0, Y_PF, 0], s: [2.80, 0.14, 0.42], dir: U, ord: 3, out: 1.3 },
    { n: "栌斗", k: "dou", p: [0, Y_LD, 0], sz: 0.90, dir: U, ord: 4, out: 1.1 },
    { n: "泥道拱", k: "gong", p: [0, Y_G1, 0], L: 3.20, H: 0.28, W: 0.32, dir: U, ord: 5, out: 1.0 },
    { n: "华拱", k: "gong", p: [0, Y_G1, 0.64], L: 1.10, H: 0.28, W: 0.32, ry: 90, dir: Z, ord: 6, out: 1.5 },
    { n: "驼峰", k: "box", p: [0, 1.01, 0], s: [0.50, 0.34, 0.50], dir: U, ord: 7, out: 0.9 },
    { n: "散斗(左)", k: "dou", p: [-1.42, Y_D1s, 0], sz: 0.54, dir: U, ord: 8, out: 0.85 },
    { n: "散斗(右)", k: "dou", p: [1.42, Y_D1s, 0], sz: 0.54, dir: U, ord: 9, out: 0.85 },
    { n: "交互斗", k: "dou", p: [0, Y_D1, 1.14], sz: 0.58, dir: U, ord: 10, out: 0.85 },
    { n: "慢拱", k: "gong", p: [0, Y_G2, 0], L: 3.20, H: 0.26, W: 0.30, dir: U, ord: 11, out: 1.0 },
    { n: "瓜子拱", k: "gong", p: [0, Y_G2, 1.14], L: 1.00, H: 0.26, W: 0.30, dir: U, ord: 12, out: 0.95 },
    { n: "柱头枋", k: "box", p: [0, 1.75, 0], s: [3.20, 0.22, 0.32], dir: U, ord: 13, out: 1.3 },
    { n: "齐心斗", k: "dou", p: [0, Y_D2, 1.14], sz: 0.40, dir: U, ord: 14, out: 0.8 },
    { n: "散斗(瓜左)", k: "dou", p: [-0.50, Y_D2, 1.14], sz: 0.36, dir: U, ord: 15, out: 0.8 },
    { n: "散斗(瓜右)", k: "dou", p: [0.50, Y_D2, 1.14], sz: 0.36, dir: U, ord: 16, out: 0.8 },
    { n: "散斗(慢左)", k: "dou", p: [-1.42, Y_D2, 0], sz: 0.36, dir: U, ord: 17, out: 0.8 },
    { n: "散斗(慢右)", k: "dou", p: [1.42, Y_D2, 0], sz: 0.36, dir: U, ord: 18, out: 0.8 },
    { n: "华拱二跳", k: "gong", p: [0, Y_G3, 1.50], L: 0.90, H: 0.26, W: 0.30, ry: 90, dir: Z, ord: 19, out: 1.7 },
    { n: "下昂", k: "ang", p: [0, Y_ANG, 2.05], L: 1.20, H: 0.34, W: 0.30, ry: 90, rz: 8, dir: [0, 0.20, 1], ord: 20, out: 1.8 },
    { n: "交互斗(昂)", k: "dou", p: [0, Y_D3, 2.35], sz: 0.50, dir: U, ord: 21, out: 0.85 },
    { n: "令拱", k: "gong", p: [0, Y_LG, 2.35], L: 1.00, H: 0.24, W: 0.28, dir: U, ord: 22, out: 0.95 },
    { n: "耍头", k: "ang", p: [0, Y_SH, 2.55], L: 1.20, H: 0.26, W: 0.28, ry: 90, rz: 6, dir: [0, 0.12, 1], ord: 23, out: 1.9 },
    { n: "撩檐枋", k: "box", p: [0, Y_LYF, 2.45], s: [2.80, 0.18, 0.30], dir: U, ord: 24, out: 1.3 }
  ];

  /* ---------------- 建模 ---------------- */
  var MATS = [baseMat(0x9c6a38, 0.60), baseMat(0x7d4f28, 0.66), baseMat(0x8d8578, 0.9)];

  function build(PARTS) {
    var root = new THREE.Group();
    var list = [];
    PARTS.forEach(function (pt) {
      var mat = MATS[(pt.ord % 2) ? 0 : 1].clone();
      var obj;
      if (pt.k === "box") { obj = new THREE.Mesh(new THREE.BoxGeometry(pt.s[0], pt.s[1], pt.s[2]), mat); }
      else if (pt.k === "cyl") { obj = new THREE.Mesh(new THREE.CylinderGeometry(pt.r, pt.r * 0.97, pt.h, 30), mat); }
      else if (pt.k === "gong") { obj = new THREE.Mesh(gongGeo(pt.L, pt.H, pt.W), mat); }
      else if (pt.k === "ang") { obj = new THREE.Mesh(angGeo(pt.L, pt.H, pt.W), mat); }
      else { obj = douMesh(pt.sz, mat); }
      obj.position.set(pt.p[0], pt.p[1], pt.p[2]);
      if (pt.ry) { obj.rotation.y = pt.ry * Math.PI / 180; }
      if (pt.rz) { obj.rotation.z = pt.rz * Math.PI / 180; }
      var rec = {
        obj: obj, name: pt.n, ord: pt.ord,
        home: new THREE.Vector3(pt.p[0], pt.p[1], pt.p[2]),
        dir: new THREE.Vector3(pt.dir[0], pt.dir[1], pt.dir[2]).normalize(),
        outMax: pt.out, k: pt.k, out: 0, target: 0
      };
      obj.traverse(function (o) { o.userData.part = rec; });
      list.push(rec);
      root.add(obj);
    });
    list.sort(function (a, b) { return a.ord - b.ord; });
    return { root: root, parts: list };
  }

  /* ---------------- 展示器 ---------------- */
  function makeViewer(canvas, opts) {
    if (!canvas || !THREE.WebGLRenderer) { return null; }
    opts = opts || {};

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    if (THREE.sRGBEncoding) { renderer.outputEncoding = THREE.sRGBEncoding; }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;

    var scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x8a6b4a, 0.85));
    var key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(5, 8, 6); scene.add(key);
    var rim = new THREE.DirectionalLight(0xffc9a0, 0.55); rim.position.set(-6, 4, -5); scene.add(rim);
    var fill = new THREE.DirectionalLight(0xa8c0ff, 0.25); fill.position.set(0, -3, -4); scene.add(fill);

    var B = build(opts.parts || PARTS);
    var bx = new THREE.Box3().setFromObject(B.root);
    var ctr = bx.getCenter(new THREE.Vector3());
    B.root.position.set(-ctr.x, -ctr.y, -ctr.z);
    var rr = bx.getBoundingSphere(new THREE.Sphere()).radius || 1;
    scene.add(B.root);
    var parts = B.parts;

    (function () {
      var c = document.createElement("canvas"); c.width = c.height = 128;
      var x = c.getContext("2d");
      var gr = x.createRadialGradient(64, 64, 4, 64, 64, 64);
      gr.addColorStop(0, "rgba(50,28,10,0.5)");
      gr.addColorStop(1, "rgba(50,28,10,0)");
      x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
      var m = new THREE.Mesh(new THREE.PlaneGeometry(rr * 2.6, rr * 2.6),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.y = -rr * 1.02; scene.add(m);
    })();

    var camera = new THREE.PerspectiveCamera(40, 1, 0.01, 200);
    var az = opts.az || Math.PI / 4, pol = opts.pol || Math.PI / 2.32, dist = rr * (opts.zoom || 2.5);
    var spinning = opts.autorotate === true;
    function apply() {
      camera.position.set(dist * Math.sin(pol) * Math.sin(az), dist * Math.cos(pol), dist * Math.sin(pol) * Math.cos(az));
      camera.lookAt(0, 0, 0);
    }
    apply();

    var stepsEl = opts.ui ? document.getElementById("dgSteps") : null;
    var labelEl = opts.ui ? document.getElementById("dgLabel") : null;
    var nums = opts.ui ? document.getElementById("dgNums") : null;
    var autoBtn = opts.ui ? document.getElementById("dgAuto") : null;
    var allBtn = opts.ui ? document.getElementById("dgAll") : null;
    var resetBtn = opts.ui ? document.getElementById("dgReset") : null;

    if (stepsEl) {
      stepsEl.innerHTML = parts.map(function (p) {
        return '<li data-ord="' + p.ord + '"><span class="n">' + p.ord + '</span><span class="tl">' + p.name + '</span></li>';
      }).join("");
      stepsEl.querySelectorAll("li").forEach(function (li) {
        li.addEventListener("click", function () {
          var o = +li.getAttribute("data-ord");
          var rec = parts.filter(function (p) { return p.ord === o; })[0];
          if (rec) { rec.target = rec.target > rec.outMax * 0.4 ? 0 : rec.outMax; }
        });
      });
    }
    function outCount() { var c = 0; parts.forEach(function (p) { if (p.target > 0.01) { c++; } }); return c; }

    var building = false, bIdx = 0, bHold = 0;
    parts.forEach(function (p) { p.target = 0; });
    function startBuild() {
      building = true; bIdx = 0;
      parts.forEach(function (p) { p.out = p.outMax; p.target = p.outMax; });
      if (autoBtn) { autoBtn.textContent = "⏸ 装配中"; }
    }
    function stopBuild() { building = false; if (autoBtn) { autoBtn.textContent = "▶ 逐步装配"; } }
    if (autoBtn) { autoBtn.addEventListener("click", function () { if (building) { stopBuild(); } else { startBuild(); } }); }
    if (allBtn) {
      allBtn.addEventListener("click", function () {
        stopBuild();
        var anyIn = false;
        parts.forEach(function (p) { if (p.target < p.outMax * 0.5) { anyIn = true; } });
        parts.forEach(function (p) { p.target = anyIn ? p.outMax : 0; });
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function () { stopBuild(); parts.forEach(function (p) { p.target = 0; }); });
    }

    /* --- 逐件拾取 / 拖动 --- */
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    var picked = null, hovered = null;
    var downX = 0, downY = 0, downOut = 0, movedFar = false, mode = null, dragAxis = null;

    function pick(x, y) {
      var r = canvas.getBoundingClientRect();
      ndc.x = ((x - r.left) / r.width) * 2 - 1;
      ndc.y = -((y - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      var hits = ray.intersectObjects(B.root.children, true);
      if (!hits.length) { return null; }
      var o = hits[0].object;
      while (o && !o.userData.part) { o = o.parent; }
      return o ? o.userData.part : null;
    }
    function highlight(rec) {
      if (hovered === rec) { return; }
      if (hovered) { hovered.obj.traverse(function (o) { if (o.material && o.material.emissive) { o.material.emissive.setHex(0x000000); } }); }
      hovered = rec;
      if (hovered) { hovered.obj.traverse(function (o) { if (o.material && o.material.emissive) { o.material.emissive.setHex(0x40280a); } }); }
      if (labelEl) {
        if (rec) { labelEl.textContent = rec.name + " · 第 " + rec.ord + " 件"; labelEl.style.opacity = "1"; }
        else { labelEl.style.opacity = "0"; }
      }
    }
    function axisOf(rec) {
      var a = rec.home.clone().add(B.root.position);
      var b = a.clone().add(rec.dir.clone());
      var p1 = a.clone().project(camera), p2 = b.clone().project(camera);
      var v = new THREE.Vector2(p2.x - p1.x, p2.y - p1.y);
      if (v.lengthSq() < 1e-6) { v = new THREE.Vector2(0, 1); }
      return v.normalize();
    }
    function beginDrag(x, y) {
      downX = x; downY = y; movedFar = false;
      var rec = pick(x, y);
      if (rec) { picked = rec; spinning = false; downOut = rec.target; dragAxis = axisOf(rec); mode = "part"; highlight(rec); }
      else { picked = null; mode = "spin"; }
    }
    function moveDrag(x, y) {
      var dx = x - downX, dy = y - downY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) { movedFar = true; }
      if (mode === "part" && picked) {
        var r = canvas.getBoundingClientRect();
        var nx = (dx / r.width) * 2, ny = -(dy / r.height) * 2;
        var v = downOut + (nx * dragAxis.x + ny * dragAxis.y) * 2.6;
        picked.target = Math.max(0, Math.min(picked.outMax * 1.2, v));
      } else if (mode === "spin") {
        az -= dx * 0.008; pol -= dy * 0.006;
        pol = Math.max(0.18, Math.min(Math.PI - 0.18, pol));
        apply(); downX = x; downY = y;
      }
    }
    function endDrag() {
      if (mode === "part" && picked) {
        if (!movedFar) { picked.target = picked.target > picked.outMax * 0.4 ? 0 : picked.outMax; }
        else if (picked.target < picked.outMax * 0.22) { picked.target = 0; }
      }
      picked = null; mode = null; dragAxis = null; downOut = 0; downX = 0; downY = 0;
    }

    if (opts.interactive !== false) {
      canvas.addEventListener("mousemove", function (e) { if (!picked) { highlight(pick(e.clientX, e.clientY)); } });
      canvas.addEventListener("mouseleave", function () { if (!picked) { highlight(null); } });
      canvas.addEventListener("mousedown", function (e) { beginDrag(e.clientX, e.clientY); e.preventDefault(); });
      window.addEventListener("mousemove", function (e) { if (mode) { moveDrag(e.clientX, e.clientY); } });
      window.addEventListener("mouseup", function () { if (mode) { endDrag(); } });
      canvas.addEventListener("wheel", function (e) {
        e.preventDefault();
        dist *= (e.deltaY > 0 ? 1.1 : 0.9);
        dist = Math.max(rr * 1.1, Math.min(rr * 5.5, dist)); apply();
      }, { passive: false });
      canvas.addEventListener("touchstart", function (e) {
        if (e.touches.length === 1) { beginDrag(e.touches[0].clientX, e.touches[0].clientY); }
      }, { passive: true });
      canvas.addEventListener("touchmove", function (e) {
        if (e.touches.length === 1) { moveDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }
      }, { passive: false });
      canvas.addEventListener("touchend", function () { if (mode) { endDrag(); } });
    }

    function resize() {
      var w = canvas.clientWidth || 600, h = canvas.clientHeight || 420;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);
    document.querySelectorAll(".tab").forEach(function (b) { b.addEventListener("click", function () { setTimeout(resize, 60); }); });
    resize();

    function tick() {
      requestAnimationFrame(tick);
      if (spinning && !picked) { az += 0.0030; apply(); }

      if (building && !opts.demo) {
        var tg = parts[bIdx];
        if (tg) {
          if (tg.target > 0.02) { tg.target *= 0.80; if (tg.target < 0.02) { tg.target = 0; } }
          else { tg.target = 0; bHold++; if (bHold > 12) { bHold = 0; bIdx++; } }
        } else { building = false; if (autoBtn) { autoBtn.textContent = "▶ 逐步装配"; } }
      }

      parts.forEach(function (p) {
        p.out += (p.target - p.out) * 0.14;
        if (Math.abs(p.target - p.out) < 0.001) { p.out = p.target; }
        p.obj.position.copy(p.home).addScaledVector(p.dir, p.out);
      });
      if (nums) { nums.textContent = outCount() + " / " + parts.length + " 件已拆出"; }
      renderer.render(scene, camera);
    }

    if (opts.demo) {   // 正确示例: 循环演示逐件装配 + 实时字幕/进度
      var di = 0, dPhase = 0, dHold = 40;
      var capEl = document.getElementById("dgDemoCap");
      var stepEl = document.getElementById("dgDemoStep");
      var barEl = document.getElementById("dgDemoBar");
      parts.forEach(function (p) { p.out = p.outMax; p.target = p.outMax; });
      setInterval(function () {
        if (dHold > 0) { dHold--; }
        else if (dPhase === 0) {
          if (di < parts.length) {
            var p = parts[di];
            p.target = p.target > 0.02 ? p.target * 0.8 : 0;
            if (p.target < 0.02) { p.target = 0; di++; dHold = 6; }
          } else { dPhase = 1; dHold = 90; }
        } else {
          parts.forEach(function (p) { p.target = p.outMax; });
          if (parts[parts.length - 1].out > parts[parts.length - 1].outMax * 0.9) { dPhase = 0; di = 0; dHold = 40; }
        }
        if (capEl) {
          if (dPhase === 0) {
            var cur = parts[Math.min(di, parts.length - 1)];
            capEl.textContent = "装配：" + (cur ? cur.name : "") + "（第 " + Math.min(di + 1, parts.length) + " 件）";
          } else { capEl.textContent = "装配完成 · 准备拆解复位"; }
        }
        if (stepEl) { stepEl.textContent = (dPhase === 0 ? "装配 " + Math.min(di, parts.length) : "完成 " + parts.length) + " / " + parts.length; }
        if (barEl) { barEl.style.width = (dPhase === 0 ? (di / parts.length * 100) : 100) + "%"; }
      }, 26);
    }

    tick();
    return { resize: resize };
  }

  function initViewers() {
    var corner = location.hash.indexOf("ztou") < 0;   // 默认展示更精致的转角铺作
    var mainParts = corner ? PARTS : PARTS_Z;
    var demoParts = corner ? PARTS : PARTS_Z;
    var modelBtn = document.getElementById("dgModel");
    if (modelBtn) {
      modelBtn.textContent = corner ? "⇄ 切成柱头铺作" : "⇄ 切成转角铺作";
      modelBtn.addEventListener("click", function () {
        location.hash = corner ? "ztou" : "corner";
        location.reload();
      });
    }
    var lab = document.getElementById("dgModelName");
    if (lab) { lab.textContent = corner ? "辽金转角铺作 · 斗拱" : "柱头铺作 · 斗拱"; }
    makeViewer(document.getElementById("dgCanvas"), {
      ui: true, interactive: true, autorotate: false, parts: mainParts,
      az: corner ? Math.PI / 4 : 0.0, pol: corner ? Math.PI / 2.34 : Math.PI / 2.06,
      zoom: corner ? 2.6 : 2.35
    });
    makeViewer(document.getElementById("dgDemo"), {
      ui: false, interactive: false, autorotate: true, demo: true, parts: demoParts,
      zoom: 3.0, pol: Math.PI / 2.45, az: corner ? Math.PI / 4 + 0.55 : 0.6
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initViewers);
  } else {
    initViewers();
  }
})();
