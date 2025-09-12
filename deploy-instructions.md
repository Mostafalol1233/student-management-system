# تعليمات النشر - Vercel + Pterodactyl

## الخطوة 1: تحضير ملفات Backend لـ Pterodactyl

### 1.1 إنشاء مجلد Backend منفصل
```bash
mkdir student-management-backend
cd student-management-backend
```

### 1.2 نسخ الملفات المطلوبة
انسخ الملفات التالية إلى مجلد Backend:
- `backend-package.json` → `package.json`
- `backend-index.js` → `index.js`
- `backend-storage.js` → `storage.js`
- `backend-whatsapp-service.js` → `whatsapp-service.js`
- `backend-schema.js` → `schema.js`
- `backend-env.example` → `.env`

### 1.3 إنشاء مجلد auth_info_baileys
```bash
mkdir auth_info_baileys
```

## الخطوة 2: رفع Backend على Pterodactyl

### 2.1 إعداد Pterodactyl Server
1. تأكد من وجود Node.js Egg في الـ Panel
2. إنشاء Server جديد باستخدام Node.js Egg
3. تعيين الموارد المطلوبة (RAM: 512MB+, Storage: 1GB+)

### 2.2 رفع الملفات
1. اضغط جميع ملفات Backend في ملف zip
2. ارفع الملف عبر File Manager في Pterodactyl
3. فك الضغط في المجلد الرئيسي

### 2.3 إعداد متغيرات البيئة
في إعدادات السيرفر → Startup:
- `NODE_ENV=production`
- `PORT=3000`
- `SESSION_SECRET=your-secret-key`
- `FRONTEND_URL=https://your-vercel-app.vercel.app`

### 2.4 تشغيل السيرفر
```bash
npm install
npm start
```

## الخطوة 3: نشر Frontend على Vercel

### 3.1 تحضير Frontend
1. تعديل `client/src/lib/queryClient.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiRequest = async (method: string, path: string, data?: any) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response;
};
```

### 3.2 إنشاء متغيرات البيئة
انسخ `frontend-env.example` إلى `.env.local` وعدّل:
```
VITE_API_URL=https://your-pterodactyl-server.com:port
```

### 3.3 النشر على Vercel
1. اربط مستودع GitHub بـ Vercel
2. اختر مجلد `client` كـ root directory
3. أضف متغيرات البيئة في إعدادات Vercel
4. انشر المشروع

## الخطوة 4: إعدادات إضافية

### 4.1 CORS Configuration
تأكد من إضافة رابط Vercel في متغير `FRONTEND_URL` في Backend

### 4.2 SSL Certificate
تأكد من استخدام HTTPS لكل من Frontend و Backend

### 4.3 Database (اختيارية)
إذا كنت تريد استخدام قاعدة بيانات خارجية:
- PostgreSQL من Supabase أو Neon
- أضف `DATABASE_URL` في متغيرات البيئة

## الخطوة 5: اختبار النظام

1. تحقق من عمل Backend عبر `/health` endpoint
2. تحقق من تحميل Frontend بشكل صحيح
3. اختبر الاتصال بين Frontend و Backend
4. اختبر WhatsApp Bot functionality

## استكشاف الأخطاء

### Backend لا يعمل:
- تحقق من Port configuration
- تحقق من Node.js version (يفضل 18+)
- راجع logs في Pterodactyl console

### Frontend لا يتصل بـ Backend:
- تحقق من CORS settings
- تحقق من `VITE_API_URL` في متغيرات البيئة
- تحقق من HTTPS/HTTP compatibility

### WhatsApp Bot لا يعمل:
- تأكد من وجود مجلد `auth_info_baileys`
- تحقق من صلاحيات الكتابة
- راجع الـ logs لمعرفة أخطاء الاتصال

## تكلفة التشغيل المتوقعة

- **Vercel Frontend**: مجاني للاستخدام الشخصي
- **Pterodactyl Server**: حسب مقدم الخدمة (عادة 5-15$ شهرياً)
- **إجمالي**: 5-15$ شهرياً

## المميزات المدعومة

✅ إدارة الطلاب والدرجات
✅ نظام الحضور والغياب  
✅ WhatsApp Bot للإشعارات
✅ تقارير وإحصائيات
✅ تصدير البيانات
✅ واجهة عربية كاملة