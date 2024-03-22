type GROUP_SETTINGS = {
  DISABLE_OFFLINE_MODE_DEFAULT_DESKTOP?: boolean | null;
  DISABLE_OFFLINE_MODE_DEFAULT_MOBILE?: boolean | null;
  ALLOWED_TO_EXPORT?: boolean | null;
} | null;

type USER_OVERRIDE = {
  allowed_to_export?: boolean | null;
  allowed_offline_desktop?: boolean | null;
  allowed_offline_mobile?: boolean | null;
} | null;

type RESULTING_USER_SETTINGS = {
  allowed_to_export: boolean;
  allowed_offline: boolean;
};

export const getDefaultSettingOrUserOverride = (
  defaultSettings: GROUP_SETTINGS,
  userOverride: USER_OVERRIDE,
  osFamily: string,
): RESULTING_USER_SETTINGS => {
  const allowed_to_export =
    userOverride?.allowed_to_export == null
      ? defaultSettings?.ALLOWED_TO_EXPORT || false
      : userOverride?.allowed_to_export;

  const isDesktop =
    osFamily.toLowerCase() === 'windows' ||
    osFamily.toLowerCase() === 'mac' ||
    osFamily.toLowerCase() === 'linux' ||
    // for backwards compat
    osFamily.indexOf('Windows') === 0 ||
    osFamily.indexOf('Mac') === 0 ||
    osFamily.indexOf('Linux') === 0;

  const allowed_offline_desktop =
    userOverride?.allowed_offline_desktop == null
      ? !defaultSettings?.DISABLE_OFFLINE_MODE_DEFAULT_DESKTOP
      : userOverride?.allowed_offline_desktop;
  const allowed_offline_mobile =
    userOverride?.allowed_offline_mobile == null
      ? !defaultSettings?.DISABLE_OFFLINE_MODE_DEFAULT_MOBILE
      : userOverride?.allowed_offline_mobile;
  const allowed_offline = isDesktop ? allowed_offline_desktop : allowed_offline_mobile;
  return {
    allowed_to_export,
    allowed_offline,
  };
};
