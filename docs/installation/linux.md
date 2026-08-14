# Installing FlowTrack on Linux

## Download

Go to the [FlowTrack Releases](https://github.com/MTCodes01/flowtrack/releases/latest) page and choose:

| Format | File | When to use |
|--------|------|-------------|
| AppImage | `FlowTrack-vX.X.X-linux-x64.AppImage` | Any distro, no install needed |
| DEB | `FlowTrack-vX.X.X-linux-x64.deb` | Debian, Ubuntu, Mint, Pop!_OS |

---

## AppImage (Universal)

```bash
# Download
wget https://github.com/MTCodes01/flowtrack/releases/latest/download/FlowTrack-v1.0.0-linux-x64.AppImage

# Make executable
chmod +x FlowTrack-v1.0.0-linux-x64.AppImage

# Run
./FlowTrack-v1.0.0-linux-x64.AppImage
```

### Optional: Install system-wide

```bash
sudo mv FlowTrack-v1.0.0-linux-x64.AppImage /usr/local/bin/flowtrack
```

---

## DEB Package (Debian/Ubuntu)

```bash
sudo apt install ./FlowTrack-v1.0.0-linux-x64.deb
flowtrack
```

Dependencies are installed automatically.

---

## X11 / Wayland Notes

FlowTrack uses `xdotool` on X11 to detect the active window.

```bash
# Ubuntu/Debian
sudo apt install xdotool

# Fedora
sudo dnf install xdotool

# Arch
sudo pacman -S xdotool
```

On **Wayland with Sway**, `swaymsg` is used automatically.

For other Wayland compositors, window tracking may have limited support.

---

## Auto-Start (systemd user service)

```bash
# Create service file
mkdir -p ~/.config/systemd/user

cat > ~/.config/systemd/user/flowtrack-agent.service << 'EOF'
[Unit]
Description=FlowTrack Background Agent
After=graphical-session.target

[Service]
Type=simple
ExecStart=/usr/local/bin/flowtrack-agent
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF

# Enable and start
systemctl --user enable flowtrack-agent
systemctl --user start flowtrack-agent
```

---

## Data Location

```
~/.local/share/flowtrack/data.db
```

(or `$XDG_DATA_HOME/flowtrack/data.db` if set)

---

## Verify Checksum

```bash
sha256sum FlowTrack-v1.0.0-linux-x64.AppImage
```

Compare with `checksums.txt` from the release page.
