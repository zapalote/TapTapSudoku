'use strict';

import React, { Component } from 'react';
import { Animated, InteractionManager, StyleSheet, View } from 'react-native';
import { CellSize, BoardWidth, BorderWidth } from './GlobalStyle';
import Grid from './Grid';
import { sudoku, isNumber, Store } from '../utils';

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
    solved: false,
    fadeIn: new Animated.Value(0),
  }
  game = [];
  cells = [];
  puzzle = [];
  hightlightNumber = null;
  glowNumber = null;
  glowTimeout = null;
  errTimeout = null;
  hightlightIndex = null;
  inited = false;

  constructor(props) {
    super(props);

    this.resetGame(this.props.game);
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.reset;
  }

  resetGame = (game) => {
    this.cells && this.cells.forEach(x => x.reset());
    this.game = game;
    if(game) {
      this.initBoard();
    }
  }

  initBoard() {
    this.inited = false;
    this.setState({ solved: false });
    this.hightlightNumber = null;
    this.hightlightIndex = null;

    let count = 0;
    this.puzzle = new Array(81);
    this.game.forEach( (cell) => {
      if(!cell) return;
      count++;
      let i = cell.idx;
      setTimeout( () => {
        switch(cell.type){
        case "F":
          this.cells[i].setNumber(cell.n, true);
          this.puzzle[i] = cell.n;
          break;
        case "N":
          this.cells[i].setNumber(cell.n, false);
          this.puzzle[i] = cell.n;
          break;
        case "H":
          JSON.parse(cell.h).forEach((item) => {
            if(isNumber(item))
              this.cells[i].setHintNumber(item);
          });
          break;
        }
      }, 50 * count, count);
    });
    this.inited = true;
    this.props.onInit && this.props.onInit();
  }

  storeGame = (type, index, number, hints) => {
    switch(type){
    case 'N':
    case 'F':
      this.game[index] = { idx:index, n:number, type:type };
      break;
    case 'H':
      this.game[index] =  { idx:index, h:JSON.stringify(hints.slice()), type:type };
      break;
    }
    Store.set('board', this.game);
    this.props.storeElapsed && this.props.storeElapsed();
  }

  onCellPress = (index, number) => {
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
      //LayoutAnimation.easeInEaseOut();
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
      // highlight number
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
      let hints = this.cells[index].setHintNumber(number);
      if(isNumber(this.glowNumber) && this.glowNumber != number){
        this.setGlow(this.glowNumber, false);
      }
      this.setGlow(number, true);
      this.storeGame('H', index, null, hints);
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
      this.setError(index, true);
      collision.forEach(i => this.cells[i].setHighlight(true));
      setTimeout(() => {
        collision.forEach(i => this.cells[i].setHighlight(false));
      }, 800);
      this.props.onErrorMove && this.props.onErrorMove();
      return false;
    }
    let test = this.puzzle.slice();
    test[index] = number;
    if (!sudoku.solvepuzzle(test)) {
      // no collisions, still a bad move
      this.setError(index, true);
      setTimeout(() => {
        this.props.onErrorMove && this.props.onErrorMove();
      }, 300);
      return false;
    }

    // lock the number
    this.cells[index].setNumber(number, false);
    this.puzzle[index] = number;
    this.storeGame('N', index, number);

    // remove any hints on the same grid, column or row
    this.cells.forEach((item, idx) => {
      if (item == null) return false;
      const pos = toXY(idx);
      if (pos.x == x || pos.y == y || toZ(idx) == z){
        let hints = this.cells[idx].removeHint(number);
        if(this.game[idx] && this.game[idx].type == 'H')
          this.storeGame('H', idx, null, hints);
      }
    });

    // game solved
    if (this.puzzle.filter(x => x != null).length == 81) {
      this.cells[index].setHighlight(false);
      this.stopIt();
      return true;
    }
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
      this.puzzle.forEach((item, i) => {
        if (item == number) this.cells[i].animate();
      });
    }
    // cell solved
    if (isNumber(this.hightlightNumber))
      this.setHighlight(this.hightlightNumber, false);
    this.setHighlight(number, true);
    this.hightlightNumber = number;

    if (index != this.state.index) return true;
    this.setState({
      index: -1,
    });

    return true;
  }

  setHighlight(number, highlight) {
    this.puzzle.forEach((item, i) => {
      if (isNumber(item) && item == number) {
        this.cells[i].setHighlight(highlight);
      }
    });
  }

  setError(index, toggle){
    clearTimeout(this.errTimeout);
    this.cells[index].setError(toggle);
    if(toggle){
      this.errTimeout = setTimeout(() => {
        this.setError(index, false);
      }, 1000);
    }
  }

  setGlow(number, glow) {
    this.puzzle.forEach((item, i) => {
      if (isNumber(item) && item == number) {
        this.cells[i].setGlow(glow);
      }
    });
    clearTimeout(this.glowTimeout);
    if(glow){
      this.glowNumber = number;
      this.glowTimeout = setTimeout(() => {
        this.setGlow(number, false);
      }, 2000);
    } else {
      this.glowNumber = null;
    }
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
      this.cells[index].animate();
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

  stopIt(){
    this.setState({
      index: -1,
      solved: true,
    }, () => {
      Animated.timing(this.state.fadeIn, { 
        toValue: 0.4,
        duration: 500,
        useNativeDriver: true,
      }).start();
      this.props.onFinish && this.props.onFinish();
    });
  }
  
  render() {
    const { solved, fadeIn } = this.state;
    const fadedStyle = {
      opacity: fadeIn
    }
    return (
      <View style={styles.container} >
        <View style={styles.board} >
          <Animated.View style={[styles.finished, solved&&fadedStyle]} >
            <Grid ref={ref => ref && (this.cells = ref.cells)} onPress={this.onCellPress} />
          </Animated.View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  finished: {
    backgroundColor: '#fc0',
    zIndex: 999,
  },
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    width: BoardWidth,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#ddd',
    padding: BorderWidth,
  },
  // row: {
  //   position: 'absolute',
  //   backgroundColor: 'transparent',
  //   margin: BorderWidth * 2,
  //   top: 0,
  //   left: 0,
  //   width: CellSize * 9 + BorderWidth * 4,
  //   height: CellSize + BorderWidth,
  //   borderColor: '#fc0',
  //   borderWidth: 2,
  //   borderRadius: BorderWidth,
  // },
  // column: {
  //   position: 'absolute',
  //   backgroundColor: 'transparent',
  //   margin: BorderWidth * 2,
  //   top: 0,
  //   left: 0,
  //   width: CellSize + BorderWidth,
  //   height: CellSize * 9 + BorderWidth * 4,
  //   borderColor: '#fc0',
  //   borderWidth: 2,
  //   borderRadius: BorderWidth,
  // },
});

export default Board;
