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
    var m = new THREE.MeshStandardMaterial({ map: woodTex(hex), roughness: rough, metalness: 0.02 });
    m.userData.hex = hex;              /* 供无 WebGL 时的软件渲染取色 */
    return m;
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

  /* ================= 三个可自拆解榫卯模型 =================
     与斗拱同源：每件都是独立可拾取的"单件"，方向即真实拆装方向。
     ① 十字搭接榫  ② 粽角榫（三碰肩）  ③ 燕尾榫（抽屉四角） */

  /* ① 十字搭接榫（井字枋）：五纵五横正交咬合，共 10 件。
     交点半厚互让 —— 横枋只留上半、纵枋只留下半，故两者在交点处零重叠、上表面齐平。 */
  var CN = 5, CP = 0.62, CS = 0.30, CH = 0.15;
  var CHL = (CN - 1) / 2 * CP + 0.45;
  var CO = [], CSEG = [];
  (function () {
    for (var i = 0; i < CN; i++) { CO.push((i - (CN - 1) / 2) * CP); }
    var edges = [-CHL];
    CO.forEach(function (o) { edges.push(o - CS / 2, o + CS / 2); });
    edges.push(CHL);
    for (var e = 0; e < edges.length; e += 2) {
      var a = edges[e], b = edges[e + 1];
      if (b - a > 0.03) { CSEG.push([(a + b) / 2, b - a]); }
    }
  })();
  var CNM = ["一", "二", "三", "四", "五"];
  var PARTS_CROSS = [];
  CO.forEach(function (zc, k) {           /* 纵枋：整根下半 + 交点之间的上半盖板 */
    var g = [{ t: "box", p: [0, -CH, zc], s: [CHL * 2, CH * 2, CS] }];
    CSEG.forEach(function (sg) { g.push({ t: "box", p: [sg[0], CH, zc], s: [sg[1], CH * 2, CS] }); });
    PARTS_CROSS.push({ n: "纵枋(" + CNM[k] + ")", k: "grp", p: [0, 0, 0], g: g, dir: U, ord: k + 1, out: 1.9 });
  });
  CO.forEach(function (xc, k) {           /* 横枋：整根上半 + 交点之间的下半填块 */
    var g = [{ t: "box", p: [xc, CH, 0], s: [CS, CH * 2, CHL * 2] }];
    CSEG.forEach(function (sg) { g.push({ t: "box", p: [xc, -CH, sg[0]], s: [CS, CH * 2, sg[1]] }); });
    PARTS_CROSS.push({ n: "横枋(" + CNM[k] + ")", k: "grp", p: [0, 0, 0], g: g, dir: U, ord: CN + k + 1, out: 1.9 });
  });

  /* ---- 镜像/搬运小工具：把"以腿为原点、朝 +x/+z 伸出"的标准角件，
         搬到四面平框架的四个角上（sx/sz 为 -1 时沿该轴镜像） ---- */
  function xform(q, sx, sz) {
    var o = {}, k;
    for (k in q) { if (q.hasOwnProperty(k)) { o[k] = q[k]; } }
    if (q.t === "box" || q.t === "cyl") {
      o.p = [q.p[0] * sx, q.p[1], q.p[2] * sz];
    } else if (q.t === "prx") {
      o.pts = q.pts.map(function (r) { return [r[0] * sx, r[1] * sz]; });
      if (sx * sz < 0) { o.pts = o.pts.slice().reverse(); }
    } else if (q.t === "prz") {
      o.pts = q.pts.map(function (r) { return [r[0] * sz, r[1]]; });
      if (sz < 0) { o.pts = o.pts.slice().reverse(); o.x0 = -(q.x0 + q.th); }
    } else if (q.t === "pz") {
      o.pts = q.pts.map(function (r) { return [r[0] * sx, r[1]]; });
      if (sx < 0) { o.pts = o.pts.slice().reverse(); }
      if (sz < 0) { o.z0 = -(q.z0 + q.th); }
    }
    return o;
  }
  function place(list, sx, sz, tx, tz) {
    return list.map(function (q) {
      var o = xform(q, sx, sz);
      if (o.t === "box" || o.t === "cyl") { o.p = [o.p[0] + tx, o.p[1], o.p[2] + tz]; }
      else if (o.t === "prx") { o.pts = o.pts.map(function (r) { return [r[0] + tx, r[1] + tz]; }); }
      else if (o.t === "prz") { o.pts = o.pts.map(function (r) { return [r[0] + tz, r[1]]; }); o.x0 += tx; }
      else if (o.t === "pz") { o.pts = o.pts.map(function (r) { return [r[0] + tx, r[1]]; }); o.z0 += tz; }
      return o;
    });
  }
  function swapXZ(list) {                  /* 把"朝 +x 的枨"整体换成"朝 +z 的枨" */
    return list.map(function (q) {
      if (q.t === "box") {
        return { t: "box", p: [q.p[2], q.p[1], q.p[0]], s: [q.s[2], q.s[1], q.s[0]] };
      }
      if (q.t === "prx") {
        return { t: "prx", pts: q.pts.map(function (r) { return [r[1], r[0]]; }), th: q.th, y0: q.y0 };
      }
      if (q.t === "pz") {
        return { t: "prz", pts: q.pts.map(function (r) { return [r[0], r[1]]; }), th: q.th, x0: q.z0 };
      }
      return q;
    });
  }

  /* ② 粽角榫（三碰肩）：四面平方凳上部框架 —— 4 腿 + 4 枨 + 4 角牙，共 12 件。
     腿与两向枨以 45° 斜肩相接，三个可见面都露出接缝，故称三碰肩；枨端双榫藏进腿内。
     标准角件：腿在原点，枨沿 +x / +z 伸出；四个角由它镜像搬运而成。 */
  var ZA = 0.85;                          /* 腿位 (±ZA, ±ZA) */
  var ZJ_LEG_G = [
    { t: "box", p: [0, -0.83, 0], s: [0.5, 0.66, 0.5] },
    { t: "prx", pts: [[-0.25, -0.25], [0.25, -0.25], [0.25, 0], [0, 0.25], [-0.25, 0.25]], th: 0.5, y0: -0.5 }
  ];
  var ZJ_HEAD = [                         /* 枨在腿一侧的端头：45° 斜肩 + 两根榫头 */
    { t: "prx", pts: [[0.25, 0], [0.25, 0.25], [0.5, 0.25], [0.5, -0.25]], th: 0.5, y0: -0.5 },
    { t: "box", p: [0.165, -0.25, -0.16], s: [0.17, 0.30, 0.12] },
    { t: "box", p: [0.165, -0.25, -0.02], s: [0.17, 0.30, 0.12] }
  ];
  var ZJ_TOOTH = [                        /* 角牙：紧贴腿外、托在枨下 */
    { t: "pz", pts: [[0.25, -0.5], [0.86, -0.5], [0.25, -1.02]], th: 0.30, z0: -0.15 }
  ];
  function zjCornerS(sx, sz) { return [sx > 0 ? -1 : 1, sz > 0 ? -1 : 1]; }
  var ZJ_SIDE = [{ n: "前", z: -ZA }, { n: "后", z: ZA }];
  var ZJ_SIDEZ = [{ n: "左", x: -ZA }, { n: "右", x: ZA }];
  var PARTS_CORNER = [];
  /* 4 条腿 */
  [["前左", -ZA, -ZA], ["前右", ZA, -ZA], ["后右", ZA, ZA], ["后左", -ZA, ZA]].forEach(function (L, i) {
    var s = zjCornerS(L[1], L[2]);
    PARTS_CORNER.push({
      n: "腿(" + L[0] + ")", k: "grp", p: [0, 0, 0], dir: DN, ord: i + 1, out: 1.35,
      g: place(ZJ_LEG_G, s[0], s[1], L[1], L[2])
    });
  });
  /* 2 条纵枨（沿 X，首位在后侧之上一律朝 +x 拉出） */
  ZJ_SIDE.forEach(function (S, i) {
    var g = place(ZJ_HEAD, 1, 1, -ZA, S.z).concat(
      [{ t: "box", p: [0, -0.25, S.z], s: [1.2, 0.5, 0.5] }],
      place(ZJ_HEAD, -1, 1, ZA, S.z));
    PARTS_CORNER.push({ n: "枨(" + S.n + ")", k: "grp", p: [0, 0, 0], dir: [i ? -1 : 1, 0, 0], ord: 5 + i, out: 1.5, g: g });
  });
  /* 2 条横枨（沿 Z） */
  var HZ = swapXZ(ZJ_HEAD);
  ZJ_SIDEZ.forEach(function (S, i) {
    var g = place(HZ, 1, 1, S.x, -ZA).concat(
      [{ t: "box", p: [S.x, -0.25, 0], s: [0.5, 0.5, 1.2] }],
      place(HZ, 1, -1, S.x, ZA));
    PARTS_CORNER.push({ n: "枨(" + S.n + ")", k: "grp", p: [0, 0, 0], dir: [0, 0, i ? -1 : 1], ord: 7 + i, out: 1.5, g: g });
  });
  /* 4 枚角牙（每角一枚，托在前/后两条纵枨之下） */
  [["前左", -ZA, -ZA, -0.66], ["前右", ZA, -ZA, 0.66], ["后右", ZA, ZA, 0.66], ["后左", -ZA, ZA, -0.66]].forEach(function (T, i) {
    var s = zjCornerS(T[1], T[2]);
    PARTS_CORNER.push({
      n: "角牙(" + T[0] + ")", k: "grp", p: [0, 0, 0], dir: [T[3], -0.72, 0], ord: 9 + i, out: 1.3,
      g: place(ZJ_TOOTH, s[0], s[1], T[1], T[2])
    });
  });

  /* ③ 燕尾榫（抽屉四角）：四块板以倒锁燕尾互咬 —— 榫根窄、榫梢宽，
     故只能沿板厚方向整体抽出，横向抽不动。 */
  var DTP = [   /* 前后板上的销（与燕尾互补） */
    [[0.75, 0.50], [1.05, 0.50], [1.05, 0.42], [0.75, 0.39]],
    [[0.75, 0.21], [1.05, 0.18], [1.05, 0.12], [0.75, 0.09]],
    [[0.75, -0.09], [1.05, -0.12], [1.05, -0.18], [0.75, -0.21]],
    [[0.75, -0.39], [1.05, -0.42], [1.05, -0.50], [0.75, -0.50]]
  ];
  var DTT = [   /* 侧板上的燕尾 */
    [[0.75, 0.21], [1.05, 0.18], [1.05, 0.42], [0.75, 0.39]],
    [[0.75, -0.09], [1.05, -0.12], [1.05, 0.12], [0.75, 0.09]],
    [[0.75, -0.39], [1.05, -0.42], [1.05, -0.18], [0.75, -0.21]]
  ];
  function dtMir(pts) { return pts.map(function (q) { return [-q[0], q[1]]; }); }
  function dtSub(prof, x0) {
    return prof.map(function (q) { return { t: "prz", pts: q, th: 0.30, x0: x0 }; });
  }
  var PARTS_DOVE = [
    { n: "前板", k: "grp", p: [0, 0, 0], dir: [0, 0, 1], ord: 1, out: 1.5,
      g: [{ t: "box", p: [0, 0, 0.90], s: [1.5, 1.0, 0.30] }].concat(dtSub(DTP, 0.75)).concat(dtSub(DTP, -1.05)) },
    { n: "后面板", k: "grp", p: [0, 0, 0], dir: [0, 0, -1], ord: 2, out: 1.5,
      g: [{ t: "box", p: [0, 0, -0.90], s: [1.5, 1.0, 0.30] }]
        .concat(dtSub(DTP.map(dtMir), 0.75)).concat(dtSub(DTP.map(dtMir), -1.05)) },
    { n: "左侧板", k: "grp", p: [0, 0, 0], dir: [-1, 0, 0], ord: 3, out: 1.5,
      g: [{ t: "box", p: [-0.90, 0, 0], s: [0.30, 1.0, 1.5] }]
        .concat(dtSub(DTT, -1.05)).concat(dtSub(DTT.map(dtMir), -1.05)) },
    { n: "右侧板", k: "grp", p: [0, 0, 0], dir: [1, 0, 0], ord: 4, out: 1.5,
      g: [{ t: "box", p: [0.90, 0, 0], s: [0.30, 1.0, 1.5] }]
        .concat(dtSub(DTT, 0.75)).concat(dtSub(DTT.map(dtMir), 0.75)) },
    { n: "底板", k: "grp", p: [0, 0, 0], dir: DN, ord: 5, out: 1.15,
      g: [{ t: "box", p: [0, -0.42, 0], s: [1.50, 0.16, 1.50] }] }
  ];

  /* 模型注册表：本页 5 件展品（2 件斗拱 + 3 件榫卯），各自独立，不再互相切换 */
  var MODELS = [
    { id: "corner", name: "转角铺作", sub: "辽金 · 斗拱", kicker: "大木作 · 转角",
      desc: "转角处两个方向出跳的斗拱，构件斜向咬合，是斗拱里最复杂的一类。",
      parts: PARTS, az: Math.PI / 4, pol: Math.PI / 2.34, zoom: 2.6 },
    { id: "ztou", name: "柱头铺作", sub: "宋 · 斗拱", kicker: "大木作 · 柱头",
      desc: "柱头之上的斗拱，构件层层叠垒在同一个竖直平面内，受力直接、层层压叠。",
      parts: PARTS_Z, az: 0.0, pol: Math.PI / 2.06, zoom: 2.35 },
    { id: "cross", name: "十字搭接榫", sub: "井字枋 · 五纵五横", kicker: "榫卯 · 十字卡腰",
      desc: "五纵五横方材正交咬合，交点半厚互让、上表面齐平 —— 共 10 件，是最基础也最常用的交叉榫。",
      parts: PARTS_CROSS, az: 0.70, pol: 1.05, zoom: 2.15 },
    { id: "cornerJoint", name: "粽角榫", sub: "三碰肩 · 四面平框架", kicker: "榫卯 · 格肩双榫",
      desc: "腿与两向枨以 45° 斜肩相接，三个可见面都露出接缝，故称三碰肩；枨端双榫藏进腿内。四角各一，组成一面方凳面框。",
      parts: PARTS_CORNER, az: Math.PI / 4.2, pol: Math.PI / 2.55, zoom: 4.2 },
    { id: "dovetail", name: "燕尾榫", sub: "抽屉四角 · 五件", kicker: "榫卯 · 倒锁燕尾",
      desc: "榫根窄、榫梢宽，形成倒锁 —— 越拉越紧，只能沿一个方向抽出，是抽屉四角的经典做法。",
      parts: PARTS_DOVE, az: Math.PI / 4, pol: Math.PI / 2.75, zoom: 2.7 }
  ];

  /* ---------------- 榫卯模型用的棱柱几何 ----------------
     prz: 截面画在 (z,y) 平面, 沿 X 挤出 thickness —— 用于燕尾榫/格肩
     prx: 截面画在 (x,z) 平面, 沿 Y 挤出 thickness —— 用于粽角榫的 45° 斜肩 */
  function shapeOf(pts) {
    var s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) { s.lineTo(pts[i][0], pts[i][1]); }
    s.closePath();
    return s;
  }
  function prismZY(pts, th, x0) {
    var g = new THREE.ExtrudeGeometry(shapeOf(pts), { depth: th, bevelEnabled: false });
    g.rotateY(-Math.PI / 2);         // (x,y,z) -> (-z, y, x)
    g.translate(x0 + th, 0, 0);      // 世界 X ∈ [x0, x0+th]
    return g;
  }
  function prismXZ(pts, th, y0) {
    var g = new THREE.ExtrudeGeometry(shapeOf(pts), { depth: th, bevelEnabled: false });
    g.rotateX(Math.PI / 2);          // (x,y,z) -> (x, -z, y)
    g.translate(0, y0 + th, 0);      // 世界 Y ∈ [y0, y0+th]
    return g;
  }
  function subMesh(q, mat) {
    if (q.t === "box") { return new THREE.Mesh(new THREE.BoxGeometry(q.s[0], q.s[1], q.s[2]), mat); }
    if (q.t === "cyl") { return new THREE.Mesh(new THREE.CylinderGeometry(q.r, q.r * 0.98, q.h, 22), mat); }
    if (q.t === "prz") { return new THREE.Mesh(prismZY(q.pts, q.th, q.x0), mat); }
    if (q.t === "prx") { return new THREE.Mesh(prismXZ(q.pts, q.th, q.y0), mat); }
    if (q.t === "pz") {
      var g = new THREE.ExtrudeGeometry(shapeOf(q.pts), { depth: q.th, bevelEnabled: false });
      g.translate(0, 0, q.z0);
      return new THREE.Mesh(g, mat);
    }
    return null;
  }
  function grpMesh(pt, mat) {
    var G = new THREE.Group();
    pt.g.forEach(function (q) {
      var m = subMesh(q, mat);
      if (!m) { return; }
      if (q.t === "box" || q.t === "cyl") { m.position.set(q.p[0], q.p[1], q.p[2]); }
      if (q.ry) { m.rotation.y = q.ry * Math.PI / 180; }
      if (q.rx) { m.rotation.x = q.rx * Math.PI / 180; }
      if (q.rz) { m.rotation.z = q.rz * Math.PI / 180; }
      G.add(m);
    });
    return G;
  }

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
      else if (pt.k === "grp") { obj = grpMesh(pt, mat); }
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

  /* ---------------- WebGL 渲染器 ----------------
     每个画布直连自己的 WebGL 上下文（和最初能正常显示的版本完全一致：
     不传 preserveDrawingBuffer，渲染直接落在自己的画布上，中间不做任何拷贝）。 */
  function makeGL(canvas, pr) {
    var tries = [
      { antialias: true, alpha: true },
      { antialias: false, alpha: true },
      { antialias: false, alpha: true, powerPreference: "low-power" }
    ];
    for (var i = 0; i < tries.length; i++) {
      try {
        var r = new THREE.WebGLRenderer({
          canvas: canvas, antialias: tries[i].antialias, alpha: true,
          powerPreference: tries[i].powerPreference
        });
        r.setClearColor(0x000000, 0);
        r.setPixelRatio(pr || 1);
        if (THREE.sRGBEncoding) { r.outputEncoding = THREE.sRGBEncoding; }
        r.toneMapping = THREE.ACESFilmicToneMapping;
        r.toneMappingExposure = 1.06;
        return r;
      } catch (e) { /* 下一组参数 */ }
    }
    return null;
  }

  /* 建场景：灯光 + 模型 + 地面阴影；返回 { scene, parts, rr } */
  function sceneFor(partsIn) {
    var scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x8a6b4a, 0.85));
    var key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(5, 8, 6); scene.add(key);
    var rim = new THREE.DirectionalLight(0xffc9a0, 0.55); rim.position.set(-6, 4, -5); scene.add(rim);
    var fill = new THREE.DirectionalLight(0xa8c0ff, 0.25); fill.position.set(0, -3, -4); scene.add(fill);

    var B = build(partsIn || PARTS);
    var bx = new THREE.Box3().setFromObject(B.root);
    var ctr = bx.getCenter(new THREE.Vector3());
    B.root.position.set(-ctr.x, -ctr.y, -ctr.z);
    var rr = bx.getBoundingSphere(new THREE.Sphere()).radius || 1;
    scene.add(B.root);

    var c = document.createElement("canvas"); c.width = c.height = 128;
    var x = c.getContext("2d");
    var gr = x.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, "rgba(50,28,10,0.5)");
    gr.addColorStop(1, "rgba(50,28,10,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    var gm = new THREE.Mesh(new THREE.PlaneGeometry(rr * 2.6, rr * 2.6),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    gm.rotation.x = -Math.PI / 2; gm.position.y = -rr * 1.02; scene.add(gm);

    return { scene: scene, parts: B.parts, root: B.root, rr: rr };
  }

  function freeScene(scene) {
    try {
      scene.traverse(function (o) {
        if (o.geometry && o.geometry.dispose) { o.geometry.dispose(); }
        if (o.material && o.material.dispose) { o.material.dispose(); }
      });
      while (scene.children.length) { scene.remove(scene.children[0]); }
    } catch (e) {}
  }

  function camFor(rr, az, pol, zoom, aspect) {
    var cam = new THREE.PerspectiveCamera(40, aspect, 0.01, 200);
    var dist = rr * (zoom || 2.5);
    cam.position.set(dist * Math.sin(pol) * Math.sin(az), dist * Math.cos(pol), dist * Math.sin(pol) * Math.cos(az));
    cam.lookAt(0, 0, 0);
    return cam;
  }

  /* ---------------- 展示器 ---------------- */
  function makeViewer(canvas, opts) {
    if (!canvas || !THREE.WebGLRenderer) { return null; }
    opts = opts || {};
    var dead = false;
    var fc = 0, frameMod = opts.throttle || 1;

    var pr = Math.min(window.devicePixelRatio || 1, 2);
    var renderer = makeGL(canvas, pr, false);
    var SOFT = !renderer && !!(window.SOFT3D);
    var ctx2d = null;
    if (SOFT) {
      ctx2d = canvas.getContext("2d");
      if (!ctx2d) {
        /* WebGL 尝试时可能已占用该画布，换一块新画布再取 2D */
        var nc = document.createElement("canvas");
        nc.className = canvas.className;
        canvas.parentNode.replaceChild(nc, canvas);
        canvas = nc;
        ctx2d = canvas.getContext("2d");
      }
    }
    if (!renderer && !ctx2d) {
      if (canvas.parentNode && !canvas.parentNode.querySelector(".gl-fail")) {
        var fb = document.createElement("div");
        fb.className = "gl-fail";
        fb.textContent = "当前浏览器既没有 WebGL 也不支持画布渲染";
        canvas.parentNode.appendChild(fb);
        canvas.parentNode.classList.add("gl-failed");
      }
      return { resize: function () {}, parts: [], dispose: function () {}, failed: true };
    }
    if (SOFT) {
      pr = 1;
      frameMod = Math.max(frameMod, 3);
      if (canvas.parentNode && !canvas.parentNode.querySelector(".gl-soft")) {
        var tag = document.createElement("div");
        tag.className = "gl-soft";
        tag.textContent = "2D 兼容模式 ⓘ";
        tag.title = "点击查看这台电脑为什么用不了三维加速";
        tag.addEventListener("click", function (e) {
          e.stopPropagation();
          if (window.SOFT3D && window.SOFT3D.panel) { window.SOFT3D.panel(); }
        });
        canvas.parentNode.appendChild(tag);
      }
    }

    var S = sceneFor(opts.parts);
    var scene = S.scene, parts = S.parts, rr = S.rr, root = S.root;

    var camera = new THREE.PerspectiveCamera(40, 1, 0.01, 200);
    var az = opts.az || Math.PI / 4, pol = opts.pol || Math.PI / 2.32, dist = rr * (opts.zoom || 2.5);
    var spinning = opts.autorotate === true;
    function apply() {
      camera.position.set(dist * Math.sin(pol) * Math.sin(az), dist * Math.cos(pol), dist * Math.sin(pol) * Math.cos(az));
      camera.lookAt(0, 0, 0);
    }
    apply();

    var rootEl = opts.root || null;
    function uiEl(role, id) {
      return rootEl ? rootEl.querySelector('[data-role="' + role + '"]') : document.getElementById(id);
    }
    var stepsEl = opts.ui ? uiEl("steps", "dgSteps") : null;
    var labelEl = opts.ui ? uiEl("label", "dgLabel") : null;
    var nums = opts.ui ? uiEl("nums", "dgNums") : null;
    var autoBtn = opts.ui ? uiEl("auto", "dgAuto") : null;
    var allBtn = opts.ui ? uiEl("all", "dgAll") : null;
    var resetBtn = opts.ui ? uiEl("reset", "dgReset") : null;

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
    var paused = false;
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
      var hits = ray.intersectObjects(root.children, true);
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
      var a = rec.home.clone().add(root.position);
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

    /* 直接渲染到本视图自己的画布（与最初能正常显示的版本一致） */
    function drawFrame() {
      if (dead) { return; }
      var w = Math.max(2, Math.round(canvas.clientWidth || 300));
      var h = Math.max(2, Math.round(canvas.clientHeight || 220));
      if (SOFT) {
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        camera.aspect = w / h; camera.updateProjectionMatrix();
        window.SOFT3D.render(ctx2d, w, h, scene, camera);
        return;
      }
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }

    function resize() { drawFrame(); }
    window.addEventListener("resize", resize);
    document.querySelectorAll(".tab").forEach(function (b) { b.addEventListener("click", function () { setTimeout(resize, 60); }); });
    resize();

    function tick() {
      if (dead) { return; }
      requestAnimationFrame(tick);
      if (paused) { return; }
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
      fc++;
      if (fc % frameMod === 0) { drawFrame(); }
    }

    if (opts.demo) {   // 正确示例: 循环演示逐件装配 + 实时字幕/进度
      var di = 0, dPhase = 0, dHold = 40;
      var capEl = document.getElementById(opts.capId || "dgDemoCap");
      var stepEl = document.getElementById(opts.stepId || "dgDemoStep");
      var barEl = document.getElementById(opts.barId || "dgDemoBar");
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
    return {
      resize: resize,
      parts: parts,
      pause: function (v) { paused = !!v; },
      dispose: function () {
        dead = true;
        window.removeEventListener("resize", resize);
        freeScene(scene);
        if (renderer) {
          try { renderer.dispose(); } catch (e) {}
          try { if (renderer.forceContextLoss) { renderer.forceContextLoss(); } } catch (e) {}
        }
      }
    };
  }

  /* ---------------- 榫卯模型页：5 件各自独立，卡片本身就是可拆解的三维视图 ----------------
     不再需要"点开全屏详情页"——每张卡直接就能转、能点构件取出、能一键拆装。 */
  function initJointPage() {
    var grid = document.getElementById("jgGrid");
    if (!grid) { return; }
    var cardViews = [];

    MODELS.forEach(function (m) {
      var card = document.createElement("div");
      card.className = "jg-card";
      card.innerHTML =
        '<div class="jg-cover"><canvas></canvas>' +
          '<span class="jg-badge">' + m.parts.length + ' 件可拆</span>' +
          '<span class="jg-live">拖动旋转</span>' +
        '</div>' +
        '<div class="jg-meta"><div class="jg-name">' + m.name + '</div>' +
        '<div class="jg-tag">' + m.kicker + ' · ' + m.sub + '</div>' +
        '<div class="jg-nums" data-role="nums">0 / ' + m.parts.length + ' 件已拆出</div></div>' +
        '<div class="jg-btns">' +
          '<button class="cbtn" data-role="auto">▶ 逐步装配</button>' +
          '<button class="cbtn" data-role="all">✂ 全部拆出</button>' +
          '<button class="cbtn" data-role="reset">↺ 全部还原</button>' +
        '</div>';
      grid.appendChild(card);
      var v = makeViewer(card.querySelector("canvas"), {
        ui: true, interactive: true, autorotate: true, root: card,
        parts: m.parts, throttle: 2, az: m.az, pol: m.pol, zoom: m.zoom * 1.05
      });
      cardViews.push({ view: v, card: card });
      card.querySelectorAll(".cbtn").forEach(function (b) {
        b.addEventListener("click", function (e) { e.stopPropagation(); });
      });
    });

    /* 看不见的卡片暂停渲染，省电省热量（手机上滚动不再一顿一顿） */
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (ens) {
        ens.forEach(function (en) {
          var hit = null;
          cardViews.forEach(function (c) { if (c.card === en.target) { hit = c; } });
          if (hit && hit.view && hit.view.pause) { hit.view.pause(!en.isIntersecting); }
        });
      }, { rootMargin: "120px 0px" });
      cardViews.forEach(function (c) { io.observe(c.card); });
    }

    window.addEventListener("resize", function () {
      cardViews.forEach(function (c) { if (c.view && c.view.resize) { c.view.resize(); } });
    });

    /* 正确示例窗口：默认演示柱头铺作 */
    var dm = MODELS[1];
    makeViewer(document.getElementById("jgDemo"), {
      interactive: false, autorotate: true, demo: true, parts: dm.parts, throttle: 3,
      zoom: 3.0, pol: Math.PI / 2.45, az: 0.62,
      capId: "jgDemoCap", stepId: "jgDemoStep", barId: "jgDemoBar"
    });

    /* 兼容旧入口：按 id 滚动到对应卡片并让它自己转起来 */
    window.openJointModel = function (id) {
      var i = -1;
      MODELS.forEach(function (x, k) { if (x.id === id) { i = k; } });
      if (i >= 0 && cardViews[i] && cardViews[i].view) {
        cardViews[i].card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initJointPage);
  } else {
    initJointPage();
  }
})();
