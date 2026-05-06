function fieldLabel(field) {
  return field.label_ar || field.label || field.field_key;
}

export default function CustomFieldsForm({ fields = [], values = {}, onChange }) {
  if (!fields.length) return null;

  const update = (key, value) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-black/[0.02] p-4 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">حقول مخصصة</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((field) => {
          const value = values?.[field.field_key] ?? (field.field_type === 'boolean' ? false : '');
          const commonClass = "w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold";
          return (
            <label key={field.id} className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
              <span className="mb-2 block px-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {fieldLabel(field)}{field.is_required ? ' *' : ''}
              </span>
              {field.field_type === 'textarea' ? (
                <textarea required={field.is_required} value={value} onChange={(e) => update(field.field_key, e.target.value)} rows={3} className={`${commonClass} h-auto py-3`} />
              ) : field.field_type === 'select' ? (
                <select required={field.is_required} value={value} onChange={(e) => update(field.field_key, e.target.value)} className={commonClass}>
                  <option value="">اختر</option>
                  {(field.options || []).map((option) => {
                    const normalized = typeof option === 'object' ? option : { value: option, label: option };
                    return <option key={normalized.value} value={normalized.value}>{normalized.label_ar || normalized.label || normalized.value}</option>;
                  })}
                </select>
              ) : field.field_type === 'boolean' ? (
                <div className="flex h-12 items-center rounded-xl border border-[var(--border)] bg-black/5 px-4 dark:bg-white/5">
                  <input type="checkbox" checked={Boolean(value)} onChange={(e) => update(field.field_key, e.target.checked)} className="ml-2" />
                  <span className="text-sm font-bold text-[var(--text-secondary)]">نعم</span>
                </div>
              ) : (
                <input
                  required={field.is_required}
                  type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : field.field_type === 'email' ? 'email' : field.field_type === 'url' ? 'url' : 'text'}
                  value={value}
                  onChange={(e) => update(field.field_key, field.field_type === 'number' ? Number(e.target.value) : e.target.value)}
                  placeholder={field.placeholder || ''}
                  className={commonClass}
                />
              )}
              {field.help_text && <span className="mt-1 block text-[11px] font-medium text-slate-400">{field.help_text}</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
}
