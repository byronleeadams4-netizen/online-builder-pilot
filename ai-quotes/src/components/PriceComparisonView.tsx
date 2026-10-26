import React, { useState } from 'react';
import { zar } from '../lib/money';
import {
  Store,
  DollarSign,
  Navigation,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Phone,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { StoreComparison, InventoryItem } from '../types/diy';
import { StoreLocatorMap } from './StoreLocatorMap';

interface PriceComparisonViewProps {
  comparisons: StoreComparison[];
  missingItems: InventoryItem[];
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  onOpenOrderModal: (storeId: string) => void;
  isLoadingStores: boolean;
  onPrevStage?: () => void;
}

export const PriceComparisonView: React.FC<PriceComparisonViewProps> = ({
  comparisons,
  missingItems,
  selectedStoreId,
  onSelectStore,
  onOpenOrderModal,
  isLoadingStores,
  onPrevStage,
}) => {
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);

  const toggleExpand = (storeId: string) => {
    setExpandedStoreId((prev) => (prev === storeId ? null : storeId));
  };

  const getStoreWebsiteUrl = (chain: string) => {
    switch (chain) {
      case 'Mica Hardware':
        return 'https://www.mica.co.za';
      case 'Builders Warehouse':
        return 'https://www.builders.co.za';
      default:
        return 'https://www.google.com/maps/search/hardware+store+cape+town';
    }
  };

  return (
    <section id="stores-section" className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
              <span>Stage 5 of 5</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">Nearby Cape Town Hardware Stores (placeholder prices)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Store Price Comparison
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            {onPrevStage && (
              <button
                type="button"
                onClick={onPrevStage}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                ← Back to Inventory Checklist
              </button>
            )}
            <span>
              Targeting: <strong className="text-amber-400">{missingItems.length} Missing Items</strong>
            </span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Placeholder prices</span>
          </div>
        </div>

        {/* Interactive Store Locator Radar Map */}
        <StoreLocatorMap
          comparisons={comparisons}
          selectedStoreId={selectedStoreId}
          onSelectStore={onSelectStore}
        />

        {/* Google Maps Grounded Real-Time Place Links */}
        <div className="mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span>
            <span className="font-semibold text-slate-100">Store locations:</span>
            <span className="text-slate-400 hidden md:inline">Open in Google Maps</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="https://maps.google.com/?q=Mica+Hardware+Cape+Town"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              <span>Mica Hardware</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-700">·</span>
            <a
              href="https://maps.google.com/?q=Builders+Warehouse+Cape+Town"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              <span>Builders Warehouse</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Store Comparison Cards */}
        <div className="space-y-4">
          {comparisons.map((item) => {
            const { store, itemQuotes, totalMissingCost, savingsVsAvg, allInStock, isLowestPrice, isClosest, isBestValue } = item;
            const isSelected = store.id === selectedStoreId;
            const isExpanded = expandedStoreId === store.id;

            return (
              <div
                key={store.id}
                className={`rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-amber-400 shadow-xl ring-1 ring-amber-400/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Main Store Banner */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Store Identity & Distance */}
                    <div className="flex items-start gap-4">
                      <div
                        onClick={() => onSelectStore(store.id)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <Store className="w-6 h-6" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3
                            onClick={() => onSelectStore(store.id)}
                            className="text-base sm:text-lg font-bold text-white hover:text-amber-400 cursor-pointer transition-colors"
                          >
                            {store.name}
                          </h3>

                          {/* Highlights / Badges */}
                          {isLowestPrice && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded">
                              Best Deal
                            </span>
                          )}
                          {isClosest && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded">
                              Closest
                            </span>
                          )}
                          {isBestValue && !isLowestPrice && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded">
                              Best Value
                            </span>
                          )}
                        </div>

                        {/* Store Specs (Unboxed text with dots) */}
                        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1 font-mono text-slate-200">
                            <Navigation className="w-3 h-3 text-amber-400" />
                            <span>{store.distance} km away</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{store.pickupTime}</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Rating: {store.rating}★ ({store.reviewCount})</span>
                          <span aria-hidden="true">·</span>
                          <span>{store.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing total & pick-store button */}
                    <div className="flex items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      <div className="text-left lg:text-right">
                        <span className="text-[11px] text-slate-400 block uppercase tracking-wider">
                          Missing Basket Total
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-amber-400 font-mono tabular-nums">
                            {zar(totalMissingCost)}
                          </span>
                          {savingsVsAvg > 0 && (
                            <span className="text-xs font-semibold text-emerald-400">
                              (Save {zar(savingsVsAvg)})
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block">
                          {allInStock ? '✓ All missing items in stock' : 'Partial stock available'}
                        </span>
                      </div>

                      {/* Pick-store button */}
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectStore(store.id);
                            onOpenOrderModal(store.id);
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
                        >
                          <Zap className="w-4 h-4 fill-slate-950" />
                          <span>Pick this store ({missingItems.length})</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Action Row: View Aisle Details, Visit Site, Call */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => toggleExpand(store.id)}
                      className="inline-flex items-center gap-1.5 text-slate-300 hover:text-amber-400 transition-colors font-medium"
                    >
                      <span>{isExpanded ? 'Hide Aisle Locations & Item Quotes' : 'View In-Store Aisles & Itemized Prices'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center gap-4">
                      <a
                        href={`tel:${store.phone}`}
                        className="hidden sm:inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{store.phone}</span>
                      </a>
                      <a
                        href={getStoreWebsiteUrl(store.chain)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors font-medium"
                      >
                        <span>Store Catalog</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Expanded Itemized Aisle & Pricing Breakdown */}
                {isExpanded && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-2 bg-slate-950/70 border-t border-slate-800/80 rounded-b-2xl animate-in slide-in-from-top-1">
                    <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                      <span className="font-semibold text-slate-200 uppercase tracking-wider">
                        Where to find each item:
                      </span>
                      <span>Show at pickup counter or customer service</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                            <th className="pb-2">Item Name &amp; Spec</th>
                            <th className="pb-2">Qty</th>
                            <th className="pb-2">Store Aisle / Bay</th>
                            <th className="pb-2">Stock Level</th>
                            <th className="pb-2 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {missingItems.map((item) => {
                            const quote = itemQuotes[item.id] || {
                              price: item.estimatedPrice,
                              inStock: true,
                              stockCount: 12,
                              aisle: 'Aisle 04',
                              bay: 'Bay 02',
                            };
                            return (
                              <tr key={item.id} className="text-slate-200">
                                <td className="py-2.5 pr-2">
                                  <span className="font-bold block text-white">{item.name}</span>
                                  <span className="text-[11px] text-slate-400">{item.specifications}</span>
                                </td>
                                <td className="py-2.5 pr-2 font-mono text-slate-300">
                                  {item.quantity}
                                </td>
                                <td className="py-2.5 pr-2">
                                  <span className="font-mono font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    {quote.aisle} · {quote.bay}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-2">
                                  <span className="text-emerald-400 font-mono">
                                    {quote.stockCount} in stock
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-mono font-bold text-slate-100 tabular-nums">
                                  {zar(quote.price)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-800 text-slate-200 font-bold">
                            <td colSpan={4} className="pt-3 text-right">
                              Missing Items Subtotal:
                            </td>
                            <td className="pt-3 text-right font-mono text-amber-400 text-sm tabular-nums">
                              {zar(totalMissingCost)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
