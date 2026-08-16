//go:build linux

package tracker

import (
	"fmt"
	"os/exec"
	"strings"
)

// getActiveWindow uses xdotool (X11) or ydotool/swaymsg (Wayland) to find the
// currently focused window. Falls back gracefully if the tools are unavailable.
func getActiveWindow() (appName, title string, err error) {
	// Try xdotool first (X11 / XWayland)
	out, err := exec.Command("xdotool", "getactivewindow", "getwindowname").Output()
	if err == nil {
		title = strings.TrimSpace(string(out))
		// Get WM_CLASS for the app name
		classOut, _ := exec.Command("xdotool", "getactivewindow", "getwindowclassname").Output()
		appName = strings.TrimSpace(string(classOut))
		if appName == "" {
			appName = title
		}
		return appName, title, nil
	}

	// Try Sway (Wayland)
	swayOut, err := exec.Command("swaymsg", "-t", "get_tree").Output()
	if err == nil {
		// Very basic parsing - production code would use json.Unmarshal
		lines := strings.Split(string(swayOut), "\n")
		for _, line := range lines {
			if strings.Contains(line, `"focused": true`) {
				appName = "Unknown (Wayland)"
				title = ""
				return appName, title, nil
			}
		}
	}

	return "", "", fmt.Errorf("could not determine active window: xdotool and swaymsg both unavailable")
}
