import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  X,
  Send,
  CheckCheck,
  Lock,
  ChevronRight,
  UserCheck,
  RefreshCw,
  Building,
  Calendar
} from 'lucide-react';
import { RFI, RFIStatus, RFIPriority, ProjectRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface RFIRegisterPanelProps {
  projectId: string;
  isDemo?: boolean;
}

const STATUS_BADGES: Record<RFIStatus, { bg: string; text: string; border: string }> = {
  OPEN: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  UNDER_REVIEW: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  ANSWERED: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
  ACKNOWLEDGED: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/30' },
  CLOSED: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/30' },
};

const PRIORITY_BADGES: Record<RFIPriority, { bg: string; text: string }> = {
  LOW: { bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300', text: 'Low' },
  NORMAL: { bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300', text: 'Normal' },
  HIGH: { bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300', text: 'High' },
  CRITICAL: { bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300', text: 'Critical' },
};

const DISCIPLINES = [
  'Structural Concrete & Rebar',
  'Post-Tensioned Slabs',
  'Facade & Envelope',
  'Structural Steel & Anchorages',
  'MEP & Plumbing Sleeve Integration',
  'Geotechnical & Foundations',
  'Fire Stopping & Life Safety',
  'Architectural Finishes',
];

export const RFIRegisterPanel: React.FC<RFIRegisterPanelProps> = ({ projectId, isDemo }) => {
  const { idToken, user } = useAuth();
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRfi, setSelectedRfi] = useState<RFI | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create RFI Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newDiscipline, setNewDiscipline] = useState(DISCIPLINES[0]);
  const [newPriority, setNewPriority] = useState<RFIPriority>('NORMAL');
  const [newDueAt, setNewDueAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Response Form
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);

  // Acknowledge Form
  const [ackNote, setAckNote] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  // Close Form
  const [closingNotes, setClosingNotes] = useState('');
  const [closing, setClosing] = useState(false);

  // Fetch RFIs
  const fetchRFIs = useCallback(async () => {
    if (!idToken) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/projects/${projectId}/rfis`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load project RFIs');
      }
      const data = await res.json();
      setRfis(data);

      // Also retrieve user's role on project
      const chRes = await fetch(`/api/projects/${projectId}/direct-line/channels`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (chRes.ok) {
        const chData = await chRes.json();
        setUserRole(chData.userRole);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to access RFI register');
    } finally {
      setLoading(false);
    }
  }, [idToken, projectId]);

  useEffect(() => {
    fetchRFIs();
  }, [fetchRFIs]);

  const handleCreateRFI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newQuestion.trim() || !idToken || submitting) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/projects/${projectId}/rfis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          question: newQuestion.trim(),
          discipline: newDiscipline,
          priority: newPriority,
          dueAt: newDueAt || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create RFI');
      }

      const created = await res.json();
      setRfis(prev => [created, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewQuestion('');
      setNewDueAt('');
      setSelectedRfi(created);
    } catch (err: any) {
      alert(`RFI Submission Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondRFI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfi || !responseText.trim() || !idToken || responding) return;

    try {
      setResponding(true);
      const res = await fetch(`/api/projects/${projectId}/rfis/${selectedRfi.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          response: responseText.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit response');
      }

      const updated = await res.json();
      setRfis(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      setSelectedRfi(updated);
      setResponseText('');
    } catch (err: any) {
      alert(`Response Error: ${err.message}`);
    } finally {
      setResponding(false);
    }
  };

  const handleAcknowledgeRFI = async () => {
    if (!selectedRfi || !idToken || acknowledging) return;

    try {
      setAcknowledging(true);
      const res = await fetch(`/api/projects/${projectId}/rfis/${selectedRfi.id}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          acknowledgementNote: ackNote.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to acknowledge RFI');
      }

      const updated = await res.json();
      setRfis(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      setSelectedRfi(updated);
      setAckNote('');
    } catch (err: any) {
      alert(`Acknowledgement Error: ${err.message}`);
    } finally {
      setAcknowledging(false);
    }
  };

  const handleCloseRFI = async () => {
    if (!selectedRfi || !idToken || closing) return;

    try {
      setClosing(true);
      const res = await fetch(`/api/projects/${projectId}/rfis/${selectedRfi.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          closingNotes: closingNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to close RFI');
      }

      const updated = await res.json();
      setRfis(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      setSelectedRfi(updated);
      setClosingNotes('');
    } catch (err: any) {
      alert(`Closure Error: ${err.message}`);
    } finally {
      setClosing(false);
    }
  };

  // Filtered list
  const filteredRFIs = rfis.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.number.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.discipline.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
        <span className="text-xs">Loading authorized RFI register...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1624] border border-slate-200 dark:border-[#14263a] text-center max-w-lg mx-auto my-6 space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">RFI Register Access Restricted</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#0c1624] border border-slate-200 dark:border-[#14263a] shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search RFI number, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-[#18314e] bg-slate-50 dark:bg-[#08101a] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 w-52 sm:w-64"
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {(['ALL', 'OPEN', 'ANSWERED', 'ACKNOWLEDGED', 'CLOSED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRFIs}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-[#14263a]"
            title="Refresh RFI Register"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise New RFI</span>
          </button>
        </div>
      </div>

      {/* RFI Table / Card List */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1624] border border-slate-200 dark:border-[#14263a] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-[#14263a] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Project RFI Register</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {filteredRFIs.length} Total
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Governed technical clarification workflow with audit log and accountability milestones.
            </p>
          </div>
        </div>

        {filteredRFIs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 opacity-30 mx-auto text-amber-500" />
            <p className="text-xs font-semibold">No RFIs found matching criteria.</p>
            <p className="text-[11px] text-slate-500">Raise a formal clarification request using the button above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#14263a]">
            {filteredRFIs.map((rfi) => {
              const statusBadge = STATUS_BADGES[rfi.status] || STATUS_BADGES.OPEN;
              const priorityBadge = PRIORITY_BADGES[rfi.priority] || PRIORITY_BADGES.NORMAL;

              return (
                <div
                  key={rfi.id}
                  onClick={() => setSelectedRfi(rfi)}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-[#0e1c2d] cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {rfi.number}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {rfi.status}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${priorityBadge.bg}`}>
                        {priorityBadge.text} Priority
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {rfi.discipline}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                      {rfi.title}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {rfi.question}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 text-[11px] text-slate-400 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-[#14263a]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(rfi.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      By {rfi.raisedByName}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs mt-1">
                      <span>Review Details</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed RFI Modal / Drawer */}
      {selectedRfi && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0c1624] border border-slate-200 dark:border-[#18314e] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-[#14263a] flex items-start justify-between bg-slate-50/75 dark:bg-[#08101a]/75">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30">
                    {selectedRfi.number}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGES[selectedRfi.status].bg} ${STATUS_BADGES[selectedRfi.status].text} ${STATUS_BADGES[selectedRfi.status].border}`}>
                    {selectedRfi.status}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_BADGES[selectedRfi.priority].bg}`}>
                    {PRIORITY_BADGES[selectedRfi.priority].text} Priority
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {selectedRfi.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Discipline: <strong>{selectedRfi.discipline}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedRfi(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[68vh] overflow-y-auto">
              {/* Stakeholders & Timelines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#08101a] border border-slate-200 dark:border-[#102033] text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Raised By</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedRfi.raisedByName}</span>
                  <span className="text-[10px] text-slate-500 block">({selectedRfi.raisedByRole})</span>
                  <span className="text-[10px] text-slate-400">{new Date(selectedRfi.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Assigned To (Director)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedRfi.assignedToName}</span>
                  <span className="text-[10px] text-slate-500 block">({selectedRfi.assignedToRole})</span>
                  {selectedRfi.dueAt && (
                    <span className="text-[10px] text-amber-500 font-bold block">
                      Target Due: {new Date(selectedRfi.dueAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Technical Clarification Inquiry */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Technical Question / Clarification Inquiry</span>
                </label>
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0e1c2d] border border-slate-200 dark:border-[#18314e] text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {selectedRfi.question}
                </div>
              </div>

              {/* Formal Response Section */}
              {selectedRfi.response ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Formal Engineering Determination / Response</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      By {selectedRfi.respondedByName} on {selectedRfi.respondedAt && new Date(selectedRfi.respondedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {selectedRfi.response}
                  </div>
                </div>
              ) : null}

              {/* Acknowledgement Status */}
              {selectedRfi.acknowledgedAt && (
                <div className="p-3.5 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/30 flex items-start gap-3">
                  <CheckCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-teal-700 dark:text-teal-300">
                      General Contractor Formally Acknowledged
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      {selectedRfi.acknowledgementNote || 'Response verified and incorporated into field execution plan.'}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(selectedRfi.acknowledgedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Closing Notes */}
              {selectedRfi.closedAt && (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      RFI Formally Closed
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      {selectedRfi.closingNotes || 'Closed following field execution verification.'}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(selectedRfi.closedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Form 1: Respond to RFI (Director or Owner) */}
              {(!selectedRfi.response || selectedRfi.status === 'OPEN' || selectedRfi.status === 'UNDER_REVIEW') && (
                <div className="pt-4 border-t border-slate-200 dark:border-[#14263a] space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>Issue Formal Engineering Determination</span>
                    </h5>
                    <span className="text-[10px] text-slate-400">
                      Authority: Senior Project Director / Owner
                    </span>
                  </div>

                  <form onSubmit={handleRespondRFI} className="space-y-3">
                    <textarea
                      rows={3}
                      placeholder="Enter binding engineering clarification, specification reference, or revision instructions..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      required
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-[#18314e] bg-white dark:bg-[#0c1624] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={responding || !responseText.trim()}
                        className="flex items-center gap-1.5 py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{responding ? 'Transmitting Determination...' : 'Issue Binding Determination'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Action Form 2: Acknowledge (General Contractor when ANSWERED) */}
              {selectedRfi.status === 'ANSWERED' && (
                <div className="pt-4 border-t border-slate-200 dark:border-[#14263a] space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Contractor Receipt Acknowledgement
                    </h5>
                    <span className="text-[10px] text-slate-400">
                      Authority: General Contractor
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Optional acknowledgement note (e.g. Incorporated into shop drawing Rev 3)..."
                    value={ackNote}
                    onChange={(e) => setAckNote(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-[#18314e] bg-white dark:bg-[#0c1624] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleAcknowledgeRFI}
                      disabled={acknowledging}
                      className="flex items-center gap-1.5 py-1.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition disabled:opacity-50"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{acknowledging ? 'Recording...' : 'Acknowledge Engineering Determination'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Form 3: Close RFI (Director or Owner when ANSWERED or ACKNOWLEDGED) */}
              {(selectedRfi.status === 'ANSWERED' || selectedRfi.status === 'ACKNOWLEDGED') && (
                <div className="pt-4 border-t border-slate-200 dark:border-[#14263a] space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Final RFI Administrative Closure
                    </h5>
                    <span className="text-[10px] text-slate-400">
                      Authority: Senior Project Director / Owner
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Optional closure notes..."
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-[#18314e] bg-white dark:bg-[#0c1624] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleCloseRFI}
                      disabled={closing}
                      className="flex items-center gap-1.5 py-1.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{closing ? 'Closing RFI...' : 'Formally Close RFI'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Raise New RFI Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#0c1624] border border-slate-200 dark:border-[#18314e] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-[#14263a] flex items-center justify-between bg-slate-50/75 dark:bg-[#08101a]/75">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Raise Request for Information (RFI)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Submits formal clarification query to Senior Project Director.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRFI} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  RFI Title / Clarification Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Level 3 Post-Tensioned Slab Conduit Blockout Clash"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  minLength={5}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-[#18314e] bg-white dark:bg-[#08101a] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Technical Discipline
                  </label>
                  <select
                    value={newDiscipline}
                    onChange={(e) => setNewDiscipline(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-[#18314e] bg-white dark:bg-[#08101a] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {DISCIPLINES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Operational Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as RFIPriority)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-[#18314e] bg-white dark:bg-[#08101a] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical (Blocks Pour / Pour Staged)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Required Response Date (Optional)
                </label>
                <input
                  type="date"
                  value={newDueAt}
                  onChange={(e) => setNewDueAt(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-[#18314e] bg-white dark:bg-[#08101a] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Detailed Technical Inquiry / Description
                </label>
                <textarea
                  rows={4}
                  placeholder="State the observed field condition, specification conflict, or drawing discrepancy with specific grid references and detail numbers..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  required
                  minLength={10}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-[#18314e] bg-white dark:bg-[#08101a] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#14263a]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2 px-4 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTitle.trim() || !newQuestion.trim()}
                  className="py-2 px-5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Registering...' : 'Register RFI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
