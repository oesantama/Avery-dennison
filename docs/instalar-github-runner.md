# 🏃 Configuración de GitHub Runner (Self-Hosted)

Para que GitHub pueda enviar órdenes a tu servidor y así realizar el **Despliegue Automático**, necesitas instalar un pequeño agente ("Runner") en tu servidor Windows.

## Pasos

1.  **Ir a GitHub**:

    - Entra a tu repositorio en GitHub.com
    - Ve a **Settings** (Pestaña superior).
    - En el menú izquierdo: **Actions** → **Runners**.
    - Clic en el botón verde: **New self-hosted runner**.

2.  **Seleccionar Sistema**:

    - Runner image: **Windows**.
    - Architecture: **x64**.

3.  **Ejecutar Comandos en el Servidor**:

    - GitHub te mostrará unos comandos de PowerShell. Debes copiarlos y ejecutarlos EN TU SERVIDOR (en PowerShell como Administrador).
    - Generalmente se vé así (No copies esto, usa lo que te da GitHub porque tiene un TOKEN único):

      ```powershell
      # Crear carpeta
      mkdir actions-runner; cd actions-runner

      # Descargar
      Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-win-x64-2.311.0.zip -OutFile actions-runner-win-x64-2.311.0.zip

      # Descomprimir
      Add-Type -AssemblyName System.IO.Compression.FileSystem ; [System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-2.311.0.zip", "$PWD")
      ```

4.  **Configuración (Interactive)**:

    - Ejecuta: `.\config.cmd`
    - URL del repo: `(Enter para aceptar default)`
    - Token: `(Enter para aceptar default)`
    - Runner name: `m7-prod-server` (o lo que quieras)
    - Runner group: `(Enter para Default)`
    - Work folder: `(Enter para _work)`

5.  **Instalar como Servicio (IMPORTANTE)**:
    - Para que se ejecute siempre, incluso si reinicias:
      ```powershell
      .\svc.cmd install
      .\svc.cmd start
      ```

## Resultado

Una vez hecho esto, verás en GitHub que el runner está "Idle" (verde).
¡Listo! El próximo `git push origin main` disparará el despliegue automático en tu servidor.
