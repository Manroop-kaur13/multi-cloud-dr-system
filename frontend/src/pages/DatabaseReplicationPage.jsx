import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Database,
  HardDrive,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export function DatabaseReplicationPage({ replicationData, apiActions }) {
  const [recordKey, setRecordKey] = useState('');
  const [payloadText, setPayloadText] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const db = replicationData?.databaseConnection || {};
  const rep = replicationData?.replication || {};
  const storage = replicationData?.objectStorage || {};
  const records = replicationData?.recentRecords || [];

  const handleSync = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await apiActions.triggerReplicationSync();
      setFeedback({ type: 'success', text: 'PostgreSQL replication & object storage sync completed.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleInsertSample = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await apiActions.createSampleRecord({
        recordKey: recordKey.trim() || undefined,
        payload: payloadText.trim() || undefined,
      });
      setRecordKey('');
      setPayloadText('');
      setFeedback({ type: 'success', text: 'Sample transaction committed and replicated.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <motion.div whileHover={{ y: -2 }} className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Database Connection
            </span>
            <StatusBadge value={db.connected ? 'ONLINE' : 'OFFLINE'} />
          </div>
          <p className="mt-2 text-base font-bold text-white">{db.engineLabel || 'PostgreSQL'}</p>
          <p className="mt-1 font-mono text-xs text-slate-400">
            Host: {db.host || 'localhost'} • DB: {db.database || 'multicloud_dr'}
          </p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Primary DB (AWS RDS)
            </span>
            <StatusBadge value={rep.primaryDbStatus || 'ONLINE'} />
          </div>
          <p className="mt-2 text-base font-bold text-white">Read / Write Primary</p>
          <p className="mt-1 text-xs text-slate-400">
            Mode:{' '}
            <span className="font-mono text-slate-300">
              {rep.replicationMode || 'ASYNC_STREAMING_SIM'}
            </span>
          </p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Secondary DB (GCP Cloud SQL)
            </span>
            <StatusBadge value={rep.secondaryDbStatus || 'STANDBY_SYNCED'} />
          </div>
          <p className="mt-2 text-base font-bold text-white">
            {rep.secondaryDbStatus === 'PROMOTED' ? 'Promoted Active Primary' : 'Warm Replica Standby'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Synced: <strong className="font-mono text-white">{rep.recordsSynced ?? 0}</strong> • Pending WAL:{' '}
            <strong className="font-mono text-amber-300">{rep.pendingWalRecords ?? 0}</strong>
          </p>
        </motion.div>
      </div>

      <div className="card-glass rounded-2xl p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">Simulated Replication Lag</p>
              <p className="mt-1 font-mono text-2xl font-bold text-cyan-300 tabular-nums">
                {rep.lagMs ?? 0} ms
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Estimated RPO</p>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-300 tabular-nums">
                {rep.estimatedRpoSeconds ?? 0} s
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Last Synchronization</p>
              <p className="mt-1 font-mono text-sm font-semibold text-white">
                {rep.lastSyncAt ? new Date(rep.lastSyncAt).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            disabled={busy}
            onClick={handleSync}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:bg-cyan-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
            Trigger Replication Sync
          </motion.button>
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-4 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs ${
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <form onSubmit={handleInsertSample} className="card-glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold tracking-tight text-white">Live Data Replication Demo</h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Write a sample transaction to the currently active cloud database and verify cross-cloud replication status.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={recordKey}
              onChange={(e) => setRecordKey(e.target.value)}
              placeholder="Record Key (optional, e.g. TXN-2050)"
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <input
              type="text"
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              placeholder='JSON or note (e.g. {"order":512})'
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none sm:col-span-2"
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/35 bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Write &amp; Replicate Sample Record
          </motion.button>
        </form>

        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold tracking-tight text-white">Object Storage Sync</h3>
            </div>
            <StatusBadge value={storage.syncStatus || 'SYNCED'} />
          </div>
          <p className="mt-3 text-xs text-slate-400">Source Bucket</p>
          <p className="truncate font-mono text-xs text-amber-300">{storage.sourceBucket}</p>
          <p className="mt-2 text-xs text-slate-400">Standby Bucket</p>
          <p className="truncate font-mono text-xs text-cyan-300">{storage.targetBucket}</p>
          <p className="mt-3 text-xs text-slate-300">
            Objects Mirrored: <strong className="font-mono">{storage.objectsSynced ?? 0}</strong>
          </p>
        </div>
      </div>

      <div className="card-glass rounded-2xl p-5">
        <h3 className="mb-3 text-sm font-bold tracking-tight text-white">
          Replicated Application Records ({records.length} recent)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-3 font-semibold">Record Key</th>
                <th className="pb-3 font-semibold">Origin Cloud</th>
                <th className="pb-3 font-semibold">Payload</th>
                <th className="pb-3 font-semibold">Primary DB</th>
                <th className="pb-3 font-semibold">Secondary DB</th>
                <th className="pb-3 font-semibold">Replicated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {records.map((rec) => (
                <motion.tr
                  key={rec.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hover:bg-slate-900/40"
                >
                  <td className="py-3 font-mono font-semibold text-white">{rec.record_key}</td>
                  <td className="py-3 font-semibold text-cyan-300">{rec.source_cloud}</td>
                  <td className="max-w-md truncate py-3 font-mono text-slate-300">{rec.payload}</td>
                  <td className="py-3">
                    <StatusBadge value={rec.primary_synced ? 'SYNCED' : 'PENDING'} />
                  </td>
                  <td className="py-3">
                    <StatusBadge value={rec.secondary_synced ? 'SYNCED' : 'PENDING'} />
                  </td>
                  <td className="py-3 font-mono text-slate-400">
                    {rec.replicated_at ? new Date(rec.replicated_at).toLocaleTimeString() : 'Queued WAL'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
