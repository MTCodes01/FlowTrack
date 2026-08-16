package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/MTCodes01/flowtrack/agent/internal/config"
	"github.com/MTCodes01/flowtrack/agent/internal/storage"
	"github.com/MTCodes01/flowtrack/agent/internal/sync"
	"github.com/MTCodes01/flowtrack/agent/internal/tracker"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("flowtrack-agent: failed to load config: %v", err)
	}

	db, err := storage.Open(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("flowtrack-agent: failed to open local database: %v", err)
	}
	defer db.Close()

	t := tracker.New(cfg, db)
	s := sync.New(cfg, db)

	// Track active window every PollInterval
	pollTicker := time.NewTicker(cfg.PollInterval)
	// Sync to server every SyncInterval
	syncTicker := time.NewTicker(cfg.SyncInterval)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	log.Printf("flowtrack-agent: started (poll=%s sync=%s server=%s)",
		cfg.PollInterval, cfg.SyncInterval, cfg.ServerURL)

	for {
		select {
		case <-pollTicker.C:
			if err := t.Sample(); err != nil {
				log.Printf("flowtrack-agent: sample error: %v", err)
			}
		case <-syncTicker.C:
			if cfg.ServerURL != "" {
				t.Commit()
				if err := s.Flush(); err != nil {
					log.Printf("flowtrack-agent: sync error: %v", err)
				}
			}
		case sig := <-quit:
			log.Printf("flowtrack-agent: received signal %s - shutting down", sig)
			pollTicker.Stop()
			syncTicker.Stop()
			// Final flush before exit
			t.Commit()
			if cfg.ServerURL != "" {
				_ = s.Flush()
			}
			return
		}
	}
}
