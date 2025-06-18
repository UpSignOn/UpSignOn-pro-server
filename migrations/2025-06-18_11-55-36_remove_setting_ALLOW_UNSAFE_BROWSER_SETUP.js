//2025-06-18_11-55-36_remove_setting_ALLOW_UNSAFE_BROWSER_SETUP

exports.up = function (db) {
  // remove the key ALLOW_UNSAFE_BROWSER_SETUP from all group settings
  return db.query("UPDATE groups SET settings=to_jsonb(settings) - 'ALLOW_UNSAFE_BROWSER_SETUP'");
};

exports.down = function (db) {
  return;
};
