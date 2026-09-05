import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Info,
  Building,
  UserCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import {
  OwnerMilestoneDecision,
  OwnerDecisionType,
  ProjectMilestone,
  ProjectRole,
} from '../../types';
import { useAuth } from '../../context/AuthContext';

interface OwnerDecisionPanelProps {
  projectId: string;
  isDemo?: boolean;
}

export const OwnerDecisionPanel: React.FC<OwnerDecisionPanelProps> = ({
  projectId,
  isDemo,
}) => {
  const { userProfile, user, idToken } = useAuth();
  const [decisions, setDecisions] = useState<OwnerMilestoneDecision[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);

  // Selected Milestone for Decision
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);
  const [decisionType, setDecisionType] = useState<OwnerDecisionType>('APPROVE');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

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
      const [decRes, msRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/owner-decisions`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch(`/api/projects/${projectId}/milestones`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
      ]);

      if (decRes.ok) {
        const data = await decRes.json();
        setDecisions(data.decisions || []);
      }
      if (msRes.ok) {
        const data = await msRes.json();
        setMilestones(data.milestones || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load Owner governance data');
    } finally {
      setLoading(false);
    }
  }, [projectId, idToken]);

  useEffect(() => {
    fetchUserRole();
    loadData();
  }, [fetchUserRole, loadData]);

  const handleMakeDecision = async (milestoneId: string) => {
    if (!decisionNotes.trim()) return;

    setSubmittingDecision(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}/owner-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          decision: decisionType,
          decisionNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit Owner decision');
      }

      setDecisionNotes('');
      setSelectedMilestone(null);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const isOwner = userRole === 'OWNER_CLIENT';
  const readyMilestones = milestones.filter(m => m.status === 'READY_FOR_OWNER_REVIEW');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-emerald-400" />
                <span>Owner Milestone Governance Decision</span>
              </span>
              <span className="text-xs text-slate-400">Final Acceptance Gate</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Building Owner Authorization & Financial Processing Boundary
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Provides client-side fiduciary sign-off following Senior Project Director technical acceptance and Structural QA/QC auditor inspection pass.
            </p>
          </div>
        </div>

        {/* Financial Boundary Truthfulness Card */}
        <div className="mt-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3">
          <DollarSign className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Financial Governance Boundary (Sprint 04C):</span>
            <p className="leading-relaxed text-[11px] text-emerald-200">
              Owner approval authorizes the milestone for financial processing (eligibility boundary). It does NOT constitute fund settlement, bank wire, or payment release. Structura does not integrate external settlement providers during Sprint 04C (BMONI not connected).
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Milestones ready for review & Decision pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ready Milestones List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Owner Action ({readyMilestones.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              Loading governance register...
            </div>
          ) : readyMilestones.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              No milestones currently awaiting Owner decision. Milestones appear here once Technical Review and QA/QC Inspection gates pass.
            </div>
          ) : (
            readyMilestones.map(ms => {
              const isSelected = selectedMilestone?.id === ms.id;

              return (
                <div
                  key={ms.id}
                  onClick={() => setSelectedMilestone(ms)}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      #{ms.sequence} • {ms.discipline}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {ms.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {ms.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {ms.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Value: ${ms.costAllocationUSD?.toLocaleString() || 'N/A'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">QA/QC: {ms.qaQcStatus}</span>
                  </div>
                </div>
              );
            })
          )}

          {/* Historical Decisions list */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Historical Owner Decisions ({decisions.length})
            </h4>
            {decisions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No historical Owner decisions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {decisions.map(dec => (
                  <div
                    key={dec.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className={dec.decision === 'APPROVE' ? 'text-emerald-600' : 'text-rose-600'}>
                        {dec.decision}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(dec.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      "{dec.decisionNotes}"
                    </p>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Financial Status: {dec.financialStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Milestone Decision Workspace */}
        <div className="lg:col-span-7">
          {!selectedMilestone ? (
            <div className="p-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500">
              Select a milestone awaiting decision to inspect verification trail and record client governance determination.
            </div>
          ) : (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                      Milestone #{selectedMilestone.sequence}
                    </span>
                    <span className="text-xs text-slate-400">Discipline: {selectedMilestone.discipline}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedMilestone.title}
                  </h3>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {selectedMilestone.status}
                </span>
              </div>

              {/* Clearance Status Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-1">
                  <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase block">
                    Technical Review
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedMilestone.technicalReviewStatus}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-1">
                  <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase block">
                    Structural QA/QC Gate
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedMilestone.qaQcStatus}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                    Valuation Allocation
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${selectedMilestone.costAllocationUSD?.toLocaleString() || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Owner Decision Form (Owner only) */}
              {isOwner ? (
                <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                    <span>Execute Building Owner / Client Determination</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Owner Governance Action <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={decisionType}
                      onChange={e => setDecisionType(e.target.value as OwnerDecisionType)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="APPROVE">APPROVE (Authorize milestone & mark eligible for financial processing)</option>
                      <option value="RETURN">RETURN (Request additional documentation or field verification)</option>
                      <option value="REJECT">REJECT (Reject milestone completion)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Client Sign-off Rationale & Notes <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={decisionNotes}
                      onChange={e => setDecisionNotes(e.target.value)}
                      placeholder="State client approval rationale, verified deliverables, or return justifications..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleMakeDecision(selectedMilestone.id)}
                      disabled={submittingDecision || !decisionNotes.trim()}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50"
                    >
                      {submittingDecision ? 'Recording...' : 'Register Owner Determination'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-500 text-center">
                  Only the appointed Building Owner / Client can execute formal milestone approvals.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
