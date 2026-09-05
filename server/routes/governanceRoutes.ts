import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireOrganizationOwner, requireProjectOwner } from '../middleware/governanceMiddleware';
import { governanceService } from '../services/governanceService';
import {
  createOrganizationSchema,
  createProjectSchema,
  createInvitationSchema
} from '../validation/schemas';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { projectRepository } from '../repositories/projectRepository';
import { organizationRepository } from '../repositories/organizationRepository';

export const governanceRouter = Router();

// ============================================================================
// PART B: Organization Governance Endpoints
// ============================================================================

// POST /api/organizations - Create a new Organization
governanceRouter.post('/organizations', requireAuth, async (req: Request, res: Response) => {
  try {
    const parseResult = createOrganizationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed for organization creation.',
        details: parseResult.error.format(),
        code: 'VALIDATION_FAILED',
      });
    }

    const result = await governanceService.createOrganization(req.user!.uid, parseResult.data);
    return res.status(201).json({
      success: true,
      organization: result.organization,
      membership: result.membership,
      message: 'Organization created. Verification status initialized to NOT_STARTED.',
    });
  } catch (error: any) {
    console.error('[governanceRoutes] Error creating organization:', error);
    return res.status(500).json({ error: error.message || 'Failed to create organization' });
  }
});

// GET /api/organizations - List organizations for the authenticated user
governanceRouter.get('/organizations', requireAuth, async (req: Request, res: Response) => {
  try {
    const orgs = await governanceService.listUserOrganizations(req.user!.uid);
    return res.json(orgs);
  } catch (error: any) {
    console.error('[governanceRoutes] Error listing organizations:', error);
    return res.status(500).json({ error: 'Failed to list organizations' });
  }
});

// GET /api/organizations/:organizationId - Get organization by ID
governanceRouter.get('/organizations/:organizationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const org = await governanceService.getOrganization(req.params.organizationId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    return res.json(org);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

// ============================================================================
// PART C: Project Creation Under Organization
// ============================================================================

// POST /api/organizations/:organizationId/projects - Create project under Organization
governanceRouter.post(
  '/organizations/:organizationId/projects',
  requireAuth,
  requireOrganizationOwner,
  async (req: Request, res: Response) => {
    try {
      const parseResult = createProjectSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation failed for project creation.',
          details: parseResult.error.format(),
          code: 'VALIDATION_FAILED',
        });
      }

      const project = await governanceService.createProject(
        req.user!.uid,
        req.params.organizationId,
        parseResult.data
      );

      return res.status(201).json({
        success: true,
        project,
        message: 'Project created successfully under organization.',
      });
    } catch (error: any) {
      console.error('[governanceRoutes] Error creating project:', error);
      return res.status(500).json({ error: error.message || 'Failed to create project' });
    }
  }
);

// GET /api/organizations/:organizationId/projects - List projects under Organization
governanceRouter.get(
  '/organizations/:organizationId/projects',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const projects = await governanceService.listProjectsByOrganization(req.params.organizationId);
      return res.json(projects);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to list projects' });
    }
  }
);

// GET /api/projects - List projects where authenticated user is owner or appointed
governanceRouter.get('/projects', requireAuth, async (req: Request, res: Response) => {
  try {
    const projects = await governanceService.listProjectsByUser(req.user!.uid);
    return res.json(projects);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to list projects' });
  }
});

// ============================================================================
// PART D, E, H: Project Governance Slots, Vacancies & Appointments
// ============================================================================

// GET /api/projects/:projectId/governance - Get governance team slots & vacancies
governanceRouter.get('/projects/:projectId/governance', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await governanceService.getProjectGovernance(req.params.projectId);
    return res.json(result);
  } catch (error: any) {
    console.error('[governanceRoutes] Error fetching governance team:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch governance team' });
  }
});

// POST /api/projects/:projectId/appointments - Issue invitation to professional
governanceRouter.post(
  '/projects/:projectId/appointments',
  requireAuth,
  requireProjectOwner,
  async (req: Request, res: Response) => {
    try {
      const parseResult = createInvitationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation failed for appointment invitation.',
          details: parseResult.error.format(),
          code: 'VALIDATION_FAILED',
        });
      }

      const { professionalUserId, role, reason } = parseResult.data;
      const appointment = await governanceService.inviteProfessional(
        req.user!.uid,
        req.params.projectId,
        professionalUserId,
        role,
        reason
      );

      return res.status(201).json({
        success: true,
        appointment,
        message: `Invitation issued to candidate for role ${role}. Status is INVITED.`,
      });
    } catch (error: any) {
      console.error('[governanceRoutes] Error issuing appointment invitation:', error);
      return res.status(400).json({ error: error.message || 'Failed to issue invitation' });
    }
  }
);

// DELETE /api/projects/:projectId/appointments/:appointmentId - Revoke appointment
governanceRouter.delete(
  '/projects/:projectId/appointments/:appointmentId',
  requireAuth,
  requireProjectOwner,
  async (req: Request, res: Response) => {
    try {
      const revoked = await governanceService.revokeAppointment(
        req.user!.uid,
        req.params.projectId,
        req.params.appointmentId,
        req.body?.reason
      );

      return res.json({
        success: true,
        appointment: revoked,
        message: 'Appointment revoked successfully.',
      });
    } catch (error: any) {
      console.error('[governanceRoutes] Error revoking appointment:', error);
      return res.status(400).json({ error: error.message || 'Failed to revoke appointment' });
    }
  }
);

