---
layout: default
title: Troubleshooting
nav_order: 5
---

# ByteProxy Troubleshooting

Common issues and solutions when working with ByteProxy.

## Diagnostics

ByteProxy provides built-in diagnostics to help troubleshoot issues:

```bash
# View system diagnostics
curl http://localhost:3420/manage/diagnostics

# Check health status
curl http://localhost:3420/health

# Check detailed status
curl http://localhost:3420/status

# Test service connectivity
curl -X POST http://localhost:3420/manage/services/discord/test
```

## Common Issues

### Connection Issues

#### 503 Server Under Pressure

**Symptom:** Requests return 503 with "Server under pressure" message.

**Solution:**
- Check server resources (memory, CPU)
- Increase available resources
- Reduce load or scale horizontally
- Adjust pressure thresholds in `src/services/up.ts`

#### TLS/SSL Certificate Errors

**Symptom:** Requests to secure services fail with certificate errors.

**Solutions:**
- Ensure your system date/time is correct
- Update your CA certificates
- For development only, set `STRICT_TLS=false`
- Check if a corporate firewall is intercepting SSL

### Authentication Issues

#### 401/403 Errors from Backend Services

**Symptom:** Requests to Discord, GitHub, etc. return 401 or 403.

**Solutions:**
- Verify your tokens in `.env.local` are correct and not expired
- Check that tokens have the necessary permissions
- Ensure environment variables are loaded correctly
- Use `/manage/diagnostics` to verify token configuration
- Restart the server after updating environment variables

#### API Key Authentication Failing

**Symptom:** Authentication to ByteProxy fails with 401.

**Solutions:**
- Check that the correct API key is being used
- Verify the authentication method (header, bearer, query)
- Use `/manage/key-debug` to check key information
- Ensure `REQUIRE_AUTH_FOR_PROXY` or `REQUIRE_AUTH_FOR_MANAGEMENT` are enabled

### Rate Limiting

#### 429 Too Many Requests

**Symptom:** Service returns 429 errors.

**Solutions:**
- Reduce request frequency
- Implement client-side rate limiting
- Adjust service rate limit configuration
- Use a token with higher rate limits

### Operational Issues

#### Server Won't Start

**Symptom:** Server fails to start up.

**Solutions:**
- Check if the port is already in use
- Verify environment variables are correctly formatted
- Check for syntax errors in custom code
- Review startup logs for specific errors
- Set `SKIP_UPDATE_CHECK=true` if update checking is failing

#### High Memory Usage

**Symptom:** Server consuming excessive memory.

**Solutions:**
- Monitor memory usage with `/up` endpoint
- Check for memory leaks in custom code
- Reduce max concurrent connections
- Set appropriate heap limits for Node.js or Bun

### Proxy Behavior Issues

#### Request Transformation Problems

**Symptom:** Requests not correctly forwarded to backend services.

**Solutions:**
- Check service configuration (baseUrl, headers)
- Verify URL path construction
- Use curl with `-v` flag to debug request/response details
- Ensure content types are correctly set

#### CORS Issues

**Symptom:** Browser requests fail with CORS errors.

**Solutions:**
- Ensure `CORS_ENABLED=true`
- Add the origin to `CORS_ORIGINS` (comma-separated)
- Check that preflight requests are handled correctly
- Verify that credentials mode is properly configured

## Common Error Codes

| Code | Description | Troubleshooting |
|------|-------------|-----------------|
| 400 | Bad Request | Check request format and parameters |
| 401 | Unauthorized | Verify API keys or service tokens |
| 403 | Forbidden | Check permissions and authentication scope |
| 404 | Not Found | Verify endpoint path and service availability |
| 429 | Too Many Requests | Implement rate limiting or backoff |
| 500 | Internal Server Error | Check server logs for errors |
| 502 | Bad Gateway | Check backend service connectivity |
| 503 | Service Unavailable | Check resource utilization with `/up` |
| 504 | Gateway Timeout | Increase `NETWORK_TIMEOUT` or check service responsiveness |

## Logs

Check the server logs for detailed error information. By default, logs are output to the console, but you can redirect them to a file:

```bash
bun run start > byteproxy.log 2>&1
```

Increase log verbosity by setting `LOG_LEVEL=debug` in your environment variables.

## Getting Help

If you're still experiencing issues:

1. [Create an issue](https://github.com/ByteBrushStudios/ByteProxy/issues) on GitHub
2. [Join our Discord](https://discord.gg/Vv2bdC44Ge) for community support
3. Check the [API Reference](api.md) for endpoint details
4. Review the [Configuration Guide](config.md) for proper setup

## Updating ByteProxy

If you're experiencing issues, ensure you're on the latest version:

```bash
# Pull latest changes
git pull origin main

# Install dependencies
bun install

# Rebuild
bun run build

# Restart the server
bun run start
```
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
