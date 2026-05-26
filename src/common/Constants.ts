export const LIST_NAMES = {
  LUNCH_REQUEST: 'Lunch Request',
  HIGHER_OFFICIAL: 'HigherOfficial',
};

export const TIME_CONFIG = {
  SUBMIT_START_HOUR: 16,   // 4:00 PM — evening window opens (submit for tomorrow)
  SUBMIT_END_HOUR: 12,     // 12:00 PM — morning window closes (submit for today)
  DELETE_WITHIN_HOURS: 16, // item can be deleted within 16 hours of creation
};

export type ScreenType = 'home' | 'feedback';
