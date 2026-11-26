import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Globe, Server } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export function CloudNodeCard({ cloud, isActive }) {
  if (!cloud) return null;

  const isHealthy = cloud.status === 'HEALTHY';
  const isAws = cloud.provider === 'AWS';
  const latencyPct = Math.min(100, Math.max(8, Math.round((cloud.responseTimeMs / 1500) * 100)));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className={`card-glass rounded-2xl p-5 ${
        isActive ? 'ring-1 ring-cyan-500/45 shadow-lg shadow-cyan-500/10' : ''
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isActive && isHealthy && (
              <span className="animate-radar-ring absolute inset-0 rounded-xl bg-cyan-400/25" />
            )}
            <div
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl border ${
                isAws
                  ? 'border-amber-500/35 bg-amber-500/12 text-amber-300'
                  : 'border-sky-500/35 bg-sky-500/12 text-sky-300'
              }`}
            >
              <Server className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-white">
                {isAws ? 'Amazon Web Services (AWS)' : 'Google Cloud Platform (GCP)'}
              </h3>
              {isActive && (
                <motion.span
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-md border border-cyan-500/30 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300"
                >
                  Serving Traffic
                </motion.span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Region: <span className="font-mono text-slate-300">{cloud.region}</span> • Role:{' '}
              <span className="font-medium text-slate-300">{cloud.role.replaceAll('_', ' ')}</span>
            </p>
          </div>
        </div>
        <StatusBadge value={cloud.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3">
          <p className="text-[11px] text-slate-400">Response Time</p>
          <p
            className={`mt-1 font-mono text-lg font-bold tabular-nums ${
              isHealthy ? 'text-emerald-300' : cloud.status === 'DEGRADED' ? 'text-amber-300' : 'text-rose-300'
            }`}
          >
            {cloud.responseTimeMs} ms
          </p>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-800">
            <motion.div
              animate={{ width: `${latencyPct}%` }}
              transition={{ duration: 0.4 }}
              className={`h-full rounded-full ${
                isHealthy ? 'bg-emerald-400' : cloud.status === 'DEGRADED' ? 'bg-amber-400' : 'bg-rose-400'
              }`}
            />
          </div>
        </div>
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3">
          <p className="text-[11px] text-slate-400">HTTP Probe</p>
          <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums">{cloud.httpStatus}</p>
        </div>
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3">
          <p className="text-[11px] text-slate-400">Failed Checks</p>
          <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
            {cloud.consecutiveFailures}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3">
          <p className="text-[11px] text-slate-400">Last Healthy</p>
          <p className="mt-1 flex items-center gap-1 font-mono text-xs font-medium text-slate-200">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {cloud.lastSuccessfulCheckAt
              ? new Date(cloud.lastSuccessfulCheckAt).toLocaleTimeString()
              : 'N/A'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/70 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5 truncate">
          <Globe className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="truncate font-mono">{cloud.endpoint}</span>
        </span>
        <AnimatePresence>
          {cloud.errorMessage && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="shrink-0 font-medium text-rose-300"
            >
              {cloud.errorMessage}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
