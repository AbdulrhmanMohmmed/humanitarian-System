import { z } from 'zod';

export const beneficiarySchema = z.object({
  first_name: z.string().min(2, 'الاسم الأول مطلوب (حرفان على الأقل)'),
  last_name: z.string().min(2, 'اسم العائلة مطلوب (حرفان على الأقل)'),
  gender: z.enum(['male', 'female'], { required_error: 'الجنس مطلوب' }).optional(),
  date_of_birth: z.string().optional(),
  phone: z.string().regex(/^[0-9+\-\s]*$/, 'رقم هاتف غير صالح').optional().or(z.literal('')),
  national_id: z.string().optional(),
  governorate: z.string().optional(),
  district: z.string().optional(),
  household_size: z.coerce.number().int().min(1, 'حجم الأسرة يجب أن يكون 1 على الأقل').default(1),
  vulnerability_score: z.coerce.number().min(0).max(10).default(0),
  notes: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(3, 'اسم المشروع مطلوب (3 أحرف على الأقل)'),
  code: z.string().min(2, 'رمز المشروع مطلوب'),
  description: z.string().optional(),
  sector: z.string().optional(),
  status: z.enum(['planned', 'active', 'completed', 'suspended', 'cancelled']).default('planned'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.coerce.number().min(0, 'الميزانية لا يمكن أن تكون سالبة').default(0),
  target_beneficiaries: z.coerce.number().int().min(0).default(0),
  governorate: z.string().optional(),
  donor: z.string().optional(),
});

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer'], { required_error: 'نوع المعاملة مطلوب' }),
  amount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  currency: z.string().default('USD'),
  description: z.string().min(3, 'الوصف مطلوب'),
  category: z.string().optional(),
  date: z.string().optional(),
});

export const complaintSchema = z.object({
  subject: z.string().min(5, 'الموضوع مطلوب (5 أحرف على الأقل)'),
  description: z.string().min(10, 'الوصف مطلوب (10 أحرف على الأقل)'),
  category: z.string().default('other'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  complainant_name: z.string().optional(),
  complainant_phone: z.string().optional(),
  is_anonymous: z.boolean().default(false),
});

export const riskSchema = z.object({
  title: z.string().min(5, 'عنوان المخاطرة مطلوب'),
  description: z.string().optional(),
  category: z.string().optional(),
  likelihood: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']).default('medium'),
  impact: z.enum(['negligible', 'minor', 'moderate', 'major', 'severe']).default('moderate'),
  mitigation_plan: z.string().optional(),
});

export const indicatorSchema = z.object({
  name: z.string().min(3, 'اسم المؤشر مطلوب'),
  type: z.enum(['output', 'outcome', 'impact', 'process']).default('output'),
  unit: z.string().optional(),
  target_value: z.coerce.number().min(0).default(0),
  baseline: z.coerce.number().min(0).default(0),
  project_id: z.coerce.number().int().positive('المشروع مطلوب'),
});

export const loginSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم مطلوب'),
  password: z.string().min(6, 'كلمة المرور مطلوبة (6 أحرف على الأقل)'),
});
