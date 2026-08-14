package storage

import (
	"database/sql"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// Session represents a single tracked application session recorded locally.
type Session struct {
	ID        int64
	AppName   string
	Title     string
	StartTime time.Time
	EndTime   time.Time
	Synced    bool
}

// DB wraps an SQLite connection and exposes helper methods for the agent.
type DB struct {
	conn *sql.DB
}

const schema = `
CREATE TABLE IF NOT EXISTS sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name   TEXT    NOT NULL,
    title      TEXT    NOT NULL DEFAULT '',
    start_time DATETIME NOT NULL,
    end_time   DATETIME NOT NULL,
    synced     INTEGER  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_synced ON sessions (synced);
`

// Open opens (or creates) the SQLite database at the given path and
// ensures the schema is initialised.
func Open(path string) (*DB, error) {
	conn, err := sql.Open("sqlite3", path+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, err
	}
	conn.SetMaxOpenConns(1) // SQLite is single-writer

	if _, err := conn.Exec(schema); err != nil {
		return nil, err
	}

	return &DB{conn: conn}, nil
}

// Close closes the underlying database connection.
func (db *DB) Close() error {
	return db.conn.Close()
}

// Insert writes a new session record (not yet synced) to local storage.
func (db *DB) Insert(s Session) error {
	_, err := db.conn.Exec(
		`INSERT INTO sessions (app_name, title, start_time, end_time, synced)
		 VALUES (?, ?, ?, ?, 0)`,
		s.AppName, s.Title, s.StartTime.UTC(), s.EndTime.UTC(),
	)
	return err
}

// Unsynced returns all sessions that have not yet been sent to the server.
func (db *DB) Unsynced() ([]Session, error) {
	rows, err := db.conn.Query(
		`SELECT id, app_name, title, start_time, end_time
		 FROM sessions WHERE synced = 0
		 ORDER BY start_time ASC LIMIT 500`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var s Session
		if err := rows.Scan(&s.ID, &s.AppName, &s.Title, &s.StartTime, &s.EndTime); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

// MarkSynced marks a batch of session IDs as successfully synced.
func (db *DB) MarkSynced(ids []int64) error {
	if len(ids) == 0 {
		return nil
	}
	tx, err := db.conn.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(`UPDATE sessions SET synced = 1 WHERE id = ?`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for _, id := range ids {
		if _, err := stmt.Exec(id); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}
