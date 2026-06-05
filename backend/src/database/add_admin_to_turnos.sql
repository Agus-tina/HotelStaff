USE turnos_hotel_casino;

ALTER TABLE turnos
  ADD COLUMN administrador_id INT NULL AFTER id;

UPDATE turnos
SET administrador_id = (
  SELECT id FROM usuarios WHERE rol = 'admin' ORDER BY id LIMIT 1
)
WHERE administrador_id IS NULL;

ALTER TABLE turnos
  MODIFY administrador_id INT NOT NULL;

ALTER TABLE turnos
  ADD CONSTRAINT fk_turnos_administrador
  FOREIGN KEY (administrador_id) REFERENCES usuarios(id) ON DELETE CASCADE;
