import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Database, CheckCircle, AlertCircle, CloudOff, Cloud } from 'lucide-react';
import api from '../services/api';

export default function OfflineMode() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [pendingForms, setPendingForms] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    api.get('/offline/sync-status').then(r => setSyncStatus(r.data)).catch(() => {});
    api.get('/offline/pending-forms').then(r => setPendingForms(r.data || [])).catch(() => {});

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const syncData = async () => {
    if (syncQueue.length === 0) return;
    setSyncing(true);
    try {
      const res = await api.post('/offline/sync', { submissions: syncQueue });
      if (res.data.synced > 0) setSyncQueue([]);
    } catch (e) { console.error(e); }
    setSyncing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><WifiOff size={28} /> وضع العمل بدون إنترنت</h1>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isOnline ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          {isOnline ? <Cloud size={18} /> : <CloudOff size={18} />}
          {isOnline ? 'متصل بالإنترنت' : 'غير متصل'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <Database size={32} className="mx-auto mb-2 text-blue-400" />
          <p className="text-3xl font-bold text-white">{pendingForms.length}</p>
          <p className="text-gray-400">نماذج متاحة</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <RefreshCw size={32} className="mx-auto mb-2 text-yellow-400" />
          <p className="text-3xl font-bold text-white">{syncQueue.length}</p>
          <p className="text-gray-400">في انتظار المزامنة</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          {isOnline ? <CheckCircle size={32} className="mx-auto mb-2 text-green-400" /> : <AlertCircle size={32} className="mx-auto mb-2 text-red-400" />}
          <p className="text-xl font-bold text-white">{isOnline ? 'جاهز للمزامنة' : 'تخزين محلي'}</p>
          <p className="text-gray-400">حالة الاتصال</p>
        </div>
      </div>

      {syncStatus && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">إعدادات Offline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-gray-400 text-sm">نوع التخزين</p>
              <p className="text-white font-medium">{syncStatus.storage_type}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-gray-400 text-sm">مدة الحفظ</p>
              <p className="text-white font-medium">{syncStatus.max_offline_days} يوم</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-gray-400 text-sm">فترة المزامنة</p>
              <p className="text-white font-medium">{syncStatus.sync_interval_minutes} دقيقة</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-gray-400 text-sm">مزامنة تلقائية</p>
              <p className="text-white font-medium">{syncStatus.features?.auto_sync_on_connect ? 'مفعلة' : 'معطلة'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">النماذج المتاحة للجمع الميداني</h2>
          {syncQueue.length > 0 && isOnline && (
            <button onClick={syncData} disabled={syncing}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-white">
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />{syncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
            </button>
          )}
        </div>
        {pendingForms.length === 0 ? (
          <p className="text-gray-400 text-center py-8">لا توجد نماذج منشورة. أنشئ نموذجاً في قسم جمع البيانات أولاً.</p>
        ) : (
          <div className="space-y-3">
            {pendingForms.map(f => (
              <div key={f.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{f.title}</h3>
                  <p className="text-gray-400 text-sm">{f.fields?.length || 0} حقل</p>
                </div>
                <span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-lg text-sm">متاح offline</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-6">
        <h3 className="text-blue-300 font-semibold mb-2">كيف يعمل وضع Offline؟</h3>
        <div className="text-gray-300 space-y-1 text-sm">
          <p>1. يتم تحميل النماذج والبيانات المرجعية عند الاتصال بالإنترنت</p>
          <p>2. يمكن جمع البيانات بدون إنترنت وتخزينها محلياً في IndexedDB</p>
          <p>3. عند عودة الاتصال، يتم مزامنة البيانات تلقائياً مع الخادم</p>
          <p>4. في حالة التعارض، يتم إعلامك لحل المشكلة يدوياً</p>
        </div>
      </div>
    </div>
  );
}
