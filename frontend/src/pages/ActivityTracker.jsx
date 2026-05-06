import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  MapPin,
  Plus,
  Save,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import CustomFieldsForm from '../components/CustomFieldsForm';
import CustomizeModuleButton from '../components/CustomizeModuleButton';
import { useCustomization, renderCustomFieldValue } from '../hooks/useCustomization';

const EMPTY_FORM = {
  project_id: '',
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  actual_start: '',
  actual_end: '',
  responsible: '',
  progress: 0,
  status: 'planned',
  custom_values: {},
};

const STATUS_COLORS = {
  planned: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  suspended: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
};

const STATUS_LABELS = {
  planned: 'مخطط',
  active: 'نشط',
  completed: 'مكتمل',
  suspended: 'معلق',
  cancelled: 'ملغي',
};

const dateOrNull = (value) => value || null;

export default function ActivityTracker() {
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [ganttData, setGanttData] = useState(null);
  const [fieldVisits, setFieldVisits] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { fields: customFields } = useCustomization('activity');
  const tableCustomFields = customFields.filter((field) => field.is_searchable).slice(0, 2);

  const load = async () => {
    const projectReq = api.get('/projects/');
    const activitiesReq = api.get(selectedProject ? `/activities/?project_id=${selectedProject}` : '/activities/');
    const visitsReq = api.get(selectedProject ? `/field-visits/?project_id=${selectedProject}` : '/field-visits/');
    const indicatorsReq = api.get('/monitoring/indicators');

    const [projectRes, activitiesRes, visitsRes, indicatorsRes] = await Promise.allSettled([
      projectReq,
      activitiesReq,
      visitsReq,
      indicatorsReq,
    ]);

    if (projectRes.status === 'fulfilled') setProjects(projectRes.value.data);
    if (activitiesRes.status === 'fulfilled') setActivities(activitiesRes.value.data);
    if (visitsRes.status === 'fulfilled') setFieldVisits(visitsRes.value.data);
    if (indicatorsRes.status === 'fulfilled') {
      setIndicators(
        selectedProject
          ? indicatorsRes.value.data.filter((item) => String(item.project_id) === String(selectedProject))
          : indicatorsRes.value.data,
      );
    }

    if (selectedProject) {
      api.get(`/activities/gantt/${selectedProject}`).then((r) => setGanttData(r.data)).catch(() => setGanttData(null));
    } else {
      setGanttData(null);
    }
  };

  useEffect(() => {
    load();
  }, [selectedProject]);

  const openCreate = () => {
    setEditingActivity(null);
    setForm({ ...EMPTY_FORM, project_id: selectedProject || '' });
    setShowModal(true);
  };

  const openEdit = (activity) => {
    setEditingActivity(activity);
    setForm({
      project_id: activity.project_id || '',
      name: activity.name || '',
      description: activity.description || '',
      start_date: activity.start_date || '',
      end_date: activity.end_date || '',
      actual_start: activity.actual_start || '',
      actual_end: activity.actual_end || '',
      responsible: activity.responsible || '',
      progress: activity.progress ?? 0,
      status: activity.status || 'planned',
      custom_values: activity.custom_values || {},
    });
    setShowModal(true);
  };

  const submit = async () => {
    const payload = {
      ...form,
      project_id: Number(form.project_id),
      progress: Number(form.progress || 0),
      start_date: dateOrNull(form.start_date),
      end_date: dateOrNull(form.end_date),
      actual_start: dateOrNull(form.actual_start),
      actual_end: dateOrNull(form.actual_end),
    };

    if (editingActivity) {
      await api.put(`/activities/${editingActivity.id}`, payload);
    } else {
      await api.post('/activities/', payload);
    }

    setShowModal(false);
    setEditingActivity(null);
    setForm(EMPTY_FORM);
    load();
  };

  const updateActivity = async (id, payload) => {
    await api.put(`/activities/${id}`, payload);
    load();
  };

  const deleteActivity = async (id) => {
    if (!window.confirm('هل تريد حذف هذا النشاط؟')) return;
    await api.delete(`/activities/${id}`);
    load();
  };

  const daysBetween = (start, end) => {
    if (!start || !end) return 0;
    return Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
  };

  const executionLog = useMemo(() => {
    const activityEvents = activities.map((activity) => ({
      id: `activity-${activity.id}`,
      date: activity.actual_end || activity.end_date || activity.actual_start || activity.start_date,
      title: activity.name,
      meta: `نشاط - ${STATUS_LABELS[activity.status] || activity.status}`,
      icon: CheckCircle2,
      color: 'blue',
    }));
    const visitEvents = fieldVisits.map((visit) => ({
      id: `visit-${visit.id}`,
      date: visit.visit_date,
      title: visit.title,
      meta: `زيارة ميدانية - ${visit.location || visit.governorate || 'بدون موقع'}`,
      icon: MapPin,
      color: 'teal',
    }));
    const indicatorEvents = indicators.map((indicator) => ({
      id: `indicator-${indicator.id}`,
      date: indicator.created_at,
      title: indicator.name,
      meta: `مؤشر - ${Number(indicator.actual_value || 0).toLocaleString()} / ${Number(indicator.target_value || 0).toLocaleString()} ${indicator.unit || ''}`,
      icon: BarChart3,
      color: 'emerald',
    }));

    return [...activityEvents, ...visitEvents, ...indicatorEvents]
      .filter((event) => event.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 12);
  }, [activities, fieldVisits, indicators]);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
            <Clock size={14} />
            التنفيذ والرصد الميداني
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">تتبع الأنشطة الميدانية</h1>
          <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">
            إدارة الأنشطة من الخطة إلى الإغلاق، مع تقدم إنجاز، حالة، مسؤوليات، وسجل تنفيذ موحد للمشروع.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <CustomizeModuleButton entity="activity" className="h-12 rounded-2xl" />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="h-12 rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-900"
          >
            <option value="">جميع المشاريع</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <button
            onClick={openCreate}
            className="flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-700"
          >
            <Plus size={20} /> إضافة نشاط
          </button>
        </div>
      </header>

      {ganttData && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'إجمالي الأنشطة', value: ganttData.summary.total, icon: BarChart3, color: 'blue' },
            { label: 'متوسط التقدم', value: `${ganttData.summary.avg_progress}%`, icon: ArrowUpRight, color: 'emerald' },
            { label: 'في الموعد', value: ganttData.summary.on_track, icon: Calendar, color: 'indigo' },
            { label: 'متأخر', value: ganttData.summary.delayed, icon: X, color: 'rose' },
          ].map((stat) => (
            <div key={stat.label} className="card-elite p-6">
              <div className="mb-4 flex items-start justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{stat.label}</p>
                <div className={cn('rounded-xl p-2',
                  stat.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                    stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                      stat.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-rose-500/10 text-rose-600',
                )}>
                  <stat.icon size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-[var(--text-primary)]">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card-elite overflow-hidden border-none shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-black/5 p-6 dark:bg-white/5">
          <h3 className="flex items-center gap-3 text-sm font-black">
            <BarChart3 size={20} className="text-blue-600" />
            مصفوفة تتبع الأنشطة
          </h3>
        </div>
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="bg-black/5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] dark:bg-white/5">
                <th className="w-72 px-6 py-5 text-right">النشاط</th>
                <th className="w-32 px-6 py-5 text-right">البداية</th>
                <th className="w-32 px-6 py-5 text-right">النهاية</th>
                <th className="w-24 px-6 py-5 text-right">المدة</th>
                {tableCustomFields.map((field) => <th key={field.id} className="w-32 px-6 py-5 text-right">{field.label_ar || field.label}</th>)}
                <th className="px-6 py-5 text-right">التقدم</th>
                <th className="w-40 px-6 py-5 text-right">الحالة</th>
                <th className="w-32 px-6 py-5 text-right">الانحراف</th>
                <th className="w-32 px-6 py-5 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {(ganttData?.activities || activities).map((activity, index) => {
                  const variance = activity.variance_days || (activity.actual_end && activity.end_date ? daysBetween(activity.end_date, activity.actual_end) : null);
                  return (
                    <motion.tr
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group border-t border-[var(--border)] transition-all hover:bg-blue-600/5"
                    >
                      <td className="px-6 py-5">
                        <div className="font-black text-[var(--text-primary)] transition-colors group-hover:text-blue-600">{activity.name}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)] opacity-70">
                          <User size={10} /> {activity.responsible || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-bold opacity-70">{activity.start_date || '-'}</td>
                      <td className="px-6 py-5 font-bold opacity-70">{activity.end_date || '-'}</td>
                      <td className="px-6 py-5 font-black text-blue-600">{daysBetween(activity.start_date, activity.end_date)} يوم</td>
                      {tableCustomFields.map((field) => (
                        <td key={field.id} className="px-6 py-5 font-bold opacity-70">
                          {renderCustomFieldValue(field, activity.custom_values?.[field.field_key])}
                        </td>
                      ))}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/5 ring-1 ring-black/5 dark:bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${activity.progress || 0}%` }}
                              className={cn('h-full rounded-full shadow-lg transition-all', activity.progress >= 100 ? 'bg-emerald-500' : 'bg-blue-600')}
                            />
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={activity.progress ?? 0}
                            onChange={(e) => updateActivity(activity.id, { progress: Number(e.target.value) })}
                            className="h-8 w-16 rounded-lg border border-[var(--border)] bg-white px-2 py-0.5 text-center text-xs font-black outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={activity.status || 'planned'}
                          onChange={(e) => updateActivity(activity.id, { status: e.target.value })}
                          className={cn('rounded-full border-0 px-3 py-1.5 text-[10px] font-black outline-none', STATUS_COLORS[activity.status] || STATUS_COLORS.planned)}
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-5">
                        {variance !== null && variance !== undefined && (
                          <div className={cn('inline-block rounded-lg px-3 py-1 text-xs font-black', variance > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600')}>
                            {variance > 0 ? `+${variance} يوم` : variance === 0 ? 'في الموعد' : `${variance} يوم`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(activity)} className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-600/10" title="تعديل">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => deleteActivity(activity.id)} className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-600/10" title="حذف">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {activities.length === 0 && !ganttData && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Calendar size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-black uppercase tracking-widest">لا توجد أنشطة مسجلة</p>
            </div>
          )}
        </div>
      </div>

      <div className="card-elite p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-black text-[var(--text-primary)]">
            <Clock size={20} className="text-emerald-600" />
            سجل التنفيذ الموحد
          </h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
            أنشطة، زيارات، ومؤشرات
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {executionLog.map((event) => (
            <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-black/[0.02] p-4 dark:bg-white/[0.03]">
              <div className="mb-3 flex items-center justify-between">
                <div className={cn('rounded-xl p-2',
                  event.color === 'teal' ? 'bg-teal-500/10 text-teal-600' :
                    event.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600',
                )}>
                  <event.icon size={16} />
                </div>
                <span className="text-xs font-bold text-[var(--text-secondary)]">{String(event.date).slice(0, 10)}</span>
              </div>
              <p className="line-clamp-2 text-sm font-black text-[var(--text-primary)]">{event.title}</p>
              <p className="mt-1 text-xs font-bold text-[var(--text-secondary)]">{event.meta}</p>
            </div>
          ))}
          {executionLog.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-[var(--border)] py-10 text-center text-sm font-bold text-[var(--text-secondary)]">
              سيظهر هنا سجل التنفيذ بعد إضافة أنشطة أو زيارات أو مؤشرات.
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="custom-scrollbar max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-8 shadow-2xl dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-black text-[var(--text-primary)]">{editingActivity ? 'تعديل النشاط' : 'إضافة نشاط جديد'}</h3>
                <button onClick={() => setShowModal(false)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 transition hover:bg-rose-500/10 hover:text-rose-600 dark:bg-white/5">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-5">
                <input
                  placeholder="اسم النشاط"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-14 w-full rounded-2xl border border-[var(--border)] bg-black/5 px-5 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 dark:bg-white/5"
                />
                <textarea
                  placeholder="وصف مختصر أو مخرجات النشاط"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-black/5 px-5 py-3 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 dark:bg-white/5"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="h-14 rounded-2xl border border-[var(--border)] bg-black/5 px-5 font-bold outline-none dark:bg-white/5">
                    <option value="">اختر المشروع *</option>
                    {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                  <input placeholder="المسؤول عن التنفيذ" value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} className="h-14 rounded-2xl border border-[var(--border)] bg-black/5 px-5 font-bold outline-none dark:bg-white/5" />
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="h-12 rounded-xl border border-[var(--border)] bg-black/5 px-4 font-bold dark:bg-white/5" />
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="h-12 rounded-xl border border-[var(--border)] bg-black/5 px-4 font-bold dark:bg-white/5" />
                  <input type="date" value={form.actual_start} onChange={(e) => setForm({ ...form, actual_start: e.target.value })} className="h-12 rounded-xl border border-[var(--border)] bg-black/5 px-4 font-bold dark:bg-white/5" />
                  <input type="date" value={form.actual_end} onChange={(e) => setForm({ ...form, actual_end: e.target.value })} className="h-12 rounded-xl border border-[var(--border)] bg-black/5 px-4 font-bold dark:bg-white/5" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} className="h-12 rounded-xl border border-[var(--border)] bg-black/5 px-4 font-bold dark:bg-white/5" placeholder="نسبة الإنجاز" />
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-12 rounded-xl border border-[var(--border)] bg-black/5 px-4 font-bold dark:bg-white/5">
                    {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <CustomFieldsForm fields={customFields} values={form.custom_values} onChange={(customValues) => setForm({ ...form, custom_values: customValues })} />
                <button onClick={submit} disabled={!form.name || !form.project_id} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-lg font-black text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-50">
                  <Save size={18} /> {editingActivity ? 'حفظ التعديلات' : 'حفظ النشاط والبدء بالتتبع'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
