import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, ClipboardList, Eye, Send, FileText, Trash2, GripVertical } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'نص قصير' },
  { value: 'textarea', label: 'نص طويل' },
  { value: 'number', label: 'رقم' },
  { value: 'select', label: 'قائمة منسدلة' },
  { value: 'multi_select', label: 'اختيار متعدد' },
  { value: 'radio', label: 'اختيار واحد' },
  { value: 'checkbox', label: 'مربع اختيار' },
  { value: 'date', label: 'تاريخ' },
  { value: 'datetime', label: 'تاريخ ووقت' },
  { value: 'gps', label: 'إحداثيات GPS' },
  { value: 'photo', label: 'صورة' },
  { value: 'file', label: 'ملف' },
  { value: 'rating', label: 'تقييم' },
  { value: 'section', label: 'عنوان قسم' },
];

export default function DataCollection() {
  const [forms, setForms] = useState([]);
  const [projects, setProjects] = useState([]);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showFillModal, setShowFillModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const [formData, setFormData] = useState({
    title: '', description: '', project_id: '', status: 'draft',
    collect_gps: false, allow_edit_after_submit: false, fields: [],
  });

  const [fillData, setFillData] = useState({});

  const emptyField = { field_name: '', label: '', field_type: 'text', is_required: false, options: '', help_text: '', order: 0 };

  const load = () => {
    api.get('/data-collection/forms').then(r => setForms(r.data));
    api.get('/projects/').then(r => setProjects(r.data));
  };
  useEffect(() => { load(); }, []);

  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { ...emptyField, field_name: `field_${formData.fields.length + 1}`, order: formData.fields.length }],
    });
  };

  const updateField = (index, key, value) => {
    const updated = [...formData.fields];
    updated[index] = { ...updated[index], [key]: value };
    setFormData({ ...formData, fields: updated });
  };

  const removeField = (index) => {
    const updated = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: updated });
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      project_id: formData.project_id ? parseInt(formData.project_id) : null,
      fields: formData.fields.map((f, i) => ({
        ...f,
        order: i,
        options: f.options || null,
        help_text: f.help_text || null,
      })),
    };
    await api.post('/data-collection/forms', payload);
    setShowFormModal(false);
    setFormData({ title: '', description: '', project_id: '', status: 'draft', collect_gps: false, allow_edit_after_submit: false, fields: [] });
    load();
  };

  const openFillForm = (form) => {
    setSelectedForm(form);
    const initial = {};
    form.fields.forEach(f => { initial[f.field_name] = ''; });
    setFillData(initial);
    setShowFillModal(true);
  };

  const submitFillForm = async (e) => {
    e.preventDefault();
    await api.post('/data-collection/submissions', {
      form_id: selectedForm.id,
      data: JSON.stringify(fillData),
      governorate: fillData._governorate || null,
      district: fillData._district || null,
    });
    setShowFillModal(false);
    load();
  };

  const viewSubmissions = async (form) => {
    setSelectedForm(form);
    const r = await api.get(`/data-collection/forms/${form.id}/submissions`);
    setSubmissions(r.data);
    setShowSubmissionsModal(true);
  };

  const validateSubmission = async (subId, approved) => {
    await api.put(`/data-collection/submissions/${subId}/validate?approved=${approved}`);
    const r = await api.get(`/data-collection/forms/${selectedForm.id}/submissions`);
    setSubmissions(r.data);
  };


  const formColumns = [
    { key: 'title', label: 'عنوان النموذج' },
    { key: 'description', label: 'الوصف', render: v => v ? (v.length > 50 ? v.substring(0, 50) + '...' : v) : '-' },
    { key: 'status', label: 'الحالة', render: v => <StatusBadge status={v} /> },
    { key: 'fields', label: 'الحقول', render: (v) => <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">{v?.length || 0} حقل</span> },
    { key: 'submission_count', label: 'الاستجابات', render: v => <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs">{v || 0}</span> },
    {
      key: 'id', label: 'إجراءات', render: (v, row) => (
        <div className="flex gap-1">
          {row.status === 'published' && (
            <button onClick={() => openFillForm(row)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="تعبئة النموذج">
              <Send size={15} />
            </button>
          )}
          <button onClick={() => viewSubmissions(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="عرض الاستجابات">
            <Eye size={15} />
          </button>
        </div>
      )
    },
  ];

  const renderFieldInput = (field) => {
    const baseClass = "w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500";
    switch (field.field_type) {
      case 'textarea':
        return <textarea value={fillData[field.field_name] || ''} onChange={e => setFillData({ ...fillData, [field.field_name]: e.target.value })} className={baseClass} rows={3} />;
      case 'number':
        return <input type="number" value={fillData[field.field_name] || ''} onChange={e => setFillData({ ...fillData, [field.field_name]: e.target.value })} className={baseClass} />;
      case 'date':
        return <input type="date" value={fillData[field.field_name] || ''} onChange={e => setFillData({ ...fillData, [field.field_name]: e.target.value })} className={baseClass} />;
      case 'datetime':
        return <input type="datetime-local" value={fillData[field.field_name] || ''} onChange={e => setFillData({ ...fillData, [field.field_name]: e.target.value })} className={baseClass} />;
      case 'select':
      case 'radio': {
        const options = field.options ? field.options.split(',').map(o => o.trim()) : [];
        return (
          <select value={fillData[field.field_name] || ''} onChange={e => setFillData({ ...fillData, [field.field_name]: e.target.value })} className={baseClass}>
            <option value="">اختر...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      }
      case 'multi_select':
      case 'checkbox': {
        const options = field.options ? field.options.split(',').map(o => o.trim()) : [];
        const selected = fillData[field.field_name] ? fillData[field.field_name].split(',') : [];
        return (
          <div className="space-y-1">
            {options.map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={e => {
                    const newSel = e.target.checked ? [...selected, opt] : selected.filter(s => s !== opt);
                    setFillData({ ...fillData, [field.field_name]: newSel.join(',') });
                  }}
                  className="rounded"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        );
      }
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setFillData({ ...fillData, [field.field_name]: String(n) })}
                className={`w-10 h-10 rounded-lg border-2 font-bold transition ${parseInt(fillData[field.field_name]) >= n ? 'bg-yellow-400 border-yellow-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
              >
                {n}
              </button>
            ))}
          </div>
        );
      case 'gps':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="any" placeholder="خط العرض" value={fillData[field.field_name + '_lat'] || ''} onChange={e => setFillData({ ...fillData, [field.field_name + '_lat']: e.target.value, [field.field_name]: `${e.target.value},${fillData[field.field_name + '_lng'] || ''}` })} className={baseClass} />
            <input type="number" step="any" placeholder="خط الطول" value={fillData[field.field_name + '_lng'] || ''} onChange={e => setFillData({ ...fillData, [field.field_name + '_lng']: e.target.value, [field.field_name]: `${fillData[field.field_name + '_lat'] || ''},${e.target.value}` })} className={baseClass} />
          </div>
        );
      case 'section':
        return <div className="border-b-2 border-blue-200 pb-1 mb-2 font-bold text-blue-700">{field.label}</div>;
      default:
        return <input type="text" value={fillData[field.field_name] || ''} onChange={e => setFillData({ ...fillData, [field.field_name]: e.target.value })} className={baseClass} />;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">جمع البيانات الميدانية</h1>
          <p className="text-sm text-gray-500 mt-1">إنشاء نماذج جمع البيانات وإدارة الاستجابات</p>
        </div>
        <button onClick={() => setShowFormModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          <Plus size={18} /> نموذج جديد
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><ClipboardList size={24} className="text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">إجمالي النماذج</p>
              <p className="text-2xl font-bold text-gray-800">{forms.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><Send size={24} className="text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">النماذج المنشورة</p>
              <p className="text-2xl font-bold text-gray-800">{forms.filter(f => f.status === 'published').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><FileText size={24} className="text-purple-600" /></div>
            <div>
              <p className="text-sm text-gray-500">إجمالي الاستجابات</p>
              <p className="text-2xl font-bold text-gray-800">{forms.reduce((acc, f) => acc + (f.submission_count || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={formColumns}
        data={forms}
        onDelete={async (id) => { await api.delete(`/data-collection/forms/${id}`); load(); }}
      />

      {/* Create Form Modal */}
      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title="إنشاء نموذج جمع بيانات">
        <form onSubmit={submitForm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان النموذج *</label>
            <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label>
              <select value={formData.project_id} onChange={e => setFormData({ ...formData, project_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">بدون مشروع</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="draft">مسودة</option>
                <option value="published">منشور</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.collect_gps} onChange={e => setFormData({ ...formData, collect_gps: e.target.checked })} className="rounded" />
              <span className="text-sm">جمع إحداثيات GPS</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.allow_edit_after_submit} onChange={e => setFormData({ ...formData, allow_edit_after_submit: e.target.checked })} className="rounded" />
              <span className="text-sm">السماح بالتعديل بعد الإرسال</span>
            </label>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-700">حقول النموذج</h4>
              <button type="button" onClick={addField} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-sm">
                <Plus size={14} /> إضافة حقل
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {formData.fields.map((field, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start gap-2">
                    <GripVertical size={16} className="text-gray-400 mt-2.5" />
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input placeholder="اسم الحقل" value={field.field_name} onChange={e => updateField(index, 'field_name', e.target.value)} className="px-2 py-1.5 rounded border border-gray-200 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                        <input placeholder="التسمية (العنوان)" value={field.label} onChange={e => updateField(index, 'label', e.target.value)} className="px-2 py-1.5 rounded border border-gray-200 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                        <select value={field.field_type} onChange={e => updateField(index, 'field_type', e.target.value)} className="px-2 py-1.5 rounded border border-gray-200 text-sm outline-none focus:ring-1 focus:ring-blue-500">
                          {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      {['select', 'multi_select', 'radio', 'checkbox'].includes(field.field_type) && (
                        <input placeholder="الخيارات (مفصولة بفاصلة)" value={field.options} onChange={e => updateField(index, 'options', e.target.value)} className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                      )}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer text-xs">
                          <input type="checkbox" checked={field.is_required} onChange={e => updateField(index, 'is_required', e.target.checked)} className="rounded" />
                          إلزامي
                        </label>
                        <input placeholder="نص مساعدة" value={field.help_text} onChange={e => updateField(index, 'help_text', e.target.value)} className="flex-1 px-2 py-1 rounded border border-gray-200 text-xs outline-none" />
                      </div>
                    </div>
                    <button type="button" onClick={() => removeField(index)} className="p-1 text-red-400 hover:text-red-600 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {formData.fields.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">اضغط "إضافة حقل" لبدء بناء النموذج</p>
              )}
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">حفظ النموذج</button>
        </form>
      </Modal>

      {/* Fill Form Modal */}
      <Modal isOpen={showFillModal} onClose={() => setShowFillModal(false)} title={`تعبئة: ${selectedForm?.title || ''}`}>
        <form onSubmit={submitFillForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
              <input value={fillData._governorate || ''} onChange={e => setFillData({ ...fillData, _governorate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المديرية</label>
              <input value={fillData._district || ''} onChange={e => setFillData({ ...fillData, _district: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="border-t pt-3 space-y-3">
            {selectedForm?.fields?.map(field => (
              <div key={field.id}>
                {field.field_type !== 'section' && (
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.is_required && <span className="text-red-500">*</span>}
                  </label>
                )}
                {field.help_text && <p className="text-xs text-gray-400 mb-1">{field.help_text}</p>}
                {renderFieldInput(field)}
              </div>
            ))}
          </div>
          <button type="submit" className="w-full py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium">إرسال الاستجابة</button>
        </form>
      </Modal>

      {/* Submissions Modal */}
      <Modal isOpen={showSubmissionsModal} onClose={() => setShowSubmissionsModal(false)} title={`استجابات: ${selectedForm?.title || ''}`}>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {submissions.length === 0 ? (
            <p className="text-center text-gray-400 py-8">لا توجد استجابات بعد</p>
          ) : submissions.map(sub => {
            let data = {};
            try { data = JSON.parse(sub.data); } catch { /* ignore */ }
            return (
              <div key={sub.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={sub.status} />
                    {sub.governorate && <span className="text-xs text-gray-500">{sub.governorate}</span>}
                  </div>
                  <div className="flex gap-1">
                    {sub.status === 'submitted' && (
                      <>
                        <button onClick={() => validateSubmission(sub.id, true)} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100">قبول</button>
                        <button onClick={() => validateSubmission(sub.id, false)} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100">رفض</button>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedForm?.fields?.filter(f => f.field_type !== 'section').map(field => (
                    <div key={field.id}>
                      <span className="text-gray-500">{field.label}: </span>
                      <span className="font-medium">{data[field.field_name] || '-'}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">{new Date(sub.submitted_at).toLocaleString('ar')}</p>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
