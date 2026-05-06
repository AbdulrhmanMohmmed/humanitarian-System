import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Archive, Download, Edit3, Eye, FileText, FolderArchive, Save, Search, Trash2, Upload, X } from 'lucide-react';
import CustomFieldsForm from '../components/CustomFieldsForm';
import CustomizeModuleButton from '../components/CustomizeModuleButton';
import { useCustomization, renderCustomFieldValue } from '../hooks/useCustomization';

const CATEGORIES = [
  { value: 'project_proposal', label: 'مقترح مشروع' },
  { value: 'report', label: 'تقرير' },
  { value: 'assessment', label: 'تقييم' },
  { value: 'agreement', label: 'اتفاقية' },
  { value: 'budget', label: 'ميزانية' },
  { value: 'meeting_minutes', label: 'محضر اجتماع' },
  { value: 'policy', label: 'سياسة' },
  { value: 'photo', label: 'صورة' },
  { value: 'map', label: 'خريطة' },
  { value: 'other', label: 'أخرى' },
];

const EMPTY_UPLOAD = {
  title: '',
  description: '',
  category: 'other',
  project_id: '',
  tags: '',
  file: null,
  custom_values: {},
};

const EMPTY_EDIT = {
  title: '',
  description: '',
  category: 'other',
  project_id: '',
  tags: '',
  is_archived: false,
  custom_values: {},
};

