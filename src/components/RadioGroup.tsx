import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable, View, type TextStyle } from 'react-native';

interface RadioButtonData {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  color: string;
  size: number;
  layout?: 'column' | 'row';
  [key: string]: unknown;
}

interface RadioGroupProps {
  radioButtons: RadioButtonData[];
  onPress: (radioButtons: RadioButtonData[]) => void;
  style?: TextStyle;
  heading?: string;
  headingStyle?: TextStyle;
  flexDirection?: 'row' | 'column';
}

function RadioButton({
  data,
  onPress,
  style,
}: {
  data: RadioButtonData;
  onPress: (label: string) => void;
  style?: TextStyle;
}) {
  const opacity = data.disabled ? 0.2 : 1;
  const layout = data.layout === 'column'
    ? { alignItems: 'center' as const }
    : { flexDirection: 'row' as const };
  const margin = data.layout === 'column'
    ? { marginTop: 10 }
    : { marginLeft: 10 };

  return (
    <Pressable
      style={[layout, { opacity, marginHorizontal: 10, marginVertical: 10 }]}
      onPress={() => {
        if (!data.disabled) onPress(data.label);
      }}
    >
      <View
        style={[
          styles.border,
          {
            borderColor: data.color,
            width: data.size,
            height: data.size,
            borderRadius: data.size / 2,
            alignSelf: 'center',
          },
        ]}
      >
        {data.selected && (
          <View
            style={{
              backgroundColor: data.color,
              width: data.size / 2.5,
              height: data.size / 2.5,
              borderRadius: data.size / 2.5,
            }}
          />
        )}
      </View>
      <Text style={[{ alignSelf: 'center' }, margin, style]}>{data.label}</Text>
    </Pressable>
  );
}

export default function RadioGroup({
  radioButtons,
  onPress,
  style,
  heading,
  headingStyle,
  flexDirection,
}: RadioGroupProps) {
  const handlePress = useCallback(
    (label: string) => {
      const selectedIndex = radioButtons.findIndex(e => e.selected === true);
      const selectIndex = radioButtons.findIndex(e => e.label === label);
      if (selectedIndex !== selectIndex) {
        const updated = radioButtons.map((btn, idx) => ({
          ...btn,
          selected: idx === selectIndex,
        }));
        onPress(updated);
      }
    },
    [radioButtons, onPress]
  );

  return (
    <View style={styles.container}>
      <View style={{ flexDirection }}>
        {heading && (
          <Text style={[style, headingStyle]}>{heading}</Text>
        )}
        {radioButtons.map(data => (
          <RadioButton
            key={data.label}
            data={data}
            onPress={handlePress}
            style={style}
          />
        ))}
      </View>
    </View>
  );
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
