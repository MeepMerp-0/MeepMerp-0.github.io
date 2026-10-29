import { AKI_MESSAGES as MSG } from '../../data/akiFaq.js';
import { hrefOf } from './sectionLinks.js';

// Small Markdown subset for Aki's replies, rendered as React nodes (never HTML): paragraphs, - / 1. lists,
// # headings, **bold**, *italic*, `code` and links. Only links to this page's sections become links;
// any other link shows as its plain label.
const INLINE = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`|\[([^\]\n]{1,60})\]\(([^)\s]{1,200})\)/g;
const SECTION = /^(?:https:\/\/meepmerp-0\.github\.io\/?)?#(home|work|about|process|contact|whatsapp)$/;
const EXTERNAL = { rel: 'noopener noreferrer', target: '_blank' };

function inline(text) {
  const out = [];
  let at = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > at) out.push(text.slice(at, m.index));
    const k = out.length;
    // Bold and italic may wrap a link; code stays literal, as in Markdown.
    if (m[1]) out.push(<strong key={k}>{inline(m[1])}</strong>);
    else if (m[2]) out.push(<em key={k}>{inline(m[2])}</em>);
    else if (m[3]) out.push(<code key={k}>{m[3]}</code>);
    else {
      const id = m[5].match(SECTION)?.[1];
      out.push(id ? <a key={k} href={hrefOf(id)} {...(id === 'whatsapp' && EXTERNAL)}>{m[4]}</a> : m[4]);
    }
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

function Markdown({ text }) {
  const blocks = [];
  let list = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const item = line.match(/^(?:[-*•]|(\d+)[.)])\s+(.*)$/);
    if (item) {
      const ordered = Boolean(item[1]);
      if (!list || list.ordered !== ordered) blocks.push(list = { ordered, items: [] });
      list.items.push(item[2]);
      continue;
    }
    list = null;
    if (line) blocks.push({ text: line.replace(/^#{1,6}\s+/, ''), heading: /^#{1,6}\s/.test(line) });
  }
  return blocks.map((b, i) => {
    if (!b.items) return <p key={i}>{b.heading ? <strong>{inline(b.text)}</strong> : inline(b.text)}</p>;
    const List = b.ordered ? 'ol' : 'ul';
    return <List key={i}>{b.items.map((t, n) => <li key={n}>{inline(t)}</li>)}</List>;
  });
}

function MessageBody({ item, mine }) {
  if (item.typing) return <span className="aki-typing"><i /><i /><i /></span>;
  if (item.greet) return <p>{MSG.greetingHead} <span aria-hidden="true">{'\u{1F44B}'}</span> {MSG.greetingBody}</p>;
  if (mine) return <p>{item.text}</p>;
  return <Markdown text={item.text} />;
}

export function Message({ item, first }) {
  const mine = item.role === 'user';
  const who = mine ? 'You' : 'Aki';
  return (
    <div className={`aki-row aki-row-${item.role}${first ? ' aki-first' : ''}`} aria-hidden={item.typing || item.live || undefined}>
      {first && <span className="aki-who" aria-hidden="true">{who}</span>}
      <div className={`aki-msg aki-msg-${item.role}`}>
        <span className="sr-only">{who} said: </span>
        <MessageBody item={item} mine={mine} />
        {item.links?.length > 0 && (
          <p className="aki-links">
            {item.links.map((l) => (
              <a key={l.href} href={l.href} {...(/^https?:/.test(l.href) && EXTERNAL)}>
                {l.label}
              </a>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
