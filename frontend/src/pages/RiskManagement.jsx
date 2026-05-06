import { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, MapPin, 
  Plus, Search, ShieldCheck, 
  Flag, MoreVertical, TrendingDown,
  Clock, Shield, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';

const RiskManagement = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data } = await api.get('/api/risk/incidents');
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const riskCategories = [
    { label: 'مالي', count: 4, color: 'bg-emerald-500' },
    { label: 'أمني', count: 12, color: 'bg-rose-500' },
    { label: 'تشغيلي', count: 7, color: 'bg-blue-500' },
    { label: 'سياسي', count: 3, color: 'bg-orange-500' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
             <div className="p-2 bg-rose-600 rounded-2xl text-white shadow-xl shadow-rose-100">
               <ShieldAlert size={28} />
             </div>
             إدارة الأمن والمخاطر
          </h1>
          <p className="text-slate-500 font-bold mt-1">تتبع الحوادث الميدانية، مصفوفة المخاطر، وخطط التخفيف</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 px-6 rounded-2xl bg-rose-600 text-white font-black text-sm hover:bg-rose-700 transition-all shadow-lg flex items-center gap-2">
            <Plus size={20} />
            بلاغ عن حادث أمني
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
         {riskCategories.map((cat, i) => (
           <div key={i} className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                 <p className="text-xs font-bold text-slate-400">{cat.label}</p>
                 <h4 className="text-2xl font-black text-slate-900 mt-1">{cat.count}</h4>
              </div>
              <div className={cn('w-2 h-10 rounded-full', cat.color)} />
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* Incident List */}
         <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Clock className="text-slate-400" size={20} />
                  سجل الحوادث الأخيرة
               </h3>
               <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="بحث في الحوادث..." className="h-10 pr-10 pl-4 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-rose-500 transition-all bg-white" />
               </div>
            </div>

            <div className="grid gap-4">
               {loading ? (
                 [1,2,3].map(i => <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-3xl" />)
               ) : incidents.length > 0 ? (
                 incidents.map((incident) => (
                   <motion.div 
                    key={incident.id} 
                    layoutId={`incident-${incident.id}`}
                    className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:border-rose-200 transition-all group flex items-start justify-between"
                   >
                      <div className="flex items-start gap-5">
                         <div className={cn('p-3 rounded-2xl', incident.severity === 'Critical' ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600')}>
                            <Flag size={24} />
                         </div>
                         <div>
                            <h4 className="font-black text-slate-900">{incident.title}</h4>
                            <div className="flex items-center gap-4 mt-2">
                               <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                  <MapPin size={12} /> {incident.location_name}
                               </span>
                               <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                  <Clock size={12} /> {new Date(incident.incident_date).toLocaleDateString()}
                               </span>
                            </div>
                            <p className="text-xs font-bold text-slate-500 mt-3 line-clamp-2 leading-relaxed">{incident.description}</p>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <span className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider', 
                            incident.severity === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'
                         )}>
                            {incident.severity}
                         </span>
                         <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><MoreVertical size={18} /></button>
                      </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="p-16 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
                    <ShieldCheck className="mx-auto text-emerald-500" size={48} />
                    <div>
                       <h4 className="font-black text-slate-900">الوضع الأمني مستقر</h4>
                       <p className="text-xs font-bold text-slate-400 mt-1">لا توجد حوادث أمنية مسجلة في الـ 24 ساعة الماضية.</p>
                    </div>
                 </div>
               )}
            </div>
         </div>

         {/* Risk Matrix Sidebar */}
         <div className="space-y-6">
            <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm">
               <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
                  <LayoutGrid className="text-rose-600" size={20} />
                  مصفوفة المخاطر
               </h3>
               
               <div className="grid grid-cols-5 grid-rows-5 gap-1 aspect-square bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  {Array.from({ length: 25 }).map((_, i) => {
                    const row = Math.floor(i / 5);
                    const col = i % 5;
                    const isHigh = (row < 2 && col > 2);
                    const isLow = (row > 2 && col < 2);
                    return (
                      <div 
                        key={i} 
                        className={cn('rounded-md transition-all cursor-pointer flex items-center justify-center text-[8px] font-black', 
                          isHigh ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 
                          isLow ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'
                        )}
                      >
                         {isHigh && 'H'}
                         {isLow && 'L'}
                      </div>
                    );
                  })}
               </div>
               <div className="mt-4 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Probability</span>
                  <span>Impact</span>
               </div>
            </div>

            <div className="p-8 rounded-[3rem] bg-slate-900 text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <Shield size={80} />
               </div>
               <div className="relative z-10">
                  <h4 className="font-black text-lg mb-2">توصيات التخفيف</h4>
                  <ul className="space-y-3 mt-6">
                     {[
                       'تحديث بروتوكول الحركة في مأرب',
                       'تدريب الموظفين على الحماية (PSEA)',
                       'تفعيل خاصية التتبع الفوري GPS'
                     ].map((item, i) => (
                       <li key={i} className="text-xs font-bold text-slate-400 flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          {item}
                       </li>
                     ))}
                  </ul>
                  <button className="w-full mt-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black text-sm transition-all">
                     عرض تقرير المخاطر
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default RiskManagement;
