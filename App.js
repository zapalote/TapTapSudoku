'use strict';

import React, { Component } from 'react';

import {
  AppRegistry, StyleSheet, StatusBar, UIManager, View
} from 'react-native';

AppRegistry.registerComponent('TapTapSudoku', () => App);

import Main from './containers/Main';
import { ThemeProvider, ThemeContext } from './utils/ThemeContext';

UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);

class App extends Component {
  static contextType = ThemeContext;

  render() {
    return (
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    );
  }
}

class AppContent extends Component {
  static contextType = ThemeContext;

  render() {
    const { theme } = this.context;
    return (
      <View style={styles.container} >
        <StatusBar backgroundColor='transparent' animated={true} translucent={false} barStyle={theme.statusBarStyle}/>
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
