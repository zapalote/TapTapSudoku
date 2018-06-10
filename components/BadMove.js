'use strict';

import React, { Component } from 'react';
import { StyleSheet, Text } from 'react-native';
import { isNumber, I18n } from '../utils';

class BadMove extends Component {

  state = {
    errors: 0,
  };

  onBadMove() {
    this.setState({ errors: this.state.errors + 1 });
  }

  reset(n) {
    if(!isNumber(n)) n = 0;
    this.setState({
      errors: n,
    });
  }

  formatBad(errors) {
    if(errors == 0 || errors > 4)
      return errors.toString();

    return '✕'.repeat(errors);
  }

  render() {
    const { style } = this.props;
    const { errors } = this.state;
    return (
      <Text style={[styles.text, style]}>{I18n.t('error')+this.formatBad(errors)}</Text>
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
