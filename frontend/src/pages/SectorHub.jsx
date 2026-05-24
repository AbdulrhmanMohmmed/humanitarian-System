import { useEffect, useMemo, useState } from 'react';
import { Activity, Calculator, Droplets, GraduationCap, Heart, Plus, Save, ShieldCheck, Trash2, Wheat } from 'lucide-react';
import { cn } from '../lib/utils';

const STORAGE_KEY = 'hiaos_sector_calculations';

const sectors = [
  { id: 'fsl', label: 'الأمن الغذائي والزراعة', icon: Wheat, color: 'bg-emerald-600' },
  { id: 'wash', label: 'المياه والإصحاح', icon: Droplets, color: 'bg-blue-600' },
  { id: 'protection', label: 'الحماية', icon: ShieldCheck, color: 'bg-indigo-600' },
  { id: 'health', label: 'الصحة والتغذية', icon: Heart, color: 'bg-rose-600' },
  { id: 'education', label: 'التعليم', icon: GraduationCap, color: 'bg-amber-600' },
];
import api from '../services/api';

const defaultFcs = { cereal: 7, pulses: 4, veg: 7, fruit: 7, meat: 3, dairy: 3, sugar: 7, oil: 7 };
const defaultRcsi = { lessPreferred: 0, borrowFood: 0, limitPortions: 0, restrictAdults: 0, reduceMeals: 0 };
const defaultWash = { waterLiters: 15, latrineUsers: 20, handwashingAccess: 80, safeWaterPercent: 90 };
const defaultProtection = { casesOpen: 0, casesClosed: 0, referrals: 0, highRisk: 0 };

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function scoreFcs(values) {
  return (values.cereal * 2) + (values.pulses * 3) + values.veg + values.fruit + (values.meat * 4) + (values.dairy * 4) + (values.sugar * 0.5) + (values.oil * 0.5);
}

function classifyFcs(score) {
  if (score <= 21) return 'Poor';
  if (score <= 35) return 'Borderline';
  return 'Acceptable';
}

