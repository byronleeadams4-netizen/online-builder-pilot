import React, { useState } from 'react';
import { Camera, Upload, Sparkles, ArrowRight, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { PRESET_SCENARIOS } from '../data/presets';
import { PresetScenario } from '../types/diy';

interface SnapshotCaptureProps {
  onAnalyze: (data: {
    imageBase64?: string;
    mimeType?: string;
    userNotes?: string;
    presetId?: string;
    presetTitle?: string;
    imageUrl?: string;
  }) => void;
  isLoading: boolean;
  onOpenCamera: () => void;
  selectedPreset: PresetScenario | null;
  onSelectPreset: (preset: PresetScenario | null) => void;
  onNextStage?: () => void;
  hasExistingDiagnosis?: boolean;
}

export const SnapshotCapture: React.FC<SnapshotCaptureProps> = ({
  onAnalyze,
  isLoading,
  onOpenCamera,
  selectedPreset,
  onSelectPreset,
  onNextStage,
  hasExistingDiagnosis,
}) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      onSelectPreset(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (selectedPreset) {
      onAnalyze({
        presetId: selectedPreset.id,
        presetTitle: selectedPreset.title,
        imageUrl: selectedPreset.imagePath,
        userNotes: userNotes || selectedPreset.userPrompt,
      });
    } else if (uploadedImage) {
      onAnalyze({
        imageBase64: uploadedImage,
        mimeType: 'image/jpeg',
        userNotes: userNotes,
        imageUrl: uploadedImage,
      });
    }
  };

  const currentPreview = selectedPreset?.imagePath || uploadedImage;

  return (
    <section id="triage-section" className="py-6 sm:py-8 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section title & subtitle */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1.5">
            <span>Visual Triage &amp; Job Intake</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">Step 1 of 4</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white text-balance">
            Capture Your DIY Scenario for AI Diagnosis &amp; Inventory Triage
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-3xl">
            Take a snapshot of your repair or building job. Online Builder AI inspects the materials, asks targeted
            clarifying questions, and builds an accurate tool &amp; material checklist with real-time hardware store prices.
          </p>
        </div>

        {/* 2-Column Grid: Upload / Preview on Left, Preset Scenarios on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Dropzone & Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Scenario Snapshot
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Camera</span>
                  </button>
                  {uploadedImage && (
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Viewport / Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`relative aspect-16/10 rounded-xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center ${
                  dragActive
                    ? 'border-amber-400 bg-amber-500/10'
                    : currentPreview
                    ? 'border-slate-750 bg-black/40'
                    : 'border-dashed border-slate-750 hover:border-slate-600 bg-slate-950/60'
                }`}
              >
                {currentPreview ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={currentPreview}
                      alt="DIY Scenario preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
                      <span className="font-medium bg-black/60 backdrop-blur-md px-2.5 py-1 rounded">
                        {selectedPreset ? selectedPreset.title : 'Custom Uploaded Photo'}
                      </span>
                      <span className="text-amber-300 font-mono text-[11px] bg-black/60 px-2 py-0.5 rounded">
                        Ready for AI Triage
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
                      <Upload className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-200 mb-1">
                      Drag &amp; drop scenario photo or browse files
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mb-4">
                      PNG, JPG, or WEBP up to 20MB. Clear close-ups yield the most accurate material specs.
                    </p>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors">
                        <span>Browse Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={onOpenCamera}
                        className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                      >
                        Use Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Note input & CTA */}
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Extra Details / Specific Goals (Optional)
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder={
                  selectedPreset
                    ? selectedPreset.userPrompt
                    : 'e.g. Need to mount a 30lb shelf, pipe is dripping under vanity, power is turned off at breaker...'
                }
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none transition-all"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  {currentPreview ? 'Photo attached · 1-click AI triage' : 'Select a preset or upload a snapshot'}
                </span>
                <div className="flex items-center gap-2">
                  {hasExistingDiagnosis && onNextStage && (
                    <button
                      type="button"
                      onClick={onNextStage}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all cursor-pointer"
                    >
                      <span>View Current Diagnosis →</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!currentPreview || isLoading}
                    onClick={handleSubmit}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                      currentPreview && !isLoading
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md hover:shadow-amber-500/20 active:scale-98 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-slate-900" />
                        <span>Diagnosing Scenario...</span>
                      </>
                    ) : (
                      <>
                        <span>Analyze &amp; Diagnose Job</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Preloaded Realistic Presets (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 sm:p-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Or Test Realistic Presets
                </span>
                <span className="text-xs text-slate-400">Instant Demo</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Don&apos;t have a photo handy? Pick an authentic home repair case study to see how Online Builder AI handles physical diagnosis and hardware matching:
              </p>

              <div className="space-y-2.5">
                {PRESET_SCENARIOS.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id && !uploadedImage;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setUploadedImage(null);
                        onSelectPreset(preset);
                        setUserNotes(preset.userPrompt);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400/80 shadow-sm'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-slate-900">
                        <img
                          src={preset.imagePath}
                          alt={preset.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-amber-400 drop-shadow" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                          <span className="text-amber-400/90 font-medium">{preset.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{preset.difficulty}</span>
                        </div>
                        <h2 className="text-xs font-bold text-slate-200 truncate">
                          {preset.title}
                        </h2>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {preset.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Verified hardware specs</span>
              <span className="font-mono text-slate-400">Mica · Builders · DIY</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
