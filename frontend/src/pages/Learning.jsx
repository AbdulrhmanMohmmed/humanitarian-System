import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Lightbulb, BookOpen, FileText, Trash2 } from 'lucide-react';

const LESSON_CATEGORIES = [
  { value: 'program', label: 'البرامج' }, { value: 'operations', label: 'العمليات' },
  { value: 'coordination', label: 'التنسيق' }, { value: 'monitoring', label: 'المتابعة' },
  { value: 'finance', label: 'المالية' }, { value: 'hr', label: 'الموارد البشرية' },
  { value: 'logistics', label: 'اللوجستيات' }, { value: 'protection', label: 'الحماية' },
  { value: 'other', label: 'أخرى' },
];

const LESSON_TYPES = [
  { value: 'success', label: 'نجاح' }, { value: 'challenge', label: 'تحدي' },
  { value: 'recommendation', label: 'توصية' },
];

export default function Learning() {
  const [tab, setTab] = useState('lessons');
  const [lessons, setLessons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [caseStudies, setCaseStudies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);

  const [lessonForm, setLessonForm] = useState({ title: '', description: '', category: 'other', lesson_type: 'success', project_id: '', recommendations: '', impact: '', tags: '' });
  const [reviewForm, setReviewForm] = useState({ title: '', activity_name: '', project_id: '', what_was_planned: '', what_happened: '', what_went_well: '', what_to_improve: '', action_items: '', participants: '' });
  const [caseForm, setCaseForm] = useState({ title: '', summary: '', background: '', intervention: '', results: '', impact_statement: '', quotes: '', project_id: '', sector: '', beneficiary_name: '', consent_obtained: false, tags: '' });

  const load = () => {
    api.get('/learning/lessons').then(r => setLessons(r.data));
    api.get('/learning/reviews').then(r => setReviews(r.data));
    api.get('/learning/case-studies').then(r => setCaseStudies(r.data));
    api.get('/projects/').then(r => setProjects(r.data));
  };
  useEffect(() => { load(); }, []);

  const submitLesson = async (e) => {
    e.preventDefault();
    await api.post('/learning/lessons', { ...lessonForm, project_id: lessonForm.project_id ? parseInt(lessonForm.project_id) : null });
    setShowLessonModal(false);
    setLessonForm({ title: '', description: '', category: 'other', lesson_type: 'success', project_id: '', recommendations: '', impact: '', tags: '' });
    load();
  };

  const submitReview = async (e) => {
    e.preventDefault();
    await api.post('/learning/reviews', { ...reviewForm, project_id: reviewForm.project_id ? parseInt(reviewForm.project_id) : null });
    setShowReviewModal(false);
    setReviewForm({ title: '', activity_name: '', project_id: '', what_was_planned: '', what_happened: '', what_went_well: '', what_to_improve: '', action_items: '', participants: '' });
    load();
  };

  const submitCase = async (e) => {
    e.preventDefault();
    await api.post('/learning/case-studies', { ...caseForm, project_id: caseForm.project_id ? parseInt(caseForm.project_id) : null });
    setShowCaseModal(false);
    setCaseForm({ title: '', summary: '', background: '', intervention: '', results: '', impact_statement: '', quotes: '', project_id: '', sector: '', beneficiary_name: '', consent_obtained: false, tags: '' });
    load();
  };

  const typeColors = { success: 'bg-green-100 text-green-700', challenge: 'bg-red-100 text-red-700', recommendation: 'bg-blue-100 text-blue-700' };
  const typeLabels = { success: 'نجاح', challenge: 'تحدي', recommendation: 'توصية' };

  const tabs = [
    { key: 'lessons', label: 'الدروس المستفادة', icon: Lightbulb, count: lessons.length },
    { key: 'reviews', label: 'مراجعات ما بعد التنفيذ', icon: BookOpen, count: reviews.length },
    { key: 'cases', label: 'دراسات الحالة', icon: FileText, count: caseStudies.length },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">التعلم وإدارة المعرفة</h1>
          <p className="text-sm text-gray-500 mt-1">توثيق الدروس المستفادة والممارسات الفضلى</p>
        </div>
        <div className="flex gap-2">
          {tab === 'lessons' && <button onClick={() => setShowLessonModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"><Plus size={18} /> درس جديد</button>}
          {tab === 'reviews' && <button onClick={() => setShowReviewModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"><Plus size={18} /> مراجعة جديدة</button>}
          {tab === 'cases' && <button onClick={() => setShowCaseModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"><Plus size={18} /> دراسة حالة</button>}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <t.icon size={18} /> {t.label} <span className={`px-2 py-0.5 rounded-full text-xs ${tab === t.key ? 'bg-blue-500' : 'bg-gray-100'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Lessons Learned Tab */}
      {tab === 'lessons' && (
        <div className="grid grid-cols-2 gap-4">
          {lessons.length === 0 && <p className="col-span-2 text-center text-gray-400 py-10 bg-white rounded-xl">لا توجد دروس مستفادة بعد</p>}
          {lessons.map(lesson => (
            <div key={lesson.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[lesson.lesson_type] || 'bg-gray-100 text-gray-600'}`}>{typeLabels[lesson.lesson_type] || lesson.lesson_type}</span>
                  <span className="text-xs text-gray-400">{LESSON_CATEGORIES.find(c => c.value === lesson.category)?.label}</span>
                </div>
                <button onClick={async () => { await api.delete(`/learning/lessons/${lesson.id}`); load(); }} className="p-1 text-gray-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
              </div>
              <h4 className="font-bold text-gray-800 mb-1">{lesson.title}</h4>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{lesson.description}</p>
              {lesson.recommendations && <p className="text-xs text-blue-600 bg-blue-50 rounded p-2 mb-2">التوصيات: {lesson.recommendations}</p>}
              {lesson.tags && <div className="flex flex-wrap gap-1">{lesson.tags.split(',').map((t, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">{t.trim()}</span>)}</div>}
              <p className="text-xs text-gray-400 mt-2">{new Date(lesson.created_at).toLocaleDateString('ar')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action Reviews Tab */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 && <p className="text-center text-gray-400 py-10 bg-white rounded-xl">لا توجد مراجعات بعد</p>}
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800">{review.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{review.review_date}</span>
                  <button onClick={async () => { await api.delete(`/learning/reviews/${review.id}`); load(); }} className="p-1 text-gray-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3">النشاط: {review.activity_name}</p>
              <div className="grid grid-cols-2 gap-3">
                {review.what_went_well && <div className="bg-green-50 rounded-lg p-3"><p className="text-xs font-bold text-green-700 mb-1">ما سار بشكل جيد</p><p className="text-sm text-green-800">{review.what_went_well}</p></div>}
                {review.what_to_improve && <div className="bg-orange-50 rounded-lg p-3"><p className="text-xs font-bold text-orange-700 mb-1">ما يحتاج تحسين</p><p className="text-sm text-orange-800">{review.what_to_improve}</p></div>}
              </div>
              {review.action_items && <div className="bg-blue-50 rounded-lg p-3 mt-3"><p className="text-xs font-bold text-blue-700 mb-1">الإجراءات المطلوبة</p><p className="text-sm text-blue-800">{review.action_items}</p></div>}
            </div>
          ))}
        </div>
      )}

      {/* Case Studies Tab */}
      {tab === 'cases' && (
        <div className="grid grid-cols-2 gap-4">
          {caseStudies.length === 0 && <p className="col-span-2 text-center text-gray-400 py-10 bg-white rounded-xl">لا توجد دراسات حالة بعد</p>}
          {caseStudies.map(study => (
            <div key={study.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-gray-800">{study.title}</h4>
                <div className="flex items-center gap-1">
                  <button onClick={async () => { await api.put(`/learning/case-studies/${study.id}/publish`); load(); }} className={`px-2 py-1 rounded text-xs ${study.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{study.is_published ? 'منشورة' : 'مسودة'}</button>
                  <button onClick={async () => { await api.delete(`/learning/case-studies/${study.id}`); load(); }} className="p-1 text-gray-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{study.summary}</p>
              {study.impact_statement && <p className="text-xs text-purple-700 bg-purple-50 rounded p-2 mb-2">الأثر: {study.impact_statement}</p>}
              {study.quotes && <p className="text-xs text-gray-500 italic border-r-2 border-gray-300 pr-3">"{study.quotes}"</p>}
              <p className="text-xs text-gray-400 mt-2">{new Date(study.created_at).toLocaleDateString('ar')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lesson Modal */}
      <Modal isOpen={showLessonModal} onClose={() => setShowLessonModal(false)} title="إضافة درس مستفاد">
        <form onSubmit={submitLesson} className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label><input required value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الوصف *</label><textarea required value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={3} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label><select value={lessonForm.category} onChange={e => setLessonForm({ ...lessonForm, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">{LESSON_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">النوع</label><select value={lessonForm.lesson_type} onChange={e => setLessonForm({ ...lessonForm, lesson_type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">{LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label><select value={lessonForm.project_id} onChange={e => setLessonForm({ ...lessonForm, project_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">بدون</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">التوصيات</label><textarea value={lessonForm.recommendations} onChange={e => setLessonForm({ ...lessonForm, recommendations: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الوسوم</label><input value={lessonForm.tags} onChange={e => setLessonForm({ ...lessonForm, tags: e.target.value })} placeholder="مفصولة بفاصلة" className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">حفظ الدرس</button>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="إضافة مراجعة ما بعد التنفيذ (AAR)">
        <form onSubmit={submitReview} className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label><input required value={reviewForm.title} onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم النشاط *</label><input required value={reviewForm.activity_name} onChange={e => setReviewForm({ ...reviewForm, activity_name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label><select value={reviewForm.project_id} onChange={e => setReviewForm({ ...reviewForm, project_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">بدون</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">ما كان مخططاً</label><textarea value={reviewForm.what_was_planned} onChange={e => setReviewForm({ ...reviewForm, what_was_planned: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">ما حدث فعلاً</label><textarea value={reviewForm.what_happened} onChange={e => setReviewForm({ ...reviewForm, what_happened: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">ما سار بشكل جيد</label><textarea value={reviewForm.what_went_well} onChange={e => setReviewForm({ ...reviewForm, what_went_well: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">ما يحتاج تحسين</label><textarea value={reviewForm.what_to_improve} onChange={e => setReviewForm({ ...reviewForm, what_to_improve: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الإجراءات المطلوبة</label><textarea value={reviewForm.action_items} onChange={e => setReviewForm({ ...reviewForm, action_items: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">حفظ المراجعة</button>
        </form>
      </Modal>

      {/* Case Study Modal */}
      <Modal isOpen={showCaseModal} onClose={() => setShowCaseModal(false)} title="إضافة دراسة حالة">
        <form onSubmit={submitCase} className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label><input required value={caseForm.title} onChange={e => setCaseForm({ ...caseForm, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الملخص *</label><textarea required value={caseForm.summary} onChange={e => setCaseForm({ ...caseForm, summary: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الخلفية</label><textarea value={caseForm.background} onChange={e => setCaseForm({ ...caseForm, background: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">التدخل</label><textarea value={caseForm.intervention} onChange={e => setCaseForm({ ...caseForm, intervention: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">النتائج</label><textarea value={caseForm.results} onChange={e => setCaseForm({ ...caseForm, results: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">بيان الأثر</label><textarea value={caseForm.impact_statement} onChange={e => setCaseForm({ ...caseForm, impact_statement: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">اقتباسات</label><input value={caseForm.quotes} onChange={e => setCaseForm({ ...caseForm, quotes: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label><select value={caseForm.project_id} onChange={e => setCaseForm({ ...caseForm, project_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">بدون</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم المستفيد</label><input value={caseForm.beneficiary_name} onChange={e => setCaseForm({ ...caseForm, beneficiary_name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={caseForm.consent_obtained} onChange={e => setCaseForm({ ...caseForm, consent_obtained: e.target.checked })} className="rounded" />تم الحصول على موافقة المستفيد</label>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">حفظ دراسة الحالة</button>
        </form>
      </Modal>
    </div>
  );
}
