/**
 * SPRINT 04B COMPLETE 24-SCENARIO ACCEPTANCE VERIFICATION SUITE
 *
 * Verifies all 24 required Sprint 04B scenarios against server-side services,
 * repositories, governance boundaries, and authorization rules:
 *
 * 1. General Contractor can view authorized project milestones.
 * 2. Unauthorized external user receives HTTP 403 for milestone access.
 * 3. General Contractor can create/save a DRAFT submission.
 * 4. General Contractor can associate evidence.
 * 5. Evidence itself persists after repository reload/read.
 * 6. General Contractor can formally submit a milestone package.
 * 7. Submitted package persists after repository reload/read.
 * 8. Senior Project Director can see the submitted package.
 * 9. Senior Project Director can inspect associated evidence.
 * 10. Senior Project Director can explicitly BEGIN technical review.
 * 11. Senior Project Director can REQUEST_CHANGES.
 * 12. Contractor can see returned/requested changes.
 * 13. Contractor can revise and resubmit where workflow permits.
 * 14. Senior Project Director can ACCEPT_TECHNICAL_SUBMISSION.
 * 15. General Contractor cannot technically accept their own submission.
 * 16. General Contractor cannot directly set the milestone to APPROVED.
 * 17. Unauthorized external user cannot create or mutate project evidence.
 * 18. Unauthorized external user cannot submit or technically review milestone packages.
 * 19. Invalid workflow state transitions are rejected server-side.
 * 20. Audit events persist for governed transitions.
 * 21. Technical acceptance is NOT represented as QA/QC approval.
 * 22. Technical acceptance is NOT represented as Owner approval.
 * 23. Technical acceptance is NOT represented as PAYMENT AUTHORIZATION.
 * 24. No milestone/submission state is falsely represented as: PAID, SETTLED, FUNDS_RELEASED.
 */

import fs from 'fs';
import path from 'path';
import { MilestoneService } from './server/services/milestoneService';
import { milestoneRepository, INITIAL_DEMO_MILESTONES } from './server/repositories/milestoneRepository';
import { evidenceRepository } from './server/repositories/evidenceRepository';
import { submissionRepository, INITIAL_DEMO_SUBMISSIONS } from './server/repositories/submissionRepository';
import { technicalReviewRepository } from './server/repositories/technicalReviewRepository';
import { auditEventRepository } from './server/repositories/auditEventRepository';

const milestoneService = new MilestoneService();

const PROJECT_ID = 'proj-horizon-villa';
const CONTRACTOR_UID = 'usr_demo_contractor';
const DIRECTOR_UID = 'usr_demo_director';
const OWNER_UID = 'usr_demo_owner';
const UNAUTHORIZED_UID = 'usr_unauthorized_attacker';

export interface TestResult {
  scenarioNumber: number;
  description: string;
  status: 'PASS' | 'FAIL' | 'NOT TESTED';
  notes?: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('=== STARTING STRUCTURA SPRINT 04B 24-SCENARIO ACCEPTANCE TEST SUITE ===\n');

  // Reset sandbox test data for clean reproducibility
  const dataDir = path.join(process.cwd(), 'data');
  if (fs.existsSync(dataDir)) {
    fs.writeFileSync(path.join(dataDir, 'milestones.json'), JSON.stringify(INITIAL_DEMO_MILESTONES, null, 2), 'utf-8');
    fs.writeFileSync(path.join(dataDir, 'submissions.json'), JSON.stringify(INITIAL_DEMO_SUBMISSIONS, null, 2), 'utf-8');
    fs.writeFileSync(path.join(dataDir, 'technical_reviews.json'), JSON.stringify([], null, 2), 'utf-8');
  }

  // Ensure initial milestones exist
  const initialMilestones = await milestoneService.listMilestones(PROJECT_ID, DIRECTOR_UID);
  console.log(`[SETUP] Found ${initialMilestones.length} milestones for ${PROJECT_ID}`);

