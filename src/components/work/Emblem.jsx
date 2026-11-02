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
  // A guard in the post's proximity ring, holding their phone level for the face scan; the entry reaches the dashboard.
  payroll: (
    <>
      <ellipse cx="40" cy="98" rx="30" ry="6" opacity=".55" />
      <line x1="62" y1="94" x2="62" y2="58" opacity=".6" />
      <circle cx="62" cy="54" r="3" className="emblem-fill" />
      <circle cx="26" cy="52" r="7" />
      <rect x="18" y="42" width="16" height="5" rx="2" opacity=".8" />
      <path d="M18 92 V70 a8 8 0 0 1 16 0 V92" />
      <line x1="30" y1="66" x2="46" y2="66" />
      <rect x="45" y="48" width="8" height="15" rx="2" className="emblem-strong" />
      <rect x="15" y="41" width="22" height="22" rx="2" strokeDasharray="3 3" opacity=".7" />
      <path d="M53 50 Q74 26 88 42" strokeDasharray="3 3" />
      <rect x="80" y="42" width="32" height="26" rx="2" />
      <line x1="80" y1="48" x2="112" y2="48" />
      {[54, 60].map((y) => <line key={y} x1="84" y1={y} x2="108" y2={y} opacity=".7" />)}
    </>
  ),
  // Channels (chat, social, web, point of sale) into an assistant, then an if/else gate with two branches.
  futurohub: (
    <>
      {[26, 46, 66, 86].map((y) => <rect key={y} x="6" y={y - 6} width="16" height="12" rx="3" />)}
      <path d="M22 26 C30 26 28 56 34 56 M22 46 C30 46 28 56 34 56 M22 66 C30 66 28 56 34 56 M22 86 C30 86 28 56 34 56" opacity=".7" />
      <rect x="34" y="49" width="18" height="14" rx="3" className="emblem-strong" />
      <line x1="52" y1="56" x2="60" y2="56" />
      <path d="M68 46 L78 56 L68 66 L58 56 Z" className="emblem-fill" />
      <path d="M68 46 C68 34 76 32 84 32 M68 66 C68 78 76 80 84 80" />
      <rect x="84" y="26" width="14" height="12" rx="3" />
      <rect x="84" y="74" width="14" height="12" rx="3" />
      <line x1="98" y1="32" x2="104" y2="32" />
      <line x1="98" y1="80" x2="104" y2="80" />
      <rect x="104" y="26" width="12" height="12" rx="3" />
      <rect x="104" y="74" width="12" height="12" rx="3" opacity=".7" />
    </>
  ),
};

export function Emblem({ id }) {
  return (
    <svg className="emblem" viewBox="0 0 120 120" aria-hidden="true" focusable="false">{SHAPES[id]}</svg>
  );
}
