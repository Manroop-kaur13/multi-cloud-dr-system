import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Play,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { AvailabilityChart } from '../components/AvailabilityChart';
import { CloudNodeCard } from '../components/CloudNodeCard';
import { LatencyChart } from '../components/LatencyChart';

export function CloudMonitoringPage({ status, metrics, apiActions }) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const aws = status?.clouds?.AWS;
  const gcp = status?.clouds?.GCP;
  const autoFailover = Boolean(status?.autoFailoverEnabled);

  const runAction = async (fn, successMsg) => {
    setBusy(true);
    setFeedback(null);
    try {
      await fn();
      setFeedback({ type: 'success', text: successMsg });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-glass rounded-2xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white">
              Simulated Cloud Outage & Probe Controls
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Inject simulated primary cloud failures to observe live health-check detection. Auto-failover triggers after{' '}
              <span className="font-mono font-semibold text-white">{status?.failureThreshold || 2}</span> consecutive failed probes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              disabled={busy}
              onClick={() =>
                runAction(
                  () => apiActions.simulateFailover({ action: 'outage' }),
                  'AWS primary outage injected and probed.'
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/20 px-3.5 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-50"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Simulate AWS Outage
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              disabled={busy}
              onClick={() =>
                runAction(
                  () => apiActions.simulateFailover({ action: 'degrade', latencyMs: 1450 }),
                  'AWS latency degradation injected (1450 ms).'
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3.5 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-50"
            >
              <Gauge className="h-3.5 w-3.5" />
              Simulate High Latency
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              disabled={busy}
              onClick={() =>
                runAction(() => apiActions.runManualHealthCheck(), 'Manual health probe round completed.')
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/20 px-3.5 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/30 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              Run Health Probe Now
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              disabled={busy}
              onClick={() =>
                runAction(
                  () => apiActions.simulateFailover({ action: 'restore_aws' }),
                  'AWS primary simulation reset to HEALTHY.'
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Outage Simulation
            </motion.button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span>
              Automatic Failover on Health Failure:{' '}
              <strong className={autoFailover ? 'text-emerald-300' : 'text-amber-300'}>
                {autoFailover ? 'ENABLED' : 'DISABLED'}
              </strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-slate-400">
              Interval: {(status?.checkIntervalMs || 5000) / 1000}s
            </span>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            disabled={busy}
            onClick={() =>
              runAction(
                () => apiActions.toggleAutoFailover(!autoFailover),
                `Auto-failover ${!autoFailover ? 'enabled' : 'disabled'}.`
              )
            }
            className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-500/40 hover:bg-slate-800"
          >
            {autoFailover ? 'Disable Auto-Failover' : 'Enable Auto-Failover'}
          </motion.button>
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-3 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs ${
                feedback.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{feedback.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CloudNodeCard cloud={aws} isActive={status?.activeCloud === 'AWS'} />
        <CloudNodeCard cloud={gcp} isActive={status?.activeCloud === 'GCP'} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card-glass rounded-2xl p-4">
          <p className="text-xs text-slate-400">AWS Avg Response</p>
          <p className="mt-1 font-mono text-xl font-bold text-amber-300 tabular-nums">
            {metrics?.aws?.avgResponseTimeMs ?? 0} ms
          </p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-xs text-slate-400">AWS Probe Uptime</p>
          <p className="mt-1 font-mono text-xl font-bold text-white tabular-nums">
            {metrics?.aws?.uptimePercent ?? 100}%
          </p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-xs text-slate-400">GCP Avg Response</p>
          <p className="mt-1 font-mono text-xl font-bold text-cyan-300 tabular-nums">
            {metrics?.gcp?.avgResponseTimeMs ?? 0} ms
          </p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-xs text-slate-400">GCP Standby Uptime</p>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-300 tabular-nums">
            {metrics?.gcp?.uptimePercent ?? 100}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LatencyChart series={metrics?.latencySeries || []} />
        <AvailabilityChart series={metrics?.latencySeries || []} />
      </div>

      <div className="card-glass flex items-center gap-2 rounded-2xl p-4 text-xs text-slate-400">
        <Activity className="h-4 w-4 shrink-0 text-cyan-400" />
        <span>
          Load Balancer Health Endpoint ready for AWS ALB &amp; GCP Cloud Load Balancing:{' '}
          <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-cyan-300">GET /api/health</code>
        </span>
      </div>
    </div>
  );
}
