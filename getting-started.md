---
title: Getting Started
layout: default
nav_order: 2
---

# Getting Started with ByteProxy

This guide will help you get ByteProxy up and running quickly.

## Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- Git
- Basic understanding of REST APIs
- API tokens for services you want to proxy (Discord, GitHub, etc.)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ByteBrushStudios/ByteProxy.git
cd ByteProxy
```

### 2. Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Using npm
npm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit with your preferred editor
nano .env.local
```

At minimum, configure:
- `PORT` (default: 3420)
- Service tokens:
  - `DISCORD_BOT_TOKEN` (if using Discord)
  - `GITHUB_TOKEN` (if using GitHub)

### 4. Start the Server

```bash
# Development mode
bun run dev

# Production mode
bun run build
bun run start
```

## Quick Verification

Once ByteProxy is running, check the following endpoints to verify it's working correctly:

1. Open [http://localhost:3420](http://localhost:3420) in your browser
   - You should see the welcome message
   
2. Visit the [API Documentation](http://localhost:3420/docs)
   - This provides interactive Swagger documentation
   
3. Check the [Health Endpoint](http://localhost:3420/health)
   - Should return `{"status":"ok",...}`

## Making Your First Proxy Request

### GitHub Example

```bash
# Get information about a GitHub user
curl http://localhost:3420/proxy/github/users/ByteBrushStudios
```

### Discord Example

```bash
# Get information about your bot
curl http://localhost:3420/proxy/discord/users/@me
```

## Next Steps

Now that you have ByteProxy running, you can:

1. **Explore the API:** Use the [Swagger Documentation](http://localhost:3420/docs)
2. **Add Custom Services:** See [Adding Services](usage.md#adding-custom-services)
3. **Configure Authentication:** See [Security & Authentication](security.md)
4. **Integrate with Your Application:** Build frontends that use ByteProxy as a backend

## Detailed Guides

- [Complete Usage Guide](usage.md)
- [Configuration Reference](config.md)
- [Self-Hosting Guide](self-host.md)
- [Troubleshooting](troubleshooting.md)
- [API Reference](api.md)

## Need Help?

- [GitHub Issues](https://github.com/ByteBrushStudios/ByteProxy/issues)
- [Discord Community](https://discord.gg/Vv2bdC44Ge)
