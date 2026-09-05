param(
    [Parameter(Mandatory = $true)]
    [string]$Name
)

Write-Host "Adding EF Core migration '$Name'..." -ForegroundColor Cyan
dotnet ef migrations add $Name `
    --project ./MainSite.Database.csproj `
    --startup-project ../MainSite.Consumer/MainSite.Consumer.csproj `
    --output-dir Migrations

Write-Host "Done. Apply with: dotnet ef database update --project ./MainSite.Database.csproj --startup-project ../MainSite.Consumer/MainSite.Consumer.csproj" -ForegroundColor Green
