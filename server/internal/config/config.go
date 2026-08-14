package config

import "os"

// Config holds server runtime configuration loaded from environment variables.
type Config struct {
	DatabaseURL         string
	Port                string
	JWTSecret           string
	APISecret           string
	CORSOrigins         string
	WebURL              string
	RegistrationEnabled bool
	LeaderboardEnabled  bool
}

// Load reads all configuration from environment variables with sensible defaults.
func Load() *Config {
	return &Config{
		DatabaseURL:         getEnv("DATABASE_URL", "postgres://flowtrack:flowtrack@localhost:5432/flowtrack?sslmode=disable"),
		Port:                getEnv("SERVER_PORT", "8080"),
		JWTSecret:           getEnv("JWT_SECRET", "change-me-in-production"),
		APISecret:           getEnv("API_SECRET", "change-me-in-production"),
		CORSOrigins:         getEnv("CORS_ORIGINS", "*"),
		WebURL:              getEnv("WEB_URL", "http://localhost"),
		RegistrationEnabled: getEnvBool("REGISTRATION_ENABLED", true),
		LeaderboardEnabled:  getEnvBool("LEADERBOARD_ENABLED", true),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	v := os.Getenv(key)
	if v == "false" || v == "0" {
		return false
	}
	if v == "true" || v == "1" {
		return true
	}
	return fallback
}
