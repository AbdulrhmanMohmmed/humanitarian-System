import { useState } from 'react';
import { 
  Sparkles, Send, Bot, Zap, 
  Target, AlertTriangle, FileText, 
  BarChart3, RefreshCw, Cpu, 
  BrainCircuit, LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';

const AIHub = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  const analyzeProposal = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setActiveTask('proposal');
    try {
      const { data } = await api.post('/api/ai/analyze-proposal', { text: input });
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col space-y-8 animate-in fade-in duration-1000">
      {/* AI Header */}
      <div className="relative p-12 rounded-[3rem] bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] -translate-y-1/2 translate-x-1/2 rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] translate-y-1/2 -translate-x-1/2 rounded-full" />
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
             <Sparkles className="text-white w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-4xl font-black mb-4 tracking-tight">HIAOS AI Assistant</h1>
          <p className="text-slate-400 font-bold text-lg leading-relaxed">
            مرحباً بك في مركز الذكاء الاصطناعي. يمكنني مساعدتك في تحليل المقترحات، صياغة التقارير، وتقييم المخاطر الميدانية بدقة متناهية.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Interaction Area */}
        <div className="lg:col-span-2 space-y-6">
           <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 relative">
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                 <Bot className="text-blue-600" />
                 بماذا يمكنني مساعدتك اليوم؟
              </h3>
              
              <div className="relative group">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="الصق نص المقترح أو بيانات التقرير هنا للتحليل الذكي..."
                  className="w-full h-48 p-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white text-slate-700 font-bold transition-all outline-none resize-none"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <button 
                    disabled={loading}
                    onClick={analyzeProposal}
                    className="h-12 px-8 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                    تحليل ذكي
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                 {[
                   { label: 'صياغة تقرير دوري', icon: FileText },
                   { label: 'استخراج مؤشرات Logframe', icon: Target },
                   { label: 'تقييم مخاطر المشروع', icon: AlertTriangle }
                 ].map((tool, i) => (
                   <button 
                    key={i} 
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-black flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-all"
                   >
                     <tool.icon size={14} />
                     {tool.label}
                   </button>
                 ))}
              </div>
           </div>

           {/* Results Area */}
           <AnimatePresence>
              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl"
                >
                   <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                      <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                         <BrainCircuit className="text-indigo-600" />
                         نتائج التحليل الذكي
                      </h4>
                      <span className="text-xs font-bold text-slate-400">Analysis completed in 1.2s</span>
                   </div>

                   <div className="grid gap-6">
                      <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                         <h5 className="font-black text-blue-900 mb-2">الملخص التنفيذي</h5>
                         <p className="text-sm font-bold text-blue-700 leading-relaxed">{results.summary}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                            <h5 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                               <Target className="text-emerald-500" size={18} />
                               مؤشرات مستهدفة مقترحة
                            </h5>
                            <div className="space-y-3">
                               {results.suggested_indicators.map((ind, i) => (
                                 <div key={i} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-600">{ind.name}</span>
                                    <span className="text-xs font-black text-blue-600">{ind.target}</span>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                            <h5 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                               <AlertTriangle className="text-orange-500" size={18} />
                               عوامل المخاطرة المكتشفة
                            </h5>
                            <div className="space-y-3">
                               {results.risk_factors.map((risk, i) => (
                                 <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                    {risk}
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
           <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10">
                <LayoutDashboard className="mb-4" />
                <h4 className="text-lg font-black mb-2">أداء النماذج</h4>
                <p className="text-xs font-bold text-indigo-100 opacity-80">جميع الأنظمة تعمل بكفاءة عالية</p>
                
                <div className="mt-8 space-y-4">
                   {[
                     { label: 'دقة التحليل', value: '94%' },
                     { label: 'سرعة المعالجة', value: '0.8s' },
                     { label: 'الاعتمادية الميدانية', value: 'High' }
                   ].map((stat, i) => (
                     <div key={i} className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-xs font-bold text-indigo-200">{stat.label}</span>
                        <span className="text-sm font-black">{stat.value}</span>
                     </div>
                   ))}
                </div>
              </div>
           </div>

           <div className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
              <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-sm">
                 <Zap className="text-yellow-500" size={16} />
                 قدرات نشطة
              </h4>
              <div className="space-y-4">
                 {[
                   { title: 'NLP (PropV1)', desc: 'تحليل النصوص الطبيعية', status: 'Active' },
                   { title: 'Vision (ScanX)', desc: 'تحليل الصور الجوية', status: 'Standby' },
                   { title: 'RiskM (Alpha)', desc: 'توقع الأزمات الميدانية', status: 'Active' }
                 ].map((cap, i) => (
                   <div key={i} className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                         <Cpu size={20} />
                      </div>
                      <div className="flex-1 border-b border-slate-50 pb-3 group-last:border-0">
                         <div className="flex justify-between">
                            <h5 className="text-xs font-black text-slate-800">{cap.title}</h5>
                            <span className="text-[10px] font-black text-emerald-600">{cap.status}</span>
                         </div>
                         <p className="text-[10px] font-bold text-slate-400">{cap.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AIHub;
