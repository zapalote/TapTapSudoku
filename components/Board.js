'use strict';

import React, { Component } from 'react';
import { InteractionManager, LayoutAnimation, StyleSheet, Platform, Dimensions, View, Alert } from 'react-native';
import { Size, CellSize, BoardWidth, BorderWidth } from './GlobalStyle';
import Grid from './Grid';
import { sudoku, isNumber } from '../utils';

const line = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function toXY(index) {
  const x = index % 9;
  const y = (index - x) / 9;
  return { x, y };
}

function toZ(index) {
  const { x, y } = toXY(index);
  return (x - x % 3) / 3 + (y - y % 3);
}

class Board extends Component {
  state = {
    index: -1,
  }
  puzzle = this.props.solve || this.props.puzzle
  original = this.props.puzzle
  cells = this.props.cells || []
  hightlightNumber = null
  hightlightIndex = null
  inited = false
  solved = false

  onCellPress = (index, number, fixed) => {
    if (!this.inited || this.solved) return;
    if (isNumber(number)) {
      if (isNumber(this.hightlightIndex))
        this.cells[this.hightlightIndex].setHighlight(false);
      if (isNumber(this.hightlightNumber))
        this.setHighlight(this.hightlightNumber, false);
      this.setHighlight(number, true);
      this.hightlightNumber = number;
      this.setState({
        index: -1,
      });
      return;
    }
    if (index != this.state.index) {
      LayoutAnimation.easeInEaseOut();
      this.setState({ index });
    }

    if (isNumber(this.hightlightIndex))
      this.cells[this.hightlightIndex].setHighlight(false);
    this.cells[index].setHighlight(true);
    this.hightlightIndex = index;

    if (isNumber(this.hightlightNumber)) {
      this.setHighlight(this.hightlightNumber, false);
      this.hightlightNumber = null;
    }
  }

  onPadPress = (number, edit) => {
    if (!this.inited) return false;
    const { index } = this.state;

    if (index == -1) {
      // no cell selected
      if (isNumber(this.hightlightNumber)) {
        this.setHighlight(this.hightlightNumber, false);
        if (this.hightlightNumber == number) {
          this.hightlightNumber = null;
          return false;
        }
      }
      this.setHighlight(number, true);
      this.hightlightNumber = number;
      return false;
    }

    if (edit) {
      // single tap, pencil the number
      this.cells[index].setHintNumber(number);
      return false;
    }

    const { x, y } = toXY(index);
    const z = toZ(index);

    // check for collisions or wrong move
    let collision = [];
    this.puzzle.forEach((item, idx) => {
      if (item != number) return false;
      const pos = toXY(idx);
      if (pos.x == x || pos.y == y || toZ(idx) == z)
        collision.push(idx);
    });
    if (collision.length) {
      // collisions: bad move
      collision.forEach(i => this.cells[i].setHighlight(true));
      setTimeout(() => {
        collision.forEach(i => this.cells[i].setHighlight(false));
      }, 300);
      this.props.onErrorMove && this.props.onErrorMove();
      return false;
    }
    let nextPuzzle = this.puzzle.slice();
    nextPuzzle[index] = number;
    if (!sudoku.solvepuzzle(nextPuzzle)) {
      // no collisions, still a bad move
      setTimeout(() => {
        this.props.onErrorMove && this.props.onErrorMove();
      }, 300);
      return false;
    }

    this.cells[index].setNumber(number);
    this.puzzle[index] = number;
    // remove any hints
    this.cells.forEach((item, idx) => {
      if (item == null) return false;
      const pos = toXY(idx);
      if (pos.x == x || pos.y == y || toZ(idx) == z)
        this.cells[idx].removeHint(number);
    });

    // grid solved
    if (this.puzzle.filter((item, idx) => item != null && toZ(idx) == z).length == 9) {
      this.animateGrid(z);
    }
    // row solved
    if (this.puzzle.filter((item, idx) => item != null && toXY(idx).y == y).length == 9) {
      this.animateRow(y);
    }
    // column solved
    if (this.puzzle.filter((item, idx) => item != null && toXY(idx).x == x).length == 9) {
      this.animateColumn(x);
    }
    // number solved
    if (this.puzzle.filter(x => x == number).length == 9) {
      this.animateNumber(number);
    }
    // game solved
    if (this.puzzle.filter(x => x != null).length == 81) {
      this.solved = true;
      this.cells[index].setHighlight(false);
      this.setState({
        index: -1,
      });
      this.props.onFinish && this.props.onFinish();
      InteractionManager.runAfterInteractions(() => {
        this.animateAll();
      });
      return true;
    }
    if (isNumber(this.hightlightNumber))
      this.setHighlight(this.hightlightNumber, false);
    this.setHighlight(number, true);
    this.hightlightNumber = number;

    if (index != this.state.index) return numberSolved;
    this.setState({
      index: -1,
    });

    return true;
  }

