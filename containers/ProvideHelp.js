
import React, { Component } from 'react';
import { StyleSheet, View, Text, Image, Platform, } from 'react-native';
import { Size, CellSize, Touchable } from '../components';

class ProvideHelp extends Component {

  render() {
    const { layoutStyle, } = this.props;

    return (
      <View style={styles.modal}>
        
        <View style={[styles.modalContainer, layoutStyle]} >
          <Image style={styles.logo} source={require('../images/tap-tap-sudoku.png')} />
          <View style={styles.logo}>
            <Text style={styles.textStyle}>
              <Text >{'CHOOSE THE CELL YOU WANT TO PLAY'}</Text>
            </Text>
            <Text style={styles.textStyle}>
              <Text >{'TAP A NUMBER ONCE TO PENCIL IT'}</Text>
            </Text>
            <Text style={styles.textStyle}>
              <Text >{'TAP TWICE TO LOCK IT'}</Text>
            </Text>
            <Text style={styles.textStyle}>
              <Text >{'BON PLAISIR!'}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Touchable style={styles.button} onPress={() => { this.props.onClose(); }} >
            <Image style={styles.buttonIcon} source={require('../images/close.png')} />
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
  textStyle: {
    fontFamily: Platform.OS === 'ios' ? 'Varela Round' : 'varela',
    fontSize: CellSize / 1.7,
    textAlign: "center",
    width: CellSize * 7,
    opacity: 0.8,
    marginBottom: CellSize * 0.3,
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
});


export default ProvideHelp;
