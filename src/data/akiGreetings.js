export const AKI_GREETINGS = {
  general: [
    'HELLO 👋',
    'HI THERE 👋',
    'HEY THERE 👋',
    "HEY, I'M AKI 👋",
    'WELCOME 🙌',
    'GOOD DAY ☀️',
    'GREETINGS 🤖',
    'NICE TO SEE YOU 😊',
    'MARHABA 👋',
    'KUMUSTA 👋',
    'HOLA 👋',
    'BONJOUR 👋',
    'KONNICHIWA 👋',
  ],
  timed: {
    morning: 'GOOD MORNING ☕',
    afternoon: 'GOOD AFTERNOON 🌤️',
    evening: 'GOOD EVENING 🌙',
  },
  friday: 'HAPPY FRIDAY 🎉',
};

export const AKI_GREETING_LINES = [
  "Curious about Jason's work?",
  "Ask me about Jason's projects.",
  "Want a quick tour of Jason's work?",
  "Questions about Jason? Ask away.",
  "Exploring Jason's portfolio?",
  "Ask about Jason's AI work.",
  "Curious about Jason's tech stack?",
  "Hiring? Let's talk about Jason.",
  'Got a project question? Ask me.',
  'See what Jason is building now.',
];

// Index clamped so random() === 1 (or any out-of-range value) still yields a valid item.
const pick = (list, r) => list[Math.min(list.length - 1, Math.max(0, Math.floor(r * list.length)))];

// Local time: morning 05:00-11:59, afternoon 12:00-17:59, evening 18:00-04:59.
function timedGreeting(hour) {
  if (hour >= 5 && hour < 12) return AKI_GREETINGS.timed.morning;
  if (hour >= 12 && hour < 18) return AKI_GREETINGS.timed.afternoon;
  return AKI_GREETINGS.timed.evening;
}

export function pickGreeting(now = new Date(), random = Math.random) {
  let title;
  if (random() < 1 / 3) {
    const friday = now.getDay() === 5 && random() < 0.5;
    title = friday ? AKI_GREETINGS.friday : timedGreeting(now.getHours());
  } else {
    title = pick(AKI_GREETINGS.general, random());
  }
  return { title, line: pick(AKI_GREETING_LINES, random()) };
}
