#!/usr/bin/env python3
"""
Script para arreglar la base de datos - agrega columnas faltantes en la tabla usuarios
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configuración de conexión (debe coincidir con docker-compose.yml)
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'vehiculos_operacion',
    'user': 'postgres',
    'password': 'yourpassword'
}

def fix_usuarios_table():
    """Agrega las columnas faltantes a la tabla usuarios"""

    print("Conectando a la base de datos...")
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    print("Verificando y agregando columnas faltantes...")

    # Script SQL para agregar columnas si no existen
    sql_script = """
    -- Agregar fecha_creacion si no existe
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'usuarios' AND column_name = 'fecha_creacion'
        ) THEN
            ALTER TABLE usuarios ADD COLUMN fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
            RAISE NOTICE 'Columna fecha_creacion agregada';

            -- Si existe created_at, copiar valores
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'usuarios' AND column_name = 'created_at'
            ) THEN
                UPDATE usuarios SET fecha_creacion = created_at WHERE created_at IS NOT NULL;
                RAISE NOTICE 'Valores copiados de created_at a fecha_creacion';
            END IF;
        ELSE
            RAISE NOTICE 'Columna fecha_creacion ya existe';
        END IF;
    END $$;

    -- Agregar fecha_actualizacion si no existe
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'usuarios' AND column_name = 'fecha_actualizacion'
        ) THEN
            ALTER TABLE usuarios ADD COLUMN fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
            RAISE NOTICE 'Columna fecha_actualizacion agregada';

            -- Si existe updated_at, copiar valores
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'usuarios' AND column_name = 'updated_at'
            ) THEN
                UPDATE usuarios SET fecha_actualizacion = updated_at WHERE updated_at IS NOT NULL;
                RAISE NOTICE 'Valores copiados de updated_at a fecha_actualizacion';
            END IF;
        ELSE
            RAISE NOTICE 'Columna fecha_actualizacion ya existe';
        END IF;
    END $$;

    -- Agregar otras columnas necesarias
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numero_celular VARCHAR(20);
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol_id INTEGER;
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creado_por INTEGER;

    -- Actualizar admin con email si no tiene
    UPDATE usuarios SET email = 'admin@sistema.local'
    WHERE username = 'admin' AND email IS NULL;
    """

    try:
        # Ejecutar el script
        cursor.execute(sql_script)
        print("✓ Migración completada exitosamente")

        # Verificar columnas actuales
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'usuarios'
            ORDER BY ordinal_position
        """)

        print("\nColumnas actuales en la tabla usuarios:")
        for row in cursor.fetchall():
            print(f"  - {row[0]}: {row[1]} (nullable: {row[2]})")

    except Exception as e:
        print(f"✗ Error durante la migración: {e}")
        raise
    finally:
        cursor.close()
        conn.close()
        print("\nConexión cerrada")

if __name__ == "__main__":
    try:
        fix_usuarios_table()
    except psycopg2.OperationalError as e:
        print(f"\n✗ Error de conexión: {e}")
        print("\nAsegúrate de que:")
        print("  1. Los contenedores de Docker estén corriendo (docker-compose up -d)")
        print("  2. La base de datos esté accesible en localhost:5432")
    except Exception as e:
        print(f"\n✗ Error inesperado: {e}")
