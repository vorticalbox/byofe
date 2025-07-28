export class PathStore<T> {
  #kv: Deno.Kv;
  #collection: string;
  #centralStore: string = "_store";
  #index: (keyof T)[];

  constructor(kv: Deno.Kv, collection: string, index: (keyof T)[]) {
    this.#kv = kv;
    this.#collection = collection;
    this.#index = index || [];
  }

  setIndex(index: (keyof T)[]): void {
    this.#index = index;
  }

  setCentralStore(key: string): void {
    this.#centralStore = key;
  }
  async read(key: string): Promise<T | null> {
    const result = await this.#kv.get<string>([this.#collection, key]);
    if (result.value) {
      const data = await this.#kv.get<T>([this.#centralStore, result.value]);
      return data.value || null;
    }
    return null;
  }

  async update(key: string, data: Partial<T>): Promise<T | null> {
    const storeKey = await this.#kv.get<string>([this.#collection, key]);
    if (storeKey.value) {
      const currentData = await this.#kv.get<T>([
        this.#centralStore,
        storeKey.value,
      ]);
      if (currentData.value) {
        const updatedData = { ...currentData.value, ...data };
        await this.#kv.set([this.#centralStore, storeKey.value], updatedData);
        return updatedData;
      }
    }
    return null;
  }

  async watch(key: string) {
    const storeKey = await this.#kv.get<string>([this.#collection, key]);
    if (storeKey.value) {
      return this.#kv.watch<T[]>([[this.#centralStore, storeKey.value]]);
    }
    throw Error(`${key} not foundÏ`);
  }

  async create(data: T): Promise<string> {
    const key = crypto.randomUUID();
    const transaction = this.#kv.atomic();
    transaction.set([this.#centralStore, key], data);
    for await (const indexKey of this.#index) {
      const indexValue = data[indexKey];
      if (indexValue) {
        transaction.set([this.#collection, String(indexValue)], key);
      }
    }
    await transaction.commit();
    return key;
  }
  async delete(keys: string[]): Promise<void> {
    const transactions = this.#kv.atomic();
    for (const key of keys) {
      const storeKey = await this.#kv.get<string>([this.#collection, key]);
      if (storeKey.value) {
        transactions.delete([this.#centralStore, storeKey.value]);
      }
    }
    await transactions.commit();
  }
}
export default PathStore;
