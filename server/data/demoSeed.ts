import fs from 'fs';
import path from 'path';
import { StoredProject, ProjectAppointment } from '../repositories/projectRepository';
import { Organization, OrganizationMembership } from '../repositories/organizationRepository';
import { UserProfile } from '../repositories/userRepository';

/**
 * STRUCTURA CANONICAL DEVELOPMENT & DEMO DATASET
 *
 * Truthful boundary representation:
 * - Visibly identified as demonstration / sandbox data (isDemo: true).
 * - No simulated or fabricated verifications: all professional credentials
 *   remain UNVERIFIED or NOT_STARTED in compliance with Rule 5.
 * - Bridges the sample projects (proj-horizon-villa) with server-side governance,
 *   appointments, and organization models.
 */

// Shared PBKDF2 hash for demo password "Structura2026!" with 100,000 rounds sha512
const DEMO_PASSWORD_HASH = '9f1e5458c2e696c1bb324a596b058664f7ebc43a695f5154c7832348fa8c1e8b:eed6a0414389da6ff2d5370a1a5033dfc7e02e9ef06323a75b452fdc49076941bbe1a3fd5343f0a378cf3828536d1db91e192acbbe11c594b7b59dc8b1b05bb2';

export const DEMO_ORGANIZATION: Organization = {
  id: 'org-demo-vanguard',
  name: 'Vance Development Partners (Demo Sandbox)',
  type: 'INDIVIDUAL_DEVELOPER',
  jurisdiction: 'California, USA (Demo)',
  country: 'United States',
  verificationStatus: 'NOT_STARTED',
  ownerAuthorityStatus: 'NOT_STARTED',
  status: 'ACTIVE',
  createdAt: '2026-01-15T08:00:00.000Z',
  updatedAt: '2026-08-25T12:00:00.000Z',
  isDemo: true,
};

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'usr_demo_owner',
    authUserId: 'usr_demo_owner',
    email: 'owner@structura.build',
    firstName: 'Alexander',
    lastName: 'Vance',
    phone: '+1 (555) 019-2831',
    primaryRole: 'OWNER_CLIENT',
    accountStatus: 'ACTIVE',
    identityStatus: 'NOT_STARTED',
    professionalVerificationStatus: 'NOT_REQUIRED',
    passwordHash: DEMO_PASSWORD_HASH,
    roleDetails: {
      companyName: 'Vance Development Partners (Demo Sandbox)',
      yearsExperience: 18,
      primaryDiscipline: 'Project Principal & Fiduciary Owner',
    },
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-08-25T12:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'usr_demo_director',
    authUserId: 'usr_demo_director',
    email: 'director@structura.build',
    firstName: 'Marcus',
    lastName: 'Vance',
    phone: '+1 (555) 019-4820',
    primaryRole: 'SENIOR_PROJECT_DIRECTOR',
    accountStatus: 'ACTIVE',
    identityStatus: 'NOT_STARTED',
    professionalVerificationStatus: 'UNVERIFIED',
    passwordHash: DEMO_PASSWORD_HASH,
    roleDetails: {
      companyName: 'Vance Project Management Group',
      yearsExperience: 24,
      primaryDiscipline: 'Executive Project Management',
      claimedCredentials: 'AIA, Civil PE (Unverified)',
      licenseNumber: 'AIA-CA-98210 (Self-Declared)',
      jurisdiction: 'California',
      professionalBody: 'American Institute of Architects (AIA)',
    },
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-08-25T12:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'usr_demo_contractor',
    authUserId: 'usr_demo_contractor',
    email: 'contractor@structura.build',
    firstName: 'Elena',
    lastName: 'Rostova',
    phone: '+1 (555) 019-7712',
    primaryRole: 'GENERAL_CONTRACTOR',
    accountStatus: 'ACTIVE',
    identityStatus: 'NOT_STARTED',
    professionalVerificationStatus: 'UNVERIFIED',
    passwordHash: DEMO_PASSWORD_HASH,
    roleDetails: {
      companyName: 'Aegis EPC Infrastructure Ltd.',
      yearsExperience: 20,
      primaryDiscipline: 'General Contracting & Site Operations',
      claimedCredentials: 'PE (Unverified)',
      licenseNumber: 'GC-NV-441209 (Self-Declared)',
      jurisdiction: 'Nevada & California',
      professionalBody: 'Associated General Contractors of America (AGC)',
    },
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-08-25T12:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'usr_demo_qaqc',
    authUserId: 'usr_demo_qaqc',
    email: 'auditor@structura.build',
    firstName: 'Dr. David',
    lastName: 'Chen',
    phone: '+1 (555) 019-3394',
    primaryRole: 'STRUCTURAL_QA_QC_AUDITOR',
    accountStatus: 'ACTIVE',
    identityStatus: 'NOT_STARTED',
    professionalVerificationStatus: 'UNVERIFIED',
    passwordHash: DEMO_PASSWORD_HASH,
    roleDetails: {
      companyName: 'Chen Structural Forensics & Audit PLLC',
      yearsExperience: 22,
      primaryDiscipline: 'Structural Engineering & Code Compliance',
      claimedCredentials: 'SE (Unverified)',
      licenseNumber: 'SE-CA-55102 (Self-Declared)',
      jurisdiction: 'California',
      professionalBody: 'Structural Engineers Association of California (SEAOC)',
    },
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-08-25T12:00:00.000Z',
    isDemo: true,
  },
];

