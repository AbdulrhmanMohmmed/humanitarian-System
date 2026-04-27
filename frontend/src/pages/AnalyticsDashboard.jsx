import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart3, MapPin, TrendingUp, ShieldCheck, Users, Search, AlertTriangle } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [geographic, setGeographic] = useState(null);
  const [trends, setTrends] = useState(null);
  const [fiveW, setFiveW] = useState(null);
  const [dqaHistory, setDqaHistory] = useState([]);
  const [duplicates, setDuplicates] = useState(null);
  const [dqaRunning, setDqaRunning] = useState(false);

  useEffect(() => {
    api.get('/analytics/overview').then(r => setOverview(r.data));
    api.get('/analytics/geographic').then(r => setGeographic(r.data));
    api.get('/analytics/trends').then(r => setTrends(r.data));
    api.get('/analytics/5w').then(r => setFiveW(r.data));
    api.get('/analytics/dqa/history').then(r => setDqaHistory(r.data));
  }, []);

  const runDQA = async () => {
    setDqaRunning(true);
    await api.post('/analytics/dqa', {});
    const r = await api.get('/analytics/dqa/history');
    setDqaHistory(r.data);
    setDqaRunning(false);
  };

  const checkDuplicates = async () => {
    const r = await api.get('/analytics/deduplication');
    setDuplicates(r.data);
  };

  const tabs = [
    { key: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { key: 'geographic', label: 'التحليل الجغرافي', icon: MapPin },
    { key: 'trends', label: 'تحليل الاتجاهات', icon: TrendingUp },
    { key: '5w', label: 'تقرير 5W', icon: Users },
    { key: 'dqa', label: 'جودة البيانات', icon: ShieldCheck },
    { key: 'dedup', label: 'كشف التكرارات', icon: Search },
  ];

  const dqaStatusColors = {
    good: 'bg-green-100 text-green-700',
    acceptable: 'bg-yellow-100 text-yellow-700',
    poor: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };
  const dqaStatusLabels = { good: 'جيد', acceptable: 'مقبول', poor: 'ضعيف', critical: 'حرج' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">التحليلات المتقدمة</h1>
          <p className="text-sm text-gray-500 mt-1">تحليلات جغرافية واتجاهات وجودة البيانات</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && overview && (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'المشاريع', value: overview.total_projects, sub: `${overview.active_projects} نشط`, color: 'blue' },
              { label: 'المستفيدين', value: overview.total_beneficiaries.toLocaleString(), color: 'green' },
              { label: 'النماذج', value: overview.total_forms, sub: `${overview.total_submissions} إرسال`, color: 'purple' },
              { label: 'استخدام الميزانية', value: `${overview.budget_utilization}%`, sub: `$${(overview.total_spent / 1000).toFixed(0)}K / $${(overview.total_budget / 1000).toFixed(0)}K`, color: 'orange' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                <p className={`text-3xl font-bold text-${item.color}-600`}>{item.value}</p>
                {item.sub && <p className="text-xs text-gray-400 mt-1">{item.sub}</p>}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">المؤشرات الرئيسية</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-700 mb-2">المؤشرات المسجلة</p>
                <p className="text-3xl font-bold text-blue-700">{overview.total_indicators}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm text-green-700 mb-2">نسبة تنفيذ الميزانية</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-green-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full" style={{ width: `${Math.min(overview.budget_utilization, 100)}%` }} />
                  </div>
                  <span className="text-lg font-bold text-green-700">{overview.budget_utilization}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Geographic Tab */}
      {tab === 'geographic' && geographic && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20} className="text-blue-600" /> المستفيدين حسب المحافظة</h3>
            {geographic.beneficiaries_by_governorate.length === 0 ? (
              <p className="text-gray-400 text-center py-8">لا توجد بيانات بعد</p>
            ) : (
              <div className="space-y-3">
                {geographic.beneficiaries_by_governorate.map((item, i) => {
                  const max = Math.max(...geographic.beneficiaries_by_governorate.map(g => g.count));
                  const pct = (item.count / max * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.governorate}</span>
                        <span className="text-gray-500 font-medium">{item.count}</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><MapPin size={20} className="text-green-600" /> المشاريع حسب المحافظة</h3>
            {geographic.projects_by_governorate.length === 0 ? (
              <p className="text-gray-400 text-center py-8">لا توجد بيانات بعد</p>
            ) : (
              <div className="space-y-3">
                {geographic.projects_by_governorate.map((item, i) => {
                  const max = Math.max(...geographic.projects_by_governorate.map(g => g.count));
                  const pct = (item.count / max * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.governorate}</span>
                        <span className="text-gray-500 font-medium">{item.count}</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {tab === 'trends' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-blue-600" /> تحليل اتجاهات المؤشرات</h3>
          {!trends?.trends?.length ? (
            <div className="text-center py-12">
              <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400">لا توجد بيانات اتجاهات بعد</p>
              <p className="text-sm text-gray-400 mt-1">قم بتسجيل قياسات للمؤشرات من صفحة المتابعة</p>
            </div>
          ) : (
            <div className="space-y-6">
              {trends.trends.map((trend, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-700">{trend.indicator_name}</h4>
                    <span className="text-sm text-gray-500">الهدف: {trend.target}</span>
                  </div>
                  <div className="flex items-end gap-1 h-20">
                    {trend.data_points.map((dp, j) => {
                      const maxVal = Math.max(...trend.data_points.map(d => d.value), trend.target);
                      const height = maxVal > 0 ? (dp.value / maxVal * 100) : 0;
                      return (
                        <div key={j} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-500">{dp.value}</span>
                          <div className="w-full bg-blue-400 rounded-t" style={{ height: `${height}%`, minHeight: '4px' }} />
                          <span className="text-xs text-gray-400 truncate w-full text-center">{dp.date?.substring(5, 10)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5W Report Tab */}
      {tab === '5w' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">تقرير 5W (من، ماذا، أين، متى، لمن)</h3>
          {!fiveW?.data?.length ? (
            <p className="text-center text-gray-400 py-12">لا توجد بيانات لتقرير 5W</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-right p-3 font-medium text-gray-600">من (Who)</th>
                    <th className="text-right p-3 font-medium text-gray-600">ماذا (What)</th>
                    <th className="text-right p-3 font-medium text-gray-600">أين (Where)</th>
                    <th className="text-right p-3 font-medium text-gray-600">متى (When)</th>
                    <th className="text-right p-3 font-medium text-gray-600">لمن (For Whom)</th>
                    <th className="text-right p-3 font-medium text-gray-600">القطاع</th>
                    <th className="text-right p-3 font-medium text-gray-600">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {fiveW.data.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3">{row.who}</td>
                      <td className="p-3">{row.what}</td>
                      <td className="p-3">{row.where}</td>
                      <td className="p-3">{row.when}</td>
                      <td className="p-3">{row.for_whom}</td>
                      <td className="p-3">{row.sector}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DQA Tab */}
      {tab === 'dqa' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">تقييم جودة البيانات (DQA)</h3>
            <button onClick={runDQA} disabled={dqaRunning} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
              {dqaRunning ? 'جاري التقييم...' : 'تشغيل تقييم جديد'}
            </button>
          </div>
          {dqaHistory.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400">لم يتم إجراء تقييم جودة بيانات بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dqaHistory.map(dqa => (
                <div key={dqa.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${dqaStatusColors[dqa.status] || ''}`}>{dqaStatusLabels[dqa.status] || dqa.status}</span>
                      <span className="text-sm text-gray-400">{dqa.assessment_date}</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-700">{dqa.overall_score}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'الاكتمال', value: `${dqa.complete_records}/${dqa.total_records}`, score: dqa.accuracy_score },
                      { label: 'الدقة', value: `${dqa.accuracy_score}%`, score: dqa.accuracy_score },
                      { label: 'التوقيت', value: `${dqa.timeliness_score}%`, score: dqa.timeliness_score },
                      { label: 'الاتساق', value: `${dqa.consistency_score}%`, score: dqa.consistency_score },
                    ].map((item, j) => (
                      <div key={j} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                        <p className="text-lg font-bold text-gray-700">{item.value}</p>
                        <div className="bg-gray-200 rounded-full h-1.5 mt-2">
                          <div className={`h-1.5 rounded-full ${item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(item.score, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {dqa.findings && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-2">النتائج: {dqa.findings}</p>}
                  {dqa.recommendations && <p className="text-sm text-blue-600 bg-blue-50 rounded-lg p-3">التوصيات: {dqa.recommendations}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deduplication Tab */}
      {tab === 'dedup' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">كشف التسجيلات المكررة</h3>
            <button onClick={checkDuplicates} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">فحص التكرارات</button>
          </div>
          {!duplicates ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400">اضغط "فحص التكرارات" للبحث عن تسجيلات مكررة</p>
            </div>
          ) : duplicates.total_duplicates === 0 ? (
            <div className="bg-green-50 rounded-xl p-12 text-center">
              <ShieldCheck size={48} className="mx-auto text-green-400 mb-4" />
              <p className="text-green-700 font-bold">لا توجد تسجيلات مكررة</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle size={20} className="text-orange-600" />
                <span className="text-orange-700 font-medium">تم العثور على {duplicates.total_duplicates} مجموعة تكرار محتملة</span>
              </div>
              {duplicates.duplicate_groups.map((group, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800">{group.name}</span>
                    <span className="text-sm text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{group.count} تكرارات</span>
                  </div>
                  <p className="text-sm text-gray-500">المحافظة: {group.governorate}</p>
                  <div className="flex gap-2 mt-2">
                    {group.ids.map((id, j) => (
                      <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        معرف: {id} {group.national_ids[j] && `| هوية: ${group.national_ids[j]}`}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