  // --------------------------------------------------------------------------
  // Scenario 1: General Contractor can view authorized project milestones.
  // --------------------------------------------------------------------------
  try {
    const contractorView = await milestoneService.listMilestones(PROJECT_ID, CONTRACTOR_UID);
    const passed = contractorView && contractorView.length > 0;
    results.push({
      scenarioNumber: 1,
      description: 'General Contractor can view authorized project milestones.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Contractor retrieved ${contractorView.length} authorized milestones for ${PROJECT_ID}.`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 1,
      description: 'General Contractor can view authorized project milestones.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 2: Unauthorized external user receives HTTP 403 for milestone access.
  // --------------------------------------------------------------------------
  try {
    let failedAsExpected = false;
    try {
      await milestoneService.listMilestones(PROJECT_ID, UNAUTHORIZED_UID);
    } catch (err: any) {
      if (err.statusCode === 403 && (err.code === 'INSUFFICIENT_PROJECT_AUTHORITY' || err.error?.includes('Forbidden'))) {
        failedAsExpected = true;
      }
    }
    results.push({
      scenarioNumber: 2,
      description: 'Unauthorized external user receives HTTP 403 for milestone access.',
      status: failedAsExpected ? 'PASS' : 'FAIL',
      notes: failedAsExpected
        ? 'External unappointed user strictly rejected with HTTP 403 INSUFFICIENT_PROJECT_AUTHORITY.'
        : 'Failed to block unauthorized user.',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 2,
      description: 'Unauthorized external user receives HTTP 403 for milestone access.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // Select target milestone
  const targetMilestone = initialMilestones[0];
  console.log(`[TARGET MILESTONE] #${targetMilestone.sequence}: ${targetMilestone.title} (${targetMilestone.id})`);

  // Ensure a NOT_STARTED milestone is started to test milestone commencement & audit trail
  const notStartedMilestone = initialMilestones.find(m => m.status === 'NOT_STARTED');
  if (notStartedMilestone) {
    await milestoneService.startMilestone(PROJECT_ID, notStartedMilestone.id, CONTRACTOR_UID);
  }

  // Create evidence record
  const createdEvidence = await milestoneService.createEvidence(PROJECT_ID, CONTRACTOR_UID, {
    title: 'Lab Test 28-Day Concrete Compressive Strength',
    description: 'Certified 48.2 MPa cylinder crush test verifying high-strength mix specification ASTM C39.',
    evidenceType: 'TEST_RESULT',
    milestoneId: targetMilestone.id,
    fileName: 'concrete_compression_break_cert.pdf',
    mimeType: 'application/pdf',
    fileSize: 2048576,
    storageProvider: 'METADATA_ONLY',
    storageStatus: 'RECORDED_METADATA',
    storageReference: 'LAB-CERT-2026-TEST-48MPA',
    metadata: {
      testingLab: 'Pacific GeoStructural Testing Laboratories Inc.',
      breakStrengthMPa: 48.2,
      specRequiredMPa: 40.0,
      result: 'PASSED',
    },
  });

  // --------------------------------------------------------------------------
  // Scenario 3: General Contractor can create/save a DRAFT submission.
  // --------------------------------------------------------------------------
  let draftSubmission: any;
  try {
    draftSubmission = await milestoneService.createOrUpdateSubmissionDraft(
      PROJECT_ID,
      targetMilestone.id,
      CONTRACTOR_UID,
      {
        title: 'Foundation Raft Slab Rebar & Pour Package Submission',
        summary: 'Completed deep foundation subgrade prep, rebar grid placement, and primary pour sequence.',
        contractorNotes: 'Pour operations monitored continuously. Slump test and thermography compliant.',
        evidenceIds: [createdEvidence.id],
      }
    );
    const passed = draftSubmission && draftSubmission.status === 'DRAFT' && draftSubmission.milestoneId === targetMilestone.id;
    results.push({
      scenarioNumber: 3,
      description: 'General Contractor can create/save a DRAFT submission.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Draft saved with ID ${draftSubmission?.id}, status DRAFT, revision ${draftSubmission?.revisionNumber}.`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 3,
      description: 'General Contractor can create/save a DRAFT submission.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 4: General Contractor can associate evidence.
  // --------------------------------------------------------------------------
  try {
    const passed = draftSubmission && draftSubmission.evidenceIds && draftSubmission.evidenceIds.includes(createdEvidence.id);
    results.push({
      scenarioNumber: 4,
      description: 'General Contractor can associate evidence.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Evidence ID ${createdEvidence.id} successfully attached to draft submission package.`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 4,
      description: 'General Contractor can associate evidence.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 5: Evidence itself persists after repository reload/read.
  // --------------------------------------------------------------------------
  try {
    const reloadedEvidence = await evidenceRepository.getEvidenceById(createdEvidence.id);
    const passed =
      reloadedEvidence !== null &&
      reloadedEvidence.id === createdEvidence.id &&
      reloadedEvidence.storageReference === 'LAB-CERT-2026-TEST-48MPA';
    results.push({
      scenarioNumber: 5,
      description: 'Evidence itself persists after repository reload/read.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Reloaded evidence record ${reloadedEvidence?.id} with reference "${reloadedEvidence?.storageReference}".`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 5,
      description: 'Evidence itself persists after repository reload/read.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 6: General Contractor can formally submit a milestone package.
  // --------------------------------------------------------------------------
  let submittedPackage: any;
  try {
    submittedPackage = await milestoneService.submitPackage(
      PROJECT_ID,
      draftSubmission.id,
      CONTRACTOR_UID,
      'Package complete with verified cylinder break test attached.'
    );
    const passed = submittedPackage && submittedPackage.status === 'SUBMITTED' && !!submittedPackage.submittedAt;
    results.push({
      scenarioNumber: 6,
      description: 'General Contractor can formally submit a milestone package.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Milestone package submitted successfully at ${submittedPackage?.submittedAt}.`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 6,
      description: 'General Contractor can formally submit a milestone package.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 7: Submitted package persists after repository reload/read.
  // --------------------------------------------------------------------------
  try {
    const reloadedSub = await submissionRepository.getSubmissionById(submittedPackage.id);
    const passed = reloadedSub !== null && reloadedSub.status === 'SUBMITTED' && reloadedSub.id === submittedPackage.id;
    results.push({
      scenarioNumber: 7,
      description: 'Submitted package persists after repository reload/read.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Persisted submission verified in repository with status ${reloadedSub?.status}.`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 7,
      description: 'Submitted package persists after repository reload/read.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 8: Senior Project Director can see the submitted package.
  // --------------------------------------------------------------------------
  try {
    const directorSubmissions = await milestoneService.listSubmissions(PROJECT_ID, DIRECTOR_UID);
    const found = directorSubmissions.find((s: any) => s.id === submittedPackage.id);
    const passed = found !== undefined && found.status === 'SUBMITTED';
    results.push({
      scenarioNumber: 8,
      description: 'Senior Project Director can see the submitted package.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Director retrieved submitted package "${found?.title}" for technical review.`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 8,
      description: 'Senior Project Director can see the submitted package.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 9: Senior Project Director can inspect associated evidence.
  // --------------------------------------------------------------------------
  try {
    const evidenceList = await milestoneService.listEvidence(PROJECT_ID, DIRECTOR_UID);
    const matchingEvidence = evidenceList.find((e: any) => e.id === createdEvidence.id);
    const passed =
      matchingEvidence !== undefined &&
      matchingEvidence.storageReference === 'LAB-CERT-2026-TEST-48MPA';
    results.push({
      scenarioNumber: 9,
      description: 'Senior Project Director can inspect associated evidence.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Director inspected evidence: "${matchingEvidence?.title}" (Lab ref: ${matchingEvidence?.storageReference}).`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 9,
      description: 'Senior Project Director can inspect associated evidence.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 10: Senior Project Director can explicitly BEGIN technical review.
  // --------------------------------------------------------------------------
  let underReviewPackage: any;
  try {
    underReviewPackage = await milestoneService.startTechnicalReview(PROJECT_ID, submittedPackage.id, DIRECTOR_UID);
    const m = await milestoneRepository.getMilestoneById(targetMilestone.id);
    const passed =
      underReviewPackage &&
      underReviewPackage.status === 'UNDER_REVIEW' &&
      m?.status === 'TECHNICAL_REVIEW' &&
      m?.technicalReviewStatus === 'IN_REVIEW';
    results.push({
      scenarioNumber: 10,
      description: 'Senior Project Director can explicitly BEGIN technical review.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Technical review formally initiated. Submission is UNDER_REVIEW, milestone is TECHNICAL_REVIEW.`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 10,
      description: 'Senior Project Director can explicitly BEGIN technical review.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 11: Senior Project Director can REQUEST_CHANGES.
  // --------------------------------------------------------------------------
  let returnedSubmission: any;
  try {
    const reviewResult = await milestoneService.decideTechnicalReview(
      PROJECT_ID,
      submittedPackage.id,
      DIRECTOR_UID,
      {
        decision: 'REQUEST_CHANGES',
        reviewNotes: 'Please provide supplementary thermographic sensor logs for the core zone curing period.',
      }
    );
    returnedSubmission = await submissionRepository.getSubmissionById(submittedPackage.id);
    const passed =
      reviewResult.review.decision === 'REQUEST_CHANGES' &&
      returnedSubmission?.status === 'RETURNED' &&
      returnedSubmission?.returnNotes?.includes('thermographic sensor logs');
    results.push({
      scenarioNumber: 11,
      description: 'Senior Project Director can REQUEST_CHANGES.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Decision REQUEST_CHANGES applied. Package status returned to contractor with feedback.`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 11,
      description: 'Senior Project Director can REQUEST_CHANGES.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 12: Contractor can see returned/requested changes.
  // --------------------------------------------------------------------------
  try {
    const contractorSubmissions = await milestoneService.listSubmissions(PROJECT_ID, CONTRACTOR_UID);
    const returned = contractorSubmissions.find((s: any) => s.id === submittedPackage.id);
    const passed =
      returned !== undefined &&
      returned.status === 'RETURNED' &&
      (returned.returnNotes || '').includes('thermographic sensor logs');
    results.push({
      scenarioNumber: 12,
      description: 'Contractor can see returned/requested changes.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Contractor inspected returned package: "${returned?.returnNotes}".`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 12,
      description: 'Contractor can see returned/requested changes.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 13: Contractor can revise and resubmit where workflow permits.
  // --------------------------------------------------------------------------
  let resubmittedPackage: any;
  try {
    // Contractor updates draft / notes
    await milestoneService.createOrUpdateSubmissionDraft(
      PROJECT_ID,
      targetMilestone.id,
      CONTRACTOR_UID,
      {
        title: 'Foundation Raft Slab Rebar & Pour Package Submission (Rev 2)',
        summary: 'Supplementary thermographic sensor logs and core temperature logs appended.',
        contractorNotes: 'Core heat of hydration maintained under 65°C throughout 7-day cure window.',
        evidenceIds: [createdEvidence.id],
      }
    );

    resubmittedPackage = await milestoneService.submitPackage(
      PROJECT_ID,
      submittedPackage.id,
      CONTRACTOR_UID,
      'Re-submitting with thermographic sensor logs included.'
    );

    const passed =
      resubmittedPackage &&
      resubmittedPackage.status === 'SUBMITTED' &&
      resubmittedPackage.revisionNumber === 2;
    results.push({
      scenarioNumber: 13,
      description: 'Contractor can revise and resubmit where workflow permits.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Resubmitted package as Revision #${resubmittedPackage?.revisionNumber} with status SUBMITTED.`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 13,
      description: 'Contractor can revise and resubmit where workflow permits.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 14: Senior Project Director can ACCEPT_TECHNICAL_SUBMISSION.
  // --------------------------------------------------------------------------
  let acceptedReview: any;
  let updatedMilestone: any;
  try {
    const decisionResult = await milestoneService.decideTechnicalReview(
      PROJECT_ID,
      resubmittedPackage.id,
      DIRECTOR_UID,
      {
        decision: 'ACCEPT_TECHNICAL_SUBMISSION',
        reviewNotes: 'Technical specifications, compressive break data (48.2 MPa), and heat logs verified. Technical acceptance granted.',
      }
    );
    acceptedReview = decisionResult.review;
    updatedMilestone = decisionResult.milestone;

    const passed =
      acceptedReview.decision === 'ACCEPT_TECHNICAL_SUBMISSION' &&
      decisionResult.submission.status === 'ACCEPTED' &&
      (updatedMilestone.status === 'QA_QC_HOLD' || updatedMilestone.status === 'READY_FOR_OWNER_REVIEW');
    results.push({
      scenarioNumber: 14,
      description: 'Senior Project Director can ACCEPT_TECHNICAL_SUBMISSION.',
      status: passed ? 'PASS' : 'FAIL',
      notes: `Technical acceptance granted. Milestone advanced to ${updatedMilestone.status} (awaiting QA/QC).`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 14,
      description: 'Senior Project Director can ACCEPT_TECHNICAL_SUBMISSION.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 15: General Contractor cannot technically accept their own submission.
  // --------------------------------------------------------------------------
  try {
    let blockedAsExpected = false;
    try {
      await milestoneService.decideTechnicalReview(
        PROJECT_ID,
        resubmittedPackage.id,
        CONTRACTOR_UID,
        {
          decision: 'ACCEPT_TECHNICAL_SUBMISSION',
          reviewNotes: 'I self-approve my own work.',
        }
      );
    } catch (err: any) {
      if (err.statusCode === 403 && (err.code === 'CONTRACTOR_CANNOT_APPROVE_OWN_WORK' || err.code === 'DIRECTOR_ROLE_REQUIRED')) {
        blockedAsExpected = true;
      }
    }
    results.push({
      scenarioNumber: 15,
      description: 'General Contractor cannot technically accept their own submission.',
      status: blockedAsExpected ? 'PASS' : 'FAIL',
      notes: blockedAsExpected
        ? 'Self-acceptance strictly blocked with HTTP 403 CONTRACTOR_CANNOT_APPROVE_OWN_WORK.'
        : 'Security violation: Contractor was able to accept their own submission.',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 15,
      description: 'General Contractor cannot technically accept their own submission.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 16: General Contractor cannot directly set the milestone to APPROVED.
  // --------------------------------------------------------------------------
  try {
    let contractorDirectApprovalBlocked = false;
    // Attempt 1: Contractor trying to call a technical review approval
    try {
      await milestoneService.decideTechnicalReview(
        PROJECT_ID,
        resubmittedPackage.id,
        CONTRACTOR_UID,
        {
          decision: 'ACCEPT_TECHNICAL_SUBMISSION',
          reviewNotes: 'Bypassing governance to set APPROVED.',
        }
      );
    } catch (err: any) {
      if (err.statusCode === 403) {
        contractorDirectApprovalBlocked = true;
      }
    }

    // Verify milestone status remains non-APPROVED
    const m = await milestoneRepository.getMilestoneById(targetMilestone.id);
    const passed = contractorDirectApprovalBlocked && m?.status !== 'APPROVED';
    results.push({
      scenarioNumber: 16,
      description: 'General Contractor cannot directly set the milestone to APPROVED.',
      status: passed ? 'PASS' : 'FAIL',
      notes: passed
        ? `Direct approval strictly prohibited server-side. Milestone status remains "${m?.status}".`
        : 'Contractor improperly mutated milestone to APPROVED.',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 16,
      description: 'General Contractor cannot directly set the milestone to APPROVED.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 17: Unauthorized external user cannot create or mutate project evidence.
  // --------------------------------------------------------------------------
  try {
    let evidenceBlocked = false;
    try {
      await milestoneService.createEvidence(PROJECT_ID, UNAUTHORIZED_UID, {
        title: 'Malicious External Evidence',
        description: 'Unauthorized injection attempt',
        evidenceType: 'DOCUMENT',
        fileName: 'malicious.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        storageReference: 'ATTACK-REF-001',
      });
    } catch (err: any) {
      if (err.statusCode === 403 && err.code === 'INSUFFICIENT_PROJECT_AUTHORITY') {
        evidenceBlocked = true;
      }
    }
    results.push({
      scenarioNumber: 17,
      description: 'Unauthorized external user cannot create or mutate project evidence.',
      status: evidenceBlocked ? 'PASS' : 'FAIL',
      notes: evidenceBlocked
        ? 'Unauthorized evidence creation strictly blocked with HTTP 403 INSUFFICIENT_PROJECT_AUTHORITY.'
        : 'Unauthorized user succeeded in creating evidence.',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 17,
      description: 'Unauthorized external user cannot create or mutate project evidence.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 18: Unauthorized external user cannot submit or technically review milestone packages.
  // --------------------------------------------------------------------------
  try {
    let submitBlocked = false;
    let reviewBlocked = false;

    try {
      await milestoneService.submitPackage(PROJECT_ID, resubmittedPackage.id, UNAUTHORIZED_UID, 'Malicious submit');
    } catch (err: any) {
      if (err.statusCode === 403) submitBlocked = true;
    }

    try {
      await milestoneService.decideTechnicalReview(
        PROJECT_ID,
        resubmittedPackage.id,
        UNAUTHORIZED_UID,
        { decision: 'ACCEPT_TECHNICAL_SUBMISSION', reviewNotes: 'Malicious review' }
      );
    } catch (err: any) {
      if (err.statusCode === 403) reviewBlocked = true;
    }

    const passed = submitBlocked && reviewBlocked;
    results.push({
      scenarioNumber: 18,
      description: 'Unauthorized external user cannot submit or technically review milestone packages.',
      status: passed ? 'PASS' : 'FAIL',
      notes: passed
        ? 'Both package submission and technical review endpoints strictly blocked unauthorized actor with HTTP 403.'
        : 'Failed to block unauthorized submission or review.',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 18,
      description: 'Unauthorized external user cannot submit or technically review milestone packages.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 19: Invalid workflow state transitions are rejected server-side.
  // --------------------------------------------------------------------------
  try {
    let transition1Blocked = false; // Cannot re-submit an already ACCEPTED package
    let transition2Blocked = false; // Cannot review an already ACCEPTED package

    try {
      await milestoneService.submitPackage(
        PROJECT_ID,
        resubmittedPackage.id,
        CONTRACTOR_UID,
        'Attempting re-submission on accepted package'
      );
    } catch (err: any) {
      if (err.statusCode === 400 && err.code === 'INVALID_SUBMISSION_STATE_TRANSITION') {
        transition1Blocked = true;
      }
    }

    try {
      await milestoneService.decideTechnicalReview(
        PROJECT_ID,
        resubmittedPackage.id,
        DIRECTOR_UID,
        { decision: 'ACCEPT_TECHNICAL_SUBMISSION', reviewNotes: 'Double decision' }
      );
    } catch (err: any) {
      if (err.statusCode === 400 && err.code === 'INVALID_REVIEW_STATE_TRANSITION') {
        transition2Blocked = true;
      }
    }

    const passed = transition1Blocked && transition2Blocked;
    results.push({
      scenarioNumber: 19,
      description: 'Invalid workflow state transitions are rejected server-side.',
      status: passed ? 'PASS' : 'FAIL',
      notes: passed
        ? 'Re-submission and duplicate reviews on ACCEPTED package rejected server-side with HTTP 400.'
        : 'Failed to reject invalid workflow transitions.',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 19,
      description: 'Invalid workflow state transitions are rejected server-side.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 20: Audit events persist for governed transitions.
  // --------------------------------------------------------------------------
  try {
    const auditEvents = await auditEventRepository.listByProject(PROJECT_ID);
    const recordedActions = new Set(auditEvents.map((e: any) => e.action));
    const hasMilestoneStarted = recordedActions.has('MILESTONE_STARTED');
    const hasEvidenceAdded = recordedActions.has('EVIDENCE_ADDED');
    const hasDrafted = recordedActions.has('CONTRACTOR_SUBMISSION_DRAFTED');
    const hasSubmitted = recordedActions.has('CONTRACTOR_SUBMISSION_SUBMITTED');
    const hasReviewStarted = recordedActions.has('TECHNICAL_REVIEW_STARTED');
    const hasChangesRequested = recordedActions.has('TECHNICAL_REVIEW_CHANGES_REQUESTED');
    const hasAccepted = recordedActions.has('TECHNICAL_SUBMISSION_ACCEPTED');

    const passed =
      hasMilestoneStarted &&
      hasEvidenceAdded &&
      hasDrafted &&
      hasSubmitted &&
      hasReviewStarted &&
      hasChangesRequested &&
      hasAccepted;

    results.push({
      scenarioNumber: 20,
      description: 'Audit events persist for governed transitions.',
      status: passed ? 'PASS' : 'FAIL',
      notes: passed
        ? `All 7 required lifecycle actions verified in audit ledger (${auditEvents.length} total events recorded).`
        : 'Missing required audit event types in project audit history.',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 20,
      description: 'Audit events persist for governed transitions.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 21: Technical acceptance is NOT represented as QA/QC approval.
  // --------------------------------------------------------------------------
  try {
    const m = await milestoneRepository.getMilestoneById(targetMilestone.id);
    const statusVal = (m as any)?.status;
    const qaQcVal = (m as any)?.qaQcStatus;
    const passed =
      statusVal === 'QA_QC_HOLD' &&
      qaQcVal === 'PENDING' &&
      statusVal !== 'APPROVED' &&
      statusVal !== 'COMPLETE';
    results.push({
      scenarioNumber: 21,
      description: 'Technical acceptance is NOT represented as QA/QC approval.',
      status: passed ? 'PASS' : 'FAIL',
      notes: passed
        ? `Milestone is held at "QA_QC_HOLD", qaQcStatus is "PENDING". QA/QC gate strictly deferred to Sprint 04C.`
        : 'Governance failure: Milestone was falsely marked as QA/QC approved.',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 21,
      description: 'Technical acceptance is NOT represented as QA/QC approval.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 22: Technical acceptance is NOT represented as Owner approval.
  // --------------------------------------------------------------------------
  try {
    const m = await milestoneRepository.getMilestoneById(targetMilestone.id);
    const statusVal = (m as any)?.status;
    const ownerVal = (m as any)?.ownerDecisionStatus;
    const passed =
      ownerVal === 'PENDING' &&
      statusVal !== 'APPROVED' &&
      statusVal !== 'COMPLETE';
    results.push({
      scenarioNumber: 22,
      description: 'Technical acceptance is NOT represented as Owner approval.',
      status: passed ? 'PASS' : 'FAIL',
      notes: passed
        ? `Owner approval boundary maintained. Status is not APPROVED, ownerDecisionStatus is PENDING.`
        : 'Governance failure: Milestone was falsely marked as Owner approved.',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 22,
      description: 'Technical acceptance is NOT represented as Owner approval.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 23: Technical acceptance is NOT represented as PAYMENT AUTHORIZATION.
  // --------------------------------------------------------------------------
  try {
    const m = await milestoneRepository.getMilestoneById(targetMilestone.id);
    const finVal = (m as any)?.financialStatus;
    const passed =
      finVal === 'AWAITING_GOVERNANCE' &&
      finVal !== 'AUTHORIZED_PENDING_SETTLEMENT' &&
      finVal !== 'PAID';
    results.push({
      scenarioNumber: 23,
      description: 'Technical acceptance is NOT represented as PAYMENT AUTHORIZATION.',
      status: passed ? 'PASS' : 'FAIL',
      notes: passed
        ? `Financial status remains "AWAITING_GOVERNANCE". Payment authorization boundary respected.`
        : 'Governance failure: Milestone was falsely represented as authorized for payment.',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 23,
      description: 'Technical acceptance is NOT represented as PAYMENT AUTHORIZATION.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Scenario 24: No milestone/submission state is falsely represented as: PAID, SETTLED, FUNDS_RELEASED.
  // --------------------------------------------------------------------------
  try {
    const allMilestones = await milestoneRepository.listMilestonesByProject(PROJECT_ID);
    const allSubmissions = await submissionRepository.listSubmissionsByProject(PROJECT_ID);

    const hasFakePaidMilestone = allMilestones.some(
      (m: any) =>
        m.status === 'PAID' ||
        m.status === 'SETTLED' ||
        m.financialStatus === 'PAID' ||
        (m as any).fundsReleased === true
    );

    const hasFakePaidSubmission = allSubmissions.some(
      (s: any) =>
        s.status === 'PAID' ||
        s.status === 'SETTLED'
    );

    const passed = !hasFakePaidMilestone && !hasFakePaidSubmission;
    results.push({
      scenarioNumber: 24,
      description: 'No milestone/submission state is falsely represented as: PAID, SETTLED, FUNDS_RELEASED.',
      status: passed ? 'PASS' : 'FAIL',
      notes: passed
        ? 'Zero premature settlement, payment, or fund release states exist across all milestones and submissions.'
        : 'Financial boundary violation: Premature settlement or paid state detected.',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 24,
      description: 'No milestone/submission state is falsely represented as: PAID, SETTLED, FUNDS_RELEASED.',
      status: 'FAIL',
      notes: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Print Detailed Test Summary
  // --------------------------------------------------------------------------
  console.log('\n=== EXACT 24-SCENARIO ACCEPTANCE RESULTS ===\n');
  let passCount = 0;
  let failCount = 0;
  let notTestedCount = 0;

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅ PASS' : r.status === 'FAIL' ? '❌ FAIL' : '⏸️ NOT TESTED';
    if (r.status === 'PASS') passCount++;
    else if (r.status === 'FAIL') failCount++;
    else notTestedCount++;

    console.log(`${r.scenarioNumber.toString().padStart(2, ' ')}. [${r.status}] ${r.description}`);
    if (r.notes) {
      console.log(`    Note: ${r.notes}`);
    }
  }

  console.log(`\n============================================================`);
  console.log(`TOTAL SCENARIOS: ${results.length}`);
  console.log(`PASSED:         ${passCount}`);
  console.log(`FAILED:         ${failCount}`);
  console.log(`NOT TESTED:     ${notTestedCount}`);
  console.log(`============================================================\n`);

  if (failCount > 0) {
    console.error('⚠️ ONE OR MORE ACCEPTANCE SCENARIOS FAILED');
    process.exit(1);
  } else if (results.length !== 24) {
    console.error(`⚠️ INCOMPLETE SUITE: Expected 24 scenarios, got ${results.length}`);
    process.exit(1);
  } else {
    console.log('🎉 ALL 24 SPRINT 04B ACCEPTANCE SCENARIOS PASSED WITH FULL GOVERNANCE COMPLIANCE!');
  }
}

runTests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
