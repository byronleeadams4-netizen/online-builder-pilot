import React, { useState } from 'react';
import { X, Store, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { StoreComparison, InventoryItem, MainAppHandoff } from '../types/diy';
import { zar } from '../lib/money';

interface HandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  selectedStoreComparison: StoreComparison | null;
  missingItems: InventoryItem[];
}

export const HandoffModal: React.FC<HandoffModalProps> = ({
  isOpen,
  onClose,
  jobTitle,
  selectedStoreComparison,
  missingItems,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handoff, setHandoff] = useState<MainAppHandoff | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !selectedStoreComparison) return null;

  const { store, itemQuotes, totalMissingCost } = selectedStoreComparison;

  const handleContinue = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const items = missingItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: itemQuotes[item.id]?.price ?? 0,
      }));
      const res = await fetch('/api/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id, jobTitle, items }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Handoff failed');
      setHandoff(data.handoff);
      // The main app listens for this event and continues with its own order flow.
      window.parent?.postMessage({ type: 'online-builder:handoff', payload: data.handoff }, '*');
      window.dispatchEvent(new CustomEvent('online-builder:handoff', { detail: data.handoff }));
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setHandoff(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Store className="w-4 h-4 text-amber-400" />
            {handoff ? 'Sent to your order' : 'Continue with this store'}
          </div>
          <button onClick={handleClose} aria-label="Close" className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-300">
          <div>
            <div className="font-semibold text-slate-100">{store.name}</div>
            <div className="text-slate-400">{store.distance} km away</div>
          </div>

          <ul className="divide-y divide-slate-800 border border-slate-800 rounded-xl">
            {missingItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span>
                  {item.name} <span className="text-slate-500">· {item.quantity}</span>
                </span>
                <span className="font-mono tabular-nums">{zar(itemQuotes[item.id]?.price)}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between font-bold text-slate-100">
            <span>Items total</span>
            <span className="font-mono tabular-nums">{zar(totalMissingCost)}</span>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 px-3 py-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Prices are placeholders for testing, not live store prices. Delivery fee and payment are handled in the
              main app.
            </span>
          </div>

          {error && <div className="text-red-400">{error}</div>}

          {handoff ? (
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              {handoff.items.length} items sent to the main app for checkout.
            </div>
          ) : (
            <button
              onClick={handleContinue}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold py-3 transition-colors"
            >
              {isSubmitting ? 'Sending...' : `Continue in the app (${zar(totalMissingCost)})`}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
