import { useState, useEffect } from 'react';
import { 
  Truck, Plus, Search, MapPin, 
  Fuel, Settings, AlertCircle, Calendar,
  Activity, Navigation, User, Clock,
  MoreVertical, Droplets, Gauge, ShieldCheck,
  TrendingUp, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

const FleetPage = () => {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vehicles');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/api/logistics/vehicles');
        setVehicles(data);
      } catch (err) {
        console.error('Failed to fetch fleet data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'إجمالي المركبات', value: vehicles.length, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'مركبات نشطة', value: vehicles.filter(v => v.status === 'available').length, icon: Navigation, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'استهلاك الوقود (L)', value: '1,420', icon: Fuel, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'تكلفة الحركة الشهرية', value: '$2,850', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
             <div className="p-2 bg-slate-900 rounded-2xl text-white">
               <Truck size={24} />
             </div>
             إدارة الأسطول والحركة
          </h1>
          <p className="text-slate-500 font-bold mt-1">تتبع المركبات، الوقود، والصيانة الدورية للمهام الميدانية</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { toast.show('يتم عرض سجل المهام', 'info'); }} className="h-12 px-6 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <Calendar size={20} />
            سجل المهام
          </button>
          <button onClick={() => { toast.show('يرجى ملء بيانات المركبة الجديدة', 'info'); }} className="h-12 px-6 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
            <Plus size={20} />
            إضافة مركبة
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm"
          >
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', stat.bg)}>
              <stat.icon className={cn('w-6 h-6', stat.color)} />
            </div>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="text-xs font-bold text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {['vehicles', 'fuel', 'maintenance'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-black transition-all',
              activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab === 'vehicles' && 'الأسطول'}
            {tab === 'fuel' && 'سجل الوقود'}
            {tab === 'maintenance' && 'الصيانة'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vehicle Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
               
               <div className="flex items-start justify-between mb-6">
                 <div>
                   <h3 className="text-lg font-black text-slate-900">{vehicle.make} {vehicle.model}</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-black uppercase">{vehicle.plate_number}</span>
                      <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-black uppercase', 
                        vehicle.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                      )}>{vehicle.status}</span>
                   </div>
                 </div>
                 <button className="p-2 text-slate-300 hover:text-slate-600"><Settings size={18} /></button>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                       <User size={14} /> السائق: {vehicle.assigned_driver_id || 'غير معين'}
                    </div>
                    <div className="flex items-center gap-2">
                       <MapPin size={14} /> {vehicle.governorate}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-4 rounded-2xl bg-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1"><Gauge size={12} /> العداد الحلي</p>
                        <p className="text-sm font-black text-slate-900">{vehicle.current_odometer} KM</p>
                     </div>
                     <div className="p-4 rounded-2xl bg-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1"><Fuel size={12} /> نوع الوقود</p>
                        <p className="text-sm font-black text-slate-900">{vehicle.fuel_type}</p>
                     </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-[10px] font-black text-orange-600">
                        <AlertCircle size={14} /> صيانة قادمة: {vehicle.last_service_date || 'غير محدد'}
                     </div>
                     <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                        <ArrowRight size={16} />
                     </button>
                  </div>
               </div>
            </div>
          ))}
        </div>

        {/* Right Panel: Fuel Consumption & Trends */}
        <div className="space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
             <div className="relative z-10">
               <h4 className="text-lg font-black mb-2 flex items-center gap-2">
                  <Droplets className="text-blue-400" />
                  مراقبة الوقود
               </h4>
               <p className="text-xs font-bold text-slate-400">تحليل الاستهلاك للأسبوع الأخير</p>
               
               <div className="mt-8 space-y-6">
                  <div className="flex items-end justify-between gap-2 h-24">
                     {[40, 70, 45, 90, 65, 50, 80].map((h, i) => (
                       <motion.div 
                        key={i} 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        className="w-full bg-blue-500/40 hover:bg-blue-400 rounded-t-lg transition-colors cursor-pointer group/bar relative"
                       >
                         <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black opacity-0 group-hover/bar:opacity-100 transition-opacity">
                            {h}L
                         </div>
                       </motion.div>
                     ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                     <span>Sat</span>
                     <span>Sun</span>
                     <span>Mon</span>
                     <span>Tue</span>
                     <span>Wed</span>
                     <span>Thu</span>
                     <span>Fri</span>
                  </div>
               </div>

               <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400">المتوسط اليومي</p>
                    <p className="text-lg font-black">64.5 L</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400">معدل التغير</p>
                    <p className="text-lg font-black text-emerald-400 flex items-center gap-1">
                      <TrendingUp size={16} /> 12%
                    </p>
                  </div>
               </div>
             </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
             <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" />
                الامتثال والتراخيص
             </h4>
             <div className="space-y-4">
                {[
                  { label: 'تأمين المركبات', date: '2024-12-15', status: 'valid' },
                  { label: 'تصاريح الحركة', date: '2024-05-20', status: 'expiring' },
                  { label: 'فحص فني دوري', date: '2024-06-01', status: 'valid' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all">
                     <div>
                        <p className="text-xs font-black text-slate-800">{item.label}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{item.date}</p>
                     </div>
                     <div className={cn('w-2 h-2 rounded-full', item.status === 'valid' ? 'bg-emerald-500' : 'bg-orange-500')} />
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetPage;
