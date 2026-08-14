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

// Sample queries the current active window and, if it has changed,
// saves the previous window as a completed session.
func (t *Tracker) Sample() error {
	appName, title, err := getActiveWindow()
	if err != nil {
		// Not fatal — active window may briefly be unavailable
		return nil
	}

	now := time.Now()

	if t.current == nil {
		t.current = &activeWindow{AppName: appName, Title: title, StartTime: now}
		return nil
	}

	// Window changed — commit the previous session
	if appName != t.current.AppName {
		session := storage.Session{
			AppName:   t.current.AppName,
			Title:     t.current.Title,
			StartTime: t.current.StartTime,
			EndTime:   now,
		}
		if err := t.db.Insert(session); err != nil {
			log.Printf("tracker: failed to insert session: %v", err)
		}

		t.current = &activeWindow{AppName: appName, Title: title, StartTime: now}
	} else {
		// Same app — just update the window title
		t.current.Title = title
	}

	return nil
}
