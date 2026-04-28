import { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Search, Filter } from 'lucide-react';

const ACTION_LABELS = { create: 'إنشاء', update: 'تعديل', delete: 'حذف', login: 'دخول', export: 'تصدير', status_change: 'تغيير حالة' };
const ACTION_COLORS = { create: 'bg-green-100 text-green-700', update: 'bg-blue-100 text-blue-700', delete: 'bg-red-100 text-red-700', login: 'bg-gray-100 text-gray-700', export: 'bg-purple-100 text-purple-700', status_change: 'bg-yellow-100 text-yellow-700' };

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ action: '', entity_type: '' });

  const load = () => {
    const params = {};
    if (filters.action) params.action = filters.action;
    if (filters.entity_type) params.entity_type = filters.entity_type;
    api.get('/audit/', { params }).then(r => setLogs(r.data.logs || []));
    api.get('/audit/summary').then(r => setSummary(r.data));
  };
  useEffect(load, []);

  const search = () => load();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText /> سجل التدقيق</h1>
          <p className="text-sm text-gray-500 mt-1">تتبع جميع العمليات والتغييرات في النظام</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-6 gap-3 mb-6">
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <div key={key} className={`rounded-xl p-3 border text-center ${ACTION_COLORS[key]}`}>
              <p className="text-xs">{label}</p>
              <p className="text-xl font-bold">{summary.by_action?.[key] || 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <select value={filters.action} onChange={e => setFilters({...filters, action: e.target.value})} className="border rounded-lg px-3 py-2">
          <option value="">كل الإجراءات</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="text" placeholder="نوع الكيان" value={filters.entity_type} onChange={e => setFilters({...filters, entity_type: e.target.value})} className="border rounded-lg px-3 py-2 w-48" />
        <button onClick={search} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"><Search size={16} /> بحث</button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">المستخدم</th>
              <th className="px-4 py-3 text-right">الإجراء</th>
              <th className="px-4 py-3 text-right">الكيان</th>
              <th className="px-4 py-3 text-right">الوصف</th>
              <th className="px-4 py-3 text-right">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 text-xs">{log.created_at ? new Date(log.created_at).toLocaleString('ar') : '-'}</td>
                <td className="px-4 py-3">{log.username || `مستخدم #${log.user_id}`}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${ACTION_COLORS[log.action] || ''}`}>{ACTION_LABELS[log.action] || log.action}</span></td>
                <td className="px-4 py-3 font-mono text-xs">{log.entity_type} #{log.entity_id}</td>
                <td className="px-4 py-3 text-xs max-w-xs truncate">{log.description || '-'}</td>
                <td className="px-4 py-3 text-xs font-mono">{log.ip_address || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-center py-8 text-gray-400">لا توجد سجلات بعد</p>}
      </div>
    </div>
  );
}
