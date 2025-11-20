# 🔐 Configuración de Seguridad

## ⚠️ IMPORTANTE: Configuración Inicial Obligatoria

Antes de ejecutar la aplicación en producción, debe completar estos pasos de seguridad.

---

## 1. Generar Secret Key Fuerte

El `SECRET_KEY` en el archivo `.env` debe ser una cadena aleatoria de al menos 32 caracteres.

### Generar una clave segura:

```bash
# Opción 1: Usando Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Opción 2: Usando OpenSSL
openssl rand -base64 32

# Opción 3: Usando el script incluido
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
```

### Agregar al archivo `.env`:

```env
SECRET_KEY=tu_clave_generada_aqui_minimo_32_caracteres
```

**NUNCA use claves débiles como:**
- `secret`
- `password`
- `admin`
- `changeme`
- Cualquier palabra del diccionario

---

## 2. Inicializar Usuario Admin

**⚠️ CRÍTICO:** El esquema SQL ya no incluye contraseñas hardcoded.

### Pasos para crear el usuario admin:

```bash
cd backend
python init_admin.py
```

Este script:
- ✅ Genera una contraseña segura aleatoria de 16 caracteres
- ✅ Crea el usuario `admin` con todos los permisos
- ✅ Muestra la contraseña **UNA SOLA VEZ**

**Guarde la contraseña en un gestor de contraseñas seguro.**

### Para restablecer la contraseña del admin:

```bash
python init_admin.py
# Responda 's' cuando pregunte si desea restablecer la contraseña
```

---

## 3. Configurar Variables de Entorno

Cree un archivo `.env` en la carpeta `backend/` con:

```env
# Base de datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/avery_db

# Seguridad (GENERAR NUEVA CLAVE - VER PASO 1)
SECRET_KEY=CAMBIAR_POR_CLAVE_GENERADA_DE_32_CARACTERES
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Archivos
UPLOAD_DIR=/app/uploads

# CORS - Agregar solo dominios permitidos
ALLOWED_ORIGINS=http://localhost:3000,https://tudominio.com
```

---

## 4. Verificar Configuración de Seguridad

### El sistema ahora incluye:

✅ **Rate Limiting en Login**
- Máximo 5 intentos cada 15 minutos por IP
- Protege contra ataques de fuerza bruta

✅ **Bloqueo de Cuenta**
- Después de 5 intentos fallidos, el usuario se bloquea por 15 minutos
- Previene ataques de diccionario

✅ **Validación de Datos**
- Username: Solo alfanuméricos, guiones y guiones bajos
- Email: Validación de formato
- Contraseñas: Mínimo 8 caracteres con mayúscula, minúscula y número
- Placas de vehículos: Formato validado
- Números de factura: Solo alfanuméricos

✅ **Errores Seguros**
- No se exponen stack traces al cliente
- CORS correctamente configurado
- Mensajes de error genéricos

✅ **Secret Key Validado**
- Mínimo 32 caracteres obligatorio
- Advertencias si la clave parece débil

---

## 5. Mejoras Recomendadas Adicionales (Futuro)

### Alta Prioridad:
- [ ] Implementar Redis para blacklist de tokens JWT
- [ ] Migrar a httpOnly cookies en lugar de localStorage
- [ ] Implementar backups automatizados de la base de datos
- [ ] Agregar soft deletes en lugar de DELETE CASCADE

### Media Prioridad:
- [ ] Implementar paginación en todos los endpoints
- [ ] Agregar sistema de auditoría
- [ ] Configurar HTTPS obligatorio
- [ ] Implementar CDN para archivos estáticos

### Baja Prioridad:
- [ ] Implementar 2FA (Two-Factor Authentication)
- [ ] Agregar logging de eventos de seguridad
- [ ] Implementar APM (Application Performance Monitoring)

---

## 6. Checklist Pre-Producción

Antes de desplegar a producción, verifique:

- [ ] Secret Key generado con al menos 32 caracteres aleatorios
- [ ] Usuario admin creado con contraseña segura (no hardcoded)
- [ ] Archivo `.env` NO está en el repositorio git
- [ ] HTTPS configurado y funcionando
- [ ] CORS configurado solo con dominios permitidos
- [ ] Rate limiting probado y funcionando
- [ ] Validaciones de datos probadas
- [ ] Backups de base de datos configurados
- [ ] Logs no contienen información sensible
- [ ] Dependencias actualizadas a versiones seguras

---

## 7. Mantenimiento de Seguridad

### Actualizaciones:
- Actualizar dependencias regularmente: `pip list --outdated`
- Revisar vulnerabilidades: `pip-audit` o `safety check`

### Monitoreo:
- Revisar logs de intentos de login fallidos
- Monitorear patrones de rate limiting
- Verificar integridad de la base de datos

### Contraseñas:
- Forzar cambio de contraseña cada 90 días (implementación futura)
- Auditar usuarios inactivos mensualmente
- Eliminar cuentas no utilizadas

---

## 8. Contacto para Reportar Vulnerabilidades

Si encuentra alguna vulnerabilidad de seguridad, por favor NO la haga pública.
Contacte al equipo de seguridad de forma privada.

---

**Última actualización:** 2024-11-20
