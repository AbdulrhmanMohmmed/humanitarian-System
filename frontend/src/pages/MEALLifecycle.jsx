import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, Milestone, Plus, Save, Target, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

const STORAGE_KEY = 'hiaos_meal_lifecycle';

const defaultPhases = [
  { id: 1, label: 'البرمجة والتصميم', status: 'completed', tasks: [{ id: 11, title: 'ToC Builder', done: true }, { id: 12, title: 'Logframe Design', done: true }, { id: 13, title: 'Stakeholder Mapping', done: false }] },
  { id: 2, label: 'إعداد الخطة والأنظمة', status: 'in_progress', tasks: [{ id: 21, title: 'MEAL Plan', done: true }, { id: 22, title: 'IPTT Setup', done: false }, { id: 23, title: 'PMP Framework', done: false }] },
  { id: 3, label: 'جمع البيانات الميدانية', status: 'pending', tasks: [{ id: 31, title: 'Field Surveys', done: false }, { id: 32, title: 'Community Meetings', done: false }, { id: 33, title: 'Kobo Integration', done: false }] },
  { id: 4, label: 'التحليل والتحقق DQA', status: 'pending', tasks: [{ id: 41, title: 'Statistical Analysis', done: false }, { id: 42, title: 'Data Quality Audit', done: false }, { id: 43, title: 'Triangulation', done: false }] },
  { id: 5, label: 'التعلم والإدارة التكيفية', status: 'pending', tasks: [{ id: 51, title: 'Learning Workshop', done: false }, { id: 52, title: 'Adaptive Decision', done: false }, { id: 53, title: 'Donor Reporting', done: false }] },
];
import api from '../services/api';

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || { phases: defaultPhases, logs: [] };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { phases: defaultPhases, logs: [] };
  }
}

export default function MEALLifecycle() {
  const [activePhase, setActivePhase] = useState(2);
  const [state, setState] = useState({ phases: defaultPhases, logs: [] });
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    api.get('/meal-plan/').then(r => {
      const items = Array.isArray(r.data) ? r.data : (r.data.items || []);
      if (items.length > 0) setState(prev => ({ ...prev, apiPlans: items }));
    }).catch(() => {});
    setState(loadState());
  }, []);

  const persist = (next, message) => {
    const updated = message
      ? { ...next, logs: [{ id: Date.now(), action: message, time: new Date().toISOString() }, ...(next.logs || [])].slice(0, 20) }
      : next;
    setState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const phase = state.phases.find((item) => item.id === activePhase) || state.phases[0];
  const compliance = useMemo(() => {
    const tasks = state.phases.flatMap((item) => item.tasks);
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((task) => task.done).length / tasks.length) * 100);
  }, [state.phases]);

  const updateTask = (taskId, done) => {
    const phases = state.phases.map((item) => ({
      ...item,
      tasks: item.tasks.map((task) => task.id === taskId ? { ...task, done } : task),
    })).map((item) => {
      const completed = item.tasks.every((task) => task.done);
      const started = item.tasks.some((task) => task.done);
      return { ...item, status: completed ? 'completed' : started ? 'in_progress' : 'pending' };
    });
    persist({ ...state, phases }, done ? 'تم إنجاز مهمة في دورة MEAL' : 'تمت إعادة فتح مهمة في دورة MEAL');
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const phases = state.phases.map((item) => item.id === activePhase
      ? { ...item, tasks: [...item.tasks, { id: Date.now(), title: newTask.trim(), done: false }] }
      : item);
    setNewTask('');
    persist({ ...state, phases }, `تمت إضافة مهمة إلى مرحلة ${phase.label}`);
  };

  const deleteTask = (taskId) => {
    const phases = state.phases.map((item) => item.id === activePhase
      ? { ...item, tasks: item.tasks.filter((task) => task.id !== taskId) }
      : item);
    persist({ ...state, phases }, `تم حذف مهمة من مرحلة ${phase.label}`);
  };

  const setPhaseStatus = (status) => {
    const phases = state.phases.map((item) => item.id === activePhase ? { ...item, status } : item);
    persist({ ...state, phases }, `تم تحديث حالة مرحلة ${phase.label}`);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
            <Milestone size={14} /> MEAL Lifecycle
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">خارطة طريق المشروع MEAL</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-[var(--text-secondary)]">
            تتبع مراحل دورة MEAL، حدث حالة المهام، واحفظ سجل العمليات كلوحة عمل حقيقية.
          </p>
        </div>
        <button onClick={() => persist(state, 'تم حفظ خارطة دورة MEAL يدويا')} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white">
          <Save size={18} /> حفظ الخارطة
        </button>
      </header>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
        <div className="grid gap-3 lg:grid-cols-5">
          {state.phases.map((item) => (
            <button key={item.id} onClick={() => setActivePhase(item.id)} className={cn('rounded-2xl border p-4 text-right transition', activePhase === item.id ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--border)] hover:bg-black/5')}>
              <div className="mb-3 flex items-center justify-between">
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black', item.status === 'completed' ? 'bg-emerald-600 text-white' : item.status === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400')}>
                  {item.status === 'completed' ? <CheckCircle2 size={20} /> : item.id}
                </span>
                <ArrowRight size={15} className="text-slate-300" />
              </div>
              <p className="text-xs font-black text-[var(--text-primary)]">{item.label}</p>
              <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">{item.status}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <main className="space-y-6">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-[var(--text-primary)]">{phase.label}</h2>
                <p className="mt-1 text-xs font-bold text-slate-400">إدارة مهام المرحلة الحالية</p>
              </div>
              <select value={phase.status} onChange={(e) => setPhaseStatus(e.target.value)} className="h-11 rounded-xl border border-[var(--border)] bg-transparent px-3 text-sm font-black">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {phase.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-2xl bg-black/5 p-4">
                  <label className="flex items-center gap-3 text-sm font-black text-[var(--text-primary)]">
                    <input type="checkbox" checked={task.done} onChange={(e) => updateTask(task.id, e.target.checked)} />
                    {task.title}
                  </label>
                  <button onClick={() => deleteTask(task.id)} className="text-rose-500"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="مهمة جديدة" className="h-11 flex-1 rounded-xl border border-[var(--border)] bg-transparent px-4 text-sm font-bold outline-none" />
              <button onClick={addTask} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white"><Plus size={16} /> إضافة</button>
            </div>
          </section>

          <section className="rounded-3xl bg-blue-600 p-6 text-white">
            <h3 className="text-xl font-black">تنبيه المعايير المهنية</h3>
            <p className="mt-3 max-w-2xl text-sm font-medium opacity-80">
              عندما تصل نسبة الامتثال إلى 80% أو أكثر، ينصح بتفعيل تدقيق جودة البيانات DQA وجدولة جلسة تعلم قبل الانتقال للمرحلة التالية.
            </p>
          </section>
        </main>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">معدل الامتثال</p>
            <div className="relative mx-auto mt-5 flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-blue-600 text-3xl font-black text-blue-600">
              {compliance}%
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-[var(--text-primary)]"><Clock size={16} /> سجل العمليات</h3>
            <div className="space-y-3">
              {state.logs.map((log) => (
                <div key={log.id} className="rounded-2xl bg-black/5 p-3">
                  <p className="text-xs font-black text-[var(--text-primary)]">{log.action}</p>
                  <p className="mt-1 text-[10px] font-bold text-slate-400">{new Date(log.time).toLocaleString()}</p>
                </div>
              ))}
              {!state.logs.length && <p className="rounded-2xl bg-black/5 p-5 text-center text-xs font-bold text-slate-400">لا يوجد سجل بعد</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
