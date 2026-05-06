import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  DatabaseZap,
  Gauge,
  GitPullRequestArrow,
  Radar,
  ShieldAlert,
  Target,
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';

function toneClass(status) {
  if (['critical', 'red', 'high'].includes(status)) return 'text-rose-600 bg-rose-50 border-rose-200';
  if (['watch', 'yellow', 'medium'].includes(status)) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-emerald-600 bg-emerald-50 border-emerald-200';
}

function scoreTone(score) {
  if (score < 55) return 'critical';
  if (score < 80) return 'watch';
  return 'healthy';
}

function Metric({ title, value, caption, icon: Icon, status = 'healthy' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{caption}</p>
        </div>
        <div className={cn('rounded-lg border p-2.5', toneClass(status))}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-900/50">
      {text}
    </div>
  );
}

function Panel({ title, icon: Icon, empty, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasItems = Array.isArray(items) ? items.length > 0 : Boolean(items);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
        <Icon size={17} className="text-blue-600" />
        {title}
      </h2>
      <div className="space-y-3">{hasItems ? items : <EmptyState text={empty} />}</div>
    </div>
  );
}

function Row({ title, subtitle, status }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <div>
        <p className="text-sm font-black text-slate-800 dark:text-slate-100">{title}</p>
        <p className="text-xs font-bold text-slate-400">{subtitle}</p>
      </div>
      <span className={cn('rounded-full border px-2 py-1 text-[10px] font-black', toneClass(status))}>{status}</span>
    </div>
  );
}

export default function Watchtower() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/operating/watchtower')
      .then((res) => setData(res.data))
      .catch(() => setError('تعذر تحميل بيانات برج المراقبة'));
  }, []);

  const summary = data?.summary || {};
  const operatingStatus = useMemo(() => scoreTone(summary.operating_score || 0), [summary.operating_score]);

  if (error) {
    return <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 font-bold text-rose-700">{error}</div>;
  }

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="text-sm font-black text-slate-400">جاري تشغيل برج المراقبة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-blue-700">
            <Radar size={14} />
            Humanitarian Intelligence Watchtower
          </div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">برج المراقبة التنفيذي</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            شاشة موحدة تربط صحة المؤشرات، جودة البيانات، الموافقات، الشكاوى الحساسة، والمخاطر التشغيلية في قرار واحد قابل للتدقيق.
          </p>
        </div>
        <div className={cn('rounded-lg border px-5 py-3 text-center', toneClass(operatingStatus))}>
          <p className="text-[10px] font-black uppercase tracking-widest">Operating Score</p>
          <p className="text-3xl font-black">{summary.operating_score || 0}%</p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="صحة المؤشرات" value={`${summary.average_indicator_health || 0}%`} caption={`${summary.critical_indicators || 0} مؤشر حرج`} icon={Target} status={scoreTone(summary.average_indicator_health || 0)} />
        <Metric title="جودة البيانات" value={summary.open_data_quality_findings || 0} caption={`${summary.severe_data_quality_findings || 0} ملاحظات عالية الخطورة`} icon={DatabaseZap} status={summary.severe_data_quality_findings ? 'critical' : 'healthy'} />
        <Metric title="الموافقات" value={summary.pending_approvals || 0} caption="عناصر قيد المراجعة" icon={GitPullRequestArrow} status={summary.pending_approvals ? 'watch' : 'healthy'} />
        <Metric title="المساءلة والمخاطر" value={(summary.sensitive_open_complaints || 0) + (summary.high_risks || 0)} caption="شكاوى حساسة ومخاطر عالية" icon={ShieldAlert} status={(summary.sensitive_open_complaints || summary.high_risks) ? 'critical' : 'healthy'} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
              <Gauge size={17} className="text-blue-600" />
              أضعف المؤشرات صحة
            </h2>
            <span className="text-xs font-bold text-slate-400">{data.indicator_cards.length} عناصر</span>
          </div>
          {data.indicator_cards.length === 0 ? (
            <EmptyState text="لا توجد مؤشرات كافية بعد لبناء درجة الصحة." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-950">
                  <tr>
                    <th className="px-4 py-3 text-right">المؤشر</th>
                    <th className="px-4 py-3 text-right">التقدم</th>
                    <th className="px-4 py-3 text-right">الصحة</th>
                    <th className="px-4 py-3 text-right">خطة التصحيح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.indicator_cards.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-slate-800 dark:text-slate-100">{item.name}</p>
                        <p className="text-xs font-bold text-slate-400">{item.code || `IND-${item.id}`}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-600">{item.actual} / {item.target}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-black', toneClass(item.health_status))}>
                          {item.health_score}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-500">{item.corrective_action || 'غير محددة'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
            <AlertTriangle size={17} className="text-rose-600" />
            مشاريع معرضة للخطر
          </h2>
          {data.at_risk_projects.length === 0 ? (
            <EmptyState text="لا توجد مشاريع حرجة حاليًا." />
          ) : (
            <div className="space-y-3">
              {data.at_risk_projects.map((project) => (
                <div key={project.id} className="rounded-lg border border-rose-100 bg-rose-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-rose-950">{project.name}</p>
                      <p className="text-xs font-bold text-rose-500">{project.sector || 'قطاع غير محدد'}</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-rose-600">{project.risk_score}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-black text-rose-700">
                    <span>مؤشرات {project.risk_reasons.critical_indicators}</span>
                    <span>شكاوى {project.risk_reasons.sensitive_complaints}</span>
                    <span>جودة {project.risk_reasons.severe_data_quality_findings}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="ملاحظات جودة البيانات" icon={DatabaseZap} empty="لا توجد ملاحظات جودة حديثة.">
          {data.recent_findings.map((finding) => (
            <Row key={finding.id} title={finding.title} subtitle={`${finding.finding_type} · ${finding.status}`} status={finding.severity} />
          ))}
        </Panel>
        <Panel title="طلبات الموافقة" icon={ClipboardCheck} empty="لا توجد موافقات معلقة.">
          {data.pending_approvals.map((approval) => (
            <Row key={approval.id} title={`${approval.entity_type} #${approval.entity_id}`} subtitle={approval.required_role || 'مراجعة تشغيلية'} status="watch" />
          ))}
        </Panel>
        <Panel title="سجل التدقيق التشغيلي" icon={CheckCircle2} empty="لا توجد أحداث تدقيق بعد.">
          {data.recent_events.map((event) => (
            <Row key={event.id} title={event.action} subtitle={event.summary || event.entity_type} status={event.sensitivity} />
          ))}
        </Panel>
      </section>
    </div>
  );
}
