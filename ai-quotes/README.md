# Online Builder AI: photo to store quotes

The AI feature that sits inside the main delivery app: photo of a DIY job, analysis, materials checklist, price comparison across Cape Town stores, customer picks a store, then the choice continues in the main app. No onboarding, payments, driver or admin screens live here.

Started from the BuildMate AI prototype (github.com/byronleeadams4-netizen/online-builder-.ai).

## Placeholder data

Store prices are NOT real. Stores (Mica Hardware, Builders Warehouse, a DIY store not yet chosen), distances and prices are placeholders derived from the old catalogue (USD x 18, per-store multiplier). Every API response carries `pricesArePlaceholder: true`. Replace `HARDWARE_STORES` and the pricing block in `server.ts` once live pricing is available (the automated store test is parked until the cloud environment can reach the store sites).

## Run

```
cp .env.example .env   # optional GEMINI_API_KEY for live photo analysis; without it only the 4 preset jobs work
npm install
npm run dev            # http://localhost:3000
npm run lint           # typecheck
```

## Handoff to the main app

Picking a store calls `POST /api/handoff` and returns a `MainAppHandoff` (see `src/types/diy.ts`): store, items, ZAR subtotal. The modal also emits it as `window.parent.postMessage({type:'online-builder:handoff', payload})` and a `online-builder:handoff` DOM event so Arctic Dev Co can hook it into their order flow. The exact integration point is still to be agreed with them.
