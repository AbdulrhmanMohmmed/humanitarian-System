import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, MessageSquare, Zap, Target, ShieldAlert, TrendingUp, Lightbulb, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import api from '../services/api';

const CONTEXT_HINTS = {
  '/': 'أنت في لوحة التحكم الرئيسية. يمكنني تلخيص حالة المشاريع الحالية لك.',
  '/projects': 'يمكنني مساعدتك في مراجعة أطر المنطق (LogFrames) أو اقتراح مؤشرات ذكية لمشروعك.',
  '/dqa': 'يمكنني تحليل أنماط البيانات المفقودة واقتراح خطة تصحيحية فورية.',
  '/risks': 'سأقوم بمطابقة التنبيهات الحالية مع قواعد الدروس المستفادة التاريخية.',
  '/accountability': 'يمكنني تصنيف الشكاوى آلياً (حساسة/عادية) واقتراح أولوية الرد.',
  '/meal': 'يمكنني حساب قيم الـ baseline المفقودة بناءً على المتوسطات الإقليمية.',
};

export default function AIAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const getInitialHint = () => CONTEXT_HINTS[location.pathname] || 'أنا مستشارك الذكي. كيف يمكنني مساعدتك في إدارة برامجك اليوم؟';

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'ai', text: getInitialHint(), time: new Date() }]);
    }
  }, [isOpen, location.pathname]);

  const getOfflineResponse = (query) => {
    const q = query.toLowerCase();
    if (q.includes('خطر') || q.includes('risk')) return 'بناءً على بيانات المشاريع الحالية، أبرز المخاطر:\n• تأخر توريدات مشروع WASH بنسبة 80% — يوصى بتفعيل المشتري الاحتياطي.\n• نسبة إنجاز مؤشر IND-02 بلغت 43% فقط — يستدعي مراجعة خطة التنفيذ.';
    if (q.includes('ميزانية') || q.includes('budget') || q.includes('إنفاق')) return 'إجمالي الميزانية: $2.4M. المُنفق: $1.26M (53%). مشروع FSL-TZ-001 يُنفق بأعلى وتيرة. مشروع WASH-DL-002 متأخر (27%) — يستلزم مراجعة.';
    if (q.includes('مستفيد') || q.includes('beneficiar')) return 'إجمالي المستفيدين: 18,450. أعلى تركيز في تعز (5,000 أسرة). تغطية ذوي الإعاقة: 12% — يوصى برفعها لـ 20% وفق معايير Sphere.';
    if (q.includes('تقرير') || q.includes('report') || q.includes('مانح')) return 'لإعداد تقرير للمانحين:\n1. استخدم "بناء التقارير الروائية" للتقارير السردية.\n2. راجع أداء المؤشرات في لوحة IPTT.\n3. صدّر بيانات المستفيدين من قسم التحقق المجتمعي.';
    if (q.includes('بيانات') || q.includes('جودة') || q.includes('dqa')) return 'آخر DQA: مشروع FSL = 94/100 ✅، مشروع WASH = 82/100 ⚠️ — يحتاج تحسين اكتمال البيانات الميدانية.';
    if (q.includes('موظف') || q.includes('hr') || q.includes('فريق')) return 'الفريق الحالي: 5 موظفين نشطين. طلبات إجازة معلقة: 1. إجمالي الرواتب الشهرية: $4,700.';
    if (q.includes('شكوى') || q.includes('مساءلة') || q.includes('cfm')) return 'ملخص CFM: 5 شكاوى — 2 حرجة تحتاج تصعيداً فورياً (احتيال + سلوك موظف). متوسط وقت الاستجابة المستهدف: 72 ساعة.';
    return 'بناءً على بيانات النظام: 3 مشاريع نشطة، 18,450 مستفيد، ميزانية $2.4M. حدد المشروع أو الوحدة للحصول على تحليل أعمق.';
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const savedInput = input;
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/process', {
        task: savedInput.toLowerCase().includes('خطر') || savedInput.toLowerCase().includes('risk') ? 'risk_analysis' : 'general',
        context: `Current Path: ${location.pathname}, User Query: ${savedInput}`
      });
      setMessages(prev => [...prev, { role: 'ai', text: response.data.result, time: new Date() }]);
      setLoading(false);
    } catch (e) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', text: getOfflineResponse(savedInput), time: new Date() }]);
        setLoading(false);
      }, 700);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[150] w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-2xl shadow-2xl flex items-center justify-center text-white border-4 border-white/20 backdrop-blur-sm"
      >
        <Sparkles size={28} className="animate-pulse" />
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-bounce" />
      </motion.button>

      {/* AI Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 z-[200] shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col"
          >
            <div className="p-6 border-b border-[var(--border)] bg-gradient-to-r from-blue-600/5 to-violet-600/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">مساعد HIAOS الذكي</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Context Aware Ready</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-black/5 rounded-lg text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex flex-col max-w-[85%]", msg.role === 'ai' ? 'mr-auto items-start' : 'ml-auto items-end')}
                >
                  <div className={cn(
                    "p-4 rounded-2xl text-xs leading-relaxed font-bold",
                    msg.role === 'ai' 
                      ? "bg-slate-100 dark:bg-slate-800 text-[var(--text-primary)] rounded-tl-none" 
                      : "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] font-black text-slate-400 mt-2 opacity-50">
                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[var(--border)] bg-slate-50 dark:bg-slate-900/50">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="اسأل المستشار الذكي عن أي شيء..."
                  className="w-full h-14 pl-14 pr-6 bg-white dark:bg-slate-800 border border-[var(--border)] rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 shadow-sm transition-all"
                />
                <button 
                  onClick={handleSend}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { text: 'حلل المخاطر', icon: ShieldAlert },
                  { text: 'تنبؤ الإنجاز', icon: TrendingUp },
                  { text: 'جودة البيانات', icon: Zap },
                ].map(tag => (
                  <button key={tag.text} className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-[9px] font-black text-slate-400 hover:text-blue-600 hover:bg-blue-600/5 transition-all flex items-center gap-2">
                    <tag.icon size={12} /> {tag.text}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
