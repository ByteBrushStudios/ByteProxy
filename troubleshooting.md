---
layout: default
title: Troubleshooting
nav_order: 5
---

# ByteProxy Troubleshooting

Common issues and solutions when working with ByteProxy.

## Authentication Issues

### Problem: API Key Not Working

**Symptoms:**
- 401 Unauthorized responses
- "Valid API key required" error messages

**Solutions:**

1. **Check Environment Variables:**
   ```bash
   # Verify .env file has the correct values
   cat .env.local | grep API_KEY
   ```

2. **Verify API Key Format:**
   - No extra spaces or newlines
   - Special characters properly escaped

3. **Check Authentication Headers:**
   ```bash
   # Use the correct format (note the space after "Bearer")
   curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3420/proxy/...
   ```

4. **Try Query Parameter:**
   ```bash
   curl "http://localhost:3420/proxy/discord/users/@me?api_key=YOUR_API_KEY"
   ```

5. **Enable Debug Logging:**
   ```
   # In .env.local
   LOGGING_LEVEL=debug
   ```

### Problem: Service Authentication Failing

**Symptoms:**
- "Authentication token missing for service" errors
- 401 errors from the target API

**Solutions:**

1. **Check Environment Variables:**
   ```bash
   # For Discord
   echo $DISCORD_BOT_TOKEN
   
   # For GitHub
   echo $GITHUB_TOKEN
   ```

2. **Verify Token Validity:**
   - Try using the token directly with the API
   - Check if token has expired or been revoked

3. **Restart After Setting Variables:**
   ```bash
   # After updating .env.local
   bun run dev
   ```

4. **Check Token Permissions:**
   - Discord: Verify bot permissions
   - GitHub: Check token scopes

5. **Diagnostics Endpoint:**
   ```bash
   curl http://localhost:3420/manage/diagnostics
   ```

## Network Issues

### Problem: TLS/SSL Certificate Errors

**Symptoms:**
- "TLS/SSL certificate error" messages
- Connection errors to target APIs

**Solutions:**

1. **Check System Time:**
   - Incorrect system time can cause certificate validation failures

2. **Disable Strict TLS (Development Only):**
   ```
   # In .env.local
   STRICT_TLS=false
   ```

3. **Corporate Network Issues:**
   - Try from a different network
   - Check corporate proxy settings

4. **Update CA Certificates:**
   ```bash
   # On Ubuntu/Debian
   sudo update-ca-certificates
   
   # On CentOS/RHEL
   sudo update-ca-trust
   ```

### Problem: Request Timeouts

**Symptoms:**
- "Request timeout after X ms" errors

**Solutions:**

1. **Increase Timeout:**
   ```
   # In .env.local or config
   REQUEST_TIMEOUT=60000
   ```

2. **Check Network Stability:**
   - Test network latency to API servers
   
3. **API Status:**
   - Check if target API is experiencing issues

## Performance Issues

### Problem: Server Under Pressure

**Symptoms:**
- 503 "Server under pressure" responses
- High CPU/memory usage

**Solutions:**

1. **Check Server Resources:**
   ```bash
   # Memory usage
   free -h
   
   # CPU usage
   top
   ```

2. **Adjust Pressure Settings:**
   ```typescript
   // In src/index.ts
   const underPressure = new UnderPressure({
     maxEventLoopDelay: 500, // Increase to 500ms
     maxHeapUsedBytes: 1024 * 1024 * 1024, // 1GB
     maxRssBytes: 2048 * 1024 * 1024, // 2GB
   })
   ```

3. **Monitor `/up` Endpoint:**
   ```bash
   curl http://localhost:3420/up
   ```

4. **Add Caching:**
   - Consider implementing response caching for frequent requests

## Rate Limiting Issues

### Problem: Rate Limit Exceeded

**Symptoms:**
- "Rate limit exceeded for [service]" errors

**Solutions:**

1. **Check Current Rate Limits:**
   ```bash
   curl http://localhost:3420/proxy/services/github/rate-limit
   ```

2. **Adjust Rate Limits:**
   ```typescript
   // In config
   rateLimit: {
     maxRequests: 100, // Increase from default
     windowMs: 60000
   }
   ```

3. **Implement Request Batching:**
   - Group multiple API calls into fewer requests

4. **Add Delay Between Requests:**
   - Spread requests over time

## Common Errors

### "Service not configured"

**Solution:**
- Check available services:
  ```bash
  curl http://localhost:3420/proxy/services
  ```
- Add missing service through management API or config

### "Invalid GitHub API path"

**Solution:**
- Check GitHub API documentation for correct path format
- Common mistake: using `/org/` instead of `/orgs/`

### WebSocket Proxy Errors

**Solution:**
- Ensure `ws` package is installed
- Enable WebSocket support with `ws: true` option
- Check client WebSocket connection code

## Getting Support

If you're still having issues:

1. **Check Logs:**
   ```bash
   # Set logging to debug level
   LOGGING_LEVEL=debug bun run dev
   ```

2. **Open an Issue:**
   - https://github.com/ByteBrushStudios/Proxy/issues

3. **Join Discord:**
   - https://discord.gg/Vv2bdC44Ge

4. **Provide Details:**
   - ByteProxy version
   - Node.js/Bun version
   - Full error message
   - Steps to reproduce
