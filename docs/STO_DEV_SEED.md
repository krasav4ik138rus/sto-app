# STO Dev Seed

Local STO seed creates demo data for checking `/api/sto` endpoints on a developer machine.

Run from the project root:

```powershell
bun run --cwd backend seed:sto
```

The script is idempotent: repeat runs update the same demo records instead of creating duplicates.

## Dev Users

All dev users use the same dev-only password:

```text
DevPassword123!
```

This password is intentionally documented for local development only. It is not stored in `.env` and must not be used in production.

Seeded users:

- `mechanic@example.com` / `MECHANIC` / `Demo Mechanic`
- `master@example.com` / `MASTER` / `Demo Master`
- `director@example.com` / `DIRECTOR` / `Demo Director`
- `admin@example.com` / `ADMIN` / `Demo Admin`

## Organization And Service Center

- Organization: `Demo AutoService`
- Slug: `demo-autoservice`
- Timezone: `Europe/Helsinki`
- Service center: `Main STO`
- Address: `Local dev service center`
- Phone: `+10000000000`

`MECHANIC` and `MASTER` are linked to `Main STO`. `DIRECTOR` and `ADMIN` are organization-wide and have no service center assigned.

## Demo Data

Customers:

- `Иван Петров`, `+79990000001`
- `Сергей Иванов`, `+79990000002`
- `Анна Смирнова`, `+79990000003`

Vehicles:

- `Toyota Camry`, VIN `JTDBE32K620123456`, plate `A001AA`, mileage `152000`
- `BMW X5`, VIN `WBAKS410500123456`, plate `B002BB`, mileage `211000`
- `Hyundai Solaris`, VIN `Z94CT41CAJR123456`, plate `C003CC`, mileage `87000`

Work orders:

- `WO-0001`: Toyota Camry, `OPEN`, `Плановый осмотр`
- `WO-0002`: BMW X5, `IN_PROGRESS`, `Стук в передней подвеске`
- `WO-0003`: Hyundai Solaris, `AWAITING_APPROVAL`, `Проверка тормозной системы`
- `WO-0004`: Toyota Camry, `CLOSED`, `Замена масла и проверка жидкостей`

Each order has initial `WorkOrderStatusHistory`. Orders `WO-0002`, `WO-0003`, and `WO-0004` also include one extra seed status-history row.

For `WO-0002`, the seed creates example metadata:

- `InspectionAct` with sample `dataJson` values: `low_beam`, `coolant`, `inspection_recommendations`.
- `Diagnostic` with `front_shock_absorber` left/right values and totals `10000 + 3000 = 13000`.
- `Recommendation`: `Заменить передний левый амортизатор`.
- `OrderAttachment` metadata only: `dev/wo-0002/front-suspension-left.jpg`.

No real file upload happens.

## Check Login And STO Context

Start backend:

```powershell
bun run --cwd backend dev
```

Login as admin:

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/auth/login `
  -Headers @{ "Content-Type" = "application/json"; "X-Client-Platform" = "mobile" } `
  -Body (@{
    email = "admin@example.com"
    password = "DevPassword123!"
  } | ConvertTo-Json)

$headers = @{
  Authorization = "Bearer $($login.accessToken)"
  "Content-Type" = "application/json"
}
```

Check STO context:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/sto/me -Headers $headers
```

List orders:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/sto/orders?limit=20" -Headers $headers
```

Create order using existing customer and vehicle:

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
