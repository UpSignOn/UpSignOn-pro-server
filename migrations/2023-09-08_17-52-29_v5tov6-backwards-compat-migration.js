//2023-09-08_17-52-29_v5tov6-backwards-compat-migration

exports.up = function(db) {
  return db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS encrypted_data_2 TEXT").then(()=>{
    return db.query("UPDATE USERS SET encrypted_data_2=encrypted_data, encrypted_data=null WHERE starts_with(encrypted_data, 'formatP002-')")
  });
}

exports.down = function(db) {
  return db.query("ALTER TABLE users DROP COLUMN encrypted_data_2");
}
