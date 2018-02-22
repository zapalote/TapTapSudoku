'use strict';

import React, { Component } from 'react';

import {
  LayoutAnimation,
  StyleSheet,
  Animated,
  Platform,
  View,
  Text,
  PanResponder,
} from 'react-native';

import {
  CellSize,
  BorderWidth,
} from './GlobalStyle';

import Touchable from './Touchable';
import { Store, isNumber } from '../utils';

class Cell extends Component {

  state = {
    number: this.props.number,
    hints: [],
    pencil: false,
    highlight: false,
    fixed: false,
    toggle: false,
    anim: new Animated.Value(0),
  }

  onPress = (e) => {
    this.props.onPress && this.props.onPress(this.props.index, this.state.number, this.state.fixed);
  }

  setHighlight(highlight) {
    this.setState({
      highlight: highlight,
    });
  }

  setNumber(number, fixed) {
    // lock number
    if (fixed){
      Store.setFixed(this.props.index, number);
    } else {
      Store.setNumber(this.props.index, number);
    }
    this.setState({
      number,
      fixed,
      hints: [],
      pencil: false,
    });
  }

  setHintNumber(number) {
    // pencil number or toggle
    let hints = this.state.hints;
    if (hints.length == 6) hints.shift();
    if (hints.includes(number)) hints = hints.filter(x => x != number);
    else hints.push(number);
    Store.setHint(this.props.index, hints);
    this.setState({
      hints,
      pencil: true,
    });
  }

  removeHint(number) {
    // remove pencil for given number
    let hints = this.state.hints;
    if (hints.includes(number)) {
      hints = hints.filter(x => x != number);
      Store.setHint(this.props.index, hints);
      this.setState({
        hints,
      });
    }
  }

  reset() {
    // reset this cell
    this.setState({
      number: this.props.number,
      hints: [],
      pencil: false,
      highlight: false,
      fixed: false,
      toggle: false,
      anim: new Animated.Value(0),
    });
  }

  animate() {
    // rotate the highlighted cell
    if (this.state.toggle) return;
    this.setState({
      toggle: true,
    }, () => {
      this.state.anim.setValue(0);
      Animated.timing(this.state.anim, {
        toValue: 1,
        duration: 1000,
        //useNativeDriver: true,
      }).start(() => {
        this.setState({
          toggle: false,
        });
      });
    });
  }

  render() {
    const { number, fixed, highlight, pencil, hints, toggle } = this.state;
    const rotate = this.state.anim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
    const scale = this.state.anim.interpolate({
      inputRange: [0, 0.1, 0.9, 1],
      outputRange: [1, 1.1, 1.1, 1],
    });
    const transform = [{ rotate }, { scale }];
    const zIndex = toggle ? 100 : 0;
    const filled = typeof(number) == 'number';
    const text = filled ? (number + 1) : '';
    const hint = hints.map(x => x + 1).join('');
    return (
      <Animated.View style={[styles.cell, filled&&styles.filledCell, fixed&&styles.fixedCell,
        highlight&&styles.highlightCell, {transform, zIndex}]}>
        {pencil?
          <Text style={[styles.text, styles.pencilText]} >{hint}</Text>:
          <Text style={[styles.text, fixed&&styles.fixedText, highlight&&styles.highlightText]}>{text}</Text>
        }
        <Touchable activeOpacity={fixed?1:0.8} onPress={this.onPress} style={styles.handle} />
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  handle: {
    width: CellSize,
    height: CellSize,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cell: {
    width: CellSize,
    height: CellSize,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: StyleSheet.hairlineWidth,
    //borderRadius: BorderWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    color: 'black',
    fontSize: CellSize * 2 / 3,
    fontFamily: 'HelveticaNeue',
  },
  pencilText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    color: 'darkturquoise',
    fontSize: CellSize * 2 / 5,
    marginHorizontal: CellSize / 8,
    ...Platform.select({
      ios: {
        marginTop: CellSize / 12,
        lineHeight: CellSize * 2 / 5
      },
      android: {
        lineHeight: Math.floor(CellSize * 2 / 4),
      },
    })
  },
  filledCell: {
    //color: '#00ff00',
  },
  fixedCell: {
    //color: '#666',
  },
  fixedText: {
    color: '#888',
  },
  highlightCell: {
    borderColor: '#fc0',
    borderWidth: 4,
  },
  highlightText: {
    color: '#c90',
  },
});

export default Cell;