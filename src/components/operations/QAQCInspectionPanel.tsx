import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Plus,
  Info,
  Paperclip,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import {
  QAQCInspection,
  QAQCInspectionStatus,
  NonConformanceReport,
  ProjectMilestone,
  ProjectEvidence,
  ProjectRole,
} from '../../types';
import { useAuth } from '../../context/AuthContext';

interface QAQCInspectionPanelProps {
  projectId: string;
  isDemo?: boolean;
}

export const QAQCInspectionPanel: React.FC<QAQCInspectionPanelProps> = ({
  projectId,
  isDemo,
}) => {
  const { userProfile, user, idToken } = useAuth();
  const [inspections, setInspections] = useState<QAQCInspection[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [evidenceList, setEvidenceList] = useState<ProjectEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);

  // Selected inspection for detail/decision
  const [selectedInspection, setSelectedInspection] = useState<QAQCInspection | null>(null);

  // Start inspection modal state
  const [showStartModal, setShowStartModal] = useState(false);
  const [startMilestoneId, setStartMilestoneId] = useState('');
  const [startType, setStartType] = useState('Structural Reinforcement & Formwork');
  const [startNotes, setStartNotes] = useState('');
  const [starting, setStarting] = useState(false);

  // Decision form state
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionType, setDecisionType] = useState<QAQCInspectionStatus>('PASSED');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Fetch project role
  const fetchUserRole = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/access`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.effectiveRole || null);
      }
    } catch {
      // Fallback
    }
  }, [projectId, idToken]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inspRes, ncrRes, msRes, evRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/qaqc-inspections`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch(`/api/projects/${projectId}/ncrs`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch(`/api/projects/${projectId}/milestones`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch(`/api/projects/${projectId}/evidence`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
      ]);

      if (inspRes.ok) {
        const data = await inspRes.json();
        setInspections(data.inspections || []);
      }
      if (ncrRes.ok) {
        const data = await ncrRes.json();
        setNcrs(data.ncrs || []);
      }
      if (msRes.ok) {
        const data = await msRes.json();
        setMilestones(data.milestones || []);
      }
      if (evRes.ok) {
        const data = await evRes.json();
        setEvidenceList(data.evidence || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load QA/QC audit data');
    } finally {
      setLoading(false);
    }
  }, [projectId, idToken]);

  useEffect(() => {
    fetchUserRole();
    loadData();
  }, [fetchUserRole, loadData]);

  const handleStartInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startMilestoneId || !startNotes.trim()) return;

    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${startMilestoneId}/qaqc/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          inspectionType: startType,
          inspectionNotes: startNotes,
          evidenceIds: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start inspection');
      }

      setShowStartModal(false);
      setStartNotes('');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleDecideInspection = async (inspectionId: string) => {
    if (!decisionNotes.trim()) return;

    setSubmittingDecision(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/qaqc-inspections/${inspectionId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          decision: decisionType,
          inspectionNotes: decisionNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record inspection decision');
      }

      setDecisionNotes('');
      setSelectedInspection(null);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const isAuditor = userRole === 'STRUCTURAL_QA_QC_AUDITOR';
  const openNCRs = ncrs.filter(n => n.status !== 'CLOSED');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                <span>Structural QA/QC Inspection Gate</span>
              </span>
              <span className="text-xs text-slate-400">Sprint 04C Core Boundary</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Independent Quality Assurance & Verification Audits
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Enforces structural engineering compliance, non-conformance remediation, and independent auditor gates. Technical Director acceptance does NOT bypass QA/QC verification.
            </p>
          </div>

          {isAuditor && (
            <button
              onClick={() => setShowStartModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate QA/QC Audit</span>
            </button>
          )}
        </div>

        {/* Warning if open NCRs exist */}
        {openNCRs.length > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Active Quality Alert:</strong> {openNCRs.length} unresolved Non-Conformance Report(s) active on this project. Inspections cannot be marked PASSED until all NCRs are formally closed.
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Inspections List & Inspection Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inspections List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Inspection Records ({inspections.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              Loading QA/QC inspection records...
            </div>
          ) : inspections.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              No QA/QC inspections conducted on this project yet.
            </div>
          ) : (
            inspections.map(insp => {
              const ms = milestones.find(m => m.id === insp.milestoneId);
              const isSelected = selectedInspection?.id === insp.id;

              return (
                <div
                  key={insp.id}
                  onClick={() => setSelectedInspection(insp)}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-950/20 ring-1 ring-purple-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {insp.inspectionType}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        insp.inspectionStatus === 'PASSED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : insp.inspectionStatus === 'FAILED'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                      }`}
                    >
                      {insp.inspectionStatus}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {ms ? ms.title : `Milestone: ${insp.milestoneId}`}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {insp.inspectionNotes}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Auditor: {insp.inspectorName}</span>
                    <span>{new Date(insp.startedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Inspection Workspace */}
        <div className="lg:col-span-7">
          {!selectedInspection ? (
            <div className="p-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500">
              Select an inspection record from the register to view findings, test verifications, and auditor decisions.
            </div>
          ) : (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">
                      {selectedInspection.inspectionType}
                    </span>
                    <span className="text-xs text-slate-400">ID: {selectedInspection.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {milestones.find(m => m.id === selectedInspection.milestoneId)?.title || 'Milestone Inspection'}
                  </h3>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedInspection.inspectionStatus === 'PASSED'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : selectedInspection.inspectionStatus === 'FAILED'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                  }`}
                >
                  {selectedInspection.inspectionStatus}
                </span>
              </div>

              {/* Auditor & Notes */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Auditor Inspection Log & Assessment
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedInspection.inspectionNotes}
                </div>
              </div>

              {/* Inspector metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Lead Auditor</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedInspection.inspectorName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Started Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {new Date(selectedInspection.startedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Status</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedInspection.inspectionStatus}
                  </span>
                </div>
              </div>

              {/* Decision Section (Auditor only) */}
              {isAuditor && selectedInspection.inspectionStatus === 'IN_PROGRESS' && (
                <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-4">
                  <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Record Official QA/QC Auditor Determination</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Determination Gate <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={decisionType}
                      onChange={e => setDecisionType(e.target.value as QAQCInspectionStatus)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="PASSED">PASSED (All quality checks & tests meet specifications)</option>
                      <option value="FAILED">FAILED (Non-conformance detected; NCR required)</option>
                      <option value="HOLD">HOLD (Pending additional cylinder breaks/laboratory testing)</option>
                      <option value="REINSPECTION_REQUIRED">REINSPECTION_REQUIRED (Remedial re-test needed)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Auditor Sign-off Notes & Findings <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={decisionNotes}
                      onChange={e => setDecisionNotes(e.target.value)}
                      placeholder="Detail inspection observations, rebar spacing verification, ultrasonic test numbers, or failure justifications..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDecideInspection(selectedInspection.id)}
                      disabled={submittingDecision || !decisionNotes.trim()}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition disabled:opacity-50"
                    >
                      {submittingDecision ? 'Submitting...' : 'Record Auditor Decision'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Start Inspection Modal */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>Initiate QA/QC Inspection Audit</span>
              </h3>
              <button
                onClick={() => setShowStartModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartInspection} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Milestone <span className="text-rose-500">*</span>
                </label>
                <select
                  value={startMilestoneId}
                  onChange={e => setStartMilestoneId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">Select Milestone requiring QA/QC review...</option>
                  {milestones
                    .filter(m => m.requiresQaQcReview)
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        #{m.sequence} - {m.title} ({m.status})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Inspection Scope / Type <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={startType}
                  onChange={e => setStartType(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Audit Protocol / Entry Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={startNotes}
                  onChange={e => setStartNotes(e.target.value)}
                  required
                  placeholder="State inspection standards (e.g. ACI 318, ASTM C39), rebar clearance tolerances, or field verification checklist..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={starting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm disabled:opacity-50"
                >
                  {starting ? 'Initiating...' : 'Start Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
