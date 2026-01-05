---
title: "Troubleshooting"
---

# Troubleshooting

## Common Issues

### Deploy Token Not Working
**Symptoms**: Deployment fails with authentication error

**Solutions**:
1. Verify token permissions (api, write_repository)
2. Check token expiration
3. Rotate token if exposed
4. Update CI/CD variables

### Token Keeps Getting Revoked
**Symptoms**: Token stops working unexpectedly

**Solutions**:
1. Check for exposed tokens in logs
2. Review token usage patterns
3. Rotate token immediately
4. Update all CI/CD variables
5. Clean shell history if exposed

### HTTP Basic: Access denied
**Symptoms**: API requests return 401/403

**Solutions**:
1. Verify token credentials
2. Check project permissions
3. Ensure token has correct scope
4. Review access logs
5. Try regenerating token

## CI Integration Issues

### Pipeline Not Triggering
- Check webhook configuration
- Verify trigger token
- Check webhook recent deliveries
- Ensure webhook is active

### Agent Not Executing
- Check `agent:router` job logs
- Verify event type is supported
- Check agent manifest exists
- Verify service account permissions

### No Comments Posted
- Verify `GITLAB_TOKEN` has api scope
- Check agent job logs for API errors
- Verify project permissions
- Check rate limiting

## Related Pages

- [CI Integration](./ci-integration.md)
- [Configuration](../configuration/environment-variables.md)
- [Installation](../getting-started/installation.md)

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
