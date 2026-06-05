-- =============================================
-- Migration 003: Twitter Customer Support Dataset
-- Kaggle: "Customer Support on Twitter" by thoughtvector
-- https://www.kaggle.com/datasets/thoughtvector/customer-support-on-twitter
-- Run this in your Neon DB SQL editor BEFORE running the seed script
-- =============================================

-- Raw import table for the Kaggle CSV
CREATE TABLE IF NOT EXISTS twitter_support_raw (
    id                       SERIAL PRIMARY KEY,
    tweet_id                 BIGINT UNIQUE,
    author_id                TEXT,
    inbound                  BOOLEAN,   -- TRUE = customer message, FALSE = company reply
    created_at               TIMESTAMP,
    text                     TEXT,
    response_tweet_id        TEXT,
    in_response_to_tweet_id  BIGINT
);

CREATE INDEX IF NOT EXISTS idx_twitter_tweet_id        ON twitter_support_raw(tweet_id);
CREATE INDEX IF NOT EXISTS idx_twitter_inbound         ON twitter_support_raw(inbound);
CREATE INDEX IF NOT EXISTS idx_twitter_in_response     ON twitter_support_raw(in_response_to_tweet_id);
CREATE INDEX IF NOT EXISTS idx_twitter_author          ON twitter_support_raw(author_id);
