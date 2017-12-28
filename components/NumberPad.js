'use strict';

import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import { Size, CellSize, BoardWidth, BorderWidth } from './GlobalStyle';
//import PadCell from './PadCell';
import CircularPadCell from './CircularPadCell';

const numbers = [1,2,3,4,5,6,7,8,9];

class NumberPad extends Component {

  render() {
    const { pad, fillCount } = this.props;
    return (
      <View style={styles.container} >
      {
        numbers.map((item, i) => {
          return (
            <CircularPadCell fillCount={pad[i]} key={'pad'+i} number={item}
              reset={this.props.reset} board={this.props.board} />
          )
        })
      }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    //borderWidth: 1,
    alignItems: 'flex-start',
    width: CellSize * 4.5,
    height: CellSize * 4.5,
    flexDirection: 'row',
    flexWrap: 'wrap',
  }
});

export default NumberPad;
