import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowRightLeft,
  Banknote,
  BarChart3,
  Brain,
  Calendar,
  Calculator,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  FolderKanban,
  Gauge,
  Globe,
  HelpCircle,
  Home,
  Keyboard,
  Languages,
  Layers,
  LayoutGrid,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  ListChecks,
  ListTree,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Milestone,
  Moon,
  MoreVertical,
  Package,
  Plug,
  Plus,
  Printer,
  Quote,
  Radio,
  Rocket,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Settings,
  Sun,
  Target,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  Wand2,
  WifiOff,
  Map as MapIcon,
  FileStack,
  Server,
  Lock,
  HardDrive,
  Truck,
  Handshake,
  Terminal,
  Palette,
  Siren,
  Apple,
  Droplets,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  Scale,
  Database,
  Home as HomeIcon,
  Key,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBranding } from '../contexts/BrandingContext';
import { cn } from '../lib/utils';
import GlobalSearch from './GlobalSearch';
import RightSidebar from './RightSidebar';
import QuickEntry from './QuickEntry';
import { ShortcutsOverlay, HelpCenter } from './CommandCenter';
import OfflineSyncManager from './OfflineSyncManager';
import RoleSelector from './RoleSelector';
import AIAdvisor from './AIAdvisor';

// Section color themes (Professional 12-section palette)
const SECTION_COLORS = {
  0:  { dot: 'bg-blue-600',    text: 'text-blue-600',    active: 'bg-blue-600/10 text-blue-600' },
  1:  { dot: 'bg-indigo-600',  text: 'text-indigo-600',  active: 'bg-indigo-600/10 text-indigo-600' },
  2:  { dot: 'bg-emerald-600', text: 'text-emerald-600', active: 'bg-emerald-600/10 text-emerald-600' },
  3:  { dot: 'bg-violet-600',  text: 'text-violet-600',  active: 'bg-violet-600/10 text-violet-600' },
  4:  { dot: 'bg-rose-600',    text: 'text-rose-600',    active: 'bg-rose-600/10 text-rose-600' },
  5:  { dot: 'bg-amber-600',   text: 'text-amber-600',   active: 'bg-amber-600/10 text-amber-600' },
  6:  { dot: 'bg-sky-600',     text: 'text-sky-600',     active: 'bg-sky-600/10 text-sky-600' },
  7:  { dot: 'bg-cyan-600',    text: 'text-cyan-600',    active: 'bg-cyan-600/10 text-cyan-600' },
  8:  { dot: 'bg-orange-600',  text: 'text-orange-600',  active: 'bg-orange-600/10 text-orange-600' },
  9:  { dot: 'bg-teal-600',    text: 'text-teal-600',    active: 'bg-teal-600/10 text-teal-600' },
  10: { dot: 'bg-indigo-500',  text: 'text-indigo-500',  active: 'bg-indigo-500/10 text-indigo-500' },
  11: { dot: 'bg-slate-500',   text: 'text-slate-500',   active: 'bg-slate-500/10 text-slate-500' },
  12: { dot: 'bg-purple-600',  text: 'text-purple-600',  active: 'bg-purple-600/10 text-purple-600' },
  13: { dot: 'bg-red-600',     text: 'text-red-600',     active: 'bg-red-600/10 text-red-600' },
  14: { dot: 'bg-orange-500',  text: 'text-orange-500',  active: 'bg-orange-500/10 text-orange-500' },
  15: { dot: 'bg-cyan-600',    text: 'text-cyan-600',    active: 'bg-cyan-600/10 text-cyan-600' },
  16: { dot: 'bg-rose-500',    text: 'text-rose-500',    active: 'bg-rose-500/10 text-rose-500' },
  17: { dot: 'bg-gray-600',    text: 'text-gray-600',    active: 'bg-gray-600/10 text-gray-600' },
};

