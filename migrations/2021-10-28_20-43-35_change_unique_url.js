//2021-10-28_20-43-35_change_unique_url

exports.up = async function (db) {
  await db.query('ALTER TABLE url_list DROP CONSTRAINT IF EXISTS url_list_displayed_name_key');
};

exports.down = async function (db) {};
