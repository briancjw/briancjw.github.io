/* 页面转场：每个主题先用 2.5D（等角）微缩场景“搭好片场”，再进入页面
   - 摄影：搭起摄影棚 → 相机“咔嚓”闪光
   - 影像：户外片场、导演椅 → 场记板“ACTION!”拉开
   - 设计：设计工作台、印刷机吐出样张 → 盖章“PROOF”，样张放大
   - Vibe Coding：方块堆成服务器 → 开机，屏幕亮起，镜头推进屏幕
   - 回主页：BRIAN CHEW 字母掉下来叠好 → 往上掀开
   分两段：在原页面播“搭建”，同时预先载入下一页；新页面一打开再播“揭开”。
   同一次浏览里第一次去某个主题播完整版，之后只播最后一下。
   这个文件放在 <head> 里，新页面一开始就先盖住，不会闪一下 */
(function () {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = document.documentElement;
  var KEY = 'tr-pending';
  var PAGES = { 'index.html': 'home', '': 'home', 'photography.html': 'photo', 'design.html': 'design', 'film.html': 'film', 'vibe-coding.html': 'code' };
  var NAMES = {
    home: ['回到主页', 'HOME'], photo: ['摄影', 'PHOTOGRAPHY'], design: ['设计', 'DESIGN'], film: ['影像', 'FILM'], code: ['Vibe Coding', 'VIBE CODING']
  };
  function store(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function lang() { try { return localStorage.getItem('lang') === 'en' ? 'en' : 'zh'; } catch (e) { return 'zh'; } }
  function pageOf(url) {
    var file = url.pathname.split('/').pop();
    return Object.prototype.hasOwnProperty.call(PAGES, file) ? PAGES[file] : null;
  }

  /* 新页面：如果是从转场跳过来的，先用一层深色盖住 */
  var pending = null;
  try { pending = JSON.parse(read(KEY) || 'null'); } catch (e) {}
  if (pending && Date.now() - pending.t < 15000 && !reduced) html.classList.add('tr-in');
  else pending = null;
  store(KEY, null);

  /* ---------- 2.5D 小工具：等角投影画方块 ---------- */
  var S = 36;
  function P(x, y, z) { return [((x - y) * .866 * S).toFixed(1), ((x + y) * .5 * S - z * S).toFixed(1)]; }
  function pts(list) { return list.map(function (p) { return P(p[0], p[1], p[2]).join(','); }).join(' '); }
  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round((n >> 16) * f)), g = Math.min(255, Math.round(((n >> 8) & 255) * f)), b = Math.min(255, Math.round((n & 255) * f));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  /* 一个方块：上面、右前、左前三个面 */
  function cube(x, y, z, w, d, h, col, extra) {
    return '<polygon points="' + pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]) + '" fill="' + col + '"/>' +
      '<polygon points="' + pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]) + '" fill="' + shade(col, .8) + '"/>' +
      '<polygon points="' + pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]) + '" fill="' + shade(col, .64) + '"/>' + (extra || '');
  }
  /* 贴在方块左前面（朝 +y 的面）上的一块平面，例如屏幕、窗户 */
  function faceY(x, y, z, w, h, col, id) {
    return '<polygon' + (id ? ' id="' + id + '"' : '') + ' points="' + pts([[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h]]) + '" fill="' + col + '"/>';
  }
  function faceX(x, y, z, d, h, col, id) {
    return '<polygon' + (id ? ' id="' + id + '"' : '') + ' points="' + pts([[x, y, z], [x, y + d, z], [x, y + d, z + h], [x, y, z + h]]) + '" fill="' + col + '"/>';
  }
  /* 每个部件各画在一张独立的 svg 上，叠在一起：动画只移动整张图层，交给显卡处理，不会卡 */
  function layerSvg(inner, cls) { return '<svg class="tr-layer' + (cls ? ' ' + cls : '') + '" viewBox="-320 -300 640 480" preserveAspectRatio="xMidYMid meet">' + inner + '</svg>'; }
  function part(inner, cls) { return layerSvg(inner, cls); }
  function floor(col) { return layerSvg(cube(-4.2, -4.2, -.35, 8.4, 8.4, .35, col), 'tr-floor'); }

  /* ---------- 五个场景 ---------- */
  var SCENES = {
    photo: function () {
      var dark = '#2b2b2e';
      return floor('#3a3532') +
        part(cube(-3.8, -3.8, 0, 7.4, .3, 4.4, '#ece7dc')) +                                   // 背景纸
        part(cube(-3.8, -3.5, 0, 7.4, 3.2, .06, '#f3efe6')) +                                  // 地上的无缝纸
        part(cube(-3.8, -3.5, 0, .3, 4.6, 4.4, '#e2ddd2')) +                                   // 侧墙
        part(cube(-1.9, -3.2, 0, .7, .7, .06, dark) + cube(-1.6, -2.9, 0, .1, .1, 2.9, dark) + cube(-2.3, -3.6, 2.9, 1.5, 1.5, .18, '#f7f5ef') + cube(-1.65, -2.95, 3.08, .2, .2, .25, dark)) +  // 伞灯
        part(cube(-.5, -2.1, 0, .9, .9, 1, '#b85a42')) +                                       // 模特凳
        part(cube(-.38, -2, 1, .66, .6, .9, '#2f3d70') + cube(-.24, -1.9, 1.9, .4, .38, .42, '#e8c4a0') + cube(-.26, -1.92, 2.3, .44, .42, .14, '#2a2220')) +  // 模特
        part(cube(2.2, 1.8, 0, 1.1, .7, .55, '#3a3d44') + cube(2.2, 1.8, .55, 1.1, .7, .06, '#e9c27a')) +   // 器材箱
        part(cube(-2.6, 2.2, 0, 1, .8, 1.1, '#5b6170') + cube(-2.5, 2.3, 1.1, .8, .55, .05, '#d9d4ca') + cube(-2.5, 2.3, 1.15, .8, .05, .45, '#24272d', faceY(-2.45, 2.36, 1.2, .7, .36, '#7cc7ff'))) +  // 电脑推车
        part(cube(-3.2, .2, 0, .8, .8, .08, dark) + cube(-2.86, .54, 0, .12, .12, 2.7, dark) +  // 左边灯架 + 柔光箱
          cube(-3.3, .1, 2.7, 1, 1, 1, '#f7f5ef', faceX(-2.3, .1, 2.75, 1, .9, '#fffdf6', 'trGlow1'))) +
        part(cube(2.3, -1.4, 0, .8, .8, .08, dark) + cube(2.64, -1.06, 0, .12, .12, 2.4, dark) +  // 右边灯架 + 柔光箱
          cube(2.2, -1.5, 2.4, 1, 1, .9, '#f7f5ef')) +
        part(cube(.7, 1.9, 0, .8, .8, .06, dark) + cube(1.04, 2.24, 0, .12, .12, 1.7, dark)) +     // 三脚架
        part(cube(.7, 1.95, 1.7, .8, .55, .55, '#1c1c1f') + cube(.88, 1.55, 1.78, .42, .42, .4, '#3a3a3e') +  // 相机 + 镜头
          cube(.95, 2.15, 2.25, .3, .25, .18, '#1c1c1f', faceY(.97, 2.4, 2.27, .26, .14, '#fff8e0', 'trFlash')));
    },
    film: function () {
      var rail = '#7a7f88', red = '#c8372d', wood = '#6b4a33';
      var sleepers = '';
      for (var i = 0; i < 7; i++) sleepers += cube(-3.2 + i * 1, .9, 0, .18, 1, .05, wood);
      return floor('#5f8f55') +
        part(cube(-4, -4, 0, 2.2, 2.2, .04, '#6e9f63') + cube(-3.6, -3.6, 0, .25, .25, .7, wood) + cube(-3.95, -3.95, .7, .95, .95, 1, '#3f7a4a')) +  // 树
        part(cube(2.6, -3.8, 0, .25, .25, .6, wood) + cube(2.25, -4.15, .6, .95, .95, .9, '#4f8a5c')) +
        part(sleepers + cube(-3.3, 1, .05, 7, .08, .06, rail) + cube(-3.3, 1.75, .05, 7, .08, .06, rail)) +   // 轨道
        part(cube(-1.2, .95, .11, 1.2, .95, .25, '#3a3d44') + cube(-.7, 1.3, .36, .14, .14, .9, '#2b2e35') +     // 摄影车 + 摄影机
          cube(-1.1, 1.1, 1.26, .9, .6, .55, '#1c1c1f') + cube(-1.6, 1.2, 1.32, .5, .4, .4, '#3a3a3e')) +
        part(cube(1.6, -1.9, 0, .08, .08, 1, '#d9c7a7') + cube(2.5, -1.9, 0, .08, .08, 1, '#d9c7a7') +        // 导演椅
          cube(1.6, -1.2, 0, .08, .08, 1, '#d9c7a7') + cube(2.5, -1.2, 0, .08, .08, 1, '#d9c7a7') +
          cube(1.55, -1.95, .95, 1.05, .85, .08, red) + cube(1.55, -1.95, 1.03, 1.05, .08, .7, red) +
          cube(1.5, -1.95, 1.03, .06, .85, .3, '#d9c7a7') + cube(2.6, -1.95, 1.03, .06, .85, .3, '#d9c7a7')) +
        part(cube(-3, -1.8, 0, .7, .7, .06, '#2b2e35') + cube(-2.7, -1.5, 0, .1, .1, 2.8, '#2b2e35') +       // 收音杆
          cube(-2.7, -1.5, 2.8, 2.6, .08, .08, '#2b2e35') + cube(-.25, -1.62, 2.55, .5, .3, .3, '#9aa0aa')) +
        part(cube(-3.9, 2.2, 0, .1, .1, 2, '#d9d4ca') + cube(-1.9, 2.2, 0, .1, .1, 2, '#d9d4ca') + cube(-3.9, 3.8, 0, .1, .1, 2, '#d9d4ca') + cube(-1.9, 3.8, 0, .1, .1, 2, '#d9d4ca') +
          cube(-4, 2.1, 2, 2.2, 1.9, .12, '#f3efe6') + cube(-3.4, 2.6, 0, .9, .6, .8, '#3a3d44') + cube(-3.3, 2.7, .8, .7, .1, .45, '#24272d', faceY(-3.25, 2.81, .84, .6, .36, '#7cc7ff'))) +  // 帐篷和监看屏
        part(cube(3, .2, 0, .7, .7, .06, '#2b2e35') + cube(3.3, .5, 0, .1, .1, 2, '#2b2e35') +               // 灯
          cube(3.05, .25, 2, .6, .6, .5, '#e9c27a', faceX(3.05, .25, 2.05, .6, .4, '#fff1c9')));
    },
    design: function () {
      var wood = '#c49a6c', leg = '#5b4632';
      return floor('#2a2d33') +
        part(cube(-4.1, -4.1, 0, 8.2, .22, 3.6, '#3a3e46', faceY(-3.6, -3.87, 1.9, 1.1, 1.4, '#e8574a') + faceY(-2.2, -3.87, 2.2, .9, 1.2, '#f2d67c') + faceY(-1, -3.87, 1.8, 1.2, 1.5, '#3f8f86') + faceY(.5, -3.87, 2.1, 1, 1.2, '#f28da0') + faceY(1.9, -3.87, 1.9, 1.3, 1.4, '#1e2a5a'))) +  // 墙上的作品
        part(cube(2.9, -3.4, 0, .7, .7, .7, '#b85a42') + cube(2.85, -3.45, .7, .8, .8, 1, '#4f8a5c')) +   // 盆栽
        part(cube(-3.4, -2.2, 0, .2, .2, 1.3, leg) + cube(2.6, -2.2, 0, .2, .2, 1.3, leg) + cube(-3.4, 1.4, 0, .2, .2, 1.3, leg) + cube(2.6, 1.4, 0, .2, .2, 1.3, leg) +
          cube(-3.6, -2.4, 1.3, 6.6, 4, .18, wood)) +                                          // 桌子
        part(cube(-3.2, -.6, 1.48, 2.8, 2, .04, '#2f5a48')) +                                   // 切割垫
        part(cube(-2.4, -2.1, 1.48, .9, .5, .06, '#24272d') + cube(-2.05, -1.95, 1.54, .2, .2, .8, '#24272d') +  // 屏幕
          cube(-3, -2.15, 2.2, 2.2, .14, 1.4, '#24272d', faceY(-2.9, -2.01, 2.3, 2, 1.2, '#3f8f86'))) +
        part(cube(.6, -1.9, 1.48, 1.8, 1.4, .8, '#ece7dc', faceY(.9, -.5, 1.9, 1.2, .08, '#2b2e35'))) +  // 印刷机
        part(cube(-1.6, 2.4, 0, 1, 1, .9, '#24272d') + cube(-1.6, 3.3, .9, 1, .14, 1, '#24272d')) +   // 椅子
        part(cube(-1, 1, 1.48, .4, .4, .5, '#e8574a') + cube(-.95, 1.05, 1.98, .06, .06, .4, '#f2d67c') + cube(-.8, 1.1, 1.98, .06, .06, .32, '#3f8f86')) +  // 笔筒
        part('<g id="trSheet">' + cube(.95, -.5, 1.9, 1.1, 1.5, .03, '#ffffff') + '</g>', 'tr-late');   // 吐出来的样张
    },
    code: function () {
      var rack = '#20232a', led = '#8fe3a7';
      var blocks = '';
      for (var i = 0; i < 6; i++) {
        blocks += part(cube(1.7, -1.6, i * .5, 1.5, 1.3, .46, rack,
          faceY(1.85, -.3, i * .5 + .16, .9, .06, i % 2 ? led : '#7cc7ff') + faceY(2.9, -.3, i * .5 + .12, .12, .14, '#f2d67c')), 'tr-block');
      }
      return floor('#16181c') +
        part(cube(-3.4, -2, 0, .2, .2, 1.2, '#2b2e35') + cube(.6, -2, 0, .2, .2, 1.2, '#2b2e35') + cube(-3.4, .9, 0, .2, .2, 1.2, '#2b2e35') + cube(.6, .9, 0, .2, .2, 1.2, '#2b2e35') +
          cube(-3.6, -2.2, 1.2, 4.6, 3.3, .16, '#3a3d44')) +                                   // 桌子
        part(cube(-2.3, -1.6, 1.36, 1, .6, .06, '#24272d') + cube(-1.9, -1.4, 1.42, .2, .2, .7, '#24272d') +  // 屏幕
          cube(-3.2, -1.75, 2.1, 2.9, .16, 1.8, '#24272d', faceY(-3.08, -1.59, 2.2, 2.66, 1.6, '#0d0f12', 'trScreen'))) +
        part(cube(-.2, -1.9, 1.36, .3, .3, .06, '#2b2e35') + cube(-.1, -1.8, 1.42, .08, .08, .9, '#2b2e35') + cube(-.4, -1.95, 2.3, .6, .5, .2, '#f2d67c')) +   // 台灯
        part(cube(.1, .2, 1.36, .3, .3, .35, '#e8574a') + cube(-3.3, .5, 1.36, .5, .5, .45, '#b85a42') + cube(-3.35, .45, 1.81, .6, .6, .6, '#4f8a5c')) +   // 马克杯、盆栽
        part(cube(-2.9, -.4, 1.36, 2.2, .7, .06, '#d9d4ca') + cube(-.5, -.3, 1.36, .25, .4, .06, '#d9d4ca')) +  // 键盘、鼠标
        blocks +
        part(faceY(2.95, -.29, 3.12, .16, .16, '#e8574a', 'trPower'), 'tr-late');             // 开机键
    }
  };

  /* ---------- 左右两侧的作品图 ---------- */
  var SIDES = {
    photo: { kind: 'polaroid', left: ['photo-portrait-suit', 'photo-island', 'photo-blossom'], right: ['photo-temple', 'photo-latte', 'photo-sunset'], dir: 'works' },
    design: { kind: 'poster', left: ['works/design-code-poster', 'works/design-macaron', 'ip/malam-01-cover'], right: ['works/design-sushi-menu', 'works/design-wms-ad', 'ip/malam-04-stickers'] },
    film: { kind: 'frame', left: ['film/addiction-poster', 'film/addiction-still-1', 'film/mv-still-1'], right: ['film/mv-poster', 'film/addiction-still-3', 'film/mv-still-3'] },
    code: { kind: 'window', left: ['works/penang-walk-cover', '#code1', '#code2'], right: ['#code3', 'works/portfolio-home', '#code4'] }
  };
  var CODE = {
    code1: ["const city = new City(15)", "city.build('mall')", "city.build('temple')", "city.night()"],
    code2: ["import * as THREE from 'three'", "scene.add(stall)", "renderer.render()"],
    code3: ["gsap.to('.reel', {", "  rotate: 720,", "  ease: 'power2.inOut'", "})"],
    code4: ["// vibe coding", "claude \"做一个放映厅\"", "✓ done"]
  };
  /* 每张卡片的位置：上下错开、角度不同 */
  var SLOTS = [
    { t: 4, l: 8, w: 72, r: -7 }, { t: 36, l: 30, w: 66, r: 5 }, { t: 66, l: 4, w: 70, r: -3 }
  ];
  function sideHTML(theme) {
    var cfg = SIDES[theme];
    if (!cfg) return '';
    function card(src, slot, k) {
      var inner;
      if (src.charAt(0) === '#') {
        inner = '<div class="tr-snip">' + CODE[src.slice(1)].map(function (l) { return '<i>' + l.replace(/</g, '&lt;') + '</i>'; }).join('') + '</div>';
      } else {
        var path = 'assets/' + (cfg.dir ? cfg.dir + '/' : '') + src + '.jpg';
        inner = '<span class="tr-img" style="background-image:url(' + path + ')"></span>';
      }
      return '<div class="tr-card tr-' + cfg.kind + '" style="top:' + slot.t + '%;left:' + slot.l + '%;width:' + slot.w + '%;--r:' + slot.r + 'deg">' +
        '<div class="tr-card-in" style="animation-delay:-' + (k * 1.3) + 's">' + inner + '</div></div>';
    }
    return '<div class="tr-side tr-left">' + cfg.left.map(function (s, k) { return card(s, SLOTS[k], k); }).join('') + '</div>' +
      '<div class="tr-side tr-right">' + cfg.right.map(function (s, k) { return card(s, SLOTS[(k + 1) % 3], k + 3); }).join('') + '</div>';
  }

  /* ---------- 回主页：火柴人观众在两边喝彩 ---------- */
  function crowdHTML() {
    function person(k) {
      var c = ['#f5f0e8', '#f2d67c', '#8fe3a7', '#f28da0', '#7cc7ff'][k % 5];
      return '<svg class="tr-fan" viewBox="0 0 60 120" style="--d:' + (k * .17).toFixed(2) + 's">' +
        '<g fill="none" stroke="' + c + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="30" cy="18" r="11"/><path d="M30 29 V72 M30 72 L17 108 M30 72 L43 108"/>' +
        '<path class="tr-arm-l" d="M30 40 L10 18"/><path class="tr-arm-r" d="M30 40 L50 18"/></g></svg>';
    }
    var row = function (n, off) { var s = ''; for (var i = 0; i < n; i++) s += person(i + off); return s; };
    var bits = '';
    for (var i = 0; i < 28; i++) {
      bits += '<i class="tr-confetti" style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + ['#f2d67c', '#e8574a', '#8fe3a7', '#7cc7ff', '#f28da0'][i % 5] + ';animation-delay:-' + (Math.random() * 3).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.8).toFixed(2) + 's"></i>';
    }
    return '<div class="tr-crowd tr-left">' + row(5, 0) + '</div><div class="tr-crowd tr-right">' + row(5, 5) + '</div><div class="tr-confettis">' + bits + '</div>';
  }

  /* ---------- 盖层 ---------- */
  var layer = null;
  function buildLayer(theme) {
    var l = lang();
    var name = NAMES[theme] || NAMES.home;
    var el = document.createElement('div');
    el.className = 'ptr tr-' + theme;
    el.setAttribute('aria-hidden', 'true');
    var stage;
    if (theme === 'home') {
      var word = l === 'en' ? 'THANKS FOR WATCHING' : '感谢观看';
      stage = '<div class="tr-word">' + word.split('').map(function (c) { return '<span>' + (c === ' ' ? '&nbsp;' : c) + '</span>'; }).join('') + '</div>' +
        '<p class="tr-thanks">' + (l === 'en' ? 'Back to the home page' : '回到主页') + '</p>';
    } else {
      stage = SCENES[theme]();
    }
    if (theme === 'film') stage += '<div class="tr-clap"><div class="tr-clap-top"></div><div class="tr-clap-board"><b>ACTION!</b><small>SCENE 03 · TAKE 1</small></div></div>';
    if (theme === 'photo') stage += '<div class="tr-snap">' + (l === 'en' ? 'SNAP' : '咔嚓') + '</div><div class="tr-white"></div>';
    if (theme === 'design') stage += '<div class="tr-stamp">PROOF ✓</div><div class="tr-paper"></div>';
    if (theme === 'code') stage += '<i class="tr-cursor"></i>';
    el.innerHTML = (theme === 'home' ? crowdHTML() : sideHTML(theme)) +
      '<div class="tr-stage">' + stage + '</div>' +
      '<p class="tr-label"><small>' + (theme === 'home' ? (l === 'en' ? 'THAT’S A WRAP' : '谢谢你看完') : (l === 'en' ? 'NOW ENTERING' : '正在进入')) + '</small><b>' + (l === 'en' ? name[1] : name[0]) + '</b></p>' +
      '<p class="tr-skip">' + (l === 'en' ? 'Tap to skip' : '点击跳过') + '</p>' +
      '<i class="tr-wait"></i>';
    (document.body || html).appendChild(el);
    layer = el;
    return el;
  }
  function all(sel, el) { return Array.prototype.slice.call(el.querySelectorAll(sel)); }

  /* 第一段：在原页面搭场景（第一次完整、之后很快），然后跳转 */
  function leave(url, theme) {
    var seen = read('tr-seen-' + theme) === '1';
    store('tr-seen-' + theme, '1');
    prefetch(url);
    /* 告诉页面先停下 3D 等比较吃效能的东西，让转场更顺 */
    try { window.dispatchEvent(new CustomEvent('tr:leave')); } catch (e) {}
    var go = function () {
      store(KEY, JSON.stringify({ theme: theme, t: Date.now() }));
      location.href = url;
    };
    var el = buildLayer(theme);
    html.classList.add('tr-lock');
    var gsap = window.gsap;
    if (!gsap) { go(); return; }
    var done = false;
    var finish = function () { if (done) return; done = true; el.classList.add('tr-going'); go(); };
    el.addEventListener('click', finish);
    var tl = gsap.timeline({ onComplete: finish });
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: .25, ease: 'power1.out' });
    var parts = all('.tr-layer:not(.tr-late):not(.tr-floor), .tr-word span, .tr-thanks', el);
    var cards = all('.tr-card, .tr-fan', el);
    if (seen) {
      tl.from(el.querySelector('.tr-stage'), { scale: .95, autoAlpha: 0, duration: .3, ease: 'power2.out' }, '<');
      tl.from(cards, { autoAlpha: 0, duration: .3 }, '<');
      gsap.set(all('.tr-late', el), { autoAlpha: 1 });
      tl.to({}, { duration: .1 });
      return;
    }
    tl.from(cards, { x: function (k, t) { return t.closest('.tr-left') ? -260 : 260; }, rotate: function (k) { return k % 2 ? 18 : -18; }, autoAlpha: 0, duration: .9, stagger: .07, ease: 'expo.out' }, .05);
    tl.from(el.querySelector('.tr-floor'), { autoAlpha: 0, scale: .6, transformOrigin: '50% 60%', duration: .45, ease: 'back.out(1.6)' }, .1);
    tl.from(parts, { y: -140, autoAlpha: 0, duration: .5, stagger: theme === 'code' ? .1 : .12, ease: 'back.out(1.5)' }, .3);
    tl.from(el.querySelector('.tr-label'), { autoAlpha: 0, y: 14, duration: .5 }, .2);
    if (theme === 'design') tl.fromTo(el.querySelector('.tr-layer.tr-late'), { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power2.out' });
    if (theme === 'code') {
      var cur = el.querySelector('.tr-cursor'), btn = el.querySelector('#trPower');
      tl.set(all('.tr-late', el), { autoAlpha: 1 });
      tl.add(function () {
        var r = btn.getBoundingClientRect();
        gsap.fromTo(cur, { left: innerWidth * .7, top: innerHeight * .86, autoAlpha: 0 }, { left: r.left + r.width / 2, top: r.top + r.height / 2, autoAlpha: 1, duration: .55, ease: 'power2.inOut' });
      });
      tl.to({}, { duration: .58 });
      tl.to(cur, { scale: .8, duration: .08, yoyo: true, repeat: 1 });
      tl.set(btn, { attr: { fill: '#8fe3a7' } });
      tl.to('#trScreen', { attr: { fill: '#1d3a2b' }, duration: .2 });
    }
    if (theme === 'film') tl.from(el.querySelector('.tr-clap'), { y: 60, autoAlpha: 0, rotate: -8, duration: .45, ease: 'back.out(1.6)' });
    tl.to({}, { duration: .15 });
  }

  /* 第二段：新页面一打开就先摆好场景（还没载入完也会有轻微的动态和进度条），
     载入后播最后的“咔嚓 / ACTION / 盖章 / 开机推进 / 往上掀开” */
  var arriving = null;
  function prepareArrival(theme) {
    var el = buildLayer(theme);
    el.classList.add('tr-ready', 'tr-going');
    all('.tr-late', el).forEach(function (n) { n.style.opacity = 1; });
    html.classList.add('tr-lock');
    arriving = el;
  }
  function arrive(theme) {
    var el = arriving || buildLayer(theme);
    var gsap = window.gsap;
    var finish = function () {
      el.remove(); layer = null; arriving = null; html.classList.remove('tr-lock', 'tr-in');
    };
    if (!gsap) { finish(); return; }
    el.classList.remove('tr-going');
    gsap.set(el, { autoAlpha: 1 });
    var tl = gsap.timeline({ onComplete: finish });
    el.addEventListener('click', function () { tl.progress(1); });
    var hide = { autoAlpha: 0, duration: .5, ease: 'power2.in' };
    if (theme === 'photo') {
      tl.to('#trFlash', { attr: { fill: '#ffffff' }, duration: .05 }, .1)
        .to(el.querySelector('.tr-white'), { autoAlpha: 1, duration: .07 }, .15)
        .fromTo(el.querySelector('.tr-snap'), { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1, duration: .25, ease: 'back.out(2)' }, .17)
        .to(el, { autoAlpha: 0, duration: .55, ease: 'power2.out' }, .5);
    } else if (theme === 'film') {
      var top = el.querySelector('.tr-clap-top');
      tl.set(el, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
        .set(top, { rotate: -28 }, 0)
        .to(top, { rotate: 0, duration: .16, ease: 'power3.in' }, .15)
        .fromTo(el.querySelector('.tr-clap b'), { scale: .6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .25, ease: 'back.out(2.4)' }, .31)
        .to(el.querySelector('.tr-clap'), { y: -6, duration: .05, yoyo: true, repeat: 1 }, .31)
        .to(el, { clipPath: 'inset(0% 50% 0% 50%)', duration: .7, ease: 'power3.inOut' }, .75);
    } else if (theme === 'design') {
      tl.fromTo(el.querySelector('.tr-stamp'), { autoAlpha: 0, scale: 2.4, rotate: -14 }, { autoAlpha: 1, scale: 1, rotate: -8, duration: .28, ease: 'power3.in' }, .1)
        .fromTo(el.querySelector('.tr-paper'), { autoAlpha: 0, scale: .2 }, { autoAlpha: 1, scale: 1, duration: .5, ease: 'power3.inOut' }, .55)
        .to(el, hide, 1);
    } else if (theme === 'code') {
      var screen = el.querySelector('#trScreen');
      var stage = el.querySelector('.tr-stage');
      tl.to(screen, { attr: { fill: '#c9f5d6' }, duration: .25 }, .05);
      var r = screen.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      var ox = r.left + r.width / 2 - sr.left, oy = r.top + r.height / 2 - sr.top;
      tl.set(stage, { transformOrigin: ox + 'px ' + oy + 'px' }, 0)
        .to(all('.tr-side', el), { autoAlpha: 0, duration: .3 }, .2)
        .to(stage, { scale: 9, duration: .8, ease: 'power3.in' }, .3)
        .to(el, { backgroundColor: 'rgba(201,245,214,1)', duration: .4 }, .65)
        .to(el, hide, 1.05);
    } else {
      tl.to(el, { yPercent: -100, duration: .75, ease: 'power3.inOut' }, .2);
    }
  }
  function prefetch(url) {
    if (document.querySelector('link[rel="prefetch"][href="' + url + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'prefetch'; link.href = url;
    document.head.appendChild(link);
  }

  /* ---------- 拦截站内换页的点击 ---------- */
  function targetOf(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return null;
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (x) { return null; }
    if (url.origin !== location.origin) return null;
    var theme = pageOf(url);
    if (!theme || url.pathname === location.pathname) return null;   // 同一页里的锚点，不用转场
    return { url: url.href, theme: theme };
  }
  document.addEventListener('click', function (e) {
    if (reduced || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var t = targetOf(e.target.closest && e.target.closest('a[href]'));
    if (!t) return;
    e.preventDefault();
    if (layer) return;
    leave(t.url, t.theme);
  }, true);
  /* 鼠标移到链接上就先在背后载入下一页，点下去时会更快接上 */
  document.addEventListener('pointerover', function (e) {
    var t = targetOf(e.target.closest && e.target.closest('a[href]'));
    if (t) prefetch(t.url);
  }, { passive: true });

  /* 新页面：一开始就把场景盖上去（这个文件在 <head>，body 还没出来就先放在 <html> 底下） */
  if (pending) {
    try { prepareArrival(pending.theme); } catch (e) { html.classList.remove('tr-in'); }
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (!pending) return;
    arrive(pending.theme);
  });

  /* 调试用：在控制台显示某个场景的最后画面 */
  window.__tr = {
    show: function (theme) { if (layer) layer.remove(); var el = buildLayer(theme); el.style.opacity = 1; el.style.visibility = 'visible'; all('.tr-late', el).forEach(function (n) { n.style.opacity = 1; }); return el; },
    hide: function () { if (layer) layer.remove(); layer = null; }
  };
  /* 用“上一页”回来时，浏览器可能直接还原旧画面：把盖层拿掉 */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && layer) { layer.remove(); layer = null; html.classList.remove('tr-lock', 'tr-in'); }
  });
})();
