$ErrorActionPreference = "Stop"

$ProjectRoot = [System.IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
$ArtifactRoot = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot "artifacts"))
$Version = (Get-Content (Join-Path $ProjectRoot "package.json") -Raw | ConvertFrom-Json).version
$ReleaseName = "Feature-Foundry-v$Version"
$StageRoot = [System.IO.Path]::GetFullPath((Join-Path $ArtifactRoot "$ReleaseName-stage"))

if (-not $ArtifactRoot.StartsWith($ProjectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Artifact path escaped the Feature Foundry project."
}
if (Test-Path -LiteralPath $StageRoot) {
  if (-not $StageRoot.StartsWith($ArtifactRoot, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe staging path." }
  Remove-Item -LiteralPath $StageRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $ArtifactRoot -Force | Out-Null
Get-ChildItem -LiteralPath $ArtifactRoot -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "$ReleaseName-*" } | Remove-Item -Force
New-Item -ItemType Directory -Path (Join-Path $StageRoot "web") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StageRoot "source") -Force | Out-Null

Copy-Item -Path (Join-Path $ProjectRoot "dist\*") -Destination (Join-Path $StageRoot "web") -Recurse -Force
foreach ($directory in @("src", "tests", "scripts", "reference")) {
  $destination = Join-Path (Join-Path $StageRoot "source") $directory
  Copy-Item -LiteralPath (Join-Path $ProjectRoot $directory) -Destination $destination -Recurse -Force
}
$NativeSource = Join-Path $StageRoot "source\src-tauri"
New-Item -ItemType Directory -Path $NativeSource -Force | Out-Null
foreach ($entry in @("src", "capabilities", "gen", "icons", "build.rs", "Cargo.lock", "Cargo.toml", "tauri.conf.json")) {
  Copy-Item -LiteralPath (Join-Path $ProjectRoot "src-tauri\$entry") -Destination $NativeSource -Recurse -Force
}
foreach ($file in @("index.html", "package.json", "package-lock.json", "tsconfig.json", "vite.config.ts", "README.md", "LICENSE", ".gitignore")) {
  Copy-Item -LiteralPath (Join-Path $ProjectRoot $file) -Destination (Join-Path $StageRoot "source") -Force
}

$WebZip = Join-Path $ArtifactRoot "$ReleaseName-web.zip"
$SourceZip = Join-Path $ArtifactRoot "$ReleaseName-source.zip"
Remove-Item -LiteralPath $WebZip, $SourceZip -Force -ErrorAction SilentlyContinue
Compress-Archive -Path (Join-Path $StageRoot "web\*") -DestinationPath $WebZip -CompressionLevel Optimal
Compress-Archive -Path (Join-Path $StageRoot "source\*") -DestinationPath $SourceZip -CompressionLevel Optimal

$BundleRoot = Join-Path $ProjectRoot "src-tauri\target\release\bundle"
if (-not (Test-Path -LiteralPath $BundleRoot)) { throw "Native release bundles are missing. Run npm run desktop:build first." }
$NativeArtifacts = Get-ChildItem -LiteralPath $BundleRoot -Recurse -File | Where-Object { $_.Extension -in @(".exe", ".msi", ".dmg", ".AppImage", ".deb", ".rpm") }
if (-not $NativeArtifacts) { throw "No installable native artifact was found in the Tauri bundle directory." }
foreach ($artifact in $NativeArtifacts) {
  $suffix = switch ($artifact.Extension) {
    ".exe" { "windows-x64-setup.exe" }
    ".msi" { "windows-x64.msi" }
    default { "$($artifact.BaseName)$($artifact.Extension)" }
  }
  Copy-Item -LiteralPath $artifact.FullName -Destination (Join-Path $ArtifactRoot "$ReleaseName-$suffix") -Force
}

$ReleaseFiles = Get-ChildItem -LiteralPath $ArtifactRoot -File | Where-Object { $_.Name -like "$ReleaseName-*" }
$ChecksumLines = foreach ($file in $ReleaseFiles) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $stream = [System.IO.File]::OpenRead($file.FullName)
  try { $bytes = $sha.ComputeHash($stream) } finally { $stream.Dispose(); $sha.Dispose() }
  $hash = ([System.BitConverter]::ToString($bytes) -replace "-", "").ToLowerInvariant()
  "$hash  $($file.Name)"
}
$ChecksumPath = Join-Path $ArtifactRoot "SHA256SUMS.txt"
[System.IO.File]::WriteAllLines($ChecksumPath, [string[]]$ChecksumLines, [System.Text.UTF8Encoding]::new($false))

$CompleteZip = Join-Path $ArtifactRoot "$ReleaseName-complete-release.zip"
$CompleteInputs = @($ReleaseFiles | ForEach-Object { $_.FullName }) + $ChecksumPath
Compress-Archive -LiteralPath $CompleteInputs -DestinationPath $CompleteZip -CompressionLevel Optimal
$sha = [System.Security.Cryptography.SHA256]::Create()
$stream = [System.IO.File]::OpenRead($CompleteZip)
try { $bytes = $sha.ComputeHash($stream) } finally { $stream.Dispose(); $sha.Dispose() }
$CompleteHash = ([System.BitConverter]::ToString($bytes) -replace "-", "").ToLowerInvariant()
[System.IO.File]::AppendAllLines($ChecksumPath, [string[]]@("$CompleteHash  $([System.IO.Path]::GetFileName($CompleteZip))"), [System.Text.UTF8Encoding]::new($false))
$ReleaseFiles = Get-ChildItem -LiteralPath $ArtifactRoot -File | Where-Object { $_.Name -like "$ReleaseName-*" }

Remove-Item -LiteralPath $StageRoot -Recurse -Force
$ReleaseFiles | Select-Object Name, Length
Get-Content -LiteralPath $ChecksumPath
