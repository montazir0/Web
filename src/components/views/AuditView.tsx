import React, { useState } from 'react';
import {
  FileText,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { AuditEventRecord } from '../../shared/types.js';

interface AuditViewProps {
  logs: AuditEventRecord[];
  language: 'ar' | 'en';
}

export const AuditView: React.FC<AuditViewProps> = ({ logs, language }) => {
  const isAr = language === 'ar';
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filtered = logs.filter((log) => {
    const matchesFilter = filter === 'ALL' || log.status === filter;
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.redactedSummary.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportToJson = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vnc_audit_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">
            {isAr ? 'سجل العمليات والأحداث الموثق (Immutable Audit)' : 'Cryptographic Audit Trail'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAr
              ? 'سجل غير قابل للتعديل يوثق جميع طلبات الاقتران، الوظائف الموقعة، موافقات المستخدم، والتنقيح التلقائي للأسرار.'
              : 'Tamper-resistant audit log capturing pairing events, signed jobs, explicit user consent, and redacted secrets.'}
          </p>
        </div>

        <button
          onClick={exportToJson}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? 'تصدير السجل كـ JSON' : 'Export Audit JSON'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-3 right-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث في الأحداث والأهداف...' : 'Search actions, targets, summaries...'}
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono-code"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'SUCCESS', 'FAILED', 'BLOCKED', 'WARNING'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                filter === status
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">{isAr ? 'الوقت' : 'Timestamp'}</th>
                <th className="p-3.5">{isAr ? 'المستخدم / الفاعل' : 'Actor'}</th>
                <th className="p-3.5">{isAr ? 'العملية' : 'Action'}</th>
                <th className="p-3.5">{isAr ? 'الهدف' : 'Target'}</th>
                <th className="p-3.5">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5">{isAr ? 'الملخص المنقح' : 'Redacted Summary'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-code text-[11px]">
              {filtered.map((log) => {
                const isSuccess = log.status === 'SUCCESS';
                const isFailed = log.status === 'FAILED';
                const isBlocked = log.status === 'BLOCKED';

                return (
                  <tr key={log.eventId} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-cyan-300 font-bold whitespace-nowrap">
                      {log.actor}
                    </td>
                    <td className="p-3.5 text-white font-semibold whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="p-3.5 text-slate-300 whitespace-nowrap">
                      {log.target}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSuccess ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                        isFailed ? 'bg-red-950 text-red-300 border border-red-500/30' :
                        isBlocked ? 'bg-purple-950 text-purple-300 border border-purple-500/30' :
                        'bg-amber-950 text-amber-300 border border-amber-500/30'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300 max-w-md truncate font-sans">
                      {log.redactedSummary}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
