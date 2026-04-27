import { useState, useEffect } from 'react';
import api from '../services/api';
import { LayoutDashboard, TrendingUp, AlertCircle, DollarSign, Users, Target, Bell } from 'lucide-react';

const LIGHT_COLORS = { green: 'bg-green-500', yellow: 'bg-yellow-500', red: 'bg-red-500' };
const LIGHT_BG = { green: 'bg-green-50 border-green-100', yellow: 'bg-yellow-50 border-yellow-100', red: 'bg-red-50 border-red-100' };
const LIGHT_TEXT = { green: 'text-green-700', yellow: 'text-yellow-700', red: 'text-red-700' };

function TrafficLight({ color }) {
  return (
    <div className="flex gap-1">
      <div className={`w-3 h-3 rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-red-200'}`} />
      <div className={`w-3 h-3 rounded-full ${color === 'yellow' ? 'bg-yellow-500' : 'bg-yellow-200'}`} />
      <div className={`w-3 h-3 rounded-full ${color === 'green' ? 'bg-green-500' : 'bg-green-200'}`} />
    </div>
  );
}

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get('/executive/dashboard').then(r => setData(r.data));
    api.get('/notifications/?unread_only=true').then(r => setNotifications(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-center py-12 text-gray-400">جاري التحميل...</div>;

  const s = data.summary;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">لوحة المعلومات التنفيذية</h1>
          <p className="text-sm text-gray-500 mt-1">نظرة عامة شاملة لأداء المنظمة</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl">
            <Bell size={18} /> <span className="font-medium">{notifications.length} إشعار غير مقروء</span>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className={`rounded-xl p-5 border ${LIGHT_BG[s.budget_light]}`}>
          <div className="flex items-center justify-between mb-2">
            <DollarSign className={LIGHT_TEXT[s.budget_light]} size={20} />
            <TrafficLight color={s.budget_light} />
          </div>
          <p className="text-sm text-gray-600">استخدام الميزانية</p>
          <p className={`text-2xl font-bold ${LIGHT_TEXT[s.budget_light]}`}>{s.budget_utilization}%</p>
          <p className="text-xs text-gray-500 mt-1">${(s.total_spent || 0).toLocaleString()} / ${(s.total_budget || 0).toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-5 border ${LIGHT_BG[s.complaint_light]}`}>
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className={LIGHT_TEXT[s.complaint_light]} size={20} />
            <TrafficLight color={s.complaint_light} />
          </div>
          <p className="text-sm text-gray-600">الشكاوى المفتوحة</p>
          <p className={`text-2xl font-bold ${LIGHT_TEXT[s.complaint_light]}`}>{s.open_complaints}</p>
          <p className="text-xs text-gray-500 mt-1">{s.critical_complaints} حرجة</p>
        </div>
        <div className={`rounded-xl p-5 border ${LIGHT_BG[s.risk_light]}`}>
          <div className="flex items-center justify-between mb-2">
            <Target className={LIGHT_TEXT[s.risk_light]} size={20} />
            <TrafficLight color={s.risk_light} />
          </div>
          <p className="text-sm text-gray-600">المخاطر العالية</p>
          <p className={`text-2xl font-bold ${LIGHT_TEXT[s.risk_light]}`}>{s.high_risks}</p>
          <p className="text-xs text-gray-500 mt-1">{s.total_risks} إجمالي</p>
        </div>
        <div className="rounded-xl p-5 border bg-blue-50 border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-blue-700" size={20} />
          </div>
          <p className="text-sm text-gray-600">المستفيدون</p>
          <p className="text-2xl font-bold text-blue-700">{s.total_beneficiaries?.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{s.total_submissions} استجابة</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-3">المشاريع</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-gray-600">إجمالي</span><span className="font-bold">{s.total_projects}</span></div>
            <div className="flex justify-between"><span className="text-sm text-green-600">نشطة</span><span className="font-bold text-green-600">{s.active_projects}</span></div>
            <div className="flex justify-between"><span className="text-sm text-blue-600">مكتملة</span><span className="font-bold text-blue-600">{s.completed_projects}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-3">جمع البيانات</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-gray-600">النماذج</span><span className="font-bold">{s.total_forms}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">الاستجابات</span><span className="font-bold">{s.total_submissions}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">المؤشرات</span><span className="font-bold">{s.total_indicators}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-3">إدارة المخاطر</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-gray-600">إجمالي المخاطر</span><span className="font-bold">{s.total_risks}</span></div>
            <div className="flex justify-between"><span className="text-sm text-red-600">عالية</span><span className="font-bold text-red-600">{s.high_risks}</span></div>
          </div>
        </div>
      </div>

      {/* Project KPIs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">أداء المشاريع النشطة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-600">المشروع</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">القطاع</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">الميزانية</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">الاستخدام</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">المؤشرات</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">الأداء</th>
              </tr>
            </thead>
            <tbody>
              {data.project_kpis.map(p => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.sector || '-'}</td>
                  <td className="px-4 py-3">${(p.budget || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${LIGHT_COLORS[p.budget_light]}`} style={{ width: `${Math.min(p.budget_utilization, 100)}%` }}></div>
                      </div>
                      <span className="text-xs">{p.budget_utilization}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.indicators_achieved}/{p.indicators_total}</td>
                  <td className="px-4 py-3 text-center">
                    <TrafficLight color={p.indicator_light} />
                  </td>
                </tr>
              ))}
              {data.project_kpis.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">لا توجد مشاريع نشطة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
