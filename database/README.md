# Database — Migrations & Seeds

## How to Run

### Migrations (run in order in Neon DB SQL Editor)

1. `migrations/001_initial_schema.sql` — Core tables (users, tickets, sessions, messages, feedback)
2. `migrations/002_hindsight_mock_memories.sql` — Local AI memory fallback table
3. `migrations/003_twitter_support_dataset.sql` — Kaggle raw import table *(only needed for dataset import)*

### Seeds (run after migrations)

- `seeds/001_sample_users.sql` — 3 sample users for testing
- `seeds/002_kaggle_twitter_to_memory.sql` — Seed AI memory from Kaggle dataset *(run after Kaggle import)*

### Kaggle Dataset Import

See [`scripts/README.md`](./scripts/README.md) for full instructions.

**Quick version:**
```bash
# 1. Place twcs.csv in database/scripts/
# 2. Install deps
cd database/scripts && npm install
# 3. Run importer
node import_kaggle_twitter.mjs
# 4. Then run seeds/002_kaggle_twitter_to_memory.sql in Neon SQL Editor
```

## Schema Overview

| Table | Purpose |
|---|---|
| `users` | Customer accounts |
| `tickets` | Support tickets |
| `chat_sessions` | Chat conversations linked to tickets |
| `messages` | Individual messages within a chat session |
| `feedback` | Resolution feedback (positive / negative / no_response) |
| `hindsight_mock_memories` | Local AI memory bank (fallback when Hindsight Cloud not configured) |
| `twitter_support_raw` | Raw Kaggle Twitter dataset (for AI pre-training) |

## Notes

- All core tables use **UUID** primary keys (`gen_random_uuid()`)
- `updated_at` columns are auto-updated via PostgreSQL triggers
- Feedback supports both ticket-level and message-level ratings
- Hindsight memory uses `bank_id`: user UUID (personal) or `global_resolutions` (cross-customer)