const navSections = [
  {
    id: 0,
    title: '🏢 القيادة الاستراتيجية',
    collapsible: false,
    items: [
      { path: '/',                  label: 'الرئيسية',                 icon: Home, module: 'core' },
      { path: '/strategic',           label: 'لوحة القيادة الاستراتيجية', icon: Globe, module: 'strategic' },
      { path: '/mission-control',   label: 'مركز القيادة الموحد',      icon: LayoutDashboard, module: 'meal' },
      { path: '/executive',         label: 'لوحة القيادة التنفيذية',   icon: Gauge, module: 'meal' },
      { path: '/enterprise-control',  label: 'مركز التحكم المتقدم HQ',   icon: Server, module: 'core' },
      { path: '/coordination-watchtower',label: 'برج التنسيق الدولي',     icon: Radio, module: 'meal' },
    ],
  },
  {
    id: 1,
    title: '🤖 مركز الذكاء الاصطناعي',
    collapsible: true,
    items: [
      { path: '/ai-hub',              label: 'مركز الذكاء الاصطناعي',     icon: Sparkles, module: 'ai_hub' },
      { path: '/ai-insights',         label: 'مساعد الذكاء الاصطناعي', icon: Sparkles, module: 'meal' },
      { path: '/narrative-builder',     label: 'منشئ التقارير AI',         icon: Sparkles, module: 'meal' },
      { path: '/proposal-converter',label: 'المحول الذكي AI',           icon: Wand2, module: 'meal' },
    ],
  },
  {
    id: 2,
    title: '📦 إدارة البرامج والمشاريع',
    collapsible: false,
    items: [
      { path: '/projects',          label: 'إدارة المشاريع',           icon: FolderKanban, module: 'projects' },
      { path: '/activities',        label: 'تتبع الأنشطة',             icon: Activity, module: 'meal' },
      { path: '/beneficiaries',     label: 'المستفيدون والحالات',       icon: Users, module: 'beneficiaries' },
      { path: '/partners',            label: 'إدارة الشركاء والتعاقدات', icon: Handshake, module: 'partners' },
      { path: '/risk',                label: 'الأمن وإدارة المخاطر',    icon: ShieldAlert, module: 'risk' },
      { path: '/project-designer',  label: 'مصمم المشاريع الذكي',      icon: ListTree, module: 'projects' },
      { path: '/lifecycle',         label: 'دورة حياة المشروع DPro',   icon: Milestone, module: 'projects' },
      { path: '/kanban',            label: 'لوحة Kanban',              icon: LayoutDashboard, module: 'projects' },
      { path: '/calendar',          label: 'التقويم التشغيلي',          icon: Calendar, module: 'projects' },
      { path: '/gis',               label: 'الخريطة التفاعلية الموحدة', icon: Globe, module: 'gis' },
    ],
  },
  {
    id: 3,
    title: '📊 المتابعة والتقييم MEAL',
    collapsible: false,
    items: [
      { path: '/monitoring',        label: 'المتابعة الميدانية',          icon: BarChart3, module: 'meal' },
      { path: '/logframe',          label: 'الإطار المنطقي',           icon: Layers, module: 'meal' },
      { path: '/iptt',              label: 'مؤشرات الأداء IPTT',       icon: Target, module: 'meal' },
      { path: '/field-visits',      label: 'الزيارات الميدانية',        icon: MapPin, module: 'meal' },
      { path: '/needs-assessment',  label: 'تقييم الاحتياجات',         icon: ListChecks, module: 'meal' },
      { path: '/sector-indicators', label: 'بنك المؤشرات القطاعية',    icon: FileText, module: 'meal' },
      { path: '/sector-hub',        label: 'مركز القطاعات',            icon: Globe, module: 'meal' },
      { path: '/dqa',               label: 'مركز جودة البيانات الموحد', icon: ShieldCheck, module: 'meal' },
      { path: '/evaluation',           label: 'إدارة التقييمات',        icon: FileSearch, module: 'meal' },
      { path: '/assessment-tools',     label: 'أدوات التقييم',          icon: ClipboardList, module: 'meal' },
      { path: '/stats-lab',         label: 'المختبر الإحصائي',          icon: Calculator, module: 'meal' },
      { path: '/spatial-insights',  label: 'الرادار المكاني GIS',       icon: MapIcon, module: 'meal' },
      { path: '/remote-monitoring', label: 'المراقبة عن بعد',           icon: Radio, module: 'meal' },
      { path: '/outcome-harvesting',   label: 'حصاد النتائج',           icon: Quote, module: 'meal' },
      { path: '/learning',             label: 'التعلم المؤسسي',         icon: Lightbulb, module: 'meal' },
      { path: '/adaptive-management',  label: 'الإدارة التكيفية',       icon: ArrowRightLeft, module: 'meal' },
      { path: '/recommendations',      label: 'التوصيات وخطط العمل',   icon: ListChecks, module: 'meal' },
    ],
  },
  {
    id: 4,
    title: '🤝 المساءلة والحماية',
    collapsible: true,
    items: [
      { path: '/accountability',       label: 'الشكاوى والمساءلة CFM', icon: MessageSquare, module: 'meal' },
      { path: '/safeguarding',         label: 'الحماية و PSEA',         icon: Shield, module: 'meal' },
      { path: '/feedback-loop',        label: 'حلقة التغذية الراجعة',   icon: ArrowRightLeft, module: 'meal' },
      { path: '/compliance',          label: 'الامتثال و CHS',          icon: ShieldCheck, module: 'meal' },
      { path: '/community-verification',label: 'التحقق المجتمعي',      icon: UserCheck, module: 'meal' },
      { path: '/green-meal',           label: 'Green MEAL',             icon: Leaf, module: 'meal' },
      { path: '/risks',                label: 'رادار المخاطر الموحد',   icon: ShieldAlert, module: 'meal' },
    ],
  },
  {
    id: 5,
    title: '💰 الإدارة المالية',
    collapsible: true,
    items: [
      { path: '/finance',             label: 'العمليات المالية',          icon: Wallet, module: 'finance' },
      { path: '/bva',                 label: 'تحليل الميزانية BVA',    icon: Activity, module: 'financial_engine' },
      { path: '/cash',                label: 'المساعدات النقدية',       icon: Banknote, module: 'cash' },
      { path: '/vfm',                   label: 'التقارير المالية VfM',   icon: Banknote, module: 'finance' },
      { path: '/anti-fraud',        label: 'مكافحة الاحتيال',          icon: Shield, module: 'meal' },
    ],
  },
  {
    id: 6,
    title: '📜 إدارة المنح والتمويل',
    collapsible: true,
    items: [
      { path: '/grants',              label: 'إدارة المنح والتمويل',    icon: Wallet, module: 'grants' },
      { path: '/donor-reports',         label: 'معالج تقارير المانحين',    icon: FileSpreadsheet, module: 'meal' },
      { path: '/iati-export',           label: 'تصدير بيانات IATI',      icon: Globe, module: 'meal' },
    ],
  },
  {
    id: 7,
    title: '👥 الموارد البشرية',
    collapsible: true,
    items: [
      { path: '/hr',                  label: 'إدارة الموظفين',         icon: UserCog, module: 'hr' },
      { path: '/payroll',             label: 'الرواتب والأجور',          icon: Banknote, module: 'payroll' },
    ],
  },
  {
    id: 8,
    title: '🛠️ اللوجستيات وسلاسل الإمداد',
    collapsible: true,
    items: [
      { path: '/procurement',         label: 'المشتريات وسلسلة الإمداد', icon: ShoppingBag, module: 'procurement' },
      { path: '/inventory',           label: 'المخازن والتوزيع',        icon: Package, module: 'inventory' },
      { path: '/assets',              label: 'إدارة الأصول والمعدات',   icon: HardDrive, module: 'logistics' },
      { path: '/fleet',               label: 'الأسطول والحركة',         icon: Truck, module: 'logistics' },
    ],
  },
  {
    id: 9,
    title: '📈 التقارير والتحليلات',
    collapsible: false,
    items: [
      { path: '/reports',               label: 'التقارير التشغيلية',       icon: FileSpreadsheet, module: 'meal' },
      { path: '/analytics',         label: 'لوحة التحليلات المتقدمة', icon: BarChart3, module: 'meal' },
      { path: '/report-factory',        label: 'مصنع التقارير الموحد',     icon: FileStack, module: 'meal' },
      { path: '/custom-reports',        label: 'التقارير المخصصة',         icon: FileText, module: 'meal' },
      { path: '/scheduled-reports',     label: 'التقارير المجدولة',         icon: Clock, module: 'meal' },
      { path: '/ocha-5w',               label: 'مركز تقارير OCHA 5W',     icon: FileSpreadsheet, module: 'meal' },
    ],
  },
  {
    id: 10,
    title: '📂 الأرشفة والبيانات',
    collapsible: true,
    items: [
      { path: '/documents',           label: 'أرشيف الوثائق العام',     icon: FolderArchive, module: 'documents' },
      { path: '/data-collection',   label: 'إدارة جمع البيانات',       icon: ClipboardList, module: 'data_collection' },
      { path: '/kobo',              label: 'تكامل KoBo Toolbox',       icon: Plug, module: 'data_collection' },
      { path: '/offline',           label: 'التشغيل بدون إنترنت',        icon: WifiOff, module: 'data_collection' },
      { path: '/knowledge-hub',        label: 'مركز المعرفة الذكي',     icon: Brain, module: 'meal' },
      { path: '/marketplace',         label: 'سوق النماذج',             icon: ShoppingBag, module: 'core' },
    ],
  },
  {
    id: 11,
    title: '⚙️ النظام والإعدادات',
    collapsible: true,
    items: [
      { path: '/settings',            label: 'إعدادات النظام',          icon: Settings, module: 'core' },
      { path: '/integrations',        label: 'مركز التكاملات API',      icon: Plug, module: 'integrations' },
      { path: '/dev',                 label: 'Developer Console',       icon: Terminal, module: 'core' },
      { path: '/audit',               label: 'سجل التدقيق الرقمي',      icon: FileText, module: 'core' },
      { path: '/smart-audit',         label: 'التدقيق الرقمي المشفر',  icon: Lock, module: 'core' },
      { path: '/security-settings',   label: 'الأمان والخصوصية',        icon: ShieldCheck, module: 'core' },
      { path: '/system-customization',label: 'تهيئة النظام',            icon: Settings, module: 'core' },
      { path: '/branding-settings',   label: 'إعدادات الهوية البصرية',  icon: Palette, module: 'core' },
    ],
  },
  {
    id: 12,
    title: '🔐 الأمان والمحاسبة المتقدمة',
    collapsible: true,
    items: [
      { path: '/security-center',    label: 'مركز الأمان (MFA/API)',   icon: Key, module: 'core' },
      { path: '/accounting',         label: 'المحاسبة والقيد المزدوج',  icon: Calculator, module: 'finance' },
    ],
  },
  {
    id: 13,
    title: '🆘 الحماية والطوارئ',
    collapsible: true,
    items: [
      { path: '/protection',         label: 'حالات الحماية',           icon: Shield, module: 'core' },
      { path: '/emergency',          label: 'الاستجابة للطوارئ',        icon: Siren, module: 'core' },
      { path: '/camps',              label: 'إدارة المخيمات',           icon: HomeIcon, module: 'core' },
    ],
  },
  {
    id: 14,
    title: '🍎 التغذية والمياه والتعليم',
    collapsible: true,
    items: [
      { path: '/nutrition',          label: 'إدارة التغذية',            icon: Apple, module: 'core' },
      { path: '/wash',               label: 'المياه والصرف (WASH)',     icon: Droplets, module: 'core' },
      { path: '/education',          label: 'التعليم في الطوارئ',       icon: GraduationCap, module: 'core' },
      { path: '/livelihoods',        label: 'سبل العيش والتمكين',       icon: Briefcase, module: 'core' },
    ],
  },
  {
    id: 15,
    title: '⚠️ الإنذار المبكر وسلاسل الإمداد',
    collapsible: true,
    items: [
      { path: '/early-warning',      label: 'نظام الإنذار المبكر',      icon: AlertTriangle, module: 'core' },
      { path: '/supply-chain',       label: 'سلسلة الإمداد المتقدمة',   icon: Package, module: 'core' },
      { path: '/hr-advanced',        label: 'الموارد البشرية المتقدمة', icon: Users, module: 'core' },
    ],
  },
  {
    id: 16,
    title: '📏 المعايير الدولية',
    collapsible: true,
    items: [
      { path: '/standards',          label: 'Sphere والمعايير الدولية', icon: Scale, module: 'core' },
    ],
  },
  {
    id: 17,
    title: '📦 العمليات المجمّعة',
    collapsible: true,
    items: [
      { path: '/bulk-operations',    label: 'الاستيراد والتصدير المجمّع', icon: Database, module: 'core' },
    ],
  },
];