export default function SectorHub() {
  const [activeSector, setActiveSector] = useState('fsl');
  const [fcsData, setFcsData] = useState(defaultFcs);
  const [rcsiData, setRcsiData] = useState(defaultRcsi);
  const [washData, setWashData] = useState(defaultWash);
  const [protectionData, setProtectionData] = useState(defaultProtection);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(loadHistory());
    api.get('/sector-indicators/').then(r => {
      const items = Array.isArray(r.data) ? r.data : (r.data.items || r.data.indicators || []);
      if (items.length > 0) setHistory(prev => [...prev, ...items.map(i => ({ ...i, source: 'api' }))]);
    }).catch(() => {});
  }, []);

  const fcs = scoreFcs(fcsData);
  const rcsi = (rcsiData.lessPreferred * 1) + (rcsiData.borrowFood * 2) + (rcsiData.limitPortions * 1) + (rcsiData.restrictAdults * 3) + (rcsiData.reduceMeals * 1);
  const washScore = Math.round(((washData.waterLiters >= 15 ? 30 : washData.waterLiters * 2) + (washData.latrineUsers <= 20 ? 30 : Math.max(0, 40 - washData.latrineUsers)) + (washData.handwashingAccess * 0.2) + (washData.safeWaterPercent * 0.2)));
  const protectionClosure = protectionData.casesOpen + protectionData.casesClosed > 0 ? Math.round((protectionData.casesClosed / (protectionData.casesOpen + protectionData.casesClosed)) * 100) : 0;

  const currentResult = useMemo(() => {
    if (activeSector === 'fsl') return { title: 'Food Consumption Score', score: fcs.toFixed(1), status: classifyFcs(fcs), payload: { fcsData, rcsiData } };
    if (activeSector === 'wash') return { title: 'WASH Standards Score', score: washScore, status: washScore >= 75 ? 'Compliant' : washScore >= 50 ? 'Needs improvement' : 'Critical', payload: washData };
    if (activeSector === 'protection') return { title: 'Protection Case Closure', score: `${protectionClosure}%`, status: protectionData.highRisk > 0 ? 'High-risk cases' : 'Stable', payload: protectionData };
    return { title: 'Sector Readiness', score: 0, status: 'Ready for configuration', payload: {} };
  }, [activeSector, fcs, fcsData, protectionClosure, protectionData, rcsiData, washData, washScore]);

  const saveResult = () => {
    const item = {
      id: Date.now(),
      sector: activeSector,
      ...currentResult,
      created_at: new Date().toISOString(),
    };
    const next = [item, ...history].slice(0, 30);
    setHistory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const deleteHistory = (id) => {
    const next = history.filter((item) => item.id !== id);
    setHistory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const NumberInput = ({ label, value, onChange }) => (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-sm font-black outline-none focus:border-blue-500" />
    </label>
  );

  return (
    <div className="space-y-8 pb-20">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
          <Calculator size={14} /> Sector Calculators
        </div>
        <h1 className="text-4xl font-black text-[var(--text-primary)]">مركز القطاعات المتخصص</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium text-[var(--text-secondary)]">
          حاسبات عملية للقطاعات الإنسانية مع حفظ نتائج الحسابات لاستخدامها في التحليل والتقارير.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr_320px]">
        <aside className="space-y-3">
          {sectors.map((sector) => {
            const Icon = sector.icon;
            return (
              <button key={sector.id} onClick={() => setActiveSector(sector.id)} className={cn('flex w-full items-center justify-between rounded-2xl p-4 text-right text-xs font-black transition', activeSector === sector.id ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-xl' : 'text-slate-400 hover:bg-black/5')}>
                <span className="flex items-center gap-3"><span className={cn('rounded-xl p-2 text-white', sector.color)}><Icon size={16} /></span>{sector.label}</span>
                <Plus size={14} className={activeSector === sector.id ? 'rotate-45 text-blue-600' : ''} />
              </button>
            );
          })}
        </aside>

        <main className="space-y-6">
          {activeSector === 'fsl' && (
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <h2 className="mb-5 flex items-center gap-2 text-sm font-black"><Wheat className="text-emerald-600" size={18} /> حاسبة الأمن الغذائي FCS و rCSI</h2>
              <div className="grid gap-4 md:grid-cols-4">
                {Object.entries(fcsData).map(([key, value]) => <NumberInput key={key} label={key} value={value} onChange={(next) => setFcsData({ ...fcsData, [key]: Math.min(7, Math.max(0, next)) })} />)}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-5">
                {Object.entries(rcsiData).map(([key, value]) => <NumberInput key={key} label={key} value={value} onChange={(next) => setRcsiData({ ...rcsiData, [key]: Math.min(7, Math.max(0, next)) })} />)}
              </div>
            </section>
          )}

          {activeSector === 'wash' && (
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <h2 className="mb-5 flex items-center gap-2 text-sm font-black"><Droplets className="text-blue-600" size={18} /> حاسبة معايير WASH</h2>
              <div className="grid gap-4 md:grid-cols-4">
                <NumberInput label="لتر مياه/فرد/يوم" value={washData.waterLiters} onChange={(value) => setWashData({ ...washData, waterLiters: value })} />
                <NumberInput label="مستخدم/مرحاض" value={washData.latrineUsers} onChange={(value) => setWashData({ ...washData, latrineUsers: value })} />
                <NumberInput label="غسل اليدين %" value={washData.handwashingAccess} onChange={(value) => setWashData({ ...washData, handwashingAccess: value })} />
                <NumberInput label="مياه آمنة %" value={washData.safeWaterPercent} onChange={(value) => setWashData({ ...washData, safeWaterPercent: value })} />
              </div>
            </section>
          )}

          {activeSector === 'protection' && (
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <h2 className="mb-5 flex items-center gap-2 text-sm font-black"><ShieldCheck className="text-indigo-600" size={18} /> متابعة حالات الحماية المجملة</h2>
              <div className="grid gap-4 md:grid-cols-4">
                <NumberInput label="حالات مفتوحة" value={protectionData.casesOpen} onChange={(value) => setProtectionData({ ...protectionData, casesOpen: value })} />
                <NumberInput label="حالات مغلقة" value={protectionData.casesClosed} onChange={(value) => setProtectionData({ ...protectionData, casesClosed: value })} />
                <NumberInput label="إحالات" value={protectionData.referrals} onChange={(value) => setProtectionData({ ...protectionData, referrals: value })} />
                <NumberInput label="مخاطر عالية" value={protectionData.highRisk} onChange={(value) => setProtectionData({ ...protectionData, highRisk: value })} />
              </div>
            </section>
          )}

          {!['fsl', 'wash', 'protection'].includes(activeSector) && (
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-10 text-center">
              <Activity className="mx-auto mb-4 text-slate-300" size={48} />
              <h2 className="text-xl font-black">قالب جاهز للتخصيص</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">يمكن ربط هذا القطاع لاحقا بمؤشرات خاصة أو حاسبات متخصصة من مركز التخصيص.</p>
            </section>
          )}

          <section className="rounded-3xl bg-slate-950 p-6 text-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{currentResult.title}</p>
                <h2 className="mt-2 text-5xl font-black">{currentResult.score}</h2>
                <p className="mt-2 text-sm font-bold text-blue-200">{currentResult.status}</p>
              </div>
              <button onClick={saveResult} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white hover:bg-blue-700">
                <Save size={18} /> حفظ النتيجة
              </button>
            </div>
          </section>
        </main>

        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h2 className="mb-4 text-sm font-black text-[var(--text-primary)]">سجل النتائج</h2>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--border)] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-black text-[var(--text-primary)]">{item.title}</p>
                    <p className="mt-1 text-lg font-black text-blue-600">{item.score}</p>
                    <p className="text-[10px] font-bold text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => deleteHistory(item.id)} className="text-rose-500"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
            {!history.length && <p className="rounded-2xl bg-black/5 p-5 text-center text-xs font-bold text-slate-400">لا توجد نتائج محفوظة بعد</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
