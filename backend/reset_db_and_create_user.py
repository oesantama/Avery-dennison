
import os
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.usuario import Usuario
from app.models.rol import Rol
from app.auth import get_password_hash

def apply_schema(connection):
    print("📜 Aplicando esquema completo (full_schema.sql)...")
    schema_path = "full_schema.sql"
    if not os.path.exists(schema_path):
        print(f"❌ No se encuentra {schema_path}")
        return False
    
    with open(schema_path, "r", encoding="utf-8") as f:
        sql = f.read()
    
    # Ejecutar SQL raw
    # SQLAlchemy a veces tiene problemas con múltiples statements en una sola llamada si no se usa autocommit o similar dependiendo del driver.
    # Pero con text() y execute() solía funcionar.
    try:
        connection.execute(text(sql))
        connection.commit()
        print("✅ Esquema aplicado.")
    except Exception as e:
        print(f"❌ Error aplicando esquema: {e}")
        # Intentar dividir por ; si es necesario, pero start simple
        return False
    return True

def create_milla7(db: Session):
    print("🔐 Creando usuario milla7...")
    
    # 1. Asegurar rol Admin
    admin_rol = db.query(Rol).filter(Rol.nombre == "Administrador").first()
    if not admin_rol:
        print("Creando Rol Administrador...")
        admin_rol = Rol(nombre="Administrador", descripcion="Admin")
        db.add(admin_rol)
        db.commit()
        db.refresh(admin_rol)

    # 2. Crear Usuario
    USERNAME = "milla7"
    PASSWORD = "milla7123*"
    
    user = db.query(Usuario).filter(Usuario.username == USERNAME).first()
    if user:
        print(f"Usuario {USERNAME} existe, actualizando...")
        user.password_hash = get_password_hash(PASSWORD)
        user.rol_id = admin_rol.id
        db.commit()
    else:
        print(f"Creando usuario {USERNAME}...")
        user = Usuario(
            username=USERNAME,
            password_hash=get_password_hash(PASSWORD),
            rol_id=admin_rol.id,
            nombre_completo="Milla 7 Admin",
            email="milla7@test.com"
        )
        db.add(user)
        db.commit()
        
    print("✅ Usuario milla7 listo.")

def main():
    print("🚀 Iniciando Reset & Setup...")
    
    # 1. Aplicar esquema con engine connect
    with engine.connect() as conn:
        apply_schema(conn)

    # 2. Operaciones ORM
    db = SessionLocal()
    try:
        create_milla7(db)
    except Exception as e:
        print(f"❌ Error ORM: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
