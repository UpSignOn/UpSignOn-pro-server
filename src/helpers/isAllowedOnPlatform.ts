import { BANK_SETTINGS, USER_SETTINGS_OVERRIDE } from './getDefaultSettingOrUserOverride';

const isWindows = (osFamily: string) => {
  if (osFamily.toLowerCase().indexOf('win32') >= 0) {
    // deprecated check
    return true;
  }
  return osFamily.toLowerCase().indexOf('windows') >= 0;
};

const isIos = (osFamily: string) => {
  if (
    osFamily.toLowerCase().indexOf('iphone') >= 0 ||
    osFamily.toLowerCase().indexOf('ipad') >= 0
  ) {
    // deprecated check
    return true;
  }
  return osFamily.toLowerCase().indexOf('ios') >= 0;
};

const isAndroid = (osFamily: string) => {
  return osFamily.toLowerCase().indexOf('android') >= 0;
};

const isMacos = (osFamily: string) => {
  if (osFamily.toLowerCase().indexOf('mac') >= 0) {
    // deprecated check
    return true;
  }
  return osFamily.toLowerCase().indexOf('macos') >= 0;
};

const isLinux = (osFamily: string) => {
  return osFamily.toLowerCase().indexOf('linux') >= 0;
};
const _settingResultForUser = (
  groupSettings: BANK_SETTINGS,
  userSettings: USER_SETTINGS_OVERRIDE,
  settingName: keyof USER_SETTINGS_OVERRIDE,
  defaultResult: boolean,
): boolean => {
  const userParam = userSettings?.[settingName];
  const groupParam = groupSettings?.[settingName];
  if (userParam === true) return true;
  if (userParam === false) return false;
  // userParam is null or undefined
  if (groupParam === true) return true;
  if (groupParam === false) return false;
  // groupParam is also null or undefined
  return defaultResult;
};

export const isAllowedOnPlatform = (
  osFamily: string,
  groupSettings: BANK_SETTINGS,
  userSettings: USER_SETTINGS_OVERRIDE,
): boolean => {
  const defaultAllowed = true;
  if (isWindows(osFamily)) {
    return _settingResultForUser(groupSettings, userSettings, 'ALLOWED_WINDOWS', defaultAllowed);
  } else if (isIos(osFamily)) {
    return _settingResultForUser(groupSettings, userSettings, 'ALLOWED_IOS', defaultAllowed);
  } else if (isAndroid(osFamily)) {
    return _settingResultForUser(groupSettings, userSettings, 'ALLOWED_ANDROID', defaultAllowed);
  } else if (isMacos(osFamily)) {
    return _settingResultForUser(groupSettings, userSettings, 'ALLOWED_MACOS', defaultAllowed);
  } else if (isLinux(osFamily)) {
    return _settingResultForUser(groupSettings, userSettings, 'ALLOWED_LINUX', defaultAllowed);
  } else {
    console.error('isAllowedOnPlatform - unknown osFamily: ', osFamily);
    return false;
  }
};
