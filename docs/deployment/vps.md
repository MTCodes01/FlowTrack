# VPS / Cloud Server Deployment

This guide covers deploying FlowTrack on a **VPS, cloud VM, home server, or Raspberry Pi**.

## Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| RAM | 512 MB | 1 GB |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 5 GB | 20 GB |
| OS | Ubuntu 22.04 / Debian 12 | Ubuntu 24.04 LTS |
| Architecture | amd64 / arm64 | amd64 |

---

## 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## 2. Clone and Configure

```bash
git clone https://github.com/flowtrack-app/flowtrack.git
cd flowtrack

cp .env.example .env
nano .env   # Fill in POSTGRES_PASSWORD, JWT_SECRET, API_SECRET, DOMAIN
```

---

## 3. Start FlowTrack

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## 4. HTTPS with Nginx + Certbot

Install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/flowtrack`:

```nginx
server {
    server_name flowtrack.example.com;

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and get certificate:

```bash
sudo ln -s /etc/nginx/sites-available/flowtrack /etc/nginx/sites-enabled/
sudo certbot --nginx -d flowtrack.example.com
sudo systemctl reload nginx
```

---

## 5. HTTPS with Caddy (Simpler)

```bash
sudo apt install caddy
```

`/etc/caddy/Caddyfile`:

```caddyfile
flowtrack.example.com {
    reverse_proxy /api/* localhost:8080
    reverse_proxy * localhost:80
}
```

```bash
sudo systemctl reload caddy
```

Caddy handles TLS automatically.

---

## 6. HTTPS with Cloudflare Tunnel (No Open Ports)

```bash
# Install cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Authenticate and create tunnel
cloudflared tunnel login
cloudflared tunnel create flowtrack
cloudflared tunnel route dns flowtrack flowtrack.example.com

# Configure ingress
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: flowtrack.example.com
    service: http://localhost:80
  - service: http_status:404
EOF

cloudflared tunnel run flowtrack
```

---

## 7. Firewall

Only expose necessary ports:

```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

The database port (5432) should **never** be publicly exposed.

---

## Raspberry Pi (ARM)

FlowTrack Docker images are built for **linux/arm64**.

Raspberry Pi 4/5 with **64-bit Raspberry Pi OS** (Bookworm) is supported:

```bash
# Verify architecture
uname -m
# Should output: aarch64

# Deploy normally
docker compose -f docker-compose.prod.yml up -d
```

> Raspberry Pi 3 and older (32-bit only) are **not** supported.

---

## Auto-restart on Reboot

The `restart: always` policy in `docker-compose.prod.yml` ensures containers restart automatically after a reboot. No additional configuration is needed.

Verify Docker starts on boot:

```bash
sudo systemctl enable docker
```
