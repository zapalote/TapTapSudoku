import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text as RNText } from 'react-native';

export default function RootLayout() {

  // Override default Text props to prevent font scaling and auto resizing
  // Source - https://stackoverflow.com/a/79737227
  const defaultProps = {
    allowFontScaling: false,
    adjustsFontSizeToFit: false
  };

  // @ts-expect-error missing type
  RNText.defaultProps = {
    // @ts-expect-error missing type
    ...(RNText.defaultProps || {}),
    ...defaultProps
  };

  return (
    <SafeAreaProvider>
      <LayoutProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar hidden />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen
              name="menu"
              options={{
                presentation: 'transparentModal',
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="help"
              options={{
                presentation: 'transparentModal',
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="about"
              options={{
                presentation: 'transparentModal',
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                presentation: 'transparentModal',
                animation: 'fade',
              }}
            />
          </Stack>
        </GestureHandlerRootView>
      </LayoutProvider>
    </SafeAreaProvider>
  );
}
