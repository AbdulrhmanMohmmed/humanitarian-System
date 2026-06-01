import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Edit3, Key, Plus, Save, Shield, Trash2, UserCheck, UserMinus, Users } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';

interface UserForm {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: string;
  phone: string;
  department: string;
  is_active: boolean;
}

interface User extends UserForm {
  id: number | string;
  created_at?: string;
  last_login?: string;
}

interface UserStats {
  total?: number;
  active?: number;
  by_role?: Record<string, number>;
}

interface FilterState {
  role: string;
  search: string;
}

const ROLES = [
  { value: 'admin', label: 'مدير النظام', color: 'bg-rose-100 text-rose-700' },
  { value: 'manager', label: 'مدير برامج', color: 'bg-blue-100 text-blue-700' },
  { value: 'field_officer', label: 'مسؤول ميداني', color: 'bg-green-100 text-green-700' },
  { value: 'finance', label: 'مالية', color: 'bg-amber-100 text-amber-700' },
  { value: 'hr', label: 'موارد بشرية', color: 'bg-purple-100 text-purple-700' },
  { value: 'viewer', label: 'مشاهد', color: 'bg-slate-100 text-slate-700' },
];

const DEPARTMENTS = ['البرامج', 'المالية', 'الموارد البشرية', 'MEAL', 'اللوجستيات', 'تقنية المعلومات', 'الإدارة'];

const emptyForm = {
  username: '', email: '', full_name: '', password: '', role: 'viewer',
  phone: '', department: '', is_active: true,
};

export default function UserManagement() {
  const { addToast } = useToast();
  const [data, setData] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [filter, setFilter] = useState<FilterState>({ role: '', search: '' });

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filter.role) params.role = filter.role;
    if (filter.search) params.search = filter.search;
    Promise.all([
      api.get('/users/', { params }).then(r => setData(r.data)).catch(() => {}),
      api.get('/users/stats').then(r => setStats(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      if (editing) {
        const { password, username, ...updateData } = form;
        await api.put(`/users/${editing.id}`, updateData);
        addToast('تم تحديث المستخدم بنجاح', 'success');
      } else {
        await api.post('/users/', form);
        addToast('تم إنشاء المستخدم بنجاح', 'success');
      }
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (e) {
      addToast(e.response?.data?.detail || 'حدث خطأ', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      await api.delete(`/users/${id}`);
      addToast('تم حذف المستخدم', 'success');
      load();
    } catch (e) {
      addToast(e.response?.data?.detail || 'حدث خطأ', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { is_active: !user.is_active });
      addToast(user.is_active ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب', 'success');
      load();
    } catch (e) {
      addToast(e.response?.data?.detail || 'حدث خطأ', 'error');
    }
  };

  const handleResetPassword = async (userId) => {
    if (!confirm('سيتم إعادة تعيين كلمة المرور. هل أنت متأكد؟')) return;
    try {
      const res = await api.put(`/users/${userId}/reset-password`);
      addToast(`تم إعادة تعيين كلمة المرور: ${res.data.temp_password}`, 'success');
    } catch (e) {
      addToast(e.response?.data?.detail || 'حدث خطأ', 'error');
    }
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ ...user, password: '' });
    setShowModal(true);
  };

  const roleLabel = (role) => ROLES.find(r => r.value === role)?.label || role;
  const roleColor = (role) => ROLES.find(r => r.value === role)?.color || 'bg-slate-100 text-slate-700';

  const columns = [
    { key: 'full_name', label: 'الاسم الكامل' },
    { key: 'username', label: 'اسم المستخدم' },
    { key: 'email', label: 'البريد الإلكتروني' },
    {
      key: 'role', label: 'الدور',
      render: (row) => (
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', roleColor(row.role))}>
          {roleLabel(row.role)}
        </span>
      ),
    },
    { key: 'department', label: 'القسم' },
    {
      key: 'is_active', label: 'الحالة',
      render: (row) => (
        <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'actions', label: 'إجراءات',
      render: (row) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(row)} className="rounded p-1 text-blue-600 hover:bg-blue-50" title="تعديل">
            <Edit3 className="h-4 w-4" />
          </button>
          <button onClick={() => handleToggleStatus(row)} className="rounded p-1 text-amber-600 hover:bg-amber-50" title={row.is_active ? 'تعطيل' : 'تفعيل'}>
            {row.is_active ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </button>
          <button onClick={() => handleResetPassword(row.id)} className="rounded p-1 text-purple-600 hover:bg-purple-50" title="إعادة تعيين كلمة المرور">
            <Key className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="rounded p-1 text-rose-600 hover:bg-rose-50" title="حذف">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة المستخدمين</h1>
          <p className="text-sm text-slate-500">إدارة حسابات المستخدمين والأدوار والصلاحيات</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> إضافة مستخدم
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600"><Users className="h-5 w-5" /><span className="text-sm text-slate-500">إجمالي المستخدمين</span></div>
          <p className="mt-2 text-2xl font-bold">{stats.total || 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600"><UserCheck className="h-5 w-5" /><span className="text-sm text-slate-500">نشط</span></div>
          <p className="mt-2 text-2xl font-bold">{stats.active || 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600"><UserMinus className="h-5 w-5" /><span className="text-sm text-slate-500">معطل</span></div>
          <p className="mt-2 text-2xl font-bold">{stats.inactive || 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600"><Shield className="h-5 w-5" /><span className="text-sm text-slate-500">الأدوار</span></div>
          <p className="mt-2 text-2xl font-bold">{Object.keys(stats.by_role || {}).length}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <input type="text" placeholder="بحث بالاسم أو البريد..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
        <select value={filter.role} onChange={e => setFilter(f => ({ ...f, role: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">جميع الأدوار</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="لا يوجد مستخدمون" onDelete={handleDelete} />

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}>
        <div className="grid gap-4 md:grid-cols-2">
          {!editing && (
            <div>
              <label className="mb-1 block text-sm font-medium">اسم المستخدم *</label>
              <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">الاسم الكامل *</label>
            <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">البريد الإلكتروني *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          {!editing && (
            <div>
              <label className="mb-1 block text-sm font-medium">كلمة المرور *</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="8 أحرف على الأقل" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">الدور *</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">القسم</label>
            <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">اختر القسم</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">الهاتف</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => { setShowModal(false); setEditing(null); }} className="rounded-lg border px-4 py-2 text-sm">إلغاء</button>
          <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            <Save className="h-4 w-4" /> {editing ? 'تحديث' : 'إنشاء'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
