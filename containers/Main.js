'use strict';

import React, { Component } from 'react';

import {
  LayoutAnimation, StyleSheet, AppState, Platform, Linking, Share, Vibration, Modal, Image,
  Alert, View, Text, Dimensions,
} from 'react-native';

import {
  Size, CellSize, BoardWidth, BorderWidth, Board, Timer, Touchable, NumberPad, Circular,
} from '../components';
import { Store, sudoku, isNumber, I18n, } from '../utils';

function formatLevel(level) {
  let picto = '•';
  for(let i=0; i < level; i++){ picto += '•'; }
  return picto;
}

function formatBad(errors) {
  if(errors == 0 || errors > 4)
    return errors.toString();
  let picto = "";
  for(let i=0; i < errors; i++){ picto += '✕'; }
  return picto;
}

class Main extends Component {
  state = {
    appState: AppState.currentState,
    puzzle: null,
    playing: false,
    initing: false,
    showModal: false,
    showHelp: false,
    showAbout: false,
    error: 0,
    topMargin: 18,
  }
  puzzle = null
  solve = null
  difficulty = -1
  elapsed = null
  fromStore = false
  records = []
  pad = new Array(9).fill(0);

  handleAppStateChange = (nextAppState) => {
    if (nextAppState.match(/background|inactive/)) {
      this.saveToStore();
    } else if (nextAppState === 'active') {
      this.onShowModal();
    }
  }

  shouldComponentUpdate(nextProps, nextState){
    return this.state != nextState;
  }

