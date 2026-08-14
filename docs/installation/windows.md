# Installing FlowTrack on Windows

## Download

1. Go to the [FlowTrack Releases](https://github.com/MTCodes01/flowtrack/releases/latest) page
2. Download **`FlowTrack-vX.X.X-win-x64.exe`** (NSIS installer) or **`FlowTrack-vX.X.X-win-x64.msi`**

## Install

### NSIS Installer (.exe)

1. Run the downloaded `.exe` file
2. Follow the installation wizard
3. FlowTrack will be installed to `C:\Program Files\FlowTrack\` by default
4. A shortcut is added to the Start Menu and optionally the Desktop

### MSI Package

```powershell
msiexec /i FlowTrack-v1.0.0-win-x64.msi /quiet
```

## First Run

After installation:

1. FlowTrack starts automatically and appears in the **system tray** (bottom-right)
2. Right-click the tray icon → **"Open Dashboard"** to view your stats
3. To configure a server, open **Settings → Server Connection**

## Auto-Start

FlowTrack installs a **Task Scheduler** entry to start automatically at login.

To disable auto-start:
- Open **Settings → Auto-Start** in FlowTrack, or
- Open **Task Scheduler** and disable the `FlowTrack` task

## Data Location

Local tracking data is stored at:

```
%APPDATA%\FlowTrack\data.db
```

## Uninstall

Use **Add or Remove Programs** in Windows Settings, or:

```powershell
msiexec /x FlowTrack-v1.0.0-win-x64.msi /quiet
```

## Verify Checksum

```powershell
Get-FileHash FlowTrack-v1.0.0-win-x64.exe -Algorithm SHA256
```

Compare with `checksums.txt` from the release page.
