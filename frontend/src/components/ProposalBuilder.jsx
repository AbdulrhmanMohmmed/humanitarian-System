/**
 * Drag & Drop Proposal Builder Component.
 * Provides a structured interface for building donor proposals
 * with reorderable sections.
 */
import { useState, useCallback } from 'react';
import { GripVertical, Plus, Trash2, Save, FileText, Target, DollarSign, Users, Calendar, CheckCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

const SECTION_TYPES = [
  { id: 'executive_summary', label: 'الملخص التنفيذي', icon: FileText, required: true },
  { id: 'problem_statement', label: 'بيان المشكلة', icon: Target, required: true },
  { id: 'objectives', label: 'الأهداف', icon: CheckCircle, required: true },
  { id: 'methodology', label: 'المنهجية', icon: FileText, required: false },
  { id: 'target_beneficiaries', label: 'الفئة المستهدفة', icon: Users, required: true },
  { id: 'budget', label: 'الميزانية', icon: DollarSign, required: true },
  { id: 'timeline', label: 'الجدول الزمني', icon: Calendar, required: true },
  { id: 'monitoring', label: 'المتابعة والتقييم', icon: CheckCircle, required: false },
  { id: 'sustainability', label: 'الاستدامة', icon: Target, required: false },
  { id: 'risk_management', label: 'إدارة المخاطر', icon: FileText, required: false },
];

function DraggableSection({ section, index, onMove, onUpdate, onRemove }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== index) onMove(fromIndex, index);
  };

  const SectionIcon = SECTION_TYPES.find(t => t.id === section.type)?.icon || FileText;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border rounded-xl p-4 mb-3 transition-all ${
        dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
          <GripVertical size={20} />
        </div>
        <SectionIcon size={18} className="text-blue-600" />
        <h4 className="font-bold text-gray-800 flex-1">{section.title}</h4>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {SECTION_TYPES.find(t => t.id === section.type)?.label}
        </span>
        <button onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 p-1">
          <Trash2 size={16} />
        </button>
      </div>
      <textarea
        value={section.content}
        onChange={(e) => onUpdate(index, { ...section, content: e.target.value })}
        className="w-full h-24 border border-gray-200 rounded-lg p-3 text-sm resize-y focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        placeholder={`أدخل محتوى ${SECTION_TYPES.find(t => t.id === section.type)?.label}...`}
        dir="rtl"
      />
    </div>
  );
}

export default function ProposalBuilder({ proposalId, initialSections = [], onSave }) {
  const { addToast } = useToast();
  const [sections, setSections] = useState(
    initialSections.length > 0
      ? initialSections
      : SECTION_TYPES.filter(t => t.required).map(t => ({
          type: t.id,
          title: t.label,
          content: '',
          order: 0,
        }))
  );
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');

  const handleMove = useCallback((fromIndex, toIndex) => {
    setSections(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const handleUpdate = useCallback((index, updated) => {
    setSections(prev => prev.map((s, i) => i === index ? updated : s));
  }, []);

  const handleRemove = useCallback((index) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddSection = (typeId) => {
    const type = SECTION_TYPES.find(t => t.id === typeId);
    if (!type) return;
    setSections(prev => [...prev, {
      type: type.id,
      title: type.label,
      content: '',
      order: prev.length,
    }]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSave) {
        await onSave({ title, sections });
      } else {
        await api.post('/api/v1/donor-portal/proposals', {
          title: title || 'مقترح جديد',
          sections: sections.map((s, i) => ({ ...s, order: i })),
          status: 'draft',
        });
      }
      addToast('تم حفظ المقترح بنجاح', 'success');
    } catch {
      addToast('فشل في حفظ المقترح', 'error');
    } finally {
      setSaving(false);
    }
  };

  const availableTypes = SECTION_TYPES.filter(t => !sections.some(s => s.type === t.id));

  return (
    <div className="max-w-4xl mx-auto p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">منشئ المقترحات</h2>
          <p className="text-sm text-gray-500">قم بسحب الأقسام لإعادة ترتيبها</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold transition-all"
        >
          <Save size={18} />
          {saving ? 'جاري الحفظ...' : 'حفظ المقترح'}
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان المقترح..."
          className="w-full h-14 px-5 border border-gray-200 rounded-xl text-lg font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          dir="rtl"
        />
      </div>

      <div className="space-y-0">
        {sections.map((section, index) => (
          <DraggableSection
            key={`${section.type}-${index}`}
            section={section}
            index={index}
            onMove={handleMove}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {availableTypes.length > 0 && (
        <div className="mt-6 p-4 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm font-bold text-gray-500 mb-3">إضافة قسم جديد:</p>
          <div className="flex flex-wrap gap-2">
            {availableTypes.map(type => (
              <button
                key={type.id}
                onClick={() => handleAddSection(type.id)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-sm"
              >
                <Plus size={14} />
                {type.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <h4 className="font-bold text-blue-800 mb-2">نصائح:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• اسحب الأقسام بالإمساك بأيقونة ☰ لإعادة الترتيب</li>
          <li>• الأقسام المطلوبة: الملخص التنفيذي، بيان المشكلة، الأهداف، الفئة المستهدفة، الميزانية، الجدول الزمني</li>
          <li>• يمكنك إضافة أقسام اختيارية مثل المنهجية والاستدامة وإدارة المخاطر</li>
        </ul>
      </div>
    </div>
  );
}
