# دليل نشر المشروع على Vercel

## الملفات التي تم إنشاؤها:
✅ `vercel.json` - ملف التكوين الأساسي لـ Vercel
✅ `api/index.js` - نقطة دخول الـ Serverless Functions
✅ `api/package.json` - اعتماديات الـ API
✅ `.env.example` - مثال على متغيرات البيئة

## خطوات النشر على Vercel:

### ١. تحضير المشروع
```bash
# تأكد من أن جميع التغييرات محفوظة في Git
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### ٢. إنشاء حساب على Vercel
- اذهب إلى https://vercel.com
- سجل دخول بحساب GitHub الخاص بك
- اربط حسابك مع GitHub

### ٣. استيراد المشروع
- اضغط على "Add New Project"
- اختر repository المشروع من GitHub
- **Framework Preset:** اختر "Other" أو "Vite"
- **Root Directory:** اتركه فارغ (يعني root)

### ٤. إعدادات البناء (Build Settings):
```
Install Command: npm install
Build Command: npm run build  
Output Directory: dist/public
```

### ٥. متغيرات البيئة (Environment Variables):
في لوحة إعدادات Vercel، أضف:
- `NODE_ENV` = `production`
- `DATABASE_URL` = رابط قاعدة البيانات الخاصة بك
- أي متغيرات أخرى من ملف `.env.example`

### ٦. نشر المشروع
- اضغط "Deploy"
- انتظر حتى يكتمل البناء (Build)
- ستحصل على رابط مثل: `https://your-project.vercel.app`

## هيكل المشروع بعد النشر:
```
your-app.vercel.app/          → Frontend (React)
your-app.vercel.app/api/      → Backend API (Express)
your-app.vercel.app/api/students → API endpoints
```

## استكشاف الأخطاء:

### إذا فشل البناء:
- تحقق من logs في Vercel Dashboard
- تأكد من أن `package.json` يحتوي على جميع dependencies
- تحقق من أن `vercel.json` في المكان الصحيح

### إذا لم تعمل API:
- تحقق من أن `/api` endpoints تعمل
- راجع Function logs في Vercel
- تأكد من متغيرات البيئة

### إذا لم يعمل Frontend:
- تحقق من build output directory
- راجع vite configuration
- تأكد من routing configuration

## ملاحظات مهمة:
⚠️ **هذا إعداد أساسي** - ستحتاج لدمج routes الموجودة في `server/routes.ts`
⚠️ **قاعدة البيانات** - تأكد من إعداد Database connection للإنتاج
⚠️ **WhatsApp Service** - قد يحتاج تعديل للعمل مع Serverless
⚠️ **File Upload** - Vercel له حدود على حجم الملفات

## خطوات إضافية (اختيارية):
- ربط Domain مخصص
- إعداد SSL Certificate (تلقائي مع Vercel)
- إعداد Analytics
- تفعيل Edge Functions