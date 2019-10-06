
import React, { Component } from 'react';
import { StyleSheet, View, Image, } from 'react-native';
import { Size, CellSize, Touchable } from '../components';

class ProvideMenu extends Component {

  render() {
    const { layoutStyle, disabled } = this.props;

    return (
      <View style={styles.modal}>
        <View style={[styles.modalContainer, layoutStyle]} >
          <Image style={styles.logo} source={require('../images/tap-tap-sudoku.png')} />
          <View style={styles.textBlock}>
            <Touchable disabled={disabled} onPress={() => {this.props.onResume();}} >
              <Image style={[styles.buttonMenu, disabled && styles.disabled]} source={require('../images/continue.png')} />
            </Touchable>
            <Touchable disabled={disabled} onPress={() => {this.props.onRestart();}} >
              <Image style={[styles.buttonMenu, disabled && styles.disabled]} source={require('../images/restart.png')} />
            </Touchable>
            <Touchable onPress={() => {this.props.onCreate();}} >
              <Image style={styles.buttonMenu} source={require('../images/newgame.png')} />
            </Touchable>
          </View>
        </View>
        <View style={styles.footer}>
          <Touchable style={styles.button} onPress={() => {this.props.onAbout();}} >
            <Image style={styles.buttonIcon} source={require('../images/about.png')} />
          </Touchable>
          <Touchable style={styles.button} onPress={() => {this.props.onDoc();}} >
            <Image style={styles.buttonIcon} source={require('../images/help.png')} />
          </Touchable>
          <Touchable style={styles.button} onPress={() => {this.props.onSettings();}} >
            <Image style={styles.buttonIcon} source={require('../images/settings.png')} />
          </Touchable>
          <Touchable style={styles.button} onPress={() => {this.props.onRate();}} >
            <Image style={styles.buttonIcon} source={require('../images/rate.png')} />
          </Touchable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    alignItems: 'center',
    alignSelf: 'center',
    width: CellSize * 6.5,
    height: CellSize * 6.5,
    marginBottom: CellSize * 0.3,
  },
  textBlock: {
    alignItems: 'center',
    alignSelf: 'center',
    width: CellSize * 6.5,
    marginBottom: CellSize * 0.3,
  },
  buttonMenu: {
    width: CellSize * 6,
    height: 50,
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
  buttonIcon: {
    width: CellSize,
    height: CellSize,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ProvideMenu;
