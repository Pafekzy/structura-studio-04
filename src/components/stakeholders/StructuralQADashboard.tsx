import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Camera,
  Activity,
  Plus,
  Award,
  FileText,
  ArrowRight,
  Sparkles,
  Check,
  Crosshair,
  Layers,
  ChevronRight,
  Radio
} from 'lucide-react';
import { ConstructionProject, NavigationTab } from '../../types';
import { PendingInvitationsBanner } from '../governance/PendingInvitationsBanner';

interface StructuralQADashboardProps {
  project: ConstructionProject;
  onUpdateProject?: (updated: ConstructionProject) => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenAdvisorModal: () => void;
}

interface DefectTicket {
  id: string;
  ticketNo: string;
  zone: string;
  element: string;
  severity: 'Critical' | 'Medium' | 'Low';
  description: string;
  status: 'Open' | 'Under Rectification' | 'Passed Re-Inspection';
  remedialAction: string;
  inspectedBy: string;
  timestamp: string;
}

export const StructuralQADashboard: React.FC<StructuralQADashboardProps> = ({
  project,
  onUpdateProject,
  onNavigateTab,
  onOpenAdvisorModal,
}) => {
  const [defectTickets, setDefectTickets] = useState<DefectTicket[]>([
    {
      id: 'ncr-1',
      ticketNo: 'NCR-STR-2026-19',
      zone: 'Level 2 Roof Terrace (Bay 4)',
      element: 'Sika Waterproofing Membrane Flashing',
      severity: 'Medium',
      description: 'Minor wrinkle in synthetic FPO membrane overlap at corner upstand. Needs heat-welded patch and vacuum bell test.',
      status: 'Passed Re-Inspection',
      remedialAction: 'Contractor heat-welded 150mm patch and performed soap-solution vacuum bubble test. Result: 0 leaks at -50 kPa.',
      inspectedBy: 'Dr. Henrik Lindqvist',
      timestamp: '2026-08-25 14:20',
    },
    {
      id: 'ncr-2',
      ticketNo: 'NCR-STR-2026-20',
      zone: 'Ground Floor Portico (Column C2)',
      element: 'Jura Limestone Stainless Steel Anchor Ties',
      severity: 'Low',
      description: 'Check anchor embedment torque on stainless steel bracket bolts. Specified torque is 45 Nm.',
      status: 'Open',
      remedialAction: 'Re-torque with calibrated torque wrench and mark with witness paint.',
      inspectedBy: 'Elena Rossi, QA Lead',
      timestamp: '2026-08-26 09:10',
    }
  ]);

  const [selectedTicket, setSelectedTicket] = useState<DefectTicket | null>(defectTickets[0]);
  const [certIssued, setCertIssued] = useState<boolean>(false);

  const handlePassTicket = (ticketId: string) => {
    setDefectTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'Passed Re-Inspection' as const,
        };
      }
      return t;
    }));
  };

  const handleIssueCertificate = () => {
    setCertIssued(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Pending Project Governance Appointment Invitations */}
      <PendingInvitationsBanner />

      {/* Header Banner - Structural QA/QC Engineering Control Portal */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-sm transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Structural QA/QC Auditor Portal</span>
              </span>
              <span className="text-xs font-mono text-zinc-400">INDEPENDENT TESTING & COMPLIANCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Material Lab Testing, NDT & Building Code Audits
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Concrete cylinder compressive breaks, laser plumbness verification, Non-Destructive Testing (NDT), and municipal code sign-offs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('operations')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-500/40 transition flex items-center gap-2 shadow-sm"
            >
              <Radio className="w-4 h-4 text-emerald-500" />
              <span>Owner Direct Line & Audits</span>
            </button>
            <button
              onClick={() => onNavigateTab('inspection')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>AI Visual Defect Scan</span>
            </button>
            <button
              onClick={onOpenAdvisorModal}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-xs border border-zinc-200 dark:border-zinc-800 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Tolerance Validator</span>
            </button>
          </div>
        </div>

        {/* Structural Quality Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Quality Compliance Index</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">98.4% (Exemplary)</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">28-Day Concrete Compressive</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">42.8 MPa (Spec: 35.0 MPa)</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Laser Plumbness Tolerance</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">±1.2mm (Limit: ±3.0mm)</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Active NCR Defect Tickets</span>
            <span className="font-bold text-amber-500 text-sm font-mono">1 Open / 0 Critical</span>
          </div>
        </div>
      </div>

      {/* Main Dual Column: Left (Laboratory Compression & Laser Tolerance) vs Right (NCR Punch List & Compliance Certification) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (7 cols): Laboratory Concrete Breaks & Laser Plumbness Matrix */}
        <div className="lg:col-span-7 space-y-6">

          {/* Material Testing Lab Database */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Independent Material Laboratory Test Results</span>
                </h3>
                <p className="text-xs text-zinc-500">Certified cylinder crush tests, tensile rebar breaks & membrane tensile data</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                Accreditation: ISO/IEC 17025
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Test 1 */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-white">Batch #CON-304: Level 2 Cantilever Slab Pour</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">PASS (+22% MARGIN)</span>
                  </div>
                  <span className="text-zinc-400 font-mono text-[10px]">Sample: 150mm Cylinder</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <div>7-Day Strength: <strong className="text-zinc-900 dark:text-white font-mono">31.2 MPa</strong></div>
                  <div>28-Day Strength: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">42.8 MPa</strong></div>
                  <div>Slump Flow: <strong className="text-zinc-900 dark:text-white font-mono">680 mm</strong></div>
                </div>
                <div className="text-[10px] text-zinc-500 border-t border-zinc-200 dark:border-zinc-800/80 pt-1.5 flex justify-between">
                  <span>Testing Authority: <strong>SGS Geotechnical & Materials Laboratory</strong></span>
                  <span className="text-emerald-600 font-bold">Certificate #SGS-CON-8842</span>
                </div>
              </div>

              {/* Test 2 */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-white">Batch #GLZ-2026-88: Schüco AWS 75.SI+ Glazing Units</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">PASS (STC 44)</span>
                  </div>
                  <span className="text-zinc-400 font-mono text-[10px]">Acoustic & Thermal</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <div>Thermal Transmittance: <strong className="text-zinc-900 dark:text-white font-mono">U = 0.8 W/m²K</strong></div>
                  <div>Argon Gas Fill: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">92.4%</strong></div>
                  <div>Air Infiltration: <strong className="text-zinc-900 dark:text-white font-mono">Class 4</strong></div>
                </div>
                <div className="text-[10px] text-zinc-500 border-t border-zinc-200 dark:border-zinc-800/80 pt-1.5 flex justify-between">
                  <span>Testing Authority: <strong>ift Rosenheim Fenestration Institute</strong></span>
                  <span className="text-emerald-600 font-bold">Certificate #IFT-GLZ-9912</span>
                </div>
              </div>
            </div>
          </div>

          {/* Laser Total Station & 3D Plumbness Tolerance Matrix */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-emerald-500" />
                  <span>3D Laser Point Cloud Plumbness & Elevation Benchmark</span>
                </h3>
                <p className="text-xs text-zinc-500">Leica TS16 Total Station scan across 14 structural bays and slab edges</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">Perimeter Columns C1-C8</span>
                  <span className="text-emerald-600 font-mono font-bold">±1.2 mm Dev</span>
                </div>
                <p className="text-[11px] text-zinc-500">Allowable structural code tolerance: ±3.0 mm. Plumbness cleared.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">Cantilever Balcony Camber</span>
                  <span className="text-emerald-600 font-mono font-bold">+2.4 mm Upward</span>
                </div>
                <p className="text-[11px] text-zinc-500">Pre-camber compensation verified prior to heavy curtain wall install.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): NCR Defect Punch-List & Statutory Certificate */}
        <div className="lg:col-span-5 space-y-6">

          {/* Non-Conformance Report (NCR) Defect Tickets */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  NCR Defect & Punch List
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{defectTickets.length} Logged</span>
            </div>

            <div className="space-y-2.5">
              {defectTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const isPassed = t.status === 'Passed Re-Inspection';

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{t.ticketNo}</span>
                          <span className="text-[10px] font-mono text-zinc-400">{t.zone}</span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{t.element}</h4>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isPassed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{t.description}</p>
                        <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500">
                          <strong>Remedial Action:</strong> {t.remedialAction}
                        </div>
                        {!isPassed && (
                          <button
                            onClick={() => handlePassTicket(t.id)}
                            className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Sign Off & Clear Defect</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statutory Building Control Compliance Sign-Off */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Building Code Compliance Cert
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Phase 3 Clearance</span>
            </div>

            {certIssued ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <FileCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Certificate Stamped & Sealed</h4>
                <p className="text-[11px] text-zinc-500">
                  Compliance Certificate #STR-2026-CERT-89 issued for municipal escrow clearance.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Clear all Phase 3 envelope, structural concrete, and acoustic waterproofing inspections to unlock the contractor's milestone payout claim.
                </p>
                <button
                  onClick={handleIssueCertificate}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Issue Phase 3 QA Clearance Certificate</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
