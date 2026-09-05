export type MonitoringCadence = 'daily' | 'weekly' | 'fortnightly' | 'monthly';

export type NavigationTab =
  | 'cockpit'
  | 'monitoring'
  | 'inspection'
  | 'budget'
  | 'finished_render'
  | 'new_estimator'
  | 'operations'
  | 'stakeholder_hub'
  | 'stakeholder_owner'
  | 'stakeholder_director'
  | 'stakeholder_contractor'
  | 'stakeholder_qaqc';

export type UserRole = 'Owner / Client' | 'Senior Project Director' | 'General Contractor' | 'Structural QA/QC Auditor';

export interface LandSpecifications {
  plotAreaSqm: number;
  topography: 'Flat / Level Ground' | 'Sloped / Terraced' | 'Rocky Hillside' | 'Coastal / High Water Table';
  soilType: 'Standard Sandy Clay' | 'Dense Gravel / Rock' | 'Soft Clay / Silt' | 'Expansive Clay';
  zoningClassification: 'R-1 Low Density Residential' | 'R-3 Multi-Family Luxury' | 'Commercial Mixed-Use' | 'Light Industrial';
  setbackMeters: { front: number; rear: number; left: number; right: number };
  location: string;
}

export interface FloorPlanSpecifications {
  grossFloorAreaSqm: number;
  floors: number;
  buildingStyle: 'Contemporary Minimalist' | 'Industrial Modern Luxury' | 'Mediterranean Coastal' | 'Scandinavian Mass Timber' | 'Biophilic Sustainable';
  ceilingHeightMeters: number;
  bedroomCount: number;
  bathroomCount: number;
  hasBasement: boolean;
  hasSwimmingPool: boolean;
  hasRooftopDeck: boolean;
}

export interface MaterialSpecifications {
  structuralCore: 'Reinforced Concrete (RC Frame)' | 'Structural Steel & Composite Deck' | 'Mass Timber (CLT / Glulam)' | 'Reinforced Masonry & Precast' | 'Hybrid Steel-Concrete Core';
  foundationType: 'Raft / Mat Slab Foundation' | 'Deep Bored Piling & Grade Beams' | 'Continuous Strip Footing' | 'Reinforced Pad Footings & Tie Beams';
  facadeType: 'Unitized Glass Curtain Wall & Terracotta' | 'Natural Limestone & Architectural Concrete' | 'High-Performance EIFS & Timber Cladding' | 'Double-Skin Ventilated Facade';
  roofType: 'Standing Seam Zinc / Aluminum' | 'Intensive Green Living Roof' | 'Insulated Concrete Flat Deck with Solar PV' | 'Spanish Clay Tile on Trusses';
  mepTier: 'Standard Residential / Commercial Grade' | 'High-Efficiency VRF HVAC + Smart Building Controls' | 'Net-Zero Carbon (Geothermal/Solar PV + Smart Microgrid)';
  interiorGrade: 'Standard Commercial Finish' | 'Premium Contemporary Finish' | 'Ultra-Luxury Bespoke (Marble, Millwork, Smart Automation)' | 'Minimalist High-Spec Architectural';
}

export interface BOQItem {
  id: string;
  category: 'Substructure' | 'Superstructure' | 'Envelope & Facade' | 'Roofing' | 'MEP & HVAC' | 'Interior Finishes' | 'Site Works' | 'Prelims & Overheads';
  description: string;
  unit: string;
  quantity: number;
  unitRateUSD: number;
  totalCostUSD: number;
  spentUSD: number;
  variancePercentage: number;
  status: 'On Target' | 'Minor Overrun' | 'Favorable' | 'Critical Variance';
}

export interface ConstructionMilestone {
  id: string;
  name: string;
  phaseOrder: number;
  plannedStartDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  status: 'Completed' | 'In Progress' | 'Upcoming' | 'Delayed';
  progressPercentage: number;
  costAllocationUSD: number;
  payoutApproved: boolean;
  escrowStatus: 'Released' | 'Pending Sign-Off' | 'On Hold' | 'Not Reached';
  certificationsRequired: string[];
  certificationsCleared: boolean;
  contractorClaimUSD: number;
}

