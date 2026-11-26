import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, Server, Shield } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

const PAGE_META = {
  dashboard: {
    code: 'SOC // OVERVIEW',
    title: 'Enterprise Multi-Cloud Resilience Command',
    subtitle: 'Continuous perimeter availability, active traffic routing, and SLA posture',
  },
  monitoring: {
    code: 'SOC // TELEMETRY',
    title: 'Multi-Cloud Health Telemetry',
    subtitle: 'Live endpoint probes, latency metrics, and simulated outage controls',
  },
  'disaster-recovery': {
    code: 'SOC // FAILOVER',
    title: 'Disaster Recovery & Failover Orchestrator',
    subtitle: 'Automated failure detection, DNS cutover simulation, and primary failback',
  },
  replication: {
    code: 'SOC // DATA VAULT',
    title: 'PostgreSQL Database & Replication',
    subtitle: 'Cross-cloud replication lag, RPO estimation, and live data synchronization',
  },
  events: {
    code: 'SOC // AUDIT LOGS',
    title: 'Security & Failover Event Audit',
    subtitle: 'Immutable trail of health-check failures, failovers, and recoveries',
  },
};

export function Header({ activePage, status, onRefresh, refreshing }) {
  const meta = PAGE_META[activePage] || PAGE_META.dashboard;
  const failoverStatus = status?.failover?.status || 'NORMAL';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#06080e]/85 px-6 py-4 backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              {meta.code}
            </p>
            <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">{meta.title}</h2>
            <p className="text-xs text-slate-400">{meta.subtitle}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 font-mono text-[11px] text-slate-300">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>POSTURE:</span>
            <strong className="text-white">
              {status?.activeCloud === 'AWS' ? 'NOMINAL' : 'FAILOVER'}
            </strong>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 font-mono text-[11px] text-slate-300">
            <Server className="h-3.5 w-3.5 text-cyan-400" />
            <span>NODE:</span>
            <strong className="text-white">{status?.activeCloud || 'AWS'}</strong>
          </div>

          <StatusBadge value={failoverStatus} />

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            SYNC
          </motion.button>
        </div>
      </div>
    </header>
  );
}
