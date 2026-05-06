import { useState } from 'react';
import { Paperclip, UserPlus, Tag, Share2, ChevronRight, X, Plus, File, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function RightSidebar({ isOpen, onClose, entityType, entityData }) {
  const [activeSection, setActiveSection] = useState('info');

  if (!isOpen) return null;

  return (
    <motion.aside 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 shrink-0 glass-panel border-y-0 border-l-0 z-50 flex flex-col shadow-2xl"
    >
      <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)]">
        <h3 className="text-sm font-black uppercase tracking-widest text-blue-600">تفاصيل إضافية</h3>
        <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* Entity Info Summary */}
        <section className="space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 shadow-inner">
                 <Tag size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase">{entityType}</p>
                 <p className="text-sm font-black truncate max-w-[160px]">{entityData?.name || 'بدون عنوان'}</p>
              </div>
           </div>
           
           <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 space-y-3">
              <div className="flex justify-between text-[10px] font-bold">
                 <span className="opacity-50">الحالة</span>
                 <span className="text-emerald-500 uppercase">نشط</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                 <span className="opacity-50">آخر تحديث</span>
                 <span>منذ ساعتين</span>
              </div>
           </div>
        </section>

        {/* Assignments */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <UserPlus size={14} /> المكلفون
              </h4>
              <button className="text-blue-600 hover:scale-110 transition-transform"><Plus size={14} /></button>
           </div>
           <div className="flex -space-x-2 rtl:space-x-reverse">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                   {String.fromCharCode(64 + i)}
                </div>
              ))}
              <button className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-blue-600 hover:text-blue-600 transition-all">
                 <Plus size={12} />
              </button>
           </div>
        </section>

        {/* Attachments */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Paperclip size={14} /> المرفقات
              </h4>
              <button className="text-blue-600 hover:scale-110 transition-transform"><Plus size={14} /></button>
           </div>
           <div className="space-y-2">
              {[
                { name: 'عقد_المشروع.pdf', size: '1.2 MB' },
                { name: 'صور_ميدانية_1.jpg', size: '4.5 MB' }
              ].map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-all group">
                   <div className="flex items-center gap-3">
                      <File size={16} className="text-slate-400 group-hover:text-blue-600" />
                      <div>
                         <p className="text-[10px] font-bold truncate max-w-[120px]">{file.name}</p>
                         <p className="text-[8px] opacity-40 uppercase font-black">{file.size}</p>
                      </div>
                   </div>
                   <button className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                </div>
              ))}
           </div>
        </section>

        {/* Tags */}
        <section className="space-y-4">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Tag size={14} /> الأوسمة
           </h4>
           <div className="flex flex-wrap gap-2">
              {['عاجل', '2024', 'تمويل_خارجي'].map(tag => (
                <span key={tag} className="px-3 py-1 rounded-lg bg-blue-600/10 text-blue-600 text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                   #{tag}
                </span>
              ))}
              <button className="p-1 text-slate-400 hover:text-blue-600"><Plus size={14} /></button>
           </div>
        </section>
      </div>

      <div className="p-6 border-t border-[var(--border)]">
         <button className="w-full h-11 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2">
            <Share2 size={14} /> مشاركة الوثيقة
         </button>
      </div>
    </motion.aside>
  );
}
