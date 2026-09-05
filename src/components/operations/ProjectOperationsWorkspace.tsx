import React, { useState } from 'react';
import {
  Radio,
  FileText,
  ShieldCheck,
  Building2,
  HardHat,
  Activity,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { ConstructionProject, NavigationTab } from '../../types';
import { DirectLinePanel } from './DirectLinePanel';
import { RFIRegisterPanel } from './RFIRegisterPanel';
import { MilestonesRegisterPanel } from './MilestonesRegisterPanel';
import { ProjectEvidencePanel } from './ProjectEvidencePanel';
import { QAQCInspectionPanel } from './QAQCInspectionPanel';
import { NCRRegisterPanel } from './NCRRegisterPanel';
import { AIInspectionPanel } from './AIInspectionPanel';
import { OwnerDecisionPanel } from './OwnerDecisionPanel';
import { useAuth } from '../../context/AuthContext';

interface ProjectOperationsWorkspaceProps {
  project: ConstructionProject;
  onNavigateTab?: (tab: NavigationTab) => void;
  onOpenAdvisorModal?: () => void;
}

export const ProjectOperationsWorkspace: React.FC<ProjectOperationsWorkspaceProps> = ({
  project,
  onNavigateTab,
  onOpenAdvisorModal,
}) => {
  const { userProfile, user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<
    'milestones' | 'qaqc' | 'ncrs' | 'ai_inspection' | 'owner_decision' | 'evidence' | 'direct_line' | 'rfis'
  >('milestones');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Workspace Header */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0c1624] via-[#102033] to-[#0a1420] text-white border border-[#1b324d] shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Project Operations Workspace</span>
              </span>

              {project.isDemo && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  SANDBOX
                </span>
              )}

              <span className="text-xs text-slate-400">
                {project.location} • Stage {project.currentStage || '4 (Enclosure & Glazing)'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>{project.name}</span>
            </h1>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Governed operational coordination, bilateral direct lines, milestone technical submissions, and verified project evidence. Authority derives strictly from active appointments on this project.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {/* Authenticated user active badge */}
            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                  Authenticated User
                </span>
                <span className="text-xs font-bold text-white block">
                  {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : user?.email || 'Authorized Professional'}
                </span>
              </div>
            </div>

            {onOpenAdvisorModal && (
              <button
                onClick={onOpenAdvisorModal}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Operational Copilot</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveSubTab('milestones')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'milestones'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Milestones & Technical Review</span>
          </button>

          <button
            onClick={() => setActiveSubTab('qaqc')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'qaqc'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>QA/QC Inspection Gate</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ncrs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'ncrs'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Non-Conformance (NCR)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ai_inspection')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'ai_inspection'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Visual Audit</span>
          </button>

          <button
            onClick={() => setActiveSubTab('owner_decision')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'owner_decision'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Owner Decision Gate</span>
          </button>

          <button
            onClick={() => setActiveSubTab('evidence')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'evidence'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Project Evidence</span>
          </button>

          <button
            onClick={() => setActiveSubTab('direct_line')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'direct_line'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Direct Line</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rfis')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'rfis'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>RFI Register</span>
          </button>
        </div>
      </div>

      {/* Sub-tab view */}
      {activeSubTab === 'milestones' ? (
        <MilestonesRegisterPanel projectId={project.id} isDemo={project.isDemo} />
      ) : activeSubTab === 'qaqc' ? (
        <QAQCInspectionPanel projectId={project.id} isDemo={project.isDemo} />
      ) : activeSubTab === 'ncrs' ? (
        <NCRRegisterPanel projectId={project.id} isDemo={project.isDemo} />
      ) : activeSubTab === 'ai_inspection' ? (
        <AIInspectionPanel projectId={project.id} isDemo={project.isDemo} />
      ) : activeSubTab === 'owner_decision' ? (
        <OwnerDecisionPanel projectId={project.id} isDemo={project.isDemo} />
      ) : activeSubTab === 'evidence' ? (
        <ProjectEvidencePanel projectId={project.id} isDemo={project.isDemo} />
      ) : activeSubTab === 'direct_line' ? (
        <DirectLinePanel projectId={project.id} isDemo={project.isDemo} />
      ) : (
        <RFIRegisterPanel projectId={project.id} isDemo={project.isDemo} />
      )}
    </div>
  );
};
