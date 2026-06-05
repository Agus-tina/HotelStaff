CREATE DATABASE IF NOT EXISTS turnos_hotel_casino;
USE turnos_hotel_casino;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  usuario VARCHAR(80) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  rol ENUM('admin', 'empleado') NOT NULL DEFAULT 'empleado',
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tipos_empleado (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuario_tipos_empleado (
  usuario_id INT NOT NULL,
  tipo_empleado_id INT NOT NULL,
  PRIMARY KEY (usuario_id, tipo_empleado_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_empleado_id) REFERENCES tipos_empleado(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  administrador_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  lugar VARCHAR(150) NOT NULL,
  direccion VARCHAR(200) NOT NULL,
  area VARCHAR(100),
  puesto VARCHAR(100) NOT NULL,
  descripcion TEXT,
  cantidad_empleados INT NOT NULL,
  estado ENUM('abierto', 'cubierto', 'modificado', 'cancelado', 'finalizado') NOT NULL DEFAULT 'abierto',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (administrador_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS postulaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  turno_id INT NOT NULL,
  usuario_id INT NOT NULL,
  estado ENUM('pendiente', 'seleccionado', 'rechazado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_postulacion (turno_id, usuario_id),
  FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asignaciones_turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  turno_id INT NOT NULL,
  usuario_id INT NOT NULL,
  estado ENUM('asignado', 'confirmado_asistencia', 'cancelado', 'ausente') NOT NULL DEFAULT 'asignado',
  confirmado_en TIMESTAMP NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_asignacion (turno_id, usuario_id),
  FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notificaciones_email (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destinatario VARCHAR(150) NOT NULL,
  asunto VARCHAR(200) NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  estado ENUM('enviado', 'error') NOT NULL,
  error TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  scope TEXT,
  token_type VARCHAR(50),
  expiry_date BIGINT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS google_calendar_eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  turno_id INT NOT NULL,
  asignacion_id INT NOT NULL,
  event_id VARCHAR(255),
  estado ENUM('creado', 'actualizado', 'cancelado', 'error') NOT NULL,
  error TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
  FOREIGN KEY (asignacion_id) REFERENCES asignaciones_turnos(id) ON DELETE CASCADE
);

INSERT IGNORE INTO tipos_empleado (nombre) VALUES
  ('Mozo'),
  ('Barra'),
  ('Recepcion'),
  ('Limpieza'),
  ('Seguridad'),
  ('Casino'),
  ('Hotel'),
  ('Cocina');
