import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileCheck,
  Send,
  Building,
  UserCheck,
  Calendar,
  DollarSign,
  Paperclip,
  ChevronRight,
  ShieldCheck,
  Info,
  RefreshCw,
  Plus,
  Play,
  RotateCcw,
  Check,
  ArrowUpRight,
  X
} from 'lucide-react';
import {
  ProjectMilestone,
  ProjectMilestoneStatus,
  ProjectEvidence,
  ContractorMilestoneSubmission,
  ProjectDirectorTechnicalReview,
  ProjectRole,
  TechnicalReviewDecision,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ContractorSubmissionModal } from './ContractorSubmissionModal';

interface MilestonesRegisterPanelProps {
  projectId: string;
  isDemo?: boolean;
}

const STATUS_CONFIG: Record<
  ProjectMilestoneStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  NOT_STARTED: {
    label: 'Not Started',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
  },
  SUBMITTED_FOR_REVIEW: {
    label: 'Submitted for Review',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  TECHNICAL_REVIEW: {
    label: 'Technical Review',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/30',
  },
  QA_QC_HOLD: {
    label: 'QA/QC Inspection Hold',
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
  },
  READY_FOR_OWNER_REVIEW: {
    label: 'Ready for Owner Review',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/30',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
  },
  COMPLETE: {
    label: 'Completed',
    bg: 'bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/30',
  },
};

