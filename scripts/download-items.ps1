# PowerShell Script para descargar imágenes de items de NosTale
# Guarda las imágenes en public/items/

param(
    [int]$StartVNum = 0,
    [int]$EndVNum = 10000,
    [string]$OutputFolder = "public/items"
)

# Crear carpeta de salida si no existe
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$outputPath = Join-Path $projectRoot $OutputFolder

if (-not (Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath -Force | Out-Null
    Write-Host "Carpeta creada: $outputPath" -ForegroundColor Green
}

# URL base de las imágenes (formato común de itempicker)
$baseUrl = "https://itempicker.atlagaming.eu/items"

# Contadores
$downloaded = 0
$skipped = 0
$failed = 0

Write-Host "`n=== Descargando imagenes de items ===" -ForegroundColor Cyan
Write-Host "Rango: $StartVNum - $EndVNum"
Write-Host "Destino: $outputPath`n"

# Descargar imágenes
for ($vnum = $StartVNum; $vnum -le $EndVNum; $vnum++) {
    $imageUrl = "$baseUrl/$vnum.png"
    $outputFile = Join-Path $outputPath "$vnum.png"
    
    # Saltar si ya existe
    if (Test-Path $outputFile) {
        $skipped++
        continue
    }
    
    try {
        # Intentar descargar
        $response = Invoke-WebRequest -Uri $imageUrl -Method Head -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Invoke-WebRequest -Uri $imageUrl -OutFile $outputFile -TimeoutSec 30
            $downloaded++
            
            # Mostrar progreso cada 100 items
            if ($downloaded % 100 -eq 0) {
                Write-Host "Descargadas: $downloaded imagenes..." -ForegroundColor Yellow
            }
        }
    }
    catch {
        # La imagen no existe para este vnum
        $failed++
    }
    
    # Mostrar progreso general cada 500 items
    if (($vnum - $StartVNum) % 500 -eq 0 -and $vnum -gt $StartVNum) {
        $progress = [math]::Round((($vnum - $StartVNum) / ($EndVNum - $StartVNum)) * 100, 1)
        Write-Host "Progreso: $progress% (vnum $vnum)" -ForegroundColor Cyan
    }
}

Write-Host "`n=== Descarga completada ===" -ForegroundColor Green
Write-Host "Descargadas: $downloaded"
Write-Host "Omitidas (ya existian): $skipped"
Write-Host "No encontradas: $failed"
Write-Host "`nImagenes guardadas en: $outputPath"
