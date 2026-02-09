import AsyncStorage from '@react-native-async-storage/async-storage';

let setError: ((error: unknown) => void) | undefined;

function setErrorMethod(method: (error: unknown) => void) {
  setError = method;
}

async function get<T = unknown>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return (value !== null) ? JSON.parse(value) : null;
  } catch (error) {
    setError?.(error);
    return null;
  }
}

async function set(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    setError?.(error);
  }
}

async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    setError?.(error);
  }
}

async function clearAll(): Promise<void> {
  try {
    await AsyncStorage.clear();
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
