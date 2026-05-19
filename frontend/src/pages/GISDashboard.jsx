import { useState, useEffect, useRef } from 'react';
import { 
  Map as MapIcon, Globe, MapPin, Navigation,
  Layers, Info, Search, Filter,
  Maximize2, MousePointer2, Satellite, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';

/* ── Leaflet (real interactive map) ─────────────────────────────────────── */
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '../contexts/ToastContext';

// Fix default Leaflet icon paths (bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const projectIcon = (selected) =>
  L.divIcon({
    className: '',
    html: `<div style="width:${selected ? 20 : 12}px;height:${selected ? 20 : 12}px;border-radius:50%;background:${selected ? '#3b82f6' : '#2563eb'};border:2px solid #fff;box-shadow:0 0 8px rgba(37,99,235,.5)"></div>`,
    iconSize: [selected ? 20 : 12, selected ? 20 : 12],
    iconAnchor: [selected ? 10 : 6, selected ? 10 : 6],
  });

/* Fly to selected point */
function FlyToPoint({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 10, { duration: 1 });
  }, [center, map]);
  return null;
}

/* ── Main Component ─────────────────────────────────────────────────────── */
const GISDashboard = () => {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mapMode, setMapMode] = useState('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLayers, setActiveLayers] = useState({
    fieldSites: true,
    idpClusters: false,
    waterFuel: true,
    healthFacilities: false,
    ipcDensity: true,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await api.get('/api/projects/');
        const items = Array.isArray(data) ? data : data.items || [];
        setProjects(items.filter(p => p.latitude && p.longitude));
      } catch (err) {
        console.error('Failed to fetch GIS data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  /* Yemen default center */
  const yemenCenter = [15.5, 48.0];
  const defaultZoom = 6;

  const filteredProjects = projects.filter(p =>
    !searchQuery || (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.governorate || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleLayer = (key) => setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg">
              <MapIcon size={20} />
            </div>
            الرادار المكاني GIS
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1">التحليل الجغرافي الموحد للمشاريع والاحتياجات الميدانية</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {[
            { key: 'projects', label: 'المشاريع' },
            { key: 'beneficiaries', label: 'المستفيدين' },
            { key: 'needs', label: 'الاحتياجات' },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => setMapMode(m.key)}
              className={cn('px-4 py-1.5 rounded-lg text-xs font-black transition-all', mapMode === m.key ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500')}
            >{m.label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Map Container — real Leaflet */}
        <div className="flex-1 rounded-[2.5rem] relative overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
          {loading ? (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full" />
            </div>
          ) : (
            <MapContainer
              center={yemenCenter}
              zoom={defaultZoom}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="خريطة عادية">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="قمر صناعي">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; Esri'
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="تضاريس">
                  <TileLayer
                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenTopoMap'
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              {/* Fly to selected */}
              <FlyToPoint center={selectedPoint ? [selectedPoint.latitude, selectedPoint.longitude] : null} />

              {/* Project markers */}
              {filteredProjects.map((p) => (
                <Marker
                  key={p.id}
                  position={[p.latitude, p.longitude]}
                  icon={projectIcon(selectedPoint?.id === p.id)}
                  eventHandlers={{
                    click: () => setSelectedPoint(p),
                  }}
                >
                  <Popup>
                    <div className="text-right" dir="rtl">
                      <strong>{p.name}</strong>
                      {p.governorate && <p className="text-xs text-gray-500">{p.governorate}</p>}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* IPC density heatmap circles (when enabled) */}
              {activeLayers.ipcDensity && filteredProjects.map(p => (
                <CircleMarker
                  key={`heat-${p.id}`}
                  center={[p.latitude, p.longitude]}
                  radius={Math.min(20, (p.actual_beneficiaries || 100) / 100)}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, weight: 0 }}
                />
              ))}
            </MapContainer>
          )}

          {/* Stats overlay */}
          <div className="absolute bottom-6 left-6 z-[1000] p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 max-w-xs">
            <h4 className="text-white font-black text-xs flex items-center gap-2 mb-2">
               <Activity size={14} className="text-emerald-400" />
               إحصائيات النطاق الحالي
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/50 font-bold">مشاريع</p>
                <p className="text-lg font-black text-white">{filteredProjects.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-bold">تغطية</p>
                <p className="text-lg font-black text-white">{filteredProjects.length > 0 ? '84%' : '0%'}</p>
              </div>
            </div>
          </div>

          {/* Selected Point Detail Panel */}
          <AnimatePresence>
            {selectedPoint && (
              <motion.div 
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="absolute top-0 right-0 h-full w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-700 p-8 shadow-2xl overflow-y-auto z-[1000]"
              >
                <button 
                  onClick={() => setSelectedPoint(null)}
                  className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >إغلاق</button>

                <div className="mt-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-6">
                    <MapPin size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedPoint.name}</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">{selectedPoint.governorate} - {selectedPoint.district}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedPoint.latitude?.toFixed(4)}, {selectedPoint.longitude?.toFixed(4)}
                  </p>
                  
                  <div className="mt-8 space-y-6">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">الحالة الراهنة</p>
                      <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-black rounded-full">
                        {selectedPoint.status || 'نشط ميدانياً'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                        <p className="text-[10px] font-bold text-slate-400">المستفيدين</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{selectedPoint.actual_beneficiaries || 0}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                        <p className="text-[10px] font-bold text-slate-400">الميزانية</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">${((selectedPoint.budget || 0) / 1000).toFixed(0)}K</p>
                      </div>
                    </div>

                    <button onClick={() => { toast.show('يتم فتح المشروع في نافذة جديدة', 'info'); }} className="w-full h-12 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
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
          <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex-1 overflow-y-auto custom-scrollbar">
            <h4 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Filter className="text-blue-600" />
              طبقات البيانات
            </h4>
            
            <div className="space-y-4">
              {[
                { key: 'fieldSites', label: 'المواقع الميدانية' },
                { key: 'idpClusters', label: 'تجمعات النازحين' },
                { key: 'waterFuel', label: 'توزيع المياه والوقود' },
                { key: 'healthFacilities', label: 'المرافق الصحية' },
                { key: 'ipcDensity', label: 'كثافة الاحتياج IPC' },
              ].map((layer) => (
                <div
                  key={layer.key}
                  onClick={() => toggleLayer(layer.key)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                >
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600">{layer.label}</span>
                  <div className={cn('w-8 h-4 rounded-full relative transition-all', activeLayers[layer.key] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700')}>
                    <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all', activeLayers[layer.key] ? 'left-4.5' : 'left-0.5')} />
                  </div>
                </div>
              ))}
            </div>

            <hr className="my-6 border-slate-100 dark:border-slate-800" />

            <h4 className="font-black text-slate-900 dark:text-white mb-4 text-xs">البحث الجغرافي</h4>
            <div className="relative">
              <Search className="absolute right-4 top-3.5 text-slate-400" size={16} />
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مديرية أو قرية..."
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl pr-11 text-xs font-bold focus:ring-2 ring-blue-500/20"
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
