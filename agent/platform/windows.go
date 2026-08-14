//go:build windows

package tracker

import (
	"fmt"
	"syscall"
	"unsafe"
)

var (
	user32                  = syscall.NewLazyDLL("user32.dll")
	procGetForegroundWindow = user32.NewProc("GetForegroundWindow")
	procGetWindowTextW      = user32.NewProc("GetWindowTextW")
	psapi                   = syscall.NewLazyDLL("psapi.dll")
	procGetModuleFileNameEx = psapi.NewProc("GetModuleFileNameExW")
	kernel32                = syscall.NewLazyDLL("kernel32.dll")
	procOpenProcess         = kernel32.NewProc("OpenProcess")
	procCloseHandle         = kernel32.NewProc("CloseHandle")
)

const (
	processQueryLimitedInformation = 0x1000
)

// getActiveWindow returns the app name and window title of the foreground window.
func getActiveWindow() (appName, title string, err error) {
	hwnd, _, _ := procGetForegroundWindow.Call()
	if hwnd == 0 {
		return "", "", fmt.Errorf("no foreground window")
	}

	// Get window title
	buf := make([]uint16, 512)
	procGetWindowTextW.Call(hwnd, uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
	title = syscall.UTF16ToString(buf)

	// Get process ID
	var pid uint32
	user32.NewProc("GetWindowThreadProcessId").Call(hwnd, uintptr(unsafe.Pointer(&pid)))

	handle, _, _ := procOpenProcess.Call(processQueryLimitedInformation, 0, uintptr(pid))
	if handle == 0 {
		return "Unknown", title, nil
	}
	defer procCloseHandle.Call(handle)

	exeBuf := make([]uint16, 260)
	procGetModuleFileNameEx.Call(handle, 0, uintptr(unsafe.Pointer(&exeBuf[0])), uintptr(len(exeBuf)))
	exe := syscall.UTF16ToString(exeBuf)

	// Extract just the filename without path/extension
	appName = baseNameWithoutExt(exe)
	return appName, title, nil
}

func baseNameWithoutExt(path string) string {
	// Find last backslash or forward slash
	last := -1
	for i := len(path) - 1; i >= 0; i-- {
		if path[i] == '\\' || path[i] == '/' {
			last = i
			break
		}
	}
	name := path[last+1:]
	// Strip .exe extension
	if len(name) > 4 && name[len(name)-4:] == ".exe" {
		name = name[:len(name)-4]
	}
	return name
}
