'use strict';
// model layer over AsyncStorage
import { AsyncStorage } from 'react-native';

async function get(key){
  try {
    const value = await AsyncStorage.getItem(key);
    return (value !== null)? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function set(key, value) {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

function remove(key) {
  return AsyncStorage.removeItem(key);
}

export default {
  get,
  set,
  remove,
};
