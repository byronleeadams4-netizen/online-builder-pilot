import type { Db } from './db.ts';

/**
 * PLACEHOLDER catalogue. Replace with the pilot store's real 20 items and shelf prices
 * (Pilot Checklist, section 3) before any real customer order.
 */
const ITEMS: [string, string, string, number][] = [
  ['Cement 50kg (CEM II 32.5)', 'bag', 'Cement & sand', 11500],
  ['Building sand', 'bag', 'Cement & sand', 4500],
  ['Plaster sand', 'bag', 'Cement & sand', 4800],
  ['Stone 19mm', 'bag', 'Cement & sand', 5200],
  ['Face brick', 'each', 'Bricks & blocks', 380],
  ['Maxi brick', 'each', 'Bricks & blocks', 420],
  ['Concrete block 140mm', 'each', 'Bricks & blocks', 1250],
  ['Brickforce 75mm x 20m', 'roll', 'Bricks & blocks', 8900],
  ['Wire nails 75mm', 'kg', 'Fixings', 3800],
  ['Wire nails 100mm', 'kg', 'Fixings', 3800],
  ['Roof screws 65mm (box)', 'box', 'Fixings', 9500],
  ['SA pine 38x114mm', '3.0m length', 'Timber', 12900],
  ['SA pine 38x38mm', '3.0m length', 'Timber', 4900],
  ['Chipboard 16mm sheet', 'sheet', 'Timber', 41500],
  ['Corrugated roof sheet 3.0m', 'sheet', 'Roofing', 23500],
  ['PVC pipe 110mm x 6m', 'length', 'Plumbing', 28900],
  ['Plumbers tape (PTFE)', 'roll', 'Plumbing', 1200],
  ['Wheelbarrow, steel tray', 'each', 'Tools', 69900],
  ['Builder\'s shovel', 'each', 'Tools', 14900],
  ['Hand trowel 280mm', 'each', 'Tools', 7900],
];

export function seedProducts(db: Db) {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number };
  if (n > 0) return;
  const ins = db.prepare(
    'INSERT INTO products (name, unit, category, shelf_price_cents) VALUES (?, ?, ?, ?)',
  );
  for (const row of ITEMS) ins.run(...row);
}
