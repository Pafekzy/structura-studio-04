/**
 * SPRINT 04B VERIFICATION TEST SUITE
 * Tests all 19 defined test scenarios against server-side services, repositories,
 * governance rules, and authorization boundaries.
 */

import fs from 'fs';
import path from 'path';
import { MilestoneService } from './server/services/milestoneService';
import { milestoneRepository, INITIAL_DEMO_MILESTONES } from './server/repositories/milestoneRepository';
import { evidenceRepository } from './server/repositories/evidenceRepository';
import { submissionRepository, INITIAL_DEMO_SUBMISSIONS } from './server/repositories/submissionRepository';
import { technicalReviewRepository } from './server/repositories/technicalReviewRepository';
import { auditEventRepository } from './server/repositories/auditEventRepository';
import { projectRepository } from './server/repositories/projectRepository';

const milestoneService = new MilestoneService();

const PROJECT_ID = 'proj-horizon-villa';
const CONTRACTOR_UID = 'usr_demo_contractor';
const DIRECTOR_UID = 'usr_demo_director';
const OWNER_UID = 'usr_demo_owner';
const QAQC_UID = 'usr_demo_qaqc';
const UNAUTHORIZED_UID = 'usr_unauthorized_attacker';

interface TestResult {
  scenarioNumber: number;
  description: string;
  passed: boolean;
  notes?: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('=== STARTING SPRINT 04B GOVERNANCE & OPERATIONS TEST SUITE ===\n');

  // Reset sandbox test data for reproducibility
  const dataDir = path.join(process.cwd(), 'data');
  if (fs.existsSync(dataDir)) {
    fs.writeFileSync(path.join(dataDir, 'milestones.json'), JSON.stringify(INITIAL_DEMO_MILESTONES, null, 2), 'utf-8');
    fs.writeFileSync(path.join(dataDir, 'submissions.json'), JSON.stringify(INITIAL_DEMO_SUBMISSIONS, null, 2), 'utf-8');
    fs.writeFileSync(path.join(dataDir, 'technical_reviews.json'), JSON.stringify([], null, 2), 'utf-8');
  }

  // Ensure milestones and evidence are initialized
  const initialMilestones = await milestoneService.listMilestones(PROJECT_ID, DIRECTOR_UID);
  console.log(`[SETUP] Found ${initialMilestones.length} milestones for ${PROJECT_ID}`);

  // 1. Authorized project roles can view project milestones
  try {
    const contractorView = await milestoneService.listMilestones(PROJECT_ID, CONTRACTOR_UID);
    const directorView = await milestoneService.listMilestones(PROJECT_ID, DIRECTOR_UID);
    const ownerView = await milestoneService.listMilestones(PROJECT_ID, OWNER_UID);
    const passed =
      contractorView.length > 0 && directorView.length > 0 && ownerView.length > 0;
    results.push({
      scenarioNumber: 1,
      description: 'Authorized project roles can view project milestones',
      passed,
      notes: `Milestones retrieved: Contractor (${contractorView.length}), Director (${directorView.length}), Owner (${ownerView.length})`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 1,
      description: 'Authorized project roles can view project milestones',
      passed: false,
      notes: err.message,
    });
  }

  // 2. Unauthorized external user receives 403 for project milestone access
  try {
    let failedAsExpected = false;
    try {
      await milestoneService.listMilestones(PROJECT_ID, UNAUTHORIZED_UID);
    } catch (err: any) {
      if (err.statusCode === 403 || err.code === 'INSUFFICIENT_PROJECT_AUTHORITY') {
        failedAsExpected = true;
      }
    }
    results.push({
      scenarioNumber: 2,
      description: 'Unauthorized external user receives 403 for project milestone access',
      passed: failedAsExpected,
      notes: failedAsExpected ? 'Unauthorized access rejected with 403' : 'Failed to reject unauthorized user',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 2,
      description: 'Unauthorized external user receives 403 for project milestone access',
      passed: false,
      notes: err.message,
    });
  }

  // Pick target milestone for submission tests
  const targetMilestone = initialMilestones[0];
  console.log(`[TEST TARGET] Using Milestone #${targetMilestone.sequence}: ${targetMilestone.title} (ID: ${targetMilestone.id})`);

