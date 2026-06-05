# Database — Migrations & Seeds

## How to Run

### Migrations

1. Open your [Neon DB Dashboard](https://console.neon.tech/)
2. Navigate to your project → **SQL Editor**
3. Copy and paste the contents of each migration file in order:
   - `migrations/001_initial_schema.sql`

### Seeds

After running migrations, optionally seed test data:

- `seeds/001_sample_users.sql`

## Schema Overview

| Table | Purpose |
|---|---|
| `users` | Customer accounts |
| `tickets` | Support tickets |
| `chat_sessions` | Chat conversations linked to tickets |
| `messages` | Individual messages within a chat session |
| `feedback` | Resolution feedback (positive / negative / no_response) |

## Notes

- All tables use **UUID** primary keys (`gen_random_uuid()`)
- `updated_at` columns are auto-updated via PostgreSQL triggers
- Feedback supports both ticket-level and message-level ratings