const pathPermissions = {
  '/projects': ['projects.read'],
  '/mission-control': ['reports.read'],
  '/project-designer': ['projects.write'],
  '/proposal-converter': ['meal.write'],
  '/donor-reports': ['reports.export'],
  '/vfm': ['finance.read'],
  '/finance': ['finance.read'],
  '/meal': ['meal.read'],
  '/meal-plan': ['meal.read'],
  '/logframe': ['meal.read'],
  '/iptt': ['meal.read'],
  '/monitoring': ['meal.read'],
  '/sector-indicators': ['meal.read'],
  '/sector-hub': ['meal.read'],
  '/evaluation': ['meal.read'],
  '/assessment-tools': ['meal.read'],
  '/needs-assessment': ['meal.read'],
  '/data-collection': ['meal.write'],
  '/offline': ['meal.write'],
  '/kobo': ['meal.write'],
  '/field-visits': ['meal.write'],
  '/beneficiaries': ['beneficiaries.read'],
  '/data-quality': ['meal.read'],
  '/dqa': ['meal.read'],
  '/stats-lab': ['meal.read'],
  '/accountability': ['cfm.read'],
  '/feedback-loop': ['cfm.read'],
  '/safeguarding': ['safeguarding.read', 'cfm.sensitive.read'],
  '/learning': ['meal.read'],
  '/recommendations': ['meal.read'],
  '/analytics': ['reports.read'],
  '/reports': ['reports.read'],
  '/custom-reports': ['reports.write'],
  '/narrative-builder': ['reports.write'],
  '/scheduled-reports': ['reports.write'],
  '/iati-export': ['reports.export'],
  '/ocha-5w': ['reports.export'],
  '/coordination-watchtower': ['reports.read'],
  '/remote-monitoring': ['meal.read'],
  '/activities': ['projects.read'],
  '/cash': ['finance.read'],
  '/inventory': ['inventory.read'],
  '/hr': ['hr.read'],
  '/documents': ['reports.read'],
  '/compliance': ['audit.read', 'reports.read'],
  '/audit': ['audit.read'],
  '/risks': ['meal.read'],
  '/risk-radar': ['meal.read'],
  '/anti-fraud': ['audit.read'],
  '/security-settings': ['settings.manage'],
  '/system-customization': ['settings.manage'],
  '/integrations': ['settings.manage'],
  '/ai-insights': ['meal.read'],
  '/executive': ['audit.read', 'reports.read'],
  '/security-center': ['settings.manage'],
  '/accounting': ['finance.read'],
  '/protection': ['cfm.read'],
  '/emergency': ['cfm.read'],
  '/camps': ['cfm.read'],
  '/nutrition': ['meal.read'],
  '/wash': ['meal.read'],
  '/education': ['meal.read'],
  '/livelihoods': ['meal.read'],
  '/early-warning': ['meal.read'],
  '/supply-chain': ['inventory.read'],
  '/hr-advanced': ['hr.read'],
  '/standards': ['audit.read'],
  '/bulk-operations': ['settings.manage'],
};

