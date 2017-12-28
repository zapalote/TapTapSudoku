'use strict';

import React, { Component } from 'react';
import { StyleSheet, View, Text, } from 'react-native';

class BadMove extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errors: 0,
    };
  }

  onErrorMove() {
    this.setState({ errors: this.state.errors + 1 });
    return this.state.errors;
  }

  reset() {
    this.setState({
      errors: 0,
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState != this.state;
  }

  formatBad() {
    const { errors } = this.state;
    if(errors == 0) return '0';
    let picto = "";
    for(let i=0; i < errors; i++){ picto += '✕'; }
    return picto;
  }

  render() {
    const { style } = this.props;
    return (
      <Text style={[styles.text, style]}>{'BAD '+this.formatBad()}</Text>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '100',
    fontFamily: 'Menlo',
  },
});

export default BadMove;
