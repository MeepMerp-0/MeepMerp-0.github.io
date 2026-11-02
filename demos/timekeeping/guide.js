// Step guide for the fictional timekeeping demo: a bar pinned under the page header that tracks the walkthrough
// (travel to the post, time in, watch the row reach the console, finalize payroll, open the payslip), says what
// to do now and can point at the control. Progress is worked out from the demo state after every change and
// never stored by the guide, so Reset, a guard change and steps done out of order always show the truth.
(function () {
  'use strict';

  const TK = window.TK;
  const bar = document.getElementById('guide');
  if (!TK || !bar) return;
  const { h, A } = TK;

  const $ = (sel) => document.querySelector(sel);
  const shown = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const pick = (...els) => els.find(shown) || null;
  const setText = (el, t) => { if (el.textContent !== t) el.textContent = t; };

  // Guards whose phone has shown an issued payslip since the last Reset. The phone keeps its open screen in
  // its own UI state, so this is read from the page: the payslip card exists only on the open Payslip screen.
  const sawPayslip = new Set();

  // Done flags for the guard on the phone, one per step. A step that depends on an earlier one implies it:
  // a synced row means the guard timed in, and timing in means the guard reached the post.
  function progress(s) {
    const gid = s.guardId;
    const log = s.logs.find((l) => l.gid === gid && l.date === TK.TODAY && l.in != null);
    // match is set by the console's face check and kept through a later time-out, unlike verify.
    const synced = !!log && log.match != null;
    const timedIn = synced || TK.dayStatus(s, gid) !== 'pending';
    const issued = !!s.payroll.issued;
    return [timedIn || TK.proximity(s, gid).inside, timedIn, synced, issued, issued && sawPayslip.has(gid)];
  }

  // Each step's label, what to do now from how(): { text, target } where target finds the control at click time,
  // because the phone and the console redraw their insides, and a past-tense line (did, seen) for a done step.
  const phoneBurger = () => $('#mobile-app .m-burger');
  const STEPS = [
    { label: 'Travel to the post', did: 'The guard reached the post.', seen: () => $('#live-map'), how(s) {
      const walk = () => $('#demo-controls .m-row .btn-primary');
      if (s.walking) return { text: 'The guard is on the way. Watch the map, or press Arrive now to skip ahead.', target: () => { const w = walk(); return w && w.nextElementSibling; } };
      return { text: 'Press Travel to post in the demo controls. TIME IN unlocks inside the post’s radius.', target: walk };
    } },
    { label: 'Time in on the phone', did: 'The guard timed in at the post.', seen: () => $('#mobile-app .m-phone'), how(s) {
      const c = TK.canClock(s, s.guardId);
      if (c.status === 'pending' && c.inside && c.alert && c.alert.title === 'Schedule Error') {
        const sch = TK.schedule(s, s.guardId);
        if (sch.overnight) return { text: `This guard works nights, so TIME IN opens at ${TK.fmt.time(sch.start)}. Pick a day-shift guard instead.`, target: () => $('#m-guard') };
        return { text: 'This guard’s shift is over for today. Reset the demo to start the morning again.', target: () => $('#reset') };
      }
      if (shown($('#mobile-app .m-face'))) return { text: 'Pick the action each prompt on the phone asks for, or use Biometric/PIN to skip the check.', target: () => $('#mobile-app .m-face-acts') };
      if (!shown($('#mobile-app .m-clockbtn'))) return { text: 'Open the phone menu, go back to Home, then press TIME IN.', target: phoneBurger };
      return { text: 'On the phone, press TIME IN, then pass the simulated face check.', target: () => $('#mobile-app .m-clockbtn') };
    } },
    { label: 'Watch the console', did: 'The time-in reached the web console.', seen: () => $('.panel-web'), how(s) {
      if (!s.online && s.outbox.some((o) => o.offline && o.gid === s.guardId)) {
        return { text: 'The phone is offline, so the time-in is queued. Turn Phone online in the demo controls.', target: () => $('#demo-controls [role="switch"]') };
      }
      return { text: 'Watch Recent Activity in the web console: the time-in lands, then its face check finishes.',
        target: () => { const list = $('#web-app .w-activity'); return pick(list && list.closest('.w-card')) || $('.panel-web'); } };
    } },
    { label: 'Finalize payroll', did: 'Payroll is finalized and the payslips are issued.', seen: () => $('.panel-web'), how() {
      if (shown($('#web-app [data-k="finalize"]'))) return { text: 'Press Finalize Period and confirm. Payslips are issued from the attendance logs.', target: () => $('#web-app [data-k="finalize"]') };
      return { text: 'In the web console, open Payroll under Finance.', target: () => pick($('#web-app .w-menu-item[data-page="payroll"]'), $('#web-app .w-burger')) };
    } },
    { label: 'Open the payslip', did: 'The guard opened the payslip on the phone.', seen: () => $('#mobile-app .m-phone'), how() {
      return { text: 'On the phone, open the menu at the top left and choose Payslip.',
        target: () => pick([...document.querySelectorAll('#m-drawer .m-ditem')].pop(), phoneBurger()) };
    } },
  ];
  const DONE = {
    text: 'Walkthrough complete. Reset the demo to try another path, like turning the phone offline before TIME IN.',
    target: () => $('#reset'),
  };

  // ---------------------------------------------------------------- the bar

  const live = h('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  let liveTimer = 0;
  // Its own live region, so these messages never cut off the demo's announcements in #live.
  function say(msg) {
    live.textContent = '';
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { live.textContent = msg; }, 60);
  }

  function check() {
    const root = TK.svg('svg', { viewBox: '0 0 24 24', class: 'gd-check', 'aria-hidden': 'true', focusable: 'false' });
    TK.svg('path', { d: 'M5 12.5l4.5 4.5L19 7.5' }, root);
    return root;
  }
  const items = STEPS.map((st, i) => {
    const done = h('span', { class: 'sr-only', text: ' (done)', hidden: true });
    const btn = h('button', { type: 'button', class: 'gd-btn', 'aria-controls': 'gd-now', onclick: () => view(i) },
      h('span', { class: 'gd-dot', 'aria-hidden': 'true' }, h('span', { class: 'gd-num', text: String(i + 1) }), check()),
      h('span', { class: 'gd-label', text: st.label }), done);
    return { li: h('li', { class: 'gd-step' }, btn), btn, done };
  });
  const count = h('strong', { class: 'gd-count' });
  const text = h('span', { id: 'gd-text' });
  const now = h('p', { id: 'gd-now', class: 'gd-now' }, count, ' ', text);
  const show = h('button', { type: 'button', class: 'btn btn-sm gd-show', 'aria-describedby': 'gd-text', text: 'Show me', onclick: showMe });
  bar.append(h('nav', { class: 'gd-nav', 'aria-label': 'Demo steps' }, h('ol', { class: 'gd-steps' }, items.map((x) => x.li))), now, show, live);

  // The pinned rail and keyboard focus scrolling keep clear of the bar through --guide-h.
  const setHeight = () => document.documentElement.style.setProperty('--guide-h', bar.offsetHeight + 'px');
  if (window.ResizeObserver) new ResizeObserver(setHeight).observe(bar);
  setHeight();

  let flags = null, sig = '', viewing = null, target = null;

  function update(s, action) {
    if (action && action.type === A.RESET) sawPayslip.clear();
    if (s.payroll.issued && shown($('#mobile-app .m-pcard'))) sawPayslip.add(s.guardId);
    const next = progress(s);
    if (next.join() !== sig) {
      // One message per change, naming every step it finished. Reset and a guard change only resync.
      const quiet = !flags || !action || action.type === A.RESET || action.type === A.SELECT_GUARD;
      const fresh = quiet ? [] : next.map((d, i) => (d && !flags[i] ? i + 1 : 0)).filter(Boolean);
      flags = next;
      sig = next.join();
      viewing = null;
      if (fresh.length) {
        const cur = flags.indexOf(false);
        const nums = fresh.length > 1 ? `Steps ${fresh.slice(0, -1).join(', ')} and ${fresh.at(-1)}` : `Step ${fresh[0]}`;
        say(`${nums} done. ${cur < 0 ? 'Walkthrough complete. Reset the demo to try another path.' : `Next: ${STEPS[cur].label}.`}`);
      }
    }
    const cur = flags.indexOf(false); // -1 once every step is done
    items.forEach((x, i) => {
      x.li.classList.toggle('is-done', flags[i]);
      x.li.classList.toggle('is-current', i === cur);
      x.li.classList.toggle('is-viewing', i === viewing);
      x.done.hidden = !flags[i];
      if (i === cur) x.btn.setAttribute('aria-current', 'step'); else x.btn.removeAttribute('aria-current');
    });
    const i = viewing != null ? viewing : cur;
    const info = i < 0 ? DONE : flags[i] ? { text: STEPS[i].did, target: STEPS[i].seen } : STEPS[i].how(s);
    setText(count, i < 0 ? `All ${STEPS.length} steps done.` : `Step ${i + 1} of ${STEPS.length}: ${STEPS[i].label}${flags[i] ? ' (done)' : ''}.`);
    setText(text, info.text);
    target = info.target;
  }

  // Picking a step shows its instruction without touching progress; the bar follows the current step again
  // on the next progress change.
  function view(i) {
    viewing = i === flags.indexOf(false) ? null : i;
    update(TK.getState());
    say(`Step ${i + 1}: ${STEPS[i].label}. ${text.textContent}`);
  }

  let flashed = null, flashTimer = 0;
  function showMe() {
    const el = target && target();
    if (!el) return;
    // Inner scrollers first (the phone screen, wide tables), instantly, so the page scroll measures the final spot.
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      const sx = /auto|scroll/.test(cs.overflowX) && p.scrollWidth > p.clientWidth;
      const sy = /auto|scroll/.test(cs.overflowY) && p.scrollHeight > p.clientHeight;
      if (!sx && !sy) continue;
      const pr = p.getBoundingClientRect(), er = el.getBoundingClientRect();
      if (sx) p.scrollLeft += er.left - pr.left - (p.clientWidth - er.width) / 2;
      if (sy) p.scrollTop += er.top - pr.top - (p.clientHeight - er.height) / 2;
    }
    // Then the page, only when the target is hidden under the bar or below the fold. Centred in the space
    // under the bar when it fits, else its top just under the bar.
    const r = el.getBoundingClientRect(), top = bar.offsetHeight + 8, room = window.innerHeight - top - 8;
    if (r.top < top || r.bottom > window.innerHeight - 8) {
      const y = window.scrollY + r.top - top - Math.max(0, (room - r.height) / 2);
      window.scrollTo({ top: Math.max(0, y), behavior: TK.reducedMotion() ? 'auto' : 'smooth' });
    }
    if (el.matches('button, a[href], input, select, textarea, [tabindex]') && !el.disabled) el.focus({ preventScroll: true });
    if (flashed) flashed.removeAttribute('data-guide-flash');
    clearTimeout(flashTimer);
    flashed = el;
    el.setAttribute('data-guide-flash', '');
    flashTimer = setTimeout(() => { el.removeAttribute('data-guide-flash'); flashed = null; }, 1600);
  }

  // The store ticks four times a second, so the phone's screen (read from the page) is picked up promptly too.
  TK.subscribe((s, action) => update(s, action));
  update(TK.getState());
}());
