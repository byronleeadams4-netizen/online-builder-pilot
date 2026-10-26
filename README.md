# Online Builder pilot app

Delivery app for building and DIY stock in Cape Town. This is the pilot build described in the Pilot Checklist: one store, about 20 items, customers within 5 to 10 km.

## Status

| Pilot screen (checklist, section 4) | State |
| --- | --- |
| Sign up / login with OTP | Done. SMS sending is **not** wired up yet: codes are shown on screen in dev and the API refuses to issue codes when `NODE_ENV=production`. |
| Product list, search, cart, delivery details, order summary | Done (placeholder catalogue, see `server/seed.ts`) |
| Payment via Paystack hosted checkout | Done, untested against a live Paystack account. With no key set (dev only) a test checkout is used. |
| Order confirmation, status, history | Done |
| Driver view | Not started |
| Admin view (orders, assign driver, price list, payouts) | Not started |

## Run it

Needs Node 22.13 or newer.

```
npm install
cp .env.example .env   # optional, defaults work for local dev
npm run dev            # API on :3001, web on http://localhost:5173
npm test
```

`npm run build` then `npm start` serves the built web app and the API from one process.

## How money works

- The store's shelf price is stored per product (`shelf_price_cents`). Customers see shelf price plus `MARKUP_PCT`, and pay a flat `DELIVERY_FEE_CENTS`. Both are **placeholders** until the margin is decided (checklist, section 2).
- Prices are always recalculated on the server; the browser only sends item ids and quantities.
- Orders are marked paid by the Paystack webhook (`POST /api/paystack/webhook`, signature checked) or by a server-side verify call when the customer returns. Amount and currency (ZAR) are checked both times.
- The order stores what the store should be paid (`store_cost_cents`) so the 2-day store payout can be reported once the admin view exists.

## Before real customers

- Replace the placeholder items and prices with the pilot store's real list.
- Add an SMS provider for OTP and a way to receive Paystack webhooks (public URL).
- Confirm with Paystack that holding funds and paying the store after 2 days is allowed, and sort out VAT (checklist, section 2).
- Customer terms and POPIA privacy policy, reviewed by an attorney (checklist, section 1).
