'use strict';

import React, { Component } from 'react';

import {
  LayoutAnimation, StyleSheet, AppState, Platform, Linking, Share, Vibration, Modal, Image,
  Alert, View, Text, Dimensions, StatusBar,
} from 'react-native';

import {
  Size, CellSize, BoardWidth, BorderWidth, Board, Timer, Touchable, NumberPad, Circular, BadMove,
} from '../components';
import { Store, sudoku, isNumber, I18n, } from '../utils';

class Main extends Component {
  state = {
    appState: AppState.currentState,
    game: null,
    playing: false,
    showModal: false,
    showHelp: false,
    showAbout: false,
    updateboard: true,
    topMargin: 18,
  }
  difficulty = 0;
  elapsed = null;
  error = 0;
  records = [];
  updatepad= false;
  pad = new Array(9).fill(0);
  fromStore = false;
  TEST = false;

  componentWillMount(){
    StatusBar.setHidden(true);
  }

  handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      this.loadBoardFromStore();
    }
    if (nextAppState === 'active'){
      this.setState({
        showModal: true,
      });
    } else {
      this.elapsed = this.timer.pause();
      Store.set('elapsed', this.elapsed);
    }

    this.setState({appState: nextAppState});
  }

  shouldComponentUpdate(nextProps, nextState){
    return this.state != nextState;
  }

  async componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);

    this.records = await Store.get('records') || [];
    this.setState({
      showModal: true,
    });
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  async loadBoardFromStore(){
    this.pad.fill(0);
    let game = await Store.get('board');
    if(!game || game.length == 0) {
      game = newGrid();
    } else this.fromStore = true;

    let elapsed = await Store.get('elapsed') || 0;
    this.timer.setElapsed(elapsed);
    this.error = await Store.get('error') || 0;
    this.setState({
      game,
      updateboard: true,
      showModal: true,
      showHelp: false,
      showAbout: false,
    }, () => {
      this.setPad();
      this.bad.reset(this.error);
    });
  }

  setPad(){
    const { game } = this.state;
    if(!game) return;
    this.pad.fill(0);
    game.forEach( (cell, idx) => {
      if(cell && isNumber(cell.n))
        this.pad[cell.n]++;
    });
    this.updatepad = true;
  }

  onInit = () => {
    this.setState({
      playing: true,
      updateboard: false,
      showModal: false,
      showHelp: false,
    }, () => {
      if(this.fromStore){
        this.fromStore = false;
        this.timer.resume();
      } else {
        this.timer.start();
        this.error = 0;
        this.bad.reset();
      }
      this.updatepad = false;
    });
  }

  onErrorMove = () => {
    Vibration.vibrate();
    this.bad.onBadMove();
    this.error++;
    Store.set('error', this.error);
  }

  onFinish = () => {
     this.elapsed = null;
     const eta = this.timer.stop();
     this.setState({
       playing: false,
     });
     Store.remove('board');

     // check if this is a record eta (don't bother for uniqueness)
     this.records.push(eta);
     this.records.sort((a, b) => a - b);
     this.records = this.records.slice(0, 5);
     Store.set('records', this.records);

     const formatTime = Timer.formatTime;
     const newRecord = eta == this.records[0];
     const msg = (newRecord ? I18n.t('newrecord') : I18n.t('success')) + formatTime(eta);
     setTimeout(() => {
       Alert.alert(I18n.t('congrats'), msg, [
         { text: I18n.t('ok') },
         { text: I18n.t('newgame'), onPress: this.onCreate },
       ]);
     }, 1000);
  }

  onResume = () => {
    this.setState({
      showModal: false,
    }, () => {
      this.updatepad = false;
      this.timer.resume();
    });
  }

  onRestart = () => {
    this.elapsed = null;
    this.timer.reset();
    let game = [];
    this.state.game.forEach( (cell, idx) => {
      if(cell && cell.type == 'F') game[idx] = this.state.game[idx];
    });
    this.setState({
      game,
      updateboard: true,
      playing: false,
      showModal: false,
    }, () => {
      this.error = 0;
      this.bad.reset();
      this.setPad();
    });
    Store.set('board', game);
  }

  newGrid = () => {
    let puzzle = [];
    let d = 0;
    do {
      puzzle = sudoku.makepuzzle();
      d = sudoku.ratepuzzle(puzzle, 4);
    } while(d > 3 && this.TEST);
    this.difficulty = d;

    let game = [];
    for (let i = 0; i < 81; i++) {
      let number = puzzle[i];
      if(isNumber(number))
        game[i] = { idx: i, type: 'F', n: number };
    }
    Store.set('board', game);
    return game;
  }

  onCreate = () => {
    this.elapsed = null;
    this.timer.reset();
    let game = this.newGrid();
    this.setState({
      game,
      updateboard: true,
      playing: false,
      showModal: false,
    }, () => {
      this.error = 0;
      this.bad.reset();
      this.setPad();
    });
  }

  onShowModal = () => {
    this.elapsed = this.timer.pause();
    Store.set('elapsed', this.elapsed);
    this.setState({
      showModal: true,
    });
  }

  onCloseModal = () => {
    this.timer.resume();
    this.setState({
      showModal: false,
    });
  }

  onShowHelp = () => {
    this.elapsed = this.timer.pause();
    Store.set('elapsed', this.elapsed);
    this.setState({
      showHelp: true,
    });
  }

  onCloseHelp = () => {
    this.timer.resume();
    this.setState({
      showHelp: false,
    });
  }

  onRate = () => {
    const link = Platform.OS == 'android' ?
      'https://play.google.com/store/apps/details?id=com.zapalote.taptapsudoku' :
      'itms-apps://itunes.apple.com/us/app/taptapsudoku/id1320628951?mt=8';
    Alert.alert(I18n.t('rate'), I18n.t('ratemessage'), [
      { text: I18n.t('notnow') },
      { text: I18n.t('appstore'), onPress: () => Linking.openURL(link) },
    ]);
  }

  showInfo = () => {
    const formatTime = Timer.formatTime;
    const level = '•'.repeat(this.difficulty+1);
    const record = (this.records[0])? I18n.t('record')+formatTime(this.records[0]) : ' ';
    const msg = `
      ${I18n.t('difficulty') + level}
      ${record}`;

    setTimeout(() => {
      Alert.alert(I18n.t('Info'), msg, [
        { text: I18n.t('ok') }, {},
      ]);
    }, 300);
  }

  onAbout = () => {
    this.setState({
      showAbout: true,
    });
  }

  onCloseAbout = () => {
    this.setState({
      showAbout: false,
    });
  }

  getTopMargin = () => {
    return ({ marginTop: this.state.topMargin });
  }

  onLayoutEvent = (event) => {
    if(!this) return;
    const {width,height} = event.nativeEvent.layout;
    const T = (height < width)? 6 : 18;
    this.setState({
      topMargin: T,
    });
  }

  render() {
    const { game, playing, showModal, showHelp, showAbout, updateboard } = this.state;
    const disabled = !playing;

    return (
      <View style={[styles.container, this.getTopMargin()]} onLayout={this.onLayoutEvent} >
          <Board game={game} ref={ref => this.board = ref} reset={updateboard}
            onInit={this.onInit} onErrorMove={this.onErrorMove} onFinish={this.onFinish} />

          <View style={styles.box}>
            <View style={styles.menuBox}>
              <Timer ref={ref => this.timer = ref} style={styles.timer} />
              <Touchable onPress={this.showInfo} >
                <View style={styles.info}>
                  <BadMove style={styles.level} ref={ref => this.bad = ref}  />
                </View>
              </Touchable>
              <View style={styles.buttonBox} >
                <Touchable onPress={this.onShowHelp} >
                  <Image style={styles.menuIcon} source={require('../images/help.png')} />
                </Touchable>
                <Touchable onPress={this.onShowModal} >
                  <Image style={styles.menuIcon} source={require('../images/menu.png')} />
                </Touchable>
              </View>
            </View>
            <NumberPad board={this.board} pad={this.pad} reset={this.updatepad} />
          </View>

        <Modal animationType='fade' visible={showHelp} transparent={true} onRequestClose={this.onCloseHelp} >
          <View style={styles.modal} >
            <View style={[styles.modalContainer]} >
              <Image style={styles.help} source={require('../images/helpText.png')} />
            </View>
            <View style={styles.footer}>
              <Touchable style={styles.button} onPress={this.onCloseHelp} >
                <Image style={styles.buttonIcon} source={require('../images/close.png')} />
              </Touchable>
            </View>
          </View>
        </Modal>

        <Modal animationType='fade' visible={showModal} transparent={true} onRequestClose={this.onCloseModal} >
          <View style={styles.modal} >
            <View style={styles.modalContainer} >
              <Image style={styles.logo} source={require('../images/tap-tap-sudoku.png')} />
              <Touchable disabled={disabled} style={styles.button} onPress={this.onResume} >
                <Image style={[styles.buttonMenu, disabled && styles.disabled]} source={require('../images/continue.png')} />
              </Touchable>
              <Touchable disabled={disabled} style={styles.button} onPress={this.onRestart} >
                <Image style={[styles.buttonMenu, disabled && styles.disabled]} source={require('../images/restart.png')} />
              </Touchable>
              <Touchable style={styles.button} onPress={this.onCreate} >
                <Image style={styles.buttonMenu} source={require('../images/newgame.png')} />
              </Touchable>
            </View>
            <View style={styles.footer} >
              <Touchable style={styles.button} onPress={this.onAbout} >
                <Image style={styles.buttonIcon} source={require('../images/about.png')} />
              </Touchable>
              <Touchable style={styles.button} onPress={this.onRate} >
                <Image style={styles.buttonIcon} source={require('../images/rate.png')} />
              </Touchable>
            </View>
          </View>

          <Modal animationType='fade' visible={showAbout} transparent={true} onRequestClose={this.onCloseAbout} >
            <View style={styles.modal} >
              <View style={[styles.modalContainer]} >
                <Image style={styles.help} source={require('../images/aboutText.png')} />
              </View>
              <View style={styles.footer}>
                <Touchable style={styles.button} onPress={this.onCloseAbout} >
                  <Image style={styles.buttonIcon} source={require('../images/close.png')} />
                </Touchable>
              </View>
            </View>
          </Modal>

        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop:18,
    flexDirection:'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
  },
  box:{
    marginTop: CellSize * 0.6,
    marginLeft: BorderWidth * 4,
    marginRight: BorderWidth * 4,
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  menuBox:{
    //width: CellSize * 4
  },
  buttonBox:{
    marginTop: CellSize * 0.3,
    width: CellSize * 2.3,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  menuIcon: {
    width: CellSize,
    height: CellSize,
  },
  bad: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '100',
    fontFamily: 'Menlo',
  },
  timer: {
    fontSize: CellSize * 3 / 4,
    alignSelf: 'flex-start',
    color: '#6b6b6b',
  },
  info:{
   flexDirection:'row',
   backgroundColor: '#f2f2f2',
   justifyContent:'space-between',
   padding: 2,
  },
  level: {
    marginLeft: BorderWidth * 2,
    color: '#6b6b6b',
    alignItems:'flex-start',
    fontSize: CellSize * 3 / 8,
    fontWeight: '100',
    fontFamily: 'Menlo',
  },
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  help: {
    marginTop: CellSize,
    width: CellSize * 7,
    height: BoardWidth * 1.2,
  },
  footer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  button: {
    padding: Size.height > 500 ? 10 : 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: CellSize * 6.5,
    height: CellSize * 6.5,
    marginBottom: CellSize * 0.5,
    padding: Size.height > 500 ? 30 : 15,
  },
  buttonIcon: {
    width: CellSize,
    height: CellSize,
  },
  buttonMenu: {
    width: CellSize * 6,
    height: 50,
  },
  buttonText: {
    marginLeft: CellSize / 2,
    color: '#000',
    fontSize: CellSize * 3 / 4,
    fontFamily: 'Menlo',
    fontWeight: 'bold',
  },
  highlightText: {
    color: '#333',
  },
});

export default Main;