// ============================================================================
// PART G: Professional Invitation Response (Accept / Decline)
// ============================================================================

// GET /api/invitations - List pending invitations for current professional user
governanceRouter.get('/invitations', requireAuth, async (req: Request, res: Response) => {
  try {
    const invitations = await governanceService.listUserInvitations(req.user!.uid);
    return res.json(invitations);
  } catch (error: any) {
    console.error('[governanceRoutes] Error listing invitations:', error);
    return res.status(500).json({ error: 'Failed to list invitations' });
  }
});

// POST /api/invitations/:invitationId/accept - Professional accepts appointment
governanceRouter.post('/invitations/:invitationId/accept', requireAuth, async (req: Request, res: Response) => {
  try {
    const updated = await governanceService.respondToInvitation(req.user!.uid, req.params.invitationId, true);
    return res.json({
      success: true,
      appointment: updated,
      message: 'Invitation accepted. Project appointment is now ACTIVE.',
    });
  } catch (error: any) {
    console.error('[governanceRoutes] Error accepting invitation:', error);
    return res.status(400).json({ error: error.message || 'Failed to accept invitation' });
  }
});

// POST /api/invitations/:invitationId/decline - Professional declines appointment
governanceRouter.post('/invitations/:invitationId/decline', requireAuth, async (req: Request, res: Response) => {
  try {
    const updated = await governanceService.respondToInvitation(req.user!.uid, req.params.invitationId, false);
    return res.json({
      success: true,
      appointment: updated,
      message: 'Invitation declined.',
    });
  } catch (error: any) {
    console.error('[governanceRoutes] Error declining invitation:', error);
    return res.status(400).json({ error: error.message || 'Failed to decline invitation' });
  }
});

// GET /api/professionals - Discover eligible professionals for project appointments (Part F)
governanceRouter.get('/professionals', requireAuth, async (req: Request, res: Response) => {
  try {
    const { role, search, country } = req.query;
    if (!role) {
      return res.status(400).json({ error: 'Role query parameter is required' });
    }
    const results = await governanceService.discoverProfessionals(
      role as any,
      search as string | undefined,
      country as string | undefined
    );
    return res.json(results);
  } catch (error: any) {
    console.error('[governanceRoutes] Error discovering professionals:', error);
    return res.status(500).json({ error: 'Failed to search professionals' });
  }
});

// ============================================================================
// PART L: Audit Events
// ============================================================================

governanceRouter.get('/audit-events', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId, organizationId } = req.query;
    const userId = req.user!.uid;

    if (projectId) {
      const pId = projectId as string;
      const project = await projectRepository.getProjectById(pId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found', code: 'PROJECT_NOT_FOUND' });
      }

      // Check authority: project owner, active appointment, or organization owner/admin
      const isProjectOwner = project.ownerUserId === userId;
      let hasActiveAppointment = false;
      const appointment = await projectRepository.getAppointmentByProjectAndUser(pId, userId);
      if (appointment && appointment.appointmentStatus === 'ACTIVE') {
        hasActiveAppointment = true;
      }

      let hasOrgAuthority = false;
      if (project.organizationId) {
        const org = await organizationRepository.getOrganizationById(project.organizationId);
        if (org && (org.ownerUserId === userId)) {
          hasOrgAuthority = true;
        } else {
          const membership = await organizationRepository.getMembership(project.organizationId, userId);
          if (membership && membership.status === 'ACTIVE' && membership.organizationRole === 'OWNER_ADMIN') {
            hasOrgAuthority = true;
          }
        }
      }

      if (!isProjectOwner && !hasActiveAppointment && !hasOrgAuthority) {
        return res.status(403).json({
          error: 'Forbidden: You do not have authority to access audit events for this project.',
          code: 'INSUFFICIENT_PROJECT_AUTHORITY',
        });
      }

      const events = await auditEventRepository.listByProject(pId);
      return res.json(events);
    }

    if (organizationId) {
      const oId = organizationId as string;
      const org = await organizationRepository.getOrganizationById(oId);
      if (!org) {
        return res.status(404).json({ error: 'Organization not found', code: 'ORG_NOT_FOUND' });
      }

      const isOrgOwner = org.ownerUserId === userId;
      const membership = await organizationRepository.getMembership(oId, userId);
      const isMember = membership && membership.status === 'ACTIVE';

      if (!isOrgOwner && !isMember) {
        return res.status(403).json({
          error: 'Forbidden: You do not have authority to access audit events for this organization.',
          code: 'INSUFFICIENT_ORG_AUTHORITY',
        });
      }

      const events = await auditEventRepository.listByOrganization(oId);
      return res.json(events);
    }

    return res.status(400).json({ error: 'projectId or organizationId query parameter required' });
  } catch (error: any) {
    console.error('[governanceRoutes] Error listing audit events:', error);
    return res.status(500).json({ error: 'Failed to list audit events' });
  }
});