export default function Layout({ children }) {
  const { user, logout, hasAnyPermission, isModuleEnabled } = useAuth();
  const { t, toggleLanguage, isRtl, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { branding } = useBranding();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({ 5: true });
  const [showRoleSelector, setShowRoleSelector] = useState(() => !localStorage.getItem('hiaos_role'));
  const { theme, setTheme } = useTheme();

  const toggleSection = (id) => setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  const handleRoleSelect = (role) => { setShowRoleSelector(false); navigate(role.path); };

  const allItems = useMemo(() => navSections.flatMap((section) => section.items), []);
  
  const filteredNavSections = useMemo(() => {
    if (!user) return [];
    return navSections.map(section => ({
      ...section,
      items: section.items.filter((item) => {
        const hasPerm = hasAnyPermission(pathPermissions[item.path] || []);
        const moduleEnabled = isModuleEnabled(item.module);
        return hasPerm && moduleEnabled;
      })
    })).filter(section => section.items.length > 0);
  }, [user, hasAnyPermission, isModuleEnabled]);

  const currentItem = allItems.find((item) => item.path === location.pathname) || allItems[0];


  const breadcrumbs = useMemo(() => {
    let sectionTitle = '';
    const current = allItems.find((item) => item.path === location.pathname);
    
    if (current) {
      const section = navSections.find(s => s.items.some(i => i.path === current.path));
      if (section) sectionTitle = section.title.replace(/[^؀-ۿ\s]/g, '').trim(); // Remove emojis
    }

    return [
      { label: t('dashboard'), path: '/', icon: Home },
      ...(sectionTitle ? [{ label: sectionTitle, path: '#', isSection: true }] : []),
      ...(current && current.path !== '/' ? [current] : []),
    ];
  }, [allItems, location.pathname, t]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setQuickEntryOpen(true);
      }
      if (e.key === '?') setShortcutsOpen(true);
      if (e.key === 'g') {
        const handleNav = (navKey) => {
          if (navKey.key === 'p') navigate('/projects');
          if (navKey.key === 'b') navigate('/beneficiaries');
          if (navKey.key === 'd') navigate('/');
        };
        window.addEventListener('keydown', handleNav, { once: true });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden print:h-auto print:overflow-visible bg-[var(--bg-primary)]" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mesh-gradient opacity-10 print:hidden" />

      <motion.aside initial={false} animate={{ width: sidebarOpen ? 300 : 88 }} className="flex shrink-0 flex-col z-50 glass-sidebar shadow-2xl print:hidden border-none">
        <div className="flex h-16 items-center justify-between px-6 shrink-0 border-b border-[var(--border)]">
          {sidebarOpen ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: branding.primaryColor }}>
                 {branding.orgName.charAt(0)}
              </div>
              <h1 className="text-sm font-black tracking-tight" style={{ color: branding.primaryColor }}>{branding.orgName.split(' ')[0]}</h1>
            </motion.div>
          ) : (
            <div className="mx-auto w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: branding.primaryColor }}>
               {branding.orgName.charAt(0)}
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-black/5 text-[var(--text-secondary)]"><Menu size={20} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
          <button onClick={() => setQuickEntryOpen(true)} className={cn('flex items-center gap-3 px-3 h-12 mb-4 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all font-black text-xs group w-full', !sidebarOpen && 'justify-center px-0')}>
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            {sidebarOpen && <span>إضافة سريعة</span>}
          </button>

          {filteredNavSections.map((section) => {
            const colors = SECTION_COLORS[section.id] || SECTION_COLORS[0];
            const isCollapsed = section.collapsible && collapsedSections[section.id];
            return (
              <div key={section.title} className="space-y-0.5">
                {sidebarOpen && (
                  <button
                    onClick={() => section.collapsible && toggleSection(section.id)}
                    className={cn('w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1 transition-all', section.collapsible ? 'hover:bg-black/5 cursor-pointer' : 'cursor-default')}
                  >
                    <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', colors.dot)} />
                    <p className={cn('text-[9px] font-black uppercase tracking-[0.15em] flex-1 text-right', colors.text)}>{section.title}</p>
                    {section.collapsible && <ChevronRight size={12} className={cn('text-slate-400 transition-transform', isCollapsed ? '' : 'rotate-90')} />}
                  </button>
                )}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-0.5"
                    >
                      {section.items.map((item) => {
                        const active = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                              'flex items-center gap-3 px-3 h-9 rounded-xl text-xs font-bold transition-all group',
                              active ? colors.active : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5'
                            )}
                          >
                            <Icon size={15} className={cn('shrink-0 transition-transform', active ? 'scale-110' : 'group-hover:scale-110')} />
                            {sidebarOpen && <span className="truncate">{item.label}</span>}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <div className={cn('flex items-center gap-3 rounded-xl px-3 py-2', !sidebarOpen && 'justify-center px-0')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 text-slate-600 text-xs font-black">
              {(user?.full_name || user?.username || 'U').slice(0, 1)}
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-[var(--text-primary)]">{user?.full_name || user?.username}</p>
                <p className="truncate text-[10px] font-bold text-slate-400">{user?.role}</p>
              </div>
            )}
            <button onClick={handleLogout} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-600">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </motion.aside>

      <div className="flex flex-1 flex-col min-w-0 bg-transparent relative">
        <header className="h-12 flex items-center justify-between px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-[var(--border)] shrink-0 z-40 print:hidden">
          <div className="flex items-center gap-2 overflow-hidden">
            <OfflineSyncManager />
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {crumb.isSection ? (
                  <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className={cn('text-[11px] font-bold hover:text-blue-600 transition-colors whitespace-nowrap', idx === breadcrumbs.length - 1 ? 'text-[var(--text-primary)] font-black' : 'text-slate-400')}>
                    {crumb.label}
                  </Link>
                )}
                {idx < breadcrumbs.length - 1 && <ChevronRight size={12} className={cn('opacity-40 shrink-0', isRtl && 'rotate-180')} />}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleLanguage} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1">
              <Languages size={16} />
              <span className="text-[10px] font-black uppercase">{language === 'ar' ? 'EN' : 'AR'}</span>
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <button onClick={() => setShortcutsOpen(true)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Keyboard size={16} /></button>
            <button onClick={() => setHelpOpen(true)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><HelpCircle size={16} /></button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <button onClick={() => window.print()} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Printer size={16} /></button>
            <button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className={cn('p-1.5 transition-colors', rightSidebarOpen ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600')}><MoreVertical size={16} /></button>
            
            {/* Notification Bell */}
            <div className="relative">
               <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors relative">
                  <ShieldAlert size={18} />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
               </button>
            </div>

            <button onClick={() => setQuickEntryOpen(true)} className="h-8 px-4 bg-blue-600 text-white text-[11px] font-black rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"><Sparkles size={14} /> إضافة</button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 print:p-0 scroll-smooth">
            <div className="max-w-[1600px] mx-auto animate-in">{children}</div>
          </main>
          <AnimatePresence>{rightSidebarOpen && <RightSidebar isOpen={rightSidebarOpen} onClose={() => setRightSidebarOpen(false)} entityType={currentItem.label} entityData={{ name: currentItem.label }} />}</AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />}
        {quickEntryOpen && <QuickEntry isOpen={quickEntryOpen} onClose={() => setQuickEntryOpen(false)} />}
        {shortcutsOpen && <ShortcutsOverlay isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />}
        {helpOpen && <HelpCenter isOpen={helpOpen} onClose={() => setHelpOpen(false)} />}
        {showRoleSelector && (
          <RoleSelector
            onSelect={handleRoleSelect}
            onDismiss={() => { localStorage.setItem('hiaos_role', 'general'); setShowRoleSelector(false); }}
          />
        )}
      </AnimatePresence>
      <AIAdvisor />
    </div>
  );
}
