from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pathlib import Path
import logging
import traceback
from app.database import engine, Base
from app.routes import auth, operaciones, entregas, dashboard, usuarios, rbac, vehiculos, tipos_vehiculo, permisos_rol, permisos_usuario
from app.config import get_settings
from app.middleware import LoggingMiddleware, log_startup_info

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log startup info
log_startup_info()

# Create tables
Base.metadata.create_all(bind=engine)

settings = get_settings()

app = FastAPI(
    title="Sistema de Gestión de Vehículos y Entregas",
    description="API para gestión de operaciones diarias de vehículos y entregas",
    version="1.0.0"
)

# Add logging middleware (before CORS)
app.add_middleware(LoggingMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8035",  # Frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler to ensure CORS headers are always sent
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Captura todas las excepciones no manejadas y asegura que
    se envíen los headers de CORS incluso cuando hay errores 500
    """
    logger.error(f"❌ Error no manejado: {str(exc)}")
    logger.error(f"📍 Traceback: {traceback.format_exc()}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Error interno del servidor",
            "error": str(exc)
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Maneja errores de validación de Pydantic con headers CORS
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Ensure upload directory exists with absolute path
upload_dir = Path(settings.upload_dir).resolve()
upload_dir.mkdir(parents=True, exist_ok=True)
logger.info(f"📁 Upload directory: {upload_dir}")
logger.info(f"📁 Directory exists: {upload_dir.exists()}")

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")
logger.info(f"🌐 Static files mounted at: http://localhost:3035/uploads")

# Include routers
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(rbac.router)
app.include_router(vehiculos.router)
app.include_router(tipos_vehiculo.router)
app.include_router(permisos_rol.router)
app.include_router(permisos_usuario.router)
app.include_router(operaciones.router)
app.include_router(entregas.router)
app.include_router(dashboard.router)

@app.get("/")
async def root():
    return {
        "message": "Sistema de Gestión de Vehículos y Entregas API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3035, reload=True)
