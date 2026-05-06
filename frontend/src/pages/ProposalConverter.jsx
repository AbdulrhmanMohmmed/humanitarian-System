import { useState } from 'react';
import { Activity, ArrowRight, CheckCircle2, Database, FileUp, Plus, Sparkles, Target } from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';

const fallbackExtraction = {
  project_name: 'مشروع مستخرج من المقترح',
  donor: '',
  budget: '0',
  sector: 'General',
  governorate: '',
  summary: 'مسودة قابلة للتعديل قبل التفعيل.',
  indicators: [
    { type: 'Output', name: 'عدد المستفيدين الذين تلقوا الخدمة', target: 1000, unit: 'فرد' },
    { type: 'Outcome', name: 'نسبة رضا المستفيدين عن جودة الخدمة', target: 80, unit: '%' },
  ],
  activities: [
    { name: 'تسجيل والتحقق من المستفيدين', location: 'مناطق التدخل', start_date: '', end_date: '' },
    { name: 'تنفيذ النشاط الرئيسي', location: 'مناطق التدخل', start_date: '', end_date: '' },
  ],
};

function normalizeExtraction(data, fileName) {
  return {
    ...fallbackExtraction,
    ...(data || {}),
    source_file: fileName,
    indicators: data?.indicators?.length ? data.indicators : fallbackExtraction.indicators,
    activities: data?.activities?.length ? data.activities : fallbackExtraction.activities,
  };
}

