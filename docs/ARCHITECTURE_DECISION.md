# Architecture Decision: Commercial HIAOS Platform

## القرار

سنحافظ على نواة المنتج الحالية: React + Vite في الواجهة وFastAPI في الخلفية. لن نعيد الكتابة إلى NestJS أو Next.js الآن، لأن النظام يحتوي بالفعل على وحدات كثيرة تعمل، ولأن FastAPI مناسب جدًا لمنصة بيانات وذكاء اصطناعي.

## ما تم إدخاله الآن

- PostgreSQL + PostGIS عبر Docker Compose.
- Redis كبنية cache/queue.
- MinIO كتخزين S3-compatible.
- Dockerfiles للواجهة والخلفية.
- Nginx production frontend proxy.
- Keycloak profile جاهز للتشغيل عند الانتقال إلى SSO/RBAC مؤسسي.
- ClickHouse profile اختياري للتحليلات الكبيرة لاحقًا.
- إعدادات `.env.example` موحدة.

## لماذا ليس NestJS الآن؟

NestJS ممتاز، لكنه سيعني إعادة كتابة backend شبه كامل. الأفضل تجاريًا الآن هو تقوية البنية الحالية حتى تصل لمنتج منافس بسرعة، ثم فصل خدمات محددة فقط عند الحاجة.

## المسار الموصى به

1. تشغيل PostgreSQL/PostGIS وجعلها قاعدة التطوير الافتراضية.
2. إضافة Alembic migrations بدل `create_all` عند الانتقال للإنتاج.
3. نقل الملفات إلى MinIO/S3.
4. إضافة Celery workers للتقارير والمزامنة والاستيراد الثقيل.
5. إضافة Webhooks للتكامل مع KoBo/ERP/SMS.
6. إضافة Keycloak عندما تصبح الصلاحيات متعددة المنظمات مطلوبة.
7. إضافة ClickHouse فقط عند تضخم البيانات التحليلية.

## Mobile وOffline

الويب يمكن أن يبدأ بـ PouchDB/CouchDB. تطبيق الميدان المستقل يمكن بناؤه لاحقًا بـ Flutter أو React Native مع SQLite sync. لا نبدأ به قبل تثبيت نموذج البيانات وواجهات المزامنة.