export interface SitePhotoInspection {
  id: string;
  timestamp: string;
  phaseId: string;
  phaseName: string;
  zone: string;
  imageUrl: string;
  caption: string;
  inspectedBy: string;
  aiAnalysis?: {
    overallHealth: 'Optimal' | 'Caution - Minor Deviations' | 'Critical - Immediate Action Required' | 'HUMAN_REVIEW_REQUIRED';
    completionEstimatePercent: number;
    detectedElements: string[];
    complianceScore: number;
    defectFindings: Array<{
      severity: 'Low' | 'Medium' | 'High';
      title: string;
      description: string;
      recommendation: string;
    }>;
    safetyObservations: string[];
    executiveSummary: string;
    isAiAssisted?: boolean;
    aiStatus?: string;
    disclaimer?: string;
    varianceAlert?: {
      hasAlert: boolean;
      varianceType: string;
      varianceNote: string;
    };
  };
}

export interface PeriodicLogEntry {
  id: string;
  date: string;
  cadence: MonitoringCadence;
  weather: 'Clear & Sunny (26°C)' | 'Overcast (19°C)' | 'Heavy Rain (14°C - Concrete Halted)' | 'Windy (18°C)';
  manpowerHeadcount: number;
  activeTrades: string[];
  tasksAccomplished: string[];
  materialsReceived: string[];
  safetyIncidentsCount: number;
  dailySpendUSD: number;
  author: string;
  notes: string;
}

export interface SituationReport {
  id: string;
  reportDate: string;
  cadence: MonitoringCadence;
  executiveHeadline: string;
  ownerConfidenceScore: number; // 0-100
  earnedValueAnalysis: {
    cpi: number; // Cost Performance Index
    spi: number; // Schedule Performance Index
    costVarianceAmount: number;
    scheduleVarianceDays: number;
    forecastAtCompletionStatus: string;
  };
  keyAccomplishments: string[];
  upcomingMilestones: string[];
  budgetVarianceAlerts: Array<{
    trade: string;
    status: string;
    detail: string;
    actionTaken: string;
  }>;
  ownerActionItems: string[];
  preparedBy: string;
}

export interface ConstructionProject {
  id: string;
  name: string;
  clientName: string;
  contractorName: string;
  location: string;
  startDate: string;
  targetHandoverDate: string;
  currentPhaseIndex: number;
  overallProgressPercentage: number;
  totalBaselineBudgetUSD: number;
  actualCostIncurredUSD: number;
  forecastAtCompletionUSD: number;
  confidenceScore: number;

  landSpecs: LandSpecifications;
  floorPlanSpecs: FloorPlanSpecifications;
  materialSpecs: MaterialSpecifications;

  finishedBuildingRenderUrl: string;
  finishedBuildingRenderAltViews: string[];
  proposedBuildingRenderUrl?: string;
  proposedBuildingRenderAltViews?: string[];
  proposedBuilding360Views?: Array<{ angle: number; label: string; url: string }>;
  finishedBuilding360Views?: Array<{ angle: number; label: string; url: string }>;
  panoramic360Tours?: Array<{
    id: string;
    name: string;
    type: 'exterior' | 'interior' | 'rooftop' | 'structural';
    equirectangularUrl: string;
    description: string;
  }>;
  architecturalPrompt: string;

  milestones: ConstructionMilestone[];
  boq: BOQItem[];
  sitePhotos: SitePhotoInspection[];
  periodicLogs: PeriodicLogEntry[];
  situationReports: SituationReport[];

  curveData: Array<{
    month: string;
    plannedBudget: number;
    actualSpend: number;
    earnedValue: number;
    targetProgress: number;
    actualProgress: number;
  }>;

  // Organization & Governance Fields (Sprint 03)
  organizationId?: string;
  projectType?: string;
  description?: string;
  currency?: string;
  currentStage?: string;
  ownerUserId?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'PLANNING';
  isDemo?: boolean;
}

