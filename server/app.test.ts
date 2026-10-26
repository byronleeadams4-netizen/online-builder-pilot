import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { createApp } from './app.ts';
import { openDb } from './db.ts';
import { customerPriceCents, normalizePhone } from './pricing.ts';
import { seedProducts } from './seed.ts';

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
