'use strict';

// The shop assistant demo: a chat, a small data table and the workflow behind them, drawn as a node canvas.
// Everything runs in this page. No message, payment, sheet or alert is sent anywhere.
(() => {
  const byId = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const STEP_MS = 200;
  const FIRST_ORDER = 142;
  const MAX_EXECUTIONS = 10;
  const MAX_ALERTS = 10;

  const money = (n) => `¤${n}`;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const sleep = (ms) => new Promise((resolve) => { window.setTimeout(resolve, ms); });
  const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Small DOM builder. Text always goes in through textContent, never as HTML.
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
      if (value == null || value === false) return;
      if (key === 'class') el.className = value;
      else if (key === 'text') el.textContent = value;
      else el.setAttribute(key, value === true ? '' : String(value));
    });
    kids.flat().forEach((kid) => { if (kid != null && kid !== false) el.append(kid); });
    return el;
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
    return el;
  }

  // ---------- Data table seed ----------

  const SEED = [
    { sku: 'P-101', name: 'Ash cutting board', type: 'product', price: 38, stock: 6, reorder: 2,
      aliases: ['cutting board', 'chopping board', 'board', 'boards'] },
    { sku: 'P-102', name: 'Brass drawer pulls, set of 4', type: 'product', price: 24, stock: 12, reorder: 4,
      aliases: ['pulls', 'pull', 'handles', 'handle', 'knobs', 'drawer', 'brass'] },
    { sku: 'P-103', name: 'Cast-iron skillet, 26 cm', type: 'product', price: 55, stock: 2, reorder: 2,
      aliases: ['skillet', 'skillets', 'pan', 'pans', 'frying pan', 'cast iron', 'cast-iron'] },
    { sku: 'P-104', name: 'Copper kettle', type: 'product', price: 90, stock: 0, reorder: 1,
      aliases: ['kettle', 'kettles', 'copper'] },
    { sku: 'S-201', name: 'Kitchen layout consult, 60 min', type: 'service', price: 120, stock: 3, reorder: 1,
      aliases: ['consult', 'consultation', 'layout', 'design', 'planning'] },
    { sku: 'S-202', name: 'Install day, crew of two', type: 'service', price: 480, stock: 1, reorder: 1,
      aliases: ['install', 'installation', 'fitting', 'fitter', 'crew'] },
    { sku: 'S-203', name: 'Knife sharpening drop-off', type: 'service', price: 15, stock: 8, reorder: 2,
      aliases: ['sharpening', 'sharpen', 'knife', 'knives'] },
  ];

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const MATCHERS = SEED.map((s) => ({
    sku: s.sku,
    re: new RegExp(`\\b(?:${s.aliases.map(escapeRe).join('|')})\\b`, 'i'),
  }));

  let state;

  function freshState() {
    return {
      items: SEED.map(({ aliases, ...row }) => ({ ...row, sold: 0, waitlist: 0 })),
      orders: [],
      alerts: [],
      executions: [],
      transcript: [],
      customer: 'Chat visitor',
      nextOrder: FIRST_ORDER,
      nextExec: 1,
      stockSeen: false, // the visitor has looked at the inventory table after a paid order (step guide)
    };
  }

  const item = (sku) => state.items.find((r) => r.sku === sku);
  const isService = (row) => row.type === 'service';
  const verb = (row) => (isService(row) ? 'Book' : 'Buy');
  const level = (row) => (row.stock === 0 ? 'out' : row.stock <= row.reorder ? 'low' : 'ok');
  const LEVEL_TEXT = { ok: 'In stock', low: 'Low', out: 'Out' };

  function stockText(row) {
    if (isService(row)) return row.stock === 0 ? 'Fully booked' : `${row.stock} ${row.stock === 1 ? 'slot' : 'slots'} left`;
    return row.stock === 0 ? 'Out of stock' : `${row.stock} in stock`;
  }

  const rowJson = (r) => ({
    sku: r.sku, item: r.name, type: r.type, price: r.price, inStock: r.stock, reorderAt: r.reorder, sold: r.sold,
  });

  // ---------- Simulated intent reading: keyword rules, no AI call ----------

  const PERSON = /\b(person|human|agent|someone|somebody|staff|talk|speak|call me)\b/i;
  const BUY = /\b(buy|order|book|reserve|purchase)\b/i;
  const ASK = /\b(have|got|stock|available|availability|sell|selling|price|prices|cost|show|anything)\b/i;
  const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

  const NUMBER_WORD = new RegExp(`\\b(${NUMBER_WORDS.join('|')})\\b`);

  // Returns the quantity asked for, or 0 when the customer wrote zero (the assistant then asks how many).
  function parseQty(text) {
    // Numbers inside item names ("set of 4", "crew of two", "26 cm", "60 min") are not quantities.
    const rest = text.toLowerCase().replace(/\b(?:set of \d+|crew of \w+|\d+\s*(?:cm|min)\w*)/g, ' ');
    const digits = rest.match(/\b\d+\b/);
    if (digits) return Number(digits[0]);
    const word = rest.match(NUMBER_WORD);
    return word ? NUMBER_WORDS.indexOf(word[1]) : 1;
  }

  function kindOf(text) {
    if (/\bproducts?\b/i.test(text)) return 'product';
    if (/\b(services?|bookings?|slots?)\b/i.test(text)) return 'service';
    return null;
  }

  function readIntent(text) {
    const found = MATCHERS.map((m) => ({ sku: m.sku, at: text.search(m.re) })).filter((m) => m.at >= 0);
    const skus = found.sort((a, b) => a.at - b.at).map((m) => m.sku);
    const words = skus.map((sku) => text.match(MATCHERS.find((m) => m.sku === sku).re)[0].toLowerCase());
    const buy = text.match(BUY);
    let kind = kindOf(text);
    if (PERSON.test(text)) return { intent: 'unclear', skus, matched: words, kind, rule: 'Asked for a person' };
    if (skus.length && buy) {
      return { intent: 'order', skus: [skus[0]], matched: words, kind, rule: `Buy word "${buy[1].toLowerCase()}" with an item` };
    }
    if (skus.length) return { intent: 'availability', skus, matched: words, kind, rule: 'Item named without a buy word' };
    if (buy || kind || ASK.test(text)) {
      if (!kind && buy && /book|reserve/i.test(buy[1])) kind = 'service';
      return { intent: 'availability', skus: [], matched: [], kind, rule: 'General question about what is available' };
    }
    return { intent: 'unclear', skus: [], matched: [], kind, rule: 'No rule matched' };
  }

  // ---------- Workflow graph ----------

  const W = 1360;
  const H = 820;
  const COL0 = 74;
  const COL_GAP = 148;
  const TILE = 60;
  const SPINE = 290;
  const PAY_ROW = 590;

  const NODES = [
    { id: 't1', kind: 'trigger', col: 0, y: SPINE, name: 'Message or form received', type: 'Trigger',
      desc: 'Starts a run when the form is sent, a chat message arrives, or a Buy or Book button is pressed.' },
    { id: 'set', kind: 'set', col: 1, y: SPINE, name: 'Normalise message', type: 'Set',
      desc: 'Turns every kind of input into the same five fields: name, channel, text, sku and qty.' },
    { id: 'agent', kind: 'agent', col: 2, y: SPINE, name: 'Read intent', type: 'AI Agent (simulated)',
      desc: 'Decides what the customer wants. In this demo it is a short list of keyword rules, not an AI model.' },
    { id: 'route', kind: 'switch', col: 3, y: SPINE, name: 'Route by intent', type: 'Switch',
      outs: ['availability', 'order', 'unclear'],
      desc: 'Sends the run down one of three branches, based on the intent.' },
    { id: 'find', kind: 'table', col: 4, y: 108, name: 'Find matching items', type: 'Data table',
      desc: 'Reads the inventory rows that match the request. A general question returns everything in stock.' },
    { id: 'inStock', kind: 'if', col: 5, y: 108, name: 'Any in stock?', type: 'IF', outs: ['true', 'false'],
      desc: 'Checks whether at least one matching row has stock or free slots.' },
    { id: 'sendItems', kind: 'send', col: 6, y: 50, name: 'Send items and prices', type: 'Send message',
      desc: 'Replies in the chat with each item, its price, what is left, and a Buy or Book button.' },
    { id: 'sendOos', kind: 'send', col: 6, y: 166, name: 'Out of stock, offer alternatives', type: 'Send message',
      desc: 'Says the item is out, offers in-stock items of the same type and a waitlist button.' },
    { id: 'getItem', kind: 'table', col: 4, y: SPINE, name: 'Get item', type: 'Data table',
      desc: 'Reads the one inventory row the customer wants to buy or book.' },
    { id: 'enough', kind: 'if', col: 5, y: SPINE, name: 'Enough stock for qty?', type: 'IF', outs: ['true', 'false'],
      desc: 'Compares the quantity asked for with what is left in the data table.' },
    { id: 'createOrder', kind: 'table', col: 6, y: SPINE, name: 'Create pending order', type: 'Data table',
      desc: 'Adds a row to the orders table with status pending. Stock is not touched yet.' },
    { id: 'payLink', kind: 'http', col: 7, y: SPINE, name: 'Create payment link', type: 'HTTP Request (simulated)',
      desc: 'Would ask a payment provider for a link. Here it returns a made-up response without any request.' },
    { id: 'askPay', kind: 'send', col: 8, y: SPINE, name: 'Ask for payment', type: 'Send message',
      desc: 'Sends the order summary with a pay button and a button that simulates a declined card.' },
    { id: 'onlyN', kind: 'send', col: 6, y: 410, name: 'Only N left', type: 'Send message',
      desc: 'Tells the customer how many are left and offers that many instead, or the waitlist if none are left.' },
    { id: 'handover', kind: 'notify', col: 4, y: 410, name: 'Hand over with chat', type: 'Notify owner',
      desc: 'Sends the owner an alert with the chat so far, so a person can take over.' },
    { id: 'sendPerson', kind: 'send', col: 5, y: 410, name: 'A person will reply', type: 'Send message',
      desc: 'Tells the customer that someone from the team will answer in the chat.' },
    { id: 't2', kind: 'webhook', col: 0, y: PAY_ROW, name: 'Payment webhook', type: 'Trigger',
      desc: 'Starts a run when the payment provider reports a result. Here the pay buttons in the chat stand in for it.' },
    { id: 'paid', kind: 'if', col: 1, y: PAY_ROW, name: 'Payment succeeded?', type: 'IF', outs: ['true', 'false'],
      desc: 'Splits successful payments from declined cards.' },
    { id: 'pending', kind: 'if', col: 2, y: PAY_ROW, name: 'Order pending and in stock?', type: 'IF', outs: ['true', 'false'],
      desc: 'Checks that the order is still pending and that stock still covers it. Another order may have taken the last units.' },
    { id: 'subtract', kind: 'table', col: 3, y: PAY_ROW, name: 'Subtract stock, add to sold, mark paid', type: 'Data table',
      desc: 'The only step that changes stock: it subtracts the quantity, adds it to sold and marks the order paid.' },
    { id: 'receipt', kind: 'send', col: 4, y: PAY_ROW, name: 'Send receipt', type: 'Send message',
      desc: 'Sends the customer a receipt for the paid order.' },
    { id: 'reorder', kind: 'if', col: 5, y: PAY_ROW, name: 'At or below reorder level?', type: 'IF', outs: ['true', 'false'],
      desc: 'Compares what is left with the reorder level in the data table. The false branch ends the run.' },
    { id: 'lowAlert', kind: 'notify', col: 6, y: PAY_ROW, name: 'Low stock alert', type: 'Notify owner',
      desc: 'Sends the owner a short alert to restock or open more slots.' },
    { id: 'oversold', kind: 'notify', col: 3, y: 710, name: 'Oversold, refund needed', type: 'Notify owner',
      desc: 'Two pending orders wanted the last units and this payment arrived second. The owner is told to refund it.' },
    { id: 'refund', kind: 'send', col: 4, y: 710, name: 'Refund note', type: 'Send message',
      desc: 'Apologises to the customer and says the payment will be refunded.' },
    { id: 'failed', kind: 'send', col: 2, y: 710, name: 'Payment failed, new link', type: 'Send message',
      desc: 'Says the card was declined, nothing was charged and stock is unchanged, then sends a new link for the same order.' },
  ];
  const NODE = Object.fromEntries(NODES.map((n) => [n.id, n]));

  const EDGES = [
    ['t1', 0, 'set'], ['set', 0, 'agent'], ['agent', 0, 'route'],
    ['route', 0, 'find'], ['route', 1, 'getItem'], ['route', 2, 'handover'],
    ['find', 0, 'inStock'], ['inStock', 0, 'sendItems'], ['inStock', 1, 'sendOos'],
    ['getItem', 0, 'enough'], ['enough', 0, 'createOrder'], ['enough', 1, 'onlyN'],
    ['createOrder', 0, 'payLink'], ['payLink', 0, 'askPay'],
    ['handover', 0, 'sendPerson'],
    ['t2', 0, 'paid'], ['paid', 0, 'pending'], ['paid', 1, 'failed'],
    ['pending', 0, 'subtract'], ['pending', 1, 'oversold'],
    ['subtract', 0, 'receipt'], ['receipt', 0, 'reorder'], ['reorder', 0, 'lowAlert'],
    ['oversold', 0, 'refund'],
  ].map(([from, out, to]) => ({ from, out, to, key: `${from}:${out}` }));

  const INTENTS = ['availability', 'order', 'unclear'];

  // ---------- What each node does ----------
  // A node returns { json, out, crumb, result, effect }. Logic and data changes happen while the run is planned;
  // `effect` holds the visible part (chat reply, table update) and fires when the node lights up on the canvas.

  const delivered = (ctx, extra) => ({
    channel: ctx.msg.channel, to: ctx.msg.name, ...extra, delivered: 'shown in this page only (simulated)',
  });

  const RUN = {
    t1: (ctx, input) => ({ json: input }),

    set(ctx, input) {
      ctx.msg = input.source === 'website form'
        ? { name: input.name, channel: 'website form', text: input.note || '(no note)',
          sku: input.item === 'unsure' ? null : input.item, qty: input.quantity }
        : { name: input.from, channel: 'website chat', text: input.text, sku: input.sku || null,
          qty: input.qty || parseQty(input.text) };
      return { json: ctx.msg };
    },

    agent(ctx, input) {
      let read;
      if (ctx.payload.action === 'buy') {
        read = { intent: 'order', skus: [input.sku], matched: [], kind: null, rule: 'Buy or Book button pressed' };
      } else if (input.channel === 'website form') {
        read = input.sku
          ? { intent: 'availability', skus: [input.sku], matched: [], kind: null, rule: 'Item chosen in the form' }
          : { intent: 'unclear', skus: [], matched: [], kind: null, rule: 'Form: not sure, ask the team' };
      } else {
        read = readIntent(input.text);
        if (read.intent === 'order' && input.qty < 1) {
          read = { ...read, intent: 'availability', rule: 'Quantity 0, so the item is shown to choose how many' };
        }
      }
      ctx.intent = { ...read, qty: input.qty };
      return { json: { ...ctx.intent, engine: 'keyword rules (simulated, no AI call)' } };
    },

    route(ctx, input) {
      return { json: input, out: INTENTS.indexOf(ctx.intent.intent), crumb: ctx.intent.intent };
    },

    find(ctx) {
      const { skus, kind } = ctx.intent;
      ctx.generic = skus.length === 0;
      ctx.rows = ctx.generic ? state.items.filter((r) => r.stock > 0 && (!kind || r.type === kind)) : skus.map(item);
      return { json: ctx.rows.map(rowJson) };
    },

    inStock(ctx, input) {
      const any = ctx.rows.some((r) => r.stock > 0);
      return { json: input, out: any ? 0 : 1, crumb: any ? 'in stock' : 'none in stock' };
    },

    sendItems(ctx) {
      return {
        json: delivered(ctx, { items: ctx.rows.map((r) => r.sku) }),
        crumb: 'items sent',
        result: `Sent ${ctx.rows.length === 1 ? '1 item' : `${ctx.rows.length} items`} with prices`,
        effect: () => replyItems(ctx),
      };
    },

    sendOos(ctx) {
      const out = ctx.rows.filter((r) => r.stock === 0);
      ctx.alternatives = alternativesFor(out);
      return {
        json: delivered(ctx, { outOfStock: out.map((r) => r.sku), alternatives: ctx.alternatives.map((r) => r.sku) }),
        crumb: 'alternatives offered',
        result: 'Out of stock, alternatives offered',
        effect: () => replyOutOfStock(ctx, out),
      };
    },

    getItem(ctx) {
      ctx.row = item(ctx.intent.skus[0]);
      return { json: rowJson(ctx.row) };
    },

    enough(ctx) {
      const ok = ctx.row.stock >= ctx.intent.qty;
      return {
        json: { sku: ctx.row.sku, requested: ctx.intent.qty, inStock: ctx.row.stock, enough: ok },
        out: ok ? 0 : 1,
        crumb: ok ? 'enough stock' : 'not enough stock',
      };
    },

    createOrder(ctx) {
      const row = ctx.row;
      const order = {
        no: `PR-${String(state.nextOrder).padStart(4, '0')}`,
        sku: row.sku, name: row.name, type: row.type, qty: ctx.intent.qty, unit: row.price,
        total: row.price * ctx.intent.qty, status: 'pending', declines: 0, customer: ctx.msg.name,
      };
      state.nextOrder += 1;
      state.orders.push(order);
      ctx.order = order;
      return { json: orderJson(order), effect: () => renderOrders(order.no) };
    },

    payLink(ctx) {
      const o = ctx.order;
      return {
        json: { statusCode: 200, simulated: true, orderNo: o.no, amount: o.total, currency: '¤',
          link: `https://pay.example.invalid/${o.no}` },
      };
    },

    askPay(ctx) {
      return {
        json: delivered(ctx, { orderNo: ctx.order.no, total: ctx.order.total }),
        crumb: 'payment link sent',
        result: `Payment link sent for ${ctx.order.no}`,
        effect: () => replyAskPay(ctx.order),
      };
    },

    onlyN(ctx) {
      const left = ctx.row.stock;
      if (left === 0) ctx.alternatives = alternativesFor([ctx.row]);
      return {
        json: delivered(ctx, { sku: ctx.row.sku, requested: ctx.intent.qty, left }),
        crumb: left === 0 ? 'none left' : `only ${left} left`,
        result: left === 0 ? 'Out of stock, waitlist offered' : `Offered ${left} instead of ${ctx.intent.qty}`,
        effect: () => replyOnlyN(ctx),
      };
    },

    handover(ctx) {
      const transcript = state.transcript.slice(-8).map((m) => `${m.from}: ${m.text}`);
      const alert = {
        kind: 'Hand-over', time: clock(),
        text: `${ctx.msg.name} needs a person (${ctx.intent.rule.toLowerCase()}). Reply in the chat.`,
        transcript,
      };
      state.alerts.unshift(alert);
      return {
        json: { notify: 'owner (simulated)', reason: ctx.intent.rule, customer: ctx.msg.name, channel: ctx.msg.channel,
          chatSoFar: transcript },
        crumb: 'handed to owner',
        effect: () => renderAlerts(),
      };
    },

    sendPerson(ctx) {
      return {
        json: delivered(ctx, { handedOver: true }),
        result: 'Handed over to a person',
        effect: () => replyHandover(ctx),
      };
    },

    t2: (ctx, input) => ({ json: input }),

    paid(ctx, input) {
      ctx.order = state.orders.find((o) => o.no === input.orderNo);
      const ok = input.event === 'payment.succeeded';
      return { json: input, out: ok ? 0 : 1, crumb: ok ? 'paid' : 'declined' };
    },

    pending(ctx) {
      const o = ctx.order;
      ctx.row = item(o.sku);
      const ok = o.status === 'pending' && ctx.row.stock >= o.qty;
      return {
        json: { orderNo: o.no, status: o.status, qty: o.qty, inStock: ctx.row.stock, ok },
        out: ok ? 0 : 1,
        crumb: ok ? 'stock available' : 'stock ran out',
      };
    },

    subtract(ctx) {
      const o = ctx.order;
      const row = ctx.row;
      const before = row.stock;
      row.stock -= o.qty;
      row.sold += o.qty;
      o.status = 'paid';
      return {
        json: { sku: row.sku, stockBefore: before, stockAfter: row.stock, sold: row.sold, orderNo: o.no, status: 'paid' },
        crumb: 'stock subtracted',
        effect: () => {
          renderInventory({ sku: row.sku, stock: `-${o.qty}`, sold: `+${o.qty}` });
          renderOrders(o.no);
          lockPayButtons(o.no);
        },
      };
    },

    receipt(ctx) {
      return {
        json: { channel: 'website chat', to: ctx.order.customer, orderNo: ctx.order.no, paid: ctx.order.total,
          delivered: 'shown in this page only (simulated)' },
        crumb: 'receipt sent',
        result: `Paid, receipt sent for ${ctx.order.no}`,
        effect: () => replyReceipt(ctx.order),
      };
    },

    reorder(ctx) {
      const low = ctx.row.stock <= ctx.row.reorder;
      return {
        json: { sku: ctx.row.sku, inStock: ctx.row.stock, reorderAt: ctx.row.reorder, low },
        out: low ? 0 : 1,
      };
    },

    lowAlert(ctx) {
      const row = ctx.row;
      const left = row.stock === 0 ? (isService(row) ? 'fully booked' : 'none left') : `${stockText(row).toLowerCase()}`;
      const alert = { kind: 'Low stock', time: clock(), text: `${row.name}: ${left} (reorder at ${row.reorder}).` };
      state.alerts.unshift(alert);
      return {
        json: { notify: 'owner (simulated)', sku: row.sku, inStock: row.stock, reorderAt: row.reorder },
        crumb: 'low-stock alert',
        result: `Paid, receipt sent, low-stock alert for ${row.sku}`,
        effect: () => renderAlerts(),
      };
    },

    oversold(ctx) {
      const o = ctx.order;
      o.status = 'refund';
      const alert = {
        kind: 'Oversold', time: clock(),
        text: `${o.no} paid ${money(o.total)} for ${o.qty} × ${o.name}, but stock ran out first. Refund needed.`,
      };
      state.alerts.unshift(alert);
      return {
        json: { notify: 'owner (simulated)', orderNo: o.no, amount: o.total, inStock: ctx.row.stock, action: 'refund' },
        crumb: 'refund needed',
        effect: () => {
          renderAlerts();
          renderOrders(o.no);
          lockPayButtons(o.no);
        },
      };
    },

    refund(ctx) {
      return {
        json: { channel: 'website chat', to: ctx.order.customer, orderNo: ctx.order.no, refund: ctx.order.total },
        result: `Oversold, refund needed for ${ctx.order.no}`,
        effect: () => replyRefund(ctx.order),
      };
    },

    failed(ctx) {
      const o = ctx.order;
      o.declines += 1;
      return {
        json: { channel: 'website chat', to: o.customer, orderNo: o.no, status: o.status, newLink: `https://pay.example.invalid/${o.no}?try=${o.declines + 1}` },
        crumb: 'new link sent',
        result: `Declined, new link sent for ${o.no}`,
        effect: () => {
          renderOrders(o.no);
          replyDeclined(o);
        },
      };
    },
  };

  function orderJson(o) {
    return { orderNo: o.no, sku: o.sku, item: o.name, qty: o.qty, unitPrice: o.unit, total: o.total, status: o.status,
      customer: o.customer };
  }

  function alternativesFor(rows) {
    const skus = rows.map((r) => r.sku);
    const types = new Set(rows.map((r) => r.type));
    return state.items.filter((r) => r.stock > 0 && !skus.includes(r.sku) && (!types.size || types.has(r.type))).slice(0, 3);
  }

  // Walks the graph once, running each node's logic, and returns the path taken.
  function plan(trigger, payload) {
    const ctx = { payload };
    const steps = [];
    let id = trigger;
    let input = payload;
    while (id) {
      const r = RUN[id](ctx, input);
      const out = r.out ?? 0;
      const edge = EDGES.find((e) => e.from === id && e.out === out) || null;
      steps.push({ id, input, output: r.json, crumb: r.crumb, result: r.result, effect: r.effect, edge });
      input = r.json;
      id = edge ? edge.to : null;
    }
    return steps;
  }

  // ---------- Execution queue and animation ----------

  const queue = [];
  let busy = false;
  let generation = 0; // bumped by Reset so a run in progress stops quietly
  let current = null; // the execution being shown
  let lastExec = null;
  const lastRun = {}; // node id -> { exec, input, output } from the latest run that reached it

  function enqueue(job) {
    queue.push(job);
    updateRunChip();
    if (!busy) drain();
  }

  async function drain() {
    busy = true;
    while (queue.length) {
      const job = queue.shift();
      updateRunChip();
      try {
        await job();
      } catch (err) {
        console.error(err);
      }
    }
    busy = false;
    updateRunChip();
    trailIdle();
    // Hold on the finished run for a moment, then go back to the chat.
    if (watching) window.setTimeout(() => { if (watching && !busy) { watching = false; scrollToEl(byId('chat-title')); } }, 1200);
  }

  // ---------- Run trail in the chat, and the optional trip to the canvas ----------

  // The trail mirrors the running execution under the chat, so the chat never has to leave the screen.
  // "Watch this run" scrolls to the canvas and, once the queue is empty, back to the chat, unless the
  // visitor scrolls on their own meanwhile.
  const trailLabel = byId('trail-label');
  const trailSteps = byId('trail-steps');
  const trailWatch = byId('trail-watch');
  let watching = false;

  function trailStart(exec) {
    trailLabel.textContent = `Run #${exec.n}`;
    trailSteps.replaceChildren();
    trailWatch.textContent = 'Watch this run \u2193';
  }

  function trailStep(id) {
    const li = h('li', { class: 'trail-step', 'data-state': 'running', text: NODE[id].name });
    trailSteps.append(li);
    trailSteps.scrollLeft = trailSteps.scrollWidth;
    return li;
  }

  function trailIdle() {
    trailLabel.textContent = lastExec ? `Run #${lastExec.n} finished` : 'Workflow: idle';
    trailWatch.textContent = 'See the workflow \u2193';
    trailSteps.scrollLeft = trailSteps.scrollWidth;
  }

  function scrollToEl(el) {
    const top = el.getBoundingClientRect().top + window.scrollY - guideBar.offsetHeight - 16; // clear the pinned step guide
    window.scrollTo({ top, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  trailWatch.addEventListener('click', () => {
    watching = busy;
    scrollToEl(byId('canvas-wrap'));
  });
  // Any scrolling the visitor does themselves cancels the trip back.
  const stopWatching = () => { watching = false; };
  window.addEventListener('wheel', stopWatching, { passive: true });
  window.addEventListener('touchmove', stopWatching, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) stopWatching();
  });

  function runWorkflow(trigger, source, payload) {
    enqueue(() => execute(trigger, source, payload));
  }

  async function execute(trigger, source, payload) {
    const gen = generation;
    const steps = plan(trigger, payload);
    const exec = {
      n: state.nextExec,
      trigger: NODE[trigger].name,
      source,
      time: clock(),
      status: 'running',
      path: new Set(steps.map((s) => s.id)),
      crumbs: [], // filled in as each step finishes, so the list never runs ahead of the canvas
      result: 'Running…',
    };
    state.nextExec += 1;
    state.executions.unshift(exec);
    state.executions.length = Math.min(state.executions.length, MAX_EXECUTIONS);
    current = exec;
    lastExec = exec;
    renderExecutions();
    paintStart(exec);
    if (inspected) renderInspector();
    updateRunChip();
    typing(true);

    trailStart(exec);
    const still = reducedMotion.matches;
    for (const step of steps) {
      follow(step.id);
      setNodeState(step.id, 'running');
      const chip = trailStep(step.id);
      if (!still) {
        await sleep(STEP_MS);
        if (gen !== generation) return;
      }
      if (step.effect) step.effect();
      lastRun[step.id] = { exec: exec.n, input: step.input, output: step.output };
      setNodeState(step.id, 'success');
      chip.dataset.state = 'done';
      if (step.edge) activateEdge(step.edge, step.output);
      if (inspected === step.id) renderInspector();
      if (step.crumb) {
        exec.crumbs.push(step.crumb);
        renderExecutions();
      }
    }

    typing(false);
    exec.status = 'success';
    exec.result = steps.map((s) => s.result).filter(Boolean).pop() || 'Finished';
    current = null;
    renderExecutions();
    if (inspected) renderInspector();
    announce(`Execution ${exec.n} finished: ${exec.result}.`);
    guideUpdate();
  }

  // ---------- Canvas ----------

  const canvas = byId('canvas');
  const wires = byId('wires');
  const nodeEls = {};
  const wireEls = {};
  const countEls = {};

  const ICONS = {
    trigger: ['M13 2 4.5 13.5H11L10 22l8.5-11.5H13z'],
    webhook: ['M3 6.5h18v11H3z', 'M3 10.5h18', 'M7 14.5h4'],
    set: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
    agent: ['M7 8h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M12 4v4', 'M9.5 12.5v2', 'M14.5 12.5v2', 'M3 13h2', 'M19 13h2'],
    switch: ['M3 12h6', 'M9 12c3 0 3-6 7-6h5', 'M9 12h12', 'M9 12c3 0 3 6 7 6h5'],
    if: ['M3 12h6', 'M9 12c3 0 3-5 7-5h5', 'M9 12c3 0 3 5 7 5h5'],
    table: ['M4 5h16v14H4z', 'M4 10h16', 'M4 14.5h16', 'M10 5v14'],
    http: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M3 12h18', 'M12 3c3.2 3 3.2 15 0 18', 'M12 3c-3.2 3-3.2 15 0 18'],
    send: ['M21 3 10 14', 'M21 3l-6.5 18-4-8-8-4z'],
    notify: ['M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9z', 'M10 20.5a2.2 2.2 0 0 0 4 0'],
    check: ['M5 12.5l4.5 4.5L19 7.5'],
  };

  function icon(name, cls) {
    const el = svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false', class: cls || 'icon' });
    ICONS[name].forEach((d) => el.append(svg('path', { d })));
    return el;
  }

  const tileHeight = (n) => (n.outs && n.outs.length > 2 ? 96 : TILE);
  const centerX = (n) => COL0 + n.col * COL_GAP;
  const outCount = (n) => (n.outs ? n.outs.length : EDGES.some((e) => e.from === n.id) ? 1 : 0);
  const outOffset = (n, i) => (tileHeight(n) * (i + 1)) / (outCount(n) + 1);
  const outPoint = (n, i) => ({ x: centerX(n) + TILE / 2 + 1, y: n.y - tileHeight(n) / 2 + outOffset(n, i) });
  const inPoint = (n) => ({ x: centerX(n) - TILE / 2 - 1, y: n.y });
  const isTrigger = (n) => n.kind === 'trigger' || n.kind === 'webhook';

  function wirePath(a, b) {
    const dx = Math.max(36, (b.x - a.x) / 2);
    return `M${a.x} ${a.y} C${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;
  }

  // A point on the curve above, a little past the middle, so the item count clears the branch labels.
  function wirePoint(a, b, t = 0.62) {
    const dx = Math.max(36, (b.x - a.x) / 2);
    const u = 1 - t;
    const bez = (p0, p1, p2, p3) => u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
    return { x: bez(a.x, a.x + dx, b.x - dx, b.x), y: bez(a.y, a.y, b.y, b.y) };
  }

  function place(el, x, y) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    return el;
  }

  function buildCanvas() {
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    wires.setAttribute('viewBox', `0 0 ${W} ${H}`);
    wires.setAttribute('width', W);
    wires.setAttribute('height', H);

    canvas.append(
      place(h('p', { class: 'lane-label', text: 'Customer messages' }), 24, 14),
      place(h('div', { class: 'lane-rule', 'aria-hidden': 'true' }), 0, 508),
      place(h('p', { class: 'lane-label', text: 'Payment provider calls back' }), 24, 520),
    );

    EDGES.forEach((e) => {
      const a = outPoint(NODE[e.from], e.out);
      const b = inPoint(NODE[e.to]);
      const path = svg('path', { d: wirePath(a, b), class: 'wire', pathLength: 1 });
      wires.append(path);
      wireEls[e.key] = path;
      // On a steep climb the pill would land on the target's own label, so it sits lower on the curve.
      const mid = wirePoint(a, b, b.y < a.y - 100 ? 0.45 : 0.62);
      countEls[e.key] = canvas.appendChild(place(h('span', { class: 'wire-count', 'aria-hidden': 'true' }), mid.x, mid.y));
    });

    NODES.forEach((n) => {
      const th = tileHeight(n);
      const tile = h('span', { class: 'node-tile' },
        icon(n.kind),
        h('span', { class: 'node-badge', 'aria-hidden': 'true' }, icon('check', 'badge-icon')));
      if (!isTrigger(n)) tile.append(place(h('span', { class: 'handle handle-in', 'aria-hidden': 'true' }), -7, th / 2 - 6));
      for (let i = 0; i < outCount(n); i += 1) {
        tile.append(place(h('span', { class: 'handle handle-out', 'aria-hidden': 'true' }), TILE - 7, outOffset(n, i) - 6));
      }
      const btn = h('button', {
        type: 'button', class: 'node', 'data-kind': n.kind, 'data-node': n.id,
        'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'inspector',
      },
      tile,
      h('span', { class: 'node-name', text: n.name }),
      h('span', { class: 'node-type', text: n.type }));
      btn.addEventListener('click', () => openInspector(n.id));
      place(btn, centerX(n) - 70, n.y - th / 2);
      nodeEls[n.id] = btn;
      setNodeState(n.id, 'idle');
      canvas.append(btn);

      // Branch names sit 9px off their wire, so an item count on the wire never covers them. They go above the
      // wire, except an IF's false label: the true label fills the gap between its two handles. The Switch's
      // handles are far enough apart for its bottom label to sit above its downward wire, clear of the curve.
      (n.outs || []).forEach((label, i) => {
        const p = outPoint(n, i);
        const below = n.kind === 'if' && i === n.outs.length - 1;
        canvas.append(place(h('span', { class: `out-label${below ? ' out-label-below' : ''}`, 'aria-hidden': 'true', text: label }),
          p.x + 5, below ? p.y + 8 : p.y - 8));
      });
    });
  }

  const STATE_TEXT = {
    idle: '',
    waiting: 'On the path of the current execution.',
    running: 'Running.',
    success: 'Ran in the last execution.',
    dim: 'Not on the path of the last execution.',
  };

  function setNodeState(id, s) {
    const el = nodeEls[id];
    const n = NODE[id];
    el.dataset.state = s;
    el.setAttribute('aria-label', `${n.name}. ${n.type} node. ${STATE_TEXT[s]}`.trim());
  }

  function paintStart(exec) {
    NODES.forEach((n) => setNodeState(n.id, exec.path.has(n.id) ? 'waiting' : 'dim'));
    EDGES.forEach((e) => {
      const onPath = exec.path.has(e.from) && exec.path.has(e.to);
      wireEls[e.key].dataset.state = onPath ? 'waiting' : 'dim';
      countEls[e.key].textContent = '';
      delete countEls[e.key].dataset.show;
    });
  }

  function activateEdge(edge, output) {
    const path = wireEls[edge.key];
    path.dataset.state = 'active';
    wires.append(path); // draw on top of the dimmed wires
    const n = Array.isArray(output) ? output.length : 1;
    countEls[edge.key].textContent = `${n} ${n === 1 ? 'item' : 'items'}`;
    countEls[edge.key].dataset.show = '';
  }

  function resetCanvas() {
    NODES.forEach((n) => setNodeState(n.id, 'idle'));
    EDGES.forEach((e) => {
      delete wireEls[e.key].dataset.state;
      countEls[e.key].textContent = '';
      delete countEls[e.key].dataset.show;
    });
  }

  // On narrow screens the canvas scrolls inside its own box; keep the running node in view there.
  const scroller = byId('canvas-scroll');
  function follow(id) {
    if (scroller.scrollWidth <= scroller.clientWidth) return;
    const x = centerX(NODE[id]);
    const w = scroller.clientWidth;
    if (x < scroller.scrollLeft + 80 || x > scroller.scrollLeft + w - 80) {
      scroller.scrollTo({ left: x - w / 2, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
  }

  const runChip = byId('run-chip');
  function updateRunChip() {
    const waiting = queue.length;
    const more = waiting ? `, ${waiting} queued` : '';
    if (current) {
      runChip.dataset.state = 'running';
      runChip.textContent = `Running execution #${current.n}${more}`;
    } else {
      runChip.dataset.state = waiting ? 'running' : 'idle';
      runChip.textContent = waiting ? `Starting${more}` : 'Idle';
    }
  }

  // ---------- Node inspector ----------

  const inspector = byId('inspector');
  let inspected = null;

  const json = (value) => JSON.stringify(value, null, 2);

  function renderInspector() {
    const n = NODE[inspected];
    byId('insp-title').textContent = n.name;
    byId('insp-type').textContent = n.type;
    byId('insp-desc').textContent = n.desc;
    const iconBox = byId('insp-icon');
    iconBox.dataset.kind = n.kind;
    iconBox.replaceChildren(icon(n.kind));

    const rec = lastRun[n.id];
    let note;
    let shown = rec;
    let empty = 'Not run in the last execution.';
    if (!lastExec) {
      note = 'No executions yet. Use the form or the chat to start one.';
    } else if (rec && rec.exec === lastExec.n) {
      note = `Data from execution #${rec.exec}.`;
    } else if (lastExec.status === 'running' && lastExec.path.has(n.id)) {
      note = `Waiting to run in execution #${lastExec.n}.`;
      shown = null;
      empty = 'Waiting to run.';
    } else {
      note = `Not run in the last execution (#${lastExec.n}).`;
      if (rec) note += ` Showing data from execution #${rec.exec}, the last one that reached it.`;
    }
    byId('insp-run').textContent = note;
    byId('insp-in').textContent = shown ? json(shown.input) : empty;
    byId('insp-out').textContent = shown ? json(shown.output) : empty;
  }

  function openInspector(id) {
    if (inspected && inspected !== id) nodeEls[inspected].setAttribute('aria-expanded', 'false');
    inspected = id;
    renderInspector();
    inspector.hidden = false;
    nodeEls[id].setAttribute('aria-expanded', 'true');
    inspector.focus();
  }

  function closeInspector(returnFocus) {
    if (!inspected) return;
    const el = nodeEls[inspected];
    inspected = null;
    inspector.hidden = true;
    el.setAttribute('aria-expanded', 'false');
    if (returnFocus) el.focus();
  }

  byId('insp-close').addEventListener('click', () => closeInspector(true));
  byId('canvas-wrap').addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && inspected) {
      e.preventDefault();
      closeInspector(true);
    }
  });

  // ---------- Chat ----------

  const chatLog = byId('chat-log');
  const chatText = byId('chat-text');
  const chatError = byId('chat-text-error');
  let uid = 0;
  let typingEl = null;
  const payButtons = {}; // order no -> every pay and decline button shown for it

  function post(from, ...content) {
    const li = h('li', { class: `msg msg-${from}` }, ...content);
    chatLog.append(li);
    if (typingEl) chatLog.append(typingEl); // keep the typing dots last
    chatLog.scrollTop = chatLog.scrollHeight;
    return li;
  }

  function remember(from, text) {
    state.transcript.push({ from, text });
  }

  function typing(on) {
    if (on && !typingEl) {
      typingEl = h('li', { class: 'msg msg-assistant msg-typing' },
        h('div', { class: 'bubble' },
          h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', { class: 'dot', 'aria-hidden': 'true' }),
          h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', { class: 'sr-only', text: 'The assistant is typing' })));
      chatLog.append(typingEl);
      chatLog.scrollTop = chatLog.scrollHeight;
    } else if (!on && typingEl) {
      typingEl.remove();
      typingEl = null;
    }
  }

  function customerSays(text, via) {
    post('customer',
      h('div', { class: 'bubble' }, h('p', { text })),
      h('p', { class: 'msg-meta', text: via ? `${state.customer}, ${via}` : state.customer }));
    remember(state.customer, text);
  }

  function systemNote(text) {
    post('system', h('p', { text: `Payment page: ${text}` }));
    remember('Payment page', text);
  }

  function assistantSays(lines, ...extra) {
    typing(false);
    const run = current ? current.n : null;
    post('assistant',
      h('div', { class: 'bubble' }, lines.map((t) => h('p', { text: t })), ...extra),
      h('p', { class: 'msg-meta' }, 'Assistant (simulated)',
        run ? [' · ', h('a', { href: '#flow-title', text: `run #${run}` })] : null));
    remember('Assistant', lines.join(' '));
  }

  function greet() {
    post('assistant',
      h('div', { class: 'bubble' },
        h('p', { text: 'Hello. I can check what is in stock, take an order or a booking, or pass you to the team.' }),
        h('p', { text: 'Ask below, use a quick reply, or send the form.' })),
      h('p', { class: 'msg-meta', text: 'Assistant (simulated)' }));
  }

  function stepper(row, want) {
    const id = `qty-${uid += 1}`;
    const max = row.stock;
    const input = h('input', { id, class: 'step-input', type: 'number', inputmode: 'numeric', min: 1, max, step: 1,
      value: clamp(want, 1, max) });
    const less = h('button', { type: 'button', class: 'step-btn', 'aria-label': 'One fewer', text: '−' });
    const more = h('button', { type: 'button', class: 'step-btn', 'aria-label': 'One more', text: '+' });
    const value = () => clamp(parseInt(input.value, 10) || 1, 1, max);
    const sync = () => {
      input.value = value();
      less.setAttribute('aria-disabled', String(value() <= 1));
      more.setAttribute('aria-disabled', String(value() >= max));
    };
    less.addEventListener('click', () => { input.value = value() - 1; sync(); });
    more.addEventListener('click', () => { input.value = value() + 1; sync(); });
    input.addEventListener('change', sync);
    sync();
    return {
      value,
      el: h('div', { class: 'stepper' },
        h('label', { for: id, class: 'sr-only', text: `Quantity, ${row.name}, up to ${max}` }), less, input, more),
    };
  }

  // A button that acts on its first click only, so a double click can't queue the same request twice.
  function onceClick(btn, fn) {
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-disabled') === 'true') return;
      btn.setAttribute('aria-disabled', 'true');
      fn();
    });
    return btn;
  }

  function waitlistButton(row) {
    const btn = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: "Tell me when it's back",
      'aria-label': `Tell me when it's back: ${row.name}` });
    return onceClick(btn, () => {
      btn.textContent = 'On the waitlist';
      btn.setAttribute('aria-label', `On the waitlist: ${row.name}`);
      joinWaitlist(row.sku);
    });
  }

  function itemCard(row, want) {
    const card = h('li', { class: 'pcard' },
      h('div', { class: 'pcard-top' },
        h('strong', { class: 'pcard-name', text: row.name }),
        h('span', { class: 'pcard-price', text: money(row.price) })),
      h('p', { class: 'pcard-meta' },
        `${row.sku} · ${isService(row) ? 'Service' : 'Product'} · `,
        h('span', { class: 'stock', 'data-level': level(row), text: stockText(row) })));
    if (row.stock > 0) {
      const qty = stepper(row, want);
      const buy = h('button', { type: 'button', class: 'btn btn-primary btn-sm', text: verb(row),
        'aria-label': `${verb(row)} ${row.name}` });
      onceClick(buy, () => order(row.sku, qty.value()));
      card.append(h('div', { class: 'pcard-buy' }, qty.el, buy));
    } else {
      card.append(h('div', { class: 'pcard-buy' }, waitlistButton(row)));
    }
    return card;
  }

  const cardList = (rows, want) => h('ul', { class: 'pcards' }, rows.map((r) => itemCard(r, want)));

  function replyItems(ctx) {
    const rows = ctx.rows;
    const want = ctx.msg.qty || 1;
    const single = rows.length === 1 ? rows[0] : null;
    const lines = [];
    if (ctx.generic) {
      const kind = ctx.intent.kind;
      lines.push(kind === 'service' ? 'These can be booked now:' : kind === 'product' ? 'These products are in stock now:' : 'This is what is available now:');
    } else if (single) {
      lines.push(isService(single) ? `Yes, the ${single.name} can be booked.` : `Yes, the ${single.name} is in stock.`);
      if (ctx.msg.qty === 0) {
        lines.push('How many would you like? Choose a quantity below.');
      } else if (want > single.stock) {
        lines.push(`You asked for ${want}, but only ${single.stock} ${single.stock === 1 ? 'is' : 'are'} left, so the quantity is set to ${single.stock}.`);
      }
    } else {
      lines.push('Here is what I found:');
    }
    assistantSays(lines, cardList(rows, single ? want : 1));
  }

  function replyOutOfStock(ctx, out) {
    const lines = out.length
      ? out.map((r) => (isService(r) ? `The ${r.name} is fully booked right now.` : `The ${r.name} is out of stock right now.`))
      : ['Nothing like that is available right now.'];
    const extra = [];
    if (out.length) extra.push(h('div', { class: 'msg-actions' }, out.map(waitlistButton)));
    if (ctx.alternatives.length) {
      lines.push(ctx.alternatives.length === 1 ? 'This one is available instead:' : 'These are available instead:');
      extra.push(cardList(ctx.alternatives, 1));
    }
    assistantSays(lines, ...extra);
  }

  function replyOnlyN(ctx) {
    const row = ctx.row;
    const left = row.stock;
    const want = ctx.intent.qty;
    if (left === 0) {
      const lines = [isService(row)
        ? `The ${row.name} is fully booked, so I can't take that booking.`
        : `The ${row.name} is out of stock, so I can't take that order.`];
      const extra = [h('div', { class: 'msg-actions' }, waitlistButton(row))];
      if (ctx.alternatives.length) {
        lines.push('You could try one of these:');
        extra.push(cardList(ctx.alternatives, 1));
      }
      assistantSays(lines, ...extra);
      return;
    }
    const instead = onceClick(h('button', { type: 'button', class: 'btn btn-primary btn-sm', text: `${verb(row)} ${left} instead` }),
      () => order(row.sku, left));
    assistantSays(
      [`Only ${left} left of the ${row.name}, and you asked for ${want}. Do you want ${left} instead?`],
      h('div', { class: 'msg-actions' }, instead),
    );
  }

  function orderSummary(o) {
    return h('dl', { class: 'summary' },
      h('div', {}, h('dt', { text: 'Item' }), h('dd', { text: o.name })),
      h('div', {}, h('dt', { text: 'Quantity' }), h('dd', { text: String(o.qty) })),
      h('div', {}, h('dt', { text: 'Unit price' }), h('dd', { text: money(o.unit) })),
      h('div', { class: 'summary-total' }, h('dt', { text: 'Total' }), h('dd', { text: money(o.total) })));
  }

  function payCard(o) {
    const pay = h('button', { type: 'button', class: 'btn btn-primary btn-sm', text: `Pay ${money(o.total)} (simulated)` });
    const decline = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Simulate a declined card' });
    const buttons = [pay, decline];
    (payButtons[o.no] = payButtons[o.no] || []).push(...buttons);
    pay.addEventListener('click', () => payment(o.no, true, buttons, pay));
    decline.addEventListener('click', () => payment(o.no, false, buttons, decline));
    return h('div', { class: 'paycard' },
      h('p', { class: 'paycard-title' }, h('span', { text: `Order ${o.no}` }), h('span', { class: 'tag', text: 'Awaiting payment' })),
      orderSummary(o),
      h('div', { class: 'paycard-actions' }, buttons));
  }

  function replyAskPay(o) {
    const what = o.type === 'service' ? 'Your booking is held' : 'Your order is ready';
    assistantSays([`${what}. Pay with the link below to confirm it.`], payCard(o));
  }

  function replyDeclined(o) {
    assistantSays(
      ['That payment did not go through. Nothing was charged and your order is still open.', 'Here is a new payment link for the same order.'],
      payCard(o),
    );
  }

  function replyReceipt(o) {
    const done = o.type === 'service'
      ? 'Payment received, and your booking is confirmed. The team will contact you to fix a date.'
      : 'Payment received. Thank you, your order is confirmed.';
    assistantSays([done], h('div', { class: 'paycard receipt' },
      h('p', { class: 'paycard-title' }, h('span', { text: `Receipt for ${o.no}` }), h('span', { class: 'tag tag-ok', text: 'Paid' })),
      orderSummary(o)));
  }

  function replyRefund(o) {
    assistantSays([
      `Sorry, the last ${o.type === 'service' ? 'slot was booked' : 'units sold'} before your payment arrived.`,
      `Your payment of ${money(o.total)} for ${o.no} will be refunded, and the team has been told.`,
    ]);
  }

  function replyHandover(ctx) {
    const asked = ctx.intent.rule === 'Asked for a person' || ctx.msg.channel === 'website form';
    assistantSays([
      asked
        ? 'Of course. I have passed this chat to the team, and a person will reply here.'
        : 'I am not sure about that one, so I have passed this chat to the team. A person will reply here.',
      'This is a demo, so nobody will actually reply.',
    ]);
  }

  // A paid or refunded order can't be paid again from any card shown for it.
  function lockPayButtons(no) {
    (payButtons[no] || []).forEach((b) => b.setAttribute('aria-disabled', 'true'));
  }

  // ---------- Events from the page ----------

  function order(sku, qty) {
    const row = item(sku);
    const text = `${verb(row)} ${qty} × ${row.name}`;
    customerSays(text);
    runWorkflow('t1', 'Buy button', {
      source: 'website chat', from: state.customer, action: 'buy', sku, qty, text,
    });
  }

  function chatMessage(text, source) {
    customerSays(text);
    runWorkflow('t1', source, { source: 'website chat', from: state.customer, text });
  }

  function payment(no, ok, buttons, clicked) {
    if (clicked.getAttribute('aria-disabled') === 'true') return;
    buttons.forEach((b) => b.setAttribute('aria-disabled', 'true'));
    clicked.textContent = ok ? 'Card approved (simulated)' : 'Card declined (simulated)';
    const o = state.orders.find((x) => x.no === no);
    systemNote(ok
      ? `card approved for ${o.no}, ${money(o.total)} (simulated)`
      : `card declined for ${o.no} (simulated)`);
    runWorkflow('t2', ok ? 'Payment page: approved' : 'Payment page: declined', {
      event: ok ? 'payment.succeeded' : 'payment.failed', orderNo: no, amount: o.total, provider: 'simulated',
    });
  }

  // The waitlist is not part of the workflow graph; it only writes to the data table. It still waits in the
  // queue so the chat stays in order.
  function joinWaitlist(sku) {
    const row = item(sku);
    customerSays(`Tell me when the ${row.name} is back`);
    const gen = generation;
    enqueue(async () => {
      if (gen !== generation) return;
      row.waitlist += 1;
      renderInventory({ sku, waitlist: '+1' });
      assistantSays([
        `You are on the waitlist for the ${row.name}. ${row.waitlist === 1 ? '1 person is' : `${row.waitlist} people are`} waiting.`,
        'In this demo no message will be sent when it is back.',
      ]);
      announce(`Added to the waitlist for the ${row.name}.`);
    });
  }

  byId('order-form').addEventListener('order-request', (e) => {
    const d = e.detail;
    state.customer = d.name;
    const row = d.sku === 'unsure' ? null : item(d.sku);
    const ask = row
      ? `Is the ${row.name} available? I need ${d.qty}.`
      : 'I am not sure what I need. Can someone from the team help?';
    customerSays(d.note ? `${ask} Note: ${d.note}` : ask, 'via the form');
    runWorkflow('t1', 'Form', {
      source: 'website form', name: d.name, contact: d.contact, item: d.sku, quantity: d.qty, note: d.note,
    });
  });

  // The portfolio shows this page in an iframe sandboxed without allow-forms, where a form never fires
  // `submit`. So Send works from a click, and Enter is caught before the browser tries to submit the form.
  function sendChat() {
    const text = chatText.value.trim();
    if (!text) {
      chatError.textContent = 'Type a message first.';
      chatError.hidden = false;
      chatText.setAttribute('aria-invalid', 'true');
      chatText.focus();
      return;
    }
    chatError.hidden = true;
    chatText.setAttribute('aria-invalid', 'false');
    chatText.value = '';
    chatMessage(text, 'Chat message');
  }

  byId('chat-send').addEventListener('click', sendChat);
  chatText.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.isComposing) return;
    e.preventDefault();
    sendChat();
  });

  chatText.addEventListener('input', () => {
    if (chatText.getAttribute('aria-invalid') === 'true') {
      chatError.hidden = true;
      chatText.setAttribute('aria-invalid', 'false');
    }
  });

  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => chatMessage(chip.dataset.say, 'Quick reply'));
  });

  // ---------- Data panels ----------

  const invBody = byId('inv-body');
  const ordersBody = byId('orders-body');
  let invFlashTimer = 0;
  let orderFlashTimer = 0;

  const delta = (text) => (text ? h('span', { class: 'delta', text }) : null);
  const badge = (lvl) => h('span', { class: 'badge', 'data-level': lvl, text: LEVEL_TEXT[lvl] });

  function unflash(body) {
    body.querySelectorAll('.flash').forEach((tr) => tr.classList.remove('flash'));
    body.querySelectorAll('.delta').forEach((d) => d.remove());
  }

  function renderInventory(flash) {
    invBody.replaceChildren(...state.items.map((r) => {
      const f = flash && flash.sku === r.sku ? flash : {};
      return h('tr', { class: f.sku ? 'flash' : null },
        h('td', { class: 'mono', text: r.sku }),
        h('th', { scope: 'row', text: r.name }),
        h('td', { text: isService(r) ? 'Service' : 'Product' }),
        h('td', { class: 'num', text: money(r.price) }),
        h('td', { class: 'num' }, delta(f.stock), String(r.stock)),
        h('td', { class: 'num', text: String(r.reorder) }),
        h('td', { class: 'num' }, delta(f.sold), String(r.sold)),
        h('td', { class: 'num' }, delta(f.waitlist), r.waitlist ? String(r.waitlist) : '–'),
        h('td', {}, badge(level(r))));
    }));
    window.clearTimeout(invFlashTimer);
    if (flash) invFlashTimer = window.setTimeout(() => unflash(invBody), 2800);
  }

  const ORDER_STATUS = {
    pending: ['pending', 'Pending'],
    declined: ['declined', 'Declined, still open'],
    paid: ['paid', 'Paid'],
    refund: ['refund', 'Refund needed'],
  };

  function renderOrders(changed) {
    if (!state.orders.length) {
      ordersBody.replaceChildren(h('tr', {}, h('td', { colspan: 5, class: 'empty-cell', text: 'No orders yet.' })));
      return;
    }
    ordersBody.replaceChildren(...[...state.orders].reverse().map((o) => {
      const key = o.status === 'pending' && o.declines ? 'declined' : o.status;
      const [cls, label] = ORDER_STATUS[key];
      return h('tr', { class: o.no === changed ? 'flash' : null },
        h('th', { scope: 'row', class: 'mono', text: o.no }),
        h('td', { text: o.name }),
        h('td', { class: 'num', text: String(o.qty) }),
        h('td', { class: 'num', text: money(o.total) }),
        h('td', {}, h('span', { class: 'badge', 'data-status': cls, text: label })));
    }));
    window.clearTimeout(orderFlashTimer);
    if (changed) orderFlashTimer = window.setTimeout(() => unflash(ordersBody), 2800);
  }

  function renderExecutions() {
    const list = byId('exec-list');
    list.replaceChildren(...state.executions.map((x) => h('li', { class: 'exec', 'data-status': x.status },
      h('div', { class: 'exec-top' },
        h('span', { class: 'exec-n', text: `#${x.n}` }),
        h('span', { class: 'exec-trigger', text: `${x.trigger} · ${x.source}` }),
        h('span', { class: 'exec-status', text: x.status === 'running' ? 'Running' : 'Success' })),
      h('p', { class: 'exec-path', text: x.crumbs.join(' → ') }),
      h('p', { class: 'exec-result' }, h('span', { text: x.result }), h('time', { text: x.time })))));
    byId('exec-empty').hidden = state.executions.length > 0;
  }

  function renderAlerts() {
    state.alerts.length = Math.min(state.alerts.length, MAX_ALERTS);
    byId('alert-list').replaceChildren(...state.alerts.map((a) => h('li', { class: 'alert', 'data-kind': a.kind },
      h('p', { class: 'alert-top' }, h('strong', { text: a.kind }), h('time', { text: a.time })),
      h('p', { text: a.text }),
      a.transcript ? h('details', {},
        h('summary', { text: `Chat so far (${a.transcript.length} ${a.transcript.length === 1 ? 'message' : 'messages'})` }),
        h('ol', { class: 'transcript' }, a.transcript.map((line) => h('li', { text: line })))) : null)));
    byId('alert-empty').hidden = state.alerts.length > 0;
  }

  const status = byId('flow-status');
  function announce(text) {
    status.textContent = text;
  }

  // ---------- Step guide ----------
  // A pinned bar above the preview that walks the visitor through one full path. Progress is worked out from
  // the demo's own data after each finished run, never stored by the guide, so Reset and out-of-order clicks stay right.

  const guideBar = byId('guide');
  const guideList = byId('guide-steps');
  const guideCount = byId('guide-count');
  const guideTip = byId('guide-tip');
  const guideLive = byId('guide-live');
  const invPanel = document.querySelector('.panel-inventory');
  const ENABLED = ':not([aria-disabled="true"])';
  const lastOf = (sel) => [...document.querySelectorAll(sel)].pop() || null;
  const latestPaid = () => [...state.orders].reverse().find((o) => o.status === 'paid');

  // The inventory row of the latest paid order, or the table itself before anything is paid.
  function changedRow() {
    const o = latestPaid();
    return o ? invBody.rows[state.items.findIndex((r) => r.sku === o.sku)] : invPanel.querySelector('.table-wrap');
  }

  const GUIDE = [
    {
      label: 'Ask what is in stock',
      tip: 'Press "What\'s in stock?" in the chat, or ask about an item.',
      done: () => Boolean(lastRun.find), // a finished run went through "Find matching items"
      target: () => document.querySelector('.chip[data-say="What\'s in stock?"]'),
    },
    {
      label: 'Buy or book an item',
      tip: 'Press Buy or Book on an item in the chat, or type "Order 3 skillets".',
      done: () => state.orders.length > 0,
      target: () => lastOf(`.chat-log .pcard-buy .btn-primary${ENABLED}, .chat-log .msg-actions .btn-primary${ENABLED}`) || chatText,
    },
    {
      label: 'Pay (simulated)',
      tip: 'Press the Pay button in the chat. The card is simulated, nothing is charged.',
      done: () => Boolean(latestPaid()),
      target: () => lastOf(`.chat-log .paycard-actions .btn-primary${ENABLED}`) || chatText,
    },
    {
      label: 'See the stock go down',
      tip: 'Find the paid item in the inventory table below: its stock went down and Sold went up.',
      done: () => state.stockSeen,
      target: changedRow,
    },
  ];

  let guideDone = 0; // number of steps done
  let viewing = null; // a step the visitor picked to read about; null follows the current step
  let invVisible = false;

  const guideItems = GUIDE.map((step, i) => {
    const num = h('span', { class: 'guide-num', 'aria-hidden': 'true' });
    const doneText = h('span', { class: 'sr-only' });
    const btn = h('button', { type: 'button', class: 'guide-btn', 'aria-controls': 'guide-now' },
      num, h('span', { class: 'guide-label', text: step.label }), doneText);
    btn.addEventListener('click', () => {
      viewing = i === guideDone ? null : i;
      renderGuide();
      guideSay(`Step ${i + 1}: ${step.label}. ${guideTip.textContent}`);
    });
    const li = h('li', { class: 'guide-step' }, btn);
    guideList.append(li);
    return { li, btn, num, doneText };
  });

  // Cleared first so picking the same step twice is read out again.
  let announceTimer = 0;
  function guideSay(msg) {
    guideLive.textContent = '';
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(() => { guideLive.textContent = msg; }, 60);
  }

  function renderGuide() {
    const n = GUIDE.length;
    const v = viewing ?? guideDone;
    guideItems.forEach(({ li, btn, num, doneText }, i) => {
      const done = i < guideDone;
      li.dataset.state = done ? 'done' : i === guideDone ? 'current' : 'upcoming';
      li.toggleAttribute('data-viewing', i === viewing);
      if (i === guideDone) btn.setAttribute('aria-current', 'step');
      else btn.removeAttribute('aria-current');
      num.replaceChildren(done ? icon('check', 'guide-check') : String(i + 1));
      doneText.textContent = done ? ' (done)' : '';
    });
    if (v === n) {
      guideCount.textContent = `All ${n} steps done.`;
      guideTip.textContent = 'Reset the demo to try another path, such as a declined card or a waitlist.';
    } else {
      guideCount.textContent = `Step ${v + 1} of ${n}${v < guideDone ? ', done' : ''}: ${GUIDE[v].label}.`;
      guideTip.textContent = GUIDE[v].tip;
    }
  }

  function guideUpdate() {
    // A run changes the data when it starts and shows the changes step by step, so wait until it has finished.
    if (current) return;
    if (invVisible && latestPaid()) state.stockSeen = true;
    // Steps count in order: a later step met first counts the earlier ones as done too.
    const done = GUIDE.map((s) => s.done()).lastIndexOf(true) + 1;
    if (done !== guideDone) {
      const n = GUIDE.length;
      // One message naming every step this update finished, such as "Steps 3 and 4 done."
      if (done > guideDone) {
        const from = guideDone + 1;
        const nums = done === from ? `Step ${done}` : `Steps ${Array.from({ length: done - from }, (_, k) => from + k).join(', ')} and ${done}`;
        guideSay(`${nums} done. ${done === n ? 'All steps are done. Reset the demo to try another path.' : `Next: ${GUIDE[done].label}.`}`);
      }
      guideDone = done;
      viewing = null;
    }
    renderGuide();
  }

  // Step 4 needs the inventory table on screen after a payment.
  new IntersectionObserver((entries) => {
    invVisible = entries[entries.length - 1].intersectionRatio >= 0.5;
    if (invVisible) guideUpdate();
  }, { threshold: 0.5 }).observe(invPanel);

  // In-page links land below the pinned bar too.
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--guide-h', `${guideBar.offsetHeight}px`);
  }).observe(guideBar);

  let lit = null;
  let litTimer = 0;

  function showMe() {
    const v = viewing ?? guideDone;
    const el = v === GUIDE.length ? byId('reset') : GUIDE[v].target();
    if (!el) return;
    // Scroll inner boxes (the chat log, a wide table) first and at once, so the page scroll lands on the final spot.
    for (let box = el.parentElement; box && box !== document.body; box = box.parentElement) {
      const cs = getComputedStyle(box);
      const a = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      if (/auto|scroll/.test(cs.overflowY) && box.scrollHeight > box.clientHeight) {
        box.scrollTop += a.top - b.top - Math.max(0, (box.clientHeight - a.height) / 2);
      }
      if (/auto|scroll/.test(cs.overflowX) && box.scrollWidth > box.clientWidth) {
        box.scrollLeft += a.left - b.left - Math.max(0, (box.clientWidth - a.width) / 2);
      }
    }
    // Centre the target in the space below the pinned bar.
    const r = el.getBoundingClientRect();
    const bar = guideBar.offsetHeight;
    const room = window.innerHeight - bar;
    const top = r.top + window.scrollY - bar - Math.max(16, (room - r.height) / 2);
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    // A table row can't take focus, so its scrolling table does.
    const focusable = el.matches('a[href], button, input, select, textarea, [tabindex]') ? el : el.closest('[tabindex]');
    if (focusable) focusable.focus({ preventScroll: true });
    if (lit) lit.classList.remove('guide-hl');
    lit = el;
    el.classList.add('guide-hl');
    window.clearTimeout(litTimer);
    litTimer = window.setTimeout(() => el.classList.remove('guide-hl'), 1600);
  }

  byId('guide-show').addEventListener('click', showMe);

  // ---------- Reset ----------

  function reset() {
    generation += 1;
    queue.length = 0;
    current = null;
    lastExec = null;
    Object.keys(lastRun).forEach((k) => delete lastRun[k]);
    Object.keys(payButtons).forEach((k) => delete payButtons[k]);
    closeInspector(false);
    state = freshState();
    typingEl = null;
    chatLog.replaceChildren();
    greet();
    chatText.value = '';
    chatError.hidden = true;
    chatText.setAttribute('aria-invalid', 'false');
    resetCanvas();
    scroller.scrollLeft = 0;
    watching = false;
    trailSteps.replaceChildren();
    trailIdle();
    renderInventory();
    renderOrders();
    renderExecutions();
    renderAlerts();
    updateRunChip();
    announce('');
    guideUpdate();
  }

  byId('reset').addEventListener('click', reset);

  buildCanvas();
  reset();
})();
