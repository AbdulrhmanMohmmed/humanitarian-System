import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, MapPin, Target, Users, FileText, X } from 'lucide-react';

const ROLES = [
  { key: 'executive', label: 'مدير تنفيذي', icon: LayoutDashboard, color: 'from-blue-600 to-blue-700', path: '/mission-control', desc: 'نظرة عامة وقرارات استراتيجية' },
  { key: 'pm', label: 'مدير مشاريع', icon: Target, color: 'from-indigo-600 to-indigo-700', path: '/projects', desc: 'تصميم وتخطيط المشاريع' },
  { key: 'field', label: 'موظف ميداني', icon: MapPin, color: 'from-emerald-600 to-emerald-700', path: '/activities', desc: 'تتبع الأنشطة والزيارات' },
  { key: 'meal', label: 'مسؤول MEAL', icon: Target, color: 'from-violet-600 to-violet-700', path: '/meal', desc: 'المؤشرات والجودة والتحليل' },
  { key: 'accountability', label: 'مسؤول مساءلة', icon: Users, color: 'from-orange-500 to-orange-600', path: '/accountability', desc: 'الشكاوى والمجتمع والتعلم' },
  { key: 'reporting', label: 'مسؤول تقارير', icon: FileText, color: 'from-sky-600 to-sky-700', path: '/reports', desc: 'تقارير المانحين والشفافية' },
];

export default function RoleSelector({ onSelect, onDismiss }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (role) => {
    setSelected(role.key);
    localStorage.setItem('hiaos_role', role.key);
    localStorage.setItem('hiaos_role_path', role.path);
    setTimeout(() => onSelect(role), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-10 max-w-2xl w-full mx-4 relative"
      >
        <button onClick={onDismiss} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-black/5 text-slate-400">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">
            HIAOS — Quick Start
          </div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">ما دورك في المنظمة؟</h2>
          <p className="text-sm font-medium text-slate-400">سنوجهك مباشرة للأدوات التي تحتاجها</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ROLES.map((role) => (
            <motion.button
              key={role.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(role)}
              className={`relative p-6 rounded-2xl text-white text-right bg-gradient-to-br ${role.color} shadow-lg transition-all ${selected === role.key ? 'ring-4 ring-white/50 scale-105' : ''}`}
            >
              <role.icon size={28} className="mb-3 opacity-80" />
              <div className="font-black text-sm">{role.label}</div>
              <div className="text-[10px] opacity-70 mt-1 font-medium leading-relaxed">{role.desc}</div>
            </motion.button>
          ))}
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6 font-bold">
          يمكنك تغيير هذا لاحقاً من إعدادات النظام
        </p>
      </motion.div>
    </motion.div>
  );
}
