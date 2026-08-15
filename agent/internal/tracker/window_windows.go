//go:build windows

package tracker

import (
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

var (
	user32   = syscall.NewLazyDLL("user32.dll")
	kernel32 = syscall.NewLazyDLL("kernel32.dll")

	procGetForegroundWindow      = user32.NewProc("GetForegroundWindow")
	procGetWindowTextW           = user32.NewProc("GetWindowTextW")
	procGetWindowThreadProcessId = user32.NewProc("GetWindowThreadProcessId")

	procOpenProcess                = kernel32.NewProc("OpenProcess")
	procCloseHandle                = kernel32.NewProc("CloseHandle")
	procQueryFullProcessImageNameW = kernel32.NewProc("QueryFullProcessImageNameW")
)

func getActiveWindow() (string, string, error) {
	hwnd, _, _ := procGetForegroundWindow.Call()
	if hwnd == 0 {
		return "", "", nil
	}

	// Get Window Title
	b := make([]uint16, 512)
	procGetWindowTextW.Call(hwnd, uintptr(unsafe.Pointer(&b[0])), uintptr(len(b)))
	title := syscall.UTF16ToString(b)

	// Get Process ID
	var pid uint32
	procGetWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&pid)))

	// Open Process
	const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
	hProcess, _, _ := procOpenProcess.Call(PROCESS_QUERY_LIMITED_INFORMATION, 0, uintptr(pid))
	if hProcess == 0 {
		return "Unknown", title, nil
	}
	defer procCloseHandle.Call(hProcess)

	// Get Image Name
	img := make([]uint16, 1024)
	size := uint32(len(img))
	ret, _, _ := procQueryFullProcessImageNameW.Call(hProcess, 0, uintptr(unsafe.Pointer(&img[0])), uintptr(unsafe.Pointer(&size)))
	if ret == 0 {
		return "Unknown", title, nil
	}

	exePath := syscall.UTF16ToString(img)
	appName := filepath.Base(exePath)
	
	// Clean up app name for better readability
	appName = strings.TrimSuffix(appName, ".exe")
	if appName == "" {
		appName = "Unknown"
	}

	return appName, title, nil
}
