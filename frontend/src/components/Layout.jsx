import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, FolderKanban, Wallet, UserCog,
  Package, BarChart3, Banknote, LogOut, Menu, X, ChevronLeft,
  ClipboardList, FileSpreadsheet, FolderArchive,
  MessageSquare, Lightbulb, Target, Calculator, TrendingUp,
  ShieldAlert, ClipboardCheck, Shield, Calendar, FileSearch, Gauge,
  MapPin, ListChecks, FileText, Layers
} from 'lucide-react';

const navSections = [
  {
    title: 'الرئيسية',
    items: [
      { path: '/', label: 'لوحة المعلومات', icon: LayoutDashboard },
      { path: '/executive', label: 'اللوحة التنفيذية', icon: Gauge },
    ],
  },
  {
    title: 'إدارة البرامج',
    items: [
      { path: '/beneficiaries', label: 'المستفيدين', icon: Users },
      { path: '/projects', label: 'المشاريع', icon: FolderKanban },
      { path: '/activities', label: 'تتبع الأنشطة', icon: Calendar },
      { path: '/cash', label: 'التحويلات النقدية', icon: Banknote },
    ],
  },
  {
    title: 'MEAL',
    items: [
      { path: '/meal-plan', label: 'خطة MEAL', icon: ClipboardCheck },
      { path: '/monitoring', label: 'المتابعة', icon: BarChart3 },
      { path: '/logframe', label: 'الإطار المنطقي', icon: Target },
      { path: '/data-collection', label: 'جمع البيانات', icon: ClipboardList },
      { path: '/evaluation', label: 'أدوات التقييم', icon: Calculator },
      { path: '/needs-assessment', label: 'تقييم الاحتياجات', icon: FileSearch },
      { path: '/accountability', label: 'المساءلة (CFM)', icon: MessageSquare },
      { path: '/safeguarding', label: 'الحماية و CHS', icon: Shield },
      { path: '/learning', label: 'التعلم', icon: Lightbulb },
      { path: '/iptt', label: 'IPTT', icon: BarChart3 },
      { path: '/field-visits', label: 'الزيارات الميدانية', icon: MapPin },
      { path: '/recommendations', label: 'التوصيات', icon: ListChecks },
      { path: '/sector-indicators', label: 'المؤشرات القطاعية', icon: Layers },
      { path: '/assessment-tools', label: 'أدوات التقييم الجاهزة', icon: ClipboardList },
      { path: '/analytics', label: 'التحليلات', icon: TrendingUp },
      { path: '/reports', label: 'التقارير', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { path: '/finance', label: 'الإدارة المالية', icon: Wallet },
      { path: '/hr', label: 'الموارد البشرية', icon: UserCog },
      { path: '/inventory', label: 'المخازن والتوزيع', icon: Package },
      { path: '/risks', label: 'إدارة المخاطر', icon: ShieldAlert },
      { path: '/documents', label: 'أرشيف الوثائق', icon: FolderArchive },
      { path: '/compliance', label: 'الامتثال والجودة', icon: Shield },
      { path: '/audit', label: 'سجل التدقيق', icon: FileText },
    ],
  },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-bold">نظام إنساني</h1>
              <p className="text-xs text-gray-400 mt-1">اليمن</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg">
            {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-1">
              {sidebarOpen && (
                <p className="px-4 py-2 text-xs text-gray-500 uppercase font-bold tracking-wider">{section.title}</p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    {sidebarOpen && <span className="text-sm">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 rounded-lg transition"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>تسجيل خروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
