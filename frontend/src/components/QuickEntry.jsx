import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Users, FolderKanban, ClipboardList, Send, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';
import api from '../services/api';

export default function QuickEntry({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { show } = useToast();
  const [activeType, setActiveType] = useState('project');
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        onClose(false); // Toggle logic
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = activeType === 'project' ? '/projects/' : activeType === 'beneficiary' ? '/beneficiaries/' : '/activities/';
      await api.post(endpoint, form);
      show(`تمت إضافة ${activeType} بنجاح!`, 'success');
      onClose();
      setForm({});
    } catch (err) {
      show('فشل في الإضافة، يرجى المحاولة لاحقاً', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden relative z-10 border border-white/10"
      >
        <div className="p-8 border-b border-[var(--border)] bg-blue-600 text-white flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Sparkles size={24} />
              <div>
                 <h2 className="text-xl font-black tracking-tight">الإدخال السريع (Quick Entry)</h2>
                 <p className="text-[10px] font-bold uppercase opacity-60">إضافة سجلات جديدة دون مغادرة مكانك</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={20} /></button>
        </div>

        <div className="p-8">
           <div className="flex gap-4 mb-8 p-1.5 bg-black/5 dark:bg-white/5 rounded-[1.5rem]">
              {[
                { id: 'project', label: 'مشروع', icon: FolderKanban },
                { id: 'beneficiary', label: 'مستفيد', icon: Users },
                { id: 'activity', label: 'نشاط', icon: ClipboardList }
              ].map(type => (
                <button 
                  key={type.id}
                  onClick={() => setActiveType(type.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all",
                    activeType === type.id ? "bg-white dark:bg-slate-800 shadow-xl text-blue-600" : "text-slate-400"
                  )}
                >
                   <type.icon size={14} />
                   {type.label}
                </button>
              ))}
           </div>

           <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">العنوان الرئيسي *</label>
                 <input 
                  required
                  placeholder={activeType === 'beneficiary' ? 'اسم المستفيد الرباعي' : 'عنوان المشروع أو النشاط'}
                  onChange={(e) => setForm({...form, name: e.target.value, first_name: e.target.value})}
                  className="w-full h-14 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl px-6 outline-none focus:ring-4 focus:ring-blue-600/10 font-bold"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">الموقع / المحافظة</label>
                    <input 
                      placeholder="صنعاء، عدن..."
                      onChange={(e) => setForm({...form, governorate: e.target.value})}
                      className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 font-bold"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">تاريخ الاستحقاق</label>
                    <input 
                      type="date"
                      onChange={(e) => setForm({...form, end_date: e.target.value})}
                      className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 font-bold"
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4"
              >
                 {loading ? 'جاري الحفظ...' : (
                   <>
                      تأكيد الحفظ السريع
                      <Send size={18} />
                   </>
                 )}
              </button>
           </form>
        </div>
        
        <div className="p-4 bg-black/5 dark:bg-white/5 text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              هل تعلم؟ يمكنك استخدام <span className="text-blue-600">Ctrl+Shift+N</span> في أي وقت لفتح هذه الواجهة.
           </p>
        </div>
      </motion.div>
    </div>
  );
}
