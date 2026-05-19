import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Database,
  FileText,
  GitBranch,
  LayoutGrid,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  Layers,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';
import { downloadJSON, downloadCSV, printReport } from '../lib/exportUtils';

const STORAGE_KEY = 'hiaos_project_designs';

const steps = [
  { id: 'toc', label: 'نظرية التغيير', icon: GitBranch },
  { id: 'logframe', label: 'الإطار المنطقي', icon: LayoutGrid },
  { id: 'risks', label: 'مصفوفة المخاطر', icon: ShieldAlert },
  { id: 'irs', label: 'بطاقات المؤشرات', icon: FileText },
];

const emptyDesign = {
  title: 'تصميم مشروع جديد',
  sector: 'FSL',
  governorate: 'تعز',
  problem: 'ضع وصف المشكلة الأساسية هنا.',
  impact: 'تحسين الوضع الإنساني للمجتمعات المستهدفة.',
  outcomes: ['زيادة الوصول إلى الخدمات الأساسية', 'تحسين جودة وملاءمة الاستجابة'],
  outputs: ['تنفيذ أنشطة ميدانية مخططة', 'تفعيل المتابعة والمساءلة المجتمعية'],
  logframe: [
    { id: 1, level: 'Impact', narrative: 'تحسين الوضع الإنساني للمجتمعات المستهدفة', indicators: 'مؤشر أثر رئيسي', means: 'تقييم خط النهاية', assumptions: 'استقرار نسبي في مناطق التدخل' },
    { id: 2, level: 'Outcome', narrative: 'زيادة الوصول إلى الخدمات الأساسية', indicators: 'عدد المستفيدين الذين تلقوا الخدمة', means: 'سجلات التوزيع وتقارير المتابعة', assumptions: 'توفر الموردين والشركاء' },
  ],
  risks: [
    { id: 1, risk: 'تأخر الوصول الميداني', probability: 'medium', impact: 'high', mitigation: 'خطة بديلة للشركاء المحليين' },
  ],
  indicators: [
    { id: 1, code: 'IND-01', name: 'عدد المستفيدين الذين تلقوا الخدمة', type: 'Output', unit: 'فرد', target: 1000, frequency: 'شهري', responsibility: 'MEAL Officer', formula: 'مجموع المستفيدين المؤكدين' },
  ],
};

function loadDesigns() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistDesigns(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return <input {...props} className={cn('h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 text-sm font-bold outline-none focus:border-blue-500', props.className)} />;
}

function TextArea(props) {
  return <textarea {...props} className={cn('w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-blue-500', props.className)} />;
}

