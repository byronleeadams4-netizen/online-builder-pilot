import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Db } from './db.ts';
import { isAdminPhone } from './config.ts';
import { normalizePhone } from './pricing.ts';

const PAYOUT_DELAY_DAYS = 2;

type OrderRow = {
  id: number; status: string; address: string; notes: string | null; subtotal_cents: number; delivery_fee_cents: number;
  total_cents: number; store_cost_cents: number; created_at: string; paid_at: string | null; delivered_at: string | null;
  store_paid_at: string | null; customer_phone: string; driver_id: number | null; driver_name: string | null;
};

// Where an admin can move an order from, and to. Refunds for cancelled paid orders are done by hand in Paystack.
const TRANSITIONS: Record<string, string[]> = {
  pending_payment: ['cancelled'],
  paid: ['cancelled'],
  assigned: ['collected', 'cancelled'],
  collected: ['delivered'],
};

export function requireAdmin(db: Db) {
  return (req: Request, res: Response, next: NextFunction) => {
    const row = db.prepare('SELECT phone FROM users WHERE id = ?').get((req as Request & { userId: number }).userId) as { phone: string } | undefined;
    if (!row || !isAdminPhone(row.phone)) return void res.status(403).json({ error: 'Admins only.' });
    next();
  };
}

export function adminRouter(db: Db) {
  const r = Router();

  const orderSelect = `
    SELECT o.*, u.phone AS customer_phone, d.name AS driver_name
    FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN drivers d ON d.id = o.driver_id`;

  function shape(o: OrderRow) {
    const items = db.prepare('SELECT name, qty, unit_price_cents FROM order_items WHERE order_id = ?').all(o.id) as
      { name: string; qty: number; unit_price_cents: number }[];
    return {
      id: o.id, status: o.status, address: o.address, notes: o.notes, customerPhone: o.customer_phone,
      createdAt: o.created_at, paidAt: o.paid_at, deliveredAt: o.delivered_at,
      subtotalCents: o.subtotal_cents, deliveryFeeCents: o.delivery_fee_cents, totalCents: o.total_cents,
      storeCostCents: o.store_cost_cents, markupCents: o.subtotal_cents - o.store_cost_cents,
      driver: o.driver_id ? { id: o.driver_id, name: o.driver_name } : null,
      items: items.map((i) => ({ name: i.name, qty: i.qty, unitPriceCents: i.unit_price_cents })),
    };
  }

  // ---------- orders ----------
  r.get('/orders', (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : null;
    const rows = (status
      ? db.prepare(`${orderSelect} WHERE o.status = ? ORDER BY o.id DESC LIMIT 200`).all(status)
      : db.prepare(`${orderSelect} ORDER BY o.id DESC LIMIT 200`).all()) as OrderRow[];
    res.json(rows.map(shape));
  });

  const getOrder = (id: number) => db.prepare(`${orderSelect} WHERE o.id = ?`).get(id) as OrderRow | undefined;

  r.post('/orders/:id/assign', (req, res) => {
    const id = Number(req.params.id);
    const driverId = Number(req.body?.driverId);
    const order = Number.isInteger(id) ? getOrder(id) : undefined;
    if (!order) return void res.status(404).json({ error: 'Order not found.' });
    if (order.status !== 'paid' && order.status !== 'assigned') {
      return void res.status(409).json({ error: 'Only paid orders that have not been collected can be assigned.' });
    }
    const driver = db.prepare('SELECT id, verified, active FROM drivers WHERE id = ?').get(driverId) as
      { id: number; verified: number; active: number } | undefined;
    if (!driver) return void res.status(400).json({ error: 'Choose a driver.' });
    if (!driver.verified || !driver.active) return void res.status(409).json({ error: 'That driver is not verified and active.' });
    db.prepare("UPDATE orders SET driver_id = ?, status = 'assigned' WHERE id = ?").run(driverId, id);
    res.json(shape(getOrder(id)!));
  });

  r.post('/orders/:id/status', (req, res) => {
    const id = Number(req.params.id);
    const next = String(req.body?.status ?? '');
    const order = Number.isInteger(id) ? getOrder(id) : undefined;
    if (!order) return void res.status(404).json({ error: 'Order not found.' });
    if (!(TRANSITIONS[order.status] ?? []).includes(next)) {
      return void res.status(409).json({ error: `Can't move an order from ${order.status} to ${next}.` });
    }
    db.prepare(`UPDATE orders SET status = ?, delivered_at = CASE WHEN ? = 'delivered' THEN datetime('now') ELSE delivered_at END WHERE id = ?`).run(next, next, id);
    res.json(shape(getOrder(id)!));
  });

  // ---------- drivers ----------
  const driverShape = (d: { id: number; name: string; phone: string; vehicle: string; verified: number; active: number }) =>
    ({ id: d.id, name: d.name, phone: d.phone, vehicle: d.vehicle, verified: !!d.verified, active: !!d.active });

  r.get('/drivers', (_req, res) => {
    res.json((db.prepare('SELECT * FROM drivers ORDER BY name').all() as Parameters<typeof driverShape>[0][]).map(driverShape));
  });

  r.post('/drivers', (req, res) => {
    const name = String(req.body?.name ?? '').trim();
    const phone = normalizePhone(String(req.body?.phone ?? ''));
    const vehicle = String(req.body?.vehicle ?? '').trim();
    if (!name || name.length > 80) return void res.status(400).json({ error: 'Enter the driver\'s name.' });
    if (!phone) return void res.status(400).json({ error: 'Enter a valid South African mobile number.' });
    if (!['bike', 'car', 'bakkie', 'truck'].includes(vehicle)) return void res.status(400).json({ error: 'Choose bike, car, bakkie or truck.' });
    try {
      const out = db.prepare('INSERT INTO drivers (name, phone, vehicle) VALUES (?, ?, ?)').run(name, phone, vehicle);
      res.status(201).json(driverShape(db.prepare('SELECT * FROM drivers WHERE id = ?').get(Number(out.lastInsertRowid)) as Parameters<typeof driverShape>[0]));
    } catch {
      res.status(409).json({ error: 'A driver with that number already exists.' });
    }
  });

  // "verified" means ID, licence and vehicle details were checked (Pilot Checklist, section 5).
  r.patch('/drivers/:id', (req, res) => {
    const id = Number(req.params.id);
    const d = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id) as Parameters<typeof driverShape>[0] | undefined;
    if (!d) return void res.status(404).json({ error: 'Driver not found.' });
    const verified = typeof req.body?.verified === 'boolean' ? Number(req.body.verified) : d.verified;
    const active = typeof req.body?.active === 'boolean' ? Number(req.body.active) : d.active;
    db.prepare('UPDATE drivers SET verified = ?, active = ? WHERE id = ?').run(verified, active, id);
    res.json(driverShape({ ...d, verified, active }));
  });

  // ---------- price list ----------
  const productShape = (p: { id: number; name: string; unit: string; category: string; shelf_price_cents: number; in_stock: number }) =>
    ({ id: p.id, name: p.name, unit: p.unit, category: p.category, shelfPriceCents: p.shelf_price_cents, inStock: !!p.in_stock });

  r.get('/products', (_req, res) => {
    res.json((db.prepare('SELECT * FROM products ORDER BY category, name').all() as Parameters<typeof productShape>[0][]).map(productShape));
  });

  r.post('/products', (req, res) => {
    const name = String(req.body?.name ?? '').trim();
    const unit = String(req.body?.unit ?? '').trim();
    const category = String(req.body?.category ?? '').trim();
    const price = Number(req.body?.shelfPriceCents);
    if (!name || !unit || !category || name.length > 120) return void res.status(400).json({ error: 'Name, unit and category are required.' });
    if (!Number.isInteger(price) || price < 1 || price > 100_000_000) return void res.status(400).json({ error: 'Enter a valid shelf price.' });
    const out = db.prepare('INSERT INTO products (name, unit, category, shelf_price_cents) VALUES (?, ?, ?, ?)').run(name, unit, category, price);
    res.status(201).json(productShape(db.prepare('SELECT * FROM products WHERE id = ?').get(Number(out.lastInsertRowid)) as Parameters<typeof productShape>[0]));
  });

  r.patch('/products/:id', (req, res) => {
    const id = Number(req.params.id);
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Parameters<typeof productShape>[0] | undefined;
    if (!p) return void res.status(404).json({ error: 'Item not found.' });
    let price = p.shelf_price_cents;
    if (req.body?.shelfPriceCents !== undefined) {
      price = Number(req.body.shelfPriceCents);
      if (!Number.isInteger(price) || price < 1 || price > 100_000_000) return void res.status(400).json({ error: 'Enter a valid shelf price.' });
    }
    const inStock = typeof req.body?.inStock === 'boolean' ? Number(req.body.inStock) : p.in_stock;
    db.prepare('UPDATE products SET shelf_price_cents = ?, in_stock = ? WHERE id = ?').run(price, inStock, id);
    res.json(productShape({ ...p, shelf_price_cents: price, in_stock: inStock }));
  });

  // ---------- store payouts ----------
  // The store is paid its shelf price PAYOUT_DELAY_DAYS after the order was paid, once the order is delivered.
  r.get('/payouts', (_req, res) => {
    const rows = db.prepare(
      `SELECT id, store_cost_cents, paid_at, store_paid_at, datetime(paid_at, '+${PAYOUT_DELAY_DAYS} days') AS due_at,
              datetime(paid_at, '+${PAYOUT_DELAY_DAYS} days') <= datetime('now') AS is_due
       FROM orders WHERE status = 'delivered' ORDER BY paid_at`,
    ).all() as { id: number; store_cost_cents: number; paid_at: string; store_paid_at: string | null; due_at: string; is_due: number }[];
    const payouts = rows.map((p) => ({
      orderId: p.id, amountCents: p.store_cost_cents, dueAt: p.due_at, due: !!p.is_due, paidAt: p.store_paid_at,
    }));
    const owing = payouts.filter((p) => !p.paidAt);
    res.json({
      payouts,
      dueNowCents: owing.filter((p) => p.due).reduce((s, p) => s + p.amountCents, 0),
      upcomingCents: owing.filter((p) => !p.due).reduce((s, p) => s + p.amountCents, 0),
    });
  });

  r.post('/payouts/:orderId/mark-paid', (req, res) => {
    const id = Number(req.params.orderId);
    const out = db.prepare("UPDATE orders SET store_paid_at = datetime('now') WHERE id = ? AND status = 'delivered' AND store_paid_at IS NULL").run(id);
    if (Number(out.changes) !== 1) return void res.status(409).json({ error: 'That order is not awaiting a store payout.' });
    res.json({ ok: true });
  });

  return r;
}
