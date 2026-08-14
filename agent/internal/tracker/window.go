package tracker

// getActiveWindow returns the application name and window title of the current active window.
// TODO: Implement native OS calls (user32.dll on Windows, Accessibility API on macOS, X11/Wayland on Linux)
func getActiveWindow() (string, string, error) {
	return "Code", "FlowTrack - VS Code", nil
}
