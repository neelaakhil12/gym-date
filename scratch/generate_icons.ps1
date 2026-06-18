Add-Type -AssemblyName System.Drawing

$originalPath = "c:\Users\AKHIL KUMAR\OneDrive\Desktop\gym dates\image copy.png"
$appAssetsDir = "c:\Users\AKHIL KUMAR\OneDrive\Desktop\gym dates\gymdate-app\assets"

function Resize-Icon {
    param (
        [string]$outputPath,
        [double]$scaleFactor,
        [bool]$transparent
    )

    $targetSize = 512
    $logoSize = [int]($targetSize * $scaleFactor)
    $offset = [int](($targetSize - $logoSize) / 2)

    # Load original
    $original = [System.Drawing.Image]::FromFile($originalPath)
    
    # Create new bitmap
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Set high quality settings
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if (-not $transparent) {
        $g.Clear([System.Drawing.Color]::White)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    # Draw logo scaled and centered
    $g.DrawImage($original, $offset, $offset, $logoSize, $logoSize)
    
    # If transparent, remove off-white background
    if ($transparent) {
        # Loop through pixels to make background transparent
        for ($y = 0; $y -lt $targetSize; $y++) {
            for ($x = 0; $x -lt $targetSize; $x++) {
                $pixel = $bmp.GetPixel($x, $y)
                # If pixel is close to white (R > 240, G > 240, B > 240), make it transparent
                if ($pixel.R -gt 240 -and $pixel.G -gt 240 -and $pixel.B -gt 240) {
                    $bmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
                }
            }
        }
    }

    # Clean up graphics
    $g.Dispose()
    $original.Dispose()

    # Save to file
    if (Test-Path $outputPath) {
        Remove-Item $outputPath -Force
    }
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Generated: $outputPath"
}

# Generate main icon (white background, 50% scale)
Resize-Icon -outputPath (Join-Path $appAssetsDir "icon.png") -scaleFactor 0.50 -transparent $false

# Generate adaptive foreground icon (transparent background, 50% scale)
Resize-Icon -outputPath (Join-Path $appAssetsDir "android-icon-foreground.png") -scaleFactor 0.50 -transparent $true
