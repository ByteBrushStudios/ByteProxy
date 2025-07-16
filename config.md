---
layout: default
title: Configuration Reference
nav_order: 4
---

# ByteProxy Configuration Reference

ByteProxy offers extensive configuration options through environment variables and dynamic configuration endpoints.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3420` | The port number for the server |
| `CORS_ENABLED` | `true` | Enable/disable CORS support |
| `CORS_ORIGINS` | `*` | Comma-separated list of allowed origins |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `REQUIRE_AUTH_FOR_PROXY` | `false` | Require authentication for proxy routes |
| `REQUIRE_AUTH_FOR_MANAGEMENT` | `false` | Require authentication for management routes |
| `PROXY_API_KEY` | | API key for proxy routes |
| `MANAGEMENT_API_KEY` | | API key for management routes |
| `NETWORK_TIMEOUT` | `30000` | Request timeout in milliseconds |
| `NETWORK_RETRIES` | `2` | Number of retry attempts for failed requests |
| `STRICT_TLS` | `true` | Enforce strict TLS certificate validation |
| `SKIP_UPDATE_CHECK` | `false` | Skip checking for updates at startup |
| `DISCORD_BOT_TOKEN` | | Discord bot token for authentication |
| `GITHUB_TOKEN` | | GitHub personal access token |

## Service Configuration

Services are defined in `src/config/index.ts` and can be dynamically managed through the API.

### Default Services

ByteProxy comes with pre-configured services:

#### Discord API

```typescript
{
    id: 'discord',
    name: 'Discord API',
    baseUrl: 'https://discord.com/api/',
    versionedBaseUrls: {
        v10: 'https://discord.com/api/v10/',
        v9: 'https://discord.com/api/v9/'
    },
    headers: {
        'User-Agent': 'DiscordBot (https://github.com/ByteBrushStudios/ByteProxy, 0.1.0)',
        'Content-Type': 'application/json'
    },
    rateLimit: {
        maxRequests: 50,
        windowMs: 60000
    },
    auth: {
        type: 'bot',
        tokenEnvVar: 'DISCORD_BOT_TOKEN'
    }
}
```

#### GitHub API

```typescript
{
    id: 'github',
    name: 'GitHub API',
    baseUrl: 'https://api.github.com/',
    headers: {
        'User-Agent': 'ByteProxy/0.1.0',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
    },
    rateLimit: {
        maxRequests: 60,
        windowMs: 3600000
    },
    auth: {
        type: 'bearer',
        tokenEnvVar: 'GITHUB_TOKEN'
    }
}
```

### Adding Custom Services

You can add custom services at runtime:

```bash
curl -X POST http://localhost:3420/manage/services \
  -H "Content-Type: application/json" \
  -d '{
    "key": "custom-api",
    "config": {
      "name": "Custom API",
      "baseUrl": "https://api.example.com/",
      "headers": {
        "User-Agent": "ByteProxy/1.0",
        "Content-Type": "application/json"
      },
      "rateLimit": {
        "maxRequests": 100,
        "windowMs": 60000
      },
      "auth": {
        "type": "bearer",
        "tokenEnvVar": "CUSTOM_API_TOKEN"
      }
    }
  }'
```

### Service Configuration Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name for the service |
| `baseUrl` | string | Base URL for API requests |
| `versionedBaseUrls` | object | Optional versioned endpoints |
| `headers` | object | Default headers to send with every request |
| `rateLimit.maxRequests` | number | Maximum requests allowed |
| `rateLimit.windowMs` | number | Time window for rate limiting in milliseconds |
| `auth.type` | string | Auth type: 'bearer', 'basic', 'api-key', or 'bot' |
| `auth.tokenEnvVar` | string | Environment variable containing the auth token |
| `auth.headerName` | string | Custom header name for api-key auth type |

## Configuration Management

### View Configuration

Access runtime configuration through the management endpoints:

```bash
# List all services
curl http://localhost:3420/manage/services

# Get specific service configuration
curl http://localhost:3420/manage/services/discord

# View diagnostics (includes configuration info)
curl http://localhost:3420/manage/diagnostics
```

### Testing Configuration

```bash
# Test service connectivity
curl -X POST http://localhost:3420/manage/services/github/test

# Check authentication status
curl http://localhost:3420/manage/key-debug
```

## Next Steps

- [Usage Guide](usage.md)
- [API Reference](api.md)
- [Troubleshooting](troubleshooting.md)
