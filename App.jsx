import { StatusBar, View } from 'react-native';
import Main from './containers/Main';

export default function Index() {

  return (
    <View>
      <StatusBar backgroundColor="transparent" animated={true} translucent={false} barStyle="dark-content" />
      <Main />
    </View>
  );
}
