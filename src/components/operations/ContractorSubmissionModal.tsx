import React, { useState } from 'react';
import {
  X,
  Send,
  Save,
  FileCheck,
  AlertCircle,
  Paperclip,
  Check,
  Building,
  Info
} from 'lucide-react';
import { ProjectMilestone, ProjectEvidence, ContractorMilestoneSubmission } from '../../types';

interface ContractorSubmissionModalProps {
  milestone: ProjectMilestone;
  existingSubmission: ContractorMilestoneSubmission | null;
  availableEvidence: ProjectEvidence[];
  onClose: () => void;
  onSaveDraft: (data: { title: string; summary: string; contractorNotes: string; evidenceIds: string[] }) => Promise<void>;
  onSubmitPackage: (data: { title: string; summary: string; contractorNotes: string; evidenceIds: string[]; notes?: string }) => Promise<void>;
}

export const ContractorSubmissionModal: React.FC<ContractorSubmissionModalProps> = ({
  milestone,
  existingSubmission,
  availableEvidence,
  onClose,
  onSaveDraft,
  onSubmitPackage,
}) => {
  const [title, setTitle] = useState(
    existingSubmission?.title || `Contractor Work Package: ${milestone.title}`
  );
  const [summary, setSummary] = useState(
    existingSubmission?.summary || ''
  );
  const [contractorNotes, setContractorNotes] = useState(
    existingSubmission?.contractorNotes || ''
  );
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>(
    existingSubmission?.evidenceIds || (milestone.relatedEvidenceIds || [])
  );
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEvidence = (id: string) => {
    setSelectedEvidenceIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setError('Submission title is required.');
      return;
    }
    if (!summary.trim() || summary.trim().length < 10) {
      setError('Executive summary must be at least 10 characters.');
      return;
    }
    setError(null);
    try {
      setSaving(true);
      await onSaveDraft({
        title: title.trim(),
        summary: summary.trim(),
        contractorNotes: contractorNotes.trim(),
        evidenceIds: selectedEvidenceIds,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Submission title is required.');
      return;
    }
    if (!summary.trim() || summary.trim().length < 10) {
      setError('Executive summary must be at least 10 characters.');
      return;
    }
    if (selectedEvidenceIds.length === 0) {
      setError('Governance requirement: At least one registered project evidence record must be attached before submitting.');
      return;
    }
    setError(null);
    try {
      setSubmitting(true);
      await onSubmitPackage({
        title: title.trim(),
        summary: summary.trim(),
        contractorNotes: contractorNotes.trim(),
        evidenceIds: selectedEvidenceIds,
        notes: submissionNotes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit work package.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {existingSubmission ? 'Edit Contractor Submission' : 'Prepare Work Package Submission'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Milestone #{milestone.sequence}: {milestone.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Governance Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="font-semibold">General Contractor Governance Notice</p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Submitting this package forwards it directly to the Senior Project Director for technical review. You cannot self-approve your work package. Ensure all supporting verification test records are selected.
              </p>
            </div>
          </div>

          {/* Submission Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Work Package Submission Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. Foundation Raft Slab Complete Rebar & Pour Package"
            />
          </div>

          {/* Executive Summary */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Executive Summary & Scope Accomplished <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              placeholder="Detail the completed site operations, specifications adhered to, and completion metrics..."
            />
          </div>

          {/* Contractor Site Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Contractor Site Notes & Compliance Statements
            </label>
            <textarea
              rows={2}
              value={contractorNotes}
              onChange={e => setContractorNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              placeholder="Optional notes regarding inspections, curing durations, deviations, or site conditions..."
            />
          </div>

          {/* Attached Evidence Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                <span>Attach Project Evidence <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedEvidenceIds.length} attached
              </span>
            </div>

            {availableEvidence.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                No project evidence registered yet. Please register test results or site photos in the Project Evidence register first.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {availableEvidence.map(ev => {
                  const isSelected = selectedEvidenceIds.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => toggleEvidence(ev.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-amber-500/50 bg-amber-50/40 dark:bg-amber-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {ev.evidenceType}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {ev.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {ev.description}
                        </p>
                        <div className="text-[10px] text-slate-400">
                          Ref: <span className="font-mono text-slate-600 dark:text-slate-300">{ev.storageReference}</span> • {ev.fileName}
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isSelected
                            ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submission Notes for resubmission or notes to Director */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Cover Note to Senior Project Director (Optional)
            </label>
            <input
              type="text"
              value={submissionNotes}
              onChange={e => setSubmissionNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. Ready for technical audit. Concrete break cylinders exceed spec."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving || submitting}
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save as Draft'}</span>
            </button>

            <button
              type="button"
              disabled={saving || submitting}
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit for Technical Review'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
