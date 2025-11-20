"""
✅ SEGURIDAD: Rate limiting middleware para prevenir brute force attacks
"""
from fastapi import Request, HTTPException, status
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Rate limiter simple basado en memoria
    Para producción, considerar usar Redis para persistencia entre instancias
    """

    def __init__(self):
        # Estructura: {ip_address: [(timestamp, endpoint), ...]}
        self.requests: Dict[str, list[Tuple[datetime, str]]] = defaultdict(list)
        self.cleanup_interval = timedelta(minutes=15)
        self.last_cleanup = datetime.now()

    def _cleanup_old_requests(self):
        """Limpia requests antiguos para evitar memory leak"""
        if datetime.now() - self.last_cleanup > self.cleanup_interval:
            cutoff_time = datetime.now() - timedelta(minutes=15)
            for ip in list(self.requests.keys()):
                self.requests[ip] = [
                    (ts, ep) for ts, ep in self.requests[ip]
                    if ts > cutoff_time
                ]
                if not self.requests[ip]:
                    del self.requests[ip]
            self.last_cleanup = datetime.now()

    def is_rate_limited(
        self,
        ip_address: str,
        endpoint: str,
        max_requests: int = 5,
        window_minutes: int = 15
    ) -> Tuple[bool, int]:
        """
        Verifica si una IP está rate limited

        Args:
            ip_address: IP del cliente
            endpoint: Ruta del endpoint
            max_requests: Máximo de requests permitidos
            window_minutes: Ventana de tiempo en minutos

        Returns:
            Tuple[bool, int]: (is_limited, remaining_attempts)
        """
        self._cleanup_old_requests()

        current_time = datetime.now()
        cutoff_time = current_time - timedelta(minutes=window_minutes)

        # Filtrar requests recientes para este endpoint
        recent_requests = [
            ts for ts, ep in self.requests[ip_address]
            if ts > cutoff_time and ep == endpoint
        ]

        remaining = max(0, max_requests - len(recent_requests))

        if len(recent_requests) >= max_requests:
            logger.warning(
                f"⚠️  Rate limit exceeded for IP {ip_address} on {endpoint}. "
                f"Attempts: {len(recent_requests)}/{max_requests}"
            )
            return True, 0

        # Registrar este request
        self.requests[ip_address].append((current_time, endpoint))

        return False, remaining - 1


# Instancia global del rate limiter
rate_limiter = RateLimiter()


def check_rate_limit(
    request: Request,
    max_requests: int = 5,
    window_minutes: int = 15
):
    """
    Dependency para verificar rate limits en endpoints

    Uso:
        @router.post("/login", dependencies=[Depends(check_rate_limit)])
        async def login(...):
            ...
    """
    # Obtener IP real considerando proxies
    client_ip = request.client.host
    if forwarded_for := request.headers.get("X-Forwarded-For"):
        client_ip = forwarded_for.split(",")[0].strip()
    elif real_ip := request.headers.get("X-Real-IP"):
        client_ip = real_ip

    endpoint = request.url.path

    is_limited, remaining = rate_limiter.is_rate_limited(
        client_ip,
        endpoint,
        max_requests,
        window_minutes
    )

    if is_limited:
        logger.warning(
            f"🚫 Rate limit blocked request from {client_ip} to {endpoint}"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Demasiados intentos. Por favor espere {window_minutes} minutos antes de intentar nuevamente.",
            headers={"Retry-After": str(window_minutes * 60)}
        )

    # Agregar header informativo con intentos restantes
    request.state.rate_limit_remaining = remaining
