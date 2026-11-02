// The Hero's three layers as flat inline art, the same picture as the scene: Inputs, Intelligence and Application,
// joined by one copper route. Shown until the first WebGL frame and whenever WebGL is missing or lost. Decorative only;
// colours come from the .hero-fa-* rules in global.css, so it follows both themes. Drawn in the scene's reference
// pixels (853 x 351), with the core's centre at (423, 176).
const CX = 423;
const CY = 176;
const BRONZE = new Set([0, 3, 7, 11, 14, 15, 18, 22]);
const TILES = Array.from({ length: 25 }, (_, n) => ({ n, x: 121 + (n % 5) * 30, y: 104 + Math.floor(n / 5) * 30 }));
const polar = (r, a) => `${(CX + r * Math.cos(a)).toFixed(1)} ${(CY - r * Math.sin(a)).toFixed(1)}`;
const HEX = (r) => Array.from({ length: 6 }, (_, k) => polar(r, Math.PI / 2 + (k * Math.PI) / 3)).join(' ');
const SPOKES = Array.from({ length: 12 }, (_, k) => `M${polar(90, (k * Math.PI) / 6)}L${polar(142, (k * Math.PI) / 6)}`).join('');
const TICKS = Array.from({ length: 36 }, (_, k) => `M${polar(129, (k * Math.PI) / 18)}L${polar(133, (k * Math.PI) / 18)}`).join('');
const ROWS = [142, 190, 238];
const ROUTE = 'M-20 190L240 190C300 197 340 194 372 185C392 179 410 177 423 177C440 177 460 178 474 179'
  + 'C510 184 520 190 546 196C570 202 590 208 612 208L650 205';

export function HeroFallbackArt() {
  return (
    <svg
      className="hero-fallback"
      viewBox="0 0 853 351"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="hero-fa-fins" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="hero-fa-stop-lo" />
          <stop offset="1" className="hero-fa-stop-hi" />
        </linearGradient>
        <linearGradient id="hero-fa-route" gradientUnits="userSpaceOnUse" x1="-20" y1="0" x2="300" y2="0">
          <stop offset="0" className="hero-fa-stop-route" stopOpacity=".05" />
          <stop offset="1" className="hero-fa-stop-route" />
        </linearGradient>
      </defs>
      <g>
        <circle className="hero-fa-fins" cx={CX} cy={CY} r="102" stroke="url(#hero-fa-fins)" strokeDasharray="4.7 0.64" />
        <circle className="hero-fa-ring" cx={CX} cy={CY} r="129" />
        <circle className="hero-fa-ring" cx={CX} cy={CY} r="74" />
        <path className="hero-fa-spokes" d={SPOKES + TICKS} />
      </g>
      <path className="hero-fa-route" d={ROUTE} stroke="url(#hero-fa-route)" />
      <g>
        <polygon className="hero-fa-rim" points={HEX(53)} />
        <polygon className="hero-fa-face" points={HEX(44)} />
        <text className="hero-fa-ai" x={CX} y="187" textAnchor="middle">AI</text>
      </g>
      <g>
        <rect className="hero-fa-panel" x="111" y="95" width="165" height="162" />
        {TILES.map(({ n, x, y }) => (
          <rect key={n} className={BRONZE.has(n) ? 'hero-fa-tile hero-fa-request' : 'hero-fa-tile'} x={x} y={y} width="24" height="24" />
        ))}
        <circle className="hero-fa-signal" cx="192" cy="188" r="6" />
      </g>
      <g>
        <rect className="hero-fa-panel" x="612" y="66" width="214" height="215" />
        <path className="hero-fa-line-dim" d="M630 97H806" />
        {ROWS.map((y, i) => (
          <g key={y}>
            <rect className={i === 1 ? 'hero-fa-tile hero-fa-request' : 'hero-fa-tile'} x="630" y={y - 16} width="44" height="32" />
            <path className="hero-fa-line" d={`M692 ${y - 9}H800`} />
            <path className="hero-fa-line-dim" d={`M692 ${y + 6}H768`} />
          </g>
        ))}
      </g>
      <text className="hero-fa-text" x="115" y="80">01 / INPUTS</text>
      <text className="hero-fa-text" x="314" y="22">02 / INTELLIGENCE</text>
      <text className="hero-fa-text" x="620" y="49">03 / APPLICATION</text>
    </svg>
  );
}
