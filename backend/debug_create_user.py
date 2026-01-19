
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
# Importar modelos explícitamente
from app.models.usuario import Usuario
from app.models.rol import Rol
from app.models.permisos import PermisosUsuario
from app.models.page import Page
from app.auth import get_password_hash
import sys

def main():
    print("🛠️ Debugging Create all...")
    
    # Imprimir qué tablas conoce Base
    print(f"Tablas registradas en Metadata: {Base.metadata.tables.keys()}")

    if 'roles' not in Base.metadata.tables:
        print("❌ 'roles' NO está en metadata!")
    else:
        print("✅ 'roles' está en metadata.")

    if 'usuarios' not in Base.metadata.tables:
        print("❌ 'usuarios' NO está en metadata!")
    else:
        print("✅ 'usuarios' está en metadata.")
        
    print("Ejecutando create_all...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ create_all ejecutado.")
    except Exception as e:
        print(f"❌ Error create_all: {e}")

    # Ahora intentar insertar
    db = SessionLocal()
    try:
        current_tables = engine.table_names() # Deprecated but exists in some versions, or use Inspector
        print(f"Tablas reales en DB: {current_tables}")
        
        # 1. Crear Rol Admin si no existe
        admin_role = db.query(Rol).filter(Rol.nombre == "Administrador").first()
        if not admin_role:
             print("Creando Rol Admin...")
             admin_role = Rol(nombre="Administrador", descripcion="Admin")
             db.add(admin_role)
             db.commit()
        
        # 2. Usuario
        USERNAME = "milla7"
        PASSWORD = "milla7123*"
        
        existing = db.query(Usuario).filter(Usuario.username == USERNAME).first()
        if not existing:
             print("Creando Usuario milla7...")
             new_user = Usuario(username=USERNAME, password_hash=get_password_hash(PASSWORD), rol_id=admin_role.id)
             db.add(new_user)
             db.commit()
             print("Usuario creado.")
        else:
             print("Usuario ya existe, actualizando...")
             existing.password_hash = get_password_hash(PASSWORD)
             existing.rol_id = admin_role.id
             db.commit()
             print("Usuario actualizado.")

    except Exception as e:
        print(f"❌ Error en lógica: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
