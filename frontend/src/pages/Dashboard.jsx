import { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import {
  Users, FolderKanban, UserCog, Wallet, Receipt,
  Package, Banknote, Clock, AlertTriangle, ClipboardList
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [beneficiaryData, setBeneficiaryData] = useState([]);
  const [projectData, setProjectData] = useState(null);
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/beneficiaries/by-governorate'),
      api.get('/projects/stats'),
      api.get('/dashboard/recent-activities'),
    ]).then(([s, b, p, r]) => {
      setStats(s.data);
      setBeneficiaryData(b.data);
      setProjectData(p.data);
      setRecent(r.data);
    });
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">جاري التحميل...</div></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">لوحة المعلومات</h1>
        <p className="text-gray-500 text-sm mt-1">نظرة عامة على أنشطة المنظمة</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="المستفيدين" value={stats.total_beneficiaries} icon={Users} color="blue" />
        <StatCard title="المشاريع النشطة" value={stats.active_projects} icon={FolderKanban} color="green" />
        <StatCard title="الموظفين" value={stats.total_employees} icon={UserCog} color="purple" />
        <StatCard title="إجمالي المنح ($)" value={stats.total_grants.toLocaleString()} icon={Wallet} color="orange" />
        <StatCard title="إجمالي المصروفات ($)" value={stats.total_spent.toLocaleString()} icon={Receipt} color="red" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="التوزيعات" value={stats.total_distributions} icon={Package} color="teal" />
        <StatCard title="التحويلات النقدية" value={stats.total_cash_transfers.toLocaleString()} icon={Banknote} color="indigo" sub="ريال يمني" />
        <StatCard title="إجازات معلقة" value={stats.pending_leaves} icon={Clock} color="amber" />
        <StatCard title="مواد منخفضة المخزون" value={stats.low_stock_items} icon={AlertTriangle} color="red" />
        <StatCard title="استبيانات نشطة" value={stats.active_surveys} icon={ClipboardList} color="cyan" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Beneficiaries by Governorate */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">المستفيدين حسب المحافظة</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={beneficiaryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="governorate" type="category" width={80} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Projects by Sector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">المشاريع حسب القطاع</h3>
          {projectData?.by_sector && (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectData.by_sector}
                  dataKey="count"
                  nameKey="sector"
                  cx="50%" cy="50%"
                  outerRadius={100}
                  label={({ sector, count }) => `${sector}: ${count}`}
                >
                  {projectData.by_sector.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">آخر المستفيدين المسجلين</h3>
          <div className="space-y-3">
            {recent?.recent_beneficiaries?.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.governorate}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(b.date).toLocaleDateString('ar')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">آخر المشاريع</h3>
          <div className="space-y-3">
            {recent?.recent_projects?.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>{p.status === 'active' ? 'نشط' : p.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">آخر المعاملات المالية</h3>
          <div className="space-y-3">
            {recent?.recent_transactions?.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-gray-400">${t.amount?.toLocaleString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>{t.type === 'income' ? 'إيراد' : 'مصروف'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
