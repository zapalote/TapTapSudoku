import React, { Component } from 'react';
import { Text, View, StyleSheet, PanResponder } from 'react-native';
import { CellSize } from './GlobalStyle';
import Touchable from './Touchable';
import Circular from './Circular';

const doubleTap = {
  delay: 300
};
const Diam = CellSize * 1.3;

class CircularPadCell extends Component {
  constructor(props) {
    super(props);

    this.handlePanResponderGrant = this.handlePanResponderGrant.bind(this);
    this.myPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: this.handlePanResponderGrant,
    });
    this.prevTouchTimeStamp = 0;
    this.timeout = null;
  }

  timeout = null;
  state = {
    count: this.props.fillCount,
  }

  handlePanResponderGrant() {
    this.handleTaps(1);
    this.prevTouchTimeStamp = Date.now();
  }

  handleTaps = (taps) => {
    const currentTouchTimeStamp = Date.now();
    const dt = currentTouchTimeStamp - this.prevTouchTimeStamp;
    const { delay } = doubleTap;
    let number = this.props.number - 1;

    if( taps > 0 && dt < delay) {
      // there were two taps in short sequence
      this.timeout && clearTimeout(this.timeout);
      if(this.props.board.onPadPress(number, false)){
        this.setState({
          count: this.state.count + 1,
        });
      }
      //this.forceUpdate();
    } else if (taps < 0) {
      // after the delay there was only one tap
      this.props.board.onPadPress(number, true);
    } else {
      // first tap, sleep and call ourselves to check if there is another tap coming
      this.timeout = setTimeout(() => {
        this.handleTaps(-1);
      }, delay);
    }
  }

  //componentWillReceiveProps(nextProps) {
  resetPadCell = (fillCount) => {
    this.setState({
      count: fillCount,
    });
  }

  render() {
    const { number } = this.props;
    const { count } = this.state;
    const fill = count * 11.12;
    const stroke = Diam / 9;
    const disabled = count == 9;
    return (
      <Touchable>
        <Circular size={Diam} width={stroke} fill={fill} rotation={45}
          style={styles.surface} tintColor={'#999'} backgroundColor={'#000'}>
          {
            () => (
              <View style={[styles.padCell, disabled && styles.disabled]} {...this.myPanResponder.panHandlers}>
                <Text style={styles.padText}>{number}</Text>
              </View>
            )
          }
        </Circular>
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  disabled: {
    //backgroundColor: '#eee',
    opacity: 0.3,
  },
  surface: {
    backgroundColor: 'transparent',
    margin: 3,
  },
  padCell: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'transparent',
    width: Diam,
    height: Diam,
    flex: 1,
    justifyContent: 'space-around',
    borderRadius: Diam,
  },
  padText:{
    fontSize: Diam / 1.7,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    backgroundColor: 'transparent',
  }
});

export default CircularPadCell;
