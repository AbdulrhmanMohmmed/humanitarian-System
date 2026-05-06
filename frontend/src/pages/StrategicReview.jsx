import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleDashed, Gauge, Layers3, ShieldAlert, Sparkles } from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';

const statusLabel = {
  complete: 'مكتمل تشغيليًا',
  implemented: 'منفذ جزئيًا',
  partial: 'أساس موجود',
  planned: 'مخطط',
};

function statusTone(status) {
  if (status === 'complete') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'implemented') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'partial') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function scoreStatus(score) {
  if (score >= 85) return 'complete';
  if (score >= 55) return 'implemented';
  if (score >= 25) return 'partial';
  return 'planned';
}

export default function StrategicReview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/strategic-review/')
      .then((res) => setData(res.data))
      .catch(() => setError('تعذر تحميل مركز المراجعة الاستراتيجية'));
  }, []);

  const summary = data?.summary || {};
  const overallStatus = useMemo(() => scoreStatus(summary.overall_score || 0), [summary.overall_score]);

  if (error) {
    return <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 font-bold text-rose-700">{error}</div>;
  }

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="text-sm font-black text-slate-400">جاري بناء مراجعة النقاط الـ22...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-indigo-700">
            <Sparkles size={14} />
            22-Point Strategic Operating Review
          </div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">مركز اكتمال الرؤية الاستراتيجية</h1>
          <p className="mt-2 max-w-4xl text-sm font-medium text-slate-500">
            هذه اللوحة تحول النقاط الـ22 إلى عناصر تشغيلية قابلة للقياس، وتعرض الأدلة الموجودة والفجوات المتبقية لكل محور.
          </p>
        </div>
        <div className={cn('rounded-lg border px-6 py-4 text-center', statusTone(overallStatus))}>
          <p className="text-[10px] font-black uppercase tracking-widest">Overall Maturity</p>
          <p className="text-4xl font-black">{summary.overall_score}%</p>
          <p className="text-xs font-black">{statusLabel[overallStatus]}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard title="مكتمل" value={summary.by_status?.complete || 0} icon={CheckCircle2} tone="complete" />
        <SummaryCard title="منفذ جزئيًا" value={summary.by_status?.implemented || 0} icon={Gauge} tone="implemented" />
        <SummaryCard title="أساس موجود" value={summary.by_status?.partial || 0} icon={Layers3} tone="partial" />
        <SummaryCard title="مخطط" value={summary.by_status?.planned || 0} icon={CircleDashed} tone="planned" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {data.items.map((item) => (
          <article key={item.number} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white dark:bg-white dark:text-slate-900">
                    {item.number}
                  </span>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">{item.title}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-black', statusTone(item.status))}>
                    {statusLabel[item.status]}
                  </span>
                  <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-black text-slate-500">
                    {item.score}%
                  </span>
                </div>
              </div>
              <Link to={item.route} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-700">
                فتح
                <ArrowLeft size={14} />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-emerald-600">أدلة موجودة</p>
                <ul className="space-y-2">
                  {item.evidence.map((entry) => (
                    <li key={entry} className="flex gap-2 text-sm font-bold text-slate-600">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-amber-600">الفجوات التالية</p>
                <ul className="space-y-2">
                  {item.gaps.map((entry) => (
                    <li key={entry} className="flex gap-2 text-sm font-bold text-slate-600">
                      <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-500" />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, tone }) {
  return (
    <div className={cn('rounded-lg border p-4', statusTone(tone))}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest">{title}</p>
        <Icon size={18} />
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}
