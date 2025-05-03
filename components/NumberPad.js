/* eslint-disable comma-dangle */
import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import { CellSize } from './GlobalStyle';
//import PadCell from './PadCell';
import CircularPadCell from './CircularPadCell';

const numbers = [1,2,3,4,5,6,7,8,9];

class NumberPad extends Component {

  padCells = [];

  resetPadCells = (pad) => {
    numbers.map((index, i) => {
      this.padCells[i].resetPadCell(pad[i]);
    });
  }

  render() {
    const { pad } = this.props;
    return (
      <View style={styles.container} >
        {
          numbers.map((item, i) => {
            return (
              <CircularPadCell ref={ref => this.padCells[i] = ref} fillCount={pad[i]}
                key={'pad' + i} number={item} board={this.props.board} />
            );
          })
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: CellSize * 5,
    height: CellSize * 5,
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  }
});

export default NumberPad;
