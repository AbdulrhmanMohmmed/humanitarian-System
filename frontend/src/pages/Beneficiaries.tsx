import { useCallback, useEffect, useState, type FormEvent } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Edit3, Plus, Save, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import CustomFieldsForm from '../components/CustomFieldsForm';
import CustomizeModuleButton from '../components/CustomizeModuleButton';
import { renderCustomFieldValue, useCustomization } from '../hooks/useCustomization';
import { saveBeneficiaries, getAllBeneficiaries } from '../lib/db';

interface BeneficiaryForm {
  first_name: string;
  last_name: string;
  national_id: string;
  gender: string;
  phone: string;
  governorate: string;
  district: string;
  household_size: number;
  has_disability: boolean;
  disability_type: string;
  vulnerability_score: number;
  custom_values: Record<string, unknown>;
}

interface Beneficiary extends BeneficiaryForm {
  id: number | string;
  status?: string;
}

interface DuplicateWarning {
  duplicate: boolean;
  confidence: number;
  beneficiary?: { first_name: string; last_name: string };
}

interface GovernorateOption {
  value: string;
  label: string;
  label_ar: string;
}


const emptyForm: BeneficiaryForm = {
  first_name: '',
  last_name: '',
  national_id: '',
  gender: 'male',
  phone: '',
  governorate: '',
  district: '',
  household_size: 1,
  has_disability: false,
  disability_type: '',
  vulnerability_score: 0,
  custom_values: {},
};

const governorates = [
  { ar: 'صنعاء', en: 'Sanaa' },
  { ar: 'عدن', en: 'Aden' },
  { ar: 'تعز', en: 'Taiz' },
  { ar: 'الحديدة', en: 'Al Hudaydah' },
  { ar: 'إب', en: 'Ibb' },
  { ar: 'حضرموت', en: 'Hadramout' },
  { ar: 'مأرب', en: 'Marib' },
  { ar: 'ذمار', en: 'Dhamar' },
  { ar: 'حجة', en: 'Hajjah' },
  { ar: 'البيضاء', en: 'Al Bayda' },
];

