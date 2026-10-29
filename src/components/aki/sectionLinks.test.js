import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WHATSAPP_URL } from '../../data/portfolioData.js';
import { followUpLinks, hrefOf } from './sectionLinks.js';

// [question, reply, the follow-up link's href or '' for none]. The browser smoke suite checks the same cases.
const CASES = [
  ['how do I contact him?', 'See his [Work](#work).', '#contact'],
  ["show me Jason's work", 'Plenty to see.', '#work'],
  ['how do I contact him?', 'Use the [Contact](#contact) form.', ''],
  ['how do I contact him?', 'Use `[Contact](#contact)`.', '#contact'],
  ['how do I contact him?', 'Use **[Contact](#contact)**.', ''],
  ['take me home', 'Sure.', '#home'],
  ["what's his whatsapp number?", 'He uses WhatsApp.', WHATSAPP_URL],
  ['WhatsAppの番号は？', 'どうぞ。', WHATSAPP_URL],
  ['How can I contact him on WhatsApp?', 'Use the [Contact](#contact) section.', WHATSAPP_URL],
  ['whatsapp?', 'Message him on [WhatsApp](#whatsapp).', ''],
  ['Has Jason built any phone apps?', 'See [Work](#work).', ''],
  ['Who is Jason?', 'An engineer.', '#about'],
  ['Where is Jason based?', 'In the UAE.', '#contact'],
  ["Tell me about Jason's projects", 'See [Work](#work).', ''],
  ["Tell me about Jason's projects", 'Several.', '#work'],
  ["what's his phone number?", 'Here it is.', '#contact'],
  ['¿Cómo contacto a Jason?', 'Puedes escribirle.', '#contact'],
  ['ジェイソンのプロジェクトは？', 'いくつかあります。', '#work'],
  ['كيف أتواصل مع جيسون؟', 'يمكنك مراسلته.', '#contact'],
  ["What's his work process?", 'He plans first.', '#process'],
  ['Can I contact him for work?', 'Yes.', '#contact'],
  ['Hello!', 'Hi there.', ''],
];

for (const [question, reply, href] of CASES) {
  test(`${JSON.stringify(question)} + ${JSON.stringify(reply)} -> ${href || 'no link'}`, () => {
    assert.equal(followUpLinks(question, reply)?.map((l) => l.href).join() ?? '', href);
  });
}

test('the follow-up link is labelled with the section name', () => {
  assert.deepEqual(followUpLinks('how do I contact him?', 'Write to him.'), [{ label: '→ Contact', href: '#contact' }]);
});

test('hrefOf links sections by hash and #whatsapp to WhatsApp', () => {
  assert.equal(hrefOf('work'), '#work');
  assert.equal(hrefOf('whatsapp'), WHATSAPP_URL);
});
