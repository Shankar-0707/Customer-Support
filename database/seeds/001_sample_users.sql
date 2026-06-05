-- =============================================
-- Seed 001: Sample Users
-- Run AFTER 001_initial_schema.sql
-- =============================================

INSERT INTO users (name, email) VALUES
    ('Alice Johnson', 'alice@example.com'),
    ('Bob Smith', 'bob@example.com'),
    ('Carol Davis', 'carol@example.com')
ON CONFLICT (email) DO NOTHING;
