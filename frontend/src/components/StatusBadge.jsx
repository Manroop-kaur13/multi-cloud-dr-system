const STYLE_MAP = {
  HEALTHY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ONLINE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  NORMAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  STANDBY_SYNCED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SYNCED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DEGRADED: 'bg-amber-50 text-amber-700 border-amber-200',
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
  WARM_STANDBY: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
  UNHEALTHY: 'bg-rose-50 text-rose-700 border-rose-200',
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
  OFFLINE: 'bg-rose-50 text-rose-700 border-rose-200',
  OFFLINE_PRIMARY: 'bg-rose-50 text-rose-700 border-rose-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
  FAILED_OVER: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  IN_PROGRESS: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  RECOVERING: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  PROMOTED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  ACTIVE_PRIMARY: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  PRIMARY: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  INFO: 'bg-sky-50 text-sky-700 border-sky-200',
};

const DOT_MAP = {
  HEALTHY: 'bg-emerald-500',
  ONLINE: 'bg-emerald-500',
  NORMAL: 'bg-emerald-500',
  SUCCESS: 'bg-emerald-500',
  COMPLETED: 'bg-emerald-500',
  STANDBY_SYNCED: 'bg-emerald-500',
  SYNCED: 'bg-emerald-500',
  DEGRADED: 'bg-amber-500',
  WARNING: 'bg-amber-500',
  UNHEALTHY: 'bg-rose-500',
  CRITICAL: 'bg-rose-500',
  OFFLINE: 'bg-rose-500',
  FAILED_OVER: 'bg-cyan-500',
  IN_PROGRESS: 'bg-cyan-500',
  RECOVERING: 'bg-cyan-500',
  PROMOTED: 'bg-cyan-500',
};

const PULSE_KEYS = new Set(['HEALTHY', 'ONLINE', 'UNHEALTHY', 'CRITICAL', 'IN_PROGRESS', 'RECOVERING']);

export function StatusBadge({ value, label, showDot = true }) {
  const key = String(value || 'INFO').toUpperCase();
  const classes = STYLE_MAP[key] || 'bg-slate-100 text-slate-700 border-slate-200';
  const dotColor = DOT_MAP[key] || 'bg-slate-400';
  const shouldPulse = PULSE_KEYS.has(key);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors duration-200 ${classes}`}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {shouldPulse && (
            <span className={`animate-radar-ring absolute inline-flex h-full w-full rounded-full ${dotColor}`} />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColor}`} />
        </span>
      )}
      {label || key.replaceAll('_', ' ')}
    </span>
  );
}