  async componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);

    this.records = await Store.get('records') || [];
    const puzzle = await Store.get('puzzle');
    let badmoves = 0;
    if (puzzle) {
      this.puzzle = puzzle.slice();
      this.fromStore = true;
      this.solve = await Store.get('solve');
      this.resetPad( (this.solve)? this.solve : this.puzzle );
      this.elapsed = await Store.get('elapsed');
      badmoves = await Store.get('error') || 0;
    } else {
      //this.puzzle = sudoku.makepuzzle();
      this.puzzle = this.newPuzzle();
    }
    this.setState({
      showModal: true,
      error: badmoves,
    });
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  resetPad(puzzle){
    this.pad.fill(0);
    for (let i = 0; i < 81; i++) {
      if(isNumber(puzzle[i])) this.pad[puzzle[i]]++;
    }
  }

  newPuzzle = () => {
    const puzzle, d;
    do {
      puzzle = sudoku.makepuzzle();
      d = sudoku.ratepuzzle(puzzle, 4);
    } while(d > 3);
    return puzzle;
  }
  saveToStore = () => {
    if (this.state.initing) return;
    if (this.puzzle) Store.set('puzzle', this.puzzle);
    if (this.solve) Store.set('solve', this.solve);
    Store.set('error', this.state.error);
    this.elapsed = this.timer.pause();
    if (this.elapsed) Store.set('elapsed', this.elapsed);
  }

  onInit = () => {
    this.setState({
      initing: false,
      playing: true,
      showModal: false,
      showHelp: false,
      error: 0
    }, () => {
      this.timer.start();
    });
  }

  onErrorMove = () => {
    Vibration.vibrate();
    this.setState({
      error: this.state.error + 1,
    });
  }

  onFinish = () => {
    this.setState({
      playing: false,
    });
    Store.multiRemove('puzzle', 'solve', 'error', 'elapsed');
    this.elapsed = null;
    this.solve = null;
    this.fromStore = false;
    const elapsed = this.timer.stop();
    if (!this.records.includes(elapsed)) {
      this.records.push(elapsed);
      this.records.sort((a, b) => a - b);
      this.records = this.records.slice(0, 5);
      Store.set('records', this.records);
    }
    const formatTime = Timer.formatTime;
    const length = this.records.length;
    const newRecord = elapsed == this.records[0] && this.records.length > 1;
    setTimeout(() => {
      Alert.alert(I18n.t('congrats'), (newRecord ? I18n.t('newrecord') : I18n.t('success')) + formatTime(elapsed), [
        { text: I18n.t('ok') },
        { text: I18n.t('newgame'), onPress: this.onCreate },
      ]);
    }, 1000);
  }

  onResume = () => {
    this.setState({
      showModal: false,
      showHelp: false,
    });
    if (this.fromStore) {
      this.timer.setElapsed(this.elapsed);
      this.setState({
        puzzle: this.puzzle,
        initing: true,
      });
      this.resetPad(this.puzzle);
      this.fromStore = false;
    }
    this.timer.resume();
  }

  onRestart = () => {
    this.elapsed = null;
    this.solve = null;
    this.fromStore = false;
    this.timer.reset();
    Store.multiRemove('solve', 'error', 'elapsed');
    this.setState({
      puzzle: this.puzzle.slice(),
      initing: true,
      playing: false,
      showModal: false,
      error: 0,
    });
    this.resetPad(this.puzzle);
  }

  onCreate = () => {
    this.elapsed = null;
    this.solve = null;
    this.fromStore = false;
    this.timer.reset();
    //let puzzle = sudoku.makepuzzle();
    let puzzle = this.newPuzzle();
    this.setState({
      puzzle,
      initing: true,
      playing: false,
      showModal: false,
      showHelp: false,
      error: 0,
    }, async() => {
      await Store.multiRemove('puzzle', 'solve', 'error', 'elapsed');
      this.puzzle = puzzle.slice();
      Store.set('puzzle', this.puzzle);
    });
    this.difficulty = -1;
    this.resetPad(puzzle);
  }

  onShowModal = () => {
    if (!this.state.initing) {
      this.saveToStore();
    }
    this.setState({
      showModal: true,
      showHelp: false,
    });
  }

  onCloseModal = () => {
    this.timer.resume();
    this.setState({
      showModal: false,
    });
  }

  onShowHelp = () => {
    if (!this.state.initing) {
      this.saveToStore();
    }
    if(this.state.showModal)
      this.setState({
        showModal: false,
      });
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
      'https://play.google.com/store/apps/details?id=com.zapalote.TapTapSudoku' :
      'itms-apps://itunes.apple.com/us/app/taptapsudoku/id1320628951?mt=8';
    Alert.alert(I18n.t('rate'), I18n.t('ratemessage'), [
      { text: I18n.t('notnow') },
      { text: I18n.t('appstore'), onPress: () => Linking.openURL(link) },
    ]);
  }

  showInfo = () => {
    const { error } = this.state;
    const msg = '\n'+I18n.t('difficulty')+formatLevel(this.difficulty)+'\n'+I18n.t('errors')+formatBad(error)+'\n';
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
    const { puzzle, playing, initing, showModal, showHelp, showAbout, error } = this.state;
    const disabled = !playing && !this.fromStore;
    if(this.difficulty < 0) this.difficulty = sudoku.ratepuzzle(puzzle, 4);
    if (puzzle && !this.solve) this.solve = puzzle.slice();

    return (
      <View style={[styles.container, this.getTopMargin()]} onLayout={this.onLayoutEvent} >
          <Board puzzle={puzzle} solve={this.solve} ref={ref => this.board = ref}
            onInit={this.onInit} onErrorMove={this.onErrorMove} onFinish={this.onFinish} />

          <View style={styles.box}>
            <View style={styles.menuBox}>
              <Timer ref={ref => this.timer = ref} style={styles.timer} />
              <Touchable onPress={this.showInfo} >
                <View style={styles.info}>
                  <Text style={[styles.bad, styles.level]}>{'BAD '+formatBad(error)}</Text>
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
            <NumberPad board={this.board} pad={this.pad} reset={initing} />
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
            <View style={[styles.modalContainer]} >
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
    justifyContent: 'flex-start',
    flexDirection:'row',
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
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  help: {
    marginTop: CellSize,
    marginLeft: CellSize * 1.5,
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
    width: 250,
    height: 250,
    marginLeft: CellSize * 1.5,
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
