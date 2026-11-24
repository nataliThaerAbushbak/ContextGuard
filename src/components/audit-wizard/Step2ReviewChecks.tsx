import React, { useState } from 'react';
import { Check, Plus, Trash2, Edit2, HelpCircle, CheckCircle2 } from 'lucide-react';
import { CheckCategory, CheckItem } from '../../types/audit';

interface Step2ReviewChecksProps {
  checks: CheckItem[];
  onChangeChecks: (checks: CheckItem[]) => void;
  onBack: () => void;
  onApprove: () => void;
  onMarkStale?: () => void;
}

export const Step2ReviewChecks: React.FC<Step2ReviewChecksProps> = ({
  checks,
  onChangeChecks,
  onBack,
  onApprove,
  onMarkStale,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCheckText, setNewCheckText] = useState('');
  const [newCheckCategory, setNewCheckCategory] = useState<CheckCategory>('Core flow');

  const subjectiveWords = ['fast and easy', 'seamlessly', 'smoothly', 'intuitively', 'cleanly', 'properly', 'user-friendly'];

  const toggleCheckIncluded = (id: string) => {
    onChangeChecks(
      checks.map((c) => (c.id === id ? { ...c, included: !c.included } : c))
    );
    if (onMarkStale) onMarkStale();
  };

  const markResolved = (id: string) => {
    onChangeChecks(
      checks.map((c) =>
        c.id === id
          ? {
              ...c,
              is_ambiguous: false,
              clarification_question: undefined,
            }
          : c
      )
    );
    if (onMarkStale) onMarkStale();
  };

  const updateClarification = (id: string, answer: string) => {
    onChangeChecks(
      checks.map((c) =>
        c.id === id
          ? {
              ...c,
              clarification_answer: answer,
              is_ambiguous: answer.trim().length === 0,
              clarification_question: answer.trim().length > 0 ? undefined : c.clarification_question,
            }
          : c
      )
    );
    if (onMarkStale) onMarkStale();
  };

  const deleteCheck = (id: string) => {
    onChangeChecks(checks.filter((c) => c.id !== id));
    if (onMarkStale) onMarkStale();
  };

  const startEdit = (c: CheckItem) => {
    setEditingId(c.id);
    setEditText(c.text);
  };

  const saveEdit = (id: string) => {
    if (editText.trim()) {
      const lower = editText.toLowerCase();
      // Re-evaluate ambiguity upon text edit:
      const hasSubjective = subjectiveWords.some((w) => lower.includes(w));
      const hasMeasurable = lower.includes('seconds') || lower.includes('steps') || lower.includes('$') || lower.includes('within') || lower.includes('must');
      const isStillAmbiguous = hasSubjective && !hasMeasurable;

      onChangeChecks(
        checks.map((c) =>
          c.id === id
            ? {
                ...c,
                text: editText.trim(),
                is_ambiguous: isStillAmbiguous,
                clarification_question: isStillAmbiguous ? c.clarification_question : undefined,
              }
            : c
        )
      );
      if (onMarkStale) onMarkStale();
    }
    setEditingId(null);
  };

  const handleAddNewCheck = () => {
    if (!newCheckText.trim()) return;
    const newId = `check-${Date.now()}`;
    const newCheck: CheckItem = {
      id: newId,
      text: newCheckText.trim(),
      category: newCheckCategory,
      is_ambiguous: false,
      included: true,
    };
    onChangeChecks([...checks, newCheck]);
    setNewCheckText('');
    setIsAddingNew(false);
    if (onMarkStale) onMarkStale();
  };

  const includedCount = checks.filter((c) => c.included).length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Heading */}
      <div>
        <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#78716C] uppercase mb-1">
          STEP 2 OF 5
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917]">
          Review the extracted checks
        </h1>
        <p className="text-xs sm:text-sm text-[#78716C] mt-1">
          Keep the checklist precise. Ambiguous items stay unresolved until you clarify them.
        </p>
      </div>

      {/* Main Checklist Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 border border-[#EAE6DF] shadow-xs space-y-4">
        {checks.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#78716C]">
            No checks extracted yet. Please go back to step 1 and extract requirements.
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {checks.map((c, idx) => {
              const isEditing = editingId === c.id;

              return (
                <div
                  key={c.id}
                  className={`py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start justify-between gap-4 transition-colors ${
                    !c.included ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleCheckIncluded(c.id)}
                      className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                        c.included
                          ? 'bg-[#B45309] border-[#B45309] text-white'
                          : 'border-[#D6D0C7] hover:border-[#A8A29E] bg-white'
                      }`}
                      aria-label="Include check"
                    >
                      {c.included && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    {/* Text and Clarification details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-3 py-1.5 border border-[#B45309] rounded-lg text-sm text-[#1C1917] outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(c.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => saveEdit(c.id)}
                            className="px-3 py-1.5 bg-[#B45309] text-white text-xs font-semibold rounded-lg shrink-0"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-semibold text-[#1C1917]">
                            {idx + 1}. {c.text}
                          </span>
                          <span className="text-[11px] font-medium text-[#78716C] bg-[#F3F4F6] px-2 py-0.5 rounded">
                            {c.category}
                          </span>
                        </div>
                      )}

                      {/* Clarification prompt if ambiguous */}
                      {c.is_ambiguous && (
                        <div className="pt-1.5 space-y-2 bg-[#FFFBEB] p-3 rounded-xl border border-[#FEF3C7] max-w-2xl">
                          <div className="text-xs text-[#92400E] flex items-center gap-1.5 font-medium">
                            <HelpCircle className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                            <span>{c.clarification_question || 'Clarification needed for testability'}</span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              value={c.clarification_answer || ''}
                              onChange={(e) => updateClarification(c.id, e.target.value)}
                              placeholder="Answer or clarify to resolve ambiguity..."
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#D6D0C7] bg-white text-[#1C1917] placeholder:text-[#A8A29E] w-full outline-none focus:border-[#B45309]"
                            />
                            <button
                              type="button"
                              onClick={() => markResolved(c.id)}
                              className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-[#065F46] bg-[#D1FAE5] hover:bg-[#A7F3D0] px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark resolved</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Status Badge & Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-start">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        c.is_ambiguous
                          ? 'bg-[#FEF3C7] text-[#92400E]'
                          : 'bg-[#D1FAE5] text-[#065F46]'
                      }`}
                    >
                      {c.is_ambiguous ? 'Needs clarification' : 'Clear'}
                    </span>

                    <button
                      type="button"
                      onClick={() => (isEditing ? saveEdit(c.id) : startEdit(c))}
                      className="text-[#78716C] hover:text-[#1C1917] p-1.5 rounded hover:bg-[#F3F4F6] transition-colors"
                      title="Edit check text"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteCheck(c.id)}
                      className="text-[#78716C] hover:text-[#991B1B] p-1.5 rounded hover:bg-[#FEE2E2] transition-colors"
                      title="Remove check"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Inline Add Check */}
        {isAddingNew && (
          <div className="p-4 bg-[#F9F8F6] rounded-xl border border-[#EAE6DF] space-y-3 mt-4">
            <div className="text-xs font-bold text-[#1C1917] uppercase tracking-wide">
              Add New Check
            </div>
            <input
              type="text"
              value={newCheckText}
              onChange={(e) => setNewCheckText(e.target.value)}
              placeholder="e.g., User can apply a valid promo discount code"
              className="w-full text-sm p-2.5 rounded-lg border border-[#D6D0C7] bg-white outline-none focus:border-[#B45309]"
              autoFocus
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#78716C]">Category:</span>
                {(['Core flow', 'States', 'Errors', 'Navigation'] as CheckCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCheckCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                        newCheckCategory === cat
                          ? 'bg-[#B45309] text-white font-medium'
                          : 'bg-white border border-[#D6D0C7] text-[#57534E]'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
              <div className="flex items-center gap-2 self-end">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs text-[#78716C] hover:text-[#1C1917]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddNewCheck}
                  className="px-3 py-1.5 bg-[#B45309] text-white text-xs font-semibold rounded-lg hover:bg-[#9A3412]"
                >
                  Add check
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls matching Figma */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 sm:flex-none px-4 py-2.5 border border-[#D6D0C7] hover:border-[#A8A29E] hover:bg-[#F9F8F6] text-[#2D2A26] rounded-xl text-sm font-medium transition-colors text-center"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-[#D6D0C7] hover:border-[#A8A29E] hover:bg-[#F9F8F6] text-[#2D2A26] rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add check</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onApprove}
          disabled={includedCount === 0}
          className="inline-flex items-center justify-center gap-2 bg-[#B45309] hover:bg-[#9A3412] text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-xs disabled:opacity-50 active:scale-95"
        >
          <span>Approve checklist & continue →</span>
        </button>
      </div>
    </div>
  );
};
