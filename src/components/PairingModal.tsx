import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ShieldCheck, Terminal, AlertCircle, RefreshCw } from 'lucide-react';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ar' | 'en';
  onPairSuccess: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  language,
  onPairSuccess
}) => {
  const isAr = language === 'ar';
  const [code, setCode] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(300);

  const fetchPairingCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents/pairing-code', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setCode(data.code);
        setExpiresAt(data.expiresAt);
        const diff = Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000);
        setTimeLeft(Math.max(0, diff));
      }
    } catch (err) {
      console.error('Failed to get pairing code', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPairingCode();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const psCommand = `.\\Install-VNC-Local-Agent.ps1 -PairingCode "${code || 'XXXXXX'}"`;
  const oneLiner = `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\\Install-VNC-Local-Agent.ps1 -PairingCode "${code || 'XXXXXX'}"`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(oneLiner);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'ربط VNC Local Agent بنظام ويندوز' : 'Pair VNC Windows Local Agent'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr ? 'رمز أمان صالح لمرة واحدة لمدة 5 دقائق' : 'One-time secure pairing code valid for 5 minutes'}
            </p>
          </div>
        </div>

        {/* Code Box */}
        <div className="my-5 p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-slate-400 mb-1">
            {isAr ? 'رمز الاقتران لمرة واحدة' : 'One-Time Pairing Code'}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-extrabold tracking-widest text-cyan-400 font-mono-code select-all">
              {loading ? '...' : code || '------'}
            </span>
            <button
              onClick={handleCopyCode}
              disabled={loading || !code}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Copy Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-2 text-xs font-mono-code flex items-center gap-1.5 text-amber-400/90">
            <span>{isAr ? 'الوقت المتبقي للصلاحية:' : 'Expires in:'}</span>
            <span className="font-bold">{timeFormatted}</span>
            {timeLeft <= 0 && (
              <button
                onClick={fetchPairingCode}
                className="ml-2 flex items-center gap-1 text-cyan-400 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{isAr ? 'تجديد الرمز' : 'Renew'}</span>
              </button>
            )}
          </div>
        </div>

        {/* PowerShell Script Instructions */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'خطوات التثبيت في PowerShell (Run as Administrator):' : 'Run in Administrator PowerShell:'}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono-code text-[11px] text-slate-300 relative group">
            <p className="text-slate-500 mb-1"># 1. Execute the installer script with your pairing code:</p>
            <div className="overflow-x-auto select-all text-cyan-300 py-1">
              {oneLiner}
            </div>
            <button
              onClick={handleCopyCmd}
              className="absolute top-2 left-2 p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white transition"
              title="Copy Command"
            >
              {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-3 space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold">•</span>
              <span>{isAr ? 'يثبت Agent كخدمة Windows Service مع تشغيل تلقائي مؤجل.' : 'Installs Agent as Windows Service (Delayed Auto-Start).'}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold">•</span>
              <span>{isAr ? 'يحمي المفتاح الخاص باستخدام Windows DPAPI ولا يشارك كلمات المرور.' : 'Protects private key with Windows DPAPI. Zero passwords in cloud.'}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold">•</span>
              <span>{isAr ? 'اتصال صادر HTTPS فقط (Outbound-only) دون فتح أي منفذ على جهازك.' : 'Outbound HTTPS only (Zero inbound listening ports).'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
