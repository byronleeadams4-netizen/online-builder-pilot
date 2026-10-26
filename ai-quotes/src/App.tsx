import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StageStepper } from './components/StageStepper';
import { ContractorLoadingScreen } from './components/ContractorLoadingScreen';
import { SnapshotCapture } from './components/SnapshotCapture';
import { DiagnosticSection } from './components/DiagnosticSection';
import { SafetyChecklist } from './components/SafetyChecklist';
import { ChecklistSidePanel } from './components/ChecklistSidePanel';
import { ExecutionSteps } from './components/ExecutionSteps';
import { PriceComparisonView } from './components/PriceComparisonView';
import { CameraModal } from './components/CameraModal';
import { HandoffModal } from './components/HandoffModal';
import { ContractorChatbot } from './components/ContractorChatbot';
import { DiagnosisResult, InventoryItem, PresetScenario, StoreComparison } from './types/diy';
import { PRESET_SCENARIOS } from './data/presets';
import { Wrench, Shield, Sparkles, MapPin, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

export default function App() {
  const [selectedPreset, setSelectedPreset] = useState<PresetScenario | null>(PRESET_SCENARIOS[0]);
  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);
  const [orderModalOpen, setOrderModalOpen] = useState<boolean>(false);
  const [storeComparisons, setStoreComparisons] = useState<StoreComparison[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('hd-westside');
  
  // Separate Stage State (1 to 5)
  // Stage 1: Snapshot Intake
  // Stage 2: Diagnostic Q&A
  // Stage 3: Safety & Procedure
  // Stage 4: Inventory Checklist
  // Stage 5: Store comparison & handoff to main app
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [maxUnlockedStage, setMaxUnlockedStage] = useState<number>(1);

  // Swipe handling state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Load initial demo analysis on mount so the user immediately has all data ready
  useEffect(() => {
    loadPreset(PRESET_SCENARIOS[0]);
  }, []);

  const fetchStoreQuotes = useCallback(async (items: InventoryItem[]) => {
    try {
      const res = await fetch('/api/hardware-stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, missingOnly: false }),
      });
      const data = await res.json();
      if (data.success && data.comparisons) {
        setStoreComparisons(data.comparisons);
        if (data.cheapestStoreId) {
          setSelectedStoreId(data.cheapestStoreId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch hardware store quotes:', err);
    }
  }, []);

  const loadPreset = async (preset: PresetScenario) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetId: preset.id,
          userNotes: preset.userPrompt,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setCurrentDiagnosis(data.result);
        setMaxUnlockedStage(5);
        fetchStoreQuotes(data.result.items);
      }
    } catch (err) {
      console.error('Failed to load preset scenario:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (payload: {
    imageBase64?: string;
    mimeType?: string;
    userNotes?: string;
    presetId?: string;
    presetTitle?: string;
    imageUrl?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.result) {
        if (payload.imageUrl) {
          data.result.snapshotUrl = payload.imageUrl;
        }
        setCurrentDiagnosis(data.result);
        setMaxUnlockedStage(5);
        setCurrentStage(2); // Automatically advance to Stage 2 after analysis
        fetchStoreQuotes(data.result.items);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error analyzing scenario:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineDiagnosis = async (answers: Record<string, string>) => {
    if (!currentDiagnosis) return;
    setIsRefining(true);
    try {
      const res = await fetch('/api/refine-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis: currentDiagnosis,
          answers,
        }),
      });
      const data = await res.json();
      if (data.success && data.diagnosis) {
        setCurrentDiagnosis(data.diagnosis);
        fetchStoreQuotes(data.diagnosis.items);
      }
    } catch (err) {
      console.error('Error refining diagnosis:', err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleToggleItem = (itemId: string, hasItem: boolean) => {
    if (!currentDiagnosis) return;
    const updatedItems = currentDiagnosis.items.map((item) =>
      item.id === itemId ? { ...item, userHasItem: hasItem } : item
    );
    setCurrentDiagnosis({
      ...currentDiagnosis,
      items: updatedItems,
    });
    fetchStoreQuotes(updatedItems);
  };

  const handleSetAllToolsHave = () => {
    if (!currentDiagnosis) return;
    const updatedItems = currentDiagnosis.items.map((item) =>
      item.category === 'tool' ? { ...item, userHasItem: true } : item
    );
    setCurrentDiagnosis({
      ...currentDiagnosis,
      items: updatedItems,
    });
    fetchStoreQuotes(updatedItems);
  };

  const handleSetAllNeed = () => {
    if (!currentDiagnosis) return;
    const updatedItems = currentDiagnosis.items.map((item) => ({
      ...item,
      userHasItem: false,
    }));
    setCurrentDiagnosis({
      ...currentDiagnosis,
      items: updatedItems,
    });
    fetchStoreQuotes(updatedItems);
  };

  const handleToggleGear = (gearId: string, userHasGear: boolean) => {
    if (!currentDiagnosis || !currentDiagnosis.safetyGear) return;
    const updatedGear = currentDiagnosis.safetyGear.map((g) =>
      g.id === gearId ? { ...g, userHasGear } : g
    );
    setCurrentDiagnosis({
      ...currentDiagnosis,
      safetyGear: updatedGear,
    });
  };

  const handleHaveAllGear = () => {
    if (!currentDiagnosis || !currentDiagnosis.safetyGear) return;
    const updatedGear = currentDiagnosis.safetyGear.map((g) => ({
      ...g,
      userHasGear: true,
    }));
    setCurrentDiagnosis({
      ...currentDiagnosis,
      safetyGear: updatedGear,
    });
  };

  const handleAddMissingPPEToInventory = () => {
    if (!currentDiagnosis || !currentDiagnosis.safetyGear) return;
    const missingGear = currentDiagnosis.safetyGear.filter((g) => !g.userHasGear);
    const existingItemIds = new Set(currentDiagnosis.items.map((i) => i.id));
    const newItems = [...currentDiagnosis.items];

    missingGear.forEach((gear) => {
      if (!existingItemIds.has(gear.id)) {
        newItems.push({
          id: gear.id,
          name: gear.name,
          category: 'tool',
          quantity: '1 unit',
          specifications: gear.description,
          estimatedPrice: gear.estimatedPrice,
          userHasItem: false,
          priority: gear.isCritical ? 'critical' : 'recommended',
          whyNeeded: gear.whyMandatory,
        });
      } else {
        const existing = newItems.find((i) => i.id === gear.id);
        if (existing) {
          existing.userHasItem = false;
        }
      }
    });

    setCurrentDiagnosis({
      ...currentDiagnosis,
      items: newItems,
    });
    fetchStoreQuotes(newItems);
    setCurrentStage(4); // Advance to Inventory Checklist
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStage = () => {
    setCurrentStage((prev) => {
      const next = Math.min(prev + 1, 5);
      setMaxUnlockedStage((m) => Math.max(m, next));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return next;
    });
  };

  const handlePrevStage = () => {
    setCurrentStage((prev) => {
      const next = Math.max(prev - 1, 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return next;
    });
  };

  const handleSelectStage = (stageId: number) => {
    if (stageId <= maxUnlockedStage) {
      setCurrentStage(stageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Header quick link mapper
  const handleHeaderNav = (section: string) => {
    let targetStage = 1;
    if (section === 'triage' || section === 'triage-section') targetStage = 1;
    else if (section === 'diagnosis' || section === 'diagnosis-section') targetStage = 2;
    else if (section === 'safety' || section === 'safety-section') targetStage = 3;
    else if (section === 'checklist' || section === 'checklist-section') targetStage = 4;
    else if (section === 'stores' || section === 'stores-section') targetStage = 5;

    handleSelectStage(targetStage);
  };

  const handleCameraCapture = (base64Image: string) => {
    setSelectedPreset(null);
    handleAnalyze({
      imageBase64: base64Image,
      mimeType: 'image/jpeg',
      imageUrl: base64Image,
      userNotes: 'Captured from camera snapshot',
    });
  };

  // Touch swipe support: swiping right after done or swiping left
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    // Swiped left (finger moved right to left) -> Go to next stage
    if (diff > 75 && currentStage < maxUnlockedStage && currentStage < 5) {
      handleNextStage();
    }
    // Swiped right (finger moved left to right) -> Go to previous stage
    else if (diff < -75 && currentStage > 1) {
      handlePrevStage();
    }
    setTouchStartX(null);
  };

  const missingItems = currentDiagnosis
    ? currentDiagnosis.items.filter((item) => !item.userHasItem)
    : [];

  const selectedStoreComparison =
    storeComparisons.find((c) => c.store.id === selectedStoreId) || storeComparisons[0] || null;

  // Active section string for header
  const activeSectionName =
    currentStage === 1
      ? 'triage'
      : currentStage === 2
      ? 'diagnosis'
      : currentStage === 3
      ? 'safety'
      : currentStage === 4
      ? 'checklist'
      : 'stores';

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-amber-400 selection:text-slate-950"
    >
      {/* Top Bar adhering to Top Bar Contract */}
      <Header
        onNewSnapshot={() => {
          setCurrentStage(1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCamera={() => setCameraModalOpen(true)}
        onScrollTo={handleHeaderNav}
        activeSection={activeSectionName}
      />

      {/* Stage Stepper: Clear stage indicator & tab navigation */}
      <StageStepper
        currentStage={currentStage}
        maxUnlockedStage={maxUnlockedStage}
        onSelectStage={handleSelectStage}
        onNextStage={handleNextStage}
        onPrevStage={handlePrevStage}
      />

      <main className="flex-1 transition-all duration-300">
        {/* Loading Screen during analysis or job triage */}
        {isLoading ? (
          <ContractorLoadingScreen stageName={currentStage === 1 ? 'Inspecting Scenario Snapshot' : 'Diagnosing Scenario'} />
        ) : (
          <>
            {/* STAGE 1: Snapshot Intake & Scenario Selection */}
            {currentStage === 1 && (
              <div className="animate-in fade-in duration-200">
                <SnapshotCapture
                  onAnalyze={handleAnalyze}
                  isLoading={isLoading}
                  onOpenCamera={() => setCameraModalOpen(true)}
                  selectedPreset={selectedPreset}
                  onSelectPreset={(preset) => {
                    setSelectedPreset(preset);
                    if (preset) {
                      loadPreset(preset);
                    }
                  }}
                  onNextStage={() => handleSelectStage(2)}
                  hasExistingDiagnosis={!!currentDiagnosis}
                />
              </div>
            )}

            {/* STAGE 2: Diagnostic Clarification Questionnaire */}
            {currentStage === 2 && currentDiagnosis && (
              <div className="animate-in fade-in duration-200">
                <DiagnosticSection
                  diagnosis={currentDiagnosis}
                  onRefineDiagnosis={handleRefineDiagnosis}
                  isRefining={isRefining}
                  onNextStage={() => handleSelectStage(3)}
                  onPrevStage={() => handleSelectStage(1)}
                />
              </div>
            )}

            {/* STAGE 3: Dedicated Safety PPE Checklist & Contractor Execution Procedure */}
            {currentStage === 3 && currentDiagnosis && (
              <div className="animate-in fade-in duration-200 py-6">
                {currentDiagnosis.safetyGear && (
                  <SafetyChecklist
                    safetyGear={currentDiagnosis.safetyGear}
                    jobCategory={currentDiagnosis.category}
                    onToggleGear={handleToggleGear}
                    onHaveAllGear={handleHaveAllGear}
                    onAddMissingToInventory={handleAddMissingPPEToInventory}
                    onNextStage={() => handleSelectStage(4)}
                    onPrevStage={() => handleSelectStage(2)}
                  />
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
                  <ExecutionSteps
                    steps={currentDiagnosis.steps}
                    jobTitle={currentDiagnosis.title}
                  />

                  {/* Stage navigation footer */}
                  <div className="mt-8 p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectStage(2)}
                      className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      ← Back to Diagnostic Q&amp;A
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectStage(4)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
                    >
                      <span>Proceed to Inventory Checklist (Stage 4) →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: Interactive Inventory Checklist (Tools & Materials with Have vs Missing Progress) */}
            {currentStage === 4 && currentDiagnosis && (
              <div className="animate-in fade-in duration-200 py-6">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                  <ChecklistSidePanel
                    items={currentDiagnosis.items}
                    onToggleItem={handleToggleItem}
                    onSetAllToolsHave={handleSetAllToolsHave}
                    onSetAllNeed={handleSetAllNeed}
                    onNextStage={() => handleSelectStage(5)}
                    onPrevStage={() => handleSelectStage(3)}
                    onDoItNow={() => handleSelectStage(3)}
                  />
                </div>
              </div>
            )}

            {/* STAGE 5: Store price comparison & handoff to main app */}
            {currentStage === 5 && currentDiagnosis && (
              <div className="animate-in fade-in duration-200">
                <PriceComparisonView
                  comparisons={storeComparisons}
                  missingItems={missingItems}
                  selectedStoreId={selectedStoreId}
                  onSelectStore={(id) => setSelectedStoreId(id)}
                  onOpenOrderModal={() => setOrderModalOpen(true)}
                  isLoadingStores={false}
                  onPrevStage={() => handleSelectStage(4)}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Camera Live Modal */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Hand the chosen store and items to the main delivery app */}
      <HandoffModal
        jobTitle={currentDiagnosis?.title ?? 'DIY job'}
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        selectedStoreComparison={selectedStoreComparison}
        missingItems={missingItems}
      />

      {/* On-Site Advisor AI: Positioned at bottom of page, collapsible, never obstructing the map */}
      <ContractorChatbot diagnosis={currentDiagnosis} />

      {/* Footer adhering to design contract */}
      <footer className="py-8 border-t border-slate-800/80 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-200">Online Builder AI</span>
            <span aria-hidden="true">·</span>
            <span>Step-by-Step DIY Diagnostic &amp; Nearby Inventory Engine</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Always shut off power/water before servicing utilities</span>
            <span aria-hidden="true">·</span>
            <span>Verify local building codes &amp; permits</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
