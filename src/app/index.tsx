import { useEffect } from 'react';
import { View } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import Store from '@/lib/storage';

export default function AppDispatcher() {
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key) return;

    const first = Store.get('firstTime');
    if (first === null) {
      Store.set('firstTime', new Date().toDateString());
      router.replace({ pathname: '/help', params: { returnTo: '/menu' } });
    } else {
      router.replace('/menu');
    }
  }, [navState?.key]);

  // return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
}
