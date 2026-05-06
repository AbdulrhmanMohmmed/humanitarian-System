import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  DatabaseZap,
  FolderKanban,
  Gauge,
  GitPullRequestArrow,
  MessageSquare,
  Play,
  Save,
  Target,
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

function tone(value) {
  if (value >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (value >= 55) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
}

function severityTone(value) {
  if (['critical', 'high', 'rejected'].includes(value)) return 'text-rose-700 bg-rose-50 border-rose-200';
  if (['medium', 'pending', 'needs_revision'].includes(value)) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-emerald-700 bg-emerald-50 border-emerald-200';
}

const emptyRef = {
  indicator_id: '',
  calculation_method: '',
  verification_source: '',
  confidence_level: 70,
  documentation_complete: false,
  quality_threshold: 80,
  owner: '',
  review_frequency: 'monthly',
};

function emptyIptt(indicatorId = '', projectId = '') {
  return {
    indicator_id: indicatorId,
    project_id: projectId,
    year: currentYear,
    month: currentMonth,
    target_value: 0,
    actual_value: 0,
    deviation_explanation: '',
    corrective_action: '',
    submit_for_approval: true,
  };
}

export default function PhaseOneCore() {
  const [overview, setOverview] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [references, setReferences] = useState([]);
  const [findings, setFindings] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState('');
  const [refForm, setRefForm] = useState(emptyRef);
  const [ipttForm, setIpttForm] = useState(emptyIptt());
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadOverview = useCallback(() => {
    return api.get('/phase-one/overview').then((res) => {
      setOverview(res.data);
      if (!selectedProjectId && res.data.projects?.length) {
        setSelectedProjectId(String(res.data.projects[0].id));
      }
    });
  }, [selectedProjectId]);

  const loadWorkspace = useCallback(() => {
    if (!selectedProjectId) return Promise.resolve();
    return api.get(`/phase-one/projects/${selectedProjectId}/workspace`).then((res) => {
      setWorkspace(res.data);
      if (!selectedIndicatorId && res.data.indicators?.length) {
        setSelectedIndicatorId(String(res.data.indicators[0].id));
      }
    });
  }, [selectedProjectId, selectedIndicatorId]);

  const loadOperatingLists = useCallback(() => {
    const findingsUrl = selectedProjectId
      ? `/operating/data-quality-findings?project_id=${selectedProjectId}`
      : '/operating/data-quality-findings';
    return Promise.all([
      api.get('/operating/indicator-references'),
      api.get(findingsUrl),
      api.get('/operating/approvals?status=pending'),
    ]).then(([refsRes, findingsRes, approvalsRes]) => {
      setReferences(refsRes.data);
      setFindings(findingsRes.data);
      setApprovals(approvalsRes.data);
    });
  }, [selectedProjectId]);

  const refreshAll = useCallback(() => (
    Promise.all([loadOverview(), loadWorkspace(), loadOperatingLists()])
  ), [loadOverview, loadWorkspace, loadOperatingLists]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!selectedProjectId) return;
    Promise.all([loadWorkspace(), loadOperatingLists()]);
  }, [selectedProjectId, loadWorkspace, loadOperatingLists]);

  const selectedProject = useMemo(
    () => overview?.projects?.find((project) => String(project.id) === String(selectedProjectId)),
    [overview, selectedProjectId],
  );

  const selectedIndicator = useMemo(
    () => workspace?.indicators?.find((indicator) => String(indicator.id) === String(selectedIndicatorId)),
    [workspace, selectedIndicatorId],
  );

  useEffect(() => {
    if (!selectedIndicator || !selectedProjectId) return;
    const ref = references.find((item) => String(item.indicator_id) === String(selectedIndicator.id));
    setRefForm({
      indicator_id: selectedIndicator.id,
      calculation_method: ref?.calculation_method || '',
      verification_source: ref?.verification_source || '',
      confidence_level: ref?.confidence_level ?? 70,
      documentation_complete: Boolean(ref?.documentation_complete),
      quality_threshold: ref?.quality_threshold ?? 80,
      owner: ref?.owner || '',
      review_frequency: ref?.review_frequency || 'monthly',
    });
    setIpttForm(emptyIptt(selectedIndicator.id, selectedProjectId));
  }, [selectedIndicator, selectedProjectId, references]);

  const setNotice = (text, isError = false) => {
    setMessage(isError ? '' : text);
    setError(isError ? text : '');
  };

  const runQuality = async () => {
    if (!selectedProjectId) return;
    setBusy('quality');
    setNotice('');
    try {
      const res = await api.post(`/phase-one/projects/${selectedProjectId}/run-data-quality`);
      setNotice(`تم تشغيل قواعد الجودة وإنشاء ${res.data.created_findings} ملاحظة جديدة.`);
      await refreshAll();
    } finally {
      setBusy('');
    }
  };

  const applySla = async () => {
    setBusy('sla');
    setNotice('');
    try {
      const res = await api.post('/phase-one/cfm/apply-sla', {});
      setNotice(`تم تطبيق SLA على ${res.data.updated_complaints} شكوى.`);
      await refreshAll();
    } finally {
      setBusy('');
    }
  };

  const saveReference = async (event) => {
    event.preventDefault();
    if (!selectedIndicator) return;
    setBusy('reference');
    setNotice('');
    try {
      await api.post('/operating/indicator-references', {
        ...refForm,
        indicator_id: Number(selectedIndicator.id),
        confidence_level: Number(refForm.confidence_level),
        quality_threshold: Number(refForm.quality_threshold),
      });
      setNotice('تم تحديث بطاقة تعريف المؤشر وحساب درجة الصحة.');
      await refreshAll();
    } finally {
      setBusy('');
    }
  };

  const submitSmartIptt = async (event) => {
    event.preventDefault();
    setBusy('iptt');
    setNotice('');
    try {
      const payload = {
        ...ipttForm,
        indicator_id: Number(ipttForm.indicator_id),
        project_id: Number(ipttForm.project_id),
        year: Number(ipttForm.year),
        month: Number(ipttForm.month),
        target_value: Number(ipttForm.target_value),
        actual_value: Number(ipttForm.actual_value),
      };
      const res = await api.post('/phase-one/iptt/smart-entry', payload);
      setNotice(`تم إدخال Smart IPTT بنسبة إنجاز ${res.data.achievement_rate}% وإرساله للاعتماد.`);
      await refreshAll();
    } catch (err) {
      setNotice(err.response?.data?.detail || 'تعذر إدخال Smart IPTT', true);
    } finally {
      setBusy('');
    }
  };

  const resolveFinding = async (findingId) => {
    setBusy(`finding-${findingId}`);
    try {
      await api.put(`/operating/data-quality-findings/${findingId}`, {
        status: 'resolved',
        resolution_notes: 'تمت المعالجة من مساحة المرحلة الأولى',
      });
      setNotice('تم إغلاق ملاحظة الجودة.');
      await refreshAll();
    } finally {
      setBusy('');
    }
  };

  const decideApproval = async (approvalId, status) => {
    setBusy(`approval-${approvalId}`);
    try {
      await api.put(`/operating/approvals/${approvalId}/decision`, {
        status,
        decision_notes: status === 'approved' ? 'تم الاعتماد من مساحة المرحلة الأولى' : 'تحتاج مراجعة إضافية',
      });
      setNotice(status === 'approved' ? 'تم اعتماد العنصر.' : 'تم إرجاع العنصر للمراجعة.');
      await refreshAll();
    } finally {
      setBusy('');
    }
  };

  if (!overview) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="text-sm font-black text-slate-400">جاري تجهيز نواة المرحلة الأولى...</p>
        </div>
      </div>
    );
  }

  const summary = overview.summary;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-blue-700">
            Phase 1 Operating Core
          </div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">نواة التنفيذ للمرحلة الأولى</h1>
          <p className="mt-2 max-w-4xl text-sm font-medium text-slate-500">
            مساحة تشغيل كاملة للمشروع، بطاقة المؤشر، Smart IPTT، جودة البيانات، الموافقات، وCFM/SLA.
          </p>
        </div>
        <div className={cn('rounded-lg border px-6 py-4 text-center', tone(summary.operating_score))}>
          <p className="text-[10px] font-black uppercase tracking-widest">Phase 1 Score</p>
          <p className="text-4xl font-black">{summary.operating_score}%</p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="المؤشرات الحرجة" value={summary.critical_indicators} caption={`${summary.indicators} مؤشر إجمالًا`} icon={Target} status={summary.critical_indicators ? 30 : 90} />
        <Metric title="جودة البيانات" value={summary.open_data_quality_findings} caption="ملاحظات مفتوحة" icon={DatabaseZap} status={summary.open_data_quality_findings ? 50 : 90} />
        <Metric title="الموافقات" value={summary.pending_approvals} caption="بانتظار الاعتماد" icon={ClipboardCheck} status={summary.pending_approvals ? 55 : 90} />
        <Metric title="CFM / SLA" value={summary.overdue_complaints} caption={`${summary.open_complaints} شكاوى مفتوحة`} icon={MessageSquare} status={summary.overdue_complaints ? 30 : 90} />
      </section>

      {(message || error) && (
        <div className={cn('rounded-lg border p-4 text-sm font-bold', error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
          {error || message}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
            <FolderKanban size={17} className="text-blue-600" />
            Project Design Workspace
          </h2>
          <select
            value={selectedProjectId}
            onChange={(event) => {
              setSelectedProjectId(event.target.value);
              setSelectedIndicatorId('');
            }}
            className="mb-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
          >
            {overview.projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          {selectedProject && (
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-xs font-black text-slate-400">القطاع</p>
                <p className="font-black text-slate-800 dark:text-slate-100">{selectedProject.sector || 'غير محدد'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Mini label="صحة المؤشرات" value={`${selectedProject.indicator_health}%`} />
                <Mini label="درجة الخطر" value={selectedProject.risk_score} />
                <Mini label="ملاحظات الجودة" value={selectedProject.data_quality_findings} />
                <Mini label="الشكاوى المفتوحة" value={selectedProject.open_complaints} />
              </div>
              <button onClick={runQuality} disabled={busy === 'quality'} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60">
                <Play size={16} />
                تشغيل Data Quality v1
              </button>
              <button onClick={applySla} disabled={busy === 'sla'} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-60">
                <CheckCircle2 size={16} />
                تطبيق CFM SLA
              </button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
            <Gauge size={17} className="text-blue-600" />
            Indicator Registry + Smart IPTT
          </h2>
          {!workspace?.indicators?.length ? (
            <Empty text="لا توجد مؤشرات مرتبطة بهذا المشروع بعد." />
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-950">
                    <tr>
                      <th className="px-4 py-3 text-right">المؤشر</th>
                      <th className="px-4 py-3 text-right">الإنجاز</th>
                      <th className="px-4 py-3 text-right">الصحة</th>
                      <th className="px-4 py-3 text-right">آخر IPTT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {workspace.indicators.map((indicator) => (
                      <tr
                        key={indicator.id}
                        onClick={() => setSelectedIndicatorId(String(indicator.id))}
                        className={cn('cursor-pointer transition hover:bg-blue-50/50 dark:hover:bg-slate-800', String(indicator.id) === String(selectedIndicatorId) && 'bg-blue-50 dark:bg-slate-800')}
                      >
                        <td className="px-4 py-3">
                          <p className="font-black text-slate-800 dark:text-slate-100">{indicator.name}</p>
                          <p className="text-xs font-bold text-slate-400">{indicator.code || `IND-${indicator.id}`}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-600">{indicator.actual} / {indicator.target}</td>
                        <td className="px-4 py-3">
                          <span className={cn('rounded-full border px-2 py-1 text-xs font-black', tone(indicator.health_score))}>{indicator.health_score}%</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-500">
                          {indicator.latest_iptt ? `${indicator.latest_iptt.period} · ${indicator.latest_iptt.achievement_rate}%` : 'لا يوجد'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <form onSubmit={saveReference} className="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
                  <h3 className="mb-3 text-sm font-black text-slate-800 dark:text-slate-100">بطاقة تعريف المؤشر</h3>
                  <Field label="طريقة الحساب" value={refForm.calculation_method} onChange={(v) => setRefForm({ ...refForm, calculation_method: v })} />
                  <Field label="مصدر التحقق" value={refForm.verification_source} onChange={(v) => setRefForm({ ...refForm, verification_source: v })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="مستوى الثقة" type="number" value={refForm.confidence_level} onChange={(v) => setRefForm({ ...refForm, confidence_level: v })} />
                    <Field label="حد الجودة" type="number" value={refForm.quality_threshold} onChange={(v) => setRefForm({ ...refForm, quality_threshold: v })} />
                  </div>
                  <Field label="المسؤول" value={refForm.owner} onChange={(v) => setRefForm({ ...refForm, owner: v })} />
                  <label className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-600">
                    <input type="checkbox" checked={refForm.documentation_complete} onChange={(event) => setRefForm({ ...refForm, documentation_complete: event.target.checked })} />
                    التوثيق مكتمل
                  </label>
                  <button disabled={!selectedIndicator || busy === 'reference'} className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-black text-white disabled:opacity-60">
                    <Save size={15} />
                    حفظ بطاقة المؤشر
                  </button>
                </form>

                <form onSubmit={submitSmartIptt} className="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
                  <h3 className="mb-3 text-sm font-black text-slate-800 dark:text-slate-100">Smart IPTT Entry</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="السنة" type="number" value={ipttForm.year} onChange={(v) => setIpttForm({ ...ipttForm, year: v })} />
                    <Field label="الشهر" type="number" value={ipttForm.month} onChange={(v) => setIpttForm({ ...ipttForm, month: v })} />
                    <Field label="المستهدف" type="number" value={ipttForm.target_value} onChange={(v) => setIpttForm({ ...ipttForm, target_value: v })} />
                    <Field label="المنجز" type="number" value={ipttForm.actual_value} onChange={(v) => setIpttForm({ ...ipttForm, actual_value: v })} />
                  </div>
                  <Field label="تفسير الانحراف" value={ipttForm.deviation_explanation} onChange={(v) => setIpttForm({ ...ipttForm, deviation_explanation: v })} />
                  <Field label="الخطة التصحيحية" value={ipttForm.corrective_action} onChange={(v) => setIpttForm({ ...ipttForm, corrective_action: v })} />
                  <label className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-600">
                    <input type="checkbox" checked={ipttForm.submit_for_approval} onChange={(event) => setIpttForm({ ...ipttForm, submit_for_approval: event.target.checked })} />
                    إرسال للاعتماد
                  </label>
                  <button disabled={!selectedIndicator || busy === 'iptt'} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-60">
                    <Play size={15} />
                    إدخال Smart IPTT
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="ملاحظات جودة البيانات" icon={DatabaseZap} empty="لا توجد ملاحظات جودة لهذا المشروع.">
          {findings.map((finding) => (
            <div key={finding.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-800 dark:text-slate-100">{finding.title}</p>
                  <p className="text-xs font-bold text-slate-400">{finding.finding_type} · {finding.status}</p>
                </div>
                <span className={cn('rounded-full border px-2 py-1 text-[10px] font-black', severityTone(finding.severity))}>{finding.severity}</span>
              </div>
              {finding.status !== 'resolved' && (
                <button onClick={() => resolveFinding(finding.id)} disabled={busy === `finding-${finding.id}`} className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60">
                  إغلاق كمُعالج
                </button>
              )}
            </div>
          ))}
        </Panel>

        <Panel title="اعتمادات Smart IPTT" icon={GitPullRequestArrow} empty="لا توجد عناصر معلقة للاعتماد.">
          {approvals.map((approval) => (
            <div key={approval.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-800 dark:text-slate-100">{approval.entity_type} #{approval.entity_id}</p>
                  <p className="text-xs font-bold text-slate-400">{approval.required_role || 'مراجعة تشغيلية'} · {approval.status}</p>
                </div>
                <span className={cn('rounded-full border px-2 py-1 text-[10px] font-black', severityTone(approval.status))}>{approval.status}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => decideApproval(approval.id, 'approved')} disabled={busy === `approval-${approval.id}`} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white disabled:opacity-60">
                  اعتماد
                </button>
                <button onClick={() => decideApproval(approval.id, 'needs_revision')} disabled={busy === `approval-${approval.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 disabled:opacity-60">
                  إرجاع للمراجعة
                </button>
              </div>
            </div>
          ))}
        </Panel>
      </section>

      {workspace && (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <MiniCard title="الأنشطة" value={workspace.activities} icon={FolderKanban} />
          <MiniCard title="خطط MEAL" value={workspace.meal_plans} icon={ClipboardCheck} />
          <MiniCard title="المخاطر" value={workspace.risks} icon={AlertTriangle} />
          <MiniCard title="التوصيات" value={workspace.recommendations} icon={CheckCircle2} />
          <MiniCard title="الشكاوى" value={workspace.complaints} icon={MessageSquare} />
        </section>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-black text-slate-500">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
      />
    </label>
  );
}

function Empty({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-950">
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
      <div className="space-y-3">{hasItems ? items : <Empty text={empty} />}</div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function MiniCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-slate-500">{title}</p>
        <Icon size={17} className="text-blue-600" />
      </div>
      <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function Metric({ title, value, caption, icon: Icon, status = 80 }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{caption}</p>
        </div>
        <div className={cn('rounded-lg border p-2.5', tone(status))}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
