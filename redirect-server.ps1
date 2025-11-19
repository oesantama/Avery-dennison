# ========================================
# Servidor de Redirección Automática
# ========================================
# Este script crea un servidor HTTP simple en el puerto 8035
# que redirige automáticamente a la aplicación real

param(
    [int]$Port = 8035,
    [string]$TargetUrl = "http://localhost:8035"
)

Write-Host "🚀 Iniciando servidor de redirección en puerto $Port..." -ForegroundColor Green
Write-Host "📍 Ubicación: C:\M7Aplicaciones\Avery" -ForegroundColor Cyan
Write-Host "🎯 Redirigiendo a: $TargetUrl" -ForegroundColor Cyan

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$Port/")

try {
    $listener.Start()
    Write-Host "✅ Servidor iniciado exitosamente" -ForegroundColor Green
    Write-Host "🌐 Accesible desde: http://avery.millasiete.com:$Port" -ForegroundColor Yellow
    Write-Host "`n⏹️  Presiona Ctrl+C para detener`n" -ForegroundColor Red

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        Write-Host "📥 Solicitud recibida: $($request.Url)" -ForegroundColor Gray

        # HTML de redirección automática
        $html = @"
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=$TargetUrl">
    <title>Redirigiendo...</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 { margin: 0 0 20px 0; font-size: 28px; }
        p { margin: 10px 0; font-size: 16px; opacity: 0.9; }
        a {
            color: white;
            text-decoration: underline;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Redirigiendo...</h1>
        <div class="spinner"></div>
        <p>Accediendo al sistema de Avery Dennison</p>
        <p style="font-size: 14px; margin-top: 30px;">
            Si no se redirige automáticamente, 
            <a href="$TargetUrl">haz clic aquí</a>
        </p>
    </div>
    <script>
        // Redirección JavaScript (backup)
        setTimeout(function() {
            window.location.href = '$TargetUrl';
        }, 500);
    </script>
</body>
</html>
"@

        $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
        $response.ContentLength64 = $buffer.Length
        $response.ContentType = "text/html; charset=utf-8"
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.Close()

        Write-Host "✅ Redirección enviada" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    Write-Host "`n🛑 Servidor detenido" -ForegroundColor Yellow
}
