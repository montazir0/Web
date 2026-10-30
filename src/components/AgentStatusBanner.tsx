import React from 'react';
import { ShieldCheck, AlertTriangle, Radio, WifiOff, Terminal, Download, ArrowUpRight } from 'lucide-react';
import { AgentInfo, AgentStatus } from '../shared/types.js';

interface AgentStatusBannerProps {
  status: AgentStatus;
  agent: AgentInfo | null;
  language: 'ar' | 'en';
  onOpenPairModal: () => void;
  onNavigateToHub: () => void;
}

export const AgentStatusBanner: React.FC<AgentStatusBannerProps> = ({
  status,
  agent,
  language,
  onOpenPairModal,
  onNavigateToHub
}) => {
  const isAr = language === 'ar';

  if (status === 'REAL_CONNECTED' && agent) {
    return (
      <div className="bg-emerald-950/40 border-b border-emerald-500/30 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-300">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-emerald-200">
              {isAr ? 'Real Agent متصل وموثق:' : 'Real Agent Connected & Verified:'}
            </span>
            <span className="font-mono-code bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-100">
              {agent.hostname} ({agent.agentId})
            </span>
            <span className="text-emerald-400/80 hidden sm:inline">
              | {agent.osVersion} | v{agent.agentVersion} | {isAr ? 'اتصال صادر فقط (Zero Open Ports)' : 'Outbound Only'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-mono-code">
            <span>{isAr ? 'بصمة المفتاح:' : 'Key Fingerprint:'} {agent.keyFingerprint.substring(0, 17)}...</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'MOCK_ACTIVE') {
    return (
      <div className="bg-amber-950/40 border-b border-amber-500/40 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <Terminal className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="font-bold text-amber-200">
              {isAr ? 'تنبيه: وضع المحاكاة نشط (Mock Agent Active)' : 'NOTICE: Simulation Mode Active (Mock Agent)'}
            </span>
            <span className="text-amber-400/90">
              {isAr
                ? 'جميع البيانات المعروضة تجريبية (Synthetic Data) وموسومة source: "demo". لا تمثل قراءات أجهزة فيزيائية حقيقية.'
                : 'All displayed metrics are synthetic (source: "demo") and never represent real physical network measurements.'}
            </span>
          </div>
          <button
            onClick={onOpenPairModal}
            className="flex items-center gap-1 text-[11px] font-semibold text-amber-200 hover:text-white underline underline-offset-2"
          >
            <span>{isAr ? 'ربط Local Agent حقيقي' : 'Connect Real Agent'}</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  if (status === 'OFFLINE') {
    return (
      <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="font-bold text-slate-100">
              {isAr ? 'الـ Local Agent غير متصل (Agent Offline)' : 'Local Agent Offline'}
            </span>
            <span className="text-slate-400">
              {isAr
                ? 'العمليات المحلية على جهازك (فحص الواي فاي، التشخيص، محرك الإصلاح) معطلة بأمان لعدم وجود Agent مقترن.'
                : 'Hardware commands, Wi-Fi scans, and diagnostics are safely disabled until an agent is paired.'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToHub}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition"
            >
              <Download className="w-3 h-3" />
              <span>{isAr ? 'دليل التثبيت لويندوز' : 'Install Guide'}</span>
            </button>
            <button
              onClick={onOpenPairModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-medium shadow-sm transition"
            >
              <Radio className="w-3 h-3" />
              <span>{isAr ? 'توليد كود الاقتران' : 'Pair Agent'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
