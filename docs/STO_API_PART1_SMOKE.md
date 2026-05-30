# STO API Part 1 Smoke

This document describes quick local checks for the first STO backend API slice.

## Start Backend

From the project root:

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

The STO endpoints require an auth user with an attached `StaffProfile`. Until seed/dev data is added, a normal auth user without `StaffProfile` should receive `403 STO_STAFF_PROFILE_REQUIRED`.

Login placeholder:

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/auth/login `
  -Headers @{ "Content-Type" = "application/json"; "X-Client-Platform" = "mobile" } `
  -Body (@{
    email = "admin@example.com"
    password = "change-me"
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

## Notes

- `PATCH /api/sto/orders/:id` rejects `status`; use `POST /api/sto/orders/:id/status`.
- Customers, vehicles and orders are always scoped to the current staff profile organization.
- Mechanics can read scoped data, but write access for standalone customer/vehicle/order creation is reserved for `MASTER`, `DIRECTOR` and `ADMIN` in this slice.
- Attachments, inspection acts, diagnostics, recommendations, real upload, chat and mobile UI are intentionally not implemented in this API slice.
