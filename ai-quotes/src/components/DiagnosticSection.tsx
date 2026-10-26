import React, { useState } from 'react';
import { HelpCircle, Check, AlertTriangle, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { DiagnosisResult } from '../types/diy';

interface DiagnosticSectionProps {
  diagnosis: DiagnosisResult;
  onRefineDiagnosis: (answers: Record<string, string>) => void;
  isRefining: boolean;
  onNextStage?: () => void;
  onPrevStage?: () => void;
}

export const DiagnosticSection: React.FC<DiagnosticSectionProps> = ({
  diagnosis,
  onRefineDiagnosis,
  isRefining,
  onNextStage,
  onPrevStage,
}) => {
  // Initialize answers with current selected options or recommended options
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    diagnosis.questions.forEach((q) => {
      if (q.selectedOptionId) {
        initial[q.id] = q.selectedOptionId;
      } else {
        const recommended = q.options.find((o) => o.isRecommended);
        if (recommended) {
          initial[q.id] = recommended.id;
        } else if (q.options.length > 0) {
          initial[q.id] = q.options[0].id;
        }
      }
    });
    return initial;
  });

  const handleSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleApply = () => {
    onRefineDiagnosis(selectedAnswers);
    if (onNextStage) {
      onNextStage();
    }
  };

  return (
    <section id="diagnosis-section" className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
              <span>Stage 2 of 5</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">Physical Diagnosis &amp; Questioning</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              AI Job Triage &amp; Clarification Questionnaire
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Skill Level: <strong className="text-slate-200">{diagnosis.skillLevel}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Est. Time: <strong className="text-slate-200">{diagnosis.estimatedTime}</strong></span>
          </div>
        </div>

        {/* Job Overview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                <span className="text-amber-400 font-semibold">{diagnosis.category}</span>
                <span aria-hidden="true">·</span>
                <span>Job #{diagnosis.jobId.slice(-6)}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{diagnosis.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">{diagnosis.summary}</p>

              {/* Detected physical issues */}
              {diagnosis.detectedIssues && diagnosis.detectedIssues.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Detected Physical Factors:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {diagnosis.detectedIssues.map((issue, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-slate-300 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800"
                      >
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Safety warnings panel */}
            {diagnosis.safetyWarnings && diagnosis.safetyWarnings.length > 0 && (
              <div className="w-full md:w-80 shrink-0 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Mandatory Contractor Safety</span>
                </div>
                <ul className="space-y-1.5 text-xs text-amber-200/90 leading-snug">
                  {diagnosis.safetyWarnings.map((warn, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400 shrink-0">›</span>
                      <span>{warn}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Refinement feedback banner (if already calibrated) */}
        {diagnosis.refinementNotes && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-emerald-300 mb-0.5">
                Customized to Your Physical Scenario:
              </strong>
              <span>{diagnosis.refinementNotes}</span>
            </div>
          </div>
        )}

        {/* Diagnostic Questions */}
        {diagnosis.questions && diagnosis.questions.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>Job Accuracy Questionnaire</span>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Answer these questions so the agent can narrow down exact fitting dimensions, fastener ratings, and code compliance.
            </p>

            <div className="space-y-6">
              {diagnosis.questions.map((q, qIndex) => {
                const currentAnswer = selectedAnswers[q.id];
                return (
                  <div key={q.id} className="pt-4 first:pt-0 border-t border-slate-800/80 first:border-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <h4 className="text-sm font-bold text-slate-100">
                        {qIndex + 1}. {q.question}
                      </h4>
                      {q.hint && <span className="text-[11px] text-slate-400 italic hidden sm:inline">{q.hint}</span>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-3">
                      {q.options.map((opt) => {
                        const isSelected = currentAnswer === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelect(q.id, opt.id)}
                            className={`text-left p-3 rounded-xl border text-xs transition-all relative flex flex-col justify-between ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-400 text-white shadow-sm'
                                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-semibold">{opt.label}</span>
                                {isSelected ? (
                                  <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                ) : opt.isRecommended ? (
                                  <span className="text-[10px] text-amber-400/90 font-mono font-medium">Recommended</span>
                                ) : null}
                              </div>
                              {opt.specImpact && (
                                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                                  {opt.specImpact}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage Navigation Footer */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrevStage}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
          >
            ← Back to Snapshot
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleApply}
              disabled={isRefining}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isRefining ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Calibrating Plan...</span>
                </>
              ) : (
                <>
                  <span>Confirm Answers &amp; Proceed to Safety →</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
