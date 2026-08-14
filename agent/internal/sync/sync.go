package sync

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/MTCodes01/flowtrack/agent/internal/config"
	"github.com/MTCodes01/flowtrack/agent/internal/storage"
)

// Syncer flushes unsynced local sessions to the FlowTrack server.
type Syncer struct {
	cfg    *config.Config
	db     *storage.DB
	client *http.Client
}

type sessionPayload struct {
	AppName   string    `json:"app_name"`
	Title     string    `json:"title"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

type syncRequest struct {
	Sessions []sessionPayload `json:"sessions"`
}

// New creates a new Syncer.
func New(cfg *config.Config, db *storage.DB) *Syncer {
	return &Syncer{
		cfg: cfg,
		db:  db,
		client: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// Flush reads all unsynced sessions from local storage and POSTs them to the
// server.  On success it marks them as synced so they won't be sent again.
func (s *Syncer) Flush() error {
	sessions, err := s.db.Unsynced()
	if err != nil {
		return fmt.Errorf("sync: failed to read unsynced sessions: %w", err)
	}
	if len(sessions) == 0 {
		return nil
	}

	payload := syncRequest{Sessions: make([]sessionPayload, 0, len(sessions))}
	ids := make([]int64, 0, len(sessions))

	for _, sess := range sessions {
		payload.Sessions = append(payload.Sessions, sessionPayload{
			AppName:   sess.AppName,
			Title:     sess.Title,
			StartTime: sess.StartTime,
			EndTime:   sess.EndTime,
		})
		ids = append(ids, sess.ID)
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("sync: marshal error: %w", err)
	}

	url := s.cfg.ServerURL + "/api/v1/sessions/batch"
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("sync: build request error: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if s.cfg.APIToken != "" {
		req.Header.Set("Authorization", "Bearer "+s.cfg.APIToken)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("sync: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("sync: server returned %d", resp.StatusCode)
	}

	if err := s.db.MarkSynced(ids); err != nil {
		return fmt.Errorf("sync: mark synced failed: %w", err)
	}

	return nil
}
