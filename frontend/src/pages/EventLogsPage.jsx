import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, ScrollText, Search } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

const EVENT_TYPES = [
  'ALL',
  'HEALTH_CHECK_FAILURE',
  'HEALTH_CHECK_RECOVERY',
  'OUTAGE_SIMULATED',
  'FAILOVER',
  'RECOVERY',
  'REPLICATION_SYNC',
  'SYSTEM_INFO',
];

const SEVERITIES = ['ALL', 'INFO', 'SUCCESS', 'WARNING', 'CRITICAL'];

export function EventLogsPage({ eventsData }) {
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  const events = eventsData?.events || [];

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((ev) => {
      if (typeFilter !== 'ALL' && ev.event_type !== typeFilter) return false;
      if (severityFilter !== 'ALL' && ev.severity !== severityFilter) return false;
      if (
        q &&
        !ev.message.toLowerCase().includes(q) &&
        !ev.source.toLowerCase().includes(q) &&
        !ev.event_type.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [events, typeFilter, severityFilter, query]);

  return (
    <div className="space-y-6">
      <div className="card-glass rounded-2xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold tracking-tight text-white">
              Filter System &amp; Failover Events
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search message or source..."
                className="rounded-xl border border-slate-700 bg-slate-900 py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  Type: {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Jitter-inspired Segmented Severity Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/70 p-1.5 w-fit">
          {SEVERITIES.map((sev) => {
            const active = severityFilter === sev;
            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`relative rounded-lg px-3 py-1 text-[11px] font-semibold transition-colors ${
                  active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="severityPill"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-lg border border-cyan-500/35 bg-cyan-500/20"
                  />
                )}
                <span className="relative z-10">{sev}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card-glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold tracking-tight text-white">
              Event Audit Stream ({filteredEvents.length})
            </h3>
          </div>
        </div>

        <div className="max-h-[640px] space-y-2.5 overflow-y-auto pr-1 scrollbar-thin">
          {filteredEvents.length === 0 ? (
            <p className="text-xs text-slate-400">No events match the selected filters.</p>
          ) : (
            filteredEvents.map((ev, index) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.25) }}
                className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3.5 transition hover:border-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={ev.severity} />
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-300">
                      {ev.event_type}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">{ev.source}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(ev.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-200">{ev.message}</p>
                {ev.metadata_json && (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950/80 px-3 py-1.5 font-mono text-[11px] text-slate-400">
                    {ev.metadata_json}
                  </pre>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
