import { useState, useEffect } from 'react';
import { 
  Handshake, Users, Award, 
  Search, Plus, Star, 
  FileText, ExternalLink, 
  MapPin, ShieldCheck, 
  Globe, Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

const PartnerPortal = () => {
  const toast = useToast();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data } = await api.get('/api/partners/');
        setPartners(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
               <Handshake size={28} />
             </div>
             إدارة الشركاء والتعاقدات
          </h1>
          <p className="text-slate-500 font-bold mt-1">تقييم قدرات المنظمات المحلية، إدارة المنح الفرعية، والرقابة الميدانية</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { toast.show('جاري فتح أداة تقييم القدرات...', 'info'); }} className="h-12 px-6 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <ShieldCheck size={18} />
            أداة تقييم القدرات
          </button>
          <button onClick={() => { toast.show('يرجى ملء بيانات الشريك الجديد', 'info'); }} className="h-12 px-6 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2">
            <Plus size={20} />
            إضافة شريك جديد
          </button>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[3rem]" />)
        ) : partners.length > 0 ? (
          partners.map((partner, i) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
               <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                     {partner.acronym || partner.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full">
                     <Star size={12} fill="currentColor" />
                     <span className="text-[10px] font-black">{partner.rating}</span>
                  </div>
               </div>

               <h3 className="text-xl font-black text-slate-900 mb-1">{partner.name}</h3>
               <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1">
                 <Briefcase size={12} /> {partner.type}
               </p>

               <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                     <MapPin size={14} className="text-slate-300" />
                     اليمن - صنعاء وعدن
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                     <FileText size={14} className="text-slate-300" />
                     3 مشاريع نشطة حالياً
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <button onClick={() => { toast.show('يتم عرض ملف الشريك', 'info'); }} className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1">
                    ملف الشريك <ExternalLink size={12} />
                  </button>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full uppercase">
                    Active
                  </span>
               </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full p-20 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 text-center">
             < Handshake className="mx-auto text-slate-300 mb-4" size={64} />
             <h4 className="text-xl font-black text-slate-500">لا يوجد شركاء محليين بعد</h4>
             <p className="text-sm font-bold text-slate-400 mt-2">ابدأ بإضافة المنظمات الشريكة لإدارة التعاقدات والمنح الفرعية.</p>
          </div>
        )}
      </div>

      {/* Global Outreach Stats */}
      <div className="p-12 rounded-[4rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-1/2 h-full opacity-10"><Globe size={300} /></div>
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
               <h5 className="text-4xl font-black mb-2">12+</h5>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">شريك محلي معتمد</p>
            </div>
            <div>
               <h5 className="text-4xl font-black mb-2">$1.4M</h5>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">منح فرعية ممنوحة</p>
            </div>
            <div>
               <h5 className="text-4xl font-black mb-2">92%</h5>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">كفاءة الأداء البرامجي</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PartnerPortal;
