/* soft3d.js — 无 WebGL 时的 Canvas2D 软件渲染兜底
   用途：部分电脑关闭了浏览器"硬件加速"后 WebGL 会被整体禁用，三维模型整个显示不出来。
   这里用纯 Canvas2D 把 Three.js 场景里的三角形投影、按深度排序、逐面平面着色画出来。
   精度不如 WebGL（无贴图/无阴影），但结构、拆解、旋转拖动全部照常可用。 */
(function (global) {
  "use strict";
  if (!global.THREE) { return; }
  var T = global.THREE;

  var _vp = new T.Matrix4(), _ro = new T.Matrix4();
  var _a = new T.Vector3(), _b = new T.Vector3(), _c = new T.Vector3();
  var _e1 = new T.Vector3(), _e2 = new T.Vector3(), _n = new T.Vector3();
  var _va = new T.Vector3(), _vb = new T.Vector3(), _vc = new T.Vector3();
  var _eye = new T.Vector3(), _toFace = new T.Vector3();
  var L1 = new T.Vector3(0.36, 0.86, 0.36).normalize();
  var L2 = new T.Vector3(-0.64, 0.30, -0.71).normalize();

  var _pool = [], _pn = 0, _list = [];
  function tri() {
    if (_pn < _pool.length) { return _pool[_pn++]; }
    var o = { x0: 0, y0: 0, x1: 0, y1: 0, x2: 0, y2: 0, z: 0, c: "#000" };
    _pool.push(o); _pn++;
    return o;
  }

  var _ccache = {};
  function tone(hex, k) {
    var key = hex + "_" + (k * 48 | 0);
    var v = _ccache[key];
    if (v) { return v; }
    var r = ((hex >> 16) & 255) / 255, g = ((hex >> 8) & 255) / 255, b = (hex & 255) / 255;
    r = r * k; g = g * k; b = b * k;
    if (r > 1) { r = 1; } if (g > 1) { g = 1; } if (b > 1) { b = 1; }
    v = "rgb(" + (Math.sqrt(r) * 255 | 0) + "," + (Math.sqrt(g) * 255 | 0) + "," + (Math.sqrt(b) * 255 | 0) + ")";
    _ccache[key] = v;
    return v;
  }

  /* 把场景画进 ctx（尺寸 W×H 像素） */
  function render(ctx, W, H, scene, camera) {
    if (!ctx || W < 2 || H < 2) { return; }
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    if (Math.abs(camera.aspect - W / H) > 1e-4) { camera.aspect = W / H; }
    camera.updateProjectionMatrix();
    _vp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _ro.copy(camera.matrixWorldInverse);
    _eye.setFromMatrixPosition(camera.matrixWorld);
    _pn = 0; _list.length = 0;

    scene.traverse(function (o) {
      if (o.visible !== true || o.isMesh !== true || !o.geometry) { return; }
      var m = o.material;
      if (!m || m.transparent === true || m.isMeshBasicMaterial === true) { return; }  /* 跳过地面阴影贴图 */
      var g = o.geometry, pos = g.attributes && g.attributes.position;
      if (!pos) { return; }
      var idx = g.index ? g.index.array : null;
      var cnt = idx ? idx.length : pos.count;
      if (cnt < 3) { return; }
      var hex = (m.userData && m.userData.hex) || (m.color ? m.color.getHex() : 0xffffff);
      var cull = (m.side !== T.DoubleSide);
      var mw = o.matrixWorld, arr = pos.array;

      for (var i = 0; i + 2 < cnt; i += 3) {
        var i0 = idx ? idx[i] * 3 : i * 3;
        var i1 = idx ? idx[i + 1] * 3 : (i + 1) * 3;
        var i2 = idx ? idx[i + 2] * 3 : (i + 2) * 3;

        _a.set(arr[i0], arr[i0 + 1], arr[i0 + 2]).applyMatrix4(mw);
        _b.set(arr[i1], arr[i1 + 1], arr[i1 + 2]).applyMatrix4(mw);
        _c.set(arr[i2], arr[i2 + 1], arr[i2 + 2]).applyMatrix4(mw);

        /* 视空间深度（用于画师算法排序，越小越远） */
        _va.copy(_a).applyMatrix4(_ro);
        _vb.copy(_b).applyMatrix4(_ro);
        _vc.copy(_c).applyMatrix4(_ro);
        var vz = (_va.z + _vb.z + _vc.z) / 3;

        _e1.subVectors(_b, _a); _e2.subVectors(_c, _a);
        _n.crossVectors(_e1, _e2);
        if (_n.lengthSq() < 1e-12) { continue; }
        _n.normalize();
        /* 让法线朝向相机：镜像过的构件 winding 会反，这里统一纠正 */
        _toFace.subVectors(_eye, _a);
        if (_n.dot(_toFace) < 0) {
          if (cull) { continue; }   /* 朝背面 → 剔除 */
          _n.negate();
        }

        _va.copy(_a).applyMatrix4(_vp);
        _vb.copy(_b).applyMatrix4(_vp);
        _vc.copy(_c).applyMatrix4(_vp);
        if (!isFinite(_va.x) || !isFinite(_vb.x) || !isFinite(_vc.x)) { continue; }
        if (Math.abs(_va.x) > 6 || Math.abs(_va.y) > 6 || Math.abs(_vb.x) > 6 ||
            Math.abs(_vb.y) > 6 || Math.abs(_vc.x) > 6 || Math.abs(_vc.y) > 6) { continue; }

        var sx0 = (_va.x * 0.5 + 0.5) * W, sy0 = (0.5 - _va.y * 0.5) * H;
        var sx1 = (_vb.x * 0.5 + 0.5) * W, sy1 = (0.5 - _vb.y * 0.5) * H;
        var sx2 = (_vc.x * 0.5 + 0.5) * W, sy2 = (0.5 - _vc.y * 0.5) * H;
        var lam1 = _n.dot(L1), lam2 = _n.dot(L2);
        if (lam1 < 0) { lam1 = 0; }
        if (lam2 < 0) { lam2 = 0; }
        var k = 0.40 + 0.50 * lam1 + 0.26 * lam2;
        var em = m.emissive;
        if (em && (em.r > 0.001 || em.g > 0.001 || em.b > 0.001)) { k += 0.55; }

        var t = tri();
        t.x0 = sx0; t.y0 = sy0; t.x1 = sx1; t.y1 = sy1; t.x2 = sx2; t.y2 = sy2;
        t.z = vz; t.c = tone(hex, k);
        _list.push(t);
      }
    });

    _list.sort(function (p, q) { return p.z - q.z; });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = "round";
    ctx.lineWidth = 0.8;
    for (var k2 = 0; k2 < _list.length; k2++) {
      var s = _list[k2];
      ctx.beginPath();
      ctx.moveTo(s.x0, s.y0);
      ctx.lineTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.closePath();
      ctx.fillStyle = s.c;
      ctx.strokeStyle = s.c;
      ctx.fill();
      ctx.stroke();
    }
  }

  /* 诊断：逐项测试三种 WebGL 上下文并读取显卡信息，用于解释"为什么这台机器渲染不了" */
  function diag() {
    var lines = [];
    var names = ["webgl2", "webgl", "experimental-webgl"];
    for (var i = 0; i < names.length; i++) {
      var c = document.createElement("canvas");
      c.width = c.height = 8;
      var g = null, err = "";
      try { g = c.getContext(names[i]); } catch (e) { err = e && e.message ? e.message : String(e); }
      var r = "";
      if (g) {
        try {
          var d = g.getExtension("WEBGL_debug_renderer_info");
          r = d ? String(g.getParameter(d.UNMASKED_RENDERER_WEBGL)) : String(g.getParameter(g.RENDERER));
        } catch (e2) { r = "(读不到显卡名)"; }
        try {
          var ls = g.getExtension("WEBGL_lose_context");
          if (ls) { ls.loseContext(); }
        } catch (e3) {}
      }
      lines.push("  " + names[i] + "： " + (g ? "可用 → " + r : "不可用" + (err ? "（" + err + "）" : "")));
    }
    lines.push("  浏览器： " + (navigator.userAgent || "?"));
    lines.push("  CPU 核心： " + (navigator.hardwareConcurrency || "?") + "　屏幕像素比： " + (window.devicePixelRatio || 1));
    return lines.join("\n");
  }

  function panel() {
    if (document.getElementById("glDiagBox")) { return; }
    var box = document.createElement("div");
    box.id = "glDiagBox";
    box.innerHTML = '<div class="gl-diag-card">' +
      '<h4>为什么这台电脑显示的是"2D 兼容模式"？</h4>' +
      '<p>页面没能创建 WebGL 三维画布，于是自动降级成了 2D 软件渲染（所以你看到的是没有木纹的平面色块）。测试结果：</p>' +
      '<pre></pre>' +
      '<p class="gl-diag-tip">最常见的原因是浏览器关闭了<strong>硬件加速</strong>。开启办法（以 Edge 为例）：<br>' +
      '设置 → 系统和性能 → 打开"使用硬件加速(如可用)" → 重启浏览器。<br>' +
      '想进一步确认，可在地址栏输入 <code>edge://gpu</code>（Chrome 用 <code>chrome://gpu</code>），搜索 WebGL 看是否显示 Disabled。</p>' +
      '<p class="gl-diag-tip">如果三个 webgl 都显示"不可用"，多半是显卡驱动过旧、或系统禁用了显卡加速；也可能是远程桌面 / 虚拟机环境本身没有 GPU。</p>' +
      '<button type="button" class="gl-diag-close">知道了</button></div>';
    box.querySelector("pre").textContent = diag();
    box.addEventListener("click", function (e) {
      if (e.target === box || (e.target.className || "").indexOf("gl-diag-close") >= 0) { box.remove(); }
    });
    document.body.appendChild(box);
  }

  global.SOFT3D = { render: render, tris: function () { return _list.length; }, diag: diag, panel: panel };
})(window);
