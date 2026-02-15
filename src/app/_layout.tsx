import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {

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
