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
  const SITES = ['North Gate post (fictional)', 'Depot Yard post (fictional)', 'Annex Lobby post (fictional)'];

  const STAFF = [
    { name: 'Mara', role: 'Shift supervisor', shift: '07:00-15:00' },
    { name: 'Teo', role: 'Security guard', shift: '07:00-15:00' },
    { name: 'Imani', role: 'Security guard', shift: '08:00-16:00' },
    { name: 'Bram', role: 'Security guard', shift: '08:00-16:00' },
  ];

  // The phone flow fills in this day of the sample week (Friday).
  const TODAY = 4;
  const RING_M = 50;
  const STEP_LABELS = ['In range of the post', 'Tap to clock in', 'Face check', 'Logged to the dashboard'];

  // Starting state indexes into STATES, one row per person, one column per day.
  // Friday starts at Absent (0 h): nobody has clocked in yet, so a phone clock-in visibly raises the totals.
  const START_GRID = [
    [0, 0, 1, 0, 2],
    [0, 0, 0, 2, 2],
    [0, 3, 3, 0, 2],
    [1, 0, 0, 0, 2],
  ];

  // Fixed fictional clock: starts at 06:52 and advances by these minute steps per event.
  const CLOCK_START = 6 * 60 + 52;
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
      guard: 0,
      site: 0,
      inRange: false,
      clockedIn: false,
      // 0 out of range, 1 waiting for a tap, 2 face check, 4 logged (every step done).
      stage: 0,
      fresh: null,
      events: 0,
      log: [],
    };
  }

  let state = freshState();
  let timer = 0;
  const cells = []; // cells[person][day] -> button
  const rows = []; // rows[person] -> li

  const fmt = (n) => n.toLocaleString('en-US');
  const pad = (n) => String(n).padStart(2, '0');
  const hoursOf = (p) => state.grid[p].reduce((sum, i) => sum + STATES[i].hours, 0);
  const totalOf = (p) => hoursOf(p) * RATES[state.rate];

  function minutesAt(n) {
    let minutes = CLOCK_START;
    for (let i = 0; i < n; i++) minutes += CLOCK_STEPS[i % CLOCK_STEPS.length];
    return minutes % (24 * 60);
  }
  const clockText = (minutes) => pad(Math.floor(minutes / 60)) + ':' + pad(minutes % 60);
  const shiftStart = (p) => {
    const [h, m] = STAFF[p].shift.split('-')[0].split(':').map(Number);
    return h * 60 + m;
  };

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

    STAFF.forEach((person, i) => {
      const opt = el('option', '', person.name + ' — ' + person.role);
      opt.value = String(i);
      $('guard').appendChild(opt);
    });
    $('guard').addEventListener('change', () => {
      state.guard = Number($('guard').value);
    });

    $('range-btn').addEventListener('click', () => {
      state.inRange = !state.inRange;
      state.stage = state.inRange ? 1 : 0;
      renderCheckin();
    });

    // Tap, then a simulated face check, then the entry is logged and the dashboard updates with no further action.
    $('tap-btn').addEventListener('click', () => {
      state.stage = 2;
      renderCheckin();
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      timer = window.setTimeout(logEntry, still ? 0 : 1200);
    });

    $('reset').addEventListener('click', () => {
      window.clearTimeout(timer);
      state = freshState();
      renderAll();
      $('live').textContent = 'Demo reset to the initial sample week.';
    });
  }

  function logEntry() {
    const p = state.guard;
    const minutes = minutesAt(state.events);
    const time = clockText(minutes);
    const name = STAFF[p].name;
    const post = SITES[state.site];
    state.events += 1;
    let status;
    if (state.clockedIn) {
      state.log.unshift({ time, text: 'Clock-out, face matched — ' + name + ', ' + post });
      status = 'Logged automatically at ' + time + ': ' + name + ' clocked out at ' + post + '.';
    } else {
      const st = minutes > shiftStart(p) ? 1 : 0;
      state.grid[p][TODAY] = st;
      state.fresh = p;
      renderCell(p, TODAY);
      renderSummary(false);
      renderSlip();
      state.log.unshift({ time, text: 'Clock-in, face matched — ' + name + ', ' + post });
      status = 'Logged automatically at ' + time + ': ' + name + ' clocked in at ' + post + '. '
        + DAYS[TODAY].long + ' marked ' + STATES[st].label + ' on the dashboard and the totals updated.';
    }
    state.log.length = Math.min(state.log.length, MAX_LOG);
    state.clockedIn = !state.clockedIn;
    state.stage = 4;
    renderCheckin(status);
  }

  /* ---------- render ---------- */

  function renderCell(p, d) {
    const st = STATES[state.grid[p][d]];
    const btn = cells[p][d];
    btn.dataset.state = st.key;
    btn.setAttribute('aria-label', STAFF[p].name + ', ' + DAYS[d].long + ': ' + st.label + '. Change status');
    btn.querySelector('.cell-label').textContent = st.label;
    btn.querySelector('.cell-hours').textContent = st.hours + ' h';
    btn.classList.toggle('fresh', d === TODAY && state.fresh === p);
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

  function renderCheckin(status) {
    const scanning = state.stage === 2;
    const action = state.clockedIn ? 'clock out' : 'clock in';
    // Once logged, the steps describe the action just completed.
    const stepAction = state.stage === 4 ? (state.clockedIn ? 'clock in' : 'clock out') : action;
    $('phone').dataset.phase = scanning ? 'scanning' : state.stage === 4 ? 'matched' : state.inRange ? 'ready' : 'out';
    $('distance').textContent = state.inRange
      ? 'Distance to post: 18 m, inside the ' + RING_M + ' m ring (simulated)'
      : 'Distance to post: 140 m, outside the ' + RING_M + ' m ring (simulated)';
    $('phone-msg').textContent = scanning ? 'Checking face…'
      : state.stage === 4 ? 'Face matched. Sent to the dashboard.'
        : state.inRange ? 'In range. Tap to ' + action + '.' : 'Walk into range to ' + action + '.';
    $('range-btn').textContent = state.inRange ? 'Walk out of range' : 'Walk into range';
    $('range-btn').disabled = scanning;
    $('tap-btn').textContent = 'Tap to ' + action;
    $('tap-btn').disabled = !state.inRange || scanning;
    // Guard and post stay fixed from the tap until that guard clocks out.
    $('guard').disabled = scanning || state.clockedIn;
    $('site').disabled = scanning || state.clockedIn;

    $('steps').querySelectorAll('li').forEach((li, i) => {
      const done = i < state.stage;
      li.dataset.state = done ? 'done' : i === state.stage ? 'current' : 'todo';
      if (i === state.stage) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      li.replaceChildren(i === 1 ? 'Tap to ' + stepAction : STEP_LABELS[i]);
      if (done) li.append(el('span', 'sr', ' (done)'));
    });

    $('checkin-status').textContent = status || (scanning ? 'Face check in progress (simulated).'
      : state.clockedIn ? STAFF[state.guard].name + ' is clocked in (simulated).' : 'Nobody is clocked in (simulated).');
    const log = $('log');
    log.replaceChildren();
    if (!state.log.length) {
      log.appendChild(el('li', 'empty', 'No events yet. Walk into range and tap to clock in.'));
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
    $('guard').value = String(state.guard);
    renderFilter();
    renderSummary(false);
    renderSlip();
    renderCheckin();
  }

  buildRoster();
  buildControls();
  renderAll();
})();
