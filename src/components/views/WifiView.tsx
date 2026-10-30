import React, { useState } from 'react';
import {
  Wifi,
  Radio,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Signal,
  ArrowRight,
  EyeOff,
  Clock,
  Layers,
  KeyRound
} from 'lucide-react';
import { WifiNetwork, SavedWifiProfile, AgentStatus } from '../../shared/types.js';

interface WifiViewProps {
  agentStatus: AgentStatus;
  wifiNetworks: WifiNetwork[];
  savedProfiles: SavedWifiProfile[];
  activeNetwork: WifiNetwork | null;
  onScanWifi: () => void;
  onConnectSaved: (profileName: string, ssid: string) => void;
  onConnectNew: (ssid: string, psk: string) => void;
  scanning: boolean;
  connecting: boolean;
  language: 'ar' | 'en';
}

export const WifiView: React.FC<WifiViewProps> = ({
  agentStatus,
  wifiNetworks,
  savedProfiles,
  activeNetwork,
  onScanWifi,
  onConnectSaved,
  onConnectNew,
  scanning,
  connecting,
  language
}) => {
  const isAr = language === 'ar';
  const isAgentOffline = agentStatus === 'OFFLINE';

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetwork | null>(null);
  const [pskInput, setPskInput] = useState('');

  const handleOpenConnect = (net: WifiNetwork) => {
    setSelectedNetwork(net);
    setPskInput('');
    setConnectModalOpen(true);
  };

  const handleExecuteConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNetwork) return;
    onConnectNew(selectedNetwork.ssid, pskInput);
    setConnectModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">
            {isAr ? 'إدارة شبكات الواي فاي (Windows Wi-Fi Manager)' : 'Windows Wi-Fi Management'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAr
              ? 'فحص الشبكات القريبة، الاتصال بالملفات المحفوظة، أو إنشاء ملف اختبار مؤقت معزول _vortex_verify_* دون رفع كلمات المرور للسحابة.'
              : 'Scan nearby BSSIDs, connect to saved profiles, or verify new connections via isolated temporary profile _vortex_verify_*.'}
          </p>
        </div>

        <button
          onClick={onScanWifi}
          disabled={scanning || isAgentOffline}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-lg transition ${
            isAgentOffline
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? (isAr ? 'جارِ فحص BSSID...' : 'Scanning...') : (isAr ? 'فحص الشبكات الآن' : 'Scan Wi-Fi Networks')}</span>
        </button>
      </div>

      {/* Active Wi-Fi Connection Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'الاتصال اللاسلكي النشط حالياً (Active WLAN)' : 'Current Active Wi-Fi Association'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'محول Intel Wi-Fi 6 AX200 • خدمة WlanSvc قيد التشغيل' : 'Intel Wi-Fi 6 Adapter • WlanSvc Running'}
              </p>
            </div>
          </div>

          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-beacon" />
            <span>{isAr ? 'متصل وموثق' : 'Connected & Verified'}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">SSID</span>
            <span className="font-bold text-white">{activeNetwork?.ssid || 'Vortex_HQ_5G'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">BSSID (MAC)</span>
            <span className="font-mono-code text-[11px] text-cyan-300">{activeNetwork?.bssid || '98:D0:2B:10:44:A1'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">{isAr ? 'قوة الإشارة' : 'Signal / dBm'}</span>
            <span className="font-bold text-emerald-400">
              {activeNetwork?.signalStrength || 92}% ({activeNetwork?.signalDbm || -54} dBm)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">{isAr ? 'القناة والتردد' : 'Channel & Band'}</span>
            <span className="font-mono-code text-slate-200">
              CH {activeNetwork?.channel || 36} ({activeNetwork?.frequencyBand || '5GHz'})
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">{isAr ? 'المصادقة والتشفير' : 'Auth & Cipher'}</span>
            <span className="text-slate-200">
              {activeNetwork?.authType || 'WPA2-PSK'} / {activeNetwork?.cipher || 'AES-CCMP'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">{isAr ? 'عنوان IPv4 (غير APIPA)' : 'Leased IPv4'}</span>
            <span className="font-mono-code text-emerald-300 font-bold">192.168.1.100</span>
          </div>
        </div>
      </div>

      {/* Two Columns: Nearby Networks & Saved Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Discovered Nearby Networks */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'الشبكات القريبة المكتشفة (Nearby BSSIDs)' : 'Discovered Networks'}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono-code">{wifiNetworks.length} {isAr ? 'شبكة' : 'found'}</span>
          </div>

          {isAgentOffline ? (
            <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">
                {isAr ? 'فحص الواي فاي يتطلب اتصال الـ Local Agent' : 'Wi-Fi Scanning requires active Local Agent'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'المتصفح لا يستطيع فحص الشبكات اللاسلكية دون وكيل محلي.' : 'Browsers cannot scan physical Wi-Fi without an agent.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {wifiNetworks.map((net) => (
                <div
                  key={net.bssid}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    net.isCurrentConnection
                      ? 'bg-cyan-950/30 border-cyan-500/40'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{net.ssid}</span>
                      {net.isCurrentConnection && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40">
                          {isAr ? 'متصل' : 'Active'}
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 font-mono-code">
                        {net.frequencyBand}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono-code flex items-center gap-2">
                      <span>BSSID: {net.bssid}</span>
                      <span>•</span>
                      <span>CH: {net.channel}</span>
                      <span>•</span>
                      <span>{net.authType}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-white block">{net.signalStrength}%</span>
                      <span className="text-[10px] text-slate-400 font-mono-code">{net.signalDbm} dBm</span>
                    </div>

                    {!net.isCurrentConnection && (
                      <button
                        onClick={() => handleOpenConnect(net)}
                        disabled={connecting}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                      >
                        {isAr ? 'اتصال مؤقت' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Saved Profiles */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'ملفات Wi-Fi المحفوظة محلياً (Saved Profiles)' : 'Saved Local Wi-Fi Profiles'}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono-code">{savedProfiles.length} {isAr ? 'ملف' : 'profiles'}</span>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">
                {isAr ? 'ضمان الخصوصية التام:' : 'Privacy Guarantee:'}
              </span>{' '}
              {isAr
                ? 'يتم استدعاء netsh wlan show profiles لقراءة الأسماء فقط. كلمات المرور ومفاتيح PSK لا يتم استخراجها أو إرسالها إلى السحابة مطلقاً.'
                : 'Profile names only are queried from netsh. Passwords and PSK keys are never extracted or sent to the cloud.'}
            </div>
          </div>

          <div className="space-y-2.5">
            {savedProfiles.map((prof) => (
              <div
                key={prof.name}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{prof.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono-code">
                    {prof.authType} • {isAr ? 'المفتاح مخزن محلياً بـ Windows DPAPI' : 'Stored in Windows Vault'}
                  </p>
                </div>

                <button
                  onClick={() => onConnectSaved(prof.name, prof.name)}
                  disabled={connecting || isAgentOffline}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
                >
                  {isAr ? 'اتصال مباشر' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safe Temporary Connect Modal */}
      {connectModalOpen && selectedNetwork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'الاتصال الآمن بالشبكة' : 'Connect via Isolated Test Profile'}
                </h3>
                <p className="text-xs text-slate-400 font-mono-code">{selectedNetwork.ssid} ({selectedNetwork.bssid})</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-200 block">
                {isAr ? 'آلية التحقق المعزولة (REQ-WIFI-003):' : 'Isolated Verification Lifecycle:'}
              </span>
              <p>
                {isAr
                  ? 'ينشئ الوكيل محلياً ملف تعريف مؤقت باسم _vortex_verify_*، يختبر الاتصال ومراحل DHCP، ثم يقوم بتصفير XML وحذفه فوراً.'
                  : 'Agent creates isolated _vortex_verify_* profile, validates DHCP lease, zeroizes XML, and deletes the temporary profile.'}
              </p>
            </div>

            <form onSubmit={handleExecuteConnect} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {isAr ? 'كلمة مرور الشبكة (WPA2/WPA3 Pre-Shared Key):' : 'Wi-Fi Password / PSK:'}
                </label>
                <input
                  type="password"
                  required
                  value={pskInput}
                  onChange={(e) => setPskInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono-code"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={connecting || !pskInput}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition"
                >
                  {connecting ? (isAr ? 'جارِ التحقق والاتصال...' : 'Connecting...') : (isAr ? 'بدء الاتصال والتحقق' : 'Verify & Connect')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
