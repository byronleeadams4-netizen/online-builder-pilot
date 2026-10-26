import crypto from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import type { Db } from './db.ts';
import { config, mockPaymentsEnabled } from './config.ts';
import { customerPriceCents, normalizePhone } from './pricing.ts';
import { initializeTransaction, validWebhookSignature, verifyTransaction } from './paystack.ts';

const OTP_TTL_MS = 5 * 60_000;
const OTP_RESEND_MS = 60_000;
const OTP_MAX_ATTEMPTS = 5;
const SESSION_TTL_MS = 30 * 24 * 3600_000;
const MAX_QTY = 500;

type AuthedRequest = Request & { userId: number };
type OrderRow = {
  id: number; status: string; address: string; notes: string | null; subtotal_cents: number;
  delivery_fee_cents: number; total_cents: number; payment_ref: string; created_at: string; paid_at: string | null;
};

export function createApp(db: Db) {
  const app = express();

  // Paystack signs the raw body, so the webhook must be registered before express.json().
  app.post('/api/paystack/webhook', express.raw({ type: '*/*' }), (req, res) => {
    const raw = req.body as Buffer;
    if (!validWebhookSignature(raw, req.header('x-paystack-signature'))) return void res.sendStatus(401);
    const event = JSON.parse(raw.toString('utf8')) as { event: string; data: { reference: string; amount: number; currency: string } };
    if (event.event === 'charge.success') {
      const order = db.prepare('SELECT total_cents FROM orders WHERE payment_ref = ?').get(event.data.reference) as
        | { total_cents: number } | undefined;
      if (order && event.data.currency === 'ZAR' && event.data.amount >= order.total_cents) markPaid(event.data.reference);
    }
    res.sendStatus(200);
  });

  app.use(express.json({ limit: '50kb' }));

  function markPaid(ref: string) {
    db.prepare(
      "UPDATE orders SET status = 'paid', paid_at = datetime('now') WHERE payment_ref = ? AND status = 'pending_payment'",
    ).run(ref);
  }

  // ---------- auth ----------
  app.post('/api/auth/request-otp', (req, res) => {
    const phone = normalizePhone(String(req.body?.phone ?? ''));
    if (!phone) return void res.status(400).json({ error: 'Enter a valid South African mobile number.' });

    const existing = db.prepare('SELECT expires_at FROM otps WHERE phone = ?').get(phone) as { expires_at: number } | undefined;
    if (existing && existing.expires_at - OTP_TTL_MS + OTP_RESEND_MS > Date.now()) {
      return void res.status(429).json({ error: 'Please wait a minute before asking for another code.' });
    }
    if (config.isProd) {
      // No SMS provider is wired up yet; refuse rather than silently pretend a code was sent.
      return void res.status(501).json({ error: 'SMS delivery is not configured.' });
    }
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    db.prepare(
      'INSERT INTO otps (phone, code, expires_at, attempts) VALUES (?, ?, ?, 0) ' +
        'ON CONFLICT(phone) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at, attempts = 0',
    ).run(phone, code, Date.now() + OTP_TTL_MS);
    console.log(`[dev] OTP for ${phone}: ${code}`);
    res.json({ ok: true, devCode: code });
  });

  app.post('/api/auth/verify-otp', (req, res) => {
    const phone = normalizePhone(String(req.body?.phone ?? ''));
    const code = String(req.body?.code ?? '');
    if (!phone) return void res.status(400).json({ error: 'Invalid phone number.' });
    const otp = db.prepare('SELECT code, expires_at, attempts FROM otps WHERE phone = ?').get(phone) as
      | { code: string; expires_at: number; attempts: number } | undefined;
    if (!otp || otp.expires_at < Date.now() || otp.attempts >= OTP_MAX_ATTEMPTS) {
      return void res.status(400).json({ error: 'That code has expired. Request a new one.' });
    }
    const a = Buffer.from(otp.code);
    const b = Buffer.from(code);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE phone = ?').run(phone);
      return void res.status(400).json({ error: 'Incorrect code.' });
    }
    db.prepare('DELETE FROM otps WHERE phone = ?').run(phone);
    db.prepare('INSERT OR IGNORE INTO users (phone) VALUES (?)').run(phone);
    const user = db.prepare('SELECT id, phone, name FROM users WHERE phone = ?').get(phone) as { id: number; phone: string; name: string | null };
    const token = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, Date.now() + SESSION_TTL_MS);
    res.json({ token, user });
  });

  function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = (req.header('authorization') ?? '').replace(/^Bearer /, '');
    const row = token
      ? (db.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?').get(token, Date.now()) as { user_id: number } | undefined)
      : undefined;
    if (!row) return void res.status(401).json({ error: 'Please log in.' });
    (req as AuthedRequest).userId = row.user_id;
    next();
  }

  app.get('/api/me', requireAuth, (req, res) => {
    res.json(db.prepare('SELECT id, phone, name FROM users WHERE id = ?').get((req as AuthedRequest).userId));
  });

  // ---------- catalogue ----------
  app.get('/api/products', (_req, res) => {
    const rows = db.prepare('SELECT id, name, unit, category, shelf_price_cents, in_stock FROM products ORDER BY category, name').all() as
      { id: number; name: string; unit: string; category: string; shelf_price_cents: number; in_stock: number }[];
    res.json({
      deliveryFeeCents: config.deliveryFeeCents,
      products: rows.map((p) => ({
        id: p.id, name: p.name, unit: p.unit, category: p.category,
        priceCents: customerPriceCents(p.shelf_price_cents), inStock: !!p.in_stock,
      })),
    });
  });

  // ---------- orders ----------
  app.post('/api/orders', requireAuth, async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const address = String(req.body?.address ?? '').trim();
    const notes = String(req.body?.notes ?? '').trim().slice(0, 500) || null;
    const lines = req.body?.items;
    if (address.length < 10 || address.length > 300) return void res.status(400).json({ error: 'Enter the full delivery address.' });
    if (!Array.isArray(lines) || lines.length === 0 || lines.length > 50) return void res.status(400).json({ error: 'Your cart is empty.' });

    const priced: { id: number; name: string; qty: number; unit: number; shelf: number }[] = [];
    for (const l of lines) {
      const id = Number(l?.id);
      const qty = Number(l?.qty);
      if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
        return void res.status(400).json({ error: 'Invalid item in cart.' });
      }
      const p = db.prepare('SELECT id, name, shelf_price_cents, in_stock FROM products WHERE id = ?').get(id) as
        | { id: number; name: string; shelf_price_cents: number; in_stock: number } | undefined;
      if (!p) return void res.status(400).json({ error: 'An item in your cart no longer exists.' });
      if (!p.in_stock) return void res.status(409).json({ error: `${p.name} is out of stock.` });
      priced.push({ id: p.id, name: p.name, qty, unit: customerPriceCents(p.shelf_price_cents), shelf: p.shelf_price_cents });
    }
    if (new Set(priced.map((p) => p.id)).size !== priced.length) return void res.status(400).json({ error: 'Duplicate items in cart.' });

    const subtotal = priced.reduce((s, p) => s + p.unit * p.qty, 0);
    const storeCost = priced.reduce((s, p) => s + p.shelf * p.qty, 0);
    const total = subtotal + config.deliveryFeeCents;
    const ref = `OB-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();

    db.exec('BEGIN');
    let orderId: number;
    try {
      const r = db.prepare(
        'INSERT INTO orders (user_id, address, notes, subtotal_cents, delivery_fee_cents, total_cents, store_cost_cents, payment_ref) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(userId, address, notes, subtotal, config.deliveryFeeCents, total, storeCost, ref);
      orderId = Number(r.lastInsertRowid);
      const ins = db.prepare('INSERT INTO order_items (order_id, product_id, name, qty, unit_price_cents, shelf_price_cents) VALUES (?, ?, ?, ?, ?, ?)');
      for (const p of priced) ins.run(orderId, p.id, p.name, p.qty, p.unit, p.shelf);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    try {
      if (mockPaymentsEnabled) {
        return void res.status(201).json({ orderId, paymentUrl: `${config.appUrl}/?mockPay=${ref}&order=${orderId}` });
      }
      const phone = (db.prepare('SELECT phone FROM users WHERE id = ?').get(userId) as { phone: string }).phone;
      const { authorizationUrl } = await initializeTransaction({
        email: `${phone.replace('+', '')}@customers.onlinebuilder.io`,
        amountCents: total,
        reference: ref,
        callbackUrl: `${config.appUrl}/?order=${orderId}`,
      });
      res.status(201).json({ orderId, paymentUrl: authorizationUrl });
    } catch (e) {
      console.error(e);
      db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(orderId);
      res.status(502).json({ error: 'Could not start payment. Please try again.' });
    }
  });

  function loadOrder(userId: number, id: number) {
    const o = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, userId) as OrderRow | undefined;
    if (!o) return undefined;
    const items = db.prepare('SELECT name, qty, unit_price_cents FROM order_items WHERE order_id = ?').all(id) as
      { name: string; qty: number; unit_price_cents: number }[];
    return {
      id: o.id, status: o.status, address: o.address, notes: o.notes, subtotalCents: o.subtotal_cents,
      deliveryFeeCents: o.delivery_fee_cents, totalCents: o.total_cents, createdAt: o.created_at, paidAt: o.paid_at,
      items: items.map((i) => ({ name: i.name, qty: i.qty, unitPriceCents: i.unit_price_cents })),
    };
  }

  app.get('/api/orders', requireAuth, (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const ids = db.prepare('SELECT id FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(userId) as { id: number }[];
    res.json(ids.map((r) => loadOrder(userId, r.id)));
  });

  app.get('/api/orders/:id', requireAuth, async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const id = Number(req.params.id);
    let order = Number.isInteger(id) ? loadOrder(userId, id) : undefined;
    if (!order) return void res.status(404).json({ error: 'Order not found.' });
    if (order.status === 'pending_payment' && config.paystackSecret) {
      // Covers a missed webhook: ask Paystack directly when the customer comes back.
      const ref = (db.prepare('SELECT payment_ref FROM orders WHERE id = ?').get(id) as { payment_ref: string }).payment_ref;
      if (await verifyTransaction(ref, order.totalCents).catch(() => false)) {
        markPaid(ref);
        order = loadOrder(userId, id)!;
      }
    }
    res.json(order);
  });

  // Test checkout, only when no Paystack key is set and not in production.
  app.post('/api/dev/mock-pay/:ref', requireAuth, (req, res) => {
    if (!mockPaymentsEnabled) return void res.sendStatus(404);
    const r = db.prepare(
      "UPDATE orders SET status = 'paid', paid_at = datetime('now') WHERE payment_ref = ? AND user_id = ? AND status = 'pending_payment'",
    ).run(req.params.ref, (req as AuthedRequest).userId);
    res.json({ ok: Number(r.changes) === 1 });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  });

  return app;
}
