import { useState, useEffect } from 'react';
import { Send, Clock, User, MessageSquare, Activity, ChevronDown, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';

export default function EntityTimeline({ entityType, entityId }) {
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const [comment, setComment] = useState('');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadActivities = async () => {
    try {
      const response = await api.get(`/audit/entity/${entityType}/${entityId}`);
      setActivities(response.data || []);
    } catch (err) {
      console.error("Failed to load activities", err);
    }
  };

  useEffect(() => {
    if (entityId) loadActivities();
  }, [entityId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    try {
      await api.post(`/audit/comment`, {
        entity_type: entityType,
        entity_id: entityId,
        content: comment
      });
      setComment('');
      loadActivities();
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-elite overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
      <div className="p-6 border-b border-[var(--border)] bg-black/5 dark:bg-white/5 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <MessageSquare size={20} className="text-blue-600" />
            <h3 className="font-black text-sm uppercase tracking-widest">{t('activityFeed') || 'النشاط والتعليقات'}</h3>
         </div>
         <span className="text-[10px] font-black opacity-40 uppercase">{activities.length} {t('entries') || 'سجل'}</span>
      </div>

      <div className="p-6">
        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="relative group">
            <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 font-black text-xs">
               {user?.full_name?.charAt(0) || 'U'}
            </div>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب ملاحظة أو تعليقاً هنا..."
              className="w-full min-h-[100px] bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-[2rem] pt-5 pr-6 pl-16 pb-4 outline-none focus:ring-4 focus:ring-blue-600/10 transition-all font-medium text-sm resize-none"
            />
            <button 
              type="submit" 
              disabled={loading || !comment.trim()}
              className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-90"
            >
              <Send size={16} className={isRtl ? "rotate-180" : ""} />
            </button>
          </div>
        </form>

        {/* Timeline */}
        <div className="space-y-8 relative">
           {/* Timeline Line */}
           <div className="absolute top-0 bottom-0 right-5 w-px bg-slate-100 dark:bg-slate-800" />

           <AnimatePresence mode="popLayout">
             {activities.map((act, idx) => (
               <motion.div 
                 key={act.id || idx}
                 initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="relative flex gap-6 group"
               >
                 <div className={cn(
                   "w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 shadow-md transition-all group-hover:scale-110",
                   act.type === 'comment' ? "bg-white dark:bg-slate-800 text-blue-600 border border-blue-500/20" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                 )}>
                    {act.type === 'comment' ? <MessageSquare size={16} /> : <Activity size={16} />}
                 </div>

                 <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-[var(--text-primary)]">{act.user_name}</span>
                          <span className="text-[10px] font-bold text-slate-400">{new Date(act.timestamp).toLocaleString('ar-YE')}</span>
                       </div>
                       <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal size={14} /></button>
                    </div>
                    
                    <div className={cn(
                      "p-4 rounded-2xl text-sm font-medium leading-relaxed",
                      act.type === 'comment' ? "bg-blue-600/5 text-blue-900 dark:text-blue-100 border border-blue-500/10" : "bg-black/5 dark:bg-white/5 text-slate-600"
                    )}>
                       {act.content}
                    </div>
                    
                    {act.meta && (
                      <div className="mt-2 flex gap-2 overflow-x-auto py-1 custom-scrollbar">
                         {Object.entries(act.meta).map(([k, v]) => (
                           <div key={k} className="px-2 py-1 bg-black/5 dark:bg-white/5 rounded-lg text-[8px] font-black uppercase opacity-60">
                              {k}: {String(v)}
                           </div>
                         ))}
                      </div>
                    )}
                 </div>
               </motion.div>
             ))}
           </AnimatePresence>

           {activities.length === 0 && (
             <div className="py-10 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">لا توجد أنشطة مسجلة بعد</p>
             </div>
           )}
        </div>
        
        <button className="w-full mt-8 py-3 border-t border-[var(--border)] text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
           عرض المزيد من النشاط <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
}
