// Guard phone for the fictional timekeeping demo. It draws the demo controls bar into #demo-controls, the
// live location card (the demo's map layer) into #live-map, and a simulated Android attendance app into
// #mobile-app: Home (assignment, distance status, clock and the big TIME IN / TIME OUT button), a simulated
// face check, Members, Reports and Payslip. Every fact comes from window.TK (core.js). This file keeps only local UI state: the current screen, open overlays, filters and the
// face-check timers. Nothing here reads a camera, location, storage or the network.
(function () {
  'use strict';

  const TK = window.TK;
  const mount = document.getElementById('mobile-app');
  if (!TK || !mount) return;
  const ctlMount = document.getElementById('demo-controls') || mount;
  const mapMount = document.getElementById('live-map');
  const { h, fmt, A } = TK;
  const S = TK.svg;
  const TODAY = TK.TODAY;

  const LABELS = { home: 'Home', members: 'Members', reports: 'Reports', payslip: 'Payslip' };

  // Local UI state. attempt rotates the face-check challenges and only goes back to 0 on Reset.
  const ui = { screen: 'home', h24: false, view: 'digital', drawer: false, dialog: null, faceOp: 'in', attempt: 0 };
  let screens = {};

  // Face-check timers live here so Reset, a guard change or leaving the screen can cancel them.
  const faceTimers = new Set();
  function later(ms, fn) {
    const t = setTimeout(() => { faceTimers.delete(t); fn(); }, ms);
    faceTimers.add(t);
  }
  function clearFace() {
    faceTimers.forEach(clearTimeout);
    faceTimers.clear();
  }

  // ---------------------------------------------------------------- small helpers

  const me = (s) => TK.guard(s.guardId);
  const myPost = (s) => TK.post(me(s).postId);
  const actKey = (s) => s.activity.length + '|' + (s.activity[0] ? s.activity[0].sec + s.activity[0].text : '');
  const opWord = (op) => (op === 'out' ? 'TIME OUT' : 'TIME IN');

  function setText(el, t) { if (el.textContent !== t) el.textContent = t; }
  function setAttr(el, k, v) { v = String(v); if (el.getAttribute(k) !== v) el.setAttribute(k, v); }
  // Disables a button, first moving focus to `fallback` if the button had it, so keyboard users are not dropped.
  function disable(btn, off, fallback) {
    if (off && document.activeElement === btn && fallback) fallback.focus();
    btn.disabled = off;
  }
  const btn = (text, onclick, cls = 'btn btn-sm') => h('button', { type: 'button', class: cls, text, onclick });

  // The invented lantern-in-a-shield mark (not the client's logo), used in the drawer and as the faint Home watermark.
  function logo(cls) {
    const root = S('svg', { viewBox: '0 0 48 56', class: 'm-logo ' + cls, 'aria-hidden': 'true', focusable: 'false' });
    S('path', { class: 'm-logo-shield', d: 'M24 2 L44 9 V27 C44 41 35 50 24 54 C13 50 4 41 4 27 V9 Z' }, root);
    S('path', { class: 'm-logo-line', d: 'M20 15 a4 4 0 0 1 8 0' }, root);
    S('rect', { class: 'm-logo-ink', x: 17, y: 16, width: 14, height: 4, rx: 1 }, root);
    S('rect', { class: 'm-logo-line', x: 18.5, y: 21.5, width: 11, height: 14, rx: 3 }, root);
    S('path', { class: 'm-logo-flame', d: 'M24 24 C27.5 28 26.5 32 24 33.5 C21.5 32 20.5 28 24 24 Z' }, root);
    S('rect', { class: 'm-logo-ink', x: 16, y: 37, width: 16, height: 4, rx: 1 }, root);
    return root;
  }

  function burgerIcon() {
    const root = S('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
    [6, 12, 18].forEach((y) => S('line', { x1: 4, y1: y, x2: 20, y2: y }, root));
    return root;
  }

  function battery() {
    const root = S('svg', { viewBox: '0 0 27 12', class: 'm-battery', 'aria-hidden': 'true', focusable: 'false' });
    S('rect', { class: 'm-bat-case', x: 0.5, y: 0.5, width: 22, height: 11, rx: 2.5 }, root);
    S('rect', { class: 'm-bat-fill', x: 23.5, y: 3.5, width: 2.5, height: 5, rx: 1 }, root);
    S('rect', { class: 'm-bat-fill', x: 2.5, y: 2.5, width: 14, height: 7, rx: 1 }, root);
    return root;
  }

  // Placeholder attendance photo: a head-and-shoulders outline, never a real picture.
  function silhouette(cls) {
    const root = S('svg', { viewBox: '0 0 40 48', class: 'silhouette ' + cls, 'aria-hidden': 'true', focusable: 'false' });
    S('circle', { class: 'sil-shape', cx: 20, cy: 18, r: 8 }, root);
    S('path', { class: 'sil-shape', d: 'M6 48 C6 35 13 30 20 30 S34 35 34 48 Z' }, root);
    S('rect', { class: 'sil-box', x: 10, y: 7, width: 20, height: 23, rx: 2 }, root);
    return root;
  }

  // ---------------------------------------------------------------- demo controls (outside the phone)

  const ctl = {};
  function buildControls() {
    ctl.guard = h('select', { id: 'm-guard', class: 'select', onchange: (e) => {
      TK.dispatch({ type: A.SELECT_GUARD, guardId: e.target.value });
      TK.announce(`The phone now belongs to ${TK.guard(e.target.value).name}.`);
    } }, TK.GUARDS.map((g) => h('option', { value: g.id, text: `${g.name} · ${TK.post(g.postId).name}` })));
    ctl.walk = btn('Travel to post', () => TK.dispatch({ type: TK.getState().walking ? A.WALK_STOP : A.WALK_START }), 'btn btn-primary btn-sm');
    ctl.arrive = btn('Arrive now', () => TK.dispatch({ type: A.ARRIVE }));
    ctl.speeds = TK.SPEEDS.map((v) => h('button', { type: 'button', 'aria-pressed': 'false', text: v ? v + '×' : 'Pause', onclick: () => {
      TK.dispatch({ type: A.SET_SPEED, speed: v });
      TK.announce(v ? `Demo clock runs at ${v}×.` : 'Demo clock paused.');
    } }));
    ctl.plus = btn('+15 min', () => TK.dispatch({ type: A.ADVANCE, sec: 900 }));
    ctl.jump = btn('Jump to shift end', () => {
      const s = TK.getState();
      TK.dispatch({ type: A.ADVANCE, to: TK.schedule(s, s.guardId).end * 60 });
    });
    ctl.online = h('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': 'true', text: 'Phone online', onclick: toggleOnline });
    ctl.queue = h('span', { class: 'm-queue' });
    return h('section', { class: 'card m-controls', 'aria-labelledby': 'm-controls-title' },
      h('div', { class: 'm-ctl-head' }, ctl.head = h('h2', { id: 'm-controls-title', tabindex: '-1', text: 'Demo controls' }), h('p', { class: 'hint', text: 'Not part of the app' })),
      h('div', { class: 'field m-ctl-guard' }, h('label', { class: 'label', for: 'm-guard', text: 'Guard on the phone' }), ctl.guard),
      h('div', { class: 'm-row' }, ctl.walk, ctl.arrive, ctl.plus, ctl.jump, ctl.online, ctl.queue),
      h('div', { class: 'm-row' }, h('span', { class: 'label', id: 'm-speed-label', text: 'Demo clock' }),
        h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'm-speed-label' }, ctl.speeds)));
  }

  function toggleOnline() {
    const s = TK.getState(), on = !s.online;
    const queued = s.outbox.filter((o) => o.offline).length;
    TK.dispatch({ type: A.SET_ONLINE, online: on });
    TK.announce(on
      ? (queued ? `Phone online. ${queued} queued ${queued === 1 ? 'event is' : 'events are'} syncing.` : 'Phone online.')
      : 'Phone offline. Clock events will wait in a queue on the phone.');
  }

  function updateControls(s) {
    if (ctl.guard.value !== s.guardId) ctl.guard.value = s.guardId;
    const prox = TK.proximity(s, s.guardId);
    setText(ctl.walk, s.walking ? 'Pause travel' : 'Travel to post');
    // On arrival focus moves to the phone's clock button when it can be used, else to the controls heading;
    // never to the guard select, where the next arrow key would switch guard and reset the phone.
    const home = screens.home;
    const safe = home && !home.el.hidden && !ph.screen.inert && TK.canClock(s, s.guardId).enabled ? home.btn : ctl.head;
    disable(ctl.walk, prox.arrived, safe);
    disable(ctl.arrive, prox.arrived, safe);
    ctl.speeds.forEach((b, i) => setAttr(b, 'aria-pressed', TK.SPEEDS[i] === s.speed));
    const showJump = me(s).shift === 'day' && TK.nowMin(s) < TK.schedule(s, s.guardId).end;
    if (!showJump && document.activeElement === ctl.jump) ctl.plus.focus();
    ctl.jump.hidden = !showJump;
    setAttr(ctl.online, 'aria-checked', s.online);
    setText(ctl.queue, s.online ? '' : `Offline · ${s.outbox.filter((o) => o.offline).length} queued`);
  }

  // ---------------------------------------------------------------- live location card (outside the phone)

  // The demo's map layer for the guard on the phone, updated on every tick so the marker glides between
  // positions (base.css gives it a 0.25 s transition, instant under reduced motion). The map box's own width
  // picks the drawing, since the page may sit in a narrow iframe: when the street names would draw under about
  // 12 px, the compact drawing zoomed to the route is used; larger boxes show the whole town.
  const lm = { compact: null };
  // Redraws the map only when the mode flips; returns whether it did.
  function mountLiveMap() {
    // Street labels are 15 units on the 1000 x 700 drawing; below about 12 px on screen the zoomed route view is used.
    const compact = Math.min(lm.box.clientWidth / 1000, lm.box.clientHeight / 700) * 15 < 12;
    if (compact === lm.compact) return false;
    lm.compact = compact;
    lm.box.replaceChildren();
    lm.map = TK.mountMap(lm.box, { compact });
    return true;
  }
  function buildLiveMap() {
    lm.trip = h('p', { class: 'lm-trip' });
    lm.box = h('div', { class: 'lm-map' });
    lm.dist = h('dd');
    lm.eta = h('dd');
    lm.status = h('span', { class: 'badge' });
    lm.where = h('dd');
    if (window.ResizeObserver) new ResizeObserver(() => { if (mountLiveMap()) updateLiveMap(TK.getState()); }).observe(lm.box);
    const stat = (label, dd) => h('div', null, h('dt', { text: label }), dd);
    const key = (cls, text) => h('li', null, h('span', { class: 'lm-key lm-key-' + cls, 'aria-hidden': 'true' }), text);
    return [lm.trip, lm.box,
      h('dl', { class: 'lm-stats' }, stat('Distance to post', lm.dist), stat('ETA', lm.eta),
        stat('Geofence', h('dd', null, lm.status)), stat('Nearest street', lm.where)),
      h('ul', { class: 'legend', 'aria-label': 'Map key' }, key('guard', 'Guard, live'), key('home', 'Start'), key('route', 'Route'),
        key('post', 'Post'), key('ring', 'Geofence radius'), key('in', 'Guard inside the radius'), key('park', 'Park'), key('river', 'River'))];
  }
  function updateLiveMap(s) {
    if (!lm.map) return;
    const g = me(s), p = myPost(s), prox = TK.proximity(s, g.id);
    lm.map.update(s, { guardId: g.id, fit: lm.compact ? 'route' : 'all' });
    setText(lm.trip, `${g.name} → ${p.name}, ${p.address}`);
    setText(lm.dist, fmt.metres(prox.distance));
    setText(lm.eta, fmt.eta(prox.etaMin));
    setText(lm.status, `${prox.inside ? 'Inside' : 'Outside'} the ${prox.radius} m radius`);
    setAttr(lm.status, 'class', 'badge ' + (prox.inside ? 'badge-ok' : 'badge-idle'));
    setText(lm.where, TK.nearestStreet(prox.pos).street);
  }

  // ---------------------------------------------------------------- phone frame, drawer and dialogs

  const ph = {};
  function buildPhone() {
    ph.time = h('span', { class: 'm-sb-time' });
    ph.net = h('span', { class: 'm-sb-net' });
    ph.status = h('div', { class: 'm-statusbar' }, ph.time, h('span', { class: 'm-sb-right' }, ph.net, battery()));
    ph.burger = h('button', { type: 'button', class: 'm-burger', 'aria-label': 'Open menu', 'aria-expanded': 'false', 'aria-controls': 'm-drawer', onclick: openDrawer }, burgerIcon());
    ph.title = h('h3', { class: 'm-title' });
    ph.bar = h('header', { class: 'm-bar' }, ph.burger, ph.title, h('span', { 'aria-hidden': 'true' }));
    ph.screen = h('div', { class: 'm-screen' });
    ph.scrim = h('div', { class: 'm-scrim', onclick: () => closeDrawer() });
    ph.drawer = buildDrawer();
    ph.overlay = buildOverlay();
    ph.root = h('div', { class: 'm-phone', role: 'group', 'aria-label': 'Guard’s phone (simulated)', onkeydown: onPhoneKey },
      ph.status, ph.bar, ph.screen, ph.scrim, ph.drawer, ph.overlay);
    return ph.root;
  }

  function buildDrawer() {
    ph.dName = h('strong');
    ph.items = {};
    Object.keys(LABELS).forEach((k) => {
      ph.items[k] = h('button', { type: 'button', class: 'm-ditem', text: LABELS[k], onclick: () => { closeDrawer(); go(k); } });
    });
    return h('nav', { id: 'm-drawer', class: 'm-drawer', 'aria-label': 'App menu' },
      h('div', { class: 'm-dbrand' }, logo('m-dlogo'),
        h('p', { class: 'm-dco', text: TK.BRAND.name }), h('p', { class: 'm-dtag', text: TK.BRAND.tagline })),
      h('div', { class: 'm-dfade', 'aria-hidden': 'true' }),
      h('p', { class: 'm-dwelcome' }, 'Welcome,', h('br'), ph.dName),
      h('ul', { class: 'm-dlist' }, Object.keys(LABELS).map((k) => h('li', null, ph.items[k]))));
  }

  // While the drawer or a dialog is open, the rest of the phone is inert so focus and taps stay in the overlay.
  function setInert(on) { [ph.status, ph.bar, ph.screen].forEach((el) => { el.inert = on; }); }

  function openDrawer() {
    ui.drawer = true;
    ph.drawer.classList.add('is-open');
    ph.scrim.classList.add('is-open');
    setInert(true);
    setAttr(ph.burger, 'aria-expanded', true);
    (ph.items[ui.screen] || ph.items.home).focus();
  }
  function closeDrawer(returnFocus = true) {
    ui.drawer = false;
    ph.drawer.classList.remove('is-open');
    ph.scrim.classList.remove('is-open');
    setInert(false);
    setAttr(ph.burger, 'aria-expanded', false);
    if (returnFocus) ph.burger.focus();
  }

  function buildOverlay() {
    ph.aTitle = h('h4', { id: 'm-alert-title', class: 'm-alert-title' });
    ph.aMsg = h('p', { id: 'm-alert-msg', class: 'm-alert-msg' });
    ph.aBtns = h('div', { class: 'm-alert-btns' });
    return h('div', { class: 'm-overlay' },
      h('div', { class: 'm-alert', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'm-alert-title', 'aria-describedby': 'm-alert-msg' },
        ph.aTitle, ph.aMsg, ph.aBtns));
  }

  // Shows an alert or confirm inside the phone. buttons: [{label, value, kind}]. Resolves with the chosen
  // value, or null on Escape, Reset or a guard change. Focus goes back to whatever opened it.
  function dialog(title, message, buttons = [{ label: 'OK', value: true, kind: 'primary' }], focusIndex = buttons.length - 1) {
    closeDialog(null);
    if (ui.drawer) closeDrawer(false);
    return new Promise((resolve) => {
      const trigger = document.activeElement;
      ph.aTitle.textContent = title;
      ph.aMsg.textContent = message;
      const btns = buttons.map((b) => h('button', { type: 'button', class: 'm-abtn m-abtn-' + (b.kind || 'plain'), text: b.label, onclick: () => closeDialog(b.value) }));
      ph.aBtns.replaceChildren(...btns);
      ph.overlay.classList.add('is-open');
      setInert(true);
      ui.dialog = { resolve, trigger };
      btns[focusIndex].focus();
    });
  }
  function closeDialog(value, restore = true) {
    const d = ui.dialog;
    if (!d) return;
    ui.dialog = null;
    ph.overlay.classList.remove('is-open');
    setInert(false);
    if (restore) (d.trigger && d.trigger.isConnected && d.trigger !== document.body ? d.trigger : ph.burger).focus();
    d.resolve(value);
  }

  // Escape closes the top overlay; Tab wraps inside it.
  function onPhoneKey(e) {
    if (e.key === 'Escape') {
      if (ui.dialog) { e.preventDefault(); closeDialog(null); } else if (ui.drawer) { e.preventDefault(); closeDrawer(); }
      return;
    }
    const box = e.key === 'Tab' && (ui.dialog ? ph.aBtns : ui.drawer ? ph.drawer : null);
    if (!box) return;
    const f = [...box.querySelectorAll('button')].filter((b) => !b.disabled && !b.closest('[hidden]'));
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }

  function updateChrome(s) {
    setText(ph.time, fmt.time(TK.nowMin(s), ui.h24).replace(/ [AP]M$/, '').replace(/^0/, ''));
    setText(ph.net, s.online ? '4G' : 'Offline');
    ph.net.classList.toggle('is-off', !s.online);
    setText(ph.dName, me(s).name);
    ph.items.members.parentNode.hidden = me(s).role !== 3;
    Object.entries(ph.items).forEach(([k, b]) => { if (k === ui.screen) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    setText(ph.title, ui.screen === 'face' ? opWord(ui.faceOp) : LABELS[ui.screen].toUpperCase());
  }

  // ---------------------------------------------------------------- Home

  function analogClock() {
    const root = S('svg', { viewBox: '0 0 200 200', class: 'm-analog', role: 'img', focusable: 'false' });
    S('circle', { class: 'm-an-face', cx: 100, cy: 100, r: 96 }, root);
    const at = (r, a) => [(100 + r * Math.sin(a)).toFixed(2), (100 - r * Math.cos(a)).toFixed(2)];
    for (let i = 0; i < 60; i++) {
      const a = i * Math.PI / 30, [x1, y1] = at(i % 5 ? 86 : 79, a), [x2, y2] = at(92, a);
      S('line', { class: i % 5 ? 'm-an-tick' : 'm-an-tick is-hour', x1, y1, x2, y2 }, root);
    }
    for (let n = 1; n <= 12; n++) {
      const [x, y] = at(66, n * Math.PI / 6);
      S('text', { class: 'm-an-num', x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', text: n }, root);
    }
    const hand = (cls, y1, y2) => S('line', { class: cls, x1: 100, y1, x2: 100, y2 }, root);
    const hh = hand('m-an-hour', 112, 50), mm = hand('m-an-min', 116, 30), ss = hand('m-an-sec', 122, 20);
    S('circle', { class: 'm-an-pin', cx: 100, cy: 100, r: 4.5 }, root);
    return {
      root,
      set(sec) {
        const t = Math.floor(sec);
        hh.setAttribute('transform', `rotate(${((t / 3600) % 12) * 30} 100 100)`);
        mm.setAttribute('transform', `rotate(${((t / 60) % 60) * 6} 100 100)`);
        ss.setAttribute('transform', `rotate(${(t % 60) * 6} 100 100)`);
        setAttr(root, 'aria-label', `Analog clock showing ${fmt.time(Math.floor(t / 60))}`);
      },
    };
  }

  // What the big button says and why, from canClock.
  function buttonState(c) {
    if (c.status === 'processing') return { label: 'PROCESSING', cls: 'is-busy', reason: 'Waiting for the server' };
    if (c.status === 'offline_pending') return { label: 'PROCESSING', cls: 'is-busy', reason: 'Saved offline. Waiting for a connection' };
    if (c.status === 'completed') return { label: 'COMPLETED', cls: 'is-done', reason: 'Time-in and time-out are both done for today' };
    const label = opWord(c.op);
    if (c.enabled) return { label, cls: c.op === 'out' ? 'is-out' : 'is-in', reason: `Inside the ${c.radius} m radius` };
    const why = !c.inside ? `Outside the ${c.radius} m radius`
      : c.alert && c.alert.title === 'Leave Status' ? 'On approved leave today' : 'Outside your scheduled day and time';
    return { label, cls: 'is-off', reason: why };
  }

  function buildHome() {
    const r = {};
    r.addr = h('p'); r.range = h('p'); r.days = h('p'); r.radius = h('p');
    r.grace = h('p', { class: 'm-grace', hidden: true });
    r.strip = h('p', { class: 'm-strip' });

    r.fmtBtn = h('button', { type: 'button', class: 'm-24', 'aria-pressed': 'false', 'aria-label': '24H time',
      onclick: () => { ui.h24 = !ui.h24; refresh(); } },
    h('span', { class: 'm-24-12', text: '12H' }), h('span', { class: 'm-24-24', text: '24H' }));
    r.digits = h('p', { class: 'm-digits' });
    r.digital = h('div', { class: 'm-digital' }, r.fmtBtn, r.digits, h('p', { class: 'm-cdate', text: fmt.date(TODAY) }),
      h('p', { class: 'm-zone', text: `${TK.CITY} time (fictional zone)` }));
    r.analog = analogClock();
    r.analogWrap = h('div', { class: 'm-digital', hidden: true }, r.analog.root, h('p', { class: 'm-cdate', text: fmt.date(TODAY) }));
    const views = [['digital', 'Digital clock'], ['analog', 'Analog clock']];
    const setView = (v) => { if (ui.view !== v) { ui.view = v; refresh(); TK.announce(`${v === 'analog' ? 'Analog' : 'Digital'} clock.`); } };
    r.dots = views.map(([v, label]) => h('button', { type: 'button', class: 'm-dot', 'aria-label': label, 'aria-pressed': 'false', onclick: () => setView(v) }));
    // A horizontal swipe on the clock switches views, like the pager in the source app.
    let sx = null, sy = 0;
    r.clock = h('div', { class: 'm-clock',
      onpointerdown: (e) => { sx = e.clientX; sy = e.clientY; },
      onpointercancel: () => { sx = null; },
      onpointerup: (e) => {
        if (sx == null) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        sx = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) setView(dx < 0 ? 'analog' : 'digital');
      } }, r.digital, r.analogWrap, h('div', { class: 'm-pager' }, r.dots));

    r.name = h('p', { class: 'm-name' });
    r.empNo = h('p', { class: 'm-empno' });
    r.role = h('p', { class: 'm-role' });
    r.btn = h('button', { type: 'button', class: 'm-clockbtn', 'aria-describedby': 'm-reason', onclick: onClockTap });
    r.reason = h('p', { id: 'm-reason', class: 'm-reason' });
    r.street = h('span');
    r.city = h('strong');

    const el = h('div', { class: 'm-home' }, logo('m-watermark'),
      h('div', { class: 'm-assign' }, r.addr, r.range, r.days, r.radius, r.grace),
      r.strip,
      r.clock,
      h('div', { class: 'm-ident' }, r.name, r.empNo, r.role),
      r.btn, r.reason,
      h('p', { class: 'm-loc' }, 'Location: ', r.street, h('br'), r.city));

    function update(s) {
      const g = me(s), p = myPost(s), sch = TK.schedule(s, g.id), prox = TK.proximity(s, g.id), c = TK.canClock(s, g.id);
      setText(r.addr, `${p.address}, ${TK.CITY}`);
      setText(r.range, fmt.range(sch.start, sch.end));
      setText(r.days, fmt.days(sch.days));
      setText(r.radius, `${sch.radius}m radius`);
      const grace = TK.graceRemaining(s, g.id);
      r.grace.hidden = !grace;
      if (grace) setText(r.grace, `Grace window: ${grace} min remaining`);

      setText(r.strip, prox.inside ? `Inside the ${prox.radius} m radius · ${prox.distance} m from post`
        : `${fmt.metres(prox.distance)} to ${p.name} · ETA ${fmt.eta(prox.etaMin)}`);
      r.strip.classList.toggle('is-inside', prox.inside);

      setText(r.digits, fmt.clock(s.nowSec, ui.h24));
      setAttr(r.fmtBtn, 'aria-pressed', ui.h24);
      r.digital.hidden = ui.view !== 'digital';
      r.analogWrap.hidden = ui.view !== 'analog';
      if (ui.view === 'analog') r.analog.set(s.nowSec);
      r.dots.forEach((d, i) => setAttr(d, 'aria-pressed', views[i][0] === ui.view));

      setText(r.name, g.name);
      setText(r.empNo, `ID: ${g.empNo}`);
      setText(r.role, `Role: ${TK.ROLES[g.role]}`);
      const b = buttonState(c);
      setText(r.btn, b.label);
      setAttr(r.btn, 'class', 'm-clockbtn ' + b.cls);
      setAttr(r.btn, 'aria-disabled', !c.enabled);
      setText(r.reason, b.reason);
      const where = TK.nearestStreet(prox.pos);
      setText(r.street, where.street + ',');
      setText(r.city, where.city);
    }
    return { el, update, btn: r.btn, focusButton: () => r.btn.focus() };
  }

  // The big button. It stays focusable while blocked so a tap can explain why.
  async function onClockTap() {
    const s = TK.getState(), c = TK.canClock(s, s.guardId);
    if (c.alert) return dialog(c.alert.title, c.alert.message);
    if (!c.enabled) {
      return dialog('Processing', c.status === 'offline_pending'
        ? 'Your attendance is saved on this phone and will sync when it is back online.'
        : 'Your attendance is being saved. This takes a moment.');
    }
    if (c.op === 'out') {
      const ok = await dialog('Confirm Time Out', 'Are you sure you want to time out? You will need to authenticate with your face.',
        [{ label: 'Cancel', value: null }, { label: 'Time Out', value: true, kind: 'danger' }], 0);
      if (!ok) return;
    }
    // The confirm may have stayed open while the clock ran, so check again.
    const now = TK.getState(), again = TK.canClock(now, now.guardId);
    if (!again.enabled || again.op !== c.op) { if (again.alert) dialog(again.alert.title, again.alert.message); return; }
    if (!now.online) {
      TK.dispatch({ type: A.CLOCK_REQUEST, guardId: now.guardId, op: c.op, via: 'face' });
      return dialog('Queued Offline', `Your time-${c.op} was saved and will sync when online.`);
    }
    openFace(c.op);
  }

  // ---------------------------------------------------------------- simulated face check

  const CHALLENGES = [
    { key: 'blink', prompt: 'Blink twice quickly', label: 'Blink twice', anim: 'is-blink' },
    { key: 'left', prompt: 'Turn your head to the left', label: 'Turn left', anim: 'is-left' },
    { key: 'right', prompt: 'Turn your head to the right', label: 'Turn right', anim: 'is-right' },
    { key: 'smile', prompt: 'Smile widely', label: 'Smile', anim: 'is-smile' },
  ];
  // Three of the four challenges per attempt. The counter picks which one to drop and where the list starts,
  // so consecutive attempts ask in a different order without any randomness.
  function pickChallenges(n) {
    const three = CHALLENGES.filter((_, i) => i !== n % 4), k = n % 3;
    return three.slice(k).concat(three.slice(0, k));
  }

  // The source app gives 10 seconds per step. Steps are untimed here so nobody is rushed in a demo.
  function buildFace(op) {
    const word = op === 'out' ? 'Time Out' : 'Time In';
    const f = { step: 0, fails: 0, seq: pickChallenges(ui.attempt++), phase: 'search' };
    const r = {};
    r.top = h('p', { class: 'm-face-top', text: 'Starting camera (simulated)…' });
    r.title = h('h4', { class: 'm-face-title', tabindex: '-1', text: word });

    const art = S('svg', { viewBox: '0 0 200 240', class: 'm-face-art', 'aria-hidden': 'true', focusable: 'false' });
    r.head = S('g', { class: 'm-head' }, art);
    S('path', { class: 'm-head-shape', d: 'M34 240 C34 196 64 176 100 176 S166 196 166 240 Z' }, r.head);
    S('ellipse', { class: 'm-head-shape', cx: 100, cy: 108, rx: 44, ry: 54 }, r.head);
    S('ellipse', { class: 'm-eye', cx: 84, cy: 102, rx: 6, ry: 4 }, r.head);
    S('ellipse', { class: 'm-eye', cx: 116, cy: 102, rx: 6, ry: 4 }, r.head);
    S('path', { class: 'm-mouth', d: 'M86 134 Q100 143 114 134' }, r.head);
    r.oval = S('ellipse', { class: 'm-oval', cx: 100, cy: 110, rx: 66, ry: 84 }, art);
    r.track = S('rect', { class: 'm-track', x: 50, y: 48, width: 100, height: 120, rx: 6 }, art);
    r.flash = h('div', { class: 'm-flash', 'aria-hidden': 'true' });
    r.pill = h('p', { class: 'm-face-pill' });
    r.bannerTitle = h('strong');
    r.banner = h('div', { class: 'm-face-banner', hidden: true }, r.bannerTitle, h('span', { text: 'Saving your attendance in the background.' }));
    r.actions = CHALLENGES.map((c) => h('button', { type: 'button', class: 'btn btn-sm', 'aria-disabled': 'true', text: c.label, onclick: () => pick(c) }));

    const el = h('div', { class: 'm-face' }, r.top, r.title,
      h('p', { class: 'm-face-sub', text: 'Complete the liveness challenge to confirm your identity' }),
      h('div', { class: 'm-face-card' }, art, r.flash),
      r.pill, r.banner,
      h('div', { class: 'm-face-acts', role: 'group', 'aria-label': 'Liveness actions' }, r.actions),
      h('p', { class: 'hint m-face-note', text: 'Simulated: no camera is used. Pick the action the prompt asks for.' }),
      h('div', { class: 'm-face-foot' }, btn('Use Biometric/PIN', biometric), btn('Cancel', cancel)));

    const say = (msg) => { setText(r.pill, msg); TK.announce(msg); };
    const setActive = (on) => r.actions.forEach((b) => setAttr(b, 'aria-disabled', !on));
    const prompt = () => { f.phase = 'challenge'; setActive(true); say(`Step ${f.step + 1} of 3: ${f.seq[f.step].prompt}`); };

    // Restarts a CSS animation on the head. Under reduced motion base.css turns it off, which is fine.
    function animate(cls) {
      r.head.classList.remove(...CHALLENGES.map((c) => c.anim));
      r.head.getBoundingClientRect();
      r.head.classList.add(cls);
    }

    function start() {
      r.title.focus();
      say('Looking for a face…');
      later(800, () => {
        r.oval.classList.add('is-found');
        r.track.classList.add('is-good');
        setText(r.top, 'Face detected');
        prompt();
      });
    }

    function pick(c) {
      if (f.phase !== 'challenge') return;
      f.phase = 'wait';
      setActive(false);
      if (c.key !== f.seq[f.step].key) {
        f.fails++;
        if (f.fails >= 3) { say('Redirecting to home...'); later(1200, () => backHome(false)); return; }
        say(`Wrong action detected. Restarting challenge (${f.fails}/3).`);
        later(1200, () => { f.step = 0; f.seq = pickChallenges(ui.attempt++); prompt(); });
        return;
      }
      animate(c.anim);
      later(TK.reducedMotion() ? 0 : 650, () => { f.step++; if (f.step < 3) prompt(); else capture(); });
    }

    function capture() {
      setText(r.top, 'Liveness verified');
      say('Liveness verified. Hold steady for your attendance photo.');
      later(1000, () => {
        say('Hold steady... capturing in 1 second.');
        later(1000, () => {
          say('Capturing final photo...');
          if (!TK.reducedMotion()) { r.flash.classList.remove('is-on'); r.flash.getBoundingClientRect(); r.flash.classList.add('is-on'); }
          later(700, () => finish('face'));
        });
      });
    }

    function finish(via) {
      f.phase = 'done';
      setActive(false);
      const s = TK.getState(), c = TK.canClock(s, s.guardId);
      // Something changed during the check (a radius edit, for example): explain instead of claiming success.
      if (!c.enabled || c.op !== op) { backHome(false); if (c.alert) dialog(c.alert.title, c.alert.message); return; }
      const msg = `${word} successful!${via === 'biometric' ? ' (biometric)' : ''}`;
      setText(r.bannerTitle, msg);
      r.banner.hidden = false;
      r.pill.hidden = true;
      setText(r.top, 'Saved');
      TK.announce(msg + ' Saving your attendance in the background.');
      TK.dispatch({ type: A.CLOCK_REQUEST, guardId: s.guardId, op, via });
      later(1000, () => backHome(false));
    }

    function biometric() {
      if (f.phase === 'done') return;
      clearFace();
      finish('biometric');
    }

    function cancel() {
      clearFace();
      backHome(false);
      TK.announce('Face check cancelled. Back on Home.');
    }

    return { el, start, update() {} };
  }

  function openFace(op) {
    clearFace();
    if (screens.face) screens.face.el.remove();
    ui.faceOp = op;
    screens.face = buildFace(op);
    ph.screen.append(screens.face.el);
    go('face', false);
    screens.face.start();
  }

  function backHome(say) {
    go('home', say);
    screens.home.focusButton();
  }

  // ---------------------------------------------------------------- Members (head guard only)

  const CHIP = { ontime: 'badge-ok', late: 'badge-warn', absent: 'badge-bad', duty: 'badge-info', leave: 'badge-idle', rest: 'badge-idle' };
  const username = (g) => g.name.toLowerCase().replace(/\s+/g, '.'); // invented login names

  function buildMembers() {
    const st = { q: '', filter: 'all' };
    const FILTERS = [['all', 'All'], ['ontime', 'On time'], ['late', 'Late'], ['absent', 'Absent'], ['duty', 'Duty']];
    const search = h('input', { type: 'search', id: 'm-msearch', class: 'input', placeholder: 'Name or username', autocomplete: 'off',
      oninput: (e) => { st.q = e.target.value.trim().toLowerCase(); draw(TK.getState()); } });
    const fbtns = FILTERS.map(([k, label]) => h('button', { type: 'button', 'aria-pressed': String(k === 'all'), text: label, onclick: () => {
      st.filter = k;
      fbtns.forEach((b, i) => setAttr(b, 'aria-pressed', FILTERS[i][0] === k));
      draw(TK.getState());
    } }));
    const list = h('ul', { class: 'm-mlist', 'aria-label': 'Team members' });
    const legend = h('ul', { class: 'legend', 'aria-label': 'Status colours' },
      [['ok', 'On time'], ['warn', 'Late'], ['bad', 'Absent'], ['info', 'Duty starts'], ['idle', 'On Leave']]
        .map(([t, l]) => h('li', null, h('span', { class: 'dot dot-' + t, 'aria-hidden': 'true' }), l)));
    const el = h('div', { class: 'm-pad' },
      h('div', { class: 'field' }, h('label', { class: 'label', for: 'm-msearch', text: 'Search members' }), search),
      h('div', { class: 'seg m-seg', role: 'group', 'aria-label': 'Filter by status' }, fbtns),
      legend, list);

    const timeCell = (label, min) => h('div', { class: 'm-mtime' },
      min != null ? silhouette('m-thumb') : h('span', { class: 'm-thumb m-thumb-empty', 'aria-hidden': 'true' }),
      h('span', { class: 'm-mtime-text' }, h('span', { class: 'm-mlabel', text: label }), h('strong', { text: min != null ? fmt.time(min) : '--:--' })));

    function draw(s) {
      const rows = TK.GUARDS.filter((g) => g.postId === me(s).postId)
        .map((g) => ({ g, st: TK.memberStatus(s, g.id), log: s.logs.find((l) => l.gid === g.id && l.date === TODAY), sch: TK.schedule(s, g.id) }))
        .filter((x) => (st.filter === 'all' || x.st.key === st.filter) &&
          (!st.q || x.g.name.toLowerCase().includes(st.q) || username(x.g).includes(st.q)));
      list.replaceChildren(...(rows.length ? rows.map(({ g, st: ms, log, sch }) => h('li', { class: 'm-mcard' },
        h('div', { class: 'm-mcard-head' }, h('strong', { text: g.name }), h('span', { class: 'badge ' + CHIP[ms.key], text: ms.label })),
        h('p', { class: 'm-muser', text: '@' + username(g) }),
        h('div', { class: 'm-mtimes' }, timeCell('Time In', log && log.in), timeCell('Time Out', log && log.out)),
        h('p', { text: `Days: ${fmt.days(sch.days)}` }),
        h('p', { text: `Time: ${fmt.range(sch.start, sch.end)}` })))
        : [h('li', { class: 'empty', text: 'No members match this filter.' })]));
    }
    // The list holds no focusable nodes, so redrawing it never drops focus.
    return { el, update(s, fresh) { if (fresh) draw(s); } };
  }

  // ---------------------------------------------------------------- Reports (the guard's own entries)

  const dayIndex = (iso) => Math.round(Date.parse(iso + 'T00:00:00Z') / 86400000);

  function buildReports(s0) {
    const g = me(s0);
    const st = { range: 'all', date: '' };
    const RANGES = [['all', 'All'], ['today', 'Today'], ['week', 'Week'], ['month', 'Month']];
    const pills = RANGES.map(([k, label]) => h('button', { type: 'button', class: 'm-rpill', 'aria-pressed': String(k === 'all'), text: label, onclick: () => {
      st.range = k;
      pills.forEach((b, i) => setAttr(b, 'aria-pressed', RANGES[i][0] === k));
      draw(TK.getState());
    } }));
    const stat = (label) => { const v = h('strong', { class: 'm-stat-v' }); return { v, el: h('div', { class: 'm-stat' }, h('span', { class: 'm-stat-l', text: label }), v) }; };
    const total = stat('Total Entries'), ins = stat('Time Ins'), outs = stat('Time Outs'), work = stat('Total Work');
    const avg = h('strong'), incomplete = h('strong');
    const count = h('h5');
    let optSig = null;
    const dateSel = h('select', { class: 'select m-dsel', 'aria-label': 'Filter entries by date', onchange: (e) => { st.date = e.target.value; draw(TK.getState()); } });
    const list = h('ol', { class: 'm-entries', 'aria-label': 'Time entries, newest first' });

    const el = h('div', { class: 'm-pad' },
      h('div', { class: 'm-rhead' }, h('h4', { text: 'Time Tracking Reports' }), h('p', { text: g.name }), h('p', { text: `ID: ${g.empNo}` })),
      h('div', { class: 'm-rpills', role: 'group', 'aria-label': 'Date range' }, pills),
      h('div', { class: 'm-stats' }, total.el, ins.el, outs.el, work.el),
      h('p', { class: 'm-rsum' }, 'Average Work Time: ', avg),
      h('p', { class: 'm-rsum' }, 'Incomplete Sessions: ', incomplete),
      h('div', { class: 'm-listhead' }, count, dateSel,
        h('button', { type: 'button', class: 'btn btn-sm', 'aria-label': 'Reset date filter', text: 'Reset', onclick: () => { st.date = ''; draw(TK.getState()); } })),
      list);

    function inRange(l) {
      if (st.range === 'today') return l.date === TODAY;
      if (st.range === 'week') return l.date >= TK.addDays(TODAY, -6) && l.date <= TODAY;
      if (st.range === 'month') return l.date.slice(0, 7) === TODAY.slice(0, 7);
      return true;
    }

    function draw(s) {
      const logs = TK.logsFor(s, { gid: g.id }).filter(inRange);
      const dates = [...new Set(logs.map((l) => l.date))].sort().reverse();
      if (st.date && !dates.includes(st.date)) st.date = '';
      // The date list changes only when a new day gets an entry; never rebuild it under the user's focus.
      if (dates.join() !== optSig && document.activeElement !== dateSel) {
        optSig = dates.join();
        dateSel.replaceChildren(h('option', { value: '', text: 'All dates' }), ...dates.map((d) => h('option', { value: d, text: fmt.date(d) })));
      }
      if (dateSel.value !== st.date) dateSel.value = st.date;

      const nIn = logs.filter((l) => l.in != null).length, nOut = logs.filter((l) => l.out != null).length;
      const done = logs.filter((l) => l.in != null && l.out != null);
      const hours = done.reduce((n, l) => n + (l.out - l.in) / 60, 0);
      setText(total.v, String(nIn + nOut));
      setText(ins.v, String(nIn));
      setText(outs.v, String(nOut));
      setText(work.v, fmt.hm(hours));
      setText(avg, done.length ? fmt.hm(hours / done.length) : '0h 0m');
      setText(incomplete, String(logs.filter((l) => (l.in == null) !== (l.out == null)).length));

      // Each log becomes a TIME IN entry and a TIME OUT entry. An overnight time-out lands on the next date.
      const entries = [];
      logs.filter((l) => !st.date || l.date === st.date).forEach((l) => {
        const base = dayIndex(l.date) * 1440;
        if (l.in != null) entries.push({ kind: 'in', abs: base + l.in, date: l.date, min: l.in, loc: l.inLoc });
        if (l.out != null) entries.push({ kind: 'out', abs: base + l.out, date: TK.addDays(l.date, Math.floor(l.out / 1440)), min: l.out, loc: l.outLoc });
      });
      entries.sort((a, b) => a.abs - b.abs).forEach((e, i) => { e.n = i + 1; });
      entries.reverse();
      setText(count, `Time Entries (${entries.length})`);
      list.replaceChildren(...(entries.length ? entries.map((e) => h('li', { class: 'm-entry m-entry-' + e.kind },
        h('div', { class: 'm-entry-head' }, h('span', { class: 'm-entry-n', text: '#' + e.n }),
          h('strong', { text: opWord(e.kind) }), h('span', { class: 'm-entry-time', text: fmt.time(e.min) })),
        h('p', { class: 'm-entry-meta', text: fmt.date(e.date) }),
        h('p', { class: 'm-entry-meta', text: e.loc || 'Location unavailable' })))
        : [h('li', { class: 'm-entries-empty' }, h('strong', { text: 'No time entries found' }), h('p', { text: 'Complete your first time in to see entries here' }))]));
    }
    return { el, update(s, fresh) { if (fresh) draw(s); } };
  }

  // ---------------------------------------------------------------- Payslip

  const REQ = {
    requested: ['Requested', 'badge-info'], processing: ['Processing', 'badge-warn'],
    printed: ['Printed', 'badge-ok'], delivered: ['Delivered', 'badge-ok'],
  };

  async function requestPaper() {
    const s = TK.getState();
    if (TK.requestFor(s, s.guardId)) return dialog('Already Requested', 'You already requested a paper copy of this payslip. Its status is shown on the payslip.');
    const ok = await dialog('Request Paper', `Request a printed copy of your ${TK.PERIOD.label} payslip? The office prints it and delivers it to your post.`,
      [{ label: 'Cancel', value: null }, { label: 'Request', value: true, kind: 'primary' }]);
    if (!ok) return;
    TK.dispatch({ type: A.REQUEST_PAPER, guardId: TK.getState().guardId });
    TK.announce('Paper copy requested. Status: Requested.');
  }

  function buildPayslip() {
    const el = h('div', { class: 'm-pad' });
    let shown = null, chip = null;
    const row = (label, value, cls) => h('div', { class: 'm-prow' + (cls ? ' ' + cls : '') }, h('dt', { text: label }), h('dd', { text: value }));
    const section = (title, rows) => h('section', { class: 'm-psec' }, h('h5', { text: title }), h('dl', null, rows.filter(Boolean)));
    const select = (id, label, opt) => h('div', { class: 'field' }, h('label', { class: 'label', for: id, text: label }),
      h('select', { id, class: 'select' }, h('option', { text: opt })));
    const neg = (n) => fmt.money(-n);

    function full(slip) {
      const t = slip.totals, P = TK.PERIOD;
      chip = h('span', { class: 'badge m-pchip', hidden: true });
      return [
        // Only periods with an issued payslip are listed, so there is one choice of each.
        h('div', { class: 'm-pselects' }, select('m-pyear', 'Select Year', P.start.slice(0, 4)), select('m-pmonth', 'Select Month', 'October')),
        h('article', { class: 'm-pcard', 'aria-labelledby': 'm-ptitle' },
          h('div', { class: 'm-pcard-head' }, h('h4', { id: 'm-ptitle', text: 'Payslip' }),
            h('div', { class: 'm-pbtns' }, btn('Request Paper', requestPaper, 'btn btn-sm m-bbtn'),
              btn('Download', () => dialog('Download', 'Demo: no file is created. The real app prints this breakdown to a PDF and opens the share sheet.')))),
          chip,
          h('dl', { class: 'm-pmeta' }, row('Period:', `${fmt.dateShort(P.start)} – ${fmt.dateShort(P.end)}`), row('Client:', slip.postName), row('Sequence:', '#' + P.seq)),
          section('Employee Details', [row('Name', slip.name), row('Employee No.', slip.empNo), row('Role', TK.ROLES[slip.role]), row('Shift', slip.shift === 'night' ? 'Night' : 'Day')]),
          section('Work Details', [row('Days worked', String(t.workingDays)), row('Hours worked', fmt.hm(t.hours)),
            t.otHours > 0 && row('Overtime', fmt.hm(t.otHours)), row('Daily wage', fmt.money(slip.rates.daily)),
            row('Basic pay', fmt.money(t.basic)), t.otPay > 0 && row('Overtime pay', fmt.money(t.otPay))]),
          section('Others', [row('Allowance', fmt.money(t.allowance)), row('Uniform', fmt.money(t.uniform)),
            row('Holiday pay', fmt.money(t.regHolPay + t.specHolPay)), row('Night differential', fmt.money(t.ndPay)),
            row('Rest-day pay', fmt.money(t.restDayPay)), slip.role === 3 && row('Officer allowance', fmt.money(t.officer))]),
          section('Deductions', [row('Social fund', neg(t.social.ee), 'is-neg'), row('Health fund', neg(t.health.ee), 'is-neg'),
            row('Housing fund', neg(t.housing.ee), 'is-neg'), row('Cash bond', neg(t.cashBond), 'is-neg')]),
          h('div', { class: 'm-ptotals' },
            h('p', { class: 'm-gross' }, h('span', { text: 'GROSS PAY:' }), h('span', { text: fmt.money(t.gross) })),
            h('p', { class: 'm-net' }, h('span', { text: 'NET PAY:' }), h('span', { text: fmt.money(t.net) })))),
      ];
    }

    function draw(s) {
      const slip = TK.payslipFor(s, s.guardId);
      // Rebuild only when a payslip is issued or replaced; the request chip updates in place so the
      // Request Paper button keeps focus.
      const key = slip ? `${s.payroll.issued.n}|${s.guardId}` : 'none';
      if (key !== shown) {
        shown = key;
        el.replaceChildren(...(slip ? full(slip) : [h('div', { class: 'm-pempty' }, logo('m-pempty-logo'),
          h('h4', { text: 'No payslips yet' }),
          h('p', { text: `Payroll is computed on the web console. Finalize the ${TK.PERIOD.label.replace(/, \d+$/, '')} cut-off there to issue this payslip.` }))]));
      }
      if (!slip) return;
      const req = TK.requestFor(s, s.guardId);
      chip.hidden = !req;
      if (req) { setText(chip, 'Paper copy: ' + REQ[req.status][0]); setAttr(chip, 'class', 'badge m-pchip ' + REQ[req.status][1]); }
    }
    return { el, update(s, fresh) { if (fresh) draw(s); } };
  }

  // ---------------------------------------------------------------- screens and rendering

  function buildScreens(s) {
    clearFace();
    Object.values(screens).forEach((sc) => { if (sc) sc.el.remove(); });
    screens = { home: buildHome(), members: buildMembers(), reports: buildReports(s), payslip: buildPayslip() };
    ph.screen.append(screens.home.el, screens.members.el, screens.reports.el, screens.payslip.el);
    showOnly('home');
  }

  function showOnly(name) {
    ui.screen = name;
    Object.entries(screens).forEach(([k, sc]) => { if (sc) sc.el.hidden = k !== name; });
    ph.screen.scrollTop = 0;
  }

  function go(name, say = true) {
    if (ui.screen === 'face' && name !== 'face' && screens.face) {
      clearFace();
      screens.face.el.remove();
      screens.face = null;
    }
    showOnly(name);
    refresh();
    if (say && LABELS[name]) TK.announce(`${LABELS[name]} screen.`);
  }

  // Announces entering or leaving the post's radius, and arrival, for the guard on the phone.
  let watch = null;
  function watchProximity(s, action) {
    const gid = s.guardId, prox = TK.proximity(s, gid);
    if (watch && watch.gid === gid && action.type !== A.RESET) {
      const p = myPost(s), c = TK.canClock(s, gid), msgs = [];
      if (prox.arrived && !watch.arrived) msgs.push(`Arrived at ${p.name}.`);
      if (prox.inside !== watch.inside) {
        if (prox.inside) {
          const gate = c.enabled ? `${opWord(c.op)} is available.` : c.status === 'completed' ? 'Today is already complete.'
            : c.alert ? `${opWord(c.op)} is locked: ${c.alert.title}.` : '';
          msgs.push(`Inside the ${prox.radius} m radius of ${p.name}. ${gate}`);
        } else {
          msgs.push(`Left the ${prox.radius} m radius of ${p.name}.${c.op ? ` ${opWord(c.op)} is locked.` : ''}`);
        }
      }
      if (msgs.length) TK.announce(msgs.join(' ').trim());
    }
    watch = { gid, inside: prox.inside, arrived: prox.arrived };
  }

  // On TICK only time- and distance-bound nodes change, unless the minute rolled over or a scripted
  // check-in landed (both can change lists).
  function render(s, prev, action) {
    const fresh = action.type !== A.TICK || TK.nowMin(s) !== TK.nowMin(prev) || actKey(s) !== actKey(prev);
    updateControls(s);
    updateLiveMap(s);
    updateChrome(s);
    const sc = screens[ui.screen];
    if (sc) sc.update(s, fresh);
    watchProximity(s, action);
  }
  function refresh() {
    const s = TK.getState();
    render(s, s, { type: 'LOCAL' });
  }

  // Reset and a guard change return the phone to a clean Home: digital 12H clock, overlays closed,
  // face timers cleared, filters cleared.
  function localReset(s, full) {
    closeDialog(null, false);
    if (ui.drawer) closeDrawer(false);
    ui.h24 = false;
    ui.view = 'digital';
    if (full) ui.attempt = 0;
    buildScreens(s);
  }

  ctlMount.append(buildControls());
  if (mapMount) { mapMount.append(...buildLiveMap()); mountLiveMap(); } // measured once it is in the page
  mount.append(buildPhone());
  buildScreens(TK.getState());
  refresh();

  TK.subscribe((s, action, prev) => {
    if (action.type === A.RESET || action.type === A.SELECT_GUARD) localReset(s, action.type === A.RESET);
    render(s, prev, action);
  });
}());
