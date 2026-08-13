# LinguaQuest

Duolingo-inspired full-stack language learning application built for SDE Fullstack assignment evaluation.

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 20+
- Redis (optional for rate limiting / WebSocket pub-sub)

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
mkdir data
cp .env.example .env
python -m app.db.seed
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 — use the seeded demo account `maria@linguaquest.com` / `password123` (or `demo@linguaquest.com` / `password123`).

### Docker
```bash
docker-compose up --build
```

## Language Tracks
- **Spanish** (es) — primary seeded course
- **German** (de)
- **English** (en)

Switch tracks on the home page course selector.

## Architecture
Monorepo: `frontend/` (Next.js), `backend/` (FastAPI), `docs/`

See `docs/ARCHITECTURE.md` for full system design.

## Tests
```bash
cd backend && PYTHONPATH=. pytest -v
cd frontend && npm run build
```

## Demo Users
| Email | Password | XP |
|-------|----------|-----|
| demo@linguaquest.com | password123 | 450 |
| maria@linguaquest.com | password123 | 1200 |
| hans@linguaquest.com | password123 | 890 |
