//2025-04-07_15-31-49_uuid_for_bank_id

exports.up = async function (db) {
  await db.query(
    'ALTER TABLE groups ADD COLUMN IF NOT EXISTS public_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE',
  );
};

exports.down = function (db) {};
