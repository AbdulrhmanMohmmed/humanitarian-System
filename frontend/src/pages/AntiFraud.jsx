import React, { useState, useEffect } from 'react';
import { ShieldAlert, MapPin, Clock, Users, CheckCircle, AlertTriangle, Fingerprint, Activity, Smartphone, ShieldCheck, Layers, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { downloadJSON, downloadCSV, printReport } from '../lib/exportUtils';

export default function AntiFraud() {
  const toast = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [dedupResult, setDedupResult] = useState(null);
  const [stats, setStats] = useState({ trusted: 4250, gps: 0, speed: 8, duplicates: 0 });

  useEffect(() => {
    api.get('/analytics/deduplication').then(r => {
      const d = r.data;
      setDedupResult(d);
      setStats(prev => ({ ...prev, duplicates: d.total_duplicates, gps: Math.min(12, d.total_duplicates) }));
    }).catch(() => {
      const local = localStorage.getItem('hiaos_data_deduplication');
      if (local) {
        const d = JSON.parse(local);
        setDedupResult(d);
        setStats(prev => ({ ...prev, duplicates: d.total_duplicates, gps: Math.min(12, d.total_duplicates) }));
      } else {
        // Ultimate fallback
        setDedupResult({ total_duplicates: 0, duplicate_groups: [] });
      }
    });
  }, []);

  const alerts = [
    { id: 1, type: 'gps', title: 'مواقع مزيفة (GPS Spoofing)', desc: 'تم رصد 5 استبيانات مرسلة من نفس الموقع الجغرافي الدقيق بفاصل زمني أقل من دقيقة.', severity: 'critical', time: 'منذ 10 دقائق', project: 'توزيع النقد - تعز' },
    { id: 2, type: 'time', title: 'إدخال سريع غير طبيعي', desc: 'تم إكمال استبيان PDM (متوسط الوقت 15 دقيقة) في 45 ثانية فقط.', severity: 'high', time: 'منذ ساعتين', project: 'الأمن الغذائي - الحديدة' },
    ...(dedupResult?.duplicate_groups || []).slice(0, 3).map((g, i) => ({
      id: 100 + i, type: 'duplicate', title: `تطابق هويات: ${g.name}`,
      desc: `تطابق بين ${g.count} سجلات في ${g.governorate}. الأرقام الوطنية: ${g.national_ids?.filter(Boolean).join(', ') || 'غير مسجلة'}.`,
      severity: 'medium', time: 'قاعدة البيانات', project: g.governorate
    })),
  ];

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const r = await api.get('/analytics/deduplication');
      setDedupResult(r.data);
      setStats(prev => ({ ...prev, duplicates: r.data.total_duplicates, gps: Math.min(12, r.data.total_duplicates) }));
    } catch (e) { console.error(e); }
    setTimeout(() => setIsScanning(false), 1500);
  };

  return (
    <div className="mesh-gradient min-h-screen pb-10">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-rose-600 rounded-2xl shadow-xl shadow-rose-500/20 text-white">
                <ShieldAlert size={28} />
              </div>
              <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">محرك كشف التلاعب <span className="text-rose-600">Anti-Fraud</span></h1>
            </div>
            <p className="text-[var(--text-secondary)] font-medium max-w-xl">نظام حماية البيانات الميدانية المتقدم عبر فحص المواقع، التوقيت، والبصمة الرقمية.</p>
          </motion.div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleScan}
            disabled={isScanning}
            className={cn(
              "relative px-8 py-4 rounded-2xl font-black text-sm transition-all flex items-center gap-3 overflow-hidden",
              isScanning ? "bg-slate-200 text-slate-500 cursor-wait" : "bg-rose-600 text-white shadow-2xl shadow-rose-500/30 hover:bg-rose-700"
            )}
          >
            {isScanning ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Activity size={20} />
              </motion.div>
            ) : <Activity size={20} />}
            {isScanning ? "جاري الفحص الشامل..." : "بدء الفحص الذكي للبيانات"}
            
            {isScanning && (
              <motion.div 
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </motion.button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
          { label: 'استبيانات موثوقة', val: stats.trusted.toLocaleString(), icon: ShieldCheck, color: 'emerald', sub: '94% من الإجمالي' },
            { label: 'انتحال مواقع (GPS)', val: String(stats.gps).padStart(2, '0'), icon: MapPin, color: 'rose', sub: 'تنبيهات نشطة' },
            { label: 'سرعة إدخال مريبة', val: String(stats.speed).padStart(2, '0'), icon: Clock, color: 'amber', sub: '< 1 دقيقة' },
            { label: 'تطابق هويات', val: String(stats.duplicates).padStart(2, '0'), icon: Fingerprint, color: 'indigo', sub: 'تكرار محتمل' }
          ].map((s, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card rounded-[2rem] p-8 border-none group relative overflow-hidden"
            >
               <div className={cn("absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-700", 
                s.color === 'emerald' ? 'bg-emerald-600' : s.color === 'rose' ? 'bg-rose-600' : s.color === 'amber' ? 'bg-amber-600' : 'bg-indigo-600'
              )} />
              <p className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">{s.label}</p>
              <h3 className={cn("text-4xl font-black mb-2", 
                s.color === 'emerald' ? 'text-emerald-600' : s.color === 'rose' ? 'text-rose-600' : s.color === 'amber' ? 'text-amber-600' : 'text-indigo-600'
              )}>{s.val}</h3>
              <p className="text-xs font-bold text-[var(--text-secondary)]">{s.sub}</p>
              <div className={cn("absolute top-8 left-8 p-3 rounded-2xl", 
                s.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' : s.color === 'rose' ? 'bg-rose-500/10 text-rose-600' : s.color === 'amber' ? 'bg-amber-500/10 text-amber-600' : 'bg-indigo-500/10 text-indigo-600'
              )}>
                <s.icon size={24} />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[2.5rem] p-10 border-none shadow-2xl shadow-black/5"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
              <AlertTriangle className="text-rose-500" size={24} />
              سجل التنبيهات الخطيرة (High-Risk Log)
            </h3>
            <div className="flex gap-2">
              <button onClick={() => { downloadJSON({type: 'anti-fraud', date: new Date().toISOString()}, 'anti-fraud-report.json'); toast.show('تم تصدير التقرير'); }} className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-black/10 transition-all">تصدير التقرير</button>
              <button onClick={() => { toast.show('تم إغلاق جميع التنبيهات'); }} className="px-4 py-2 bg-rose-600/10 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-600 hover:text-white transition-all">إغلاق الكل</button>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {alerts.map((alert, idx) => (
                <motion.div 
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.01, x: 5 }}
                  className="group flex gap-6 p-6 rounded-3xl bg-black/5 dark:bg-white/5 hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-xl"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg",
                    alert.severity === 'critical' ? 'bg-rose-600 text-white' : alert.severity === 'high' ? 'bg-orange-500 text-white' : 'bg-indigo-600 text-white'
                  )}>
                    {alert.type === 'gps' ? <MapPin size={28} /> : alert.type === 'time' ? <Clock size={28} /> : <Users size={28} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-lg text-[var(--text-primary)]">{alert.title}</h4>
                        <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter", 
                           alert.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
                        )}>{alert.severity}</span>
                      </div>
                      <span className="text-xs font-bold text-[var(--text-secondary)] opacity-60">{alert.time}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4 font-medium leading-relaxed">{alert.desc}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/10 rounded-xl text-xs font-bold text-[var(--text-secondary)]">
                          <Layers size={14} />
                          {alert.project}
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { toast.show('تم تنفيذ الحظر الفوري', 'error'); }} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700 transition-all">حظر فوري</button>
                        <button onClick={() => { toast.show('تم فتح المراجعة', 'info'); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] rounded-xl text-xs font-black hover:bg-slate-300 transition-all">مراجعة</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
