package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a FlowTrack account.
type User struct {
	gorm.Model
	Username     string `gorm:"uniqueIndex;not null;size:64"`
	Email        string `gorm:"uniqueIndex;not null;size:256"`
	PasswordHash string `gorm:"not null"`
	IsAdmin      bool   `gorm:"default:false"`

	Sessions []Session `gorm:"foreignKey:UserID"`
}

// Session represents a tracked application usage interval.
type Session struct {
	gorm.Model
	UserID    uint      `gorm:"not null;index"`
	AppName   string    `gorm:"not null;size:256;index"`
	Title     string    `gorm:"size:512"`
	StartTime time.Time `gorm:"not null;index"`
	EndTime   time.Time `gorm:"not null"`
	// Duration in seconds - derived field, stored for query performance
	DurationSecs int64 `gorm:"not null;default:0"`
}

// BeforeSave computes DurationSecs from StartTime/EndTime.
func (s *Session) BeforeSave(tx *gorm.DB) error {
	if !s.EndTime.IsZero() && !s.StartTime.IsZero() {
		s.DurationSecs = int64(s.EndTime.Sub(s.StartTime).Seconds())
	}
	return nil
}
