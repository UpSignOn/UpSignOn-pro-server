import { GROUP_SETTINGS, USER_SETTINGS_OVERRIDE } from './getDefaultSettingOrUserOverride';

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
  groupSettings: GROUP_SETTINGS,
  userSettings: USER_SETTINGS_OVERRIDE,
  settingName: keyof USER_SETTINGS_OVERRIDE,
): boolean => {
  return userSettings[settingName] != null
    ? !!userSettings[settingName]
    : groupSettings != null && groupSettings[settingName] != null
    ? !!groupSettings[settingName]
    : false;
};

export const isAllowedOnPlatform = (
  osFamily: string,
  groupSettings: GROUP_SETTINGS,
  userSettings: USER_SETTINGS_OVERRIDE,
): boolean => {
  if (isWindows(osFamily)) {
    return _settingResultForUser(groupSettings, userSettings, 'ALLOWED_WINDOWS');
  } else if (isIos(osFamily)) {
    return _settingResultForUser(groupSettings, userSettings, 'ALLOWED_IOS');
  } else if (isAndroid(osFamily)) {
    return _settingResultForUser(groupSettings, userSettings, 'ALLOWED_ANDROID');
  } else if (isMacos(osFamily)) {
    return _settingResultForUser(groupSettings, userSettings, 'ALLOWED_MACOS');
  } else if (isLinux(osFamily)) {
    return _settingResultForUser(groupSettings, userSettings, 'ALLOWED_LINUX');
  } else {
    console.error('isAllowedOnPlatform - unknown osFamily: ', osFamily);
    return false;
  }
};
