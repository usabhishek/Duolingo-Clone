#!/bin/bash
set -e

echo "==> Running DB migrations (create tables)..."
python -c "
from app.db.database import Base, engine
from app.db import models  # register all models
Base.metadata.create_all(bind=engine)
print('Tables created.')
"

echo "==> Seeding database (idempotent)..."
python -m app.db.seed

echo "==> Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
