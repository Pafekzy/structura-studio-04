import { projectRepository } from '../repositories/projectRepository';
import { organizationRepository } from '../repositories/organizationRepository';
import { milestoneRepository } from '../repositories/milestoneRepository';
import { evidenceRepository } from '../repositories/evidenceRepository';
import { submissionRepository } from '../repositories/submissionRepository';
import { technicalReviewRepository } from '../repositories/technicalReviewRepository';
import { qaqcRepository } from '../repositories/qaqcRepository';
import { ncrRepository } from '../repositories/ncrRepository';
import { aiInspectionRepository } from '../repositories/aiInspectionRepository';
import { ownerDecisionRepository } from '../repositories/ownerDecisionRepository';
import { generateAIInspectionAnalysis } from './aiInspectionService';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { userRepository } from '../repositories/userRepository';
import {
  ProjectMilestone,
  ProjectEvidence,
  ContractorMilestoneSubmission,
  ProjectDirectorTechnicalReview,
  ProjectRole,
  TechnicalReviewDecision,
  QAQCInspection,
  QAQCInspectionStatus,
  NonConformanceReport,
  NCRSeverity,
  AIInspectionAnalysis,
  OwnerMilestoneDecision,
  OwnerDecisionType,
} from '../../src/types';

export class MilestoneService {
  /**
   * Resolves the authoritative role of a user on a given project.
   */
  async resolveUserProjectRole(projectId: string, userId: string): Promise<ProjectRole | null> {
    const project = await projectRepository.getProjectById(projectId);
    if (!project) return null;

    if (project.ownerUserId === userId) {
      return 'OWNER_CLIENT';
    }

    const appointment = await projectRepository.getAppointmentByProjectAndUser(projectId, userId);
    if (appointment && appointment.appointmentStatus === 'ACTIVE') {
      return appointment.role;
    }

    if (project.organizationId) {
      const org = await organizationRepository.getOrganizationById(project.organizationId);
      if (org && org.ownerUserId === userId) {
        return 'OWNER_CLIENT';
      }
      const membership = await organizationRepository.getMembership(project.organizationId, userId);
      if (membership && membership.status === 'ACTIVE' && membership.organizationRole === 'OWNER_ADMIN') {
        return 'OWNER_CLIENT';
      }
    }

    return null;
  }

  private async getActorDetails(userId: string) {
    const user = (await userRepository.findByAuthUserId(userId)) || (await userRepository.findById(userId));
    const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Project Participant';
    return { user, fullName };
  }

  // ==========================================
  // Milestone Operations
  // ==========================================

