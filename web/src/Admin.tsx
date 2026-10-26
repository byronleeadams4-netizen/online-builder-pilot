import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, rand } from './api';

type AdminOrder = {
  id: number; status: string; address: string; notes: string | null; customerPhone: string; createdAt: string;
  subtotalCents: number; deliveryFeeCents: number; totalCents: number; storeCostCents: number; markupCents: number;
  driver: { id: number; name: string } | null; items: { name: string; qty: number }[];
};
type Driver = { id: number; name: string; phone: string; vehicle: string; verified: boolean; active: boolean };
type AdminProduct = { id: number; name: string; unit: string; category: string; shelfPriceCents: number; inStock: boolean };
type Payouts = {
  payouts: { orderId: number; amountCents: number; dueAt: string; due: boolean; paidAt: string | null }[];
  dueNowCents: number; upcomingCents: number;
};

const ADMIN_STATUS: Record<string, string> = {
  pending_payment: 'Waiting for payment', paid: 'Paid, needs a driver', assigned: 'Driver assigned',
  collected: 'Collected', delivered: 'Delivered', cancelled: 'Cancelled',
};

type Tab = 'orders' | 'drivers' | 'prices' | 'payouts';

export function Admin({ onExpired }: { onExpired: () => void }) {
  const [tab, setTab] = useState<Tab>('orders');
  const [err, setErr] = useState('');

  // Shared error handling: a 401 means the session ended, anything else is shown to the admin.
  const guard = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    try { setErr(''); return await fn(); } catch (e) {
      if (e instanceof ApiError && e.status === 401) onExpired(); else setErr((e as Error).message);
    }
  }, [onExpired]);

  return (
    <main>
      <div className="tabs">
        {(['orders', 'drivers', 'prices', 'payouts'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t === 'prices' ? 'Price list' : t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      {err && <p className="error">{err}</p>}
      {tab === 'orders' && <OrdersTab guard={guard} />}
      {tab === 'drivers' && <DriversTab guard={guard} />}
      {tab === 'prices' && <PricesTab guard={guard} />}
      {tab === 'payouts' && <PayoutsTab guard={guard} />}
    </main>
  );
}

type Guard = <T>(fn: () => Promise<T>) => Promise<T | undefined>;

function OrdersTab({ guard }: { guard: Guard }) {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [show, setShow] = useState<'open' | 'all'>('open');

  const load = useCallback(async () => {
    const [o, d] = await Promise.all([guard(() => api<AdminOrder[]>('/api/admin/orders')), guard(() => api<Driver[]>('/api/admin/drivers'))]);
    if (o) setOrders(o);
    if (d) setDrivers(d);
  }, [guard]);
  useEffect(() => { load(); const t = setInterval(load, 15_000); return () => clearInterval(t); }, [load]);

  if (!orders) return <p className="muted">Loading…</p>;
  const shown = show === 'all' ? orders : orders.filter((o) => ['paid', 'assigned', 'collected'].includes(o.status));
  const usable = drivers.filter((d) => d.verified && d.active);

  const act = async (fn: () => Promise<unknown>) => { await guard(fn); load(); };

  return (
    <>
      <div className="seg">
        <button className={show === 'open' ? 'on' : ''} onClick={() => setShow('open')}>To do</button>
        <button className={show === 'all' ? 'on' : ''} onClick={() => setShow('all')}>All orders</button>
      </div>
      {shown.length === 0 && <p className="muted">Nothing here yet.</p>}
      {shown.map((o) => (
        <div className="acard" key={o.id}>
          <div className="row">
            <b>#{o.id} · {rand(o.totalCents)}</b>
            <span className={`tag ${o.status}`}>{ADMIN_STATUS[o.status] ?? o.status}</span>
          </div>
          <div className="muted small">{o.createdAt} UTC · {o.customerPhone}</div>
          <div>{o.items.map((i) => `${i.qty} × ${i.name}`).join(', ')}</div>
          <div className="small">{o.address}{o.notes && ` · Note: ${o.notes}`}</div>
          <div className="muted small">Store gets {rand(o.storeCostCents)} · our markup {rand(o.markupCents)} + delivery {rand(o.deliveryFeeCents)}</div>
          {(o.status === 'paid' || o.status === 'assigned') && (
            <label className="inline">Driver
              <select value={o.driver?.id ?? ''} onChange={(e) => e.target.value && act(() => api(`/api/admin/orders/${o.id}/assign`, { driverId: Number(e.target.value) }))}>
                <option value="">{usable.length ? 'Choose…' : 'No verified drivers yet'}</option>
                {usable.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.vehicle}</option>)}
              </select>
            </label>
          )}
          {o.driver && o.status !== 'paid' && <div className="small">Driver: {o.driver.name}</div>}
          <div className="actions">
            {o.status === 'assigned' && <button onClick={() => act(() => api(`/api/admin/orders/${o.id}/status`, { status: 'collected' }))}>Mark collected</button>}
            {o.status === 'collected' && <button onClick={() => act(() => api(`/api/admin/orders/${o.id}/status`, { status: 'delivered' }))}>Mark delivered</button>}
            {['pending_payment', 'paid', 'assigned'].includes(o.status) && (
              <button className="danger" onClick={() => {
                const refund = o.status !== 'pending_payment' ? ' The customer has paid: refund them in Paystack yourself.' : '';
                if (window.confirm(`Cancel order #${o.id}?${refund}`)) act(() => api(`/api/admin/orders/${o.id}/status`, { status: 'cancelled' }));
              }}>Cancel</button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

function DriversTab({ guard }: { guard: Guard }) {
  const [drivers, setDrivers] = useState<Driver[] | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', vehicle: 'bakkie' });
  const load = useCallback(async () => { const d = await guard(() => api<Driver[]>('/api/admin/drivers')); if (d) setDrivers(d); }, [guard]);
  useEffect(() => { load(); }, [load]);

  const patch = async (id: number, body: Partial<Driver>) => { await guard(() => api(`/api/admin/drivers/${id}`, body, 'PATCH')); load(); };

  return (
    <>
      <h2>Add a driver</h2>
      <form onSubmit={async (e) => { e.preventDefault(); if (await guard(() => api('/api/admin/drivers', form))) { setForm({ ...form, name: '', phone: '' }); load(); } }}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Mobile number" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
          {['bike', 'car', 'bakkie', 'truck'].map((v) => <option key={v}>{v}</option>)}
        </select>
        <button className="primary" disabled={!form.name || !form.phone}>Add driver</button>
      </form>
      <h2>Drivers</h2>
      <p className="muted small">Tick "Verified" only after you have checked their ID, licence and vehicle. Only verified, active drivers can be given orders.</p>
      {drivers?.length === 0 && <p className="muted">No drivers yet.</p>}
      {drivers?.map((d) => (
        <div className="row" key={d.id}>
          <div><div className="name">{d.name}</div><div className="muted small">{d.phone} · {d.vehicle}</div></div>
          <div className="checks">
            <label><input type="checkbox" checked={d.verified} onChange={(e) => patch(d.id, { verified: e.target.checked })} /> Verified</label>
            <label><input type="checkbox" checked={d.active} onChange={(e) => patch(d.id, { active: e.target.checked })} /> Active</label>
          </div>
        </div>
      ))}
    </>
  );
}

function PricesTab({ guard }: { guard: Guard }) {
  const [items, setItems] = useState<AdminProduct[] | null>(null);
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [add, setAdd] = useState({ name: '', unit: 'each', category: '', price: '' });
  const load = useCallback(async () => { const p = await guard(() => api<AdminProduct[]>('/api/admin/products')); if (p) setItems(p); }, [guard]);
  useEffect(() => { load(); }, [load]);

  const toCents = (v: string) => Math.round(Number(v.replace(',', '.')) * 100);
  const savePrice = async (p: AdminProduct) => {
    const v = draft[p.id];
    if (v === undefined) return;
    const cents = toCents(v);
    if (await guard(() => api(`/api/admin/products/${p.id}`, { shelfPriceCents: cents }, 'PATCH'))) {
      setDraft(({ [p.id]: _, ...rest }) => rest);
      load();
    }
  };

  return (
    <>
      <p className="muted small">Enter the store's shelf price in rand. Customers see this price plus our markup.</p>
      {items?.map((p) => (
        <div className="row" key={p.id}>
          <div><div className="name">{p.name}</div><div className="muted small">{p.category} · per {p.unit}</div></div>
          <div className="checks">
            <span>R <input className="price" inputMode="decimal" value={draft[p.id] ?? (p.shelfPriceCents / 100).toFixed(2)}
              onChange={(e) => setDraft({ ...draft, [p.id]: e.target.value })} onBlur={() => savePrice(p)} /></span>
            <label><input type="checkbox" checked={p.inStock} onChange={async (e) => { await guard(() => api(`/api/admin/products/${p.id}`, { inStock: e.target.checked }, 'PATCH')); load(); }} /> In stock</label>
          </div>
        </div>
      ))}
      <h2>Add an item</h2>
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (await guard(() => api('/api/admin/products', { name: add.name, unit: add.unit, category: add.category, shelfPriceCents: toCents(add.price) }))) {
          setAdd({ name: '', unit: 'each', category: add.category, price: '' }); load();
        }
      }}>
        <input placeholder="Name" value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} />
        <input placeholder="Category (e.g. Timber)" value={add.category} onChange={(e) => setAdd({ ...add, category: e.target.value })} />
        <input placeholder="Unit (each, bag, sheet…)" value={add.unit} onChange={(e) => setAdd({ ...add, unit: e.target.value })} />
        <input placeholder="Shelf price in rand" inputMode="decimal" value={add.price} onChange={(e) => setAdd({ ...add, price: e.target.value })} />
        <button className="primary" disabled={!add.name || !add.category || !add.unit || !add.price}>Add item</button>
      </form>
    </>
  );
}

function PayoutsTab({ guard }: { guard: Guard }) {
  const [data, setData] = useState<Payouts | null>(null);
  const load = useCallback(async () => { const d = await guard(() => api<Payouts>('/api/admin/payouts')); if (d) setData(d); }, [guard]);
  useEffect(() => { load(); }, [load]);
  if (!data) return <p className="muted">Loading…</p>;
  return (
    <>
      <div className="stats">
        <div><div className="muted small">Owed to the store now</div><b>{rand(data.dueNowCents)}</b></div>
        <div><div className="muted small">Coming up (inside 2 days)</div><b>{rand(data.upcomingCents)}</b></div>
      </div>
      <p className="muted small">The store gets its shelf price 2 days after each order is paid. Pay it outside the app, then tap "Mark paid" so it is recorded.</p>
      {data.payouts.length === 0 && <p className="muted">No delivered orders yet.</p>}
      {data.payouts.map((p) => (
        <div className="row" key={p.orderId}>
          <div><div className="name">Order #{p.orderId} · {rand(p.amountCents)}</div>
            <div className="muted small">{p.paidAt ? `Paid ${p.paidAt} UTC` : p.due ? 'Due now' : `Due ${p.dueAt} UTC`}</div></div>
          {!p.paidAt && <button className="smallbtn" onClick={async () => { await guard(() => api(`/api/admin/payouts/${p.orderId}/mark-paid`, {})); load(); }}>Mark paid</button>}
        </div>
      ))}
    </>
  );
}
