// localStorageManager.ts
// storageInterface.ts
export interface StorageInterface {
  set(key: string, value: any): void | Promise<void>;
  get(key: string): any | Promise<any>;
  remove(key: string): void | Promise<void>;
}



export class LocalStorageManager implements StorageInterface {
  protected prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  // 添加前缀到键名
  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.getPrefixedKey(key), serializedValue);
    } catch (error) {
      console.error('Failed to set item in localStorage', error);
    }
  }

  get(key: string): any {
    try {
      const serializedValue = localStorage.getItem(this.getPrefixedKey(key));
      return serializedValue ? JSON.parse(serializedValue) : null;
    } catch (error) {
      console.error('Failed to get item from localStorage', error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getPrefixedKey(key));
  }
}



export class IndexedDBManager implements StorageInterface {
  protected dbName: string;
  protected storeName: string;

  constructor(dbName: string = 'dbName', storeName: string = 'storeName') {
    this.dbName = dbName;
    this.storeName = storeName;

    this.initDB().then(r => {
      console.log("IndexDB 数据库加载成功")
    });
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = (event) => {
        reject(`IndexedDB error: ${event}`);
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  public async set(key: string, value: any): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.put({ key, value });
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  public async get(key: string): Promise<any> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  }

  public async remove(key: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.delete(key);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const indexdb = new IndexedDBManager("WapGameTools", "maps");
export const storage = new LocalStorageManager("WapMapEditor");