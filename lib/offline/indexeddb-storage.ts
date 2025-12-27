/**
 * IndexedDB Storage Adapter para Zustand Persist
 * 
 * Substitui localStorage para dados grandes
 * Evita bloqueio da thread principal
 * Suporta dados maiores que 5MB
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ============================================
// TIPOS
// ============================================

interface ZustandStorageDB extends DBSchema {
  store: {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: number;
    };
    indexes: { 'by-updated': number };
  };
}

// ============================================
// STORAGE ADAPTER
// ============================================

let dbInstance: IDBPDatabase<ZustandStorageDB> | null = null;

async function getDB(): Promise<IDBPDatabase<ZustandStorageDB>> {
  // Verificar se está no navegador antes de usar IndexedDB
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available (server-side rendering)');
  }

  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<ZustandStorageDB>('zustand-storage', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('store')) {
        const store = db.createObjectStore('store', { keyPath: 'key' });
        store.createIndex('updated', 'updatedAt', { unique: false });
      }
    },
  });

  return dbInstance;
}

/**
 * Storage adapter para Zustand usando IndexedDB
 * 
 * Uso:
 * persist(store, {
 *   name: 'student-unified-storage',
 *   storage: createIndexedDBStorage(),
 * })
 * 
 * Retorna um storage noop (sem operação) quando executado no servidor (SSR)
 */
export function createIndexedDBStorage() {
  // Se estiver no servidor, retornar um storage noop (sem operação)
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return {
      getItem: async (): Promise<string | null> => {
        return null;
      },
      setItem: async (): Promise<void> => {
        // Noop no servidor
      },
      removeItem: async (): Promise<void> => {
        // Noop no servidor
      },
    };
  }

  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const db = await getDB();
        const store = db.transaction('store', 'readonly').objectStore('store');
        const item = await store.get(name);
        
        if (!item) {
          return null;
        }
        
        // Se value já for string, retorna diretamente
        // Caso contrário, faz stringify
        if (typeof item.value === 'string') {
          return item.value;
        }
        
        return JSON.stringify(item.value);
      } catch (error) {
        console.error('[IndexedDB Storage] Erro ao ler:', error);
        // Fallback para localStorage se IndexedDB falhar
        if (typeof window !== 'undefined') {
          return localStorage.getItem(name);
        }
        return null;
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const db = await getDB();
        const store = db.transaction('store', 'readwrite').objectStore('store');
        
        // Parse value apenas se for string, caso contrário usa diretamente
        let parsedValue: any;
        try {
          // Tenta fazer parse se for string
          if (typeof value === 'string') {
            parsedValue = JSON.parse(value);
          } else {
            // Se já for objeto, usa diretamente
            parsedValue = value;
          }
        } catch (parseError) {
          // Se falhar o parse, tenta usar como string direto
          console.warn('[IndexedDB Storage] Erro ao fazer parse, usando valor como string:', parseError);
          parsedValue = value;
        }
        
        await store.put({
          key: name,
          value: parsedValue,
          updatedAt: Date.now(),
        });
      } catch (error) {
        console.error('[IndexedDB Storage] Erro ao escrever:', error);
        // Fallback para localStorage se IndexedDB falhar
        if (typeof window !== 'undefined') {
          // localStorage sempre espera string
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(name, stringValue);
        }
      }
    },

    removeItem: async (name: string): Promise<void> => {
      try {
        const db = await getDB();
        const store = db.transaction('store', 'readwrite').objectStore('store');
        await store.delete(name);
      } catch (error) {
        console.error('[IndexedDB Storage] Erro ao remover:', error);
        // Fallback para localStorage se IndexedDB falhar
        if (typeof window !== 'undefined') {
          localStorage.removeItem(name);
        }
      }
    },
  };
}

/**
 * Migra dados do localStorage para IndexedDB
 */
export async function migrateFromLocalStorage(
  storageKey: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Verifica se já existe no IndexedDB
    const db = await getDB();
    const store = db.transaction('store', 'readonly').objectStore('store');
    const existing = await store.get(storageKey);

    if (existing) {
      // Já migrado
      return;
    }

    // Tenta migrar do localStorage
    const localStorageData = localStorage.getItem(storageKey);
    if (localStorageData) {
      const writeStore = db.transaction('store', 'readwrite').objectStore('store');
      await writeStore.put({
        key: storageKey,
        value: JSON.parse(localStorageData),
        updatedAt: Date.now(),
      });

      console.log(`[IndexedDB Storage] ✅ Migrado ${storageKey} do localStorage`);
    }
  } catch (error) {
    console.error('[IndexedDB Storage] Erro na migração:', error);
  }
}

