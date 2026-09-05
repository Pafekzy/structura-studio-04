import { rfiRepository } from '../repositories/rfiRepository';
import { projectRepository } from '../repositories/projectRepository';
import { organizationRepository } from '../repositories/organizationRepository';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { userRepository } from '../repositories/userRepository';
import { RFI, RFIPriority, ProjectRole } from '../../src/types';

export class RFIService {
  /**
   * Resolve user's active project role.
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

  async listRFIs(projectId: string, userId: string): Promise<RFI[]> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority to view RFIs for this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    return rfiRepository.listRFIsByProject(projectId);
  }

  async getRFI(projectId: string, rfiId: string, userId: string): Promise<RFI> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority to view RFIs for this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }
    const rfi = await rfiRepository.getRFIById(rfiId);
    if (!rfi || rfi.projectId !== projectId) {
      throw {
        statusCode: 404,
        error: 'RFI not found.',
        code: 'RFI_NOT_FOUND',
      };
    }
    return rfi;
  }

  async createRFI(
    projectId: string,
    userId: string,
    payload: {
      title: string;
      question: string;
      discipline?: string;
      priority: RFIPriority;
      assignedToUserId?: string;
      relatedMilestoneId?: string;
      relatedEvidenceIds?: string[];
      dueAt?: string;
    }
  ): Promise<RFI> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    // GC or Engineer role expected to raise RFI
    const userProfile = await userRepository.findByAuthUserId(userId);
    const raisedByName = userProfile
      ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
      : 'General Contractor Lead';

    // Find assigned Senior Project Director appointment
    let assignedUserId = payload.assignedToUserId;
    let assignedUserName = 'Senior Project Director';
    let assignedRole: ProjectRole = 'SENIOR_PROJECT_DIRECTOR';

    const appointments = await projectRepository.listAppointmentsByProject(projectId);
    const directorAppt = appointments.find(
      a => a.role === 'SENIOR_PROJECT_DIRECTOR' && a.appointmentStatus === 'ACTIVE'
    );

    if (directorAppt) {
      assignedUserId = directorAppt.userId;
      assignedUserName = directorAppt.userName || 'Senior Project Director';
    } else {
      assignedUserId = assignedUserId || 'usr_demo_director';
    }

    const rfi = await rfiRepository.createRFI({
      projectId,
      title: payload.title,
      question: payload.question,
      discipline: payload.discipline || 'General Operations',
      raisedByUserId: userId,
      raisedByRole: role,
      raisedByName,
      assignedToUserId: assignedUserId,
      assignedToRole: assignedRole,
      assignedToName: assignedUserName,
      priority: payload.priority,
      relatedMilestoneId: payload.relatedMilestoneId,
      relatedEvidenceIds: payload.relatedEvidenceIds,
      dueAt: payload.dueAt,
    });

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorUserId: userId,
      projectId,
      action: 'RFI_CREATED',
      entityType: 'RFI',
      entityId: rfi.id,
      timestamp: new Date().toISOString(),
      metadata: {
        number: rfi.number,
        title: rfi.title,
        priority: rfi.priority,
        raisedByRole: role,
      },
    });

    return rfi;
  }

  async respondRFI(
    projectId: string,
    rfiId: string,
    userId: string,
    responseContent: string
  ): Promise<RFI> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    // Role check: SENIOR_PROJECT_DIRECTOR or OWNER_CLIENT
    if (role !== 'SENIOR_PROJECT_DIRECTOR' && role !== 'OWNER_CLIENT') {
      throw {
        statusCode: 403,
        error: `Forbidden: Only the Senior Project Director or Project Owner may issue formal RFI engineering determinations. Your active role is ${role}.`,
        code: 'INSUFFICIENT_ROLE_AUTHORITY',
      };
    }

    const rfi = await rfiRepository.getRFIById(rfiId);
    if (!rfi || rfi.projectId !== projectId) {
      throw { statusCode: 404, error: 'RFI not found.', code: 'RFI_NOT_FOUND' };
    }

    if (rfi.status === 'CLOSED') {
      throw {
        statusCode: 400,
        error: 'Cannot respond to a closed RFI.',
        code: 'RFI_ALREADY_CLOSED',
      };
    }

    const userProfile = await userRepository.findByAuthUserId(userId);
    const respondedByName = userProfile
      ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
      : 'Senior Project Director';

    const updated = await rfiRepository.updateRFI(rfiId, {
      response: responseContent,
      respondedByUserId: userId,
      respondedByName,
      respondedAt: new Date().toISOString(),
      status: 'ANSWERED',
    });

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorUserId: userId,
      projectId,
      action: 'RFI_RESPONDED',
      entityType: 'RFI',
      entityId: rfi.id,
      timestamp: new Date().toISOString(),
      metadata: {
        number: rfi.number,
        respondedByRole: role,
      },
    });

    return updated;
  }

  async acknowledgeRFI(
    projectId: string,
    rfiId: string,
    userId: string,
    acknowledgementNote?: string
  ): Promise<RFI> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    const rfi = await rfiRepository.getRFIById(rfiId);
    if (!rfi || rfi.projectId !== projectId) {
      throw { statusCode: 404, error: 'RFI not found.', code: 'RFI_NOT_FOUND' };
    }

    if (rfi.status !== 'ANSWERED') {
      throw {
        statusCode: 400,
        error: `RFI must be in ANSWERED status to acknowledge. Current status: ${rfi.status}`,
        code: 'INVALID_STATUS_TRANSITION',
      };
    }

    // Must be GC or user who raised it
    if (role !== 'GENERAL_CONTRACTOR' && rfi.raisedByUserId !== userId) {
      throw {
        statusCode: 403,
        error: 'Forbidden: Only the General Contractor who raised the RFI may formally acknowledge receipt of the response.',
        code: 'INSUFFICIENT_ROLE_AUTHORITY',
      };
    }

    const updated = await rfiRepository.updateRFI(rfiId, {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date().toISOString(),
      acknowledgementNote: acknowledgementNote || 'Response acknowledged and incorporated into site operations plan.',
    });

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorUserId: userId,
      projectId,
      action: 'RFI_ACKNOWLEDGED',
      entityType: 'RFI',
      entityId: rfi.id,
      timestamp: new Date().toISOString(),
      metadata: {
        number: rfi.number,
      },
    });

    return updated;
  }

  async closeRFI(
    projectId: string,
    rfiId: string,
    userId: string,
    closingNotes?: string
  ): Promise<RFI> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    if (role !== 'SENIOR_PROJECT_DIRECTOR' && role !== 'OWNER_CLIENT') {
      throw {
        statusCode: 403,
        error: `Forbidden: Only the Senior Project Director or Owner may close an RFI. Your active role is ${role}.`,
        code: 'INSUFFICIENT_ROLE_AUTHORITY',
      };
    }

    const rfi = await rfiRepository.getRFIById(rfiId);
    if (!rfi || rfi.projectId !== projectId) {
      throw { statusCode: 404, error: 'RFI not found.', code: 'RFI_NOT_FOUND' };
    }

    const updated = await rfiRepository.updateRFI(rfiId, {
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      closingNotes: closingNotes || 'RFI closed following resolution and contractor acknowledgement.',
    });

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorUserId: userId,
      projectId,
      action: 'RFI_CLOSED',
      entityType: 'RFI',
      entityId: rfi.id,
      timestamp: new Date().toISOString(),
      metadata: {
        number: rfi.number,
        closedByRole: role,
      },
    });

    return updated;
  }
}

export const rfiService = new RFIService();
