/**
 * Utilidades para formatear fechas en formato colombiano
 */

/**
 * Formatea una fecha en formato colombiano: DD/MM/YYYY HH:MM AM/PM
 * La fecha viene del backend ya en timezone de Colombia, solo formateamos sin conversión
 */
export const formatDateTimeColombian = (date: string | Date): string => {
  if (!date) return '-';
  
  // Si es string, parseamos directamente sin conversión de timezone
  let dateObj: Date;
  if (typeof date === 'string') {
    // Si la fecha tiene timezone (+00:00 o Z), la parseamos y extraemos los valores en Colombia
    dateObj = new Date(date);
    
    // Convertimos a string en timezone de Colombia
    const colombiaDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    dateObj = colombiaDate;
  } else {
    dateObj = date;
  }
  
  // Verificar si la fecha es válida
  if (isNaN(dateObj.getTime())) return '-';
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 se convierte en 12
  const hoursStr = String(hours).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
};

/**
 * Formatea solo la fecha en formato colombiano: DD/MM/YYYY
 */
export const formatDateColombian = (date: string | Date): string => {
  if (!date) return '-';
  
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
    const colombiaDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    dateObj = colombiaDate;
  } else {
    dateObj = date;
  }
  
  // Verificar si la fecha es válida
  if (isNaN(dateObj.getTime())) return '-';
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Formatea solo la hora en formato colombiano: HH:MM AM/PM
 */
export const formatTimeColombian = (date: string | Date): string => {
  if (!date) return '-';
  
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
    const colombiaDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    dateObj = colombiaDate;
  } else {
    dateObj = date;
  }
  
  // Verificar si la fecha es válida
  if (isNaN(dateObj.getTime())) return '-';
  
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  
  return `${hoursStr}:${minutes} ${ampm}`;
};

/**
 * Obtiene la fecha y hora actual en formato ISO para Colombia
 */
export const getCurrentDateTimeColombian = (): string => {
  const now = new Date();
  return now.toISOString();
};

/**
 * Formatea una fecha relativa (hace X minutos, hace X horas, etc)
 */
export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Justo ahora';
  if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  
  return formatDateColombian(dateObj);
};
