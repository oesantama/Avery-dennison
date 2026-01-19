
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.usuario import Usuario
from app.auth import get_password_hash

def update_password():
    db = SessionLocal()
    try:
        username = "milla7"
        password = "milla7123*"
        
        user = db.query(Usuario).filter(Usuario.username == username).first()
        if user:
            print(f"✅ Usuario encontrado: {user.username}")
            user.password_hash = get_password_hash(password)
            db.commit()
            print(f"✅ Contraseña actualizada para {username}")
        else:
            print(f"❌ Usuario {username} no encontrado (esto no debería pasar tras el SQL fix).")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_password()
