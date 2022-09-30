//2022-09-30_11-39-47_add-group-creation-date

exports.up = function (db) {
  return db.query(
    'ALTER TABLE groups ADD COLUMN IF NOT EXISTS created_at timestamp WITH TIME ZONE DEFAULT current_timestamp(0), ADD COLUMN IF NOT EXISTS nb_licences_sold INTEGER DEFAULT 0',
  );
};

exports.down = function (db) {
  return;
};
