export type Product = { id: number; name: string; unit: string; category: string; priceCents: number; inStock: boolean };
export type Order = {
  id: number; status: string; address: string; notes: string | null; subtotalCents: number;
  deliveryFeeCents: number; totalCents: number; createdAt: string; paidAt: string | null;
  items: { name: string; qty: number; unitPriceCents: number }[];
};

const KEY = 'ob_token';
export const getToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const setToken = (t: string | null) => {
  try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
};

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function api<T>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? 'Something went wrong.', res.status);
  return data as T;
}

export const rand = (cents: number) => `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Waiting for payment',
  paid: 'Paid. The store is packing your order',
  collected: 'Driver has collected it',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
