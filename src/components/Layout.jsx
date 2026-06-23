import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, AlertTriangle, Leaf,
  ScanLine, Search, History, LogOut, ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useProfileStore } from '../store/profileStore'
import { useEffect } from 'react'

const navItems = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/profiles',  label: 'Profiles',   icon: Users },
  { to: '/allergens', label: 'Allergens',  icon: AlertTriangle },
  { to: '/dietary',   label: 'Dietary',    icon: Leaf },
  { to: '/scanner',   label: 'Scanner',    icon: ScanLine },
  { to: '/search',    label: 'Search',     icon: Search },
  { to: '/history',   label: 'History',    icon: History },
]

const bottomNavItems = [
  { to: '/',          label: 'Home',      icon: LayoutDashboard },
  { to: '/allergens', label: 'Allergens', icon: AlertTriangle },
  { to: '/scanner',   label: 'Scan',      icon: ScanLine },
  { to: '/search',    label: 'Search',    icon: Search },
  { to: '/profiles',  label: 'Profiles',  icon: Users },
]

function SidebarLink({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-green-50 text-green-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? 'text-green-600' : 'text-gray-400'} />
          {label}
        </>
      )}
    </NavLink>
  )
}

function BottomNavLink({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors ${
          isActive ? 'text-green-600' : 'text-gray-400'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function Layout({ children }) {
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()
  const { activeProfile, fetchProfiles } = useProfileStore()

  useEffect(() => { fetchProfiles() }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-100 bg-white fixed top-0 left-0 h-screen">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
          <span className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 ring-2 ring-orange-100 text-lg shadow-sm">🌿</span>
            <span className="text-lg font-bold"><span className="text-gray-900">My</span><span className="text-green-600">Allergy</span></span>
          </span>
        </div>

        {/* Active profile switcher */}
        {activeProfile && (
          <NavLink
            to="/profiles"
            className="mx-3 mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl leading-none">{activeProfile.avatar_emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium">Active profile</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{activeProfile.name}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 shrink-0" />
          </NavLink>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <SidebarLink key={to} to={to} label={label} Icon={Icon} />
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut size={18} className="text-gray-400" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-green-600 ring-2 ring-orange-100 text-base shadow-sm">🌿</span>
            <span className="font-bold"><span className="text-gray-900">My</span><span className="text-green-600">Allergy</span></span>
          </span>
          {activeProfile && (
            <NavLink to="/profiles" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <span className="text-lg">{activeProfile.avatar_emoji}</span>
              <span>{activeProfile.name}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </NavLink>
          )}
        </header>

        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Bottom nav (mobile) ───────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around z-10">
        {bottomNavItems.map(({ to, label, icon: Icon }) => (
          <BottomNavLink key={to} to={to} label={label} Icon={Icon} />
        ))}
      </nav>
    </div>
  )
}
