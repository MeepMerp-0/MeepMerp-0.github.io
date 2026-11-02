/**
 * The Workers AI binding (env.AI): the chat backup and the Whisper backup. Each call gives up after 10 s.
 *   chat(messages) → {ok:true, content} | {ok:false}; an empty reply is not ok.
 *   transcribe(file) → {ok:true, text} | {ok:false}.
 */

const WORKERS_AI_TIMEOUT_MS = 10_000;
// String.fromCharCode takes the bytes as arguments; a whole clip in one call overflows the stack.
const BASE64_CHUNK_BYTES = 0x8000;

// Whisper takes the clip as base64. Uint8Array#toBase64 would do this natively, but Node only has it from 25 and
// CI runs the tests on 22.
function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_BYTES) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK_BYTES));
  }
  return btoa(binary);
}

export class WorkersAI {
  #config;
  #deps;

  constructor(config, deps) {
    this.#config = config;
    this.#deps = deps;
  }

  async chat(messages) {
    try {
      const out = await this.#withTimeout(() => this.#deps.ai.run(this.#config.backup.model, { messages, max_tokens: this.#config.maxTokens }));
      const content = out?.response;
      return typeof content === 'string' && content.trim() ? { ok: true, content } : { ok: false };
    } catch {
      return { ok: false };
    }
  }

  async transcribe(file) {
    try {
      const audio = toBase64(new Uint8Array(await file.arrayBuffer()));
      const out = await this.#withTimeout(() => this.#deps.ai.run(this.#config.stt.backupModel, { audio }));
      return typeof out?.text === 'string' ? { ok: true, text: out.text } : { ok: false };
    } catch {
      return { ok: false };
    }
  }

  async #withTimeout(run) {
    let timer;
    try {
      return await Promise.race([
        run(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), WORKERS_AI_TIMEOUT_MS); }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
}
