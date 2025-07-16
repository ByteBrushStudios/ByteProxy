---
layout: default
title: API Reference
nav_order: 6
---

# ByteProxy API Reference

This document provides a comprehensive reference of all endpoints available in ByteProxy.

> **Note:** The interactive API documentation is available at [/docs](http://localhost:3420/docs) when the server is running.

## Base Endpoints

### GET /

Returns basic information about the ByteProxy API.

**Response Example:**
```json
{
  "message": "Welcome to ByteProxy, feel free to browse around!",
  "source": "https://github.com/ByteBrushStudios/ByteProxy",
  "documentation": "/docs",
  "status": "/status",
  "health": "/health",
  "version": "v0.1.0-dev",
  "checkUpdates": "/version/check"
}
```

### GET /up

View information about the server's pressure state.

**Response Example:**
```json
{
  "status": "ok",
  "eventLoopDelay": 0.34,
  "heapUsed": 21450240,
  "rssBytes": 67584000,
  "eventLoopUtilized": 0.002,
  "healthy": true
}
```

## Health Endpoints

### GET /health

Quick health check endpoint.

**Response Example:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2023-05-15T12:00:00.000Z"
}
```

### GET /status

Detailed status information.

**Response Example:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "version": "v0.1.0-dev",
  "services": {
    "discord": {
      "status": "ok",
      "authConfigured": true
    },
    "github": {
      "status": "ok",
      "authConfigured": true
    }
  },
  "system": {
    "memoryUsage": {
      "rss": 67584000,
      "heapTotal": 33554432,
      "heapUsed": 21450240,
      "external": 1572864
    },
    "loadAverage": [1.2, 1.1, 0.95]
  }
}
```

## Proxy Endpoints

### GET|POST|PUT|DELETE /proxy/:service/*

Proxy requests to the specified service.

**Parameters:**
- `:service` - The service to proxy to (e.g., discord, github)
- `*` - The path to forward to the service

**Example:**
```bash
# Get GitHub user info
curl http://localhost:3420/proxy/github/users/ByteBrushStudios

# Send message to Discord
curl -X POST http://localhost:3420/proxy/discord/channels/123456789/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello!"}'
```

## Management Endpoints

### GET /manage/services

List all configured services.

**Response Example:**
```json
{
  "services": [
    {
      "key": "discord",
      "name": "Discord API",
      "baseUrl": "https://discord.com/api/",
      "hasAuth": true,
      "authConfigured": true,
      "rateLimit": {
        "maxRequests": 50,
        "windowMs": 60000
      }
    },
    {
      "key": "github",
      "name": "GitHub API",
      "baseUrl": "https://api.github.com/",
      "hasAuth": true,
      "authConfigured": true,
      "rateLimit": {
        "maxRequests": 60,
        "windowMs": 3600000
      }
    }
  ],
  "count": 2
}
```

### GET /manage/services/:key

Get configuration for a specific service.

**Parameters:**
- `:key` - The service key

**Response Example:**
```json
{
  "key": "github",
  "config": {
    "name": "GitHub API",
    "baseUrl": "https://api.github.com/",
    "headers": {
      "User-Agent": "ByteProxy/0.1.0",
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    "auth": {
      "type": "bearer",
      "tokenConfigured": true
    },
    "rateLimit": {
      "maxRequests": 60,
      "windowMs": 3600000
    }
  }
}
```

### POST /manage/services

Add a new service.

**Request Body:**
```json
{
  "key": "custom-api",
  "config": {
    "name": "Custom API",
    "baseUrl": "https://api.example.com/",
    "headers": {
      "User-Agent": "ByteProxy/1.0"
    }
  }
}
```

**Response Example:**
```json
{
  "message": "Service 'custom-api' added successfully",
  "key": "custom-api",
  "config": {
    "name": "Custom API",
    "baseUrl": "https://api.example.com/",
    "headers": {
      "User-Agent": "ByteProxy/1.0"
    }
  }
}
```

### POST /manage/services/:key/test

Test connectivity to a service.

**Parameters:**
- `:key` - The service key

**Response Example (Success):**
```json
{
  "service": "github",
  "status": "reachable",
  "responseStatus": 200,
  "duration": "123ms",
  "baseUrl": "https://api.github.com/"
}
```

