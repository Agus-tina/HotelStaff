ALTER TABLE usuarios
  ADD COLUMN google_id VARCHAR(255) UNIQUE AFTER password,
  ADD COLUMN avatar_url VARCHAR(500) AFTER google_id;
