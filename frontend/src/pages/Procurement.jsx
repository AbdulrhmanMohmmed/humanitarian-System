import { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Search, Filter, 
  Clock, CheckCircle2, AlertCircle, FileText,
  Users, Truck, ChevronRight, BarChart3,
  DollarSign, Package, ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

const ProcurementPage = () => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/api/procurement/requests');
        setRequests(data);
      } catch (err) {
        console.error('Failed to fetch procurement data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'طلبات نشطة', value: requests.length, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'بانتظار التعميد', value: requests.filter(r => r.status === 'pending_approval').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'أوامر شراء منجزة', value: 12, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'إجمالي المشتريات', value: '$45,200', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <ShoppingBag className="text-blue-600" />
            إدارة المشتريات وسلسلة الإمداد
          </h1>
          <p className="text-slate-500 font-bold mt-1 text-sm">تتبع طلبات الشراء، المناقصات، وأوامر التوريد</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { toast.show('تم فتح خيارات التصفية', 'info'); }} className="h-11 px-6 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Filter size={18} />
            تصفية
          </button>
          <button onClick={() => { toast.show('يرجى ملء بيانات طلب الشراء', 'info'); }} className="h-11 px-6 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20">
            <Plus size={18} />
            طلب شراء جديد
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className={cn('p-3 rounded-2xl', stat.bg)}>
                <stat.icon className={cn('w-6 h-6', stat.color)} />
              </div>
              <span className="text-xs font-black text-slate-400 group-hover:text-blue-600 transition-colors">عرض التفاصيل</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="text-sm font-bold text-slate-500 mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {['requests', 'vendors', 'pos', 'analytics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-black transition-all',
              activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab === 'requests' && 'طلبات الشراء'}
            {tab === 'vendors' && 'الموردين'}
            {tab === 'pos' && 'أوامر الشراء'}
            {tab === 'analytics' && 'التحليلات'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : requests.length > 0 ? (
            requests.map((request) => (
              <div key={request.id} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 transition-all flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                      {request.request_number}
                    </span>
                    <span className={cn('text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md', 
                      request.status === 'draft' ? 'bg-slate-100 text-slate-500' : 
                      request.status === 'pending_approval' ? 'bg-orange-100 text-orange-600' : 
                      'bg-emerald-100 text-emerald-600'
                    )}>
                      {request.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 truncate">{request.title}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <DollarSign size={12} />
                      التكلفة التقديرية: {request.estimated_cost} {request.currency}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(request.created_at).toLocaleDateString('ar-YE')}
                    </span>
                  </div>
                </div>
                <button className="p-2 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100">
                  <ChevronRight size={20} />
                </button>
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <Package className="mx-auto w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">لا يوجد طلبات شراء حالياً</p>
              <button onClick={() => { toast.show('يرجى ملء بيانات طلب الشراء الأول', 'info'); }} className="mt-4 text-blue-600 font-black text-sm hover:underline">أنشئ أول طلب شراء</button>
            </div>
          )}
        </div>

        {/* Right Panel: Active RFQs / Vendor Performance */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
            <h4 className="font-black mb-4 flex items-center gap-2">
              <Truck size={20} className="text-blue-400" />
              نشاط التوريد
            </h4>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-black text-blue-400 uppercase">مناقصة نشطة</p>
                  <p className="text-xs font-bold mt-1">توفير معدات طبية - مستشفى الأمل</p>
                  <div className="mt-3 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-blue-500" />
                  </div>
                  <p className="text-[10px] text-white/40 mt-2">تم استلام 4 عروض من 6 موردين</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-indigo-600" />
              أفضل الموردين
            </h4>
            <div className="space-y-4">
              {['مجموعة هائل سعيد', 'مؤسسة الشفق', 'العربي للتجارة'].map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">{i+1}</div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-900">{name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map(s => <div key={s} className="w-2 h-2 rounded-full bg-yellow-400" />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementPage;
