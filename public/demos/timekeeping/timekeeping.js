// Fictional timekeeping demo. Everything lives in memory; nothing is stored or sent.
(function () {
  'use strict';

  const DAYS = [
    { short: 'Mon', long: 'Monday' },
    { short: 'Tue', long: 'Tuesday' },
    { short: 'Wed', long: 'Wednesday' },
    { short: 'Thu', long: 'Thursday' },
    { short: 'Fri', long: 'Friday' },
  ];

  // Order is the click cycle. Hours are illustrative; Leave counts as paid in this example only.
  const STATES = [
    { key: 'present', label: 'Present', hours: 8 },
    { key: 'late', label: 'Late', hours: 7 },
    { key: 'absent', label: 'Absent', hours: 0 },
    { key: 'leave', label: 'Leave', hours: 8 },
  ];

  const RATES = [12, 15, 18]; // sample units per hour
  const SITES = ['North Gate (fictional)', 'Depot Yard (fictional)', 'Annex Office (fictional)'];

  const STAFF = [
    { name: 'Mara', role: 'Site lead', shift: '07:00-15:00' },
    { name: 'Teo', role: 'Technician', shift: '08:00-16:00' },
    { name: 'Imani', role: 'Coordinator', shift: '09:00-17:00' },
    { name: 'Bram', role: 'Technician', shift: '10:00-18:00' },
  ];

  // Starting state indexes into STATES, one row per person, one column per day.
  const START_GRID = [
    [0, 0, 1, 0, 0],
    [0, 0, 0, 2, 0],
    [0, 3, 3, 0, 0],
    [1, 0, 0, 0, 2],
  ];

  // Fixed fictional clock: starts at 08:02 and advances by these minute steps per event.
  const CLOCK_START = 8 * 60 + 2;
  const CLOCK_STEPS = [13, 47, 22, 95, 31, 18];
  const MAX_LOG = 6;

  const ROLES = ['All'].concat(Array.from(new Set(STAFF.map((s) => s.role))));

  const $ = (id) => document.getElementById(id);

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function freshState() {
    return {
      grid: START_GRID.map((row) => row.slice()),
      rate: 1,
      role: 'All',
      slip: 0,
      checkedIn: false,
      site: 0,
      events: 0,
      log: [],
    };
  }

  let state = freshState();
  const cells = []; // cells[person][day] -> button
  const rows = []; // rows[person] -> li

  const fmt = (n) => n.toLocaleString('en-US');
  const pad = (n) => String(n).padStart(2, '0');
  const hoursOf = (p) => state.grid[p].reduce((sum, i) => sum + STATES[i].hours, 0);
  const totalOf = (p) => hoursOf(p) * RATES[state.rate];

  function clockAt(n) {
    let minutes = CLOCK_START;
    for (let i = 0; i < n; i++) minutes += CLOCK_STEPS[i % CLOCK_STEPS.length];
    minutes %= 24 * 60;
    return pad(Math.floor(minutes / 60)) + ':' + pad(minutes % 60);
  }

  /* ---------- build (once) ---------- */

  function buildRoster() {
    const list = $('roster');
    STAFF.forEach((person, p) => {
      const li = el('li', 'person');
      const who = el('div', 'who');
      who.appendChild(el('h3', 'who-name', person.name + ' — ' + person.role));
      who.appendChild(el('p', 'who-meta', 'Preset shift ' + person.shift));
      const days = el('div', 'days');
      days.setAttribute('role', 'group');
      days.setAttribute('aria-label', person.name + ', weekly attendance');
      cells[p] = DAYS.map((day, d) => {
        const btn = el('button', 'cell');
        btn.type = 'button';
        const label = el('span', 'cell-state');
        const shape = el('span', 'shape');
        shape.setAttribute('aria-hidden', 'true');
        label.append(shape, el('span', 'cell-label'));
        btn.append(el('span', 'cell-day', day.short), label, el('span', 'cell-hours'));
        btn.addEventListener('click', () => {
          state.grid[p][d] = (state.grid[p][d] + 1) % STATES.length;
          renderCell(p, d);
          renderSummary(true);
          renderSlip();
        });
        days.appendChild(btn);
        return btn;
      });
      li.append(who, days);
      list.appendChild(li);
      rows[p] = li;
    });
  }

  function buildControls() {
    ROLES.forEach((role) => {
      const btn = el('button', '', role === 'All' ? 'All roles' : role);
      btn.type = 'button';
      btn.dataset.role = role;
      btn.addEventListener('click', () => {
        state.role = role;
        renderFilter();
      });
      $('filter').appendChild(btn);
    });

    RATES.forEach((rate, i) => {
      const opt = el('option', '', rate + ' sample units / hour');
      opt.value = String(i);
      $('rate').appendChild(opt);
    });
    $('rate').addEventListener('change', () => {
      state.rate = Number($('rate').value);
      renderSummary(true);
      renderSlip();
    });

    STAFF.forEach((person, i) => {
      const opt = el('option', '', person.name + ' — ' + person.role);
      opt.value = String(i);
      $('slip-person').appendChild(opt);
    });
    $('slip-person').addEventListener('change', () => {
      state.slip = Number($('slip-person').value);
      renderSlip();
    });

    SITES.forEach((site, i) => {
      const opt = el('option', '', site);
      opt.value = String(i);
      $('site').appendChild(opt);
    });
    $('site').addEventListener('change', () => {
      state.site = Number($('site').value);
    });

    $('checkin-btn').addEventListener('click', () => {
      const kind = state.checkedIn ? 'Check-out' : 'Check-in';
      state.log.unshift({ time: clockAt(state.events), text: kind + ' — ' + SITES[state.site] });
      state.log.length = Math.min(state.log.length, MAX_LOG);
      state.events += 1;
      state.checkedIn = !state.checkedIn;
      renderCheckin();
    });

    $('reset').addEventListener('click', () => {
      state = freshState();
      renderAll();
      $('live').textContent = 'Demo reset to the initial sample week.';
    });
  }

  /* ---------- render ---------- */

  function renderCell(p, d) {
    const st = STATES[state.grid[p][d]];
    const btn = cells[p][d];
    btn.dataset.state = st.key;
    btn.setAttribute('aria-label', STAFF[p].name + ', ' + DAYS[d].long + ': ' + st.label + '. Change status');
    btn.querySelector('.cell-label').textContent = st.label;
    btn.querySelector('.cell-hours').textContent = st.hours + ' h';
  }

  function renderFilter() {
    $('filter').querySelectorAll('button').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.role === state.role));
    });
    let shown = 0;
    STAFF.forEach((person, p) => {
      const visible = state.role === 'All' || person.role === state.role;
      rows[p].hidden = !visible;
      if (visible) shown += 1;
    });
    $('shown').textContent = 'Showing ' + shown + ' of ' + STAFF.length + ' staff. The summary always covers everyone.';
  }

  function renderSummary(announce) {
    const body = $('sum-body');
    body.replaceChildren();
    let teamHours = 0;
    let teamTotal = 0;
    STAFF.forEach((person, p) => {
      const tr = el('tr');
      const th = el('th', '', person.name);
      th.scope = 'row';
      th.appendChild(el('small', '', person.role));
      tr.append(th, el('td', 'num', hoursOf(p) + ' h'), el('td', 'num', fmt(totalOf(p))));
      body.appendChild(tr);
      teamHours += hoursOf(p);
      teamTotal += totalOf(p);
    });
    $('team-hours').textContent = teamHours + ' h';
    $('team-total').textContent = fmt(teamTotal);
    if (announce || !$('live').textContent) {
      $('live').textContent =
        'Team total: ' + fmt(teamTotal) + ' sample units (illustrative example, not payroll, no payment made).';
    }
  }

  function renderSlip() {
    const p = state.slip;
    const list = $('slip-list');
    list.replaceChildren();
    const lines = [
      ['Person', STAFF[p].name + ' — ' + STAFF[p].role],
      ['Preset shift', STAFF[p].shift],
      ['Days', DAYS.map((day, d) => day.short + ' ' + STATES[state.grid[p][d]].label).join(', ')],
      ['Hours', hoursOf(p) + ' h'],
      ['Rate', RATES[state.rate] + ' sample units / hour'],
      ['Illustrative total', fmt(totalOf(p)) + ' sample units'],
    ];
    lines.forEach(([term, value]) => {
      list.append(el('dt', '', term), el('dd', '', value));
    });
  }

  function renderCheckin() {
    $('checkin-btn').textContent = state.checkedIn ? 'Simulate check-out' : 'Simulate check-in';
    $('site').disabled = state.checkedIn; // site is fixed until the simulated check-out
    $('checkin-status').textContent = state.checkedIn
      ? 'Status: simulated check-in at ' + SITES[state.site] + '.'
      : 'Status: not checked in (simulated).';
    const log = $('log');
    log.replaceChildren();
    if (!state.log.length) {
      log.appendChild(el('li', 'empty', 'No events yet. Use the button above.'));
      return;
    }
    state.log.forEach((entry) => {
      const li = el('li');
      li.append(el('time', '', entry.time), el('span', '', entry.text));
      log.appendChild(li);
    });
  }

  function renderAll() {
    STAFF.forEach((_, p) => DAYS.forEach((__, d) => renderCell(p, d)));
    $('rate').value = String(state.rate);
    $('slip-person').value = String(state.slip);
    $('site').value = String(state.site);
    renderFilter();
    renderSummary(false);
    renderSlip();
    renderCheckin();
  }

  buildRoster();
  buildControls();
  renderAll();
})();
