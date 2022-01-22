'use strict';

import React, { Component } from 'react';

import {
  StyleSheet, AppState, Platform, Linking, Vibration, Modal, Image, Alert, View, SafeAreaView,
  StatusBar, ActivityIndicator, Dimensions,
} from 'react-native';

import {
  Size, CellSize, BorderWidth, Board, Timer, Touchable, NumberPad, BadMove,
} from '../components';
import { ProvideHelp, ProvideAbout, ProvideSettings, ProvideMenu, } from '../containers';
import { Store, sudoku, isNumber, Lang, } from '../utils';

class Main extends Component {

  appVersion = '1.5';

  state = {
    appState: AppState.currentState,
    game: null,
    playing: false,
    showMenu: true,
    showHelp: false,
    showDoc: false,
    showAbout: false,
    showSettings: false,
    updateBoard: false,
    levelRange: [0,1],
    levelValue: 0,
    loading: false,
    orientation: 'portrait',
    topMargin: 18,
    screenWidth: Size.width,
    screenHeight: Size.height,
    storeError: null,
  }
  difficulty = 0;
  elapsed = null;
  error = 0;
  records = new Array(8).fill(3600);
  numberPad = null;
  pad = new Array(9).fill(0);
  board = null;
  firstTime = null;

  shouldComponentUpdate(nextProps, nextState){
    return this.state != nextState;
  }

  async componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
    Dimensions.addEventListener('change', this.listenOrientationChange);

