import { GripVertical, Plus, Save, Trash2 } from 'lucide-react';

const palette = [
  { field_type: 'text', label: 'نص قصير' },
  { field_type: 'textarea', label: 'نص طويل' },
  { field_type: 'number', label: 'رقم' },
  { field_type: 'date', label: 'تاريخ' },
  { field_type: 'select', label: 'اختيار' },
  { field_type: 'boolean', label: 'نعم/لا' },
];

const entities = ['beneficiary', 'project', 'activity', 'indicator', 'complaint', 'field_visit', 'document', 'transaction', 'grant'];

function normalizeKey(label, type, index) {
  const base = String(label || type).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `${base || type}_${index + 1}`;
}

export default function FormDesigner({ fields, draft, setDraft, onSave }) {
  const addField = (type) => {
    const next = {
      entity_type: draft.entity_type,
      field_key: normalizeKey(type.label, type.field_type, draft.fields.length),
      label: type.label,
      label_ar: type.label,
      field_type: type.field_type,
      is_required: false,
      is_searchable: false,
      options: type.field_type === 'select' ? ['خيار 1', 'خيار 2'] : [],
    };
    setDraft({ ...draft, fields: [...draft.fields, next] });
  };

  const updateField = (index, patch) => {
    const next = [...draft.fields];
    next[index] = { ...next[index], ...patch };
    setDraft({ ...draft, fields: next });
  };

  const removeField = (index) => {
    setDraft({ ...draft, fields: draft.fields.filter((_, i) => i !== index) });
  };

  const moveField = (from, to) => {
    if (from === to || from < 0 || to < 0) return;
    const next = [...draft.fields];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setDraft({ ...draft, fields: next });
  };

  const loadExisting = () => {
    const existing = fields.filter((field) => field.entity_type === draft.entity_type);
    setDraft({ ...draft, fields: existing.map((field) => ({ ...field, options: field.options || [] })) });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_1fr_360px]">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
        <h2 className="mb-4 text-sm font-black text-[var(--text-primary)]">مكونات الحقول</h2>
        <div className="grid gap-2">
          {palette.map((item) => (
            <button key={item.field_type} onClick={() => addField(item)} className="flex h-11 items-center justify-between rounded-lg border border-[var(--border)] px-3 text-sm font-bold text-[var(--text-secondary)] hover:border-blue-500 hover:text-blue-600">
              {item.label}<Plus size={16} />
            </button>
          ))}
        </div>
        <div className="mt-5">
          <label className="mb-1 block text-[11px] font-black text-slate-500">الكيان</label>
          <select value={draft.entity_type} onChange={(e) => setDraft({ entity_type: e.target.value, fields: [] })} className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm font-bold">
            {entities.map((entity) => <option key={entity} value={entity}>{entity}</option>)}
          </select>
          <button onClick={loadExisting} className="mt-3 h-10 w-full rounded-lg bg-slate-800 px-3 text-xs font-black text-white">تحميل حقول الكيان</button>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-black text-[var(--text-primary)]">لوحة التصميم</h2>
          <button onClick={onSave} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-black text-white"><Save size={15} /> حفظ النموذج</button>
        </div>
        <div className="space-y-3">
          {draft.fields.length === 0 && <div className="rounded-lg border border-dashed border-[var(--border)] p-10 text-center text-sm font-bold text-slate-400">أضف حقولا من القائمة الجانبية</div>}
          {draft.fields.map((field, index) => (
            <div
              key={`${field.field_key}-${index}`}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => moveField(Number(e.dataTransfer.getData('text/plain')), index)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-black text-[var(--text-primary)]"><GripVertical size={16} /> {field.label_ar || field.label}</div>
                <button onClick={() => removeField(index)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-600"><Trash2 size={15} /></button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={field.label_ar || ''} onChange={(e) => updateField(index, { label_ar: e.target.value, label: e.target.value })} placeholder="العنوان" className="h-10 rounded-lg border border-[var(--border)] bg-transparent px-3 text-sm font-bold" />
                <input value={field.field_key} onChange={(e) => updateField(index, { field_key: e.target.value })} placeholder="field_key" className="h-10 rounded-lg border border-[var(--border)] bg-transparent px-3 text-sm font-bold" />
                <select value={field.field_type} onChange={(e) => updateField(index, { field_type: e.target.value })} className="h-10 rounded-lg border border-[var(--border)] bg-transparent px-3 text-sm font-bold">
                  {palette.map((item) => <option key={item.field_type} value={item.field_type}>{item.label}</option>)}
                </select>
                <input value={(field.options || []).join(', ')} onChange={(e) => updateField(index, { options: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} placeholder="خيارات مفصولة بفواصل" className="h-10 rounded-lg border border-[var(--border)] bg-transparent px-3 text-sm font-bold" />
              </div>
              <div className="mt-3 flex gap-4">
                <label className="text-xs font-black text-slate-500"><input type="checkbox" checked={field.is_required} onChange={(e) => updateField(index, { is_required: e.target.checked })} /> إلزامي</label>
                <label className="text-xs font-black text-slate-500"><input type="checkbox" checked={field.is_searchable} onChange={(e) => updateField(index, { is_searchable: e.target.checked })} /> يظهر في الجدول</label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
        <h2 className="mb-4 text-sm font-black text-[var(--text-primary)]">معاينة النموذج</h2>
        <div className="space-y-3">
          {draft.fields.map((field) => (
            <label key={field.field_key} className="block">
              <span className="mb-1 block text-[11px] font-black text-slate-500">{field.label_ar || field.label}</span>
              {field.field_type === 'textarea' ? <textarea disabled rows={3} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2" /> :
                field.field_type === 'select' ? <select disabled className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3"><option>اختر</option></select> :
                  <input disabled type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'} className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3" />}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
