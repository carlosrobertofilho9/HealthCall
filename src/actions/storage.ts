/**
 * A utility object for interacting with localStorage.
 */
export const storage = {
  /**
   * Retrieves an item from localStorage and parses it as JSON.
   * @template T - The type of the value to retrieve.
   * @param {string} key - The key of the item to retrieve.
   * @returns {T | null} The retrieved item, or null if not found or if an error occurs.
   */
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  /**
   * Stores an item in localStorage after stringifying it.
   * @template T - The type of the value to store.
   * @param {string} key - The key under which to store the item.
   * @param {T} value - The value to store.
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // noop
    }
  },
};

export default storage;
