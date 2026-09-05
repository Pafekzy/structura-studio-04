import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  MessageSquare,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Info,
  FileCheck,
  HelpCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { ChannelType, DirectLineMessageType, ProjectConversation, ProjectMessage, ProjectRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface DirectLinePanelProps {
  projectId: string;
  isDemo?: boolean;
}

const CHANNEL_LABELS: Record<ChannelType, { title: string; subtitle: string }> = {
  OWNER_DIRECTOR: {
    title: 'Owner ↔ Senior Project Director',
    subtitle: 'Fiduciary directives, budget approvals & executive milestone reporting',
  },
  OWNER_QAQC: {
    title: 'Owner ↔ Structural QA/QC Auditor',
    subtitle: 'Independent forensic structural audits, code compliance & peer review',
  },
  DIRECTOR_CONTRACTOR: {
    title: 'Director ↔ General Contractor',
    subtitle: 'Site execution, submittals, construction sequencing & RFI coordination',
  },
};

const MESSAGE_TYPE_STYLES: Record<DirectLineMessageType, { bg: string; text: string; icon: React.ReactNode }> = {
  MESSAGE: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', icon: <MessageSquare className="w-3 h-3" /> },
  INFORMATION: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', icon: <Info className="w-3 h-3" /> },
  INSTRUCTION: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-800 dark:text-amber-300', icon: <FileCheck className="w-3 h-3" /> },
  CLARIFICATION_REQUEST: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300', icon: <HelpCircle className="w-3 h-3" /> },
  DECISION_REQUEST: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', icon: <CheckCircle2 className="w-3 h-3" /> },
  APPROVAL_REQUEST: { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-300', icon: <Shield className="w-3 h-3" /> },
  ESCALATION: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-300', icon: <AlertTriangle className="w-3 h-3" /> },
  ACKNOWLEDGEMENT: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', icon: <CheckCircle2 className="w-3 h-3" /> },
};

export const DirectLinePanel: React.FC<DirectLinePanelProps> = ({ projectId, isDemo }) => {
  const { idToken, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);
  const [allowedChannels, setAllowedChannels] = useState<ChannelType[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChannelType | null>(null);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Message compose form state
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [messageType, setMessageType] = useState<DirectLineMessageType>('MESSAGE');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch authorized channels
  const fetchChannels = useCallback(async () => {
    if (!idToken) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/projects/${projectId}/direct-line/channels`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load direct line channels');
      }
      const data = await res.json();
      setUserRole(data.userRole);
      setAllowedChannels(data.allowedChannels);
      if (data.allowedChannels.length > 0 && !activeChannel) {
        setActiveChannel(data.allowedChannels[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to authorize direct line channels');
    } finally {
      setLoading(false);
    }
  }, [idToken, projectId, activeChannel]);

  // Fetch messages for active channel
  const fetchMessages = useCallback(async (channel: ChannelType) => {
    if (!idToken) return;
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/projects/${projectId}/direct-line/channels/${channel}/messages`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load messages');
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error('[DirectLinePanel] Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [idToken, projectId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel);
    }
  }, [activeChannel, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeChannel || !idToken || sending) return;

    try {
      setSending(true);
      const res = await fetch(`/api/projects/${projectId}/direct-line/channels/${activeChannel}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          messageType,
          subject: subject.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const newMsg = await res.json();
      setMessages(prev => [...prev, newMsg]);
      setContent('');
      setSubject('');
      setMessageType('MESSAGE');
    } catch (err: any) {
      alert(`Send Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
        <span className="text-xs">Resolving bilateral communication authority...</span>
      </div>
    );
  }

  if (error || allowedChannels.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1624] border border-slate-200 dark:border-[#14263a] text-center max-w-lg mx-auto my-6 space-y-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Bilateral Direct Line Restricted</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {error || 'Your authenticated profile does not hold an active appointment on this project. Under Rule 10, communication is strictly restricted to designated bilateral participants.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Channel Selector Sidebar */}
      <div className="lg:col-span-4 space-y-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1624] border border-slate-200 dark:border-[#14263a] space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Authorized Channels
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
              {allowedChannels.length} Active
            </span>
          </div>

          <div className="space-y-2">
            {allowedChannels.map((channel) => {
              const meta = CHANNEL_LABELS[channel];
              const isSelected = activeChannel === channel;
              return (
                <button
                  key={channel}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#08101a] border-slate-200 dark:border-[#102033] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {meta.title}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {meta.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-[#14263a] text-[10px] text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Server-governed bilateral channel. No broad unmonitored chat.</span>
          </div>
        </div>
      </div>

      {/* Message Stream & Composer */}
      <div className="lg:col-span-8 flex flex-col rounded-2xl bg-white dark:bg-[#0c1624] border border-slate-200 dark:border-[#14263a] overflow-hidden shadow-xs min-h-[550px]">
        {/* Channel Header */}
        {activeChannel && (
          <div className="p-4 border-b border-slate-200 dark:border-[#14263a] bg-slate-50/75 dark:bg-[#08101a]/75 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{CHANNEL_LABELS[activeChannel].title}</span>
                {isDemo && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    DEMO
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {CHANNEL_LABELS[activeChannel].subtitle}
              </p>
            </div>

            <button
              onClick={() => fetchMessages(activeChannel)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Refresh messages"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[420px] min-h-[300px]">
          {loadingMessages ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500 mr-2" />
              Loading communication records...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12 space-y-2">
              <MessageSquare className="w-8 h-8 opacity-30 text-amber-500" />
              <p>No messages recorded in this bilateral channel yet.</p>
              <span className="text-[10px] text-slate-500">Initiate formal project communication below.</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.senderUserId === user?.uid;
              const typeStyle = MESSAGE_TYPE_STYLES[msg.messageType] || MESSAGE_TYPE_STYLES.MESSAGE;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 space-y-2 ${
                    isCurrentUser
                      ? 'bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-slate-900 dark:text-slate-100 rounded-br-none'
                      : 'bg-slate-100 dark:bg-[#0e1c2d] border border-slate-200 dark:border-[#18314e] text-slate-900 dark:text-slate-100 rounded-bl-none'
                  }`}>
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-3 text-[11px] pb-1 border-b border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {msg.senderName}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">
                          {msg.senderRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Type Tag & Subject */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                        {typeStyle.icon}
                        {msg.messageType.replace('_', ' ')}
                      </span>
                      {msg.subject && (
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {msg.subject}
                        </span>
                      )}
                    </div>

                    {/* Message Body */}
                    <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Compose Form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-[#14263a] bg-slate-50/50 dark:bg-[#08101a]/50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-1">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                Directive Classification
              </label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as DirectLineMessageType)}
                className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-[#18314e] bg-white dark:bg-[#0c1624] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="MESSAGE">General Message</option>
                <option value="INFORMATION">Information / Notice</option>
                <option value="INSTRUCTION">Site Instruction</option>
                <option value="CLARIFICATION_REQUEST">Clarification Request</option>
                <option value="DECISION_REQUEST">Decision Request</option>
                <option value="APPROVAL_REQUEST">Approval Request</option>
                <option value="ESCALATION">Escalation Notice</option>
                <option value="ACKNOWLEDGEMENT">Acknowledgement</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                Subject Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Level 2 Pour Approval, RFI-002 Cross-Reference..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={150}
                className="w-full text-xs py-1.5 px-3 rounded-lg border border-slate-300 dark:border-[#18314e] bg-white dark:bg-[#0c1624] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <textarea
              rows={3}
              placeholder="Draft formal operational communication... (server-audited with immutable timestamp)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-[#18314e] bg-white dark:bg-[#0c1624] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Transmitted under active role: <strong>{userRole}</strong></span>
            </span>

            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="flex items-center gap-1.5 py-1.5 px-4 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition disabled:opacity-50 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Transmitting...' : 'Send Directive'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
