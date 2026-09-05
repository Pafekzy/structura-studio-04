import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Info,
  Layers,
  Paperclip,
  RotateCcw,
  Bot,
  UserCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import {
  AIInspectionAnalysis,
  ProjectMilestone,
  ProjectEvidence,
  ProjectRole,
} from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AIInspectionPanelProps {
  projectId: string;
  isDemo?: boolean;
}

export const AIInspectionPanel: React.FC<AIInspectionPanelProps> = ({
  projectId,
  isDemo,
}) => {
  const { userProfile, user, idToken } = useAuth();
  const [analyses, setAnalyses] = useState<AIInspectionAnalysis[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [evidenceList, setEvidenceList] = useState<ProjectEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Analysis
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIInspectionAnalysis | null>(null);

  // Request analysis form
  const [targetMilestoneId, setTargetMilestoneId] = useState('');
  const [contextNotes, setContextNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [aiRes, msRes, evRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/ai-inspections`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch(`/api/projects/${projectId}/milestones`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch(`/api/projects/${projectId}/evidence`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
      ]);

      if (aiRes.ok) {
        const data = await aiRes.json();
        setAnalyses(data.analyses || []);
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
      setError(err.message || 'Failed to load AI inspection analyses');
    } finally {
      setLoading(false);
    }
  }, [projectId, idToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMilestoneId) return;

    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${targetMilestoneId}/ai-inspection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          inspectionContext: contextNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger AI inspection analysis');
      }

      setContextNotes('');
      await loadData();
      if (data.analysis) {
        setSelectedAnalysis(data.analysis);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>AI Visual Inspection Copilot</span>
              </span>
              <span className="text-xs text-slate-400">Gemini 3.7 Flash Runtime</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Preliminary Vision Analysis & Risk Indicator Extraction
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Assists auditors and project directors by screening evidence imagery, flagging potential honeycombing, rebar clearance deviations, and detailing discrepancies.
            </p>
          </div>
        </div>

        {/* Mandatory Governance Warning */}
        <div className="mt-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Strict AI Governance Boundary:</span>
            <p className="leading-relaxed text-[11px] text-amber-200">
              AI inspection outputs are advisory preliminary screening tools. AI CANNOT certify code compliance, approve QA/QC gates, close Non-Conformance Reports, or authorize payment release. Human PE/SE review remains strictly required.
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

      {/* Trigger Analysis Card */}
      <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Bot className="w-4 h-4 text-amber-500" />
          <span>Request New AI Visual Audit</span>
        </h3>

        <form onSubmit={handleRunAnalysis} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4 space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Milestone & Evidence Package
            </label>
            <select
              value={targetMilestoneId}
              onChange={e => setTargetMilestoneId(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            >
              <option value="">Select Milestone to inspect...</option>
              {milestones.map(m => (
                <option key={m.id} value={m.id}>
                  #{m.sequence} - {m.title} ({m.discipline})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6 space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Audit Context / Engineering Focus (Optional)
            </label>
            <input
              type="text"
              value={contextNotes}
              onChange={e => setContextNotes(e.target.value)}
              placeholder="e.g. Verify tie spacing at lap splices; inspect for honeycombing at column bases..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={analyzing || !targetMilestoneId}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{analyzing ? 'Analyzing...' : 'Run Analysis'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Grid: Analyses history & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Generated Analyses ({analyses.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              Loading AI analyses...
            </div>
          ) : analyses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              No AI visual analyses generated yet. Select a milestone above to initiate visual screening.
            </div>
          ) : (
            analyses.map(an => {
              const ms = milestones.find(m => m.id === an.milestoneId);
              const isSelected = selectedAnalysis?.id === an.id;

              return (
                <div
                  key={an.id}
                  onClick={() => setSelectedAnalysis(an)}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {an.model}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        an.analysisStatus === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {an.analysisStatus}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {ms ? ms.title : an.milestoneId}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {an.summary}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{an.potentialIssues.length} potential issues detected</span>
                    <span>{new Date(an.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Analysis Detail */}
        <div className="lg:col-span-7">
          {!selectedAnalysis ? (
            <div className="p-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500">
              Select an AI inspection report from the register to inspect detailed observations, risk indicators, and recommendations.
            </div>
          ) : (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                      Model: {selectedAnalysis.model}
                    </span>
                    <span className="text-xs text-slate-400">ID: {selectedAnalysis.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {milestones.find(m => m.id === selectedAnalysis.milestoneId)?.title || 'Milestone Analysis'}
                  </h3>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Human PE/SE Review Required</span>
                </span>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  AI Preliminary Synthesis
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedAnalysis.summary}
                </div>
              </div>

              {/* Potential Issues & Risks */}
              {selectedAnalysis.potentialIssues.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Flagged Concerns & Potential Variances ({selectedAnalysis.potentialIssues.length})</span>
                  </span>
                  <div className="space-y-1.5">
                    {selectedAnalysis.potentialIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-300"
                      >
                        • {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observations */}
              {selectedAnalysis.observations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Engineering Observations
                  </span>
                  <div className="space-y-1.5">
                    {selectedAnalysis.observations.map((obs, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                      >
                        {obs}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedAnalysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 block">
                    Recommended Human Verification Actions
                  </span>
                  <div className="space-y-1.5">
                    {selectedAnalysis.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300"
                      >
                        → {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
