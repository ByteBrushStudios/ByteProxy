---
layout: default
title: API Reference
nav_order: 6
---

# ByteProxy API Reference

Complete reference for all ByteProxy API endpoints.

## Base URL

All API paths are relative to your ByteProxy instance:

```
http://localhost:3420
```

## Authentication

When authentication is enabled, add one of:

```
Authorization: Bearer YOUR_API_KEY
x-api-key: YOUR_API_KEY
?api_key=YOUR_API_KEY (query parameter)
```

## Proxy Endpoints

### List Available Services

```
GET /proxy/services
```

**Response:**
```json
{
  "services": [
    {
      "key": "discord",
      "name": "Discord API",
      "baseUrl": "https://discord.com/api/",
      "hasAuth": true,
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
      "rateLimit": {
        "maxRequests": 60,
        "windowMs": 3600000
      }
    }
  ],
  "count": 2
}
```

### Get Service Rate Limit Status

```
GET /proxy/services/:service/rate-limit
```

**Response:**
```json
{
  "service": "discord",
  "remaining": 45,
  "resetTime": 1626701234567,
  "resetIn": 25
}
```

### Proxy Request to Service

```
ANY /proxy/:service/*
```

Where:
- `:service` is the service key (e.g., `discord`, `github`)
- `*` is the API endpoint path

**Example:**
```
GET /proxy/discord/users/@me
```

**Response:**
Contains the response from the target API, plus:
```
X-Proxy-Service: discord
X-Proxy-Duration: 123ms
```

### Authentication Test

```
GET /proxy/auth-test
```

**Response:**
```json
{
  "status": "success",
  "message": "Authentication successful",
  "timestamp": "2023-07-16T12:34:56.789Z"
}
```

## Management Endpoints

### List All Services

```
GET /manage/services
```

**Response:**
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
    ...
  ],
  "count": 2
}
```

### Get Service Configuration

```
GET /manage/services/:key
```

**Response:**
```json
{
  "key": "discord",
  "config": {
    "name": "Discord API",
    "baseUrl": "https://discord.com/api/",
    "headers": {
      "User-Agent": "DiscordBot (https://github.com/ByteBrushStudios/ByteProxy, 0.1.0)",
      "Content-Type": "application/json"
    },
    "rateLimit": {
      "maxRequests": 50,
      "windowMs": 60000
    },
    "auth": {
      "type": "bot",
      "tokenConfigured": true
    },
    "versionedBaseUrls": {
      "v10": "https://discord.com/api/v10/",
      "v9": "https://discord.com/api/v9/"
    }
  }
}
```

### Add New Service

```
POST /manage/services
```

**Request Body:**
```json
{
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
}
```

**Response:**
```json
{
  "message": "Service 'openai' added successfully",
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
}
```

### Test Service Connectivity

```
POST /manage/services/:key/test
```

**Response (Success):**
```json
{
  "service": "discord",
  "status": "reachable",
  "responseStatus": 200,
  "duration": "123ms",
  "baseUrl": "https://discord.com/api/"
}
```

**Response (Failure):**
```json
{
  "service": "example",
  "status": "unreachable",
  "error": "getaddrinfo ENOTFOUND example.com",
  "baseUrl": "https://example.com/api",
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

### Network Diagnostics

```
GET /manage/diagnostics
```

**Response:**
```json
{
  "system": {
    "platform": "linux",
    "nodeVersion": "v18.16.0",
    "runtime": "Bun",
    "uptime": 3600
  },
  "network": {
    "strictTLS": false,
    "timeout": 30000,
    "retryAttempts": 2
  },
  "environment": {
    "timeZone": "UTC",
    "currentTime": "2023-07-16T12:34:56.789Z",
    "locale": "en-US"
  },
  "authentication": {
    "discord": {
      "tokenConfigured": true,
      "envVar": "DISCORD_BOT_TOKEN",
      "authType": "bot",
      "tokenPreview": "MTM5ND..."
    },
    "github": {
      "tokenConfigured": true,
      "envVar": "GITHUB_TOKEN",
      "authType": "bearer",
      "tokenPreview": "ghp_wd1I..."
    }
  },
  "troubleshooting": {
    "authIssues": {
      "commonCauses": ["..."],
      "quickFixes": ["..."]
    },
    "tlsIssues": {
      "commonCauses": ["..."],
      "quickFixes": ["..."]
    }
  }
}
```

## Health Endpoints

### Basic Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-07-16T12:34:56.789Z",
  "uptime": 3600,
  "version": "0.1.0",
  "services": {
    "total": 2,
    "available": ["discord", "github"]
  },
  "config": {
    "port": 3420,
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

### Detailed Status

```
GET /status
```

**Response:**
```json
{
  "application": {
    "name": "ByteProxy",
    "version": "0.1.0",
    "description": "Extensible web proxy for Discord, GitHub, and other APIs"
  },
  "runtime": {
    "node": "v18.16.0",
    "platform": "linux",
    "uptime": 3600,
    "memory": {
      "rss": 75882496,
      "heapTotal": 23990272,
      "heapUsed": 17661944,
      "external": 1983656,
      "arrayBuffers": 285873
    }
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
