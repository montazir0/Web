import React from 'react';
import {
  Shield,
  Activity,
  Wifi,
  Server,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileText,
  Bot,
  Download,
  Terminal,
  Globe
} from 'lucide-react';
import { AgentInfo, AgentStatus } from '../shared/types.js';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeAgent: AgentInfo | null;
  agentStatus: AgentStatus;
  mockAgentEnabled: boolean;
  onToggleMock: () => void;
  language: 'ar' | 'en';
  onToggleLanguage: () => void;
  onOpenPairModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activeAgent,
  agentStatus,
  mockAgentEnabled,
  onToggleMock,
  language,
  onToggleLanguage,
  onOpenPairModal
}) => {
  const isAr = language === 'ar';

  const navItems = [
    { id: 'dashboard', label: isAr ? 'لوحة القيادة' : 'Dashboard', icon: Activity },
    { id: 'agents', label: isAr ? 'الـ Agent والاقتران' : 'Agents & Pairing', icon: Radio },
    { id: 'devices', label: isAr ? 'الأجهزة' : 'Devices', icon: Server },
    { id: 'wifi', label: isAr ? 'الواي فاي' : 'Wi-Fi Manager', icon: Wifi },
    { id: 'diagnostics', label: isAr ? 'التشخيص' : 'Diagnostics', icon: Shield },
    { id: 'repairs', label: isAr ? 'محرك الإصلاح' : 'Safe Repairs', icon: Wrench },
    { id: 'monitoring', label: isAr ? 'المراقبة' : 'Monitoring', icon: Activity },
    { id: 'audit', label: isAr ? 'سجل العمليات' : 'Audit Log', icon: FileText },
    { id: 'ai', label: isAr ? 'مساعد الذكاء الاصطناعي' : 'Network AI', icon: Bot },
    { id: 'hub', label: isAr ? 'مركز الـ Agent وتثبيت ويندوز' : 'Windows Agent Hub', icon: Download }
  ];

  const getStatusBadge = () => {
    switch (agentStatus) {
      case 'REAL_CONNECTED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] sm:text-xs font-semibold shadow-sm shadow-emerald-500/10 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-beacon" />
            <span className="hidden xs:inline">{isAr ? 'Real Agent متصل' : 'Real Agent Connected'}</span>
            <span className="xs:hidden">{isAr ? 'Real Agent' : 'Connected'}</span>
            <span className="text-[10px] text-emerald-400/80 font-mono-code hidden sm:inline">
              ({activeAgent?.hostname || 'Windows'})
            </span>
          </div>
        );
      case 'MOCK_ACTIVE':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[11px] sm:text-xs font-semibold shadow-sm shadow-amber-500/10 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="hidden xs:inline">{isAr ? 'Mock Agent نشط' : 'Mock Agent Active'}</span>
            <span className="xs:hidden">{isAr ? 'محاكاة' : 'Mock'}</span>
          </div>
        );
      case 'UPDATE_REQUIRED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-blue-950/80 border border-blue-500/50 text-blue-300 text-[11px] sm:text-xs font-semibold whitespace-nowrap">
            <AlertTriangle className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden xs:inline">{isAr ? 'تحديث مطلوب' : 'Update Required'}</span>
            <span className="xs:hidden">{isAr ? 'تحديث' : 'Update'}</span>
          </div>
        );
      case 'CAPABILITY_MISSING':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-purple-950/80 border border-purple-500/50 text-purple-300 text-[11px] sm:text-xs font-semibold whitespace-nowrap">
            <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
            <span>{isAr ? 'صلاحيات ناقصة' : 'Missing Cap'}</span>
          </div>
        );
      case 'OFFLINE':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-900 border border-red-500/40 text-red-300 text-[11px] sm:text-xs font-semibold whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="hidden xs:inline">{isAr ? 'الـ Agent غير متصل' : 'Agent Offline'}</span>
            <span className="xs:hidden">{isAr ? 'غير متصل' : 'Offline'}</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      {/* Top Bar with brand & actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wide text-white">VORTEX</span>
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono-code">
                  NOC v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {isAr ? 'مركز التحكم بالشبكة وإدارة الـ Local Agent' : 'Network Control Center & Agent Manager'}
              </p>
            </div>
          </div>

          {/* Right Header Status & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status Pill */}
            {getStatusBadge()}

            {/* Pair Button */}
            <button
              onClick={onOpenPairModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm shadow-cyan-600/30"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'ربط Agent' : 'Pair Agent'}</span>
            </button>

            {/* Mock Toggle */}
            <button
              onClick={onToggleMock}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                mockAgentEnabled
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
              title={isAr ? 'تبديل وضع المحاكاة' : 'Toggle Simulator'}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isAr ? 'وضع المحاكاة' : 'Sim Mode'}</span>
            </button>

            {/* Language Switch */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-medium transition"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
