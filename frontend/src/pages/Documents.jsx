import { useState, useEffect } from 'react';
import { 
  FolderArchive, FileText, Image as ImageIcon, 
  File, Search, Upload, Filter, 
  MoreVertical, Download, Trash2,
  FolderOpen, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';

const Documents = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const { data } = await api.get('/api/comms/documents');
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'الكل', icon: LayoutGrid },
    { id: 'contract', label: 'العقود', icon: Shield },
    { id: 'report', label: 'التقارير', icon: FileText },
    { id: 'photo', label: 'الصور الميدانية', icon: ImageIcon },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-100">
               <FolderArchive size={28} />
             </div>
             أرشيف الوثائق والملفات
          </h1>
          <p className="text-slate-500 font-bold mt-1">نظام إدارة المحتوى البرامجي، الصور الميدانية، والعقود الموقعة</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 px-6 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2">
            <Upload size={20} />
            رفع وثيقة جديدة
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
         {categories.map((cat) => (
           <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={cn(
              'px-6 h-12 rounded-2xl font-black text-xs transition-all whitespace-nowrap flex items-center gap-2 border',
              filter === cat.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'
            )}
           >
             {cat.label}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-3xl" />)
        ) : docs.length > 0 ? (
          docs.filter(d => filter === 'all' || d.category === filter).map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
               <div className="flex justify-between items-start mb-4">
                  <div className={cn('p-4 rounded-2xl', 
                    doc.file_type.includes('pdf') ? 'bg-rose-50 text-rose-600' : 
                    doc.file_type.includes('image') ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                  )}>
                     {doc.file_type.includes('pdf') ? <FileText size={24} /> : 
                      doc.file_type.includes('image') ? <ImageIcon size={24} /> : <File size={24} />}
                  </div>
                  <button className="text-slate-300 hover:text-slate-600 transition-colors"><MoreVertical size={18} /></button>
               </div>
               
               <h4 className="font-black text-slate-900 line-clamp-1">{doc.title}</h4>
               <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{doc.category} • {doc.file_type.split('/')[1]}</p>
               
               <div className="mt-6 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300 italic">{new Date(doc.created_at).toLocaleDateString()}</span>
                  <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    <Download size={16} />
                  </button>
               </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full p-20 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 text-center space-y-4">
             <div className="w-20 h-20 rounded-full bg-white mx-auto flex items-center justify-center text-slate-300 shadow-sm">
                <FolderOpen size={40} />
             </div>
             <div>
                <h4 className="text-xl font-black text-slate-500">الأرشيف فارغ</h4>
                <p className="text-sm font-bold text-slate-400 mt-2">لم يتم رفع أي وثائق لهذا التصنيف بعد.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
