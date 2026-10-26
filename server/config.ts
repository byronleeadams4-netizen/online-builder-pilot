const int = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d);

export const config = {
  port: int(process.env.PORT, 3001),
  markupPct: int(process.env.MARKUP_PCT, 10),
  deliveryFeeCents: int(process.env.DELIVERY_FEE_CENTS, 6000),
  paystackSecret: process.env.PAYSTACK_SECRET_KEY ?? '',
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  adminPhones: (process.env.ADMIN_PHONES ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  isProd: process.env.NODE_ENV === 'production',
};

/** Test checkout is only available with no Paystack key and outside production. */
export const mockPaymentsEnabled = !config.paystackSecret && !config.isProd;
