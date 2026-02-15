import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Pressable, Linking, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { useGameStore } from '@/store/game-store';
import { Size, CellSize } from '@/constants/layout';
import { useLayout, lockPortrait, unlockOrientation } from '@/hooks/useLayout';
import Lang from '@/lib/language';

export default function MenuScreen() {
  const playing = useGameStore((s) => s.playing);
  const disabled = !playing;
  const { orientation } = useLayout();

  // Menu should always be in portrait mode, even if the game is in landscape
  useEffect(() => {
    lockPortrait();

    return () => {
      unlockOrientation();
    };
  }, []);

  const onResume = () => {
    // @ts-expect-error global handler
    global.__gameHandlers?.onResume?.();
    router.back();
  };

  const onRestart = () => {
    // @ts-expect-error global handler
    global.__gameHandlers?.onRestart?.();
    router.back();
  };

  const onCreate = () => {
    // @ts-expect-error global handler
    global.__gameHandlers?.onCreate?.();
    router.back();
  };

  const onRate = () => {
    const link =
      Platform.OS === 'android'
        ? 'https://play.google.com/store/apps/details?id=com.zapalote.taptapsudoku'
        : 'itms-apps://itunes.apple.com/us/app/taptapsudoku/id1320628951?mt=8';
    Alert.alert(Lang.txt('rate'), Lang.txt('ratemessage'), [
      { text: Lang.txt('notnow') },
      { text: Lang.txt('appstore'), onPress: () => Linking.openURL(link) },
    ]);
  };

  return (
    <View style={styles.modal}>
      <View style={styles.modalContainer}>
        <Image
          style={styles.logo}
          source={require('../../assets/images/tap-tap-sudoku.png')}
        />
        <View style={styles.textBlock}>
          <Pressable disabled={disabled} onPress={onResume}>
            <Image
              style={[styles.buttonMenu, disabled && styles.disabled]}
              source={require('../../assets/images/continue.png')}
            />
          </Pressable>
          <Pressable disabled={disabled} onPress={onRestart}>
            <Image
              style={[styles.buttonMenu, disabled && styles.disabled]}
              source={require('../../assets/images/restart.png')}
            />
          </Pressable>
          <Pressable onPress={onCreate}>
            <Image
              style={styles.buttonMenu}
              source={require('../../assets/images/newgame.png')}
            />
          </Pressable>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable
          style={styles.button}
          onPress={() => router.push('/about')}
        >
          <Image
            style={styles.buttonIcon}
            source={require('../../assets/images/about.png')}
          />
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={() => router.push('/help')}
        >
          <Image
            style={styles.buttonIcon}
            source={require('../../assets/images/help.png')}
          />
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={() => router.push('/settings')}
        >
          <Image
            style={styles.buttonIcon}
            source={require('../../assets/images/settings.png')}
          />
        </Pressable>
        <Pressable style={styles.button} onPress={onRate}>
          <Image
            style={styles.buttonIcon}
            source={require('../../assets/images/rate.png')}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    alignItems: 'center',
    alignSelf: 'center',
    width: CellSize * 6.5,
    height: CellSize * 6.5,
    marginBottom: CellSize * 0.3,
  },
  textBlock: {
    alignItems: 'center',
    alignSelf: 'center',
    width: CellSize * 6.5,
    marginBottom: CellSize * 0.3,
  },
  buttonMenu: {
    width: CellSize * 6,
    height: 50,
  },
  footer: {
    flexDirection: 'row',
    marginBottom: CellSize / 1.7,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  button: {
    padding: Size.height > 500 ? 10 : 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    width: CellSize,
    height: CellSize,
  },
  disabled: {
    opacity: 0.5,
  },
});
