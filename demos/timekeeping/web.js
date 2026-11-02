// Admin web console for the fictional timekeeping demo. It draws a browser-window mock of the payroll and
// timekeeping console inside #web-app and reads everything through window.TK: the dashboard, the attendance
// table for the cut-off, schedules and geofence radius, leave approvals, the payroll run and issued payslips.
// Every name, post, rate and amount comes from the invented dataset in core.js. Nothing is stored or sent.
(function () {
  'use strict';

  const TK = window.TK;
  const mount = document.getElementById('web-app');
  if (!TK || !mount) return;
  const { h, fmt, A, TODAY, PERIOD } = TK;
  const money = fmt.money;

  // ---------------------------------------------------------------- small helpers

  const pad2 = (n) => String(n).padStart(2, '0');
  const hmm = (min) => { const m = Math.max(0, Math.round(min)); return `${Math.floor(m / 60)}:${pad2(m % 60)}`; };
  const hhmmLabel = (min) => { const m = Math.max(0, Math.round(min)); return `${pad2(Math.floor(m / 60))}h:${pad2(m % 60)}m`; };
  const toInputTime = (min) => { const m = ((Math.round(min) % 1440) + 1440) % 1440; return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`; };
  const fromInputTime = (v) => { const m = /^(\d{2}):(\d{2})/.exec(v || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
  const dayDiff = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
  const lc = (v) => String(v == null ? '' : v).toLowerCase();
  const matches = (q, ...fields) => !q || fields.some((f) => lc(f).includes(lc(q).trim()));
  const td = (v, cls) => h('td', { class: cls || null }, v);
  const badge = (tone, text) => h('span', { class: `badge badge-${tone}`, text });
  const leaveName = (type) => `${type} · ${TK.LEAVE_TYPES[type] || type}`;
  const REQ = {
    requested: { label: 'Requested', tone: 'info', next: 'Mark as Processing' },
    processing: { label: 'Processing', tone: 'warn', next: 'Mark as Printed' },
    printed: { label: 'Printed', tone: 'ok', next: 'Mark as Delivered' },
    delivered: { label: 'Delivered', tone: 'ok', next: null },
  };

  // Simple stroke icons on a 24-unit grid, drawn inline so nothing is fetched.
  const ICONS = {
    dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    payroll: 'M2 6h20v12H2zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M6 12h.01M18 12h.01',
    reports: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8',
    leave: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18M10 13l4 4M14 13l-4 4',
    attendance: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7v5l3 2',
    schedule: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 7.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    check: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M8 12l3 3 5-6',
    late: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7v6M12 16.5v.01',
    absent: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M9 9l6 6M15 9l-6 6',
    building: 'M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2M3 21h18',
    menu: 'M3 6h18M3 12h18M3 18h18',
    close: 'M6 6l12 12M18 6L6 18',
  };
  function icon(name) {
    const s = TK.svg('svg', { viewBox: '0 0 24 24', class: 'w-icon', 'aria-hidden': 'true', focusable: 'false' });
    TK.svg('path', { d: ICONS[name] }, s);
    return s;
  }
  // An invented mark, not the client's logo: a shield holding a small lantern.
  function logo() {
    const s = TK.svg('svg', { viewBox: '0 0 32 32', class: 'w-logo', 'aria-hidden': 'true', focusable: 'false' });
    TK.svg('path', { class: 'w-logo-shield', d: 'M16 2 L28 6.5 V15 C28 22 22.8 27.4 16 30 C9.2 27.4 4 22 4 15 V6.5 Z' }, s);
    TK.svg('path', { class: 'w-logo-lamp', d: 'M14 9 V7.5 a2 2 0 0 1 4 0 V9 M12 10 h8 l-1 10 h-6 Z M11 22.5 h10' }, s);
    TK.svg('circle', { class: 'w-logo-flame', cx: 16, cy: 15, r: 2.2 }, s);
    return s;
  }

  function field(id, label, control, hint) {
    return h('div', { class: 'field' }, h('label', { class: 'label', for: id, text: label }), control,
      hint ? h('p', { class: 'hint', text: hint }) : null);
  }
  function selectField(id, label, options, value, onchange) {
    const sel = h('select', { id, class: 'select', onchange: (e) => onchange(e.target.value) },
      options.map(([v, t]) => h('option', { value: v, selected: v === value }, t)));
    return field(id, label, sel);
  }
  function searchField(id, value, placeholder, oninput) {
    return field(id, 'Search', h('input', { type: 'search', id, class: 'input', value, placeholder, autocomplete: 'off',
      oninput: (e) => oninput(e.target.value) }));
  }
  function card(title, sub, ...kids) {
    return h('section', { class: 'card w-card' },
      h('div', { class: 'w-card-head' }, h('h4', { class: 'w-card-title', text: title }), sub ? h('p', { class: 'w-card-sub', text: sub }) : null),
      ...kids);
  }
  // A table in its own horizontal scroller, so wide tables never push the page sideways.
  function table(caption, head, rows, opts = {}) {
    const t = h('table', { class: 'table' },
      h('caption', { class: 'sr-only', text: caption }),
      h('thead', {}, h('tr', {}, head.map((c) => {
        const [label, cls] = Array.isArray(c) ? c : [c, null];
        return h('th', { scope: 'col', class: cls }, label);
      }))),
      h('tbody', {}, rows),
      opts.foot ? h('tfoot', {}, opts.foot) : null);
    if (opts.minWidth) t.style.minWidth = opts.minWidth + 'px';
    return h('div', { class: 'table-wrap', tabindex: '0', role: 'region', 'aria-label': caption }, t);
  }

  // ---------------------------------------------------------------- realtime highlight

  // Rows that arrive while the console is open (a time-in, a time-out, a new activity line) are flagged for
  // two seconds. The fade is a CSS animation; a negative delay keeps it in step when the row is redrawn.
  const NEW_MS = 2000;
  const fresh = new Map();
  let seenLogs = new Map();
  let seenAct = new Set();
  const logStage = (l) => (l.in != null ? 'i' : '') + (l.out != null ? 'o' : '');
  const actKey = (a) => a.date + '|' + a.sec + '|' + a.text;
  function primeFresh(s) {
    fresh.clear();
    seenLogs = new Map(s.logs.map((l) => [l.id, logStage(l)]));
    seenAct = new Set(s.activity.map(actKey));
  }
  function trackFresh(s) {
    const t = performance.now();
    s.logs.forEach((l) => {
      const st = logStage(l);
      if (seenLogs.get(l.id) !== st) { seenLogs.set(l.id, st); fresh.set('log:' + l.id, t); }
    });
    s.activity.forEach((a) => {
      const k = actKey(a);
      if (!seenAct.has(k)) { seenAct.add(k); fresh.set('act:' + k, t); }
    });
  }
  function freshAge(key) {
    const t = fresh.get(key);
    if (t == null) return null;
    const age = performance.now() - t;
    if (age >= NEW_MS) { fresh.delete(key); return null; }
    return age;
  }
  function markNew(el, key) {
    const age = freshAge(key);
    if (age == null) return el;
    el.classList.add('is-new');
    el.style.animationDelay = `-${Math.round(age)}ms`;
    return el;
  }
  const freshSig = () => [...fresh.keys()].filter((k) => freshAge(k) != null).join(',');

  // ---------------------------------------------------------------- local UI state

  const defaultUI = () => ({
    page: 'dashboard',
    att: { date: TODAY, h24: false, q: '', sort: 'name' },
    sch: { q: '' },
    leave: { q: '', status: 'all' },
    pay: { q: '', sort: 'empNo' },
    rep: { q: '', tab: 'slips', summary: true },
  });
  let ui = defaultUI();

  // ---------------------------------------------------------------- frame: chrome, navbar, strip, drawer

  const frame = h('div', { class: 'w-frame' });
  const chrome = h('div', { class: 'w-chrome', 'aria-hidden': 'true' },
    h('span', { class: 'w-dots' }, h('i'), h('i'), h('i')),
    h('span', { class: 'w-url' }, h('span', { class: 'w-lock' }), TK.BRAND.host));

  const clockText = h('span', { class: 'w-clock-text' });
  const userBtn = h('button', { type: 'button', class: 'w-user-btn', 'aria-expanded': 'false', 'aria-controls': 'w-user-menu',
    'aria-label': 'Account: Admin (demo)', onclick: () => (userMenu.hidden ? openMenu() : closeMenu(true)) },
  h('span', { class: 'w-avatar', 'aria-hidden': 'true', text: 'A' }), h('span', { class: 'w-user-name', 'aria-hidden': 'true', text: 'Admin' }));
  const userMenu = h('div', { id: 'w-user-menu', class: 'w-user-menu', hidden: true },
    h('div', { class: 'w-user-head' }, h('span', { class: 'w-avatar w-avatar-lg', 'aria-hidden': 'true', text: 'A' }),
      h('p', {}, 'Welcome back, ', h('strong', { text: 'Admin (demo)' }))),
    h('button', { type: 'button', class: 'btn btn-sm btn-block', disabled: true, text: 'Log out (demo)' }),
    h('p', { class: 'hint', text: 'The demo has no login.' }));
  const userWrap = h('div', { class: 'w-user' }, userBtn, userMenu);

  const navbar = h('div', { class: 'w-navbar' },
    h('div', { class: 'w-brand' }, logo(), h('div', { class: 'w-brand-text' },
      h('span', { class: 'w-brand-name', text: TK.BRAND.short }), h('span', { class: 'w-brand-sub', text: TK.BRAND.console }))),
    h('div', { class: 'w-clock' }, h('span', { class: 'w-live' }, h('span', { class: 'w-live-dot', 'aria-hidden': 'true' }), 'Live'), clockText),
    userWrap);

  const burger = h('button', { type: 'button', class: 'w-burger', 'aria-label': 'Open navigation', 'aria-expanded': 'false',
    'aria-controls': 'w-drawer', onclick: () => openDrawer() }, icon('menu'));
  const crumb = h('span', { class: 'w-crumb' });
  const strip = h('div', { class: 'w-strip' }, burger, crumb);

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { group: 'Finance', items: [
      { id: 'payroll', label: 'Payroll', icon: 'payroll' },
      { id: 'reports', label: 'Reports', icon: 'reports' },
      { id: 'leave', label: 'Manage Leave', icon: 'leave' },
    ] },
    { id: 'attendance', label: 'Attendance', icon: 'attendance' },
    { id: 'schedule', label: 'Schedule', icon: 'schedule' },
  ];
  const navButtons = [];
  const navItem = (it) => {
    const b = h('button', { type: 'button', class: 'w-menu-item', onclick: () => go(it.id) }, icon(it.icon), h('span', { text: it.label }));
    b.dataset.page = it.id;
    navButtons.push(b);
    return h('li', {}, b);
  };
  const drawer = h('nav', { id: 'w-drawer', class: 'w-drawer', 'aria-label': 'Console navigation' },
    h('div', { class: 'w-drawer-head' }, h('span', { text: 'Menu' }),
      h('button', { type: 'button', class: 'btn btn-ghost btn-sm w-drawer-close', 'aria-label': 'Close navigation', onclick: () => closeDrawer(true) }, icon('close'))),
    h('ul', { class: 'w-menu' }, NAV.map((it) => (it.group
      ? h('li', { class: 'w-menu-group' }, h('span', { class: 'w-menu-group-label', id: 'w-nav-' + lc(it.group), text: it.group }),
        h('ul', { 'aria-labelledby': 'w-nav-' + lc(it.group) }, it.items.map(navItem)))
      : navItem(it)))));
  const scrim = h('div', { class: 'w-scrim', onclick: () => closeDrawer(true) });
  const main = h('div', { class: 'w-main', id: 'w-main' });
  const contentEl = h('div', { class: 'w-content', tabindex: '-1' });
  frame.append(chrome, navbar, strip, h('div', { class: 'w-body' }, drawer, scrim, main));
  mount.append(frame);

  // The drawer is a pinned sidebar when the frame is wide (CSS container query hides the hamburger then) and an
  // overlay otherwise. While the overlay is open the rest of the console is inert and Tab stays inside it.
  const pinned = () => getComputedStyle(burger).display === 'none';
  const drawerOpen = () => frame.classList.contains('is-drawer-open');
  function openDrawer() {
    if (pinned()) return;
    frame.classList.add('is-drawer-open');
    burger.setAttribute('aria-expanded', 'true');
    [navbar, main].forEach((el) => { el.inert = true; });
    const current = navButtons.find((b) => b.dataset.page === ui.page) || navButtons[0];
    setTimeout(() => current.focus(), TK.reducedMotion() ? 0 : 60);
  }
  function closeDrawer(returnFocus) {
    if (!drawerOpen()) return;
    frame.classList.remove('is-drawer-open');
    burger.setAttribute('aria-expanded', 'false');
    [navbar, main].forEach((el) => { el.inert = false; });
    if (returnFocus) burger.focus();
  }
  drawer.addEventListener('keydown', (e) => {
    if (!drawerOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(true); return; }
    if (e.key !== 'Tab') return;
    const items = [...drawer.querySelectorAll('button')].filter((b) => b.offsetParent !== null);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // Growing past the breakpoint while the overlay is open would leave the console inert, so close it.
  if (window.ResizeObserver) new ResizeObserver(() => { if (drawerOpen() && pinned()) closeDrawer(false); }).observe(frame);

  function openMenu() {
    userMenu.hidden = false;
    userBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu(returnFocus) {
    if (userMenu.hidden) return;
    userMenu.hidden = true;
    userBtn.setAttribute('aria-expanded', 'false');
    if (returnFocus) userBtn.focus();
  }
  document.addEventListener('click', (e) => { if (!userMenu.hidden && !userWrap.contains(e.target)) closeMenu(false); });
  userWrap.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !userMenu.hidden) { e.preventDefault(); closeMenu(true); } });

  const setClock = (s) => { clockText.textContent = `${fmt.date(TODAY)} · ${fmt.time(TK.nowMin(s))}`; };

  // ---------------------------------------------------------------- modals

  // Native <dialog> modals appended inside #web-app. Escape closes them natively; focus returns to the
  // button that opened them, or to the same button after a redraw (matched by its data-k key).
  const modals = new Set();
  let modalSeq = 0;
  function openModal({ title, wide, build, foot, live }) {
    const trigger = document.activeElement;
    const triggerKey = trigger && trigger.dataset ? trigger.dataset.k : null;
    const id = 'w-modal-' + (++modalSeq);
    const body = h('div', { class: 'modal-body', tabindex: '-1' });
    const footEl = h('div', { class: 'modal-foot' });
    const dlg = h('dialog', { class: 'modal w-modal' + (wide ? ' modal-wide' : ''), 'aria-labelledby': id },
      h('div', { class: 'modal-head' }, h('h3', { id, text: title }),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-label': 'Close', onclick: () => dlg.close() }, icon('close'))),
      body, footEl);
    const m = { dlg, body, live, silent: false, close: () => dlg.close() };
    m.refresh = () => rebuild(body, () => build(TK.getState(), m));
    dlg.addEventListener('close', () => {
      modals.delete(m);
      dlg.remove();
      if (!m.silent) restoreFocus(trigger, triggerKey);
    });
    body.append(build(TK.getState(), m));
    const footKids = (foot ? foot(m) : [h('button', { type: 'button', class: 'btn', onclick: () => dlg.close() }, 'Close')]).filter(Boolean);
    footEl.append(...footKids);
    mount.append(dlg);
    modals.add(m);
    dlg.showModal();
    return m;
  }
  function restoreFocus(el, key) {
    if (el && el.isConnected && !el.closest('[inert]')) { el.focus(); return; }
    const again = key && mount.querySelector(`[data-k="${CSS.escape(key)}"]`);
    if (again) again.focus();
    else if (pageHeading) pageHeading.focus();
  }

  // Redraws a container, keeping the focused control (by data-k) and the scroll of any wide table.
  function rebuild(container, build) {
    const active = document.activeElement;
    const hadFocus = container.contains(active);
    const key = hadFocus && active.dataset ? active.dataset.k : null;
    const scrolls = [...container.querySelectorAll('.table-wrap')].map((el) => el.scrollLeft);
    container.replaceChildren(build());
    container.querySelectorAll('.table-wrap').forEach((el, i) => { if (scrolls[i]) el.scrollLeft = scrolls[i]; });
    if (hadFocus) {
      const again = key && container.querySelector(`[data-k="${CSS.escape(key)}"]`);
      (again || container).focus();
    }
  }

  function confirmModal(title, message, okLabel, onOk) {
    openModal({
      title,
      build: () => h('p', { class: 'w-confirm', text: message }),
      foot: (m) => [
        h('button', { type: 'button', class: 'btn', onclick: () => m.close() }, 'Cancel'),
        h('button', { type: 'button', class: 'btn btn-primary', autofocus: true, onclick: () => { m.close(); onOk(); } }, okLabel),
      ],
    });
  }

  // ---------------------------------------------------------------- pages

  let pageHeading = null;
  let lastKey = '';

  function go(page) {
    closeDrawer(false);
    ui.page = page;
    enterPage(true);
    TK.announce(`${PAGES[page].title} page.`);
  }

  function enterPage(focusHeading) {
    const p = PAGES[ui.page];
    pageHeading = h('h3', { class: 'w-title', id: 'w-page-title', tabindex: '-1', text: p.title });
    main.replaceChildren(...[
      h('header', { class: 'w-hcard' }, pageHeading, h('p', { class: 'w-sub', text: p.sub })),
      p.filters ? h('div', { class: 'card w-fcard' }, p.filters()) : null,
      contentEl,
    ].filter(Boolean));
    contentEl.setAttribute('aria-labelledby', 'w-page-title');
    navButtons.forEach((b) => { if (b.dataset.page === ui.page) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    crumb.textContent = `Console / ${p.title}`;
    refresh(true);
    if (focusHeading) pageHeading.focus();
  }

  // Redraws the page content when its data changed (the page key) or when a filter asks for it.
  function refresh(force) {
    const s = TK.getState();
    const p = PAGES[ui.page];
    const key = p.key(s) + '#' + freshSig();
    if (!force && key === lastKey) return;
    lastKey = key;
    rebuild(contentEl, () => p.content(s));
  }

  // ---------- Dashboard

  const KPI_DEFS = [
    { k: 'active', label: 'Active', tone: 'blue', icon: 'users', good: 1, note: 'timed in today' },
    { k: 'onTime', label: 'On-time', tone: 'green', icon: 'check', good: 1, note: 'inside the grace window' },
    { k: 'late', label: 'Late', tone: 'amber', icon: 'late', good: -1, note: 'past the grace window' },
    { k: 'absent', label: 'Absences', tone: 'red', icon: 'absent', good: -1, note: 'no time-in after the cutoff' },
    { k: 'pendingLeaves', label: 'Leave Requests', tone: 'purple', icon: 'leave', good: 0, note: 'waiting for review' },
    { k: 'posts', label: 'Total Clients', tone: 'orange', icon: 'building', good: 0, note: 'posts on contract' },
  ];
  function kpiCard(def, now, before) {
    const d = now[def.k] - before[def.k];
    const tone = d === 0 || !def.good ? 'idle' : d * def.good > 0 ? 'ok' : 'bad';
    const delta = d === 0 ? 'Same as yesterday' : `${d > 0 ? '+' : '−'}${Math.abs(d)} vs yesterday`;
    return h('div', { class: `w-kpi w-kpi-${def.tone}` },
      h('span', { class: 'w-kpi-icon' }, icon(def.icon)),
      h('div', { class: 'w-kpi-body' },
        h('p', { class: 'w-kpi-label', text: def.label }),
        h('p', { class: 'w-kpi-num', text: String(now[def.k]) }),
        h('p', { class: 'w-kpi-note', text: def.note }),
        badge(tone, delta)));
  }

  const last7 = () => [6, 5, 4, 3, 2, 1, 0].map((n) => TK.addDays(TODAY, -n));

  // 7-day attendance line. Days without scheduled shifts break the line and say so. The SVG is decorative;
  // a visually hidden table carries the same numbers for screen readers.
  function rateCard(s) {
    const rates = last7().map((d) => TK.attendanceRate(s, d));
    const known = rates.filter((r) => r.pct != null);
    const avg = known.length ? Math.round(known.reduce((n, r) => n + r.pct, 0) / known.length) : null;
    const status = avg == null ? ['idle', 'No data'] : avg >= 95 ? ['ok', 'Above Target'] : avg >= 90 ? ['warn', 'Below Target'] : ['bad', 'Needs Attention'];
    const W = 640, H = 230, L = 44, R = 18, T = 22, B = 44;
    const x = (i) => L + ((W - L - R) * i) / 6;
    const y = (v) => T + (H - T - B) * (1 - v / 100);
    const root = TK.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-chart', 'aria-hidden': 'true', focusable: 'false' });
    [0, 25, 50, 75, 100].forEach((v) => {
      TK.svg('line', { class: 'w-chart-grid', x1: L, x2: W - R, y1: y(v), y2: y(v) }, root);
      TK.svg('text', { class: 'w-chart-axis', x: L - 8, y: y(v) + 4, 'text-anchor': 'end', text: v + '%' }, root);
    });
    TK.svg('line', { class: 'w-chart-target', x1: L, x2: W - R, y1: y(95), y2: y(95) }, root);
    const segs = [];
    let seg = [];
    rates.forEach((r, i) => {
      if (r.pct == null) { if (seg.length) segs.push(seg); seg = []; } else seg.push([x(i), y(r.pct)]);
    });
    if (seg.length) segs.push(seg);
    segs.forEach((sg) => {
      const pts = sg.map((q) => q.join(',')).join(' ');
      if (sg.length > 1) TK.svg('polygon', { class: 'w-chart-area', points: `${pts} ${sg[sg.length - 1][0]},${y(0)} ${sg[0][0]},${y(0)}` }, root);
      TK.svg('polyline', { class: 'w-chart-line', points: pts }, root);
    });
    rates.forEach((r, i) => {
      if (r.pct != null) {
        TK.svg('circle', { class: 'w-chart-pt', cx: x(i), cy: y(r.pct), r: 5 }, root);
        TK.svg('text', { class: 'w-chart-val', x: x(i), y: r.pct >= 88 ? y(r.pct) + 20 : y(r.pct) - 10, 'text-anchor': 'middle', text: r.pct + '%' }, root);
      } else {
        TK.svg('text', { class: 'w-chart-gap', x: x(i), y: y(50), 'text-anchor': 'middle', text: 'no shifts' }, root);
      }
      TK.svg('text', { class: 'w-chart-axis', x: x(i), y: H - B + 18, 'text-anchor': 'middle', text: fmt.date(r.date).split(',')[0] }, root);
      TK.svg('text', { class: 'w-chart-axis', x: x(i), y: H - B + 34, 'text-anchor': 'middle', text: fmt.dateShort(r.date) }, root);
    });
    const data = h('table', { class: 'sr-only' },
      h('caption', { text: '7-day attendance rate' }),
      h('thead', {}, h('tr', {}, ['Date', 'Present', 'Scheduled', 'Rate'].map((c) => h('th', { scope: 'col', text: c })))),
      h('tbody', {}, rates.map((r) => h('tr', {}, h('th', { scope: 'row', text: fmt.date(r.date) }), td(String(r.present)), td(String(r.scheduled)),
        td(r.pct == null ? 'no shifts' : r.pct + '%' + (r.date === TODAY ? ' (today so far)' : ''))))));
    return h('section', { class: 'card w-card w-span' },
      h('div', { class: 'w-card-head w-card-head-row' },
        h('div', {}, h('h4', { class: 'w-card-title', text: '7-day Attendance Rate' }),
          h('p', { class: 'w-card-sub', text: avg == null ? 'No scheduled shifts this week.' : `Weekly average ${avg}% · today counts the guards in so far` })),
        badge(status[0], status[1])),
      h('div', { class: 'w-chart-box' }, root),
      h('ul', { class: 'legend w-chart-legend', 'aria-hidden': 'true' },
        h('li', {}, h('span', { class: 'w-key w-key-line' }), 'Attendance rate'),
        h('li', {}, h('span', { class: 'w-key w-key-target' }), '95% target')),
      data);
  }

  const MEMBER_TONE = { ontime: 'ok', late: 'warn', absent: 'bad', duty: 'info', rest: 'idle', leave: 'idle' };
  function todayCard(s) {
    return card('Today on post', 'Live status per guard. Rows flash when a clock event syncs.',
      h('ul', { class: 'w-list' }, TK.GUARDS.map((g) => {
        const st = TK.memberStatus(s, g.id);
        const log = s.logs.find((l) => l.gid === g.id && l.date === TODAY);
        const li = h('li', { class: 'w-list-row' },
          h('span', { class: 'w-list-main' }, h('strong', { text: g.name }), h('span', { class: 'w-muted', text: ` · ${TK.post(g.postId).code}` })),
          badge(MEMBER_TONE[st.key], st.label),
          h('span', { class: 'w-muted w-list-times', text: `In ${log && log.in != null ? fmt.time(log.in) : '—'} · Out ${log && log.out != null ? fmt.time(log.out) : '—'}` }));
        return log ? markNew(li, 'log:' + log.id) : li;
      })));
  }
  function activityCard(s) {
    return card('Recent Activity', 'Newest first. Clock rows from the phone land here as they sync.',
      h('ol', { class: 'w-list w-activity' }, s.activity.slice(0, 8).map((a) => markNew(h('li', { class: 'w-list-row' },
        h('span', { class: 'w-act-time', text: `${fmt.dateShort(a.date)} · ${fmt.time(a.sec / 60)}` }),
        h('span', { class: 'w-act-text', text: a.text })), 'act:' + actKey(a)))));
  }
  function approvalsCard(s) {
    const pending = s.leaves.filter((l) => l.status === 'pending').slice(0, 6);
    return card('Pending Approvals', null, pending.length
      ? h('ul', { class: 'w-list' }, pending.map((l) => h('li', { class: 'w-list-row' },
        h('span', { class: 'w-list-main' }, h('strong', { text: TK.guard(l.gid).name }),
          h('span', { class: 'w-muted', text: ` · ${leaveName(l.type)} · ${fmt.dateShort(l.from)}${l.to !== l.from ? ' – ' + fmt.dateShort(l.to) : ''}` })),
        h('button', { type: 'button', class: 'btn btn-sm btn-primary', 'data-k': 'review:' + l.id, onclick: () => go('leave') }, 'Review'))))
      : h('p', { class: 'empty', text: 'No leave requests waiting.' }));
  }
  function distributionCard(s) {
    const total = TK.GUARDS.length;
    return card('Client Distribution', 'Guards assigned per post', h('ul', { class: 'w-list' }, TK.POSTS.map((p) => {
      const gs = TK.GUARDS.filter((g) => g.postId === p.id);
      const pct = Math.round((gs.length / total) * 100);
      const onDuty = gs.filter((g) => TK.dayStatus(s, g.id) === 'open').length;
      const fill = h('span', { class: 'w-bar-fill' });
      fill.style.width = pct + '%';
      return h('li', { class: 'w-dist' },
        h('div', { class: 'w-dist-text' }, h('strong', { text: `${p.name} (${p.code})` }),
          h('span', { class: 'w-muted', text: `${gs.length} guard${gs.length === 1 ? '' : 's'} · ${pct}% · ${onDuty} on duty now` })),
        h('span', { class: 'w-bar', 'aria-hidden': 'true' }, fill));
    })));
  }
  function eventsCard() {
    const events = TK.HOLIDAYS.filter((e) => Math.abs(dayDiff(TODAY, e.date)) <= 7);
    return card('Calendar Events', 'Holidays within a week of today', events.length
      ? h('ul', { class: 'w-list' }, events.map((e) => {
        const n = dayDiff(TODAY, e.date);
        return h('li', { class: 'w-list-row' },
          h('span', { class: 'w-list-main' }, h('strong', { text: e.name }),
            h('span', { class: 'w-muted', text: ` · ${fmt.date(e.date)} · ${n === 0 ? 'today' : n < 0 ? `${-n} day${n === -1 ? '' : 's'} ago` : `in ${n} day${n === 1 ? '' : 's'}`}` })),
          badge(e.type === 'regular' ? 'info' : 'warn', e.type === 'regular' ? 'Regular holiday' : 'Special holiday +30%'));
      }))
      : h('p', { class: 'empty', text: 'No holidays this fortnight.' }));
  }

  // ---------- Attendance

  const STATUS_TONE = { completed: 'ok', progress: 'warn', review: 'bad', loading: 'idle' };

  // Punctuality remarks for one row: on time or late against the grace cutoff, undertime when the guard left
  // before the shift end, and overtime when the guard stayed 30 minutes or more past it.
  function remarks(l, sch) {
    const out = [];
    if (l.in != null) {
      const cutoff = sch.start + sch.grace;
      out.push(l.in > cutoff ? ['warn', `Late by ${hhmmLabel(l.in - cutoff)}`] : ['ok', 'On time']);
    }
    if (l.out != null) {
      const end = sch.overnight ? sch.end + 1440 : sch.end;
      if (l.out < end) out.push(['bad', `Undertime ${hhmmLabel(end - l.out)}`]);
      else if (l.out - end >= 30) out.push(['info', `Overtime ${hhmmLabel(l.out - end)}`]);
    }
    return out;
  }

  function attendanceRows(s) {
    const a = ui.att;
    const rows = TK.logsFor(s, { date: a.date }).map((l) => ({ l, g: TK.guard(l.gid), p: TK.post(l.postId), sch: TK.schedule(s, l.gid) }))
      .filter((r) => matches(a.q, r.g.name, r.g.empNo, r.p.name, r.p.code));
    const by = {
      name: (r) => r.g.name, id: (r) => r.g.empNo, client: (r) => r.p.name,
      in: (r) => (r.l.in == null ? 1e9 : r.l.in), out: (r) => (r.l.out == null ? 1e9 : r.l.out),
    }[a.sort];
    return rows.sort((x, y) => (by(x) < by(y) ? -1 : by(x) > by(y) ? 1 : 0));
  }

  function attendanceFilters() {
    const a = ui.att;
    const segBtns = ['12h', '24h'].map((label) => h('button', { type: 'button', 'aria-pressed': String((label === '24h') === a.h24),
      onclick: () => {
        a.h24 = label === '24h';
        segBtns.forEach((b) => b.setAttribute('aria-pressed', String((b.textContent === '24h') === a.h24)));
        refresh(true);
      } }, label));
    const date = h('input', { type: 'date', id: 'w-att-date', class: 'input', min: PERIOD.start, max: TODAY, value: a.date,
      onchange: (e) => {
        let v = e.target.value;
        if (!v || v < PERIOD.start) v = v ? PERIOD.start : TODAY;
        if (v > TODAY) v = TODAY;
        e.target.value = v;
        a.date = v;
        refresh(true);
      } });
    return h('div', { class: 'w-filters' },
      field('w-att-date', 'Date', date, `${fmt.dateShort(PERIOD.start)} – ${fmt.dateShort(TODAY)}`),
      h('div', { class: 'field' }, h('span', { class: 'label', id: 'w-att-fmt' }, 'Time format'),
        h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'w-att-fmt' }, segBtns)),
      searchField('w-att-q', a.q, 'Name, ID or client', (v) => { a.q = v; refresh(true); }),
      selectField('w-att-sort', 'Sort by', [['name', 'Name'], ['id', 'Employee ID'], ['client', 'Client'], ['in', 'Time in'], ['out', 'Time out']], a.sort,
        (v) => { a.sort = v; refresh(true); }),
      h('ul', { class: 'legend w-legend', 'aria-label': 'Status colours' },
        [['ok', 'Completed'], ['warn', 'In Progress'], ['bad', 'Needs Review'], ['idle', 'Loading']].map(([t, l]) =>
          h('li', {}, h('span', { class: 'dot dot-' + t }), l))));
  }

  function attendance(s) {
    const a = ui.att, h24 = a.h24;
    const rows = attendanceRows(s);
    const body = rows.map((r, i) => {
      const { l, g, p, sch } = r;
      const st = TK.attendanceStatus(l);
      const work = l.in != null && l.out != null ? l.out - l.in : null;
      const days = work != null ? Math.max(1, Math.ceil(work / 60 / 24)) : 0;
      const reg = work != null ? Math.min(work, days * 8 * 60) : null;
      const ot = work != null ? Math.max(0, work - days * 8 * 60) : null;
      const tr = h('tr', {},
        td(String(i + 1)),
        td(h('span', { class: 'w-status' }, h('span', { class: 'dot dot-' + STATUS_TONE[st.key], 'aria-hidden': 'true' }), st.label,
          l.overrides.length ? h('span', { class: 'w-mbadge', title: 'Manually overridden' }, 'M', h('span', { class: 'sr-only', text: ' (manually overridden)' })) : null), 'left'),
        td(g.empNo), td(g.name, 'left'), td(p.name, 'left'), td(fmt.range(sch.start, sch.end, h24)),
        td(h('span', { class: 'w-chips-inline' }, remarks(l, sch).map(([t, label]) => badge(t, label))), 'left'),
        td(fmt.dateShort(l.date)), td(l.in != null ? fmt.time(l.in, h24) : '—'),
        td(l.out != null ? fmt.dateShort(TK.addDays(l.date, Math.floor(l.out / 1440))) : '—'),
        td(l.out != null ? fmt.time(l.out, h24) : '—'),
        td(work != null ? hmm(work) : '—', 'num'), td(reg != null ? hmm(reg) : '—', 'num'), td(ot != null ? hmm(ot) : '—', 'num'),
        td(h('span', { class: 'w-actions' },
          h('button', { type: 'button', class: 'btn btn-primary btn-sm', 'data-k': 'view:' + l.id, 'aria-label': `View ${g.name}'s record`, onclick: () => openView(l.id) }, 'View'),
          l.overrides.length ? h('button', { type: 'button', class: 'btn btn-info btn-sm', 'data-k': 'hist:' + l.id, 'aria-label': `Override history for ${g.name}`, onclick: () => openHistory(l.id) }, 'History') : null,
          h('button', { type: 'button', class: 'btn btn-warn btn-sm', 'data-k': 'ovr:' + l.id, 'aria-label': `Override ${g.name}'s record`, onclick: () => openOverride(l.id) }, 'Override'))));
      return markNew(tr, 'log:' + l.id);
    });
    // Scheduled guards without a row: absent, on leave, or not in yet today.
    const missing = TK.GUARDS.map((g) => ({ g, st: TK.memberStatus(s, g.id, a.date) }))
      .filter(({ g, st }) => ['absent', 'leave', 'duty'].includes(st.key) && !s.logs.some((l) => l.gid === g.id && l.date === a.date));
    return card(`Records · ${fmt.date(a.date)}`, `${rows.length} row${rows.length === 1 ? '' : 's'} · cut-off ${PERIOD.label}`,
      rows.length
        ? table(`Attendance for ${fmt.date(a.date)}`, ['No.', ['Status', 'left'], 'Employee Number', ['Name', 'left'], ['Client', 'left'], 'Shift', ['Remarks', 'left'],
          'In Date', 'Time In', 'Out Date', 'Time Out', ['Work Hours', 'num'], ['Regular', 'num'], ['Overtime', 'num'], 'Actions'], body, { minWidth: 1100 })
        : h('p', { class: 'empty', text: 'No attendance yet — records will appear here once employees check in.' }),
      missing.length ? h('div', { class: 'w-missing' }, h('p', { class: 'label', text: 'No record on this date' }),
        h('ul', { class: 'w-chips-inline' }, missing.map(({ g, st }) => h('li', {}, badge(MEMBER_TONE[st.key], `${g.name} · ${st.key === 'absent' ? 'Absent' : st.label}`))))) : null);
  }

  function photo(label, bad) {
    const s = TK.svg('svg', { viewBox: '0 0 160 120', class: 'silhouette w-photo' + (bad ? ' is-bad' : ''), role: 'img',
      'aria-label': `Placeholder attendance photo, face box labelled ${label}` });
    TK.svg('circle', { class: 'sil-shape', cx: 80, cy: 52, r: 22 }, s);
    TK.svg('path', { class: 'sil-shape', d: 'M34 120 C36 94 58 82 80 82 C102 82 124 94 126 120 Z' }, s);
    TK.svg('rect', { class: 'sil-box', x: 52, y: 24, width: 56, height: 58, rx: 4 }, s);
    TK.svg('text', { class: 'w-photo-label', x: 80, y: 17, 'text-anchor': 'middle', text: label }, s);
    return s;
  }

  function openView(logId) {
    openModal({
      title: 'Attendance record',
      wide: true,
      live: (a) => [A.VERIFY, A.WRITE, A.OVERRIDE].includes(a.type),
      build: (s) => {
        const l = s.logs.find((x) => x.id === logId);
        if (!l) return h('p', { class: 'empty', text: 'This record is no longer available.' });
        const g = TK.guard(l.gid), p = TK.post(l.postId);
        const face = l.verify === 'failed' ? `Not ${g.name}` : l.verify === 'verified' ? `Detected Face: ${g.name}` : 'Checking the face…';
        const matchLine = l.match == null ? 'Match distance pending'
          : `Match distance ${l.match.toFixed(2)} (${l.match < 0.6 ? 'below 0.60 passes' : '0.60 or above fails'})`;
        const side = (kind, min, loc) => {
          const out = kind === 'out';
          const date = min == null ? null : TK.addDays(l.date, Math.floor(min / 1440));
          return h('section', { class: 'w-shot' },
            h('h4', { text: out ? 'Time Out' : 'Time In' }),
            min == null ? h('p', { class: 'empty', text: out ? 'Not timed out yet.' : 'No time-in recorded.' }) : [
              h('p', { class: 'w-shot-loc', text: loc || 'Location not recorded' }),
              h('p', { class: 'w-shot-face ' + (l.verify === 'failed' ? 'is-bad' : ''), text: face }),
              photo(l.verify === 'failed' ? 'No match' : g.name, l.verify === 'failed'),
              h('p', { class: 'hint', text: matchLine }),
              h('p', { class: 'w-shot-time ' + (out ? 'is-out' : 'is-in'), text: fmt.time(min) }),
              h('p', { class: 'w-muted', text: fmt.dateLong(date) }),
            ]);
        };
        return h('div', {},
          h('dl', { class: 'w-dl w-dl-row' },
            h('div', {}, h('dt', { text: 'ID' }), h('dd', { text: g.empNo })),
            h('div', {}, h('dt', { text: 'Full Name' }), h('dd', { text: g.name })),
            h('div', {}, h('dt', { text: 'Client' }), h('dd', { text: `${p.name} (${p.code})` })),
            h('div', {}, h('dt', { text: 'Captured via' }), h('dd', { text: { face: 'Face check', biometric: 'Biometric/PIN', offline: 'Offline queue' }[l.via] || l.via }))),
          h('div', { class: 'w-shots' }, side('in', l.in, l.inLoc), side('out', l.out, l.outLoc)),
          h('p', { class: 'hint', text: 'Photos are drawn placeholders. The demo never uses a camera.' }));
      },
    });
  }

  const fieldName = { in: 'Time In', out: 'Time Out', loc: 'Location' };
  const showVal = (v) => (v == null ? 'none' : typeof v === 'number' ? fmt.time(v) + (v >= 1440 ? ' (next day)' : '') : v);

  function openHistory(logId) {
    openModal({
      title: 'Override history',
      build: (s) => {
        const l = s.logs.find((x) => x.id === logId);
        if (!l || !l.overrides.length) return h('p', { class: 'empty', text: 'No overrides on this record.' });
        return h('div', {},
          h('p', { class: 'w-muted', text: `${TK.guard(l.gid).name} · ${fmt.date(l.date)}` }),
          h('ol', { class: 'w-history' }, l.overrides.map((o) => h('li', {},
            h('p', {}, h('strong', { text: fieldName[o.field] }), `: ${showVal(o.prev)} → ${showVal(o.next)}`),
            h('p', { text: `Reason: ${o.reason}` }),
            h('p', { class: 'w-muted', text: `${o.by} · ${fmt.dateShort(o.date)}, ${fmt.time(o.sec / 60)}` })))));
      },
    });
  }

  function openOverride(logId) {
    const s0 = TK.getState();
    const l0 = s0.logs.find((x) => x.id === logId);
    if (!l0) return;
    const g = TK.guard(l0.gid);
    const ctl = {};
    openModal({
      title: `Override · ${g.name}, ${fmt.dateShort(l0.date)}`,
      build: () => {
        const typeSel = h('select', { id: 'w-ovr-type', class: 'select', autofocus: true }, Object.entries(fieldName).map(([v, t]) => h('option', { value: v }, t)));
        const valueBox = h('div', {});
        const valueErr = h('p', { class: 'error', id: 'w-ovr-value-err', hidden: true });
        const reason = h('textarea', { id: 'w-ovr-reason', class: 'input', rows: '3', required: true, 'aria-required': 'true', placeholder: 'Why is this record being changed?' });
        const reasonErr = h('p', { class: 'error', id: 'w-ovr-reason-err', hidden: true, text: 'A reason is required for every override.' });
        reason.addEventListener('input', () => { if (reason.value.trim()) { reason.removeAttribute('aria-invalid'); reasonErr.hidden = true; } });
        const fill = () => {
          const l = TK.getState().logs.find((x) => x.id === logId) || l0;
          const f = typeSel.value;
          valueErr.hidden = true;
          if (f === 'loc') {
            ctl.value = h('input', { type: 'text', id: 'w-ovr-value', class: 'input', value: l.inLoc || '' });
            valueBox.replaceChildren(field('w-ovr-value', 'New location (time-in)', ctl.value, `Current: ${l.inLoc || 'none'}`));
          } else {
            const cur = l[f];
            ctl.value = h('input', { type: 'time', id: 'w-ovr-value', class: 'input', value: cur != null ? toInputTime(cur) : '' });
            valueBox.replaceChildren(field('w-ovr-value', `New ${fieldName[f].toLowerCase()}`, ctl.value, `Current: ${showVal(cur)}`));
          }
          valueBox.append(valueErr);
        };
        typeSel.addEventListener('change', fill);
        fill();
        Object.assign(ctl, { typeSel, reason, reasonErr, valueErr });
        return h('div', { class: 'w-form' },
          field('w-ovr-type', 'Override type', typeSel),
          valueBox,
          h('div', { class: 'field' }, h('label', { class: 'label', for: 'w-ovr-reason', text: 'Reason (required)' }), reason, reasonErr),
          h('p', { class: 'hint', text: 'Every change is kept in the record’s history with the reason and who made it.' }));
      },
      foot: (m) => [
        h('button', { type: 'button', class: 'btn', onclick: () => m.close() }, 'Cancel'),
        h('button', { type: 'button', class: 'btn btn-warn', onclick: () => {
          const l = TK.getState().logs.find((x) => x.id === logId);
          const f = ctl.typeSel.value;
          let value = f === 'loc' ? ctl.value.value.trim() : fromInputTime(ctl.value.value);
          let bad = false;
          ctl.value.removeAttribute('aria-invalid');
          ctl.valueErr.hidden = true;
          if (value == null || value === '') {
            ctl.valueErr.textContent = f === 'loc' ? 'Enter a location.' : 'Pick a time.';
            ctl.valueErr.hidden = false;
            ctl.value.setAttribute('aria-invalid', 'true');
            ctl.value.setAttribute('aria-describedby', 'w-ovr-value-err');
            bad = true;
          }
          if (!ctl.reason.value.trim()) {
            ctl.reason.setAttribute('aria-invalid', 'true');
            ctl.reason.setAttribute('aria-describedby', 'w-ovr-reason-err');
            ctl.reasonErr.hidden = false;
            bad = true;
          }
          if (bad) { (ctl.value.getAttribute('aria-invalid') ? ctl.value : ctl.reason).focus(); return; }
          // A time-out on an overnight shift that reads earlier than the time-in belongs to the next morning.
          if (f === 'out' && l && l.in != null && value < l.in && (TK.schedule(TK.getState(), l.gid).overnight || (l.out != null && l.out >= 1440))) value += 1440;
          m.close();
          TK.dispatch({ type: A.OVERRIDE, logId, field: f, value, reason: ctl.reason.value.trim() });
          TK.announce(`Override saved: ${fieldName[f].toLowerCase()} for ${g.name} on ${fmt.dateShort(l0.date)} is now ${showVal(value)}.`);
        } }, 'Save override'),
      ],
    });
  }

  // ---------- Schedule

  function scheduleFilters() {
    return h('div', { class: 'w-filters' }, searchField('w-sch-q', ui.sch.q, 'Name, ID or client', (v) => { ui.sch.q = v; refresh(true); }));
  }
  function scheduleContent(s) {
    const rows = TK.GUARDS.filter((g) => matches(ui.sch.q, g.name, g.empNo, TK.post(g.postId).name)).map((g, i) => {
      const sch = TK.schedule(s, g.id), p = TK.post(g.postId);
      return h('tr', {}, td(String(i + 1)), td(g.empNo), td(g.name, 'left'), td(p.name, 'left'),
        td(badge(sch.handler === 'Individual' ? 'info' : 'idle', sch.handler)), td(fmt.days(sch.days)),
        td(fmt.range(sch.start, sch.end)), td(`x ${sch.loc.x}, y ${sch.loc.y} (grid m)`),
        td(String(sch.radius) + (sch.radiusSource === g.id ? ' (own)' : ''), 'num'),
        td(h('button', { type: 'button', class: 'btn btn-primary btn-sm', 'data-k': 'edit:' + g.id, 'aria-label': `Edit ${g.name}'s schedule`, onclick: () => openSchedule(g.id) }, 'Edit')));
    });
    return card('Schedules', 'Client schedules apply to every guard on the post unless an individual record overrides them.',
      rows.length ? table('Guard schedules', ['No.', 'Employee ID', ['Name', 'left'], ['Client', 'left'], 'Schedule Handler', 'Day(s)', 'Time Range', 'Location',
        ['Radius (m)', 'num'], 'Edit'], rows, { minWidth: 980 }) : h('p', { class: 'empty', text: 'No guard matches the search.' }));
  }
  function openSchedule(gid) {
    const g = TK.guard(gid);
    const ctl = {};
    openModal({
      title: `Edit schedule · ${g.name}`,
      wide: true,
      build: (s) => {
        const sch = TK.schedule(s, gid), p = TK.post(g.postId);
        const own = sch.radiusSource === gid;
        const input = h('input', { type: 'number', id: 'w-sch-radius', class: 'input', min: '10', max: '10000', step: '5', inputmode: 'numeric',
          value: String(sch.radius), autofocus: true, 'aria-describedby': 'w-sch-radius-hint' });
        const err = h('p', { class: 'error', id: 'w-sch-radius-err', hidden: true, text: 'Enter a radius from 10 to 10,000 metres.' });
        const mapBox = h('div', { class: 'w-map' });
        const map = TK.mountMap(mapBox, { label: `Map of ${TK.CITY} (fictional) around ${p.name}` });
        const preview = () => {
          const r = Math.round(Number(input.value));
          const ok = input.value !== '' && Number.isFinite(r) && r >= 10 && r <= 10000;
          const st = TK.getState();
          map.update(ok ? { ...st, radius: { ...st.radius, [sch.radiusSource]: r } } : st, { guardId: gid, postId: p.id, fit: 'post' });
          return ok ? r : null;
        };
        input.addEventListener('input', () => {
          if (preview() != null) { input.removeAttribute('aria-invalid'); err.hidden = true; input.setAttribute('aria-describedby', 'w-sch-radius-hint'); }
        });
        preview();
        Object.assign(ctl, { input, err, preview, sch, p });
        const info = (k, v) => h('div', {}, h('dt', { text: k }), h('dd', { text: v }));
        return h('div', { class: 'w-sched' },
          h('div', { class: 'w-sched-form' },
            h('dl', { class: 'w-dl' }, info('Client', `${p.name} (${p.code})`), info('Schedule Handler', sch.handler),
              info('Day(s)', fmt.days(sch.days)), info('Time Range', fmt.range(sch.start, sch.end)), info('Grace', `${sch.grace} min`),
              info('Location', `x ${sch.loc.x}, y ${sch.loc.y} (grid m)`)),
            h('p', { class: 'hint', text: 'Days and times are read-only in this demo.' }),
            h('div', { class: 'field' }, h('label', { class: 'label', for: 'w-sch-radius', text: 'Radius (m)' }), input, err,
              h('p', { class: 'hint', id: 'w-sch-radius-hint', text: own
                ? `Saving changes ${g.name}'s individual record only.`
                : `Saving changes the client post record for ${p.name}, so every guard who inherits it moves with it.` })),
            h('p', { class: 'hint', text: `The phone also allows a fixed ${TK.BUFFER_M} m buffer on top of the radius.` })),
          mapBox);
      },
      foot: (m) => [
        h('button', { type: 'button', class: 'btn', onclick: () => m.close() }, 'Cancel'),
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => {
          const r = ctl.preview();
          if (r == null) {
            ctl.input.setAttribute('aria-invalid', 'true');
            ctl.input.setAttribute('aria-describedby', 'w-sch-radius-err w-sch-radius-hint');
            ctl.err.hidden = false;
            ctl.input.focus();
            return;
          }
          m.close();
          TK.dispatch({ type: A.SET_RADIUS, target: ctl.sch.radiusSource, radius: r });
          TK.announce(`Radius saved: ${ctl.sch.radiusSource === gid ? g.name + ' (individual)' : ctl.p.name} is now ${r} m. The phone uses it straight away.`);
        } }, 'Save'),
      ],
    });
  }

  // ---------- Manage Leave

  function leaveFilters() {
    const l = ui.leave;
    return h('div', { class: 'w-filters' },
      searchField('w-lv-q', l.q, 'Name, ID or client code', (v) => { l.q = v; refresh(true); }),
      selectField('w-lv-status', 'Status', [['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']], l.status,
        (v) => { l.status = v; refresh(true); }));
  }
  function leaveContent(s) {
    const f = ui.leave;
    const tone = { approved: 'ok', pending: 'warn', rejected: 'bad' };
    const list = s.leaves.filter((l) => {
      const g = TK.guard(l.gid);
      return (f.status === 'all' || l.status === f.status) && matches(f.q, g.name, g.empNo, TK.post(g.postId).code);
    });
    const decide = (l, status) => {
      TK.dispatch({ type: A.SET_LEAVE, id: l.id, status });
      TK.announce(`${status === 'approved' ? 'Approved' : 'Rejected'} ${TK.LEAVE_TYPES[l.type].toLowerCase()} leave for ${TK.guard(l.gid).name}.`);
    };
    const rows = list.map((l, i) => {
      const g = TK.guard(l.gid);
      return h('tr', {}, td(String(i + 1)), td(g.empNo), td(g.name, 'left'), td(TK.post(g.postId).code), td(leaveName(l.type), 'left'),
        td(badge(tone[l.status], l.status[0].toUpperCase() + l.status.slice(1))),
        td(`${fmt.dateShort(l.from)} – ${fmt.dateShort(l.to)}`), td(String(dayDiff(l.from, l.to) + 1), 'num'), td(l.by),
        td(l.status === 'pending' ? h('span', { class: 'w-actions' },
          h('button', { type: 'button', class: 'btn btn-primary btn-sm', 'data-k': 'ap:' + l.id, 'aria-label': `Approve ${g.name}'s ${TK.LEAVE_TYPES[l.type].toLowerCase()} leave`, onclick: () => decide(l, 'approved') }, 'Approve'),
          h('button', { type: 'button', class: 'btn btn-danger btn-sm', 'data-k': 'rj:' + l.id, 'aria-label': `Reject ${g.name}'s ${TK.LEAVE_TYPES[l.type].toLowerCase()} leave`, onclick: () => decide(l, 'rejected') }, 'Reject'))
          : h('span', { class: 'w-muted', text: 'Done' })));
    });
    return card('Leave requests', 'Approved leave is paid as 8 regular hours per day in payroll.',
      rows.length ? table('Leave requests', ['No.', 'Employee ID', ['Name', 'left'], 'Client Code', ['Leave Type', 'left'], 'Status', 'From – To',
        ['Duration (days)', 'num'], 'Updated By', 'Actions'], rows, { minWidth: 900 }) : h('p', { class: 'empty', text: 'No leave requests match.' }));
  }

  // ---------- Payroll

  function payrollFilters() {
    const f = ui.pay;
    return h('div', { class: 'w-filters' },
      searchField('w-pay-q', f.q, 'Name, ID or client', (v) => { f.q = v; refresh(true); }),
      selectField('w-pay-sort', 'Sort by', [['empNo', 'Employee number'], ['name', 'Name'], ['client', 'Client'], ['basic', 'Basic salary'], ['gross', 'Gross pay'], ['net', 'Net pay']],
        f.sort, (v) => { f.sort = v; refresh(true); }),
      selectField('w-pay-period', 'Pay Period:', [['2026-10-1', '2026-10 · 1st half (Oct 1 – 15)']], '2026-10-1', () => {}),
      h('div', { class: 'w-filters-end' },
        h('button', { type: 'button', class: 'btn btn-primary', 'data-k': 'finalize', disabled: !TK.periodEnded(),
          onclick: () => confirmModal('Finalize Period',
            `Finalize ${PERIOD.label}? This issues payslips from the current figures. Finalizing again replaces them.`, 'Finalize', () => {
              TK.dispatch({ type: A.FINALIZE });
              const n = Object.keys((TK.getState().payroll.issued || { items: {} }).items).length;
              TK.announce(`Payroll finalized for ${PERIOD.label}: ${n} payslips issued. Guards can open them on the phone.`);
            }) }, 'Finalize Period'),
        h('p', { class: 'hint', text: 'Today is the cut-off end date, so the period can be finalized.' })));
  }
  function payrollRows(s) {
    const f = ui.pay;
    const by = {
      empNo: (p) => p.empNo, name: (p) => p.name, client: (p) => p.postName,
      basic: (p) => -p.totals.basic, gross: (p) => -p.totals.gross, net: (p) => -p.totals.net,
    }[f.sort];
    return TK.payrollAll(s).filter((p) => matches(f.q, p.name, p.empNo, p.postName, p.postCode))
      .sort((a, b) => (by(a) < by(b) ? -1 : by(a) > by(b) ? 1 : 0));
  }
  // Night differential, holiday and rest-day pay, shown together so each row's columns add up to Gross Pay.
  const otherPay = (t) => t.ndPay + t.regHolPay + t.specHolPay + t.restDayPay;
  function payrollContent(s) {
    const list = payrollRows(s);
    const sum = (k) => list.reduce((n, p) => n + (k === 'other' ? otherPay(p.totals) : p.totals[k]), 0);
    const rows = list.map((p, i) => {
      const t = p.totals;
      return h('tr', {}, td(String(i + 1)), td(p.empNo), td(p.name, 'left'), td(p.postName, 'left'), td(fmt.period()),
        td(String(t.workingDays), 'num'), td(fmt.hours(t.hours), 'num'), td(t.otHours ? fmt.hours(t.otHours) : '-', 'num'),
        td(money(t.basic), 'num'), td(money(t.otPay), 'num'), td(money(otherPay(t)), 'num'), td(money(t.allowances), 'num'),
        td(money(t.deductions), 'num'),
        td(money(t.gross), 'num'), td(money(t.net), 'num w-strong'), td(PERIOD.payDate),
        td(p.issued ? badge('ok', 'Issued') : badge('info', 'Live')),
        td(h('button', { type: 'button', class: 'btn btn-primary btn-sm', 'data-k': 'pv:' + p.gid, 'aria-label': `View payroll detail for ${p.name}`, onclick: () => openPayroll(p.gid) }, 'View')));
    });
    const foot = list.length ? h('tr', {}, h('th', { scope: 'row', colspan: '8', class: 'left', text: 'Totals' }),
      ['basic', 'otPay', 'other', 'allowances', 'deductions', 'gross', 'net'].map((k) => td(money(sum(k)), 'num')), td(''), td(''), td('')) : null;
    const issued = s.payroll.issued;
    return card('Payroll · ' + PERIOD.label,
      issued ? `Issued ${fmt.dateShort(issued.date)} at ${fmt.time(issued.sec / 60)}. Issued rows keep their stored figures; finalize again to recompute.`
        : 'Live figures recompute from attendance as rows arrive. Guards with no completed shift are left off.',
      list.length ? table('Payroll for the cut-off', ['No.', 'Employee Number', ['Employee Name', 'left'], ['Client Name', 'left'], 'Pay Period',
        ['Working Days', 'num'], ['Hours Worked', 'num'], ['Overtime Hours', 'num'], ['Basic Salary', 'num'], ['Overtime Pay', 'num'], ['ND, Holiday & Rest-Day Pay', 'num'],
        ['Allowances', 'num'], ['Deductions', 'num'], ['Gross Pay', 'num'], ['Net Pay', 'num'], 'Payment Date', 'Status', 'View'], rows, { minWidth: 1620, foot })
        : h('p', { class: 'empty', text: 'No payroll rows match.' }));
  }

  const dlBox = (title, pairs) => h('div', { class: 'w-box' }, h('h5', { text: title }),
    h('dl', { class: 'w-dl' }, pairs.map(([k, v]) => h('div', {}, h('dt', { text: k }), h('dd', { class: 'num', text: v })))));

  function officerBox(s, p) {
    const id = 'w-officer-' + p.gid;
    const input = h('input', { type: 'number', id, class: 'input', min: '0', step: '50', inputmode: 'decimal', value: String(s.officer[p.gid] || 0), 'data-k': 'officer-input' });
    const err = h('p', { class: 'error', id: id + '-err', hidden: true, text: 'Enter an amount of 0 or more.' });
    const save = () => {
      const v = Number(input.value);
      if (input.value === '' || !Number.isFinite(v) || v < 0) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', err.id);
        err.hidden = false;
        input.focus();
        return;
      }
      TK.dispatch({ type: A.SET_OFFICER, guardId: p.gid, amount: v });
      TK.announce(`Officer allowance for ${p.name} set to ${money(v)} for the period.${p.issued ? ' The issued payslip keeps its figures until you finalize again.' : ''}`);
    };
    return h('div', { class: 'w-box w-officer' },
      h('div', { class: 'field' }, h('label', { class: 'label', for: id, text: 'Officer Allowance (per period)' }),
        h('div', { class: 'w-inline' }, input, h('button', { type: 'button', class: 'btn btn-primary', 'data-k': 'officer-btn', onclick: save }, 'Update')),
        err,
        h('p', { class: 'hint', text: p.issued ? 'This row is issued. A new amount applies when you finalize the period again.' : 'Head guard only. Split across the credited days of the cut-off.' })));
  }

  function openPayroll(gid) {
    openModal({
      title: `Detailed Report · ${TK.guard(gid).name}`,
      wide: true,
      live: (a) => a.type === A.SET_OFFICER || a.type === A.FINALIZE,
      build: (s) => {
        const p = TK.payrollAll(s).find((x) => x.gid === gid);
        if (!p) return h('p', { class: 'empty', text: 'No completed attendance in this cut-off yet.' });
        const t = p.totals, r = p.rates, head = p.role === 3;
        const statusBadge = (d) => d.status === 'present' ? badge('ok', 'Present') : d.status === 'absent' ? badge('bad', 'Absent')
          : d.status === 'leave' ? badge('info', d.label) : badge('idle', `Today · ${d.label}`);
        const dayRows = p.days.map((d) => h('tr', {},
          td(fmt.date(d.date), 'left'), td(fmt.hours(d.hours), 'num'), td(String(d.credited), 'num'), td(statusBadge(d)),
          td(fmt.hours(d.reg), 'num'), td(fmt.hours(d.ot), 'num'), td(fmt.hours(d.nd), 'num'),
          td(d.holiday ? `${d.holiday === 'special' ? 'Special' : 'Regular'} · ${money(d.holPay)}` : '-'),
          td(money(d.allowance + d.uniform), 'num'), head ? td(money(d.officer), 'num') : null, td(money(d.gross), 'num')));
        const regSum = p.days.reduce((n, d) => n + d.reg, 0);
        const foot = h('tr', {}, h('th', { scope: 'row', class: 'left', text: 'Totals' }), td(fmt.hours(t.hours), 'num'), td(String(t.workingDays), 'num'), td(''),
          td(fmt.hours(regSum), 'num'), td(fmt.hours(t.otHours), 'num'), td(fmt.hours(t.ndHours), 'num'), td(money(t.regHolPay + t.specHolPay)),
          td(money(t.allowance + t.uniform), 'num'), head ? td(money(t.officer), 'num') : null, td(money(t.gross), 'num'));
        return h('div', { class: 'w-report' },
          h('p', { class: 'w-muted' }, `${p.empNo} · ${TK.ROLES[p.role]} · ${p.postName} (${p.postCode}) · ${p.shift === 'night' ? 'Night' : 'Day'} shift · `,
            p.issued ? badge('ok', 'Issued') : badge('info', 'Live')),
          h('section', {}, h('h4', { text: 'A. Rates, totals and deductions' }),
            h('div', { class: 'w-totals' },
              h('div', { class: 'w-total w-total-gross' }, h('span', { text: 'Gross' }), h('strong', { text: money(t.gross) })),
              h('div', { class: 'w-total w-total-net' }, h('span', { text: 'Net' }), h('strong', { text: money(t.net) }))),
            h('div', { class: 'w-boxes' },
              dlBox('Rates', [['Daily', money(r.daily)], ['Hourly', money(r.hourly)], [`Overtime (×${TK.SETTINGS.otMultiplier}) per h`, money(r.ot)],
                [`Night diff. (+${TK.SETTINGS.ndPct}%) per h`, money(r.nd)], ['Allowance (monthly)', money(r.allowanceMonthly)], ['Uniform (monthly)', money(r.uniformMonthly)]]),
              dlBox('Deduction (employee share)', [[`Social fund (credit ${money(t.social.credit)})`, money(t.social.ee)], ['Health fund', money(t.health.ee)],
                ['Housing fund', money(t.housing.ee)], ['Cash bond', money(t.cashBond)], ['Total deductions', money(t.deductions)]]),
              dlBox('Deduction (employer share)', [['Social fund', money(t.social.er)], ['Health fund', money(t.health.er)],
                ['Housing fund', money(t.housing.er)], ['Total employer share', money(t.employerShare)]]),
              head ? officerBox(s, p) : null)),
          h('section', {}, h('h4', { text: 'B. Per-day breakdown' }),
            table(`Per-day pay for ${p.name}`, [['Date', 'left'], ['Hours', 'num'], ['Days', 'num'], 'Status', ['Regular h', 'num'], ['OT h', 'num'], ['ND h', 'num'],
              'Holiday', ['Allowance + uniform', 'num'], head ? ['Officer', 'num'] : null, ['Gross', 'num']].filter(Boolean), dayRows, { minWidth: head ? 1000 : 900, foot })),
          h('p', { class: 'w-accrual', text: `Accumulated 13th-month accrual (display only): ${money(t.thirteenth)}` }),
          h('p', { class: 'hint', text: 'Contribution rules and amounts are invented for this demo.' }));
      },
    });
  }

  // ---------- Reports

  function reportsFilters() {
    const f = ui.rep;
    const toggle = h('button', { type: 'button', class: 'btn', 'aria-expanded': String(f.summary), 'aria-controls': 'w-summary',
      onclick: () => {
        f.summary = !f.summary;
        toggle.setAttribute('aria-expanded', String(f.summary));
        toggle.textContent = f.summary ? 'Hide Summary' : 'Show Summary';
        refresh(true);
      } }, f.summary ? 'Hide Summary' : 'Show Summary');
    return h('div', { class: 'w-filters' },
      searchField('w-rep-q', f.q, 'Name, ID or client', (v) => { f.q = v; refresh(true); }),
      h('div', { class: 'w-filters-end' }, toggle));
  }
  function reportsContent(s) {
    if (!s.payroll.issued) {
      return card('Payslips', null, h('p', { class: 'empty', text: 'No issued payroll yet. Finalize the period on the Payroll page.' }),
        h('div', { class: 'w-center' }, h('button', { type: 'button', class: 'btn btn-primary', 'data-k': 'goto-pay', onclick: () => go('payroll') }, 'Open Payroll')));
    }
    const f = ui.rep;
    const items = TK.payrollAll(s).filter((p) => p.issued);
    const shown = items.filter((p) => matches(f.q, p.name, p.empNo, p.postName));
    const open = s.requests.filter((r) => r.status !== 'delivered').length;
    const tabs = [['slips', 'All Payslips'], ['requests', 'Payslip Requests']];
    const selectTab = (id, focus) => {
      f.tab = id;
      refresh(true);
      if (focus) document.getElementById('w-tab-' + id).focus();
    };
    const tablist = h('div', { role: 'tablist', class: 'w-tabs', 'aria-label': 'Report views',
      onkeydown: (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        const i = tabs.findIndex(([id]) => id === f.tab);
        const n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        selectTab(tabs[n][0], true);
      } },
    tabs.map(([id, label]) => h('button', { type: 'button', role: 'tab', id: 'w-tab-' + id, class: 'w-tab', 'data-k': 'tab:' + id,
      'aria-selected': String(f.tab === id), 'aria-controls': 'w-tabpanel', tabindex: f.tab === id ? '0' : '-1', onclick: () => selectTab(id, false) },
    label, id === 'requests' && open ? h('span', { class: 'w-count' }, String(open), h('span', { class: 'sr-only', text: ' open' })) : null)));

    let panel;
    if (f.tab === 'slips') {
      const rows = shown.map((p) => {
        const req = TK.requestFor(s, p.gid);
        return h('tr', {}, td(p.empNo), td(p.name, 'left'), td(p.postName, 'left'), td(PERIOD.label), td(money(p.totals.gross), 'num'),
          td(money(p.totals.net), 'num w-strong'), td(badge('ok', 'Issued')), td(req ? badge(REQ[req.status].tone, REQ[req.status].label) : h('span', { class: 'w-muted', text: 'None' })),
          td(h('button', { type: 'button', class: 'btn btn-primary btn-sm', 'data-k': 'slip:' + p.gid, 'aria-label': `View payslip for ${p.name}`, onclick: () => openPayslip(p.gid) }, 'View')));
      });
      panel = rows.length ? table('Issued payslips', ['Employee ID', ['Name', 'left'], ['Client', 'left'], 'Pay Period', ['Gross', 'num'], ['Net', 'num'],
        'Status', 'Request Status', 'View'], rows, { minWidth: 900 }) : h('p', { class: 'empty', text: 'No payslips match the search.' });
    } else {
      const reqs = s.requests.filter((r) => { const g = TK.guard(r.gid); return matches(f.q, g.name, g.empNo, TK.post(g.postId).name); });
      const rows = reqs.map((r) => {
        const g = TK.guard(r.gid), meta = REQ[r.status];
        return h('tr', {}, td(g.empNo), td(g.name, 'left'), td(r.period), td(`${fmt.dateShort(r.date)}, ${fmt.time(r.sec / 60)}`),
          td(badge(meta.tone, meta.label)),
          td(meta.next ? h('button', { type: 'button', class: 'btn btn-primary btn-sm', 'data-k': 'req:' + r.id, onclick: () => {
            TK.dispatch({ type: A.ADVANCE_REQUEST, id: r.id });
            const now = TK.getState().requests.find((x) => x.id === r.id);
            TK.announce(`Paper payslip for ${g.name} marked ${REQ[now.status].label.toLowerCase()}.`);
          } }, meta.next) : badge('ok', 'Final')));
      });
      panel = rows.length ? table('Paper payslip requests', ['Employee ID', ['Name', 'left'], 'Period', 'Requested', 'Status', 'Action'], rows, { minWidth: 720 })
        : h('p', { class: 'empty', text: 'No paper copy requests yet. Guards request one from the Payslip screen on the phone.' });
    }

    const sum = (k) => items.reduce((n, p) => n + p.totals[k], 0);
    const summary = f.summary ? h('div', { class: 'w-summary', id: 'w-summary' }, [
      ['Total Payslips', String(items.length)], ['Total Gross', money(sum('gross'))], ['Total Net', money(sum('net'))],
      ['Average Gross', money(items.length ? sum('gross') / items.length : 0)], ['Average Net', money(items.length ? sum('net') / items.length : 0)],
      ['Total Deductions', money(sum('deductions'))], ['Total Cash Bond', money(sum('cashBond'))],
    ].map(([k, v]) => h('div', { class: 'w-stat' }, h('p', { class: 'w-stat-label', text: k }), h('p', { class: 'w-stat-num', text: v })))) : null;

    return h('div', { class: 'w-stack' }, summary,
      h('section', { class: 'card w-card' }, tablist,
        h('div', { role: 'tabpanel', id: 'w-tabpanel', class: 'w-tabpanel', 'aria-labelledby': 'w-tab-' + f.tab }, panel)));
  }

  function openPayslip(gid) {
    openModal({
      title: `Payslip · ${TK.guard(gid).name}`,
      wide: true,
      live: (a) => a.type === A.FINALIZE || a.type === A.ADVANCE_REQUEST || a.type === A.REQUEST_PAPER,
      build: (s) => {
        const p = TK.payslipFor(s, gid);
        if (!p) return h('p', { class: 'empty', text: 'This payslip is not issued yet.' });
        const t = p.totals, req = TK.requestFor(s, gid);
        const dl = (pairs, cls) => h('dl', { class: 'w-dl ' + (cls || '') }, pairs.filter(Boolean).map(([k, v, c]) =>
          h('div', { class: c || null }, h('dt', { text: k }), h('dd', { class: 'num', text: v }))));
        return h('article', { class: 'w-slip' },
          h('header', { class: 'w-slip-top' },
            h('p', { class: 'w-slip-title', text: 'PAYSLIP' }),
            h('p', { text: `${PERIOD.label} · Sequence #${PERIOD.seq}` }),
            h('p', { class: 'w-muted', text: TK.BRAND.name })),
          h('div', { class: 'w-slip-cols' },
            h('section', {}, h('h4', { text: 'Employee Information' }), dl([['Name', p.name], ['Employee ID', p.empNo], ['Role', TK.ROLES[p.role]],
              ['Client', `${p.postName} (${p.postCode})`], ['Shift', p.shift === 'night' ? 'Night' : 'Day']])),
            h('section', {}, h('h4', { text: 'Period Details' }), dl([['Pay period', fmt.period()], ['Payment date', fmt.dateLong(PERIOD.payDate)],
              ['Working days', String(t.workingDays)], ['Hours worked', fmt.hm(t.hours)], ['Paper copy', req ? REQ[req.status].label : 'Not requested']]))),
          h('div', { class: 'w-slip-cols' },
            h('section', {}, h('h4', { text: 'Earnings' }), dl([['Basic', money(t.basic)], ['Overtime', money(t.otPay)], ['Night Differential', money(t.ndPay)],
              ['Rest Day Pay', money(t.restDayPay)], ['Regular Holiday Pay', money(t.regHolPay)], ['Special Holiday Pay', money(t.specHolPay)],
              ['Allowance', money(t.allowance)], ['Uniform', money(t.uniform)], ['Officer', money(t.officer)]])),
            h('section', {}, h('h4', { text: 'Deductions' }), dl([['Social fund', money(t.social.ee)], ['Health fund', money(t.health.ee)],
              ['Housing fund', money(t.housing.ee)], ['Cash Bond', money(t.cashBond)], ['Total', money(t.deductions), 'w-dl-total']], 'w-neg'))),
          h('div', { class: 'w-slip-total' },
            h('div', {}, h('span', { text: 'GROSS PAY' }), h('strong', { class: 'w-gross', text: money(t.gross) })),
            h('div', {}, h('span', { text: 'NET PAY' }), h('strong', { class: 'w-net', text: money(t.net) }))),
          h('section', {}, h('h4', { text: `Dates Worked (${p.datesWorked.length})` }),
            p.datesWorked.length ? h('ul', { class: 'w-date-chips' }, p.datesWorked.map((d) => h('li', { text: fmt.dateShort(d) })))
              : h('p', { class: 'w-muted', text: 'None in this cut-off.' })),
          h('p', { class: 'w-slip-foot', text: 'This is a system-generated payslip. No signature required.' }));
      },
    });
  }

  // ---------- page table

  const PAGES = {
    dashboard: {
      title: 'Dashboard', sub: 'Today across every post, compared with yesterday',
      filters: () => h('p', { class: 'w-note', text: `Showing ${fmt.dateLong(TODAY)}, the last day of the ${PERIOD.label} cut-off. Deltas compare with ${fmt.date(TK.addDays(TODAY, -1))}.` }),
      key: (s) => JSON.stringify([TK.kpis(s, TODAY), last7().map((d) => TK.attendanceRate(s, d).pct), s.activity.slice(0, 8),
        s.leaves.map((l) => l.status), TK.GUARDS.map((g) => TK.memberStatus(s, g.id).label + TK.dayStatus(s, g.id))]),
      content: (s) => h('div', { class: 'w-stack' },
        h('div', { class: 'w-kpis' }, ((now, before) => KPI_DEFS.map((d) => kpiCard(d, now, before)))(TK.kpis(s, TODAY), TK.kpis(s, TK.addDays(TODAY, -1)))),
        h('div', { class: 'w-dash-grid' }, rateCard(s), todayCard(s), activityCard(s), approvalsCard(s), distributionCard(s), eventsCard(s))),
    },
    attendance: {
      title: 'Attendance', sub: 'Time-ins and time-outs for the cut-off, with face-check status',
      filters: attendanceFilters,
      key: (s) => JSON.stringify([TK.logsFor(s, { date: ui.att.date }), TK.GUARDS.map((g) => TK.memberStatus(s, g.id, ui.att.date).key)]),
      content: attendance,
    },
    schedule: {
      title: 'Schedule', sub: 'Shift days, times and the geofence radius for each guard',
      filters: scheduleFilters, key: (s) => JSON.stringify(s.radius), content: scheduleContent,
    },
    leave: {
      title: 'Manage Leave', sub: 'Approve or reject leave filed for guards',
      filters: leaveFilters, key: (s) => JSON.stringify(s.leaves), content: leaveContent,
    },
    payroll: {
      title: 'Payroll', sub: `Cut-off ${PERIOD.label}, computed from attendance`,
      filters: payrollFilters,
      key: (s) => JSON.stringify([s.payroll.issued && s.payroll.issued.n, TK.payrollAll(s).map((p) => [p.gid, p.issued, p.totals.gross, p.totals.net, p.totals.hours])]),
      content: payrollContent,
    },
    reports: {
      title: 'Reports', sub: 'Issued payslips and paper copy requests',
      filters: reportsFilters,
      key: (s) => JSON.stringify([s.payroll.issued && s.payroll.issued.n, s.requests]),
      content: reportsContent,
    },
  };

  // ---------------------------------------------------------------- wiring

  function resetUI(s) {
    [...modals].forEach((m) => { m.silent = true; m.dlg.close(); });
    closeMenu(false);
    closeDrawer(false);
    ui = defaultUI();
    primeFresh(s);
    setClock(s);
    enterPage(false);
  }

  // Every state change: track new rows, move the clock, and redraw the page when its data changed. A clock
  // tick never redraws content that holds focus; the redraw waits until focus leaves.
  TK.subscribe((s, action) => {
    if (action.type === A.RESET) { resetUI(s); return; }
    trackFresh(s);
    setClock(s);
    const tick = action.type === A.TICK;
    if (!(tick && contentEl.contains(document.activeElement))) refresh(false);
    if (!tick) modals.forEach((m) => { if (m.live && m.live(action)) m.refresh(); });
  });

  primeFresh(TK.getState());
  setClock(TK.getState());
  enterPage(false);
}());
