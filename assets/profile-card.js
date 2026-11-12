/* 全息照片卡片：改写自 React Bits 的 ProfileCard（JS + CSS 版），换成不需要 React 的原生写法
   鼠标移上去：卡片朝鼠标倾斜、照片轻微视差、彩虹全息和高光跟着光点走
   用法：ProfileCard(容器, { avatarUrl, name, title, radius, holo, glare, tiltStrength, parallax, intro }) */
(function () {
  var GRAIN = 'url("data:image/svg+xml,' + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'><filter id='g' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>") + '")';
  var DARK = {
    '--pc-frame': 'rgba(38, 35, 46, 0.66)', '--pc-frame-edge': 'rgba(255, 255, 255, 0.08)', '--pc-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--pc-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--pc-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)', '--pc-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--pc-tile-highlight': 'rgba(255, 255, 255, 0.12)', '--pc-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--pc-shade': 'rgba(0, 0, 0, 0.4)', '--pc-blend': 'color-dodge', '--pc-holo-filter': 'hue-rotate(0deg)', '--pc-sheen': 'rgba(255, 255, 255, 0.16)'
  };
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  window.ProfileCard = function (root, o) {
    o = o || {};
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tiltStrength = o.tiltStrength == null ? 12 : o.tiltStrength;
    var depth = o.parallax == null ? 8 : o.parallax;
    root.classList.add('profile-card');
    var vars = Object.assign({}, DARK, {
      '--pc-radius': (o.radius == null ? 16 : o.radius) + 'px',
      '--pc-backdrop': 'var(--pc-tile)',
      '--pc-holo': clamp(o.holo == null ? .8 : o.holo, 0, 1),
      '--pc-glare': clamp(o.glare == null ? .5 : o.glare, 0, 1),
      '--pc-parallax': Math.max(0, depth) + 'px',
      '--pc-grain': GRAIN,
      '--pc-pattern': 'linear-gradient(#000, #000)',
      '--pc-pattern-size': '100% 100%',
      '--pc-holo-gain': .75,
      '--pc-holo-detail': 0
    });
    Object.keys(vars).forEach(function (k) { root.style.setProperty(k, vars[k]); });
    root.innerHTML =
      '<div class="profile-card__body"><div class="profile-card__tile">' +
      '<span class="profile-card__sheen"></span><span class="profile-card__holo"><span class="profile-card__holo-glow"></span><span class="profile-card__holo-shift"></span></span>' +
      (o.avatarUrl ? '<img class="profile-card__photo" src="' + o.avatarUrl + '" alt="" draggable="false">' : '') +
      ((o.name || o.title) ? '<span class="profile-card__scrim"></span><div class="profile-card__info">' +
        (o.name ? '<h3 class="profile-card__name"></h3>' : '') + (o.title ? '<p class="profile-card__title"></p>' : '') + '</div>' : '') +
      '<span class="profile-card__tile-rim"></span></div>' +
      '<span class="profile-card__glare"></span><span class="profile-card__shade"></span><span class="profile-card__rim"></span></div>';
    function setText(name, title) {
      var n = root.querySelector('.profile-card__name'), t = root.querySelector('.profile-card__title');
      if (n && name != null) n.textContent = name;
      if (t && title != null) t.textContent = title;
    }
    setText(o.name, o.title);

    var size = { width: root.offsetWidth, height: root.offsetHeight };
    var x = { p: 0, v: 0, target: 0 }, y = { p: 0, v: 0, target: 0 }, light = { p: 0, target: 0 };
    var raf = 0, last = 0, slowUntil = 0, touchId = null;
    function write() {
      var angle = reduced ? 0 : tiltStrength;
      var tilt = Math.min(1, Math.hypot(x.p, y.p));
      var s = root.style;
      s.setProperty('--pc-light-x', ((x.p + 1) * .5 * size.width).toFixed(1) + 'px');
      s.setProperty('--pc-light-y', ((y.p + 1) * .5 * size.height).toFixed(1) + 'px');
      s.setProperty('--pc-pointer-x', ((x.p + 1) * 50).toFixed(2) + '%');
      s.setProperty('--pc-pointer-y', ((y.p + 1) * 50).toFixed(2) + '%');
      s.setProperty('--pc-band-x', (50 + x.p * 15).toFixed(2) + '%');
      s.setProperty('--pc-band-y', (50 + y.p * 15).toFixed(2) + '%');
      s.setProperty('--pc-rotate-x', (y.p * angle).toFixed(3) + 'deg');
      s.setProperty('--pc-rotate-y', (-x.p * angle).toFixed(3) + 'deg');
      s.setProperty('--pc-shift-x', (x.p * (reduced ? 0 : depth)).toFixed(2) + 'px');
      s.setProperty('--pc-shift-y', (y.p * (reduced ? 0 : depth)).toFixed(2) + 'px');
      s.setProperty('--pc-reach', tilt.toFixed(4));
      s.setProperty('--pc-tilt', (tilt * light.p).toFixed(4));
      s.setProperty('--pc-active', light.p.toFixed(4));
    }
    function frame(now) {
      var dt = Math.min(.05, (now - last) / 1000 || 0);
      last = now;
      var slow = now < slowUntil;
      var stiffness = slow ? 24 : 120, damping = slow ? 9 : 16;
      var steps = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / steps;
      for (var i = 0; i < steps; i++) [x, y].forEach(function (a) { a.v += (stiffness * (a.target - a.p) - damping * a.v) * h; a.p += a.v * h; });
      var tau = light.target > light.p ? .18 : slow ? .9 : .45;
      light.p += (light.target - light.p) * (1 - Math.exp(-dt / tau));
      write();
      var moving = Math.abs(x.target - x.p) > .0005 || Math.abs(y.target - y.p) > .0005 || Math.abs(x.v) > .0005 || Math.abs(y.v) > .0005 || Math.abs(light.target - light.p) > .002;
      if (moving) raf = requestAnimationFrame(frame);
      else { x.p = x.target; y.p = y.target; light.p = light.target; write(); raf = 0; }
    }
    function wake() { if (raf) return; last = performance.now(); raf = requestAnimationFrame(frame); }
    function aim(nx, ny, on) { x.target = clamp(nx, -1, 1); y.target = clamp(ny, -1, 1); light.target = on === false ? 0 : 1; slowUntil = 0; wake(); }
    function aimAt(e) {
      var r = root.getBoundingClientRect();
      if (!r.width || !r.height) return;
      aim((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1);
    }
    function release() { aim(0, 0, false); }
    root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') aimAt(e); });
    root.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' || e.pointerId === touchId) aimAt(e); });
    root.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') release(); });
    root.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; touchId = e.pointerId; aimAt(e); });
    function up(e) { if (e.pointerId !== touchId) return; touchId = null; release(); }
    root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', up);
    new ResizeObserver(function () { size.width = root.offsetWidth; size.height = root.offsetHeight; write(); }).observe(root);
    /* 开场“抓一下光”：等卡片进入画面才播，不然在页面下方播了也看不到 */
    function intro() {
      if (reduced || o.intro === false) { write(); return; }
      x.p = .62; y.p = -.55; light.p = 1;
      slowUntil = performance.now() + 1400;
      write(); wake();
    }
    write();
    var seen = false;
    new IntersectionObserver(function (es) {
      if (!seen && es[0].isIntersecting) { seen = true; setTimeout(intro, 350); }
    }, { threshold: .6 }).observe(root);
    return { setText: setText };
  };
})();
