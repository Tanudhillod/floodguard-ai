"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/shared'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Drone Intelligence', href: '/drone-intelligence', icon: 'ScanLine' },
  { label: 'SOS Requests', href: '/sos-requests', icon: 'Siren' },
  { label: 'Shelters', href: '/shelters', icon: 'House' },
  { label: 'Risk Analysis', href: '/risk-analysis', icon: 'Activity' },
  { label: 'Budget', href: '/budget', icon: 'WalletCards' },
]

const getPageTitle = (pathname: string | null) => {
  if (!pathname || pathname === '/' || pathname === '/dashboard') return 'Disaster Response Command Center'
  const labels: Record<string, string> = {
    '/drone-intelligence': 'Drone Intelligence',
    '/sos-requests': 'SOS Requests',
    '/shelters': 'Shelter Network',
    '/risk-analysis': 'Risk Analysis',
    '/budget': 'Budget & Resources',
  }
  return labels[pathname] ?? 'FloodGuard'
}

export default function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentTitle = getPageTitle(pathname)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-[#081720] p-5 lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.45)]">
              <Icon name="Waves" size={20} />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">FloodGuard</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">AI Command Center</div>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-sky-500/10 text-sky-100 ring-1 ring-inset ring-sky-400/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className={active ? 'text-sky-300' : 'text-slate-400'}>
                    <Icon name={item.icon} size={17} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto space-y-4 pt-6">
            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                <span>All systems operational</span>
              </div>
              <Icon name="ChevronRight" size={14} />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-700/70 text-xs font-bold text-sky-50">AK</div>
              <div>
                <div className="text-sm font-semibold text-slate-100">Arjun Kapoor</div>
                <div className="text-[11px] text-slate-400">Operations lead</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6 xl:px-8">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Operations / {currentTitle.toUpperCase()}</div>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">{currentTitle}</h1>
              </div>

              <div className="hidden items-center gap-4 md:flex">
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                  Live system
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 transition hover:border-slate-500 hover:text-white">
                  <Icon name="Bell" size={16} />
                </button>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Icon name="CalendarDays" size={15} />
                  Aug 24, 2026
                </div>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto border-t border-slate-800 px-4 py-3 lg:hidden">
              {navItems.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium ${
                      active
                        ? 'border-sky-500/40 bg-sky-500/10 text-sky-100'
                        : 'border-slate-700 bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </header>

          <main className="p-4 md:p-6 xl:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
