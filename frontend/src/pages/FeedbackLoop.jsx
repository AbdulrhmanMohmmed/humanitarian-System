import { useState, useEffect } from 'react';
import { MessageCircle, ArrowRightLeft, Users, CheckCircle, Plus, BarChart3 } from 'lucide-react';
import api from '../services/api';

export default function FeedbackLoop() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [actions, setActions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showNewAction, setShowNewAction] = useState(false);
  const [form, setForm] = useState({ feedback_summary: '', action_taken: '', change_made: '', communicated_to_community: false, communication_method: '' });

  useEffect(() => { api.get('/projects/').then(r => setProjects(r.data.projects || r.data || [])); }, []);

  const loadData = (pid) => {
    setSelectedProject(pid);
    if (!pid) return;
    api.get(`/feedback-loop/dashboard/${pid}`).then(r => setDashboard(r.data)).catch(() => {});
    api.get(`/feedback-loop/actions?project_id=${pid}`).then(r => setActions(r.data || [])).catch(() => {});
    api.get(`/feedback-loop/community-sessions?project_id=${pid}`).then(r => setSessions(r.data || [])).catch(() => {});
  };

  const createAction = async () => {
    try {
      await api.post('/feedback-loop/action', { ...form, project_id: parseInt(selectedProject) });
      setShowNewAction(false);
      setForm({ feedback_summary: '', action_taken: '', change_made: '', communicated_to_community: false, communication_method: '' });
      loadData(selectedProject);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ArrowRightLeft size={28} /> حلقة التغذية الراجعة</h1>
        <div className="flex gap-2">
          <select className="bg-gray-700 text-white rounded-lg px-4 py-2" value={selectedProject} onChange={e => loadData(e.target.value)}>
            <option value="">اختر المشروع</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {selectedProject && <button onClick={() => setShowNewAction(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white"><Plus size={16} /> إجراء جديد</button>}
        </div>
      </div>

      {!selectedProject && <div className="bg-gray-800 rounded-xl p-12 text-center text-gray-400"><ArrowRightLeft size={64} className="mx-auto mb-4 opacity-30" /><p>اختر مشروعاً لعرض حلقة التغذية الراجعة</p></div>}

      {selectedProject && dashboard && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center"><MessageCircle size={24} className="mx-auto mb-2 text-blue-400" /><p className="text-2xl font-bold text-white">{dashboard.feedback_received}</p><p className="text-gray-400 text-sm">ملاحظات مستلمة</p></div>
            <div className="bg-gray-800 rounded-xl p-4 text-center"><CheckCircle size={24} className="mx-auto mb-2 text-green-400" /><p className="text-2xl font-bold text-white">{dashboard.actions_taken}</p><p className="text-gray-400 text-sm">إجراءات متخذة</p></div>
            <div className="bg-gray-800 rounded-xl p-4 text-center"><Users size={24} className="mx-auto mb-2 text-yellow-400" /><p className="text-2xl font-bold text-white">{dashboard.communicated_back}</p><p className="text-gray-400 text-sm">أُبلغ المجتمع</p></div>
            <div className="bg-gray-800 rounded-xl p-4 text-center"><BarChart3 size={24} className="mx-auto mb-2 text-purple-400" /><p className="text-2xl font-bold text-white">{dashboard.loop_closure_rate}%</p><p className="text-gray-400 text-sm">نسبة إغلاق الحلقة</p></div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">مراحل الحلقة المغلقة</h2>
            <div className="flex items-center justify-between gap-2 overflow-x-auto">
              {dashboard.loop_stages?.map((stage, i) => (
                <div key={i} className="flex-1 min-w-0">
                  <div className={`rounded-lg p-3 text-center border ${stage.status === 'active' ? 'border-green-600 bg-green-900/20' : 'border-gray-600 bg-gray-700'}`}>
                    <p className="text-2xl font-bold text-white">{stage.count}</p>
                    <p className="text-xs text-gray-300 truncate">{stage.stage}</p>
                  </div>
                  {i < (dashboard.loop_stages?.length || 0) - 1 && <div className="text-center text-gray-500 my-1">→</div>}
                </div>
              ))}
            </div>
          </div>

          {showNewAction && (
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">إجراء جديد بناءً على الملاحظات</h2>
              <div className="space-y-3">
                <textarea className="w-full bg-gray-700 text-white rounded-lg px-4 py-2" placeholder="ملخص الملاحظة" rows={2} value={form.feedback_summary} onChange={e => setForm({ ...form, feedback_summary: e.target.value })} />
                <textarea className="w-full bg-gray-700 text-white rounded-lg px-4 py-2" placeholder="الإجراء المتخذ" rows={2} value={form.action_taken} onChange={e => setForm({ ...form, action_taken: e.target.value })} />
                <input className="w-full bg-gray-700 text-white rounded-lg px-4 py-2" placeholder="التغيير الذي تم" value={form.change_made} onChange={e => setForm({ ...form, change_made: e.target.value })} />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={form.communicated_to_community} onChange={e => setForm({ ...form, communicated_to_community: e.target.checked })} /> تم إبلاغ المجتمع</label>
                  {form.communicated_to_community && <input className="bg-gray-700 text-white rounded-lg px-4 py-2 flex-1" placeholder="طريقة الإبلاغ" value={form.communication_method} onChange={e => setForm({ ...form, communication_method: e.target.value })} />}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={createAction} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-white">حفظ</button>
                <button onClick={() => setShowNewAction(false)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white">إلغاء</button>
              </div>
            </div>
          )}

          {actions.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">الإجراءات المتخذة</h2>
              <div className="space-y-3">{actions.map(a => (
                <div key={a.id} className="bg-gray-700 rounded-lg p-4">
                  <p className="text-white font-medium">{a.feedback_summary}</p>
                  <p className="text-gray-300 text-sm mt-1">الإجراء: {a.action_taken}</p>
                  {a.communicated_to_community && <span className="inline-block mt-2 px-2 py-0.5 bg-green-900 text-green-300 rounded text-xs">تم إبلاغ المجتمع</span>}
                </div>
              ))}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
