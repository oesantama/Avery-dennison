from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import get_settings
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import TokenData

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def authenticate_user(db: Session, username: str, password: str) -> Optional[Usuario]:
    user = db.query(Usuario).filter(Usuario.username == username).first()
    if not user:
        return None

    # Verificar si el usuario está bloqueado
    if user.bloqueado_hasta and user.bloqueado_hasta > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Usuario bloqueado. Intente nuevamente después de {user.bloqueado_hasta.strftime('%Y-%m-%d %H:%M:%S')} UTC"
        )

    # Verificar contraseña
    if not verify_password(password, user.password_hash):
        # Incrementar intentos fallidos
        user.intentos_fallidos = (user.intentos_fallidos or 0) + 1

        # Si llegó a 5 intentos, bloquear por 15 minutos
        if user.intentos_fallidos >= 5:
            user.bloqueado_hasta = datetime.utcnow() + timedelta(minutes=15)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Demasiados intentos fallidos. Usuario bloqueado por 15 minutos."
            )

        db.commit()
        return None

    # Login exitoso - resetear intentos fallidos
    if user.intentos_fallidos > 0 or user.bloqueado_hasta:
        user.intentos_fallidos = 0
        user.bloqueado_hasta = None
        db.commit()

    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = db.query(Usuario).filter(Usuario.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    if not current_user.activo:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
