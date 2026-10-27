import React, { useState, useEffect } from 'react';
import { Sparkles, Wrench, Shield, Search } from 'lucide-react';

interface ContractorLoadingScreenProps {
  stageName?: string;
}

export const ContractorLoadingScreen: React.FC<ContractorLoadingScreenProps> = ({
  stageName = 'Diagnosing Scenario',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const loadingSteps = [
    'Inspecting physical substrate, damage radius & materials...',
    'Checking building code compliance & safety clearance zones...',
    'Analyzing required specialized tools & fasteners...',
    'Cross-referencing OSHA personal protective equipment (PPE)...',
    'Synthesizing diagnostic questions & bill of materials...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 1200);
    return () => clearInterval(timer);
  }, [loadingSteps.length]);

  return (
    <div className="py-20 flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-300">
      {/* Animated Center Radar */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center animate-pulse">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-amber-400 animate-bounce" />
          </div>
        </div>
        <div className="absolute -inset-4 rounded-full border border-amber-400/20 animate-ping pointer-events-none" />
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
        <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
        <span>Online Builder AI · {stageName}</span>
      </div>

      <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
        Master Contractor Visual Triage in Progress
      </h3>

      <p className="text-xs sm:text-sm text-slate-300 max-w-md h-8 flex items-center justify-center font-mono">
        {loadingSteps[currentStepIndex]}
      </p>

      <div className="mt-6 flex items-center gap-1.5">
        {loadingSteps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentStepIndex
                ? 'w-6 bg-amber-400'
                : 'w-2 bg-slate-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
