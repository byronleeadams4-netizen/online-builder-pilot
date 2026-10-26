import React, { useState } from 'react';
import { zar, catalogueZar } from '../lib/money';
import {
  Check,
  X,
  Wrench,
  Package,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  ArrowDown,
  RotateCcw,
} from 'lucide-react';
import { InventoryItem } from '../types/diy';

interface ChecklistSidePanelProps {
  items: InventoryItem[];
  onToggleItem: (itemId: string, hasItem: boolean) => void;
  onSetAllToolsHave: () => void;
  onSetAllNeed: () => void;
  onScrollToStores?: () => void;
  onNextStage?: () => void;
  onPrevStage?: () => void;
}

export const ChecklistSidePanel: React.FC<ChecklistSidePanelProps> = ({
  items,
  onToggleItem,
  onSetAllToolsHave,
  onSetAllNeed,
  onScrollToStores,
  onNextStage,
  onPrevStage,
}) => {
  const [filter, setFilter] = useState<'all' | 'tools' | 'materials' | 'missing'>('all');

  const haveCount = items.filter((i) => i.userHasItem).length;
  const missingItems = items.filter((i) => !i.userHasItem);
  const missingCount = missingItems.length;
  const missingTotal = missingItems.reduce((acc, i) => acc + (i.estimatedPrice || 0), 0);

  const filteredItems = items.filter((item) => {
    if (filter === 'tools') return item.category === 'tool';
    if (filter === 'materials') return item.category === 'material';
    if (filter === 'missing') return !item.userHasItem;
    return true;
  });

  return (
    <div
      id="checklist-section"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between"
    >
      <div>
        {/* Header with Step Tracker */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span>Stage 4 of 5</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">Bill of Materials &amp; Tool Triage</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {items.length} items total
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mb-2">
          Interactive Inventory Checklist
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Check off items you already own in your workshop. Unchecked items become your missing inventory,
          instantly queried across nearby hardware stores for stock and price comparisons.
        </p>

        {/* Progress Bar: Have vs Missing Visualizer */}
        {items.length > 0 && (() => {
          const totalItems = items.length;
          const havePercentage = Math.round((haveCount / totalItems) * 100);
          const missingPercentage = 100 - havePercentage;
          const toolItems = items.filter((i) => i.category === 'tool');
          const toolsHave = toolItems.filter((i) => i.userHasItem).length;
          const materialItems = items.filter((i) => i.category === 'material');
          const materialsHave = materialItems.filter((i) => i.userHasItem).length;

          return (
            <div className="mb-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  <span className="text-slate-300 font-medium">In Toolbox:</span>
                  <span className="font-mono text-emerald-400 font-bold tabular-nums">
                    {havePercentage}% ({haveCount}/{totalItems})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                  <span className="text-slate-300 font-medium">Missing:</span>
                  <span className="font-mono text-amber-400 font-bold tabular-nums">
                    {missingPercentage}% ({missingCount}/{totalItems})
                  </span>
                </div>
              </div>

              {/* Segmented Dual Color Progress Bar */}
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800/90 shadow-inner">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${havePercentage}%` }}
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-300"
                  style={{ width: `${missingPercentage}%` }}
                />
              </div>

              {/* Category sub-breakdowns */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                <span>
                  Tools Owned: <strong className="text-slate-300">{toolsHave}/{toolItems.length}</strong>
                </span>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span>
                  Materials In-Stock: <strong className="text-slate-300">{materialsHave}/{materialItems.length}</strong>
                </span>
              </div>
            </div>
          );
        })()}

        {/* Real-time Tally Dashboard */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 mb-4">
          <div className="text-center border-r border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">In Toolbox</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono tabular-nums">
              {haveCount}
            </span>
          </div>
          <div className="text-center border-r border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Missing to Buy</span>
            <span className="text-base font-extrabold text-amber-400 font-mono tabular-nums">
              {missingCount}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Est. Missing Cost</span>
            <span className="text-base font-extrabold text-slate-100 font-mono tabular-nums">
              {zar(catalogueZar(missingTotal))}
            </span>
          </div>
        </div>

        {/* Filter Tabs & Batch Helpers */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilter('tools')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'tools'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tools
            </button>
            <button
              onClick={() => setFilter('materials')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'materials'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Materials
            </button>
            <button
              onClick={() => setFilter('missing')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'missing'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              Missing Only ({missingCount})
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              onClick={onSetAllToolsHave}
              className="text-slate-400 hover:text-slate-200 underline decoration-slate-700 hover:decoration-slate-400"
            >
              I have all tools
            </button>
            <span className="text-slate-700">·</span>
            <button
              onClick={onSetAllNeed}
              className="text-slate-400 hover:text-slate-200 underline decoration-slate-700 hover:decoration-slate-400"
            >
              Reset all to missing
            </button>
          </div>
        </div>

        {/* Item Cards List */}
        <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const hasItem = item.userHasItem;
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  hasItem
                    ? 'bg-slate-950/60 border-slate-850 opacity-80'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        item.category === 'tool'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {item.category === 'tool' ? (
                        <Wrench className="w-3.5 h-3.5" />
                      ) : (
                        <Package className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h4
                          className={`text-xs font-bold leading-tight ${
                            hasItem ? 'line-through text-slate-400' : 'text-slate-100'
                          }`}
                        >
                          {item.name}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          Qty: {item.quantity}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {item.specifications}
                      </p>

                      {item.whyNeeded && (
                        <p className="text-[10px] text-slate-400/90 mt-1 italic">
                          Why needed: {item.whyNeeded}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price & Toggle */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
                      ~{zar(catalogueZar(item.estimatedPrice))}
                    </span>

                    {/* Checkbox / Toggle Button */}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => onToggleItem(item.id, true)}
                        className={`px-2 py-1 text-[11px] font-semibold rounded flex items-center gap-1 transition-all ${
                          hasItem
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="I already have this in my toolbox"
                      >
                        <Check className="w-3 h-3" />
                        <span>I Have</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleItem(item.id, false)}
                        className={`px-2 py-1 text-[11px] font-semibold rounded flex items-center gap-1 transition-all ${
                          !hasItem
                            ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="I do not have this - add to missing inventory"
                      >
                        <X className="w-3 h-3" />
                        <span>Need</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No items matching this filter.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Store Route Trigger & Stage Navigation */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
        <button
          type="button"
          onClick={() => {
            if (onNextStage) onNextStage();
            else if (onScrollToStores) onScrollToStores();
          }}
          className="w-full flex items-center justify-between p-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span>
              {missingCount > 0
                ? `Proceed to Store Radar & Deals (${missingCount} Missing)`
                : 'All Items in Toolbox! Check Store Deals Anyway'}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-sm">
            <span>{zar(catalogueZar(missingTotal))}</span>
            <span aria-hidden="true">→</span>
          </div>
        </button>

        {onPrevStage && (
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <button
              type="button"
              onClick={onPrevStage}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Safety &amp; Procedure
            </button>
            <span className="text-[11px] text-slate-500">
              Stage 4 of 5 · Inventory Checklist
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
