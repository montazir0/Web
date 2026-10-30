import React, { useState } from 'react';
import {
  Bot,
  Send,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  FileText,
  HelpCircle,
  Terminal,
  RefreshCw
} from 'lucide-react';
import { DiagnosticCheck } from '../../shared/types.js';

interface AiAssistantViewProps {
  diagnosticChecks: DiagnosticCheck[];
  language: 'ar' | 'en';
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  diagnosticChecks,
  language
}) => {
  const isAr = language === 'ar';
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; disclaimer?: string }>>([
    {
      role: 'assistant',
      text: isAr
        ? 'مرحباً بك في مساعد Vortex للتشخيص الفني للشبكات. أستطيع تحليل أدلة الفحوصات التشخيصية المتاحة وتفسير أسباب تعثر الاتصال دون اختراع أي قياسات غير مثبتة.'
        : 'Welcome to Vortex Network Diagnostic Analyst. I can interpret your local Windows network evidence without fabricating unverified measurements.',
      disclaimer: isAr
        ? 'تفسير تحليلي استشاري مبني على الأدلة فقط، ولا يملك صلاحية تغيير إعدادات الأجهزة.'
        : 'Advisory explanation based purely on available evidence. Has zero direct device write privileges.'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userText = question.trim();
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidence: { checks: diagnosticChecks },
          question: userText,
          context: 'Vortex Windows Network Diagnostics'
        })
      });

      const data = await res.json();
      if (data.ok) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: data.explanation,
            disclaimer: data.disclaimer
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: isAr
              ? `تعذر إتمام التحليل: ${data.message}`
              : `Analysis unavailable: ${data.message}`
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: isAr ? 'حدث خطأ في الاتصال بالخادم.' : 'Error contacting AI backend service.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          <span>{isAr ? 'مساعد التشخيص الفني الذكي (Gemini Assistant)' : 'Network AI Diagnostic Assistant'}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isAr
            ? 'نموذج Gemini 2.5 Flash على الخادم يفسر الأدلة الفعلية المحققة. لا ينشئ بيانات وهمية ولا يمتلك صلاحية تعديل الإعدادات.'
            : 'Server-side Gemini 2.5 Flash explaining verified evidence. Strictly disclaims execution privileges.'}
        </p>
      </div>

      {/* Chat Container */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[520px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-2xl ${msg.role === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
              }`}>
                {msg.role === 'user' ? <span className="text-xs font-bold">You</span> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-1.5">
                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-950/80 border border-slate-800/80 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}>
                  {msg.text}
                </div>

                {msg.disclaimer && (
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono-code px-2">
                    <ShieldCheck className="w-3 h-3 text-cyan-500/80" />
                    <span>{msg.disclaimer}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 ml-auto text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              </div>
              <span>{isAr ? 'جارِ تحليل الأدلة التقنية...' : 'Analyzing diagnostic evidence...'}</span>
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950/90 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              isAr
                ? 'اسأل عن سبب مشكلة الشبكة، فحص APIPA، أو كيفية معالجة فشل Gateway...'
                : 'Ask about APIPA errors, gateway timeouts, or adapter states...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'إرسال' : 'Ask'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
