import React from 'react';
import {
  Radio,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Key,
  Shield,
  Clock,
  Terminal,
  Server,
  Layers,
  Lock
} from 'lucide-react';
import { AgentInfo, AgentStatus } from '../../shared/types.js';

interface AgentsViewProps {
  agents: AgentInfo[];
  agentStatus: AgentStatus;
  mockAgentEnabled: boolean;
  onOpenPairModal: () => void;
  onRevokeAgent: (agentId: string) => void;
  language: 'ar' | 'en';
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  agents,
  agentStatus,
  mockAgentEnabled,
  onOpenPairModal,
  onRevokeAgent,
  language
}) => {
  const isAr = language === 'ar';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">
            {isAr ? 'إدارة الـ Local Agents وعقود الاقتران' : 'Local Agents & Pairing Contracts'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAr
              ? 'الأجهزة المحلية المقترنة بحسابك. جميع الاتصالات Outbound HTTPS صادر حصرياً دون فتح منافذ واردة.'
              : 'Paired Windows client agents communicating outbound with cryptographic public-key signatures.'}
          </p>
        </div>

        <button
          onClick={onOpenPairModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition self-start sm:self-auto"
        >
          <Radio className="w-4 h-4" />
          <span>{isAr ? 'ربط Agent جديد (Pair New Agent)' : 'Pair New Agent'}</span>
        </button>
      </div>

      {/* Agents List */}
      {agents.length === 0 ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Radio className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white mb-1">
              {isAr ? 'لا يوجد Local Agent مقترن حالياً' : 'No Local Agents Paired'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'لإدارة شبكات الواي فاي ومحولات الويندوز محلياً، قم بتشغيل سكريبت التثبيت على جهاز ويندوز وأدخل رمز الاقتران.'
                : 'To manage your Windows network and Wi-Fi adapters locally, run the installer script on your Windows machine and enter the pairing code.'}
            </p>
          </div>
          <button
            onClick={onOpenPairModal}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition"
          >
            {isAr ? 'إنشاء رمز الاقتران الآن' : 'Generate Pairing Code'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {agents.map((agent) => {
            const isMock = agent.isMock;
            return (
              <div
                key={agent.agentId}
                className={`rounded-2xl border p-5 transition ${
                  isMock
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isMock ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{agent.hostname}</h3>
                        {isMock ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {isAr ? 'محاكاة (Mock)' : 'Simulation (Mock)'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {isAr ? 'Real Agent حقيقي' : 'Real Agent'}
                          </span>
                        )}
                        <span className="text-[10px] font-mono-code text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {agent.agentId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono-code">
                        {agent.osVersion} • v{agent.agentVersion} • {isAr ? 'صادر فقط (No Listening Ports)' : 'Outbound Only'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isMock && (
                      <button
                        onClick={() => onRevokeAgent(agent.agentId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-medium transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إلغاء الاقتران (Revoke)' : 'Revoke'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 text-xs">
                  {/* Public Key Fingerprint */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                      <Key className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isAr ? 'بصمة المفتاح العام (ECDSA P-256)' : 'Public Key Fingerprint'}</span>
                    </div>
                    <p className="font-mono-code text-[11px] text-cyan-300 break-all">
                      {agent.keyFingerprint}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {isAr ? 'المفتاح الخاص مشفر محلياً بـ Windows DPAPI' : 'Private key encrypted via DPAPI locally'}
                    </p>
                  </div>

                  {/* Heartbeat & Timing */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>{isAr ? 'آخر نبضة اتصال (Last Heartbeat)' : 'Last Heartbeat'}</span>
                    </div>
                    <p className="text-slate-200">
                      {new Date(agent.lastHeartbeat).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-400/90 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isAr ? 'نبضات دورية كل 15 ثانية' : 'Periodic 15s interval'}</span>
                    </p>
                  </div>

                  {/* Security Architecture */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isAr ? 'هندسة الأمان (Security Model)' : 'Security Model'}</span>
                    </div>
                    <p className="text-slate-300 font-medium">
                      Zero Inbound Open Ports
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isAr ? 'منع إعادة التشغيل (Nonce + Replay Protection)' : 'Nonce + Replay Protection active'}
                    </p>
                  </div>
                </div>

                {/* Capabilities List */}
                <div className="mt-4 pt-3 border-t border-slate-800/60">
                  <span className="text-[11px] font-semibold text-slate-400 mb-2 block">
                    {isAr ? 'القدرات المعلنة والمفعلة على الويندوز (Capabilities):' : 'Declared Host Capabilities:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities.map((cap) => (
                      <span
                        key={cap.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                        title={cap.description}
                      >
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                        <span>{cap.name}</span>
                        {cap.requiresAdmin && (
                          <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Admin
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
