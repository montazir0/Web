import React from 'react';
import {
  Server,
  Radio,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Lock,
  Wifi
} from 'lucide-react';
import { DeviceRecord } from '../../shared/types.js';

interface DevicesViewProps {
  devices: DeviceRecord[];
  language: 'ar' | 'en';
}

export const DevicesView: React.FC<DevicesViewProps> = ({ devices, language }) => {
  const isAr = language === 'ar';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white">
          {isAr ? 'الأجهزة ومحددات الشبكة (Devices & Hardware Registry)' : 'Network Hardware Registry'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isAr
            ? 'الأجهزة المحلية والافتراضية. يخضع كل جهاز لمبدأ الصدق التقني: فحص Ping يثبت الوصول فقط، والقياسات العميقة تتطلب Provider موثقاً.'
            : 'Hardware registry governed by strict truth rules. Ping proves reachability only; RF and optical metrics require authenticated drivers.'}
        </p>
      </div>

      {/* Truth Rule Callout */}
      <div className="rounded-xl bg-slate-900 border border-cyan-500/30 p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-white">
            {isAr ? 'قاعدة الصدق التقني وحظر التعديلات غير المختبرة:' : 'Fail-Closed Technical Truth & Safety Rule:'}
          </h4>
          <p className="text-slate-300">
            {isAr
              ? 'السحابة (Cloud Run) لا تتصل مباشرة بعناوين الشبكة المحلية الخاصة (192.168.x.x). جميع الفحوصات تتم عبر Local Agent. عمليات تعديل الراوتر أو NanoStation أو ONT تظل NOT_IMPLEMENTED ومغلقة حتى توفر أجهزة حقيقية واختبارات قبول معتمدة.'
              : 'Cloud Run does not connect directly to private LAN IPs. All operations route through the Local Agent. Router, NanoStation, and ONT write/reboot operations remain NOT_IMPLEMENTED until physical device testing is validated.'}
          </p>
        </div>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((device) => {
          const isReachable = device.reachability === 'reachable';

          return (
            <div
              key={device.deviceId}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isReachable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {device.type === 'windows_host' && <Cpu className="w-5 h-5" />}
                    {device.type === 'router' && <Server className="w-5 h-5" />}
                    {device.type === 'nanostation' && <Radio className="w-5 h-5" />}
                    {device.type === 'ont' && <Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{device.hostAlias}</h3>
                    <p className="text-xs text-slate-400 font-mono-code">
                      {device.vendor} • {device.model}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                    isReachable
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-red-950 text-red-300 border border-red-500/40'
                  }`}>
                    {isReachable ? (isAr ? 'مستجيب (Ping OK)' : 'Ping Reachable') : (isAr ? 'غير متاح' : 'Unreachable')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono-code">
                    {device.macAddress || 'MAC: Auto'}
                  </span>
                </div>
              </div>

              {/* Specs & IP */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">{isAr ? 'عنوان IP المحلي' : 'Local IP Address'}</span>
                  <span className="font-mono-code font-bold text-slate-200">{device.ipAddress}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">{isAr ? 'حالة التوثيق (Verification)' : 'Verification Status'}</span>
                  <span className={`font-semibold ${device.verificationStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {device.verificationStatus === 'verified' ? (isAr ? 'موثق حقيقي' : 'Verified') : (isAr ? 'قيد التحقق' : 'Read-only / Unverified')}
                  </span>
                </div>
              </div>

              {/* Deep Telemetry Status Notice */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>{isAr ? 'القياسات العميقة (Deep Telemetry):' : 'Deep Telemetry Status:'}</span>
                  {device.type === 'windows_host' ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {isAr ? 'متاحة وموثقة من Agent' : 'Available & Verified'}
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {isAr ? 'null (تتطلب Provider مختبر)' : 'null (Requires Provider)'}
                    </span>
                  )}
                </div>

                {device.type === 'nanostation' && (
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? 'قيم RF (RSSI / CCQ / AirMAX) محددة بـ null. استجابة Ping لا تثبت جودة الإشارة اللاسلكية.'
                      : 'RF metrics (RSSI / CCQ / AirMAX) set to null. Ping does not prove RF signal quality.'}
                  </p>
                )}

                {device.type === 'ont' && (
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? 'قيم Optical Rx/Tx ودرجة الحرارة وحالة O5/LOS محددة بـ null. حظر تام لتعديل حقول OLT أو PLOAM.'
                      : 'Optical power, Temperature, and O5/LOS set to null. OLT and PLOAM modifications are strictly prohibited.'}
                  </p>
                )}

                {device.type === 'router' && (
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? 'الراوتر في وضع Read-only. أزرار Apply وReboot محجوبة وتُرجع NOT_IMPLEMENTED لضمان سلامة الاتصال.'
                      : 'Router is read-only. Apply and reboot actions are safely blocked and return NOT_IMPLEMENTED.'}
                  </p>
                )}

                {device.type === 'windows_host' && (
                  <p className="text-[11px] text-emerald-400/90">
                    {isAr
                      ? 'محولات الشبكة، خدمة WlanSvc، وعناوين IP وGateway قابلة للقراءة والتشخيص المباشر عبر Agent.'
                      : 'Adapters, WlanSvc status, IP stack, and gateway reachability directly readable via Agent.'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
