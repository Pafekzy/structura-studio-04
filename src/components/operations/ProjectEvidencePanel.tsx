import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Camera,
  Layers,
  FileCheck2,
  Paperclip,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  X,
  Building,
  Calendar,
  ExternalLink,
  HardHat,
  Sparkles,
  Database,
  Info,
  RefreshCw
} from 'lucide-react';
import { ProjectEvidence, EvidenceType, ProjectRole, ProjectMilestone } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ProjectEvidencePanelProps {
  projectId: string;
  isDemo?: boolean;
}

const EVIDENCE_TYPE_ICONS: Record<EvidenceType, React.ReactNode> = {
  SITE_PHOTO: <Camera className="w-4 h-4 text-emerald-500" />,
  DRAWING: <Layers className="w-4 h-4 text-blue-500" />,
  DOCUMENT: <FileText className="w-4 h-4 text-purple-500" />,
  TEST_RESULT: <FileCheck2 className="w-4 h-4 text-amber-500" />,
  PROGRESS_RECORD: <Calendar className="w-4 h-4 text-teal-500" />,
  TECHNICAL_ATTACHMENT: <Paperclip className="w-4 h-4 text-indigo-500" />,
  CONTRACTOR_SUBMISSION: <HardHat className="w-4 h-4 text-orange-500" />,
  OTHER: <FileText className="w-4 h-4 text-slate-500" />,
};

const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  SITE_PHOTO: 'Site Photograph',
  DRAWING: 'Engineering Drawing',
  DOCUMENT: 'Specification / Memo',
  TEST_RESULT: 'Lab / Material Break Test',
  PROGRESS_RECORD: 'Daily Progress Record',
  TECHNICAL_ATTACHMENT: 'Technical Attachment',
  CONTRACTOR_SUBMISSION: 'Work Package Submission',
  OTHER: 'General Evidence',
};

