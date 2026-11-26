import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export function FailoverStepper({ failover }) {
  const steps = failover?.steps || [];
  const progress = failover?.progressPercent || 0;

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white">
            Failover & Recovery Execution Pipeline
          </h3>
          <p className="text-xs text-slate-400">{failover?.currentAction || 'Standing by'}</p>
        </div>
        <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-sm font-bold text-cyan-300 tabular-nums">
          {progress}%
        </span>
      </div>

      <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400"
        >
          {failover?.inProgress && (
            <div className="animate-shimmer-slide absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          )}
        </motion.div>
      </div>

      {steps.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
          No failover or recovery transition triggered yet in this session. Simulate an AWS outage or trigger failover to watch the choreographed orchestration steps execute.
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {steps.map((step, index) => {
            const done = step.status === 'COMPLETED';
            const active = step.status === 'IN_PROGRESS';
            return (
              <motion.div
                key={step.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs transition-colors ${
                  done
                    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                    : active
                      ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100 shadow-sm shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  {done ? (
                    <motion.div
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    </motion.div>
                  ) : active ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-300" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-slate-600" />
                  )}
                  <span className="font-medium">
                    {index + 1}. {step.label}
                  </span>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-wider">{step.status}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
