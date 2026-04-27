import { useState } from 'react';
import api from '../services/api';
import { Calculator, BarChart3, Target } from 'lucide-react';

export default function EvaluationTools() {
  const [tab, setTab] = useState('sample');
  const [population, setPopulation] = useState(1000);
  const [confidence, setConfidence] = useState(95);
  const [marginError, setMarginError] = useState(5);
  const [sampleResult, setSampleResult] = useState(null);

  const calculateSample = async () => {
    const r = await api.get(`/analytics/sample-calculator?population=${population}&confidence=${confidence}&margin_error=${marginError}`);
    setSampleResult(r.data);
  };

  const tabs = [
    { key: 'sample', label: 'حاسبة حجم العينة', icon: Calculator },
    { key: 'baseline', label: 'خط الأساس والنهاية', icon: BarChart3 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">أدوات التقييم</h1>
          <p className="text-sm text-gray-500 mt-1">حاسبة العينات ومقارنة خط الأساس والنهاية</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'sample' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Calculator size={20} className="text-blue-600" /> حاسبة حجم العينة</h3>
            <p className="text-sm text-gray-500 mb-4">استخدم صيغة كوكران (Cochran) المعدلة لحساب حجم العينة المطلوب للمسوح والتقييمات</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حجم السكان الكلي (N)</label>
                <input type="number" value={population} onChange={e => setPopulation(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مستوى الثقة (%)</label>
                <select value={confidence} onChange={e => setConfidence(parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value={90}>90%</option>
                  <option value={95}>95%</option>
                  <option value={99}>99%</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">هامش الخطأ (%)</label>
                <input type="number" step="0.5" min="0.5" max="20" value={marginError} onChange={e => setMarginError(parseFloat(e.target.value) || 5)} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={calculateSample} className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">حساب حجم العينة</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">النتيجة</h3>
            {sampleResult ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-2">حجم العينة المطلوب</p>
                  <p className="text-6xl font-bold text-blue-600">{sampleResult.sample_size}</p>
                  <p className="text-sm text-gray-400 mt-2">من أصل {sampleResult.population.toLocaleString()} شخص</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">حجم السكان الكلي:</span><span className="font-medium">{sampleResult.population.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">مستوى الثقة:</span><span className="font-medium">{sampleResult.confidence_level}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">هامش الخطأ:</span><span className="font-medium">±{sampleResult.margin_of_error}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">نسبة العينة:</span><span className="font-medium">{(sampleResult.sample_size / sampleResult.population * 100).toFixed(1)}%</span></div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                  <p className="font-bold mb-1">الصيغة المستخدمة:</p>
                  <p>{sampleResult.formula}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Target size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400">أدخل القيم واضغط "حساب" لعرض النتيجة</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'baseline' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-blue-600" /> مقارنة خط الأساس وخط النهاية</h3>
          <p className="text-sm text-gray-500 mb-6">يتم عرض المقارنة بناءً على بيانات المؤشرات المسجلة في نظام المتابعة. قم بتسجيل قياسات المؤشرات أولاً من صفحة المتابعة.</p>

          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <BarChart3 size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">عرض مقارنة الأداء بين خط الأساس وخط النهاية</p>
            <p className="text-sm text-gray-400">يتم استخراج البيانات من قياسات المؤشرات المسجلة في صفحة المتابعة</p>
            <p className="text-sm text-gray-400 mt-2">قم بتسجيل مؤشرات في صفحة المتابعة مع قيم البداية والنهاية لعرض المقارنة</p>
          </div>
        </div>
      )}
    </div>
  );
}
