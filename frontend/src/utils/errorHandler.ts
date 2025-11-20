/**
 * ✅ MEJORA: Manejo centralizado de errores con mensajes específicos
 */

export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
  errorId?: string;
}

/**
 * Extrae un mensaje de error legible desde diferentes formatos de error
 */
export function extractErrorMessage(error: any): string {
  // Error de red o servidor no responde
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'La solicitud ha tardado demasiado. Por favor, intente nuevamente.';
    }
    if (error.message === 'Network Error') {
      return 'No se puede conectar al servidor. Verifique su conexión a internet.';
    }
    return 'Error de conexión con el servidor. Por favor, intente más tarde.';
  }

  const { status, data } = error.response;

  // Errores específicos por código de estado
  switch (status) {
    case 400:
      return data?.detail || 'Solicitud inválida. Verifique los datos ingresados.';

    case 401:
      return 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';

    case 403:
      return data?.detail || 'No tiene permisos para realizar esta acción.';

    case 404:
      return 'El recurso solicitado no fue encontrado.';

    case 409:
      return data?.detail || 'Ya existe un registro con estos datos.';

    case 422:
      // Errores de validación de Pydantic
      if (Array.isArray(data?.detail)) {
        const validationErrors = data.detail
          .map((err: any) => {
            const field = err.loc?.slice(1).join('.') || 'campo';
            return `${field}: ${err.msg}`;
          })
          .join('; ');
        return `Datos inválidos: ${validationErrors}`;
      }
      return data?.detail || 'Los datos proporcionados son inválidos.';

    case 429:
      return data?.detail || 'Demasiados intentos. Por favor, espere unos minutos.';

    case 500:
      // Mostrar error_id si está disponible para tracking
      const errorId = data?.error_id ? ` (ID: ${data.error_id})` : '';
      return `Error interno del servidor${errorId}. Por favor, contacte al administrador.`;

    case 503:
      return 'El servicio no está disponible temporalmente. Intente más tarde.';

    default:
      return data?.detail || data?.message || `Error del servidor (${status})`;
  }
}

/**
 * Parsea un error y retorna un objeto ApiError estructurado
 */
export function parseApiError(error: any): ApiError {
  const message = extractErrorMessage(error);
  const statusCode = error.response?.status || 0;
  const details = error.response?.data;
  const errorId = error.response?.data?.error_id;

  return {
    message,
    statusCode,
    details,
    errorId,
  };
}

/**
 * Verifica si un error es de autenticación (401)
 */
export function isAuthError(error: any): boolean {
  return error.response?.status === 401;
}

/**
 * Verifica si un error es de permisos (403)
 */
export function isPermissionError(error: any): boolean {
  return error.response?.status === 403;
}

/**
 * Verifica si un error es de validación (422)
 */
export function isValidationError(error: any): boolean {
  return error.response?.status === 422;
}

/**
 * Verifica si un error es de rate limiting (429)
 */
export function isRateLimitError(error: any): boolean {
  return error.response?.status === 429;
}

/**
 * Maneja un error de forma consistente y retorna un mensaje user-friendly
 */
export function handleError(error: any, context?: string): string {
  console.error(`Error${context ? ` en ${context}` : ''}:`, error);

  const apiError = parseApiError(error);

  // Log adicional para errores del servidor
  if (apiError.statusCode >= 500) {
    console.error('Server error details:', apiError.details);
  }

  return apiError.message;
}

/**
 * Obtiene el retry-after header si está disponible
 */
export function getRetryAfter(error: any): number | null {
  const retryAfter = error.response?.headers?.['retry-after'];
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    return isNaN(seconds) ? null : seconds;
  }
  return null;
}
