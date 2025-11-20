"""
✅ SEGURIDAD: Utilidades para sanitizar datos sensibles en logs
"""
import re
from typing import Any, Dict


# Campos que contienen información sensible
SENSITIVE_FIELDS = {
    'password',
    'password_hash',
    'secret',
    'secret_key',
    'token',
    'access_token',
    'refresh_token',
    'api_key',
    'authorization',
    'passwd',
    'pwd',
    'contrasena',
    'contraseña',
}

# Patrones para detectar información sensible en strings
SENSITIVE_PATTERNS = [
    (re.compile(r'password["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)', re.IGNORECASE), 'password'),
    (re.compile(r'token["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)', re.IGNORECASE), 'token'),
    (re.compile(r'secret["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)', re.IGNORECASE), 'secret'),
    (re.compile(r'api[_-]?key["\']?\s*[:=]\s*["\']?([^"\'\s,}]+)', re.IGNORECASE), 'api_key'),
    # Detectar números de tarjeta de crédito (formato básico)
    (re.compile(r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b'), 'credit_card'),
    # Detectar tokens JWT
    (re.compile(r'\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b'), 'jwt_token'),
]


def sanitize_dict(data: Dict[str, Any], mask: str = "***REDACTED***") -> Dict[str, Any]:
    """
    Sanitiza un diccionario reemplazando valores sensibles

    Args:
        data: Diccionario a sanitizar
        mask: Texto a mostrar en lugar de datos sensibles

    Returns:
        Diccionario sanitizado (copia)
    """
    if not isinstance(data, dict):
        return data

    sanitized = {}
    for key, value in data.items():
        key_lower = key.lower()

        # Verificar si el campo es sensible
        if any(sensitive in key_lower for sensitive in SENSITIVE_FIELDS):
            sanitized[key] = mask
        # Recursión para diccionarios anidados
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, mask)
        # Recursión para listas de diccionarios
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_dict(item, mask) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            sanitized[key] = value

    return sanitized


def sanitize_string(text: str, mask: str = "***REDACTED***") -> str:
    """
    Sanitiza un string buscando patrones de información sensible

    Args:
        text: String a sanitizar
        mask: Texto a mostrar en lugar de datos sensibles

    Returns:
        String sanitizado
    """
    if not isinstance(text, str):
        return text

    sanitized = text
    for pattern, field_type in SENSITIVE_PATTERNS:
        sanitized = pattern.sub(f'{field_type}={mask}', sanitized)

    return sanitized


def sanitize_log_message(message: Any) -> Any:
    """
    Sanitiza un mensaje de log (puede ser string, dict, etc.)

    Args:
        message: Mensaje a sanitizar

    Returns:
        Mensaje sanitizado
    """
    if isinstance(message, dict):
        return sanitize_dict(message)
    elif isinstance(message, str):
        return sanitize_string(message)
    elif isinstance(message, (list, tuple)):
        return [sanitize_log_message(item) for item in message]
    else:
        return message


def safe_log_user_data(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepara datos de usuario para logging seguro

    Args:
        user_data: Datos del usuario

    Returns:
        Datos seguros para loggear
    """
    if not isinstance(user_data, dict):
        return {}

    return {
        'id': user_data.get('id'),
        'username': user_data.get('username'),
        'email': user_data.get('email', '').split('@')[0] + '@***' if user_data.get('email') else None,
        'activo': user_data.get('activo'),
        # NO incluir: password, password_hash, tokens, etc.
    }


def safe_log_request_data(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepara datos de request para logging seguro

    Args:
        request_data: Datos del request

    Returns:
        Datos seguros para loggear
    """
    sanitized = sanitize_dict(request_data)

    # Adicional: truncar valores muy largos
    for key, value in sanitized.items():
        if isinstance(value, str) and len(value) > 200:
            sanitized[key] = value[:200] + '... [TRUNCATED]'

    return sanitized


# Ejemplo de uso en logging
def example_usage():
    """Ejemplo de cómo usar estas utilidades"""
    import logging

    logger = logging.getLogger(__name__)

    # Datos sensibles
    user_login = {
        "username": "admin",
        "password": "SuperSecret123!",
        "remember_me": True
    }

    # ❌ MALO - expone contraseña
    # logger.info(f"Login attempt: {user_login}")

    # ✅ BUENO - sanitiza datos sensibles
    logger.info(f"Login attempt: {sanitize_dict(user_login)}")
    # Output: Login attempt: {'username': 'admin', 'password': '***REDACTED***', 'remember_me': True}
