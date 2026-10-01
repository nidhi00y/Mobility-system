import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  ChartNoAxesCombined,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleConfig = {
  EMPLOYEE: [
    { label: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { label: 'New request', path: '/employee/request', icon: CalendarPlus },
    { label: 'My requests', path: '/employee/requests', icon: ClipboardList },
  ],
  MANAGER: [
    { label: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
    { label: 'My requests', path: '/manager/requests', icon: ClipboardList },
    { label: 'Approvals', path: '/manager/approvals', icon: ClipboardCheck },
  ],
  HR: [
    { label: 'Dashboard', path: '/hr/dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/hr/users', icon: UsersRound },
    { label: 'Pending requests', path: '/hr/pending-requests', icon: ClipboardCheck },
    { label: 'All requests', path: '/hr/all-requests', icon: ClipboardList },
    { label: 'Active carpools', path: '/hr/pooling', icon: UsersRound },
    { label: 'Analytics', path: '/hr/analytics', icon: ChartNoAxesCombined },
  ],
};

export default function DashboardLayout({ role, title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = roleConfig[role] || [];
  const initials = (user?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderNavigation = () => navItems.map((item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => setMobileNavOpen(false)}
        className={({ isActive }) => [
          'group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
          isActive
            ? 'bg-[#f2edf4] text-[#51245f]'
            : 'text-[#5d5d68] hover:bg-[#f7f7f9] hover:text-[#292832]',
        ].join(' ')}
      >
        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        {item.label}
      </NavLink>
    );
  });

  const renderBrand = () => (
    <div className="flex h-[76px] items-center gap-3 border-b border-[#ececf0] px-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#51245f] text-xs font-bold tracking-wide text-white">
        MI
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#292832]">Mondelez International</p>
        <p className="mt-0.5 text-xs text-[#777783]">Mobility services</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#24242b]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-[#e5e5e9] bg-white lg:flex">
        {renderBrand()}
        <div className="px-4 pt-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase text-[#92929b]">Workspace</p>
          <nav className="space-y-1">{renderNavigation()}</nav>
        </div>
        <div className="mt-auto border-t border-[#ececf0] p-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee6f0] text-xs font-semibold text-[#51245f]">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#33333c]">{user?.name || 'User'}</p>
              <p className="mt-0.5 text-xs text-[#777783]">{role?.toLowerCase()}</p>
            </div>
            <button type="button" onClick={handleLogout} title="Sign out" aria-label="Sign out" className="rounded-md p-2 text-[#777783] transition hover:bg-[#f2f2f5] hover:text-[#33333c]">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/30" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[min(84vw,300px)] flex-col border-r border-[#e5e5e9] bg-white shadow-xl">
            <div className="flex items-center justify-between">
              {renderBrand()}
              <button type="button" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} className="mr-3 rounded-md p-2 text-[#686875] hover:bg-[#f4f4f6]">
                <X size={18} />
              </button>
            </div>
            <div className="px-4 pt-6">
              <p className="mb-3 px-3 text-[11px] font-semibold uppercase text-[#92929b]">Workspace</p>
              <nav className="space-y-1">{renderNavigation()}</nav>
            </div>
            <div className="mt-auto border-t border-[#ececf0] p-4">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eee6f0] text-xs font-semibold text-[#51245f]">{initials}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user?.name || 'User'}</p>
                  <p className="text-xs text-[#777783]">{role?.toLowerCase()}</p>
                </div>
                <button type="button" onClick={handleLogout} aria-label="Sign out" className="rounded-md p-2 text-[#777783] hover:bg-[#f2f2f5]">
                  <LogOut size={17} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-[252px]">
        <header className="sticky top-0 z-20 border-b border-[#e5e5e9] bg-white">
          <div className="flex min-h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)} className="rounded-lg border border-[#e3e4e8] p-2 text-[#555560] hover:bg-[#f7f7f9] lg:hidden">
                <Menu size={19} />
              </button>
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-semibold uppercase text-[#8a8a94]">Mondelez / {role?.toLowerCase()}</p>
                <h1 className="truncate text-lg font-semibold leading-tight text-[#24242b] sm:text-xl">{title}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eee6f0] text-xs font-semibold text-[#51245f]">{initials}</div>
                <div className="hidden min-w-0 sm:block">
                  <p className="max-w-40 truncate text-sm font-semibold text-[#33333c]">{user?.name || 'User'}</p>
                  <p className="text-xs text-[#777783]">{role?.toLowerCase()}</p>
                </div>
              </div>
              <button type="button" onClick={handleLogout} aria-label="Sign out" title="Sign out" className="rounded-lg p-2 text-[#696974] transition hover:bg-[#f5f5f7] lg:hidden">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
          <div key={location.pathname} className="animate-[fade-in_180ms_ease-out]">{children}</div>
        </main>
      </div>
    </div>
  );
}
