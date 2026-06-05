-- =============================================
-- Migration 002: Hindsight Mock Memory Table
-- Memory-Driven Customer Support Agent
-- =============================================
-- Run this in your Neon DB SQL editor

CREATE TABLE IF NOT EXISTS hindsight_mock_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hindsight_bank_id ON hindsight_mock_memories(bank_id);
CREATE INDEX IF NOT EXISTS idx_hindsight_created_at ON hindsight_mock_memories(created_at DESC);
