import { useState, useEffect } from 'react';
import api from '../services/api';
import { ClipboardCheck, Eye, Download, FileSpreadsheet } from 'lucide-react';

const TYPE_LABELS = { pdm: 'مراقبة ما بعد التوزيع', baseline: 'خط الأساس', endline: 'خط النهاية', kii: 'مقابلات مخبرين رئيسيين', fgd: 'مجموعات نقاش مركزة', monitoring_checklist: 'قائمة تحقق ميدانية', distribution_monitoring: 'مراقبة التوزيع', site_verification: 'تحقق من المواقع', beneficiary_satisfaction: 'رضا المستفيدين' };
const TYPE_ICONS = { pdm: '📋', baseline: '📊', endline: '📈', kii: '🎤', fgd: '👥', monitoring_checklist: '✅', distribution_monitoring: '📦', site_verification: '🏗️', beneficiary_satisfaction: '😊' };

export default function AssessmentTools() {
  const [templates, setTemplates] = useState(null);
  const [templateList, setTemplateList] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    api.get('/assessment-tools/templates').then(r => setTemplates(r.data));
    api.get('/assessment-tools/templates/list').then(r => setTemplateList(r.data));
  }, []);

  const viewTemplate = (type) => {
    if (templates && templates[type]) setSelectedTemplate({ type, ...templates[type] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ClipboardCheck /> أدوات التقييم الجاهزة</h1>
          <p className="text-sm text-gray-500 mt-1">PDM, KII, FGD, قوائم تحقق، مراقبة توزيعات، تحقق مواقع، رضا مستفيدين</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {templateList.map(t => (
          <div key={t.key} onClick={() => viewTemplate(t.key)} className="bg-white rounded-xl border p-5 hover:border-indigo-300 hover:shadow-md cursor-pointer transition">
            <div className="text-3xl mb-3">{TYPE_ICONS[t.key] || '📄'}</div>
            <h3 className="font-bold text-sm mb-1">{TYPE_LABELS[t.key] || t.key}</h3>
            <p className="text-xs text-gray-500">{t.description}</p>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">{TYPE_ICONS[selectedTemplate.type]} {selectedTemplate.name}</h2>
                <p className="text-sm text-gray-500">{selectedTemplate.description}</p>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {(selectedTemplate.sections || []).map((section, si) => (
              <div key={si} className="mb-6">
                <h3 className="font-bold text-sm mb-3 pb-2 border-b">{section.title}</h3>
                <div className="space-y-3">
                  {(section.questions || []).map((q, qi) => (
                    <div key={qi} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">{q.q || q.question || q.label || q.text}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>النوع: {q.type}</span>
                        {q.required && <span className="text-red-500">مطلوب</span>}
                      </div>
                      {q.options && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {q.options.map((opt, oi) => (
                            <span key={oi} className="bg-white px-2 py-1 rounded text-xs border">{opt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
