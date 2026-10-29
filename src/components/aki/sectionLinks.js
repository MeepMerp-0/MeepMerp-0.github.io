import { WHATSAPP_URL } from '../../data/portfolioData.js';

// #whatsapp is a placeholder the models write instead of the number (Google never gets it); the page links it to WHATSAPP_URL.
const SECTION_LINK = /\]\((?:https:\/\/meepmerp-0\.github\.io\/?)?#(home|work|about|process|contact|whatsapp)\)/;
export const hrefOf = (id) => (id === 'whatsapp' ? WHATSAPP_URL : `#${id}`);

// A reply about one part of the site always ends with a link there, even when the model forgot one.
// Most specific first: "work process" is Process, "contact for work" is Contact. Latin-script words must
// stand alone; Arabic and Japanese terms match anywhere, since those scripts join words differently.
// ponytail: keyword lists for the common visitor languages; a question in another language relies on the model's own link.
const topic = (latin, other) => new RegExp(`(?<!\\p{L})(?:${latin})(?!\\p{L})|${other}`, 'iu');
const TOPICS = [
  // No letter guards: "WhatsApp" is never part of a longer word, and Japanese writes it right next to kana.
  { id: 'whatsapp', label: 'WhatsApp', pattern: /whats\W?app|\u0648\u0627\u062A\u0633\u0627\u0628|\u30EF\u30C3\u30C4\u30A2\u30C3\u30D7/iu },
  { id: 'contact', label: 'Contact', pattern: topic('contact\\w*|contacto|contactar|contato|kontakt\\w*|e-?mail|correo|phone number|(?:his|jason\\W?s) (?:phone|number)|call (?:him|jason)|tel[eé]fono|telefone|llamar|reach|hire|get in touch|joindre|makipag-ugnayan|address|location|located|where (?:is|does) (?:he|jason)|based in',
    '\u062A\u0648\u0627\u0635\u0644|\u0627\u062A\u0635\u0627\u0644|\u0628\u0631\u064A\u062F|\u0647\u0627\u062A\u0641|\u9023\u7D61|\u30E1\u30FC\u30EB|\u96FB\u8A71') },
  { id: 'process', label: 'Process', pattern: topic('process|proceso|processus|prozess|processo|proseso|workflow|approach',
    '\u0639\u0645\u0644\u064A\u0629|\u30D7\u30ED\u30BB\u30B9') },
  { id: 'about', label: 'About', pattern: topic('who(?:\\W?s| is| are)|introduce|bio|experience|experiencia|exp[eé]rience|erfahrung|experi[eê]ncia|karanasan|background|skills?|habilidades|comp[eé]tences|stack|tech\\w*|tecnolog\\w*|resume|cv|career|carrera|about (?:jason|him)(?!\\W?s)',
    '\u062E\u0628\u0631\u0629|\u0645\u0647\u0627\u0631\u0627\u062A|\u7D4C\u9A13|\u30B9\u30AD\u30EB') },
  { id: 'work', label: 'Work', pattern: topic('work|trabajo|travail|arbeit|trabalho|projects?|proyectos?|projets?|projekte?|projetos?|proyekto|built|demos?|apps?|portfolio|portafolio',
    '\u0645\u0634\u0627\u0631\u064A\u0639|\u0623\u0639\u0645\u0627\u0644|\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8|\u4F5C\u54C1') },
  { id: 'home', label: 'Home', pattern: topic('home|homepage|inicio|accueil|startseite|in[ií]cio',
    '\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629|\u30DB\u30FC\u30E0') },
];

export function followUpLinks(question, reply) {
  const topics = TOPICS.filter((t) => t.pattern.test(question));
  if (!topics.length) return undefined;
  const [first] = topics;
  // A link to any section the question is about counts; an unrelated one does not. Links inside `code` are not rendered.
  // A WhatsApp question needs the WhatsApp link itself: a Contact link does not answer it.
  const wanted = first.id === 'whatsapp' ? [first] : topics;
  const linked = [...reply.replace(/`[^`\n]+`/g, '').matchAll(new RegExp(SECTION_LINK.source, 'g'))]
    .some((m) => wanted.some((t) => t.id === m[1]));
  // The label is the section's own name from the (English) page navigation, so it reads the same in any reply language.
  return linked ? undefined : [{ label: `\u2192 ${first.label}`, href: hrefOf(first.id) }];
}
