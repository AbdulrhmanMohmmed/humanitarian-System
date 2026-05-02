# نظام إدارة العمل الإنساني - اليمن
## Humanitarian Aid Management System - Yemen

> Strategic direction: Humanitarian Intelligence & Accountability Operating System.
> See [HIAOS implementation roadmap](docs/HIAOS_IMPLEMENTATION_ROADMAP.md).

نظام ويب شامل ومتكامل لإدارة منظمات العمل الإنساني في اليمن. يغطي جميع الجوانب التشغيلية من إدارة المستفيدين إلى التقارير المالية.

---

## المميزات الرئيسية

| الوحدة | الوصف |
|--------|-------|
| 📊 لوحة المعلومات | مؤشرات أداء رئيسية (KPIs) + رسوم بيانية تفاعلية |
| 👥 إدارة المستفيدين | تسجيل، بحث، منع الازدواجية، درجة الضعف |
| 📁 إدارة المشاريع | إدارة المشاريع والأنشطة حسب القطاع والمحافظة |
| 💰 الإدارة المالية | إدارة المنح، المعاملات المالية، تقارير المانحين |
| 👔 الموارد البشرية | إدارة الموظفين، طلبات الإجازات، الرواتب |
| 📦 المخازن وسلسلة الإمداد | إدارة المخازن، المواد، التوزيعات، تنبيهات المخزون |
| 📈 المتابعة والتقييم | مؤشرات الأداء، الاستبيانات، القياسات |
| 📋 جمع البيانات الميدانية | أداة بناء نماذج احترافية (مثل KoBoToolbox)، أنواع حقول متعددة، جمع GPS |
| 📊 توليد التقارير | تقارير Excel و Word احترافية (تقدم مشاريع، مستفيدين، مالية، مؤشرات) |
| 🗂️ أرشيف الوثائق | رفع وتصنيف وأرشفة وثائق المشاريع مع البحث والوسوم |
| 💵 التحويلات النقدية | تحويلات نقدية، قسائم، تتبع الحالات |

## التقنيات المستخدمة

### Backend
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy 2.0
- **Database**: SQLite (قابل للترقية إلى PostgreSQL)
- **Authentication**: JWT + bcrypt
- **Validation**: Pydantic

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: React Router v7
- **Language**: Arabic (RTL) - دعم كامل للعربية

## التشغيل المحلي

### المتطلبات
- Python 3.11+
- Node.js 20+

### تشغيل Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
يعمل على: `http://localhost:8000`

### تشغيل Frontend (للتطوير)
```bash
cd frontend
npm install
npm run dev
```
يعمل على: `http://localhost:5173`

### تشغيل الإنتاج
```bash
cd frontend && npm run build
cd ../backend && python main.py
```
النظام سيعمل على `http://localhost:8000` مع الواجهة الأمامية.

## بيانات الدخول التجريبية

| المستخدم | كلمة المرور | الدور |
|----------|-------------|-------|
| admin | admin123 | مدير النظام |
| manager1 | pass123 | مدير برامج |
| field1 | pass123 | موظف ميداني |
| finance1 | pass123 | مالية |
| hr1 | pass123 | موارد بشرية |

## البيانات التجريبية

النظام يأتي مع بيانات تجريبية واقعية تشمل:
- 150 مستفيد من 10 محافظات يمنية
- 8 مشاريع في قطاعات متنوعة (صحة، تعليم، أمن غذائي، مياه وصرف صحي)
- 6 منح من مانحين دوليين
- 40 معاملة مالية
- 30 موظف في 6 أقسام
- 5 مخازن مع 85 مادة
- 25 تحويل نقدي
- 8 مؤشرات أداء مع قياسات شهرية
- استبيان مع 4 أسئلة

## هيكل المشروع

```
humanitarian-system/
├── backend/
│   ├── app/
│   │   ├── models.py          # نماذج قاعدة البيانات
│   │   ├── schemas.py         # مخططات Pydantic
│   │   ├── auth.py            # المصادقة JWT
│   │   ├── config.py          # إعدادات التطبيق
│   │   ├── database.py        # اتصال قاعدة البيانات
│   │   ├── seed.py            # بيانات تجريبية
│   │   └── routers/
│   │       ├── auth.py        # API المصادقة
│   │       ├── beneficiaries.py
│   │       ├── projects.py
│   │       ├── finance.py
│   │       ├── hr.py
│   │       ├── inventory.py
│   │       ├── monitoring.py
│   │       ├── data_collection.py  # جمع البيانات الميدانية
│   │       ├── reports.py          # توليد التقارير
│   │       ├── documents.py        # أرشيف الوثائق
│   │       ├── cash.py
│   │       └── dashboard.py
│   ├── main.py                # نقطة الدخول
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/        # مكونات مشتركة
│   │   ├── pages/             # صفحات التطبيق
│   │   ├── contexts/          # React Context
│   │   ├── services/          # خدمات API
│   │   └── App.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## الترخيص

MIT License
