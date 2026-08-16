package tracker

import (
	"log"
	"time"

	"github.com/MTCodes01/flowtrack/agent/internal/config"
	"github.com/MTCodes01/flowtrack/agent/internal/storage"
)

// Tracker polls the active window and writes sessions to local storage.
type Tracker struct {
	cfg     *config.Config
	db      *storage.DB
	current *activeWindow
}

type activeWindow struct {
	AppName   string
	Title     string
	StartTime time.Time
}

// New creates a new Tracker.
func New(cfg *config.Config, db *storage.DB) *Tracker {
	return &Tracker{cfg: cfg, db: db}
}

// Commit forcefully saves the current active session to the database,
// and starts a new session if the app is still active.
func (t *Tracker) Commit() {
	if t.current == nil {
		return
	}

	now := time.Now()
	// Don't save empty sessions (duration < 1s)
	if now.Sub(t.current.StartTime) >= time.Second {
		session := storage.Session{
			AppName:   t.current.AppName,
			Title:     t.current.Title,
			StartTime: t.current.StartTime,
			EndTime:   now,
		}
		if err := t.db.Insert(session); err != nil {
			log.Printf("tracker: failed to insert session: %v", err)
		}
	}

	// Reset start time to now so the next chunk is contiguous
	t.current.StartTime = now
}

// Sample queries the current active window and, if it has changed,
// saves the previous window as a completed session.
func (t *Tracker) Sample() error {
	appName, title, err := getActiveWindow()
	if err != nil || appName == "" {
		// If no active window or error, just commit existing and clear
		if t.current != nil {
			t.Commit()
			t.current = nil
		}
		return nil
	}

	now := time.Now()

	if t.current == nil {
		t.current = &activeWindow{AppName: appName, Title: title, StartTime: now}
		return nil
	}

	// Window changed - commit the previous session
	if appName != t.current.AppName {
		t.Commit()
		t.current = &activeWindow{AppName: appName, Title: title, StartTime: now}
	} else {
		// Same app - just update the window title
		t.current.Title = title
	}

	return nil
}
