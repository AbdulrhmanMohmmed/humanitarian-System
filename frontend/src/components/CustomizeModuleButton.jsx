import { Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';

export default function CustomizeModuleButton({ entity, tab = 'designer', label = 'تخصيص هذه الوحدة', className = '' }) {
  const designerSearch = new URLSearchParams({ tab, entity }).toString();
  const listsSearch = new URLSearchParams({ tab: 'lists', entity }).toString();

  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-sm">
      <Link
        to={`/system-customization?${designerSearch}`}
        className={`inline-flex h-10 items-center justify-center gap-2 px-4 text-xs font-black text-[var(--text-secondary)] transition hover:bg-blue-500/10 hover:text-blue-600 ${className}`}
      >
        <SlidersHorizontal size={16} />
        {label}
      </Link>
      <Link
        to={`/system-customization?${listsSearch}`}
        className="inline-flex h-10 items-center justify-center border-r border-[var(--border)] px-3 text-[11px] font-black text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-600"
      >
        القوائم
      </Link>
    </div>
  );
}
