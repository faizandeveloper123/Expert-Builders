param([string]$Message = "auto-deploy")
git add -A
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git commit -m "$Message"
if ($LASTEXITCODE -ne 0) { Write-Host "Nothing to commit - already up to date." }
git push
