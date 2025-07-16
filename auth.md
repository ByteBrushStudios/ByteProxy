---
title: Authentication
description: Learn how to secure your ByteProxy instance with authentication
layout: default
nav_order: 3
---

# Authentication

ByteProxy provides flexible authentication options to secure your API endpoints.

## Overview

Authentication in ByteProxy is configurable per-route type:
- **Proxy routes** (`/proxy/*`) can use a dedicated API key
- **Management routes** (`/manage/*`) can use a separate admin API key

This separation allows you to share proxy access while maintaining control over management functions.

## Configuration

Authentication is configured in your `.env` file:

```properties
# API Security Settings
PROXY_API_KEY=your_api_key_here
MANAGEMENT_API_KEY=your_admin_key_here
REQUIRE_AUTH_FOR_PROXY=true
REQUIRE_AUTH_FOR_MANAGEMENT=true
```

You can disable authentication by setting:
```properties
REQUIRE_AUTH_FOR_PROXY=false
REQUIRE_AUTH_FOR_MANAGEMENT=false
```

## Authentication Methods

ByteProxy accepts authentication via three methods:

### Bearer Token (Recommended)

```
Authorization: Bearer your_api_key_here
```

Example:
```bash
curl -H "Authorization: Bearer your_api_key_here" \
  http://localhost:3420/proxy/github/users/octocat
```

### X-API-Key Header

```
x-api-key: your_api_key_here
```

Example:
```bash
curl -H "x-api-key: your_api_key_here" \
  http://localhost:3420/proxy/github/users/octocat
```

### Query Parameter

```
?api_key=your_api_key_here
```

Example:
```bash
curl "http://localhost:3420/proxy/github/users/octocat?api_key=your_api_key_here"
```

## Security Considerations

1. **Environment Variables**: Store API keys securely as environment variables
2. **HTTPS**: Always use HTTPS in production to prevent key exposure
3. **Key Rotation**: Rotate API keys periodically
4. **Minimal Permissions**: Use separate keys with minimal permissions

## Troubleshooting

If you're seeing "Unauthorized" errors:

1. Verify you're providing the correct API key
2. Check that the key format matches exactly (including any special characters)
3. Ensure your `.env` file has the proper keys defined
4. Restart the server after changing environment variables
5. Look for "Auth" related errors in the server logs
