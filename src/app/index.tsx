import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import Store from '@/lib/storage';

// This component is responsible for dispatching the initial navigation based on the app state
// It checks if it's the user's first time opening the app and shows a first time help screen if so,
// otherwise it navigates to the main menu
export default function AppDispatcher() {
  const navState = useRootNavigationState();
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (!navState?.key) return;
    if (navigatedRef.current) return;
    navigatedRef.current = true;

    const first = Store.get('firstTime');
    if (first === null) {
      Store.set('firstTime', new Date().toDateString());
      router.replace('/firstTime');
    } else {
      router.replace('/menu');
    }
  }, [navState?.key]);

  return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
}
