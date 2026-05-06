// CalendarPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import CalendarView from '../components/CalendarView';

export default function CalendarPage() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    api.get('/activities/').then(r => {
      // Mock dates for visualization if empty
      const data = r.data.map(a => ({
        ...a,
        date: a.start_date || new Date().toISOString(),
        title: a.name,
        type: 'activity'
      }));
      setActivities(data);
    });
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-[var(--text-primary)]">التقويم المؤسسي</h1>
        <p className="text-[var(--text-secondary)] font-medium mt-2">تتبع المواعيد النهائية والزيارات الميدانية.</p>
      </header>
      
      <CalendarView events={activities} />
    </div>
  );
}
