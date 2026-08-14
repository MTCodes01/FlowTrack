package api

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/flowtrack-app/flowtrack/server/internal/auth"
	"github.com/flowtrack-app/flowtrack/server/internal/config"
	"github.com/flowtrack-app/flowtrack/server/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type handlers struct {
	cfg *config.Config
	db  *gorm.DB
}

// ─── Health ──────────────────────────────────────────────────────────────────

func (h *handlers) health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "version": "1.0.0"})
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

type registerRequest struct {
	Username string `json:"username" binding:"required,min=3,max=64"`
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

func (h *handlers) register(c *gin.Context) {
	if !h.cfg.RegistrationEnabled {
		c.JSON(http.StatusForbidden, gin.H{"error": "registration is disabled"})
		return
	}

	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not hash password"})
		return
	}

	user := models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hash),
	}
	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "username or email already taken"})
		return
	}

	token, _ := auth.Generate(user.ID, user.Username, h.cfg.JWTSecret)
	c.JSON(http.StatusCreated, gin.H{"token": token, "user": gin.H{
		"id": user.ID, "username": user.Username, "email": user.Email,
	}})
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *handlers) login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, _ := auth.Generate(user.ID, user.Username, h.cfg.JWTSecret)
	c.JSON(http.StatusOK, gin.H{"token": token, "user": gin.H{
		"id": user.ID, "username": user.Username, "email": user.Email,
	}})
}

func (h *handlers) me(c *gin.Context) {
	userID := c.GetUint("userID")
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": user.ID, "username": user.Username, "email": user.Email})
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

type sessionInput struct {
	AppName   string    `json:"app_name" binding:"required"`
	Title     string    `json:"title"`
	StartTime time.Time `json:"start_time" binding:"required"`
	EndTime   time.Time `json:"end_time"   binding:"required"`
}

type batchRequest struct {
	Sessions []sessionInput `json:"sessions" binding:"required,dive"`
}

func (h *handlers) batchSessions(c *gin.Context) {
	userID := c.GetUint("userID")

	var req batchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sessions := make([]models.Session, 0, len(req.Sessions))
	for _, s := range req.Sessions {
		sessions = append(sessions, models.Session{
			UserID:    userID,
			AppName:   s.AppName,
			Title:     s.Title,
			StartTime: s.StartTime,
			EndTime:   s.EndTime,
		})
	}

	if err := h.db.Create(&sessions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save sessions"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"saved": len(sessions)})
}

func (h *handlers) listSessions(c *gin.Context) {
	userID := c.GetUint("userID")
	limit := 100

	var sessions []models.Session
	h.db.Where("user_id = ?", userID).
		Order("start_time DESC").
		Limit(limit).
		Find(&sessions)

	c.JSON(http.StatusOK, sessions)
}

// ─── Stats ────────────────────────────────────────────────────────────────────

type appStat struct {
	AppName      string `json:"app_name"`
	TotalSeconds int64  `json:"total_seconds"`
}

func (h *handlers) dailyStats(c *gin.Context) {
	userID := c.GetUint("userID")
	today := time.Now().Truncate(24 * time.Hour)

	var stats []appStat
	h.db.Model(&models.Session{}).
		Select("app_name, SUM(duration_secs) as total_seconds").
		Where("user_id = ? AND start_time >= ?", userID, today).
		Group("app_name").
		Order("total_seconds DESC").
		Scan(&stats)

	c.JSON(http.StatusOK, stats)
}

func (h *handlers) weeklyStats(c *gin.Context) {
	userID := c.GetUint("userID")
	weekAgo := time.Now().AddDate(0, 0, -7)

	var stats []appStat
	h.db.Model(&models.Session{}).
		Select("app_name, SUM(duration_secs) as total_seconds").
		Where("user_id = ? AND start_time >= ?", userID, weekAgo).
		Group("app_name").
		Order("total_seconds DESC").
		Scan(&stats)

	c.JSON(http.StatusOK, stats)
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

type leaderboardEntry struct {
	Username     string `json:"username"`
	TotalSeconds int64  `json:"total_seconds"`
}

func (h *handlers) leaderboard(c *gin.Context) {
	if !h.cfg.LeaderboardEnabled {
		c.JSON(http.StatusForbidden, gin.H{"error": "leaderboard is disabled"})
		return
	}

	weekAgo := time.Now().AddDate(0, 0, -7)

	var entries []leaderboardEntry
	h.db.Model(&models.Session{}).
		Select("users.username, SUM(sessions.duration_secs) as total_seconds").
		Joins("JOIN users ON users.id = sessions.user_id").
		Where("sessions.start_time >= ?", weekAgo).
		Group("users.username").
		Order("total_seconds DESC").
		Limit(50).
		Scan(&entries)

	c.JSON(http.StatusOK, entries)
}
