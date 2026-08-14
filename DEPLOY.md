# Deployment Guide

## Architecture

```
[Browser]
    │
    ├──▶ Vercel (Next.js frontend)
    │         │
    │         └──▶ /api/* proxy
    │                   │
    └──────────────────▶ Render (FastAPI backend)
                              │
                              └──▶ Render PostgreSQL (free 1 GB)
```

---

## Step 1 — Deploy Backend + Database on Render

> Render will create the PostgreSQL DB and backend API together from `render.yaml`.

1. Go to **https://dashboard.render.com**
2. Click **New → Blueprint**
3. Connect your GitHub repo: `usabhishek/Duolingo-Clone`
4. Render detects `render.yaml` automatically — click **Apply**
5. Render will:
   - Create a free **PostgreSQL** database (`linguaquest-db`)
   - Build and deploy the **FastAPI backend** (`linguaquest-api`)
   - Auto-inject `DATABASE_URL` into the backend
   - Auto-generate a secure `JWT_SECRET_KEY`
   - Run `start.sh` which seeds the database on first boot

6. Wait ~3 minutes. Then copy your backend URL, e.g.:
   ```
   https://linguaquest-api.onrender.com
   ```
7. Test it: `https://linguaquest-api.onrender.com/health` → should return `{"status":"ok"}`

---

## Step 2 — Deploy Frontend on Vercel

1. Go to **https://vercel.com/new**
2. Import your GitHub repo: `usabhishek/Duolingo-Clone`
3. Set **Root Directory** to `frontend`
4. Add these **Environment Variables**:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://linguaquest-api.onrender.com` |
   | `NEXT_PUBLIC_WS_URL` | `wss://linguaquest-api.onrender.com` |

5. Click **Deploy**
6. Vercel gives you a URL like: `https://linguaquest.vercel.app`

---

## Step 3 — Update CORS on Render

After getting your Vercel URL, go to Render → `linguaquest-api` → **Environment** and update:

| Variable | Value |
|---|---|
| `CORS_ORIGINS` | `https://linguaquest.vercel.app,http://localhost:3000` |

Click **Save** — Render redeploys automatically.

---

## Database: Where does it live?

| Environment | Database | Location |
|---|---|---|
| **Local dev** | SQLite | `backend/data/linguaquest.db` (file on disk) |
| **Production** | PostgreSQL | Render managed DB (free 1 GB, auto-backups) |

The app automatically uses whichever `DATABASE_URL` is set. SQLite for local, PostgreSQL on Render — no code changes needed.

### ⚠️ Why not SQLite on Render?
Render's file system is **ephemeral** — it resets on every deploy. SQLite would lose all data on each redeploy. PostgreSQL is a real persistent managed database.

---

## Seeded Demo Accounts

After deployment, these accounts are ready to use:

| Email | Password | XP |
|---|---|---|
| `alice@example.com` | `Password123!` | 1200 XP |
| `maria@linguaquest.com` | `Password123!` | 890 XP |
| `hans@linguaquest.com` | `Password123!` | 650 XP |

---

## Local Development

```bash
# Backend
cd backend
cp .env.example .env
pip install -r requirements.txt
python -m app.db.seed
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Open http://localhost:3000
