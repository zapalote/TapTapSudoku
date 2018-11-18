'use strict';

import React, { Component } from 'react';

import {
  StyleSheet, AppState, Platform, Linking, Vibration, Modal, Image, Text, Alert, View, StatusBar, ActivityIndicator,
} from 'react-native';

import {
  Size, CellSize, BoardWidth, BorderWidth, Board, Timer, Touchable, NumberPad, BadMove, RadioGroup,
} from '../components';
import { Store, sudoku, isNumber, Lang, } from '../utils';

class Main extends Component {

  version = '1.3';
  aboutMsg =
    `A SUDOKU APP FOR
    PLAYERS BY PLAYERS
    v${this.version}`;
  privacyMsg  =
    `PRIVACY: WE DON'T
    COLLECT ANY DATA`;
  copyrightMsg = `© ${(new Date()).getFullYear()} zapalote.com`;
  copyrightLink = 'https://zapalote.com/TapTapSudoku/';

  state = {
    appState: AppState.currentState,
    game: null,
    playing: false,
    showMenu: false,
    showHelp: false,
    showAbout: false,
    showSettings: false,
    updateBoard: true,
    topMargin: 18,
    level: 2,
    loading: false,
  }
  difficulty = 0;
  elapsed = null;
  error = 0;
  records = [];
  numberPad = null;
  pad = new Array(9).fill(0);
  board = null;
  fromStore = false;
  levels = [
    { label: Lang.txt('manageable'),  value: 2, size: CellSize/1.8, range: [0,1],     color: '#fc0', selected: true },
    { label: Lang.txt('challenging'), value: 4, size: CellSize/1.8, range: [2,3],     color: '#fc0',},
    { label: Lang.txt('impossible'),  value: 6, size: CellSize/1.8, range: [4,5,6,7], color: '#fc0' },
    { label: Lang.txt('anylevel'),    value: 0, size: CellSize/1.8, range: [0,1,2,3,4,5,6,7], color: '#fc0' }
  ];
  TEST = 'init';

  shouldComponentUpdate(nextProps, nextState){
    return this.state != nextState;
  }

