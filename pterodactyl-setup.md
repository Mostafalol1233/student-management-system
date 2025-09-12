# إعداد Pterodactyl لـ Node.js Backend

## متطلبات النظام
- Ubuntu 20.04+ أو CentOS 8+
- Docker مثبت ومفعل
- Panel Pterodactyl مثبت ومُعد بشكل صحيح

## الخطوة 1: تحميل Node.js Egg

### الطريقة الأولى - Node.js Generic Egg:
```bash
wget https://raw.githubusercontent.com/parkervcp/eggs/master/generic/nodejs/egg-node-js-generic.json
```

### الطريقة الثانية - Node.js Custom Startup Egg:
```bash
wget https://raw.githubusercontent.com/MFHaZe/Pterodactyl-Nodejs-egg/main/nodejs-egg.json
```

## الخطوة 2: استيراد الـ Egg

1. ادخل على Admin Panel
2. اذهب إلى **Admin** → **Nests** → **Import Egg**
3. ارفع ملف `.json` المُحمل
4. احفظ الإعدادات

## الخطوة 3: إنشاء Server جديد

### إعدادات السيرفر:
```
Name: Student Management Backend
Node: اختر النود المتاح
Allocation: اختر IP و Port (مثل 25565 أو أي port متاح)
Memory: 512 MB (على الأقل)
Disk: 1024 MB (1 GB)
CPU: 100%
```

### إعدادات الـ Startup:
```
Docker Image: node:18-alpine (أو الأحدث)
Startup Command: npm start
```

## الخطوة 4: رفع ملفات Backend

### 4.1 إنشاء Archive:
```bash
# في مجلد Backend المُحضر
zip -r backend.zip . -x "*.git*" "node_modules/*"
```

### 4.2 رفع الملفات:
1. اذهب إلى **Files** في server panel
2. ارفع `backend.zip`
3. فك الضغط في المجلد الرئيسي
4. احذف ملف zip بعد فك الضغط

## الخطوة 5: إعداد Environment Variables

في تبويب **Startup** → **Variables**:

```
NODE_ENV=production
PORT=25565  # أو أي port اخترته
SESSION_SECRET=your-super-secret-key-here-make-it-long-and-random
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## الخطوة 6: تثبيت Dependencies وتشغيل Server

### في Console:
```bash
npm install
npm start
```

### أو استخدم الـ Start button في Panel

## الخطوة 7: فتح الـ Port

تأكد من فتح الـ Port في Firewall:
```bash
# Ubuntu/Debian
sudo ufw allow 25565

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=25565/tcp
sudo firewall-cmd --reload
```

## الخطوة 8: اختبار Backend

اختبر عبر:
```bash
curl http://YOUR_SERVER_IP:25565/health
```

يجب أن ترى:
```json
{"status":"OK","timestamp":"2024-..."}
```

## مشاكل محتملة وحلولها

### Server لا يبدأ:
- تحقق من Node.js version في Docker image
- تأكد من وجود `package.json` في المجلد الرئيسي
- راجع الـ Console logs

### Port مُستخدم:
- غيّر Port في Allocation settings
- تأكد من عدم تعارض مع خدمات أخرى

### Memory/Disk Issues:
- زيّد الـ Memory limit (512MB+)
- تأكد من كفاية مساحة التخزين

### WhatsApp Bot لا يعمل:
- تأكد من وجود مجلد `auth_info_baileys`
- تحقق من صلاحيات الكتابة
- قم بإعادة تشغيل السيرفر بعد المسح الضوئي للـ QR

## نصائح للأداء

1. **استخدم PM2 (اختياري)**:
```bash
npm install -g pm2
pm2 start index.js --name "student-backend"
pm2 startup
pm2 save
```

2. **مراقبة الموارد**:
   - راقب RAM usage عبر Panel
   - راقب CPU usage
   - احتفظ بنسخ احتياطية من البيانات

3. **Security**:
   - استخدم SSL certificate للـ domain
   - قم بتحديث SESSION_SECRET دورياً
   - راقب الـ logs للأنشطة المشبوهة

## تكلفة الاستضافة المتوقعة

- **VPS صغير**: 5-10$ شهرياً
- **Shared Hosting**: 3-7$ شهرياً  
- **Cloud Provider**: 10-20$ شهرياً

**إجمالي المشروع**: 5-20$ شهرياً حسب الخدمة المختارة