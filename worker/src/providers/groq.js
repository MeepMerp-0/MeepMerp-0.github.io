/**
 * Groq's OpenAI-compatible API on one key: the chat model and Whisper, each with a 10 s timeout.
 *   chat(messages) → {ok:true, content} | {ok:false, status, retryAfter}; an empty or cut-off reply is not ok.
 *   transcribe(file, ext) → {ok:true, text} | {ok:false, status, retryAfter}; the clip goes up as voice.<ext>.
 * status 0 means no HTTP answer (network error or timeout) or an unreadable body; retryAfter is Groq's raw header.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_STT_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_TIMEOUT_MS = 10_000;

export class Groq {
  #config;
  #deps;

  constructor(config, deps) {
    this.#config = config;
    this.#deps = deps;
  }

  async chat(messages) {
    const { fetch } = this.#deps;
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: new Headers({ authorization: `Bearer ${this.#config.groqApiKey}`, 'content-type': 'application/json' }),
        body: JSON.stringify({
          model: this.#config.groqModel,
          messages,
          reasoning_effort: 'low',
          include_reasoning: false,
          max_completion_tokens: this.#config.maxTokens,
        }),
        signal: AbortSignal.timeout(GROQ_TIMEOUT_MS),
      });
      if (res.status === 200) {
        const data = await res.json();
        const choice = data?.choices?.[0];
        const content = choice?.message?.content;
        return typeof content === 'string' && content.trim() && choice.finish_reason !== 'length'
          ? { ok: true, content }
          : { ok: false, status: 200, retryAfter: null };
      }
      return { ok: false, status: res.status, retryAfter: res.headers.get('retry-after') };
    } catch {
      return { ok: false, status: 0, retryAfter: null };
    }
  }

  async transcribe(file, ext) {
    const { fetch } = this.#deps;
    const form = new FormData();
    form.append('file', file, `voice.${ext}`);
    form.append('model', this.#config.stt.model);
    form.append('response_format', 'json');
    form.append('temperature', '0');
    // No language or prompt: a wrong hint or a prompt makes Whisper invent text.
    try {
      const res = await fetch(GROQ_STT_URL, {
        method: 'POST',
        headers: new Headers({ authorization: `Bearer ${this.#config.groqApiKey}` }),
        body: form,
        signal: AbortSignal.timeout(GROQ_TIMEOUT_MS),
      });
      if (res.status !== 200) return { ok: false, status: res.status, retryAfter: res.headers.get('retry-after') };
      const text = (await res.json())?.text;
      return typeof text === 'string' ? { ok: true, text } : { ok: false, status: 200, retryAfter: null };
    } catch {
      return { ok: false, status: 0, retryAfter: null };
    }
  }
}
