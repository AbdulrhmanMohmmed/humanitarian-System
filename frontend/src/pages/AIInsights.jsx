import { useState, useEffect } from 'react';
import { Brain, AlertTriangle, FileText, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react';
import api from '../services/api';

export default function AIInsights() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [report, setReport] = useState(null);
  const [complaints, setComplaints] = useState(null);
  const [risks, setRisks] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [actions, setActions] = useState(null);
  const [activeTab, setActiveTab] = useState('report');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/projects/').then(r => setProjects(r.data.projects || r.data || [])); }, []);

  const loadData = async (projectId) => {
    setSelectedProject(projectId);
    if (!projectId) return;
    setLoading(true);
    try {
      const [rpt, cmp, rsk, evl, act] = await Promise.all([
        api.get(`/ai/auto-report/${projectId}`).catch(() => ({ data: null })),
        api.get('/ai/analyze-complaints?days=30').catch(() => ({ data: null })),
        api.get(`/ai/risk-detection/${projectId}`).catch(() => ({ data: null })),
        api.get(`/ai/summarize-evaluation/${projectId}`).catch(() => ({ data: null })),
        api.get(`/ai/suggest-actions/${projectId}`).catch(() => ({ data: null })),
      ]);
      setReport(rpt.data);
      setComplaints(cmp.data);
      setRisks(rsk.data);
      setEvaluation(evl.data);
      setActions(act.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const tabs = [
    { key: 'report', label: 'تقرير تلقائي', icon: FileText },
    { key: 'complaints', label: 'تحليل الشكاوى', icon: TrendingUp },
    { key: 'risks', label: 'اكتشاف المخاطر', icon: AlertTriangle },
    { key: 'evaluation', label: 'ملخص التقييم', icon: BarChart3 },
    { key: 'actions', label: 'إجراءات مقترحة', icon: Lightbulb },
  ];

  const statusColor = (s) => s === 'good' || s === 'on_track' ? 'text-green-400' : s === 'needs_attention' || s === 'at_risk' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Brain size={28} /> الذكاء الاصطناعي - تحليلات MEAL</h1>
        <select className="bg-gray-700 text-white rounded-lg px-4 py-2" value={selectedProject} onChange={e => loadData(e.target.value)}>
          <option value="">اختر المشروع</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {!selectedProject && <div className="bg-gray-800 rounded-xl p-12 text-center text-gray-400"><Brain size={64} className="mx-auto mb-4 opacity-30" /><p>اختر مشروعاً لتوليد التحليلات الذكية</p></div>}

      {selectedProject && (
        <>
          <div className="flex gap-2 flex-wrap">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === t.key ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                <t.icon size={16} />{t.label}
              </button>
            ))}
          </div>

          {loading && <div className="text-center py-12 text-gray-400">جاري التحليل بالذكاء الاصطناعي...</div>}

          {!loading && activeTab === 'report' && report && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">{report.overall_score}%</p>
                  <p className={`text-sm ${statusColor(report.overall_status)}`}>الأداء العام</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">{report.executive_summary?.indicators_on_track || 0}</p>
                  <p className="text-sm text-gray-400">مؤشرات على المسار</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-400">{report.executive_summary?.complaints_received || 0}</p>
                  <p className="text-sm text-gray-400">شكاوى مستلمة</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-400">{report.executive_summary?.recommendations_overdue || 0}</p>
                  <p className="text-sm text-gray-400">توصيات متأخرة</p>
                </div>
              </div>
              {report.indicator_analysis?.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">تحليل المؤشرات</h3>
                  <div className="space-y-2">
                    {report.indicator_analysis.map((ind, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                        <span className="text-white">{ind.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400">{ind.achievement_pct}%</span>
                          <span className={`px-2 py-1 rounded text-xs ${ind.status === 'on_track' ? 'bg-green-900 text-green-300' : ind.status === 'at_risk' ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>{ind.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'complaints' && complaints && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">{complaints.total_complaints}</p>
                  <p className="text-sm text-gray-400">إجمالي الشكاوى</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className={`text-3xl font-bold ${complaints.trend === 'increasing' ? 'text-red-400' : complaints.trend === 'decreasing' ? 'text-green-400' : 'text-yellow-400'}`}>{complaints.trend === 'increasing' ? '↑ تزايد' : complaints.trend === 'decreasing' ? '↓ تناقص' : '→ مستقر'}</p>
                  <p className="text-sm text-gray-400">الاتجاه</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">{Object.keys(complaints.by_category || {}).length}</p>
                  <p className="text-sm text-gray-400">فئات</p>
                </div>
              </div>
              {complaints.patterns?.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">أنماط مكتشفة</h3>
                  {complaints.patterns.map((p, i) => <p key={i} className="text-gray-300 py-1">• {p}</p>)}
                </div>
              )}
              {complaints.auto_recommendations?.length > 0 && (
                <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-700">
                  <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center gap-2"><Lightbulb size={18} /> توصيات ذكية</h3>
                  {complaints.auto_recommendations.map((r, i) => <p key={i} className="text-gray-300 py-1">• {r}</p>)}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'risks' && risks && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className={`text-3xl font-bold ${risks.risk_level === 'critical' ? 'text-red-400' : risks.risk_level === 'high' ? 'text-orange-400' : 'text-yellow-400'}`}>{risks.risk_score}</p>
                  <p className="text-sm text-gray-400">درجة المخاطر</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">{risks.total_risks}</p>
                  <p className="text-sm text-gray-400">مخاطر مكتشفة</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className={`text-xl font-bold ${statusColor(risks.risk_level === 'low' ? 'good' : 'critical')}`}>{risks.risk_level === 'critical' ? 'حرج' : risks.risk_level === 'high' ? 'مرتفع' : risks.risk_level === 'medium' ? 'متوسط' : 'منخفض'}</p>
                  <p className="text-sm text-gray-400">مستوى المخاطر</p>
                </div>
              </div>
              {risks.detected_risks?.map((r, i) => (
                <div key={i} className={`rounded-xl p-4 border ${r.severity === 'high' ? 'bg-red-900/20 border-red-700' : 'bg-yellow-900/20 border-yellow-700'}`}>
                  <div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} className={r.severity === 'high' ? 'text-red-400' : 'text-yellow-400'} /><span className="text-white font-semibold">{r.type}</span></div>
                  <p className="text-gray-300">{r.description}</p>
                  <p className="text-purple-300 mt-2 text-sm">💡 {r.recommendation}</p>
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === 'evaluation' && evaluation && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-blue-400">{evaluation.summary?.total_field_visits || 0}</p><p className="text-sm text-gray-400">زيارات ميدانية</p></div>
                <div className="bg-gray-800 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-green-400">{evaluation.summary?.total_lessons || 0}</p><p className="text-sm text-gray-400">دروس مستفادة</p></div>
                <div className="bg-gray-800 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-yellow-400">{evaluation.summary?.total_recommendations || 0}</p><p className="text-sm text-gray-400">توصيات</p></div>
              </div>
              {evaluation.summary?.key_findings?.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">النتائج الرئيسية</h3>
                  {evaluation.summary.key_findings.map((f, i) => <p key={i} className="text-gray-300 py-1">• {f}</p>)}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'actions' && actions && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3">إجراءات تصحيحية مقترحة ({actions.total_suggestions})</h3>
                {actions.suggestions?.map((s, i) => (
                  <div key={i} className={`mb-3 rounded-lg p-3 border ${s.priority === 'high' ? 'border-red-700 bg-red-900/20' : 'border-yellow-700 bg-yellow-900/20'}`}>
                    <div className="flex items-center gap-2 mb-1"><span className={`px-2 py-0.5 rounded text-xs ${s.priority === 'high' ? 'bg-red-800 text-red-200' : 'bg-yellow-800 text-yellow-200'}`}>{s.priority}</span><span className="text-white font-medium">{s.indicator || s.title}</span></div>
                    {s.achievement && <p className="text-gray-400 text-sm mb-1">الإنجاز: {s.achievement}</p>}
                    {s.actions?.map((a, j) => <p key={j} className="text-gray-300 text-sm py-0.5">→ {a}</p>)}
                  </div>
                ))}
                {(!actions.suggestions || actions.suggestions.length === 0) && <p className="text-green-400 text-center py-4">لا توجد إجراءات تصحيحية مطلوبة حالياً - أداء جيد!</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
