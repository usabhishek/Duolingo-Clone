# Deployment (AWS-Ready)

## Recommended Architecture
```
CloudFront → S3/Amplify (Next.js static/SSR)
     ↓
ALB → ECS/Fargate (FastAPI container)
     ↓
ElastiCache Redis + EFS/RDS
```

## Environment Variables (Production)
```
DATABASE_URL=postgresql://...   # migrate from SQLite
REDIS_URL=redis://elasticache:6379/0
JWT_SECRET_KEY=<long-random-secret>
CORS_ORIGINS=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

## SQLite Limitations on AWS
- Single-writer limitation — use RDS Postgres for production
- Mount EFS volume for persistence if keeping SQLite for demo

## Docker Production
```bash
docker-compose -f docker-compose.yml up -d
```

## WebSocket Behind ALB
- Enable sticky sessions or use wss:// with ALB idle timeout > 60s

## Migration Path
1. Deploy backend + Redis with docker-compose on EC2
2. Frontend on Amplify/Vercel pointing to API URL
3. Replace SQLite with RDS when scaling needed
