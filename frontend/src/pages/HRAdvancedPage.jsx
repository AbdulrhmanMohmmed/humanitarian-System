import { useState } from 'react';
import { Users, Plus, DollarSign, Star, BookOpen, Clock, Shield, FileText } from 'lucide-react';
import { usePayroll, useCreatePayroll, usePerformanceReviews, useCreateReview, useTrainings, useCreateTraining, useTimesheets, useCreateTimesheet, useSafetyCheckins, useCreateSafetyCheckin, useContracts, useCreateContract } from '../hooks/useModuleApi';

export default function HRAdvancedPage() {
  const [tab, setTab] = useState('payroll');
  const [showForm, setShowForm] = useState(false);

  const { data: payroll = [], isLoading: payLoading } = usePayroll({});
  const createPayroll = useCreatePayroll();
  const { data: reviews = [], isLoading: revLoading } = usePerformanceReviews({});
  const createReview = useCreateReview();
  const { data: trainings = [], isLoading: trnLoading } = useTrainings({});
  const createTraining = useCreateTraining();
  const { data: timesheets = [], isLoading: tsLoading } = useTimesheets({});
  const createTimesheet = useCreateTimesheet();
  const { data: safety = [], isLoading: safLoading } = useSafetyCheckins({});
  const createSafety = useCreateSafetyCheckin();
  const { data: contracts = [], isLoading: conLoading } = useContracts({});
  const createContract = useCreateContract();

  const [payForm, setPayForm] = useState({ user_id: '', period: '', base_salary: 0, allowances: 0, deductions: 0, currency: 'USD' });
  const [revForm, setRevForm] = useState({ user_id: '', reviewer_id: '', period: '', score: 0, comments: '' });
  const [trnForm, setTrnForm] = useState({ title: '', training_type: 'technical', start_date: '', end_date: '', max_participants: 30 });
  const [tsForm, setTsForm] = useState({ user_id: '', date: new Date().toISOString().split('T')[0], hours: 8, project_id: '', activity: '' });
  const [safForm, setSafForm] = useState({ user_id: '', location: '', status: 'safe', notes: '' });
  const [conForm, setConForm] = useState({ user_id: '', contract_type: 'full_time', start_date: '', end_date: '', salary: 0 });

  const tabs = [
    { id: 'payroll', label: 'الرواتب', icon: DollarSign },
    { id: 'reviews', label: 'تقييم الأداء', icon: Star },
    { id: 'training', label: 'التدريب', icon: BookOpen },
    { id: 'timesheets', label: 'الدوام', icon: Clock },
    { id: 'safety', label: 'سلامة الموظفين', icon: Shield },
    { id: 'contracts', label: 'العقود', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Users className="w-8 h-8 text-violet-600" /><h1 className="text-2xl font-bold">إدارة الموارد البشرية المتقدمة</h1></div>

      <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-1 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap ${tab === t.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-[var(--text-secondary)]'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'payroll' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> كشف رواتب</button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-6 gap-3">
                <input type="number" value={payForm.user_id} onChange={e => setPayForm(p => ({ ...p, user_id: e.target.value }))} placeholder="رقم الموظف" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={payForm.period} onChange={e => setPayForm(p => ({ ...p, period: e.target.value }))} placeholder="الفترة (2024-01)" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={payForm.base_salary} onChange={e => setPayForm(p => ({ ...p, base_salary: parseFloat(e.target.value) || 0 }))} placeholder="الراتب الأساسي" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={payForm.allowances} onChange={e => setPayForm(p => ({ ...p, allowances: parseFloat(e.target.value) || 0 }))} placeholder="البدلات" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={payForm.deductions} onChange={e => setPayForm(p => ({ ...p, deductions: parseFloat(e.target.value) || 0 }))} placeholder="الخصومات" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <button onClick={async () => { await createPayroll.mutateAsync({ ...payForm, user_id: parseInt(payForm.user_id) }); setShowForm(false); }} disabled={createPayroll.isPending} className="bg-violet-600 text-white rounded-lg">حفظ</button>
              </div>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">الموظف</th><th className="text-right p-3">الفترة</th><th className="text-right p-3">الراتب</th><th className="text-right p-3">البدلات</th><th className="text-right p-3">الخصومات</th><th className="text-right p-3">الصافي</th></tr></thead>
              <tbody>{payLoading ? <tr><td colSpan={6} className="p-4 text-center">جاري التحميل...</td></tr> :
                (payroll || []).map(p => (
                  <tr key={p.id} className="border-t border-[var(--border)]"><td className="p-3">{p.user_id}</td><td className="p-3">{p.period}</td><td className="p-3 font-mono">{p.base_salary?.toFixed(2)}</td><td className="p-3 font-mono text-green-600">+{p.allowances?.toFixed(2)}</td><td className="p-3 font-mono text-red-600">-{p.deductions?.toFixed(2)}</td><td className="p-3 font-mono font-bold">{((p.base_salary || 0) + (p.allowances || 0) - (p.deductions || 0)).toFixed(2)}</td></tr>
                ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> تقييم جديد</button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-5 gap-3">
                <input type="number" value={revForm.user_id} onChange={e => setRevForm(p => ({ ...p, user_id: e.target.value }))} placeholder="رقم الموظف" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={revForm.reviewer_id} onChange={e => setRevForm(p => ({ ...p, reviewer_id: e.target.value }))} placeholder="رقم المقيّم" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={revForm.period} onChange={e => setRevForm(p => ({ ...p, period: e.target.value }))} placeholder="الفترة" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={revForm.score} onChange={e => setRevForm(p => ({ ...p, score: parseFloat(e.target.value) || 0 }))} placeholder="الدرجة (1-5)" min="1" max="5" step="0.1" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <button onClick={async () => { await createReview.mutateAsync({ ...revForm, user_id: parseInt(revForm.user_id), reviewer_id: parseInt(revForm.reviewer_id) }); setShowForm(false); }} className="bg-violet-600 text-white rounded-lg">حفظ</button>
              </div>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">الموظف</th><th className="text-right p-3">المقيّم</th><th className="text-right p-3">الفترة</th><th className="text-right p-3">الدرجة</th></tr></thead>
              <tbody>{revLoading ? <tr><td colSpan={4} className="p-4 text-center">جاري التحميل...</td></tr> :
                (reviews || []).map(r => (
                  <tr key={r.id} className="border-t border-[var(--border)]"><td className="p-3">{r.user_id}</td><td className="p-3">{r.reviewer_id}</td><td className="p-3">{r.period}</td><td className="p-3"><span className={`font-bold ${r.score >= 4 ? 'text-green-600' : r.score >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>{r.score}/5</span></td></tr>
                ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'training' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> تدريب جديد</button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-5 gap-3">
                <input type="text" value={trnForm.title} onChange={e => setTrnForm(p => ({ ...p, title: e.target.value }))} placeholder="عنوان التدريب" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={trnForm.training_type} onChange={e => setTrnForm(p => ({ ...p, training_type: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="technical">تقني</option><option value="soft_skills">مهارات شخصية</option><option value="safety">سلامة</option><option value="compliance">امتثال</option>
                </select>
                <input type="date" value={trnForm.start_date} onChange={e => setTrnForm(p => ({ ...p, start_date: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="date" value={trnForm.end_date} onChange={e => setTrnForm(p => ({ ...p, end_date: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <button onClick={async () => { await createTraining.mutateAsync(trnForm); setShowForm(false); }} disabled={createTraining.isPending} className="bg-violet-600 text-white rounded-lg">حفظ</button>
              </div>
            </div>
          )}
          <div className="grid gap-3">{trnLoading ? <p className="text-center p-4">جاري التحميل...</p> : (trainings || []).map(t => (
            <div key={t.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 flex justify-between items-center">
              <div><h3 className="font-medium">{t.title}</h3><p className="text-xs text-[var(--text-secondary)]">{t.training_type} | {t.start_date} - {t.end_date}</p></div>
              <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs">{t.max_participants} مقعد</span>
            </div>
          ))}</div>
        </div>
      )}

      {tab === 'timesheets' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> تسجيل حضور</button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-5 gap-3">
                <input type="number" value={tsForm.user_id} onChange={e => setTsForm(p => ({ ...p, user_id: e.target.value }))} placeholder="رقم الموظف" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="date" value={tsForm.date} onChange={e => setTsForm(p => ({ ...p, date: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={tsForm.hours} onChange={e => setTsForm(p => ({ ...p, hours: parseFloat(e.target.value) || 0 }))} placeholder="الساعات" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={tsForm.activity} onChange={e => setTsForm(p => ({ ...p, activity: e.target.value }))} placeholder="النشاط" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <button onClick={async () => { await createTimesheet.mutateAsync({ ...tsForm, user_id: parseInt(tsForm.user_id) }); setShowForm(false); }} className="bg-violet-600 text-white rounded-lg">حفظ</button>
              </div>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">الموظف</th><th className="text-right p-3">التاريخ</th><th className="text-right p-3">الساعات</th><th className="text-right p-3">النشاط</th></tr></thead>
              <tbody>{tsLoading ? <tr><td colSpan={4} className="p-4 text-center">جاري التحميل...</td></tr> :
                (timesheets || []).map(t => (
                  <tr key={t.id} className="border-t border-[var(--border)]"><td className="p-3">{t.user_id}</td><td className="p-3">{t.date}</td><td className="p-3 font-mono">{t.hours}h</td><td className="p-3">{t.activity}</td></tr>
                ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'safety' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> تسجيل حضور أمني</button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <input type="number" value={safForm.user_id} onChange={e => setSafForm(p => ({ ...p, user_id: e.target.value }))} placeholder="رقم الموظف" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={safForm.location} onChange={e => setSafForm(p => ({ ...p, location: e.target.value }))} placeholder="الموقع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={safForm.status} onChange={e => setSafForm(p => ({ ...p, status: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="safe">آمن</option><option value="concerned">قلق</option><option value="emergency">طوارئ</option>
                </select>
                <button onClick={async () => { await createSafety.mutateAsync({ ...safForm, user_id: parseInt(safForm.user_id) }); setShowForm(false); }} className="bg-violet-600 text-white rounded-lg">تسجيل</button>
              </div>
            </div>
          )}
          <div className="grid gap-3">{safLoading ? <p className="text-center p-4">جاري التحميل...</p> : (safety || []).map(s => (
            <div key={s.id} className={`p-4 rounded-xl border ${s.status === 'safe' ? 'bg-green-50 border-green-200' : s.status === 'concerned' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between"><span>موظف #{s.user_id} — {s.location}</span><span className={`px-2 py-1 rounded text-xs ${s.status === 'safe' ? 'bg-green-100 text-green-700' : s.status === 'concerned' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{s.status === 'safe' ? 'آمن' : s.status === 'concerned' ? 'قلق' : 'طوارئ'}</span></div>
            </div>
          ))}</div>
        </div>
      )}

      {tab === 'contracts' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> عقد جديد</button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-5 gap-3">
                <input type="number" value={conForm.user_id} onChange={e => setConForm(p => ({ ...p, user_id: e.target.value }))} placeholder="رقم الموظف" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={conForm.contract_type} onChange={e => setConForm(p => ({ ...p, contract_type: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="full_time">دوام كامل</option><option value="part_time">دوام جزئي</option><option value="consultant">مستشار</option><option value="volunteer">متطوع</option>
                </select>
                <input type="date" value={conForm.start_date} onChange={e => setConForm(p => ({ ...p, start_date: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="date" value={conForm.end_date} onChange={e => setConForm(p => ({ ...p, end_date: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <button onClick={async () => { await createContract.mutateAsync({ ...conForm, user_id: parseInt(conForm.user_id) }); setShowForm(false); }} className="bg-violet-600 text-white rounded-lg">حفظ</button>
              </div>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">الموظف</th><th className="text-right p-3">النوع</th><th className="text-right p-3">البداية</th><th className="text-right p-3">النهاية</th></tr></thead>
              <tbody>{conLoading ? <tr><td colSpan={4} className="p-4 text-center">جاري التحميل...</td></tr> :
                (contracts || []).map(c => (
                  <tr key={c.id} className="border-t border-[var(--border)]"><td className="p-3">{c.user_id}</td><td className="p-3">{c.contract_type}</td><td className="p-3">{c.start_date}</td><td className="p-3">{c.end_date || 'مفتوح'}</td></tr>
                ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
