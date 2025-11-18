"""
Middleware de logging para registrar todas las peticiones HTTP
"""
import logging
import time
from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware para registrar todas las peticiones HTTP con información detallada
    """
    
    async def dispatch(self, request: Request, call_next):
        # Generar ID único para la petición
        request_id = f"{int(time.time() * 1000)}"
        
        # Información de la petición
        logger.info(f"🔵 [{request_id}] {request.method} {request.url.path}")
        logger.info(f"   Client: {request.client.host if request.client else 'unknown'}")
        
        # Headers importantes
        if request.headers.get("authorization"):
            logger.info(f"   Auth: Bearer token present")
        
        # Query params
        if request.query_params:
            logger.info(f"   Query: {dict(request.query_params)}")
        
        # Tiempo de inicio
        start_time = time.time()
        
        try:
            # Procesar la petición
            response: Response = await call_next(request)
            
            # Calcular duración
            duration = (time.time() - start_time) * 1000
            
            # Log de respuesta
            status_emoji = "✅" if response.status_code < 400 else "⚠️" if response.status_code < 500 else "❌"
            logger.info(
                f"{status_emoji} [{request_id}] {response.status_code} "
                f"in {duration:.2f}ms"
            )
            
            # Agregar headers de logging
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{duration:.2f}ms"
            
            return response
            
        except Exception as e:
            # Log de error
            duration = (time.time() - start_time) * 1000
            logger.error(
                f"❌ [{request_id}] Error after {duration:.2f}ms: {str(e)}",
                exc_info=True
            )
            raise


def log_startup_info():
    """Log información importante al iniciar la aplicación"""
    logger.info("=" * 60)
    logger.info("🚀 Sistema de Gestión de Vehículos y Entregas")
    logger.info("=" * 60)
    logger.info("📝 Logging configurado exitosamente")
    logger.info("🔍 Nivel de log: INFO")
    logger.info("=" * 60)
