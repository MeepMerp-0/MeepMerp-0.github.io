// Static line emblems: the reduced-motion and no-WebGL visuals, and the placeholder until the 3D scene draws.
// Each echoes its chapter's sculpture. Decorative: the project copy carries the meaning.
const SHAPES = {
  aki: (
    <>
      <circle cx="60" cy="60" r="16" />
      <circle cx="60" cy="60" r="27" opacity=".45" />
      <ellipse cx="60" cy="60" rx="46" ry="16" transform="rotate(-24 60 60)" />
      <ellipse cx="60" cy="60" rx="40" ry="13" transform="rotate(32 60 60)" opacity=".7" />
      <circle cx="101" cy="45" r="3.5" className="emblem-fill" />
      <circle cx="26" cy="80" r="3.5" className="emblem-fill" />
    </>
  ),
  innercircle: (
    <>
      <ellipse cx="60" cy="88" rx="46" ry="12" />
      <ellipse cx="60" cy="34" rx="40" ry="10" />
      {[-36, -24, -12, 0, 12, 24, 36].map((x) => <line key={x} x1={60 + x} y1={36 + Math.abs(x) / 6} x2={60 + x} y2={86 - Math.abs(x) / 8} />)}
      <ellipse cx="60" cy="60" rx="15" ry="6" className="emblem-strong" />
    </>
  ),
  payroll: (
    <>
      <circle cx="52" cy="60" r="34" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={52 + Math.sin(a) * 27} y1={60 - Math.cos(a) * 27} x2={52 + Math.sin(a) * 31} y2={60 - Math.cos(a) * 31} />;
      })}
      <line x1="52" y1="60" x2="52" y2="38" className="emblem-strong" />
      <line x1="52" y1="60" x2="68" y2="68" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x="92" y={82 - i * 9} width="22" height="6" />)}
    </>
  ),
  futurohub: (
    <>
      {[0, 1, 2, 3].flatMap((i) => [0, 1, 2, 3].map((j) => {
        const h = 10 + ((i * 7 + j * 11) % 4) * 8;
        return <rect key={`${i}-${j}`} x={18 + i * 22} y={92 - h - j * 4} width="16" height={h} />;
      }))}
      <line x1="10" y1="100" x2="110" y2="100" />
    </>
  ),
};

export function Emblem({ id }) {
  return (
    <svg className="emblem" viewBox="0 0 120 120" aria-hidden="true" focusable="false">{SHAPES[id]}</svg>
  );
}
