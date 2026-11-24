import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, ChevronLeft, ChevronRight, Trash2, Edit3, Eye, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { ScreenItem } from '../../types/audit';
import { DEFAULT_SAMPLE_SCREENS } from '../../data/sampleData';
import {
  MAX_SCREENSHOTS_PER_AUDIT,
  DAILY_AI_RUN_LIMIT,
  hasReachedDailyAuditLimit,
  syncUsageFromServer,
} from '../../constants/limits';

interface Step3UploadFlowProps {
  screens: ScreenItem[];
  onChangeScreens: (screens: ScreenItem[]) => void;
  onBack: () => void;
  onRunAudit: () => void;
  onMarkStale?: () => void;
}

export const Step3UploadFlow: React.FC<Step3UploadFlowProps> = ({
  screens,
  onChangeScreens,
  onBack,
  onRunAudit,
  onMarkStale,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalScreen, setPreviewModalScreen] = useState<ScreenItem | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editLabelText, setEditLabelText] = useState('');
  const [uploadLimitMessage, setUploadLimitMessage] = useState<string | null>(null);
  const [isDailyLimitReached, setIsDailyLimitReached] = useState(hasReachedDailyAuditLimit());

  useEffect(() => {
    syncUsageFromServer().then(() => {
      setIsDailyLimitReached(hasReachedDailyAuditLimit());
    });
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (screens.length >= MAX_SCREENSHOTS_PER_AUDIT) {
      setUploadLimitMessage(`You can upload up to ${MAX_SCREENSHOTS_PER_AUDIT} screenshots per audit.`);
      return;
    }

    const availableSlots = MAX_SCREENSHOTS_PER_AUDIT - screens.length;
    let fileArray = Array.from(files);
    if (fileArray.length > availableSlots) {
      setUploadLimitMessage(`You can upload up to ${MAX_SCREENSHOTS_PER_AUDIT} screenshots per audit.`);
      fileArray = fileArray.slice(0, availableSlots);
    } else {
      setUploadLimitMessage(null);
    }

    const newScreens: ScreenItem[] = [];
    let loadedCount = 0;
    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const stepNum = screens.length + loadedCount + 1;
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          newScreens.push({
            id: `screen-${Date.now()}-${index}`,
            step_number: stepNum,
            label: cleanName || `Step ${stepNum}`,
            imageUrl: result,
            file_name: file.name,
          });
        }
        loadedCount++;
        if (loadedCount === fileArray.length) {
          onChangeScreens([...screens, ...newScreens]);
          if (onMarkStale) onMarkStale();
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const moveScreen = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= screens.length) return;

    const updated = [...screens];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reindexed = updated.map((s, idx) => ({ ...s, step_number: idx + 1 }));
    onChangeScreens(reindexed);
    if (onMarkStale) onMarkStale();
  };

  const removeScreen = (id: string) => {
    const filtered = screens.filter((s) => s.id !== id);
    const reindexed = filtered.map((s, idx) => ({ ...s, step_number: idx + 1 }));
    onChangeScreens(reindexed);
    if (filtered.length < MAX_SCREENSHOTS_PER_AUDIT) {
      setUploadLimitMessage(null);
    }
    if (onMarkStale) onMarkStale();
  };

  const saveLabel = (id: string) => {
    if (editLabelText.trim()) {
      onChangeScreens(
        screens.map((s) => (s.id === id ? { ...s, label: editLabelText.trim() } : s))
      );
      if (onMarkStale) onMarkStale();
    }
    setEditingLabelId(null);
  };

  const handleExplicitLoadSampleScreens = () => {
    onChangeScreens(DEFAULT_SAMPLE_SCREENS);
    if (onMarkStale) onMarkStale();
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Heading */}
      <div>
        <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#78716C] uppercase mb-1">
          STEP 3 OF 5
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917]">
          Upload the product flow
        </h1>
        <p className="text-xs sm:text-sm text-[#78716C] mt-1">
          Add screenshots in order (up to {MAX_SCREENSHOTS_PER_AUDIT} per audit). Labels help orientation but are never treated as proof.
        </p>
      </div>

      {/* Screenshot limit warning */}
      {uploadLimitMessage && (
        <div className="p-4 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-between gap-3 text-xs text-[#92400E] shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0" />
            <span className="font-semibold">{uploadLimitMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadLimitMessage(null)}
            className="text-[11px] font-bold text-[#B45309] hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Daily limit reached warning */}
      {isDailyLimitReached && (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-3 text-xs text-[#991B1B] shadow-xs">
          <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
          <div>
            <div className="font-bold">Daily AI usage limit reached. Please try again later.</div>
            <div className="text-[11px] text-[#7F1D1D] mt-0.5">
              To protect shared quota, ContextGuard allows up to {DAILY_AI_RUN_LIMIT} visual audits per day.
            </div>
          </div>
        </div>
      )}

      {/* Top Dropzone Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`bg-white rounded-2xl p-6 sm:p-10 border-2 border-dashed transition-all flex flex-col items-center justify-center text-center shadow-xs ${
          isDragging
            ? 'border-[#B45309] bg-[#FDF8F3]'
            : 'border-[#EAE6DF] hover:border-[#D6D0C7]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-10 h-10 rounded-full bg-[#FDF4EE] text-[#B45309] flex items-center justify-center mb-3">
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </div>

        <div className="text-sm font-semibold text-[#1C1917]">
          Drop screenshots here
        </div>
        <div className="text-xs text-[#78716C] mt-1 mb-4">
          PNG, JPG or WebP · up to 10 MB each
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 border border-[#D6D0C7] hover:border-[#A8A29E] bg-white text-[#2D2A26] rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-xs active:scale-95"
          >
            Browse files
          </button>

          {screens.length === 0 && (
            <button
              type="button"
              onClick={handleExplicitLoadSampleScreens}
              className="text-xs font-semibold text-[#B45309] hover:underline"
            >
              Load e-commerce sample screenshots
            </button>
          )}
        </div>
      </div>

      {/* Ordered Screenshots Sequence Cards */}
      {screens.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#78716C] font-semibold tracking-wider uppercase">
            <span>Ordered Flow Sequence ({screens.length} screens)</span>
            <span className="text-[11px] normal-case font-normal text-[#A8A29E]">
              Use arrows to reorder steps
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {screens.map((screen, idx) => {
              const isEditing = editingLabelId === screen.id;

              return (
                <div
                  key={screen.id}
                  className="bg-white rounded-2xl p-3 border border-[#EAE6DF] shadow-xs flex flex-col justify-between group hover:border-[#D6D0C7] transition-all"
                >
                  {/* Image Thumbnail Container */}
                  <div className="relative aspect-4/3 w-full bg-[#F9F8F6] rounded-xl overflow-hidden border border-[#F3F4F6] flex items-center justify-center">
                    {screen.imageUrl ? (
                      <img
                        src={screen.imageUrl}
                        alt={screen.label}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-[#D6D0C7]" />
                    )}

                    {/* Quick zoom preview button overlay */}
                    <button
                      type="button"
                      onClick={() => setPreviewModalScreen(screen)}
                      className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      title="Inspect screenshot"
                      aria-label="Inspect screenshot"
                    >
                      <Eye className="w-5 h-5 drop-shadow-md" />
                    </button>
                  </div>

                  {/* Label & Step Information */}
                  <div className="pt-3 pb-1">
                    <div className="text-[11px] font-semibold text-[#78716C]">
                      Step {screen.step_number}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="text"
                          value={editLabelText}
                          onChange={(e) => setEditLabelText(e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-[#B45309] rounded outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveLabel(screen.id);
                            if (e.key === 'Escape') setEditingLabelId(null);
                          }}
                        />
                        <button
                          onClick={() => saveLabel(screen.id)}
                          className="text-[10px] bg-[#B45309] text-white px-1.5 py-1 rounded font-bold"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingLabelId(screen.id);
                          setEditLabelText(screen.label);
                        }}
                        className="text-xs font-semibold text-[#1C1917] truncate hover:text-[#B45309] cursor-pointer flex items-center justify-between"
                        title="Click to edit label"
                      >
                        <span className="truncate">{screen.label}</span>
                        <Edit3 className="w-3 h-3 text-[#A8A29E] shrink-0 opacity-0 group-hover:opacity-100" />
                      </div>
                    )}
                  </div>

                  {/* Move Left / Right / Delete Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6] mt-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveScreen(idx, 'left')}
                        className="p-1 rounded text-[#78716C] hover:text-[#1C1917] disabled:opacity-20 hover:bg-[#F3F4F6]"
                        title="Move step left"
                        aria-label="Move step left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === screens.length - 1}
                        onClick={() => moveScreen(idx, 'right')}
                        className="p-1 rounded text-[#78716C] hover:text-[#1C1917] disabled:opacity-20 hover:bg-[#F3F4F6]"
                        title="Move step right"
                        aria-label="Move step right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeScreen(screen.id)}
                      className="p-1 rounded text-[#78716C] hover:text-[#991B1B] hover:bg-[#FEE2E2]"
                      title="Remove screen"
                      aria-label="Remove screen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white rounded-2xl border border-[#EAE6DF] text-center text-xs text-[#78716C]">
          No screenshots uploaded yet. Please add at least one screenshot to proceed with the visual audit.
        </div>
      )}

      {/* Footer Controls matching Figma */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 border border-[#D6D0C7] hover:border-[#A8A29E] hover:bg-[#F9F8F6] text-[#2D2A26] rounded-xl text-sm font-medium transition-colors text-center"
        >
          ← Back
        </button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {isDailyLimitReached && (
            <span className="text-xs font-semibold text-[#DC2626] text-center sm:text-right">
              Daily AI usage limit reached. Please try again later.
            </span>
          )}
          <button
            type="button"
            onClick={onRunAudit}
            disabled={screens.length === 0 || isDailyLimitReached}
            className="inline-flex items-center justify-center gap-2 bg-[#B45309] hover:bg-[#9A3412] text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-xs disabled:opacity-50 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Run visual audit →</span>
          </button>
        </div>
      </div>

      {/* Lightbox / Zoom Preview Modal */}
      {previewModalScreen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#EAE6DF]">
            <div className="p-4 border-b border-[#EAE6DF] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#B45309] uppercase mr-2">
                  Step {previewModalScreen.step_number}
                </span>
                <span className="text-sm font-bold text-[#1C1917]">
                  {previewModalScreen.label}
                </span>
              </div>
              <button
                onClick={() => setPreviewModalScreen(null)}
                className="p-1 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#F3F4F6]"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-[#F9F8F6]">
              <img
                src={previewModalScreen.imageUrl}
                alt={previewModalScreen.label}
                className="max-h-[75vh] w-auto rounded-lg shadow-xs object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
