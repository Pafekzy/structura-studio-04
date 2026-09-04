import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Trash2,
  RefreshCw,
  Award,
  ChevronRight
} from 'lucide-react';
import { ConstructionProject, ProjectRole, ProjectAppointment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { InviteProfessionalModal } from './InviteProfessionalModal';

interface GovernanceSlotData {
  role: ProjectRole;
  roleTitle: string;
  status: 'UNASSIGNED' | 'INVITED' | 'ACTIVE';
  appointment?: ProjectAppointment;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    verificationStatus: string;
    experienceYears?: number;
    discipline?: string;
    professionalBody?: string;
  };
}

interface ProjectGovernanceTeamViewProps {
  project: ConstructionProject;
  isOwnerView?: boolean;
  onRefreshProject?: () => void;
}

export const ProjectGovernanceTeamView: React.FC<ProjectGovernanceTeamViewProps> = ({
  project,
  isOwnerView = true,
  onRefreshProject,
}) => {
  const { idToken, user } = useAuth();
  const [team, setTeam] = useState<GovernanceSlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state for issuing invitations
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedRoleForInvite, setSelectedRoleForInvite] = useState<{ role: ProjectRole; title: string } | null>(null);

  const fetchGovernance = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      } else {
        // In developer demo / sandbox mode, pass the demo session token for the active role
        headers['Authorization'] = 'Bearer demo_sess_owner';
      }

      const res = await fetch(`/api/projects/${project.id}/governance`, {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
      } else {
        // Provide graceful initial representation if project was created in legacy local storage
        setTeam([
          {
            role: 'OWNER_CLIENT',
            roleTitle: 'Owner / Client',
            status: 'ACTIVE',
            assignedUser: {
              id: project.ownerUserId || 'usr_owner_default',
              name: project.clientName || 'Project Principal',
              email: 'owner@structura.build',
              verificationStatus: 'NOT_REQUIRED',
            },
          },
          {
            role: 'SENIOR_PROJECT_DIRECTOR',
            roleTitle: 'Senior Project Director',
            status: 'ACTIVE',
            assignedUser: {
              id: 'usr_director_demo',
              name: 'Marcus Vance, AIA',
              email: 'director@structura.build',
              verificationStatus: 'UNVERIFIED',
              discipline: 'Executive Project Director',
            },
          },
          {
            role: 'GENERAL_CONTRACTOR',
            roleTitle: 'General Contractor',
            status: 'ACTIVE',
            assignedUser: {
              id: 'usr_contractor_demo',
              name: project.contractorName || 'Aegis EPC Infrastructure Ltd.',
              email: 'contractor@structura.build',
              verificationStatus: 'UNVERIFIED',
              discipline: 'Prime General Contractor',
            },
          },
          {
            role: 'STRUCTURAL_QA_QC_AUDITOR',
            roleTitle: 'Structural QA/QC Auditor',
            status: 'UNASSIGNED',
          },
        ]);
      }
    } catch {
      setError('Could not connect to project governance service.');
    } finally {
      setLoading(false);
    }
  }, [project?.id, project?.clientName, project?.contractorName, project?.ownerUserId, idToken]);

  useEffect(() => {
    fetchGovernance();
  }, [fetchGovernance]);

  const handleOpenInvite = (role: ProjectRole, title: string) => {
    setSelectedRoleForInvite({ role, title });
    setInviteModalOpen(true);
  };

  const handleRevoke = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to revoke this project governance appointment?')) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        fetchGovernance();
        onRefreshProject?.();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to revoke appointment.');
      }
    } catch {
      alert('Network error while revoking appointment.');
    }
  };

  return (
    <div className="bg-white dark:bg-[#08121e] border border-slate-200 dark:border-[#162a42] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#162a42]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Project Governance Team & Fiduciary Vacancies
            </h3>
            {project?.isDemo && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                DEMO SANDBOX
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Strict four-role accountability: Project authority requires an explicit appointment. Qualification alone is not authority.
          </p>
        </div>

        <button
          onClick={fetchGovernance}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#10243b] border border-slate-200 dark:border-[#18314e] transition"
          title="Refresh governance appointments"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4-Role Governance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {team.map((slot) => {
          const isVacant = slot.status === 'UNASSIGNED';
          const isInvited = slot.status === 'INVITED';
          const isActive = slot.status === 'ACTIVE';

          return (
            <div
              key={slot.role}
              className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                isVacant
                  ? 'bg-amber-500/5 dark:bg-amber-500/[0.03] border-dashed border-amber-500/30'
                  : isInvited
                    ? 'bg-sky-500/5 dark:bg-sky-500/[0.03] border-sky-500/30'
                    : 'bg-slate-50/70 dark:bg-[#0c1c2e]/70 border-slate-200 dark:border-[#172e48]'
              }`}
            >
              {/* Role Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Governance Seat
                  </span>
                  
                  {isVacant && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      VACANT
                    </span>
                  )}
                  {isInvited && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                      INVITED
                    </span>
                  )}
                  {isActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {slot.roleTitle}
                </div>

                {/* Status Specific Content */}
                {isVacant ? (
                  <div className="py-3 text-[11px] text-amber-700/80 dark:text-amber-300/80 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                      Governance Vacancy
                    </p>
                    <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Fiduciary actions for this trade cannot be executed until a qualified practitioner is appointed.
                    </p>
                  </div>
                ) : isInvited ? (
                  <div className="py-2 space-y-1.5 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {slot.appointment?.userName || slot.assignedUser?.name || 'Invited Candidate'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {slot.appointment?.userEmail || slot.assignedUser?.email}
                    </div>
                    <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending Candidate Acceptance
                    </div>
                  </div>
                ) : (
                  <div className="py-2 space-y-1.5 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {slot.assignedUser?.name || 'Appointed Practitioner'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {slot.assignedUser?.email}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono ${
                        slot.assignedUser?.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : slot.assignedUser?.verificationStatus === 'NOT_REQUIRED'
                            ? 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                      }`}>
                        {slot.assignedUser?.verificationStatus === 'VERIFIED'
                          ? 'VERIFIED CREDENTIAL'
                          : slot.assignedUser?.verificationStatus === 'NOT_REQUIRED'
                            ? 'OWNER ROLE'
                            : 'UNVERIFIED — PENDING AUDIT'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Controls for Owner */}
              {isOwnerView && slot.role !== 'OWNER_CLIENT' && (
                <div className="pt-3 border-t border-slate-200 dark:border-[#14263a] flex items-center justify-between">
                  {isVacant ? (
                    <button
                      onClick={() => handleOpenInvite(slot.role, slot.roleTitle)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Appoint {slot.roleTitle}</span>
                    </button>
                  ) : isInvited ? (
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">Invited</span>
                      {slot.appointment?.id && (
                        <button
                          onClick={() => handleRevoke(slot.appointment!.id)}
                          className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 hover:underline"
                          title="Revoke pending invitation"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Authority Active
                      </span>
                      {slot.appointment?.id && (
                        <button
                          onClick={() => handleRevoke(slot.appointment!.id)}
                          className="text-[10px] text-red-500 hover:text-red-700 dark:hover:text-red-300 transition"
                          title="Revoke appointment"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite Modal */}
      {selectedRoleForInvite && (
        <InviteProfessionalModal
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          projectId={project.id}
          projectName={project.name}
          role={selectedRoleForInvite.role}
          roleTitle={selectedRoleForInvite.title}
          onInvitationSent={fetchGovernance}
        />
      )}
    </div>
  );
};
