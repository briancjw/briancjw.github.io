/* 四个主题页共用的脚本：导航、作品下拉、中英切换、页尾、滚动手感、弹窗
   主页只用其中的“作品下拉”（Site.mountDrop），其他功能主页自己已有 */
(function () {
  function all(s, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(s)); }
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var THEMES = [
    { id: 'photo', href: 'photography.html', no: '01', zh: '摄影', en: 'Photography', subZh: '暗房 · 人像、风景、静物', subEn: 'Darkroom · portraits, landscapes, still life', img: 'assets/works/photo-temple.jpg' },
    { id: 'design', href: 'design.html', no: '02', zh: '设计', en: 'Design', subZh: '样张 · 海报、原创 IP、社媒', subEn: 'Proofs · posters, original IP, social', img: 'assets/works/design-macaron.jpg' },
    { id: 'film', href: 'film.html', no: '03', zh: '影像', en: 'Film', subZh: '放映厅 · MV 与剧情短片', subEn: 'Screening room · MV & short films', img: 'assets/film/addiction-poster.jpg' },
    { id: 'code', href: 'vibe-coding.html', no: '04', zh: 'Vibe Coding', en: 'Vibe Coding', subZh: '终端 · 用 AI 编程做的网页与 3D', subEn: 'Terminal · web & 3D built with AI', img: 'assets/works/night-stall-cover.jpg' }
  ];
  var HOME = { id: 'home', href: 'index.html', zh: '回到主页', en: 'Back to home', img: 'assets/works/portfolio-home.jpg' };
  function nextLabel(n) {
    if (n.id === 'home') return lang === 'en' ? 'That’s all four themes' : '四个主题都看完了';
    return COMMON[lang].next + ' · ' + n.no;
  }
  var COMMON = {
    zh: { home: '首页', about: '关于', work: '作品', contact: '联系', next: '下一个主题', foot: '一起合作吧', right: '摄影 / 平面设计 / 影像', nav: '主要导航', langGroup: '切换语言 Language', works: '作品主题' },
    en: { home: 'Home', about: 'About', work: 'Work', contact: 'Contact', next: 'Next theme', foot: 'Let’s work together', right: 'Photography / Graphic Design / Video', nav: 'Main navigation', langGroup: 'Language 切换语言', works: 'Work themes' }
  };

  var lang = 'zh';
  try { if (localStorage.getItem('lang') === 'en') lang = 'en'; } catch (e) {}
  if (/[?&]lang=en\b/.test(location.search)) lang = 'en';
  var listeners = [];
  var page = document.body.dataset.page || '';
  var isHome = !page;

  /* ---------- 作品下拉 ---------- */
  /* 图片路径要换成完整网址：CSS 变量里的相对路径会按 site.css 的位置去找 */
  function abs(p) { return new URL(p, document.baseURI).href; }
  var drop = null;
  var dropLink = null;
  function renderDrop() {
    if (!drop) return;
    drop.innerHTML = THEMES.map(function (t) {
      return '<a href="' + t.href + '"' + (t.id === page ? ' class="here" aria-current="page"' : '') + '>' +
        '<span class="thumb" style="--g:url(' + abs(t.img) + ') center/cover"></span>' +
        '<span><b>' + (lang === 'en' ? t.en : t.zh) + '</b><small>' + (lang === 'en' ? t.subEn : t.subZh) + '</small></span><i>' + t.no + '</i></a>';
    }).join('');
    drop.setAttribute('aria-label', COMMON[lang].works);
  }
  function mountDrop(link) {
    dropLink = link;
    drop = document.createElement('nav');
    drop.className = 'drop';
    drop.id = 'worksDrop';
    document.body.appendChild(drop);
    renderDrop();
    link.classList.add('has-drop');
    link.setAttribute('aria-haspopup', 'true');
    link.setAttribute('aria-expanded', 'false');
    link.setAttribute('aria-controls', 'worksDrop');
    var timer = 0;
    function place() {
      var r = link.getBoundingClientRect();
      drop.style.left = (r.left + r.width / 2) + 'px';
      drop.style.top = (r.bottom + 22) + 'px';
    }
    function open() {
      clearTimeout(timer);
      if (document.querySelector('.nav.tuck')) return;
      place();
      drop.classList.add('open');
      link.classList.add('open');
      link.setAttribute('aria-expanded', 'true');
    }
    function close(now) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        drop.classList.remove('open');
        link.classList.remove('open');
        link.setAttribute('aria-expanded', 'false');
      }, now ? 0 : 180);
    }
    [link, drop].forEach(function (el) {
      el.addEventListener('pointerenter', open);
      el.addEventListener('pointerleave', function () { close(false); });
      el.addEventListener('focusin', open);
      el.addEventListener('focusout', function (e) { if (!drop.contains(e.relatedTarget) && e.relatedTarget !== link) close(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
    window.addEventListener('scroll', function () { if (drop.classList.contains('open') && document.querySelector('.nav.tuck')) close(true); }, { passive: true });
    window.addEventListener('resize', function () { close(true); });
  }

  /* ---------- 子页面：导航和页尾由这里生成，四页保持一致 ---------- */
  function buildChrome() {
    var c = COMMON[lang];
    var header = document.createElement('header');
    header.className = 'nav';
    header.innerHTML =
      '<a class="logo" href="index.html">BRIAN CHEW<span>PORTFOLIO</span></a>' +
      '<nav class="menu" aria-label="' + c.nav + '">' +
      '<a href="index.html" data-c="home">' + c.home + '</a>' +
      '<a href="index.html#about" data-c="about">' + c.about + '</a>' +
      '<a href="index.html#projects" class="on" data-c="work">' + c.work + '</a></nav>' +
      '<div class="lang" role="group" aria-label="' + c.langGroup + '">' +
      '<button type="button" data-lang="zh" aria-pressed="' + (lang === 'zh') + '">中</button>' +
      '<button type="button" data-lang="en" aria-pressed="' + (lang === 'en') + '">EN</button></div>';
    document.body.insertBefore(header, document.body.firstChild);

    var i = 0;
    THEMES.forEach(function (t, k) { if (t.id === page) i = k; });
    /* 最后一个主题（Vibe Coding）看完后，页尾换成回到主页 */
    var next = i === THEMES.length - 1 ? HOME : THEMES[i + 1];
    var foot = document.createElement('footer');
    foot.id = 'contact';
    foot.innerHTML =
      '<a class="next-theme" href="' + next.href + '"><small data-c="next">' + nextLabel(next) + '</small>' +
      '<b><span data-next-name>' + (lang === 'en' ? next.en : next.zh) + '</span><em>→</em></b>' +
      '<span class="peek" style="--g:url(' + abs(next.img) + ') center/cover"></span></a>' +
      '<div class="site-foot"><div class="foot-bar"><span>© 2026 Brian Chew</span><span data-c="right">' + c.right + '</span></div></div>';
    foot.dataset.next = next.id;
    document.body.appendChild(foot);
    mountDrop(header.querySelector('[data-c="work"]'));
  }

  /* ---------- 中英切换 ---------- */
  var i18nEls = [];
  function collect() {
    i18nEls = all('[data-i18n]');
    i18nEls.forEach(function (el) { if (el._zh == null) el._zh = el.innerHTML; });
  }
  function apply(next, save) {
    lang = next === 'en' ? 'en' : 'zh';
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    if (save) { try { localStorage.setItem('lang', lang); } catch (e) {} }
    renderDrop();
    if (isHome) return;
    var dict = window.PAGE_EN || {};
    i18nEls.forEach(function (el) {
      var html = lang === 'en' ? dict[el.dataset.i18n] : el._zh;
      if (html == null) return;
      var wasSplit = !!el.querySelector('.mask');
      el.innerHTML = html;
      if (wasSplit) splitLines(el);
    });
    var c = COMMON[lang];
    all('[data-c]').forEach(function (el) {
      var k = el.dataset.c;
      if (k === 'next') {
        var id = document.getElementById('contact').dataset.next;
        var n = id === 'home' ? HOME : THEMES.filter(function (t) { return t.id === id; })[0];
        el.textContent = nextLabel(n);
        document.querySelector('[data-next-name]').textContent = lang === 'en' ? n.en : n.zh;
      } else el.textContent = c[k];
    });
    var menu = document.querySelector('.nav .menu');
    if (menu) menu.setAttribute('aria-label', c.nav);
    var group = document.querySelector('.nav .lang');
    if (group) {
      group.setAttribute('aria-label', c.langGroup);
      all('button', group).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    }
    var title = document.body.dataset[lang === 'en' ? 'titleEn' : 'titleZh'];
    if (title) document.title = title;
    listeners.forEach(function (fn) { fn(lang); });
  }

  /* ---------- 导航：自动收起 + 玻璃折射 ---------- */
  function tuckNav(nav) {
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y < 120) nav.classList.remove('tuck');
      else if (y > lastY + 4) nav.classList.add('tuck');
      else if (y < lastY - 4) nav.classList.remove('tuck');
      lastY = y;
    }, { passive: true });
    nav.addEventListener('focusin', function () { nav.classList.remove('tuck'); });
  }
  function glass(nav) {
    var ua = navigator.userAgent;
    var noRefraction = (/Safari/.test(ua) && !/Chrome/.test(ua)) || /Firefox/.test(ua);
    var probe = document.createElement('div');
    probe.style.backdropFilter = 'url(#nav-glass)';
    if (noRefraction || !probe.style.backdropFilter) { nav.classList.add('glass-frost'); return; }
    var NS = 'http://www.w3.org/2000/svg';
    var holder = document.createElement('div');
    holder.innerHTML = '<svg class="glass-map" xmlns="' + NS + '" aria-hidden="true"><defs>' +
      '<filter id="nav-glass" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">' +
      '<feImage id="navMap" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="-120" xChannelSelector="R" yChannelSelector="G" result="dispRed"/>' +
      '<feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="-117" xChannelSelector="R" yChannelSelector="G" result="dispGreen"/>' +
      '<feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="-114" xChannelSelector="R" yChannelSelector="G" result="dispBlue"/>' +
      '<feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue"/>' +
      '<feBlend in="red" in2="green" mode="screen" result="rg"/><feBlend in="rg" in2="blue" mode="screen" result="output"/>' +
      '<feGaussianBlur in="output" stdDeviation="7"/></filter></defs></svg>';
    document.body.appendChild(holder.firstChild);
    var map = document.getElementById('navMap');
    function drawMap() {
      var w = nav.offsetWidth || 400, h = nav.offsetHeight || 60, r = h / 2, edge = h * .07;
      var svg = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="' + NS + '"><defs>' +
        '<linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>' +
        '<linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>' +
        '<filter id="s" filterUnits="userSpaceOnUse" x="0" y="0" width="' + w + '" height="' + h + '"><feGaussianBlur stdDeviation="11"/></filter></defs>' +
        '<rect width="' + w + '" height="' + h + '" fill="black"/>' +
        '<rect width="' + w + '" height="' + h + '" rx="' + r + '" fill="url(#r)"/>' +
        '<rect width="' + w + '" height="' + h + '" rx="' + r + '" fill="url(#b)" style="mix-blend-mode:difference"/>' +
        '<rect x="' + edge + '" y="' + edge + '" width="' + (w - edge * 2) + '" height="' + (h - edge * 2) + '" rx="' + r + '" fill="hsl(0 0% 50% / .93)" filter="url(#s)"/></svg>';
      map.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(svg));
    }
    drawMap();
    new ResizeObserver(drawMap).observe(nav);
    nav.classList.add('glass-svg');
    nav.style.backdropFilter = 'url(#nav-glass) saturate(1.25)';
  }

  /* ---------- 自由滚动：和主页同样的手感 ---------- */
  var glideTo = function (y) { window.scrollTo(0, y); };
  function freeScroll() {
    if (typeof gsap === 'undefined' || calm || !window.matchMedia('(hover: hover)').matches) return;
    var root = document.documentElement;
    root.classList.add('stepped');
    var state = { y: 0 }, tween = null, target = null;
    glideTo = function (y, duration) {
      if (tween) tween.kill();
      state.y = window.scrollY;
      target = y;
      tween = gsap.to(state, { y: y, duration: duration || .8, ease: 'power4.out',
        onUpdate: function () { window.scrollTo(0, state.y); },
        onComplete: function () { tween = null; target = null; } });
    };
    var stop = function () { if (tween) tween.kill(); tween = null; target = null; };
    window.addEventListener('keydown', stop);
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || root.classList.contains('modal-open')) return;
      /* 横向胶片带、可互动 3D 等区域自己处理滚轮 */
      if (e.target.closest && e.target.closest('[data-own-wheel]')) return;
      e.preventDefault();
      if (!e.deltaY) return;
      var notch = e.deltaMode !== 0 || Math.abs(e.deltaY) >= 80;
      var d = notch ? Math.sign(e.deltaY) * 450 : e.deltaY * 2.2;
      var y = window.scrollY;
      var same = target !== null && (target - y) * d > 0;
      var max = root.scrollHeight - window.innerHeight;
      var to = Math.min(max, Math.max(0, (same ? target : y) + d));
      if (Math.abs(to - y) < .5) return;
      glideTo(to, .8);
    }, { passive: false });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href') === '#') return;
      var el = document.querySelector(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      glideTo(Math.max(0, el.getBoundingClientRect().top + window.scrollY - 110), 1.1);
    });
  }

  /* ---------- 弹窗 ---------- */
  var html = document.documentElement;
  function openModal(dialog) {
    html.classList.add('modal-open');
    dialog.showModal();
    if (typeof gsap !== 'undefined' && !calm) gsap.fromTo(dialog, { autoAlpha: 0 }, { autoAlpha: 1, duration: .45, ease: 'power2.out' });
  }
  function closeModal(dialog, done) {
    if (!dialog.open) { if (done) done(); return; }
    function finish() {
      all('video', dialog).forEach(function (v) { v.pause(); });
      dialog.close();
      html.classList.remove('modal-open');
      if (typeof gsap !== 'undefined') gsap.set(dialog, { clearProps: 'opacity,visibility' });
      if (done) done();
    }
    if (typeof gsap !== 'undefined' && !calm) gsap.to(dialog, { autoAlpha: 0, duration: .3, ease: 'power2.in', onComplete: finish });
    else finish();
  }
  function wireModals() {
    all('dialog.modal').forEach(function (dialog) {
      dialog.addEventListener('cancel', function (e) { e.preventDefault(); closeModal(dialog); });
      dialog.addEventListener('close', function () { html.classList.remove('modal-open'); });
      all('[data-close]', dialog).forEach(function (b) { b.addEventListener('click', function () { closeModal(dialog); }); });
    });
  }

  /* 大标题按行拆开，从遮罩里升起 */
  function splitLines(el) {
    var src = el.innerHTML.replace(/<span class="mask"><span>([\s\S]*?)<\/span><\/span>/g, '$1');
    el.innerHTML = src.split(/<br\s*\/?>/i).map(function (l) { return '<span class="mask"><span>' + l + '</span></span>'; }).join('<br>');
    return all('.mask > span', el);
  }

  /* ---------- 手机菜单：右上角汉堡按钮，打开全屏菜单（导航 + 四个主题） ---------- */
  function mobileMenu(nav) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'burger';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'msheet');
    btn.innerHTML = '<i></i>';
    nav.appendChild(btn);
    var sheet = document.createElement('div');
    sheet.className = 'msheet';
    sheet.id = 'msheet';
    document.body.appendChild(sheet);
    function render() {
      var links = all('.menu a', nav).map(function (a) { return '<a href="' + a.getAttribute('href') + '">' + a.textContent + '</a>'; }).join('');
      sheet.innerHTML = '<nav class="links" aria-label="' + COMMON[lang].nav + '">' + links + '</nav><h4>' + COMMON[lang].works + '</h4><div class="themes">' +
        THEMES.map(function (t) {
          return '<a href="' + t.href + '"' + (t.id === page ? ' class="here" aria-current="page"' : '') + ' style="--g:url(' + abs(t.img) + ') center/cover"><span>' + (lang === 'en' ? t.en : t.zh) + '</span></a>';
        }).join('') + '</div>';
    }
    function set(open) {
      if (open) render();
      sheet.classList.toggle('open', open);
      html.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? (lang === 'en' ? 'Close menu' : '关闭菜单') : (lang === 'en' ? 'Open menu' : '打开菜单'));
      nav.classList.remove('tuck');
    }
    set(false);
    btn.addEventListener('click', function () { set(!sheet.classList.contains('open')); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('open')) set(false); });
    listeners.push(function () { set(false); });
  }
  window.Site = {
    THEMES: THEMES,
    get lang() { return lang; },
    calm: calm,
    all: all,
    onLang: function (fn) { listeners.push(fn); },
    setLang: function (l) { apply(l, false); },
    mountDrop: mountDrop,
    openModal: openModal,
    closeModal: closeModal,
    splitLines: splitLines,
    glideTo: function (y, d) { glideTo(y, d); }
  };

  if (isHome) { if (document.querySelector('.nav')) mobileMenu(document.querySelector('.nav')); return; }
  buildChrome();
  mobileMenu(document.querySelector('.nav'));
  collect();
  apply(lang, false);
  var nav = document.querySelector('.nav');
  tuckNav(nav);
  glass(nav);
  wireModals();
  all('.nav .lang button').forEach(function (b) {
    b.addEventListener('click', function () { if (b.dataset.lang !== lang) apply(b.dataset.lang, true); });
  });
  freeScroll();
})();
