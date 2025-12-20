# PowerShell Script para descargar imágenes de items de NosTale
# Descargas paralelas para mayor velocidad

param(
    [int]$StartVNum = 0,
    [int]$EndVNum = 15000,
    [string]$OutputFolder = "C:\Users\admin\Desktop\Nueva carpeta\website\public\items",
    [int]$MaxParallel = 20
)

# Crear carpeta de salida
if (-not (Test-Path $OutputFolder)) {
    New-Item -ItemType Directory -Path $OutputFolder -Force | Out-Null
    Write-Host "Carpeta creada: $OutputFolder" -ForegroundColor Green
}

$baseUrl = "https://itempicker.atlagaming.eu/items"

Write-Host "`n=== Descargando $($EndVNum - $StartVNum + 1) imagenes de items ===" -ForegroundColor Cyan
Write-Host "Paralelas: $MaxParallel | Destino: $OutputFolder`n"

# Crear lista de vnums a descargar (omitir existentes)
$vnumsToDownload = @()
for ($vnum = $StartVNum; $vnum -le $EndVNum; $vnum++) {
    $outputFile = Join-Path $OutputFolder "$vnum.png"
    if (-not (Test-Path $outputFile)) {
        $vnumsToDownload += $vnum
    }
}

$total = $vnumsToDownload.Count
$skipped = ($EndVNum - $StartVNum + 1) - $total

if ($total -eq 0) {
    Write-Host "Todas las imagenes ya existen!" -ForegroundColor Green
    exit
}

Write-Host "Por descargar: $total | Ya existentes: $skipped`n" -ForegroundColor Yellow

# Descargar en lotes paralelos
$downloaded = 0
$failed = 0
$startTime = Get-Date

$vnumsToDownload | ForEach-Object -ThrottleLimit $MaxParallel -Parallel {
    $vnum = $_
    $imageUrl = "$using:baseUrl/$vnum.png"
    $outputFile = Join-Path $using:OutputFolder "$vnum.png"
    
    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $imageUrl -OutFile $outputFile -TimeoutSec 30 -ErrorAction Stop
    }
    catch {
        # Imagen no existe o error de red
    }
}

# Contar resultados
$downloadedFiles = Get-ChildItem -Path $OutputFolder -Filter "*.png" | Measure-Object
$downloaded = $downloadedFiles.Count

$elapsed = (Get-Date) - $startTime

Write-Host "`n=== Descarga completada ===" -ForegroundColor Green
Write-Host "Total imagenes: $downloaded"
Write-Host "Tiempo: $([math]::Round($elapsed.TotalMinutes, 1)) minutos"
Write-Host "Guardadas en: $OutputFolder"
