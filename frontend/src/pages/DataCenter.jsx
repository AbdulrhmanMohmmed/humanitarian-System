import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, FileText, Users, Globe, Shield, Phone,
  DollarSign, MapPin, Building2, Plus, Search, Trash2,
  Edit, Download, BookOpen, Scale, AlertTriangle,
  Briefcase, FileCheck, Clock, TrendingUp, Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { downloadJSON, downloadCSV } from '../lib/exportUtils';

const TABS = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: Database },
  { id: 'policies', label: 'السياسات والإجراءات', icon: FileText },
  { id: 'contacts', label: 'دليل جهات الاتصال', icon: Users },
  { id: 'resources', label: 'الموارد والقوالب', icon: BookOpen },
  { id: 'legal', label: 'الوثائق القانونية', icon: Scale },
  { id: 'donors', label: 'ملفات المانحين', icon: Building2 },
  { id: 'countries', label: 'بيانات الدول', icon: Globe },
  { id: 'sectors', label: 'القطاعات الإنسانية', icon: Layers },
  { id: 'emergency', label: 'جهات الطوارئ', icon: Phone },
  { id: 'currency', label: 'أسعار العملات', icon: DollarSign },
];

const POLICY_CATEGORIES = [
  { value: 'hr', label: 'الموارد البشرية' },
  { value: 'finance', label: 'المالية' },
  { value: 'security', label: 'الأمن' },
  { value: 'procurement', label: 'المشتريات' },
  { value: 'it', label: 'تقنية المعلومات' },
  { value: 'operations', label: 'العمليات' },
  { value: 'safeguarding', label: 'الحماية' },
  { value: 'data_protection', label: 'حماية البيانات' },
  { value: 'anti_fraud', label: 'مكافحة الاحتيال' },
  { value: 'logistics', label: 'اللوجستيات' },
];

const CONTACT_TYPES = [
  { value: 'donor', label: 'مانح' },
  { value: 'partner', label: 'شريك' },
  { value: 'government', label: 'حكومة' },
  { value: 'un_agency', label: 'وكالة أممية' },
  { value: 'ingo', label: 'منظمة دولية' },
  { value: 'local_ngo', label: 'منظمة محلية' },
  { value: 'media', label: 'إعلام' },
  { value: 'vendor', label: 'مورد' },
  { value: 'consultant', label: 'مستشار' },
  { value: 'community_leader', label: 'قائد مجتمعي' },
];

const RESOURCE_TYPES = [
  { value: 'template', label: 'قالب' },
  { value: 'guide', label: 'دليل' },
  { value: 'form', label: 'نموذج' },
  { value: 'sop', label: 'إجراء تشغيلي' },
  { value: 'checklist', label: 'قائمة مراجعة' },
  { value: 'training_material', label: 'مادة تدريبية' },
  { value: 'reference', label: 'مرجع' },
  { value: 'tool', label: 'أداة' },
];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-xl", color)}><Icon size={20} className="text-white" /></div>
        <div>
          <p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
          <p className="text-xs font-bold text-[var(--text-secondary)]">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-primary)] rounded-3xl p-8 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-black text-[var(--text-primary)] mb-6">{title}</h3>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block mb-4">
      <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">{label}</span>
      <input {...props} className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-bold outline-none focus:border-blue-500" />
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label className="block mb-4">
      <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">{label}</span>
      <select {...props} className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-bold outline-none focus:border-blue-500">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="block mb-4">
      <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">{label}</span>
      <textarea {...props} rows={3} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-bold outline-none focus:border-blue-500 resize-none" />
    </label>
  );
}

