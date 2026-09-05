import { z } from 'zod';

// Part A: Safe User Profile Update Schema (Protects security-sensitive fields from mass assignment)
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(50).optional(),
  profileSummary: z.string().max(1000).optional(),
  bio: z.string().max(1000).optional(),
  roleDetails: z.object({
    yearsExperience: z.number().min(0).max(100).optional(),
    primaryDiscipline: z.string().max(150).optional(),
    professionalBody: z.string().max(150).optional(),
    registrationNumber: z.string().max(100).optional(),
    companyName: z.string().max(150).optional(),
    yearsOperating: z.number().min(0).max(200).optional(),
    specialties: z.array(z.string()).optional(),
    entityType: z.enum(['Individual', 'Organization']).optional(),
    country: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    intendedUse: z.string().max(100).optional(),
  }).optional(),
  contactInformation: z.record(z.string(), z.any()).optional(),
}).strict(); // Strictly reject any unknown keys (e.g. primaryRole, authUserId, verificationStatus)

// Part B: Organization Creation Schema
export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(120),
  type: z.enum([
    'INDIVIDUAL_DEVELOPER',
    'REAL_ESTATE_DEVELOPER',
    'CORPORATE',
    'INSTITUTIONAL',
    'PUBLIC_SECTOR',
    'OTHER'
  ]),
  jurisdiction: z.string().min(2, 'Jurisdiction is required').max(100),
  country: z.string().min(2, 'Country is required').max(100),
  registrationNumber: z.string().max(100).optional(),
  address: z.string().max(250).optional(),
});

// Part C: Project Creation Under Organization Schema
export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name is required').max(150),
  location: z.string().min(2, 'Location is required').max(200),
  projectType: z.string().max(100).optional().default('Commercial Mixed-Use'),
  description: z.string().max(2000).optional().default(''),
  startDate: z.string().min(4, 'Start date is required'),
  targetHandoverDate: z.string().min(4, 'Target handover date is required'),
  totalBaselineBudgetUSD: z.number().min(0, 'Initial budget must be non-negative'),
  currency: z.string().max(10).optional().default('USD'),
  currentStage: z.string().max(100).optional().default('Planning & Feasibility'),
});

// Part D: Project Governance Invitation Schema
export const createInvitationSchema = z.object({
  professionalUserId: z.string().min(1, 'Professional user ID is required'),
  role: z.enum([
    'SENIOR_PROJECT_DIRECTOR',
    'GENERAL_CONTRACTOR',
    'STRUCTURAL_QA_QC_AUDITOR'
  ]),
  reason: z.string().max(500).optional(),
});

// Part E: Direct Line Message Schema (Sprint 04A)
export const createDirectLineMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(5000),
  messageType: z.enum([
    'MESSAGE',
    'INFORMATION',
    'INSTRUCTION',
    'CLARIFICATION_REQUEST',
    'DECISION_REQUEST',
    'APPROVAL_REQUEST',
    'ESCALATION',
    'ACKNOWLEDGEMENT',
  ]).default('MESSAGE'),
  subject: z.string().max(200).optional(),
  relatedEntityId: z.string().max(100).optional(),
});

// Part F: RFI Creation Schema (Sprint 04A)
export const createRFISchema = z.object({
  title: z.string().min(3, 'RFI title must be at least 3 characters').max(200),
  question: z.string().min(10, 'RFI question must be at least 10 characters').max(5000),
  discipline: z.string().max(100).optional().default('General Operations'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  assignedToUserId: z.string().optional(),
  relatedMilestoneId: z.string().optional(),
  relatedEvidenceIds: z.array(z.string()).optional(),
  dueAt: z.string().optional(),
});

// Part G: RFI Response Schema
export const respondRFISchema = z.object({
  response: z.string().min(5, 'Response must be at least 5 characters').max(5000),
});

// Part H: RFI Acknowledgement Schema
export const acknowledgeRFISchema = z.object({
  acknowledgementNote: z.string().max(1000).optional(),
});

// Part I: RFI Closure Schema
export const closeRFISchema = z.object({
  closingNotes: z.string().max(1000).optional(),
});

// Part J: Project Milestone Creation & Status Schema (Sprint 04B)
export const createMilestoneSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  sequence: z.number().int().min(1),
  discipline: z.string().min(2).max(100),
  requiresProjectDirectorReview: z.boolean().default(true),
  requiresQaQcReview: z.boolean().default(true),
  requiresOwnerApproval: z.boolean().default(true),
  costAllocationUSD: z.number().min(0).optional().default(0),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
});

export const updateMilestoneStatusSchema = z.object({
  status: z.enum([
    'NOT_STARTED',
    'IN_PROGRESS',
    'SUBMITTED_FOR_REVIEW',
    'TECHNICAL_REVIEW',
    'QA_QC_HOLD',
    'READY_FOR_OWNER_REVIEW',
    'APPROVED',
    'REJECTED',
    'COMPLETE',
  ]),
});

// Part K: Project Evidence Metadata Schema (Sprint 04B)
export const createEvidenceSchema = z.object({
  milestoneId: z.string().optional(),
  evidenceType: z.enum([
    'SITE_PHOTO',
    'DRAWING',
    'DOCUMENT',
    'TEST_RESULT',
    'PROGRESS_RECORD',
    'TECHNICAL_ATTACHMENT',
    'CONTRACTOR_SUBMISSION',
    'OTHER',
  ]),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(5, 'Description must be at least 5 characters').max(2000),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().min(0),
  storageProvider: z.enum([
    'METADATA_ONLY',
    'LOCAL_SANDBOX',
    'CLOUD_STORAGE_PROVISIONAL',
  ]).default('METADATA_ONLY'),
  storageStatus: z.enum([
    'RECORDED_METADATA',
    'REFERENCED',
    'STORED',
  ]).default('RECORDED_METADATA'),
  storageReference: z.string().min(1, 'Storage reference/tag is required').max(200),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Part L: Contractor Milestone Submission Schema (Sprint 04B)
export const createSubmissionDraftSchema = z.object({
  title: z.string().min(3, 'Submission title must be at least 3 characters').max(200),
  summary: z.string().min(10, 'Executive summary must be at least 10 characters').max(3000),
  contractorNotes: z.string().max(3000).optional().default(''),
  evidenceIds: z.array(z.string()).optional().default([]),
});

export const updateSubmissionDraftSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  summary: z.string().min(10).max(3000).optional(),
  contractorNotes: z.string().max(3000).optional(),
  evidenceIds: z.array(z.string()).optional(),
});

export const submitPackageSchema = z.object({
  notes: z.string().max(2000).optional(),
});

// Part M: Senior Project Director Technical Review Schema (Sprint 04B)
export const technicalReviewDecisionSchema = z.object({
  decision: z.enum([
    'REQUEST_CHANGES',
    'ACCEPT_TECHNICAL_SUBMISSION',
    'ESCALATE',
    'SEND_TO_QA_QC',
  ]),
  reviewNotes: z.string().min(5, 'Review notes must be at least 5 characters').max(4000),
});
