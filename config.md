---
layout: default
title: Configuration Reference
nav_order: 4
---

# ByteProxy Configuration Reference

ByteProxy offers extensive configuration options to customize behavior.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3420` |
| `DISCORD_BOT_TOKEN` | Discord API token | - |
| `GITHUB_TOKEN` | GitHub Personal Access Token | - |
| `PROXY_API_KEY` | API key for proxy routes | - |
| `MANAGEMENT_API_KEY` | API key for management routes | - |
| `REQUIRE_AUTH_FOR_PROXY` | Enable auth for proxy routes | `false` |
| `REQUIRE_AUTH_FOR_MANAGEMENT` | Enable auth for management routes | `false` |

## Adding New Services

You can add services in two ways:

### 1. At Runtime (API)

Use the management API to add services dynamically:

```bash
curl -X POST http://localhost:3420/manage/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_MANAGEMENT_API_KEY" \
  -d '{
    "key": "openai",
    "config": {
      "name": "OpenAI API",
      "baseUrl": "https://api.openai.com/v1",
      "headers": {
        "Content-Type": "application/json"
      },
      "auth": {
        "type": "bearer",
        "tokenEnvVar": "OPENAI_API_KEY"
      },
      "rateLimit": {
        "maxRequests": 60,
        "windowMs": 60000
      }
    }
  }'
```

### 2. In Source Code

Edit `src/config/index.ts` to add persistent services:

```typescript
const defaultConfig: ProxyConfig = {
  // ...existing config...
  services: {
    // ...existing services...
    openai: {
      name: 'OpenAI API',
      baseUrl: 'https://api.openai.com/v1',
      headers: {
        'Content-Type': 'application/json'
      },
      auth: {
        type: 'bearer',
        tokenEnvVar: 'OPENAI_API_KEY'
      },
      rateLimit: {
        maxRequests: 60,
        windowMs: 60000
      }
    }
  }
}
```

## Service Configuration Options

| Option | Description | Type | Required |
|--------|-------------|------|----------|
| `name` | Human-readable service name | `string` | Yes |
| `baseUrl` | Base URL for the API | `string` | Yes |
| `headers` | Default headers to include | `Record<string, string>` | No |
| `auth` | Authentication configuration | `object` | No |
| `auth.type` | Auth type: `bearer`, `basic`, `api-key`, or `bot` | `string` | Yes (if auth) |
| `auth.tokenEnvVar` | Environment variable with token | `string` | No |
| `auth.headerName` | Header name for API key auth | `string` | Only for `api-key` |
| `rateLimit` | Rate limiting configuration | `object` | No |
| `rateLimit.maxRequests` | Max requests per window | `number` | Yes (if rateLimit) |
| `rateLimit.windowMs` | Time window in milliseconds | `number` | Yes (if rateLimit) |
| `versionedBaseUrls` | URLs for different API versions | `Record<string, string>` | No |

## CORS Configuration

Configure CORS in `src/config/index.ts`:

```typescript
cors: {
  enabled: true,
  origins: ['https://yourdomain.com', 'https://app.yourdomain.com']
}
```

Use `origins: ['*']` to allow all origins (not recommended for production).

## Network Settings

```typescript
network: {
  timeout: 30000, // Request timeout in ms
  retryAttempts: 2, // Number of retry attempts
  strictTLS: true // Enforce strict TLS certificate validation
}
```

## Logging Configuration

```typescript
logging: {
  enabled: true,
  level: 'info' // 'debug', 'info', 'warn', or 'error'
}
```

## Path Rewriting

For services that require special path handling, use the `proxyHttpOrWs` method with path rewriting:

```typescript
proxyService.proxyHttpOrWs(req, res, targetUrl, {
  rewritePrefix: '/api/v1',
  rewritePath: (path, req) => path.replace(/^\/old/, '/new'),
  ws: true // Enable WebSocket support
})
```

## Next Steps

- [Usage Guide](usage.md) - How to use ByteProxy
- [API Reference](api.md) - Complete API documentation
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
