// The only file that imports cloudflare:workers (C15). index.js and the DO's SQLite storage are covered by the aki:dev smoke run.
import { DurableObject } from 'cloudflare:workers';
import { applyOp, cleanup, CLEANUP_INTERVAL_MS, OPS } from './limiter.js';
import { handle } from './app.js';

/**
 * One global, SQLite-backed limiter (B2). Each method reads its own clock (R4-2), then applyOp reads the slice,
 * decides and writes through the synchronous KV API, so no await sits between read and write and the step is atomic.
 */
export class Limiter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      if ((await ctx.storage.getAlarm()) === null) await ctx.storage.setAlarm(Date.now() + CLEANUP_INTERVAL_MS);
    });
  }

  reserve(req) { return applyOp(this.ctx.storage.kv, Date.now(), 'reserve', req); }
  claim(req) { return applyOp(this.ctx.storage.kv, Date.now(), 'claim', req); }
  cancel(req) { return applyOp(this.ctx.storage.kv, Date.now(), 'cancel', req); }
  end(req) { return applyOp(this.ctx.storage.kv, Date.now(), 'end', req); }
  fallback(req) { return applyOp(this.ctx.storage.kv, Date.now(), 'fallback', req); }
  backup(req) { return applyOp(this.ctx.storage.kv, Date.now(), 'backup', req); }
  consent(req) { return applyOp(this.ctx.storage.kv, Date.now(), 'consent', req); }
  transcribe(req) { return applyOp(this.ctx.storage.kv, Date.now(), 'transcribe', req); }

  // Hourly cleanup (R5-17). Rescheduled first so a failed sweep still leaves the next alarm set.
  async alarm() {
    await this.ctx.storage.setAlarm(Date.now() + CLEANUP_INTERVAL_MS);
    cleanup(this.ctx.storage.kv, Date.now());
  }
}

export default {
  fetch(request, env, ctx) {
    const stub = env.LIMITER.get(env.LIMITER.idFromName('global'));
    const limiter = Object.fromEntries(Object.keys(OPS).map((op) => [op, (req) => stub[op](req)]));
    return handle(request, env, {
      limiter,
      // Wrapped: Workers throw "Illegal invocation" when fetch is called as a method of another object.
      fetch: (input, init) => fetch(input, init),
      sleep: (ms, signal) => scheduler.wait(ms, { signal }),
      signal: request.signal,
      waitUntil: (promise) => ctx.waitUntil(promise),
      country: request.cf?.country,
      ip: request.headers.get('cf-connecting-ip'),
      ai: env.AI,
      now: () => Date.now(),
    });
  },
};
