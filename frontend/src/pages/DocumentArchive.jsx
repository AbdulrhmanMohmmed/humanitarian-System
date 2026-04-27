import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Upload, Download, Search, FolderArchive, FileText, Trash2, Archive, Eye } from 'lucide-react';

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

const CATEGORY_ICONS = {
  project_proposal: '📄', report: '📊', assessment: '📋', agreement: '📝',
  budget: '💰', meeting_minutes: '📃', policy: '📜', photo: '📸',
  map: '🗺️', other: '📁',
};

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function DocumentArchive() {
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', category: 'other', project_id: '', tags: '', file: null,
  });

  const load = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (filterCategory) params.append('category', filterCategory);
    if (filterProject) params.append('project_id', filterProject);
    if (!showArchived) params.append('is_archived', 'false');
    api.get(`/documents/?${params.toString()}`).then(r => setDocuments(r.data));
    api.get('/projects/').then(r => setProjects(r.data));
  };

  useEffect(() => { load(); }, [searchQuery, filterCategory, filterProject, showArchived]);

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
    await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setShowUploadModal(false);
    setUploadForm({ title: '', description: '', category: 'other', project_id: '', tags: '', file: null });
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

  const archiveDoc = async (docId) => {
    await api.put(`/documents/${docId}`, { is_archived: true });
    load();
  };

  const deleteDoc = async (docId) => {
    await api.delete(`/documents/${docId}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">أرشيف الوثائق</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة وأرشفة وثائق المشاريع والبرامج</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          <Upload size={18} /> رفع وثيقة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><FolderArchive size={24} className="text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">إجمالي الوثائق</p>
              <p className="text-2xl font-bold text-gray-800">{documents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><FileText size={24} className="text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">تقارير</p>
              <p className="text-2xl font-bold text-gray-800">{documents.filter(d => d.category === 'report').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><Archive size={24} className="text-purple-600" /></div>
            <div>
              <p className="text-sm text-gray-500">مقترحات مشاريع</p>
              <p className="text-2xl font-bold text-gray-800">{documents.filter(d => d.category === 'project_proposal').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center"><Eye size={24} className="text-orange-600" /></div>
            <div>
              <p className="text-sm text-gray-500">الحجم الكلي</p>
              <p className="text-2xl font-bold text-gray-800">{formatFileSize(documents.reduce((acc, d) => acc + (d.file_size || 0), 0))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute right-3 top-2.5 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث في الوثائق..."
              className="w-full pr-10 pl-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">جميع الفئات</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">جميع المشاريع</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="rounded" />
            المؤرشفة
          </label>
        </div>
      </div>

      {/* Document Grid */}
      {documents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
          لا توجد وثائق
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[doc.category] || '📁'}</span>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{doc.title}</h4>
                    <p className="text-xs text-gray-400">{CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}</p>
                  </div>
                </div>
                {doc.is_archived && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">مؤرشف</span>}
              </div>
              {doc.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                <span>{doc.file_name}</span>
                <span>{formatFileSize(doc.file_size)}</span>
              </div>
              {doc.tags && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {doc.tags.split(',').map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">{tag.trim()}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 pt-3 border-t border-gray-100">
                <button onClick={() => downloadDoc(doc)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm">
                  <Download size={14} /> تحميل
                </button>
                {!doc.is_archived && (
                  <button onClick={() => archiveDoc(doc.id)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition" title="أرشفة">
                    <Archive size={16} />
                  </button>
                )}
                <button onClick={() => deleteDoc(doc.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="حذف">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="رفع وثيقة جديدة">
        <form onSubmit={handleUpload} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الوثيقة *</label>
            <input required value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
              <select value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label>
              <select value={uploadForm.project_id} onChange={e => setUploadForm({ ...uploadForm, project_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">بدون مشروع</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوسوم (مفصولة بفاصلة)</label>
            <input value={uploadForm.tags} onChange={e => setUploadForm({ ...uploadForm, tags: e.target.value })} placeholder="مثال: تقرير, 2024, صنعاء" className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الملف *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <input
                type="file"
                onChange={e => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                {uploadForm.file ? (
                  <p className="text-sm text-blue-600 font-medium">{uploadForm.file.name}</p>
                ) : (
                  <p className="text-sm text-gray-400">اضغط لاختيار ملف</p>
                )}
              </label>
            </div>
          </div>
          <button type="submit" disabled={!uploadForm.file} className={`w-full py-2.5 rounded-xl transition font-medium ${uploadForm.file ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            رفع الوثيقة
          </button>
        </form>
      </Modal>
    </div>
  );
}
