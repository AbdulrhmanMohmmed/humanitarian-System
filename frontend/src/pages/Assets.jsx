import { useState, useEffect } from 'react';
import { 
  Monitor, Plus, Search, Filter, 
  User, MapPin, Calendar, Clock,
  MoreVertical, Shield, HardDrive, Cpu,
  Smartphone, Briefcase, Trash2, Edit3,
  CheckCircle2, AlertCircle, RotateCcw,
  BarChart3, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';

const AssetsPage = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const { data } = await api.get('/api/logistics/assets');
        setAssets(data);
      } catch (err) {
        console.error('Failed to fetch assets', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const stats = [
    { label: 'إجمالي الأصول', value: assets.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'قيد الاستخدام', value: assets.filter(a => a.status === 'active').length, icon: User, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'بانتظار الصيانة', value: assets.filter(a => a.status === 'in_repair').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'إجمالي القيمة', value: '$' + assets.reduce((acc, curr) => acc + (curr.purchase_cost || 0), 0).toLocaleString(), icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const filteredAssets = activeTab === 'all' ? assets : assets.filter(a => a.status === activeTab);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg">
              <Monitor size={24} />
            </div>
            إدارة الأصول والمعدات
          </h1>
          <p className="text-slate-500 font-bold mt-1 text-sm">تتبع الأصول الثابتة، العهد الشخصية، وحالة المعدات الميدانية</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute right-4 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث برقم الكود أو السيريال..." 
              className="h-11 pr-11 pl-4 rounded-2xl bg-white border border-slate-200 text-sm font-bold focus:ring-2 ring-blue-500/20 w-64"
            />
          </div>
          <button className="h-11 px-6 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20">
            <Plus size={18} />
            إضافة أصل جديد
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={cn('p-3 rounded-2xl', stat.bg)}>
                <stat.icon className={cn('w-6 h-6', stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                <p className="text-xs font-bold text-slate-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
          {['all', 'active', 'in_repair', 'stored'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-5 py-2 rounded-xl text-xs font-black transition-all',
                activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab === 'all' && 'الكل'}
              {tab === 'active' && 'قيد الاستخدام'}
              {tab === 'in_repair' && 'تحت الصيانة'}
              {tab === 'stored' && 'في المخزن'}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
             [1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl" />)
          ) : filteredAssets.length > 0 ? (
            filteredAssets.map((asset) => (
              <motion.div
                key={asset.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {asset.category?.toLowerCase().includes('laptop') ? <Cpu size={24} /> : 
                       asset.category?.toLowerCase().includes('mobile') ? <Smartphone size={24} /> : 
                       <HardDrive size={24} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{asset.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{asset.code}</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-slate-600"><MoreVertical size={18} /></button>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                           <User size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">العهدة: {asset.assigned_to_id ? 'مستخدم ' + asset.assigned_to_id : 'غير محدد'}</span>
                      </div>
                      <span className={cn('text-[10px] font-black px-2 py-1 rounded-lg', 
                        asset.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 
                        asset.status === 'in_repair' ? 'bg-orange-100 text-orange-600' : 
                        'bg-slate-100 text-slate-400'
                      )}>
                        {asset.status}
                      </span>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><MapPin size={10} /> الموقع</span>
                        <span className="text-xs font-black text-slate-700">{asset.location || 'غير محدد'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Calendar size={10} /> تاريخ الشراء</span>
                        <span className="text-xs font-black text-slate-700">{asset.purchase_date || 'غير متوفر'}</span>
                      </div>
                   </div>

                   <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex -space-x-2">
                         {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
                      </div>
                      <button className="text-xs font-black text-blue-600 hover:underline">سجل الحركة</button>
                   </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
               <Package className="mx-auto w-12 h-12 text-slate-200 mb-4" />
               <p className="text-slate-400 font-bold">لا يوجد أصول مسجلة حالياً</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AssetsPage;
