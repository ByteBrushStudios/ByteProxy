---
title: Self-Hosting
layout: default
nav_order: 7
parent: Deployment
---

# ByteProxy Self-Hosting Guide

This guide covers how to self-host ByteProxy on your own infrastructure.

## System Requirements

- Node.js 18+ or Bun 1.0.0+
- 512MB RAM minimum (1GB recommended)
- 100MB disk space

## Installation Options

### Option 1: Direct Install

```bash
# Clone the repository
git clone https://github.com/ByteBrushStudios/ByteProxy.git
cd ByteProxy

# Install dependencies (using Bun - recommended)
bun install

# Or using npm
npm install

# Create environment file
cp .env.example .env.local

# Edit your configuration
nano .env.local
```

### Option 2: Using Docker

```bash
# Pull the image
docker pull bytebrushstudios/byteproxy:latest

# Create a directory for config
mkdir -p ~/byteproxy/config
cd ~/byteproxy

# Create environment file
curl -o .env https://raw.githubusercontent.com/ByteBrushStudios/ByteProxy/main/.env.example
nano .env

# Run the container
docker run -d \
  --name byteproxy \
  -p 3420:3420 \
  --env-file .env \
  bytebrushstudios/byteproxy:latest
```

## Configuration

At minimum, you'll need to:

1. Set the `PORT` if you want to change the default 3420
2. Configure service tokens:
   - `DISCORD_BOT_TOKEN` - For Discord API integration
   - `GITHUB_TOKEN` - For GitHub API integration
3. Set security options:
   - `REQUIRE_AUTH_FOR_PROXY` - Enable/disable proxy endpoint authentication
   - `REQUIRE_AUTH_FOR_MANAGEMENT` - Enable/disable management endpoint authentication
   - `PROXY_API_KEY` - Set your proxy API key
   - `MANAGEMENT_API_KEY` - Set your management API key

See the [Configuration Reference](config.md) for all options.

## Running in Production

### Using Bun (Recommended)

```bash
# Build the TypeScript code
bun run build

# Start the server
NODE_ENV=production bun run start
```

### Using Node.js

```bash
# Build the TypeScript code
npm run build

# Start the server
NODE_ENV=production npm run start
```

### Using Process Managers

For better reliability, use a process manager:

#### PM2

```bash
npm install -g pm2
pm2 start dist/index.js --name byteproxy
pm2 save
```

#### Systemd

Create a service file `/etc/systemd/system/byteproxy.service`:

```ini
[Unit]
Description=ByteProxy Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/byteproxy
ExecStart=/usr/bin/bun run dist/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3420

[Install]
WantedBy=multi-user.target
```

Then enable and start:

```bash
sudo systemctl enable byteproxy
sudo systemctl start byteproxy
```

## Using with a Reverse Proxy

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name proxy.yourdomain.com;

    location / {
        proxy_pass http://localhost:3420;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Caddy Configuration

```
# Caddyfile
proxy.yourdomain.com {
    reverse_proxy localhost:3420
}
```

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
