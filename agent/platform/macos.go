//go:build darwin

package tracker

import (
	"fmt"
	"os/exec"
	"strings"
)

// getActiveWindow uses AppleScript to query NSWorkspace for the frontmost application.
func getActiveWindow() (appName, title string, err error) {
	// Get frontmost app name
	appScript := `tell application "System Events" to get name of first application process whose frontmost is true`
	appOut, err := exec.Command("osascript", "-e", appScript).Output()
	if err != nil {
		return "", "", fmt.Errorf("osascript (app): %w", err)
	}
	appName = strings.TrimSpace(string(appOut))

	// Get frontmost window title (best-effort)
	titleScript := fmt.Sprintf(
		`tell application "System Events" to get title of front window of (first application process whose name is "%s")`,
		appName,
	)
	titleOut, _ := exec.Command("osascript", "-e", titleScript).Output()
	title = strings.TrimSpace(string(titleOut))

	return appName, title, nil
}