export default function ProjectDesigner() {
  const toast = useToast();
  const [activeStep, setActiveStep] = useState('toc');
  const [designs, setDesigns] = useState([]);
  const [design, setDesign] = useState(emptyDesign);

  useEffect(() => {
    const existing = loadDesigns();
    if (existing.length === 0) {
      const demo = {
        ...emptyDesign,
        id: 'demo-1',
        title: 'برنامج الاستجابة الطارئة للأمن الغذائي',
        sector: 'FSL',
        updated_at: new Date().toISOString(),
        status: 'published'
      };
      setDesigns([demo]);
      setDesign(demo);
      persistDesigns([demo]);
    } else {
      setDesigns(existing);
      if (existing.length > 0) setDesign(existing[0]);
    }
  }, []);

  const riskScore = useMemo(() => {
    const weight = { low: 1, medium: 2, high: 3, critical: 4 };
    return (design.risks || []).reduce((sum, item) => sum + (weight[item.probability] || 1) * (weight[item.impact] || 1), 0);
  }, [design.risks]);

  const updateDesign = (patch) => setDesign((current) => ({ ...current, ...patch }));

  const generateAISuggestions = () => {
    const suggestions = {
      FSL: {
        problem: 'تدهور مستويات الأمن الغذائي وارتفاع معدلات سوء التغذية الحاد في المناطق المتضررة من النزاع.',
        impact: 'تعزيز القدرة على الصمود وتحسين سبل العيش المستدامة للأسر الأكثر ضعفاً.',
        outcomes: ['تحسين الوصول إلى الغذاء الكافي والمتنوع', 'استعادة الأصول الإنتاجية الزراعية'],
        risks: [
          { id: Date.now(), risk: 'تقلبات أسعار الصرف المحلية', probability: 'high', impact: 'high', mitigation: 'استخدام العملات الصعبة في العقود وتحديث الميزانية دورياً' }
        ]
      },
      Health: {
        problem: 'ضعف التغطية الصحية وانهيار النظام الصحي الأولي في المديريات النائية.',
        impact: 'تقليل معدلات الوفيات والاعتلال بين النساء والأطفال.',
        outcomes: ['زيادة كفاءة المرافق الصحية الأساسية', 'تعزيز نظام الإحالة الطبية'],
        risks: [
          { id: Date.now(), risk: 'تفشي الأوبئة المعدية', probability: 'medium', impact: 'critical', mitigation: 'تفعيل بروتوكولات مكافحة العدوى والتدريب السريع للفرق' }
        ]
      }
    };
    const s = suggestions[design.sector] || suggestions.FSL;
    updateDesign({ ...s, title: `${design.title} (AI Optimized)` });
  };

  const saveDesign = () => {
    const item = {
      ...design,
      id: design.id || Date.now(),
      updated_at: new Date().toISOString(),
      status: 'draft',
    };
    const next = [item, ...designs.filter((saved) => saved.id !== item.id)];
    setDesign(item);
    setDesigns(next);
    persistDesigns(next);
  };

  const loadDesign = (item) => setDesign(item);

  const deleteDesign = (id) => {
    const next = designs.filter((item) => item.id !== id);
    setDesigns(next);
    persistDesigns(next);
    if (design.id === id) setDesign(emptyDesign);
  };

  const addLogframeRow = () => {
    updateDesign({
      logframe: [
        ...design.logframe,
        { id: Date.now(), level: 'Output', narrative: '', indicators: '', means: '', assumptions: '' },
      ],
    });
  };

  const updateLogframeRow = (id, patch) => {
    updateDesign({ logframe: design.logframe.map((row) => (row.id === id ? { ...row, ...patch } : row)) });
  };

  const addRisk = () => {
    updateDesign({
      risks: [...(design.risks || []), { id: Date.now(), risk: '', probability: 'medium', impact: 'medium', mitigation: '' }],
    });
  };

  const updateRisk = (id, patch) => {
    updateDesign({ risks: design.risks.map((row) => (row.id === id ? { ...row, ...patch } : row)) });
  };

  const addIndicator = () => {
    updateDesign({
      indicators: [
        ...(design.indicators || []),
        { id: Date.now(), code: `IND-${(design.indicators || []).length + 1}`, name: '', type: 'Output', unit: '', target: 0, frequency: 'شهري', responsibility: '', formula: '' },
      ],
    });
  };

  const updateIndicator = (id, patch) => {
    updateDesign({ indicators: design.indicators.map((row) => (row.id === id ? { ...row, ...patch } : row)) });
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 backdrop-blur-md border border-blue-600/10">
            <Sparkles size={14} className="animate-pulse" />
            HIAOS Smart Project Design Studio
          </div>
          <h1 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">مصمم المشاريع الذكي</h1>
          <p className="max-w-3xl text-lg font-semibold text-[var(--text-secondary)] opacity-80 leading-relaxed">
            بيئة تطوير متكاملة لبناء الأطر المنطقية ونظريات التغيير بدعم من الذكاء الاصطناعي.
          </p>
        </div>
        <div className="flex gap-4">
           <button onClick={generateAISuggestions} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 px-6 text-xs font-black text-emerald-600 hover:bg-emerald-600/20 transition-all">
             <Activity size={18} /> اقتراحات الذكاء الاصطناعي
           </button>
           <button onClick={saveDesign} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-xs font-black text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all">
             <Save size={18} /> حفظ التصميم النهائي
           </button>
        </div>
      </header>

      <div className="flex flex-col gap-8">
        {/* Horizontal Sub-Sidebar (Controls & Summary) */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="card-elite p-6 md:col-span-1 lg:col-span-2">
             <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-black/5 pb-3 mb-4">المسودات المحفوظة</h2>
             <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {designs.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => loadDesign(item)}
                    className={cn(
                      "group rounded-2xl border p-4 transition-all duration-300 cursor-pointer min-w-[200px] shrink-0", 
                      design.id === item.id ? "bg-blue-600/5 border-blue-600/20" : "bg-black/5 border-transparent hover:bg-black/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                       <p className="text-xs font-black leading-snug group-hover:text-blue-600 line-clamp-1">{item.title}</p>
                       <button onClick={(e) => { e.stopPropagation(); deleteDesign(item.id); }} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {!designs.length && <p className="text-[10px] font-black uppercase text-slate-400 py-2">لا توجد مسودات</p>}
             </div>
          </div>

          <div className="card-elite p-6 flex items-center gap-4 bg-blue-600/5 border-none">
             <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                <Layers size={24} />
             </div>
             <div>
                <p className="text-[9px] font-black uppercase text-blue-600 mb-1">تغطية الإطار</p>
                <p className="text-2xl font-black">{design.logframe.length} <span className="text-xs opacity-40">مستويات</span></p>
             </div>
          </div>

          <div className="card-elite p-6 flex items-center gap-4 bg-rose-500/5 border-none">
             <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                <ShieldAlert size={24} />
             </div>
             <div>
                <p className="text-[9px] font-black uppercase text-rose-600 mb-1">مؤشر المخاطر</p>
                <p className="text-2xl font-black">{riskScore} <span className="text-xs opacity-40">نقاط</span></p>
             </div>
          </div>
        </section>

        <main className="card-elite p-10 min-h-[800px] flex flex-col">
          <div className="mb-10 flex gap-8 border-b border-black/5">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  'flex items-center gap-3 pb-6 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative',
                  activeStep === step.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <step.icon size={16} />
                {step.label}
                {activeStep === step.id && <motion.div layoutId="designer-step" className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-blue-600" />}
              </button>
            ))}
          </div>

          <div className="flex-1">
            {activeStep === 'toc' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                <div className="grid gap-8 md:grid-cols-2">
                  <Field label="عنوان المشروع">
                    <TextInput value={design.title} onChange={(e) => updateDesign({ title: e.target.value })} placeholder="مثال: الاستجابة الطارئة..." />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                     <Field label="القطاع">
                       <select value={design.sector} onChange={(e) => updateDesign({ sector: e.target.value })} className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 text-sm font-bold outline-none">
                          <option value="FSL">الأمن الغذائي</option>
                          <option value="Health">الصحة</option>
                          <option value="WASH">المياه والإصحاح</option>
                          <option value="Prot">الحماية</option>
                       </select>
                     </Field>
                     <Field label="المحافظة">
                       <TextInput value={design.governorate} onChange={(e) => updateDesign({ governorate: e.target.value })} />
                     </Field>
                  </div>
                </div>

                <div className="space-y-6">
                  <Field label="بيان المشكلة (Core Problem)">
                    <TextArea rows={4} value={design.problem} onChange={(e) => updateDesign({ problem: e.target.value })} />
                  </Field>
                  <Field label="الأثر النهائي (Long-term Impact)">
                    <TextInput value={design.impact} onChange={(e) => updateDesign({ impact: e.target.value })} />
                  </Field>
                </div>

                <div className="rounded-[2rem] bg-slate-900 p-8 text-white">
                   <h3 className="mb-8 flex items-center gap-3 text-sm font-black uppercase tracking-widest text-white/40">
                     <GitBranch size={18} /> تسلسل نظرية التغيير
                   </h3>
                   <div className="flex flex-col items-center gap-6">
                      <div className="w-full max-w-md rounded-2xl bg-blue-600 p-4 text-center font-black shadow-xl shadow-blue-600/20">{design.impact}</div>
                      <div className="h-8 w-1 bg-white/20" />
                      <div className="flex gap-4">
                         {(design.outcomes || []).map((o, i) => (
                            <div key={i} className="rounded-xl bg-white/10 p-4 text-center text-xs font-bold backdrop-blur-md border border-white/5">{o}</div>
                         ))}
                      </div>
                      <div className="h-8 w-1 bg-white/20" />
                      <div className="w-full max-w-lg rounded-xl bg-white/5 border border-white/10 p-4 text-center text-[10px] font-black opacity-60 uppercase tracking-widest italic">الأنشطة والمدخلات التنفيذية</div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeStep === 'logframe' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="overflow-x-auto rounded-3xl border border-black/5">
                  <table className="w-full border-collapse text-right">
                    <thead>
                      <tr className="bg-black/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <th className="p-4">المستوى</th>
                        <th className="p-4">السرد المنطقي</th>
                        <th className="p-4">المؤشرات</th>
                        <th className="p-4">وسائل التحقق</th>
                        <th className="p-4">الافتراضات</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {(design.logframe || []).map((row) => (
                        <tr key={row.id} className="group hover:bg-black/[0.02] transition-colors">
                          <td className="p-3">
                            <select value={row.level} onChange={(e) => updateLogframeRow(row.id, { level: e.target.value })} className="w-full bg-transparent text-xs font-black outline-none border-none">
                              <option>Impact</option>
                              <option>Outcome</option>
                              <option>Output</option>
                            </select>
                          </td>
                          <td className="p-3"><TextArea rows={2} value={row.narrative} onChange={(e) => updateLogframeRow(row.id, { narrative: e.target.value })} className="border-none bg-transparent" /></td>
                          <td className="p-3"><TextArea rows={2} value={row.indicators} onChange={(e) => updateLogframeRow(row.id, { indicators: e.target.value })} className="border-none bg-transparent text-blue-600" /></td>
                          <td className="p-3"><TextArea rows={2} value={row.means} onChange={(e) => updateLogframeRow(row.id, { means: e.target.value })} className="border-none bg-transparent" /></td>
                          <td className="p-3"><TextArea rows={2} value={row.assumptions} onChange={(e) => updateLogframeRow(row.id, { assumptions: e.target.value })} className="border-none bg-transparent italic" /></td>
                          <td className="p-3"><button onClick={() => updateDesign({ logframe: design.logframe.filter(r => r.id !== row.id) })} className="text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={addLogframeRow} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 text-xs font-black text-slate-400 hover:border-blue-600/30 hover:text-blue-600 transition-all">
                  <Plus size={18} /> إضافة صف جديد للإطار المنطقي
                </button>
              </motion.div>
            )}

            {activeStep === 'risks' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="grid gap-6">
                  {(design.risks || []).map((risk) => (
                    <div key={risk.id} className="card-elite p-6 relative group">
                       <button onClick={() => updateDesign({ risks: design.risks.filter(r => r.id !== risk.id) })} className="absolute top-4 left-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                       <div className="grid gap-6 md:grid-cols-3">
                          <div className="md:col-span-1 space-y-4">
                             <Field label="وصف الخطر">
                               <TextInput value={risk.risk} onChange={(e) => updateRisk(risk.id, { risk: e.target.value })} />
                             </Field>
                             <div className="grid grid-cols-2 gap-4">
                               <Field label="الاحتمالية">
                                 <select value={risk.probability} onChange={(e) => updateRisk(risk.id, { probability: e.target.value })} className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 text-[10px] font-black uppercase">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                 </select>
                               </Field>
                               <Field label="الأثر">
                                 <select value={risk.impact} onChange={(e) => updateRisk(risk.id, { impact: e.target.value })} className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 text-[10px] font-black uppercase">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                 </select>
                               </Field>
                             </div>
                          </div>
                          <div className="md:col-span-2 space-y-4">
                             <Field label="إجراءات التخفيف (Mitigation Strategy)">
                               <TextArea rows={4} value={risk.mitigation} onChange={(e) => updateRisk(risk.id, { mitigation: e.target.value })} placeholder="كيف سنتعامل مع هذا الخطر؟" />
                             </Field>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
                <button onClick={addRisk} className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 text-xs font-black text-slate-400 hover:border-rose-600/30 hover:text-rose-600 transition-all">
                  <ShieldAlert size={18} /> إضافة خطر محتمل للمصفوفة
                </button>
              </motion.div>
            )}

            {activeStep === 'irs' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  {(design.indicators || []).map((ind) => (
                    <div key={ind.id} className="card-elite p-8 space-y-6 relative group overflow-hidden">
                       <div className="absolute top-0 right-0 w-1 h-full bg-amber-500 opacity-20" />
                       <div className="flex items-center justify-between border-b border-black/5 pb-4">
                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full">{ind.code}</span>
                          <button onClick={() => updateDesign({ indicators: design.indicators.filter(i => i.id !== ind.id) })} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                       </div>
                       <Field label="اسم المؤشر (Indicator Name)">
                         <TextInput value={ind.name} onChange={(e) => updateIndicator(ind.id, { name: e.target.value })} />
                       </Field>
                       <div className="grid grid-cols-2 gap-4">
                          <Field label="الوحدة">
                            <TextInput value={ind.unit} onChange={(e) => updateIndicator(ind.id, { unit: e.target.value })} />
                          </Field>
                          <Field label="المستهدف (Target)">
                            <TextInput type="number" value={ind.target} onChange={(e) => updateIndicator(ind.id, { target: parseInt(e.target.value) })} />
                          </Field>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <Field label="تكرار الجمع">
                            <select value={ind.frequency} onChange={(e) => updateIndicator(ind.id, { frequency: e.target.value })} className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 text-xs font-bold">
                               <option>شهري</option>
                               <option>ربع سنوي</option>
                               <option>نصف سنوي</option>
                               <option>سنوي</option>
                            </select>
                          </Field>
                          <Field label="المسؤولية">
                            <TextInput value={ind.responsibility} onChange={(e) => updateIndicator(ind.id, { responsibility: e.target.value })} />
                          </Field>
                       </div>
                    </div>
                  ))}
                </div>
                <button onClick={addIndicator} className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 text-xs font-black text-slate-400 hover:border-amber-600/30 hover:text-amber-600 transition-all">
                  <Database size={18} /> إنشاء بطاقة مؤشر جديدة (Indicator Card)
                </button>
              </motion.div>
            )}
          </div>

          <div className="mt-auto pt-10 border-t border-black/5 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
             <div className="flex items-center gap-2">
                <ShieldAlert size={14} />
                <span>حماية البيانات: التصميم محفوظ محلياً فقط</span>
             </div>
             <div className="flex gap-6">
                <button onClick={() => { printReport('تصميم المشروع', [{title: 'ملخص', text: 'تم إنشاء التصميم بنجاح'}]); toast.show('تم فتح التقرير للطباعة'); }} className="hover:text-blue-600 transition-colors">تصدير بصيغة PDF</button>
                <button onClick={() => { toast.show('تم نسخ رابط المشاركة', 'info'); }} className="hover:text-blue-600 transition-colors">مشاركة مع الفريق</button>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}
