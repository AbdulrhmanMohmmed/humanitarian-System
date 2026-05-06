const DB_NAME = 'HIAOS_Offline_DB';
const DB_VERSION = 1;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('beneficiaries')) {
        db.createObjectStore('beneficiaries', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const saveBeneficiaries = async (beneficiaries) => {
  const db = await initDB();
  const tx = db.transaction('beneficiaries', 'readwrite');
  const store = tx.objectStore('beneficiaries');
  beneficiaries.forEach(b => store.put(b));
  return tx.complete;
};

export const getAllBeneficiaries = async () => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction('beneficiaries', 'readonly');
    const store = tx.objectStore('beneficiaries');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
};
