import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, Download, CheckCircle2, 
  MapPin, Users, Target, Calendar,
  ArrowRight, Share2, Database, ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';

const FIVEW_FIELDS = [
  { id: 'who', label: 'Who (Organization)', example: 'HIAOS NGO' },
  { id: 'what', label: 'What (Activity)', example: 'Food Distribution' },
  { id: 'where', label: 'Where (Location)', example: 'Taiz - Al Mudhaffar' },
  { id: 'when', label: 'When (Timeline)', example: 'Q2 2026' },
  { id: 'whom', label: 'For Whom (Beneficiaries)', example: '1200 Households' },
];

export default function OCHA5WHub() {
  const [generating, setGenerating] = useState(false);

  const generate5W = async () => {
    setGenerating(true);
    try {
      const response = await api.get('/reports/export-ocha-5w', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'OCHA_5W_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تصدير التقرير');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <FileSpreadsheet size={14} />
            OCHA Yemen 5W Automation Hub
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">محرك تقارير الـ 5W</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">توليد تقارير (Who does What, Where, When, Whom) آلياً وفق معايير OCHA اليمن.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            <div className="card-elite p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><FileSpreadsheet size={150} /></div>
               <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-4">أتمتة تقارير التنسيق (Clusters)</h3>
                  <p className="text-sm font-medium opacity-60 leading-relaxed mb-8 max-w-md">
                     يقوم النظام بسحب البيانات من كافة الوحدات (التنفيذ، المستفيدين، المالية) لإنشاء ملف إكسل مطابق تماماً لمتطلبات الـ 5W في اليمن.
                  </p>
                  <div className="flex gap-4">
                     <button onClick={generate5W} disabled={generating} className="h-12 px-8 bg-blue-600 rounded-xl font-black text-xs shadow-xl shadow-blue-600/20 flex items-center gap-2 hover:bg-blue-700 transition-all">
                        {generating ? "جاري التوليد..." : "توليد ملف الـ 5W لعام 2026"} <Download size={18} />
                     </button>
                     <button className="h-12 px-6 bg-white/10 rounded-xl font-black text-xs hover:bg-white/20 transition-all">إعدادات الحقول</button>
                  </div>
               </div>
            </div>

            <div className="card-elite p-8 space-y-6">
               <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">تخطيط حقول الـ 5W المعتمدة</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FIVEW_FIELDS.map(f => (
                     <div key={f.id} className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)] flex justify-between items-center group hover:border-blue-600/30 transition-all">
                        <div>
                           <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">{f.label}</div>
                           <div className="text-xs font-bold text-slate-400 italic">Example: {f.example}</div>
                        </div>
                        <CheckCircle2 size={16} className="text-emerald-600 opacity-20 group-hover:opacity-100 transition-all" />
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="card-elite p-8 bg-blue-600 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Database size={120} /></div>
               <h3 className="font-black text-lg mb-4 relative z-10">الربط مع HDX</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed mb-8 relative z-10">
                  سيتم إضافة وسوم HXL تلقائياً إلى كافة البيانات المصدرة لضمان التوافق مع منصة Humanitarian Data Exchange.
               </p>
               <button className="w-full h-12 bg-white text-blue-600 rounded-xl font-black text-xs shadow-xl shadow-black/20">تفعيل وسوم HXL</button>
            </div>

            <div className="card-elite p-6 space-y-4">
               <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">حالة التقارير المرفوعة</h4>
               <div className="space-y-3">
                  {[
                     { label: 'Food Security Cluster', status: 'Sent', date: 'Yesterday' },
                     { label: 'WASH Cluster', status: 'Draft', date: '-' },
                     { label: 'Protection Cluster', status: 'Pending', date: 'Today' },
                  ].map(c => (
                     <div key={c.label} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl text-[10px] font-black">
                        <span>{c.label}</span>
                        <div className="flex items-center gap-2">
                           <span className={cn("px-2 py-0.5 rounded", c.status === 'Sent' ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white')}>{c.status}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </aside>
      </div>
    </div>
  );
}