export default function DataCenter() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState({});
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      api.get('/data-center/dashboard').then(r => setDashboard(r.data)).catch(() => {});
    } else {
      loadItems();
    }
  }, [activeTab]);

  const endpointMap = {
    policies: '/data-center/policies',
    contacts: '/data-center/contacts',
    resources: '/data-center/resources',
    legal: '/data-center/legal',
    donors: '/data-center/donors',
    countries: '/data-center/countries',
    sectors: '/data-center/sectors',
    emergency: '/data-center/emergency-contacts',
    currency: '/data-center/currency-rates',
  };

  const loadItems = () => {
    const endpoint = endpointMap[activeTab];
    if (!endpoint) return;
    setLoading(true);
    api.get(endpoint, { params: search ? { search } : {} }).then(r => {
      const data = Array.isArray(r.data) ? r.data : (r.data.items || []);
      setItems(data);
    }).catch(() => setItems([])).finally(() => setLoading(false));
  };

  const handleCreate = () => {
    const endpoint = endpointMap[activeTab];
    if (!endpoint) return;
    api.post(endpoint, form).then(r => {
      setItems(prev => [r.data, ...prev]);
      setShowModal(false);
      setForm({});
      toast.addToast ? toast.addToast('تم الإنشاء بنجاح', 'success') : null;
    }).catch(() => toast.addToast ? toast.addToast('حدث خطأ', 'error') : null);
  };

  const handleDelete = (id) => {
    const endpoint = endpointMap[activeTab];
    if (!endpoint) return;
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    api.delete(`${endpoint}/${id}`).then(() => {
      setItems(prev => prev.filter(i => i.id !== id));
      toast.addToast ? toast.addToast('تم الحذف', 'success') : null;
    }).catch(() => {});
  };

  const handleExport = () => {
    if (items.length === 0) return;
    downloadCSV(items, `${activeTab}-export`);
    toast.addToast ? toast.addToast('تم التصدير', 'success') : null;
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={FileText} label="السياسات النشطة" value={dashboard.active_policies || 0} color="bg-blue-600" />
        <StatCard icon={Users} label="جهات الاتصال" value={dashboard.contacts || 0} color="bg-emerald-600" />
        <StatCard icon={BookOpen} label="الموارد والقوالب" value={dashboard.resources || 0} color="bg-purple-600" />
        <StatCard icon={Scale} label="الوثائق القانونية" value={dashboard.legal_documents || 0} color="bg-amber-600" />
        <StatCard icon={AlertTriangle} label="وثائق تنتهي قريباً" value={dashboard.expiring_documents || 0} color="bg-rose-600" />
        <StatCard icon={Building2} label="ملفات المانحين" value={dashboard.donor_profiles || 0} color="bg-cyan-600" />
        <StatCard icon={Globe} label="بيانات الدول" value={dashboard.country_profiles || 0} color="bg-indigo-600" />
        <StatCard icon={Layers} label="القطاعات" value={dashboard.sectors || 0} color="bg-teal-600" />
        <StatCard icon={Phone} label="جهات الطوارئ" value={dashboard.emergency_contacts || 0} color="bg-orange-600" />
        <StatCard icon={DollarSign} label="أسعار العملات" value={dashboard.currency_rates || 0} color="bg-lime-600" />
      </div>

      <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <h3 className="text-2xl font-black mb-4">🏢 مركز المعلومات والبيانات</h3>
        <p className="text-blue-100 font-medium leading-relaxed mb-4">
          مرجعك الشامل لجميع البيانات والمعلومات التي تحتاجها المنظمة: السياسات الداخلية، دليل جهات الاتصال، القوالب والنماذج،
          الوثائق القانونية، ملفات المانحين، بيانات الدول والقطاعات الإنسانية، وأسعار العملات.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {TABS.filter(t => t.id !== 'dashboard').map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-center">
              <tab.icon size={24} className="mx-auto mb-2" />
              <span className="text-xs font-bold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderForm = () => {
    switch (activeTab) {
      case 'policies':
        return (<>
          <Input label="عنوان السياسة" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Select label="الفئة" options={POLICY_CATEGORIES} value={form.category || 'operations'} onChange={e => setForm({ ...form, category: e.target.value })} />
          <Input label="الإصدار" value={form.version || '1.0'} onChange={e => setForm({ ...form, version: e.target.value })} />
          <Input label="اعتمدت من" value={form.approved_by || ''} onChange={e => setForm({ ...form, approved_by: e.target.value })} />
          <TextArea label="الملخص" value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })} />
          <TextArea label="المحتوى" value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} />
        </>);
      case 'contacts':
        return (<>
          <Input label="الاسم" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="المنظمة" value={form.organization || ''} onChange={e => setForm({ ...form, organization: e.target.value })} />
          <Select label="النوع" options={CONTACT_TYPES} value={form.contact_type || 'partner'} onChange={e => setForm({ ...form, contact_type: e.target.value })} />
          <Input label="المسمى الوظيفي" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input label="البريد الإلكتروني" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="الهاتف" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Input label="المدينة" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} />
          <Input label="الدولة" value={form.country || ''} onChange={e => setForm({ ...form, country: e.target.value })} />
          <TextArea label="ملاحظات" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </>);
      case 'resources':
        return (<>
          <Input label="العنوان" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Select label="النوع" options={RESOURCE_TYPES} value={form.resource_type || 'template'} onChange={e => setForm({ ...form, resource_type: e.target.value })} />
          <Input label="الفئة" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} />
          <Input label="اللغة" value={form.language || 'ar'} onChange={e => setForm({ ...form, language: e.target.value })} />
          <TextArea label="الوصف" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
          <TextArea label="المحتوى" value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} />
        </>);
      case 'legal':
        return (<>
          <Input label="عنوان الوثيقة" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Select label="النوع" options={[
            { value: 'mou', label: 'مذكرة تفاهم' }, { value: 'contract', label: 'عقد' },
            { value: 'agreement', label: 'اتفاقية' }, { value: 'license', label: 'ترخيص' },
            { value: 'registration', label: 'تسجيل' }, { value: 'tax_exemption', label: 'إعفاء ضريبي' },
            { value: 'insurance', label: 'تأمين' }, { value: 'lease', label: 'إيجار' },
          ]} value={form.doc_type || 'contract'} onChange={e => setForm({ ...form, doc_type: e.target.value })} />
          <Input label="الطرف الآخر" value={form.party_name || ''} onChange={e => setForm({ ...form, party_name: e.target.value })} />
          <Input label="الرقم المرجعي" value={form.reference_number || ''} onChange={e => setForm({ ...form, reference_number: e.target.value })} />
          <Input label="القيمة" type="number" value={form.value || 0} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) })} />
          <TextArea label="ملاحظات" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </>);
      case 'donors':
        return (<>
          <Input label="اسم المانح" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="الاختصار" value={form.acronym || ''} onChange={e => setForm({ ...form, acronym: e.target.value })} />
          <Input label="نوع المانح" value={form.donor_type || ''} onChange={e => setForm({ ...form, donor_type: e.target.value })} />
          <Input label="الدولة" value={form.country || ''} onChange={e => setForm({ ...form, country: e.target.value })} />
          <Input label="الموقع الإلكتروني" value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} />
          <Input label="جهة الاتصال" value={form.focal_point || ''} onChange={e => setForm({ ...form, focal_point: e.target.value })} />
          <Input label="البريد الإلكتروني" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="الحد الأدنى للتمويل" type="number" value={form.funding_range_min || 0} onChange={e => setForm({ ...form, funding_range_min: parseFloat(e.target.value) })} />
          <Input label="الحد الأقصى للتمويل" type="number" value={form.funding_range_max || 0} onChange={e => setForm({ ...form, funding_range_max: parseFloat(e.target.value) })} />
          <TextArea label="متطلبات التقارير" value={form.reporting_requirements || ''} onChange={e => setForm({ ...form, reporting_requirements: e.target.value })} />
          <TextArea label="آلية التقديم" value={form.application_process || ''} onChange={e => setForm({ ...form, application_process: e.target.value })} />
        </>);
      case 'countries':
        return (<>
          <Input label="اسم الدولة" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="رمز ISO" value={form.iso_code || ''} onChange={e => setForm({ ...form, iso_code: e.target.value })} />
          <Input label="المنطقة" value={form.region || ''} onChange={e => setForm({ ...form, region: e.target.value })} />
          <Input label="العاصمة" value={form.capital || ''} onChange={e => setForm({ ...form, capital: e.target.value })} />
          <Input label="عدد السكان" type="number" value={form.population || 0} onChange={e => setForm({ ...form, population: parseInt(e.target.value) })} />
          <Input label="العملة" value={form.currency || ''} onChange={e => setForm({ ...form, currency: e.target.value })} />
          <Input label="مستوى الأزمة" value={form.crisis_level || ''} onChange={e => setForm({ ...form, crisis_level: e.target.value })} />
          <Input label="المحتاجون" type="number" value={form.people_in_need || 0} onChange={e => setForm({ ...form, people_in_need: parseInt(e.target.value) })} />
          <Input label="المستهدفون" type="number" value={form.people_targeted || 0} onChange={e => setForm({ ...form, people_targeted: parseInt(e.target.value) })} />
          <Input label="التمويل المطلوب ($)" type="number" value={form.funding_required || 0} onChange={e => setForm({ ...form, funding_required: parseFloat(e.target.value) })} />
          <Input label="التمويل المستلم ($)" type="number" value={form.funding_received || 0} onChange={e => setForm({ ...form, funding_received: parseFloat(e.target.value) })} />
          <TextArea label="الاحتياجات الإنسانية" value={form.humanitarian_needs || ''} onChange={e => setForm({ ...form, humanitarian_needs: e.target.value })} />
        </>);
      case 'sectors':
        return (<>
          <Input label="اسم القطاع" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="الكلستر" value={form.cluster || ''} onChange={e => setForm({ ...form, cluster: e.target.value })} />
          <Input label="الوكالة القائدة" value={form.lead_agency || ''} onChange={e => setForm({ ...form, lead_agency: e.target.value })} />
          <Input label="رابط المعايير" value={form.guidelines_url || ''} onChange={e => setForm({ ...form, guidelines_url: e.target.value })} />
          <TextArea label="الوصف" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
          <TextArea label="الحد الأدنى من المعايير" value={form.min_standards || ''} onChange={e => setForm({ ...form, min_standards: e.target.value })} />
        </>);
      case 'emergency':
        return (<>
          <Input label="الاسم" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="الدور" value={form.role || ''} onChange={e => setForm({ ...form, role: e.target.value })} />
          <Input label="المنظمة" value={form.organization || ''} onChange={e => setForm({ ...form, organization: e.target.value })} />
          <Input label="الهاتف" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Input label="البريد الإلكتروني" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="الموقع" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} />
          <Input label="الأولوية" type="number" value={form.priority || 1} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) })} />
        </>);
      case 'currency':
        return (<>
          <Input label="من عملة" value={form.from_currency || ''} onChange={e => setForm({ ...form, from_currency: e.target.value })} placeholder="USD" />
          <Input label="إلى عملة" value={form.to_currency || ''} onChange={e => setForm({ ...form, to_currency: e.target.value })} placeholder="YER" />
          <Input label="سعر الصرف" type="number" step="0.01" value={form.rate || ''} onChange={e => setForm({ ...form, rate: parseFloat(e.target.value) })} />
          <Input label="المصدر" value={form.source || ''} onChange={e => setForm({ ...form, source: e.target.value })} />
        </>);
      default:
        return null;
    }
  };

  const renderItemCard = (item) => {
    switch (activeTab) {
      case 'policies':
        return (
          <div key={item.id} className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {POLICY_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)]">v{item.version}</span>
                </div>
                <h4 className="font-black text-[var(--text-primary)]">{item.title}</h4>
                {item.summary && <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{item.summary}</p>}
                {item.approved_by && <p className="text-xs text-[var(--text-secondary)] mt-2">اعتمدت من: {item.approved_by}</p>}
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
            </div>
          </div>
        );
      case 'contacts':
        return (
          <div key={item.id} className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {CONTACT_TYPES.find(c => c.value === item.contact_type)?.label || item.contact_type}
                  </span>
                </div>
                <h4 className="font-black text-[var(--text-primary)]">{item.name}</h4>
                {item.organization && <p className="text-sm text-[var(--text-secondary)]">{item.organization}</p>}
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-[var(--text-secondary)]">
                  {item.email && <span>{item.email}</span>}
                  {item.phone && <span>{item.phone}</span>}
                  {item.city && <span>{item.city}, {item.country}</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
            </div>
          </div>
        );
      case 'resources':
        return (
          <div key={item.id} className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {RESOURCE_TYPES.find(r => r.value === item.resource_type)?.label || item.resource_type}
                </span>
                <h4 className="font-black text-[var(--text-primary)] mt-2">{item.title}</h4>
                {item.description && <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{item.description}</p>}
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
            </div>
          </div>
        );
      case 'legal':
        return (
          <div key={item.id} className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-black text-[var(--text-primary)]">{item.title}</h4>
                <div className="flex gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                  {item.party_name && <span>الطرف: {item.party_name}</span>}
                  {item.value > 0 && <span>القيمة: ${item.value?.toLocaleString()}</span>}
                  <span className={cn("px-2 py-0.5 rounded-full font-black", item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>{item.status}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
            </div>
          </div>
        );
      case 'donors':
        return (
          <div key={item.id} className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-black text-[var(--text-primary)]">{item.name} {item.acronym && <span className="text-[var(--text-secondary)]">({item.acronym})</span>}</h4>
                <div className="flex gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                  {item.donor_type && <span>{item.donor_type}</span>}
                  {item.country && <span>{item.country}</span>}
                  {item.funding_range_max > 0 && <span>${item.funding_range_min?.toLocaleString()} - ${item.funding_range_max?.toLocaleString()}</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
            </div>
          </div>
        );
      case 'countries':
        return (
          <div key={item.id} className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-black text-[var(--text-primary)]">{item.name} {item.iso_code && <span className="text-[var(--text-secondary)]">({item.iso_code})</span>}</h4>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                  {item.region && <span>{item.region}</span>}
                  {item.population > 0 && <span>السكان: {item.population?.toLocaleString()}</span>}
                  {item.crisis_level && <span className="px-2 py-0.5 rounded-full font-black bg-red-100 text-red-700">{item.crisis_level}</span>}
                  {item.people_in_need > 0 && <span>المحتاجون: {item.people_in_need?.toLocaleString()}</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
            </div>
          </div>
        );
      case 'sectors':
        return (
          <div key={item.id} className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
            <h4 className="font-black text-[var(--text-primary)]">{item.name}</h4>
            <div className="flex gap-3 mt-2 text-xs text-[var(--text-secondary)]">
              {item.cluster && <span>الكلستر: {item.cluster}</span>}
              {item.lead_agency && <span>الوكالة: {item.lead_agency}</span>}
            </div>
            {item.description && <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">{item.description}</p>}
          </div>
        );
      case 'emergency':
        return (
          <div key={item.id} className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-black text-[var(--text-primary)]">{item.name}</h4>
                <div className="flex gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                  {item.role && <span>{item.role}</span>}
                  {item.organization && <span>{item.organization}</span>}
                  <span className="font-black text-rose-600">{item.phone}</span>
                  {item.available_24h && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-black">24/7</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
            </div>
          </div>
        );
      case 'currency':
        return (
          <div key={item.id} className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-lime-100 dark:bg-lime-900/30"><DollarSign size={18} className="text-lime-700" /></div>
              <div>
                <span className="font-black text-[var(--text-primary)]">{item.from_currency} → {item.to_currency}</span>
                <span className="mx-3 text-2xl font-black text-blue-600">{item.rate}</span>
              </div>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">{item.source || ''}</span>
          </div>
        );
      default:
        return (
          <div key={item.id} className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
            <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
          </div>
        );
    }
  };

  const tabLabel = TABS.find(t => t.id === activeTab)?.label || '';

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Database size={14} />
            HIAOS Organization Data Center
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">مركز المعلومات والبيانات</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">المرجع الشامل لجميع البيانات والمعلومات التي تحتاجها المنظمة لإدارة عملياتها الإنسانية.</p>
        </div>
      </header>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(''); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
            )}>
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' ? renderDashboard() : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadItems()}
                placeholder={`بحث في ${tabLabel}...`}
                className="w-full h-11 pr-10 pl-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-bold outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleExport} className="h-11 px-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs font-black text-[var(--text-secondary)] hover:border-blue-500 flex items-center gap-2">
                <Download size={14} /> تصدير
              </button>
              <button onClick={() => { setForm({}); setShowModal(true); }} className="h-11 px-5 rounded-xl bg-blue-600 text-white text-xs font-black shadow-lg hover:bg-blue-700 flex items-center gap-2">
                <Plus size={14} /> إضافة جديد
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <Database size={48} className="mx-auto text-[var(--text-secondary)] opacity-30 mb-4" />
              <p className="text-[var(--text-secondary)] font-bold">لا توجد بيانات حالياً</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">اضغط "إضافة جديد" لإضافة أول عنصر</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => renderItemCard(item))}
            </div>
          )}
        </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} title={`إضافة ${tabLabel}`}>
        {renderForm()}
        <div className="flex gap-3 mt-6">
          <button onClick={handleCreate} className="flex-1 h-11 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700">حفظ</button>
          <button onClick={() => setShowModal(false)} className="flex-1 h-11 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl font-black text-sm text-[var(--text-secondary)]">إلغاء</button>
        </div>
      </Modal>
    </div>
  );
}
