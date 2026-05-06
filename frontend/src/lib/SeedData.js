/**
 * HIAOS Demo Seeding Utility
 * Populates local storage with realistic humanitarian data for ALL modules.
 */

const STORAGE_PREFIX = 'hiaos_data_';

const DEMO_DATA = {
  projects: [
    { id: 1, name: 'مشروع الاستجابة الطارئة للأمن الغذائي - تعز', code: 'FSL-TZ-001', donor: 'USAID / BHA', budget: 1250000, spent: 850000, status: 'active', sector: 'الأمن الغذائي', governorate: 'تعز', district: 'المظفر، القاهرة', start_date: '2026-01-01', end_date: '2026-12-31', target_beneficiaries: 5000, syncStatus: 'synced' },
    { id: 2, name: 'مشروع الإصحاح البيئي المتكامل - الضالع', code: 'WASH-DL-002', donor: 'UNICEF', budget: 450000, spent: 120000, status: 'active', sector: 'المياه والصرف الصحي', governorate: 'الضالع', district: 'دمت، قعطبة', start_date: '2026-03-01', end_date: '2026-11-30', target_beneficiaries: 2800, syncStatus: 'synced' },
    { id: 3, name: 'برنامج حماية الطفل والتعليم في حالات الطوارئ', code: 'PROT-SA-003', donor: 'Save the Children', budget: 320000, spent: 290000, status: 'active', sector: 'الحماية', governorate: 'صعدة', district: 'سحار، الصفراء', start_date: '2025-06-01', end_date: '2026-05-31', target_beneficiaries: 1200, syncStatus: 'synced' }
  ],
  outcomes: [
    { id: 1, text: 'تحسن بنسبة 40% في درجة الاستهلاك الغذائي للأسر المستهدفة في تعز.', type: 'MSC', project_id: 1, syncStatus: 'synced' },
    { id: 2, text: 'زيادة وعي الأمهات حول ممارسات النظافة الشخصية بنسبة 85%.', type: 'MSC', project_id: 2, syncStatus: 'synced' }
  ],
  activities: [
    { id: 1, name: 'توزيع السلال الغذائية - الدفعة الأولى', project_id: 1, start_date: '2026-02-01', end_date: '2026-02-15', progress: 100, status: 'completed', responsible: 'أحمد علي', syncStatus: 'synced' },
    { id: 2, name: 'تدريب اللجان المجتمعية', project_id: 1, start_date: '2026-03-01', end_date: '2026-03-10', progress: 85, status: 'active', responsible: 'سارة محمد', syncStatus: 'synced' },
    { id: 3, name: 'توريد معدات ضخ المياه', project_id: 2, start_date: '2026-04-01', end_date: '2026-04-30', progress: 20, status: 'delayed', responsible: 'خالد وليد', syncStatus: 'synced' }
  ],
  // ===== HR MODULE =====
  employees: [
    { id: 1, employee_id: 'EMP-001', first_name: 'أحمد', last_name: 'علي المحمد', email: 'ahmed@org.ye', phone: '771234567', gender: 'male', department: 'البرامج', position: 'مدير مشروع', salary: 1200, contract_type: 'دائم', office_location: 'تعز', hire_date: '2023-01-15', status: 'active' },
    { id: 2, employee_id: 'EMP-002', first_name: 'سارة', last_name: 'محمد الشرعبي', email: 'sara@org.ye', phone: '772345678', gender: 'female', department: 'المتابعة والتقييم', position: 'أخصائية MEAL', salary: 950, contract_type: 'دائم', office_location: 'صنعاء', hire_date: '2023-03-01', status: 'active' },
    { id: 3, employee_id: 'EMP-003', first_name: 'خالد', last_name: 'وليد الحكيمي', email: 'khaled@org.ye', phone: '773456789', gender: 'male', department: 'اللوجستيات', position: 'مسؤول لوجستي', salary: 800, contract_type: 'مؤقت', office_location: 'الضالع', hire_date: '2024-06-01', status: 'active' },
    { id: 4, employee_id: 'EMP-004', first_name: 'فاطمة', last_name: 'أحمد الحداد', email: 'fatima@org.ye', phone: '774567890', gender: 'female', department: 'المالية', position: 'محاسبة', salary: 900, contract_type: 'دائم', office_location: 'عدن', hire_date: '2022-09-01', status: 'active' },
    { id: 5, employee_id: 'EMP-005', first_name: 'عمر', last_name: 'حسين القحطاني', email: 'omar@org.ye', phone: '775678901', gender: 'male', department: 'الموارد البشرية', position: 'مسؤول HR', salary: 850, contract_type: 'دائم', office_location: 'صنعاء', hire_date: '2023-11-01', status: 'active' }
  ],
  hr_stats: { total: 5, active: 5, total_salary: 4700 },
  leaves: [
    { id: 1, employee_id: 1, leave_type: 'annual', start_date: '2026-05-10', end_date: '2026-05-17', days: 7, reason: 'إجازة سنوية مستحقة', status: 'approved' },
    { id: 2, employee_id: 3, leave_type: 'sick', start_date: '2026-05-03', end_date: '2026-05-05', days: 3, reason: 'مرض', status: 'pending' }
  ],
  // ===== FINANCE MODULE =====
  grants: [
    { id: 1, code: 'GR-2026-001', name: 'منحة الاستجابة الغذائية الطارئة', donor: 'USAID/BHA', amount: 1250000, spent: 850000, currency: 'USD', status: 'active', project_id: 1, start_date: '2026-01-01', end_date: '2026-12-31', conditions: 'الإنفاق على الأنشطة المعتمدة فقط' },
    { id: 2, code: 'GR-2026-002', name: 'منحة برنامج WASH', donor: 'UNICEF', amount: 450000, spent: 120000, currency: 'USD', status: 'active', project_id: 2, start_date: '2026-03-01', end_date: '2026-11-30', conditions: 'تقارير شهرية مطلوبة' },
    { id: 3, code: 'GR-2025-003', name: 'منحة حماية الطفل', donor: 'Save the Children', amount: 320000, spent: 290000, currency: 'USD', status: 'active', project_id: 3, start_date: '2025-06-01', end_date: '2026-05-31', conditions: 'تقرير ربع سنوي + تقييم نهائي' }
  ],
  grant_stats: { total_amount: 2020000, by_donor: [{ donor: 'USAID/BHA', amount: 1250000 }, { donor: 'UNICEF', amount: 450000 }, { donor: 'Save the Children', amount: 320000 }] },
  transactions: [
    { id: 1, reference: 'TX-2026-001', type: 'expense', amount: 185000, currency: 'USD', description: 'شراء سلال غذائية - دفعة أبريل', category: 'مشتريات', grant_id: 1, project_id: 1, transaction_date: '2026-04-05' },
    { id: 2, reference: 'TX-2026-002', type: 'expense', amount: 45000, currency: 'USD', description: 'رواتب الموظفين - أبريل', category: 'رواتب', grant_id: 1, project_id: 1, transaction_date: '2026-04-30' },
    { id: 3, reference: 'TX-2026-003', type: 'expense', amount: 28000, currency: 'USD', description: 'معدات ضخ المياه', category: 'معدات', grant_id: 2, project_id: 2, transaction_date: '2026-04-10' },
    { id: 4, reference: 'TX-2026-004', type: 'income', amount: 500000, currency: 'USD', description: 'استلام دفعة منحة USAID', category: 'تمويل', grant_id: 1, project_id: 1, transaction_date: '2026-03-15' },
    { id: 5, reference: 'TX-2026-005', type: 'expense', amount: 12500, currency: 'USD', description: 'تدريب الكوادر الميدانية', category: 'تدريب', grant_id: 2, project_id: 2, transaction_date: '2026-04-20' }
  ],
  transaction_summary: { total_income: 500000, total_expense: 270500, balance: 229500 },
  // ===== CASH MODULE =====
  cash_transfers: [
    { id: 1, reference: 'CT-2026-0001', beneficiary_id: 1, project_id: 1, amount: 150000, currency: 'YER', method: 'hawala', purpose: 'مساعدة غذائية شهر أبريل', status: 'received', transfer_date: '2026-04-05', received_date: '2026-04-06', agent_name: 'محمد الحوالة', agent_phone: '770111222' },
    { id: 2, reference: 'CT-2026-0002', beneficiary_id: 2, project_id: 1, amount: 150000, currency: 'YER', method: 'mobile_money', purpose: 'مساعدة غذائية شهر أبريل', status: 'disbursed', transfer_date: '2026-04-05', agent_name: 'سبأفون', agent_phone: '' },
    { id: 3, reference: 'CT-2026-0003', beneficiary_id: 3, project_id: 1, amount: 150000, currency: 'YER', method: 'cash_in_hand', purpose: 'مساعدة غذائية شهر أبريل', status: 'pending', transfer_date: '2026-04-07' },
    { id: 4, reference: 'CT-2026-0004', beneficiary_id: 4, project_id: 1, amount: 150000, currency: 'YER', method: 'hawala', purpose: 'مساعدة غذائية شهر مايو', status: 'approved', transfer_date: '2026-05-05' }
  ],
  cash_stats: { total_amount: 600000, total_disbursed: 450000, total_received: 150000, pending_count: 2, by_method: [{ method: 'hawala', count: 2, amount: 300000 }, { method: 'mobile_money', count: 1, amount: 150000 }, { method: 'cash_in_hand', count: 1, amount: 150000 }] },
  // ===== BENEFICIARIES MODULE =====
  beneficiaries: [
    { id: 1, first_name: 'عبدالله', last_name: 'محمد الحسني', national_id: '1001234567', gender: 'male', phone: '771000001', governorate: 'تعز', district: 'المظفر', household_size: 6, has_disability: false, vulnerability_score: 75, status: 'active' },
    { id: 2, first_name: 'أمل', last_name: 'أحمد السعدي', national_id: '2001234568', gender: 'female', phone: '771000002', governorate: 'تعز', district: 'القاهرة', household_size: 8, has_disability: false, vulnerability_score: 85, status: 'active' },
    { id: 3, first_name: 'حسين', last_name: 'علي المقري', national_id: '1001234569', gender: 'male', phone: '771000003', governorate: 'الضالع', district: 'دمت', household_size: 5, has_disability: true, disability_type: 'حركية', vulnerability_score: 90, status: 'active' },
    { id: 4, first_name: 'زينب', last_name: 'محمد الجبري', national_id: '2001234570', gender: 'female', phone: '771000004', governorate: 'الضالع', district: 'قعطبة', household_size: 7, has_disability: false, vulnerability_score: 70, status: 'active' },
    { id: 5, first_name: 'إبراهيم', last_name: 'سالم الوهيبي', national_id: '1001234571', gender: 'male', phone: '771000005', governorate: 'صعدة', district: 'سحار', household_size: 9, has_disability: false, vulnerability_score: 80, status: 'active' }
  ],
  // ===== ACCOUNTABILITY / CFM =====
  complaints: [
    { id: 1, reference: 'CFM-2026-001', channel: 'phone', category: 'distribution', priority: 'high', description: 'لم أستلم حصتي من توزيع أبريل رغم تواجدي في القائمة', status: 'under_review', created_at: '2026-04-10', project_id: 1, is_sensitive: false, governorate: 'تعز' },
    { id: 2, reference: 'CFM-2026-002', channel: 'box', category: 'staff_behavior', priority: 'critical', description: 'تصرف غير لائق من أحد الموظفين خلال عملية التسجيل', status: 'received', created_at: '2026-04-12', project_id: 1, is_sensitive: true, governorate: 'تعز' },
    { id: 3, reference: 'CFM-2026-003', channel: 'whatsapp', category: 'targeting', priority: 'medium', description: 'جيراني المستحقون غير مدرجين في القوائم', status: 'resolved', created_at: '2026-04-08', project_id: 2, is_sensitive: false, governorate: 'الضالع' },
    { id: 4, reference: 'CFM-2026-004', channel: 'in_person', category: 'suggestion', priority: 'low', description: 'اقتراح تغيير موعد التوزيع إلى الصباح الباكر', status: 'received', created_at: '2026-05-01', project_id: 1, is_sensitive: false, governorate: 'تعز' },
    { id: 5, reference: 'CFM-2026-005', channel: 'sms', category: 'fraud', priority: 'critical', description: 'بلاغ عن شخص يتقاضى مساعدات باسم متوفى', status: 'escalated', created_at: '2026-04-15', project_id: 1, is_sensitive: true, governorate: 'تعز' }
  ],
  cfm_stats: { total: 5, received: 2, under_review: 1, resolved: 1, escalated: 1, critical_count: 2 },
  // ===== FIELD VISITS =====
  field_visits: [
    { id: 1, title: 'مراقبة توزيع السلال الغذائية - المظفر', project_id: 1, visit_date: '2026-04-15', location: 'مركز توزيع المظفر', governorate: 'تعز', district: 'المظفر', visit_type: 'distribution', team_members: 'أحمد علي، سارة محمد', objectives: 'التحقق من دقة قوائم المستفيدين وجودة التوزيع', status: 'completed', findings: 'تم التوزيع بنجاح، بعض الحالات بحاجة لمراجعة', recommendations: 'تحسين آلية الانتظار وإضافة قناة شكاوى فورية', observations: '92% من المستفيدين استلموا حصصهم في الوقت المحدد' },
    { id: 2, title: 'تحقق من مواقع الآبار - دمت', project_id: 2, visit_date: '2026-04-20', location: 'قرية الحصن - دمت', governorate: 'الضالع', district: 'دمت', visit_type: 'site_verification', team_members: 'خالد وليد', objectives: 'التحقق من تقدم إنشاء الآبار الجديدة', status: 'completed', findings: 'تأخر في حفر بئر #3 بسبب الطقس', recommendations: 'تعديل الجدول الزمني وإضافة طاقم إضافي', observations: 'البئران #1 و#2 جاهزتان للتشغيل' },
    { id: 3, title: 'زيارة متابعة برنامج الحماية - سحار', project_id: 3, visit_date: '2026-05-05', location: 'مركز الخدمات المجتمعية', governorate: 'صعدة', district: 'سحار', visit_type: 'monitoring', team_members: 'سارة محمد، فريق الحماية', objectives: 'تقييم تقدم جلسات الدعم النفسي', status: 'in_progress', findings: '', recommendations: '', observations: '' },
    { id: 4, title: 'مراقبة ما بعد التوزيع - القاهرة', project_id: 1, visit_date: '2026-05-10', location: 'مخيم القاهرة', governorate: 'تعز', district: 'القاهرة', visit_type: 'pdm', team_members: 'أحمد علي', objectives: 'PDM شهر مايو - قياس رضا المستفيدين', status: 'planned', findings: '', recommendations: '', observations: '' }
  ],
  // ===== KNOWLEDGE HUB =====
  lessons: [
    { id: 1, sector: 'WASH', title: 'تحسين كفاءة المضخات في المناطق الجبلية', text: 'بناءً على 4 مشاريع سابقة، تبين أن استخدام الصمامات الثنائية يقلل الصيانة بنسبة 30%.', tags: ['تقني', 'مياه'], impact: 'High', project_id: 2, date: '2026-03-10', status: 'adopted' },
    { id: 2, sector: 'Food', title: 'توقيت التوزيع في شهر رمضان', text: 'لوحظ أن التوزيع في الصباح الباكر يقلل من الازدحام بنسبة 45% ويحسن كرامة المستفيدين.', tags: ['عملياتي', 'لوجستيات'], impact: 'Medium', project_id: 1, date: '2026-02-15', status: 'adopted' },
    { id: 3, sector: 'Protection', title: 'خصوصية بيانات الحالات الحساسة', text: 'التشفير المزدوج للأسماء في استمارات الميدان ضروري جداً لضمان أمان المستفيدين.', tags: ['حماية', 'بيانات'], impact: 'Critical', project_id: 3, date: '2026-01-20', status: 'adopted' },
    { id: 4, sector: 'Food', title: 'التحقق المزدوج من قوائم المستفيدين', text: 'استخدام تقنية QR code مع الهوية الورقية يقلل الأخطاء في التوزيع بنسبة 60%.', tags: ['تقني', 'أمن بيانات'], impact: 'High', project_id: 1, date: '2026-04-01', status: 'under_review' },
    { id: 5, sector: 'Education', title: 'دمج الجلسات الترفيهية مع التعليمية', text: 'أثبتت التجربة أن إضافة 15 دقيقة ترفيهية ترفع نسبة الحضور بنسبة 25% في مدارس الطوارئ.', tags: ['تعليم', 'مجتمع'], impact: 'Medium', project_id: 3, date: '2026-03-25', status: 'adopted' }
  ],
  // ===== DQA MODULE =====
  dqa_audits: [
    { id: 1, project: 'مشروع الغذاء', score: 94, status: 'Verified', date: '2026-04-15', syncStatus: 'synced' },
    { id: 2, project: 'مشروع المياه', score: 82, status: 'Improvement Needed', date: '2026-04-20', syncStatus: 'synced' }
  ],
  // ===== EXECUTIVE DASHBOARD =====
  executive_dashboard: {
    summary: { budget_utilization: 68, total_spent: 850000, budget_light: 'green', activities_progress: 75, activities_light: 'yellow', beneficiaries_coverage: 82 },
    sectors_data: [
      { sector: 'الأمن الغذائي', count: 45 },
      { sector: 'المياه والإصحاح', count: 25 },
      { sector: 'الحماية', count: 20 },
      { sector: 'التعليم', count: 10 }
    ],
    at_risk_projects: [{ name: 'مشروع الإصحاح البيئي - دمت', utilization: 15, reason: 'تأخر التوريدات' }]
  },
  // ===== ANTI-FRAUD =====
  deduplication: {
    total_duplicates: 14,
    duplicate_groups: [
      { name: 'محمد علي سالم', count: 3, governorate: 'تعز', national_ids: ['1012345678'] },
      { name: 'فاطمة أحمد حسن', count: 2, governorate: 'عدن', national_ids: ['2056789012'] }
    ]
  },
  // ===== MONITORING / IPTT =====
  indicators: [
    { id: 1, name: 'عدد الأسر الحاصلة على مساعدات غذائية', code: 'IND-01', type: 'output', unit: 'أسرة', target_value: 5000, actual_value: 3850, baseline: 0, frequency: 'شهري', project_id: 1 },
    { id: 2, name: 'نسبة توفر المياه النظيفة للمستهدفين', code: 'IND-02', type: 'outcome', unit: '%', target_value: 100, actual_value: 65, baseline: 20, frequency: 'ربع سنوي', project_id: 2 },
    { id: 3, name: 'عدد الأطفال الملتحقين بالتعليم', code: 'IND-03', type: 'output', unit: 'طفل', target_value: 800, actual_value: 620, baseline: 0, frequency: 'شهري', project_id: 3 }
  ],
  iptt_alerts: {
    alerts: [
      { indicator_name: 'توزيع النقد - الضالع', period: 'أبريل 2026', achievement_rate: 45 },
      { indicator_name: 'صيانة الآبار', period: 'مارس 2026', achievement_rate: 12 }
    ]
  },
  iptt_summary: {
    1: {
      summary: { green: 12, yellow: 4, red: 2 },
      indicators: [
        { indicator_id: 1, code: 'IND-01', name: 'توزيع السلال الغذائية', unit: 'سلة', baseline: 0, annual_target: 5000, cumulative_actual: 3850, achievement_rate: 77, status_color: 'green' },
        { indicator_id: 2, code: 'IND-02', name: 'نسبة التحسن الصحي', unit: '%', baseline: 10, annual_target: 80, cumulative_actual: 35, achievement_rate: 43, status_color: 'red' }
      ]
    },
    2: {
      summary: { green: 3, yellow: 2, red: 1 },
      indicators: [
        { indicator_id: 2, code: 'IND-02', name: 'نسبة توفر المياه', unit: '%', baseline: 20, annual_target: 100, cumulative_actual: 65, achievement_rate: 65, status_color: 'yellow' }
      ]
    }
  },
  // ===== INVENTORY MODULE =====
  inventory_items: [
    { id: 1, name: 'سلة غذائية متكاملة', category: 'food', quantity: 1500, unit: 'سلة', min_stock: 200, warehouse_id: 1, unit_cost: 45, currency: 'USD' },
    { id: 2, name: 'طقم نظافة شخصية', category: 'wash', quantity: 800, unit: 'طقم', min_stock: 100, warehouse_id: 1, unit_cost: 15, currency: 'USD' },
    { id: 3, name: 'خزان مياه 1000 لتر', category: 'wash', quantity: 50, unit: 'خزان', min_stock: 5, warehouse_id: 2, unit_cost: 120, currency: 'USD' },
    { id: 4, name: 'حقيبة مدرسية', category: 'education', quantity: 1200, unit: 'حقيبة', min_stock: 300, warehouse_id: 2, unit_cost: 12, currency: 'USD' }
  ],
  warehouses: [
    { id: 1, name: 'مخزن تعز المركزي', code: 'WH-TZ-01', location: 'شارع جمال', governorate: 'تعز', capacity: 5000 },
    { id: 2, name: 'مخزن الضالع - قعطبة', code: 'WH-DL-02', location: 'وسط المدينة', governorate: 'الضالع', capacity: 2000 }
  ],
  distributions: [
    { id: 1, title: 'توزيع الدفعة الأولى - المظفر', project_id: 1, distribution_date: '2026-04-15', location: 'مركز التوزيع', governorate: 'تعز', warehouse_id: 1, status: 'completed', total_beneficiaries: 500 },
    { id: 2, title: 'توزيع خزانات المياه - دمت', project_id: 2, distribution_date: '2026-05-10', location: 'قرية الحصن', governorate: 'الضالع', warehouse_id: 2, status: 'planned', total_beneficiaries: 50 }
  ],
  inventory_stats: { total_items: 4, low_stock: 0, total_value: 94650 },

  // ===== DATA COLLECTION =====
  data_collection_forms: [
    { 
      id: 1, title: 'استمارة التحقق من المستفيدين', description: 'استمارة ميدانية لجمع بيانات المستفيدين الجدد', project_id: 1, status: 'published', submission_count: 124, 
      fields: [
        { id: 1, field_name: 'full_name', label: 'الاسم الكامل', field_type: 'text', is_required: true },
        { id: 2, field_name: 'national_id', label: 'الرقم الوطني', field_type: 'number', is_required: true },
        { id: 3, field_name: 'phone', label: 'رقم الهاتف', field_type: 'text', is_required: false }
      ]
    },
    { 
      id: 2, title: 'تقييم الاحتياجات السريع - WASH', description: 'تقييم وضع المياه في المناطق المستهدفة', project_id: 2, status: 'published', submission_count: 45,
      fields: [
        { id: 4, field_name: 'water_source', label: 'مصدر المياه الحالي', field_type: 'select', options: 'بئر,وايت,شبكة عمومية', is_required: true },
        { id: 5, field_name: 'satisfaction', label: 'مستوى الرضا', field_type: 'rating', is_required: false }
      ]
    }
  ],

  // ===== ANALYTICS =====
  analytics_overview: {
    total_projects: 12, active_projects: 8, total_beneficiaries: 18450, total_forms: 15, total_submissions: 840,
    budget_utilization: 68, total_spent: 850000, total_budget: 1250000, total_indicators: 45
  },
  analytics_geographic: {
    beneficiaries_by_governorate: [
      { governorate: 'تعز', count: 5800 },
      { governorate: 'صنعاء', count: 4200 },
      { governorate: 'عدن', count: 3100 },
      { governorate: 'الضالع', count: 2850 },
      { governorate: 'صعدة', count: 2500 }
    ],
    projects_by_governorate: [
      { governorate: 'تعز', count: 4 },
      { governorate: 'الضالع', count: 3 },
      { governorate: 'صنعاء', count: 2 },
      { governorate: 'عدن', count: 2 },
      { governorate: 'صعدة', count: 1 }
    ]
  },
  analytics_trends: {
    trends: [
      { 
        indicator_name: 'عدد الأسر الحاصلة على سلال غذائية', target: 5000, 
        data_points: [
          { date: '2026-01-15', value: 1200 },
          { date: '2026-02-15', value: 2450 },
          { date: '2026-03-15', value: 3100 },
          { date: '2026-04-15', value: 3850 },
          { date: '2026-05-15', value: 4600 }
        ]
      },
      { 
        indicator_name: 'نسبة التغطية الصحية', target: 100, 
        data_points: [
          { date: '2026-01-15', value: 20 },
          { date: '2026-02-15', value: 35 },
          { date: '2026-03-15', value: 45 },
          { date: '2026-04-15', value: 65 }
        ]
      }
    ]
  },
  analytics_5w: {
    data: [
      { who: 'HIAOS Org', what: 'Food Distribution', where: 'Taiz - Al Mudhaffar', when: '2026-04-15', for_whom: '500 Households', sector: 'FSL', status: 'Completed' },
      { who: 'HIAOS Org', what: 'Well Maintenance', where: 'Ad Dhale - Damt', when: '2026-05-10', for_whom: '2800 Individuals', sector: 'WASH', status: 'Ongoing' }
    ]
  },
  dqa_history: [
    { id: 1, assessment_date: '2026-04-15', overall_score: 94, status: 'good', total_records: 500, complete_records: 495, accuracy_score: 96, timeliness_score: 92, consistency_score: 95, findings: 'البيانات مكتملة ودقيقة بشكل كبير في مشروع الغذاء.', recommendations: 'الاستمرار على نفس المعايير.' },
    { id: 2, assessment_date: '2026-04-20', overall_score: 82, status: 'acceptable', total_records: 320, complete_records: 290, accuracy_score: 85, timeliness_score: 78, consistency_score: 84, findings: 'نقص بسيط في صور المستندات المؤيدة لمشروع المياه.', recommendations: 'التأكد من رفع جميع المرفقات فور التوزيع.' }
  ],

  // ===== OVERVIEW =====
  overview: { total_beneficiaries: 18450, total_budget: 2400000, total_projects: 12 }
};

