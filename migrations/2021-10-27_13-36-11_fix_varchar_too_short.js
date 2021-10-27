//2021-10-27_13-36-11_fix_varchar_too_short

exports.up = async function (db) {
  await db.query(
    'ALTER TABLE url_list ALTER COLUMN signin_url TYPE TEXT, ALTER COLUMN password_change_url TYPE TEXT',
  );
  await db.query('ALTER TABLE shared_accounts ALTER COLUMN url TYPE TEXT');
};

exports.down = function (db) {
  return db.query();
};
