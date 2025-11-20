-- ✅ SEGURIDAD: Schema actualizado sin contraseñas hardcoded
-- Para crear el usuario admin, ejecute: python backend/init_admin.py

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'activo' NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    nombre_display VARCHAR(100) NOT NULL,
    ruta VARCHAR(200) NOT NULL,
    icono VARCHAR(50),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    numero_celular VARCHAR(20),
    rol_id INTEGER REFERENCES roles(id),
    creado_por INTEGER REFERENCES usuarios(id),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permisos_rol (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
    puede_ver BOOLEAN DEFAULT FALSE NOT NULL,
    puede_crear BOOLEAN DEFAULT FALSE NOT NULL,
    puede_editar BOOLEAN DEFAULT FALSE NOT NULL,
    puede_eliminar BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rol_id, page_id)
);

CREATE TABLE IF NOT EXISTS permisos_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
    page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
    puede_ver BOOLEAN,
    puede_crear BOOLEAN,
    puede_editar BOOLEAN,
    puede_eliminar BOOLEAN,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, page_id)
);

CREATE TABLE IF NOT EXISTS operaciones_diarias (
    id SERIAL PRIMARY KEY,
    fecha_operacion DATE NOT NULL,
    cantidad_vehiculos_solicitados INTEGER NOT NULL,
    observacion TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehiculos_operacion (
    id SERIAL PRIMARY KEY,
    operacion_id INTEGER REFERENCES operaciones_diarias(id) ON DELETE CASCADE,
    placa VARCHAR(20) NOT NULL,
    hora_inicio TIME,
    observacion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(operacion_id, placa)
);

CREATE TABLE IF NOT EXISTS entregas (
    id SERIAL PRIMARY KEY,
    vehiculo_operacion_id INTEGER REFERENCES vehiculos_operacion(id) ON DELETE CASCADE,
    numero_factura VARCHAR(50) NOT NULL,
    cliente VARCHAR(200),
    observacion TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'cumplido')),
    fecha_operacion DATE NOT NULL,
    fecha_cumplido TIMESTAMP,
    usuario_cumplido_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fotos_evidencia (
    id SERIAL PRIMARY KEY,
    entrega_id INTEGER REFERENCES entregas(id) ON DELETE CASCADE,
    ruta_archivo VARCHAR(500) NOT NULL,
    nombre_archivo VARCHAR(200),
    tipo_mime VARCHAR(100),
    tamano_bytes INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ ÍNDICES para mejorar performance
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_roles_nombre ON roles(nombre);
CREATE INDEX IF NOT EXISTS idx_pages_nombre ON pages(nombre);
CREATE INDEX IF NOT EXISTS idx_permisos_rol_rol_id ON permisos_rol(rol_id);
CREATE INDEX IF NOT EXISTS idx_permisos_rol_page_id ON permisos_rol(page_id);
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_usuario_id ON permisos_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_page_id ON permisos_usuario(page_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_fecha ON operaciones_diarias(fecha_operacion);
CREATE INDEX IF NOT EXISTS idx_vehiculos_placa ON vehiculos_operacion(placa);
CREATE INDEX IF NOT EXISTS idx_entregas_estado ON entregas(estado);
CREATE INDEX IF NOT EXISTS idx_entregas_fecha_operacion ON entregas(fecha_operacion);
CREATE INDEX IF NOT EXISTS idx_entregas_fecha_cumplido ON entregas(fecha_cumplido);
CREATE INDEX IF NOT EXISTS idx_vehiculo_operacion ON vehiculos_operacion(operacion_id);
CREATE INDEX IF NOT EXISTS idx_entregas_vehiculo ON entregas(vehiculo_operacion_id);

-- ✅ TRIGGERS para actualización automática de timestamps
CREATE OR REPLACE FUNCTION update_fecha_actualizacion_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_fecha_actualizacion BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion_column();

CREATE TRIGGER update_permisos_usuario_fecha_actualizacion BEFORE UPDATE ON permisos_usuario
    FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_operaciones_updated_at BEFORE UPDATE ON operaciones_diarias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehiculos_updated_at BEFORE UPDATE ON vehiculos_operacion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entregas_updated_at BEFORE UPDATE ON entregas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ✅ DATOS INICIALES: Roles
INSERT INTO roles (nombre, descripcion, activo) VALUES
    ('Administrador', 'Acceso completo al sistema', TRUE),
    ('Supervisor', 'Supervisión y aprobación de operaciones', TRUE),
    ('Operador', 'Registro y consulta de operaciones diarias', TRUE),
    ('Solo Lectura', 'Solo puede ver información sin editar', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- ✅ DATOS INICIALES: Pages
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden, activo) VALUES
    ('dashboard', 'Dashboard', '/dashboard', 'FaTachometerAlt', 1, TRUE),
    ('operaciones', 'Operaciones Diarias', '/operaciones', 'FaTruck', 2, TRUE),
    ('entregas', 'Entregas', '/entregas', 'FaBoxOpen', 3, TRUE),
    ('usuarios', 'Gestión de Usuarios', '/maestros/usuarios', 'FaUsers', 4, TRUE),
    ('roles', 'Roles y Permisos', '/maestros/roles', 'FaUserShield', 5, TRUE),
    ('reportes', 'Reportes', '/reportes', 'FaChartBar', 6, TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- ✅ PERMISOS POR ROL: Administrador (acceso total)
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT
    r.id,
    p.id,
    TRUE,
    TRUE,
    TRUE,
    TRUE
FROM roles r
CROSS JOIN pages p
WHERE r.nombre = 'Administrador'
ON CONFLICT (rol_id, page_id) DO NOTHING;

-- ✅ PERMISOS POR ROL: Supervisor
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT
    r.id,
    p.id,
    TRUE,
    CASE WHEN p.nombre IN ('usuarios', 'roles') THEN FALSE ELSE TRUE END,
    TRUE,
    CASE WHEN p.nombre IN ('usuarios', 'roles') THEN FALSE ELSE TRUE END
FROM roles r
CROSS JOIN pages p
WHERE r.nombre = 'Supervisor'
ON CONFLICT (rol_id, page_id) DO NOTHING;

-- ✅ PERMISOS POR ROL: Operador
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT
    r.id,
    p.id,
    TRUE,
    CASE WHEN p.nombre IN ('operaciones', 'entregas') THEN TRUE ELSE FALSE END,
    CASE WHEN p.nombre IN ('operaciones', 'entregas') THEN TRUE ELSE FALSE END,
    FALSE
FROM roles r
CROSS JOIN pages p
WHERE r.nombre = 'Operador' AND p.nombre NOT IN ('usuarios', 'roles')
ON CONFLICT (rol_id, page_id) DO NOTHING;

-- ✅ PERMISOS POR ROL: Solo Lectura
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT
    r.id,
    p.id,
    TRUE,
    FALSE,
    FALSE,
    FALSE
FROM roles r
CROSS JOIN pages p
WHERE r.nombre = 'Solo Lectura' AND p.nombre NOT IN ('usuarios', 'roles')
ON CONFLICT (rol_id, page_id) DO NOTHING;

-- ✅ IMPORTANTE: Para crear el usuario admin inicial, ejecute:
-- python backend/init_admin.py
