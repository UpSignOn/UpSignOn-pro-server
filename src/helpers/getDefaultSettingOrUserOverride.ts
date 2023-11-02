type GROUP_SETTINGS = {
  DISABLE_OFFLINE_MODE_DEFAULT_DESKTOP?: boolean | null;
  DISABLE_OFFLINE_MODE_DEFAULT_MOBILE?: boolean | null;
  DISABLE_CSV_EXPORT?: boolean | null;
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
  deviceType: string,
): RESULTING_USER_SETTINGS => {
  const allowed_to_export =
    userOverride?.allowed_to_export == null
      ? !defaultSettings?.DISABLE_CSV_EXPORT
      : userOverride?.allowed_to_export;

  const isDesktop =
    deviceType === 'Windows.Desktop' || deviceType === 'Mac' || deviceType === 'Linux';

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
