// Static line emblems: the reduced-motion and no-WebGL visuals, and the placeholder until the 3D scene draws.
// Each echoes its chapter's sculpture. Decorative: the project copy carries the meaning.
const SHAPES = {
  // Aki's TV head: shell, screen, block eyes, ears and antenna.
  aki: (
    <>
      <rect x="24" y="40" width="72" height="54" rx="12" />
      <rect x="33" y="48" width="54" height="38" rx="6" opacity=".7" />
      <rect x="44" y="58" width="8" height="14" className="emblem-fill" />
      <rect x="68" y="58" width="8" height="14" className="emblem-fill" />
      <rect x="15" y="60" width="9" height="14" rx="3" />
      <rect x="96" y="60" width="9" height="14" rx="3" />
      <line x1="60" y1="40" x2="60" y2="24" />
      <circle cx="60" cy="20" r="4" className="emblem-fill" />
    </>
  ),
  // An AI core handing tasks to four agents, inside an arc of panels.
  innercircle: (
    <>
      <path d="M18 58 A44 30 0 0 1 102 58" opacity=".55" />
      <rect x="22" y="22" width="20" height="16" rx="2" opacity=".55" />
      <rect x="78" y="22" width="20" height="16" rx="2" opacity=".55" />
      <circle cx="60" cy="52" r="10" className="emblem-strong" />
      {[24, 46, 74, 96].map((x) => (
        <g key={x}>
          <path d={`M60 62 Q${(60 + x) / 2} ${70} ${x} 92`} opacity=".7" />
          <circle cx={x} cy="96" r="4" className="emblem-fill" />
        </g>
      ))}
    </>
  ),
  // A guard inside the phone's proximity ring, a face scan, and the entry reaching the web dashboard.
  payroll: (
    <>
      <ellipse cx="44" cy="98" rx="30" ry="6" opacity=".55" />
      <circle cx="26" cy="54" r="7" />
      <path d="M18 92 V72 a8 8 0 0 1 16 0 V92" />
      <rect x="20" y="44" width="14" height="6" rx="2" opacity=".8" />
      <rect x="46" y="50" width="16" height="28" rx="3" className="emblem-strong" />
      <circle cx="54" cy="60" r="4" />
      <path d="M62 54 Q80 28 90 44" strokeDasharray="3 3" />
      <rect x="78" y="44" width="32" height="26" rx="2" />
      <line x1="78" y1="50" x2="110" y2="50" />
      {[56, 62].map((y) => <line key={y} x1="82" y1={y} x2="106" y2={y} opacity=".7" />)}
    </>
  ),
  // Workflow nodes with links running to the next actions.
  futurohub: (
    <>
      {[[10, 38], [10, 74], [44, 56], [78, 30], [78, 56], [78, 82]].map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y - 7} width="20" height="14" rx="3" />)}
      <rect x="104" y="49" width="10" height="14" rx="3" className="emblem-fill" />
      <path d="M30 38 C38 38 36 56 44 56 M30 74 C38 74 36 56 44 56" />
      <path d="M64 56 C72 56 70 30 78 30 M64 56 H78 M64 56 C72 56 70 82 78 82" />
      <path d="M98 30 C104 30 100 56 104 56 M98 56 H104 M98 82 C104 82 100 56 104 56" opacity=".7" />
    </>
  ),
};

export function Emblem({ id }) {
  return (
    <svg className="emblem" viewBox="0 0 120 120" aria-hidden="true" focusable="false">{SHAPES[id]}</svg>
  );
}
