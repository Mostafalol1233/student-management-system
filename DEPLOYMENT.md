# دليل النشر — Deployment Guide

## نظرة عامة

هذا النظام مكوّن من جزأين:
- **Frontend** — React + Vite → يُنشر على **Vercel**
- **Backend** — Express + Node.js → يُنشر على **خادم VPS**

---

## 1. نشر الـ Backend على خادم VPS

### متطلبات الخادم
- Node.js 20+
- PostgreSQL (أو Neon Database)
- pm2 (للتشغيل المستمر)

### خطوات النشر

```bash
# على جهازك
npm run build
cd deploy && zip -r backend.zip dist/ package.json

# رفع الملف للسيرفر
scp deploy/backend.zip user@YOUR_SERVER_IP:/var/www/center-api/

# على السيرفر
cd /var/www/center-api
unzip backend.zip
npm install --production

# إنشاء ملف .env
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-super-secret-key-here-min-32-chars
NODE_ENV=production
PORT=5000
EOF

# تشغيل بـ pm2
npm install -g pm2
pm2 start dist/index.js --name center-api
pm2 startup
pm2 save
```

### الحصول على DATABASE_URL مجاناً
استخدم [Neon Database](https://neon.tech) — مجاني + سريع جداً مع Drizzle ORM.

---

## 2. نشر الـ Frontend على Vercel

### الطريقة التلقائية (GitHub)
1. ارفع الكود على GitHub
2. اذهب إلى [vercel.com](https://vercel.com) واربط الـ repo
3. اضبط الإعدادات:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/public`
4. أضف متغير البيئة:
   - `VITE_API_URL` = `https://your-backend-domain.com`

### تعديل vercel.json
افتح `vercel.json` وغيّر `YOUR_BACKEND_URL` بعنوان خادمك:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://api.yourserver.com/api/$1" }
  ]
}
```

---

## 3. متغيرات البيئة المطلوبة

### Backend (.env)
| المتغير | الوصف | مثال |
|---------|-------|------|
| `DATABASE_URL` | رابط PostgreSQL | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | مفتاح التشفير (32+ حرف) | `my-super-secret-key-2025` |
| `NODE_ENV` | بيئة التشغيل | `production` |
| `PORT` | رقم المنفذ | `5000` |

### Frontend (Vercel Environment)
| المتغير | الوصف | مثال |
|---------|-------|------|
| `VITE_API_URL` | عنوان الـ Backend | `https://api.yourserver.com` |

---

## 4. أول تشغيل — إضافة البيانات التجريبية

بعد رفع الـ Backend، اتصل بـ endpoint التالي مرة واحدة:

```bash
curl -X POST https://your-backend-url.com/api/seed
```

هذا سيضيف:
- ✅ 4 مستخدمين (admin, reception, teacher, accountant)
- ✅ مدرس ومواد
- ✅ 8 طلاب
- ✅ مجموعة دراسية
- ✅ حصص وحضور وdرجات ومعاملات مالية

---

## 5. حسابات الدخول الافتراضية

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدير النظام | admin@school.edu | admin123 |
| الاستقبال | reception@school.edu | rec123 |
| مدرس | teacher@school.edu | teach123 |
| محاسب | accountant@school.edu | acc123 |

> ⚠️ **مهم:** غيّر كلمات المرور بعد أول دخول!

---

## 6. صلاحيات الأدوار

| القسم | مدير | استقبال | مدرس | محاسب |
|-------|------|---------|------|-------|
| الطلاب | ✅ | ✅ | 👁 | 👁 |
| الحضور | ✅ | ✅ | ✅ | ❌ |
| الدرجات | ✅ | ❌ | ✅ | ❌ |
| المالية | ✅ | ✅ | ❌ | ✅ |
| الإعدادات | ✅ | ❌ | ❌ | ❌ |
| المدرسين | ✅ | ❌ | ❌ | ❌ |
