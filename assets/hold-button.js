/* 按住确认的按钮：改写自 React Bits 的 HoldButton（JS + CSS 版），换成不需要 React 的原生写法
   用法：HoldButton(按钮元素, { holdTime: 1400, onHold: fn })
   按钮里要有 .hold-button__idle 和 .hold-button__done 两段文字 */
(function () {
  var TAP_MS = 250, HIT_PAD = 10;
  function LINEAR(t) { return t; }
  function EASE_OUT(t) { return 1 - Math.pow(1 - t, 3); }

  window.HoldButton = function (button, o) {
    o = o || {};
    var holdTime = o.holdTime || 2000, releaseTime = o.releaseTime || 200, resetAfter = o.resetAfter == null ? 1200 : o.resetAfter;
    var phase = 'idle', input = null, start = 0, rect = null, pointerId = null;
    var timers = { complete: 0, reset: 0 };
    var m = { raf: 0, p: 0, from: 0, to: 0, start: 0 };

    /* 把文字复制成三层：底层、液体里的白字、波浪边上的字 */
    var labelHTML = button.innerHTML;
    button.classList.add('hold-button');
    button.dataset.direction = o.fillDirection === 'up' ? 'up' : 'right';
    if (o.glow !== false) button.dataset.glow = 'true';
    button.style.setProperty('--hb-hold', holdTime + 'ms');
    button.style.setProperty('--hb-cycles', holdTime / 1100);
    button.style.setProperty('--hb-release', releaseTime + 'ms');
    function build(html) {
      button.innerHTML = '<span class="hold-button__pulse" aria-hidden="true"></span>' +
        '<span class="hold-button__label">' + html + '</span>' +
        '<span class="hold-button__clip" aria-hidden="true"><span class="hold-button__fill"><span class="hold-button__label hold-button__label--fill">' + html + '</span></span>' +
        '<span class="hold-button__crest" aria-hidden="true"><span class="hold-button__label hold-button__label--fill">' + html + '</span></span></span>';
    }
    build(labelHTML);

    function go(next, kind) {
      phase = next; input = kind || null;
      button.dataset.phase = next;
      if (input) button.dataset.input = input; else delete button.dataset.input;
    }
    go('idle');
    function clearTimers() { clearTimeout(timers.complete); clearTimeout(timers.reset); }
    function drive(to, duration, ease) {
      cancelAnimationFrame(m.raf);
      m.from = m.p; m.to = to; m.start = performance.now();
      function step(now) {
        var t = duration > 0 ? Math.min(1, (now - m.start) / duration) : 1;
        m.p = m.from + (m.to - m.from) * ease(t);
        button.style.setProperty('--hb-p', m.p.toFixed(4));
        if (t < 1) { m.raf = requestAnimationFrame(step); return; }
        m.raf = 0;
        if (m.to === 1) complete();
      }
      m.raf = requestAnimationFrame(step);
    }
    function complete() {
      if (phase !== 'holding') return;
      if (performance.now() - start < holdTime - 50) return;
      clearTimers();
      go('done', input);
      if (o.onHold) o.onHold();
      if (resetAfter > 0) timers.reset = setTimeout(reset, resetAfter);
    }
    function reset() { go('idle'); drive(0, releaseTime, EASE_OUT); }
    function begin(kind) {
      if (button.disabled || phase !== 'idle') return false;
      start = performance.now();
      rect = button.getBoundingClientRect();
      go('holding', kind);
      drive(1, holdTime, LINEAR);
      timers.complete = setTimeout(complete, holdTime + 100);
      return true;
    }
    function release(drifted) {
      if (phase !== 'holding') return;
      clearTimers();
      var held = performance.now() - start;
      go('idle');
      drive(0, releaseTime, EASE_OUT);
      if (!drifted && held < TAP_MS && o.onTap) o.onTap();
    }
    function endPointer(e, drifted) {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      try { if (button.hasPointerCapture(e.pointerId)) button.releasePointerCapture(e.pointerId); } catch (x) {}
      release(drifted);
    }
    button.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !e.isPrimary || pointerId !== null) return;
      if (!begin('pointer')) return;
      pointerId = e.pointerId;
      try { button.setPointerCapture(e.pointerId); } catch (x) {}
    });
    button.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pointerId || !rect) return;
      var out = e.clientX < rect.left - HIT_PAD || e.clientX > rect.right + HIT_PAD || e.clientY < rect.top - HIT_PAD || e.clientY > rect.bottom + HIT_PAD;
      if (out) endPointer(e, true);
    });
    button.addEventListener('pointerup', function (e) { endPointer(e, false); });
    button.addEventListener('pointercancel', function (e) { endPointer(e, true); });
    button.addEventListener('lostpointercapture', function (e) { endPointer(e, true); });
    button.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') endPointer(e, true); });
    button.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    button.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { if (input === 'key') release(true); return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) begin('key'); }
    });
    button.addEventListener('keyup', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (input === 'key') release(false); }
    });
    function measure() {
      button.style.setProperty('--hb-w', button.offsetWidth + 'px');
      button.style.setProperty('--hb-h', button.offsetHeight + 'px');
    }
    measure();
    new ResizeObserver(measure).observe(button);
    function cancel() { if (phase === 'holding') release(true); }
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', function () { if (document.hidden) cancel(); });

    return {
      setLabel: function (html) { build(html); measure(); },
      reset: function () { clearTimers(); reset(); }
    };
  };
})();
