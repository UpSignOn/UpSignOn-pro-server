//2025-02-21_10-13-42_clean_db

exports.up = async function (db) {
  await db.query(
    "UPDATE user_devices SET os_family='android' WHERE device_type='Android' AND os_family is null",
  );
  await db.query(
    "UPDATE user_devices SET os_family='macos' WHERE device_type='Mac' AND os_family is null",
  );
  await db.query(
    "UPDATE user_devices SET os_family='ios' WHERE device_type='iPhone' AND os_family is null",
  );
  await db.query(
    "UPDATE user_devices SET os_family='ios' WHERE device_type='iPad' AND os_family is null",
  );
  await db.query(
    "UPDATE user_devices SET os_family='ios' WHERE device_type='iOS' AND os_family is null",
  );
  await db.query(
    "UPDATE user_devices SET os_family='windows' WHERE device_type='Windows.Desktop' AND os_family is null",
  );
  await db.query(
    "UPDATE user_devices SET os_family='windows' WHERE device_type='Windows.Server' AND os_family is null",
  );
  await db.query(
    "UPDATE user_devices SET os_family='android' WHERE os_version LIKE '%android%' AND os_family is null",
  );
  await db.query(
    "DELETE FROM user_devices WHERE device_name='Extension de navigateur' AND app_version='N/A'",
  );
  await db.query(
    "DELETE FROM user_devices WHERE app_version ~ '^[123456]\..*' AND authorization_status != 'AUTHORIZED'",
  );
  await db.query(
    "DELETE FROM user_devices WHERE app_version ~ '^[123456]\..*' AND encrypted_password_backup_2 is null",
  );
  await db.query(
    "DELETE FROM user_devices AS ud WHERE ud.app_version ~ '^[123456]\..*' AND (SELECT COUNT(*) FROM user_devices AS dd WHERE dd.user_id=ud.user_id AND dd.authorization_status='AUTHORIZED' AND dd.app_version ~ '^7\..*') > 0",
  );
};

exports.down = function (db) {
  return;
};
