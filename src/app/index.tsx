import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import Store from '@/lib/storage';

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
      router.replace('/help');
    } else {
      router.replace('/game');
    }
  }, [navState?.key]);

  return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
}
