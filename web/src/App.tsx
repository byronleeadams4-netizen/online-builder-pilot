import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError, getToken, Order, Product, rand, setToken, STATUS_LABEL } from './api';

type View = 'shop' | 'checkout' | 'orders' | 'order';
type Cart = Record<number, number>;

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [view, setView] = useState<View>('shop');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [mockPay, setMockPay] = useState<string | null>(null);

  useEffect(() => {
    api<{ products: Product[]; deliveryFeeCents: number }>('/api/products').then((d) => {
      setProducts(d.products);
      setDeliveryFee(d.deliveryFeeCents);
    }).catch(() => {});
    // Returning from Paystack (or the test checkout) lands on /?order=ID
    const q = new URLSearchParams(window.location.search);
    if (q.get('order')) { setOrderId(Number(q.get('order'))); setView('order'); }
    setMockPay(q.get('mockPay'));
  }, []);

  const logout = () => { setToken(null); setAuthed(false); setView('shop'); };
  const goOrder = (id: number) => { window.history.replaceState({}, '', '/'); setMockPay(null); setOrderId(id); setView('order'); };

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  return (
    <div className="app">
      <header>
        <h1>Online Builder</h1>
        <nav>
          <button className={view === 'shop' || view === 'checkout' ? 'on' : ''} onClick={() => setView('shop')}>Shop</button>
          <button className={view === 'orders' || view === 'order' ? 'on' : ''} onClick={() => setView('orders')}>My orders</button>
          <button onClick={logout}>Log out</button>
        </nav>
      </header>
      {view === 'shop' && <Shop products={products} cart={cart} setCart={setCart} deliveryFee={deliveryFee} onCheckout={() => setView('checkout')} />}
      {view === 'checkout' && <Checkout products={products} cart={cart} deliveryFee={deliveryFee} onBack={() => setView('shop')} onExpired={logout} />}
      {view === 'orders' && <Orders onOpen={goOrder} onExpired={logout} />}
      {view === 'order' && orderId !== null && <OrderStatus id={orderId} mockPayRef={mockPay} onExpired={logout} />}
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setErr(''); setBusy(true);
    try { await fn(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="app narrow">
      <h1>Online Builder</h1>
      <p className="muted">Order smart. Build faster.</p>
      {!sent ? (
        <form onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await api<{ devCode?: string }>('/api/auth/request-otp', { phone }); setDevCode(r.devCode ?? null); setSent(true); }); }}>
          <label>Mobile number
            <input inputMode="tel" autoComplete="tel" placeholder="082 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <button className="primary" disabled={busy || !phone}>Send me a code</button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await api<{ token: string }>('/api/auth/verify-otp', { phone, code }); setToken(r.token); onDone(); }); }}>
          <label>6-digit code
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          {devCode && <p className="dev">Test mode: your code is <b>{devCode}</b></p>}
          <button className="primary" disabled={busy || code.length !== 6}>Log in</button>
          <button type="button" className="link" onClick={() => { setSent(false); setCode(''); }}>Use a different number</button>
        </form>
      )}
      {err && <p className="error">{err}</p>}
    </div>
  );
}

function Shop({ products, cart, setCart, deliveryFee, onCheckout }: {
  products: Product[]; cart: Cart; setCart: (c: Cart) => void; deliveryFee: number; onCheckout: () => void;
}) {
  const [q, setQ] = useState('');
  const shown = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()));
  const categories = [...new Set(shown.map((p) => p.category))];
  const set = (id: number, qty: number) => {
    const next = { ...cart };
    if (qty <= 0) delete next[id]; else next[id] = Math.min(qty, 500);
    setCart(next);
  };
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = products.reduce((s, p) => s + (cart[p.id] ?? 0) * p.priceCents, 0);

  return (
    <main>
      <input className="search" type="search" placeholder="Search items" value={q} onChange={(e) => setQ(e.target.value)} />
      {categories.map((c) => (
        <section key={c}>
          <h2>{c}</h2>
          {shown.filter((p) => p.category === c).map((p) => (
            <div className="row" key={p.id}>
              <div>
                <div className="name">{p.name}</div>
                <div className="muted">{rand(p.priceCents)} per {p.unit}{!p.inStock && ' · Out of stock'}</div>
              </div>
              {p.inStock && (
                <div className="qty">
                  <button aria-label={`Remove one ${p.name}`} onClick={() => set(p.id, (cart[p.id] ?? 0) - 1)} disabled={!cart[p.id]}>−</button>
                  <span>{cart[p.id] ?? 0}</span>
                  <button aria-label={`Add one ${p.name}`} onClick={() => set(p.id, (cart[p.id] ?? 0) + 1)}>+</button>
                </div>
              )}
            </div>
          ))}
        </section>
      ))}
      {count > 0 && (
        <div className="cartbar">
          <div><b>{count}</b> item{count > 1 ? 's' : ''} · {rand(subtotal)} <span className="muted">+ {rand(deliveryFee)} delivery</span></div>
          <button className="primary" onClick={onCheckout}>Checkout</button>
        </div>
      )}
    </main>
  );
}

