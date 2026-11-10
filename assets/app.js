(function () {
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var DEMO_MSG = 'Это демонстрационная версия сайта, заявки не отправляются';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  $$('a[data-na]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  var menuBtn = $('[aria-controls="mobile-menu"]');
  var menu = $('#mobile-menu');
  var ICON_OPEN = 'M4 6h16M4 12h16M4 18h16';
  var ICON_CLOSE = 'M6 18L18 6M6 6l12 12';
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Меню');
    $('path', menuBtn).setAttribute('d', open ? ICON_CLOSE : ICON_OPEN);
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
  }

  var track = $('#cars [style*="translateX"]');
  if (track) {
    var carousel = $('#cars');
    var slides = $$(':scope > div', track);
    var dots = $$('button[aria-label^="Слайд"]', carousel);
    var thumbs = $$('.flex-wrap button', carousel);
    var current = 0;
    var paused = false;
    var touchTimer = null;
    var startX = null;
    var DOT_ON = ['bg-primary', 'w-8'];
    var DOT_OFF = ['bg-gray-400', 'group-hover:bg-gray-500', 'w-2'];
    var TH_ON = ['border-primary', 'scale-105'];
    var TH_OFF = ['border-transparent', 'opacity-60', 'hover:opacity-100'];
    var swap = function (el, on, off, active) {
      on.forEach(function (c) { el.classList.toggle(c, active); });
      off.forEach(function (c) { el.classList.toggle(c, !active); });
    };
    var show = function (i) {
      current = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + current * 100 + '%)';
      slides.forEach(function (s, k) {
        s.setAttribute('aria-hidden', k === current ? 'false' : 'true');
        if (k === current) s.removeAttribute('inert'); else s.setAttribute('inert', '');
      });
      dots.forEach(function (d, k) {
        swap($('span', d), DOT_ON, DOT_OFF, k === current);
        if (k === current) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
      thumbs.forEach(function (t, k) { swap(t, TH_ON, TH_OFF, k === current); });
    };
    var arrows = $$(':scope > button', $('.relative.overflow-hidden', carousel));
    var viewport = $('.relative.overflow-hidden', carousel);
    arrows.forEach(function (b) {
      b.addEventListener('click', function () {
        show(current + (b.getAttribute('aria-label') === 'Назад' ? -1 : 1));
      });
    });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); }); });
    thumbs.forEach(function (t, k) { t.addEventListener('click', function () { show(k); }); });
    viewport.addEventListener('mouseenter', function () { paused = true; });
    viewport.addEventListener('mouseleave', function () { paused = false; });
    viewport.addEventListener('touchstart', function (e) {
      clearTimeout(touchTimer);
      paused = true;
      startX = e.touches[0].clientX;
    }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
      touchTimer = setTimeout(function () { paused = false; }, 3000);
    });
    if (!reduceMotion && slides.length > 1) {
      setInterval(function () { if (!paused) show(current + 1); }, 4000);
    }
    show(0);
  }

  var moreReviews = $('[data-more="reviews"]');
  if (moreReviews) {
    moreReviews.addEventListener('click', function () {
      $$('#reviews [data-extra]').forEach(function (c) { c.hidden = false; });
      moreReviews.parentNode.hidden = true;
    });
  }

  var search = $('#branches input[type="search"]');
  var cards = $$('#branches [data-branch]');
  var moreBranches = $('[data-more="branches"]');
  var empty = $('#branches [data-empty]');
  var expanded = false;
  function filterBranches() {
    var q = search.value.trim().toLowerCase();
    var found = 0;
    var shownCount = 0;
    cards.forEach(function (c, i) {
      var match = !q || c.getAttribute('data-text').indexOf(q) !== -1;
      if (match) found++;
      var visible = match && (q || expanded || i < 6);
      c.hidden = !visible;
      if (visible) shownCount++;
    });
    empty.hidden = found !== 0;
    moreBranches.parentNode.hidden = !!q || expanded || cards.length <= 6;
  }
  if (search && cards.length) {
    search.addEventListener('input', filterBranches);
    moreBranches.addEventListener('click', function () { expanded = true; filterBranches(); });
    filterBranches();
  }

  var floatBox = $('[aria-label="Связаться"]');
  floatBox = floatBox && floatBox.parentNode;
  if (floatBox) {
    var fab = $('button', floatBox);
    var fabIcon = $('svg', fab);
    var fabPath = $('path', fabIcon);
    var PHONE_D = fabPath.getAttribute('d');
    var actions = $$('a', floatBox);
    var scrolled = false;
    var blocked = false;
    var open = false;
    var lastY = window.scrollY;
    var idle = null;
    var SHOWN = ['opacity-100', 'translate-y-0'];
    var HIDDEN = ['opacity-0', 'translate-y-4', 'pointer-events-none'];
    var A_SHOWN = ['opacity-100', 'translate-y-0', 'scale-100'];
    var A_HIDDEN = ['opacity-0', 'translate-y-4', 'scale-75', 'pointer-events-none'];
    var applyClasses = function (el, add, remove) {
      remove.forEach(function (c) { el.classList.remove(c); });
      add.forEach(function (c) { el.classList.add(c); });
    };
    var render = function (visible) {
      var shown = visible && !blocked;
      applyClasses(floatBox, shown ? SHOWN : HIDDEN, shown ? HIDDEN : SHOWN);
      if (shown) floatBox.removeAttribute('inert'); else floatBox.setAttribute('inert', '');
      actions.forEach(function (a, i) {
        applyClasses(a, open ? A_SHOWN : A_HIDDEN, open ? A_HIDDEN : A_SHOWN);
        a.style.transitionDelay = open ? (i * 50) + 'ms' : ((actions.length - i) * 30) + 'ms';
        if (open) a.removeAttribute('inert'); else a.setAttribute('inert', '');
      });
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      fab.setAttribute('aria-label', open ? 'Закрыть' : 'Связаться');
      fabIcon.classList.toggle('rotate-45', open);
      fabIcon.classList.toggle('rotate-0', !open);
      fabPath.setAttribute('d', open ? ICON_CLOSE : PHONE_D);
    };
    var visibleNow = false;
    var onScroll = function () {
      var y = window.scrollY;
      var pastHero = y > window.innerHeight * 0.6;
      var down = y > lastY;
      lastY = y;
      visibleNow = pastHero && !down;
      render(visibleNow);
      clearTimeout(idle);
      idle = setTimeout(function () { visibleNow = pastHero; render(visibleNow); }, 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    fab.addEventListener('click', function () { open = !open; render(visibleNow); });
    document.addEventListener('pointerdown', function (e) {
      if (open && !floatBox.contains(e.target)) { open = false; render(visibleNow); }
    });
    if ('IntersectionObserver' in window) {
      var inView = [];
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var k = inView.indexOf(en.target);
          if (en.isIntersecting && k === -1) inView.push(en.target);
          if (!en.isIntersecting && k !== -1) inView.splice(k, 1);
        });
        blocked = inView.length > 0;
        render(visibleNow);
      });
      $$('[data-cta]').forEach(function (t) { cio.observe(t); });
    }
    render(false);
  }

  var modal = $('#lead-modal');
  if (modal) {
    var dialog = $('[role="dialog"]', modal);
    var title = $('#booking-title');
    var select = $('select', modal);
    var form = $('form', modal);
    var note = $('[data-demo-note]', modal);
    var opener = null;
    var openModal = function (cat, from) {
      opener = from;
      title.textContent = 'Заявка — Категория ' + cat;
      select.value = 'Категория ' + cat;
      note.hidden = true;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      $('input[name="name"]', modal).focus();
    };
    var closeModal = function () {
      modal.hidden = true;
      document.body.style.overflow = '';
      if (opener) opener.focus();
    };
    $$('#prices button[data-cta]').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = b.closest('.bg-ink');
        var cat = $('h3', card).textContent.replace('Категория', '').trim();
        openModal(cat, b);
      });
    });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    $('[aria-label="Закрыть"]', modal).addEventListener('click', closeModal);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      note.textContent = DEMO_MSG;
      note.hidden = false;
    });
    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
      if (e.key !== 'Tab') return;
      var items = $$('a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select, textarea', dialog);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
})();
