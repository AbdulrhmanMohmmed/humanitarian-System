export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('hiaos_offline_db', 1);
        request.onerror = (e) => reject(e);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            // Store for offline mutation requests
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
            }
            // Store for caching GET requests
            if (!db.objectStoreNames.contains('cache')) {
                db.createObjectStore('cache', { keyPath: 'key' });
            }
        };
    });
};

export const addToSyncQueue = async (endpoint, method, payload) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('syncQueue', 'readwrite');
        const store = tx.objectStore('syncQueue');
        const item = { endpoint, method, payload, timestamp: new Date().getTime() };
        const req = store.add(item);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(false);
    });
};

export const getSyncQueue = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('syncQueue', 'readonly');
        const store = tx.objectStore('syncQueue');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject([]);
    });
};

export const removeFromSyncQueue = async (id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('syncQueue', 'readwrite');
        const store = tx.objectStore('syncQueue');
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(false);
    });
};