export default function Beneficiaries() {
  const { language, t } = useLanguage();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [form, setForm] = useState<BeneficiaryForm>(emptyForm);
  const [data, setData] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);
  const { fields: customFields, listsBySlug } = useCustomization('beneficiary');
  const governorateOptions = listsBySlug.governorates?.length ? listsBySlug.governorates : governorates.map((g) => ({ value: g.ar, label: g.en, label_ar: g.ar }));

  const checkDuplicate = async () => {
    if (!form.national_id && (!form.first_name || !form.last_name)) return;
    try {
      const res = await api.post('/beneficiaries/check-duplicate', null, {
        params: {
          national_id: form.national_id || undefined,
          first_name: form.first_name || undefined,
          last_name: form.last_name || undefined,
        }
      });
      if (res.data.duplicate) {
        setDuplicateWarning(res.data);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadBeneficiaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/beneficiaries/', { params: { limit: 1000 } });
      setData(response.data);
      await saveBeneficiaries(response.data);
    } catch (e) {
      console.warn('API failed, attempting to load from IndexedDB / localStorage', e);
      const offlineData = await getAllBeneficiaries();
      if (offlineData.length > 0) {
        setData(offlineData);
      } else {
        // Final fallback: seed data from localStorage
        const local = localStorage.getItem('hiaos_data_beneficiaries') || localStorage.getItem('hiaos_beneficiaries');
        if (local) {
          const parsed = JSON.parse(local);
          setData(parsed);
          await saveBeneficiaries(parsed);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBeneficiaries();
  }, [loadBeneficiaries]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingBeneficiary) {
      const { national_id, ...payload } = form;
      await api.put(`/beneficiaries/${editingBeneficiary.id}`, payload);
    } else {
      await api.post('/beneficiaries/', form);
    }
    setShowModal(false);
    setEditingBeneficiary(null);
    setForm(emptyForm);
    setDuplicateWarning(null);
    loadBeneficiaries();
  };

  const openEdit = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setDuplicateWarning(null);
    setForm({
      ...emptyForm,
      ...beneficiary,
      gender: beneficiary.gender || 'male',
      household_size: beneficiary.household_size || 1,
      vulnerability_score: beneficiary.vulnerability_score || 0,
      custom_values: beneficiary.custom_values || {},
    });
    setShowModal(true);
  };

  const handleExportHXL = async () => {
    try {
      const response = await api.get('/beneficiaries/export/hxl', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'beneficiaries_hxl.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Failed to export HXL", e);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (confirm(t('confirmDeleteBeneficiary'))) {
      await api.delete(`/beneficiaries/${id}`);
      loadBeneficiaries();
    }
  };

  const handleBulkDelete = async (ids: (number | string)[]) => {
    if (confirm(`هل أنت متأكد من حذف ${ids.length} سجل؟`)) {
      await Promise.all(ids.map(id => api.delete(`/beneficiaries/${id}`)));
      loadBeneficiaries();
    }
  };

  const columns = [
    { key: 'national_id', label: t('nationalId') },
    { key: 'first_name', label: t('name'), render: (v, row) => `${row.first_name} ${row.last_name}` },
    { key: 'gender', label: t('gender'), render: (v) => <StatusBadge status={v} /> },
    { key: 'governorate', label: t('governorate') },
    { key: 'district', label: t('district') },
    { key: 'household_size', label: t('householdSize') },
    { key: 'vulnerability_score', label: t('vulnerabilityScore'), render: (v) => (
      <div className="flex items-center gap-2">
         <div className={cn("w-2 h-2 rounded-full", v >= 7 ? 'bg-rose-500' : v >= 4 ? 'bg-amber-500' : 'bg-emerald-500')} />
         <span className="font-black">{v}</span>
      </div>
    )},
    { key: 'status', label: t('status'), render: (v) => <StatusBadge status={v} /> },
    ...customFields.filter((field) => field.is_searchable).slice(0, 3).map((field) => ({
      key: `custom_${field.field_key}`,
      label: field.label_ar || field.label,
      render: (_v, row) => renderCustomFieldValue(field, row.custom_values?.[field.field_key]),
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Users size={14} />
            إدارة قواعد بيانات المستهدفين
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">{t('beneficiaries')}</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">
            عرض وتصفية {data.length} مستفيد مسجل في النظام.
          </p>
        </div>
        <div className="flex gap-3">
          <CustomizeModuleButton entity="beneficiary" className="h-12 rounded-2xl" />
          <button type="button" onClick={handleExportHXL} className="h-12 px-6 bg-slate-800 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-800/20 hover:bg-slate-700 transition-all flex items-center gap-2">
            تصدير OCHA HXL
          </button>
          <button type="button" onClick={() => { setEditingBeneficiary(null); setForm(emptyForm); setDuplicateWarning(null); setShowModal(true); }} className="h-12 px-6 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
            <Plus size={20} /> {t('addBeneficiary')}
          </button>
        </div>
      </div>

      <DataTable 
        title="Beneficiaries"
        columns={columns} 
        data={data} 
        actions={[{ label: 'تعديل', icon: Edit3, className: 'text-blue-600 hover:bg-blue-500/10', onClick: openEdit }]}
        onDelete={handleDelete} 
        onBulkDelete={handleBulkDelete}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingBeneficiary ? 'تعديل مستفيد' : t('addNewBeneficiary')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t('firstName')} *</label>
              <input required value={form.first_name} onBlur={checkDuplicate} onChange={e => setForm({...form, first_name: e.target.value})} className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t('lastName')} *</label>
              <input required value={form.last_name} onBlur={checkDuplicate} onChange={e => setForm({...form, last_name: e.target.value})} className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t('nationalId')}</label>
            <input disabled={Boolean(editingBeneficiary)} value={form.national_id || ''} onBlur={checkDuplicate} onChange={e => setForm({...form, national_id: e.target.value})} className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold disabled:opacity-60" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t('gender')}</label>
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 outline-none font-bold">
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t('phone')}</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 outline-none font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t('governorate')}</label>
              <select value={form.governorate} onChange={e => setForm({...form, governorate: e.target.value})} className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 outline-none font-bold">
                <option value="">{t('selectGovernorate')}</option>
                {governorateOptions.map((g) => <option key={g.value} value={g.label_ar || g.label || g.value}>{language === 'ar' ? (g.label_ar || g.label) : (g.label || g.label_ar || g.value)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t('district')}</label>
              <input value={form.district} onChange={e => setForm({...form, district: e.target.value})} className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 outline-none font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t('householdSize')}</label>
              <input type="number" min="1" value={form.household_size} onChange={e => setForm({...form, household_size: parseInt(e.target.value, 10) || 1})} className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 outline-none font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t('vulnerabilityScoreRange')} (AI Auto)</label>
              <input type="number" placeholder="يُحسب آلياً إذا ترك 0" min="0" max="100" step="0.1" value={form.vulnerability_score} onChange={e => setForm({...form, vulnerability_score: parseFloat(e.target.value) || 0})} className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 outline-none font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.has_disability} onChange={e => setForm({...form, has_disability: e.target.checked})} className="w-5 h-5 accent-blue-600 rounded" />
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">يوجد إعاقة (SADD)</label>
            </div>
            {form.has_disability && (
              <div>
                <select value={form.disability_type} onChange={e => setForm({...form, disability_type: e.target.value})} className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 outline-none font-bold">
                  <option value="">نوع الإعاقة</option>
                  <option value="physical">حركية</option>
                  <option value="visual">بصرية</option>
                  <option value="hearing">سمعية</option>
                  <option value="cognitive">ذهنية</option>
                  <option value="multiple">متعددة</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
            )}
          </div>
          <CustomFieldsForm fields={customFields} values={form.custom_values} onChange={(customValues) => setForm({ ...form, custom_values: customValues })} />
          
          {duplicateWarning && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
              <p className="text-sm font-black text-rose-600 dark:text-rose-400 mb-1">⚠️ تحذير: احتمال ازدواجية</p>
              <p className="text-xs text-rose-500 dark:text-rose-300">
                تم اكتشاف تشابه بنسبة {duplicateWarning.confidence}% مع المستفيد: {duplicateWarning.beneficiary?.first_name} {duplicateWarning.beneficiary?.last_name}
              </p>
            </div>
          )}
          
          <button type="submit" className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 mt-4 flex items-center justify-center gap-2"><Save size={18} />{t('save')}</button>
        </form>
      </Modal>
    </div>
  );
}
