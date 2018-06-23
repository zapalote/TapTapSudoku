'use strict';

import React, { Component } from 'react';

import {
  StyleSheet, AppState, Platform, Linking, Vibration, Modal, Image, Text, Alert, View, StatusBar, ActivityIndicator,
} from 'react-native';

import {
  Size, CellSize, BoardWidth, BorderWidth, Board, Timer, Touchable, NumberPad, BadMove, RadioGroup,
} from '../components';
import { Store, sudoku, isNumber, I18n, } from '../utils';

class Main extends Component {

  version = '1.2';
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
  updatePad= false;
  pad = new Array(9).fill(0);
  fromStore = false;
  levels = [
    { label: I18n.t('manageable'),  value: 2, size: CellSize/1.8, range: [0,1],     color: '#fc0', selected: true },
    { label: I18n.t('challenging'), value: 4, size: CellSize/1.8, range: [2,3],     color: '#fc0',},
    { label: I18n.t('impossible'),  value: 6, size: CellSize/1.8, range: [4,5,6,7], color: '#fc0' },
    { label: I18n.t('anylevel'),    value: 0, size: CellSize/1.8, range: [0,1,2,3,4,5,6,7], color: '#fc0' }
  ];

  componentWillMount(){
    StatusBar.setHidden(true);
  }

  shouldComponentUpdate(nextProps, nextState){
    return this.state != nextState;
  }

  async componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);

    this.records = await Store.get('records') || [];
    this.setState({
      showMenu: true,
    });
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      this.loadBoardFromStore();
    }
    if (nextAppState === 'active'){
      this.setState({
        showMenu: true,
      });
    } else {
      this.elapsed = this.timer.pause();
      Store.set('elapsed', this.elapsed);
    }

    this.setState({appState: nextAppState});
  }

  async loadBoardFromStore(){
    this.pad.fill(0);
    let game = await Store.get('board');
    if(!game || game.length == 0) {
      this.fromStore = false;
      return;
    }

    this.fromStore = true;
    let elapsed = await Store.get('elapsed') || 0;
    this.timer.setElapsed(elapsed);
    this.error = await Store.get('error') || 0;
    this.setState({
      game,
      updateBoard: false,
      showMenu: true,
      showHelp: false,
      showAbout: false,
    }, () => {
      this.setPad();
      this.bad.reset(this.error);
      this.timer.resume();
    });
  }

  setPad = () => {
    const { game } = this.state;
    if(!game) return;
    this.pad.fill(0);
    game.forEach( (cell) => {
      if(cell && isNumber(cell.n))
        this.pad[cell.n]++;
    });
    this.updatePad = true;
  }

  onInit = () => {
    this.setState({
      playing: true,
      updateBoard: false,
      showMenu: false,
      showHelp: false,
    }, () => {
      if(this.fromStore){
        this.fromStore = false;
        this.timer.resume();
      } else {
        this.error = 0;
        this.bad.reset();
      }
      this.updatePad = false;
      this.timer.start();
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
      showMenu: false,
    }, () => {
      this.updatePad = false;
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
      updateBoard: true,
      playing: false,
      showMenu: false,
    }, () => {
      this.error = 0;
      this.bad.reset();
      this.setPad();
    });
    Store.set('board', game);
    Store.set('error', 0);
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
    this.setState({
      game,
      updateBoard: true,
      playing: false,
      showMenu: false,
      loading: false,
    }, () => {
      this.error = 0;
      this.bad.reset();
      this.setPad();
    });
    Store.set('error', 0);
    Store.set('board', game);
  }

  onCreate = () => {
    this.setState({ loading: true });
    this.elapsed = null;
    this.timer.reset();
    setTimeout(() => {
      this.newGame();
    }, 100);
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
          <NumberPad board={this.board} pad={this.pad} reset={this.updatePad} />
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

          {/* <Modal animationType='fade' visible={loading} transparent={true} >
            <View style={styles.loadingBackground}>
              <View style={styles.loading}>
                <ActivityIndicator color='#fc0' size='large' style={styles.loading} animating={loading} />
              </View>
            </View>
          </Modal> */}
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
                <Text style={styles.aboutText}>{this.aboutMsg}</Text>
                <Text style={[styles.aboutText, styles.privacyText]}>{this.privacyMsg}</Text>
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
    opacity: 0.6,
  },
  loading: {
    backgroundColor: '#ccc',
    height: 100,
    width: 100,
    borderRadius: 10,
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
