// Thakur Ballary
// https://github.com/ThakurBallary/react-native-radio-buttons-group

import React, { Component } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default class RadioGroup extends Component {

  onPress = (label) => {
    const { radioButtons } = this.props;
    const selectedIndex = radioButtons.findIndex(e => e.selected == true);
    const selectIndex = radioButtons.findIndex(e => e.label == label);
    if (selectedIndex != selectIndex) {
      radioButtons[selectedIndex].selected = false;
      radioButtons[selectIndex].selected = true;
      this.props.onPress(radioButtons);
    }
  };

  render() {
    const textStyle = this.props.style;
    const { radioButtons } = this.props;

    return (
      <View style={styles.container}>
        <View style={{ flexDirection: this.props.flexDirection }}>
          <Text style={[textStyle, this.props.headingStyle]} >{this.props.heading}</Text>
          {radioButtons.map(data => (
            <RadioButton
              key={data.label}
              data={data}
              onPress={this.onPress}
              style={textStyle}
            />
          ))}
        </View>
      </View>
    );
  }
}

class RadioButton extends Component {

  render() {
    const textStyle = this.props.style;
    const data = this.props.data;
    const opacity = data.disabled ? 0.2 : 1;
    let layout = { flexDirection: 'row' };
    let margin = { marginLeft: 10 };
    if (data.layout === 'column') {
      layout = { alignItems: 'center' };
      margin = { marginTop: 10 };
    }
    return (
      <TouchableOpacity
        style={[layout, { opacity, marginHorizontal: 10, marginVertical: 10 }]}
        onPress={() => {
          data.disabled ? null : this.props.onPress(data.label);
        }}>
        <View
          style={[
            styles.border,
            {
              borderColor: data.color,
              width: data.size,
              height: data.size,
              borderRadius: data.size / 2,
              alignSelf: 'center'
            },
          ]}>
          {data.selected &&
            <View
              style={{
                backgroundColor: data.color,
                width: data.size / 2.5,
                height: data.size / 2.5,
                borderRadius: data.size / 2.5,
              }}
            />}
        </View>
        <Text style={[{ alignSelf: 'center' }, margin, textStyle]}>{data.label}</Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  border: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
