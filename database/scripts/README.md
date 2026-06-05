# Database Scripts

## Kaggle Twitter Dataset Import

### Dataset
**"Customer Support on Twitter"** by thoughtvector  
URL: https://www.kaggle.com/datasets/thoughtvector/customer-support-on-twitter

### How to Import

**Step 1 — Run the migration (Neon DB SQL editor)**
```sql
-- Run: database/migrations/003_twitter_support_dataset.sql
```

**Step 2 — Download the dataset**
1. Go to https://www.kaggle.com/datasets/thoughtvector/customer-support-on-twitter
2. Download `twcs.csv`
3. Place it at: `database/scripts/twcs.csv`

**Step 3 — Install the pg package**
```bash
npm install pg
```

**Step 4 — Run the import script**
```bash
node database/scripts/import_kaggle_twitter.mjs
```

This will import up to 50,000 rows (configurable in the script).

**Step 5 — Seed the AI memory bank (Neon DB SQL editor)**
```sql
-- Run: database/seeds/002_kaggle_twitter_to_memory.sql
```

This extracts real customer Q&A pairs from the raw data and inserts them 
into `hindsight_mock_memories` under the `global_resolutions` bank.
Your AI agent will now respond with knowledge from real Twitter support conversations!

### What the Dataset Contains
- ~3 million tweets between customers and brand support accounts
- Brands: Amazon, Apple, Spotify, Uber, Delta, and many more
- Columns: tweet_id, author_id, inbound, created_at, text, response_tweet_id, in_response_to_tweet_id
