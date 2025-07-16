---
layout: default
title: Usage Guide
nav_order: 2
---

# ByteProxy Usage Guide

This guide covers how to effectively use ByteProxy for different API services.

## Basic Concepts

ByteProxy works by forwarding your requests to third-party APIs while:
- Managing authentication
- Handling rate limits
- Providing consistent error handling
- Adding helpful debugging information

## Making Proxy Requests

All proxy requests follow this pattern:

```
http://localhost:3420/proxy/{service}/{endpoint}
```

Where:
- `{service}` is a configured service (e.g., `discord`, `github`)
- `{endpoint}` is the API endpoint you want to access

### Example Requests

#### Discord API

```bash
# Get current user (requires DISCORD_BOT_TOKEN in .env)
curl http://localhost:3420/proxy/discord/users/@me

# Get guild information
curl http://localhost:3420/proxy/discord/guilds/957420716142252062
```

#### GitHub API

```bash
# Get user information (requires GITHUB_TOKEN in .env)
curl http://localhost:3420/proxy/github/users/ByteBrushStudios

# Get repository information
curl http://localhost:3420/proxy/github/repos/ByteBrushStudios/Proxy
```

## Authentication

ByteProxy offers two types of authentication:

1. **Proxy Authentication**: Securing access to the proxy itself
2. **Service Authentication**: Managing tokens for third-party APIs

### Proxy Authentication

When enabled, all proxy requests require an API key:

```bash
# Using Authorization header (preferred)
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3420/proxy/discord/users/@me

# Using x-api-key header
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3420/proxy/discord/users/@me

# Using query parameter (less secure, for testing)
curl "http://localhost:3420/proxy/discord/users/@me?api_key=YOUR_API_KEY"
```

Configure this in your `.env` file:
```
PROXY_API_KEY=your_secure_key_here
REQUIRE_AUTH_FOR_PROXY=true
```

### Service Authentication

ByteProxy automatically adds service authentication tokens from your environment variables:

```env
# For Discord API
DISCORD_BOT_TOKEN=your_discord_bot_token

# For GitHub API
GITHUB_TOKEN=your_github_personal_access_token
```

## Error Handling

ByteProxy provides detailed error messages:

```json
{
  "error": "Rate limit exceeded for discord. Reset in 25 seconds.",
  "service": "discord",
  "path": "/users/@me",
  "troubleshooting": {
    "hint": "Check /manage/diagnostics for network troubleshooting tips",
    "documentation": "/docs"
  }
}
```

## Rate Limiting

Each service has configurable rate limits:

```
GET /proxy/services/discord/rate-limit
```

Response:
```json
{
  "service": "discord",
  "remaining": 45,
  "resetTime": 1626701234567,
  "resetIn": 25
}
```

## Next Steps

- [Service Configuration](config.md) - Configure new services
- [Self-Hosting Guide](self-host.md) - Deploy ByteProxy
- [API Reference](api.md) - Complete API documentation
