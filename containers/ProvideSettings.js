import React, { Component } from 'react';
import { StyleSheet, View, Image, Platform, } from 'react-native';
import { RadioGroup, Size, CellSize, Touchable } from '../components';
import { Lang, } from '../utils';
import ThemeContext from '../utils/ThemeContext';

class ProvideSettings extends Component {
  static contextType = ThemeContext;

  levels = [
    { label: Lang.txt('manageable'),  value: 2, size: CellSize/1.8, range: [0,1],     color: '#fc0' },
    { label: Lang.txt('challenging'), value: 4, size: CellSize/1.8, range: [2,3],     color: '#fc0' },
    { label: Lang.txt('impossible'),  value: 6, size: CellSize/1.8, range: [4,5,6,7], color: '#fc0' },
    { label: Lang.txt('anylevel'),    value: 0, size: CellSize/1.8, range: [0,1,2,3,4,5,6,7], color: '#fc0' }
  ];

  onSelect = (radioButtons) => {
    const level = radioButtons.findIndex((lev) => { return lev.selected; });
    this.props.onSetLevel && this.props.onSetLevel(level, radioButtons[level].range);
  }

  render() {
    const { layoutStyle, levelValue } = this.props;
    const { theme } = this.context;
    this.levels.forEach((item, idx, lev) => {
      lev[idx].selected = (idx == levelValue)? true : false;
    });

    return (
      <View style={[styles.modal, { backgroundColor: theme.modalBackground }]}>
        <View style={[styles.modalContainer, layoutStyle, { backgroundColor: theme.modalBackground }]} >
          <Image style={styles.logo} source={require('../images/tap-tap-sudoku.png')} />
          <View style={styles.textBlock}>
            <RadioGroup radioButtons={this.levels} onPress={this.onSelect}
              style={[styles.radioText, { color: theme.text }]} heading={'LEVEL'} headingStyle={[styles.optionHeading, { color: theme.text }]}/>
          </View>
        </View>
        <View style={styles.footer}>
          <Touchable style={styles.button} onPress={() => { this.props.onClose(); } }>
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
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  optionHeading:{
    fontFamily: Platform.OS === 'ios' ? 'Varela Round' : 'varela',
    fontSize: CellSize / 1.3 ,
    textAlign: "center",
    marginBottom: CellSize / 6,
  },
  radioText:{
    fontFamily: Platform.OS === 'ios' ? 'Varela Round' : 'varela',
    fontSize: CellSize / 1.7,
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

export default ProvideSettings;
