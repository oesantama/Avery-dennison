# ☁️ Guía de Migración a la Nube (VPS + Coolify)

Esta guía te permitirá tener tu propia infraestructura "tipo Vercel/Heroku" pero a una fracción del costo, centralizada y automática.

## Requisitos de Compra (Lo que usted debe adquirir)

1.  **Dominio**: `m7apps.com` (en GoDaddy, Namecheap, etc.)
2.  **Servidor VPS**:
    - **Proveedor recomendado**: [Hetzner Cloud](https://hetzner.com) (Más barato/pontente) o [DigitalOcean](https://digitalocean.com).
    - **Especificaciones Mínimas**:
      - CPU: 2 vCPU (Recomendado) o 1 vCPU (Mínimo).
      - RAM: 4 GB (Importante para Docker + Bases de datos).
      - OS: **Ubuntu 22.04 LTS**.
    - **Costo Estimado**: ~$6 - $10 USD / mes.

---

## Paso 1: Configurar el Servidor (Solo una vez)

Una vez tenga la IP de su nuevo servidor (ej: `123.456.78.90`), abra PowerShell en su PC y conéctese:

```powershell
ssh root@123.456.78.90
# (Ingrese la contraseña que le envió el proveedor)
```

**Instalar Coolify (Comando Mágico):**
Copie y pegue esto en la terminal del servidor:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Esto tardará unos 5-10 minutos. Al terminar, le dará una URL: `http://123.456.78.90:8000`.

---

## Paso 2: Configurar Coolify

1.  Abra `http://123.456.78.90:8000` en su navegador.
2.  Cree su cuenta de administrador.
3.  **Conectar GitHub**: Vaya a "Sources" -> "Git Sources" -> "GitHub App" y siga los pasos para instalar la App de Coolify en su repositorio `Avery-dennison`.

---

## Paso 3: Desplegar Avery Dennison (M7Apps)

1.  En Coolify, haga clic en **"+ New Resource"**.
2.  Seleccione **"Git Repository"** -> (Su repo GitHub).
3.  Seleccione la rama `main`.
4.  **Configuration Type**: Seleccione **"Docker Compose"**.
5.  En la caja de texto que aparece, borre todo y pegue el contenido del archivo `docker-compose.prod.yml` que acabamos de crear en su proyecto (está en la carpeta raíz).
6.  **Variables de Entorno**: Llene las variables solicitadas:
    - `POSTGRES_PASSWORD`: (Invente una segura)
    - `SECRET_KEY`: (Invente una segura)
    - `NEXT_PUBLIC_API_URL`: `https://avery.m7apps.com` (o el subdominio que use)
    - `ALLOWED_ORIGINS`: `https://avery.m7apps.com`
7.  Haga clic en **Deploy**.

---

## Paso 4: DNS (Dominios)

En su proveedor de dominio (GoDaddy/Namecheap), cree un registro DNS:

- **Type**: A
- **Name**: `avery` (para `avery.m7apps.com`)
- **Value**: `123.456.78.90` (La IP de su servidor)

Coolify detectará esto y generará el certificado HTTPS (candado verde) automáticamente en unos minutos.

## 🚀 Beneficios Obtenidos

- **Automatización**: Cada vez que haga push a `main`, Coolify redesplegará.
- **Centralización**: Podrá añadir `milla7`, bases de datos, Redis, todo en el mismo panel.
- **Ahorro**: Paga solo el VPS ($7), no por cada aplicación ($20 c/u).