export const seedSystem = () => {
  console.log('[Seed] Initializing HIAOS Demo Data...');
  Object.keys(DEMO_DATA).forEach(key => {
    if (!localStorage.getItem(`${STORAGE_PREFIX}${key}`)) {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(DEMO_DATA[key]));
    }
  });

  // Ensure branding is initialized
  if (!localStorage.getItem('hiaos_branding')) {
    localStorage.setItem('hiaos_branding', JSON.stringify({
      logo: null,
      primaryColor: '#2563eb',
      orgName: 'HIAOS Operating System',
      theme: 'modern'
    }));
  }

  // Seed beneficiaries into IndexedDB-style localStorage key used by db.js
  if (!localStorage.getItem('hiaos_beneficiaries_seeded')) {
    localStorage.setItem('hiaos_beneficiaries', JSON.stringify(DEMO_DATA.beneficiaries));
    localStorage.setItem('hiaos_beneficiaries_seeded', 'true');
  }
};

export const forceSeed = () => {
  Object.keys(DEMO_DATA).forEach(key => {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(DEMO_DATA[key]));
  });
  localStorage.setItem('hiaos_beneficiaries', JSON.stringify(DEMO_DATA.beneficiaries));
  console.log('[Seed] Force re-seeded all HIAOS data.');
};
