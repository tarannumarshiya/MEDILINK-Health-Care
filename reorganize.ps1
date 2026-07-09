$ErrorActionPreference = "Stop"

$workspace = "c:\Users\Arshiya tarrnum\OneDrive\Desktop\M\medlink"
Set-Location $workspace

# 1. Create frontend directory
New-Item -ItemType Directory -Force -Path "$workspace\frontend"

# 2. List of items that belong to frontend
$frontendItems = @(
    ".env",
    "eslint.config.mjs",
    "next-env.d.ts",
    "next.config.ts",
    "package.json",
    "package-lock.json",
    "postcss.config.mjs",
    "tsconfig.json",
    "tsconfig.tsbuildinfo",
    "src",
    "public",
    ".next",
    "node_modules"
)

# Move items to frontend
foreach ($item in $frontendItems) {
    if (Test-Path $item) {
        Move-Item -Path $item -Destination "$workspace\frontend\" -Force
        Write-Host "Moved $item to frontend/"
    }
}

# 3. Handle backend
# Currently there is backend/backend. Let's move its contents up.
if (Test-Path "$workspace\backend\backend") {
    $backendItems = Get-ChildItem -Path "$workspace\backend\backend"
    foreach ($item in $backendItems) {
        Move-Item -Path $item.FullName -Destination "$workspace\backend\" -Force
        Write-Host "Moved $($item.Name) up to backend/"
    }
    Remove-Item -Path "$workspace\backend\backend" -Recurse -Force
    Write-Host "Removed empty backend/backend directory"
}

# 4. Remove empty medilink-healthcare directory
if (Test-Path "$workspace\medilink-healthcare") {
    Remove-Item -Path "$workspace\medilink-healthcare" -Recurse -Force
    Write-Host "Removed medilink-healthcare directory"
}

Write-Host "Reorganization complete!"
