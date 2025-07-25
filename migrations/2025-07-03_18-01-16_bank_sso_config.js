//2025-07-03_18-01-16_bank_sso_config

exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS bank_sso_config (id SERIAL PRIMARY KEY, bank_id INT NOT NULL, openid_configuration_url VARCHAR NOT NULL, client_id VARCHAR NOT NULL, CONSTRAINT fk_bank_id FOREIGN KEY(bank_id) REFERENCES groups(id))',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS bank_sso_config');
};
