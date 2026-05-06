import { useState, useEffect } from 'react';
import { 
  Map as MapIcon, Globe, MapPin, Navigation,
  Layers, Info, Search, Filter,
  Maximize2, MousePointer2, Satellite, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';

const GISDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mapMode, setMapMode] = useState('projects'); // projects, beneficiaries, needs

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await api.get('/api/projects/');
        // Filter projects that have coordinates
        setProjects(data.filter(p => p.latitude && p.longitude));
      } catch (err) {
        console.error('Failed to fetch GIS data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Yemen bounding box (approximate for SVG scaling)
  // Lat: 12.1 to 19.0, Lng: 42.5 to 54.5
  const mapWidth = 800;
  const mapHeight = 500;
  
  const getX = (lng) => ((lng - 42.5) / (54.5 - 42.5)) * mapWidth;
  const getY = (lat) => mapHeight - ((lat - 12.1) / (19.0 - 12.1)) * mapHeight;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg">
              <MapIcon size={20} />
            </div>
            الرادار المكاني GIS
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">التحليل الجغرافي الموحد للمشاريع والاحتياجات الميدانية</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setMapMode('projects')}
            className={cn('px-4 py-1.5 rounded-lg text-xs font-black transition-all', mapMode === 'projects' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500')}
          >المشاريع</button>
          <button 
            onClick={() => setMapMode('beneficiaries')}
            className={cn('px-4 py-1.5 rounded-lg text-xs font-black transition-all', mapMode === 'beneficiaries' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500')}
          >المستفيدين</button>
          <button 
            onClick={() => setMapMode('needs')}
            className={cn('px-4 py-1.5 rounded-lg text-xs font-black transition-all', mapMode === 'needs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500')}
          >الاحتياجات</button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Map Container */}
        <div className="flex-1 bg-slate-900 rounded-[2.5rem] relative overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
          {/* Map Controls Overlay */}
          <div className="absolute top-6 right-6 flex flex-col gap-2 z-10">
            <button className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"><Maximize2 size={18} /></button>
            <button className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"><Satellite size={18} /></button>
            <button className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"><Layers size={18} /></button>
          </div>

          <div className="absolute bottom-6 left-6 z-10 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 max-w-xs">
            <h4 className="text-white font-black text-xs flex items-center gap-2 mb-2">
               <Activity size={14} className="text-emerald-400" />
               إحصائيات النطاق الحالي
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/50 font-bold">مشاريع</p>
                <p className="text-lg font-black text-white">{projects.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-bold">تغطية</p>
                <p className="text-lg font-black text-white">84%</p>
              </div>
            </div>
          </div>

          {/* Symbolic Yemen SVG Map */}
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <svg 
              viewBox={`0 0 ${mapWidth} ${mapHeight}`} 
              className="w-full h-full opacity-40 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]"
              style={{ filter: 'grayscale(0.5)' }}
            >
              {/* This is a simplified Yemen shape for visualization */}
              <path 
                d="M150,300 L200,280 L250,290 L300,270 L350,285 L450,260 L550,275 L650,250 L750,230 L780,250 L750,320 L650,350 L550,380 L450,420 L350,450 L250,430 L150,410 L100,380 Z" 
                fill="#1e293b" 
                stroke="#334155" 
                strokeWidth="2" 
              />
              
              {/* Render Points */}
              {projects.map((p) => (
                <g key={p.id}>
                  <motion.circle
                    initial={{ r: 0 }}
                    animate={{ r: selectedPoint?.id === p.id ? 12 : 6 }}
                    cx={getX(p.longitude || 45)}
                    cy={getY(p.latitude || 15)}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedPoint?.id === p.id ? "fill-blue-400" : "fill-blue-600 hover:fill-blue-400"
                    )}
                    onClick={() => setSelectedPoint(p)}
                  />
                  {selectedPoint?.id === p.id && (
                    <motion.circle
                      initial={{ r: 6 }}
                      animate={{ r: 30, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      cx={getX(p.longitude || 45)}
                      cy={getY(p.latitude || 15)}
                      className="fill-blue-400/20"
                    />
                  )}
                </g>
              ))}
            </svg>
          </div>

          <AnimatePresence>
            {selectedPoint && (
              <motion.div 
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="absolute top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-xl border-l border-slate-200 p-8 shadow-2xl overflow-y-auto"
              >
                <button 
                  onClick={() => setSelectedPoint(null)}
                  className="absolute top-6 left-6 text-slate-400 hover:text-slate-600"
                >إغلاق</button>

                <div className="mt-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                    <MapPin size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{selectedPoint.name}</h3>
                  <p className="text-sm font-bold text-slate-500 mt-2">{selectedPoint.governorate} - {selectedPoint.district}</p>
                  
                  <div className="mt-8 space-y-6">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">الحالة الراهنة</p>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full">نشط ميدانياً</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50">
                        <p className="text-[10px] font-bold text-slate-400">المستفيدين</p>
                        <p className="text-lg font-black text-slate-900">{selectedPoint.actual_beneficiaries}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50">
                        <p className="text-[10px] font-bold text-slate-400">الميزانية</p>
                        <p className="text-lg font-black text-slate-900">${selectedPoint.budget / 1000}K</p>
                      </div>
                    </div>

                    <button className="w-full h-12 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                      <Navigation size={18} />
                      فتح في نافذة المشروع
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar: Map Filters & Layers */}
        <div className="w-80 flex flex-col gap-6">
          <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex-1 overflow-y-auto custom-scrollbar">
            <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">
              <Filter className="text-blue-600" />
              طبقات البيانات
            </h4>
            
            <div className="space-y-4">
              {[
                { label: 'المواقع الميدانية', active: true },
                { label: 'تجمعات النازحين', active: false },
                { label: 'توزيع المياه والوقود', active: true },
                { label: 'المرافق الصحية', active: false },
                { label: 'كثافة الاحتياج IPC', active: true },
              ].map((layer) => (
                <div key={layer.label} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
                  <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">{layer.label}</span>
                  <div className={cn('w-8 h-4 rounded-full relative transition-all', layer.active ? 'bg-blue-600' : 'bg-slate-200')}>
                    <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all', layer.active ? 'left-4.5' : 'left-0.5')} />
                  </div>
                </div>
              ))}
            </div>

            <hr className="my-6 border-slate-100" />

            <h4 className="font-black text-slate-900 mb-4 text-xs">البحث الجغرافي</h4>
            <div className="relative">
              <Search className="absolute right-4 top-3.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="ابحث عن مديرية أو قرية..."
                className="w-full h-11 bg-slate-50 border-none rounded-xl pr-11 text-xs font-bold focus:ring-2 ring-blue-500/20"
              />
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-white/10 rounded-xl">
                 <MousePointer2 size={20} />
               </div>
               <p className="text-xs font-black">تحليل النقاط الساخنة</p>
             </div>
             <p className="text-[11px] font-bold text-white/80 leading-relaxed">
               استخدم أدوات التحديد لتحليل كثافة المستفيدين في نطاق جغرافي محدد وإصدار تقرير فوري.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GISDashboard;
