//2022-11-24_19-30-32_fix-shared-account-long-name

exports.up = async function (db) {
  await db.query(
    'ALTER TABLE shared_accounts ALTER COLUMN name TYPE VARCHAR, ALTER COLUMN login TYPE VARCHAR',
  );
};

exports.down = function (db) {
  return;
};
