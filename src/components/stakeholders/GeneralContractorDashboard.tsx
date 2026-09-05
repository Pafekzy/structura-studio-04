import React, { useState } from 'react';
import {
  HardHat,
  Users,
  Truck,
  ShieldAlert,
  CheckCircle2,
  Plus,
  Upload,
  Clock,
  Calendar,
  DollarSign,
  AlertTriangle,
  Wrench,
  Camera,
  ChevronRight,
  Sun,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Sparkles,
  Radio
} from 'lucide-react';
import { ConstructionProject, NavigationTab } from '../../types';
import { PendingInvitationsBanner } from '../governance/PendingInvitationsBanner';

interface GeneralContractorDashboardProps {
  project: ConstructionProject;
  onUpdateProject?: (updated: ConstructionProject) => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenAdvisorModal: () => void;
}

export const GeneralContractorDashboard: React.FC<GeneralContractorDashboardProps> = ({
  project,
  onUpdateProject,
  onNavigateTab,
  onOpenAdvisorModal,
}) => {
  const [headcount, setHeadcount] = useState<number>(38);
  const [activeWeather, setActiveWeather] = useState<string>('Clear & Sunny (26°C)');
  const [safetyTalkDone, setSafetyTalkDone] = useState<boolean>(true);

  // Work Orders state
  const [workOrders, setWorkOrders] = useState<Array<{ id: string; trade: string; task: string; crewSize: number; status: 'Active' | 'Completed' | 'Delayed' }>>([
    { id: 'wo-1', trade: 'Envelope & Glazing', task: 'Install Schüco AWS 75.SI+ units on Bays 6-10 (Level 2 West)', crewSize: 8, status: 'Active' },
    { id: 'wo-2', trade: 'Structural Concrete', task: 'Strip formwork from Level 2 cantilever beam CB-4 and prep for inspection', crewSize: 6, status: 'Completed' },
    { id: 'wo-3', trade: 'Roof Waterproofing', task: 'Heat-weld Sika Sarnafil TS 77-20 perimeter flashing on terrace deck', crewSize: 5, status: 'Active' },
    { id: 'wo-4', trade: 'MEP Electrical & Rough-In', task: 'Pull 400A main distribution feeds through sub-level conduits', crewSize: 7, status: 'Active' },
    { id: 'wo-5', trade: 'Plumbing & Drainage', task: 'Pressure test 100mm sanitary stack risers up to roof level', crewSize: 4, status: 'Active' },
  ]);

  // Proof of work upload state
  const [claimAmount, setClaimAmount] = useState<number>(320000);
  const [claimMilestone, setClaimMilestone] = useState<string>('Phase 3: Envelope & Glazing');
  const [claimSubmitted, setClaimSubmitted] = useState<boolean>(false);

  const handleToggleWorkOrder = (id: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === id) {
        return {
          ...wo,
          status: wo.status === 'Completed' ? 'Active' : 'Completed',
        };
      }
      return wo;
    }));
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimSubmitted(true);
    setTimeout(() => {
      setClaimSubmitted(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Pending Project Governance Appointment Invitations */}
      <PendingInvitationsBanner />

      {/* Header Banner - General Contractor Site Operations Station */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-sm transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5" />
                <span>Prime General Contractor Station</span>
              </span>
              <span className="text-xs font-mono text-zinc-400">SITE SUPERINTENDENT FIELD OPS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Site Operations, Trade Dispatch & Milestone Claims
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Daily labor deployment, heavy plant logistics, tool-box safety compliance, and progress claim submissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('operations')}
              className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-500/40 transition flex items-center gap-2 shadow-sm"
            >
              <Radio className="w-4 h-4 text-amber-500" />
              <span>Direct Line & RFI Register</span>
            </button>
            <button
              onClick={() => onNavigateTab('inspection')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition flex items-center gap-2 shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Upload Site Inspection Photos</span>
            </button>
            <button
              onClick={onOpenAdvisorModal}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-xs border border-zinc-200 dark:border-zinc-800 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Site Safety AI Check</span>
            </button>
          </div>
        </div>

        {/* Real-time Field Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Workforce On-Site</span>
            <span className="font-bold text-zinc-900 dark:text-white text-sm font-mono">{headcount} Tradesmen (5 Crews)</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Zero-Incident Streak</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">142 Days Safe</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Daily Toolbox Safety Brief</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Completed at 06:45 AM</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Tower Crane Status</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm font-mono">Potain MDT 219 (Active)</span>
          </div>
        </div>
      </div>

      {/* Main Dual Columns: Left (Daily Trade Dispatch & Heavy Plant) vs Right (Progress Claim Submission & Laydown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (7 cols): Trade Work Orders & Heavy Equipment Logistics */}
        <div className="lg:col-span-7 space-y-6">

          {/* Active Work Order Dispatch Board */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  <span>Daily Shift Work Orders & Trade Dispatch</span>
                </h3>
                <p className="text-xs text-zinc-500">Active tasks assigned to sub-trade crews for today's shift</p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 self-start sm:self-auto">
                Shift: 07:00 - 17:30
              </span>
            </div>

            <div className="space-y-2.5">
              {workOrders.map((wo) => {
                const isCompleted = wo.status === 'Completed';
                return (
                  <div
                    key={wo.id}
                    className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                      isCompleted
                        ? 'bg-emerald-500/5 border-emerald-500/20 opacity-75'
                        : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{wo.trade}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {wo.crewSize} Crew
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{wo.task}</p>
                    </div>

                    <button
                      onClick={() => handleToggleWorkOrder(wo.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Done' : 'Mark Done'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Heavy Equipment & Plant Logistics Matrix */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500" />
                  <span>Heavy Equipment & Plant Operations Log</span>
                </h3>
                <p className="text-xs text-zinc-500">Operating hours, fuel status, and safety inspection clearance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">Potain MDT 219 Tower Crane</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono font-bold text-[10px]">OPERATIONAL</span>
                </div>
                <p className="text-[11px] text-zinc-500">45m Jib • 8.0t Max Capacity • Inspected: Yesterday</p>
                <div className="text-[10px] text-zinc-400 font-mono">Assigned to: Schüco Glazing Hoisting</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">Putzmeister BSF 36-4 Pump</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-mono font-bold text-[10px]">STANDBY</span>
                </div>
                <p className="text-[11px] text-zinc-500">36m 4-Section Z-Fold Boom • Ready for Terrace Cap Pour</p>
                <div className="text-[10px] text-zinc-400 font-mono">Scheduled: Thursday 08:00 AM</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Progress Claim Submission & Material Laydown Yard */}
        <div className="lg:col-span-5 space-y-6">

          {/* Milestone Proof-of-Work Progress Claim Submission */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Submit Milestone Progress Claim
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Escrow Trigger</span>
            </div>

            {claimSubmitted ? (
              <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Progress Claim Submitted!</h4>
                <p className="text-xs text-zinc-500">
                  Claim for ${claimAmount.toLocaleString()} has been queued for Project Director review & QA/QC audit.
                </p>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-bold block">Target Milestone Phase</label>
                  <select
                    value={claimMilestone}
                    onChange={(e) => setClaimMilestone(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  >
                    {project.milestones.map(m => (
                      <option key={m.id} value={m.name}>{m.name} (${m.costAllocationUSD.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-bold block">Claim Amount (USD)</label>
                  <input
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="p-3 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-1 cursor-pointer hover:border-amber-500 transition">
                  <Upload className="w-5 h-5 text-zinc-400 mx-auto" />
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px]">Attach Subcontractor Invoices & QA Certs</span>
                  <span className="text-[10px] text-zinc-400">PDF, JPG or BIM IFC Models</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Claim for Escrow Release</span>
                </button>
              </form>
            )}
          </div>

          {/* Laydown Yard & Material Delivery Receipts */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Laydown Yard Inventory (84% Full)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Zone A & B</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-white block">Schüco AWS 75.SI+ Glazing (16 Crates)</span>
                  <span className="text-[10px] text-zinc-500">Laydown Zone B • Verified by SGS</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">READY</span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-white block">Sika Sarnafil TS 77-20 Membrane Rolls</span>
                  <span className="text-[10px] text-zinc-500">Laydown Zone A • 12 Rolls Dry-Stored</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">READY</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
