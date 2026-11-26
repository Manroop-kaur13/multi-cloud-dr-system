import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export function ResilienceScoreGauge({ status, metrics }) {
  const activeCloud = status?.activeCloud || 'AWS';
  const awsHealthy = status?.clouds?.AWS?.status !== 'UNHEALTHY';
  const gcpHealthy = status?.clouds?.GCP?.status !== 'UNHEALTHY';
  const availability = Number(metrics?.overallAvailabilityPercent ?? 100);

  let resilienceScore = 100;
  let postureLabel = 'OPTIMAL // DUAL-CLOUD READY';
  let ringColor = '#10b981';
  let badgeClass = 'border-emerald-200 bg-emerald-50 text-emerald-700';

  if (!awsHealthy && activeCloud === 'GCP') {
    resilienceScore = 88;
    postureLabel = 'PROTECTED // FAILOVER ACTIVE';
    ringColor = '#06b6d4';
    badgeClass = 'border-cyan-200 bg-cyan-50 text-cyan-700';
  } else if (!awsHealthy && activeCloud === 'AWS') {
    resilienceScore = 54;
    postureLabel = 'DEGRADED // DETECTING OUTAGE';
    ringColor = '#f43f5e';
    badgeClass = 'border-rose-200 bg-rose-50 text-rose-700';
  } else if (!gcpHealthy) {
    resilienceScore = 76;
    postureLabel = 'WARNING // STANDBY DEGRADED';
    ringColor = '#f59e0b';
    badgeClass = 'border-amber-200 bg-amber-50 text-amber-700';
  }

  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (resilienceScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="card-glass hud-corners flex flex-col justify-between overflow-hidden rounded-2xl p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
            SYS.POSTURE // 01
          </p>
          <h3 className="mt-0.5 text-sm font-bold tracking-tight text-slate-900">
            Resilience &amp; Threat Index
          </h3>
        </div>
        {resilienceScore >= 85 ? (
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
        ) : (
          <ShieldAlert className="h-5 w-5 animate-pulse text-rose-600" />
        )}
      </div>

      <div className="my-4 flex flex-col items-center justify-center">
        <div className="relative flex h-44 w-44 items-center justify-center">
          <svg className="h-44 w-44 -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius + 10}
              fill="none"
              stroke="rgba(148, 163, 184, 0.35)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="rgba(226, 232, 240, 0.95)"
              strokeWidth="10"
            />
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              style={{
                filter: `drop-shadow(0 2px 6px ${ringColor}40)`,
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              SCORE
            </span>
            <motion.span
              key={resilienceScore}
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-mono text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums"
            >
              {resilienceScore}
            </motion.span>
            <span className="font-mono text-[11px] text-slate-500">
              SLA {availability}%
            </span>
          </div>
        </div>

        <span
          className={`mt-1 rounded-md border px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider ${badgeClass}`}
        >
          {postureLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-3 font-mono text-[11px]">
        <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-2.5 py-2">
          <p className="text-[10px] text-slate-500">PRIMARY NODE</p>
          <p className={awsHealthy ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-600'}>
            {awsHealthy ? 'AWS ONLINE' : 'AWS OUTAGE'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-2.5 py-2">
          <p className="text-[10px] text-slate-500">AUTO-FAILOVER</p>
          <p className="font-semibold text-cyan-700">
            {status?.autoFailoverEnabled ? 'ARMED' : 'MANUAL'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
