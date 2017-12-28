'use strict';

import I18n from 'react-native-i18n';

I18n.fallbacks = true;

I18n.translations = {
  en: {
    name: 'tap:tap Sudoku',
    continue: 'Continue ',
    restart: 'Restart  ',
    newgame: 'New Game ',
    norecord: 'No records yet',

    ok: 'Got it',
    congrats: 'Congrats',
    success: 'You solved this game in\n',
    newrecord: 'New record! You solved this game in\n',

    error: 'Error',

    share: 'Share',
    sharemessage: 'tap:tap Sudoku - by players, for players',
    sharefailed: 'Share failed',

    rate: 'Rate this app',
    ratemessage: 'Thanks for your rating!',
    notnow: 'Not now',
    appstore: 'Yes',
    cancel: 'Cancel',
    confirm: 'Confirm',

    Info: 'This game',
    difficulty: 'Master difficulty ',
    errors: 'Bad moves ',
  },
};

export default I18n;
