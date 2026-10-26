import React from 'react';
import { Camera, HelpCircle, Shield, CheckSquare, Store, Check, ChevronRight } from 'lucide-react';

export interface Stage {
  id: number;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
}

export const STAGES: Stage[] = [
  {
    id: 1,
    label: 'Snapshot Intake',
    shortLabel: '1. Snapshot',
    icon: <Camera className="w-4 h-4" />,
    description: 'Capture scenario photo or select realistic preset',
  },
  {
    id: 2,
    label: 'Diagnostic Q&A',
    shortLabel: '2. Diagnosis',
    icon: <HelpCircle className="w-4 h-4" />,
    description: 'Clarifying physical questions & hazard triage',
  },
  {
    id: 3,
    label: 'Safety & Procedure',
    shortLabel: '3. Safety & Steps',
    icon: <Shield className="w-4 h-4" />,
    description: 'PPE gear checklist & step-by-step contractor guide',
  },
  {
    id: 4,
    label: 'Inventory Checklist',
    shortLabel: '4. Inventory',
    icon: <CheckSquare className="w-4 h-4" />,
    description: 'Have in toolbox vs missing materials tally',
  },
  {
    id: 5,
    label: 'Stores & 1-Click Order',
    shortLabel: '5. Stores & Deals',
    icon: <Store className="w-4 h-4" />,
    description: 'Radar map, aisle quotes & curbside reservation',
  },
];

interface StageStepperProps {
  currentStage: number;
  maxUnlockedStage: number;
  onSelectStage: (stageId: number) => void;
  onNextStage?: () => void;
  onPrevStage?: () => void;
}

export const StageStepper: React.FC<StageStepperProps> = ({
  currentStage,
  maxUnlockedStage,
  onSelectStage,
  onNextStage,
  onPrevStage,
}) => {
  return (
    <div className="bg-slate-950 border-b border-slate-800/80 sticky top-14 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Stepper Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none flex-1">
            {STAGES.map((stage, index) => {
              const isActive = currentStage === stage.id;
              const isCompleted = currentStage > stage.id;
              const isUnlocked = stage.id <= maxUnlockedStage;

              return (
                <React.Fragment key={stage.id}>
                  <button
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => onSelectStage(stage.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/20'
                        : isCompleted
                        ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30 hover:bg-slate-850'
                        : isUnlocked
                        ? 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-850 border border-slate-800'
                        : 'bg-slate-950/40 text-slate-600 border border-slate-900 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] shrink-0 ${
                        isActive
                          ? 'bg-slate-950 text-amber-400 font-bold'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : stage.id}
                    </span>
                    <span className="hidden md:inline">{stage.label}</span>
                    <span className="md:hidden">{stage.shortLabel}</span>
                  </button>

                  {index < STAGES.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0 hidden sm:inline" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Quick Stage Controls */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-xs">
            <button
              type="button"
              disabled={currentStage <= 1}
              onClick={onPrevStage}
              className="px-2.5 py-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors rounded-lg bg-slate-900 border border-slate-800"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={currentStage >= 5 || currentStage >= maxUnlockedStage}
              onClick={onNextStage}
              className="px-2.5 py-1 text-amber-400 hover:text-amber-300 disabled:opacity-30 disabled:hover:text-amber-400 transition-colors font-semibold rounded-lg bg-slate-900 border border-slate-800"
            >
              Next Stage →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
