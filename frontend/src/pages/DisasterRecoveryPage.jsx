import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertOctagon,
  ArrowLeftRight,
  CheckCircle2,
  Cloud,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { FailoverStepper } from '../components/FailoverStepper';
import { StatusBadge } from '../components/StatusBadge';

export function DisasterRecoveryPage({ status, apiActions }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const activeCloud = status?.activeCloud || 'AWS';
  const failover = status?.failover || {};
  const timeline = status?.failoverTimeline || [];

  const handleAction = async (fn, message) => {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
      setNotice({ type: 'success', text: message });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Traffic Serving Node
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="relative">
                  <span
                    className={`animate-radar-ring absolute inset-0 rounded-xl ${
                      activeCloud === 'AWS' ? 'bg-amber-400/20' : 'bg-cyan-400/25'
                    }`}
                  />
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-xl border ${
                      activeCloud === 'AWS'
                        ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                        : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                    }`}
                  >
                    <Cloud className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    {activeCloud === 'AWS'
                      ? 'AWS Primary (us-east-1)'
                      : 'GCP Warm Standby Promoted (us-central1)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Endpoint:{' '}
                    <span className="font-mono text-slate-300">
                      {status?.clouds?.[activeCloud]?.endpoint}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <StatusBadge value={failover.status || 'NORMAL'} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              disabled={busy || failover.inProgress || activeCloud === 'GCP'}
              onClick={() =>
                handleAction(
                  () => apiActions.simulateFailover({ action: 'immediate_failover' }),
                  'Simulated AWS outage and executed failover to GCP standby.'
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <AlertOctagon className="h-4 w-4" />
              Simulate Outage &amp; Failover to GCP
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              disabled={busy || failover.inProgress || activeCloud === 'AWS'}
              onClick={() =>
                handleAction(
                  () => apiActions.recoverPrimary(),
                  'Primary AWS cloud restored and traffic failed back to AWS us-east-1.'
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <RefreshCw className="h-4 w-4" />
              Restore Primary Cloud (AWS)
            </motion.button>
          </div>

          <AnimatePresence>
            {notice && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
                  notice.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{notice.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="card-glass flex flex-col justify-between rounded-2xl p-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              Auto-Detection Threshold
            </div>
            <p className="mt-3 font-mono text-2xl font-bold text-white tabular-nums">
              {status?.clouds?.AWS?.consecutiveFailures ?? 0} / {status?.failureThreshold ?? 2}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Consecutive AWS health-check failures before automatic DNS cutover
            </p>
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Last Failover:</span>
              <span className="font-mono text-slate-200">
                {failover.lastFailoverAt
                  ? new Date(failover.lastFailoverAt).toLocaleTimeString()
                  : 'None yet'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Recovery:</span>
              <span className="font-mono text-slate-200">
                {failover.lastRecoveryAt
                  ? new Date(failover.lastRecoveryAt).toLocaleTimeString()
                  : 'None yet'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <FailoverStepper failover={failover} />

      <div className="card-glass rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-tight text-white">
            Failover &amp; Recovery Audit History
          </h3>
        </div>

        {timeline.length === 0 ? (
          <p className="text-xs text-slate-400">
            No failover or recovery records logged yet. Trigger a failover simulation above to record timestamps and RTO metrics.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-semibold">Event Type</th>
                  <th className="pb-3 font-semibold">Transition</th>
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">RTO</th>
                  <th className="pb-3 font-semibold">Started</th>
                  <th className="pb-3 font-semibold">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {timeline.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-900/40"
                  >
                    <td className="py-3 font-mono font-semibold text-white">{item.event_type}</td>
                    <td className="py-3 font-medium text-cyan-300">
                      {item.from_cloud} -&gt; {item.to_cloud}
                    </td>
                    <td className="max-w-xs truncate py-3 text-slate-300">{item.trigger_reason}</td>
                    <td className="py-3">
                      <StatusBadge value={item.status} />
                    </td>
                    <td className="py-3 font-mono text-emerald-300 tabular-nums">
                      {item.rto_achieved_seconds ? `${item.rto_achieved_seconds}s` : '—'}
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {new Date(item.started_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {item.completed_at ? new Date(item.completed_at).toLocaleTimeString() : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
