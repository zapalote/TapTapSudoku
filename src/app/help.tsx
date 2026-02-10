import React from 'react';
import { StyleSheet, View, Text, Image, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import Store from '@/lib/storage';
import { Size, CellSize } from '@/constants/layout';

export default function HelpScreen() {
  const onClose = async () => {
    const first = await Store.get('first');
    if (first == null) {
      await Store.set('first', new Date().toDateString());
    }
    // @ts-expect-error global handler
    global.__gameHandlers?.onCloseHelp?.();
    router.navigate('/menu');
  };

  return (
    <View style={styles.modal}>
      <View style={styles.modalContainer}>
        <Image
          style={styles.logo}
          source={require('../../assets/images/tap-tap-sudoku.png')}
        />
        <View style={styles.logo}>
          <Text style={styles.textStyle}>
            CHOOSE THE CELL YOU WANT TO PLAY
          </Text>
          <Text style={styles.textStyle}>
            TAP A NUMBER ONCE TO PENCIL IT
          </Text>
          <Text style={styles.textStyle}>
            TAP TWICE TO LOCK IT
          </Text>
          <Text style={styles.textStyle}>
            BON PLAISIR!
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={onClose}>
          <Image
            style={styles.buttonIcon}
            source={require('../../assets/images/close.png')}
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
  textStyle: {
    fontFamily: Platform.OS === 'ios' ? 'Varela Round' : 'varela',
    fontSize: CellSize / 1.7,
    textAlign: 'center',
    width: CellSize * 7,
    opacity: 0.8,
    marginBottom: CellSize * 0.3,
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
});