export const DEMO_MEMBERSHIPS: OrganizationMembership[] = [
  {
    id: 'mem-demo-owner',
    organizationId: 'org-demo-vanguard',
    userId: 'usr_demo_owner',
    organizationRole: 'OWNER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'mem-demo-director',
    organizationId: 'org-demo-vanguard',
    userId: 'usr_demo_director',
    organizationRole: 'PROJECT_DIRECTOR',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'mem-demo-contractor',
    organizationId: 'org-demo-vanguard',
    userId: 'usr_demo_contractor',
    organizationRole: 'CONTRACTOR',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'mem-demo-qaqc',
    organizationId: 'org-demo-vanguard',
    userId: 'usr_demo_qaqc',
    organizationRole: 'QAQC_AUDITOR',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00.000Z',
    isDemo: true,
  },
];

export const DEMO_PROJECTS: StoredProject[] = [
  {
    id: 'proj-horizon-villa',
    organizationId: 'org-demo-vanguard',
    name: 'The Horizon Pavilion - 680 m² Luxury Estate',
    location: '104 Pinnacle Ridge Way, Aspen / Silicon Valley Ridge',
    projectType: 'RESIDENTIAL_ESTATE',
    description: 'Contemporary Minimalist 3-story luxury estate with hybrid steel-concrete core, net-zero MEP microgrid and bespoke luxury finishes. [DEMO DATASET]',
    startDate: '2026-01-15',
    targetHandoverDate: '2027-02-28',
    totalBaselineBudgetUSD: 2450000,
    currency: 'USD',
    currentStage: 'Roofing & Glazing',
    ownerUserId: 'usr_demo_owner',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-08-25T12:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'proj-apex-commercial',
    organizationId: 'org-demo-vanguard',
    name: 'Apex Innovation Hub - 1,450 m² Biophilic Office',
    location: '420 Tech Boulevard, Austin Innovation District, TX',
    projectType: 'COMMERCIAL_OFFICE',
    description: 'Biophilic 4-story commercial office building featuring mass timber glulam frame and net-zero geothermal HVAC. [DEMO DATASET]',
    startDate: '2026-02-01',
    targetHandoverDate: '2027-06-30',
    totalBaselineBudgetUSD: 4850000,
    currency: 'USD',
    currentStage: 'Superstructure Frame',
    ownerUserId: 'usr_demo_owner',
    status: 'ACTIVE',
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-08-25T12:00:00.000Z',
    isDemo: true,
  },
];

export const DEMO_APPOINTMENTS: ProjectAppointment[] = [
  {
    id: 'appt-demo-hv-owner',
    projectId: 'proj-horizon-villa',
    organizationId: 'org-demo-vanguard',
    userId: 'usr_demo_owner',
    userEmail: 'owner@structura.build',
    userName: 'Alexander Vance',
    role: 'OWNER_CLIENT',
    discipline: 'Project Principal & Fiduciary Owner',
    appointmentStatus: 'ACTIVE',
    invitedByUserId: 'usr_demo_owner',
    invitedAt: '2026-01-15T08:00:00.000Z',
    activatedAt: '2026-01-15T08:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'appt-demo-hv-director',
    projectId: 'proj-horizon-villa',
    organizationId: 'org-demo-vanguard',
    userId: 'usr_demo_director',
    userEmail: 'director@structura.build',
    userName: 'Marcus Vance',
    role: 'SENIOR_PROJECT_DIRECTOR',
    discipline: 'Executive Project Director (Civil Discipline)',
    appointmentStatus: 'ACTIVE',
    invitedByUserId: 'usr_demo_owner',
    invitedAt: '2026-01-16T09:00:00.000Z',
    activatedAt: '2026-01-16T10:30:00.000Z',
    isDemo: true,
  },
  {
    id: 'appt-demo-hv-contractor',
    projectId: 'proj-horizon-villa',
    organizationId: 'org-demo-vanguard',
    userId: 'usr_demo_contractor',
    userEmail: 'contractor@structura.build',
    userName: 'Elena Rostova',
    role: 'GENERAL_CONTRACTOR',
    discipline: 'General Contracting & Site Operations',
    appointmentStatus: 'ACTIVE',
    invitedByUserId: 'usr_demo_owner',
    invitedAt: '2026-01-18T14:00:00.000Z',
    activatedAt: '2026-01-19T08:15:00.000Z',
    isDemo: true,
  },
  {
    id: 'appt-demo-hv-qaqc',
    projectId: 'proj-horizon-villa',
    organizationId: 'org-demo-vanguard',
    userId: 'usr_demo_qaqc',
    userEmail: 'auditor@structura.build',
    userName: 'Dr. David Chen',
    role: 'STRUCTURAL_QA_QC_AUDITOR',
    discipline: 'Structural Engineering & Code Compliance',
    appointmentStatus: 'ACTIVE',
    invitedByUserId: 'usr_demo_owner',
    invitedAt: '2026-01-20T11:00:00.000Z',
    activatedAt: '2026-01-20T16:45:00.000Z',
    isDemo: true,
  },
];

