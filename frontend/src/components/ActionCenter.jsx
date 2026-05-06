import { motion } from 'framer-motion';
import { Zap, ShieldAlert, CheckCircle2, Clock, MapPin, ArrowRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const SMART_TASKS = [
  { id: 1, type: 'risk', title: 'خطر تقني في مأرب', desc: 'تم رصد انحراف بنسبة 15% في مديرية مأرب. يتطلب معاينة ميدانية.', priority: 'critical', hub: 3, path: '/risks' },
  { id: 2, type: 'dqa', title: 'تدقيق جودة البيانات', desc: 'استمارات الـ PDM تحتوي على قيم شاذة في الرواتب.', priority: 'high', hub: 2, path: '/dqa' },
  { id: 3, type: 'cfm', title: 'شكوى حساسة بانتظار الرد', desc: 'شكوى حماية في الحديدة تجاوزت 48 ساعة.', priority: 'critical', hub: 4, path: '/accountability' },
  { id: 4, type: 'report', title: 'تقرير المانح السنوي', desc: 'بقي 3 أيام على موعد تسليم تقرير OCHA.', priority: 'high', hub: 5, path: '/narrative-builder' },
];

export default function ActionCenter() {
  const navigate = useNavigate();

  return (
    <div className="card-elite p-8 flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 p-20 opacity-10"><Zap size={200} /></div>
      
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-4">
          <Zap size={14} className="animate-pulse" />
          HIAOS Action Center — Live
        </div>
        <h2 className="text-3xl font-black mb-2 tracking-tight">ماذا يجب أن تفعل الآن؟</h2>
        <p className="text-sm font-medium text-slate-400 mb-8">محرك الذكاء الاصطناعي قلق من {SMART_TASKS.length} إجراءات تتطلب انتباهك.</p>
      </div>

      <div className="flex-1 space-y-3 relative z-10 overflow-y-auto custom-scrollbar pr-2">
        {SMART_TASKS.map((task) => (
          <motion.div
            key={task.id}
            whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
            onClick={() => navigate(task.path)}
            className="group flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer transition-all hover:border-emerald-500/30"
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
              task.priority === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
            )}>
              {task.type === 'risk' ? <ShieldAlert size={24} /> : task.type === 'cfm' ? <Clock size={24} /> : <Zap size={24} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-[8px] font-black uppercase tracking-widest", task.priority === 'critical' ? 'text-rose-400' : 'text-amber-400')}>
                  {task.priority === 'critical' ? 'Urgent Alert' : 'Priority Action'}
                </span>
                <span className="text-[8px] font-bold text-slate-500">Hub {task.hub}</span>
              </div>
              <h4 className="text-xs font-black mb-1 group-hover:text-emerald-400 transition-colors">{task.title}</h4>
              <p className="text-[10px] font-medium text-slate-400 line-clamp-1">{task.desc}</p>
            </div>
            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight size={16} className="text-emerald-400" />
            </div>
          </motion.div>
        ))}
      </div>

      <button className="mt-8 w-full h-12 bg-white text-slate-900 rounded-xl font-black text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2">
        فتح سجل المهام الشامل <ArrowRight size={16} />
      </button>
    </div>
  );
}
