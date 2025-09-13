# Student Management System - Backend API

## التثبيت والتشغيل:

### 1. تثبيت المتطلبات:
```bash
npm install
```

### 2. إعداد متغيرات البيئة:
انسخ `.env.example` إلى `.env` وعدل القيم:
```bash
cp .env.example .env
```

### 3. بناء وتشغيل السيرفر:
```bash
# بناء التطبيق
npm run build

# تشغيل السيرفر
npm start

# أو للتطوير
npm run dev
```

## أكواد GitHub للنشر:

```bash
# إنشاء repository جديد
git init
git add .
git commit -m "Initial backend commit"
git branch -M main
git remote add origin https://github.com/username/student-management-backend.git
git push -u origin main
```

## النشر على السيرفر:

### Railway:
1. ادخل على https://railway.app
2. اختر "Deploy from GitHub"
3. اختر الـ Repository
4. أضف متغيرات البيئة
5. Railway سيتولى الباقي تلقائياً

### Render:
1. ادخل على https://render.com
2. اختر "New Web Service"
3. اربط بـ GitHub
4. Build Command: `npm run build`
5. Start Command: `npm start`

### VPS أو Dedicated Server:
```bash
# على السيرفر
git clone https://github.com/username/student-management-backend.git
cd student-management-backend
npm install
npm run build

# إنشاء ملف service (Ubuntu/Debian)
sudo nano /etc/systemd/system/student-api.service

# محتوى الملف:
[Unit]
Description=Student Management API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/student-management-backend
ExecStart=/usr/bin/node index.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target

# تفعيل الخدمة
sudo systemctl enable student-api
sudo systemctl start student-api
```

## API Endpoints:
- GET `/api/students` - عرض جميع الطلاب
- POST `/api/students` - إضافة طالب جديد
- GET `/api/sessions` - عرض الجلسات
- GET `/api/attendance` - عرض الحضور
- GET `/api/whatsapp/status` - حالة WhatsApp

الباك اند يعمل على البورت 5000 افتراضياً.