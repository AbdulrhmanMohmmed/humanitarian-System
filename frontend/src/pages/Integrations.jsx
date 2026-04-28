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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Plug size={28} /> التكامل مع الأنظمة الخارجية</h1>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {status.integrations?.map((intg, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><CheckCircle size={16} className="text-green-400" /><span className="text-white font-semibold">{intg.name}</span></div>
              <p className="text-gray-400 text-sm mb-2">{intg.endpoint}</p>
              <div className="space-y-1">{intg.features?.map((f, j) => <p key={j} className="text-gray-300 text-xs">• {f}</p>)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Database size={18} /> تصدير حسب المشروع</h2>
          {projects.map(p => (
            <div key={p.id} className="bg-gray-700 rounded-lg p-3 mb-2">
              <p className="text-white font-medium mb-2">{p.name}</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => exportData('power-bi', p.id)} className="bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded text-white text-xs">Power BI</button>
                <button onClick={() => exportData('activity-info', p.id)} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-white text-xs">ActivityInfo</button>
                <button onClick={() => exportData('csv-indicators', p.id)} className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-white text-xs">CSV مؤشرات</button>
                <button onClick={() => exportData('csv-complaints', p.id)} className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-white text-xs">CSV شكاوى</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Globe size={18} /> تصدير عام</h2>
          <div className="space-y-3">
            <button onClick={() => exportData('ocha-3w')} className="w-full bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-right">
              <p className="text-white font-medium">تقرير OCHA 3W</p>
              <p className="text-gray-400 text-sm">من، ماذا، أين - لجميع المشاريع</p>
            </button>
            <button onClick={() => exportData('csv-beneficiaries')} className="w-full bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-right">
              <p className="text-white font-medium">تصدير المستفيدين CSV</p>
              <p className="text-gray-400 text-sm">جميع بيانات المستفيدين</p>
            </button>
          </div>
        </div>
      </div>

      {exportResult && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><FileDown size={18} /> نتيجة التصدير ({exportType})</h2>
          <pre className="bg-gray-900 rounded-lg p-4 text-green-400 text-xs overflow-x-auto max-h-96 overflow-y-auto">{JSON.stringify(exportResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
