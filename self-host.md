---
layout: default
title: Self-Hosting Guide
nav_order: 3
---

# ByteProxy Self-Hosting Guide

This guide covers how to deploy ByteProxy to different environments.

## Requirements

- Node.js 18+ or Bun 1.0+
- Git
- Basic command line knowledge

## Local Development Setup

```bash
# Clone the repository
git clone https://github.com/ByteBrushStudios/Proxy.git
cd Proxy

# Install dependencies (with npm)
npm install
# OR with Bun (recommended)
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API tokens and settings

# Start development server
bun run dev
# OR with npm
npm run dev
```

Visit `http://localhost:3420/docs` to confirm everything is working.

## Production Deployment

### Option 1: Docker

```bash
# Build the Docker image
docker build -t byteproxy .

# Run the container
docker run -p 3420:3420 --env-file .env.production byteproxy
```

### Option 2: Bare Metal/VPS

```bash
# Clone and set up
git clone https://github.com/ByteBrushStudios/Proxy.git
cd Proxy
bun install

# Set up environment variables
cp .env.example .env.production
# Edit .env.production with your API tokens and settings

# Build and start the server
bun run build
PORT=3420 node dist/index.js
```

### Option 3: Railway/Render/Fly.io

1. Connect your GitHub repository
2. Set the build command to `bun run build` (or `npm run build`)
3. Set the start command to `node dist/index.js`
4. Configure environment variables in the platform dashboard

## Security Considerations

### API Keys

In production, always enable authentication:

```
PROXY_API_KEY=your_long_random_secure_key
MANAGEMENT_API_KEY=different_long_random_secure_key
REQUIRE_AUTH_FOR_PROXY=true
REQUIRE_AUTH_FOR_MANAGEMENT=true
```

Generate secure keys with:
```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### TLS/HTTPS

Always use HTTPS in production. Options:

1. **Reverse Proxy**: Place ByteProxy behind Nginx/Caddy/Traefik
2. **Cloud Provider**: Use platform SSL features
3. **Cloudflare**: Add your ByteProxy instance to Cloudflare

## Performance Tuning

### Environment Variables

```
# Maximum number of concurrent connections
MAX_CONNECTIONS=100

# Timeouts (ms)
REQUEST_TIMEOUT=30000

# TLS settings
STRICT_TLS=true
```

### Health Monitoring

Set up monitoring for:
- `/up` endpoint for basic liveness
- `/health` for detailed health status
- `/status` for application metrics

## Troubleshooting

- **Logs**: ByteProxy logs to stdout/stderr by default
- **Diagnostics**: Visit `/manage/diagnostics` for system info
- **Connectivity**: Check `/manage/services/{service}/test` endpoints

## Upgrading

```bash
git pull
bun install
bun run build
# Restart your service
```

## Next Steps

- [Configuration Reference](config.md) - Detailed config options
- [API Reference](api.md) - Complete API documentation
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
