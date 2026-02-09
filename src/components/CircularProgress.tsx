import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  size: number;
  width: number;
  fill: number;
  tintColor: string;
  backgroundColor: string;
  style?: ViewStyle;
  children?: (percentage: number) => React.ReactNode;
}

export default function CircularProgress({
  size,
  width: strokeWidth,
  fill,
  tintColor,
  backgroundColor,
  style,
  children,
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, fill));
  const half = size / 2;
  const radius = half - strokeWidth * 0.8;
  const strokeDashes = [2 * Math.PI * radius];
  const strokeOffset = -1 * strokeDashes[0] * (percentage / 100);

  return (
    <View style={style}>
      <View style={{ transform: [{ rotate: '-45deg' }] }}>
        <Svg width={size} height={size}>
          <Circle
            cx={half}
            cy={half}
            r={radius}
            fill="none"
            stroke={tintColor}
            strokeWidth={strokeWidth}
          />
          <Circle
            cx={half}
            cy={half}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDashes.join(',')}
            strokeDashoffset={strokeOffset}
          />
        </Svg>
      </View>
      {children?.(percentage)}
    </View>
  );
}
