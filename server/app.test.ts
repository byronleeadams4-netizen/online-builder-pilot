import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { createApp } from './app.ts';
import { openDb } from './db.ts';
import { customerPriceCents, normalizePhone } from './pricing.ts';
import { seedProducts } from './seed.ts';

process.env.ADMIN_PHONES = '+27820000001';

let base = '';
let close: () => void;
const db = openDb(':memory:');

before(() => {
  seedProducts(db);
  const server = createApp(db).listen(0);
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
  close = () => server.close();
});
after(() => close());

const call = (path: string, opts: { method?: string; body?: unknown; token?: string } = {}) =>
  fetch(base + path, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

async function login(phone = '082 123 4567') {
  const otp = await (await call('/api/auth/request-otp', { body: { phone } })).json();
  const v = await (await call('/api/auth/verify-otp', { body: { phone, code: otp.devCode } })).json();
  return v.token as string;
}

describe('pricing', () => {
  it('applies markup and rounds to cents', () => {
    assert.equal(customerPriceCents(11500, 10), 12650);
    assert.equal(customerPriceCents(333, 10), 366);
  });
  it('normalises SA mobile numbers', () => {
    assert.equal(normalizePhone('082 123 4567'), '+27821234567');
    assert.equal(normalizePhone('+27821234567'), '+27821234567');
    assert.equal(normalizePhone('021 555 1234'), null);
  });
});

describe('auth', () => {
  it('rejects a wrong code and accepts the right one', async () => {
    const phone = '0831112222';
    const otp = await (await call('/api/auth/request-otp', { body: { phone } })).json();
    const bad = await call('/api/auth/verify-otp', { body: { phone, code: otp.devCode === '000000' ? '111111' : '000000' } });
    assert.equal(bad.status, 400);
    const ok = await call('/api/auth/verify-otp', { body: { phone, code: otp.devCode } });
    assert.equal(ok.status, 200);
  });
  it('throttles repeat code requests', async () => {
    await call('/api/auth/request-otp', { body: { phone: '0844445555' } });
    const again = await call('/api/auth/request-otp', { body: { phone: '0844445555' } });
    assert.equal(again.status, 429);
  });
  it('requires a session for orders', async () => {
    assert.equal((await call('/api/orders')).status, 401);
  });
});

describe('orders', () => {
  it('prices on the server, ignoring any client-sent price', async () => {
    const token = await login();
    const { products } = await (await call('/api/products')).json();
    const res = await call('/api/orders', {
      token,
      body: { address: '12 Main Road, Athlone, Cape Town', items: [{ id: products[0].id, qty: 2, priceCents: 1 }] },
    });
    assert.equal(res.status, 201);
    const { orderId, paymentUrl } = await res.json();
    assert.match(paymentUrl, /mockPay=/);
    const order = await (await call(`/api/orders/${orderId}`, { token })).json();
    assert.equal(order.subtotalCents, products[0].priceCents * 2);
    assert.equal(order.totalCents, order.subtotalCents + order.deliveryFeeCents);
    assert.equal(order.status, 'pending_payment');
  });

  it('marks an order paid via the test checkout, once', async () => {
    const token = await login('0829998888');
    const { products } = await (await call('/api/products')).json();
    const { orderId, paymentUrl } = await (
      await call('/api/orders', { token, body: { address: '1 Test Street, Wetton, Cape Town', items: [{ id: products[1].id, qty: 1 }] } })
    ).json();
    const ref = new URL(paymentUrl).searchParams.get('mockPay')!;
    assert.equal((await (await call(`/api/dev/mock-pay/${ref}`, { method: 'POST', token })).json()).ok, true);
    assert.equal((await (await call(`/api/dev/mock-pay/${ref}`, { method: 'POST', token })).json()).ok, false);
    assert.equal((await (await call(`/api/orders/${orderId}`, { token })).json()).status, 'paid');
  });

  it('hides other customers\' orders', async () => {
    const a = await login('0821110000');
    const b = await login('0822220000');
    const { products } = await (await call('/api/products')).json();
    const { orderId } = await (await call('/api/orders', { token: a, body: { address: '5 Some Road, Ottery, Cape Town', items: [{ id: products[0].id, qty: 1 }] } })).json();
    assert.equal((await call(`/api/orders/${orderId}`, { token: b })).status, 404);
  });

  it('rejects empty carts, bad quantities and short addresses', async () => {
    const token = await login('0827776666');
    const { products } = await (await call('/api/products')).json();
    const addr = '9 Long Street, Cape Town';
    assert.equal((await call('/api/orders', { token, body: { address: addr, items: [] } })).status, 400);
    assert.equal((await call('/api/orders', { token, body: { address: addr, items: [{ id: products[0].id, qty: 0 }] } })).status, 400);
    assert.equal((await call('/api/orders', { token, body: { address: 'x', items: [{ id: products[0].id, qty: 1 }] } })).status, 400);
  });

  it('rejects webhooks with a bad signature', async () => {
    const res = await fetch(`${base}/api/paystack/webhook`, { method: 'POST', body: '{}', headers: { 'x-paystack-signature': 'nope' } });
    assert.equal(res.status, 401);
  });
});

describe('admin', () => {
  const adm = (path: string, token: string, body?: unknown, method?: string) => call(`/api/admin${path}`, { token, body, method });

  async function paidOrder(customerPhone: string) {
    const token = await login(customerPhone);
    const { products } = await (await call('/api/products')).json();
    const { orderId, paymentUrl } = await (
      await call('/api/orders', { token, body: { address: '7 Admin Test Road, Lansdowne, Cape Town', items: [{ id: products[0].id, qty: 2 }] } })
    ).json();
    await call(`/api/dev/mock-pay/${new URL(paymentUrl).searchParams.get('mockPay')}`, { method: 'POST', token });
    return { orderId: orderId as number, customerToken: token, productId: products[0].id as number };
  }

  it('keeps customers out and lets listed admins in', async () => {
    const customer = await login('0829990001');
    assert.equal((await adm('/orders', customer)).status, 403);
    assert.equal((await call('/api/admin/orders')).status, 401);
    const admin = await login('0820000001');
    assert.equal((await adm('/orders', admin)).status, 200);
    assert.equal((await (await call('/api/me', { token: admin })).json()).isAdmin, true);
    assert.equal((await (await call('/api/me', { token: customer })).json()).isAdmin, false);
  });

  it('runs an order from paid to delivered and then pays the store once', async () => {
    const admin = await login('0820000001');
    const { orderId, customerToken } = await paidOrder('0829990002');

    const driver = await (await adm('/drivers', admin, { name: 'Sipho', phone: '0731234567', vehicle: 'bakkie' })).json();
    // Unverified drivers can't take jobs.
    assert.equal((await adm(`/orders/${orderId}/assign`, admin, { driverId: driver.id })).status, 409);
    await adm(`/drivers/${driver.id}`, admin, { verified: true }, 'PATCH');

    const assigned = await (await adm(`/orders/${orderId}/assign`, admin, { driverId: driver.id })).json();
    assert.equal(assigned.status, 'assigned');
    assert.equal(assigned.driver.name, 'Sipho');
    assert.equal((await (await call(`/api/orders/${orderId}`, { token: customerToken })).json()).status, 'assigned');

    // Can't skip a step.
    assert.equal((await adm(`/orders/${orderId}/status`, admin, { status: 'delivered' })).status, 409);
    assert.equal((await adm(`/orders/${orderId}/status`, admin, { status: 'collected' })).status, 200);
    const done = await (await adm(`/orders/${orderId}/status`, admin, { status: 'delivered' })).json();
    assert.equal(done.status, 'delivered');
    assert.ok(done.deliveredAt);
    assert.ok(done.markupCents > 0);

    const before = await (await adm('/payouts', admin)).json();
    const row = before.payouts.find((p: { orderId: number }) => p.orderId === orderId);
    assert.equal(row.amountCents, done.storeCostCents);
    assert.equal(row.due, false); // paid just now, due in 2 days
    assert.equal((await (await adm(`/payouts/${orderId}/mark-paid`, admin, {})).json()).ok, true);
    assert.equal((await adm(`/payouts/${orderId}/mark-paid`, admin, {})).status, 409);
  });

  it('shows a payout as due once two days have passed', async () => {
    const admin = await login('0820000001');
    const { orderId } = await paidOrder('0829990003');
    const driver = await (await adm('/drivers', admin, { name: 'Thandi', phone: '0749876543', vehicle: 'car' })).json();
    await adm(`/drivers/${driver.id}`, admin, { verified: true }, 'PATCH');
    await adm(`/orders/${orderId}/assign`, admin, { driverId: driver.id });
    await adm(`/orders/${orderId}/status`, admin, { status: 'collected' });
    await adm(`/orders/${orderId}/status`, admin, { status: 'delivered' });
    db.prepare("UPDATE orders SET paid_at = datetime('now', '-3 days') WHERE id = ?").run(orderId);
    const res = await (await adm('/payouts', admin)).json();
    assert.equal(res.payouts.find((p: { orderId: number }) => p.orderId === orderId).due, true);
    assert.ok(res.dueNowCents > 0);
  });

  it('lets the price list change what customers pay and hide out-of-stock items', async () => {
    const admin = await login('0820000001');
    const { products } = await (await call('/api/products')).json();
    const p = products[2];
    await adm(`/products/${p.id}`, admin, { shelfPriceCents: 10000 }, 'PATCH');
    const after = (await (await call('/api/products')).json()).products.find((x: { id: number }) => x.id === p.id);
    assert.equal(after.priceCents, customerPriceCents(10000));

    await adm(`/products/${p.id}`, admin, { inStock: false }, 'PATCH');
    const customer = await login('0829990004');
    const res = await call('/api/orders', { token: customer, body: { address: '3 Stock Street, Ottery, Cape Town', items: [{ id: p.id, qty: 1 }] } });
    assert.equal(res.status, 409);

    assert.equal((await adm(`/products/${p.id}`, admin, { shelfPriceCents: -5 }, 'PATCH')).status, 400);
    assert.equal((await adm('/products', admin, { name: 'Test item', unit: 'each', category: 'Tools', shelfPriceCents: 1500 })).status, 201);
  });

  it('only cancels orders that have not been collected', async () => {
    const admin = await login('0820000001');
    const { orderId } = await paidOrder('0829990005');
    assert.equal((await adm(`/orders/${orderId}/status`, admin, { status: 'cancelled' })).status, 200);
    assert.equal((await adm(`/orders/${orderId}/status`, admin, { status: 'collected' })).status, 409);
  });
});
