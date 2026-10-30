import React, { useState } from 'react';
import {
  Wrench,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  ArrowRight,
  Terminal,
  Cpu,
  Lock
} from 'lucide-react';
import { RepairOption, AgentStatus } from '../../shared/types.js';

interface RepairsViewProps {
  agentStatus: AgentStatus;
  onExecuteRepair: (repairId: string, consentGranted: boolean) => void;
  executing: boolean;
  lastRepairResult: any;
  language: 'ar' | 'en';
}

export const RepairsView: React.FC<RepairsViewProps> = ({
  agentStatus,
  onExecuteRepair,
  executing,
  lastRepairResult,
  language
}) => {
  const isAr = language === 'ar';
  const isOffline = agentStatus === 'OFFLINE';

  const [selectedRepair, setSelectedRepair] = useState<RepairOption | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const repairOptions: RepairOption[] = [
    {
      id: 'repair_flush_dns',
      name: isAr ? 'تفريغ وتجديد ذاكرة التخزين المؤقت للـ DNS' : 'Flush DNS Resolver Cache',
      description: isAr
        ? 'يمسح الإدخالات القديمة أو المعطوبة من مخزن DNS المحلي ويعيد تسجيل أسماء النطاقات.'
        : 'Clears stale or corrupted IP-to-domain mappings in the Windows DNS cache.',
      risk: 'none',
      requiresAdmin: false,
      requiresRestart: false,
      expectedOutcome: isAr ? 'إعادة بناء ذاكرة DNS النظيفة وحل مشاكل الوصول للمواقع' : 'Rebuilt DNS cache, fixing host unreachable issues',
      rollbackSupported: true
    },
    {
      id: 'repair_release_renew_dhcp',
      name: isAr ? 'تحرير وتجديد عنوان IP من خادم DHCP' : 'Release & Renew DHCP IP Lease',
      description: isAr
        ? 'يطلب تأجير عنوان IPv4 جديد من موجه الشبكة لحل مشكلات التعارض أو عناوين APIPA 169.254.x.x.'
        : 'Requests fresh IPv4 lease from gateway to resolve IP conflicts or APIPA 169.254.x.x errors.',
      risk: 'low',
      requiresAdmin: false,
      requiresRestart: false,
      expectedOutcome: isAr ? 'الحصول على عنوان IP صالح وبوابة افتراضية متصلة' : 'Acquire valid non-APIPA IP and gateway route',
      rollbackSupported: true
    },
    {
      id: 'repair_restart_wlansvc',
      name: isAr ? 'إعادة تشغيل خدمة WLAN AutoConfig' : 'Restart Windows WLAN AutoConfig (WlanSvc)',
      description: isAr
        ? 'يعيد تشغيل خدمة إدارة شبكات الواي فاي الأساسية في ويندوز في حال تجمد البحث عن الشبكات.'
        : 'Restarts the Windows wireless management service if BSSID scanning hangs.',
      risk: 'medium',
      requiresAdmin: true,
      requiresRestart: false,
      expectedOutcome: isAr ? 'استعادة قدرة فحص الشبكات اللاسلكية والاتصال السلس' : 'Restored Wi-Fi discovery and connection stack',
      rollbackSupported: false
    },
    {
      id: 'repair_reset_winsock',
      name: isAr ? 'إعادة ضبط كتالوج Winsock ومكدس TCP/IP' : 'Reset Winsock Catalog & TCP/IP Stack',
      description: isAr
        ? 'إصلاح عميق لطبقات المقابس ومكدس الشبكة. يتطلب صلاحيات المسؤول وإعادة تشغيل الجهاز.'
        : 'Deep recovery for corrupted socket layers. Requires Administrator and system restart.',
      risk: 'high',
      requiresAdmin: true,
      requiresRestart: true,
      expectedOutcome: isAr ? 'إصلاح التلف الجذري في مكدس الشبكة (يتطلب إعادة تشغيل ويندوز)' : 'Clean Winsock catalog (reboot required for full verification)',
      rollbackSupported: false
    }
  ];

  const handleOpenConfirm = (opt: RepairOption) => {
    setSelectedRepair(opt);
    setConsentChecked(false);
    setConfirmModalOpen(true);
  };

  const handleConfirmExecute = () => {
    if (!selectedRepair || !consentChecked) return;
    onExecuteRepair(selectedRepair.id, true);
    setConfirmModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white">
          {isAr ? 'محرك الإصلاح المحلي ذو المراحل الثماني (8-Stage Safe Repair)' : '8-Stage Safe Remediation Engine'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isAr
            ? 'لا يتم تنفيذ أي تعديل على نظامك دون موافقة صريحة، والتقاط لقطة قبل وبعد، والتحقق الفعلي من النتيجة.'
            : 'Enforces pre/post snapshots, explicit user consent, verified effect checks, and immutable audit logs.'}
        </p>
      </div>

      {/* 8-Stage Architecture Flow Banner */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
          {isAr ? 'مراحل دورة حياة الإصلاح المعتمدة (8-Stage Lifecycle):' : 'Mandatory 8-Stage Lifecycle:'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-[11px] text-center font-semibold">
          {[
            { num: '1', title: isAr ? 'لقطة قبلية' : 'Before Snapshot' },
            { num: '2', title: isAr ? 'التحقق المسبق' : 'Validation' },
            { num: '3', title: isAr ? 'موافقة المستخدم' : 'User Consent' },
            { num: '4', title: isAr ? 'التنفيذ الآمن' : 'Safe Execute' },
            { num: '5', title: isAr ? 'لقطة بعدية' : 'After Snapshot' },
            { num: '6', title: isAr ? 'التحقق من الأثر' : 'Verify Effect' },
            { num: '7', title: isAr ? 'التسجيل في السجل' : 'Audit Log' },
            { num: '8', title: isAr ? 'التراجع عند الفشل' : 'Rollback' }
          ].map((stage) => (
            <div key={stage.num} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto text-[10px] font-bold">
                {stage.num}
              </span>
              <span className="text-slate-300 block">{stage.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Repair Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {repairOptions.map((opt) => {
          const isHighRisk = opt.risk === 'high';
          const isMedRisk = opt.risk === 'medium';

          return (
            <div
              key={opt.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-white">{opt.name}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                    isHighRisk ? 'bg-red-950 text-red-300 border border-red-500/30' :
                    isMedRisk ? 'bg-amber-950 text-amber-300 border border-amber-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {opt.risk} risk
                  </span>
                </div>

                <p className="text-xs text-slate-400">{opt.description}</p>

                <div className="p-2.5 rounded-lg bg-slate-950 text-[11px] text-slate-400 space-y-1">
                  <div>
                    <span className="text-slate-500">{isAr ? 'الأثر المتوقع: ' : 'Expected Effect: '}</span>
                    <span className="text-slate-300">{opt.expectedOutcome}</span>
                  </div>
                  {opt.requiresRestart && (
                    <div className="text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{isAr ? 'يتطلب إعادة تشغيل الجهاز لاكتمال التحقق' : 'Requires Windows reboot for full verification'}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleOpenConfirm(opt)}
                disabled={executing || isOffline}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition ${
                  isOffline
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{isAr ? 'بدء إجراء الإصلاح' : 'Initiate Repair'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Last Result Card */}
      {lastRepairResult && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'آخر نتيجة إصلاح موثقة:' : 'Last Verified Repair Result:'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono-code space-y-1 text-slate-300">
            <div>Status: <span className="text-emerald-400 font-bold">{lastRepairResult.status}</span></div>
            <div>Verified: {String(lastRepairResult.verified)}</div>
            <div>Summary: {lastRepairResult.evidence?.summary || lastRepairResult.technicalDetailsRedacted}</div>
          </div>
        </div>
      )}

      {/* Explicit Consent & Confirmation Modal */}
      {confirmModalOpen && selectedRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'تأكيد موافقة المستخدم الصريحة (User Consent)' : 'Explicit User Consent Required'}
                </h3>
                <p className="text-xs text-slate-400">{selectedRepair.name}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                {isAr
                  ? 'بموجب سياسة الأمان المقيدة بالبراهين، لا يقوم VNC Local Agent بإجراء أي تغيير في إعدادات الشبكة دون موافقتك الواعية.'
                  : 'In accordance with our zero-fake-operation policy, the agent will never alter network stack configuration without explicit consent.'}
              </p>
              <div className="text-slate-400 text-[11px]">
                <span>{isAr ? 'العملية المحددة: ' : 'Target Action: '}</span>
                <span className="font-mono-code text-cyan-300">{selectedRepair.id}</span>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0"
              />
              <span className="text-xs text-slate-200">
                {isAr
                  ? 'أوافق صراحة على قيام الوكيل بتنفيذ هذا الإصلاح وتوثيقه في سجل العمليات غير القابل للتعديل.'
                  : 'I explicitly authorize the VNC Agent to execute this remediation and record it in the audit log.'}
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!consentChecked || executing}
                onClick={handleConfirmExecute}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold shadow-md transition"
              >
                {executing ? (isAr ? 'جارِ التنفيذ...' : 'Executing...') : (isAr ? 'تأكيد وتنفيذ الإصلاح' : 'Confirm & Execute')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