  async componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);

    StatusBar.setHidden(true);
    this.records = await Store.get('records') || [];
    this.setState({
      showMenu: true,
    });
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState == null || nextAppState === 'active' ){
      //if (this.state.appState.match(/inactive|background/)) {
      this.loadBoardFromStore();
      //}
    } else {
      this.elapsed = this.timer.pause();
      Store.set('elapsed', this.elapsed);
    }

    this.setState({appState: nextAppState});
  }

  loadBoardFromStore = async () => {
    this.pad.fill(0);
    let game = await Store.get('board');
    if(game == null || game.length == 0) {
      this.fromStore = false;
      this.TEST = 'empty';
      return;
    }

    this.TEST = 'store';
    this.fromStore = true;
    let elapsed = await Store.get('elapsed') || 0;
    this.timer.setElapsed(elapsed);
    this.error = await Store.get('error') || 0;
    this.setState({
      game,
      playing: true,
      updateBoard: true,
      showMenu: true,
      showHelp: false,
      showAbout: false,
    }, () => {
      this.board.resetGame(game);
      this.setPad();
      this.bad.reset(this.error);
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
    Store.set('board', game);
    Store.set('error', 0);
    this.TEST = `${this.TEST} onRestart`;
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
      showMenu: this.fromStore,
      showHelp: false,
    }, () => {
      if(this.fromStore){
        this.fromStore = false;
      } else {
        this.error = 0;
        this.bad.reset();
      }
      this.timer.start();
    });
    this.TEST = `${this.TEST} onInit`;
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
    const msg = (newRecord ? Lang.txt('newrecord') : Lang.txt('success')) + formatTime(eta);
    setTimeout(() => {
      Alert.alert(Lang.txt('congrats'), msg, [
        { text: Lang.txt('ok') },
        { text: Lang.txt('newgame'), onPress: this.onCreate },
      ]);
    }, 1000);
    this.TEST = `${this.TEST} onFinish`;
  }

  onResume = () => {
    this.setState({
      showMenu: false,
    }, () => {
      this.timer.resume();
    });
    this.TEST = `${this.TEST} onResume`;
  }

  newGame = () => {
    let puzzle = [];
    let d = 0;
    let lev = this.levels.findIndex(e => e.value == this.state.level);
    const levelRange = lev > -1 ? this.levels[lev].range : [0,1];

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
    Store.set('error', 0);
    Store.set('board', game);
    this.TEST = `${this.TEST} newGame`;
  }

  onCreate = () => {
    this.setState({ loading: true });
    this.elapsed = null;
    this.timer.reset();
    setTimeout(() => {
      this.newGame();
    }, 100);
    this.TEST = `${this.TEST} onCreate`;
  }

  onShowMenu = () => {
    this.elapsed = this.timer.pause();
    Store.set('elapsed', this.elapsed);
    this.setState({
      showMenu: true,
    });
  }

  onCloseMenu = () => {
    this.timer.resume();
    this.setState({
      showMenu: false,
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
    Alert.alert(Lang.txt('rate'), Lang.txt('ratemessage'), [
      { text: Lang.txt('notnow') },
      { text: Lang.txt('appstore'), onPress: () => Linking.openURL(link) },
    ]);
  }

  showInfo = () => {
    const formatTime = Timer.formatTime;
    const level = '•'.repeat(this.difficulty+1);
    const record = (this.records[0])? Lang.txt('record')+formatTime(this.records[0]) : ' ';
    const msg = `${Lang.txt('difficulty') + level}
          ${record}`;

    setTimeout(() => {
      Alert.alert(Lang.txt('Info'), msg, [
        { text: Lang.txt('ok') }, {},
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

  onSettings = () => {
    this.setState({
      showSettings: true,
    });
  }

  onCloseSettings = () => {
    this.setState({
      showSettings: false,
    });
  }

  onLevelsPress = (levels) => {
    let selectedLevel = levels.find(e => e.selected == true);
    this.setState({
      level: selectedLevel ? selectedLevel.value : 2,
      playing: false,
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
    const { game, playing, showMenu, showHelp, showAbout, showSettings, updateBoard, loading } = this.state;
    const disabled = !playing;
    const aboutInfo = this.aboutMsg.replace(/\n\s+/g,"\n");
    const privacyInfo = this.privacyMsg.replace(/\n\s+/g,"\n");

    return (

      <View style={[styles.container, this.getTopMargin()]} onLayout={this.onLayoutEvent} >

        <Board game={game} ref={ref => this.board = ref} reset={updateBoard}
          onInit={this.onInit} onErrorMove={this.onErrorMove} onFinish={this.onFinish} />

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

        <Modal animationType='fade' visible={showMenu} transparent={true} onRequestClose={this.onCloseMenu} >
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
              <Touchable style={styles.button} onPress={this.onSettings} >
                <Image style={styles.buttonIcon} source={require('../images/settings.png')} />
              </Touchable>
              <Touchable style={styles.button} onPress={this.onRate} >
                <Image style={styles.buttonIcon} source={require('../images/rate.png')} />
              </Touchable>
            </View>
          </View>

          {loading?
            <View style={styles.loadingBackground}>
              <View style={styles.loading}>
                <ActivityIndicator color='black' size='large' style={styles.loading} animating={loading} />
              </View>
            </View>
            : null }

          <Modal animationType='fade' visible={showAbout} transparent={true} onRequestClose={this.onCloseAbout} >
            <View style={styles.modal} >
              <View style={[styles.modalContainer]} >
                <Image style={styles.logo} source={require('../images/tap-tap-sudoku.png')} />
                <Text style={styles.aboutText}>{aboutInfo}</Text>
                <Text style={[styles.aboutText, styles.privacyText]}>{privacyInfo}</Text>
                <View style={styles.link}>
                  <Text style={[styles.aboutText, styles.copyrightText]}
                    onPress={() => Linking.openURL(this.copyrightLink)}>{this.copyrightMsg}</Text>
                </View>
              </View>
              <View style={styles.footer}>
                <Touchable style={styles.button} onPress={this.onCloseAbout} >
                  <Image style={styles.buttonIcon} source={require('../images/close.png')} />
                </Touchable>
              </View>
            </View>
          </Modal>

          <Modal animationType='fade' visible={showSettings} transparent={true} onRequestClose={this.onCloseSettings} >
            <View style={styles.modal} >
              <View style={[styles.modalContainer]} >
                <Image style={styles.logo} source={require('../images/tap-tap-sudoku.png')} />
                <RadioGroup radioButtons={this.levels} onPress={this.onLevelsPress}
                  style={styles.radioText} heading={'LEVEL'} headingStyle={styles.optionHeading}/>
              </View>
              <View style={styles.footer}>
                <Touchable style={styles.button} onPress={this.onCloseSettings} >
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
  levelInfo: {
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
    height: 100,
    width: 100,
    borderRadius: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  optionHeading:{
    fontFamily: "Varela Round",
    fontSize: CellSize / 1.3 ,
    textAlign: "center",
    marginBottom: CellSize / 2,
  },
  radioText:{
    fontFamily: "Varela Round",
    fontSize: CellSize / 1.7,
  },
  aboutText: {
    fontFamily: "Varela Round",
    fontSize: CellSize / 2.3,
    textAlign: "center",
    margin: BorderWidth * 5,
  },
  privacyText :{
    color: '#000'
  },
  copyrightText: {
    backgroundColor: 'transparent',
    bottom: -8 * BorderWidth,
    fontSize: CellSize / 2,
  },
  link:{
    borderBottomColor: '#fc0',
    borderBottomWidth: BorderWidth * 2.5,
    opacity: 0.65,
  },
  help: {
    marginTop: CellSize,
    width: CellSize * 7,
    height: BoardWidth * 1.2,
  },
  footer: {
    flexDirection: 'row',
    marginBottom: CellSize / 1.7 ,
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
