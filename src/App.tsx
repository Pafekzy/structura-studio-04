import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { ExecutiveOverview } from './components/ExecutiveOverview';
import { ProjectEstimatorWizard } from './components/ProjectEstimatorWizard';
import { PeriodicMonitoringSITREP } from './components/PeriodicMonitoringSITREP';
import { VisualInspectionAI } from './components/VisualInspectionAI';
import { BudgetVarianceEscrow } from './components/BudgetVarianceEscrow';
import { FinishedBuildingVisualizer } from './components/FinishedBuildingVisualizer';
import { AIConsultantModal } from './components/AIConsultantModal';
import { StructuraLogo } from './components/StructuraLogo';
import { MotionBackground } from './components/MotionBackground';
import { StakeholderPortalHub } from './components/stakeholders/StakeholderPortalHub';
import { OwnerDashboard } from './components/stakeholders/OwnerDashboard';
import { ProjectDirectorDashboard } from './components/stakeholders/ProjectDirectorDashboard';
import { GeneralContractorDashboard } from './components/stakeholders/GeneralContractorDashboard';
import { StructuralQADashboard } from './components/stakeholders/StructuralQADashboard';
import { AccessRestrictedView } from './components/AccessRestrictedView';
import { ProjectOperationsWorkspace } from './components/operations/ProjectOperationsWorkspace';
import { SAMPLE_PROJECTS } from './data/sampleProjects';
import { ConstructionProject, NavigationTab, UserRole } from './types';
import { Sparkles, ArrowRight } from 'lucide-react';
import { PublicHomePage } from './pages/PublicHomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { ContactPage } from './pages/ContactPage';
import { AuthPage } from './pages/AuthPage';

const ROLE_PERMITTED_TABS: Record<UserRole, NavigationTab[]> = {
  'Owner / Client': [
    'stakeholder_hub',
    'stakeholder_owner',
    'operations',
    'budget',
    'finished_render',
    'monitoring',
  ],
  'Senior Project Director': [
    'stakeholder_hub',
    'stakeholder_director',
    'operations',
    'cockpit',
    'monitoring',
    'inspection',
    'budget',
    'finished_render',
    'new_estimator',
  ],
  'General Contractor': [
    'stakeholder_hub',
    'stakeholder_contractor',
    'operations',
    'monitoring',
    'inspection',
    'budget',
  ],
  'Structural QA/QC Auditor': [
    'stakeholder_hub',
    'stakeholder_qaqc',
    'operations',
    'inspection',
    'monitoring',
    'finished_render',
  ],
};

