'use strict';
// model layer over AsyncStorage
import { AsyncStorage } from 'react-native';

function get(key) {
  return AsyncStorage.getItem(key).then(value => JSON.parse(value));
}

function set(key, value) {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

function setFixed(key, value) {
  let obj = {
    idx: key,
    type: 'F',
    n: value
  };
  return AsyncStorage.setItem(key+'', JSON.stringify(obj));
}

function setNumber(key, value) {
  let obj = {
    idx: key,
    type: 'N',
    n: value
  };
  return AsyncStorage.setItem(key+'', JSON.stringify(obj));
}

function setHint(key, value) {
  let obj = {
    idx: key,
    type: 'H',
    h: JSON.stringify(value)
  };
  return AsyncStorage.setItem(key+'', JSON.stringify(obj));
}

function remove(key) {
  return AsyncStorage.removeItem(key);
}

async function removeBoard(){
  for (let key = 0; key < 81; key++) {
    await AsyncStorage.removeItem(key+'');
  }
  AsyncStorage.removeItem('elapsed');
  AsyncStorage.removeItem('error');
}

async function getBoardCells() {
  let board = [];
  for (let i = 0; i < 81; i++) {
    let obj = await AsyncStorage.getItem(i+'');
    board[i] = (obj == undefined)? { idx: i, type:'?', n: '' } : JSON.parse(obj);
  }
  return board;
}

function multiGet(...keys) {
  return AsyncStorage.multiGet([...keys]).then((stores) => {
    let data = {};
    stores.map((result, i, store) => {
      data[store[i][0]] = JSON.parse(store[i][1]);
    });
    return data;
  });
}

function multiRemove(...keys) {
  return AsyncStorage.multiRemove([...keys]);
}

export default {
  get,
  set,
  setFixed,
  setNumber,
  setHint,
  remove,
  removeBoard,
  getBoardCells,
  multiGet,
  multiRemove,
};
