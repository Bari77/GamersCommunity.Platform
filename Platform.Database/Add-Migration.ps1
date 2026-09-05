param(
    [Parameter(Mandatory = $true)]
    [string]$Name
)

Write-Host "Adding EF Core migration '$Name'..." -ForegroundColor Cyan
dotnet ef migrations add $Name `
    --project ./Platform.Database.csproj `
    --startup-project ../Platform.Consumer/Platform.Consumer.csproj `
    --output-dir Migrations

Write-Host "Done. Apply with: dotnet ef database update --project ./Platform.Database.csproj --startup-project ../Platform.Consumer/Platform.Consumer.csproj" -ForegroundColor Green
