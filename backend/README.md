# Center M — Backend Deployment Guide

## Requirements
- Node.js 20+
- PostgreSQL database (free options: [Neon](https://neon.tech), [Railway](https://railway.app), [Supabase](https://supabase.com))

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Create environment file
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-very-long-random-secret-here
PORT=5000
NODE_ENV=production
```

### 3. Set up the database tables
```bash
npx drizzle-kit push
```

### 4. Start the server
```bash
npm start
```

The server will be available at `http://localhost:5000`

---

## Deploy to Railway

1. Push this folder to a GitHub repository
2. Go to [railway.app](https://railway.app) and create a new project
3. Connect your GitHub repo
4. Add a PostgreSQL database plugin
5. Set environment variables: `JWT_SECRET`, `NODE_ENV=production`
6. Railway sets `DATABASE_URL` and `PORT` automatically
7. Deploy!

## Deploy to Render

1. Push this folder to GitHub
2. Go to [render.com](https://render.com) and create a new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables in the dashboard

---

## Default Login Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@school.edu | admin123 | Admin |
| reception@school.edu | rec123 | Reception |
| teacher@school.edu | teach123 | Teacher |
| accountant@school.edu | acc123 | Accountant |

> These are created automatically on first run.

---

## Frontend (Vercel)

The frontend is deployed separately on Vercel. Set this environment variable in Vercel:

```
VITE_API_URL=https://your-backend-url.railway.app
```

This tells the frontend where to find this backend server.

---

## Files

| File | Description |
|------|-------------|
| `index.js` | Main server — all API routes, auth, database logic |
| `schema.js` | Database schema (tables & types) |
| `drizzle.config.js` | Database migration config |
| `package.json` | Dependencies |
| `.env.example` | Environment variables template |
