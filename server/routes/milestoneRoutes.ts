import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { milestoneService } from '../services/milestoneService';
import {
  createMilestoneSchema,
  createEvidenceSchema,
  createSubmissionDraftSchema,
  updateSubmissionDraftSchema,
  submitPackageSchema,
  technicalReviewDecisionSchema,
  startQAQCInspectionSchema,
  decideQAQCInspectionSchema,
  createNCRSchema,
  submitCorrectiveActionSchema,
  closeNCRSchema,
  requestAIInspectionSchema,
  ownerDecisionSchema,
} from '../validation/schemas';
import { ZodError } from 'zod';

export const milestoneRouter = Router();

// Apply requireAuth to all milestone, evidence, and submission endpoints
milestoneRouter.use(requireAuth);

function handleError(err: any, res: Response) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.issues.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  if (err && typeof err === 'object' && err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.error || 'Operation failed',
      code: err.code || 'OPERATION_ERROR',
    });
  }

  console.error('[MilestoneRoutes] Unexpected error:', err);
  return res.status(500).json({
    error: 'Internal server error processing milestone operation',
    code: 'INTERNAL_SERVER_ERROR',
  });
}

// ==========================================
// 1. Milestones Endpoints
// ==========================================

// GET /projects/:projectId/milestones
milestoneRouter.get('/projects/:projectId/milestones', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;
    const milestones = await milestoneService.listMilestones(projectId, userId);
    return res.json({ milestones });
  } catch (err) {
    return handleError(err, res);
  }
});

// GET /projects/:projectId/milestones/:milestoneId
milestoneRouter.get('/projects/:projectId/milestones/:milestoneId', async (req: Request, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params;
    const userId = req.user!.uid;
    const milestone = await milestoneService.getMilestone(projectId, milestoneId, userId);
    return res.json({ milestone });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/milestones/:milestoneId/start
milestoneRouter.post('/projects/:projectId/milestones/:milestoneId/start', async (req: Request, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params;
    const userId = req.user!.uid;
    const updated = await milestoneService.startMilestone(projectId, milestoneId, userId);
    return res.json({ milestone: updated, message: 'Milestone initiated successfully.' });
  } catch (err) {
    return handleError(err, res);
  }
});

// ==========================================
// 2. Project Evidence Endpoints
// ==========================================

// GET /projects/:projectId/evidence
milestoneRouter.get('/projects/:projectId/evidence', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { milestoneId } = req.query;
    const userId = req.user!.uid;
    const evidenceList = await milestoneService.listEvidence(
      projectId,
      userId,
      typeof milestoneId === 'string' ? milestoneId : undefined
    );
    return res.json({ evidence: evidenceList });
  } catch (err) {
    return handleError(err, res);
  }
});

// GET /projects/:projectId/evidence/:evidenceId
milestoneRouter.get('/projects/:projectId/evidence/:evidenceId', async (req: Request, res: Response) => {
  try {
    const { projectId, evidenceId } = req.params;
    const userId = req.user!.uid;
    const evidence = await milestoneService.getEvidence(projectId, evidenceId, userId);
    return res.json({ evidence });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/evidence
milestoneRouter.post('/projects/:projectId/evidence', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;
    const validated = createEvidenceSchema.parse(req.body);
    const created = await milestoneService.createEvidence(projectId, userId, validated);
    return res.status(201).json({ evidence: created, message: 'Project evidence registered successfully.' });
  } catch (err) {
    return handleError(err, res);
  }
});

// ==========================================
// 3. Contractor Submissions Endpoints
// ==========================================

// GET /projects/:projectId/submissions
milestoneRouter.get('/projects/:projectId/submissions', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;
    const submissions = await milestoneService.listSubmissions(projectId, userId);
    return res.json({ submissions });
  } catch (err) {
    return handleError(err, res);
  }
});