export default function ProposalConverter() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [extractedData, setExtractedData] = useState(null);
  const [activationStatus, setActivationStatus] = useState('');

  const startAnalysis = async () => {
    if (!file) return;
    setStatus('analyzing');
    setActivationStatus('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/ai/extract-proposal', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setExtractedData(normalizeExtraction(response.data, file.name));
    } catch (error) {
      console.warn('AI extraction failed, using editable local draft.', error);
      setExtractedData(normalizeExtraction(null, file.name));
    } finally {
      setStatus('completed');
    }
  };

  const updateExtracted = (patch) => setExtractedData((current) => ({ ...current, ...patch }));

  const updateIndicator = (index, patch) => {
    const indicators = [...extractedData.indicators];
    indicators[index] = { ...indicators[index], ...patch };
    updateExtracted({ indicators });
  };

  const updateActivity = (index, patch) => {
    const activities = [...extractedData.activities];
    activities[index] = { ...activities[index], ...patch };
    updateExtracted({ activities });
  };

  const activateProject = async () => {
    if (!extractedData) return;
    setActivationStatus('جاري إنشاء المشروع والأنشطة والمؤشرات...');
    try {
      const code = `AI-${Date.now().toString().slice(-6)}`;
      const projectResponse = await api.post('/projects/', {
        code,
        name: extractedData.project_name,
        sector: extractedData.sector || 'General',
        donor: extractedData.donor || '',
        governorate: extractedData.governorate || '',
        description: extractedData.summary || '',
        budget: Number(String(extractedData.budget || '0').replace(/[^\d.]/g, '')) || 0,
        target_beneficiaries: Number(extractedData.target_beneficiaries || 0),
        custom_values: {
          source: 'proposal_converter',
          source_file: extractedData.source_file || '',
        },
      });

      const projectId = projectResponse.data.id;

      await Promise.all(extractedData.activities.map((activity) => api.post('/activities/', {
        project_id: projectId,
        name: activity.name,
        description: activity.location || '',
        start_date: activity.start_date || null,
        end_date: activity.end_date || null,
        responsible: activity.responsible || '',
        custom_values: { source: 'proposal_converter' },
      })));

      await Promise.all(extractedData.indicators.map((indicator, index) => api.post('/monitoring/indicators', {
        project_id: projectId,
        code: indicator.code || `${code}-IND-${index + 1}`,
        name: indicator.name,
        type: String(indicator.type || 'output').toLowerCase(),
        unit: indicator.unit || '',
        target_value: Number(indicator.target || 0),
        baseline: 0,
        frequency: 'شهري',
        custom_values: { source: 'proposal_converter' },
      })));

      setActivationStatus(`تم تفعيل المشروع بنجاح: ${extractedData.activities.length} نشاط و ${extractedData.indicators.length} مؤشر.`);
    } catch (error) {
      console.error(error);
      setActivationStatus(error.response?.data?.detail || 'تعذر تفعيل المشروع. تحقق من البيانات وتسجيل الدخول.');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
          <Sparkles size={14} />
          Proposal-to-System Converter
        </div>
        <h1 className="text-4xl font-black text-[var(--text-primary)]">المحول الذكي للمقترحات</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium text-[var(--text-secondary)]">
          ارفع المقترح، راجع البيانات المستخرجة، ثم فعله ليتم إنشاء المشروع والأنشطة والمؤشرات داخل النظام.
        </p>
      </header>

      {status !== 'completed' && (
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
          }}
          className="relative flex min-h-[420px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-600/20 bg-blue-600/[0.03] p-10 text-center"
        >
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 cursor-pointer opacity-0" accept=".pdf,.doc,.docx,.txt" />
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-blue-600/10 text-blue-600">
            <FileUp size={40} />
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)]">{file ? file.name : 'اسحب المقترح هنا أو اضغط للاختيار'}</h2>
          <p className="mt-3 text-sm font-bold text-slate-400">PDF / Word / Text</p>
          <button onClick={startAnalysis} disabled={!file || status === 'analyzing'} className={cn('relative z-10 mt-8 h-13 rounded-2xl px-8 text-sm font-black text-white shadow-xl', file ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300')}>
            {status === 'analyzing' ? 'جاري التحليل...' : 'استخراج وبناء المسودة'}
          </button>
        </section>
      )}

      {status === 'completed' && extractedData && (
        <div className="space-y-6">
          <section className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-70">
              <CheckCircle2 size={14} /> مسودة قابلة للتفعيل
            </div>
            <input value={extractedData.project_name} onChange={(e) => updateExtracted({ project_name: e.target.value })} className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-2xl font-black text-white outline-none" />
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <input placeholder="المانح" value={extractedData.donor} onChange={(e) => updateExtracted({ donor: e.target.value })} className="h-11 rounded-xl border border-white/10 bg-white/10 px-3 text-sm font-bold outline-none" />
              <input placeholder="القطاع" value={extractedData.sector} onChange={(e) => updateExtracted({ sector: e.target.value })} className="h-11 rounded-xl border border-white/10 bg-white/10 px-3 text-sm font-bold outline-none" />
              <input placeholder="المحافظة" value={extractedData.governorate} onChange={(e) => updateExtracted({ governorate: e.target.value })} className="h-11 rounded-xl border border-white/10 bg-white/10 px-3 text-sm font-bold outline-none" />
              <input placeholder="الميزانية" value={extractedData.budget} onChange={(e) => updateExtracted({ budget: e.target.value })} className="h-11 rounded-xl border border-white/10 bg-white/10 px-3 text-sm font-bold outline-none" />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
              <h2 className="mb-4 flex items-center justify-between text-sm font-black text-[var(--text-primary)]">
                <span className="flex items-center gap-2"><Target size={18} className="text-blue-600" /> المؤشرات</span>
                <button onClick={() => updateExtracted({ indicators: [...extractedData.indicators, { type: 'Output', name: 'مؤشر جديد', target: 0, unit: '' }] })} className="rounded-xl bg-blue-600 px-3 py-2 text-xs text-white"><Plus size={14} /></button>
              </h2>
              <div className="space-y-3">
                {extractedData.indicators.map((indicator, index) => (
                  <div key={index} className="grid gap-2 rounded-2xl bg-black/5 p-4 md:grid-cols-[120px_1fr_90px]">
                    <input value={indicator.type} onChange={(e) => updateIndicator(index, { type: e.target.value })} className="h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-xs font-black" />
                    <input value={indicator.name} onChange={(e) => updateIndicator(index, { name: e.target.value })} className="h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-xs font-bold" />
                    <input type="number" value={indicator.target} onChange={(e) => updateIndicator(index, { target: Number(e.target.value) })} className="h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-xs font-black" />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
              <h2 className="mb-4 flex items-center justify-between text-sm font-black text-[var(--text-primary)]">
                <span className="flex items-center gap-2"><Activity size={18} className="text-emerald-600" /> الأنشطة</span>
                <button onClick={() => updateExtracted({ activities: [...extractedData.activities, { name: 'نشاط جديد', location: '' }] })} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs text-white"><Plus size={14} /></button>
              </h2>
              <div className="space-y-3">
                {extractedData.activities.map((activity, index) => (
                  <div key={index} className="grid gap-2 rounded-2xl bg-black/5 p-4 md:grid-cols-[1fr_160px]">
                    <input value={activity.name} onChange={(e) => updateActivity(index, { name: e.target.value })} className="h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-xs font-bold" />
                    <input value={activity.location || ''} onChange={(e) => updateActivity(index, { location: e.target.value })} className="h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-xs font-bold" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-[var(--border)] bg-slate-950 p-5 text-white">
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Database size={15} /> التفعيل داخل النظام
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <button onClick={activateProject} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white hover:bg-blue-700">
                تفعيل المشروع وبناء النظام <ArrowRight size={18} />
              </button>
              <button onClick={() => { setStatus('idle'); setExtractedData(null); setActivationStatus(''); }} className="h-12 rounded-2xl bg-white/10 px-6 text-sm font-black text-white">
                إعادة الرفع
              </button>
              {activationStatus && <p className="text-sm font-bold text-blue-200">{activationStatus}</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
