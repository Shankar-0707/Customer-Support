-- =============================================
-- Seed 002: Twitter Kaggle Dataset → Hindsight Memory
-- Run AFTER:
--   1. 003_twitter_support_dataset.sql (migration)
--   2. Kaggle CSV import (see database/scripts/import_kaggle_twitter.js)
-- =============================================
-- This seeds the hindsight_mock_memories table with real
-- customer support conversations from the Kaggle dataset,
-- giving your AI agent a head-start with pre-trained context.
-- =============================================

-- Step 1: Seed GLOBAL resolution bank
-- Anonymized Q&A pairs from the Twitter dataset
INSERT INTO hindsight_mock_memories (bank_id, content)
SELECT
    'global_resolutions',
    'Past conversation:' || chr(10) ||
    'Customer: ' || q.text || chr(10) ||
    'Agent: ' || a.text
FROM twitter_support_raw q
JOIN twitter_support_raw a
    -- response_tweet_id can be "119249" or "119249,119251" (multi-reply)
    -- Only join on plain numeric IDs (no comma = single response)
    ON a.tweet_id = (
        CASE
          WHEN q.response_tweet_id ~ '^[0-9]+$'
          THEN q.response_tweet_id::BIGINT
          ELSE NULL
        END
    )
WHERE
    q.inbound = true                   -- customer message
    AND a.inbound = false              -- company reply
    AND length(q.text) > 20
    AND length(a.text) > 20
    AND q.text NOT LIKE '%http%'       -- skip link-heavy tweets
    AND a.text NOT ILIKE '%DM%'        -- skip "please DM us" replies (unhelpful)
    AND a.text NOT ILIKE '%direct message%'
ORDER BY q.created_at DESC
LIMIT 500;

-- Step 2: Verify what was seeded
SELECT 
    bank_id, 
    COUNT(*) AS total_entries,
    MIN(created_at) AS oldest,
    MAX(created_at) AS newest
FROM hindsight_mock_memories
GROUP BY bank_id
ORDER BY bank_id;
