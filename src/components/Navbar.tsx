import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  Sparkles,
  FileText,
  ChevronDown,
  TrendingUp,
  HardHat,
  Camera,
  Activity,
  RotateCw,
  Menu,
  X,
  Check,
  Sun,
  Moon,
  Users,
  Shield,
  GitBranch,
  Lock,
  LogOut,
  KeyRound,
  Globe,
  User,
  Sliders,
  Radio
} from 'lucide-react';
import { ConstructionProject, NavigationTab, UserRole } from '../types';
import { StructuraLogo } from './StructuraLogo';
import { useAuth } from '../context/AuthContext';
import { ProfileModal } from './auth/ProfileModal';

interface NavbarProps {
  projects: ConstructionProject[];
  activeProject?: ConstructionProject;
  activeProjectId?: string;
  onSelectProject?: (projOrId: any) => void;
  activeRole: UserRole;
  onChangeRole?: (role: UserRole) => void;
  onSelectRole?: (role: UserRole) => void;
  onOpenNewProjectModal?: () => void;
  onOpenNewEstimator?: () => void;
  onOpenAdvisorModal: () => void;
  onPrintReport?: () => void;
  activeTab: NavigationTab | string;
  onChangeTab?: (tab: NavigationTab) => void;
  onSelectTab?: (tab: NavigationTab) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects = [],
  activeProject: propActiveProject,
  activeProjectId,
  onSelectProject,
  activeRole = 'Owner / Client',
  onChangeRole,
  onSelectRole,
  onOpenNewProjectModal,
  onOpenNewEstimator,
  onOpenAdvisorModal,
  onPrintReport,
  activeTab = 'stakeholder_hub',
  onChangeTab,
  onSelectTab,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const {
    user,
    userProfile,
    userRole,
    logout,
    isDeveloperDemoMode,
    toggleDeveloperDemoMode
  } = useAuth();

  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Resolve current active project safely
  const activeProject =
    propActiveProject ||
    projects.find((p) => p.id === activeProjectId) ||
    projects[0] || {
      id: 'default-proj',
      name: 'Active Construction Project',
      overallProgressPercentage: 0,
      confidenceScore: 95,
      location: 'Site Location',
    };

