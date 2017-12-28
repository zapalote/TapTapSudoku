import React, { Component } from 'react';
import { Text, View, StyleSheet, Image, PanResponder } from 'react-native';
import { CellSize } from './GlobalStyle';
import Touchable from './Touchable';

const pad = [1,2,3,4,5,6,7,8,9];
const doubleTap = {
  delay: 200
}

class PadCell extends Component {
  constructor(props) {
		super(props);

		this.myPanResponder = {};
		this.prevTouchTimeStamp = 0;
    this.timeout = null;
		this.handlePanResponderGrant = this.handlePanResponderGrant.bind(this);
	}

  timeout = null;
  state = {
    disabled: false
  }

	componentWillMount() {
    this.setState({
      disabled: this.props.disabled
    });

		this.myPanResponder = PanResponder.create({
			onStartShouldSetPanResponder: (evt, gestureState) => true,
			onPanResponderGrant: this.handlePanResponderGrant,
		});
	}

	handlePanResponderGrant(evt, gestureState) {
    this.handleTaps(1);
    this.prevTouchTimeStamp = Date.now();
  }

  handleTaps(taps){
		const currentTouchTimeStamp = Date.now();
    const dt = currentTouchTimeStamp - this.prevTouchTimeStamp;
		const { delay } = doubleTap;
    let number = this.props.number - 1;

    if( taps > 0 && dt < delay) {
      // there were two taps in short sequence
      this.timeout && clearTimeout(this.timeout);
      this.setState({
        disabled: this.props.board.onPadPress(number, false)
      });
      this.forceUpdate();
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

  componentWillReceiveProps(nextProps) {
    if(nextProps.reset) {
      // after an initing event
      this.setState({ disabled: false });
    }
  }

  render() {
    const { number } = this.props;
    return (
        <Touchable>
          <View style={[styles.padCell, this.state.disabled && styles.disabled]} {...this.myPanResponder.panHandlers}>
            <Text style={styles.padText}>{number}</Text>
          </View>
        </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  disabled: {
    //backgroundColor: '#eee',
    opacity: 0.3,
  },
  padCell: {
    backgroundColor: '#fc0',
    width: CellSize * 1.3,
    height: CellSize * 1.3,
    padding: CellSize / 3.5,
    margin: CellSize / 2.6,
  },
  padText:{
    fontSize: CellSize * 2.6 / 3,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  }
});

export default PadCell;
