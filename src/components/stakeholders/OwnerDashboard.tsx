import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  Send,
  MessageSquare,
  Sparkles,
  FileText,
  ArrowRight,
  Camera,
  Download,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { ConstructionProject, ConstructionMilestone, NavigationTab } from '../../types';
import { ProjectGovernanceTeamView } from '../governance/ProjectGovernanceTeamView';
import { OrganizationManagementModal } from '../governance/OrganizationManagementModal';
import { GovernanceAuditTrailModal } from '../governance/GovernanceAuditTrailModal';

interface OwnerDashboardProps {
  project: ConstructionProject;
  onUpdateProject?: (updated: ConstructionProject) => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenAdvisorModal: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  project,
  onUpdateProject,
  onNavigateTab,
  onOpenAdvisorModal,
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<ConstructionMilestone | null>(
    project.milestones.find(m => m.escrowStatus === 'Pending Sign-Off') || project.milestones[0] || null
  );
  const [activeCamAngle, setActiveCamAngle] = useState<'live_site' | 'finished_3d'>('live_site');
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState<{ [id: string]: 'Approved' | 'Rejected' | 'Pending' }>({
    'opt-1': 'Approved',
    'opt-2': 'Pending',
    'opt-3': 'Approved',
  });
  const [ownerMessage, setOwnerMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: string; time: string; text: string; role: string }>>([
    {
      sender: 'Marcus Vance',
      role: 'Senior Project Director',
      time: 'Today, 09:15 AM',
      text: 'Good morning. Level 2 roof terrace waterproofing and triple-glazing delivery has arrived on site. QA/QC clearance certificate is attached for Phase 3 escrow release review.',
    },
    {
      sender: 'You (Owner)',
      role: 'Client / Investor',
      time: 'Today, 10:40 AM',
      text: 'Thanks Marcus. The site webcam view looks right on schedule. Reviewing the SGS concrete lab compressive break reports before approving release.',
    }
  ]);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signerPin, setSignerPin] = useState('');
  const [signSuccess, setSignSuccess] = useState(false);

  // Financial Calculations for Owner
  const totalBudget = project.totalBaselineBudgetUSD;
  const spentSoFar = project.actualCostIncurredUSD;
  const remainingBudget = totalBudget - spentSoFar;
  const releasedMilestones = project.milestones.filter(m => m.payoutApproved || m.escrowStatus === 'Released');
  const totalReleasedUSD = releasedMilestones.reduce((acc, m) => acc + m.costAllocationUSD, 0);
  const lockedEscrowUSD = totalBudget - totalReleasedUSD;
  const projectedValuation = totalBudget * 1.48; // Estimated post-completion value
  const estimatedEquityGain = projectedValuation - totalBudget;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerMessage.trim()) return;
    setMessages(prev => [
      ...prev,
      {
        sender: 'You (Owner)',
        role: 'Client / Investor',
        time: 'Just now',
        text: ownerMessage.trim(),
      }
    ]);
    setOwnerMessage('');
  };

  const handleApproveEscrow = () => {
    if (!selectedMilestone) return;
    if (onUpdateProject) {
      const updatedMilestones = project.milestones.map(m => {
        if (m.id === selectedMilestone.id) {
          return {
            ...m,
            payoutApproved: true,
            escrowStatus: 'Released' as const,
          };
        }
        return m;
      });
      onUpdateProject({
        ...project,
        milestones: updatedMilestones,
        actualCostIncurredUSD: project.actualCostIncurredUSD + selectedMilestone.costAllocationUSD,
      });
    }
    setSignSuccess(true);
    setTimeout(() => {
      setSignatureModalOpen(false);
      setSignSuccess(false);
    }, 1500);
  };

  const handleDecisionToggle = (id: string, decision: 'Approved' | 'Rejected') => {
    setDecisionNotes(prev => ({
      ...prev,
      [id]: decision,
    }));
  };

  const latestPhoto = project.sitePhotos?.[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner - Executive Owner Portal */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-sm transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Owner & Client Portal</span>
              </span>
              <span className="text-xs font-mono text-zinc-400">PROJECT ID: {project.id.toUpperCase()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Real-time fiduciary oversight, capital protection escrow releases, live site surveillance, and turnkey handover schedule.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setOrgModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition flex items-center gap-2 shadow-sm"
              title="Manage legal organizations & project governance"
            >
              <Building2 className="w-4 h-4" />
              <span>Organizations & Portfolio</span>
            </button>
            <button
              onClick={() => setAuditModalOpen(true)}
              className="px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-xs border border-zinc-200 dark:border-zinc-800 transition flex items-center gap-1.5"
              title="View governance audit ledger"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit Trail</span>
            </button>
            <button
              onClick={() => onNavigateTab('finished_render')}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-xs border border-zinc-200 dark:border-zinc-800 transition flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">360° BIM</span>
            </button>
            <button
              onClick={onOpenAdvisorModal}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-xs border border-zinc-200 dark:border-zinc-800 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Director Brief</span>
            </button>
          </div>
        </div>

        {/* Client Fast Facts Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Registered Client</span>
            <span className="font-bold text-zinc-900 dark:text-white text-sm">{project.clientName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Prime General Contractor</span>
            <span className="font-bold text-zinc-900 dark:text-white text-sm">{project.contractorName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Project Location</span>
            <span className="font-bold text-zinc-900 dark:text-white text-sm">{project.location}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Target Handover</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{project.targetHandoverDate}</span>
          </div>
        </div>
      </div>

      {/* Project Governance Team & Vacancies Matrix (Part D & E) */}
      <ProjectGovernanceTeamView
        project={project}
        isOwnerView={true}
      />

      {/* 4 Core Financial & Asset Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Capital Committed */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="uppercase font-bold tracking-wider">Total Project Budget</span>
            <DollarSign className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
            ${totalBudget.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-500 flex justify-between">
            <span>Locked BOQ Guaranteed Max</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Fixed</span>
          </div>
        </div>

        {/* Escrow Reserve in Trust */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="uppercase font-bold tracking-wider">Escrow Reserve Balance</span>
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            ${lockedEscrowUSD.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-500 flex justify-between">
            <span>Released: ${totalReleasedUSD.toLocaleString()}</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">{Math.round((totalReleasedUSD / totalBudget) * 100)}% Disbursed</span>
          </div>
        </div>

        {/* Physical Completion Progress */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="uppercase font-bold tracking-wider">Construction Progress</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
            {project.overallProgressPercentage}%
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${project.overallProgressPercentage}%` }}
            />
          </div>
        </div>

        {/* Estimated Asset Valuation */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="uppercase font-bold tracking-wider">Post-Handover Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            ${projectedValuation.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-500 flex justify-between">
            <span>Projected Equity</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">+${estimatedEquityGain.toLocaleString()} (+48%)</span>
          </div>
        </div>
      </div>

      {/* Main Dual Column: Left Column (Milestone Escrow Sign-Off & Decisions) vs Right Column (Surveillance & Direct Line) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (7 cols): Milestone Escrow Authorization Matrix */}
        <div className="lg:col-span-7 space-y-6">

          {/* Milestone Escrow Authorization Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Escrow Milestone Release Authorization</span>
                </h3>
                <p className="text-xs text-zinc-500">Funds are held in independent trust until verified by QA/QC certification</p>
              </div>
              <span className="text-[11px] font-mono text-zinc-500 self-start sm:self-auto">
                Trust Protocol: Dual-Signatory ISO 9001
              </span>
            </div>

            {/* Milestones List */}
            <div className="space-y-3">
              {project.milestones.map((milestone, idx) => {
                const isSelected = selectedMilestone?.id === milestone.id;
                const isReleased = milestone.payoutApproved || milestone.escrowStatus === 'Released';
                const isPending = milestone.escrowStatus === 'Pending Sign-Off';

                return (
                  <div
                    key={milestone.id}
                    onClick={() => setSelectedMilestone(milestone)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-amber-500/80 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-zinc-400">PHASE {idx + 1}</span>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{milestone.name}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                          <span>Target: {milestone.plannedEndDate}</span>
                          <span>•</span>
                          <span>Allocation: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">${milestone.costAllocationUSD.toLocaleString()}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {isReleased ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Released</span>
                          </span>
                        ) : isPending ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Sign-Off Required</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-mono">
                            Locked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Panel if Selected */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-zinc-600 dark:text-zinc-400">
                          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-[10px] text-zinc-400 block uppercase">Physical Completion</span>
                            <span className="font-bold text-zinc-900 dark:text-white text-sm">{milestone.progressPercentage}%</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-[10px] text-zinc-400 block uppercase">Contractor Claim</span>
                            <span className="font-bold text-zinc-900 dark:text-white text-sm font-mono">${(milestone.contractorClaimUSD || milestone.costAllocationUSD).toLocaleString()}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-[10px] text-zinc-400 block uppercase">QA/QC Clearance</span>
                            <span className={`font-bold text-sm ${milestone.certificationsCleared ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {milestone.certificationsCleared ? '100% Cleared' : 'Pending Final Audit'}
                            </span>
                          </div>
                        </div>

                        {/* Required Certifications */}
                        <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-zinc-400">Required Engineering Certifications:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {milestone.certificationsRequired.map((cert, cIdx) => (
                              <span key={cIdx} className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] border border-zinc-200 dark:border-zinc-800">
                                ✓ {cert}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Sign Action */}
                        {!isReleased && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[11px] text-zinc-500">
                              Requires Client Digital Key authorization to release ${milestone.costAllocationUSD.toLocaleString()} from escrow.
                            </span>
                            <button
                              onClick={() => setSignatureModalOpen(true)}
                              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Authorize Escrow Release</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Owner Change Orders & Aesthetic Decision Hub */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Owner Decision & Change-Order Requests</span>
                </h3>
                <p className="text-xs text-zinc-500">Approve or reject luxury finish upgrades and site engineering options</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Option 1 */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-zinc-900 dark:text-white">Solar PV Array Expansion (12 kWp to 18 kWp)</span>
                  <span className="text-zinc-500 font-mono">+$18,500 USD (Payback: 4.2 yrs)</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  Upgrade to high-efficiency SunPower Maxeon 6 bifacial modules integrated into the flat concrete roof deck. Offsets 100% of HVAC loads.
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500">Architect Recommendation: <strong className="text-emerald-600 dark:text-emerald-400">Highly Recommended</strong></span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecisionToggle('opt-1', 'Approved')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                        decisionNotes['opt-1'] === 'Approved'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Approved</span>
                    </button>
                    <button
                      onClick={() => handleDecisionToggle('opt-1', 'Rejected')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                        decisionNotes['opt-1'] === 'Rejected'
                          ? 'bg-rose-600 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Option 2 */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-zinc-900 dark:text-white">Subterranean Wine Cellar Climate Conditioning Module</span>
                  <span className="text-zinc-500 font-mono">+$24,000 USD (Optional Luxury)</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  Adds dedicated precision temperature (13°C) and humidity (65% RH) refrigeration loop with frameless acoustic glass door.
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500">Status: <strong className="text-amber-500">Awaiting Your Input</strong></span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecisionToggle('opt-2', 'Approved')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                        decisionNotes['opt-2'] === 'Approved'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Approve (+$24k)</span>
                    </button>
                    <button
                      onClick={() => handleDecisionToggle('opt-2', 'Rejected')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                        decisionNotes['opt-2'] === 'Rejected'
                          ? 'bg-rose-600 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Surveillance Stream & Direct Line to Project Director */}
        <div className="lg:col-span-5 space-y-6">

          {/* Live Surveillance vs Finished 3D Comparison Viewer */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Live Site Feed vs BIM Model
                </h3>
              </div>
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-800 text-[10px]">
                <button
                  onClick={() => setActiveCamAngle('live_site')}
                  className={`px-2 py-1 rounded font-bold transition ${
                    activeCamAngle === 'live_site'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500'
                  }`}
                >
                  Live Cam (CAM-01)
                </button>
                <button
                  onClick={() => setActiveCamAngle('finished_3d')}
                  className={`px-2 py-1 rounded font-bold transition ${
                    activeCamAngle === 'finished_3d'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500'
                  }`}
                >
                  Finished 3D
                </button>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-video group">
              <img
                src={
                  activeCamAngle === 'live_site'
                    ? (latestPhoto?.imageUrl || project.sitePhotos?.[0]?.imageUrl)
                    : (project.finishedBuildingRenderUrl)
                }
                alt="Site Camera Feed"
                className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
              />
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>{activeCamAngle === 'live_site' ? 'LIVE 4K PTZ • 60 FPS' : '3D ARCHITECTURAL TWIN'}</span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono">
                {activeCamAngle === 'live_site' ? 'ELEVATION: NORTH-WEST' : 'RENDER: FINISHED VILLA'}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-zinc-500">
                Weather on site: <strong className="text-zinc-800 dark:text-zinc-200">Clear & 24°C</strong>
              </span>
              <button
                onClick={() => onNavigateTab('finished_render')}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>Launch 360° Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

            {/* Direct Line: Project Director Communications Channel */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Direct Line: Lead Project Director
                  </h3>
                </div>
                <button
                  onClick={() => onNavigateTab('operations')}
                  className="text-[10px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1"
                >
                  <span>Full Operations Direct Line</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Chat message thread */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1 text-xs">
                {messages.map((msg, mIdx) => (
                  <div key={mIdx} className={`p-3 rounded-xl ${msg.sender.includes('You') ? 'bg-amber-500/10 border border-amber-500/20 ml-4' : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mr-4'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-zinc-900 dark:text-white">{msg.sender}</span>
                      <span className="text-[10px] text-zinc-400">{msg.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Message input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={ownerMessage}
                  onChange={(e) => setOwnerMessage(e.target.value)}
                  placeholder="Ask your Project Director a direct question..."
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-zinc-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition flex items-center gap-1 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Quick Navigation into Other Modules */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Owner Quick Tools</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => onNavigateTab('operations')}
                  className="p-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between"
                >
                  <span>Operations Hub</span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                </button>
                <button
                  onClick={() => onNavigateTab('monitoring')}
                  className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-left transition font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-between"
                >
                  <span>Latest SITREP</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
                <button
                  onClick={() => onNavigateTab('budget')}
                  className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-left transition font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-between"
                >
                  <span>BOQ Audit</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>
            </div>

        </div>
      </div>

      {/* Escrow Release Digital Signature Modal */}
      {signatureModalOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Authorize Escrow Disbursement</h3>
              </div>
              <button onClick={() => setSignatureModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            {signSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-zinc-900 dark:text-white">Escrow Payment Released!</h4>
                <p className="text-xs text-zinc-500">
                  ${selectedMilestone.costAllocationUSD.toLocaleString()} successfully transferred to contractor escrow payout queue.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Milestone to Release</span>
                    <span className="font-bold text-zinc-900 dark:text-white text-sm">{selectedMilestone.name}</span>
                    <div className="flex justify-between pt-1 text-zinc-600 dark:text-zinc-400 font-mono">
                      <span>Disbursement Amount:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">${selectedMilestone.costAllocationUSD.toLocaleString()}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    By confirming, you certify that you have reviewed the Independent Structural QA/QC audit logs and authorize the bank escrow release.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Client Authorization PIN / Code</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={signerPin}
                    onChange={(e) => setSignerPin(e.target.value)}
                    placeholder="Enter 4 or 6 digit PIN (e.g. 1234)"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-mono tracking-widest text-center focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSignatureModalOpen(false)}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveEscrow}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Release</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Organization Governance & Portfolio Modal */}
      <OrganizationManagementModal
        isOpen={orgModalOpen}
        onClose={() => setOrgModalOpen(false)}
        onProjectCreated={(newProj) => {
          onUpdateProject?.(newProj);
        }}
      />

      {/* Project Governance Audit Trail Modal */}
      <GovernanceAuditTrailModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  );
};