export const ProjectEvidencePanel: React.FC<ProjectEvidencePanelProps> = ({
  projectId,
  isDemo,
}) => {
  const { userProfile, user, idToken } = useAuth();
  const [evidenceList, setEvidenceList] = useState<ProjectEvidence[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Register Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<EvidenceType>('TEST_RESULT');
  const [newMilestoneId, setNewMilestoneId] = useState<string>('');
  const [newFileName, setNewFileName] = useState('');
  const [newMimeType, setNewMimeType] = useState('application/pdf');
  const [newReference, setNewReference] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Selected Evidence for Inspection Modal
  const [inspectedEvidence, setInspectedEvidence] = useState<ProjectEvidence | null>(null);

  const fetchData = useCallback(async () => {
    if (!idToken) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch Evidence
      const evRes = await fetch(`/api/projects/${projectId}/evidence`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!evRes.ok) {
        const data = await evRes.json();
        throw new Error(data.error || 'Failed to load project evidence');
      }
      const evData = await evRes.json();
      setEvidenceList(evData.evidence || []);

      // Fetch Milestones
      const msRes = await fetch(`/api/projects/${projectId}/milestones`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (msRes.ok) {
        const msData = await msRes.json();
        setMilestones(msData.milestones || []);
      }

      // Resolve user role
      const chRes = await fetch(`/api/projects/${projectId}/direct-line/channels`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (chRes.ok) {
        const chData = await chRes.json();
        setUserRole(chData.userRole);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to access evidence register');
    } finally {
      setLoading(false);
    }
  }, [idToken, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newReference.trim() || !idToken || registering) return;

    try {
      setRegistering(true);
      setRegisterError(null);

      const payload = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        evidenceType: newType,
        milestoneId: newMilestoneId || undefined,
        fileName: newFileName.trim() || `${newTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        mimeType: newMimeType,
        fileSize: 1024 * 1024 * 2, // simulated metadata representation
        storageProvider: 'METADATA_ONLY' as const,
        storageStatus: 'RECORDED_METADATA' as const,
        storageReference: newReference.trim(),
        metadata: {
          recordedBy: userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : user?.email,
          clientRegistrationTimestamp: new Date().toISOString(),
        },
      };

      const res = await fetch(`/api/projects/${projectId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to register project evidence');
      }

      // Reset form & reload
      setNewTitle('');
      setNewDescription('');
      setNewReference('');
      setNewFileName('');
      setShowRegisterModal(false);
      await fetchData();
    } catch (err: any) {
      setRegisterError(err.message || 'Error registering evidence');
    } finally {
      setRegistering(false);
    }
  };

  const filteredEvidence = evidenceList.filter(ev => {
    if (typeFilter !== 'ALL' && ev.evidenceType !== typeFilter) return false;
    if (milestoneFilter !== 'ALL' && ev.milestoneId !== milestoneFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchDesc = ev.description.toLowerCase().includes(q);
      const matchRef = ev.storageReference.toLowerCase().includes(q);
      const matchUploader = ev.uploadedByName.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchRef && !matchUploader) return false;
    }
    return true;
  });

  const canRegister =
    userRole === 'GENERAL_CONTRACTOR' ||
    userRole === 'SENIOR_PROJECT_DIRECTOR' ||
    userRole === 'STRUCTURAL_QA_QC_AUDITOR';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Truthful Storage Notice */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Tamper-Evident Project Evidence Register
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PROVENANCE METADATA ONLY
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Records certified testing break reports, survey photography, and engineering submittals. External cloud blob storage is not integrated in this sandbox environment; metadata and lab certificate tags are securely persisted.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition"
            title="Refresh Evidence"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canRegister && (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Register Evidence</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search evidence by title, lab ref, or uploader..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Milestone filter */}
          <select
            value={milestoneFilter}
            onChange={e => setMilestoneFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Milestones</option>
            {milestones.map(ms => (
              <option key={ms.id} value={ms.id}>
                #{ms.sequence}: {ms.title}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Evidence Types</option>
            <option value="TEST_RESULT">Test Results & Break Reports</option>
            <option value="SITE_PHOTO">Site Photos</option>
            <option value="DOCUMENT">Documents & Warranties</option>
            <option value="DRAWING">Engineering Drawings</option>
            <option value="PROGRESS_RECORD">Progress Records</option>
            <option value="TECHNICAL_ATTACHMENT">Technical Attachments</option>
          </select>
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          Loading project evidence register...
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredEvidence.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No project evidence found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery || typeFilter !== 'ALL' || milestoneFilter !== 'ALL'
                ? 'No records match your selected filters. Try clearing search criteria.'
                : 'No evidence records have been registered for this project yet.'}
            </p>
          </div>
        </div>
      ) : (
        /* Evidence Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvidence.map(ev => {
            const linkedMilestone = milestones.find(m => m.id === ev.milestoneId);
            return (
              <div
                key={ev.id}
                onClick={() => setInspectedEvidence(ev)}
                className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-amber-500/40 dark:hover:border-amber-500/40 transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top line badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {EVIDENCE_TYPE_ICONS[ev.evidenceType]}
                      <span>{EVIDENCE_TYPE_LABELS[ev.evidenceType] || ev.evidenceType}</span>
                    </div>

                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(ev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition line-clamp-1">
                      {ev.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  {/* Linked milestone */}
                  {linkedMilestone && (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">
                        Milestone #{linkedMilestone.sequence}: {linkedMilestone.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer metadata */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="space-y-0.5">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Ref / Cert ID
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                      {ev.storageReference}
                    </span>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Uploader
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">
                      {ev.uploadedByName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evidence Inspection Modal */}
      {inspectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {EVIDENCE_TYPE_ICONS[inspectedEvidence.evidenceType]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Project Evidence Record
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    ID: {inspectedEvidence.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedEvidence(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {EVIDENCE_TYPE_LABELS[inspectedEvidence.evidenceType]}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {inspectedEvidence.title}
                </h2>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {inspectedEvidence.description}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Storage Provider
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {inspectedEvidence.storageProvider} (Truthful Representation)
                  </span>
                </div>

                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Storage Reference / Tag
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {inspectedEvidence.storageReference}
                  </span>
                </div>

                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    File Representation
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {inspectedEvidence.fileName} ({inspectedEvidence.mimeType})
                  </span>
                </div>

                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Uploaded By
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {inspectedEvidence.uploadedByName} ({inspectedEvidence.uploadedByRole})
                  </span>
                </div>
              </div>

              {/* Custom metadata if present */}
              {inspectedEvidence.metadata && Object.keys(inspectedEvidence.metadata).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Laboratory & Inspection Parameters
                  </span>
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                    {Object.entries(inspectedEvidence.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-slate-500">{k}:</span>
                        <span className="font-bold text-right">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
              <button
                onClick={() => setInspectedEvidence(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Evidence Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Register Project Evidence
                  </h3>
                  <p className="text-xs text-slate-500">
                    Record certified verification metadata & test artifacts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {registerError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{registerError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Evidence Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. 28-Day Concrete Cylinder Break Lab Certificate"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Evidence Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as EvidenceType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="TEST_RESULT">Lab / Break Test Result</option>
                    <option value="SITE_PHOTO">Site Photograph</option>
                    <option value="DRAWING">Engineering Drawing</option>
                    <option value="DOCUMENT">Specification / Warranty</option>
                    <option value="PROGRESS_RECORD">Progress Record</option>
                    <option value="TECHNICAL_ATTACHMENT">Technical Attachment</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Associated Milestone
                  </label>
                  <select
                    value={newMilestoneId}
                    onChange={e => setNewMilestoneId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">(None / General Project)</option>
                    {milestones.map(ms => (
                      <option key={ms.id} value={ms.id}>
                        #{ms.sequence}: {ms.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Verification Description & Test Parameters <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Summarize testing standards, break pressures, station survey numbers, or material batches..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Storage Ref / Tag <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newReference}
                    onChange={e => setNewReference(e.target.value)}
                    placeholder="e.g. CERT-LAB-2026-9042"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    File Name Reference
                  </label>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    placeholder="e.g. raft_pour_report.pdf"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Structura records this evidence into the project's immutable provenance ledger. All project roles will be able to review this verification metadata.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {registering ? 'Registering...' : 'Register Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
