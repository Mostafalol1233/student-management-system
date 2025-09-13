# Student Management System - Frontend

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

### 3. تشغيل التطبيق:
```bash
# للتطوير
npm run dev

# للإنتاج (بناء التطبيق)
npm run build
npm start
```

## أكواد GitHub للنشر:

```bash
# إنشاء repository جديد
git init
git add .
git commit -m "Initial frontend commit"
git branch -M main
git remote add origin https://github.com/username/student-management-frontend.git
git push -u origin main
```

## النشر على Vercel:
1. ادخل على https://vercel.com
2. اختر "Import Project"
3. اختر الـ Repository
4. اختر Framework: **Vite**
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. أضف متغيرات البيئة من ملف `.env`

## النشر على Netlify:
1. ادخل على https://netlify.com
2. اسحب مجلد `dist` بعد عمل `npm run build`
3. أو اربط بـ GitHub واختر الـ Repository

الفرونت اند يحتاج للباك اند ليعمل بشكل كامل!