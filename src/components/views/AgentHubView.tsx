import React, { useState } from 'react';
import {
  Download,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Copy,
  Check,
  Layers,
  Cpu,
  Lock,
  ExternalLink
} from 'lucide-react';

interface AgentHubViewProps {
  language: 'ar' | 'en';
}

export const AgentHubView: React.FC<AgentHubViewProps> = ({ language }) => {
  const isAr = language === 'ar';
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedOneLiner, setCopiedOneLiner] = useState(false);

  const oneLiner = `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\\Install-VNC-Local-Agent.ps1`;

  const copyText = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-cyan-400" />
          <span>{isAr ? 'مركز توثيق الـ Agent وتثبيت ويندوز' : 'Windows Local Agent Hub & Documentation'}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isAr
            ? 'دليل مهندسي النظم الشامل: تعليمات البناء على ويندوز، فحص التشفير بـ DPAPI، وإثبات عدم تسريب كلمات المرور.'
            : 'Complete systems engineering guide: Windows build steps, DPAPI vault, and proof of zero password leakage.'}
        </p>
      </div>

      {/* Build Status Alert in Build Environment */}
      <div className="rounded-2xl bg-slate-900 border border-amber-500/40 p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-mono-code font-bold text-xs border border-amber-500/40">
            PENDING_WINDOWS_BUILD_VALIDATION
          </span>
          <span className="text-xs text-slate-300 font-semibold">
            {isAr ? 'حالة البناء الصادقة داخل بيئة Google AI Studio' : 'Honest Build Status Declaration'}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {isAr
            ? 'نظراً لأن بيئة معاينة Google AI Studio تعمل داخل حاوية Linux ولا تملك مترجمات سطح مكتب Windows أو Windows SDK، تم إنشاء شجرة الكود المصدري الكاملة للـ Agent بلغة C# .NET 8 مع مشاريع Visual Studio واختبارات xUnit وسكريبتات PowerShell جاهزة للبناء المباشر على نظام Windows المستهدف.'
            : 'Because the Google AI Studio container runs Linux without Windows desktop SDKs, the complete production C# .NET 8 solution, Windows Service, DPAPI vault, and PowerShell installation scripts are completely authored and ready for direct compilation on Windows 10/11.'}
        </p>
      </div>

      {/* Verification Matrix: 4 Quad Breakdown */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? 'مصفوفة التحقق والجاهزية الفنية (Verification Matrix):' : 'Verification Matrix:'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Box 1: Run & Tested in Linux */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? '1. ما تم تشغيله واختباره داخل بيئة Build:' : '1. Run & Tested in Build Sandbox:'}</span>
            </div>
            <ul className="space-y-1 text-slate-300 pl-4 list-disc">
              <li>{isAr ? 'تطبيق الويب Full-Stack كامل بـ React + Express' : 'Complete Full-Stack React + Express App'}</li>
              <li>{isAr ? 'خادم Node.js مع جميع مسارات REST API المقيدة' : 'Node.js server with all REST endpoints'}</li>
              <li>{isAr ? 'اختبارات الوحدة الصافية (Node test runner) لـ Redaction و Replay و Wi-Fi Verifier' : 'Pure logic unit tests (Redaction, Replay Guard, Verifier)'}</li>
              <li>{isAr ? 'توليد كود الاقتران السداسي والتحقق من الصلاحية' : '6-character pairing code generation & expiry'}</li>
              <li>{isAr ? 'مكتبة تنقيح الأسرار الشاملة (Redaction Sanitizer)' : 'Comprehensive Redaction Sanitizer'}</li>
            </ul>
          </div>

          {/* Box 2: Authored for Windows */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <FileCode className="w-4 h-4" />
              <span>{isAr ? '2. ما تم إنشاؤه وجاهز للبناء على Windows:' : '2. Created & Ready for Windows Build:'}</span>
            </div>
            <ul className="space-y-1 text-slate-300 pl-4 list-disc">
              <li>{isAr ? 'مشروع C# كامل لخدمة الويندوز VNC.LocalAgent.Service' : 'Full C# Windows Service (VNC.LocalAgent.Service)'}</li>
              <li>{isAr ? 'تطبيق صينية النظام VNC.LocalAgent.Tray' : 'Windows Forms System Tray notification app'}</li>
              <li>{isAr ? 'خزينة التشفير بـ Windows DPAPI (ProtectedData)' : 'Windows DPAPI Secret Vault (ProtectedData)'}</li>
              <li>{isAr ? 'محلل Netsh WLAN show mode=bssid' : 'Netsh WLAN BSSID & profile parser'}</li>
              <li>{isAr ? 'سكريبتات التثبيت والإصلاح Install/Uninstall/Repair.ps1' : 'PowerShell installer, uninstaller, and repair scripts'}</li>
            </ul>
          </div>

          {/* Box 3: Tested with Mock */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Terminal className="w-4 h-4" />
              <span>{isAr ? '3. ما تم اختباره عبر Mock Agent Simulator:' : '3. Tested via Mock Agent Simulator:'}</span>
            </div>
            <ul className="space-y-1 text-slate-300 pl-4 list-disc">
              <li>{isAr ? 'محاكاة دورة حياة الوظائف (Queued -> Claimed -> Verified)' : 'Simulated Job state machine lifecycle'}</li>
              <li>{isAr ? 'عرض فحص الواي فاي التجريبي الموسوم بـ synthetic: true' : 'Synthetic Wi-Fi scan and profiles stream'}</li>
              <li>{isAr ? 'فحص تشخيصي تجريبي يثبت انتقال الواجهة' : 'Simulated diagnostics flow and UI transitions'}</li>
              <li>{isAr ? 'عزل كامل بين البيانات التجريبية والحقيقية' : 'Strict isolation between demo and real data'}</li>
            </ul>
          </div>

          {/* Box 4: Physical Hardware Validation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 font-bold">
              <AlertTriangle className="w-4 h-4 text-slate-400" />
              <span>{isAr ? '4. ما يتطلب أجهزة فيزيائية حقيقية:' : '4. Requires Physical Hardware Device:'}</span>
            </div>
            <ul className="space-y-1 text-slate-400 pl-4 list-disc">
              <li>{isAr ? 'محول Wi-Fi فيزيائي فعلي في وضع البث' : 'Physical 802.11 Wi-Fi radio on host'}</li>
              <li>{isAr ? 'جهاز راوتر حقيقي لاختبار مصادقة الـ Provider' : 'Physical Router for provider driver session'}</li>
              <li>{isAr ? 'جهاز Ubiquiti airOS NanoStation لقراءة إشارة RF' : 'Ubiquiti airOS hardware for RF RSSI/CCQ'}</li>
              <li>{isAr ? 'جهاز GPON ONT حقيقي لقراءة Optical Rx و O5' : 'Physical ONT hardware for O5/LOS optical telemetry'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Proof of Zero Password Leakage */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'إثبات هندسي: عدم تسريب كلمات المرور إلى السحابة' : 'Engineering Proof: Zero Password Cloud Leakage'}</span>
        </h3>
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">1.</span>
            <span>
              {isAr
                ? 'استدعاء netsh wlan show profiles يقرأ أسماء الملفات فقط، ولا يمرر معامل key=clear إطلاقاً.'
                : 'netsh wlan show profiles queries profile names only, strictly without passing key=clear.'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">2.</span>
            <span>
              {isAr
                ? 'عند الاتصال بشبكة جديدة، ينشئ Agent ملف XML مؤقت _vortex_verify_* ويقوم بتصفيره بحجمه الكامل (Zero-fill) ثم حذفه في كتلة finally.'
                : 'New credentials create a temporary profile _vortex_verify_*. The file is zero-filled and deleted in finally.'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">3.</span>
            <span>
              {isAr
                ? 'تمر جميع النتائج والأخطاء عبر محرك التنقيح (Redaction Engine) قبل الإرسال لمنع تسرب التوكنات أو المفاتيح.'
                : 'All outbound results and stderr logs pass through the Redaction Engine before transmission.'}
            </span>
          </div>
        </div>
      </div>

      {/* One-Liner PowerShell Command */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? 'أمر PowerShell للتشغيل والتثبيت على ويندوز' : 'PowerShell Command to Run Installer'}</span>
        </h3>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono-code text-xs text-cyan-300 select-all flex items-center justify-between gap-2">
          <div className="overflow-x-auto py-1">
            {oneLiner}
          </div>
          <button
            onClick={() => copyText(oneLiner, setCopiedOneLiner)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex-shrink-0"
          >
            {copiedOneLiner ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
