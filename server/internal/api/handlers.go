package api

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/MTCodes01/flowtrack/server/internal/auth"
	"github.com/MTCodes01/flowtrack/server/internal/config"
	"github.com/MTCodes01/flowtrack/server/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// parseDateIST parses a YYYY-MM-DD string as start-of-day in IST.
func parseDateIST(s string) (time.Time, error) {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return time.Time{}, err
	}
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, istLocation), nil
}

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
	c.JSON(http.StatusOK, gin.H{"id": user.ID, "username": user.Username, "email": user.Email, "preferences": user.Preferences})
}

type updatePrefsReq struct {
	Preferences string `json:"preferences"`
}

func (h *handlers) updatePreferences(c *gin.Context) {
	userID := c.GetUint("userID")
	var req updatePrefsReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", userID).Update("preferences", req.Preferences).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save preferences"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
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

var istLocation = time.FixedZone("IST", 5*3600+30*60)

type appStat struct {
	AppName      string `json:"app_name"`
	TotalSeconds int64  `json:"total_seconds"`
}

func (h *handlers) dailyStats(c *gin.Context) {
	userID := c.GetUint("userID")
	nowIST := time.Now().In(istLocation)
	todayIST := time.Date(nowIST.Year(), nowIST.Month(), nowIST.Day(), 0, 0, 0, 0, istLocation)

	var stats []appStat
	h.db.Model(&models.Session{}).
		Select("app_name, SUM(duration_secs) as total_seconds").
		Where("user_id = ? AND start_time >= ?", userID, todayIST.UTC()).
		Group("app_name").
		Order("total_seconds DESC").
		Scan(&stats)

	c.JSON(http.StatusOK, stats)
}

func (h *handlers) weeklyStats(c *gin.Context) {
	userID := c.GetUint("userID")
	nowIST := time.Now().In(istLocation)
	weekAgoIST := time.Date(nowIST.Year(), nowIST.Month(), nowIST.Day()-6, 0, 0, 0, 0, istLocation)

	var stats []appStat
	h.db.Model(&models.Session{}).
		Select("app_name, SUM(duration_secs) as total_seconds").
		Where("user_id = ? AND start_time >= ?", userID, weekAgoIST.UTC()).
		Group("app_name").
		Order("total_seconds DESC").
		Scan(&stats)

	c.JSON(http.StatusOK, stats)
}

type heatmapStat struct {
	Date         string `json:"date"`
	AppName      string `json:"app_name"`
	TotalSeconds int64  `json:"total_seconds"`
	Count        int64  `json:"count"`
}

func (h *handlers) heatmapStats(c *gin.Context) {
	userID := c.GetUint("userID")
	threeYearsAgo := time.Now().AddDate(-3, 0, 0)

	var stats []heatmapStat
	h.db.Model(&models.Session{}).
		Select("TO_CHAR(start_time AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') as date, app_name, SUM(duration_secs) as total_seconds, COUNT(*) as count").
		Where("user_id = ? AND start_time >= ?", userID, threeYearsAgo).
		Group("TO_CHAR(start_time AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), app_name").
		Order("date ASC").
		Scan(&stats)

	c.JSON(http.StatusOK, stats)
}

// ─── Range Summary Stats ──────────────────────────────────────────────────────

type rangeSummaryResponse struct {
	TotalSeconds     int64  `json:"total_seconds"`
	TotalSessions    int64  `json:"total_sessions"`
	AvgSession       int64  `json:"avg_session"`
	LongestSession   int64  `json:"longest_session"`
	LongestApp       string `json:"longest_app"`
	TopApp           string `json:"top_app"`
	TopAppSeconds    int64  `json:"top_app_seconds"`
	PrevTotalSeconds int64  `json:"prev_total_seconds"`
	PrevSessions     int64  `json:"prev_sessions"`
	PrevAvgSession   int64  `json:"prev_avg_session"`
}

type periodStats struct {
	TotalSeconds   int64
	TotalSessions  int64
	AvgSession     int64
	LongestSession int64
	LongestApp     string
}

func (h *handlers) computePeriodStats(userID uint, start, end time.Time) periodStats {
	type sessionData struct {
		AppName   string
		StartTime time.Time
		EndTime   time.Time
		Duration  int64
	}
	var rows []sessionData
	h.db.Model(&models.Session{}).
		Select("app_name, start_time, end_time, duration_secs as duration").
		Where("user_id = ? AND start_time >= ? AND start_time <= ?", userID, start, end).
		Order("start_time ASC").
		Scan(&rows)

	var stats periodStats
	type activeSession struct {
		app      string
		end      time.Time
		duration int64
	}
	var currSess *activeSession

	for _, r := range rows {
		stats.TotalSeconds += r.Duration
		if currSess == nil {
			currSess = &activeSession{app: r.AppName, end: r.EndTime, duration: r.Duration}
		} else {
			// Merge sessions if same app and gap is <= 5 minutes (300 seconds)
			if r.AppName == currSess.app && r.StartTime.Sub(currSess.end).Seconds() <= 300 {
				currSess.end = r.EndTime
				currSess.duration += r.Duration
			} else {
				stats.TotalSessions++
				if currSess.duration > stats.LongestSession {
					stats.LongestSession = currSess.duration
					stats.LongestApp = currSess.app
				}
				currSess = &activeSession{app: r.AppName, end: r.EndTime, duration: r.Duration}
			}
		}
	}
	if currSess != nil {
		stats.TotalSessions++
		if currSess.duration > stats.LongestSession {
			stats.LongestSession = currSess.duration
			stats.LongestApp = currSess.app
		}
	}

	if stats.TotalSessions > 0 {
		stats.AvgSession = stats.TotalSeconds / stats.TotalSessions
	}

	return stats
}

func (h *handlers) rangeSummaryStats(c *gin.Context) {
	userID := c.GetUint("userID")
	startStr := c.DefaultQuery("start", "")
	endStr := c.DefaultQuery("end", "")

	start, err1 := parseDateIST(startStr)
	end, err2 := parseDateIST(endStr)
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}
	endInclusive := end.Add(24*time.Hour - time.Second)

	// Current period aggregate (memory grouped contiguous sessions)
	curr := h.computePeriodStats(userID, start.UTC(), endInclusive.UTC())

	// Top app in period
	type appRow struct {
		AppName      string
		TotalSeconds int64
	}
	var topApps []appRow
	h.db.Model(&models.Session{}).
		Select("app_name, SUM(duration_secs) as total_seconds").
		Where("user_id = ? AND start_time >= ? AND start_time <= ?", userID, start.UTC(), endInclusive.UTC()).
		Group("app_name").Order("total_seconds DESC").Limit(1).
		Scan(&topApps)

	// Previous period (same duration, immediately before)
	duration := endInclusive.Sub(start)
	prevEnd := start.Add(-time.Second)
	prevStart := prevEnd.Add(-duration)

	prev := h.computePeriodStats(userID, prevStart.UTC(), prevEnd.UTC())

	resp := rangeSummaryResponse{
		TotalSeconds:     curr.TotalSeconds,
		TotalSessions:    curr.TotalSessions,
		AvgSession:       curr.AvgSession,
		LongestSession:   curr.LongestSession,
		LongestApp:       curr.LongestApp,
		PrevTotalSeconds: prev.TotalSeconds,
		PrevSessions:     prev.TotalSessions,
		PrevAvgSession:   prev.AvgSession,
	}
	if len(topApps) > 0 {
		resp.TopApp = topApps[0].AppName
		resp.TopAppSeconds = topApps[0].TotalSeconds
	}
	c.JSON(http.StatusOK, resp)
}