  async listMilestones(projectId: string, userId: string): Promise<ProjectMilestone[]> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have an active appointment or authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    return milestoneRepository.listMilestonesByProject(projectId);
  }

  async getMilestone(projectId: string, milestoneId: string, userId: string): Promise<ProjectMilestone> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority to view milestones for this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    const milestone = await milestoneRepository.getMilestoneById(milestoneId);
    if (!milestone || milestone.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Milestone not found for this project.',
        code: 'MILESTONE_NOT_FOUND',
      };
    }
    return milestone;
  }

  async startMilestone(projectId: string, milestoneId: string, userId: string): Promise<ProjectMilestone> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    if (role !== 'GENERAL_CONTRACTOR' && role !== 'SENIOR_PROJECT_DIRECTOR') {
      throw {
        statusCode: 403,
        error: 'Only the General Contractor or Senior Project Director can initiate milestone commencement.',
        code: 'INSUFFICIENT_ROLE_AUTHORITY',
      };
    }

    const milestone = await milestoneRepository.getMilestoneById(milestoneId);
    if (!milestone || milestone.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Milestone not found.',
        code: 'MILESTONE_NOT_FOUND',
      };
    }

    if (milestone.status !== 'NOT_STARTED') {
      throw {
        statusCode: 400,
        error: `Cannot start milestone currently in state '${milestone.status}'. Milestone is already underway.`,
        code: 'INVALID_MILESTONE_STATE_TRANSITION',
      };
    }

    const now = new Date().toISOString();
    const updated = await milestoneRepository.updateMilestone(milestoneId, {
      status: 'IN_PROGRESS',
      startedAt: now,
    });

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actorUserId: userId,
      projectId,
      action: 'MILESTONE_STARTED',
      entityType: 'PROJECT_MILESTONE',
      entityId: milestoneId,
      timestamp: now,
      metadata: {
        milestoneTitle: milestone.title,
        sequence: milestone.sequence,
        initiatedByRole: role,
      },
    });

    return updated;
  }

  // ==========================================
  // Project Evidence Operations
  // ==========================================

  async listEvidence(projectId: string, userId: string, milestoneId?: string): Promise<ProjectEvidence[]> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority to view project evidence.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    if (milestoneId) {
      return evidenceRepository.listEvidenceByMilestone(projectId, milestoneId);
    }
    return evidenceRepository.listEvidenceByProject(projectId);
  }

  async getEvidence(projectId: string, evidenceId: string, userId: string): Promise<ProjectEvidence> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority to view project evidence.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    const evidence = await evidenceRepository.getEvidenceById(evidenceId);
    if (!evidence || evidence.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Evidence record not found.',
        code: 'EVIDENCE_NOT_FOUND',
      };
    }
    return evidence;
  }

  async createEvidence(
    projectId: string,
    userId: string,
    data: {
      milestoneId?: string;
      evidenceType: any;
      title: string;
      description: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
      storageProvider?: any;
      storageStatus?: any;
      storageReference: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ProjectEvidence> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have an active appointment on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    if (
      role !== 'GENERAL_CONTRACTOR' &&
      role !== 'SENIOR_PROJECT_DIRECTOR' &&
      role !== 'STRUCTURAL_QA_QC_AUDITOR'
    ) {
      throw {
        statusCode: 403,
        error: 'Only appointed technical contractors, directors, or QA/QC auditors may register project evidence.',
        code: 'INSUFFICIENT_ROLE_AUTHORITY',
      };
    }

    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();
    const evidenceId = `ev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const newEvidence: ProjectEvidence = {
      id: evidenceId,
      projectId,
      milestoneId: data.milestoneId,
      uploadedByUserId: userId,
      uploadedByRole: role,
      uploadedByName: fullName,
      evidenceType: data.evidenceType,
      title: data.title,
      description: data.description,
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      storageProvider: data.storageProvider || 'METADATA_ONLY',
      storageStatus: data.storageStatus || 'RECORDED_METADATA',
      storageReference: data.storageReference,
      createdAt: now,
      updatedAt: now,
      metadata: data.metadata || {},
    };

    const created = await evidenceRepository.createEvidence(newEvidence);

    // If linked to milestone, update milestone's relatedEvidenceIds
    if (data.milestoneId) {
      const ms = await milestoneRepository.getMilestoneById(data.milestoneId);
      if (ms && !ms.relatedEvidenceIds.includes(evidenceId)) {
        await milestoneRepository.updateMilestone(data.milestoneId, {
          relatedEvidenceIds: [...ms.relatedEvidenceIds, evidenceId],
        });
      }
    }

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actorUserId: userId,
      projectId,
      action: 'EVIDENCE_ADDED',
      entityType: 'PROJECT_EVIDENCE',
      entityId: evidenceId,
      timestamp: now,
      metadata: {
        title: data.title,
        evidenceType: data.evidenceType,
        milestoneId: data.milestoneId,
        storageProvider: newEvidence.storageProvider,
        uploadedByRole: role,
      },
    });

    return created;
  }

  // ==========================================
  // Contractor Submission Operations
  // ==========================================

  async listSubmissions(projectId: string, userId: string): Promise<ContractorMilestoneSubmission[]> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority to view submissions for this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    return submissionRepository.listSubmissionsByProject(projectId);
  }

  async getSubmissionForMilestone(projectId: string, milestoneId: string, userId: string): Promise<ContractorMilestoneSubmission | null> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority to view submissions.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    return submissionRepository.getSubmissionByMilestone(projectId, milestoneId);
  }

  async createOrUpdateSubmissionDraft(
    projectId: string,
    milestoneId: string,
    userId: string,
    data: {
      title: string;
      summary: string;
      contractorNotes?: string;
      evidenceIds?: string[];
    }
  ): Promise<ContractorMilestoneSubmission> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have an active appointment on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    if (role !== 'GENERAL_CONTRACTOR') {
      throw {
        statusCode: 403,
        error: 'Only the General Contractor may draft or prepare milestone submission packages.',
        code: 'CONTRACTOR_ROLE_REQUIRED',
      };
    }

    const milestone = await milestoneRepository.getMilestoneById(milestoneId);
    if (!milestone || milestone.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Milestone not found.',
        code: 'MILESTONE_NOT_FOUND',
      };
    }

    // Check existing submission
    const existing = await submissionRepository.getSubmissionByMilestone(projectId, milestoneId);
    if (existing && (existing.status === 'SUBMITTED' || existing.status === 'UNDER_REVIEW')) {
      throw {
        statusCode: 400,
        error: 'Cannot modify a submission package currently under technical review. Wait for review completion or request return.',
        code: 'SUBMISSION_LOCKED_FOR_REVIEW',
      };
    }

    if (existing && existing.status === 'ACCEPTED') {
      throw {
        statusCode: 400,
        error: 'This milestone submission package has already been technically accepted.',
        code: 'SUBMISSION_ALREADY_ACCEPTED',
      };
    }

    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();

    let submission: ContractorMilestoneSubmission;

    if (existing) {
      const isReturned = existing.status === 'RETURNED';
      // Update existing draft or returned submission
      submission = await submissionRepository.updateSubmission(existing.id, {
        title: data.title,
        summary: data.summary,
        contractorNotes: data.contractorNotes ?? existing.contractorNotes,
        evidenceIds: data.evidenceIds ?? existing.evidenceIds,
        status: 'DRAFT',
        revisionNumber: isReturned ? existing.revisionNumber + 1 : existing.revisionNumber,
      });
    } else {
      const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      submission = {
        id: submissionId,
        projectId,
        milestoneId,
        submittedByUserId: userId,
        submittedByRole: 'GENERAL_CONTRACTOR',
        submittedByName: fullName,
        status: 'DRAFT',
        title: data.title,
        summary: data.summary,
        contractorNotes: data.contractorNotes || '',
        evidenceIds: data.evidenceIds || [],
        revisionNumber: 1,
        createdAt: now,
        updatedAt: now,
      };
      await submissionRepository.createSubmission(submission);
    }

    // Update milestone state
    await milestoneRepository.updateMilestone(milestoneId, {
      contractorSubmissionStatus: 'DRAFT',
      activeSubmissionId: submission.id,
      status: milestone.status === 'NOT_STARTED' ? 'IN_PROGRESS' : milestone.status,
    });

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actorUserId: userId,
      projectId,
      action: 'CONTRACTOR_SUBMISSION_DRAFTED',
      entityType: 'CONTRACTOR_SUBMISSION',
      entityId: submission.id,
      timestamp: now,
      metadata: {
        milestoneId,
        title: submission.title,
        revisionNumber: submission.revisionNumber,
        evidenceCount: (submission.evidenceIds || []).length,
      },
    });

    return submission;
  }

  async submitPackage(
    projectId: string,
    submissionId: string,
    userId: string,
    notes?: string
  ): Promise<ContractorMilestoneSubmission> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    if (role !== 'GENERAL_CONTRACTOR') {
      throw {
        statusCode: 403,
        error: 'Only the General Contractor may formally submit work packages for technical review.',
        code: 'CONTRACTOR_ROLE_REQUIRED',
      };
    }

    const submission = await submissionRepository.getSubmissionById(submissionId);
    if (!submission || submission.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Submission not found.',
        code: 'SUBMISSION_NOT_FOUND',
      };
    }

    if (submission.status !== 'DRAFT' && submission.status !== 'RETURNED') {
      throw {
        statusCode: 400,
        error: `Cannot submit package currently in status '${submission.status}'. Must be DRAFT or RETURNED.`,
        code: 'INVALID_SUBMISSION_STATE_TRANSITION',
      };
    }

    // Governance requirement: package must include at least 1 registered evidence record
    if (!submission.evidenceIds || submission.evidenceIds.length === 0) {
      throw {
        statusCode: 400,
        error: 'Cannot submit work package without attached evidence. Please register and attach at least one verification artifact or test record.',
        code: 'SUBMISSION_REQUIRES_EVIDENCE',
      };
    }

    const now = new Date().toISOString();
    const isResubmission = submission.status === 'RETURNED';
    const nextRevision = isResubmission ? submission.revisionNumber + 1 : submission.revisionNumber;

    const updated = await submissionRepository.updateSubmission(submissionId, {
      status: 'SUBMITTED',
      submittedAt: now,
      revisionNumber: nextRevision,
      contractorNotes: notes ? `${submission.contractorNotes}\n[Submission Notes ${now}]: ${notes}`.trim() : submission.contractorNotes,
    });

    // Update milestone state
    await milestoneRepository.updateMilestone(submission.milestoneId, {
      status: 'SUBMITTED_FOR_REVIEW',
      contractorSubmissionStatus: 'SUBMITTED',
      technicalReviewStatus: 'PENDING',
      submittedAt: now,
      relatedEvidenceIds: Array.from(new Set([...submission.evidenceIds])),
    });

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actorUserId: userId,
      projectId,
      action: isResubmission ? 'CONTRACTOR_SUBMISSION_RESUBMITTED' : 'CONTRACTOR_SUBMISSION_SUBMITTED',
      entityType: 'CONTRACTOR_SUBMISSION',
      entityId: submissionId,
      timestamp: now,
      metadata: {
        milestoneId: submission.milestoneId,
        revisionNumber: nextRevision,
        evidenceCount: submission.evidenceIds.length,
        isResubmission,
      },
    });

    return updated;
  }

  // ==========================================
  // Senior Project Director Technical Review Operations
  // ==========================================

  async startTechnicalReview(projectId: string, submissionId: string, userId: string): Promise<ContractorMilestoneSubmission> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    // General Contractor CANNOT review or approve their own work!
    if (role === 'GENERAL_CONTRACTOR') {
      throw {
        statusCode: 403,
        error: 'Forbidden: General Contractor is strictly prohibited from conducting technical review of their own submission.',
        code: 'CONTRACTOR_CANNOT_REVIEW_OWN_WORK',
      };
    }

    if (role !== 'SENIOR_PROJECT_DIRECTOR') {
      throw {
        statusCode: 403,
        error: 'Only the Senior Project Director holds authority to conduct formal technical review of milestone packages.',
        code: 'DIRECTOR_ROLE_REQUIRED',
      };
    }

    const submission = await submissionRepository.getSubmissionById(submissionId);
    if (!submission || submission.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Submission not found.',
        code: 'SUBMISSION_NOT_FOUND',
      };
    }

    if (submission.status !== 'SUBMITTED') {
      throw {
        statusCode: 400,
        error: `Cannot initiate technical review on submission with status '${submission.status}'. Package must be formally SUBMITTED.`,
        code: 'INVALID_SUBMISSION_STATE_FOR_REVIEW',
      };
    }

    const now = new Date().toISOString();
    const updated = await submissionRepository.updateSubmission(submissionId, {
      status: 'UNDER_REVIEW',
    });

    await milestoneRepository.updateMilestone(submission.milestoneId, {
      status: 'TECHNICAL_REVIEW',
      contractorSubmissionStatus: 'UNDER_REVIEW',
      technicalReviewStatus: 'IN_REVIEW',
      technicalReviewStartedAt: now,
    });

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actorUserId: userId,
      projectId,
      action: 'TECHNICAL_REVIEW_STARTED',
      entityType: 'CONTRACTOR_SUBMISSION',
      entityId: submissionId,
      timestamp: now,
      metadata: {
        milestoneId: submission.milestoneId,
        revisionNumber: submission.revisionNumber,
        reviewerRole: role,
      },
    });

    return updated;
  }

  async decideTechnicalReview(
    projectId: string,
    submissionId: string,
    userId: string,
    data: {
      decision: TechnicalReviewDecision;
      reviewNotes: string;
    }
  ): Promise<{ review: ProjectDirectorTechnicalReview; submission: ContractorMilestoneSubmission; milestone: ProjectMilestone }> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    // Anti-slop / governance rule: General Contractor CANNOT review or accept their own work!
    if (role === 'GENERAL_CONTRACTOR') {
      throw {
        statusCode: 403,
        error: 'Forbidden: General Contractor is strictly prohibited from approving or deciding technical reviews.',
        code: 'CONTRACTOR_CANNOT_APPROVE_OWN_WORK',
      };
    }

    if (role !== 'SENIOR_PROJECT_DIRECTOR') {
      throw {
        statusCode: 403,
        error: 'Only the Senior Project Director holds authority to issue a technical review decision on milestone submissions.',
        code: 'DIRECTOR_ROLE_REQUIRED',
      };
    }

    const submission = await submissionRepository.getSubmissionById(submissionId);
    if (!submission || submission.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Submission package not found.',
        code: 'SUBMISSION_NOT_FOUND',
      };
    }

    if (submission.status !== 'SUBMITTED' && submission.status !== 'UNDER_REVIEW') {
      throw {
        statusCode: 400,
        error: `Cannot issue decision on submission package with status '${submission.status}'.`,
        code: 'INVALID_REVIEW_STATE_TRANSITION',
      };
    }

    const milestone = await milestoneRepository.getMilestoneById(submission.milestoneId);
    if (!milestone) {
      throw {
        statusCode: 404,
        error: 'Associated milestone not found.',
        code: 'MILESTONE_NOT_FOUND',
      };
    }

    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const review: ProjectDirectorTechnicalReview = {
      id: reviewId,
      projectId,
      milestoneId: submission.milestoneId,
      submissionId,
      reviewedByUserId: userId,
      reviewedByRole: 'SENIOR_PROJECT_DIRECTOR',
      reviewedByName: fullName,
      decision: data.decision,
      reviewNotes: data.reviewNotes,
      createdAt: now,
      completedAt: now,
    };

    await technicalReviewRepository.createReview(review);

    let updatedSubmission: ContractorMilestoneSubmission;
    let updatedMilestone: ProjectMilestone;

    if (data.decision === 'REQUEST_CHANGES') {
      updatedSubmission = await submissionRepository.updateSubmission(submissionId, {
        status: 'RETURNED',
        returnedAt: now,
        returnNotes: data.reviewNotes,
        technicalReviewId: reviewId,
      });

      updatedMilestone = await milestoneRepository.updateMilestone(submission.milestoneId, {
        status: 'IN_PROGRESS',
        contractorSubmissionStatus: 'RETURNED',
        technicalReviewStatus: 'CHANGES_REQUESTED',
        latestReviewId: reviewId,
      });

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        action: 'TECHNICAL_REVIEW_CHANGES_REQUESTED',
        entityType: 'TECHNICAL_REVIEW',
        entityId: reviewId,
        timestamp: now,
        metadata: {
          submissionId,
          milestoneId: submission.milestoneId,
          decision: data.decision,
          reviewNotes: data.reviewNotes,
        },
      });
    } else if (data.decision === 'ACCEPT_TECHNICAL_SUBMISSION') {
      updatedSubmission = await submissionRepository.updateSubmission(submissionId, {
        status: 'ACCEPTED',
        acceptedAt: now,
        technicalReviewId: reviewId,
      });

      // Governed milestone status transition logic:
      // Project Director technical acceptance is NOT QA/QC approval, NOT Owner approval, NOT payment.
      // If requires QA/QC review, move to QA_QC_HOLD (waiting for Sprint 04C QA/QC gate)
      // If no QA/QC review required, but requires Owner approval, move to READY_FOR_OWNER_REVIEW
      let nextMilestoneStatus: ProjectMilestone['status'] = 'TECHNICAL_REVIEW';
      if (milestone.requiresQaQcReview) {
        nextMilestoneStatus = 'QA_QC_HOLD';
      } else if (milestone.requiresOwnerApproval) {
        nextMilestoneStatus = 'READY_FOR_OWNER_REVIEW';
      }

      updatedMilestone = await milestoneRepository.updateMilestone(submission.milestoneId, {
        status: nextMilestoneStatus,
        contractorSubmissionStatus: 'ACCEPTED',
        technicalReviewStatus: 'ACCEPTED',
        technicalReviewCompletedAt: now,
        latestReviewId: reviewId,
        // CRITICAL GOVERNANCE BOUNDARY: qaQcStatus remains PENDING if QA/QC is required!
        // ownerDecisionStatus remains PENDING!
        // financialStatus remains AWAITING_GOVERNANCE!
      });

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        action: 'TECHNICAL_SUBMISSION_ACCEPTED',
        entityType: 'TECHNICAL_REVIEW',
        entityId: reviewId,
        timestamp: now,
        metadata: {
          submissionId,
          milestoneId: submission.milestoneId,
          decision: data.decision,
          nextMilestoneStatus,
          qaQcRequired: milestone.requiresQaQcReview,
        },
      });
    } else if (data.decision === 'ESCALATE') {
      updatedSubmission = await submissionRepository.updateSubmission(submissionId, {
        status: 'UNDER_REVIEW',
        technicalReviewId: reviewId,
      });

      updatedMilestone = await milestoneRepository.updateMilestone(submission.milestoneId, {
        technicalReviewStatus: 'ESCALATED',
        latestReviewId: reviewId,
      });

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        action: 'TECHNICAL_SUBMISSION_ESCALATED',
        entityType: 'TECHNICAL_REVIEW',
        entityId: reviewId,
        timestamp: now,
        metadata: {
          submissionId,
          milestoneId: submission.milestoneId,
          decision: data.decision,
        },
      });
    } else {
      // SEND_TO_QA_QC
      updatedSubmission = await submissionRepository.updateSubmission(submissionId, {
        status: 'ACCEPTED',
        acceptedAt: now,
        technicalReviewId: reviewId,
      });

      updatedMilestone = await milestoneRepository.updateMilestone(submission.milestoneId, {
        status: 'QA_QC_HOLD',
        contractorSubmissionStatus: 'ACCEPTED',
        technicalReviewStatus: 'SENT_TO_QA_QC',
        qaQcStatus: 'PENDING',
        technicalReviewCompletedAt: now,
        latestReviewId: reviewId,
      });

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        action: 'TECHNICAL_SUBMISSION_SENT_TO_QA_QC',
        entityType: 'TECHNICAL_REVIEW',
        entityId: reviewId,
        timestamp: now,
        metadata: {
          submissionId,
          milestoneId: submission.milestoneId,
          decision: data.decision,
        },
      });
    }

    return {
      review,
      submission: updatedSubmission,
      milestone: updatedMilestone,
    };
  }

  async listTechnicalReviews(projectId: string, userId: string): Promise<ProjectDirectorTechnicalReview[]> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    return technicalReviewRepository.listReviewsByProject(projectId);
  }

  // ==========================================
  // 5. QA/QC Inspection Operations (Sprint 04C)
  // ==========================================

  async listQAQCInspections(projectId: string, userId: string, milestoneId?: string): Promise<QAQCInspection[]> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    if (milestoneId) {
      return qaqcRepository.listInspectionsByMilestone(milestoneId);
    }
    return qaqcRepository.listInspectionsByProject(projectId);
  }

  async getQAQCInspection(projectId: string, inspectionId: string, userId: string): Promise<QAQCInspection> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    const inspection = await qaqcRepository.getInspectionById(inspectionId);
    if (!inspection || inspection.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'QA/QC inspection record not found for this project.',
        code: 'INSPECTION_NOT_FOUND',
      };
    }
    return inspection;
  }

  async startQAQCInspection(
    projectId: string,
    milestoneId: string,
    userId: string,
    data: {
      inspectionType: string;
      inspectionNotes: string;
      evidenceIds?: string[];
    }
  ): Promise<QAQCInspection> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    if (role !== 'STRUCTURAL_QA_QC_AUDITOR') {
      throw {
        statusCode: 403,
        error: 'Forbidden: Only appointed Structural QA/QC Auditors can conduct or initiate QA/QC inspections.',
        code: 'INSUFFICIENT_ROLE_AUTHORITY',
      };
    }

    const milestone = await milestoneRepository.getMilestoneById(milestoneId);
    if (!milestone || milestone.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Milestone not found.',
        code: 'MILESTONE_NOT_FOUND',
      };
    }

    if (!milestone.requiresQaQcReview) {
      throw {
        statusCode: 400,
        error: 'This milestone does not require QA/QC inspection review.',
        code: 'QA_QC_NOT_REQUIRED',
      };
    }

    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();
    const inspectionId = `insp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const inspection: QAQCInspection = {
      id: inspectionId,
      projectId,
      milestoneId,
      submissionId: milestone.activeSubmissionId,
      technicalReviewId: milestone.latestReviewId,
      inspectorUserId: userId,
      inspectorRole: role,
      inspectorName: fullName,
      inspectionStatus: 'IN_PROGRESS',
      inspectionType: data.inspectionType,
      inspectionNotes: data.inspectionNotes,
      evidenceIds: data.evidenceIds || [],
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await qaqcRepository.createInspection(inspection);

    await milestoneRepository.updateMilestone(milestoneId, {
      status: 'QA_QC_HOLD',
      qaQcStatus: 'IN_PROGRESS',
      activeInspectionId: inspectionId,
    });

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actorUserId: userId,
      projectId,
      action: 'QA_QC_INSPECTION_STARTED',
      entityType: 'QA_QC_INSPECTION',
      entityId: inspectionId,
      timestamp: now,
      metadata: {
        milestoneId,
        inspectionType: data.inspectionType,
      },
    });

    return inspection;
  }

  async decideQAQCInspection(
    projectId: string,
    inspectionId: string,
    userId: string,
    data: {
      decision: QAQCInspectionStatus;
      inspectionNotes: string;
      evidenceIds?: string[];
    }
  ): Promise<{ inspection: QAQCInspection; milestone: ProjectMilestone }> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    if (role !== 'STRUCTURAL_QA_QC_AUDITOR') {
      throw {
        statusCode: 403,
        error: 'Forbidden: Only appointed Structural QA/QC Auditors can decide QA/QC inspections.',
        code: 'INSUFFICIENT_ROLE_AUTHORITY',
      };
    }

    const inspection = await qaqcRepository.getInspectionById(inspectionId);
    if (!inspection || inspection.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Inspection not found.',
        code: 'INSPECTION_NOT_FOUND',
      };
    }

    const milestone = await milestoneRepository.getMilestoneById(inspection.milestoneId);
    if (!milestone || milestone.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Milestone not found.',
        code: 'MILESTONE_NOT_FOUND',
      };
    }

    const now = new Date().toISOString();

    if (data.decision === 'PASSED') {
      // Check for any unresolved Non-Conformance Reports on this milestone
      const ncrs = await ncrRepository.listNCRsByMilestone(milestone.id);
      const openNcrs = ncrs.filter(n => n.status !== 'CLOSED');
      if (openNcrs.length > 0) {
        throw {
          statusCode: 400,
          error: `Cannot pass QA/QC inspection: ${openNcrs.length} unresolved Non-Conformance Report(s) remain open for this milestone. All NCRs must be formally verified and closed first.`,
          code: 'CANNOT_PASS_WITH_OPEN_NCR',
        };
      }

      const updatedInspection = await qaqcRepository.updateInspection(inspectionId, {
        inspectionStatus: 'PASSED',
        inspectionNotes: data.inspectionNotes,
        evidenceIds: data.evidenceIds || inspection.evidenceIds,
        completedAt: now,
      });

      const nextMilestoneStatus = milestone.requiresOwnerApproval ? 'READY_FOR_OWNER_REVIEW' : 'APPROVED';
      const updatedMilestone = await milestoneRepository.updateMilestone(milestone.id, {
        status: nextMilestoneStatus,
        qaQcStatus: 'PASSED',
        qaQcCompletedAt: now,
        ownerDecisionStatus: milestone.requiresOwnerApproval ? 'PENDING' : 'NOT_REQUIRED',
      });

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        action: 'QA_QC_INSPECTION_PASSED',
        entityType: 'QA_QC_INSPECTION',
        entityId: inspectionId,
        timestamp: now,
        metadata: {
          milestoneId: milestone.id,
          nextStatus: nextMilestoneStatus,
        },
      });

      return { inspection: updatedInspection, milestone: updatedMilestone };
    } else if (data.decision === 'FAILED') {
      const updatedInspection = await qaqcRepository.updateInspection(inspectionId, {
        inspectionStatus: 'FAILED',
        inspectionNotes: data.inspectionNotes,
        evidenceIds: data.evidenceIds || inspection.evidenceIds,
        completedAt: now,
      });

      const updatedMilestone = await milestoneRepository.updateMilestone(milestone.id, {
        status: 'QA_QC_HOLD',
        qaQcStatus: 'FAILED',
      });

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        action: 'QA_QC_INSPECTION_FAILED',
        entityType: 'QA_QC_INSPECTION',
        entityId: inspectionId,
        timestamp: now,
        metadata: {
          milestoneId: milestone.id,
          reason: data.inspectionNotes,
        },
      });

      return { inspection: updatedInspection, milestone: updatedMilestone };
    } else {
      // HOLD or REINSPECTION_REQUIRED
      const updatedInspection = await qaqcRepository.updateInspection(inspectionId, {
        inspectionStatus: data.decision,
        inspectionNotes: data.inspectionNotes,
        evidenceIds: data.evidenceIds || inspection.evidenceIds,
      });

      const updatedMilestone = await milestoneRepository.updateMilestone(milestone.id, {
        status: 'QA_QC_HOLD',
        qaQcStatus: data.decision === 'HOLD' ? 'ON_HOLD' : 'REINSPECTION_REQUIRED',
      });

      return { inspection: updatedInspection, milestone: updatedMilestone };
    }
  }

  // ==========================================
  // 6. Non-Conformance Reports (NCR) Operations (Sprint 04C)
  // ==========================================

  async listNCRs(projectId: string, userId: string, milestoneId?: string): Promise<NonConformanceReport[]> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    if (milestoneId) {
      return ncrRepository.listNCRsByMilestone(milestoneId);
    }
    return ncrRepository.listNCRsByProject(projectId);
  }

  async getNCR(projectId: string, ncrId: string, userId: string): Promise<NonConformanceReport> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    const ncr = await ncrRepository.getNCRById(ncrId);
    if (!ncr || ncr.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'NCR not found.',
        code: 'NCR_NOT_FOUND',
      };
    }
    return ncr;
  }

  async createNCR(
    projectId: string,
    milestoneId: string,
    userId: string,
    data: {
      title: string;
      description: string;
      severity: NCRSeverity;
      requirementReference: string;
      observedCondition: string;
      correctiveActionRequired: string;
      assignedToUserId?: string;
      inspectionId?: string;
    }
  ): Promise<NonConformanceReport> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    if (role !== 'STRUCTURAL_QA_QC_AUDITOR' && role !== 'SENIOR_PROJECT_DIRECTOR') {
      throw {
        statusCode: 403,
        error: 'Forbidden: Contractors cannot issue Non-Conformance Reports against their own work packages.',
        code: 'INSUFFICIENT_ROLE_AUTHORITY',
      };
    }

    const milestone = await milestoneRepository.getMilestoneById(milestoneId);
    if (!milestone || milestone.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Milestone not found.',
        code: 'MILESTONE_NOT_FOUND',
      };
    }

    const { fullName: actorName } = await this.getActorDetails(userId);
    const existingNcrs = await ncrRepository.listNCRsByProject(projectId);
    const ncrNumber = `NCR-${String(existingNcrs.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const ncrId = `ncr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Resolve assigned contractor
    let assignedUserId = data.assignedToUserId || '';
    let assignedName = 'General Contractor Team';
    let assignedRole: ProjectRole = 'GENERAL_CONTRACTOR';

    if (!assignedUserId) {
      const appointments = await projectRepository.listAppointmentsByProject(projectId);
      const contractorAppt = appointments.find(a => a.role === 'GENERAL_CONTRACTOR' && a.appointmentStatus === 'ACTIVE');
      if (contractorAppt) {
        assignedUserId = contractorAppt.userId;
        const details = await this.getActorDetails(contractorAppt.userId);
        assignedName = details.fullName;
      }
    } else {
      const details = await this.getActorDetails(assignedUserId);
      assignedName = details.fullName;
    }

    const ncr: NonConformanceReport = {
      id: ncrId,
      projectId,
      milestoneId,
      inspectionId: data.inspectionId,
      number: ncrNumber,
      title: data.title,
      description: data.description,
      severity: data.severity,
      raisedByUserId: userId,
      raisedByRole: role,
      raisedByName: actorName,
      assignedToUserId: assignedUserId,
      assignedToRole: assignedRole,
      assignedToName: assignedName,
      status: 'OPEN',
      requirementReference: data.requirementReference,
      observedCondition: data.observedCondition,
      correctiveActionRequired: data.correctiveActionRequired,
      createdAt: now,
    };

    await ncrRepository.createNCR(ncr);

    await milestoneRepository.updateMilestone(milestoneId, {
      status: 'QA_QC_HOLD',
      qaQcStatus: 'FAILED',
      activeNcrId: ncrId,
    });

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actorUserId: userId,
      projectId,
      action: 'NCR_CREATED',
      entityType: 'NCR',
      entityId: ncrId,
      timestamp: now,
      metadata: {
        ncrNumber,
        severity: data.severity,
        milestoneId,
      },
    });

    return ncr;
  }

  async submitNCRCorrectiveAction(
    projectId: string,
    ncrId: string,
    userId: string,
    data: {
      contractorResponse: string;
      correctiveActionDescription: string;
      correctiveEvidenceIds?: string[];
    }
  ): Promise<NonConformanceReport> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    if (role !== 'GENERAL_CONTRACTOR') {
      throw {
        statusCode: 403,
        error: 'Forbidden: Only General Contractors can submit corrective actions for Non-Conformance Reports.',
        code: 'INSUFFICIENT_ROLE_AUTHORITY',
      };
    }

    const ncr = await ncrRepository.getNCRById(ncrId);
    if (!ncr || ncr.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'NCR not found.',
        code: 'NCR_NOT_FOUND',
      };
    }

    if (ncr.status === 'CLOSED') {
      throw {
        statusCode: 400,
        error: 'Cannot submit corrective action on an already closed NCR.',
        code: 'INVALID_NCR_STATE',
      };
    }

    const now = new Date().toISOString();
    const updated = await ncrRepository.updateNCR(ncrId, {
      status: 'CORRECTIVE_ACTION_SUBMITTED',
      contractorResponse: data.contractorResponse,
      correctiveActionDescription: data.correctiveActionDescription,
      correctiveEvidenceIds: data.correctiveEvidenceIds || [],
      correctiveActionSubmittedAt: now,
    });

    await milestoneRepository.updateMilestone(ncr.milestoneId, {
      qaQcStatus: 'REINSPECTION_REQUIRED',
    });

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actorUserId: userId,
      projectId,
      action: 'NCR_CORRECTIVE_ACTION_SUBMITTED',
      entityType: 'NCR',
      entityId: ncrId,
      timestamp: now,
      metadata: {
        ncrNumber: ncr.number,
      },
    });

    return updated;
  }

  async closeNCR(
    projectId: string,
    ncrId: string,
    userId: string,
    data: {
      decision: 'CLOSE' | 'REQUIRE_REINSPECTION' | 'REJECT_CORRECTIVE_ACTION';
      reinspectionNotes: string;
    }
  ): Promise<NonConformanceReport> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    if (role !== 'STRUCTURAL_QA_QC_AUDITOR') {
      throw {
        statusCode: 403,
        error: 'Forbidden: Only appointed Structural QA/QC Auditors can close or reinspect Non-Conformance Reports.',
        code: 'INSUFFICIENT_ROLE_AUTHORITY',
      };
    }

    const ncr = await ncrRepository.getNCRById(ncrId);
    if (!ncr || ncr.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'NCR not found.',
        code: 'NCR_NOT_FOUND',
      };
    }

    if (ncr.status === 'CLOSED') {
      throw {
        statusCode: 400,
        error: 'NCR is already closed.',
        code: 'INVALID_NCR_STATE',
      };
    }

    const { fullName: actorName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();

    if (data.decision === 'CLOSE') {
      const updated = await ncrRepository.updateNCR(ncrId, {
        status: 'CLOSED',
        closedAt: now,
        closedByUserId: userId,
        closedByName: actorName,
        reinspectionNotes: data.reinspectionNotes,
      });

      // Check if all NCRs on milestone are now closed
      const milestoneNcrs = await ncrRepository.listNCRsByMilestone(ncr.milestoneId);
      const openRemaining = milestoneNcrs.filter(n => n.id !== ncrId && n.status !== 'CLOSED');
      if (openRemaining.length === 0) {
        await milestoneRepository.updateMilestone(ncr.milestoneId, {
          activeNcrId: undefined,
          qaQcStatus: 'REINSPECTION_REQUIRED',
        });
      }

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        action: 'NCR_CLOSED',
        entityType: 'NCR',
        entityId: ncrId,
        timestamp: now,
        metadata: {
          ncrNumber: ncr.number,
        },
      });

      return updated;
    } else {
      const nextStatus = data.decision === 'REQUIRE_REINSPECTION' ? 'REINSPECTION_REQUIRED' : 'CORRECTIVE_ACTION_REQUIRED';
      const updated = await ncrRepository.updateNCR(ncrId, {
        status: nextStatus,
        reinspectionNotes: data.reinspectionNotes,
        reinspectionAt: now,
      });

      await milestoneRepository.updateMilestone(ncr.milestoneId, {
        qaQcStatus: 'ON_HOLD',
      });

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        action: 'NCR_REINSPECTION_COMPLETED',
        entityType: 'NCR',
        entityId: ncrId,
        timestamp: now,
        metadata: {
          ncrNumber: ncr.number,
          decision: data.decision,
        },
      });

      return updated;
    }
  }

  // ==========================================
  // 7. AI Visual Inspection Analysis (Sprint 04C)
  // ==========================================

  async requestAIInspection(
    projectId: string,
    milestoneId: string,
    userId: string,
    data: {
      evidenceIds?: string[];
      inspectionContext?: string;
    }
  ): Promise<AIInspectionAnalysis> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    const milestone = await milestoneRepository.getMilestoneById(milestoneId);
    if (!milestone || milestone.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Milestone not found.',
        code: 'MILESTONE_NOT_FOUND',
      };
    }

    const now = new Date().toISOString();
    const analysisId = `ai-insp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actorUserId: userId,
      projectId,
      action: 'AI_INSPECTION_REQUESTED',
      entityType: 'AI_INSPECTION',
      entityId: analysisId,
      timestamp: now,
      metadata: {
        milestoneId,
        requestedByRole: role,
      },
    });

    // Gather evidence items
    const allEvidence = await evidenceRepository.listEvidenceByProject(projectId);
    const targetEvidenceIds = (data.evidenceIds && data.evidenceIds.length > 0)
      ? data.evidenceIds
      : milestone.relatedEvidenceIds;
    const evidenceItems = allEvidence.filter(e => targetEvidenceIds.includes(e.id));

    const result = await generateAIInspectionAnalysis({
      projectId,
      milestoneId,
      milestoneTitle: milestone.title,
      inspectionType: milestone.discipline || 'Structural',
      evidenceItems,
      contextNotes: data.inspectionContext,
    });

    const analysis: AIInspectionAnalysis = {
      id: analysisId,
      projectId,
      milestoneId,
      evidenceIds: targetEvidenceIds,
      analysisStatus: result.status,
      model: 'gemini-3.7-flash',
      summary: result.summary,
      observations: result.observations,
      potentialIssues: result.potentialIssues,
      riskIndicators: result.riskIndicators,
      recommendations: result.recommendations,
      humanReviewRequired: true, // Always true: AI cannot replace human PE/SE review
      rawResponseText: result.rawText,
      errorMessage: result.errorMessage,
      createdAt: now,
    };

    await aiInspectionRepository.createAnalysis(analysis);

    await milestoneRepository.updateMilestone(milestoneId, {
      aiAnalysisId: analysisId,
    });

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actorUserId: userId,
      projectId,
      action: result.status === 'COMPLETED' ? 'AI_INSPECTION_COMPLETED' : 'AI_INSPECTION_FAILED',
      entityType: 'AI_INSPECTION',
      entityId: analysisId,
      timestamp: new Date().toISOString(),
      metadata: {
        milestoneId,
        status: result.status,
        humanReviewRequired: true,
      },
    });

    return analysis;
  }

  async listAIAnalyses(projectId: string, userId: string, milestoneId?: string): Promise<AIInspectionAnalysis[]> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    if (milestoneId) {
      return aiInspectionRepository.listAnalysesByMilestone(milestoneId);
    }
    return aiInspectionRepository.listAnalysesByProject(projectId);
  }

  // ==========================================
  // 8. Owner Governance Decisions & Financial Authorization Boundary (Sprint 04C)
  // ==========================================

  async decideOwnerMilestone(
    projectId: string,
    milestoneId: string,
    userId: string,
    data: {
      decision: OwnerDecisionType;
      decisionNotes: string;
    }
  ): Promise<{ decision: OwnerMilestoneDecision; milestone: ProjectMilestone }> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    if (role !== 'OWNER_CLIENT') {
      throw {
        statusCode: 403,
        error: 'Forbidden: Only verified Building Owners / Clients can make final milestone governance decisions.',
        code: 'INSUFFICIENT_ROLE_AUTHORITY',
      };
    }

    const milestone = await milestoneRepository.getMilestoneById(milestoneId);
    if (!milestone || milestone.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'Milestone not found.',
        code: 'MILESTONE_NOT_FOUND',
      };
    }

    if (milestone.status !== 'READY_FOR_OWNER_REVIEW') {
      throw {
        statusCode: 400,
        error: `Cannot make Owner decision on milestone in status '${milestone.status}'. Milestone must be in 'READY_FOR_OWNER_REVIEW' following technical and QA/QC clearance.`,
        code: 'INVALID_MILESTONE_STATE_TRANSITION',
      };
    }

    if (milestone.requiresQaQcReview && milestone.qaQcStatus !== 'PASSED') {
      throw {
        statusCode: 400,
        error: `Cannot approve milestone: QA/QC review has not passed (current QA/QC status: '${milestone.qaQcStatus}').`,
        code: 'QA_QC_APPROVAL_REQUIRED',
      };
    }

    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();
    const decisionId = `owner-dec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    if (data.decision === 'APPROVE') {
      const decisionRecord: OwnerMilestoneDecision = {
        id: decisionId,
        projectId,
        milestoneId,
        decidedByUserId: userId,
        decidedByRole: role,
        decidedByName: fullName,
        decision: 'APPROVE',
        decisionNotes: data.decisionNotes,
        financialAuthorized: true,
        financialStatus: 'AUTHORIZED_FOR_FINANCIAL_PROCESSING',
        financialProviderStatus: 'FINANCIAL_PROVIDER_NOT_CONNECTED',
        createdAt: now,
        decidedAt: now,
      };

      await ownerDecisionRepository.createDecision(decisionRecord);

      const updatedMilestone = await milestoneRepository.updateMilestone(milestoneId, {
        status: 'APPROVED',
        ownerDecisionStatus: 'APPROVED',
        ownerApprovedAt: now,
        latestOwnerDecisionId: decisionId,
        financialStatus: 'AUTHORIZED_FOR_FINANCIAL_PROCESSING',
      });

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        action: 'OWNER_DECISION_APPROVED',
        entityType: 'OWNER_DECISION',
        entityId: decisionId,
        timestamp: now,
        metadata: {
          milestoneId,
          decisionNotes: data.decisionNotes,
        },
      });

      // Financial authorization boundary event: eligible for processing, NOT settled/paid
      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        action: 'FINANCIAL_PROCESSING_AUTHORIZED',
        entityType: 'PROJECT_MILESTONE',
        entityId: milestoneId,
        timestamp: now,
        metadata: {
          milestoneTitle: milestone.title,
          costAllocationUSD: milestone.costAllocationUSD,
          financialStatus: 'AUTHORIZED_FOR_FINANCIAL_PROCESSING',
          financialProvider: 'FINANCIAL_PROVIDER_NOT_CONNECTED',
          note: 'Eligible for financial processing. Payment settlement is handled outside Structura governance by external financial providers (BMONI not connected).',
        },
      });

      return { decision: decisionRecord, milestone: updatedMilestone };
    } else if (data.decision === 'RETURN') {
      const decisionRecord: OwnerMilestoneDecision = {
        id: decisionId,
        projectId,
        milestoneId,
        decidedByUserId: userId,
        decidedByRole: role,
        decidedByName: fullName,
        decision: 'RETURN',
        decisionNotes: data.decisionNotes,
        financialAuthorized: false,
        financialStatus: 'AWAITING_GOVERNANCE',
        financialProviderStatus: 'FINANCIAL_PROVIDER_NOT_CONNECTED',
        createdAt: now,
        decidedAt: now,
      };

      await ownerDecisionRepository.createDecision(decisionRecord);

      const updatedMilestone = await milestoneRepository.updateMilestone(milestoneId, {
        status: 'QA_QC_HOLD',
        ownerDecisionStatus: 'RETURNED',
        latestOwnerDecisionId: decisionId,
      });

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        action: 'OWNER_DECISION_RETURNED',
        entityType: 'OWNER_DECISION',
        entityId: decisionId,
        timestamp: now,
        metadata: {
          milestoneId,
          notes: data.decisionNotes,
        },
      });

      return { decision: decisionRecord, milestone: updatedMilestone };
    } else {
      // REJECT
      const decisionRecord: OwnerMilestoneDecision = {
        id: decisionId,
        projectId,
        milestoneId,
        decidedByUserId: userId,
        decidedByRole: role,
        decidedByName: fullName,
        decision: 'REJECT',
        decisionNotes: data.decisionNotes,
        financialAuthorized: false,
        financialStatus: 'NOT_ELIGIBLE',
        financialProviderStatus: 'FINANCIAL_PROVIDER_NOT_CONNECTED',
        createdAt: now,
        decidedAt: now,
      };

      await ownerDecisionRepository.createDecision(decisionRecord);

      const updatedMilestone = await milestoneRepository.updateMilestone(milestoneId, {
        status: 'REJECTED',
        ownerDecisionStatus: 'REJECTED',
        latestOwnerDecisionId: decisionId,
        financialStatus: 'NOT_ELIGIBLE',
      });

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        action: 'OWNER_DECISION_REJECTED',
        entityType: 'OWNER_DECISION',
        entityId: decisionId,
        timestamp: now,
        metadata: {
          milestoneId,
          notes: data.decisionNotes,
        },
      });

      return { decision: decisionRecord, milestone: updatedMilestone };
    }
  }

  async listOwnerDecisions(projectId: string, userId: string, milestoneId?: string): Promise<OwnerMilestoneDecision[]> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    if (milestoneId) {
      return ownerDecisionRepository.listDecisionsByMilestone(milestoneId);
    }
    return ownerDecisionRepository.listDecisionsByProject(projectId);
  }
}

export const milestoneService = new MilestoneService();
