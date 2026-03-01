# Install Dependencies Plan - run from repo root after Node.js 20+ is installed
# Usage: .\install-deps.ps1  or  .\install-deps.ps1 -RunTests

param([switch]$RunTests)

$ErrorActionPreference = "Stop"

# Step 1: Verify Node.js and npm
try {
    $nodeVersion = node -v
    $npmVersion = npm -v
    Write-Host "Node: $nodeVersion  npm: $npmVersion"
} catch {
    Write-Host "Node.js and npm are required. Install Node.js LTS from https://nodejs.org/ then re-run this script."
    exit 1
}

# Step 2: Install workspace dependencies
Write-Host "Running npm install..."
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Step 3: Generate Prisma client
Write-Host "Running prisma:generate..."
npm run prisma:generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Step 4: Optional tests
if ($RunTests) {
    Write-Host "Running tests..."
    npm run test
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "Skipping tests. Run with -RunTests to run tests."
}

Write-Host "Done."