// Estimation and Cost Takeoff Types
export interface CalculatedTakeoff {
  concreteVolumeM3: number;
  rebarSteelTonnes: number;
  glazingAreaM2: number;
  drywallAreaM2: number;
  estimatedLaborHours: number;
  estimatedDurationMonths: number;
}

export interface CalculatedBudget {
  substructure: number;
  superstructure: number;
  enclosureGlazing: number;
  roofing: number;
  mepHvac: number;
  interiorFitout: number;
  directSubtotal: number;
  prelimsAndSupervision: number;
  contractorMargin: number;
  contingency: number;
  totalEstimatedCost: number;
  costPerSqm: number;
  takeoff: CalculatedTakeoff;
}

export interface AiEstimationInsights {
  architecturalSummary: string;
  valueEngineeringNotes: string[];
  riskFactors: string[];
  renderingVisualPrompt: string;
  recommendedPhases?: Array<{ name: string; durationWeeks: number; costSharePercent: number }>;
  constructionMethodology?: string;
  isAiAssisted?: boolean;
  disclaimer?: string;
}

export interface EstimateAndProposeResponse {
  success: boolean;
  calculatedBudget: CalculatedBudget;
  aiInsights: AiEstimationInsights;
  error?: string;
}

export interface EstimateSpecsPayload {
  projectName?: string;
  location?: string;
  landArea: number;
  grossFloorArea: number;
  floors: number;
  buildingStyle: string;
  structuralCore: string;
  foundationType: string;
  facadeType: string;
  roofType: string;
  mepTier: string;
  interiorGrade: string;
  amenities?: {
    basement?: boolean;
    pool?: boolean;
    rooftop?: boolean;
  };
}

// Structura Authentication & User Profile Domain Models (Sprint 02)
export type PrimaryRole =
  | 'OWNER_CLIENT'
  | 'SENIOR_PROJECT_DIRECTOR'
  | 'GENERAL_CONTRACTOR'
  | 'STRUCTURAL_QA_QC_AUDITOR';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type IdentityStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type ProfessionalVerificationStatus =
  | 'NOT_REQUIRED'
  | 'NOT_STARTED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface UserRoleDetails {
  entityType?: 'Individual' | 'Organization';
  country?: string;
  city?: string;
  organizationName?: string;
  intendedUse?: 'Personal Development' | 'Real Estate Development' | 'Corporate Project' | 'Public / Institutional Project' | 'Other';
  yearsExperience?: number;
  primaryDiscipline?: string;
  professionalBody?: string;
  registrationNumber?: string;
  licenseNumber?: string;
  jurisdiction?: string;
  claimedCredentials?: string;
  companyName?: string;
  yearsOperating?: number;
  specialties?: string[];
}

export interface UserProfile {
  id: string;
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  primaryRole: PrimaryRole;
  accountStatus: AccountStatus;
  identityStatus: IdentityStatus;
  professionalVerificationStatus: ProfessionalVerificationStatus;
  roleDetails?: UserRoleDetails;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    uid: string;
    email: string;
    displayName?: string;
  } | null;
  userProfile: UserProfile | null;
  idToken: string | null;
  authProviderType: 'firebase' | 'server_sandbox';
  isDeveloperDemoMode: boolean;
}

// ==========================================
// Organization Governance Domain Models (Sprint 03)
// ==========================================

export type OrganizationType =
  | 'INDIVIDUAL_DEVELOPER'
  | 'REAL_ESTATE_DEVELOPER'
  | 'CORPORATE'
  | 'INSTITUTIONAL'
  | 'PUBLIC_SECTOR'
  | 'OTHER';

export type OrganizationVerificationStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED';

export type OwnerAuthorityStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED';

export type OrganizationStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  registrationNumber?: string;
  jurisdiction: string;
  country: string;
  address?: string;
  createdByUserId: string;
  ownerUserId: string;
  verificationStatus: OrganizationVerificationStatus;
  ownerAuthorityStatus: OwnerAuthorityStatus;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

