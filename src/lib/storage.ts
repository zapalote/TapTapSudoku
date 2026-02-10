import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'taptap-sudoku' });

let setError: ((error: unknown) => void) | undefined;

function setErrorMethod(method: (error: unknown) => void) {
  setError = method;
}

function get<T = unknown>(key: string): T | null {
  try {
    const value = storage.getString(key);
    return value !== undefined ? JSON.parse(value) : null;
  } catch (error) {
    setError?.(error);
    return null;
  }
}

function set(key: string, value: unknown): void {
  try {
    storage.set(key, JSON.stringify(value));
  } catch (error) {
    setError?.(error);
  }
}

function remove(key: string): void {
  try {
    storage.delete(key);
  } catch (error) {
    setError?.(error);
  }
}

function clearAll(): void {
  try {
    storage.clearAll();
  } catch (error) {
    setError?.(error);
  }
}

const Store = {
  get,
  set,
  remove,
  clearAll,
  setErrorMethod,
};

export default Store;