  setHighlight(number, highlight) {
    this.puzzle.forEach((item, i) => {
      if (item == number) this.cells[i].setHighlight(highlight);
    })
  }

  initBoard() {
    this.inited = false;
    this.solved = false;
    this.hightlightNumber = null;
    this.hightlightIndex = null;
    let count = 0;
    const numberCount = this.puzzle.filter(x => x != null).length;
    const gap = 150;
    for (let i = 0; i < 81; i++) {
      const number = this.puzzle[i];
      if (isNumber(number)) {
        count++;
        setTimeout((count) => {
          this.cells[i].setNumber(number, this.original[i] == this.puzzle[i]);
          if (count == numberCount) {
            setTimeout(() => {
              this.inited = true;
              this.props.onInit && this.props.onInit();
            }, gap);
          }
        }, 50 * count, count);
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.puzzle || this.original == nextProps.puzzle) {
      this.forceUpdate();
      return;
    }
    this.setState({ index: -1 });
    this.cells.forEach(x => x.reset());
    this.puzzle = nextProps.solve || nextProps.puzzle;
    this.original = nextProps.puzzle;
    this.initBoard();
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState != this.state;
  }

  animateRow(x) {
    line.forEach(i => this.cells[i + x * 9].animate());
  }

  animateColumn(y) {
    line.forEach(i => this.cells[i * 9 + y].animate());
  }

  animateGrid(z) {
    const x = z % 3;
    const y = (z - x) / 3;
    line.forEach(i => {
      const xx = i % 3;
      const yy = (i - xx) / 3;
      const index = xx + yy * 3 * 3 + y * 27 + x * 3;
      this.cells[index].animate()
    });
  }

  animateNumber(number) {
    this.puzzle.forEach((item, i) => {
      if (item == number) this.cells[i].animate();
    });
  }

  animateAll() {
    this.puzzle.forEach((item, i) => {
      this.cells[i].animate();
    });
  }

  render() {
    return (
      <View style={styles.container} >
        <View style={styles.board} >
          <Grid ref={ref => ref && (this.cells = ref.cells)} onPress={this.onCellPress} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: BoardWidth,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#ddd',
    padding: BorderWidth,
  },
  row: {
    position: 'absolute',
    backgroundColor: 'transparent',
    margin: BorderWidth * 2,
    top: 0,
    left: 0,
    width: CellSize * 9 + BorderWidth * 4,
    height: CellSize + BorderWidth,
    borderColor: '#fc0',
    borderWidth: 2,
    borderRadius: BorderWidth,
  },
  column: {
    position: 'absolute',
    backgroundColor: 'transparent',
    margin: BorderWidth * 2,
    top: 0,
    left: 0,
    width: CellSize + BorderWidth,
    height: CellSize * 9 + BorderWidth * 4,
    borderColor: '#fc0',
    borderWidth: 2,
    borderRadius: BorderWidth,
  },
});

export default Board;
