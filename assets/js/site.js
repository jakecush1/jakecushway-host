/* jakecushway.ca — site behaviour
   Nav, menu overlay, clocks, contact panel, theme, reveal-on-scroll,
   work list (from window.PROJECTS), case-study drawer, previews, cursor, form. */
(function () {
  'use strict';

  var html = document.documentElement;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var page = $('#page');
  var hero = $('#top');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  if (reduced) html.classList.add('reduced-motion');

  /* ---------------- Load state ---------------- */
  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 700); })]).then(function () {
    requestAnimationFrame(function () { requestAnimationFrame(function () { html.classList.add('is-loaded'); }); });
  });

  /* ---------------- Theme ---------------- */
  var themeBtns = Array.prototype.slice.call(document.querySelectorAll('[data-theme-toggle]'));
  var themeMeta = $('meta[name="theme-color"]');
  function currentTheme() { return html.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function applyTheme(t, persist) {
    html.setAttribute('data-theme', t);
    if (themeMeta) themeMeta.setAttribute('content', t === 'light' ? '#ffffff' : '#000000');
    themeBtns.forEach(function (b) { b.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme'); });
    if (persist) {
      try { localStorage.setItem('theme', t); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('themechange', { detail: t })); } catch (e) {}
    }
  }
  applyTheme(currentTheme(), false);
  themeBtns.forEach(function (b) { b.addEventListener('click', function () { applyTheme(currentTheme() === 'light' ? 'dark' : 'light', true); }); });

  /* ---------------- Nav scroll state + hero parallax ---------------- */
  var nav = $('#nav');
  var fallback = $('.hero__fallback');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || 0;
      if (nav) nav.classList.toggle('is-scrolled', y > 40);
      var hh = hero ? hero.offsetHeight : 0;
      html.classList.toggle('past-hero', hh > 0 && y > hh - 64);
      // hero.js owns #hero-canvas (in-scene dolly + opacity fade); only the no-WebGL gradient fallback is parallaxed here.
      if (!reduced && fallback && hh > 0 && y < hh * 1.3) {
        var p = y / hh;
        fallback.style.transform = 'translate3d(0,' + (y * 0.25).toFixed(1) + 'px,0)';
        fallback.style.opacity = clamp(1 - p / 1.2, 0, 1).toFixed(3);
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- Dialog manager (focus trap, Escape, inert) ---------------- */
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
  var Dialog = { current: null };
  var hideTimers = new Map();

  function visibleFocusables(el) {
    return $$(FOCUSABLE, el).filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
  }
  function openDialog(el, opts) {
    opts = opts || {};
    if (Dialog.current && Dialog.current.el !== el) closeDialog({ immediate: true, skipRestore: true });
    if (Dialog.current && Dialog.current.el === el) return;
    clearTimeout(hideTimers.get(el));
    var restore = opts.restore || document.activeElement;
    el.hidden = false;
    (opts.extra || []).forEach(function (x) { clearTimeout(hideTimers.get(x)); x.hidden = false; });
    // two frames so the transition from the hidden state runs
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      el.classList.add('is-open');
      (opts.extra || []).forEach(function (x) { x.classList.add('is-open'); });
    }); });
    html.classList.add('no-scroll');
    if (page) { page.inert = true; page.setAttribute('aria-hidden', 'true'); }
    var trap = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeDialog(); return; }
      if (e.key !== 'Tab') return;
      var f = visibleFocusables(el);
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trap);
    Dialog.current = { el: el, extra: opts.extra || [], restore: restore, trap: trap, onClose: opts.onClose, opener: opts.opener };
    if (opts.opener) opts.opener.setAttribute('aria-expanded', 'true');
    setTimeout(function () {
      var target = opts.initialFocus ? (typeof opts.initialFocus === 'string' ? $(opts.initialFocus, el) : opts.initialFocus) : null;
      if (!target) target = visibleFocusables(el)[0] || el;
      try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
    }, 60);
  }
  function closeDialog(o) {
    o = o || {};
    var d = Dialog.current;
    if (!d) return;
    Dialog.current = null;
    document.removeEventListener('keydown', d.trap);
    if (d.opener) d.opener.setAttribute('aria-expanded', 'false');
    var all = [d.el].concat(d.extra);
    all.forEach(function (x) { x.classList.remove('is-open'); });
    var finish = function () { all.forEach(function (x) { x.hidden = true; }); };
    if (o.immediate) finish();
    else all.forEach(function (x) { hideTimers.set(x, setTimeout(function () { x.hidden = true; }, 520)); });
    html.classList.remove('no-scroll');
    if (page) { page.inert = false; page.removeAttribute('aria-hidden'); }
    if (typeof d.onClose === 'function') d.onClose();
    if (!o.skipRestore && d.restore && typeof d.restore.focus === 'function') {
      try { d.restore.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  function scrollToHash(hash, cb) {
    var target = hash && hash !== '#' ? $(hash) : null;
    if (!target) return;
    try { history.pushState(null, '', hash); } catch (e) {}
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    if (cb) setTimeout(cb, reduced ? 50 : 750);
  }

  /* ---------------- Menu overlay ---------------- */
  var menu = $('#menu');
  var menuOpen = $('#menu-open');
  if (menu && menuOpen) {
    menuOpen.addEventListener('click', function () {
      openDialog(menu, { opener: menuOpen, initialFocus: '#menu-close' });
    });
    $('#menu-close').addEventListener('click', function () { closeDialog(); });
    $$('[data-menu-link]', menu).forEach(function (a) {
      a.addEventListener('click', function (e) {
        var hash = a.getAttribute('href');
        if (!hash || hash.charAt(0) !== '#') return;
        e.preventDefault();
        closeDialog({ skipRestore: true });
        setTimeout(function () { scrollToHash(hash); }, 80);
      });
    });
  }

  /* ---------------- Contact panel ---------------- */
  var panel = $('#contact-panel');
  var panelBackdrop = $('#panel-backdrop');
  var contactOpen = $('#contact-open');
  function openPanel() {
    openDialog(panel, { opener: contactOpen, extra: panelBackdrop ? [panelBackdrop] : [], initialFocus: '#panel-close' });
  }
  if (panel && contactOpen) {
    contactOpen.addEventListener('click', openPanel);
    $('#panel-close').addEventListener('click', function () { closeDialog(); });
    if (panelBackdrop) panelBackdrop.addEventListener('click', function () { closeDialog(); });
    var copyBtn = $('#copy-email');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var val = copyBtn.getAttribute('data-copy') || '';
        var done = function () {
          copyBtn.textContent = 'Copied';
          copyBtn.classList.add('is-active');
          setTimeout(function () { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('is-active'); }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(val).then(done, done);
        else {
          var ta = document.createElement('textarea'); ta.value = val; ta.setAttribute('readonly', '');
          ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta); done();
        }
      });
    }
    var sendBtn = $('#panel-send');
    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        closeDialog({ skipRestore: true });
        setTimeout(function () {
          scrollToHash('#contact', function () {
            var name = $('#f-name');
            if (name) { try { name.focus({ preventScroll: true }); } catch (e) { name.focus(); } }
          });
        }, 80);
      });
    }
  }

  /* ---------------- Clocks ---------------- */
  var fmtCache = {};
  function fmt(tz, kind) {
    var key = (tz || 'local') + '|' + kind;
    if (fmtCache[key] === undefined) {
      var opts = { hour: 'numeric', minute: '2-digit', hour12: true };
      if (kind === 'seconds') { opts.second = '2-digit'; opts.timeZoneName = 'short'; }
      if (tz && tz !== 'local') opts.timeZone = tz;
      try { fmtCache[key] = new Intl.DateTimeFormat('en-US', opts); }
      catch (e) { delete opts.timeZone; try { fmtCache[key] = new Intl.DateTimeFormat('en-US', opts); } catch (e2) { fmtCache[key] = null; } }
    }
    var f = fmtCache[key];
    if (!f) { var d = new Date(); return d.getHours() + ':' + pad2(d.getMinutes()); }
    return f.format(new Date()).replace(/ /g, ' ');
  }
  var heroClock = $('#hero-clock');
  var footerClock = $('#footer-clock');
  var cityRows = $$('#city-clocks li');
  function tickFast() { if (heroClock) heroClock.textContent = fmt('America/Vancouver', 'seconds'); }
  function tickSlow() {
    var short = fmt('America/Vancouver', 'short');
    if (footerClock) { footerClock.textContent = short; footerClock.setAttribute('datetime', new Date().toISOString()); }
    cityRows.forEach(function (li) {
      var t = $('time', li); if (!t) return;
      var tz = li.getAttribute('data-tz');
      t.textContent = fmt(tz === 'local' ? null : tz, 'short');
    });
  }
  tickFast(); tickSlow();
  setInterval(tickFast, 1000);
  setInterval(tickSlow, 5000);

  /* ---------------- Projects ---------------- */
  var PROJECTS = Array.isArray(window.PROJECTS) ? window.PROJECTS.slice() : [];
  if (!PROJECTS.length) console.warn('[site] window.PROJECTS is missing or empty.');
  var CATEGORY_ORDER = ['Audio', 'Tools', 'Client work', 'Product', 'Experiments'];
  var HERO_ORDER = ['city-square', 'bedroom-studio', 'sideproj', 'ai-photobooth', 'obamafy', 'mathine', 'basin-climate-source', 'autonomous-sinixt'];
  var bySlug = {};
  PROJECTS.forEach(function (p) { bySlug[p.slug] = p; });

  function imgSrc(p, small) { return small ? (p.imageSmall || p.image) : (p.image || p.imageSmall); }
  function hasImage(p) { return !!(p.image || p.imageSmall); }
  function mediaHTML(p, small, lazy, sizes) {
    if (!hasImage(p)) return '<div class="ph" aria-hidden="true">' + esc(p.title) + '</div>';
    var srcset = (sizes && p.image && p.imageSmall) ? ' srcset="' + esc(p.imageSmall) + ' 800w, ' + esc(p.image) + ' 1600w" sizes="' + esc(sizes) + '"' : '';
    return '<img src="' + esc(imgSrc(p, small)) + '"' + srcset + ' alt="' + esc(p.imageAlt || p.title) + '" width="' + (p.imageW || 1600) + '" height="' + (p.imageH || 1000) + '"' +
      (lazy ? ' loading="lazy"' : '') + ' decoding="async" data-ph="' + esc(p.title) + '">';
  }
  function buildLabel(p) { return p.build === 'hand-built' ? 'Hand-built' : p.build === 'ai-assisted' ? 'AI-assisted' : ''; }
  function yearRange() {
    var min = Infinity, max = -Infinity;
    PROJECTS.forEach(function (p) {
      var s = String(p.year || '');
      var m = s.match(/\d{4}/g) || [];
      m.forEach(function (y) { y = +y; min = Math.min(min, y); max = Math.max(max, y); });
      var tail = s.match(/\d{4}\s*[–-]\s*(\d{2})\b/);
      if (tail) { var y2 = +(String(min).slice(0, 2) + tail[1]); max = Math.max(max, y2); }
    });
    return isFinite(min) ? (min === max ? String(min) : min + ' — ' + max) : '';
  }

  // Graceful image failure → placeholder panel
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.hasAttribute('data-ph')) return;
    var ph = document.createElement('div');
    ph.className = 'ph'; ph.setAttribute('aria-hidden', 'true'); ph.textContent = img.getAttribute('data-ph');
    if (img.parentNode) img.parentNode.replaceChild(ph, img);
  }, true);

  /* Hero pills */
  var heroPillList = $('#hero-pills');
  var heroPreview = $('#hero-preview');
  var heroPreviewImg = $('#hero-preview-img');
  if (heroPillList) {
    var pillProjects = HERO_ORDER.map(function (s) { return bySlug[s]; }).filter(Boolean)
      .concat(PROJECTS.filter(function (p) { return p.heroPill && HERO_ORDER.indexOf(p.slug) === -1; }));
    var frag = document.createDocumentFragment();
    pillProjects.forEach(function (p, i) {
      var li = document.createElement('li'); li.style.setProperty('--i', i);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pill'; b.textContent = p.title;
      b.setAttribute('data-slug', p.slug); b.setAttribute('data-cursor', 'open');
      b.addEventListener('click', function () { if (heroPreview) heroPreview.classList.remove('is-visible'); openCase(p.slug, b); });
      if (finePointer && !reduced && hasImage(p)) {
        var show = function () {
          heroPreviewImg.src = imgSrc(p, true);
          var hr = hero.getBoundingClientRect(), br = b.getBoundingClientRect();
          var left = br.right - hr.left + 24;
          var top = clamp(br.top - hr.top + br.height / 2 - 75, 96, hr.height - 150 - 96);
          heroPreview.style.left = left + 'px'; heroPreview.style.top = top + 'px';
          heroPreview.classList.add('is-visible');
        };
        var hide = function () { heroPreview.classList.remove('is-visible'); };
        b.addEventListener('pointerenter', show); b.addEventListener('focus', function () { if (b.matches(':focus-visible')) show(); });
        b.addEventListener('pointerleave', hide); b.addEventListener('blur', hide);
      }
      li.appendChild(b); frag.appendChild(li);
    });
    var allLi = document.createElement('li'); allLi.style.setProperty('--i', pillProjects.length);
    var allA = document.createElement('a'); allA.className = 'pill'; allA.href = '#work'; allA.setAttribute('data-cursor', 'open');
    allA.innerHTML = 'All work <span aria-hidden="true">↓</span>';
    allLi.appendChild(allA); frag.appendChild(allLi);
    heroPillList.appendChild(frag);
  }

  /* Featured grid */
  var featuredGrid = $('#featured-grid');
  if (featuredGrid) {
    PROJECTS.filter(function (p) { return p.featured; }).forEach(function (p, i) {
      var li = document.createElement('li'); li.className = 'reveal'; li.style.setProperty('--i', i);
      li.innerHTML =
        '<button type="button" class="card" data-slug="' + esc(p.slug) + '" data-cursor="view" aria-label="Open case study: ' + esc(p.title) + '">' +
          '<span class="card__media">' + mediaHTML(p, false, true, '(max-width: 640px) calc(100vw - 32px), (max-width: 1100px) 50vw, 33vw') + '</span>' +
          '<span class="card__caption"><span class="card__title">' + esc(p.title) + '</span><span class="card__year mono label">' + esc(p.year) + '</span>' +
          '<span class="card__kicker">' + esc(p.kicker) + '</span></span>' +
        '</button>';
      featuredGrid.appendChild(li);
    });
    featuredGrid.addEventListener('click', function (e) {
      var b = e.target.closest('.card'); if (b) openCase(b.getAttribute('data-slug'), b);
    });
  }

  /* Count label */
  var countEl = $('#work-count');
  var range = yearRange();
  function setCount(visible) {
    if (!countEl) return;
    var n = PROJECTS.length;
    var txt = (visible == null || visible === n) ? (n + ' Project' + (n === 1 ? '' : 's')) : (visible + ' of ' + n + ' Projects');
    countEl.textContent = (range ? range + ' · ' : '') + txt;
  }
  setCount();

  /* Filters */
  var filtersEl = $('#filters');
  var activeFilter = 'All';
  if (filtersEl) {
    var cats = [];
    CATEGORY_ORDER.forEach(function (c) { if (PROJECTS.some(function (p) { return p.category === c; })) cats.push(c); });
    PROJECTS.forEach(function (p) { if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category); });
    ['All'].concat(cats).forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pill'; b.textContent = c;
      b.setAttribute('data-filter', c); b.setAttribute('aria-pressed', c === 'All' ? 'true' : 'false'); b.setAttribute('data-cursor', 'open');
      b.addEventListener('click', function () { applyFilter(c === activeFilter && c !== 'All' ? 'All' : c); });
      filtersEl.appendChild(b);
    });
  }
  function applyFilter(cat) {
    activeFilter = cat;
    $$('[data-filter]', filtersEl).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === cat ? 'true' : 'false'); });
    var visible = 0;
    $$('#work-list .row').forEach(function (row) {
      var match = cat === 'All' || row.getAttribute('data-category') === cat;
      if (match) {
        visible++;
        if (row.hidden) { row.classList.add('is-leaving'); row.hidden = false; void row.offsetHeight; }
        row.classList.remove('is-leaving');
      } else if (!row.hidden) {
        row.classList.add('is-leaving');
        setTimeout(function () { if (row.classList.contains('is-leaving')) row.hidden = true; }, reduced ? 0 : 260);
      }
    });
    setCount(visible);
  }

  /* Work list rows */
  var workList = $('#work-list');
  if (workList) {
    var frag2 = document.createDocumentFragment();
    PROJECTS.forEach(function (p, i) {
      var li = document.createElement('li');
      li.className = 'row reveal'; li.id = 'row-' + p.slug; li.style.setProperty('--i', i % 6);
      li.setAttribute('data-category', p.category || ''); li.setAttribute('data-slug', p.slug);
      var badge = buildLabel(p);
      li.innerHTML =
        '<button type="button" class="row__btn" data-cursor="view" aria-label="Open case study: ' + esc(p.title) + '">' +
          '<span class="row__title"><span>' + esc(p.title) + '</span>' + (badge ? '<span class="row__badge mono">' + esc(badge) + '</span>' : '') + '</span>' +
          '<span class="row__kicker">' + esc(p.kicker) + '</span>' +
          '<span class="row__tags">' + (p.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</span>' +
          '<span class="row__meta"><span class="mono">' + esc(p.year) + '</span><span class="row__arrow" aria-hidden="true">↗</span></span>' +
        '</button>';
      frag2.appendChild(li);
    });
    workList.appendChild(frag2);
    workList.addEventListener('click', function (e) {
      var b = e.target.closest('.row__btn'); if (!b) return;
      openCase(b.parentNode.getAttribute('data-slug'), b);
    });
  }

  /* Cursor-following row preview */
  var rowPreview = $('#row-preview');
  var rowPreviewImg = $('#row-preview-img');
  if (workList && rowPreview && finePointer && !reduced) {
    var pv = { x: 0, y: 0, tx: 0, ty: 0, on: false, raf: 0 };
    var loop = function () {
      pv.x += (pv.tx - pv.x) * 0.12; pv.y += (pv.ty - pv.y) * 0.12;
      rowPreview.style.transform = 'translate3d(' + pv.x.toFixed(1) + 'px,' + pv.y.toFixed(1) + 'px,0)';
      if (pv.on || Math.abs(pv.tx - pv.x) > 0.5) pv.raf = requestAnimationFrame(loop); else pv.raf = 0;
    };
    var setTarget = function (e) {
      pv.tx = clamp(e.clientX + 28, 8, window.innerWidth - 328);
      pv.ty = clamp(e.clientY - 100, 8, window.innerHeight - 208);
    };
    workList.addEventListener('pointerover', function (e) {
      var row = e.target.closest('.row'); if (!row || e.pointerType === 'touch') return;
      var p = bySlug[row.getAttribute('data-slug')];
      if (!p || !hasImage(p)) { rowPreview.classList.remove('is-visible'); pv.on = false; return; }
      if (rowPreviewImg.getAttribute('src') !== imgSrc(p, true)) rowPreviewImg.src = imgSrc(p, true);
      setTarget(e);
      if (!pv.on) { pv.x = pv.tx; pv.y = pv.ty; }
      pv.on = true; rowPreview.classList.add('is-visible');
      if (!pv.raf) pv.raf = requestAnimationFrame(loop);
    });
    workList.addEventListener('pointermove', function (e) { if (pv.on) setTarget(e); });
    workList.addEventListener('pointerleave', function () { pv.on = false; rowPreview.classList.remove('is-visible'); });
  }

  /* ---------------- Case-study drawer ---------------- */
  var drawer = $('#case');
  var drawerPanel = $('#case-panel');
  var drawerContent = $('#case-content');
  var drawerCrumb = $('#case-crumb');
  var drawerOpen = false;
  var openedViaPush = false;
  var currentSlug = null;

  function renderCase(p) {
    var idx = PROJECTS.indexOf(p);
    var prev = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length];
    var next = PROJECTS[(idx + 1) % PROJECTS.length];
    var links = p.links || {};
    drawerCrumb.textContent = 'Work / ' + pad2(idx + 1) + ' — ' + p.title;
    var meta = [
      ['Role', p.role], ['Year', p.year],
      ['Stack', (p.tags || []).join(', ')], ['Build', buildLabel(p)]
    ].filter(function (m) { return m[1]; });
    drawerContent.innerHTML =
      '<p class="mono label">' + esc(p.category || '') + '</p>' +
      '<h2 class="display case__title" id="case-title">' + esc(p.title) + '</h2>' +
      '<p class="case__kicker">' + esc(p.kicker) + '</p>' +
      '<div class="case__media">' + mediaHTML(p, false, false) + '</div>' +
      '<dl class="case__meta">' + meta.map(function (m) { return '<div><dt class="mono label">' + esc(m[0]) + '</dt><dd>' + esc(m[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="case__body">' + (p.body || []).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>' +
      ((p.tech || []).length ? '<p class="mono label case__section-label">Built with</p><ul class="case__tech">' + p.tech.map(function (t) { return '<li class="pill">' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
      ((links.live || links.repo) ? '<div class="case__actions">' +
        (links.live ? '<a class="pill pill--primary" href="' + esc(links.live) + '" target="_blank" rel="noopener" data-cursor="open">Visit live <span aria-hidden="true">↗</span></a>' : '') +
        (links.repo ? '<a class="pill" href="' + esc(links.repo) + '" target="_blank" rel="noopener" data-cursor="open">Source on GitHub <span aria-hidden="true">↗</span></a>' : '') +
        '</div>' : '') +
      (PROJECTS.length > 1 ? '<nav class="case__nav" aria-label="Other projects">' +
        '<button type="button" class="case__nav-btn" data-go="' + esc(prev.slug) + '" data-cursor="open"><span class="mono label">Previous</span><span>' + esc(prev.title) + '</span></button>' +
        '<button type="button" class="case__nav-btn case__nav-btn--next" data-go="' + esc(next.slug) + '" data-cursor="open"><span class="mono label">Next</span><span>' + esc(next.title) + '</span></button>' +
        '</nav>' : '');
    drawerPanel.scrollTop = 0;
  }

  function openCase(slug, trigger) {
    var p = bySlug[slug];
    if (!p || !drawer) return;
    var wasOpen = drawerOpen;
    currentSlug = slug;
    renderCase(p);
    var hash = '#work/' + slug;
    if (location.hash !== hash) {
      try {
        if (wasOpen || !trigger) history.replaceState({ cs: slug }, '', hash);
        else { history.pushState({ cs: slug }, '', hash); openedViaPush = true; }
      } catch (e) {}
    }
    if (!wasOpen) {
      drawerOpen = true;
      openDialog(drawer, { restore: trigger || null, initialFocus: '#case-close', onClose: function () {
        drawerOpen = false; currentSlug = null;
        if (/^#work\//.test(location.hash)) {
          if (openedViaPush) { openedViaPush = false; try { history.back(); } catch (e) {} }
          else { try { history.replaceState(null, '', location.pathname + location.search + '#work'); } catch (e) {} }
        }
        openedViaPush = false;
      } });
    } else {
      setTimeout(function () { try { $('#case-close').focus({ preventScroll: true }); } catch (e) {} }, 30);
    }
  }
  if (drawer) {
    $('#case-close').addEventListener('click', function () { closeDialog(); });
    $('#case-backdrop').addEventListener('click', function () { closeDialog(); });
    drawerContent.addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]'); if (b) openCase(b.getAttribute('data-go'));
    });
  }
  function routeFromHash() {
    var m = location.hash.match(/^#work\/([\w-]+)$/);
    if (m && bySlug[m[1]]) {
      if (currentSlug !== m[1]) { openedViaPush = false; openCase(m[1]); }
    } else if (drawerOpen) {
      openedViaPush = false; closeDialog();
    }
  }
  window.addEventListener('hashchange', routeFromHash);
  if (/^#work\//.test(location.hash)) {
    // Jump (not smooth-scroll) to the work list before the drawer locks scrolling, so closing lands on the list.
    var work = $('#work');
    if (work) {
      html.style.scrollBehavior = 'auto';
      work.scrollIntoView({ behavior: 'auto', block: 'start' });
      requestAnimationFrame(function () { html.style.scrollBehavior = ''; });
    }
    setTimeout(routeFromHash, 50);
  }

  /* ---------------- Hero: floating labels ---------------- */
  var labelsWrap = $('#hero-labels');
  if (labelsWrap && hero) {
    var labels = $$('.hero__label', labelsWrap);
    // [x, y] — x: 'l' (left gutter), 'r' (right gutter) or fraction; y: fraction of hero height
    var SLOTS = [['l', .13], [.28, .13], [.52, .13], ['r', .13], [.28, .34], [.52, .45], ['r', .5], ['l', .9], ['l', .8]];
    var occupied = {};
    function gutter() { return parseFloat(getComputedStyle(hero).getPropertyValue('--gutter')) || 24; }
    function place(label, slot, animate) {
      var w = hero.clientWidth, h = hero.clientHeight, g = gutter();
      var s = SLOTS[slot];
      var lw = label.offsetWidth || 120;
      var x = s[0] === 'l' ? g : s[0] === 'r' ? (w - g - lw) : w * s[0];
      var y = h * s[1];
      if (!animate) label.style.transition = 'none';
      label.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
      if (!animate) { void label.offsetHeight; label.style.transition = ''; }
      var old = label.getAttribute('data-slot'); if (old != null) delete occupied[old];
      occupied[slot] = true; label.setAttribute('data-slot', slot);
    }
    labels.forEach(function (l) { place(l, +l.getAttribute('data-slot') || 0, false); });
    var relayout = function () { labels.forEach(function (l) { place(l, +l.getAttribute('data-slot'), false); }); };
    var rt; var queueRelayout = function () { clearTimeout(rt); rt = setTimeout(relayout, 120); };
    window.addEventListener('resize', queueRelayout);
    window.addEventListener('load', relayout);
    fontsReady.then(relayout);
    if ('ResizeObserver' in window) new ResizeObserver(queueRelayout).observe(hero);
    if (!reduced) {
      setInterval(function () {
        if (document.hidden || window.scrollY > hero.offsetHeight) return;
        var free = []; for (var i = 0; i < SLOTS.length; i++) if (!occupied[i]) free.push(i);
        if (!free.length) return;
        var label = labels[Math.floor(Math.random() * labels.length)];
        place(label, free[Math.floor(Math.random() * free.length)], true);
      }, 7000);
    }
  }

  /* ---------------- Reveal on scroll ---------------- */
  var revealIO = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); revealIO.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }) : null;
  $$('.reveal').forEach(function (el) { if (revealIO) revealIO.observe(el); else el.classList.add('is-visible'); });

  /* ---------------- Custom cursor ---------------- */
  var cursor = $('#cursor');
  var cursorLabel = $('#cursor-label');
  if (cursor && finePointer && !reduced && !window.matchMedia('(hover: none)').matches) {
    html.classList.add('has-cursor');
    var c = { x: -100, y: -100, tx: -100, ty: -100, raf: 0 };
    var cloop = function () {
      c.x += (c.tx - c.x) * 0.22; c.y += (c.ty - c.y) * 0.22;
      cursor.style.transform = 'translate3d(' + (c.x - 5).toFixed(1) + 'px,' + (c.y - 5).toFixed(1) + 'px,0)';
      if (Math.abs(c.tx - c.x) > 0.2 || Math.abs(c.ty - c.y) > 0.2) c.raf = requestAnimationFrame(cloop); else c.raf = 0;
    };
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      c.tx = e.clientX; c.ty = e.clientY;
      if (!c.raf) c.raf = requestAnimationFrame(cloop);
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('[data-cursor]');
      var mode = t ? t.getAttribute('data-cursor') : '';
      if (!t) { var ft = e.target.closest('input,textarea,select'); if (ft) mode = 'none'; }
      cursor.classList.toggle('is-hidden', mode === 'none');
      cursor.classList.toggle('is-big', mode === 'view' || mode === 'open');
      cursorLabel.textContent = mode === 'view' ? 'View' : mode === 'open' ? 'Open' : '';
    });
    document.addEventListener('mouseleave', function () { cursor.classList.add('is-hidden'); });
    document.addEventListener('mouseenter', function () { cursor.classList.remove('is-hidden'); });
    window.addEventListener('blur', function () { cursor.classList.add('is-hidden'); });
    window.addEventListener('focus', function () { cursor.classList.remove('is-hidden'); });
  }

  /* ---------------- Contact form ---------------- */
  var form = $('#contact-form');
  if (form) {
    var status = $('#form-status');
    var setErr = function (id, msg) {
      var input = $('#' + id); var err = $('#' + id + '-error');
      if (err) err.textContent = msg || '';
      if (input) { input.closest('.field').classList.toggle('is-invalid', !!msg); if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
    };
    ['f-name', 'f-email', 'f-message'].forEach(function (id) {
      var el = $('#' + id); if (el) el.addEventListener('input', function () { setErr(id, ''); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var name = $('#f-name'), email = $('#f-email'), msg = $('#f-message');
      if (!name.value.trim()) { setErr('f-name', 'Please add your name.'); ok = false; }
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setErr('f-email', 'Please add a valid email.'); ok = false; }
      if (!msg.value.trim()) { setErr('f-message', 'Please write a message.'); ok = false; }
      if (form.elements._gotcha && form.elements._gotcha.value) ok = false;
      status.classList.remove('is-error'); status.textContent = '';
      if (!ok) { var firstBad = $('.field.is-invalid .field__input', form); if (firstBad) firstBad.focus(); return; }
      if (window.grecaptcha && typeof grecaptcha.getResponse === 'function') {
        var token = ''; try { token = grecaptcha.getResponse(); } catch (e2) {}
        if (!token) { status.classList.add('is-error'); status.textContent = 'Please complete the reCAPTCHA first.'; return; }
      }
      var btn = $('#form-submit'); btn.disabled = true; btn.textContent = 'Sending…';
      var data = new FormData(form);
      fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json().catch(function () { return {}; }) : r.json().then(function (j) { throw j; }, function () { throw {}; }); })
        .then(function () {
          form.classList.add('is-sent');
          status.textContent = 'Thanks — your message is on its way. I\'ll get back to you within a day or two.';
          form.reset();
        })
        .catch(function (err) {
          btn.disabled = false; btn.textContent = 'Send message';
          var m = (err && err.errors && err.errors.length) ? err.errors.map(function (x) { return x.message; }).join(' ') : 'Something went wrong. You can email me directly at jakecushway96@gmail.com.';
          status.classList.add('is-error'); status.textContent = m;
          if (window.grecaptcha && grecaptcha.reset) { try { grecaptcha.reset(); } catch (e3) {} }
        });
    });
    // reCAPTCHA follows the current theme: set before first render, re-rendered on toggle
    var rc = $('.g-recaptcha', form);
    if (rc) rc.setAttribute('data-theme', currentTheme());
    window.addEventListener('themechange', function () {
      var cur = $('.g-recaptcha', form);
      if (!cur) return;
      cur.setAttribute('data-theme', currentTheme());
      if (!(window.grecaptcha && typeof grecaptcha.render === 'function') || !cur.firstChild) return;
      try {
        var fresh = document.createElement('div');
        fresh.className = 'g-recaptcha';
        fresh.setAttribute('data-sitekey', cur.getAttribute('data-sitekey'));
        fresh.setAttribute('data-theme', currentTheme());
        cur.parentNode.replaceChild(fresh, cur);
        grecaptcha.render(fresh, { sitekey: fresh.getAttribute('data-sitekey'), theme: currentTheme() });
      } catch (e) {}
    });
  }

  /* ---------------- Misc ---------------- */
  // Keep the hero size stable on mobile address-bar changes (use measured height for labels only)
  window.addEventListener('pagehide', function () { closeDialog({ immediate: true, skipRestore: true }); });
})();
