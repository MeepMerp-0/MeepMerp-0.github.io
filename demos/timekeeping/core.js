// Shared core for the fictional timekeeping demo: the invented dataset, a small state store, pure rules
// (distance, geofence, schedule window, payroll) and formatting. mobile.js and web.js read everything through
// window.TK. Nothing here touches the network or any storage; state lives in memory and Reset rebuilds it.
(function () {
  'use strict';

  // ---------------------------------------------------------------- invented dataset

  const TODAY = '2026-10-15'; // a Thursday, and the last day of the cut-off, so the period can be finalized today
  const PERIOD = { start: '2026-10-01', end: '2026-10-15', label: 'Oct 1 – 15, 2026', payDate: '2026-10-15', seq: 1 };
  const CITY = 'Port Lumen';
  const BRAND = {
    name: 'Lanternwatch Guard Co.',
    short: 'Lanternwatch',
    tagline: 'Steady watch, every shift',
    blurb: 'Attendance for guards on post',
    console: 'Payroll & Timekeeping System',
    host: 'console.lanternwatch.example',
  };

  const hm = (h, m) => h * 60 + m; // minutes since midnight
  const START_SEC = hm(7, 41) * 60; // the demo clock opens at 07:41:00
  const DAY_END_SEC = 86399;
  const TRAVEL_MPS = 5; // commute speed on the map, metres per simulated second (about 18 km/h)
  const BUFFER_M = 5; // fixed allowance added to every radius, as in the source app
  const SPEEDS = [0, 1, 10, 60]; // simulated seconds per real second; 0 pauses the clock
  const TICK_MS = 250;

  const DAY_LETTERS = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa']; // index = getUTCDay()
  const ROLES = { 3: 'Head Guard', 4: 'Guard' };
  const LEAVE_TYPES = { SL: 'Sick', VL: 'Vacation', EL: 'Emergency', PL: 'Personal', ML: 'Maternity', BL: 'Bereavement' };

  // A flat town plan in metres (x east, y south). Streets run along the grid lines below; the river winds
  // through the corridor between x 410 and 540 and is crossed by every east-west street.
  const MAP = (function () {
    const w = 1000, h = 700;
    const streets = [
      { name: 'Lantern Ave', a: [0, 180], b: [1000, 180], label: [740, 166, 0] },
      { name: 'Mill St', a: [0, 350], b: [1000, 350], label: [210, 336, 0] },
      { name: 'Ferry Rd', a: [0, 520], b: [1000, 520], label: [740, 506, 0] },
      { name: 'Dock Ln', a: [650, 640], b: [1000, 640], label: [930, 626, 0] },
      { name: 'Quarry St', a: [120, 0], b: [120, 700], label: [106, 440, -90] },
      { name: 'Copper Way', a: [300, 0], b: [300, 700], label: [286, 270, -90] },
      { name: 'Kiln St', a: [650, 0], b: [650, 700], label: [636, 270, -90] },
      { name: 'Harbor Blvd', a: [850, 0], b: [850, 700], label: [836, 450, -90] },
    ];
    const park = { name: 'Wren Park', x: 664, y: 364, w: 172, h: 142 };
    const river = { name: 'Silt River', d: 'M 470 -20 C 420 130, 535 230, 478 350 S 418 575, 492 720', label: [500, 640, -78] };
    // City blocks: every grid cell inset from its streets, minus the river corridor and the park.
    const cols = [[0, 120], [120, 300], [300, 410], [540, 650], [650, 850], [850, 1000]];
    const rows = [[0, 180], [180, 350], [350, 520], [520, 700]];
    const blocks = [];
    const inset = (a, b, edgeA, edgeB) => [a + (edgeA ? 14 : 10), b - (edgeB ? 14 : 10)];
    cols.forEach(([x0, x1]) => rows.forEach(([y0, y1]) => {
      if (x0 === 650 && y0 === 350) return; // the park
      const ys = x0 >= 650 && y0 === 520 ? [[520, 640], [640, 700]] : [[y0, y1]]; // Dock Ln splits the south-east cells
      ys.forEach(([ya, yb]) => {
        const [bx0, bx1] = inset(x0, x1, x0 !== 410 && x0 !== 540, x1 !== 410);
        const [by0, by1] = inset(ya, yb, true, true);
        blocks.push([bx0, by0, bx1 - bx0, by1 - by0]);
      });
    }));
    return { w, h, streets, park, river, blocks, city: CITY };
  }());

  // Client posts with their default (client-level) schedule, geofence, grace minutes and rate card.
  // days use getUTCDay numbering: 0 Sunday .. 6 Saturday. Money is in the invented currency ¤.
  const POSTS = [
    { id: 'p1', name: 'Harbor View Tower', code: 'HVT', address: '12 Harbor Blvd', loc: { x: 900, y: 265 },
      days: [1, 2, 3, 4, 5], start: hm(8, 0), end: hm(17, 0), radius: 80, grace: 10,
      rate: { day: 680, night: 720, allowance: 300, uniform: 150 } },
    { id: 'p2', name: 'Northgate Depot', code: 'NGD', address: '4 Quarry St', loc: { x: 210, y: 95 },
      days: [1, 2, 3, 4, 5], start: hm(8, 0), end: hm(17, 0), radius: 120, grace: 5,
      rate: { day: 640, night: 700, allowance: 260, uniform: 150 } },
    { id: 'p3', name: 'Lindell Arcade', code: 'LDA', address: '30 Ferry Rd', loc: { x: 720, y: 600 },
      days: [1, 2, 3, 4, 5, 6], start: hm(9, 0), end: hm(18, 0), radius: 60, grace: 15,
      rate: { day: 660, night: 710, allowance: 280, uniform: 150 } },
  ];

  // Guards. schedule: null inherits the post schedule; placeholder rows only override the radius;
  // a full individual schedule replaces the fields it sets. route: from home along the streets to the post.
  const GUARDS = [
    { id: 'g1', name: 'Mara Quill', empNo: 'LW-0101', role: 3, postId: 'p1', shift: 'day', schedule: null,
      route: [[880, 110], [850, 110], [850, 265], [900, 265]] },
    { id: 'g2', name: 'Teo Brandt', empNo: 'LW-0102', role: 4, postId: 'p1', shift: 'day', schedule: null,
      route: [[60, 600], [120, 600], [120, 520], [850, 520], [850, 265], [900, 265]] },
    { id: 'g3', name: 'Noor Hadley', empNo: 'LW-0103', role: 4, postId: 'p1', shift: 'day', schedule: null,
      route: [[930, 600], [930, 640], [850, 640], [850, 265], [900, 265]] },
    { id: 'g4', name: 'Imani Sol', empNo: 'LW-0201', role: 4, postId: 'p2', shift: 'day', schedule: null,
      route: [[40, 260], [120, 260], [120, 95], [210, 95]] },
    { id: 'g5', name: 'Bram Ellery', empNo: 'LW-0202', role: 4, postId: 'p2', shift: 'night',
      schedule: { start: hm(22, 0), end: hm(6, 0) },
      route: [[580, 420], [650, 420], [650, 180], [120, 180], [120, 95], [210, 95]] },
    { id: 'g6', name: 'Ivo Kestner', empNo: 'LW-0301', role: 4, postId: 'p3', shift: 'day',
      schedule: { placeholder: true, radius: 90 },
      route: [[240, 430], [300, 430], [300, 520], [650, 520], [650, 600], [720, 600]] },
  ];

  const HOLIDAYS = [
    { date: '2026-10-09', name: 'Founders’ Day (fictional)', type: 'special' },
    { date: '2026-10-21', name: 'Harvest Rest Day (fictional)', type: 'regular' },
  ];

  // Invented contribution rules. They only echo the shape of statutory tables (a salary credit with a top-up
  // band, a capped percentage split between worker and employer, a two-tier housing fund); none of the values
  // belong to any real agency.
  const SETTINGS = {
    social: { step: 1000, min: 3000, max: 24000, eePct: 4, erPct: 8, threshold: 15000, topUpEePct: 2, topUpErPct: 2,
      ecCutoff: 12000, ecLow: 10, ecHigh: 25 },
    health: { pct: 4, floor: 8000, ceiling: 60000, max: 2400 },
    housing: { threshold: 1200, lowPct: 1, highPct: 2, cap: 6000, maxEe: 120, erPct: 2 },
    cashBond: 50,
    mealBreak: { start: hm(12, 0), minutes: 60 }, // unpaid, deducted from any worked span that covers it
    otMultiplier: 1.25,
    ndPct: 10,
  };

  // History before today. Every scheduled day is worked a few minutes early unless listed here.
  const SEED_EXCEPTIONS = [
    { g: 'g1', date: '2026-10-02', outDelta: 60 }, // one hour of overtime
    { g: 'g2', date: '2026-10-06', inDelta: 18 }, // late: 8 minutes past the 10-minute grace
    { g: 'g4', date: '2026-10-07', absent: true }, // a pending emergency leave was filed for this day
    { g: 'g6', date: '2026-10-08', outDelta: 125 }, // about two hours of overtime
    { g: 'g3', date: '2026-10-12', absent: true }, // approved sick leave
    { g: 'g3', date: '2026-10-13', absent: true },
    { g: 'g2', date: '2026-10-13', verify: 'failed' }, // face match failed, shows as Needs Review
  ];

  const SEED_LEAVES = [
    { id: 'lv1', gid: 'g3', type: 'SL', from: '2026-10-12', to: '2026-10-13', status: 'approved', by: 'Admin' },
    { id: 'lv2', gid: 'g4', type: 'EL', from: '2026-10-07', to: '2026-10-07', status: 'pending', by: 'Finance' },
    { id: 'lv3', gid: 'g1', type: 'VL', from: '2026-10-20', to: '2026-10-21', status: 'pending', by: 'Finance' },
  ];

  const SEED_ACTIVITY = [
    { date: '2026-10-14', sec: hm(18, 20) * 60, text: 'Admin approved sick leave (SL) for Noor Hadley, Oct 12 – 13.' },
    { date: '2026-10-14', sec: hm(16, 5) * 60, text: 'Finance filed vacation leave (VL) for Mara Quill, Oct 20 – 21.' },
    { date: '2026-10-13', sec: hm(9, 12) * 60, text: 'Face match failed on Teo Brandt’s time-in. Marked Needs Review.' },
    { date: '2026-10-12', sec: hm(10, 30) * 60, text: 'Admin set the Lindell Arcade radius for Ivo Kestner to 90 m.' },
  ];

  // Other guards' phones, scripted so the console keeps receiving check-ins. An entry is skipped when its
  // guard is the one on the demo phone, or when the move no longer fits that guard's status.
  const FEED = [
    { at: hm(7, 57) * 60, g: 'g2', op: 'in' },
    { at: hm(8, 14) * 60, g: 'g3', op: 'in' }, // 4 minutes past the grace cutoff: Late
    { at: hm(8, 51) * 60, g: 'g6', op: 'in' },
    { at: hm(17, 3) * 60, g: 'g4', op: 'out' },
    { at: hm(17, 4) * 60, g: 'g2', op: 'out' },
    { at: hm(17, 6) * 60, g: 'g1', op: 'out' },
    { at: hm(17, 9) * 60, g: 'g3', op: 'out' },
    { at: hm(18, 4) * 60, g: 'g6', op: 'out' },
  ];

  // ---------------------------------------------------------------- small pure helpers

  const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const guard = (id) => GUARDS.find((g) => g.id === id);
  const post = (id) => POSTS.find((p) => p.id === id);

  const dayMs = (iso) => Date.parse(iso + 'T00:00:00Z');
  const dow = (iso) => new Date(dayMs(iso)).getUTCDay();
  const addDays = (iso, n) => new Date(dayMs(iso) + n * 86400000).toISOString().slice(0, 10);
  const daysBetween = (a, b) => Math.round((dayMs(b) - dayMs(a)) / 86400000);
  function datesBetween(a, b) {
    const out = [];
    for (let d = a; d <= b; d = addDays(d, 1)) out.push(d);
    return out;
  }

  // The real app measures great-circle (haversine) distance between GPS fixes. This map is a flat plane in
  // metres, where straight-line distance is what haversine gives at town scale.
  const distanceM = (a, b) => Math.round(Math.hypot(a.x - b.x, a.y - b.y));

  const routePoints = (gid) => guard(gid).route.map(([x, y]) => ({ x, y }));
  function routeLength(pts) {
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    return len;
  }
  // Points of the route from its start up to `dist` metres along it; the last point is the position there.
  function routeUntil(pts, dist) {
    const out = [pts[0]];
    let left = dist;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      if (left >= seg) { out.push(b); left -= seg; continue; }
      const t = seg ? left / seg : 0;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      break;
    }
    return out;
  }
  const pointAlong = (pts, dist) => routeUntil(pts, dist).pop();

  // Stand-in for reverse geocoding: the closest street to a point, then the city.
  function nearestStreet(pt) {
    let best = null, bestD = Infinity;
    MAP.streets.forEach((s) => {
      const [ax, ay] = s.a, [bx, by] = s.b;
      const x = clamp(pt.x, Math.min(ax, bx), Math.max(ax, bx));
      const y = clamp(pt.y, Math.min(ay, by), Math.max(ay, by));
      const d = Math.hypot(pt.x - x, pt.y - y);
      if (d < bestD) { bestD = d; best = s.name; }
    });
    return { street: best, city: CITY };
  }

  // ---------------------------------------------------------------- schedule and geofence rules

  // Effective schedule for a guard: the post's schedule, with an individual schedule's fields on top and the
  // radius taken from the guard's own override when one exists. radiusSource names the record an edit changes.
  function schedule(s, gid) {
    const g = guard(gid), p = post(g.postId), own = g.schedule;
    const sch = { days: p.days, start: p.start, end: p.end };
    if (own && !own.placeholder) ['days', 'start', 'end'].forEach((k) => { if (own[k] != null) sch[k] = own[k]; });
    const ownRadius = s.radius[gid] != null;
    return {
      ...sch,
      radius: ownRadius ? s.radius[gid] : s.radius[p.id],
      radiusSource: ownRadius ? gid : p.id,
      handler: own && !own.placeholder ? 'Individual' : 'Client',
      grace: p.grace,
      loc: p.loc,
      postId: p.id,
      overnight: sch.end <= sch.start,
    };
  }

  // Whether a time-in is allowed at `min` (minutes since midnight) on `date`. Early time-in is allowed on an
  // assigned day; overnight shifts also allow the morning after an assigned day until the end time.
  function scheduleAllows(sch, date, min) {
    if (!sch.days || !sch.days.length || sch.start == null || sch.end == null) return false;
    const today = sch.days.includes(dow(date));
    if (sch.end > sch.start) return today && min <= sch.end;
    const yesterday = sch.days.includes(dow(addDays(date, -1)));
    return (today && min >= sch.start) || (yesterday && min <= sch.end) || (today && min <= sch.end && min < 720);
  }

  const nowMin = (s) => Math.floor(s.nowSec / 60);
  const travelled = (s, gid) => s.travel[gid] || 0;
  const position = (s, gid) => pointAlong(routePoints(gid), travelled(s, gid));

  // Distance to the post and whether the guard is inside the geofence (radius plus the fixed buffer).
  function proximity(s, gid) {
    const sch = schedule(s, gid);
    const pos = position(s, gid);
    const distance = distanceM(pos, sch.loc);
    const len = routeLength(routePoints(gid));
    const remaining = Math.max(0, len - travelled(s, gid));
    return {
      pos, distance, radius: sch.radius, inside: distance <= sch.radius + BUFFER_M,
      remaining, etaMin: remaining / TRAVEL_MPS / 60, arrived: remaining < 0.5,
      walking: s.walking && s.guardId === gid,
    };
  }

  const leaveOn = (s, gid, date) =>
    s.leaves.find((l) => l.gid === gid && l.status === 'approved' && l.from <= date && date <= l.to) || null;

  const logsFor = (s, q = {}) => s.logs.filter((l) =>
    (!q.gid || l.gid === q.gid) && (!q.date || l.date === q.date) &&
    (!q.from || l.date >= q.from) && (!q.to || l.date <= q.to));

  // pending (nothing yet) -> open (timed in) -> completed (timed out); processing while a write is in flight,
  // offline_pending while it waits in the offline queue.
  function dayStatus(s, gid, date = TODAY) {
    const queued = s.outbox.find((o) => o.gid === gid && o.date === date);
    if (queued) return queued.offline ? 'offline_pending' : 'processing';
    const log = s.logs.find((l) => l.gid === gid && l.date === date);
    if (!log) return 'pending';
    return log.out != null ? 'completed' : 'open';
  }

  const ALERTS = {
    completed: { title: 'Daily Time Tracking Complete', message: 'You have already completed both time-in and time-out for today. The system will reset tomorrow.' },
    radius: { title: 'Location Error', message: 'You must be within the designated radius to time in/out.' },
    schedule: { title: 'Schedule Error', message: 'You cannot time in outside your scheduled day and time. Please check your schedule.' },
  };

  // What the big phone button may do right now. alert is the dialog to show on a blocked tap.
  function canClock(s, gid) {
    const status = dayStatus(s, gid);
    const prox = proximity(s, gid);
    const base = { status, inside: prox.inside, distance: prox.distance, radius: prox.radius };
    if (status === 'completed') return { ...base, op: null, enabled: false, alert: ALERTS.completed };
    if (status === 'processing' || status === 'offline_pending') return { ...base, op: null, enabled: false, alert: null };
    const op = status === 'open' ? 'out' : 'in';
    if (!prox.inside) return { ...base, op, enabled: false, alert: ALERTS.radius };
    if (op === 'in') {
      const leave = leaveOn(s, gid, TODAY);
      if (leave) return { ...base, op, enabled: false, alert: { title: 'Leave Status', message: `You are currently on leave (${leave.type}) and cannot time in.` } };
      if (!scheduleAllows(schedule(s, gid), TODAY, nowMin(s))) return { ...base, op, enabled: false, alert: ALERTS.schedule };
    }
    return { ...base, op, enabled: true, alert: null };
  }

  // Minutes left in the grace window, or 0 when the window is not open.
  function graceRemaining(s, gid) {
    const sch = schedule(s, gid), now = nowMin(s);
    if (!sch.grace || dayStatus(s, gid) !== 'pending' || !sch.days.includes(dow(TODAY))) return 0;
    return now >= sch.start && now < sch.start + sch.grace ? sch.start + sch.grace - now : 0;
  }

  const pad2 = (n) => String(n).padStart(2, '0');

  // Team-lead board status for one guard on one date. key: ontime | late | absent | duty | rest | leave.
  function memberStatus(s, gid, date = TODAY) {
    const leave = leaveOn(s, gid, date);
    if (leave) return { key: 'leave', label: `On Leave · ${leave.type}` };
    const sch = schedule(s, gid);
    if (!sch.days.includes(dow(date)) || sch.start == null) return { key: 'rest', label: 'Rest day' };
    const now = date === TODAY ? nowMin(s) : date < TODAY ? Infinity : -Infinity;
    const cutoff = sch.start + sch.grace;
    const log = s.logs.find((l) => l.gid === gid && l.date === date && l.in != null);
    if (log) {
      if (log.in > cutoff) {
        const late = log.in - cutoff;
        return { key: 'late', label: `Late by ${pad2(Math.floor(late / 60))}h:${pad2(late % 60)}m`, minutes: late };
      }
      return { key: 'ontime', label: `On time · ${fmt.time(log.in)}` };
    }
    if (now > cutoff) return { key: 'absent', label: 'Absent' };
    return { key: 'duty', label: `Duty starts ${fmt.time(sch.start)}` };
  }

  // Web status dot for one attendance row.
  function attendanceStatus(log) {
    if (log.verify === 'failed') return { key: 'review', label: 'Needs Review' };
    if (log.verify === 'verified') return log.out != null ? { key: 'completed', label: 'Completed' } : { key: 'progress', label: 'In Progress' };
    if (log.verify === 'pending') return { key: 'progress', label: 'In Progress' };
    return { key: 'loading', label: 'Loading' };
  }

  const scheduledOn = (s, gid, date) => schedule(s, gid).days.includes(dow(date));

  // Dashboard counts for one date, compared by the web console with the day before.
  function kpis(s, date = TODAY) {
    const scheduled = GUARDS.filter((g) => scheduledOn(s, g.id, date) && !leaveOn(s, g.id, date));
    const active = new Set(s.logs.filter((l) => l.date === date && l.in != null).map((l) => l.gid));
    const count = { ontime: 0, late: 0, absent: 0 };
    GUARDS.forEach((g) => { const k = memberStatus(s, g.id, date).key; if (k in count) count[k]++; });
    return {
      active: active.size, onTime: count.ontime, late: count.late,
      absent: count.absent, // scheduled, not on leave, and past the grace cutoff with no time-in
      pendingLeaves: s.leaves.filter((l) => l.status === 'pending').length,
      posts: POSTS.length,
      scheduled: scheduled.length,
    };
  }

  // Share of scheduled guards with a time-in on a date. pct is null on a day with no scheduled shifts.
  function attendanceRate(s, date) {
    const scheduled = GUARDS.filter((g) => scheduledOn(s, g.id, date) && !leaveOn(s, g.id, date));
    const present = scheduled.filter((g) => s.logs.some((l) => l.gid === g.id && l.date === date && l.in != null)).length;
    return { date, present, scheduled: scheduled.length, pct: scheduled.length ? Math.round((present / scheduled.length) * 100) : null };
  }

  // ---------------------------------------------------------------- payroll (pure)

  // Worked minutes between 22:00 and 06:00 inside [a, b], both in minutes from the log date's midnight.
  function nightMinutes(a, b) {
    let total = 0;
    for (let k = 0; k < 3; k++) {
      const lo = k * 1440 - 120, hi = k * 1440 + 360;
      total += Math.max(0, Math.min(b, hi) - Math.max(a, lo));
    }
    return total;
  }
  // Minutes of the unpaid meal break inside [a, b]; the break repeats every day, like the night window.
  function breakMinutes(a, b) {
    const { start, minutes } = SETTINGS.mealBreak;
    let total = 0;
    for (let k = 0; k < 3; k++) total += Math.max(0, Math.min(b, k * 1440 + start + minutes) - Math.max(a, k * 1440 + start));
    return total;
  }

  function socialFund(monthly) {
    const c = SETTINGS.social;
    const credit = clamp(Math.ceil(monthly / c.step) * c.step, c.min, c.max);
    const base = Math.min(credit, c.threshold), topUp = Math.max(0, credit - c.threshold);
    const ee = (base * c.eePct + topUp * c.topUpEePct) / 100;
    const er = (base * c.erPct + topUp * c.topUpErPct) / 100 + (credit < c.ecCutoff ? c.ecLow : c.ecHigh);
    return { credit, ee: r2(ee / 2), er: r2(er / 2) }; // monthly figures halved per cut-off
  }
  function healthFund(monthly) {
    const c = SETTINGS.health;
    const total = Math.min(clamp(monthly, c.floor, c.ceiling) * c.pct / 100, c.max);
    const ee = Math.ceil((total / 2) * 100) / 100; // worker share rounded up to the cent
    return { ee: r2(ee / 2), er: r2((total - ee) / 2) };
  }
  function housingFund(monthly) {
    const c = SETTINGS.housing;
    if (monthly <= c.threshold) return { ee: r2(monthly * c.lowPct / 100 / 2), er: r2(monthly * c.erPct / 100 / 2) };
    const capped = Math.min(monthly, c.cap);
    return { ee: r2(Math.min(capped * c.highPct / 100, c.maxEe) / 2), er: r2(capped * c.erPct / 100 / 2) };
  }

  const periodEnded = () => TODAY >= PERIOD.end;

  // One guard's pay for the cut-off, computed from the attendance logs. Returns null when the guard has no
  // complete log in the period (such guards are left off the payroll list).
  function payroll(s, gid) {
    const g = guard(gid), p = post(g.postId), sch = schedule(s, gid);
    const daily = g.shift === 'night' ? p.rate.night : p.rate.day;
    const hourly = daily / 8, otRate = hourly * SETTINGS.otMultiplier, ndRate = hourly * SETTINGS.ndPct / 100;
    const logs = s.logs.filter((l) => l.gid === gid && l.in != null && l.out != null && l.out > l.in &&
      l.date >= PERIOD.start && l.date <= PERIOD.end);
    if (!logs.length) return null;

    const days = [];
    datesBetween(PERIOD.start, PERIOD.end < TODAY ? PERIOD.end : TODAY).forEach((date) => {
      const worked = logs.filter((l) => l.date === date); // overnight logs count on their start date
      const hol = HOLIDAYS.find((x) => x.date === date) || null;
      const row = { date, status: 'absent', label: 'Absent', credited: 0, hours: 0, reg: 0, ot: 0, nd: 0,
        regPay: 0, otPay: 0, ndPay: 0, holiday: hol ? hol.type : null, holPay: 0 };
      if (worked.length) {
        let hours = 0, night = 0;
        worked.forEach((l) => {
          // Paid time runs from the later of the time-in and the scheduled start (arriving early is not paid) to
          // the time-out, so staying past the scheduled end is what earns overtime. The meal break is unpaid.
          // A night-shift time-in after midnight belongs to the shift that started the evening before.
          const start = sch.overnight && l.in < sch.end ? sch.start - 1440 : sch.start;
          const from = Math.min(Math.max(l.in, start), l.out);
          hours += (l.out - from - breakMinutes(from, l.out)) / 60;
          night += nightMinutes(from, l.out) / 60; // the break sits at midday, so it never overlaps night hours
        });
        const day = hours - night;
        const reg = Math.min(8, hours), ot = Math.max(0, hours - 8);
        const dayReg = Math.min(reg, day), nightReg = reg - dayReg; // regular hours fill daytime first
        const dayOt = Math.min(ot, day - dayReg), nightOt = ot - dayOt;
        // Each pay component is rounded to the cent here, and every total below is a sum of rounded parts,
        // so the figures on screen always add up.
        Object.assign(row, { status: 'present', label: 'Present', credited: 1, hours, reg, ot, nd: nightReg + nightOt,
          regPay: r2(reg * hourly), otPay: r2(ot * otRate), ndPay: r2((nightReg + nightOt) * ndRate) });
        if (hol) row.holPay = r2((row.regPay + row.otPay + row.ndPay) * (hol.type === 'regular' ? 1 : 0.3));
      } else if (leaveOn(s, gid, date)) {
        const lv = leaveOn(s, gid, date);
        Object.assign(row, { status: 'leave', label: lv.type, credited: 1, reg: 8, regPay: r2(8 * hourly) });
      } else if (!sch.days.includes(dow(date))) {
        return; // rest day
      } else if (date === TODAY) {
        Object.assign(row, { status: 'today', label: dayStatus(s, gid) === 'open' ? 'In progress' : 'Not in yet' });
      }
      days.push(row);
    });

    const credited = days.reduce((n, d) => n + d.credited, 0);
    const perDayAllow = p.rate.allowance * 12 / 365, perDayUniform = p.rate.uniform * 12 / 365;
    const officerTotal = g.role === 3 && credited ? (s.officer[gid] || 0) : 0;
    let officerLeft = officerTotal, creditedLeft = credited;
    days.forEach((d) => {
      d.allowance = r2(d.credited * perDayAllow);
      d.uniform = r2(d.credited * perDayUniform);
      // The officer allowance is split in whole cents, with the leftover cents on the last credited day.
      d.officer = d.credited ? (--creditedLeft ? Math.floor(Math.round(officerTotal * 100) / credited) / 100 : officerLeft) : 0;
      officerLeft = r2(officerLeft - d.officer);
      d.gross = r2(d.regPay + d.otPay + d.ndPay + d.holPay + d.allowance + d.uniform + d.officer);
    });

    // Each day's value is rounded before it is added, so a total always equals the sum of the rows shown.
    const sum = (k, list = days) => r2(list.reduce((n, d) => n + r2(d[k]), 0));
    const basic = sum('regPay');
    const t = {
      workingDays: credited, hours: sum('hours'), otHours: sum('ot'), ndHours: sum('nd'),
      basic, otPay: sum('otPay'), ndPay: sum('ndPay'),
      regHolPay: sum('holPay', days.filter((d) => d.holiday === 'regular')),
      specHolPay: sum('holPay', days.filter((d) => d.holiday === 'special')),
      restDayPay: 0, // the source keeps this column but pays no rest-day premium
      allowance: sum('allowance'), uniform: sum('uniform'), officer: sum('officer'),
    };
    t.allowances = r2(t.allowance + t.uniform + t.officer);
    t.gross = r2(t.basic + t.otPay + t.ndPay + t.regHolPay + t.specHolPay + t.restDayPay + t.allowances);
    const monthly = basic * 2; // contributions are computed on a monthly basis and halved per cut-off
    t.social = socialFund(monthly);
    t.health = healthFund(monthly);
    t.housing = housingFund(monthly);
    t.cashBond = periodEnded() ? SETTINGS.cashBond : 0;
    t.deductions = r2(t.social.ee + t.health.ee + t.housing.ee + t.cashBond);
    t.employerShare = r2(t.social.er + t.health.er + t.housing.er);
    t.net = r2(t.gross - t.deductions);
    t.thirteenth = r2(basic / 12); // this cut-off's 13th-month accrual, shown only, never added to net pay
    Object.keys(t).forEach((k) => { if (typeof t[k] === 'number') t[k] = r2(t[k]); });
    days.forEach((d) => Object.keys(d).forEach((k) => { if (typeof d[k] === 'number' && k !== 'credited') d[k] = r2(d[k]); }));

    return {
      gid, name: g.name, empNo: g.empNo, role: g.role, postId: p.id, postName: p.name, postCode: p.code, shift: g.shift,
      period: { ...PERIOD }, rates: { daily, hourly: r2(hourly), ot: r2(otRate), nd: r2(ndRate), allowanceMonthly: p.rate.allowance, uniformMonthly: p.rate.uniform },
      days, totals: t, datesWorked: days.filter((d) => d.status === 'present').map((d) => d.date), issued: false,
    };
  }

  // Every payroll row for the cut-off. A guard with an issued (finalized) item shows the stored values.
  function payrollAll(s) {
    const issued = s.payroll.issued;
    return GUARDS.map((g) => (issued && issued.items[g.id]) ? { ...issued.items[g.id], issued: true } : payroll(s, g.id))
      .filter(Boolean);
  }
  const payslipFor = (s, gid) => (s.payroll.issued && s.payroll.issued.items[gid]) ? { ...s.payroll.issued.items[gid], issued: true } : null;
  const requestFor = (s, gid) => s.requests.find((r) => r.gid === gid) || null;

  // ---------------------------------------------------------------- formatting

  const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  const dateLong = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const dateShort = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

  const fmt = {
    // minutes since midnight -> "07:58 AM" or "07:58"; values past 24:00 wrap to the next day
    time(min, h24 = false) {
      const m = ((Math.round(min) % 1440) + 1440) % 1440, hh = Math.floor(m / 60), mm = m % 60;
      return h24 ? `${pad2(hh)}:${pad2(mm)}` : `${pad2(hh % 12 || 12)}:${pad2(mm)} ${hh < 12 ? 'AM' : 'PM'}`;
    },
    // seconds since midnight -> "07:41:09 AM" or "07:41:09"
    clock(sec, h24 = false) {
      const t = Math.floor(sec), hh = Math.floor(t / 3600) % 24, mm = Math.floor(t / 60) % 60, ss = t % 60;
      return h24 ? `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}` : `${pad2(hh % 12 || 12)}:${pad2(mm)}:${pad2(ss)} ${hh < 12 ? 'AM' : 'PM'}`;
    },
    range: (start, end, h24 = false) => `${fmt.time(start, h24)} - ${fmt.time(end, h24)}`,
    date: (iso) => dateFmt.format(new Date(dayMs(iso))), // "Thu, Oct 15"
    dateLong: (iso) => dateLong.format(new Date(dayMs(iso))), // "Thursday, October 15, 2026"
    dateShort: (iso) => dateShort.format(new Date(dayMs(iso))), // "Oct 15"
    money: (n) => (n < 0 ? '−' : '') + '¤' + money.format(Math.abs(n)), // "¤1,234.56"
    hm(hours) { const m = Math.round(hours * 60); return `${Math.floor(m / 60)}h ${m % 60}m`; }, // "8h 12m"
    hours: (h) => (Math.round(h * 100) / 100).toFixed(2),
    metres: (m) => `${Math.round(m).toLocaleString('en-US')} m`,
    eta: (min) => (min <= 0 ? 'arrived' : min < 1 ? '< 1 min' : `${Math.ceil(min)} min`),
    days: (days) => days.map((d) => DAY_LETTERS[d]).join(','),
    period: (p = PERIOD) => `${p.start} to ${p.end}`,
  };

  // ---------------------------------------------------------------- store

  const A = {
    RESET: 'RESET', TICK: 'TICK', SET_SPEED: 'SET_SPEED', ADVANCE: 'ADVANCE',
    SELECT_GUARD: 'SELECT_GUARD', WALK_START: 'WALK_START', WALK_STOP: 'WALK_STOP', ARRIVE: 'ARRIVE',
    SET_ONLINE: 'SET_ONLINE', CLOCK_REQUEST: 'CLOCK_REQUEST', WRITE: 'WRITE', VERIFY: 'VERIFY',
    SET_RADIUS: 'SET_RADIUS', SET_LEAVE: 'SET_LEAVE', OVERRIDE: 'OVERRIDE', SET_OFFICER: 'SET_OFFICER',
    FINALIZE: 'FINALIZE', REQUEST_PAPER: 'REQUEST_PAPER', ADVANCE_REQUEST: 'ADVANCE_REQUEST',
  };

  function seedLogs() {
    const logs = [];
    let n = 0;
    const seedRadius = initialRadius();
    GUARDS.forEach((g, gi) => {
      const sch = schedule({ radius: seedRadius }, g.id);
      const p = post(g.postId), place = `${p.address.replace(/^\d+\s/, '')}, ${CITY}`;
      datesBetween(PERIOD.start, addDays(TODAY, -1)).forEach((date, di) => {
        if (!sch.days.includes(dow(date))) return;
        const ex = SEED_EXCEPTIONS.find((e) => e.g === g.id && e.date === date) || {};
        if (ex.absent) return;
        const end = sch.overnight ? sch.end + 1440 : sch.end;
        logs.push({
          id: 'S' + (++n), gid: g.id, postId: g.postId, date,
          in: sch.start + (ex.inDelta != null ? ex.inDelta : -(4 + ((di * 7 + gi * 5) % 11))),
          out: end + (ex.outDelta != null ? ex.outDelta : 2 + ((di * 3 + gi) % 9)),
          inLoc: place, outLoc: place, verify: ex.verify || 'verified',
          match: ex.verify === 'failed' ? 0.71 : r2(0.3 + ((di + gi * 3) % 9) / 50),
          source: 'seed', via: 'face', overrides: [],
        });
      });
    });
    // Already on post this morning.
    [['g4', hm(7, 39)], ['g1', hm(7, 48)]].forEach(([gid, min]) => {
      const p = post(guard(gid).postId);
      logs.push({ id: 'S' + (++n), gid, postId: p.id, date: TODAY, in: min, out: null,
        inLoc: `${p.address.replace(/^\d+\s/, '')}, ${CITY}`, outLoc: null, verify: 'verified', match: 0.34,
        source: 'seed', via: 'face', overrides: [] });
    });
    return logs;
  }

  function initialRadius() {
    const r = {};
    POSTS.forEach((p) => { r[p.id] = p.radius; });
    GUARDS.forEach((g) => { if (g.schedule && g.schedule.radius != null) r[g.id] = g.schedule.radius; });
    return r;
  }

  function initialState() {
    const s = {
      nowSec: START_SEC, speed: 10, online: true, guardId: 'g2', walking: false,
      travel: {}, radius: initialRadius(), logs: seedLogs(), outbox: [],
      leaves: SEED_LEAVES.map((l) => ({ ...l })), officer: { g1: 400 },
      payroll: { issued: null, count: 0 }, requests: [], activity: SEED_ACTIVITY.map((a) => ({ ...a })),
      fired: [], seq: 100,
    };
    // Guards who already timed in today stand at their post; everyone else starts at home.
    GUARDS.forEach((g) => { s.travel[g.id] = dayStatus(s, g.id) === 'open' ? routeLength(routePoints(g.id)) : 0; });
    return s;
  }

  function addActivity(s, text) {
    s.activity.unshift({ date: TODAY, sec: Math.floor(s.nowSec), text });
    s.activity.length = Math.min(s.activity.length, 40);
  }

  const placeText = (s, gid) => { const n = nearestStreet(position(s, gid)); return `${n.street}, ${n.city}`; };

  // Applies one clock event (from the phone, the offline queue or the scripted feed) to the attendance log.
  function applyClock(s, op, source) {
    const g = guard(op.gid);
    if (op.op === 'in') {
      if (s.logs.some((l) => l.gid === op.gid && l.date === op.date && l.in != null)) return null;
      const log = { id: 'L' + (++s.seq), gid: op.gid, postId: g.postId, date: op.date, in: op.min, out: null,
        inLoc: op.loc, outLoc: null, verify: 'pending', match: null, source, via: op.via, overrides: [] };
      s.logs.push(log);
      addActivity(s, `${g.name} timed in at ${fmt.time(op.min)}${source === 'offline' ? ' (synced from the offline queue)' : ''}.`);
      return log;
    }
    const open = s.logs.filter((l) => l.gid === op.gid && l.in != null && l.out == null).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    if (open) {
      open.out = op.min + 1440 * daysBetween(open.date, op.date);
      open.outLoc = op.loc;
      open.verify = 'pending';
      addActivity(s, `${g.name} timed out at ${fmt.time(op.min)}${source === 'offline' ? ' (synced from the offline queue)' : ''}.`);
      return open;
    }
    const log = { id: 'L' + (++s.seq), gid: op.gid, postId: g.postId, date: op.date, in: null, out: op.min,
      inLoc: null, outLoc: op.loc, verify: 'pending', match: null, source, via: op.via, overrides: [] };
    s.logs.push(log);
    addActivity(s, `${g.name} timed out at ${fmt.time(op.min)} with no open time-in.`);
    return log;
  }

  // Runs the scripted check-ins whose time has come.
  function fireFeed(s) {
    FEED.forEach((f, i) => {
      if (s.fired.includes(i) || f.at > s.nowSec) return;
      s.fired.push(i);
      if (f.g === s.guardId) return;
      const status = dayStatus(s, f.g);
      const min = Math.floor(f.at / 60);
      if (f.op === 'in' && (status !== 'pending' || leaveOn(s, f.g, TODAY) || !scheduleAllows(schedule(s, f.g), TODAY, min))) return;
      if (f.op === 'out' && status !== 'open') return;
      s.travel[f.g] = routeLength(routePoints(f.g));
      applyClock(s, { gid: f.g, op: f.op, date: TODAY, min, loc: placeText(s, f.g), via: 'face' }, 'feed');
    });
  }

  function setTime(s, sec) {
    s.nowSec = clamp(sec, s.nowSec, DAY_END_SEC); // time only moves forward
    fireFeed(s);
  }

  function reduce(prev, action) {
    if (action.type === A.RESET) return initialState();
    // ponytail: the whole state is cloned per action (about 100 small rows, 4 ticks a second); switch to
    // targeted copies if the dataset ever grows a lot.
    const s = structuredClone(prev);
    const gid = action.guardId || s.guardId;
    switch (action.type) {
      case A.TICK: {
        const adv = s.speed * (action.dt || TICK_MS / 1000);
        if (s.walking && adv > 0) {
          const len = routeLength(routePoints(s.guardId));
          s.travel[s.guardId] = Math.min(len, travelled(s, s.guardId) + TRAVEL_MPS * adv);
          if (s.travel[s.guardId] >= len) s.walking = false;
        }
        setTime(s, s.nowSec + adv);
        break;
      }
      case A.SET_SPEED:
        if (SPEEDS.includes(action.speed)) s.speed = action.speed;
        break;
      case A.ADVANCE:
        setTime(s, action.to != null ? action.to : s.nowSec + (action.sec || 0));
        break;
      case A.SELECT_GUARD:
        if (guard(action.guardId)) { s.guardId = action.guardId; s.walking = false; }
        break;
      case A.WALK_START:
        s.walking = proximity(s, s.guardId).remaining > 0;
        break;
      case A.WALK_STOP:
        s.walking = false;
        break;
      case A.ARRIVE:
        s.travel[s.guardId] = routeLength(routePoints(s.guardId));
        s.walking = false;
        break;
      case A.SET_ONLINE:
        s.online = !!action.online;
        // Back online: queued events are released in the order they were made, keeping their original time.
        if (s.online) s.outbox.forEach((o) => { if (o.offline) { o.offline = false; o.fromQueue = true; } });
        // Going offline: anything not yet written, even one already on its way, waits in the queue instead.
        else s.outbox.forEach((o) => { o.offline = true; });
        break;
      case A.CLOCK_REQUEST: {
        const check = canClock(s, gid);
        if (!check.enabled || check.op !== action.op) break;
        s.outbox.push({ id: 'Q' + (++s.seq), gid, op: action.op, date: TODAY, min: nowMin(s), loc: placeText(s, gid),
          via: s.online ? (action.via || 'face') : 'offline', offline: !s.online, fromQueue: false, createdSec: Math.floor(s.nowSec) });
        break;
      }
      case A.WRITE: {
        const i = s.outbox.findIndex((o) => o.id === action.id);
        if (i < 0) break;
        const [op] = s.outbox.splice(i, 1);
        applyClock(s, op, op.fromQueue ? 'offline' : 'phone');
        break;
      }
      case A.VERIFY: {
        const log = s.logs.find((l) => l.id === action.logId);
        if (log && log.verify === 'pending') {
          log.verify = 'verified';
          log.match = r2(0.31 + (Number(log.id.replace(/\D/g, '')) % 17) / 100); // below 0.60 counts as a match
        }
        break;
      }
      case A.SET_RADIUS: {
        const r = Math.round(clamp(Number(action.radius) || 0, 10, 10000));
        if (s.radius[action.target] == null) break;
        s.radius[action.target] = r;
        const who = post(action.target) ? post(action.target).name : `${guard(action.target).name} (individual)`;
        addActivity(s, `Admin set the radius for ${who} to ${r} m.`);
        break;
      }
      case A.SET_LEAVE: {
        const lv = s.leaves.find((l) => l.id === action.id);
        if (!lv || !['approved', 'rejected', 'pending'].includes(action.status)) break;
        lv.status = action.status;
        lv.by = 'Admin';
        addActivity(s, `Admin ${action.status} ${LEAVE_TYPES[lv.type].toLowerCase()} leave (${lv.type}) for ${guard(lv.gid).name}.`);
        break;
      }
      case A.OVERRIDE: {
        const log = s.logs.find((l) => l.id === action.logId);
        const reason = String(action.reason || '').trim();
        const key = { in: 'in', out: 'out', loc: 'inLoc' }[action.field];
        if (!log || !reason || !key || (key !== 'inLoc' && !Number.isFinite(action.value))) break;
        log.overrides.push({ field: action.field, prev: log[key], next: action.value, reason, by: 'Admin (demo)', date: TODAY, sec: Math.floor(s.nowSec) });
        log[key] = action.value;
        addActivity(s, `Admin overrode ${action.field === 'loc' ? 'the location' : action.field === 'in' ? 'the time-in' : 'the time-out'} for ${guard(log.gid).name} on ${fmt.dateShort(log.date)}.`);
        break;
      }
      case A.SET_OFFICER: {
        const g = guard(action.guardId);
        if (!g || g.role !== 3) break;
        s.officer[g.id] = r2(Math.max(0, Number(action.amount) || 0));
        addActivity(s, `Admin set the officer allowance for ${g.name} to ${fmt.money(s.officer[g.id])}.`);
        break;
      }
      case A.FINALIZE: {
        if (!periodEnded()) break;
        const items = {};
        payrollAll({ ...s, payroll: { issued: null } }).forEach((p) => { items[p.gid] = { ...p, issued: true }; });
        // n counts every finalize, so views can tell two issues apart even within the same simulated second.
        s.payroll.issued = { n: ++s.payroll.count, date: TODAY, sec: Math.floor(s.nowSec), items };
        addActivity(s, `Admin finalized payroll for ${PERIOD.label}: ${Object.keys(items).length} payslips issued.`);
        break;
      }
      case A.REQUEST_PAPER: {
        if (!payslipFor(s, gid) || requestFor(s, gid)) break;
        s.requests.push({ id: 'R' + (++s.seq), gid, period: PERIOD.label, status: 'requested', date: TODAY, sec: Math.floor(s.nowSec) });
        addActivity(s, `${guard(gid).name} requested a paper copy of the ${PERIOD.label} payslip.`);
        break;
      }
      case A.ADVANCE_REQUEST: {
        const req = s.requests.find((r) => r.id === action.id);
        const next = { requested: 'processing', processing: 'printed', printed: 'delivered' };
        if (!req || !next[req.status]) break;
        req.status = next[req.status];
        addActivity(s, `Payslip request for ${guard(req.gid).name} marked ${req.status}.`);
        break;
      }
      default:
        return prev;
    }
    return s;
  }

  let state = initialState();
  const listeners = new Set();
  const timers = new Set();
  const scheduled = new Set();
  const writes = new Map(); // outbox id -> the timer that will write it

  function later(ms, fn) {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
    return t;
  }

  // Simulated backend latency: an online clock event is written about a second after the request, queued
  // events follow each other in order once the phone is back online, and every new or updated photo is face
  // checked a couple of seconds after it lands.
  function runEffects(prev, next, action) {
    if (action.type === A.RESET) {
      timers.forEach(clearTimeout);
      timers.clear();
      scheduled.clear();
      writes.clear();
    }
    let queued = 0;
    next.outbox.forEach((o) => {
      if (o.offline) {
        // The phone went offline before this write landed: drop its timer so the next reconnect re-arms it
        // in queue order.
        if (writes.has(o.id)) { clearTimeout(writes.get(o.id)); timers.delete(writes.get(o.id)); writes.delete(o.id); }
        return;
      }
      if (writes.has(o.id)) return;
      writes.set(o.id, later(o.fromQueue ? 1500 + 500 * queued++ : 1200, () => {
        writes.delete(o.id);
        // Write only if the phone is still online and the event is still waiting; otherwise it stays queued.
        const cur = state.outbox.find((x) => x.id === o.id);
        if (state.online && cur && !cur.offline) dispatch({ type: A.WRITE, id: o.id });
      }));
    });
    next.logs.forEach((l) => {
      const key = l.id + ':' + (l.out == null ? 'in' : 'out');
      if (l.verify !== 'pending' || scheduled.has(key)) return;
      scheduled.add(key);
      later(2200, () => dispatch({ type: A.VERIFY, logId: l.id }));
    });
    // Announce events that arrive on their own: synced clock rows (from the phone, the queue or other guards).
    const top = (st) => (st.activity[0] ? st.activity[0].sec + '|' + st.activity[0].text : '');
    if (top(next) !== top(prev) && (action.type === A.WRITE || action.type === A.TICK || action.type === A.ADVANCE)) {
      announce(`${next.activity[0].text} The web console received it.`);
    }
  }

  function dispatch(action) {
    const prev = state;
    state = reduce(prev, action);
    if (state === prev) return;
    listeners.forEach((fn) => fn(state, action, prev));
    runEffects(prev, state, action);
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  // ---------------------------------------------------------------- DOM helpers

  let liveTimer = 0;
  // Writes to the page's single polite live region. Clearing first makes a repeated message speak again.
  function announce(msg) {
    const live = document.getElementById('live');
    if (!live) return;
    live.textContent = '';
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { live.textContent = msg; }, 60);
  }

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tiny element builder: h('button', { class: 'btn', onclick: fn, 'aria-pressed': 'false' }, 'Label', child).
  // A style attribute is refused because the page's CSP blocks it; set element.style from script instead.
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'style') throw new Error('TK.h: style attributes are blocked by the CSP; set el.style instead');
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    });
    kids.flat(Infinity).forEach((kid) => { if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : String(kid)); });
    return el;
  }

  const NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'style') throw new Error('TK.svg: style attributes are blocked by the CSP');
      if (k === 'text') el.textContent = v;
      else el.setAttribute(k, String(v));
    });
    if (parent) parent.append(el);
    return el;
  }

  // ---------------------------------------------------------------- map

  // Draws the invented town into `container` and returns { svg, update(state, opts) }.
  // opts for mount: { label, compact }. compact hides street labels and enlarges markers for small maps.
  // opts for update: { guardId, postId, fit: 'all' | 'route' | 'post' }. guardId shows that guard's route and
  // live marker; postId (or the guard's post) is highlighted and its ring turns green while the guard is inside.
  function mountMap(container, opts = {}) {
    const compact = !!opts.compact;
    const root = svg('svg', { viewBox: `0 0 ${MAP.w} ${MAP.h}`, class: 'map' + (compact ? ' map--compact' : ''),
      role: 'img', 'aria-label': opts.label || `Map of ${CITY} (fictional)`, preserveAspectRatio: 'xMidYMid meet', focusable: 'false' });
    svg('rect', { class: 'map-land', x: -2000, y: -2000, width: MAP.w + 4000, height: MAP.h + 4000 }, root);
    MAP.blocks.forEach(([x, y, w, hh]) => svg('rect', { class: 'map-block', x, y, width: w, height: hh, rx: 8 }, root));
    const pk = MAP.park;
    svg('rect', { class: 'map-park', x: pk.x, y: pk.y, width: pk.w, height: pk.h, rx: 18 }, root);
    [[700, 400], [790, 410], [720, 470], [800, 470], [755, 440]].forEach(([cx, cy]) => svg('circle', { class: 'map-tree', cx, cy, r: 13 }, root));
    svg('path', { class: 'map-river', d: MAP.river.d }, root);
    MAP.streets.forEach((st) => svg('line', { class: 'map-street-casing', x1: st.a[0], y1: st.a[1], x2: st.b[0], y2: st.b[1] }, root));
    MAP.streets.forEach((st) => svg('line', { class: 'map-street', x1: st.a[0], y1: st.a[1], x2: st.b[0], y2: st.b[1] }, root));
    const labels = svg('g', { class: 'map-labels', 'aria-hidden': 'true' }, root);
    MAP.streets.forEach((st) => {
      const [x, y, rot] = st.label;
      svg('text', { class: 'map-street-label', x, y, 'text-anchor': 'middle', transform: rot ? `rotate(${rot} ${x} ${y})` : '', text: st.name }, labels);
    });
    const [rx, ry, rr] = MAP.river.label;
    svg('text', { class: 'map-water-label', x: rx, y: ry, 'text-anchor': 'middle', transform: `rotate(${rr} ${rx} ${ry})`, text: MAP.river.name }, labels);
    svg('text', { class: 'map-park-label', x: pk.x + pk.w / 2, y: pk.y + pk.h - 14, 'text-anchor': 'middle', text: pk.name }, labels);

    const route = svg('polyline', { class: 'map-route', points: '' }, root);
    const routeDone = svg('polyline', { class: 'map-route-done', points: '' }, root);
    const rings = {};
    POSTS.forEach((p) => {
      const g = svg('g', { class: 'map-post-group' }, root);
      const ring = svg('circle', { class: 'map-ring', cx: p.loc.x, cy: p.loc.y, r: p.radius }, g);
      svg('rect', { class: 'map-building', x: p.loc.x - 32, y: p.loc.y - 24, width: 64, height: 48, rx: 6 }, g);
      svg('circle', { class: 'map-post', cx: p.loc.x, cy: p.loc.y, r: compact ? 15 : 10 }, g);
      svg('text', { class: 'map-post-label', x: p.loc.x, y: p.loc.y + (compact ? 62 : 46), 'text-anchor': 'middle', text: p.name }, g);
      rings[p.id] = { g, ring };
    });
    const home = svg('circle', { class: 'map-home', r: compact ? 12 : 8, cx: 0, cy: 0 }, root);
    const marker = svg('g', { class: 'map-guard' }, root);
    svg('circle', { class: 'map-guard-halo', r: compact ? 34 : 24, cx: 0, cy: 0 }, marker);
    svg('circle', { class: 'map-guard-dot', r: compact ? 15 : 10, cx: 0, cy: 0 }, marker);

    const scale = svg('g', { class: 'map-scale', 'aria-hidden': 'true' }, root);
    svg('line', { x1: 24, y1: 676, x2: 124, y2: 676 }, scale);
    svg('text', { x: 74, y: 664, 'text-anchor': 'middle', text: '100 m' }, scale);
    container.append(root);

    let lastBox = '';
    function update(s, o = {}) {
      const gid = o.guardId || null;
      const targetPost = o.postId || (gid ? guard(gid).postId : null);
      const prox = gid ? proximity(s, gid) : null;
      POSTS.forEach((p) => {
        const r = gid && p.id === guard(gid).postId ? prox.radius : s.radius[p.id];
        rings[p.id].ring.setAttribute('r', r);
        rings[p.id].g.classList.toggle('is-target', p.id === targetPost);
        rings[p.id].g.classList.toggle('is-inside', !!(prox && p.id === guard(gid).postId && prox.inside));
      });
      if (gid) {
        const pts = routePoints(gid);
        const done = routeUntil(pts, travelled(s, gid));
        route.setAttribute('points', pts.map((q) => `${q.x},${q.y}`).join(' '));
        routeDone.setAttribute('points', done.map((q) => `${q.x},${q.y}`).join(' '));
        home.setAttribute('cx', pts[0].x);
        home.setAttribute('cy', pts[0].y);
        const at = done[done.length - 1];
        marker.style.transform = `translate(${at.x}px, ${at.y}px)`;
        [route, routeDone, home, marker].forEach((el) => el.removeAttribute('visibility'));
        marker.classList.toggle('is-moving', prox.walking);
      } else {
        [route, routeDone, home, marker].forEach((el) => el.setAttribute('visibility', 'hidden'));
      }
      const fit = o.fit || 'all';
      let box = `0 0 ${MAP.w} ${MAP.h}`;
      if (fit === 'route' && gid) box = boxAround(routePoints(gid), post(guard(gid).postId), prox.radius, 70);
      if (fit === 'post' && targetPost) {
        const p = post(targetPost);
        box = boxAround([p.loc], p, gid ? prox.radius : s.radius[p.id], 90);
      }
      if (box !== lastBox) { root.setAttribute('viewBox', box); lastBox = box; }
      const tp = targetPost ? post(targetPost) : null;
      root.setAttribute('aria-label', prox
        ? `Map of ${CITY} (fictional). ${guard(gid).name} is ${fmt.metres(prox.distance)} from ${tp.name}; the radius is ${prox.radius} m, ${prox.inside ? 'inside' : 'outside'}.`
        : tp ? `Map of ${CITY} (fictional) showing ${tp.name} with a ${s.radius[tp.id]} m radius.` : `Map of ${CITY} (fictional) with ${POSTS.length} posts.`);
    }
    return { svg: root, update };
  }

  // A viewBox around some points and a post's ring, padded, kept no smaller than 360 x 252 metres.
  function boxAround(pts, p, radius, pad) {
    const xs = pts.map((q) => q.x).concat([p.loc.x - radius, p.loc.x + radius]);
    const ys = pts.map((q) => q.y).concat([p.loc.y - radius, p.loc.y + radius]);
    let x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
    const w = Math.max(360, x1 - x0), hh = Math.max(252, y1 - y0);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return `${Math.round(cx - w / 2)} ${Math.round(cy - hh / 2)} ${Math.round(w)} ${Math.round(hh)}`;
  }

  // ---------------------------------------------------------------- self-check (logs to the console only on failure)

  (function selfCheck() {
    const s = initialState();
    const ok = (cond, msg) => { if (!cond) console.error('TK self-check failed: ' + msg); };
    GUARDS.forEach((g) => {
      const last = g.route[g.route.length - 1], p = post(g.postId);
      ok(last[0] === p.loc.x && last[1] === p.loc.y, `${g.id} route ends at its post`);
      const pr = payroll(s, g.id);
      if (!pr) return;
      const t = pr.totals;
      ok(t.gross === r2(t.basic + t.otPay + t.ndPay + t.regHolPay + t.specHolPay + t.restDayPay + t.allowances), `${g.id} gross adds up`);
      ok(t.net === r2(t.gross - t.deductions), `${g.id} net = gross - deductions`);
    });
    ok(nightMinutes(hm(22, 0), hm(6, 0) + 1440) === 480, 'a 22:00-06:00 shift is all night hours');
    ok(nightMinutes(hm(8, 0), hm(17, 0)) === 0, 'a day shift has no night hours');
    ok(scheduleAllows({ days: [4], start: hm(8, 0), end: hm(17, 0) }, TODAY, hm(7, 0)), 'early time-in on an assigned day');
    ok(!scheduleAllows({ days: [4], start: hm(8, 0), end: hm(17, 0) }, TODAY, hm(17, 1)), 'no time-in after the shift');
    // Teo's last legs run north up Harbor Blvd and then 50 m east into the post (80 m radius).
    const at = (left) => proximity({ ...s, travel: { ...s.travel, g2: routeLength(routePoints('g2')) - left } }, 'g2');
    ok(at(116.25).distance === 83 && at(116.25).inside, '83 m from an 80 m post is inside thanks to the 5 m buffer');
    ok(at(125).distance === 90 && !at(125).inside, '90 m from an 80 m post is outside');
  }());

  // ---------------------------------------------------------------- start

  window.TK = Object.freeze({
    BRAND, TODAY, PERIOD, CITY, MAP, POSTS, GUARDS, HOLIDAYS, SETTINGS, LEAVE_TYPES, ROLES, DAY_LETTERS,
    SPEEDS, TRAVEL_MPS, BUFFER_M, A,
    getState: () => state, dispatch, subscribe,
    guard, post, schedule, scheduleAllows, proximity, position, routePoints, routeLength, distanceM, nearestStreet,
    dayStatus, canClock, graceRemaining, leaveOn, logsFor, memberStatus, attendanceStatus, kpis, attendanceRate,
    payroll, payrollAll, payslipFor, requestFor, periodEnded, nowMin, addDays, datesBetween, dow,
    fmt, announce, reducedMotion, h, svg, mountMap,
  });

  setInterval(() => dispatch({ type: A.TICK, dt: TICK_MS / 1000 }), TICK_MS);

  const reset = document.getElementById('reset');
  if (reset) reset.addEventListener('click', () => { dispatch({ type: A.RESET }); announce('Demo reset. Everything is back to the start of the morning.'); });
  // Kick the effects once so seeded rows still waiting on a face check get verified.
  runEffects(state, state, { type: 'INIT' });
}());
