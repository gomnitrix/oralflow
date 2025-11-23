export interface StorageAdapter {
  readCollection<T>(collection: string): Promise<T[]>;
  writeCollection<T>(collection: string, records: T[]): Promise<void>;
}

export class InMemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, unknown[]>();

  async readCollection<T>(collection: string): Promise<T[]> {
    const records = this.store.get(collection) ?? [];
    return structuredClone(records) as T[];
  }

  async writeCollection<T>(collection: string, records: T[]): Promise<void> {
    this.store.set(collection, structuredClone(records));
  }
}
