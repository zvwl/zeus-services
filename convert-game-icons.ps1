# Game Icon Converter Script
# Converts and resizes game icons to 128x128 PNG format

$sourceFolder = "$PSScriptRoot\temp-icons"
$outputFolder = "$PSScriptRoot\public\game-icons"
$targetSize = 128

Write-Host "=== Game Icon Converter ===" -ForegroundColor Cyan
Write-Host ""

# Create output folder if needed
if (-not (Test-Path $outputFolder)) {
    New-Item -ItemType Directory -Path $outputFolder | Out-Null
    Write-Host "Created output folder" -ForegroundColor Green
}

# Create source folder if needed
if (-not (Test-Path $sourceFolder)) {
    New-Item -ItemType Directory -Path $sourceFolder | Out-Null
    Write-Host "Created source folder: temp-icons" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please place your game icon images in the temp-icons folder" -ForegroundColor Yellow
    Write-Host "Supported: JPG PNG BMP GIF" -ForegroundColor White
    Write-Host ""
    Write-Host "Rename files to:" -ForegroundColor White
    Write-Host "  gta5.jpg" -ForegroundColor Gray
    Write-Host "  forza-horizon-6.jpg" -ForegroundColor Gray
    Write-Host "  fortnite.jpg" -ForegroundColor Gray
    Write-Host "  rocket-league.jpg" -ForegroundColor Gray
    Write-Host "  default.jpg" -ForegroundColor Gray
    exit
}

# Get all images
$images = Get-ChildItem -Path $sourceFolder -Include *.jpg,*.jpeg,*.png,*.bmp,*.gif,*.webp -Recurse

if ($images.Count -eq 0) {
    Write-Host "No images found in temp-icons folder" -ForegroundColor Yellow
    Write-Host "Add some images and run again" -ForegroundColor White
    exit
}

Write-Host "Found $($images.Count) image(s)" -ForegroundColor Green
Write-Host ""

Add-Type -AssemblyName System.Drawing

foreach ($file in $images) {
    $name = $file.BaseName
    
    Write-Host "Processing $($file.Name)" -ForegroundColor Cyan
    
    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        $bitmap = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        
        $srcAspect = $img.Width / $img.Height
        
        if ($srcAspect -gt 1) {
            $drawHeight = $targetSize
            $drawWidth = [int]($targetSize * $srcAspect)
            $drawX = -[int](($drawWidth - $targetSize) / 2)
            $drawY = 0
        } else {
            $drawWidth = $targetSize
            $drawHeight = [int]($targetSize / $srcAspect)
            $drawX = 0
            $drawY = -[int](($drawHeight - $targetSize) / 2)
        }
        
        $graphics.DrawImage($img, $drawX, $drawY, $drawWidth, $drawHeight)
        
        $pngPath = Join-Path $outputFolder "$name.png"
        $bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $graphics.Dispose()
        $bitmap.Dispose()
        $img.Dispose()
        
        Write-Host "  Saved: $name.png (${targetSize}x${targetSize})" -ForegroundColor Green
        
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "PNG files created in: $outputFolder" -ForegroundColor Cyan
Write-Host ""
Write-Host "To convert to WebP:" -ForegroundColor Yellow
Write-Host "  - Use https://cloudconvert.com/png-to-webp" -ForegroundColor Gray
Write-Host "  - Or keep PNG files (they work fine)" -ForegroundColor Gray
