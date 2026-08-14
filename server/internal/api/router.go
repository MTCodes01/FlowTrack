package api

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/MTCodes01/flowtrack/server/internal/auth"
	"github.com/MTCodes01/flowtrack/server/internal/config"
	"github.com/MTCodes01/flowtrack/server/internal/models"
	"gorm.io/gorm"
)

// Migrate runs GORM auto-migration for all models.
func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(&models.User{}, &models.Session{})
}

// NewRouter builds the Gin engine with all routes.
func NewRouter(cfg *config.Config, db *gorm.DB) http.Handler {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())

	// CORS
	origins := strings.Split(cfg.CORSOrigins, ",")
	r.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	h := &handlers{cfg: cfg, db: db}

	// Health
	r.GET("/health", h.health)
	r.GET("/api/health", h.health)

	v1 := r.Group("/api/v1")

	// Auth routes (public)
	v1.POST("/auth/register", h.register)
	v1.POST("/auth/login", h.login)

	// Authenticated routes
	authed := v1.Group("")
	authed.Use(authMiddleware(cfg.JWTSecret))
	{
		authed.GET("/me", h.me)
		authed.GET("/sessions", h.listSessions)
		authed.POST("/sessions/batch", h.batchSessions)
		authed.GET("/stats/daily", h.dailyStats)
		authed.GET("/stats/weekly", h.weeklyStats)
		authed.GET("/leaderboard", h.leaderboard)
	}

	return r
}

// authMiddleware validates the Bearer token on protected routes.
func authMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization header"})
			return
		}
		token := strings.TrimPrefix(header, "Bearer ")
		claims, err := auth.Parse(token, secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Next()
	}
}
