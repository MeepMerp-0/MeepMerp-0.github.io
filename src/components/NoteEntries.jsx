import { twoDigits } from '../utils/format.js';

export function NoteEntries({ entries }) {
  return entries.map((entry, index) => (
    <div className="notes-entry" key={entry.title}>
      <span>{twoDigits(index + 1)}</span>
      <div><strong>{entry.title}</strong><p>{entry.description}</p></div>
    </div>
  ));
}
