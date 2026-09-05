import fs from 'fs';
import path from 'path';
import { getFirebaseFirestore } from '../auth/firebaseAdmin';

export type AuditAction =
  | 'ORGANIZATION_CREATED'
  | 'PROJECT_CREATED'
  | 'PROJECT_INVITATION_SENT'
  | 'PROJECT_INVITATION_ACCEPTED'
  | 'PROJECT_INVITATION_DECLINED'
  | 'PROJECT_APPOINTMENT_REVOKED'
  | 'DIRECT_LINE_MESSAGE_SENT'
  | 'RFI_CREATED'
  | 'RFI_RESPONDED'
  | 'RFI_ACKNOWLEDGED'
  | 'RFI_CLOSED';

export interface AuditEvent {
  id: string;
  actorUserId: string;
  organizationId?: string;
  projectId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface IAuditEventRepository {
  record(event: AuditEvent): Promise<AuditEvent>;
  listByProject(projectId: string): Promise<AuditEvent[]>;
  listByOrganization(organizationId: string): Promise<AuditEvent[]>;
}

class FirestoreAuditEventRepository implements IAuditEventRepository {
  private getCol() {
    const firestore = getFirebaseFirestore();
    if (!firestore) throw new Error('Firestore not initialized');
    return firestore.collection('structura_audit_events');
  }

  async record(event: AuditEvent): Promise<AuditEvent> {
    await this.getCol().doc(event.id).set(event);
    return event;
  }

  async listByProject(projectId: string): Promise<AuditEvent[]> {
    const snap = await this.getCol().where('projectId', '==', projectId).orderBy('timestamp', 'desc').get();
    return snap.docs.map(d => d.data() as AuditEvent);
  }

  async listByOrganization(organizationId: string): Promise<AuditEvent[]> {
    const snap = await this.getCol().where('organizationId', '==', organizationId).orderBy('timestamp', 'desc').get();
    return snap.docs.map(d => d.data() as AuditEvent);
  }
}

class FileAuditEventRepository implements IAuditEventRepository {
  private file = path.join(process.cwd(), 'data', 'audit_events.json');

  constructor() {
    this.ensureFile();
  }

  private ensureFile() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.file)) {
      fs.writeFileSync(this.file, JSON.stringify([], null, 2));
    }
  }

  private readEvents(): AuditEvent[] {
    try {
      if (!fs.existsSync(this.file)) return [];
      const raw = fs.readFileSync(this.file, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private writeEvents(events: AuditEvent[]) {
    fs.writeFileSync(this.file, JSON.stringify(events, null, 2));
  }

  async record(event: AuditEvent): Promise<AuditEvent> {
    const events = this.readEvents();
    events.unshift(event);
    this.writeEvents(events);
    return event;
  }

  async listByProject(projectId: string): Promise<AuditEvent[]> {
    const events = this.readEvents();
    return events.filter(e => e.projectId === projectId);
  }

  async listByOrganization(organizationId: string): Promise<AuditEvent[]> {
    const events = this.readEvents();
    return events.filter(e => e.organizationId === organizationId);
  }
}

class HybridAuditEventRepository implements IAuditEventRepository {
  private firestore = new FirestoreAuditEventRepository();
  private file = new FileAuditEventRepository();

  private getDelegate(): IAuditEventRepository {
    if (process.env.STRUCTURA_AUTH_MODE !== 'sandbox' && getFirebaseFirestore()) {
      return this.firestore;
    }
    return this.file;
  }

  record(event: AuditEvent): Promise<AuditEvent> {
    return this.getDelegate().record(event);
  }
  listByProject(projectId: string): Promise<AuditEvent[]> {
    return this.getDelegate().listByProject(projectId);
  }
  listByOrganization(organizationId: string): Promise<AuditEvent[]> {
    return this.getDelegate().listByOrganization(organizationId);
  }
}

export const auditEventRepository = new HybridAuditEventRepository();