const ROLE_DEFAULT_DASHBOARD: Record<UserRole, NavigationTab> = {
  'Owner / Client': 'stakeholder_owner',
  'Senior Project Director': 'stakeholder_director',
  'General Contractor': 'stakeholder_contractor',
  'Structural QA/QC Auditor': 'stakeholder_qaqc',
};

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [projects, setProjects] = useState<ConstructionProject[]>(() => {
    try {
      const saved = localStorage.getItem('structura_projects');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load projects from localStorage', e);
    }
    return SAMPLE_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(
    projects[0]?.id || SAMPLE_PROJECTS[0].id
  );

  // Stakeholder Portal Hub is the landing page
  const [activeTab, setActiveTab] = useState<NavigationTab>('stakeholder_hub');

  // Real authenticated user role state from AuthContext
  const { activeRole, userRole, setDeveloperActiveRole, isDeveloperDemoMode, idToken } = useAuth();
  const setActiveRole = (role: UserRole) => {
    setDeveloperActiveRole(role);
  };

  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);

  // Smooth initial splash loader fade-out
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 550);
    return () => clearTimeout(timer);
  }, []);

  // Fetch projects from backend governance service when authenticated
  useEffect(() => {
    if (!idToken) return;
    const fetchBackendProjects = async () => {
      try {
        const res = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const backendProjects = await res.json();
          if (Array.isArray(backendProjects) && backendProjects.length > 0) {
            setProjects((prev) => {
              const map = new Map<string, ConstructionProject>();
              prev.forEach((p) => map.set(p.id, p));
              backendProjects.forEach((bp: any) => {
                const existing = map.get(bp.id);
                if (existing) {
                  map.set(bp.id, {
                    ...existing,
                    ...bp,
                    milestones: existing.milestones?.length ? existing.milestones : (bp.milestones || []),
                    boq: existing.boq?.length ? existing.boq : (bp.boq || []),
                    sitePhotos: existing.sitePhotos?.length ? existing.sitePhotos : (bp.sitePhotos || []),
                    periodicLogs: existing.periodicLogs?.length ? existing.periodicLogs : (bp.periodicLogs || []),
                    situationReports: existing.situationReports?.length ? existing.situationReports : (bp.situationReports || []),
                    curveData: existing.curveData?.length ? existing.curveData : (bp.curveData || []),
                    landSpecs: existing.landSpecs || bp.landSpecs,
                    floorPlanSpecs: existing.floorPlanSpecs || bp.floorPlanSpecs,
                    materialSpecs: existing.materialSpecs || bp.materialSpecs,
                  });
                } else {
                  map.set(bp.id, bp);
                }
              });
              return Array.from(map.values());
            });
          }
        }
      } catch (e) {
        console.warn('Could not fetch projects from server', e);
      }
    };
    fetchBackendProjects();
  }, [idToken]);

  // Sync to local storage whenever projects update
  useEffect(() => {
    try {
      localStorage.setItem('structura_projects', JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }
  }, [projects]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || SAMPLE_PROJECTS[0];

  const handleUpdateActiveProject = (updatedProject: ConstructionProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const handleProjectCreated = (newProject: ConstructionProject) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setActiveTab(ROLE_DEFAULT_DASHBOARD[activeRole] || 'stakeholder_hub');
  };

  const handlePrintSITREP = () => {
    window.print();
  };

  // Check if current active tab is permitted for active role
  const isTabPermitted = (tab: NavigationTab, role: UserRole) => {
    if (tab === 'stakeholder_hub') return true;
    const permitted = ROLE_PERMITTED_TABS[role] || [];
    return permitted.includes(tab);
  };

  const hasAccess = isTabPermitted(activeTab, activeRole);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-250 structura-grid relative overflow-x-hidden">
      {/* Dynamic Ambient Background */}
      <MotionBackground showLogo />

      {/* Initial Smooth Load Screen */}
      <AnimatePresence>
        {isInitialLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070e17] text-white"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center text-center p-6"
            >
              <StructuraLogo size="hero" showText={true} showSubtitle={true} showSlogan={true} variant="dark" />

              {/* Progress Shimmer Bar */}
              <div className="w-56 sm:w-72 h-1 bg-slate-800 rounded-full mt-8 overflow-hidden relative">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                  className="w-1/2 h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 rounded-full"
                />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-3 font-mono">
                Initializing Stakeholder Governance Matrix...
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Structura Navigation Header */}
      <Navbar
        projects={projects}
        activeProject={activeProject}
        activeProjectId={activeProject.id}
        activeTab={activeTab}
        activeRole={activeRole}
        onSelectProject={(selected: any) => {
          if (typeof selected === 'string') {
            setActiveProjectId(selected);
          } else if (selected?.id) {
            setActiveProjectId(selected.id);
          }
        }}
        onSelectTab={(tab) => setActiveTab(tab)}
        onChangeTab={(tab) => setActiveTab(tab)}
        onSelectRole={(role) => setActiveRole(role)}
        onChangeRole={(role) => setActiveRole(role)}
        onOpenNewEstimator={() => setActiveTab('new_estimator')}
        onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
        onPrintReport={handlePrintSITREP}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area with Smooth Tab Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${activeRole}`}
            initial={{ opacity: 0, y: 12, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.995 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* If user navigates to an unauthorized tab for their role */}
            {!hasAccess ? (
              <AccessRestrictedView
                currentRole={activeRole}
                requestedTab={activeTab}
                onNavigateToAuthorized={() => setActiveTab(ROLE_DEFAULT_DASHBOARD[activeRole] || 'stakeholder_hub')}
                onReturnToGateway={() => setActiveTab('stakeholder_hub')}
              />
            ) : (
              <>
                {/* Landing Page: Stakeholder Selection & Governance Gateway */}
                {activeTab === 'stakeholder_hub' && (
                  <StakeholderPortalHub
                    project={activeProject}
                    activeRole={activeRole}
                    onChangeRole={(role) => setActiveRole(role)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                )}

                {/* Owner & Client Dedicated Dashboard */}
                {activeTab === 'stakeholder_owner' && (
                  <OwnerDashboard
                    project={activeProject}
                    onUpdateProject={handleUpdateActiveProject}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                )}

                {/* Senior Project Director Dedicated Dashboard */}
                {activeTab === 'stakeholder_director' && (
                  <ProjectDirectorDashboard
                    project={activeProject}
                    onUpdateProject={handleUpdateActiveProject}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                )}

                {/* General Contractor Dedicated Dashboard */}
                {activeTab === 'stakeholder_contractor' && (
                  <GeneralContractorDashboard
                    project={activeProject}
                    onUpdateProject={handleUpdateActiveProject}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                )}

                {/* Independent Structural QA/QC Auditor Dedicated Dashboard */}
                {activeTab === 'stakeholder_qaqc' && (
                  <StructuralQADashboard
                    project={activeProject}
                    onUpdateProject={handleUpdateActiveProject}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                )}

                {activeTab === 'operations' && (
                  <ProjectOperationsWorkspace
                    project={activeProject}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                )}

                {/* Shared Subsystems Accessible by Authorized Stakeholders */}
                {activeTab === 'cockpit' && (
                  <ExecutiveOverview
                    project={activeProject}
                    activeRole={activeRole}
                    onNavigateTab={(tab) => setActiveTab(tab as NavigationTab)}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                )}

                {activeTab === 'monitoring' && (
                  <PeriodicMonitoringSITREP
                    project={activeProject}
                    onUpdateProject={handleUpdateActiveProject}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                )}

                {activeTab === 'inspection' && (
                  <VisualInspectionAI
                    project={activeProject}
                    onUpdateProject={handleUpdateActiveProject}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                )}

                {activeTab === 'budget' && (
                  <BudgetVarianceEscrow
                    project={activeProject}
                    onUpdateProject={handleUpdateActiveProject}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                )}

                {activeTab === 'finished_render' && (
                  <FinishedBuildingVisualizer
                    project={activeProject}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                )}

                {activeTab === 'new_estimator' && (
                  <ProjectEstimatorWizard
                    onProjectCreated={handleProjectCreated}
                    onCancel={() => setActiveTab(ROLE_DEFAULT_DASHBOARD[activeRole] || 'stakeholder_hub')}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating AI Assistant Trigger */}
      <div className="fixed bottom-5 right-5 z-40">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsAdvisorOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0B192C] text-white dark:bg-amber-500 dark:text-slate-950 font-bold text-xs shadow-2xl hover:bg-[#122b4a] dark:hover:bg-amber-400 transition-all duration-200 border border-slate-700 dark:border-amber-400 group"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-slate-950 transition-transform group-hover:rotate-12" />
          <span>Ask AI Director</span>
        </motion.button>
      </div>

      {/* AI Senior Director Advisor Modal */}
      <AIConsultantModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        project={activeProject}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicHomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<AuthPage initialMode="login" />} />
            <Route path="/signup" element={<AuthPage initialMode="signup" />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
