# STO API Part 1 Smoke

This document describes quick local checks for the first STO backend API slice.

## Start Backend

From the project root, seed local STO demo data first:

```powershell
bun run --cwd backend seed:sto
```

Then start the backend:

```powershell
bun run --cwd backend dev
```

Health check:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/health
```

Expected:

```json
{ "status": "ok" }
```

## Auth Token

The STO endpoints require an auth user with an attached `StaffProfile`. The local seed creates demo staff users.

Login as a dev admin user:

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/auth/login `
  -Headers @{ "Content-Type" = "application/json"; "X-Client-Platform" = "mobile" } `
  -Body (@{
    email = "admin@example.com"
    password = "DevPassword123!"
  } | ConvertTo-Json)

$token = $login.accessToken
$headers = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/json"
}
```

## Endpoints Added

Current STO user:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/sto/me -Headers $headers
```

Service centers:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/sto/service-centers -Headers $headers
```

Orders from seed:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/sto/orders?limit=20" -Headers $headers
```

Customers:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/sto/customers?limit=20" -Headers $headers

$customer = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/sto/customers `
  -Headers $headers `
  -Body (@{
    name = "Иван Иванов"
    phone = "+79990000000"
  } | ConvertTo-Json)

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/sto/customers/$($customer.id)" -Headers $headers
```

Vehicles:

```powershell
$vehicle = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/sto/vehicles `
  -Headers $headers `
  -Body (@{
    customerId = $customer.id
    brandModel = "Toyota Camry"
    plate = "A001AA38"
  } | ConvertTo-Json)

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/sto/vehicles?search=Toyota" -Headers $headers
```

Work orders:

```powershell
$order = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/sto/orders `
  -Headers $headers `
  -Body (@{
    customerId = $customer.id
    vehicleId = $vehicle.id
    visitReason = "Диагностика ходовой"
    mileage = 120000
  } | ConvertTo-Json)

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/sto/orders/$($order.id)" -Headers $headers
```

Create a new order from seeded customer and vehicle:

```powershell
$customers = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/sto/customers?search=Иван" -Headers $headers
$vehicles = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/sto/vehicles?search=Toyota" -Headers $headers

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/sto/orders `
  -Headers $headers `
  -Body (@{
    customerId = $customers.items[0].id
    vehicleId = $vehicles.items[0].id
    visitReason = "Local smoke order"
    mileage = 153000
  } | ConvertTo-Json)
```

Change status:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/sto/orders/$($order.id)/status" `
  -Headers $headers `
  -Body (@{
    status = "IN_PROGRESS"
    comment = "Работа начата"
  } | ConvertTo-Json)
```

Patch work order without status:

```powershell
Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:3000/api/sto/orders/$($order.id)" `
  -Headers $headers `
  -Body (@{
    visitReason = "Диагностика ходовой и тормозов"
  } | ConvertTo-Json)
```

## Cookie Session Variant

Mobile checks normally use the bearer token returned by `/api/auth/login`. For browser cookie checks, keep a PowerShell web session:

```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/auth/login `
  -WebSession $session `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body (@{
    email = "admin@example.com"
    password = "DevPassword123!"
  } | ConvertTo-Json)
```

## Notes

- `PATCH /api/sto/orders/:id` rejects `status`; use `POST /api/sto/orders/:id/status`.
- Customers, vehicles and orders are always scoped to the current staff profile organization.
- Mechanics can read scoped data, but write access for standalone customer/vehicle/order creation is reserved for `MASTER`, `DIRECTOR` and `ADMIN` in this slice.
- Attachments, inspection acts, diagnostics, recommendations, real upload, chat and mobile UI are intentionally not implemented in this API slice.
