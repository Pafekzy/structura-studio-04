import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { rfiService } from '../services/rfiService';
import {
  createRFISchema,
  respondRFISchema,
  acknowledgeRFISchema,
  closeRFISchema
} from '../validation/schemas';

export const rfiRouter = Router({ mergeParams: true });

/**
 * GET /api/projects/:projectId/rfis
 * List RFIs for the project. Caller must be authorized on the project.
 */
rfiRouter.get('/projects/:projectId/rfis', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const rfis = await rfiService.listRFIs(projectId, userId);
    return res.json(rfis);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.error, code: error.code });
    }
    console.error('[rfiRoutes] Error listing RFIs:', error);
    return res.status(500).json({ error: 'Internal server error while listing RFIs.' });
  }
});

/**
 * GET /api/projects/:projectId/rfis/:rfiId
 * Retrieve single RFI details.
 */
rfiRouter.get('/projects/:projectId/rfis/:rfiId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId, rfiId } = req.params;
    const userId = req.user!.uid;

    const rfi = await rfiService.getRFI(projectId, rfiId, userId);
    return res.json(rfi);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.error, code: error.code });
    }
    console.error('[rfiRoutes] Error retrieving RFI:', error);
    return res.status(500).json({ error: 'Internal server error while retrieving RFI.' });
  }
});

/**
 * POST /api/projects/:projectId/rfis
 * Create a new RFI.
 */
rfiRouter.post('/projects/:projectId/rfis', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const parseResult = createRFISchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed for RFI creation.',
        details: parseResult.error.format(),
        code: 'VALIDATION_FAILED',
      });
    }

    const rfi = await rfiService.createRFI(projectId, userId, parseResult.data);
    return res.status(201).json(rfi);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.error, code: error.code });
    }
    console.error('[rfiRoutes] Error creating RFI:', error);
    return res.status(500).json({ error: 'Internal server error while creating RFI.' });
  }
});

/**
 * POST /api/projects/:projectId/rfis/:rfiId/respond
 * Respond to an RFI (Senior Project Director or Project Owner).
 */
rfiRouter.post('/projects/:projectId/rfis/:rfiId/respond', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId, rfiId } = req.params;
    const userId = req.user!.uid;

    const parseResult = respondRFISchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed for RFI response.',
        details: parseResult.error.format(),
        code: 'VALIDATION_FAILED',
      });
    }

    const rfi = await rfiService.respondRFI(projectId, rfiId, userId, parseResult.data.response);
    return res.json(rfi);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.error, code: error.code });
    }
    console.error('[rfiRoutes] Error responding to RFI:', error);
    return res.status(500).json({ error: 'Internal server error while responding to RFI.' });
  }
});

/**
 * POST /api/projects/:projectId/rfis/:rfiId/acknowledge
 * Acknowledge an answered RFI (General Contractor / Creator).
 */
rfiRouter.post('/projects/:projectId/rfis/:rfiId/acknowledge', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId, rfiId } = req.params;
    const userId = req.user!.uid;

    const parseResult = acknowledgeRFISchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed for RFI acknowledgement.',
        details: parseResult.error.format(),
        code: 'VALIDATION_FAILED',
      });
    }

    const rfi = await rfiService.acknowledgeRFI(projectId, rfiId, userId, parseResult.data.acknowledgementNote);
    return res.json(rfi);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.error, code: error.code });
    }
    console.error('[rfiRoutes] Error acknowledging RFI:', error);
    return res.status(500).json({ error: 'Internal server error while acknowledging RFI.' });
  }
});

/**
 * POST /api/projects/:projectId/rfis/:rfiId/close
 * Close an RFI (Senior Project Director or Owner).
 */
rfiRouter.post('/projects/:projectId/rfis/:rfiId/close', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId, rfiId } = req.params;
    const userId = req.user!.uid;

    const parseResult = closeRFISchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed for RFI closure.',
        details: parseResult.error.format(),
        code: 'VALIDATION_FAILED',
      });
    }

    const rfi = await rfiService.closeRFI(projectId, rfiId, userId, parseResult.data.closingNotes);
    return res.json(rfi);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.error, code: error.code });
    }
    console.error('[rfiRoutes] Error closing RFI:', error);
    return res.status(500).json({ error: 'Internal server error while closing RFI.' });
  }
});
