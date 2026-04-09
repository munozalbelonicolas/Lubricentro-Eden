# Script de Despliegue Manual - Lubricentro Eden
# Version sin acentos para evitar errores de encoding

Write-Host "Iniciando build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en el build. Abortando." -ForegroundColor Red
    exit
}

Write-Host "Desplegando a GitHub Pages..." -ForegroundColor Cyan
if (Test-Path dist\.git) { Remove-Item -Recurse -Force dist\.git }
cd dist

# Inicializar repo temporal
git init
git add -A
git commit -m "Manual Deploy"

# Forzar el push
git remote add origin https://github.com/munozalbelonicolas/Lubricentro-Eden.git
git push -f origin main:gh-pages

cd ..
Write-Host "Proceso completado con exito!" -ForegroundColor Green
