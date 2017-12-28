//https://github.com/bgryszko/react-native-circular-progress.git
// from Bart Gryszko

import React from 'react';
import { View, Platform } from 'react-native';
import { Surface, Shape, Path, Group } from '../node_modules/react-native/Libraries/ART/ReactNativeART';

export default class Circular extends React.Component {

  circlePath(cx, cy, r, startDegree, endDegree) {

    let p = Path();
    p.path.push(0, cx + r, cy);
    p.path.push(4, cx, cy, r, startDegree * Math.PI / 180, endDegree * Math.PI / 180, 1);
    return p;
  }

  extractFill(fill) {
    if (fill < 0.01) {
      return 0;
    } else if (fill > 100) {
      return 100;
    }

    return fill;
  }

  render() {
    const { size, width, tintColor, backgroundColor, style, rotation, linecap, children } = this.props;
    const backgroundPath = this.circlePath(size / 2, size / 2, size / 2 - width / 2, 0, 360 * .9999);

    const fill = this.extractFill(this.props.fill);
    const opacity = 1; //(fill == 0)? 1 : 1.0 - fill/100;
    const circlePath = this.circlePath(size / 2, size / 2, size / 2 - width / 2, 0, (360 * .9999) * fill / 100);

    return (
      <View style={style}>
        <Surface
          width={size}
          height={size}>
          <Group rotation={rotation - 90} originX={size/2} originY={size/2}>
             <Shape d={backgroundPath}
                  opacity={opacity}
                  stroke={backgroundColor}
                  strokeWidth={width}/>
             <Shape d={circlePath}
                   opacity={opacity}
                   stroke={tintColor}
                   strokeWidth={width}
                   strokeCap={linecap}/>
          </Group>
        </Surface>
        {
          children && children(fill)
        }
      </View>
    )
  }
}

Circular.defaultProps = {
  tintColor: 'black',
  backgroundColor: '#fc0',
  rotation: 90,
  linecap: 'butt'
}
