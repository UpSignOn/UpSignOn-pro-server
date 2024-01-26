//2024-01-26_10-45-59_cascade_delete_shared_vault_recipients

exports.up = function (db) {
  return db.query(
    'ALTER TABLE shared_vault_recipients DROP CONSTRAINT shared_vault_recipients_group_id_fkey, ADD CONSTRAINT shared_vault_recipients_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};

exports.down = function () {
  return;
};
