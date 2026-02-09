const defaultLang = 'en';

const translations: Record<string, Record<string, string>> = {
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
    record: 'Record so far (this level): ',

    error: 'BAD ',
    errors: 'Bad moves ',

    share: 'Share',
    sharemessage: 'tap:tap Sudoku - by players, for players',
    sharefailed: 'Share failed',

    rate: 'Would you mind rating TapTapSudoku?',
    ratemessage: 'Thank you!',
    notnow: 'Not now',
    appstore: 'Yes',
    cancel: 'Cancel',
    confirm: 'Confirm',

    Info: 'This game',
    difficulty: 'Difficulty ',
    manageable: 'MANAGEABLE',
    challenging: 'CHALLENGING',
    impossible: 'IMPOSSIBLE',
    anylevel: 'SURPRISE ME',
  },
};

function txt(key: string, lang?: string): string {
  const ln = lang ?? defaultLang;
  return translations[ln]?.[key] ?? key;
}

const Lang = { txt };
export default Lang;
