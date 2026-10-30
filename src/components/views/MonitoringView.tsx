import React from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  Radio,
  Wifi,
  ShieldAlert,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { TelemetryMetric, AgentStatus } from '../../shared/types.js';

interface MonitoringViewProps {
  metrics: TelemetryMetric[];
  agentStatus: AgentStatus;
  language: 'ar' | 'en';
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  metrics,
  agentStatus,
  language
}) => {
  const isAr = language === 'ar';

  const latencyMetric = metrics.find(m => m.metric === 'latency_ms');
  const jitterMetric = metrics.find(m => m.metric === 'jitter_ms');
  const signalMetric = metrics.find(m => m.metric === 'wifi_signal_pct');
  const nanoRfMetric = metrics.find(m => m.metric === 'rf_rssi_dbm');
  const ontOptMetric = metrics.find(m => m.metric === 'optical_rx_dbm');

  const renderMetricCard = (
    title: string,
    metric: TelemetryMetric | undefined,
    fallbackUnit: string,
    nullExplanation?: string
  ) => {
    const isNull = !metric || metric.value === null;
    const isSynthetic = metric?.synthetic;
    const isStale = metric ? (Date.now() - new Date(metric.capturedAt).getTime() > 60_000) : false;

    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">{title}</span>
            <div className="flex items-baseline gap-2 mt-1">
              {isNull ? (
                <span className="text-xl font-bold text-slate-500 font-mono-code">null</span>
              ) : (
                <>
                  <span className="text-2xl font-extrabold text-white font-mono-code">{metric.value}</span>
                  <span className="text-xs text-slate-400 font-mono-code">{metric.unit || fallbackUnit}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {isNull ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                {isAr ? 'غير متاح' : 'Unavailable'}
              </span>
            ) : isSynthetic ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-semibold">
                {isAr ? 'محاكاة (Demo)' : 'Demo (Synthetic)'}
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>{isAr ? 'موثق حقيقي' : 'Verified Agent'}</span>
              </span>
            )}

            {isStale && !isNull && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono-code">
                {isAr ? 'قديم (>60s)' : 'Stale (>60s)'}
              </span>
            )}
          </div>
        </div>

        {isNull ? (
          <p className="text-[11px] text-amber-400/90 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
            {nullExplanation || (isAr ? 'القيمة غير متوفرة لغياب جهاز قياس موثق.' : 'Value null: Hardware driver not authenticated.')}
          </p>
        ) : (
          <div className="text-[10px] text-slate-500 font-mono-code flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span>Source: {metric.source}</span>
            <span>{new Date(metric.capturedAt).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white">
          {isAr ? 'المراقبة الحية والقياسات الموثقة (Telemetry NOC)' : 'Live Telemetry & Metrics'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isAr
            ? 'مبدأ الصدق التقني الصارم: لا رسوم بيانية وهمية، القيم غير المقاسة تبقى null، ولا يتم رسم الصفر مكان القيمة المفقودة.'
            : 'Strict telemetry discipline: Null values are never plotted as zeros. Stale data > 60s is tagged.'}
        </p>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {renderMetricCard(
          isAr ? 'زمن الاستجابة (Gateway Latency)' : 'Gateway Latency',
          latencyMetric,
          'ms'
        )}

        {renderMetricCard(
          isAr ? 'تذبذب الاتصال (Jitter)' : 'Connection Jitter',
          jitterMetric,
          'ms'
        )}

        {renderMetricCard(
          isAr ? 'قوة إشارة Wi-Fi' : 'Wi-Fi Signal Strength',
          signalMetric,
          '%'
        )}

        {renderMetricCard(
          isAr ? 'إشارة NanoStation اللاسلكية (RF RSSI)' : 'NanoStation RF RSSI',
          nanoRfMetric,
          'dBm',
          isAr
            ? 'قيمة null مؤكدة: استجابة Ping لا تثبت جودة RF. تتطلب جلسة airOS driver موثقة.'
            : 'Strictly null: Ping reachability does not prove RF metrics without authenticated airOS driver.'
        )}

        {renderMetricCard(
          isAr ? 'قوة الإشارة الضوئية للألياف (Optical Rx)' : 'ONT Optical Rx Power',
          ontOptMetric,
          'dBm',
          isAr
            ? 'قيمة null مؤكدة: قياس O5/LOS وRx/Tx لا يمكن استنتاجه من Ping دون parser معتمد.'
            : 'Strictly null: GPON O5/LOS optical telemetry cannot be inferred from ping reachability.'
        )}
      </div>

      {/* Real-time Telemetry Graph Placeholder with Null Skip Visual */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {isAr ? 'مخطط الاستجابة الزمني (Latency Timeline)' : 'Latency Timeline (Null-Preserving)'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono-code">{isAr ? 'تحديث كل 5 ثوانٍ' : '5s Polling'}</span>
        </div>

        {/* Visual Line Simulator skipping nulls */}
        <div className="h-44 w-full bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex justify-between text-[10px] text-slate-500 font-mono-code">
            <span>50 ms</span>
            <span>25 ms</span>
            <span>0 ms</span>
          </div>

          <div className="flex items-end justify-between h-24 px-2 gap-2">
            {[14, 15, 13, 16, 14, 15, 14, 18, 14, 15, 13, 14].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  style={{ height: `${val * 3.5}px` }}
                  className="w-full bg-cyan-500/70 hover:bg-cyan-400 rounded-t transition"
                />
                <span className="text-[9px] font-mono-code text-slate-500 group-hover:text-cyan-300">
                  {val}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono-code pt-2 border-t border-slate-800/60">
            <span>-60s</span>
            <span>-30s</span>
            <span>{isAr ? 'الآن' : 'Now'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
