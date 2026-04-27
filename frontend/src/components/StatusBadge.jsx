const statusMap = {
  active: { label: 'نشط', color: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'غير نشط', color: 'bg-gray-100 text-gray-600' },
  planned: { label: 'مخطط', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'مكتمل', color: 'bg-purple-100 text-purple-700' },
  suspended: { label: 'معلق', color: 'bg-orange-100 text-orange-700' },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700' },
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'معتمد', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700' },
  disbursed: { label: 'تم الصرف', color: 'bg-blue-100 text-blue-700' },
  received: { label: 'تم الاستلام', color: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'فشل', color: 'bg-red-100 text-red-700' },
  in_progress: { label: 'جاري', color: 'bg-cyan-100 text-cyan-700' },
  graduated: { label: 'تخرج', color: 'bg-indigo-100 text-indigo-700' },
  on_leave: { label: 'في إجازة', color: 'bg-amber-100 text-amber-700' },
  terminated: { label: 'منتهي', color: 'bg-red-100 text-red-700' },
  resigned: { label: 'مستقيل', color: 'bg-gray-100 text-gray-600' },
  male: { label: 'ذكر', color: 'bg-blue-100 text-blue-700' },
  female: { label: 'أنثى', color: 'bg-pink-100 text-pink-700' },
  income: { label: 'إيراد', color: 'bg-emerald-100 text-emerald-700' },
  expense: { label: 'مصروف', color: 'bg-red-100 text-red-700' },
  transfer: { label: 'تحويل', color: 'bg-blue-100 text-blue-700' },
  output: { label: 'مخرج', color: 'bg-blue-100 text-blue-700' },
  outcome: { label: 'نتيجة', color: 'bg-purple-100 text-purple-700' },
  impact: { label: 'أثر', color: 'bg-emerald-100 text-emerald-700' },
};

export default function StatusBadge({ status }) {
  const s = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}
