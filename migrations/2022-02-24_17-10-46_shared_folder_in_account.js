//2022-02-24_17-10-46_shared_folder_in_account

exports.up = function (db) {
  return db.query(
    'ALTER TABLE shared_accounts ADD COLUMN shared_folder_id INTEGER, ADD CONSTRAINT shared_folder_id_fk FOREIGN KEY(shared_folder_id) REFERENCES shared_folders(id) ON DELETE SET NULL',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE shared_accounts DROP COLUMN shared_folder_id');
};
