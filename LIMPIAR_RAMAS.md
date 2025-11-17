# Cómo Limpiar las Ramas del Repositorio

## ¿Por qué hay tantas ramas `claude/*`?

Cuando Claude Code crea ramas para trabajar, genera nombres únicos con un ID de sesión. Esto es útil para rastrear cambios, pero puede acumularse con el tiempo.

## Solución: Limpieza Manual de Ramas

### Paso 1: Ver qué ramas tienes

```bash
# Ver ramas locales
git branch

# Ver ramas remotas
git branch -r
```

### Paso 2: Eliminar ramas remotas que ya fueron mergeadas

Ejecuta este script para eliminar todas las ramas `claude/*` remotas excepto la actual:

```bash
#!/bin/bash
# Script para limpiar ramas claude/* del repositorio remoto

# Lista de ramas que YA FUERON MERGEADAS (puedes verificar en GitHub)
RAMAS_A_ELIMINAR=(
  "claude/create-spa-login-01LMgKNEvedCZYW2zKwuZsLa"
  "claude/fix-console-errors-01645vYn2asWV3mbFv2kyXMs"
  "claude/fix-cors-login-error-01STYcg34nz5LrF2Wqu9eUBv"
  "claude/fix-docker-localhost-01TU2afjSrTfEyyPmonGSphg"
  "claude/fix-postgres-warnings-014RVVnY4iHapZMr1RHfS6cT"
  "claude/fix-sales-module-01Api8SMvopyD5FTRBzgGuso"
  "claude/setup-docker-config-015tu2hKtv4ZgJ4VpUMxZ9ih"
)

echo "Eliminando ramas remotas mergeadas..."
for rama in "${RAMAS_A_ELIMINAR[@]}"; do
  echo "Eliminando origin/$rama"
  git push origin --delete "$rama" 2>/dev/null || echo "  (rama no existe o ya fue eliminada)"
done

echo ""
echo "Limpieza completada!"
echo "Ejecuta 'git fetch --prune' para actualizar tu lista local de ramas remotas"
```

### Paso 3: Ejecutar la limpieza

Guarda el script anterior como `limpiar_ramas.sh` y ejecútalo:

```bash
chmod +x limpiar_ramas.sh
./limpiar_ramas.sh
```

O ejecuta directamente los comandos:

```bash
# Eliminar cada rama remota (ajusta según las que quieras eliminar)
git push origin --delete claude/create-spa-login-01LMgKNEvedCZYW2zKwuZsLa
git push origin --delete claude/fix-console-errors-01645vYn2asWV3mbFv2kyXMs
git push origin --delete claude/fix-cors-login-error-01STYcg34nz5LrF2Wqu9eUBv
git push origin --delete claude/fix-docker-localhost-01TU2afjSrTfEyyPmonGSphg
git push origin --delete claude/fix-postgres-warnings-014RVVnY4iHapZMr1RHfS6cT
git push origin --delete claude/fix-sales-module-01Api8SMvopyD5FTRBzgGuso
git push origin --delete claude/setup-docker-config-015tu2hKtv4ZgJ4VpUMxZ9ih

# Actualizar referencias locales
git fetch --prune
```

### Paso 4: Crear una rama principal (Recomendado)

Como trabajas solo, es mejor tener una rama principal (`main`) donde merges todo:

```bash
# Opción A: Renombrar la rama actual a main (si tienes permisos)
git checkout claude/cleanup-branches-015SvBzzf9p9tcdPTjrmhsxZ
git branch -m main
git push origin main
git push origin --delete claude/cleanup-branches-015SvBzzf9p9tcdPTjrmhsxZ

# Luego en GitHub, ve a Settings > Branches y cambia la rama por defecto a 'main'
```

```bash
# Opción B: Crear main desde la rama actual
git checkout -b main
git push -u origin main

# Luego en GitHub, ve a Settings > Branches y cambia la rama por defecto a 'main'
```

## Flujo de Trabajo Recomendado para el Futuro

1. **Trabaja en `main` directamente** (ya que estás solo)
   ```bash
   git checkout main
   git add .
   git commit -m "Tu mensaje"
   git push
   ```

2. **O usa ramas de features temporales** que eliminas después del merge
   ```bash
   git checkout -b feature/nueva-funcionalidad
   # ...haz cambios...
   git push -u origin feature/nueva-funcionalidad
   # Mergea en GitHub y elimina la rama después
   ```

3. **Elimina ramas después de mergear**
   ```bash
   # En GitHub, marca la opción "Delete branch" después de mergear un PR
   # O desde la línea de comandos:
   git push origin --delete nombre-de-rama
   ```

## Verificar el Resultado

Después de la limpieza, verifica que solo tienes las ramas necesarias:

```bash
git fetch --prune
git branch -r
```

Deberías ver solo `origin/main` o las ramas activas que estás usando.
