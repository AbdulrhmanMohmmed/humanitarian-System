// KanbanPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import KanbanBoard from '../components/KanbanBoard';
import { LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function KanbanPage() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects/').then(r => setData(r.data));
  }, []);

  const columns = [
    { id: 'planned', title: 'مخطط', color: 'bg-blue-500' },
    { id: 'active', title: 'قيد التنفيذ', color: 'bg-emerald-500' },
    { id: 'completed', title: 'مكتمل', color: 'bg-slate-500' },
    { id: 'on_hold', title: 'متوقف', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">إدارة المشاريع (Kanban)</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">نظرة عامة مرنة على سير العمل.</p>
        </div>
        <button onClick={() => navigate('/projects')} className="flex items-center gap-2 px-5 py-2.5 bg-black/5 rounded-xl font-black text-xs">
           <List size={16} /> عرض الجدول
        </button>
      </header>
      
      <KanbanBoard columns={columns} items={data} />
    </div>
  );
}