    StatusBar.setHidden(true);
    Store.setErrorMethod(this.setStoreError);
    this.firstTime = await Store.get('first');
    if(this.firstTime == null){
      await Store.clearAll();
      this.setState({
        showDoc: true,
      });
    } else {
      this.loadBoardFromStore() || this.newGame();
      this.setState({
        showMenu: true,
      });
    }
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    Dimensions.removeEventListener('change', this.listenOrientationChange);
  }

  setStoreError = (storeError) => {
    this.setState({ storeError });
  }

  handleAppStateChange = async (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active' ){
      this.loadBoardFromStore() || this.newGame();
    } else {
      this.elapsed = (this.timer && this.timer.pause()) || 0;
      await Store.set('elapsed', this.elapsed);
    }

    this.setState({appState: nextAppState});
  }

  listenOrientationChange = (newDimensions) => {
    const screenWidth = newDimensions.window.width;
    const screenHeight = newDimensions.window.height;

    this.setState({
      orientation: screenWidth < screenHeight ? 'portrait' : 'landscape',
      topMargin: screenWidth < screenHeight ? 18 : 6,
      screenWidth,
      screenHeight,
    });
  }

  getLayout = () => {
    const { orientation, topMargin } = this.state;
    return ({
      marginTop: topMargin,
      flexDirection: orientation === 'portrait'? 'column' : 'row',
    });
  }

  loadBoardFromStore = async () => {
    this.setStoreError(null);
    this.pad.fill(0);
    const recs = await Store.get('records');
    if (recs) this.records = recs;
    const game = await Store.get('board');
    if(game ===  null || this.state.storeError) return false;

    const elapsed = await Store.get('elapsed') || 0;
    this.timer && this.timer.setElapsed(elapsed);
    this.error = await Store.get('error') || 0;
    const levelRange = await Store.get('levelRange') || [0,1];
    const levelValue = await Store.get('levelValue') || 0;
    this.setState({
      game,
      playing: true,
      updateBoard: true,
      showMenu: true,
      showHelp: false,
      showAbout: false,
      levelRange,
      levelValue,
    }, () => {
      this.board.resetGame(game);
      this.setPad();
      this.bad.reset(this.error);
      this.timer && this.timer.resume();
    });
    return true;
  }

  onRestart = async () => {
    this.elapsed = null;
    this.timer.reset();
    let game = [];
    this.state.game.forEach( (cell, idx) => {
      if(cell && cell.type == 'F') game[idx] = this.state.game[idx];
    });
    this.board.resetGame(game);
    this.setState({
      game,
      updateBoard: true,
      playing: true,
      showMenu: false,
    }, () => {
      this.error = 0;
      this.bad.reset();
      this.setPad();
    });
    await Store.set('board', game);
    await Store.set('error', 0);
  }

  setPad = () => {
    const { game } = this.state;
    if(!game) return;
    this.pad.fill(0);
    game.forEach( (cell) => {
      if(cell && isNumber(cell.n))
        this.pad[cell.n]++;
    });
    this.numberPad && this.numberPad.resetPadCells(this.pad);
  }

  onInit = () => {
    this.setState({
      playing: true,
      updateBoard: false,
      showMenu: false,
      showHelp: false,
    }, () => {
      this.error = 0;
      this.bad.reset();
      this.timer.start();
    });
  }

  onErrorMove = async () => {
    Vibration.vibrate();
    this.bad.onBadMove();
    this.error++;
    await Store.set('error', this.error);
  }

  storeElapsed = async () => {
    const time = this.timer.getElapsed();
    await Store.set('elapsed', time);
  }

  onFinish = async () => {
    this.elapsed = null;
    const eta = this.timer.stop();
    Store.remove('board');

    // check if this is a record eta (don't bother for uniqueness)
    let newRecord = false;
    const difficulty = this.difficulty;
    if(eta < this.records[difficulty]){
      this.records[difficulty] = eta;
      newRecord = true;
      await Store.set('records', this.records);
    }

    const formatTime = Timer.formatTime;
    const msg = (newRecord ? Lang.txt('newrecord') : Lang.txt('success')) + formatTime(eta);
    setTimeout(() => {
      Alert.alert(Lang.txt('congrats'), msg, [
        { text: Lang.txt('ok'),
          onPress: () => {
            this.setState({
              playing: false,
              showMenu: true,
            });
          }
        },
        { text: Lang.txt('newgame'), onPress: () =>  this.onCreate() },
      ]);
    }, 1000);
  }

  showInfo = () => {
    const formatTime = Timer.formatTime;
    const difficulty = '•'.repeat(this.difficulty+1);
    const record = Lang.txt('record')+formatTime(this.records[this.difficulty]);
    const info = ''; //`first: ${this.firstTime} StoreErr: ${this.state.storeError}\n`;
    const msg = `${info}${Lang.txt('difficulty') + difficulty}\n${record}`;

    setTimeout(() => {
      Alert.alert(Lang.txt('Info'), msg, [
        { text: Lang.txt('ok') },
        { text: 'Stop', onPress: () => this.board.stopIt() },
      ]);
    }, 300);
  }

  onResume = () => {
    this.setState({
      showMenu: false,
    }, () => {
      this.timer.resume();
    });
  }

  onCreate = () => {
    this.setState({ loading: true });
    this.elapsed = null;
    this.timer && this.timer.reset();
    setTimeout(() => {
      this.newGame();
    }, 100);
  }

  newGame = async () => {
    let puzzle = [];
    let d = 0;
    const levelRange = await Store.get('levelRange') || [0,1];

    do {
      puzzle = sudoku.makepuzzle();
      d = sudoku.ratepuzzle(puzzle, 4);
    } while(!levelRange.includes(d));

    this.difficulty = d;
    let game = [];
    for (let i = 0; i < 81; i++) {
      let number = puzzle[i];
      if(isNumber(number))
        game[i] = { idx: i, type: 'F', n: number };
    }
    this.board && this.board.resetGame(game);
    this.setState({
      game,
      updateBoard: true,
      showMenu: false,
      loading: false,
    }, () => {
      this.error = 0;
      this.bad.reset();
      this.setPad();
    });
    await Store.set('error', 0);
    await Store.set('board', game);
  }

  onShowMenu = async () => {
    this.elapsed = (this.timer && this.timer.pause()) || 0;
    await Store.set('elapsed', this.elapsed);
    this.setState({
      showMenu: true,
    });
  }

  onMenuBackArrow = () => {
    this.timer && this.timer.resume();
    this.setState({
      showMenu: true,
    });
  }

  onShowHelp = async () => {
    this.elapsed = (this.timer && this.timer.pause()) || 0;
    await Store.set('elapsed', this.elapsed);
    this.setState({
      showHelp: true,
    });
  }

  onCloseHelp = async () => {
    this.timer && this.timer.resume();
    this.setState({
      showHelp: false,
    });
  }

  onRate = () => {
    const link = Platform.OS == 'android' ?
      'https://play.google.com/store/apps/details?id=com.zapalote.taptapsudoku' :
      'itms-apps://itunes.apple.com/us/app/taptapsudoku/id1320628951?mt=8';
    Alert.alert(Lang.txt('rate'), Lang.txt('ratemessage'), [
      { text: Lang.txt('notnow') },
      { text: Lang.txt('appstore'), onPress: () => Linking.openURL(link) },
    ]);
  }

  onAbout = () => {
    this.setState({ showAbout: true, });
  }

  onCloseAbout = () => {
    this.setState({ showAbout: false, });
  }

  onSettings = () => {
    this.setState({ showSettings: true, });
  }

  onCloseSettings = () => {
    this.setState({ showSettings: false, });
  }

  onDoc = () => {
    this.setState({ showDoc: true, });
  }

  onCloseDoc = async () => {
    if(this.firstTime == null){
      this.firstTime = new Date().toDateString();
      await Store.set('first', this.firstTime);
    }
    this.setState({
      showDoc: false,
    });
  }

  onSetLevel = async (value, range) => {
    this.setState({
      levelValue: value,
      levelRange: range,
      playing: false,
    });
    await Store.set('levelRange', range);
    await Store.set('levelValue', value);
  }

  render() {
    const {
      game, playing, showMenu, showHelp, showAbout, showSettings, showDoc, 
      updateBoard, loading, levelValue,
    } = this.state;
    const disabled = !playing;

    return (
      <SafeAreaView style={styles.container}>
        <Board game={game} ref={ref => this.board = ref} reset={updateBoard}
          storeElapsed={this.storeElapsed} onInit={this.onInit}
          onErrorMove={this.onErrorMove} onFinish={this.onFinish} />

        <View style={styles.box}>
          <View style={styles.menuBox}>
            <Timer ref={ref => this.timer = ref} style={styles.timer} />
            <Touchable onPress={this.showInfo} >
              <View style={styles.info}>
                <BadMove style={styles.levelInfo} ref={ref => this.bad = ref}  />
              </View>
            </Touchable>
            <View style={styles.buttonBox} >
              <Touchable onPress={this.onShowHelp} >
                <Image style={styles.menuIcon} source={require('../images/help.png')} />
              </Touchable>
              <Touchable onPress={this.onShowMenu} >
                <Image style={styles.menuIcon} source={require('../images/menu.png')} />
              </Touchable>
            </View>
          </View>
          <NumberPad board={this.board} pad={this.pad} ref={ref => this.numberPad = ref}/>
        </View>

        <Modal animationType='fade' visible={showHelp} transparent={true} onRequestClose={this.onCloseHelp} >
          <ProvideHelp layoutStyle={this.getLayout()} onClose={this.onCloseHelp} />
        </Modal>

        <Modal animationType='fade' visible={showMenu} transparent={true} onRequestClose={this.onMenuBackArrow} >
          <ProvideMenu disabled={disabled} layoutStyle={this.getLayout()}
            onResume={this.onResume} onRestart={this.onRestart} onCreate={this.onCreate} onDoc={this.onDoc}
            onAbout={this.onAbout} onSettings={this.onSettings} onRate={this.onRate} />

          {loading?
            <View style={styles.loadingBackground}>
              <View style={styles.loading}>
                <ActivityIndicator color='black' size='large' style={styles.loading} animating={loading} />
              </View>
            </View>
            : null }

          <Modal animationType='fade' visible={showDoc} transparent={true} onRequestClose={this.onCloseDoc} >
            <ProvideHelp layoutStyle={this.getLayout()} onClose={this.onCloseDoc} />
          </Modal>

          <Modal animationType='fade' visible={showAbout} transparent={true} onRequestClose={this.onCloseAbout} >
            <ProvideAbout textStyle={styles.helpTextStyle} layoutStyle={this.getLayout()}
              appVersion={this.appVersion} onClose={this.onCloseAbout} />
          </Modal>

          <Modal animationType='fade' visible={showSettings} transparent={true} onRequestClose={this.onCloseSettings} >
            <ProvideSettings layoutStyle={this.getLayout()}
              levelValue={levelValue} onSetLevel={this.onSetLevel} onClose={this.onCloseSettings}/>
          </Modal>

        </Modal>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
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
    width: CellSize * 2.1,
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
    fontSize: CellSize * 0.65,
    alignSelf: 'flex-start',
    color: '#6b6b6b',
  },
  info:{
    flexDirection:'row',
    backgroundColor: '#f2f2f2',
    justifyContent:'space-between',
    padding: 2,
  },
  levelInfo: {
    marginLeft: BorderWidth * 2,
    color: '#6b6b6b',
    alignItems:'flex-start',
    fontSize: CellSize * 3 / 8,
    fontWeight: '100',
    fontFamily: 'Menlo',
  },
  loadingBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: Size.width,
    height: Size.height,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    opacity: 0.7,
  },
  loading: {
    backgroundColor: 'white',
    opacity: 1,
    height: CellSize * 3,
    width: CellSize * 3,
    borderRadius: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around'
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
