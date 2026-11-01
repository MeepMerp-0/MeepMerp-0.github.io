// The Hero's three layers as flat inline art: Inputs, Intelligence, Application, joined by one copper route.
// Shown until the first WebGL frame and whenever WebGL is missing or lost. Decorative only; colours come from the
// .hero-fa-* rules in global.css, so it follows both themes.
const REQUESTS = [2, 7, 13];
const TILES = Array.from({ length: 20 }, (_, i) => (
  { col: i % 5, row: Math.floor(i / 5), request: REQUESTS.includes(i) }
));
const RIBS = [0, 1, 2, 3, 4, 5].map((i) => ({ y: 118 + i * 24, rx: [30, 48, 58, 58, 48, 30][i] }));
const BARS = [28, 44, 20, 52];

export function HeroFallbackArt() {
  return (
    <svg
      className="hero-fallback"
      viewBox="0 0 640 400"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <g>
        {TILES.map(({ col, row, request }) => (
          <rect
            key={`${col}-${row}`}
            className={request ? 'hero-fa-tile hero-fa-request' : 'hero-fa-tile'}
            x={22 + col * 40 + row * 12}
            y={110 + row * 36 - col * 6}
            width="32"
            height="26"
            rx="6"
          />
        ))}
      </g>
      <g>
        {RIBS.map(({ y, rx }) => <ellipse key={y} className="hero-fa-rib" cx="318" cy={y} rx={rx} ry="11" />)}
        <ellipse className="hero-fa-shell" cx="318" cy="178" rx="26" ry="38" />
        <circle className="hero-fa-core" cx="318" cy="178" r="12" />
      </g>
      <g>
        <rect className="hero-fa-panel" x="440" y="104" width="164" height="176" rx="12" />
        <rect className="hero-fa-bar" x="440" y="104" width="164" height="24" rx="12" />
        <rect className="hero-fa-side" x="450" y="138" width="30" height="132" rx="6" />
        <rect className="hero-fa-card" x="490" y="138" width="46" height="34" rx="6" />
        <rect className="hero-fa-card" x="546" y="138" width="48" height="34" rx="6" />
        {BARS.map((h, i) => (
          <rect key={h} className="hero-fa-chart" x={494 + i * 24} y={268 - h} width="14" height={h} rx="3" />
        ))}
      </g>
      <path
        className="hero-fa-route"
        d="M62 214 C120 250 168 120 232 168 C270 196 252 262 318 262 C388 262 372 150 440 190 C480 214 520 196 578 186"
      />
      <circle className="hero-fa-signal" cx="62" cy="214" r="6" />
    </svg>
  );
}
