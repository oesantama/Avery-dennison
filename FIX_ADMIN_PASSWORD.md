# Solución: Credenciales Admin No Funcionan

## Problema Identificado

El hash de la contraseña del usuario `admin` en la base de datos era incorrecto. Esto causaba que las credenciales `admin` / `admin123` no funcionaran.

## Solución Implementada

Se ha generado un nuevo hash bcrypt válido para la contraseña `admin123` y se ha actualizado en el esquema de la base de datos.

**Credenciales correctas:**
- **Usuario:** `admin`
- **Contraseña:** `admin123`

---

## Cómo Aplicar la Corrección

Tienes **dos opciones** para aplicar la corrección:

### Opción 1: Recrear la Base de Datos (Recomendado - Más Simple)

Esta opción eliminará todos los datos existentes y recreará la base de datos con el usuario admin correcto.

```bash
# Detener los contenedores
docker-compose -f docker-compose.dev.yml down

# Eliminar los volúmenes (esto borra la base de datos)
docker volume rm avery-dennison_postgres_data

# O usar el comando combinado
docker-compose -f docker-compose.dev.yml down -v

# Reconstruir y ejecutar
docker-compose -f docker-compose.dev.yml up --build
```

Después de esto, las credenciales `admin` / `admin123` funcionarán correctamente.

---

### Opción 2: Actualizar Solo la Contraseña (Conserva Datos Existentes)

Si ya tienes datos en la base de datos que no quieres perder, usa este método:

#### Paso 1: Copiar el script SQL al contenedor

```bash
docker cp database/fix_admin_password.sql vehiculos-db:/tmp/fix_admin_password.sql
```

#### Paso 2: Ejecutar el script en la base de datos

```bash
docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -f /tmp/fix_admin_password.sql
```

#### Alternativa (comando directo):

```bash
docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -c "UPDATE usuarios SET password_hash = '\$2b\$12\$u3tRVni5FerUJ9c7NW3pau84O/kuFppCBuk/sZyP9gx0yJTfpO.Jq' WHERE username = 'admin';"
```

---

## Verificación

Después de aplicar cualquiera de las dos opciones:

1. Abre el navegador en: **http://localhost:8035**
2. Ingresa las credenciales:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`
3. Deberías poder iniciar sesión exitosamente y ser redirigido al dashboard

---

## Archivos Modificados

- `database/schema.sql` - Actualizado con el hash bcrypt correcto
- `database/fix_admin_password.sql` - Script nuevo para actualizar bases de datos existentes

---

## Notas Técnicas

- **Hash anterior (incorrecto):** `$2b$12$8LvVE8qE.jB9QXqK5q5K5u5K5K5q5K5qE.jB9QXqK5q5K5u5K5K`
- **Hash nuevo (correcto):** `$2b$12$u3tRVni5FerUJ9c7NW3pau84O/kuFppCBuk/sZyP9gx0yJTfpO.Jq`
- **Algoritmo:** bcrypt con 12 rounds
- **Biblioteca:** bcrypt 4.0.1 / passlib 1.7.4

---

## Troubleshooting

### ¿El login sigue fallando?

1. Verifica que la base de datos se haya actualizado:
   ```bash
   docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -c "SELECT username, activo FROM usuarios WHERE username = 'admin';"
   ```

2. Verifica los logs del backend:
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f backend
   ```

3. Asegúrate de estar usando las credenciales exactas:
   - Username: `admin` (sin espacios, minúsculas)
   - Password: `admin123` (sin espacios)

### ¿Necesitas crear un nuevo usuario?

Puedes usar el endpoint de registro en el backend:

```bash
curl -X POST http://localhost:3035/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tuusuario",
    "password": "tucontraseña",
    "nombre_completo": "Tu Nombre",
    "email": "tu@email.com"
  }'
```
