import { directLineRepository, getChannelParticipantRoles } from '../repositories/directLineRepository';
import { projectRepository } from '../repositories/projectRepository';
import { organizationRepository } from '../repositories/organizationRepository';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { userRepository } from '../repositories/userRepository';
import { ChannelType, DirectLineMessageType, ProjectConversation, ProjectMessage, ProjectRole } from '../../src/types';

export class DirectLineService {
  /**
   * Resolve user's active project role.
   * Derives authority from server-backed records:
   * 1. Project Owner (`project.ownerUserId === userId`) -> OWNER_CLIENT
   * 2. Active appointment -> appointment.role
   * 3. Org Owner/Admin -> OWNER_CLIENT
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

  /**
   * Determine allowed channels for a specific project role.
   */
  getAllowedChannelsForRole(role: ProjectRole): ChannelType[] {
    switch (role) {
      case 'OWNER_CLIENT':
        return ['OWNER_DIRECTOR', 'OWNER_QAQC'];
      case 'SENIOR_PROJECT_DIRECTOR':
        return ['OWNER_DIRECTOR', 'DIRECTOR_CONTRACTOR'];
      case 'GENERAL_CONTRACTOR':
        return ['DIRECTOR_CONTRACTOR'];
      case 'STRUCTURAL_QA_QC_AUDITOR':
        return ['OWNER_QAQC'];
      default:
        return [];
    }
  }

  /**
   * Get authorized channels for a user on a given project.
   */
  async getAuthorizedChannels(projectId: string, userId: string): Promise<{
    userRole: ProjectRole;
    allowedChannels: ChannelType[];
    conversations: ProjectConversation[];
  }> {
    const userRole = await this.resolveUserProjectRole(projectId, userId);
    if (!userRole) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have an active appointment or authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    const allowedChannels = this.getAllowedChannelsForRole(userRole);
    const conversations: ProjectConversation[] = [];

    for (const channelType of allowedChannels) {
      const conv = await directLineRepository.getOrCreateConversation(projectId, channelType);
      conversations.push(conv);
    }

    return {
      userRole,
      allowedChannels,
      conversations,
    };
  }

  /**
   * Fetch messages in a channel, verifying bilateral access.
   */
  async getMessages(projectId: string, channelType: ChannelType, userId: string): Promise<{
    userRole: ProjectRole;
    messages: ProjectMessage[];
  }> {
    const userRole = await this.resolveUserProjectRole(projectId, userId);
    if (!userRole) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have an active appointment or authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    const allowedChannels = this.getAllowedChannelsForRole(userRole);
    if (!allowedChannels.includes(channelType)) {
      throw {
        statusCode: 403,
        error: `Forbidden: Your active project role (${userRole}) is not authorized to access channel ${channelType}.`,
        code: 'CHANNEL_ACCESS_DENIED',
      };
    }

    const messages = await directLineRepository.getMessagesByChannel(projectId, channelType);
    return {
      userRole,
      messages,
    };
  }

  /**
   * Send a message through a direct line channel.
   */
  async sendMessage(
    projectId: string,
    channelType: ChannelType,
    userId: string,
    payload: {
      content: string;
      messageType: DirectLineMessageType;
      subject?: string;
      relatedEntityId?: string;
    }
  ): Promise<ProjectMessage> {
    const userRole = await this.resolveUserProjectRole(projectId, userId);
    if (!userRole) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have an active appointment or authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    const allowedChannels = this.getAllowedChannelsForRole(userRole);
    if (!allowedChannels.includes(channelType)) {
      throw {
        statusCode: 403,
        error: `Forbidden: Your active project role (${userRole}) is not authorized to transmit in channel ${channelType}.`,
        code: 'CHANNEL_TRANSMIT_DENIED',
      };
    }

    const userProfile = await userRepository.findByAuthUserId(userId);
    const senderName = userProfile
      ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
      : 'Authorized Professional';

    const message = await directLineRepository.addMessage({
      projectId,
      channelType,
      senderUserId: userId,
      senderRole: userRole,
      senderName,
      messageType: payload.messageType,
      subject: payload.subject,
      content: payload.content,
      relatedEntityId: payload.relatedEntityId,
    });

    // Record audit event
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorUserId: userId,
      projectId,
      action: 'DIRECT_LINE_MESSAGE_SENT',
      entityType: 'DIRECT_LINE_MESSAGE',
      entityId: message.id,
      timestamp: new Date().toISOString(),
      metadata: {
        channelType,
        senderRole: userRole,
        messageType: payload.messageType,
        subject: payload.subject,
      },
    });

    return message;
  }
}

export const directLineService = new DirectLineService();
