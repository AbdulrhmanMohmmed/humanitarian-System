import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListPlus, RefreshCcw, Save, Settings, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import FormDesigner from '../components/FormDesigner';

const tabs = [
  { id: 'settings', label: 'إعدادات النظام', icon: Settings },
  { id: 'lists', label: 'القوائم المرجعية', icon: ListPlus },
  { id: 'fields', label: 'الحقول المخصصة', icon: SlidersHorizontal },
  { id: 'designer', label: 'مصمم النماذج', icon: SlidersHorizontal },
  { id: 'roles', label: 'الصلاحيات', icon: ShieldCheck },
];
const fieldTypes = ['text', 'textarea', 'number', 'date', 'boolean', 'select', 'multi_select', 'email', 'phone', 'url'];
const entities = ['beneficiary', 'project', 'activity', 'indicator', 'complaint', 'field_visit', 'document', 'transaction', 'grant'];

function Card({ title, children, action }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-[var(--text-primary)]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function TextInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500" />
    </label>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function parseLooseJson(value, fallback) {
  if (!String(value).trim()) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export default function SystemCustomization() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const requestedEntity = searchParams.get('entity');
  const [activeTab, setActiveTab] = useState(tabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [overview, setOverview] = useState({ settings: [], reference_lists: [], custom_fields: [], roles: [], overrides: [] });
  const [selectedListId, setSelectedListId] = useState('');
  const [listItems, setListItems] = useState([]);
  const [settingForm, setSettingForm] = useState({ key: '', category: 'general', label: '', value: '', value_type: 'string', is_public: false });
  const [listForm, setListForm] = useState({ slug: '', name: '', entity_type: '', description: '' });
  const [itemForm, setItemForm] = useState({ value: '', label: '', label_ar: '', sort_order: 0 });
  const [fieldForm, setFieldForm] = useState({ entity_type: 'beneficiary', field_key: '', label: '', label_ar: '', field_type: 'text', is_required: false, is_searchable: false, options: '' });
  const [roleForm, setRoleForm] = useState({ role: 'viewer', permission: 'projects.read', effect: 'allow', reason: '' });
  const [designerDraft, setDesignerDraft] = useState({ entity_type: 'beneficiary', fields: [] });

  const roles = useMemo(() => overview.roles.map((role) => role.role), [overview.roles]);
  const permissions = useMemo(() => Array.from(new Set(overview.roles.flatMap((role) => role.permissions).concat(overview.overrides.map((item) => item.permission)))).sort(), [overview]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      await api.post('/customization/bootstrap');
      const { data } = await api.get('/customization/overview');
      setOverview(data);
      if (!selectedListId && data.reference_lists.length) setSelectedListId(String(data.reference_lists[0].id));
      setMessage('');
    } catch (error) {
      setMessage(error.response?.data?.detail || 'تعذر تحميل مركز التهيئة');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (listId) => {
    if (!listId) return;
    const { data } = await api.get(`/customization/reference-lists/${listId}/items`);
    setListItems(data);
  };

  useEffect(() => { loadOverview(); }, []);
  useEffect(() => { loadItems(selectedListId); }, [selectedListId]);
  useEffect(() => {
    if (requestedTab && tabs.some((tab) => tab.id === requestedTab)) setActiveTab(requestedTab);
    if (requestedEntity && entities.includes(requestedEntity)) {
      setFieldForm((current) => ({ ...current, entity_type: requestedEntity }));
      setListForm((current) => ({ ...current, entity_type: requestedEntity }));
      setDesignerDraft((current) => (
        current.entity_type === requestedEntity ? current : { entity_type: requestedEntity, fields: [] }
      ));
    }
  }, [requestedTab, requestedEntity]);
  useEffect(() => {
    if (!requestedEntity || activeTab !== 'lists' || !overview.reference_lists.length) return;
    const matchedList = overview.reference_lists.find((list) => list.entity_type === requestedEntity);
    if (matchedList) setSelectedListId(String(matchedList.id));
  }, [activeTab, overview.reference_lists, requestedEntity]);

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabId);
    if (designerDraft.entity_type) next.set('entity', designerDraft.entity_type);
    setSearchParams(next, { replace: true });
  };

  const saveSetting = async () => {
    setSaving(true);
    const value = settingForm.value_type === 'boolean'
      ? ['true', '1', 'yes', 'نعم'].includes(String(settingForm.value).toLowerCase())
      : settingForm.value_type === 'number' ? Number(settingForm.value) : parseLooseJson(settingForm.value, settingForm.value);
    await api.post('/customization/settings', { ...settingForm, value });
    setSettingForm({ key: '', category: 'general', label: '', value: '', value_type: 'string', is_public: false });
    await loadOverview(); setSaving(false);
  };

  const saveList = async () => {
    setSaving(true);
    await api.post('/customization/reference-lists', { ...listForm, is_active: true });
    setListForm({ slug: '', name: '', entity_type: '', description: '' });
    await loadOverview(); setSaving(false);
  };

  const saveItem = async () => {
    if (!selectedListId) return;
    setSaving(true);
    await api.post(`/customization/reference-lists/${selectedListId}/items`, { ...itemForm, sort_order: Number(itemForm.sort_order), metadata: {}, is_active: true });
    setItemForm({ value: '', label: '', label_ar: '', sort_order: 0 });
    await loadItems(selectedListId); setSaving(false);
  };

  const saveField = async () => {
    setSaving(true);
    await api.post('/customization/custom-fields', {
      ...fieldForm,
      options: parseLooseJson(fieldForm.options, fieldForm.options ? fieldForm.options.split(',').map((x) => x.trim()).filter(Boolean) : []),
      validation: {},
      display_order: overview.custom_fields.length + 1,
      is_active: true,
    });
    setFieldForm({ entity_type: 'beneficiary', field_key: '', label: '', label_ar: '', field_type: 'text', is_required: false, is_searchable: false, options: '' });
    await loadOverview(); setSaving(false);
  };

  const saveRoleOverride = async () => {
    setSaving(true);
    await api.post('/customization/roles/overrides', roleForm);
    await loadOverview(); setSaving(false);
  };

  const saveDesigner = async () => {
    if (!designerDraft.fields.length) return;
    setSaving(true);
    for (const [index, field] of designerDraft.fields.entries()) {
      await api.post('/customization/custom-fields', {
        entity_type: designerDraft.entity_type,
        field_key: field.field_key,
        label: field.label || field.label_ar || field.field_key,
        label_ar: field.label_ar || field.label || field.field_key,
        field_type: field.field_type,
        placeholder: field.placeholder || '',
        help_text: field.help_text || '',
        is_required: Boolean(field.is_required),
        is_searchable: Boolean(field.is_searchable),
        options: field.options || [],
        validation: field.validation || {},
        display_order: index + 1,
        is_active: true,
      });
    }
    await loadOverview();
    setMessage('تم حفظ تصميم النموذج بنجاح');
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-blue-600">Admin Studio</p>
          <h1 className="mt-1 text-2xl font-black text-[var(--text-primary)]">مركز تهيئة النظام</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-[var(--text-secondary)]">إدارة ذاتية للإعدادات، القوائم، الحقول المخصصة، وصلاحيات الأدوار بدون تعديل الكود.</p>
        </div>
        <button onClick={loadOverview} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-black text-white"><RefreshCcw size={16} /> تحديث</button>
      </div>
      {message && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{message}</div>}
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--border)] pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return <button key={tab.id} onClick={() => switchTab(tab.id)} className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-xs font-black ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-blue-600'}`}><Icon size={16} />{tab.label}</button>;
        })}
      </div>
      {loading ? <div className="p-8 text-center text-sm font-bold text-[var(--text-secondary)]">جاري تحميل التهيئة...</div> : (
        <>
          {activeTab === 'settings' && (
            <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
              <Card title="إضافة أو تعديل إعداد" action={<button disabled={saving} onClick={saveSetting} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-black text-white"><Save size={15} />حفظ</button>}>
                <div className="grid gap-3">
                  <TextInput label="المفتاح" value={settingForm.key} onChange={(value) => setSettingForm({ ...settingForm, key: value })} placeholder="organization.name" />
                  <TextInput label="التصنيف" value={settingForm.category} onChange={(value) => setSettingForm({ ...settingForm, category: value })} />
                  <TextInput label="العنوان" value={settingForm.label} onChange={(value) => setSettingForm({ ...settingForm, label: value })} />
                  <SelectInput label="نوع القيمة" value={settingForm.value_type} onChange={(value) => setSettingForm({ ...settingForm, value_type: value })} options={['string', 'number', 'boolean', 'json']} />
                  <TextInput label="القيمة" value={settingForm.value} onChange={(value) => setSettingForm({ ...settingForm, value })} />
                  <label className="flex items-center gap-2 text-xs font-black text-[var(--text-secondary)]"><input type="checkbox" checked={settingForm.is_public} onChange={(e) => setSettingForm({ ...settingForm, is_public: e.target.checked })} /> عام للواجهة</label>
                </div>
              </Card>
              <Card title="الإعدادات الحالية">
                <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                  {overview.settings.map((item) => <button key={item.key} onClick={() => setSettingForm({ ...item, value: typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value ?? '') })} className="grid w-full grid-cols-[1fr_140px] gap-3 border-b border-[var(--border)] p-3 text-start text-sm last:border-0 hover:bg-blue-500/5"><span><b className="block text-[var(--text-primary)]">{item.label}</b><small className="text-slate-500">{item.key}</small></span><span className="truncate text-xs font-bold text-blue-600">{item.category}</span></button>)}
                </div>
              </Card>
            </div>
          )}
          {activeTab === 'lists' && (
            <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
              <div className="space-y-5">
                <Card title="قائمة جديدة" action={<button disabled={saving} onClick={saveList} className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-black text-white">حفظ</button>}>
                  <div className="grid gap-3"><TextInput label="المعرف" value={listForm.slug} onChange={(value) => setListForm({ ...listForm, slug: value })} /><TextInput label="الاسم" value={listForm.name} onChange={(value) => setListForm({ ...listForm, name: value })} /><TextInput label="الكيان" value={listForm.entity_type} onChange={(value) => setListForm({ ...listForm, entity_type: value })} /></div>
                </Card>
                <Card title="عنصر جديد" action={<button disabled={saving || !selectedListId} onClick={saveItem} className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-black text-white">إضافة</button>}>
                  <div className="grid gap-3"><SelectInput label="القائمة" value={selectedListId} onChange={setSelectedListId} options={overview.reference_lists.map((list) => String(list.id))} /><TextInput label="القيمة" value={itemForm.value} onChange={(value) => setItemForm({ ...itemForm, value })} /><TextInput label="التسمية" value={itemForm.label} onChange={(value) => setItemForm({ ...itemForm, label: value })} /><TextInput label="التسمية العربية" value={itemForm.label_ar} onChange={(value) => setItemForm({ ...itemForm, label_ar: value })} /></div>
                </Card>
              </div>
              <Card title="القوائم والعناصر">
                <div className="grid gap-4 md:grid-cols-[260px_1fr]">
                  <div className="space-y-2">{overview.reference_lists.map((list) => <button key={list.id} onClick={() => setSelectedListId(String(list.id))} className={`w-full rounded-lg border p-3 text-start text-xs font-black ${selectedListId === String(list.id) ? 'border-blue-500 bg-blue-500/10 text-blue-600' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}>{list.name}<span className="block text-[10px] opacity-60">{list.slug}</span></button>)}</div>
                  <div className="rounded-lg border border-[var(--border)]">{listItems.map((item) => <div key={item.id} className="grid grid-cols-[1fr_120px] border-b border-[var(--border)] p-3 text-sm last:border-0"><span className="font-bold text-[var(--text-primary)]">{item.label_ar || item.label}</span><span className="text-xs font-bold text-slate-500">{item.value}</span></div>)}</div>
                </div>
              </Card>
            </div>
          )}
          {activeTab === 'fields' && (
            <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
              <Card title="حقل مخصص" action={<button disabled={saving} onClick={saveField} className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-black text-white">حفظ</button>}>
                <div className="grid gap-3"><SelectInput label="الكيان" value={fieldForm.entity_type} onChange={(value) => setFieldForm({ ...fieldForm, entity_type: value })} options={entities} /><TextInput label="مفتاح الحقل" value={fieldForm.field_key} onChange={(value) => setFieldForm({ ...fieldForm, field_key: value })} /><TextInput label="العنوان" value={fieldForm.label} onChange={(value) => setFieldForm({ ...fieldForm, label: value })} /><TextInput label="العنوان العربي" value={fieldForm.label_ar} onChange={(value) => setFieldForm({ ...fieldForm, label_ar: value })} /><SelectInput label="نوع الحقل" value={fieldForm.field_type} onChange={(value) => setFieldForm({ ...fieldForm, field_type: value })} options={fieldTypes} /><TextInput label="الخيارات" value={fieldForm.options} onChange={(value) => setFieldForm({ ...fieldForm, options: value })} placeholder='["A","B"] أو A,B' /><div className="flex gap-4"><label className="flex items-center gap-2 text-xs font-black text-[var(--text-secondary)]"><input type="checkbox" checked={fieldForm.is_required} onChange={(e) => setFieldForm({ ...fieldForm, is_required: e.target.checked })} /> إلزامي</label><label className="flex items-center gap-2 text-xs font-black text-[var(--text-secondary)]"><input type="checkbox" checked={fieldForm.is_searchable} onChange={(e) => setFieldForm({ ...fieldForm, is_searchable: e.target.checked })} /> قابل للبحث</label></div></div>
              </Card>
              <Card title="الحقول المعرفة"><div className="grid gap-3 md:grid-cols-2">{overview.custom_fields.map((field) => <div key={field.id} className="rounded-lg border border-[var(--border)] p-4"><p className="text-sm font-black text-[var(--text-primary)]">{field.label_ar || field.label}</p><p className="mt-1 text-xs font-bold text-slate-500">{field.entity_type}.{field.field_key}</p><span className="mt-3 inline-flex rounded bg-blue-500/10 px-2 py-1 text-[10px] font-black text-blue-600">{field.field_type}</span></div>)}</div></Card>
            </div>
          )}
          {activeTab === 'designer' && (
            <FormDesigner
              fields={overview.custom_fields}
              draft={designerDraft}
              setDraft={setDesignerDraft}
              onSave={saveDesigner}
            />
          )}
          {activeTab === 'roles' && (
            <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
              <Card title="تعديل صلاحية دور" action={<button disabled={saving} onClick={saveRoleOverride} className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-black text-white">تطبيق</button>}>
                <div className="grid gap-3"><SelectInput label="الدور" value={roleForm.role} onChange={(value) => setRoleForm({ ...roleForm, role: value })} options={roles.length ? roles : ['viewer']} /><SelectInput label="الصلاحية" value={roleForm.permission} onChange={(value) => setRoleForm({ ...roleForm, permission: value })} options={permissions.length ? permissions : ['projects.read']} /><SelectInput label="الأثر" value={roleForm.effect} onChange={(value) => setRoleForm({ ...roleForm, effect: value })} options={['allow', 'deny']} /><TextInput label="السبب" value={roleForm.reason} onChange={(value) => setRoleForm({ ...roleForm, reason: value })} /></div>
              </Card>
              <Card title="مصفوفة الصلاحيات">
                <div className="overflow-auto rounded-lg border border-[var(--border)]"><table className="min-w-full text-xs"><thead className="bg-[var(--bg-primary)]"><tr><th className="p-3 text-start font-black text-slate-500">الدور</th><th className="p-3 text-start font-black text-slate-500">عدد الصلاحيات</th><th className="p-3 text-start font-black text-slate-500">أمثلة</th></tr></thead><tbody>{overview.roles.map((role) => <tr key={role.role} className="border-t border-[var(--border)]"><td className="p-3 font-black text-[var(--text-primary)]">{role.role}</td><td className="p-3 font-bold text-blue-600">{role.permissions.length}</td><td className="p-3 text-slate-500">{role.permissions.slice(0, 6).join(', ')}</td></tr>)}</tbody></table></div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">{overview.overrides.map((item) => <div key={item.id} className="rounded-lg border border-[var(--border)] p-3 text-xs"><b className={item.effect === 'deny' ? 'text-rose-600' : 'text-emerald-600'}>{item.effect}</b><span className="mx-2 font-black text-[var(--text-primary)]">{item.role}</span><span className="text-slate-500">{item.permission}</span></div>)}</div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
