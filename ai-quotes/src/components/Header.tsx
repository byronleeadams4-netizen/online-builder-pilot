import React from 'react';
import { Wrench, Camera, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onNewSnapshot: () => void;
  onOpenCamera: () => void;
  onScrollTo: (sectionId: string) => void;
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({
  onNewSnapshot,
  onOpenCamera,
  onScrollTo,
  activeSection,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onScrollTo('triage-section');
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-amber-400 transition-colors"
          >
            Online Builder AI
          </a>
        </div>

        {/* Zone 2: Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => onScrollTo('triage-section')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'triage' ? 'text-amber-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Snapshot Triage
          </button>
          <button
            onClick={() => onScrollTo('diagnosis-section')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'diagnosis' ? 'text-amber-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Diagnostic Q&amp;A
          </button>
          <button
            onClick={() => onScrollTo('safety-section')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'safety' ? 'text-amber-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Safety PPE
          </button>
          <button
            onClick={() => onScrollTo('checklist-section')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'checklist' ? 'text-amber-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Inventory Checklist
          </button>
          <button
            onClick={() => onScrollTo('stores-section')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'stores' ? 'text-amber-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Store Locator &amp; Deals
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCamera}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Open camera to capture live scenario"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Camera</span>
          </button>
          <button
            onClick={onNewSnapshot}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm hover:shadow-amber-500/10 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Job Snapshot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
