import { projectRepository } from '../repositories/projectRepository';
import { organizationRepository } from '../repositories/organizationRepository';
import { milestoneRepository } from '../repositories/milestoneRepository';
import { evidenceRepository } from '../repositories/evidenceRepository';
import { submissionRepository } from '../repositories/submissionRepository';
import { technicalReviewRepository } from '../repositories/technicalReviewRepository';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { userRepository } from '../repositories/userRepository';
import {
  ProjectMilestone,
  ProjectEvidence,
  ContractorMilestoneSubmission,
  ProjectDirectorTechnicalReview,
  ProjectRole,
  TechnicalReviewDecision,
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
}

export const milestoneService = new MilestoneService();
