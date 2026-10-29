import { RobotHead } from 'robot-heads';

export function Launcher({ ref, open, face, onClick }) {
  return (
    <button
      ref={ref}
      type="button"
      className="aki-launcher"
      aria-label="Ask Aki, AI assistant"
      aria-expanded={open}
      aria-controls="aki-panel"
      onClick={onClick}
    >
      <RobotHead size={68} state={face} color="#7a4a2a" trimColor="#c8a27a" aria-hidden="true" />
    </button>
  );
}

// A shortcut for pointers only: keyboard and screen-reader users have the launcher.
export function GreetingBubble({ greeting, onClick }) {
  return (
    <button
      type="button"
      className="aki-bubble"
      tabIndex={-1}
      aria-hidden="true"
      onClick={onClick}
    >
      <strong>{greeting.title}</strong>
      <span>{greeting.line}</span>
    </button>
  );
}
