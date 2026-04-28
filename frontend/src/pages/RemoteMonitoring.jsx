import { useState, useEffect } from 'react';
import { Phone, Shield, MapPin, Radio, Plus, Eye } from 'lucide-react';
import api from '../services/api';

export default function RemoteMonitoring() {
  const [dashboard, setDashboard] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [checks, setChecks] = useState([]);
  const [showNewSurvey, setShowNewSurvey] = useState(false);
  const [form, setForm] = useState({ title: '', phone_number: '', governorate: '', survey_type: 'pdm', consent_given: false });

  useEffect(() => {
    api.get('/remote-monitoring/dashboard').then(r => setDashboard(r.data)).catch(() => {});
    api.get('/remote-monitoring/phone-surveys').then(r => setSurveys(r.data || [])).catch(() => {});
    api.get('/remote-monitoring/third-party-checks').then(r => setChecks(r.data || [])).catch(() => {});
  }, []);

  const createSurvey = async () => {
    try {
      await api.post('/remote-monitoring/phone-survey', form);
      setShowNewSurvey(false);
      setForm({ title: '', phone_number: '', governorate: '', survey_type: 'pdm', consent_given: false });
      api.get('/remote-monitoring/phone-surveys').then(r => setSurveys(r.data || []));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Radio size={28} /> المراقبة عن بُعد</h1>
        <button onClick={() => setShowNewSurvey(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white"><Plus size={16} /> مسح هاتفي جديد</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 text-center"><Phone size={24} className="mx-auto mb-2 text-blue-400" /><p className="text-2xl font-bold text-white">{dashboard?.phone_surveys?.total || 0}</p><p className="text-gray-400 text-sm">مسوح هاتفية</p></div>
        <div className="bg-gray-800 rounded-xl p-4 text-center"><Eye size={24} className="mx-auto mb-2 text-green-400" /><p className="text-2xl font-bold text-white">{dashboard?.phone_surveys?.completed || 0}</p><p className="text-gray-400 text-sm">مكتملة</p></div>
        <div className="bg-gray-800 rounded-xl p-4 text-center"><Shield size={24} className="mx-auto mb-2 text-yellow-400" /><p className="text-2xl font-bold text-white">{dashboard?.third_party_checks?.total || 0}</p><p className="text-gray-400 text-sm">فحوص طرف ثالث</p></div>
        <div className="bg-gray-800 rounded-xl p-4 text-center"><MapPin size={24} className="mx-auto mb-2 text-purple-400" /><p className="text-2xl font-bold text-white">{dashboard?.phone_surveys?.scheduled || 0}</p><p className="text-gray-400 text-sm">مجدولة</p></div>
      </div>

      {showNewSurvey && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">مسح هاتفي جديد</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="bg-gray-700 text-white rounded-lg px-4 py-2" placeholder="عنوان المسح" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input className="bg-gray-700 text-white rounded-lg px-4 py-2" placeholder="رقم الهاتف" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} />
            <input className="bg-gray-700 text-white rounded-lg px-4 py-2" placeholder="المحافظة" value={form.governorate} onChange={e => setForm({ ...form, governorate: e.target.value })} />
            <select className="bg-gray-700 text-white rounded-lg px-4 py-2" value={form.survey_type} onChange={e => setForm({ ...form, survey_type: e.target.value })}>
              <option value="pdm">PDM - متابعة ما بعد التوزيع</option>
              <option value="verification">تحقق من الاستلام</option>
              <option value="satisfaction">رضا المستفيدين</option>
              <option value="protection">فحص حماية</option>
            </select>
            <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={form.consent_given} onChange={e => setForm({ ...form, consent_given: e.target.checked })} /> تم الحصول على موافقة المستفيد</label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={createSurvey} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-white">حفظ</button>
            <button onClick={() => setShowNewSurvey(false)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white">إلغاء</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">المسوح الهاتفية</h2>
          {surveys.length === 0 ? <p className="text-gray-400 text-center py-4">لا توجد مسوح بعد</p> : (
            <div className="space-y-3">{surveys.map(s => (
              <div key={s.id} className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between"><span className="text-white font-medium">{s.title}</span><span className={`px-2 py-0.5 rounded text-xs ${s.status === 'completed' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{s.status}</span></div>
                <p className="text-gray-400 text-sm mt-1">{s.governorate} • {s.survey_type} • {s.phone_number}</p>
              </div>
            ))}</div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">طرق المراقبة المتاحة</h2>
          {dashboard?.methods?.map((m, i) => (
            <div key={i} className="bg-gray-700 rounded-lg p-3 mb-2">
              <p className="text-white font-medium">{m.name}</p>
              <p className="text-gray-400 text-sm">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