  const handleTabChange = (tabId: NavigationTab) => {
    if (onChangeTab) onChangeTab(tabId);
    if (onSelectTab) onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleProjectSelect = (proj: ConstructionProject) => {
    if (onSelectProject) {
      onSelectProject(proj.id);
      onSelectProject(proj);
    }
    setProjectDropdownOpen(false);
  };

  const handleExitPortal = () => {
    handleTabChange('stakeholder_hub');
  };

  // Role-Peculiar Navigation Tabs Map - Displays ONLY the views permitted for this single logged-in role
  const getRoleTabs = (role: UserRole | string): Array<{ id: NavigationTab; label: string; shortLabel: string; icon: React.ReactNode }> => {
    switch (role) {
      case 'Owner / Client':
        return [
          { id: 'stakeholder_owner', label: 'Owner Command Desk', shortLabel: 'Owner Desk', icon: <Shield className="w-3.5 h-3.5 shrink-0 text-amber-500" /> },
          { id: 'operations', label: 'Direct Line & Operations', shortLabel: 'Operations', icon: <Radio className="w-3.5 h-3.5 shrink-0 text-amber-500" /> },
          { id: 'budget', label: 'BOQ & Escrow Payouts', shortLabel: 'Escrow & BOQ', icon: <TrendingUp className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'finished_render', label: '360° Turnkey 3D Model', shortLabel: '3D Model', icon: <RotateCw className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'monitoring', label: 'Executive SITREPs', shortLabel: 'SITREPs', icon: <FileText className="w-3.5 h-3.5 shrink-0" /> },
        ];

      case 'Senior Project Director':
        return [
          { id: 'stakeholder_director', label: 'Director Command Center', shortLabel: 'Director Hub', icon: <GitBranch className="w-3.5 h-3.5 shrink-0 text-blue-500" /> },
          { id: 'operations', label: 'Operations & RFIs', shortLabel: 'Operations', icon: <Radio className="w-3.5 h-3.5 shrink-0 text-blue-500" /> },
          { id: 'cockpit', label: 'Executive Cockpit', shortLabel: 'Cockpit', icon: <Activity className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'monitoring', label: 'Periodic Logs & RFIs', shortLabel: 'Logs & RFIs', icon: <FileText className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'inspection', label: 'AI Visual Site Audits', shortLabel: 'AI Audits', icon: <Camera className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'budget', label: 'BOQ & Escrow Approvals', shortLabel: 'Escrow', icon: <TrendingUp className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'finished_render', label: '3D BIM Architecture', shortLabel: '3D BIM', icon: <RotateCw className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'new_estimator', label: 'Project Estimator', shortLabel: 'Estimator', icon: <HardHat className="w-3.5 h-3.5 shrink-0" /> },
        ];

      case 'General Contractor':
        return [
          { id: 'stakeholder_contractor', label: 'General Contractor Station', shortLabel: 'GC Station', icon: <HardHat className="w-3.5 h-3.5 shrink-0 text-amber-500" /> },
          { id: 'operations', label: 'Direct Line & RFI Register', shortLabel: 'Operations', icon: <Radio className="w-3.5 h-3.5 shrink-0 text-amber-500" /> },
          { id: 'monitoring', label: 'Daily Shift Logs & SITREPs', shortLabel: 'Shift Logs', icon: <FileText className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'inspection', label: 'Field Photo Audits', shortLabel: 'Field Audits', icon: <Camera className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'budget', label: 'Trade Progress Claims', shortLabel: 'Trade Claims', icon: <TrendingUp className="w-3.5 h-3.5 shrink-0" /> },
        ];

      case 'Structural QA/QC Auditor':
        return [
          { id: 'stakeholder_qaqc', label: 'QA/QC Auditor Station', shortLabel: 'QA/QC Station', icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> },
          { id: 'operations', label: 'Direct Line & Audits', shortLabel: 'Direct Line', icon: <Radio className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> },
          { id: 'inspection', label: 'AI Defect Scanner', shortLabel: 'Defect AI', icon: <Camera className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'monitoring', label: 'NCRs & Material Logs', shortLabel: 'NCR Logs', icon: <FileText className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'finished_render', label: '3D Laser Plumbness', shortLabel: '3D Scans', icon: <RotateCw className="w-3.5 h-3.5 shrink-0" /> },
        ];

      default:
        return [
          { id: 'stakeholder_owner', label: 'Owner Command Desk', shortLabel: 'Owner Desk', icon: <Shield className="w-3.5 h-3.5 shrink-0 text-amber-500" /> },
          { id: 'budget', label: 'BOQ & Escrow Payouts', shortLabel: 'Escrow & BOQ', icon: <TrendingUp className="w-3.5 h-3.5 shrink-0" /> },
        ];
    }
  };

  const currentTabs = getRoleTabs(activeRole);

  const getRoleClearanceTag = (role: UserRole | string) => {
    switch (role) {
      case 'Owner / Client': return 'LEVEL 4 FIDUCIARY';
      case 'Senior Project Director': return 'LEVEL 4 DIRECTOR';
      case 'General Contractor': return 'LEVEL 3 SITE OPS';
      case 'Structural QA/QC Auditor': return 'LEVEL 4 AUDITOR';
      default: return 'LEVEL 4 CLEARANCE';
    }
  };

  const getRoleBadgeStyle = (role: UserRole | string) => {
    switch (role) {
      case 'Owner / Client': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'Senior Project Director': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'General Contractor': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'Structural QA/QC Auditor': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isEntryGateway = activeTab === 'stakeholder_hub';

  return (
    <header className="bg-white/95 dark:bg-[#070e17]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#182c44] sticky top-0 z-40 transition-colors duration-250">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">

          {/* Structura Brand & Project / Gateway Identifier */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Structura Logo */}
            <div
              onClick={handleExitPortal}
              className="cursor-pointer group flex items-center transition-transform hover:opacity-95"
              title="Return to Stakeholder Gateway Landing Page"
            >
              <StructuraLogo size="md" showText={true} />
            </div>

            <span className="text-slate-300 dark:text-slate-700 font-light text-base hidden sm:inline">/</span>

            {/* Project Breadcrumb / Selector */}
            <div className="relative hidden md:block" ref={projectDropdownRef}>
              <button
                type="button"
                onClick={() => setProjectDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f243a] border border-transparent hover:border-slate-200 dark:hover:border-[#1e3e62] transition duration-150"
              >
                <span className="max-w-[150px] lg:max-w-[200px] truncate font-semibold">{activeProject?.name || 'Select Project'}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {projectDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-[#0b1726] border border-slate-200 dark:border-[#1b3452] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Portfolio Projects</span>
                    <span className="text-[9px] text-amber-500 font-medium">STRUCTURA PORTFOLIO</span>
                  </div>
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => handleProjectSelect(proj)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                        proj.id === activeProject.id
                          ? 'bg-amber-500/10 text-amber-900 dark:text-amber-300 font-semibold border-l-2 border-amber-500'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#112438]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {proj.id === activeProject.id && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                        <span className="truncate">{proj.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#162e4a] border border-slate-200 dark:border-[#1e3e62] text-slate-700 dark:text-slate-300 shrink-0 font-mono">
                        {proj.overallProgressPercentage}%
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Authenticated Role Portal Badge */}
            {!isEntryGateway ? (
              <div className={`hidden xl:flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border ${getRoleBadgeStyle(activeRole)}`}>
                <Lock className="w-3 h-3 text-current shrink-0" />
                <span>Portal: <strong>{activeRole}</strong></span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">
                  {getRoleClearanceTag(activeRole)}
                </span>
              </div>
            ) : (
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Role Entry Gateway</span>
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Authenticated User Identity & Profile Trigger */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0e2136] hover:bg-slate-200 dark:hover:bg-[#14283f] border border-slate-200 dark:border-[#182c44] transition group"
              title="View Authenticated Profile & Governance Status"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">
                <User className="w-3 h-3" />
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none truncate max-w-[130px]">
                  {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : (user?.displayName || user?.email || 'Authenticated')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5 font-medium truncate max-w-[130px]">
                  {userRole}
                </div>
              </div>
            </button>

            {/* Developer Demo Mode Indicator */}
            {isDeveloperDemoMode && (
              <button
                onClick={toggleDeveloperDemoMode}
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/40 text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono hover:bg-amber-500/20 transition"
                title="Developer Demo Mode Active: Click to Disable"
              >
                <span>DEMO MODE</span>
              </button>
            )}

            {/* AI Advisor Button */}
            <button
              onClick={onOpenAdvisorModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0e2136] hover:bg-slate-200 dark:hover:bg-[#142f4c] border border-slate-200 dark:border-[#1e3e62] text-slate-800 dark:text-slate-200 text-xs font-semibold transition shadow-sm"
              title="Consult AI Senior Construction Director"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">AI Director</span>
            </button>

            {/* Real Logout Action */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-xs font-semibold transition"
              title="Sign Out of Structura"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Sign Out</span>
            </button>

            {/* Export SITREP Button */}
            {onPrintReport && !isEntryGateway && (
              <button
                onClick={onPrintReport}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-[#0e2136] text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-[#182c44] transition"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Export</span>
              </button>
            )}

            {/* Public Portal Link */}
            <Link
              to="/"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0e2136] text-xs font-medium border border-transparent hover:border-slate-200 dark:hover:border-[#182c44] transition"
              title="Return to Structura Public Portal"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Public Portal</span>
            </Link>

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                aria-label="Toggle dark and light theme"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0e2136] border border-slate-200 dark:border-[#182c44] transition"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation drawer"
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#0d1e32] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#182c44] transition"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-[#182c44] space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Stakeholder Gateway / Exit Shortcut */}
            {!isEntryGateway ? (
              <button
                onClick={handleExitPortal}
                className="w-full p-3 rounded-xl bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit {activeRole} Portal (Return to Gateway)</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold text-center">
                Select a Role card below to enter its portal
              </div>
            )}

            {/* Active Project Switcher */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Active Project
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      handleProjectSelect(proj);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between transition ${
                      proj.id === activeProject.id
                        ? 'bg-amber-500/10 border-amber-500/50 text-slate-900 dark:text-white font-bold'
                        : 'bg-white dark:bg-[#0b1726] border-slate-200 dark:border-[#182c44] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{proj.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{proj.location}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#14283f] font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#1e3e62] shrink-0">
                      {proj.overallProgressPercentage}%
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-[#182c44]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdvisorModal();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0e2136] text-slate-900 dark:text-white border border-slate-200 dark:border-[#182c44] text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Director</span>
              </button>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0e2136] text-slate-900 dark:text-white border border-slate-200 dark:border-[#182c44] text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Public Portal</span>
              </Link>
            </div>
          </div>
        )}

        {/* Dynamic Navigation Tabs - ONLY rendered when inside an authenticated single-role portal */}
        {!isEntryGateway && (
          <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-200 dark:border-[#182c44] -mx-3 px-3 sm:mx-0 sm:px-0">
            {currentTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 shrink-0 ${
                    isActive
                      ? 'bg-[#0B192C] text-white dark:bg-amber-500 dark:text-slate-950 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#0d1e32]'
                  }`}
                >
                  <span className={isActive ? 'text-amber-400 dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'}>
                    {tab.icon}
                  </span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Authenticated User Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </header>
  );
};
