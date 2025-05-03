
import React, { Component } from 'react';
import { StyleSheet, View, Text, Image, Linking, Platform, } from 'react-native';
import { Size, CellSize, BorderWidth, Touchable } from '../components';

class ProvideAbout extends Component {

  render() {
    const { layoutStyle, appVersion } = this.props;

    return (
      <View style={styles.modal}>
        <View style={[styles.modalContainer, layoutStyle]} >
          <Image style={styles.logo} source={require('../assets/images/tap-tap-sudoku.png')} />
          <View style={styles.textBlock}>
            <Text style={styles.textStyle}>
              <Text>{`A SUDOKU APP FOR PLAYERS BY PLAYERS`}</Text>
            </Text>
            <Text style={styles.textStyle}>
              <Text>{`Privacy: We don't collect any data`}</Text>
            </Text>
            <Text style={[styles.textStyle, styles.link, styles.copyrightText]}>
              <Text onPress={() => Linking.openURL('https://zapalote.com/TapTapSudoku/')}>
                {`${appVersion} — © ${(new Date()).getFullYear()} zapalote`}
              </Text>
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Touchable style={styles.button} onPress={() => { this.props.onClose(); } }>
            <Image style={styles.buttonIcon} source={require('../assets/images/close.png')} />
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
    backgroundColor: '#fff',
  },
  textStyle: {
    fontFamily: Platform.OS === 'ios' ? 'Varela Round' : 'varela',
    fontSize: CellSize / 2,
    textAlign: "center",
    margin: BorderWidth * 5,
    opacity: 0.8,
  },
  textBlock: {
    alignItems: 'center',
    alignSelf: 'center',
    width: CellSize * 6.5,
    marginBottom: CellSize * 0.3,
  },
  logo: {
    alignItems: 'center',
    alignSelf: 'center',
    width: CellSize * 6.5,
    height: CellSize * 6.5,
    marginBottom: CellSize * 0.3,
  },
  copyrightText: {
    backgroundColor: 'transparent',
    bottom: -8 * BorderWidth,
    fontSize: CellSize / 2,
    marginTop: CellSize * 0.3,
    marginBottom: CellSize * 0.1,
  },
  link:{
    textDecorationLine: 'underline',
    textDecorationColor: '#fc0',
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

export default ProvideAbout;
