import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Trash2, ChevronDown, ChevronLeft, Target, ArrowUpRight, Package, Activity } from 'lucide-react';

const LEVELS = [
  { value: 'goal', label: 'الهدف العام', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Target },
  { value: 'purpose', label: 'الهدف الخاص', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: ArrowUpRight },
  { value: 'output', label: 'المخرج', color: 'bg-green-100 text-green-700 border-green-300', icon: Package },
  { value: 'activity', label: 'النشاط', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Activity },
];

function LogFrameItem({ item, onDelete, onAddChild, depth = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const level = LEVELS.find(l => l.value === item.level);
  const hasChildren = item.children && item.children.length > 0;
  const Icon = level?.icon || Target;

  return (
    <div className={`${depth > 0 ? 'mr-6 border-r-2 border-gray-200 pr-4' : ''}`}>
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 hover:shadow-md transition`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {hasChildren && (
              <button onClick={() => setExpanded(!expanded)} className="mt-1 text-gray-400 hover:text-gray-600 transition">
                {expanded ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
              </button>
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${level?.color || 'bg-gray-100'}`}>
              <Icon size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${level?.color || 'bg-gray-100 text-gray-600'}`}>{level?.label || item.level}</span>
                {item.code && <span className="text-xs text-gray-400 font-mono">{item.code}</span>}
              </div>
              <p className="text-sm text-gray-800 font-medium mb-2">{item.description}</p>
              {item.indicators && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-1">
                  <span className="font-bold text-gray-600">المؤشرات:</span> {item.indicators}
                </div>
              )}
              {item.means_of_verification && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-1">
                  <span className="font-bold text-gray-600">وسائل التحقق:</span> {item.means_of_verification}
                </div>
              )}
              {item.assumptions && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                  <span className="font-bold text-gray-600">الافتراضات:</span> {item.assumptions}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {item.level !== 'activity' && (
              <button onClick={() => onAddChild(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="إضافة عنصر فرعي">
                <Plus size={14} />
              </button>
            )}
            <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="حذف">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="mt-1">
          {item.children.map(child => (
            <LogFrameItem key={child.id} item={child} onDelete={onDelete} onAddChild={onAddChild} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LogFramePage() {
  const [logframes, setLogframes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [parentItem, setParentItem] = useState(null);

  const nextLevel = {
    null: 'goal',
    'goal': 'purpose',
    'purpose': 'output',
    'output': 'activity',
  };

  const [form, setForm] = useState({
    project_id: '', level: 'goal', code: '', description: '',
    indicators: '', means_of_verification: '', assumptions: '', parent_id: null,
  });

  const load = () => {
    const url = selectedProject ? `/logframe/project/${selectedProject}` : '/logframe/all';
    api.get(url).then(r => setLogframes(r.data)).catch(() => { });
    api.get('/projects/').then(r => setProjects(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_projects');
      if (local) setProjects(JSON.parse(local));
    });
  };
  useEffect(() => { load(); }, [selectedProject]);

  const openAddChild = (parent) => {
    const childLevel = nextLevel[parent.level] || 'activity';
    setParentItem(parent);
    setForm({
      project_id: parent.project_id.toString(),
      level: childLevel,
      code: '',
      description: '',
      indicators: '',
      means_of_verification: '',
      assumptions: '',
      parent_id: parent.id,
    });
    setShowModal(true);
  };

  const openAddRoot = () => {
    setParentItem(null);
    setForm({
      project_id: selectedProject || '',
      level: 'goal',
      code: '', description: '', indicators: '', means_of_verification: '', assumptions: '', parent_id: null,
    });
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/logframe/', {
      ...form,
      project_id: parseInt(form.project_id),
      parent_id: form.parent_id || null,
    });
    setShowModal(false);
    load();
  };

  const deleteItem = async (id) => {
    await api.delete(`/logframe/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الإطار المنطقي (LogFrame)</h1>
          <p className="text-sm text-gray-500 mt-1">بناء وإدارة الإطار المنطقي للمشاريع</p>
        </div>
        <button onClick={openAddRoot} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          <Plus size={18} /> إضافة هدف عام
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">المشروع:</span>
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">جميع المشاريع</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {LEVELS.map(l => (
              <span key={l.value} className={`px-2 py-1 rounded-lg border ${l.color}`}>{l.label}</span>
            ))}
          </div>
        </div>
      </div>

      {logframes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <Target size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 mb-2">لا يوجد إطار منطقي بعد</p>
          <p className="text-sm text-gray-400">ابدأ بإضافة الهدف العام للمشروع</p>
        </div>
      ) : (
        <div>
          {logframes.map(item => (
            <LogFrameItem key={item.id} item={item} onDelete={deleteItem} onAddChild={openAddChild} />
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={parentItem ? `إضافة عنصر ضمن: ${parentItem.description?.substring(0, 40)}...` : 'إضافة هدف عام'}>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المشروع *</label>
              <select required value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">اختر</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المستوى</label>
              <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الرمز</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="مثال: G1, P1.1, O1.1.1" className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الوصف *</label><textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">المؤشرات</label><textarea value={form.indicators} onChange={e => setForm({ ...form, indicators: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder="مثال: عدد المستفيدين - نسبة التحسن" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">وسائل التحقق</label><textarea value={form.means_of_verification} onChange={e => setForm({ ...form, means_of_verification: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder="مثال: تقارير المتابعة - استبيانات" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الافتراضات</label><textarea value={form.assumptions} onChange={e => setForm({ ...form, assumptions: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">حفظ</button>
        </form>
      </Modal>
    </div>
  );
}
