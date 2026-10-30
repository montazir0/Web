import React from 'react';
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Bot,
  Terminal,
  Server,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DiagnosticCheck, AgentStatus } from '../../shared/types.js';

interface DiagnosticsViewProps {
  checks: DiagnosticCheck[];
  onRunDiagnostics: () => void;
  onAskAi: (check: DiagnosticCheck) => void;
  loading: boolean;
  agentStatus: AgentStatus;
  language: 'ar' | 'en';
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  checks,
  onRunDiagnostics,
  onAskAi,
  loading,
  agentStatus,
  language
}) => {
  const isAr = language === 'ar';
  const isOffline = agentStatus === 'OFFLINE';

  const passCount = checks.filter(c => c.status === 'PASS').length;
  const failCount = checks.filter(c => c.status === 'FAIL').length;
  const warnCount = checks.filter(c => c.status === 'WARN').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">
            {isAr ? 'فحوصات التشخيص الشبكي المعمقة' : 'Deep Network Diagnostics'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAr
              ? 'اختبارات مبنية على أدلة رقمية حقيقية (Evidence-Based). لا نجاح بلا دليل، وفشل الاتصال يظهر السبب التقني الصادق.'
              : 'Evidence-based network diagnostic suite. Real Windows adapters, DNS, WlanSvc, and Gateway checks.'}
          </p>
        </div>

        <button
          onClick={onRunDiagnostics}
          disabled={loading || isOffline}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-lg transition ${
            isOffline
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? (isAr ? 'جارِ تشغيل الفحوصات...' : 'Executing...') : (isAr ? 'إعادة الفحص الشامل' : 'Run Full Diagnostics')}</span>
        </button>
      </div>

      {/* Summary Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-[11px] text-slate-400 block mb-1">{isAr ? 'إجمالي الفحوصات' : 'Total Checks'}</span>
          <span className="text-2xl font-extrabold text-white">{checks.length}</span>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-[11px] text-emerald-400 block mb-1">{isAr ? 'ناجحة (PASS)' : 'Passed'}</span>
          <span className="text-2xl font-extrabold text-emerald-400">{passCount}</span>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-[11px] text-red-400 block mb-1">{isAr ? 'فشلت (FAIL)' : 'Failed'}</span>
          <span className="text-2xl font-extrabold text-red-400">{failCount}</span>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-[11px] text-amber-400 block mb-1">{isAr ? 'تنبيهات (WARN)' : 'Warnings'}</span>
          <span className="text-2xl font-extrabold text-amber-400">{warnCount}</span>
        </div>
      </div>

      {/* Diagnostics List */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white mb-2">
          {isAr ? 'تفاصيل الأدلة ونتائج الفحص الفردي:' : 'Diagnostic Results & Verification Evidence:'}
        </h3>

        {checks.map((check) => {
          const isPass = check.status === 'PASS';
          const isFail = check.status === 'FAIL';
          const isWarn = check.status === 'WARN';

          return (
            <div
              key={check.id}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  {isFail && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                  <span className="text-xs font-bold text-white">{check.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                    isPass ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                    isFail ? 'bg-red-950 text-red-300 border border-red-500/30' :
                    'bg-amber-950 text-amber-300 border border-amber-500/30'
                  }`}>
                    {check.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono-code uppercase">[{check.category}]</span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono-code pl-6">
                  {check.evidence}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => onAskAi(check)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                >
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isAr ? 'شرح بالذكاء الاصطناعي' : 'Explain with AI'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
