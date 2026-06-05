# 🧠 Memory-Driven Customer Support Agent

An AI-powered customer support agent that **remembers customers**, **learns from resolved issues**, and **improves over time** through feedback loops.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (Neon DB) |
| LLM | Groq |
| Memory Engine | Hindsight Cloud |

## Project Structure

```
Customer-Support-Agent/
├── client/          # React + TypeScript frontend
├── server/          # Express + TypeScript backend
├── database/        # SQL migrations & seeds
├── .env.example     # Environment variable template
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Neon DB account ([neon.tech](https://neon.tech))

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd Customer-Support-Agent
   ```

2. **Install dependencies**
   ```bash
   # Server
   cd server && pnpm install

   # Client
   cd ../client && pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Neon DB credentials
   ```

4. **Run database migrations**
   ```bash
   # Copy the SQL from database/migrations/001_initial_schema.sql
   # and run it in your Neon DB SQL editor
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 — Backend
   cd server && pnpm dev

   # Terminal 2 — Frontend
   cd client && pnpm dev
   ```

## Development Phases

- [x] **Phase 1** — Project Setup
- [ ] **Phase 2** — Basic AI Chat (Groq)
- [ ] **Phase 3** — Customer Memory (Hindsight)
- [ ] **Phase 4** — Cross-Customer Resolution Learning
- [ ] **Phase 5** — Feedback Learning
- [ ] **Phase 6** — Knowledge Base

## License

MIT
