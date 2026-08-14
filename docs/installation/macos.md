# Installing FlowTrack on macOS

## Download

Go to the [FlowTrack Releases](https://github.com/flowtrack-app/flowtrack/releases/latest) page and download the appropriate version:

| Mac | Download |
|-----|---------|
| Apple Silicon (M1/M2/M3) | `FlowTrack-vX.X.X-macos-arm64.dmg` |
| Intel | `FlowTrack-vX.X.X-macos-x64.dmg` |

> Not sure which you have? Apple menu → About This Mac → Chip

## Install

1. Open the downloaded `.dmg` file
2. Drag **FlowTrack** to the **Applications** folder
3. Eject the disk image

## First Launch

macOS Gatekeeper may warn about an unidentified developer on the first launch.

**To bypass:**

```bash
xattr -cr /Applications/FlowTrack.app
```

Or:
1. Right-click the app in Finder
2. Select **Open**
3. Click **Open** in the dialog

## Accessibility Permissions

FlowTrack needs **Accessibility** permissions to detect the active application.

1. **System Preferences → Privacy & Security → Accessibility**
2. Click the **+** button
3. Navigate to `/Applications/FlowTrack.app` and add it

## Auto-Start

FlowTrack installs a **Launch Agent** to start at login.

To disable:
```bash
launchctl unload ~/Library/LaunchAgents/app.flowtrack.desktop.plist
```

To re-enable:
```bash
launchctl load ~/Library/LaunchAgents/app.flowtrack.desktop.plist
```

## Data Location

```
~/Library/Application Support/FlowTrack/data.db
```

## Verify Checksum

```bash
shasum -a 256 FlowTrack-v1.0.0-macos-arm64.dmg
```

Compare with `checksums.txt` from the release page.
