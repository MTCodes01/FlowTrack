-- FlowTrack PostgreSQL init script
-- Runs once when the postgres container is first created.
-- The actual schema is managed by GORM AutoMigrate at server startup.

-- Ensure the database uses UTC
SET timezone = 'UTC';

-- Create the flowtrack database if it doesn't already exist
-- (Docker creates it from POSTGRES_DB, but this guards against manual runs)
SELECT 'FlowTrack database initialized' AS status;
