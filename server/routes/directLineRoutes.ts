import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { directLineService } from '../services/directLineService';
import { createDirectLineMessageSchema } from '../validation/schemas';
import { ChannelType } from '../../src/types';

export const directLineRouter = Router({ mergeParams: true });

// Valid channel types
const VALID_CHANNELS: ChannelType[] = ['OWNER_DIRECTOR', 'OWNER_QAQC', 'DIRECTOR_CONTRACTOR'];

/**
 * GET /api/projects/:projectId/direct-line/channels
 * Returns permitted channels and conversation metadata for caller's active project role.
 */
directLineRouter.get('/projects/:projectId/direct-line/channels', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const result = await directLineService.getAuthorizedChannels(projectId, userId);
    return res.json(result);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.error, code: error.code });
    }
    console.error('[directLineRoutes] Error getting authorized channels:', error);
    return res.status(500).json({ error: 'Internal server error while resolving direct line channels.' });
  }
});

/**
 * GET /api/projects/:projectId/direct-line/channels/:channelType/messages
 * Returns message stream for an authorized channel.
 */
directLineRouter.get('/projects/:projectId/direct-line/channels/:channelType/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId, channelType } = req.params;
    const userId = req.user!.uid;

    if (!VALID_CHANNELS.includes(channelType as ChannelType)) {
      return res.status(400).json({
        error: `Invalid channel type: ${channelType}. Valid: ${VALID_CHANNELS.join(', ')}`,
        code: 'INVALID_CHANNEL_TYPE',
      });
    }

    const result = await directLineService.getMessages(projectId, channelType as ChannelType, userId);
    return res.json(result);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.error, code: error.code });
    }
    console.error('[directLineRoutes] Error getting channel messages:', error);
    return res.status(500).json({ error: 'Internal server error while fetching messages.' });
  }
});

/**
 * POST /api/projects/:projectId/direct-line/channels/:channelType/messages
 * Transmits a validated message to the direct line channel.
 */
directLineRouter.post('/projects/:projectId/direct-line/channels/:channelType/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId, channelType } = req.params;
    const userId = req.user!.uid;

    if (!VALID_CHANNELS.includes(channelType as ChannelType)) {
      return res.status(400).json({
        error: `Invalid channel type: ${channelType}. Valid: ${VALID_CHANNELS.join(', ')}`,
        code: 'INVALID_CHANNEL_TYPE',
      });
    }

    const parseResult = createDirectLineMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed for direct line message.',
        details: parseResult.error.format(),
        code: 'VALIDATION_FAILED',
      });
    }

    const message = await directLineService.sendMessage(
      projectId,
      channelType as ChannelType,
      userId,
      parseResult.data
    );

    return res.status(201).json(message);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.error, code: error.code });
    }
    console.error('[directLineRoutes] Error sending direct line message:', error);
    return res.status(500).json({ error: 'Internal server error while transmitting direct line message.' });
  }
});