**Response Example (Failure):**
```json
{
  "service": "custom-api",
  "status": "unreachable",
  "error": "connect ECONNREFUSED 127.0.0.1:80",
  "baseUrl": "https://api.example.com/",
  "troubleshooting": {
    "suggestions": [
      "Check your internet connection",
      "Verify the service URL is correct",
      "Check if the service is experiencing downtime",
      "If you see TLS/SSL errors, the service may have certificate issues"
    ]
  }
}
```

### GET /manage/diagnostics

Get system and network diagnostics.

**Response Example:**
```json
{
  "system": {
    "platform": "linux",
    "nodeVersion": "v18.12.1",
    "runtime": "Bun",
    "uptime": 3600
  },
  "network": {
    "strictTLS": true,
    "timeout": 30000,
    "retryAttempts": 2
  },
  "environment": {
    "timeZone": "UTC",
    "currentTime": "2023-05-15T12:00:00.000Z",
    "locale": "en-US"
  },
  "authentication": {
    "discord": {
      "tokenConfigured": true,
      "envVar": "DISCORD_BOT_TOKEN",
      "authType": "bot"
    },
    "github": {
      "tokenConfigured": true,
      "envVar": "GITHUB_TOKEN",
      "authType": "bearer"
    }
  }
}
```

### GET /manage/key-debug

Get information about API keys.

**Response Example:**
```json
{
  "message": "API Key Debug Information",
  "note": "This endpoint helps identify which key you should use",
  "keyInfo": {
    "managementKeyFormat": "abc123def456...",
    "proxyKeyFormat": "xyz789uvw567...",
    "managementKeyLength": 32,
    "proxyKeyLength": 32,
    "keyTypes": {
      "management": "Required for /manage/* routes",
      "proxy": "Required for /proxy/* routes"
    }
  },
  "help": "For management routes, you must use the MANAGEMENT_API_KEY from your .env file"
}
```

## Version Endpoints

### GET /version/check

Check for updates.

**Response Example (Up to Date):**
```json
{
  "currentVersion": "v0.1.0-dev",
  "latestVersion": "v0.1.0",
  "latestReleaseUrl": "https://github.com/ByteBrushStudios/ByteProxy/releases/tag/v0.1.0",
  "isLatest": true,
  "isPrerelease": false,
  "releaseDate": "2023-05-15T10:00:00Z",
  "updateAvailable": false
}
```

**Response Example (Update Available):**
```json
{
  "currentVersion": "v0.0.9-dev",
  "latestVersion": "v0.1.0",
  "latestReleaseUrl": "https://github.com/ByteBrushStudios/ByteProxy/releases/tag/v0.1.0",
  "isLatest": false,
  "isPrerelease": false,
  "releaseDate": "2023-05-15T10:00:00Z",
  "updateAvailable": true
}
```

## Authentication

When authentication is enabled, you must provide an API key using one of these methods:

1. Bearer token: `Authorization: Bearer your-api-key`
2. API key header: `x-api-key: your-api-key`
3. Query parameter: `?api_key=your-api-key`

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "documentation": "/docs"
}
```

Common error types:
- Invalid request format (400)
- Endpoint not found (404)
- Internal server error (500)
- Service unavailable (503)

## Next Steps

- [Usage Guide](usage.md)
- [Configuration Reference](config.md)
- [Troubleshooting](troubleshooting.md)
  },
  "configuration": {
    "port": 3420,
    "services": [...],
    "logging": {
      "enabled": true,
      "level": "info"
    },
    "cors": {
      "enabled": true,
      "origins": ["*"]
    }
  }
}
```

### Server Pressure

```
GET /up
```

**Response:**
```json
{
  "status": "ok",
  "eventLoopDelay": 0.45,
  "heapUsed": 17661944,
  "rssBytes": 75882496,
  "eventLoopUtilized": 0.02,
  "healthy": true
}
```

## Root Endpoint

```
GET /
```

**Response:**
```json
{
  "message": "ByteProxy API",
  "version": "0.1.0",
  "documentation": "/docs",
  "health": "/health",
  "status": "/status"
}
```

## OpenAPI Documentation

Interactive API documentation:

```
GET /docs
```

This page provides Swagger UI for exploring and testing all API endpoints.
