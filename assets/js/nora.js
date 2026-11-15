// Nora Nguyen portfolio: sideways scrolling on the home page, section highlight on case studies.
(function () {
  var rail = document.querySelector('.rail');
  if (rail) {
    var bar = document.querySelector('.bar i');
    var wide = window.matchMedia('(min-width: 861px)');
    rail.addEventListener('wheel', function (e) {
      if (!wide.matches) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        rail.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
    rail.addEventListener('scroll', function () {
      var max = rail.scrollWidth - rail.clientWidth;
      if (bar) bar.style.width = Math.max(2, Math.round(max > 0 ? (rail.scrollLeft / max) * 100 : 0)) + '%';
    });
    document.addEventListener('keydown', function (e) {
      if (!wide.matches || e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        rail.scrollBy({ left: e.key === 'ArrowRight' ? 400 : -400, behavior: 'smooth' });
      }
    });
    // in-page links (#works, #me...) scroll the rail sideways
    document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').split('#')[1];
        var t = id && document.getElementById(id);
        if (!t) return;
        e.preventDefault();
        if (wide.matches) rail.scrollTo({ left: t.offsetLeft, behavior: 'smooth' });
        else t.scrollIntoView({ behavior: 'smooth' });
        history.replaceState(null, '', '#' + id);
      });
    });
    if (location.hash) {
      var start = document.getElementById(location.hash.slice(1));
      if (start && wide.matches) rail.scrollLeft = start.offsetLeft;
    }
  }

  var toc = document.querySelectorAll('.toc a[data-toc]');
  if (toc.length) {
    var secs = Array.prototype.map.call(toc, function (a) { return document.getElementById(a.dataset.toc); });
    var set = function () {
      var cur = secs[0];
      secs.forEach(function (s) { if (s && s.getBoundingClientRect().top - 200 <= 0) cur = s; });
      toc.forEach(function (a) { a.classList.toggle('on', a.dataset.toc === cur.id); });
    };
    window.addEventListener('scroll', set, { passive: true });
    set();
  }
})();

// hero: type "human", pause, erase, repeat
(function () {
  var el = document.querySelector('.typed');
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var word = el.dataset.word, i = word.length, typing = false;
  function step() {
    if (typing) {
      i++; el.textContent = word.slice(0, i);
      if (i >= word.length) { typing = false; return setTimeout(step, 2200); }
      return setTimeout(step, 130);
    }
    i--; el.textContent = word.slice(0, i);
    if (i <= 0) { typing = true; return setTimeout(step, 450); }
    setTimeout(step, 70);
  }
  setTimeout(step, 2600);
})();

// small-screen menu
(function () {
  var btn = document.querySelector('.menu-btn'), links = document.getElementById('navlinks');
  if (!btn || !links) return;
  function set(open) { links.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); btn.textContent = open ? 'close' : 'menu'; }
  btn.addEventListener('click', function () { set(!links.classList.contains('open')); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.navpill')) set(false); });
})();

// loading screen: first visit per session, follows the real page load
(function () {
  var root = document.documentElement, el = document.getElementById('loader');
  if (!el || !root.classList.contains('loading')) return;
  el.classList.add('show');
  var pctEl = el.querySelector('.ld-pct'), bar = el.querySelector('.ld-bar i'), msg = el.querySelector('.ld-msg');
  var msgs = ['watering the flowers', 'polishing the pixels', 'hanging the frames', 'almost there'];
  var p = 0, loaded = document.readyState === 'complete', start = Date.now(), MIN = 1600;
  window.addEventListener('load', function () { loaded = true; });
  function paint() {
    pctEl.textContent = String(p).padStart(3, '0') + '%';
    bar.style.width = p + '%';
    msg.textContent = msgs[Math.min(msgs.length - 1, Math.floor(p / 26))];
  }
  var t = setInterval(function () {
    var cap = loaded && Date.now() - start > MIN ? 100 : 90;
    p = Math.min(cap, p + Math.max(1, Math.round((cap - p) * 0.08 + Math.random() * 2)));
    paint();
    if (p >= 100) { clearInterval(t); finish(); }
  }, 90);
  function finish() {
    el.classList.add('done');
    setTimeout(function () {
      el.classList.add('out');
      root.classList.remove('loading');
      try { sessionStorage.setItem('nora-loaded', '1'); } catch (e) {}
      setTimeout(function () { el.remove(); }, 800);
    }, 1100);
  }
  // never trap anyone behind the loader
  setTimeout(function () { if (root.classList.contains('loading')) { p = 100; paint(); clearInterval(t); finish(); } }, 8000);
})();

// Falling illustrations in the contact panel: start once the panel is in view
(function () {
  var sec = document.getElementById('contact'), cv = sec && sec.querySelector('.pile');
  if (!sec || !cv || typeof startFlowerPile !== 'function') return;
  var b = '/assets/img/brand/', srcs = [
    'flower-coral', 'note-cream', 'flower-lime', 'guitar-lime', 'flower-cream', 'clock-cream',
    'flower-coral', 'cap-lime', 'notes-cream', 'flower-lime', 'note-lime', 'guitar-cream',
    'flower-cream', 'clock-lime', 'cap-cream', 'notes-lime'
  ].map(function (n) { return b + n + '.svg'; });
  var small = function () { return window.innerWidth < 860; };
  var started = false;
  function go() {
    if (started) return; started = true;
    startFlowerPile(cv, srcs, {
      host: sec, count: 36, gap: 200,
      region: function () { return small() ? [0.45, 1] : [0.66, 1]; },
      minR: function () { return small() ? 18 : 26; },
      maxR: function () { return small() ? 28 : 42; }
    });
  }
  if (!('IntersectionObserver' in window)) return go();
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { go(); io.disconnect(); } });
  }, { threshold: 0.45 });
  io.observe(sec);
})();

// Hero photo flips to fun facts: hover on desktop, tap or Enter/Space anywhere
(function () {
  var card = document.querySelector('.photo .flip');
  if (!card) return;
  function toggle() { var on = card.classList.toggle('is-flipped'); card.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  card.addEventListener('click', function () { if (!window.matchMedia('(hover: hover)').matches) toggle(); });
  card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
})();
