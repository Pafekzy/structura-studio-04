import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Plus,
  Send,
  ShieldCheck,
  Building,
  UserCheck,
  FileCheck,
  XCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import {
  NonConformanceReport,
  NCRSeverity,
  ProjectMilestone,
  ProjectRole,
  ProjectEvidence,
} from '../../types';
import { useAuth } from '../../context/AuthContext';

interface NCRRegisterPanelProps {
  projectId: string;
  isDemo?: boolean;
}

export const NCRRegisterPanel: React.FC<NCRRegisterPanelProps> = ({
  projectId,
  isDemo,
}) => {
  const { userProfile, user, idToken } = useAuth();
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [evidenceList, setEvidenceList] = useState<ProjectEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);

  // Selected NCR
  const [selectedNcr, setSelectedNcr] = useState<NonConformanceReport | null>(null);

  // Create NCR modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMilestoneId, setCreateMilestoneId] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createSeverity, setCreateSeverity] = useState<NCRSeverity>('MAJOR');
  const [createRef, setCreateRef] = useState('');
  const [createObserved, setCreateObserved] = useState('');
  const [createCorrective, setCreateCorrective] = useState('');
  const [creating, setCreating] = useState(false);

  // Contractor Response form
  const [contractorResponse, setContractorResponse] = useState('');
  const [contractorRemediation, setContractorRemediation] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Auditor Close form
  const [auditorDecision, setAuditorDecision] = useState<'CLOSE' | 'REQUIRE_REINSPECTION' | 'REJECT_CORRECTIVE_ACTION'>('CLOSE');
  const [auditorNotes, setAuditorNotes] = useState('');
  const [submittingClose, setSubmittingClose] = useState(false);

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
      const [ncrRes, msRes, evRes] = await Promise.all([
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
      setError(err.message || 'Failed to load NCR register');
    } finally {
      setLoading(false);
    }
  }, [projectId, idToken]);

  useEffect(() => {
    fetchUserRole();
    loadData();
  }, [fetchUserRole, loadData]);

  const handleCreateNCR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createMilestoneId || !createTitle.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${createMilestoneId}/ncrs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: createTitle,
          description: createDescription,
          severity: createSeverity,
          requirementReference: createRef,
          observedCondition: createObserved,
          correctiveActionRequired: createCorrective,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create NCR');
      }

      setShowCreateModal(false);
      setCreateTitle('');
      setCreateDescription('');
      setCreateRef('');
      setCreateObserved('');
      setCreateCorrective('');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitContractorResponse = async (ncrId: string) => {
    if (!contractorResponse.trim() || !contractorRemediation.trim()) return;

    setSubmittingResponse(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/ncrs/${ncrId}/corrective-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          contractorResponse,
          correctiveActionDescription: contractorRemediation,
          correctiveEvidenceIds: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit corrective action');
      }

      setContractorResponse('');
      setContractorRemediation('');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleCloseNCR = async (ncrId: string) => {
    if (!auditorNotes.trim()) return;

    setSubmittingClose(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/ncrs/${ncrId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          decision: auditorDecision,
          reinspectionNotes: auditorNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record NCR resolution');
      }

      setAuditorNotes('');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingClose(false);
    }
  };

  const isAuditorOrDirector = userRole === 'STRUCTURAL_QA_QC_AUDITOR' || userRole === 'SENIOR_PROJECT_DIRECTOR';
  const isContractor = userRole === 'GENERAL_CONTRACTOR';
  const isAuditor = userRole === 'STRUCTURAL_QA_QC_AUDITOR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Non-Conformance Register (NCR)</span>
              </span>
              <span className="text-xs text-slate-400">Formal Quality Discrepancies</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Governed Quality Remediation & Corrective Action Tracking
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Every deviation from engineering specifications must be formally documented, rectified by the General Contractor, and independently re-inspected. Open NCRs strictly prevent milestone passage and fund eligibility.
            </p>
          </div>

          {isAuditorOrDirector && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Non-Conformance (NCR)</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: NCR list & selected detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* NCR List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Active Reports ({ncrs.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              Loading Non-Conformance reports...
            </div>
          ) : ncrs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              No Non-Conformance Reports on file. All inspected elements currently adhere to project specifications.
            </div>
          ) : (
            ncrs.map(ncr => {
              const ms = milestones.find(m => m.id === ncr.milestoneId);
              const isSelected = selectedNcr?.id === ncr.id;

              return (
                <div
                  key={ncr.id}
                  onClick={() => setSelectedNcr(ncr)}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {ncr.number} • {ncr.severity}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ncr.status === 'CLOSED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {ncr.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {ncr.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {ncr.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Target: {ms ? ms.title : ncr.milestoneId}</span>
                    <span>{new Date(ncr.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected NCR Workspace */}
        <div className="lg:col-span-7">
          {!selectedNcr ? (
            <div className="p-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500">
              Select an NCR from the register to view specification deviations, contractor corrective action plans, and re-inspection sign-offs.
            </div>
          ) : (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                      {selectedNcr.number} • Severity: {selectedNcr.severity}
                    </span>
                    <span className="text-xs text-slate-400">ID: {selectedNcr.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedNcr.title}
                  </h3>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedNcr.status === 'CLOSED'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {selectedNcr.status}
                </span>
              </div>

              {/* Observed Condition & Requirement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Observed Deficient Condition
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedNcr.observedCondition || selectedNcr.description}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Specification Reference / Requirement
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedNcr.requirementReference || 'Project Structural Engineering Specifications'}
                  </p>
                </div>
              </div>

              {/* Required Remediation */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Mandated Corrective Action
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedNcr.correctiveActionRequired}
                </p>
              </div>

              {/* Contractor Remediation Response */}
              {selectedNcr.contractorResponse ? (
                <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 dark:text-blue-300 text-[11px]">
                      Contractor Remediation Submission
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedNcr.correctiveActionSubmittedAt ? new Date(selectedNcr.correctiveActionSubmittedAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedNcr.contractorResponse}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 italic text-[11px]">
                    Action Taken: {selectedNcr.correctiveActionDescription}
                  </p>
                </div>
              ) : null}

              {/* Closed details if closed */}
              {selectedNcr.status === 'CLOSED' && (
                <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>NCR Verified & Closed by Auditor</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    {selectedNcr.reinspectionNotes || 'Remedial work confirmed compliant during site re-inspection.'}
                  </p>
                  <span className="text-[10px] text-slate-400 block">
                    Closed by: {selectedNcr.closedByName} • {selectedNcr.closedAt ? new Date(selectedNcr.closedAt).toLocaleDateString() : ''}
                  </span>
                </div>
              )}

              {/* Contractor Submit Response Form */}
              {isContractor && selectedNcr.status !== 'CLOSED' && (
                <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 space-y-4">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <RotateCcw className="w-4 h-4" />
                    <span>General Contractor Corrective Action Submission</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Contractor Remediation Statement <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={contractorResponse}
                      onChange={e => setContractorResponse(e.target.value)}
                      placeholder="Explain the root cause and site actions performed to address the non-conformance..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Remediation Description / Re-test Evidence <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={contractorRemediation}
                      onChange={e => setContractorRemediation(e.target.value)}
                      placeholder="List epoxy grout batch numbers, supplementary rebar ties, or ultrasonic test results..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSubmitContractorResponse(selectedNcr.id)}
                      disabled={submittingResponse || !contractorResponse.trim()}
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                    >
                      {submittingResponse ? 'Submitting...' : 'Submit Remediation Plan'}
                    </button>
                  </div>
                </div>
              )}

              {/* Auditor Close / Reinspection Form */}
              {isAuditor && selectedNcr.status !== 'CLOSED' && (
                <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-4">
                  <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Structural QA/QC Auditor Re-inspection & Sign-off</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Audit Determination <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={auditorDecision}
                      onChange={e => setAuditorDecision(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="CLOSE">CLOSE NCR (Remedial work verified compliant with structural codes)</option>
                      <option value="REQUIRE_REINSPECTION">REQUIRE_REINSPECTION (In-situ test or cure period pending)</option>
                      <option value="REJECT_CORRECTIVE_ACTION">REJECT_CORRECTIVE_ACTION (Remediation inadequate, contractor must revise)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Auditor Re-inspection Notes <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={auditorNotes}
                      onChange={e => setAuditorNotes(e.target.value)}
                      placeholder="Detail inspection observations on repaired section, re-checked spacing, core test results..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleCloseNCR(selectedNcr.id)}
                      disabled={submittingClose || !auditorNotes.trim()}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition disabled:opacity-50"
                    >
                      {submittingClose ? 'Recording...' : 'Record Auditor Decision'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Raise NCR Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Issue Non-Conformance Report (NCR)</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNCR} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Milestone <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createMilestoneId}
                  onChange={e => setCreateMilestoneId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">Select Milestone...</option>
                  {milestones.map(m => (
                    <option key={m.id} value={m.id}>
                      #{m.sequence} - {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deficiency Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)}
                  placeholder="e.g. Excessive Rebar Congestion at Beam-Column Joint"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Severity Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createSeverity}
                  onChange={e => setCreateSeverity(e.target.value as NCRSeverity)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  <option value="CRITICAL">CRITICAL (Direct safety or structural capacity hazard)</option>
                  <option value="MAJOR">MAJOR (Substantial code or specification variance)</option>
                  <option value="MINOR">MINOR (Workmanship or non-critical detailing issue)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Specification Requirement Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={createRef}
                  onChange={e => setCreateRef(e.target.value)}
                  placeholder="e.g. Drawing S-204 Detail 3; ACI 318 Section 25.2"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Observed Non-Compliant Condition <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={createObserved}
                  onChange={e => setCreateObserved(e.target.value)}
                  placeholder="Describe exact field observations, measured clearances, or photographic records..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mandated Corrective Action <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={createCorrective}
                  onChange={e => setCreateCorrective(e.target.value)}
                  placeholder="State required remediation (e.g. redesign bar placement, core drill sample, chipping & re-pour)..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm disabled:opacity-50"
                >
                  {creating ? 'Issuing...' : 'Issue NCR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
