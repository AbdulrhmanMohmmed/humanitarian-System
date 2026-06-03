/**
 * Advanced form validation hook with Zod schemas.
 * Provides real-time validation, field-level errors, and submission handling.
 */
import { useState, useCallback, useMemo } from 'react';
import { z, ZodSchema, ZodError } from 'zod';

export interface FormErrors {
  [field: string]: string;
}

export interface UseFormValidationOptions<T> {
  schema: ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  initialValues?: Partial<T>;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  onSubmit,
  initialValues = {} as Partial<T>,
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setValue = useCallback((field: string, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const setFieldTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateField = useCallback((field: string) => {
    try {
      schema.parse(values);
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldError = err.errors.find((e) => e.path.includes(field));
        if (fieldError) {
          setErrors((prev) => ({ ...prev, [field]: fieldError.message }));
        }
      }
    }
  }, [schema, values]);

  const validate = useCallback((): boolean => {
    try {
      schema.parse(values);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors: FormErrors = {};
        err.errors.forEach((e) => {
          const field = e.path.join('.');
          newErrors[field] = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [schema, values]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitted(true);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(values as T);
    } finally {
      setSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitted(false);
    setSubmitting(false);
  }, [initialValues]);

  const isValid = useMemo(() => {
    try {
      schema.parse(values);
      return true;
    } catch {
      return false;
    }
  }, [schema, values]);

  return {
    values,
    errors,
    touched,
    submitting,
    submitted,
    isValid,
    setValue,
    setFieldTouched,
    validateField,
    validate,
    handleSubmit,
    reset,
    setValues,
  };
}

// ── Common Validation Schemas ─────────────────────────────────────────────────

export const loginSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export const beneficiarySchema = z.object({
  first_name: z.string().min(2, 'الاسم الأول مطلوب'),
  last_name: z.string().min(2, 'اسم العائلة مطلوب'),
  national_id: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  phone: z.string().regex(/^[0-9+\-\s]*$/, 'رقم هاتف غير صحيح').optional(),
  governorate: z.string().optional(),
  district: z.string().optional(),
  household_size: z.number().int().min(1).max(50).optional(),
  vulnerability_score: z.number().min(0).max(100).optional(),
});

export const projectSchema = z.object({
  name: z.string().min(3, 'اسم المشروع مطلوب (3 أحرف على الأقل)'),
  code: z.string().min(2, 'رمز المشروع مطلوب'),
  sector: z.string().min(1, 'القطاع مطلوب'),
  budget: z.number().min(0, 'الميزانية يجب أن تكون 0 أو أكثر'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
});

export const proposalSchema = z.object({
  title: z.string().min(5, 'عنوان المقترح مطلوب (5 أحرف على الأقل)'),
  donor_name: z.string().min(2, 'اسم المانح مطلوب'),
  requested_amount: z.number().min(1, 'المبلغ المطلوب يجب أن يكون أكبر من 0'),
  currency: z.string().min(3, 'العملة مطلوبة'),
  sector: z.string().min(1, 'القطاع مطلوب'),
  description: z.string().optional(),
});

export const userSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  full_name: z.string().min(2, 'الاسم الكامل مطلوب'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل'),
  role: z.enum(['admin', 'manager', 'officer', 'viewer']),
});

export const populationSchema = z.object({
  governorate: z.string().min(2, 'المحافظة مطلوبة'),
  district: z.string().optional(),
  sub_district: z.string().optional(),
  category: z.string().min(1, 'الفئة مطلوبة'),
  gender: z.string().min(1, 'الجنس مطلوب'),
  age_group: z.string().min(1, 'الفئة العمرية مطلوبة'),
  count: z.number().int().min(0, 'العدد يجب أن يكون 0 أو أكثر'),
  source: z.string().optional(),
  reference_date: z.string().min(1, 'تاريخ المرجع مطلوب'),
});

export const campSchema = z.object({
  name: z.string().min(2, 'اسم المخيم مطلوب'),
  camp_type: z.string().min(1, 'نوع المخيم مطلوب'),
  governorate: z.string().min(2, 'المحافظة مطلوبة'),
  capacity: z.number().int().min(1, 'السعة يجب أن تكون 1 على الأقل'),
  current_population: z.number().int().min(0),
});
