-- FlowTrack initial migration
-- This file is for reference only; GORM AutoMigrate handles schema creation.
-- Use this for raw psql inspection or manual setup.

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ,
    username      VARCHAR(64)  NOT NULL UNIQUE,
    email         VARCHAR(256) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    is_admin      BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

CREATE TABLE IF NOT EXISTS sessions (
    id             BIGSERIAL PRIMARY KEY,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ,
    user_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_name       VARCHAR(256) NOT NULL,
    title          VARCHAR(512) NOT NULL DEFAULT '',
    start_time     TIMESTAMPTZ  NOT NULL,
    end_time       TIMESTAMPTZ  NOT NULL,
    duration_secs  BIGINT       NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_app_name   ON sessions (app_name);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions (start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON sessions (deleted_at);
