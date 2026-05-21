import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function FormField({ label, name, register, errors, type = 'text', options, placeholder, required, ...rest }) {
  const error = errors?.[name];

  if (type === 'select' && options) {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-semibold text-slate-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <select
          {...register(name)}
          className={`w-full rounded-lg border px-3 py-2 text-sm ${error ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
          {...rest}
        >
          <option value="">{placeholder || 'اختر...'}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-rose-600">{error.message}</p>}
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-semibold text-slate-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <textarea
          {...register(name)}
          placeholder={placeholder}
          rows={3}
          className={`w-full rounded-lg border px-3 py-2 text-sm ${error ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
          {...rest}
        />
        {error && <p className="text-xs text-rose-600">{error.message}</p>}
      </div>
    );
  }

  if (type === 'checkbox') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register(name)}
          className="rounded border-slate-300"
          {...rest}
        />
        {label && <label className="text-sm text-slate-700">{label}</label>}
        {error && <p className="text-xs text-rose-600">{error.message}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        type={type}
        {...register(name)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-sm ${error ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
        {...rest}
      />
      {error && <p className="text-xs text-rose-600">{error.message}</p>}
    </div>
  );
}

export function useValidatedForm(schema, defaultValues = {}) {
  return useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });
}

export default function ValidatedForm({ schema, defaultValues, onSubmit, children, className = '', submitLabel = 'حفظ' }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useValidatedForm(schema, defaultValues);

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={className} dir="rtl">
      {typeof children === 'function' ? children({ register, errors }) : children}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'جاري الحفظ...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