export const MilestonesRegisterPanel: React.FC<MilestonesRegisterPanelProps> = ({
  projectId,
  isDemo,
}) => {
  const { userProfile, user, idToken } = useAuth();
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [evidenceList, setEvidenceList] = useState<ProjectEvidence[]>([]);
  const [submissions, setSubmissions] = useState<ContractorMilestoneSubmission[]>([]);
  const [technicalReviews, setTechnicalReviews] = useState<ProjectDirectorTechnicalReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);

  // Selected Milestone for detail view
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Contractor Submission Modal state
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  // Director Review state
  const [reviewDecision, setReviewDecision] = useState<TechnicalReviewDecision>('ACCEPT_TECHNICAL_SUBMISSION');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Start Milestone state
  const [startingMilestone, setStartingMilestone] = useState(false);

  const fetchMilestonesData = useCallback(async () => {
    if (!idToken) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Milestones
      const msRes = await fetch(`/api/projects/${projectId}/milestones`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!msRes.ok) {
        const data = await msRes.json();
        throw new Error(data.error || 'Failed to load milestones');
      }
      const msData = await msRes.json();
      const loadedMilestones: ProjectMilestone[] = msData.milestones || [];
      setMilestones(loadedMilestones);

      // Keep selectedMilestone in sync if open
      if (selectedMilestone) {
        const updatedSelected = loadedMilestones.find(m => m.id === selectedMilestone.id);
        if (updatedSelected) setSelectedMilestone(updatedSelected);
      } else if (loadedMilestones.length > 0) {
        setSelectedMilestone(loadedMilestones[0]);
      }

      // 2. Fetch Evidence
      const evRes = await fetch(`/api/projects/${projectId}/evidence`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvidenceList(evData.evidence || []);
      }

      // 3. Fetch Submissions
      const subRes = await fetch(`/api/projects/${projectId}/submissions`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmissions(subData.submissions || []);
      }

      // 4. Fetch Technical Reviews
      const revRes = await fetch(`/api/projects/${projectId}/technical-reviews`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (revRes.ok) {
        const revData = await revRes.json();
        setTechnicalReviews(revData.reviews || []);
      }

      // 5. Resolve user role
      const chRes = await fetch(`/api/projects/${projectId}/direct-line/channels`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (chRes.ok) {
        const chData = await chRes.json();
        setUserRole(chData.userRole);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to access milestone register');
    } finally {
      setLoading(false);
    }
  }, [idToken, projectId, selectedMilestone?.id]);

  useEffect(() => {
    fetchMilestonesData();
  }, [idToken, projectId]);

  // Handle Contractor starting milestone
  const handleStartMilestone = async (milestoneId: string) => {
    if (!idToken || startingMilestone) return;
    try {
      setStartingMilestone(true);
      setError(null);
      const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start milestone');
      }
      await fetchMilestonesData();
    } catch (err: any) {
      setError(err.message || 'Error starting milestone');
    } finally {
      setStartingMilestone(false);
    }
  };

  // Handle saving contractor submission draft
  const handleSaveDraft = async (data: {
    title: string;
    summary: string;
    contractorNotes: string;
    evidenceIds: string[];
  }) => {
    if (!idToken || !selectedMilestone) return;
    const res = await fetch(
      `/api/projects/${projectId}/milestones/${selectedMilestone.id}/submissions/draft`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save submission draft');
    }
    await fetchMilestonesData();
  };

  // Handle contractor submitting package
  const handleSubmitPackage = async (data: {
    title: string;
    summary: string;
    contractorNotes: string;
    evidenceIds: string[];
    notes?: string;
  }) => {
    if (!idToken || !selectedMilestone) return;

    // First save draft to ensure all latest text and evidence are persisted
    const draftRes = await fetch(
      `/api/projects/${projectId}/milestones/${selectedMilestone.id}/submissions/draft`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: data.title,
          summary: data.summary,
          contractorNotes: data.contractorNotes,
          evidenceIds: data.evidenceIds,
        }),
      }
    );
    if (!draftRes.ok) {
      const err = await draftRes.json();
      throw new Error(err.error || 'Failed to record submission draft prior to submit');
    }
    const draftData = await draftRes.json();
    const submissionId = draftData.submission.id;

    // Submit formal package
    const submitRes = await fetch(`/api/projects/${projectId}/submissions/${submissionId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ notes: data.notes }),
    });

    if (!submitRes.ok) {
      const err = await submitRes.json();
      throw new Error(err.error || 'Failed to submit work package');
    }
    await fetchMilestonesData();
  };

  // Handle Senior Project Director starting technical review
  const handleStartReview = async (submissionId: string) => {
    if (!idToken) return;
    try {
      setReviewError(null);
      const res = await fetch(`/api/projects/${projectId}/submissions/${submissionId}/review/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start review');
      }
      await fetchMilestonesData();
    } catch (err: any) {
      setReviewError(err.message || 'Error starting review');
    }
  };

  // Handle Senior Project Director issuing review decision
  const handleSubmitReviewDecision = async (submissionId: string) => {
    if (!idToken || !reviewNotes.trim() || submittingReview) return;
    try {
      setSubmittingReview(true);
      setReviewError(null);
      setReviewSuccess(null);

      const res = await fetch(
        `/api/projects/${projectId}/submissions/${submissionId}/review/decision`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            decision: reviewDecision,
            reviewNotes: reviewNotes.trim(),
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit review decision');
      }

      const resData = await res.json();
      setReviewSuccess(`Decision [${reviewDecision}] recorded successfully.`);
      setReviewNotes('');
      await fetchMilestonesData();
    } catch (err: any) {
      setReviewError(err.message || 'Error recording technical decision');
    } finally {
      setSubmittingReview(false);
    }
  };

  const activeSubmission = selectedMilestone
    ? submissions.find(s => s.milestoneId === selectedMilestone.id) || null
    : null;

  const activeEvidence = selectedMilestone
    ? evidenceList.filter(e => selectedMilestone.relatedEvidenceIds?.includes(e.id))
    : [];

  const activeReview = activeSubmission?.technicalReviewId
    ? technicalReviews.find(r => r.id === activeSubmission.technicalReviewId) || null
    : null;

  const filteredMilestones = milestones.filter(m => {
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Overview Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Milestones
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {milestones.length}
            </span>
            <span className="text-xs text-slate-500">Scheduled sequence</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            In Technical Review
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-500">
              {
                milestones.filter(
                  m =>
                    m.status === 'SUBMITTED_FOR_REVIEW' || m.status === 'TECHNICAL_REVIEW'
                ).length
              }
            </span>
            <span className="text-xs text-slate-500">Awaiting director action</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Technically Accepted
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-500">
              {
                milestones.filter(
                  m =>
                    m.status === 'QA_QC_HOLD' ||
                    m.status === 'READY_FOR_OWNER_REVIEW' ||
                    m.status === 'APPROVED' ||
                    m.status === 'COMPLETE'
                ).length
              }
            </span>
            <span className="text-xs text-slate-500">Director approved</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Allocated Budget
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              $
              {milestones
                .reduce((acc, m) => acc + (m.costAllocationUSD || 0), 0)
                .toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">Sprint baseline</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout: List on left (40%), Detail on right (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Milestone List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Project Milestones ({filteredMilestones.length})
            </h3>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED_FOR_REVIEW">Submitted</option>
              <option value="TECHNICAL_REVIEW">Under Review</option>
              <option value="QA_QC_HOLD">QA/QC Hold</option>
              <option value="READY_FOR_OWNER_REVIEW">Ready for Owner</option>
            </select>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Loading project milestones...
              </div>
            ) : filteredMilestones.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                No milestones match selected filter.
              </div>
            ) : (
              filteredMilestones.map(m => {
                const isSelected = selectedMilestone?.id === m.id;
                const statusStyle = STATUS_CONFIG[m.status] || STATUS_CONFIG.NOT_STARTED;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMilestone(m)}
                    className={`p-4 rounded-3xl border transition cursor-pointer flex flex-col space-y-3 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/15 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            #{m.sequence}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {m.discipline}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {m.title}
                        </h4>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        {m.costAllocationUSD ? (
                          <span>${m.costAllocationUSD.toLocaleString()}</span>
                        ) : null}
                        <span>•</span>
                        <span>{(m.relatedEvidenceIds || []).length} Evidence</span>
                      </div>

                      {m.contractorSubmissionStatus !== 'NONE' && (
                        <span className="font-mono text-[10px] uppercase text-amber-600 dark:text-amber-400 font-bold">
                          Pkg: {m.contractorSubmissionStatus}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Milestone Detail Workspace */}
        <div className="lg:col-span-7">
          {!selectedMilestone ? (
            <div className="p-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500">
              Select a milestone from the register to inspect scope, submissions, and technical review workflow.
            </div>
          ) : (
            <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
              {/* Header */}
              <div className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Milestone #{selectedMilestone.sequence}
                    </span>
                    <span className="text-xs text-slate-500">
                      {selectedMilestone.discipline}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        STATUS_CONFIG[selectedMilestone.status]?.bg
                      } ${STATUS_CONFIG[selectedMilestone.status]?.text} ${
                        STATUS_CONFIG[selectedMilestone.status]?.border
                      }`}
                    >
                      {STATUS_CONFIG[selectedMilestone.status]?.label}
                    </span>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {selectedMilestone.title}
                </h2>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedMilestone.description}
                </p>

                {/* Governance Requirement Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Project Director Review</span>
                  </span>

                  {selectedMilestone.requiresQaQcReview && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                      <span>QA/QC Inspection Gate (Sprint 04C)</span>
                    </span>
                  )}

                  {selectedMilestone.requiresOwnerApproval && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Owner Decision Boundary</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Contractor Submission Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-amber-500" />
                    <span>Contractor Work Package Submission</span>
                  </h3>

                  {activeSubmission && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Rev #{activeSubmission.revisionNumber} • {activeSubmission.status}
                    </span>
                  )}
                </div>

                {!activeSubmission ? (
                  <div className="p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-center space-y-3">
                    <p className="text-xs text-slate-500">
                      No contractor work package submitted for this milestone yet.
                    </p>

                    {userRole === 'GENERAL_CONTRACTOR' && (
                      <div>
                        {selectedMilestone.status === 'NOT_STARTED' ? (
                          <button
                            onClick={() => handleStartMilestone(selectedMilestone.id)}
                            disabled={startingMilestone}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm disabled:opacity-50"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>{startingMilestone ? 'Commencing...' : 'Commence Milestone'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowSubmissionModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Draft Work Package Submission</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Active Submission Card */
                  <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        Submitted by {activeSubmission.submittedByName} ({activeSubmission.submittedByRole})
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {activeSubmission.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {activeSubmission.summary}
                      </p>
                    </div>

                    {activeSubmission.contractorNotes && (
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Contractor Notes & Statements:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 italic text-[11px]">
                          "{activeSubmission.contractorNotes}"
                        </p>
                      </div>
                    )}

                    {/* Attached Evidence records */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Attached Verification Evidence ({activeEvidence.length})
                      </span>
                      {activeEvidence.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No evidence attached.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {activeEvidence.map(ev => (
                            <div
                              key={ev.id}
                              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <Paperclip className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {ev.title}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-slate-500">
                                {ev.storageReference}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Returned Notes if Director requested changes */}
                    {activeSubmission.status === 'RETURNED' && activeSubmission.returnNotes && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Technical Review Feedback (Revision Requested):</span>
                        </div>
                        <p className="text-rose-800 dark:text-rose-300 text-[11px] leading-relaxed">
                          {activeSubmission.returnNotes}
                        </p>
                      </div>
                    )}

                    {/* Contractor Resubmission / Edit button */}
                    {userRole === 'GENERAL_CONTRACTOR' &&
                      (activeSubmission.status === 'DRAFT' || activeSubmission.status === 'RETURNED') && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => setShowSubmissionModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {activeSubmission.status === 'RETURNED'
                                ? 'Revise & Resubmit Package'
                                : 'Edit / Submit Package'}
                            </span>
                          </button>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Senior Project Director Technical Review Workflow */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <span>Senior Project Director Technical Review</span>
                  </h3>

                  {selectedMilestone.technicalReviewStatus && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                      Review: {selectedMilestone.technicalReviewStatus}
                    </span>
                  )}
                </div>

                {/* Director Decision Form (Only for SENIOR_PROJECT_DIRECTOR when submission is SUBMITTED or UNDER_REVIEW) */}
                {userRole === 'SENIOR_PROJECT_DIRECTOR' &&
                activeSubmission &&
                (activeSubmission.status === 'SUBMITTED' || activeSubmission.status === 'UNDER_REVIEW') ? (
                  <div className="p-5 rounded-3xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/15 space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Perform Formal Technical Review
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Verify adherence to structural specifications, test break logs, and site inspection records before recording your decision.
                      </p>
                    </div>

                    {activeSubmission.status === 'SUBMITTED' && (
                      <div>
                        <button
                          onClick={() => handleStartReview(activeSubmission.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                        >
                          Mark Package "Under Review"
                        </button>
                      </div>
                    )}

                    {reviewError && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{reviewError}</span>
                      </div>
                    )}

                    {reviewSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{reviewSuccess}</span>
                      </div>
                    )}

                    {/* Decision Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Technical Determination <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={reviewDecision}
                        onChange={e => setReviewDecision(e.target.value as TechnicalReviewDecision)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="ACCEPT_TECHNICAL_SUBMISSION">
                          Accept Technical Submission (Passes Specifications)
                        </option>
                        <option value="REQUEST_CHANGES">
                          Request Changes (Return to Contractor for Revision)
                        </option>
                        <option value="ESCALATE">
                          Escalate (Flag Critical Technical Discrepancy)
                        </option>
                        <option value="SEND_TO_QA_QC">
                          Send to QA/QC (Advance towards Inspection Gate)
                        </option>
                      </select>
                    </div>

                    {/* Review Notes */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Technical Audit Notes & Rationalization <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={reviewNotes}
                        onChange={e => setReviewNotes(e.target.value)}
                        placeholder="Detail engineering verification, cylinder break calculations, or specific deficiencies requiring revision..."
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Governance Boundary Notice */}
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <span>
                        Technical acceptance confirms engineering compliance. It does NOT constitute QA/QC certification, Owner authorization, or financial fund release.
                      </span>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSubmitReviewDecision(activeSubmission.id)}
                        disabled={submittingReview || !reviewNotes.trim()}
                        className="px-5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
                      >
                        {submittingReview ? 'Recording...' : 'Record Technical Decision'}
                      </button>
                    </div>
                  </div>
                ) : activeReview ? (
                  /* Completed / Recorded Technical Review Card */
                  <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Decision: {activeReview.decision}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(activeReview.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{activeReview.reviewNotes}"
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Reviewed by: {activeReview.reviewedByName} ({activeReview.reviewedByRole})</span>
                      <span className="font-mono">ID: {activeReview.id}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-500 text-center">
                    Technical review will be conducted by the Senior Project Director once the General Contractor submits the package.
                  </div>
                )}
              </div>

              {/* Governance Disclaimers */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    Governance Boundaries (Sprint 04B)
                  </span>
                </div>
                <p className="leading-relaxed">
                  Approval is not settlement. Technical acceptance confirms work package compliance. Subsequent QA/QC inspection gates (Sprint 04C) and Owner authorization must precede any financial disbursement.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contractor Submission Modal */}
      {showSubmissionModal && selectedMilestone && (
        <ContractorSubmissionModal
          milestone={selectedMilestone}
          existingSubmission={activeSubmission}
          availableEvidence={evidenceList}
          onClose={() => setShowSubmissionModal(false)}
          onSaveDraft={handleSaveDraft}
          onSubmitPackage={handleSubmitPackage}
        />
      )}
    </div>
  );
};
