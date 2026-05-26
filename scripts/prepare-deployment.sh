#!/bin/bash
# Deployment preparation script
# Creates backend-only ZIP for VPS upload and Vercel-ready frontend build

set -e

echo "🚀 Preparing deployment packages..."

# ── 1. Build everything ──────────────────────────────────────────────────────
echo "📦 Building frontend + backend..."
npm run build

# ── 2. Backend ZIP for VPS ───────────────────────────────────────────────────
echo "📁 Creating backend ZIP for VPS upload..."
mkdir -p deploy

zip -r deploy/backend.zip \
  server/ \
  shared/ \
  drizzle.config.ts \
  tsconfig.json \
  package.json \
  package-lock.json \
  --exclude "*.test.*" \
  --exclude "__pycache__" \
  --exclude ".env*"

# Also copy the compiled dist for direct Node run
cp -r dist deploy/dist-backend/ 2>/dev/null || true

echo ""
echo "✅ Deployment packages ready:"
echo ""
echo "   📂 deploy/backend.zip   — Upload this to your VPS"
echo "   📂 dist/public/         — Point Vercel to build this dir"
echo ""
echo "──────────────────────────────────────────────────────────────────"
echo " VPS setup instructions:"
echo "──────────────────────────────────────────────────────────────────"
echo " 1. Upload deploy/backend.zip to your server"
echo " 2. unzip backend.zip && npm install"
echo " 3. Set environment variables:"
echo "      DATABASE_URL=your_postgres_url"
echo "      JWT_SECRET=your_strong_secret_here"
echo "      NODE_ENV=production"
echo "      PORT=5000"
echo " 4. Run: node dist/index.js"
echo "    (or use pm2: pm2 start dist/index.js --name center-api)"
echo ""
echo "──────────────────────────────────────────────────────────────────"
echo " Vercel setup instructions:"
echo "──────────────────────────────────────────────────────────────────"
echo " 1. Connect your GitHub repo to Vercel"
echo " 2. Set Build Command:  npm run build"
echo " 3. Set Output Dir:     dist/public"
echo " 4. Add env variable:   VITE_API_URL=https://your-backend-url.com"
echo " 5. Edit vercel.json — replace YOUR_BACKEND_URL with your VPS URL"
echo "──────────────────────────────────────────────────────────────────"
