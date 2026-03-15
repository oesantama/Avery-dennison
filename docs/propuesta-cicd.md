# 🚀 Propuesta de Arquitectura CI/CD Automatizada y Económica

Para lograr un flujo profesional donde:

1.  Subes cambios a **develop** → Se ejecutan pruebas automáticas.
2.  Si todo pasa, se mueve a **main** → Se despliega automáticamente a producción.
3.  Utilizas tu dominio **m7apps.com**.

Recomiendo la siguiente **estrategia híbrida** que minimiza costos (usando tu infraestructura actual o un VPS barato) pero maximiza la automatización usando **GitHub Actions**.

---

## 🏆 Opción Recomendada: GitHub Actions + Self-Hosted Runner

Esta opción es **GRATUITA** en términos de licencias de software y aprovecha que ya tienes un servidor Windows configurado.

### ¿Cómo funciona?

1.  **Tu PC Local**: Trabajas y haces `git push origin develop`.
2.  **GitHub (Nube)**:
    - Detecta el commit.
    - Ejecuta un **Workflow de Testing** (en servidores de GitHub gratis).
    - Corre las pruebas unitarias del Backend y Frontend.
3.  **Aprobación**: Si las pruebas pasan, haces un Pull Request a `main`.
4.  **GitHub (Nube)**: Al detectar el cambio en `main`, dispara el **Workflow de Despliegue**.
5.  **Tu Servidor (Runner)**:
    - Tiene instalado un pequeño programa llamado **"GitHub Runner"**.
    - Este programa "escucha" a GitHub. Cuando recibe la orden, ejecuta localmente los scripts que ya tenemos (`start-avery.bat` o `refresh-hybrid-stack.ps1`).

### ✅ Ventajas

- **Costo $0 extra**: Usas el servidor que ya tienes.
- **Privacidad**: El código nunca sale de tu control excepto al repo privado.
- **Velocidad**: El despliegue es local, no hay que subir imágenes pesadas de Docker a la nube.

---

## 🛠️ Alternativa "Todo en la Nube": VPS + Coolify

Si prefieres no depender de tu servidor Windows actual y quieres algo más "Nube moderna":

1.  Contratas un **VPS Linux** (Barato: Hetzner ~$5/mes o DigitalOcean ~$6/mes).
2.  Instalas **Coolify** (es como un Vercel/Heroku propio, gratis y open source).
3.  Conectas Coolify a tu GitHub.
4.  Coolify detecta el push, construye el Docker y lo despliega.

### ✅ Ventajas

- Panel visual muy bonito.
- Maneja certificados SSL (HTTPS para m7apps) automáticamente.
- No depende de tu internet/luz local.

---

## 📝 Plan de Implementación (Opción Windows Runner)

Si decides usar tu servidor actual (la opción más rápida ahora), estos son los pasos a seguir:

### 1. Preparar GitHub

En tu repositorio de GitHub:

- Ir a **Settings** > **Actions** > **Runners**.
- Crear **"New self-hosted runner"**.
- Elegir **Windows**.
- Ejecutar los comandos que te da en Powershell en tu Servidor (esto conecta tu servidor con el repo).

### 2. Crear flujos de trabajo (.github/workflows)

Crearemos dos archivos en tu proyecto:

**Archivo 1: `ci-testing.yml`** (Control de calidad)

```yaml
name: CI Testing
on:
  push:
    branches: ["develop"]
jobs:
  test:
    runs-on: ubuntu-latest # Corre en la nube de GitHub
    steps:
      - uses: actions/checkout@v3
      - name: Test Backend
        run: |
          pip install -r backend/requirements.txt
          pytest
```

**Archivo 2: `cd-production.yml`** (Despliegue)

```yaml
name: CD Production
on:
  push:
    branches: ["main"]
jobs:
  deploy:
    runs-on: self-hosted # <--- Corre en TU servidor
    steps:
      - name: Desplegar
        run: |
          cd C:\M7Aplicaciones\Avery\Avery-dennison
          git pull origin main
          .\scripts\refresh-hybrid-stack.ps1
```

---

## 💰 Resumen de Costos

| Concepto           | Opción Windows Actual | Opción VPS Linux (Coolify) | Opción Railway/Render |
| :----------------- | :-------------------- | :------------------------- | :-------------------- |
| **Hosting**        | $0 (Ya lo tienes)     | ~$5 - $10 / mes            | ~$20+ / mes           |
| **Dominio**        | Costo del dominio     | Costo del dominio          | Costo del dominio     |
| **Automatización** | Gratis (GitHub)       | Gratis (Included)          | Gratis (Included)     |
| **SSL (Candado)**  | Manual (Win-Acme)     | Automático                 | Automático            |
| **Complejidad**    | Media (Setup inicial) | Baja                       | Muy Baja              |

**Mi recomendación:** Dado que ya tienes el servidor Windows y estamos arreglando las cosas ahí, usa **GitHub Actions con Self-Hosted Runner**. Es profesional, automático y no te cuesta más.
