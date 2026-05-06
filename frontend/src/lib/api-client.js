/**
 * HIAOS API Client & Persistence Layer
 * This service handles data storage locally (LocalStorage/IndexedDB) 
 * and simulates network interaction for the backend integration.
 */

const STORAGE_PREFIX = 'hiaos_data_';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const apiClient = {
  // Generic CRUD
  async get(resource) {
    console.log(`[API] Fetching ${resource}...`);
    await sleep(400); // Simulate network lag
    const data = localStorage.getItem(`${STORAGE_PREFIX}${resource}`);
    return data ? JSON.parse(data) : [];
  },

  async post(resource, payload) {
    console.log(`[API] Saving to ${resource}...`, payload);
    await sleep(600);
    const existing = await this.get(resource);
    const newItem = { 
      ...payload, 
      id: Date.now(), 
      createdAt: new Date().toISOString(),
      syncStatus: 'pending' 
    };
    const updated = [newItem, ...existing];
    localStorage.setItem(`${STORAGE_PREFIX}${resource}`, JSON.stringify(updated));
    return newItem;
  },

  async update(resource, id, payload) {
    await sleep(500);
    const existing = await this.get(resource);
    const updated = existing.map(item => item.id === id ? { ...item, ...payload } : item);
    localStorage.setItem(`${STORAGE_PREFIX}${resource}`, JSON.stringify(updated));
    return true;
  },

  // Specific Module Helpers
  async getProjects() { return await this.get('projects'); },
  async saveProject(project) { return await this.post('projects', project); },
  
  async getOutcomes() { return await this.get('outcomes'); },
  async saveOutcome(outcome) { return await this.post('outcomes', outcome); },

  async getDQA() { return await this.get('dqa_audits'); },
  async saveDQA(audit) { return await this.post('dqa_audits', audit); },

  // Sync Status
  async getPendingSyncCount() {
    const allResources = ['projects', 'outcomes', 'dqa_audits', 'cfm', 'lessons'];
    let count = 0;
    for (const res of allResources) {
      const items = await this.get(res);
      count += items.filter(i => i.syncStatus === 'pending').length;
    }
    return count;
  },

  async syncPendingData() {
    console.log('[API] Syncing all pending data to server...');
    await sleep(2000);
    const allResources = ['projects', 'outcomes', 'dqa_audits', 'cfm', 'lessons'];
    for (const res of allResources) {
      const items = await this.get(res);
      const updated = items.map(i => ({ ...i, syncStatus: 'synced' }));
      localStorage.setItem(`${STORAGE_PREFIX}${res}`, JSON.stringify(updated));
    }
    return true;
  }
};

