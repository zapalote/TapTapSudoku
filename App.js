'use strict';

import React, { Component } from 'react';

import {
  AppRegistry, StyleSheet, StatusBar, UIManager, View
} from 'react-native';

AppRegistry.registerComponent('TapTapSudoku', () => App);

import Main from './containers/Main';

UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);

class App extends Component {
  render() {
    return (
      <View style={styles.container} >
        <StatusBar backgroundColor='transparent' animated={true} translucent={false} barStyle="dark-content"/>
        <Main />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
  },
});

export default App;
