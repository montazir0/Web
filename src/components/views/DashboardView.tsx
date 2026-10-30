import React from 'react';
import {
  ShieldCheck,
  Activity,
  Wifi,
  Server,
  Wrench,
  AlertTriangle,
  Radio,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Terminal,
  Cpu
} from 'lucide-react';
import { AgentInfo, AgentStatus, DeviceRecord, JobRecord, AuditEventRecord } from '../../shared/types.js';

interface DashboardViewProps {
  activeAgent: AgentInfo | null;
  agentStatus: AgentStatus;
  devices: DeviceRecord[];
  recentJobs: JobRecord[];
  auditLogs: AuditEventRecord[];
  language: 'ar' | 'en';
  onNavigate: (tab: string) => void;
  onOpenPairModal: () => void;
  onRunQuickDiag: () => void;
  diagRunning: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeAgent,
  agentStatus,
  devices,
  recentJobs,
  auditLogs,
  language,
  onNavigate,
  onOpenPairModal,
  onRunQuickDiag,
  diagRunning
}) => {
  const isAr = language === 'ar';

  const reachableDevicesCount = devices.filter(d => d.reachability === 'reachable').length;

  return (
    <div className="space-y-6">
      {/* Hero Welcome / NOC Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono-code">
                {isAr ? 'التحكم الشبكي المقيد بالبراهين' : 'Evidence-Bound NOC'}
              </span>
              <span className="text-xs text-slate-400">Zero Fake Telemetry • Fail Closed</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              {isAr ? 'مركز التحكم بشبكة Vortex Network Center' : 'Vortex Network Operations Dashboard'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {isAr
                ? 'إدارة محولات الشبكة وفحص الواي فاي والتشخيص المتقدم عبر VNC Windows Local Agent باتصال Outbound آمن دون فتح منافذ واردة.'
                : 'Direct Windows adapter management, Wi-Fi scanning, and safe remediation via VNC Windows Local Agent with outbound HTTPS only.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRunQuickDiag}
              disabled={diagRunning || agentStatus === 'OFFLINE'}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-lg transition ${
                agentStatus === 'OFFLINE'
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
              }`}
            >
              <Activity className={`w-4 h-4 ${diagRunning ? 'animate-spin' : ''}`} />
              <span>{diagRunning ? (isAr ? 'جارِ الفحص...' : 'Testing...') : (isAr ? 'تشغيل فحص سريع' : 'Quick Diagnostics')}</span>
            </button>
            {agentStatus === 'OFFLINE' && (
              <button
                onClick={onOpenPairModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition"
              >
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>{isAr ? 'ربط Agent' : 'Pair Agent'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agent State Card */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{isAr ? 'حالة الـ Local Agent' : 'Local Agent State'}</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-white">
              {agentStatus === 'REAL_CONNECTED'
                ? (isAr ? 'متصل حقيقي' : 'Real Connected')
                : agentStatus === 'MOCK_ACTIVE'
                ? (isAr ? 'محاكاة نشطة' : 'Mock Active')
                : (isAr ? 'غير متصل' : 'Offline')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {activeAgent ? `${activeAgent.hostname} (${activeAgent.agentVersion})` : (isAr ? 'يتطلب ربط جهاز ويندوز' : 'Requires paired PC')}
          </p>
        </div>

        {/* Devices Reachability Card */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{isAr ? 'الأجهزة النشطة' : 'Reachable Devices'}</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-white">{reachableDevicesCount}</span>
            <span className="text-xs text-slate-400">/ {devices.length} {isAr ? 'أجهزة معرفة' : 'defined'}</span>
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-1">
            {isAr ? 'استجابة Ping تؤكد الوصول فقط' : 'Ping proves reachability only'}
          </p>
        </div>

        {/* Wi-Fi & Adapter Card */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{isAr ? 'محول Wi-Fi المعتمد' : 'Wireless Interface'}</span>
            <Wifi className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-white">
              {agentStatus !== 'OFFLINE' ? 'Wi-Fi 6 (802.11ax)' : (isAr ? 'غير متاح' : 'N/A')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {agentStatus !== 'OFFLINE' ? 'WLAN AutoConfig Active' : (isAr ? 'ينتظر استعلام الـ Agent' : 'Waiting for Agent')}
          </p>
        </div>

        {/* Security & Audit Card */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{isAr ? 'حماية الأسرار' : 'Secrets Isolation'}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-300">DPAPI + Redaction</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'كلمات المرور لا تُرفع للسحابة' : 'Zero passwords in cloud'}
          </p>
        </div>
      </div>

      {/* Main Grid: Devices Preview & Live Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Discovered Devices Card */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'حالة الأجهزة على الشبكة (Device Reachability)' : 'Discovered Devices'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('devices')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {devices.map((device) => (
              <div
                key={device.deviceId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    device.reachability === 'reachable' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {device.type === 'windows_host' && <Cpu className="w-4 h-4" />}
                    {device.type === 'router' && <Server className="w-4 h-4" />}
                    {device.type === 'nanostation' && <Radio className="w-4 h-4" />}
                    {device.type === 'ont' && <Activity className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{device.hostAlias}</h4>
                    <p className="text-[11px] text-slate-400 font-mono-code">
                      {device.ipAddress} • {device.vendor} ({device.model})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    device.reachability === 'reachable'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-950 text-red-300 border border-red-500/30'
                  }`}>
                    {device.reachability === 'reachable' ? (isAr ? 'مستجيب (Ping OK)' : 'Ping OK') : (isAr ? 'غير متاح' : 'Unreachable')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {device.verificationStatus === 'verified'
                      ? (isAr ? 'موثق' : 'Verified')
                      : (isAr ? 'غير مصادق عليه' : 'Unverified')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-slate-950/50 border border-slate-800/60 p-3 text-xs text-slate-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">{isAr ? 'قاعدة الصدق التقني:' : 'Truth Rule:'} </span>
              {isAr
                ? 'استجابة Ping لعنوان IP تثبت إمكانية الوصول فقط، ولا تدعي معرفة قيم RF أو CCQ أو قوة الإشارة الضوئية (Optical Rx) أو حالة O5 دون جلسة تشغيل موثقة.'
                : 'Ping reply proves reachability only. Optical Rx, RF RSSI, and O5 status are strictly null until authenticated provider drivers are attached.'}
            </div>
          </div>
        </div>

        {/* Right Column: Live Audit Feed */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'سجل العمليات الموثق' : 'Audit Feed'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>{isAr ? 'السجل الكامل' : 'All Events'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.eventId}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{log.action}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                    log.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-950/50' : 'text-amber-400 bg-amber-950/50'
                  }`}>
                    {log.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{log.redactedSummary}</p>
                <div className="text-[10px] text-slate-500 font-mono-code flex items-center justify-between pt-1">
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span>{log.actor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
