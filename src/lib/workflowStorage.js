'use client';

const DB_NAME = 'local-flow-db';
const DB_VERSION = 1;
const STORE_NAME = 'flows';

const ensureIndexedDB = () => {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this environment.');
  }
};

const openDatabase = () => {
  ensureIndexedDB();
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB.'));
    };
  });
};

const normalizeFlow = raw => {
  if (!raw) {
    return null;
  }
  return {
    id: raw.id,
    name: raw.name || 'Untitled flow',
    description: raw.description || '',
    nodes: Array.isArray(raw.nodes) ? raw.nodes : [],
    edges: Array.isArray(raw.edges) ? raw.edges : [],
    createdAt: raw.createdAt || raw.updatedAt || Date.now(),
    updatedAt: raw.updatedAt || raw.createdAt || Date.now(),
  };
};

export const getAllFlows = async () => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const items = (request.result || []).map(normalizeFlow);
      items.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(items);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to fetch flows.'));
    };
  });
};

export const getFlow = async id => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(Number(id));

    request.onsuccess = () => {
      resolve(normalizeFlow(request.result));
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to fetch flow.'));
    };
  });
};

export const createFlow = async data => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const timestamp = Date.now();
    const payload = {
      name: data?.name?.trim() || 'Untitled flow',
      description: data?.description?.trim() || '',
      nodes: Array.isArray(data?.nodes) ? data.nodes : [],
      edges: Array.isArray(data?.edges) ? data.edges : [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const request = store.add(payload);

    request.onsuccess = () => {
      resolve({ ...payload, id: request.result });
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to create flow.'));
    };
  });
};

export const updateFlow = async (id, data) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const identifier = Number(id);
    const getRequest = store.get(identifier);

    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (!existing) {
        reject(new Error('Flow not found.'));
        return;
      }
      const updated = {
        ...existing,
        name: data?.name?.trim() || existing.name,
        description: data?.description?.trim() ?? existing.description,
        nodes: Array.isArray(data?.nodes) ? data.nodes : existing.nodes,
        edges: Array.isArray(data?.edges) ? data.edges : existing.edges,
        updatedAt: Date.now(),
      };
      const putRequest = store.put(updated);

      putRequest.onsuccess = () => {
        resolve(normalizeFlow(updated));
      };

      putRequest.onerror = () => {
        reject(putRequest.error || new Error('Failed to update flow.'));
      };
    };

    getRequest.onerror = () => {
      reject(getRequest.error || new Error('Failed to fetch flow for update.'));
    };
  });
};

export const deleteFlow = async id => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(Number(id));

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to delete flow.'));
    };
  });
};
