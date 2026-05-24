import { 
  Terminal, Code2, Book, 
  Cpu, Activity, Zap, 
  ExternalLink, Copy, Key,
  Lock, Globe, Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import api from '../services/api';

const DevConsole = () => {
  const [apiStatus, setApiStatus] = useState('checking...');
  useEffect(() => {
    api.get('/').then(() => setApiStatus('online')).catch(() => setApiStatus('offline'));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="p-12 rounded-[3rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
           <Terminal size={400} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-black mb-4 flex items-center gap-4">
             <div className="p-3 bg-blue-500 rounded-2xl"><Code2 size={32} /></div>
             Developer Console
          </h1>
          <p className="text-slate-400 font-bold text-lg leading-relaxed">
            مركز المطورين لدمج نظام HIAOS مع الأنظمة الخارجية. نوفر توثيقاً كاملاً بمعايير OpenAPI لضمان التنسيق التقني السلس.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm">
               <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <Book className="text-blue-600" />
                  توثيق واجهة البرمجة (Swagger/OpenAPI)
               </h3>
               <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">
                 نعتمد تقنية FastAPI لتوليد توثيق حي وتفاعلي لجميع المسارات البرمجية. يمكنك تجربة الـ Endpoints مباشرة من المتصفح.
               </p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a href="/docs" target="_blank" className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-500 group transition-all">
                     <div className="flex justify-between items-start mb-4">
                        <h4 className="font-black text-slate-900">Swagger UI</h4>
                        <ExternalLink size={18} className="text-slate-300 group-hover:text-blue-600" />
                     </div>
                     <p className="text-xs font-bold text-slate-400">واجهة تفاعلية لتجربة الـ APIs واختبار الاستجابة.</p>
                  </a>
                  <a href="/redoc" target="_blank" className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-500 group transition-all">
                     <div className="flex justify-between items-start mb-4">
                        <h4 className="font-black text-slate-900">Redoc</h4>
                        <ExternalLink size={18} className="text-slate-300 group-hover:text-indigo-600" />
                     </div>
                     <p className="text-xs font-bold text-slate-400">توثيق نظيف ومرتب للمواصفات التقنية (OpenAPI Specification).</p>
                  </a>
               </div>
            </div>

            <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm">
               <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <Lock className="text-orange-500" />
                  التفويض والأمان (API Keys)
               </h3>
               <div className="p-6 rounded-3xl bg-slate-900 text-slate-400 font-mono text-sm relative group overflow-hidden">
                  <span className="text-blue-400">Authorization:</span> Bearer {'{YOUR_JWT_TOKEN}'}
                  <button className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><Copy size={16} /></button>
               </div>
               <p className="text-xs font-bold text-slate-400 mt-4 leading-relaxed">
                  يستخدم النظام معيار OAuth2 مع توكنات JWT المشفرة لضمان أقصى درجات الأمان عند تبادل البيانات الحساسة للمستفيدين.
               </p>
            </div>
         </div>

         <div className="space-y-6">
            <div className="p-8 rounded-[3rem] bg-blue-600 text-white shadow-xl">
               <Cpu className="mb-4" />
               <h4 className="text-lg font-black mb-1">حالة الأنظمة</h4>
               <p className="text-[10px] font-black opacity-60 uppercase mb-8">System Health Check</p>
               
               <div className="space-y-6">
                  {[
                    { label: 'Core Engine', status: 'Operational', color: 'bg-emerald-400' },
                    { label: 'Database', status: 'Operational', color: 'bg-emerald-400' },
                    { label: 'AI Models', status: 'High Load', color: 'bg-amber-400' },
                    { label: 'Document Storage', status: 'Operational', color: 'bg-emerald-400' }
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                       <span className="text-xs font-bold text-blue-100">{s.label}</span>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black">{s.status}</span>
                          <div className={cn('w-2 h-2 rounded-full', s.color)} />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm text-center">
               <Globe className="mx-auto text-slate-200 mb-4" size={48} />
               <h4 className="font-black text-slate-900">التكامل الموحد</h4>
               <p className="text-xs font-bold text-slate-400 mt-2">النظام مهيأ تماماً للربط مع مخدّمات الأمم المتحدة (OCHA) والشركاء الدوليين.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DevConsole;
