# 🚨 تحذير أمني مهم جداً

## ⚠️ ملفات WhatsApp الحساسة

**لا تنسخ أبداً مجلد `auth_info_baileys` إلى السيرفر!**

### المشكلة:
- مجلد `auth_info_baileys` يحتوي على بيانات تسجيل دخول WhatsApp
- هذه البيانات حساسة جداً ويمكن استخدامها للوصول لحسابك
- **يجب عدم مشاركتها أو رفعها لأي مكان**

### الحل الصحيح:

#### 1️⃣ على Pterodactyl:
```bash
# إنشاء مجلد فارغ فقط
mkdir auth_info_baileys
chmod 755 auth_info_baileys
```

#### 2️⃣ عند أول تشغيل:
- WhatsApp Bot سيطلب مسح QR code جديد
- امسح الـ QR بهاتفك لتسجيل دخول جديد
- الملفات ستُنشأ تلقائياً في السيرفر

#### 3️⃣ للحماية:
- **لا ترفع ملفات الجلسة من جهازك للسيرفر**
- **لا تشارك screenshot للـ QR code**
- استخدم رقم WhatsApp Business منفصل إن أمكن

## 🔒 إعدادات أمنية أخرى

### SESSION_SECRET:
```bash
# استخدم مولد كلمات مرور قوية
SESSION_SECRET=your-random-32-character-secret-key-here
```

### CORS Settings:
```bash
# ضع رابط Vercel الدقيق
FRONTEND_URL=https://your-exact-vercel-url.vercel.app
VERCEL_PROJECT_NAME=your-project-name
```

## ✅ قائمة الأمان

- [ ] حُذف مجلد `auth_info_baileys` من الكود
- [ ] SESSION_SECRET عشوائي و32 حرف على الأقل
- [ ] FRONTEND_URL يحتوي على الرابط الدقيق فقط
- [ ] لا يوجد أرقام هواتف أو بيانات شخصية في الكود
- [ ] تم إنشاء مجلد `auth_info_baileys` فارغ في السيرفر فقط

## 🆘 في حالة تسريب البيانات

إذا تم رفع ملفات `auth_info_baileys` عن طريق الخطأ:

1. **فوراً**: احذف الملفات من السيرفر/Repository
2. **اذهب لـ WhatsApp**: Settings → Linked Devices → تسجيل خروج من جميع الأجهزة
3. **غيّر SESSION_SECRET** في البيئة
4. **أعد تشغيل السيرفر** مع QR code جديد

## 📞 المساعدة

إذا كنت غير متأكد من الإعدادات الأمنية، **توقف واطلب المساعدة**. الأمان أهم من السرعة!