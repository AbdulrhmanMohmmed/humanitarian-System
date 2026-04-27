import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, FolderKanban, Wallet, UserCog,
  Package, BarChart3, Banknote, LogOut, Menu, X, ChevronLeft,
  ClipboardList, FileSpreadsheet, FolderArchive
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'لوحة المعلومات', icon: LayoutDashboard },
  { path: '/beneficiaries', label: 'المستفيدين', icon: Users },
  { path: '/projects', label: 'المشاريع', icon: FolderKanban },
  { path: '/finance', label: 'الإدارة المالية', icon: Wallet },
  { path: '/hr', label: 'الموارد البشرية', icon: UserCog },
  { path: '/inventory', label: 'المخازن والتوزيع', icon: Package },
  { path: '/monitoring', label: 'المتابعة والتقييم', icon: BarChart3 },
  { path: '/data-collection', label: 'جمع البيانات', icon: ClipboardList },
  { path: '/reports', label: 'التقارير', icon: FileSpreadsheet },
  { path: '/documents', label: 'أرشيف الوثائق', icon: FolderArchive },
  { path: '/cash', label: 'التحويلات النقدية', icon: Banknote },
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

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
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
