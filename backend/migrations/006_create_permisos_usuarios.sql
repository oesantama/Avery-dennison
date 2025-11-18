-- Crear tabla de permisos especiales por usuario
CREATE TABLE IF NOT EXISTS permisos_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'activo',
    puede_ver BOOLEAN DEFAULT FALSE,
    puede_crear BOOLEAN DEFAULT FALSE,
    puede_editar BOOLEAN DEFAULT FALSE,
    puede_borrar BOOLEAN DEFAULT FALSE,
    fecha_control TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_control INTEGER REFERENCES usuarios(id),
    CONSTRAINT unique_usuario_page UNIQUE (usuario_id, page_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_permisos_usuarios_usuario_id ON permisos_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permisos_usuarios_page_id ON permisos_usuarios(page_id);
CREATE INDEX IF NOT EXISTS idx_permisos_usuarios_estado ON permisos_usuarios(estado);

-- Comentarios de la tabla
COMMENT ON TABLE permisos_usuarios IS 'Permisos especiales asignados directamente a usuarios, sobrescriben los permisos del rol';
COMMENT ON COLUMN permisos_usuarios.usuario_id IS 'ID del usuario al que se le asigna el permiso especial';
COMMENT ON COLUMN permisos_usuarios.page_id IS 'ID de la página sobre la que se aplica el permiso';
COMMENT ON COLUMN permisos_usuarios.estado IS 'Estado del permiso: activo o inactivo';
COMMENT ON COLUMN permisos_usuarios.puede_ver IS 'Permiso para ver/consultar la página';
COMMENT ON COLUMN permisos_usuarios.puede_crear IS 'Permiso para crear nuevos registros';
COMMENT ON COLUMN permisos_usuarios.puede_editar IS 'Permiso para editar registros existentes';
COMMENT ON COLUMN permisos_usuarios.puede_borrar IS 'Permiso para eliminar registros';
COMMENT ON COLUMN permisos_usuarios.fecha_control IS 'Fecha de la última modificación';
COMMENT ON COLUMN permisos_usuarios.usuario_control IS 'Usuario que realizó la última modificación';
