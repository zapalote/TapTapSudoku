import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Store from '@/lib/storage';

export default function AppDispatcher() {
  useEffect(() => {
    const first = Store.get('firstTime');
    if (first === null) {
      Store.set('firstTime', new Date().toDateString());
      router.replace({ pathname: '/game', params: { firstTime: 'true' } });
    } else {
      router.replace('/game');
    }
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
}