// GET /projects/:projectId/milestones/:milestoneId/submission
milestoneRouter.get('/projects/:projectId/milestones/:milestoneId/submission', async (req: Request, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params;
    const userId = req.user!.uid;
    const submission = await milestoneService.getSubmissionForMilestone(projectId, milestoneId, userId);
    return res.json({ submission });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/milestones/:milestoneId/submissions/draft
milestoneRouter.post('/projects/:projectId/milestones/:milestoneId/submissions/draft', async (req: Request, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params;
    const userId = req.user!.uid;
    const validated = createSubmissionDraftSchema.parse(req.body);
    const submission = await milestoneService.createOrUpdateSubmissionDraft(projectId, milestoneId, userId, validated);
    return res.status(201).json({ submission, message: 'Contractor submission draft saved successfully.' });
  } catch (err) {
    return handleError(err, res);
  }
});

// PUT /projects/:projectId/submissions/:submissionId
milestoneRouter.put('/projects/:projectId/submissions/:submissionId', async (req: Request, res: Response) => {
  try {
    const { projectId, submissionId } = req.params;
    const userId = req.user!.uid;
    const validated = updateSubmissionDraftSchema.parse(req.body);
    // Find milestone from submission first
    const sub = await milestoneService.listSubmissions(projectId, userId);
    const target = sub.find(s => s.id === submissionId);
    if (!target) {
      return res.status(404).json({ error: 'Submission not found.', code: 'SUBMISSION_NOT_FOUND' });
    }
    const updated = await milestoneService.createOrUpdateSubmissionDraft(projectId, target.milestoneId, userId, {
      title: validated.title ?? target.title,
      summary: validated.summary ?? target.summary,
      contractorNotes: validated.contractorNotes ?? target.contractorNotes,
      evidenceIds: validated.evidenceIds ?? target.evidenceIds,
    });
    return res.json({ submission: updated, message: 'Draft updated successfully.' });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/submissions/:submissionId/submit
milestoneRouter.post('/projects/:projectId/submissions/:submissionId/submit', async (req: Request, res: Response) => {
  try {
    const { projectId, submissionId } = req.params;
    const userId = req.user!.uid;
    const { notes } = submitPackageSchema.parse(req.body || {});
    const submitted = await milestoneService.submitPackage(projectId, submissionId, userId, notes);
    return res.json({ submission: submitted, message: 'Work package successfully submitted for Senior Project Director technical review.' });
  } catch (err) {
    return handleError(err, res);
  }
});

// ==========================================
// 4. Senior Project Director Technical Review Endpoints
// ==========================================

// GET /projects/:projectId/technical-reviews
milestoneRouter.get('/projects/:projectId/technical-reviews', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;
    const reviews = await milestoneService.listTechnicalReviews(projectId, userId);
    return res.json({ reviews });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/submissions/:submissionId/review/start
milestoneRouter.post('/projects/:projectId/submissions/:submissionId/review/start', async (req: Request, res: Response) => {
  try {
    const { projectId, submissionId } = req.params;
    const userId = req.user!.uid;
    const updated = await milestoneService.startTechnicalReview(projectId, submissionId, userId);
    return res.json({ submission: updated, message: 'Technical review initiated.' });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/submissions/:submissionId/review/decision
milestoneRouter.post('/projects/:projectId/submissions/:submissionId/review/decision', async (req: Request, res: Response) => {
  try {
    const { projectId, submissionId } = req.params;
    const userId = req.user!.uid;
    const validated = technicalReviewDecisionSchema.parse(req.body);
    const result = await milestoneService.decideTechnicalReview(projectId, submissionId, userId, validated);
    return res.json({
      review: result.review,
      submission: result.submission,
      milestone: result.milestone,
      message: `Technical review decision [${validated.decision}] recorded.`,
    });
  } catch (err) {
    return handleError(err, res);
  }
});

// ==========================================
// 5. QA/QC Inspection Endpoints (Sprint 04C)
// ==========================================

// GET /projects/:projectId/qaqc-inspections
milestoneRouter.get('/projects/:projectId/qaqc-inspections', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { milestoneId } = req.query;
    const userId = req.user!.uid;
    const inspections = await milestoneService.listQAQCInspections(projectId, userId, milestoneId as string | undefined);
    return res.json({ inspections });
  } catch (err) {
    return handleError(err, res);
  }
});

// GET /projects/:projectId/qaqc-inspections/:inspectionId
milestoneRouter.get('/projects/:projectId/qaqc-inspections/:inspectionId', async (req: Request, res: Response) => {
  try {
    const { projectId, inspectionId } = req.params;
    const userId = req.user!.uid;
    const inspection = await milestoneService.getQAQCInspection(projectId, inspectionId, userId);
    return res.json({ inspection });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/milestones/:milestoneId/qaqc/start
milestoneRouter.post('/projects/:projectId/milestones/:milestoneId/qaqc/start', async (req: Request, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params;
    const userId = req.user!.uid;
    const validated = startQAQCInspectionSchema.parse(req.body);
    const inspection = await milestoneService.startQAQCInspection(projectId, milestoneId, userId, validated);
    return res.status(201).json({ inspection, message: 'QA/QC inspection started successfully.' });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/qaqc-inspections/:inspectionId/decision
milestoneRouter.post('/projects/:projectId/qaqc-inspections/:inspectionId/decision', async (req: Request, res: Response) => {
  try {
    const { projectId, inspectionId } = req.params;
    const userId = req.user!.uid;
    const validated = decideQAQCInspectionSchema.parse(req.body);
    const result = await milestoneService.decideQAQCInspection(projectId, inspectionId, userId, validated);
    return res.json({
      inspection: result.inspection,
      milestone: result.milestone,
      message: `QA/QC inspection decision [${validated.decision}] recorded successfully.`,
    });
  } catch (err) {
    return handleError(err, res);
  }
});

// ==========================================
// 6. Non-Conformance Reports (NCR) Endpoints (Sprint 04C)
// ==========================================

// GET /projects/:projectId/ncrs
milestoneRouter.get('/projects/:projectId/ncrs', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { milestoneId } = req.query;
    const userId = req.user!.uid;
    const ncrs = await milestoneService.listNCRs(projectId, userId, milestoneId as string | undefined);
    return res.json({ ncrs });
  } catch (err) {
    return handleError(err, res);
  }
});

// GET /projects/:projectId/ncrs/:ncrId
milestoneRouter.get('/projects/:projectId/ncrs/:ncrId', async (req: Request, res: Response) => {
  try {
    const { projectId, ncrId } = req.params;
    const userId = req.user!.uid;
    const ncr = await milestoneService.getNCR(projectId, ncrId, userId);
    return res.json({ ncr });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/milestones/:milestoneId/ncrs
milestoneRouter.post('/projects/:projectId/milestones/:milestoneId/ncrs', async (req: Request, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params;
    const userId = req.user!.uid;
    const validated = createNCRSchema.parse(req.body);
    const ncr = await milestoneService.createNCR(projectId, milestoneId, userId, validated);
    return res.status(201).json({ ncr, message: `Non-Conformance Report ${ncr.number} issued successfully.` });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/ncrs/:ncrId/corrective-action
milestoneRouter.post('/projects/:projectId/ncrs/:ncrId/corrective-action', async (req: Request, res: Response) => {
  try {
    const { projectId, ncrId } = req.params;
    const userId = req.user!.uid;
    const validated = submitCorrectiveActionSchema.parse(req.body);
    const ncr = await milestoneService.submitNCRCorrectiveAction(projectId, ncrId, userId, validated);
    return res.json({ ncr, message: `Corrective action response submitted for ${ncr.number}.` });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/ncrs/:ncrId/close
milestoneRouter.post('/projects/:projectId/ncrs/:ncrId/close', async (req: Request, res: Response) => {
  try {
    const { projectId, ncrId } = req.params;
    const userId = req.user!.uid;
    const validated = closeNCRSchema.parse(req.body);
    const ncr = await milestoneService.closeNCR(projectId, ncrId, userId, validated);
    return res.json({ ncr, message: `NCR decision [${validated.decision}] recorded.` });
  } catch (err) {
    return handleError(err, res);
  }
});

// ==========================================
// 7. AI Visual Inspection Endpoints (Sprint 04C)
// ==========================================

// GET /projects/:projectId/ai-inspections
milestoneRouter.get('/projects/:projectId/ai-inspections', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { milestoneId } = req.query;
    const userId = req.user!.uid;
    const analyses = await milestoneService.listAIAnalyses(projectId, userId, milestoneId as string | undefined);
    return res.json({ analyses });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/milestones/:milestoneId/ai-inspection
milestoneRouter.post('/projects/:projectId/milestones/:milestoneId/ai-inspection', async (req: Request, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params;
    const userId = req.user!.uid;
    const validated = requestAIInspectionSchema.parse(req.body || {});
    const analysis = await milestoneService.requestAIInspection(projectId, milestoneId, userId, validated);
    return res.json({
      analysis,
      message: 'AI preliminary visual inspection completed. Human professional review remains required.',
    });
  } catch (err) {
    return handleError(err, res);
  }
});

// ==========================================
// 8. Owner Governance Decision Endpoints (Sprint 04C)
// ==========================================

// GET /projects/:projectId/owner-decisions
milestoneRouter.get('/projects/:projectId/owner-decisions', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { milestoneId } = req.query;
    const userId = req.user!.uid;
    const decisions = await milestoneService.listOwnerDecisions(projectId, userId, milestoneId as string | undefined);
    return res.json({ decisions });
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /projects/:projectId/milestones/:milestoneId/owner-decision
milestoneRouter.post('/projects/:projectId/milestones/:milestoneId/owner-decision', async (req: Request, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params;
    const userId = req.user!.uid;
    const validated = ownerDecisionSchema.parse(req.body);
    const result = await milestoneService.decideOwnerMilestone(projectId, milestoneId, userId, validated);
    return res.json({
      decision: result.decision,
      milestone: result.milestone,
      message: `Owner governance decision [${validated.decision}] registered.`,
    });
  } catch (err) {
    return handleError(err, res);
  }
});

