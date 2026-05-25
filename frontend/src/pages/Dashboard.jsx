import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Gauge,
  MapPin,
  MessageSquare,
  Package,
  Users,
  Zap,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../services/api';
import ActionCenter from '../components/ActionCenter';

const EMPTY_TREND = [
  { name: 'Jan', value: 0 },
  { name: 'Feb', value: 0 },
  { name: 'Mar', value: 0 },
];

const riskColor = {
  low: 'text-emerald-600 bg-emerald-50',
  medium: 'text-amber-600 bg-amber-50',
  high: 'text-orange-600 bg-orange-50',
  critical: 'text-rose-600 bg-rose-50',
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({});
  const [accountability, setAccountability] = useState({});
  const [cash, setCash] = useState({});
  const [inventory, setInventory] = useState({});
  const [risk, setRisk] = useState({ alerts: [] });
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [visits, setVisits] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [geo, setGeo] = useState({ beneficiaries_by_governorate: [] });
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    const calls = [
      api.get('/analytics/overview').then((r) => setOverview(r.data)).catch(() => {}),
      api.get('/accountability/stats').then((r) => setAccountability(r.data)).catch(() => {}),
      api.get('/cash/transfers/stats').then((r) => setCash(r.data)).catch(() => {}),
      api.get('/inventory/items/stats').then((r) => setInventory(r.data)).catch(() => {}),
      api.get('/analytics/risk-overview').then((r) => setRisk(r.data)).catch(() => {}),
      api.get('/projects/').then((r) => setProjects(Array.isArray(r.data) ? r.data : r.data.items || [])).catch(() => {}),
      api.get('/activities/').then((r) => setActivities(Array.isArray(r.data) ? r.data : r.data.items || [])).catch(() => {}),
      api.get('/field-visits/').then((r) => setVisits(Array.isArray(r.data) ? r.data : r.data.items || [])).catch(() => {}),
      api.get('/monitoring/indicators').then((r) => setIndicators(Array.isArray(r.data) ? r.data : r.data.items || [])).catch(() => {}),
      api.get('/analytics/geographic').then((r) => setGeo(r.data)).catch(() => {}),
      api.get('/analytics/trends').then((r) => {
        const trends = r.data?.trends || [];
        const points = trends.flatMap(t => (t.data_points || []).map(dp => ({ name: dp.date, value: dp.value })));
        setTrend(points.slice(-12));
      }).catch(() => {}),
    ];
    Promise.allSettled(calls).finally(() => setLoading(false));
  }, []);

  const indicatorRate = useMemo(() => {
    if (!Array.isArray(indicators) || !indicators.length) return 0;
    const achieved = indicators.filter((item) => Number(item.actual_value || 0) >= Number(item.target_value || 0) && Number(item.target_value || 0) > 0).length;
    return Math.round((achieved / indicators.length) * 100);
  }, [indicators]);

  const executionRate = useMemo(() => {
    if (!Array.isArray(activities) || !activities.length) return 0;
    const avg = activities.reduce((sum, item) => sum + Number(item.progress || 0), 0) / activities.length;
    return Math.round(avg);
  }, [activities]);

  const geoChart = (geo.beneficiaries_by_governorate || []).slice(0, 8).map((item) => ({
    name: item.governorate,
    value: item.count,
  }));

  const cards = [
    { label: 'المستفيدون', value: Number(overview.total_beneficiaries || 0).toLocaleString(), icon: Users, color: 'text-blue-600', hint: 'مسجلون في النظام' },
    { label: 'المشاريع النشطة', value: overview.active_projects || 0, icon: Briefcase, color: 'text-indigo-600', hint: `${overview.total_projects || 0} مشروع إجمالي` },
    { label: 'استخدام الميزانية', value: `${overview.budget_utilization || 0}%`, icon: Banknote, color: 'text-emerald-600', hint: `${Number(overview.total_spent || 0).toLocaleString()} مصروف` },
    { label: 'إنجاز الأنشطة', value: `${executionRate}%`, icon: Zap, color: 'text-amber-500', hint: `${activities.length} نشاط` },
    { label: 'تحقق المؤشرات', value: `${indicatorRate}%`, icon: BarChart3, color: 'text-cyan-600', hint: `${indicators.length} مؤشر` },
    { label: 'الشكاوى المفتوحة', value: (accountability.total || 0) - (accountability.resolved || 0) - (accountability.closed || 0), icon: MessageSquare, color: 'text-rose-600', hint: `${accountability.overdue || 0} متأخرة` },
    { label: 'التحويلات النقدية', value: Number(cash.total_amount || 0).toLocaleString(), icon: Banknote, color: 'text-green-600', hint: `${cash.pending_count || 0} قيد الانتظار` },
    { label: 'المخزون', value: inventory.total_items || 0, icon: Package, color: 'text-purple-600', hint: `${inventory.low_stock || 0} منخفض` },
  ];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
            <Gauge size={14} />
            Executive Operations Dashboard
          </div>
          <h1 className="text-5xl font-black tracking-tight text-[var(--text-primary)]">لوحة القيادة التنفيذية</h1>
          <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">
            صورة حية من المشاريع، المستفيدين، التنفيذ، المؤشرات، المالية، الشكاوى، والمخزون.
          </p>
        </div>
        <div className={`rounded-2xl px-5 py-4 ${riskColor[risk.risk_level] || riskColor.low}`}>
          <p className="text-[10px] font-black uppercase tracking-widest">Global Risk Index</p>
          <p className="text-2xl font-black">{risk.global_risk_index ?? 10} / 100</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="min-h-[520px] lg:col-span-1">
          <ActionCenter />
        </div>

        <div className="space-y-6 lg:col-span-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className="card-elite group p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className={`rounded-xl bg-slate-100 p-2 ${card.color}`}><card.icon size={20} /></div>
                  <ArrowUpRight className="text-slate-300 transition-colors group-hover:text-blue-600" size={16} />
                </div>
                <h4 className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</h4>
                <div className="text-3xl font-black">{loading ? '...' : card.value}</div>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{card.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="card-elite p-6 xl:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black">تحليلات الوصول حسب المحافظة</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">توزيع المستفيدين جغرافيا</p>
                </div>
                <MapPin className="text-blue-600" />
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geoChart.length ? geoChart : EMPTY_TREND}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-elite p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><AlertTriangle size={18} className="text-rose-600" /> تنبيهات المخاطر</h3>
              <div className="space-y-3">
                {(risk.alerts || []).slice(0, 5).map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700">{alert.type}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-rose-600">{alert.level}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500">{alert.msg}</p>
                  </div>
                ))}
                {(!risk.alerts || risk.alerts.length === 0) && (
                  <div className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                    لا توجد تنبيهات عالية حاليا.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="card-elite p-6">
              <h3 className="mb-4 flex items-center gap-2 font-black"><ClipboardList size={18} className="text-blue-600" /> التنفيذ اليومي</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>أنشطة نشطة</span><b>{activities.filter((a) => a.status === 'active').length}</b></div>
                <div className="flex justify-between"><span>زيارات مكتملة</span><b>{visits.filter((v) => v.status === 'completed').length}</b></div>
                <div className="flex justify-between"><span>أنشطة مكتملة</span><b>{activities.filter((a) => a.status === 'completed').length}</b></div>
              </div>
            </div>
            <div className="card-elite p-6">
              <h3 className="mb-4 flex items-center gap-2 font-black"><CheckCircle2 size={18} className="text-emerald-600" /> جودة المساءلة</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>معدل الرضا</span><b>{accountability.satisfaction_rate || 0}%</b></div>
                <div className="flex justify-between"><span>حالات حساسة</span><b>{accountability.sensitive || 0}</b></div>
                <div className="flex justify-between"><span>مغلقة</span><b>{accountability.closed || 0}</b></div>
              </div>
            </div>
            <div className="card-elite p-6">
              <h3 className="mb-4 flex items-center gap-2 font-black"><Calendar size={18} className="text-indigo-600" /> اتجاه الوصول</h3>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend.length ? trend : EMPTY_TREND}>
                    <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fill="#4f46e5" fillOpacity={0.12} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card-elite p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><Activity size={18} className="text-blue-600" /> آخر المشاريع</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {projects.slice(0, 6).map((project) => (
                <div key={project.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-black text-slate-800">{project.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{project.sector || 'متعدد القطاعات'} - {project.governorate || 'غير محدد'}</p>
                  <div className="mt-3 h-2 rounded-full bg-white">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, project.budget ? (project.spent / project.budget) * 100 : 0)}%` }} />
                  </div>
                </div>
              ))}
              {projects.length === 0 && <p className="text-sm font-bold text-slate-400">لا توجد مشاريع بعد.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