/**
 * Synchronous / idempotent file seeding helper for development persistence.
 * Ensures the root `/data/*.json` files contain the canonical demo dataset.
 */
export function ensureDemoDataSeeded(): void {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 1. Organizations
  const orgsFile = path.join(dataDir, 'organizations.json');
  let orgs: Organization[] = [];
  try {
    if (fs.existsSync(orgsFile)) {
      orgs = JSON.parse(fs.readFileSync(orgsFile, 'utf-8'));
    }
  } catch {
    orgs = [];
  }
  if (!orgs.some(o => o.id === DEMO_ORGANIZATION.id)) {
    orgs.push(DEMO_ORGANIZATION);
    fs.writeFileSync(orgsFile, JSON.stringify(orgs, null, 2));
  }

  // 2. Memberships
  const membersFile = path.join(dataDir, 'memberships.json');
  let members: OrganizationMembership[] = [];
  try {
    if (fs.existsSync(membersFile)) {
      members = JSON.parse(fs.readFileSync(membersFile, 'utf-8'));
    }
  } catch {
    members = [];
  }
  let membersModified = false;
  for (const dm of DEMO_MEMBERSHIPS) {
    if (!members.some(m => m.id === dm.id)) {
      members.push(dm);
      membersModified = true;
    }
  }
  if (membersModified) {
    fs.writeFileSync(membersFile, JSON.stringify(members, null, 2));
  }

  // 3. Users
  const usersFile = path.join(dataDir, 'users.json');
  let users: UserProfile[] = [];
  try {
    if (fs.existsSync(usersFile)) {
      users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    }
  } catch {
    users = [];
  }
  let usersModified = false;
  for (const du of DEMO_USERS) {
    const existingIdx = users.findIndex(u => u.authUserId === du.authUserId || u.email === du.email);
    if (existingIdx === -1) {
      users.push(du);
      usersModified = true;
    } else if (users[existingIdx].isDemo) {
      users[existingIdx] = { ...users[existingIdx], ...du };
      usersModified = true;
    }
  }
  if (usersModified) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  }

  // 4. Projects
  const projectsFile = path.join(dataDir, 'projects.json');
  let projects: StoredProject[] = [];
  try {
    if (fs.existsSync(projectsFile)) {
      projects = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
    }
  } catch {
    projects = [];
  }
  let projectsModified = false;
  for (const dp of DEMO_PROJECTS) {
    if (!projects.some(p => p.id === dp.id)) {
      projects.push(dp);
      projectsModified = true;
    }
  }
  if (projectsModified) {
    fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
  }

  // 5. Appointments
  const apptsFile = path.join(dataDir, 'appointments.json');
  let appts: ProjectAppointment[] = [];
  try {
    if (fs.existsSync(apptsFile)) {
      appts = JSON.parse(fs.readFileSync(apptsFile, 'utf-8'));
    }
  } catch {
    appts = [];
  }
  let apptsModified = false;
  for (const da of DEMO_APPOINTMENTS) {
    const existingIdx = appts.findIndex(a => a.id === da.id);
    if (existingIdx === -1) {
      appts.push(da);
      apptsModified = true;
    } else if (appts[existingIdx].isDemo) {
      appts[existingIdx] = { ...appts[existingIdx], ...da };
      apptsModified = true;
    }
  }
  if (apptsModified) {
    fs.writeFileSync(apptsFile, JSON.stringify(appts, null, 2));
  }
}

export function getDemoProjectById(id: string): StoredProject | null {
  return DEMO_PROJECTS.find(p => p.id === id) || null;
}

export function getDemoAppointmentsByProject(projectId: string): ProjectAppointment[] {
  return DEMO_APPOINTMENTS.filter(a => a.projectId === projectId);
}
