import React, { useState } from 'react';
import {
  Building2,
  Layers,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  Sparkles,
  Filter,
  Plus,
  Calendar,
  GitBranch,
  DollarSign,
  Users,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  Calculator,
  ShieldCheck
} from 'lucide-react';
import { ConstructionProject, NavigationTab } from '../../types';
import { PendingInvitationsBanner } from '../governance/PendingInvitationsBanner';
import { ProjectGovernanceTeamView } from '../governance/ProjectGovernanceTeamView';

interface ProjectDirectorDashboardProps {
  project: ConstructionProject;
  onUpdateProject?: (updated: ConstructionProject) => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenAdvisorModal: () => void;
}

interface RFIItem {
  id: string;
  rfiNumber: string;
  title: string;
  subcontractor: string;
  discipline: 'Structural' | 'Architectural' | 'MEP & HVAC' | 'Facade & Envelope';
  status: 'Open - Action Required' | 'Under Architectural Review' | 'Closed / Approved';
  priority: 'Critical' | 'High' | 'Normal';
  submittedDate: string;
  dueDate: string;
  description: string;
  response?: string;
}

export const ProjectDirectorDashboard: React.FC<ProjectDirectorDashboardProps> = ({
  project,
  onUpdateProject,
  onNavigateTab,
  onOpenAdvisorModal,
}) => {
  const [rfis, setRfis] = useState<RFIItem[]>([
    {
      id: 'rfi-101',
      rfiNumber: 'RFI-2026-084',
      title: 'Cantilever Terrace Thermal Break Anchor Clashing with Column Rebar C4',
      subcontractor: 'Apex Facade Systems Ltd',
      discipline: 'Structural',
      status: 'Open - Action Required',
      priority: 'Critical',
      submittedDate: '2026-08-24',
      dueDate: '2026-08-27',
      description: 'Schöck Isokorb thermal break anchor brackets at Grid C4 conflict with vertical 25mm rebar cage. Requesting structural engineer clearance for 30mm horizontal offset.',
      response: 'Structural engineering team cleared 30mm horizontal offset provided supplementary 12mm hairpin rebar is tied as per Detail SK-104.',
    },
    {
      id: 'rfi-102',
      rfiNumber: 'RFI-2026-085',
      title: 'MEP Chilled Water Pipe Penetration Sleeve through Level 1 Shear Wall',
      subcontractor: 'Boreas Mechanical & Climate Corp',
      discipline: 'MEP & HVAC',
      status: 'Under Architectural Review',
      priority: 'High',
      submittedDate: '2026-08-25',
      dueDate: '2026-08-28',
      description: 'Requesting approval to core 160mm sleeve through Shear Wall SW-2 at elevation +3.45m for primary VRF condenser loop.',
    },
    {
      id: 'rfi-103',
      rfiNumber: 'RFI-2026-086',
      title: 'Jura Beige Limestone Honed Stone Miter Joint Detail at Portico Corner',
      subcontractor: 'Vanguard Stonecraft Artisans',
      discipline: 'Architectural',
      status: 'Closed / Approved',
      priority: 'Normal',
      submittedDate: '2026-08-20',
      dueDate: '2026-08-24',
      description: 'Submitting shop drawing Revision C for quill-edge 45° miter joint on 30mm travertine panels.',
      response: 'Approved as noted. Maintain 4mm elastomeric joint seal.',
    }
  ]);

  const [selectedRfi, setSelectedRfi] = useState<RFIItem | null>(rfis[0]);
  const [rfiResponseText, setRfiResponseText] = useState('');
  const [activeTabDiscipline, setActiveTabDiscipline] = useState<string>('All');

  // Change Order Simulator State
  const [simCostDelta, setSimCostDelta] = useState<number>(15000);
  const [simScheduleDeltaDays, setSimScheduleDeltaDays] = useState<number>(4);

  const handleResolveRfi = (rfiId: string) => {
    setRfis(prev => prev.map(r => {
      if (r.id === rfiId) {
        return {
          ...r,
          status: 'Closed / Approved' as const,
          response: rfiResponseText || 'Approved and issued to site superintendent with stamped revisions.',
        };
      }
      return r;
    }));
    setRfiResponseText('');
  };

  const filteredRfis = activeTabDiscipline === 'All'
    ? rfis
    : rfis.filter(r => r.discipline === activeTabDiscipline);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Pending Project Governance Appointment Invitations */}
      <PendingInvitationsBanner />

      {/* Header Banner - Senior Project Director Command Center */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-sm transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                <span>Senior Project Director Command Center</span>
              </span>
              <span className="text-xs font-mono text-zinc-400">LEAD ARCHITECT / OWNER'S REP PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Master Project Orchestration & Engineering Control
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Cross-discipline critical path management, Earned Value Performance (EVM), RFI technical governance, and trade contractor variance control.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('monitoring')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Issue Executive SITREP</span>
            </button>
            <button
              onClick={onOpenAdvisorModal}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-xs border border-zinc-200 dark:border-zinc-800 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Critical Path Analysis</span>
            </button>
          </div>
        </div>

        {/* EVM Performance Benchmarks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Schedule Index (SPI)</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">1.04 (Ahead of Schedule)</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Cost Index (CPI)</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">1.02 (Under Budget)</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Active Critical Path</span>
            <span className="font-bold text-zinc-900 dark:text-white text-sm">Envelope & Glazing (Phase 3)</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Pending Technical RFIs</span>
            <span className="font-bold text-amber-500 text-sm font-mono">2 Open / 1 Critical</span>
          </div>
        </div>
      </div>

      {/* Main Dual Grid: Left Column (RFI Management & Change Order Modeling) vs Right Column (Critical Path & Trade Scorecards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (7 cols): RFI Technical Governance Hub */}
        <div className="lg:col-span-7 space-y-6">

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Technical RFI & Submittal Log</span>
                </h3>
                <p className="text-xs text-zinc-500">Architectural clarifications, structural clashing, and engineering responses</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('operations')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>Open Governed Operations Hub</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-zinc-500 font-medium">Filter by engineering discipline:</span>
              {/* Discipline Filter */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px]">
                {['All', 'Structural', 'MEP & HVAC', 'Architectural'].map((disc) => (
                  <button
                    key={disc}
                    onClick={() => setActiveTabDiscipline(disc)}
                    className={`px-2 py-0.5 rounded font-semibold transition ${
                      activeTabDiscipline === disc
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-500'
                    }`}
                  >
                    {disc}
                  </button>
                ))}
              </div>
            </div>

            {/* RFI Cards */}
            <div className="space-y-3">
              {filteredRfis.map((rfi) => {
                const isSelected = selectedRfi?.id === rfi.id;
                const isCritical = rfi.priority === 'Critical';

                return (
                  <div
                    key={rfi.id}
                    onClick={() => setSelectedRfi(rfi)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{rfi.rfiNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCritical ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {rfi.priority} Priority
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">Due: {rfi.dueDate}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">{rfi.title}</h4>
                        <div className="text-[11px] text-zinc-500">Subcontractor: <strong>{rfi.subcontractor}</strong> ({rfi.discipline})</div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                        rfi.status === 'Closed / Approved'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : rfi.status === 'Open - Action Required'
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {rfi.status}
                      </span>
                    </div>

                    {/* Expanded Response Area if Selected */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
                        <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Issue Description:</span>
                          <p className="text-[11px] leading-relaxed">{rfi.description}</p>
                        </div>

                        {rfi.response ? (
                          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Director Resolution:</span>
                            <p className="text-[11px] text-zinc-800 dark:text-zinc-200">{rfi.response}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                              Issue Lead Architectural / Structural Directive:
                            </label>
                            <textarea
                              rows={2}
                              value={rfiResponseText}
                              onChange={(e) => setRfiResponseText(e.target.value)}
                              placeholder="Provide technical directive, approved drawing revision, or tolerance variance..."
                              className="w-full p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleResolveRfi(rfi.id)}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Issue Engineering Approval & Close RFI</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Change Order Schedule & Financial Impact Simulator */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-purple-500" />
                  <span>Change Order Impact Modeling Engine</span>
                </h3>
                <p className="text-xs text-zinc-500">Simulate budget & schedule critical path impact before client escalation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">Simulated Scope Cost Delta:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">${simCostDelta.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={2500}
                  value={simCostDelta}
                  onChange={(e) => setSimCostDelta(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">Simulated Schedule Impact:</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">+{simScheduleDeltaDays} Days</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={simScheduleDeltaDays}
                  onChange={(e) => setSimScheduleDeltaDays(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-zinc-900 dark:text-white block">Projected Completion Date After Scope Addition:</span>
                <span className="text-[11px] text-zinc-500">Nov 18, 2026 (Handover buffer preserved: 12 days remaining)</span>
              </div>
              <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs font-mono self-start sm:self-auto">
                Risk: Low
              </span>
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Critical Path Gantt Matrix & Trade Performance Scorecards */}
        <div className="lg:col-span-5 space-y-6">

          {/* Critical Path Gantt Sequence */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Critical Path Milestones
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">6 Stages</span>
            </div>

            <div className="space-y-2.5">
              {project.milestones.map((m, idx) => (
                <div key={m.id} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {idx + 1}. {m.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      m.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' :
                      m.status === 'In Progress' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${m.progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>{m.plannedStartDate} → {m.plannedEndDate}</span>
                    <span>{m.progressPercentage}% Complete</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subcontractor Performance Scorecard */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Subcontractor Performance Scorecard
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Live Ratings</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">Apex Facade Systems (Glazing)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">Score: 96 / 100</span>
                </div>
                <p className="text-[10px] text-zinc-500">Zero safety infractions. 100% QA/QC acoustic test pass rate.</p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">Titan Concrete & Rebar Ltd</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">Score: 98 / 100</span>
                </div>
                <p className="text-[10px] text-zinc-500">Level 2 slab pour achieved 42.8 MPa (exceeded 35 MPa spec).</p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">Boreas Mechanical (VRF HVAC)</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">Score: 91 / 100</span>
                </div>
                <p className="text-[10px] text-zinc-500">1 RFI pending sleeve clearance; fabrication on schedule.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