function Checkout({ products, cart, deliveryFee, onBack, onExpired }: {
  products: Product[]; cart: Cart; deliveryFee: number; onBack: () => void; onExpired: () => void;
}) {
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const lines = useMemo(() => products.filter((p) => cart[p.id]).map((p) => ({ p, qty: cart[p.id] })), [products, cart]);
  const subtotal = lines.reduce((s, l) => s + l.p.priceCents * l.qty, 0);

  const place = async () => {
    setErr(''); setBusy(true);
    try {
      const r = await api<{ orderId: number; paymentUrl: string }>('/api/orders', {
        address, notes, items: lines.map((l) => ({ id: l.p.id, qty: l.qty })),
      });
      // Hand over to Paystack's hosted checkout (or the dev test checkout, which reloads this app on the order page).
      window.location.assign(r.paymentUrl);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onExpired();
      setErr((e as Error).message); setBusy(false);
    }
  };

  return (
    <main>
      <button className="link" onClick={onBack}>← Back to shop</button>
      <h2>Your order</h2>
      {lines.map((l) => <div className="row" key={l.p.id}><span>{l.qty} × {l.p.name}</span><span>{rand(l.qty * l.p.priceCents)}</span></div>)}
      <div className="row"><span>Delivery</span><span>{rand(deliveryFee)}</span></div>
      <div className="row total"><span>Total</span><span>{rand(subtotal + deliveryFee)}</span></div>
      <label>Delivery address
        <textarea rows={3} placeholder="Street, suburb, Cape Town. Add a gate code or landmark if there is one." value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>
      <label>Note for the driver (optional)
        <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
      </label>
      {err && <p className="error">{err}</p>}
      <button className="primary" disabled={busy || address.trim().length < 10 || lines.length === 0} onClick={place}>
        {busy ? 'Starting payment…' : `Pay ${rand(subtotal + deliveryFee)}`}
      </button>
      <p className="muted small">You pay securely through Paystack. Delivery target is 45 min to 1 hr; we log every order during the pilot.</p>
    </main>
  );
}

function Orders({ onOpen, onExpired }: { onOpen: (id: number) => void; onExpired: () => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => {
    api<Order[]>('/api/orders').then(setOrders).catch((e) => e instanceof ApiError && e.status === 401 ? onExpired() : setOrders([]));
  }, [onExpired]);
  if (!orders) return <main><p className="muted">Loading…</p></main>;
  if (orders.length === 0) return <main><p className="muted">No orders yet.</p></main>;
  return (
    <main>
      <h2>My orders</h2>
      {orders.map((o) => (
        <button className="row card" key={o.id} onClick={() => onOpen(o.id)}>
          <div><div className="name">Order #{o.id} · {rand(o.totalCents)}</div><div className="muted">{STATUS_LABEL[o.status] ?? o.status}</div></div>
          <span>›</span>
        </button>
      ))}
    </main>
  );
}

function OrderStatus({ id, mockPayRef, onExpired }: { id: number; mockPayRef: string | null; onExpired: () => void }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    api<Order>(`/api/orders/${id}`).then(setOrder).catch((e) => e instanceof ApiError && e.status === 401 ? onExpired() : setErr((e as Error).message));
  }, [id, onExpired]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  const payTest = async () => { await api(`/api/dev/mock-pay/${mockPayRef}`, {}); load(); };

  if (err) return <main><p className="error">{err}</p></main>;
  if (!order) return <main><p className="muted">Loading…</p></main>;
  return (
    <main>
      <h2>Order #{order.id}</h2>
      <p className={`status ${order.status}`}>{STATUS_LABEL[order.status] ?? order.status}</p>
      {order.status === 'pending_payment' && mockPayRef && (
        <div className="dev"><p>Test mode: no Paystack key is set.</p><button className="primary" onClick={payTest}>Simulate successful payment</button></div>
      )}
      {order.items.map((i, n) => <div className="row" key={n}><span>{i.qty} × {i.name}</span><span>{rand(i.qty * i.unitPriceCents)}</span></div>)}
      <div className="row"><span>Delivery</span><span>{rand(order.deliveryFeeCents)}</span></div>
      <div className="row total"><span>Total</span><span>{rand(order.totalCents)}</span></div>
      <p className="muted small">Delivering to: {order.address}</p>
    </main>
  );
}
