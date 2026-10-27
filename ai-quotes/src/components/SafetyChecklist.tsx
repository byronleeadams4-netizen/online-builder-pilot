import React from 'react';
import { zar, catalogueZar } from '../lib/money';
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  Hand,
  Wind,
  Volume2,
  Check,
  X,
  AlertTriangle,
  Plus,
  Shield,
} from 'lucide-react';
import { SafetyGearItem } from '../types/diy';

interface SafetyChecklistProps {
  safetyGear: SafetyGearItem[];
  jobCategory: string;
  onToggleGear: (gearId: string, userHasGear: boolean) => void;
  onHaveAllGear: () => void;
  onAddMissingToInventory: () => void;
  onNextStage?: () => void;
  onPrevStage?: () => void;
}

export const SafetyChecklist: React.FC<SafetyChecklistProps> = ({
  safetyGear,
  jobCategory,
  onToggleGear,
  onHaveAllGear,
  onAddMissingToInventory,
  onNextStage,
  onPrevStage,
}) => {
  if (!safetyGear || safetyGear.length === 0) return null;

  const haveCount = safetyGear.filter((g) => g.userHasGear).length;
  const missingGear = safetyGear.filter((g) => !g.userHasGear);
  const missingCount = missingGear.length;
  const criticalMissing = missingGear.filter((g) => g.isCritical);

  const getGearIcon = (type: SafetyGearItem['gearType']) => {
    switch (type) {
      case 'eye_protection':
        return <Eye className="w-4 h-4" />;
      case 'hand_protection':
        return <Hand className="w-4 h-4" />;
      case 'respiratory':
        return <Wind className="w-4 h-4" />;
      case 'hearing':
        return <Volume2 className="w-4 h-4" />;
      case 'body':
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getGearCategoryLabel = (type: SafetyGearItem['gearType']) => {
    switch (type) {
      case 'eye_protection':
        return 'Eye & Vision Protection';
      case 'hand_protection':
        return 'Hand & Grip Protection';
      case 'respiratory':
        return 'Respiratory & Particulate Filter';
      case 'hearing':
        return 'Hearing Protection';
      case 'body':
      default:
        return 'Body & Joint Ergonomics';
    }
  };

  return (
    <section id="safety-section" className="py-6 border-b border-slate-800/80 bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Job Site Protection Protocol</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">Diagnosis-Specific PPE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Personal Protective Equipment (PPE) Safety Checklist
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onHaveAllGear}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
            >
              I Have All Safety Gear
            </button>
            {missingCount > 0 && (
              <button
                type="button"
                onClick={onAddMissingToInventory}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Missing PPE to Store Order ({missingCount})</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-5 max-w-3xl">
          Based on the tools and materials analyzed for this <strong>{jobCategory}</strong> scenario,
          the following protective equipment is required by OSHA standards and contractor best practice
          to prevent severe injury.
        </p>

        {/* Hazard Alert if Critical PPE is missing */}
        {criticalMissing.length > 0 && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-300 font-semibold block">
                Safety Warning: {criticalMissing.length} Critical Protective Item{criticalMissing.length > 1 ? 's' : ''} Missing!
              </strong>
              <span>
                Do not begin physical work without {criticalMissing.map((g) => g.name).join(', ')}.
                These items are flagged in your nearby store inventory below.
              </span>
            </div>
          </div>
        )}

        {/* PPE Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safetyGear.map((gear) => {
            const hasGear = gear.userHasGear;
            return (
              <div
                key={gear.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  hasGear
                    ? 'bg-slate-900/60 border-slate-800 opacity-85'
                    : 'bg-slate-900 border-slate-750 hover:border-slate-700 shadow-sm'
                }`}
              >
                <div>
                  {/* Category & Status Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400/90 uppercase tracking-wider">
                      {getGearIcon(gear.gearType)}
                      <span>{getGearCategoryLabel(gear.gearType)}</span>
                    </span>

                    {gear.isCritical ? (
                      <span className="text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/25 px-1.5 py-0.5 rounded">
                        Critical
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        Recommended
                      </span>
                    )}
                  </div>

                  {/* Gear Name */}
                  <h4
                    className={`text-sm font-bold leading-tight mb-1 ${
                      hasGear ? 'line-through text-slate-400' : 'text-slate-100'
                    }`}
                  >
                    {gear.name}
                  </h4>

                  <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                    {gear.description}
                  </p>

                  {/* Mandatory Justification */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-850 text-[11px] text-slate-300 mb-3">
                    <strong className="text-amber-400/90 block mb-0.5">Why Mandatory on This Job:</strong>
                    <span>{gear.whyMandatory}</span>
                  </div>
                </div>

                {/* Footer with Price and Have/Need Toggle */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
                    ~{zar(catalogueZar(gear.estimatedPrice))}
                  </span>

                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => onToggleGear(gear.id, true)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded flex items-center gap-1 transition-all ${
                        hasGear
                          ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="I have this protective gear in my workshop"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>In Toolbox</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleGear(gear.id, false)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded flex items-center gap-1 transition-all ${
                        !hasGear
                          ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="I need to purchase this protective gear"
                    >
                      <X className="w-3 h-3 stroke-[3]" />
                      <span>Need</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stage Navigation Footer */}
        {(onNextStage || onPrevStage) && (
          <div className="mt-8 p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            {onPrevStage ? (
              <button
                type="button"
                onClick={onPrevStage}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                ← Back to Diagnostic Q&amp;A
              </button>
            ) : <div />}

            {onNextStage && (
              <button
                type="button"
                onClick={onNextStage}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
              >
                <span>Proceed to Inventory Checklist (Stage 4) →</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
