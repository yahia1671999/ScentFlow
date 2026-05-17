# ScentFlow ERP Deployment Guide

## 1. Prerequisites
- Node.js 18+
- PM2 (npm install -g pm2)
- Nginx
- Ubuntu/Linux VPS

## 2. Infrastructure Setup
Create the directory structure:
```bash
mkdir -p /var/www/scentflow/server/database
mkdir -p /var/www/scentflow/server/backups
```

## 3. Environment Configuration
Copy `.env.example` to `.env` and fill the values.
**CRITICAL**: Change `JWT_SECRET` to a strong random string.

## 4. Build and Start
```bash
npm install
npm run build
pm2 start ecosystem.config.js
```

## 5. Nginx Configuration
Use the provided `nginx.conf` template for your site configuration.

## 6. Backup Strategy
The system performs daily backups to `/var/www/scentflow/server/backups`.
You can also trigger manual backups from the Admin Panel.

## 7. Migration from SQLite to PostgreSQL (Future)
1. Export all tables to JSON/CSV via the Admin Panel.
2. Update `src/server/db.ts` to use `pg` instead of `better-sqlite3`.
3. Import data using the provided migration scripts.
