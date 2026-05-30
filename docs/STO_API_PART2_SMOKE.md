# STO API Part 2 Smoke

Quick PowerShell checks for inspection acts, diagnostics, recommendations, attachment metadata and order summaries.

## Seed And Login

```powershell
bun run --cwd backend seed:sto

$baseUrl = "http://localhost:3000"

$login = Invoke-RestMethod `
  -Method Post `
  -Uri "$baseUrl/api/auth/login" `
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

## Health And Order Id

```powershell
Invoke-RestMethod -Method Get -Uri "$baseUrl/health"

$orders = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/sto/orders?limit=20" -Headers $headers
$order = $orders.items | Where-Object { $_.number -eq "WO-0002" } | Select-Object -First 1
$orderId = $order.id
$orderId
```

## Inspection

```powershell
Invoke-RestMethod -Method Get -Uri "$baseUrl/api/sto/orders/$orderId/inspection" -Headers $headers

$inspection = Invoke-RestMethod `
  -Method Put `
  -Uri "$baseUrl/api/sto/orders/$orderId/inspection" `
  -Headers $headers `
  -Body (@{
    dataJson = @{
      schemaVersion = 1
      values = @{
        low_beam = "urgent"
        washer_fluid = "attention"
        notes = "Left headlight and washer fluid need attention"
      }
    }
    completedAt = (Get-Date).ToUniversalTime().ToString("o")
  } | ConvertTo-Json -Depth 8)

$inspection.inspectionAct.id

Invoke-RestMethod `
  -Method Patch `
  -Uri "$baseUrl/api/sto/orders/$orderId/inspection" `
  -Headers $headers `
  -Body (@{
    completedAt = $null
  } | ConvertTo-Json -Depth 8)
```

## Diagnostics

```powershell
Invoke-RestMethod -Method Get -Uri "$baseUrl/api/sto/orders/$orderId/diagnostics" -Headers $headers

$diagnostic = Invoke-RestMethod `
  -Method Post `
  -Uri "$baseUrl/api/sto/orders/$orderId/diagnostics" `
  -Headers $headers `
  -Body (@{
    dataJson = @{
      schemaVersion = 1
      values = @{
        front_shock_absorber = @{
          left = @{
            status = "not_ok"
            partsPrice = "10000"
            servicePrice = "3000"
            comment = "Replace left front shock absorber"
          }
          right = @{
            status = "ok"
            partsPrice = $null
            servicePrice = $null
            comment = $null
          }
        }
        alignment = @{
          status = "recommend_service"
          partsPrice = $null
          servicePrice = "2500"
          comment = "Alignment recommended"
        }
      }
    }
  } | ConvertTo-Json -Depth 10)

$diagnostic.id
$diagnostic.grandTotal

Invoke-RestMethod `
  -Method Put `
  -Uri "$baseUrl/api/sto/diagnostics/$($diagnostic.id)" `
  -Headers $headers `
  -Body (@{
    alignmentComment = "Do alignment after suspension work"
  } | ConvertTo-Json -Depth 8)
```

## Recommendations

```powershell
Invoke-RestMethod -Method Get -Uri "$baseUrl/api/sto/orders/$orderId/recommendations" -Headers $headers

$recommendation = Invoke-RestMethod `
  -Method Post `
  -Uri "$baseUrl/api/sto/orders/$orderId/recommendations" `
  -Headers $headers `
  -Body (@{
    diagnosticId = $diagnostic.id
    text = "Replace left front shock absorber"
    partsPrice = "10000"
    servicePrice = "3000"
  } | ConvertTo-Json -Depth 8)

Invoke-RestMethod `
  -Method Patch `
  -Uri "$baseUrl/api/sto/recommendations/$($recommendation.id)" `
  -Headers $headers `
  -Body (@{
    status = "APPROVED"
  } | ConvertTo-Json -Depth 8)
```

## Attachment Metadata

This smoke test creates metadata only. It does not upload a real file.

```powershell
Invoke-RestMethod -Method Get -Uri "$baseUrl/api/sto/orders/$orderId/attachments" -Headers $headers

$attachment = Invoke-RestMethod `
  -Method Post `
  -Uri "$baseUrl/api/sto/orders/$orderId/attachments" `
  -Headers $headers `
  -Body (@{
    diagnosticId = $diagnostic.id
    recommendationId = $recommendation.id
    type = "PHOTO"
    visibility = "INTERNAL"
    storageKey = "local-smoke/wo-0002/front-left-shock.jpg"
    originalFilename = "front-left-shock.jpg"
    mimeType = "image/jpeg"
    byteSize = 123456
    caption = "Local smoke metadata only"
  } | ConvertTo-Json -Depth 8)

Invoke-RestMethod `
  -Method Delete `
  -Uri "$baseUrl/api/sto/attachments/$($attachment.id)" `
  -Headers $headers
```

## Summary

```powershell
Invoke-RestMethod -Method Get -Uri "$baseUrl/api/sto/orders/$orderId/summary" -Headers $headers
```

Expected summary includes the order status, customer, vehicle, inspection problem items, diagnostic problem items, recommendations, attachment count and money totals.
