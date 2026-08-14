# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| latest | ✅ |
| < 1.0 | ❌ |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub Issues.**

To report a security issue:

1. Email **security@flowtrack.example.com** (replace with your actual contact)
2. Include a description of the vulnerability
3. Include steps to reproduce
4. Include the potential impact

You can expect a response within **48 hours**.

We will:
- Acknowledge receipt promptly
- Investigate and confirm the vulnerability
- Work on a fix and coordinate a disclosure timeline
- Credit you in the release notes (unless you prefer anonymity)

## Security Considerations

### Self-Hosted Deployments

- **Change all default secrets** in `.env` before deploying
- Use strong, randomly-generated values for `JWT_SECRET` and `API_SECRET`
- Keep PostgreSQL on the internal Docker network (never expose port 5432)
- Deploy behind HTTPS only (Nginx, Caddy, or Cloudflare Tunnel)
- Keep Docker images updated

### Desktop Application

- The FlowTrack agent runs with **user-level permissions only**
- It does **not** require administrator/root access
- Tracked data is stored locally in your user profile directory
- Server sync is opt-in and configurable

### Data Privacy

- FlowTrack does not send any data to third parties
- If using a self-hosted server, you control all data
- Local data is stored in SQLite at your user profile path
