import crypto from 'node:crypto';
import { config } from './config.ts';

const API = 'https://api.paystack.co';

export type InitResult = { authorizationUrl: string };

export async function initializeTransaction(args: {
  email: string;
  amountCents: number;
  reference: string;
  callbackUrl: string;
}): Promise<InitResult> {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.paystackSecret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: args.email,
      amount: args.amountCents,
      currency: 'ZAR',
      reference: args.reference,
      callback_url: args.callbackUrl,
    }),
  });
  const json = (await res.json()) as { status: boolean; data?: { authorization_url: string }; message?: string };
  if (!res.ok || !json.status || !json.data) throw new Error(`Paystack init failed: ${json.message ?? res.status}`);
  return { authorizationUrl: json.data.authorization_url };
}

/** Returns true only if Paystack says this reference was paid, in full, in ZAR. */
export async function verifyTransaction(reference: string, expectedCents: number): Promise<boolean> {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${config.paystackSecret}` },
  });
  if (!res.ok) return false;
  const json = (await res.json()) as { data?: { status: string; amount: number; currency: string } };
  const d = json.data;
  return !!d && d.status === 'success' && d.currency === 'ZAR' && d.amount >= expectedCents;
}

export function validWebhookSignature(rawBody: Buffer, signature: string | undefined) {
  if (!signature || !config.paystackSecret) return false;
  const expected = crypto.createHmac('sha512', config.paystackSecret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
