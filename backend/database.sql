-- Active: 1775610264034@@127.0.0.1@5432@gestor_tareas
-- ============================================================
-- Gestor de Tareas Colaborativo — Script DDL + DML
-- Módulo 5: Base de Datos Relacionales
-- ============================================================

-- Crear la base de datos
CREATE DATABASE gestor_tareas
  WITH ENCODING 'UTF8'
  LC_COLLATE = 'es_CL.UTF-8'
  LC_CTYPE   = 'es_CL.UTF-8'
  TEMPLATE   = template0;

\c gestor_tareas;

-- ─── DDL: Definición de tablas ───────────────────────────────────────────────

CREATE TYPE rol_usuario   AS ENUM ('administrador', 'usuario');
CREATE TYPE estado_tarea  AS ENUM ('pendiente', 'en_progreso', 'completada', 'cancelada');
CREATE TYPE prioridad_tarea AS ENUM ('baja', 'media', 'alta', 'urgente');

CREATE TABLE usuarios (
  id          SERIAL          PRIMARY KEY,
  nombre      VARCHAR(100)    NOT NULL CHECK (length(trim(nombre)) >= 2),
  email       VARCHAR(150)    NOT NULL UNIQUE,
  password    VARCHAR(255)    NOT NULL,
  rol         rol_usuario     NOT NULL DEFAULT 'usuario',
  activo      BOOLEAN         NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE tareas (
  id                 SERIAL           PRIMARY KEY,
  titulo             VARCHAR(200)     NOT NULL CHECK (length(trim(titulo)) >= 3),
  descripcion        TEXT,
  estado             estado_tarea     NOT NULL DEFAULT 'pendiente',
  prioridad          prioridad_tarea  NOT NULL DEFAULT 'media',
  fecha_vencimiento  DATE,
  creador_id         INT              NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  asignado_id        INT              REFERENCES usuarios(id) ON DELETE SET NULL,
  "createdAt"        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Índices para mejorar rendimiento en consultas frecuentes
CREATE INDEX idx_tareas_estado      ON tareas(estado);
CREATE INDEX idx_tareas_prioridad   ON tareas(prioridad);
CREATE INDEX idx_tareas_creador     ON tareas(creador_id);
CREATE INDEX idx_tareas_asignado    ON tareas(asignado_id);

-- ─── DML: Consultas de ejemplo (Módulo 5) ────────────────────────────────────

-- Crear usuario administrador (password debe hashearse desde la app; esto es de ejemplo)
INSERT INTO usuarios (nombre, email, password, rol)
VALUES ('Admin Sistema', 'admin@gestor.cl', '$2a$10$ejemplo_hash_bcrypt', 'administrador');

INSERT INTO usuarios (nombre, email, password, rol)
VALUES ('Ana Torres', 'ana@gestor.cl', '$2a$10$ejemplo_hash_bcrypt', 'usuario'),
       ('Carlos Vega', 'carlos@gestor.cl', '$2a$10$ejemplo_hash_bcrypt', 'usuario');

-- Crear tareas de ejemplo
INSERT INTO tareas (titulo, descripcion, estado, prioridad, creador_id, asignado_id)
VALUES
  ('Diseñar maqueta del dashboard', 'Incluir gráficos y tabla de tareas', 'en_progreso', 'alta', 1, 2),
  ('Configurar base de datos', 'Crear tablas y relaciones en PostgreSQL', 'completada', 'urgente', 1, 1),
  ('Implementar autenticación JWT', 'Login, registro y rutas protegidas', 'pendiente', 'alta', 1, 3);

-- Consultar todas las tareas con sus usuarios (JOIN)
SELECT
  t.id,
  t.titulo,
  t.estado,
  t.prioridad,
  t.fecha_vencimiento,
  u1.nombre AS creador,
  u2.nombre AS asignado
FROM tareas t
JOIN usuarios u1 ON t.creador_id = u1.id
LEFT JOIN usuarios u2 ON t.asignado_id = u2.id
ORDER BY t."createdAt" DESC;

-- Consultar tareas de un usuario específico
SELECT t.titulo, t.estado, t.prioridad
FROM tareas t
WHERE t.asignado_id = 2;

-- Actualizar estado de una tarea
UPDATE tareas
SET estado = 'completada', "updatedAt" = NOW()
WHERE id = 1;

-- Eliminar una tarea
DELETE FROM tareas WHERE id = 3;

-- Resumen estadístico de tareas por estado
SELECT estado, COUNT(*) AS cantidad
FROM tareas
GROUP BY estado
ORDER BY cantidad DESC;
