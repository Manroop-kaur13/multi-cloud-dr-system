import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Database,
  LayoutDashboard,
  Menu,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Command Overview', icon: LayoutDashboard, code: '01' },
  { id: 'monitoring', label: 'Cloud Telemetry', icon: Activity, code: '02' },
  { id: 'disaster-recovery', label: 'Failover & DR', icon: ShieldAlert, code: '03' },
  { id: 'replication', label: 'Database Vault', icon: Database, code: '04' },
  { id: 'events', label: 'Security & Audit', icon: ScrollText, code: '05' },
];

export function Sidebar({ activePage, onNavigate, status, mobileOpen, setMobileOpen }) {
  const activeCloud = status?.activeCloud || 'AWS';
  const isAws = activeCloud === 'AWS';

  const navContent = (
    <div className="flex h-full flex-col justify-between border-r border-slate-800/80 bg-[#070a11]/95 p-4 backdrop-blur-xl">
      <div>
        <div className="flex items-center justify-between gap-2 px-1.5 pb-6 pt-1">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/35 bg-gradient-to-br from-emerald-400/20 via-cyan-500/15 to-slate-900 shadow-lg shadow-emerald-500/10"
            >
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
            </motion.div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">CLOUDGUARD</h1>
              <p className="font-mono text-[10px] font-semibold tracking-widest text-emerald-400/90">
                SOC // DR PLATFORM
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Active Node Telemetry Widget */}
        <div className="mb-6 rounded-2xl border border-slate-800/90 bg-slate-950/90 p-3.5">
          <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span>ACTIVE_PLANE</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-radar-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <AnimatePresence mode="wait">
              <motion.span
                key={activeCloud}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm font-bold text-white"
              >
                {isAws ? 'AWS Primary' : 'GCP Standby'}
              </motion.span>
            </AnimatePresence>
            <span
              className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
                isAws
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                  : 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
              }`}
            >
              {activeCloud}
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-slate-500">
            REGION: {isAws ? status?.clouds?.AWS?.region || 'us-east-1' : status?.clouds?.GCP?.region || 'us-central1'}
          </p>
        </div>

        <p className="mb-2 px-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          OPERATIONS
        </p>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={`relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                  active ? 'text-white' : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeNavPill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-400/15 via-cyan-500/10 to-transparent"
                  >
                    <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-emerald-400" />
                  </motion.div>
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      active ? 'text-emerald-300' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </span>
                <span
                  className={`relative z-10 font-mono text-[10px] ${
                    active ? 'text-emerald-300' : 'text-slate-600'
                  }`}
                >
                  {item.code}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
          <Terminal className="h-3.5 w-3.5" />
          <span>SIMULATION_CORE</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
          {status?.simulationMode
            ? 'Zero-credential local simulation active. Cloud adapters isolated for AWS & GCP.'
            : 'Live cloud probe mode.'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">{navContent}</aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex lg:hidden"
          >
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="relative z-10 w-64 max-w-[85vw]"
            >
              {navContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/30 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </motion.button>
    </>
  );
}
