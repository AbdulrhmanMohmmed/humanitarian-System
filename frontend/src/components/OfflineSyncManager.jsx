import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, WifiOff, CloudUpload, 
  CheckCircle2, RefreshCw, AlertCircle,
  Database, ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getSyncQueue, removeFromSyncQueue } from '../services/offlineDB';
import api from '../services/api';

export default function OfflineSyncManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [pendingItems, setPendingItems] = useState(0);

  const triggerSync = useCallback(async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    try {
      const queue = await getSyncQueue();
      if (queue.length === 0) {
        setPendingItems(0);
        return;
      }
      for (const item of queue) {
        try {
          await api({ method: item.method, url: item.endpoint, data: item.payload });
          await removeFromSyncQueue(item.id);
        } catch (e) {
          console.error("Sync failed for item", item, e);
        }
      }
      const newQueue = await getSyncQueue();
      setPendingItems(newQueue.length);
    } finally {
      setSyncing(false);
    }
  }, [isOnline, syncing]);

  useEffect(() => {
    const checkQueue = async () => {
      const queue = await getSyncQueue();
      setPendingItems(queue.length);
    };
    checkQueue();
    const interval = setInterval(checkQueue, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
       setIsOnline(true);
       triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  return (
    <div className="relative">
      <button 
        onClick={() => setShowStatus(!showStatus)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all",
          isOnline ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600 animate-pulse"
        )}
      >
        {isOnline ? (
           syncing ? <RefreshCw size={12} className="animate-spin" /> : <Wifi size={12} />
        ) : <WifiOff size={12} />}
        {isOnline ? (syncing ? "Syncing..." : "Online") : "Offline Mode"}
        {pendingItems > 0 && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />}
      </button>

      <AnimatePresence>
        {showStatus && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-4 w-72 card-elite p-6 shadow-2xl z-50 overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-6 opacity-5 -rotate-12"><Database size={80} /></div>
             
             <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                   <h4 className="font-black text-xs uppercase tracking-widest">حالة المزامنة</h4>
                   {isOnline && <ShieldCheck size={16} className="text-blue-600" />}
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black opacity-60">البيانات المعلقة</span>
                      <span className="text-xs font-black">{pendingItems} سجل</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black opacity-60">حالة الاتصال</span>
                      <span className={cn("text-xs font-black", isOnline ? "text-emerald-600" : "text-rose-600")}>
                         {isOnline ? "مستقر" : "غير متصل"}
                      </span>
                   </div>
                </div>

                <button 
                  onClick={triggerSync}
                  disabled={!isOnline || syncing}
                  className="w-full h-10 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                   {syncing ? "جاري المزامنة..." : "مزامنة الآن"}
                </button>
                
                {!isOnline && (
                   <div className="p-3 bg-rose-600/5 border border-rose-600/20 rounded-xl flex items-center gap-2">
                      <AlertCircle size={14} className="text-rose-600 shrink-0" />
                      <p className="text-[9px] font-bold text-rose-700">يتم تخزين البيانات محلياً وسيتم رفعها تلقائياً عند عودة الإنترنت.</p>
                   </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
