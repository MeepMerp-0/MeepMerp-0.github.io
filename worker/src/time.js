// Durations in ms and calendar days. Nothing here reads the clock: every function takes the time as epoch ms.

export const MINUTE = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

const PT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

function pacificParts(ms) {
  const p = Object.fromEntries(PT.formatToParts(ms).map(({ type, value }) => [type, Number(value)]));
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) + (ms % 1000 + 1000) % 1000;
  return { ...p, offset: wall - ms };
}

/** Pacific calendar day of `ms` as 'YYYY-MM-DD' (D9). */
export function pacificDay(ms) {
  const { year, month, day } = pacificParts(ms);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** The next Pacific midnight after `ms`, in ms. DST changes at 02:00, so the offset near midnight is exact. */
export function nextPacificMidnight(ms) {
  const { year, month, day, offset } = pacificParts(ms);
  const wallMidnight = Date.UTC(year, month - 1, day + 1);
  return wallMidnight - pacificParts(wallMidnight - offset).offset;
}

/** UTC calendar day of `ms` as 'YYYY-MM-DD'. */
export const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);
