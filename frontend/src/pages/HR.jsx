import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { Plus, UserCog, Users, DollarSign, Check, X } from 'lucide-react';

export default function HR() {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('employees');
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [empForm, setEmpForm] = useState({ employee_id: '', first_name: '', last_name: '', email: '', phone: '', gender: 'male', department: '', position: '', salary: 0, contract_type: '', office_location: '', hire_date: '' });
  const [leaveForm, setLeaveForm] = useState({ employee_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });

  const load = () => {
    api.get('/hr/employees').then(r => setEmployees(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_employees');
      if (local) setEmployees(JSON.parse(local));
    });
    api.get('/hr/leaves').then(r => setLeaves(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_leaves');
      if (local) setLeaves(JSON.parse(local));
    });
    api.get('/hr/employees/stats').then(r => setStats(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_hr_stats');
      if (local) setStats(JSON.parse(local));
    });
  };
  useEffect(() => { load(); }, []);

  const submitEmp = async (e) => {
    e.preventDefault();
    await api.post('/hr/employees', { ...empForm, salary: parseFloat(empForm.salary) });
    setShowEmpModal(false);
    setEmpForm({ employee_id: '', first_name: '', last_name: '', email: '', phone: '', gender: 'male', department: '', position: '', salary: 0, contract_type: '', office_location: '', hire_date: '' });
    load();
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    await api.post('/hr/leaves', { ...leaveForm, employee_id: parseInt(leaveForm.employee_id) });
    setShowLeaveModal(false);
    setLeaveForm({ employee_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });
    load();
  };

  const handleLeaveAction = async (id, action) => {
    await api.put(`/hr/leaves/${id}/${action}`);
    load();
  };

  const empColumns = [
    { key: 'employee_id', label: 'رقم الموظف' },
    { key: 'first_name', label: 'الاسم', render: (v, row) => `${row.first_name} ${row.last_name}` },
    { key: 'gender', label: 'الجنس', render: v => <StatusBadge status={v} /> },
    { key: 'department', label: 'القسم' },
    { key: 'position', label: 'المنصب' },
    { key: 'salary', label: 'الراتب ($)', render: v => v?.toLocaleString() },
    { key: 'contract_type', label: 'نوع العقد' },
    { key: 'office_location', label: 'الموقع' },
    { key: 'status', label: 'الحالة', render: v => <StatusBadge status={v} /> },
  ];

  const leaveColumns = [
    { key: 'employee_id', label: 'رقم الموظف' },
    { key: 'leave_type', label: 'نوع الإجازة', render: v => ({ annual: 'سنوية', sick: 'مرضية', maternity: 'أمومة', emergency: 'طارئة', unpaid: 'بدون راتب' }[v] || v) },
    { key: 'start_date', label: 'من' },
    { key: 'end_date', label: 'إلى' },
    { key: 'days', label: 'الأيام' },
    { key: 'reason', label: 'السبب' },
    { key: 'status', label: 'الحالة', render: (v, row) => (
      <div className="flex items-center gap-2">
        <StatusBadge status={v} />
        {v === 'pending' && (
          <>
            <button onClick={() => handleLeaveAction(row.id, 'approve')} className="p-1 text-green-500 hover:bg-green-50 rounded"><Check size={14} /></button>
            <button onClick={() => handleLeaveAction(row.id, 'reject')} className="p-1 text-red-500 hover:bg-red-50 rounded"><X size={14} /></button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الموارد البشرية</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowEmpModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"><Plus size={18} /> إضافة موظف</button>
          <button onClick={() => setShowLeaveModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"><Plus size={18} /> طلب إجازة</button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="إجمالي الموظفين" value={stats.total} icon={Users} color="blue" />
          <StatCard title="الموظفين النشطين" value={stats.active} icon={UserCog} color="green" />
          <StatCard title="إجمالي الرواتب ($)" value={stats.total_salary?.toLocaleString()} icon={DollarSign} color="orange" />
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('employees')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'employees' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>الموظفين</button>
        <button onClick={() => setTab('leaves')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'leaves' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>طلبات الإجازة</button>
      </div>

      {tab === 'employees' ? (
        <DataTable columns={empColumns} data={employees} onDelete={async (id) => { await api.delete(`/hr/employees/${id}`); load(); }} />
      ) : (
        <DataTable columns={leaveColumns} data={leaves} />
      )}

      <Modal isOpen={showEmpModal} onClose={() => setShowEmpModal(false)} title="إضافة موظف">
        <form onSubmit={submitEmp} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">رقم الموظف *</label><input required value={empForm.employee_id} onChange={e => setEmpForm({...empForm, employee_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">الجنس</label><select value={empForm.gender} onChange={e => setEmpForm({...empForm, gender: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="male">ذكر</option><option value="female">أنثى</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأول *</label><input required value={empForm.first_name} onChange={e => setEmpForm({...empForm, first_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم العائلة *</label><input required value={empForm.last_name} onChange={e => setEmpForm({...empForm, last_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">القسم</label><select value={empForm.department} onChange={e => setEmpForm({...empForm, department: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option>{["البرامج","المالية","الموارد البشرية","اللوجستيات","المتابعة والتقييم","الإدارة"].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المنصب</label><input value={empForm.position} onChange={e => setEmpForm({...empForm, position: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">الراتب ($)</label><input type="number" value={empForm.salary} onChange={e => setEmpForm({...empForm, salary: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">نوع العقد</label><select value={empForm.contract_type} onChange={e => setEmpForm({...empForm, contract_type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option><option value="دائم">دائم</option><option value="مؤقت">مؤقت</option><option value="استشاري">استشاري</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label><input value={empForm.office_location} onChange={e => setEmpForm({...empForm, office_location: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التوظيف</label><input type="date" value={empForm.hire_date} onChange={e => setEmpForm({...empForm, hire_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">حفظ</button>
        </form>
      </Modal>

      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="طلب إجازة">
        <form onSubmit={submitLeave} className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الموظف *</label><select required value={leaveForm.employee_id} onChange={e => setLeaveForm({...leaveForm, employee_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر الموظف</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">نوع الإجازة</label><select value={leaveForm.leave_type} onChange={e => setLeaveForm({...leaveForm, leave_type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="annual">سنوية</option><option value="sick">مرضية</option><option value="maternity">أمومة</option><option value="emergency">طارئة</option><option value="unpaid">بدون راتب</option></select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">من *</label><input required type="date" value={leaveForm.start_date} onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">إلى *</label><input required type="date" value={leaveForm.end_date} onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">السبب</label><textarea value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <button type="submit" className="w-full py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium">إرسال الطلب</button>
        </form>
      </Modal>
    </div>
  );
}
