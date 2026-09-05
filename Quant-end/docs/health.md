# Health Check

**Endpoint:** `GET /health`

## Description

Simple health check endpoint to verify the API server is running and responsive.

## Input

None.

## Output

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Server status (e.g., `ok`) |

## Example

### Request

```
GET /health
```

### Response

```json
{
  "status": "ok"
}
```