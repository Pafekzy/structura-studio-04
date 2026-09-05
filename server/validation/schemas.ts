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
