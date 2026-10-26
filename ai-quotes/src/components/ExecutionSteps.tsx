import React, { useState } from 'react';
import { CheckCircle2, Circle, AlertCircle, Lightbulb, Printer, Check } from 'lucide-react';
import { JobStep } from '../types/diy';

interface ExecutionStepsProps {
  steps: JobStep[];
  jobTitle: string;
}

export const ExecutionSteps: React.FC<ExecutionStepsProps> = ({ steps, jobTitle }) => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const completedCount = steps.filter((s) => completedSteps[s.stepNumber]).length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <span>Execution Guide</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">Step-by-Step Procedure</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Contractor-Grade Work Instructions
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-mono">
              {completedCount} of {steps.length} completed ({progressPercent}%)
            </span>
            <div className="w-32 h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
            title="Print execution guide for workshop"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-6">
        Follow these steps in strict sequence. Tap each step as you complete it to stay organized on the job site.
      </p>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step) => {
          const isDone = !!completedSteps[step.stepNumber];
          return (
            <div
              key={step.stepNumber}
              className={`p-4 rounded-xl border transition-all ${
                isDone
                  ? 'bg-slate-950/40 border-slate-850 opacity-75'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-750'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Step Toggle Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleStep(step.stepNumber)}
                  className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors border ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'border-slate-700 hover:border-amber-400 text-transparent'
                  }`}
                  title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      Step {step.stepNumber < 10 ? `0${step.stepNumber}` : step.stepNumber}
                    </span>
                    <span aria-hidden="true" className="text-slate-700">·</span>
                    <h4
                      className={`text-sm font-bold text-slate-100 ${
                        isDone ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {step.title}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                    {step.instruction}
                  </p>

                  {/* Pro Tip */}
                  {step.proTip && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-amber-300">Contractor Pro Tip: </strong>
                        {step.proTip}
                      </span>
                    </div>
                  )}

                  {/* Safety Warning */}
                  {step.safetyWarning && (
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-[11px] text-red-200 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-red-300">Safety Hazard: </strong>
                        {step.safetyWarning}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