const STAT_COLORS = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
};

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${sizes[index]}`;
}

export default function DocumentArchive() {
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [uploadForm, setUploadForm] = useState(EMPTY_UPLOAD);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const { fields: customFields, listsBySlug } = useCustomization('document');
  const tableCustomFields = customFields.filter((field) => field.is_searchable).slice(0, 3);
  const documentCategories = listsBySlug.document_categories?.length ? listsBySlug.document_categories : CATEGORIES;

  const load = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (filterCategory) params.append('category', filterCategory);
    if (filterProject) params.append('project_id', filterProject);
    if (!showArchived) params.append('is_archived', 'false');
    api.get(`/documents/?${params.toString()}`).then((r) => setDocuments(r.data));
    api.get('/projects/').then((r) => setProjects(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, [searchQuery, filterCategory, filterProject, showArchived]);

  const stats = useMemo(() => ({
    total: documents.length,
    reports: documents.filter((doc) => doc.category === 'report').length,
    proposals: documents.filter((doc) => doc.category === 'project_proposal').length,
    size: documents.reduce((acc, doc) => acc + (doc.file_size || 0), 0),
  }), [documents]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return;
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description || '');
    formData.append('category', uploadForm.category);
    formData.append('project_id', uploadForm.project_id || '0');
    formData.append('tags', uploadForm.tags || '');
    formData.append('custom_values_json', JSON.stringify(uploadForm.custom_values || {}));
    await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    setShowUploadModal(false);
    setUploadForm(EMPTY_UPLOAD);
    load();
  };

  const openDetails = (doc) => {
    setSelectedDoc(doc);
    setEditForm({
      title: doc.title || '',
      description: doc.description || '',
      category: doc.category || 'other',
      project_id: doc.project_id || '',
      tags: doc.tags || '',
      is_archived: Boolean(doc.is_archived),
      custom_values: doc.custom_values || {},
    });
  };

  const saveDetails = async () => {
    await api.put(`/documents/${selectedDoc.id}`, {
      ...editForm,
      project_id: editForm.project_id ? parseInt(editForm.project_id) : null,
    });
    setSelectedDoc(null);
    load();
  };

  const downloadDoc = async (doc) => {
    const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', doc.file_name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const archiveDoc = async (doc, archived = true) => {
    await api.put(`/documents/${doc.id}`, { is_archived: archived });
    load();
  };

  const deleteDoc = async (docId) => {
    if (!window.confirm('هل تريد حذف هذه الوثيقة؟')) return;
    await api.delete(`/documents/${docId}`);
    load();
  };

  const projectName = (id) => projects.find((project) => project.id === id)?.name || 'بدون مشروع';
  const categoryLabel = (value) => {
    const category = documentCategories.find((item) => item.value === value);
    return category?.label_ar || category?.label || value;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">أرشيف الوثائق</h1>
          <p className="mt-1 text-sm text-gray-500">إدارة، أرشفة، تعديل، وتنزيل وثائق المشاريع والبرامج.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CustomizeModuleButton entity="document" className="h-10" />
          <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
            <Upload size={18} /> رفع وثيقة
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'إجمالي الوثائق', value: stats.total, icon: FolderArchive, color: 'blue' },
          { label: 'تقارير', value: stats.reports, icon: FileText, color: 'green' },
          { label: 'مقترحات مشاريع', value: stats.proposals, icon: Archive, color: 'purple' },
          { label: 'الحجم الكلي', value: formatFileSize(stats.size), icon: Eye, color: 'orange' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${STAT_COLORS[item.color]}`}>
                <item.icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-800">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-2.5 text-gray-400" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث في الوثائق..." className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">جميع الفئات</option>
            {documentCategories.map((category) => <option key={category.value} value={category.value}>{category.label_ar || category.label || category.value}</option>)}
          </select>
          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">جميع المشاريع</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="rounded" />
            إظهار المؤرشفة
          </label>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center text-gray-400 shadow-sm">لا توجد وثائق</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText size={22} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-gray-800">{doc.title}</h4>
                    <p className="text-xs text-gray-400">{categoryLabel(doc.category)} - {projectName(doc.project_id)}</p>
                  </div>
                </div>
                {doc.is_archived && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">مؤرشف</span>}
              </div>
              {doc.description && <p className="mb-3 line-clamp-2 text-sm text-gray-600">{doc.description}</p>}
              {tableCustomFields.length > 0 && (
                <div className="mb-3 grid gap-1 rounded-lg bg-gray-50 p-2">
                  {tableCustomFields.map((field) => (
                    <div key={field.id} className="flex justify-between gap-2 text-xs">
                      <span className="text-gray-400">{field.label_ar || field.label}</span>
                      <span className="font-medium text-gray-600">{renderCustomFieldValue(field, doc.custom_values?.[field.field_key])}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
                <span className="truncate">{doc.file_name}</span>
                <span>{formatFileSize(doc.file_size)}</span>
              </div>
              {doc.tags && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {doc.tags.split(',').map((tag, index) => (
                    <span key={index} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">{tag.trim()}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 border-t border-gray-100 pt-3">
                <button onClick={() => downloadDoc(doc)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-50 py-1.5 text-sm text-blue-700 transition hover:bg-blue-100">
                  <Download size={14} /> تحميل
                </button>
                <button onClick={() => openDetails(doc)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600" title="تعديل">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => archiveDoc(doc, !doc.is_archived)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-orange-50 hover:text-orange-600" title={doc.is_archived ? 'إلغاء الأرشفة' : 'أرشفة'}>
                  <Archive size={16} />
                </button>
                <button onClick={() => deleteDoc(doc.id)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600" title="حذف">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="رفع وثيقة جديدة">
        <form onSubmit={handleUpload} className="space-y-3">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">عنوان الوثيقة *</label><input required value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">الوصف</label><textarea value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">الفئة</label><select value={uploadForm.category} onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">{documentCategories.map((category) => <option key={category.value} value={category.value}>{category.label_ar || category.label || category.value}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">المشروع</label><select value={uploadForm.project_id} onChange={(e) => setUploadForm({ ...uploadForm, project_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="">بدون مشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">الوسوم</label><input value={uploadForm.tags} onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })} placeholder="مثال: تقرير, 2026, صنعاء" className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <CustomFieldsForm fields={customFields} values={uploadForm.custom_values} onChange={(customValues) => setUploadForm({ ...uploadForm, custom_values: customValues })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">الملف *</label>
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center">
              <input type="file" onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                {uploadForm.file ? <p className="text-sm font-medium text-blue-600">{uploadForm.file.name}</p> : <p className="text-sm text-gray-400">اضغط لاختيار ملف</p>}
              </label>
            </div>
          </div>
          <button type="submit" disabled={!uploadForm.file} className={`w-full rounded-xl py-2.5 font-medium transition ${uploadForm.file ? 'bg-blue-600 text-white hover:bg-blue-700' : 'cursor-not-allowed bg-gray-200 text-gray-400'}`}>
            رفع الوثيقة
          </button>
        </form>
      </Modal>

      {selectedDoc && (
        <Modal isOpen={Boolean(selectedDoc)} onClose={() => setSelectedDoc(null)} title="تفاصيل الوثيقة">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border bg-gray-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-700">{selectedDoc.file_name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(selectedDoc.file_size)} - الإصدار {selectedDoc.version}</p>
              </div>
              <button onClick={() => downloadDoc(selectedDoc)} className="rounded-lg bg-blue-600 p-2 text-white"><Download size={16} /></button>
            </div>
            <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">{documentCategories.map((category) => <option key={category.value} value={category.value}>{category.label_ar || category.label || category.value}</option>)}</select>
              <select value={editForm.project_id} onChange={(e) => setEditForm({ ...editForm, project_id: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="">بدون مشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
            </div>
            <input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="الوسوم" className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={editForm.is_archived} onChange={(e) => setEditForm({ ...editForm, is_archived: e.target.checked })} />
              مؤرشفة
            </label>
            <CustomFieldsForm fields={customFields} values={editForm.custom_values} onChange={(customValues) => setEditForm({ ...editForm, custom_values: customValues })} />
            <div className="flex gap-2">
              <button onClick={saveDetails} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-bold text-white transition hover:bg-blue-700">
                <Save size={16} /> حفظ التعديلات
              </button>
              <button onClick={() => setSelectedDoc(null)} className="rounded-xl border px-4 py-2.5 text-gray-600 hover:bg-gray-50"><X size={16} /></button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
