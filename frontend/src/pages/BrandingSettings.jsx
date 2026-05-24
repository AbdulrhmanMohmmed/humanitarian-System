import { useState, useEffect } from 'react';
import { useBranding } from '../contexts/BrandingContext';
import { Palette, Upload, Check, RotateCcw, ShieldCheck, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

export default function BrandingSettings() {
  const toast = useToast();
  const { branding, updateBranding } = useBranding();
  const [tempColor, setTempColor] = useState(branding.primaryColor);
  const [tempName, setTempName] = useState(branding.orgName);

  const handleSave = () => {
    updateBranding({
      primaryColor: tempColor,
      orgName: tempName
    });
    alert('تم حفظ إعدادات الهوية البصرية بنجاح.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
          <Palette size={14} />
          White-Labeling & Branding Engine
        </div>
        <h1 className="text-4xl font-black text-[var(--text-primary)]">تخصيص هوية النظام</h1>
        <p className="text-[var(--text-secondary)] font-medium mt-2">قم بضبط الألوان والشعارات لتناسب هوية منظمتك أو الشريك الممول.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-elite p-8 space-y-8">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">إعدادات المظهر</h3>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">اسم المنظمة</label>
              <input 
                type="text" value={tempName} onChange={e => setTempName(e.target.value)}
                className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 font-black text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">اللون الأساسي للعلامة</label>
              <div className="flex gap-4 items-center">
                <input 
                  type="color" value={tempColor} onChange={e => setTempColor(e.target.value)}
                  className="w-16 h-16 rounded-xl border-none cursor-pointer bg-transparent"
                />
                <div className="flex-1">
                   <div className="text-xs font-black uppercase mb-1">{tempColor}</div>
                   <div className="text-[9px] font-bold text-slate-400">سيتم تطبيق هذا اللون على كافة الأزرار والروابط.</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">شعار المنظمة (Logo)</label>
              <div className="h-32 border-2 border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-600 hover:text-blue-600 transition-all cursor-pointer group">
                 <Upload size={24} className="group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] font-black uppercase">اسحب الشعار هنا (SVG/PNG)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
             <button onClick={handleSave} className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                <Check size={18} /> حفظ التغييرات
             </button>
             <button onClick={() => { setTempColor('#2563eb'); setTempName('HIAOS Operating System'); }} className="h-14 w-14 bg-black/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors">
                <RotateCcw size={20} />
             </button>
          </div>
        </div>

        <div className="space-y-8">
           <div className="card-elite p-8 bg-slate-900 text-white border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Globe size={120} /></div>
              <h3 className="font-black text-lg mb-4 relative z-10">معاينة العلامة التجارية</h3>
              <div className="space-y-6 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl" style={{ backgroundColor: tempColor }}>{tempName.charAt(0)}</div>
                    <div>
                       <div className="font-black text-sm">{tempName}</div>
                       <div className="text-[9px] font-bold opacity-60">Corporate Humanitarian Instance</div>
                    </div>
                 </div>
                 <button onClick={() => { toast.show('تم تنفيذ الإجراء التجريبي'); }} className="w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest" style={{ backgroundColor: tempColor }}>زر تجريبي (Action Button)</button>
              </div>
           </div>

           <div className="card-elite p-8 space-y-4">
              <div className="flex gap-4">
                 <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-xl"><ShieldCheck size={20} /></div>
                 <div>
                    <h4 className="text-xs font-black">الاحترافية أمام المانحين</h4>
                    <p className="text-[10px] font-medium opacity-60 leading-relaxed mt-1">تخصيص النظام يعطي انطباعاً بالمؤسسية والقدرة العالية على إدارة الموارد والشفافية.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
