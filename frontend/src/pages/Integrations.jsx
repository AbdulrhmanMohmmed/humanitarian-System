import { useState, useEffect } from 'react';
import { Plug, Download, Database, Globe, FileDown, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function Integrations() {
  const [status, setStatus] = useState(null);
  const [projects, setProjects] = useState([]);
  const [exportResult, setExportResult] = useState(null);
  const [exportType, setExportType] = useState('');

  useEffect(() => {
    api.get('/integrations/status').then(r => setStatus(r.data)).catch(() => {});
    api.get('/projects/').then(r => setProjects(r.data.projects || r.data || [])).catch(() => {});
  }, []);

  const exportData = async (type, projectId) => {
    try {
      let res;
      if (type === 'power-bi') res = await api.get(`/integrations/power-bi/dataset/${projectId}`);
      else if (type === 'activity-info') res = await api.get(`/integrations/activity-info/export/${projectId}`);
      else if (type === 'ocha-3w') res = await api.get('/integrations/ocha-3w/export');
      else if (type.startsWith('csv-')) res = await api.get(`/integrations/csv-export/${type.replace('csv-', '')}?project_id=${projectId || ''}`);
      setExportResult(res?.data);
      setExportType(type);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Plug className="text-blue-600" size={32} />
            أنابيب البيانات (Data Pipelines)
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">نظام تكامل مركزي لربط البيانات مع (KoBo, PowerBI, ActivityInfo) ومزامنتها بضغطة زر.</p>
        </div>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {status.integrations?.map((intg, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 border-t-4 border-t-emerald-500 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-black text-slate-800">{intg.name}</span>
                <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg"><CheckCircle size={18} /></div>
              </div>
              <p className="text-xs font-mono bg-slate-100 text-slate-600 p-2 rounded-lg mb-4 truncate" title={intg.endpoint}>{intg.endpoint}</p>
              <div className="space-y-2">
                {intg.features?.map((f, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-slate-200/60">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3"><Database className="text-indigo-500" size={20} /> تصدير مخصص حسب المشروع</h2>
          {projects.map(p => (
            <div key={p.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-3 hover:shadow-md transition">
              <p className="font-bold text-slate-700 mb-3">{p.name}</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => exportData('power-bi', p.id)} className="bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-sm transition">Power BI Sync</button>
                <button onClick={() => exportData('activity-info', p.id)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-sm transition">ActivityInfo</button>
                <button onClick={() => exportData('csv-indicators', p.id)} className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-sm transition">مؤشرات CSV</button>
                <button onClick={() => exportData('csv-complaints', p.id)} className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-sm transition">شكاوى CSV</button>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-200/60">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3"><Globe className="text-blue-500" size={20} /> تصدير مجمع (Global Export)</h2>
          <div className="space-y-4">
            <button onClick={() => exportData('ocha-3w')} className="w-full bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition rounded-xl p-5 text-right group flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800 group-hover:text-blue-700 transition">تقرير OCHA 3W</p>
                <p className="text-slate-500 text-sm mt-1 font-medium">من، ماذا، أين - تقرير مجمع لجميع المشاريع</p>
              </div>
              <FileDown className="text-slate-400 group-hover:text-blue-500 transition" />
            </button>
            <button onClick={() => exportData('csv-beneficiaries')} className="w-full bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 transition rounded-xl p-5 text-right group flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800 group-hover:text-emerald-700 transition">تصدير المستفيدين الشامل (CSV)</p>
                <p className="text-slate-500 text-sm mt-1 font-medium">قاعدة بيانات جميع المستفيدين المسجلين</p>
              </div>
              <FileDown className="text-slate-400 group-hover:text-emerald-500 transition" />
            </button>
          </div>
        </div>
      </div>

      {exportResult && (
        <div className="glass-card rounded-2xl p-6 border border-emerald-200 bg-emerald-50/30">
          <h2 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2"><FileDown size={20} /> نجح التصدير ({exportType})</h2>
          <pre className="bg-slate-900 rounded-xl p-5 text-emerald-400 text-xs overflow-x-auto max-h-96 overflow-y-auto shadow-inner">{JSON.stringify(exportResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
