import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Lightbulb, AlertTriangle, ArrowRight, BrainCircuit, Target, CheckCircle } from 'lucide-react';

export default function DecisionSupport() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [risks, setRisks] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    api.get('/projects/').then(r => setProjects(r.data.projects || r.data || [])); 
  }, []);

  const loadData = async (projectId) => {
    setSelectedProject(projectId);
    if (!projectId) return;
    setLoading(true);
    try {
      const [act, rsk] = await Promise.all([
        api.get(`/ai/suggest-actions/${projectId}`),
        api.get(`/ai/risk-detection/${projectId}`)
      ]);
      setSuggestions(act.data);
      setRisks(rsk.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <BrainCircuit className="text-blue-600" size={32} />
            دعم اتخاذ القرار (Decision Support)
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            توصيات استراتيجية وتصحيحية مبنية على التحليل الذكي للبيانات والمؤشرات والمخاطر.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">المشروع:</span>
          <select 
            className="glass-card rounded-xl px-4 py-2 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" 
            value={selectedProject} 
            onChange={e => loadData(e.target.value)}
          >
            <option value="">اختر مشروعاً للتحليل...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {!selectedProject && (
        <div className="glass-card rounded-2xl p-16 text-center border border-slate-200/60">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <BrainCircuit size={48} className="text-blue-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">المحرك الذكي بانتظار إشارتك</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            قم باختيار مشروع من القائمة بالأعلى ليقوم المحرك الذكي بتحليل المؤشرات والشكاوى والمخاطر واستخراج توصيات قابلة للتنفيذ فوراً.
          </p>
        </div>
      )}

      {loading && (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">جاري معالجة البيانات واستنباط القرارات...</p>
        </div>
      )}

      {!loading && selectedProject && suggestions && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Suggestions Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Lightbulb className="text-amber-500" size={24} />
              <h2 className="text-xl font-bold text-slate-800">إجراءات تصحيحية مقترحة</h2>
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                {suggestions.total_suggestions} إجراءات
              </span>
            </div>

            {suggestions.suggestions?.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center border-l-4 border-l-emerald-500">
                <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700">الأداء ممتاز</h3>
                <p className="text-sm text-slate-500 mt-1">لا توجد انحرافات تتطلب إجراءات تصحيحية عاجلة في الوقت الحالي.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.suggestions?.map((s, i) => (
                  <div key={i} className={`glass-card rounded-2xl p-6 border-r-4 transition-all hover:translate-x-[-4px] ${s.priority === 'high' ? 'border-r-rose-500' : 'border-r-amber-500'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            {s.priority === 'high' ? 'أولوية قصوى' : 'أولوية متوسطة'}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{s.area === 'indicators' ? 'مؤشر أداء' : 'توصيات متأخرة'}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{s.indicator || s.title}</h3>
                      </div>
                      {s.achievement && (
                        <div className="text-left">
                          <p className="text-xs text-slate-500">نسبة الإنجاز</p>
                          <p className="text-xl font-extrabold text-rose-600">{s.achievement}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                      <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <ArrowRight size={16} className="text-blue-500" /> القرار المقترح لتصحيح المسار:
                      </p>
                      <ul className="space-y-2">
                        {s.actions?.map((act, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <button className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition">تطبيق الإجراء</button>
                      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition">تجاهل</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risks Radar Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="text-indigo-500" size={24} />
              <h2 className="text-xl font-bold text-slate-800">رادار المخاطر</h2>
            </div>

            {risks && (
              <div className="glass-card rounded-2xl p-6 border border-slate-200/60">
                <div className="text-center mb-6 pb-6 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-500 mb-2">مؤشر الخطر العام</p>
                  <div className={`text-4xl font-black mb-1 ${risks.risk_level === 'critical' ? 'text-rose-600' : risks.risk_level === 'high' ? 'text-orange-500' : risks.risk_level === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {risks.risk_score}/10
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${risks.risk_level === 'critical' ? 'bg-rose-100 text-rose-700' : risks.risk_level === 'high' ? 'bg-orange-100 text-orange-700' : risks.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {risks.risk_level === 'critical' ? 'حرج جداً' : risks.risk_level === 'high' ? 'مرتفع' : risks.risk_level === 'medium' ? 'متوسط' : 'منخفض ومستقر'}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700">المخاطر המكتشفة آلياً ({risks.total_risks})</h4>
                  
                  {risks.detected_risks?.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">لم يكتشف الرادار أي مخاطر محتملة حالياً.</p>
                  ) : (
                    risks.detected_risks?.map((r, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={14} className={r.severity === 'high' ? 'text-rose-500' : 'text-amber-500'} />
                          <span className="text-xs font-bold text-slate-700">{r.type === 'timeline' ? 'الجدول الزمني' : r.type === 'budget' ? 'الميزانية' : r.type === 'performance' ? 'الأداء' : 'الامتثال'}</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{r.description}</p>
                        <p className="text-xs font-medium text-indigo-600 bg-indigo-50 p-2 rounded-lg leading-relaxed">
                          💡 {r.recommendation}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
