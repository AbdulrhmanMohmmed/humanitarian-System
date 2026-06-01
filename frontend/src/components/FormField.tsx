/**
 * Reusable form field component with inline error display.
 * Works with useFormValidation hook.
 */
import { type ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  children: ReactNode;
}

export default function FormField({ label, error, touched, required, children }: FormFieldProps) {
  const showError = touched && error;
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
        {label}{required && ' *'}
      </label>
      {children}
      {showError && (
        <p className="text-xs font-bold text-rose-500 px-1 mt-1">{error}</p>
      )}
    </div>
  );
}
