#!/bin/bash
# Script para limpiar ramas claude/* del repositorio remoto

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Script de Limpieza de Ramas ===${NC}"
echo ""
echo "Este script eliminará las ramas claude/* remotas que ya fueron mergeadas."
echo ""
read -p "¿Deseas continuar? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operación cancelada."
    exit 1
fi

# Lista de ramas que YA FUERON MERGEADAS (verificadas en los commits)
RAMAS_A_ELIMINAR=(
  "claude/create-spa-login-01LMgKNEvedCZYW2zKwuZsLa"
  "claude/fix-console-errors-01645vYn2asWV3mbFv2kyXMs"
  "claude/fix-cors-login-error-01STYcg34nz5LrF2Wqu9eUBv"
  "claude/fix-docker-localhost-01TU2afjSrTfEyyPmonGSphg"
  "claude/fix-postgres-warnings-014RVVnY4iHapZMr1RHfS6cT"
  "claude/fix-sales-module-01Api8SMvopyD5FTRBzgGuso"
  "claude/setup-docker-config-015tu2hKtv4ZgJ4VpUMxZ9ih"
)

echo ""
echo -e "${YELLOW}Eliminando ramas remotas mergeadas...${NC}"
echo ""

contador=0
for rama in "${RAMAS_A_ELIMINAR[@]}"; do
  echo -n "Eliminando origin/$rama ... "
  if git push origin --delete "$rama" 2>/dev/null; then
    echo -e "${GREEN}✓ Eliminada${NC}"
    ((contador++))
  else
    echo -e "${RED}✗ No existe o ya fue eliminada${NC}"
  fi
done

echo ""
echo -e "${YELLOW}Actualizando referencias locales...${NC}"
git fetch --prune

echo ""
echo -e "${GREEN}=== Limpieza Completada ===${NC}"
echo "Ramas eliminadas: $contador"
echo ""
echo "Ramas remotas restantes:"
git branch -r | grep -v "HEAD"
echo ""
echo -e "${YELLOW}Recomendación:${NC}"
echo "Considera crear una rama 'main' como rama principal del proyecto."
echo "Ver LIMPIAR_RAMAS.md para más información."
