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
