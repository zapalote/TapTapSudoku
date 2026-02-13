'use strict';

import React, { Component } from 'react';
import Store from './store';

const LightTheme = {
  dark: false,
  background: '#fff',
  surface: '#f2f2f2',
  boardBackground: '#ddd',
  cellBackground: '#fff',
  cellBorder: '#ccc',
  text: 'black',
  textSecondary: '#6b6b6b',
  fixedText: '#888',
  highlightBorder: '#fc0',
  highlightText: '#c90',
  errorBorder: 'red',
  glowColor: 'darkturquoise',
  pencilText: 'darkturquoise',
  accent: '#fc0',
  padText: '#333',
  padProgress: '#999',
  finishedOverlay: '#fc0',
  modalBackground: '#fff',
  loadingBackground: 'white',
  linkUnderline: '#fc0',
  statusBarStyle: 'dark-content',
};

const DarkTheme = {
  dark: true,
  background: '#1a1a2e',
  surface: '#16213e',
  boardBackground: '#0f3460',
  cellBackground: '#1a1a2e',
  cellBorder: '#0f3460',
  text: '#e0e0e0',
  textSecondary: '#a0a0b0',
  fixedText: '#7a7a8a',
  highlightBorder: '#fc0',
  highlightText: '#e0a000',
  errorBorder: '#ff4444',
  glowColor: '#40e0d0',
  pencilText: '#40e0d0',
  accent: '#fc0',
  padText: '#e0e0e0',
  padProgress: '#555',
  finishedOverlay: '#fc0',
  modalBackground: '#1a1a2e',
  loadingBackground: '#1a1a2e',
  linkUnderline: '#fc0',
  statusBarStyle: 'light-content',
};

const ThemeContext = React.createContext({
  theme: LightTheme,
  toggleTheme: () => {},
});

class ThemeProvider extends Component {
  state = {
    theme: LightTheme,
  };

  async componentDidMount() {
    const isDark = await Store.get('darkMode');
    if (isDark) {
      this.setState({ theme: DarkTheme });
    }
  }

  toggleTheme = async () => {
    const nextTheme = this.state.theme.dark ? LightTheme : DarkTheme;
    this.setState({ theme: nextTheme });
    await Store.set('darkMode', nextTheme.dark);
  };

  render() {
    return (
      <ThemeContext.Provider value={{ theme: this.state.theme, toggleTheme: this.toggleTheme }}>
        {this.props.children}
      </ThemeContext.Provider>
    );
  }
}

export { LightTheme, DarkTheme, ThemeContext, ThemeProvider };
export default ThemeContext;