// ─── Trend Stats ──────────────────────────────────────────────────────────────

type trendPoint struct {
	Label        string `json:"label"`
	TotalSeconds int64  `json:"total_seconds"`
	Count        int64  `json:"count"`
}

func (h *handlers) trendStats(c *gin.Context) {
	userID := c.GetUint("userID")
	startStr := c.DefaultQuery("start", "")
	endStr := c.DefaultQuery("end", "")
	granularity := c.DefaultQuery("granularity", "daily")

	start, err1 := parseDateIST(startStr)
	end, err2 := parseDateIST(endStr)
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}
	endInclusive := end.Add(24*time.Hour - time.Second)

	var points []trendPoint
	switch granularity {
	case "hourly":
		h.db.Model(&models.Session{}).
			Select("TO_CHAR(start_time AT TIME ZONE 'Asia/Kolkata', 'HH24') as label, SUM(duration_secs) as total_seconds, COUNT(*) as count").
			Where("user_id = ? AND start_time >= ? AND start_time <= ?", userID, start.UTC(), endInclusive.UTC()).
			Group("label").Order("label").
			Scan(&points)
	case "monthly":
		h.db.Model(&models.Session{}).
			Select("TO_CHAR(start_time AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') as label, SUM(duration_secs) as total_seconds, COUNT(*) as count").
			Where("user_id = ? AND start_time >= ? AND start_time <= ?", userID, start.UTC(), endInclusive.UTC()).
			Group("label").Order("label").
			Scan(&points)
	default: // daily
		h.db.Model(&models.Session{}).
			Select("TO_CHAR(start_time AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') as label, SUM(duration_secs) as total_seconds, COUNT(*) as count").
			Where("user_id = ? AND start_time >= ? AND start_time <= ?", userID, start.UTC(), endInclusive.UTC()).
			Group("label").Order("label").
			Scan(&points)
	}

	if points == nil {
		points = []trendPoint{}
	}
	c.JSON(http.StatusOK, points)
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

	nowIST := time.Now().In(istLocation)
	weekAgoIST := time.Date(nowIST.Year(), nowIST.Month(), nowIST.Day()-6, 0, 0, 0, 0, istLocation)

	var entries []leaderboardEntry
	h.db.Model(&models.Session{}).
		Select("users.username, SUM(sessions.duration_secs) as total_seconds").
		Joins("JOIN users ON users.id = sessions.user_id").
		Where("sessions.start_time >= ?", weekAgoIST.UTC()).
		Group("users.username").
		Order("total_seconds DESC").
		Limit(50).
		Scan(&entries)

	c.JSON(http.StatusOK, entries)
}