export type OrganizationRole = 'OWNER_ADMIN' | 'MEMBER';
export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  organizationRole: OrganizationRole;
  status: MembershipStatus;
  invitedByUserId?: string;
  invitedAt?: string;
  acceptedAt?: string;
  createdAt: string;
}

// ==========================================
// Project Governance Appointments (Sprint 03)
// ==========================================

export type ProjectRole =
  | 'OWNER_CLIENT'
  | 'SENIOR_PROJECT_DIRECTOR'
  | 'GENERAL_CONTRACTOR'
  | 'STRUCTURAL_QA_QC_AUDITOR';

export type AppointmentStatus =
  | 'INVITED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'ACTIVE'
  | 'REVOKED'
  | 'ENDED';

export interface ProjectAppointment {
  id: string;
  projectId: string;
  organizationId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  role: ProjectRole;
  appointmentStatus: AppointmentStatus;
  invitedByUserId: string;
  invitedAt: string;
  respondedAt?: string;
  activatedAt?: string;
  endedAt?: string;
  reason?: string;
}

// ==========================================
// Audit Event Domain Model (Sprint 03)
// ==========================================

export type AuditAction =
  | 'ORGANIZATION_CREATED'
  | 'PROJECT_CREATED'
  | 'PROJECT_INVITATION_SENT'
  | 'PROJECT_INVITATION_ACCEPTED'
  | 'PROJECT_INVITATION_DECLINED'
  | 'PROJECT_APPOINTMENT_REVOKED'
  | 'DIRECT_LINE_MESSAGE_SENT'
  | 'RFI_CREATED'
  | 'RFI_RESPONDED'
  | 'RFI_ACKNOWLEDGED'
  | 'RFI_CLOSED';

export interface AuditEvent {
  id: string;
  actorUserId: string;
  organizationId?: string;
  projectId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ==========================================
// Project Operations: Direct Line (Sprint 04A)
// ==========================================

export type ChannelType =
  | 'OWNER_DIRECTOR'
  | 'OWNER_QAQC'
  | 'DIRECTOR_CONTRACTOR';

export interface ProjectConversation {
  id: string;
  projectId: string;
  channelType: ChannelType;
  participantRoles: [ProjectRole, ProjectRole];
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet?: string;
  lastMessageAt?: string;
}

export type DirectLineMessageType =
  | 'MESSAGE'
  | 'INFORMATION'
  | 'INSTRUCTION'
  | 'CLARIFICATION_REQUEST'
  | 'DECISION_REQUEST'
  | 'APPROVAL_REQUEST'
  | 'ESCALATION'
  | 'ACKNOWLEDGEMENT';

export interface ProjectMessage {
  id: string;
  conversationId: string;
  projectId: string;
  channelType: ChannelType;
  senderUserId: string;
  senderRole: ProjectRole;
  senderName: string;
  messageType: DirectLineMessageType;
  subject?: string;
  content: string;
  relatedEntityId?: string;
  createdAt: string;
}

// ==========================================
// Project Operations: RFI Workflow (Sprint 04A)
// ==========================================

export type RFIStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'ANSWERED'
  | 'ACKNOWLEDGED'
  | 'CLOSED';

export type RFIPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'CRITICAL';

export interface RFI {
  id: string;
  projectId: string;
  number: string;
  title: string;
  question: string;
  discipline: string;
  raisedByUserId: string;
  raisedByRole: ProjectRole;
  raisedByName: string;
  assignedToUserId: string;
  assignedToRole: ProjectRole;
  assignedToName: string;
  status: RFIStatus;
  priority: RFIPriority;
  relatedMilestoneId?: string;
  relatedEvidenceIds?: string[];
  response?: string;
  respondedByUserId?: string;
  respondedByName?: string;
  respondedAt?: string;
  acknowledgedAt?: string;
  acknowledgementNote?: string;
  closedAt?: string;
  closingNotes?: string;
  createdAt: string;
  dueAt?: string;
  updatedAt: string;
}
