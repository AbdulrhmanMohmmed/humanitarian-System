import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Clock, MoreHorizontal, Reply, ThumbsUp } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CollaborationThread({ entityId, entityType = 'Project' }) {
  const [comments, setComments] = useState([
    { id: 1, user: 'أحمد علي', role: 'موظف ميداني', text: 'تم استكمال توزيع 500 سلة غذائية في مربع A، نحتاج لزيادة عدد المتطوعين غداً.', time: 'منذ ساعتين', avatar: 'A' },
    { id: 2, user: 'سارة محمد', role: 'مسؤولة MEAL', text: 'يرجى التأكد من تسجيل بصمة المستفيدين بدقة في المربع A لتجنب التكرار.', time: 'منذ ساعة', avatar: 'S' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newComment = {
      id: Date.now(),
      user: 'المستخدم الحالي',
      role: 'مدير النظام',
      text: input,
      time: 'الآن',
      avatar: 'U'
    };
    setComments([...comments, newComment]);
    setInput('');
  };

  return (
    <div className="card-elite p-8 space-y-6 flex flex-col h-full bg-white dark:bg-slate-900 border-[var(--border)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
        <div>
          <h3 className="font-black text-lg flex items-center gap-3">
            <MessageSquare size={20} className="text-blue-600" /> النقاش العملياتي
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Contextual Collaboration for {entityType} #{entityId}</p>
        </div>
        <div className="flex -space-x-2">
           {['A', 'S', 'M'].map((u, i) => (
             <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black">{u}</div>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
        <AnimatePresence>
          {comments.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-black shrink-0 shadow-sm">{c.avatar}</div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-[var(--text-primary)]">{c.user}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-600/5 px-2 py-0.5 rounded-lg">{c.role}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 opacity-60 flex items-center gap-1"><Clock size={10} /> {c.time}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-sm font-medium leading-relaxed">
                  {c.text}
                </div>
                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-[10px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-1"><Reply size={12} /> رد</button>
                  <button className="text-[10px] font-black text-slate-400 hover:text-emerald-600 flex items-center gap-1"><ThumbsUp size={12} /> أعجبني</button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="pt-6 border-t border-[var(--border)]">
        <div className="relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="أضف ملاحظة عملياتية..."
            className="w-full h-24 p-4 bg-slate-50 dark:bg-slate-800 border border-[var(--border)] rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 resize-none transition-all"
          />
          <button 
            onClick={handleSend}
            className="absolute bottom-4 left-4 p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
          >
            إرسال <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
