package config

import (
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"time"
)

// Config holds all runtime configuration for the FlowTrack agent.
type Config struct {
	// ServerURL is the FlowTrack server to sync data to.
	// Empty string disables syncing (local-only mode).
	ServerURL string

	// APIToken is the bearer token used to authenticate with the server.
	APIToken string

	// PollInterval controls how often the agent samples the active window.
	PollInterval time.Duration

	// SyncInterval controls how often buffered sessions are flushed to the server.
	SyncInterval time.Duration

	// DatabasePath is the path to the local SQLite database.
	DatabasePath string
}

// Load reads configuration from environment variables, falling back to
// sensible defaults for all optional fields.
func Load() (*Config, error) {
	cfg := &Config{
		ServerURL:    getEnv("FLOWTRACK_SERVER_URL", ""),
		APIToken:     getEnv("FLOWTRACK_API_TOKEN", ""),
		PollInterval: parseDuration("FLOWTRACK_POLL_INTERVAL", 5*time.Second),
		SyncInterval: parseDuration("FLOWTRACK_SYNC_INTERVAL", 60*time.Second),
		DatabasePath: defaultDBPath(),
	}

	// Allow an explicit override for the database path
	if p := os.Getenv("FLOWTRACK_DB_PATH"); p != "" {
		cfg.DatabasePath = p
	}

	return cfg, nil
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseDuration(key string, fallback time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	// Accept plain integers as seconds
	if secs, err := strconv.Atoi(v); err == nil {
		return time.Duration(secs) * time.Second
	}
	if d, err := time.ParseDuration(v); err == nil {
		return d
	}
	return fallback
}

// defaultDBPath returns the platform-appropriate data directory for the
// FlowTrack agent's local SQLite database.
func defaultDBPath() string {
	var dir string
	switch runtime.GOOS {
	case "windows":
		dir = filepath.Join(os.Getenv("APPDATA"), "FlowTrack")
	case "darwin":
		dir = filepath.Join(os.Getenv("HOME"), "Library", "Application Support", "FlowTrack")
	default:
		// XDG Base Directory spec
		if xdg := os.Getenv("XDG_DATA_HOME"); xdg != "" {
			dir = filepath.Join(xdg, "flowtrack")
		} else {
			dir = filepath.Join(os.Getenv("HOME"), ".local", "share", "flowtrack")
		}
	}

	if err := os.MkdirAll(dir, 0o755); err != nil {
		// Fall back to current working directory
		dir = "."
	}

	return filepath.Join(dir, "data.db")
}