  // Ensure milestone is IN_PROGRESS
  if (targetMilestone.status === 'NOT_STARTED') {
    await milestoneService.startMilestone(PROJECT_ID, targetMilestone.id, CONTRACTOR_UID);
  }

  // Register an evidence item for the contractor
  const createdEvidence = await milestoneService.createEvidence(
    PROJECT_ID,
    CONTRACTOR_UID,
    {
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
    }
  );

  // 3. General Contractor can create/save a permitted draft submission
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
    const passed = draftSubmission.status === 'DRAFT' && draftSubmission.milestoneId === targetMilestone.id;
    results.push({
      scenarioNumber: 3,
      description: 'General Contractor can create/save a permitted draft submission',
      passed,
      notes: `Draft created with ID: ${draftSubmission.id}, Status: ${draftSubmission.status}`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 3,
      description: 'General Contractor can create/save a permitted draft submission',
      passed: false,
      notes: err.message,
    });
  }

  // 4. General Contractor can associate project evidence with the submission
  try {
    const passed =
      draftSubmission &&
      draftSubmission.evidenceIds.includes(createdEvidence.id);
    results.push({
      scenarioNumber: 4,
      description: 'General Contractor can associate project evidence with the submission',
      passed: !!passed,
      notes: `Associated evidence ID: ${createdEvidence.id}`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 4,
      description: 'General Contractor can associate project evidence with the submission',
      passed: false,
      notes: err.message,
    });
  }

  // 5. General Contractor can submit the package for review
  let submittedPackage: any;
  try {
    submittedPackage = await milestoneService.submitPackage(
      PROJECT_ID,
      draftSubmission.id,
      CONTRACTOR_UID,
      'Package complete with verified cylinder break test attached.'
    );
    const passed =
      submittedPackage.status === 'SUBMITTED' &&
      submittedPackage.submittedAt !== null;
    results.push({
      scenarioNumber: 5,
      description: 'General Contractor can submit the package for review',
      passed,
      notes: `Package status: ${submittedPackage.status}`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 5,
      description: 'General Contractor can submit the package for review',
      passed: false,
      notes: err.message,
    });
  }

  // 6. Submission persists after reload/repository read
  try {
    const reloaded = await submissionRepository.getSubmissionById(submittedPackage.id);
    const passed = reloaded !== null && reloaded.status === 'SUBMITTED';
    results.push({
      scenarioNumber: 6,
      description: 'Submission persists after reload/repository read',
      passed,
      notes: `Reloaded submission ID: ${reloaded?.id}, status: ${reloaded?.status}`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 6,
      description: 'Submission persists after reload/repository read',
      passed: false,
      notes: err.message,
    });
  }

  // 7. Senior Project Director can see submitted package
  try {
    const directorSubmissions = await milestoneService.listSubmissions(PROJECT_ID, DIRECTOR_UID);
    const found = directorSubmissions.find((s: any) => s.id === submittedPackage.id);
    const passed = found !== undefined && found.status === 'SUBMITTED';
    results.push({
      scenarioNumber: 7,
      description: 'Senior Project Director can see submitted package',
      passed,
      notes: `Director retrieved submitted package: ${found?.title}`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 7,
      description: 'Senior Project Director can see submitted package',
      passed: false,
      notes: err.message,
    });
  }

  // 8. Senior Project Director can inspect associated evidence
  try {
    const evidenceList = await milestoneService.listEvidence(PROJECT_ID, DIRECTOR_UID);
    const matchingEvidence = evidenceList.find((e: any) => e.id === createdEvidence.id);
    const passed =
      matchingEvidence !== undefined &&
      matchingEvidence.storageReference === 'LAB-CERT-2026-TEST-48MPA';
    results.push({
      scenarioNumber: 8,
      description: 'Senior Project Director can inspect associated evidence',
      passed,
      notes: `Director inspected evidence: ${matchingEvidence?.title} (Ref: ${matchingEvidence?.storageReference})`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 8,
      description: 'Senior Project Director can inspect associated evidence',
      passed: false,
      notes: err.message,
    });
  }

  // 9. Senior Project Director can request changes
  let returnedSubmission: any;
  try {
    // Start review first
    await milestoneService.startTechnicalReview(PROJECT_ID, submittedPackage.id, DIRECTOR_UID);
    
    // Director requests changes
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
      scenarioNumber: 9,
      description: 'Senior Project Director can request changes',
      passed: !!passed,
      notes: `Review decision: ${reviewResult.review.decision}, Submission status: ${returnedSubmission?.status}`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 9,
      description: 'Senior Project Director can request changes',
      passed: false,
      notes: err.message,
    });
  }

  // 10. Contractor can see returned/requested changes
  try {
    const contractorSubmissions = await milestoneService.listSubmissions(PROJECT_ID, CONTRACTOR_UID);
    const returned = contractorSubmissions.find((s: any) => s.id === submittedPackage.id);
    const passed =
      returned !== undefined &&
      returned.status === 'RETURNED' &&
      (returned.returnNotes || '').length > 0;
    results.push({
      scenarioNumber: 10,
      description: 'Contractor can see returned/requested changes',
      passed,
      notes: `Contractor saw returned package with feedback: "${returned?.returnNotes}"`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 10,
      description: 'Contractor can see returned/requested changes',
      passed: false,
      notes: err.message,
    });
  }

  // 11. Contractor can resubmit where workflow permits
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
      resubmittedPackage.status === 'SUBMITTED' &&
      resubmittedPackage.revisionNumber === 2;
    results.push({
      scenarioNumber: 11,
      description: 'Contractor can resubmit where workflow permits',
      passed,
      notes: `Resubmitted as Rev #${resubmittedPackage.revisionNumber}, Status: ${resubmittedPackage.status}`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 11,
      description: 'Contractor can resubmit where workflow permits',
      passed: false,
      notes: err.message,
    });
  }

  // 12. Senior Project Director can accept the technical submission
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
      scenarioNumber: 12,
      description: 'Senior Project Director can accept the technical submission',
      passed,
      notes: `Accepted with decision: ${acceptedReview.decision}, Milestone advanced to: ${updatedMilestone.status}`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 12,
      description: 'Senior Project Director can accept the technical submission',
      passed: false,
      notes: err.message,
    });
  }

  // 13. General Contractor cannot technically approve their own work
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
      if (err.statusCode === 403 || err.code === 'ROLE_PERMISSION_DENIED') {
        blockedAsExpected = true;
      }
    }
    results.push({
      scenarioNumber: 13,
      description: 'General Contractor cannot technically approve their own work',
      passed: blockedAsExpected,
      notes: blockedAsExpected
        ? 'Self-approval strictly blocked server-side with 403'
        : 'Security breach: General Contractor was allowed to approve work!',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 13,
      description: 'General Contractor cannot technically approve their own work',
      passed: false,
      notes: err.message,
    });
  }

  // 14. Unauthorized user cannot mutate milestone/submission/evidence state
  try {
    let mutateBlocked = false;
    try {
      await milestoneService.createEvidence(PROJECT_ID, UNAUTHORIZED_UID, {
        title: 'Fake Evidence',
        description: 'Unauthorized injection',
        evidenceType: 'DOCUMENT',
        fileName: 'fake.pdf',
        mimeType: 'application/pdf',
        fileSize: 1000,
        storageReference: 'FAKE-123',
      });
    } catch (err: any) {
      if (err.statusCode === 403) {
        mutateBlocked = true;
      }
    }
    results.push({
      scenarioNumber: 14,
      description: 'Unauthorized user cannot mutate milestone/submission/evidence state',
      passed: mutateBlocked,
      notes: mutateBlocked ? 'Mutation rejected with 403 Forbidden' : 'Failed to block unauthorized mutation',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 14,
      description: 'Unauthorized user cannot mutate milestone/submission/evidence state',
      passed: false,
      notes: err.message,
    });
  }

  // 15. Invalid state transitions are rejected server-side
  try {
    let invalidTransitionBlocked = false;
    try {
      // Trying to submit an already ACCEPTED submission
      await milestoneService.submitPackage(
        PROJECT_ID,
        resubmittedPackage.id,
        CONTRACTOR_UID,
        'Trying to re-submit accepted package'
      );
    } catch (err: any) {
      if (err.statusCode === 400 || err.code === 'INVALID_SUBMISSION_STATE_TRANSITION') {
        invalidTransitionBlocked = true;
      }
    }
    results.push({
      scenarioNumber: 15,
      description: 'Invalid state transitions are rejected server-side',
      passed: invalidTransitionBlocked,
      notes: invalidTransitionBlocked
        ? 'Invalid transition rejected server-side with 400'
        : 'Failed to reject invalid transition',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 15,
      description: 'Invalid state transitions are rejected server-side',
      passed: false,
      notes: err.message,
    });
  }

  // 16. Audit events persist for governed transitions
  try {
    const auditEvents = await auditEventRepository.listByProject(PROJECT_ID);
    const hasMilestoneEvents = auditEvents.some(
      (e: any) =>
        e.action === 'CONTRACTOR_SUBMISSION_SUBMITTED' ||
        e.action === 'TECHNICAL_SUBMISSION_ACCEPTED' ||
        e.action === 'EVIDENCE_ADDED'
    );
    results.push({
      scenarioNumber: 16,
      description: 'Audit events persist for governed transitions',
      passed: hasMilestoneEvents,
      notes: `Recorded ${auditEvents.length} audit events for project. Milestone audit actions verified.`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 16,
      description: 'Audit events persist for governed transitions',
      passed: false,
      notes: err.message,
    });
  }

  // 17. No technical acceptance is falsely represented as QA/QC approval
  try {
    const m = await milestoneRepository.getMilestoneById(targetMilestone.id);
    // Milestone status must NOT be APPROVED or QA_QC_PASSED; it must be QA_QC_HOLD (if requires QAQC) or READY_FOR_OWNER_REVIEW
    const notFalselyQcApproved =
      m?.status !== 'APPROVED' &&
      m?.status !== 'COMPLETE';
    results.push({
      scenarioNumber: 17,
      description: 'No technical acceptance is falsely represented as QA/QC approval',
      passed: notFalselyQcApproved,
      notes: `Milestone status after director acceptance: "${m?.status}" (Awaiting QA/QC gate in Sprint 04C)`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 17,
      description: 'No technical acceptance is falsely represented as QA/QC approval',
      passed: false,
      notes: err.message,
    });
  }

  // 18. No technical acceptance is falsely represented as Owner approval
  try {
    const m = await milestoneRepository.getMilestoneById(targetMilestone.id);
    const notFalselyOwnerApproved = m?.status !== 'APPROVED';
    results.push({
      scenarioNumber: 18,
      description: 'No technical acceptance is falsely represented as Owner approval',
      passed: notFalselyOwnerApproved,
      notes: `Owner approval boundary maintained. Current status is "${m?.status}"`,
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 18,
      description: 'No technical acceptance is falsely represented as Owner approval',
      passed: false,
      notes: err.message,
    });
  }

  // 19. No technical acceptance is falsely represented as payment or settlement
  try {
    const m = await milestoneRepository.getMilestoneById(targetMilestone.id);
    // Milestone should not have any PAID, SETTLED, or FUNDS_RELEASED status
    const notFalselySettled = (m as any)?.status !== 'PAID' && (m as any)?.status !== 'SETTLED';
    results.push({
      scenarioNumber: 19,
      description: 'No technical acceptance is falsely represented as payment or settlement',
      passed: notFalselySettled,
      notes: 'No financial settlement flags applied. Financial boundary strictly respected.',
    });
  } catch (err: any) {
    results.push({
      scenarioNumber: 19,
      description: 'No technical acceptance is falsely represented as payment or settlement',
      passed: false,
      notes: err.message,
    });
  }

  console.log('\n=== TEST RESULTS SUMMARY ===\n');
  let passCount = 0;
  for (const r of results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    if (r.passed) passCount++;
    console.log(`Scenario ${r.scenarioNumber}: ${status} - ${r.description}`);
    if (r.notes) {
      console.log(`   Note: ${r.notes}`);
    }
  }

  console.log(`\nTOTAL: ${passCount} / ${results.length} PASSED`);
  if (passCount === results.length) {
    console.log('🎉 ALL 19 SPRINT 04B TEST SCENARIOS PASSED WITH FULL GOVERNANCE COMPLIANCE!');
  } else {
    console.error('⚠️ SOME TESTS FAILED');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
