import { motion } from 'framer-motion';
import {
  Activity,
  Clock,
  Cloud,
  Database,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { AvailabilityChart } from '../components/AvailabilityChart';
import { CloudNodeCard } from '../components/CloudNodeCard';
import { LatencyChart } from '../components/LatencyChart';
import { LiveTopologyCanvas } from '../components/LiveTopologyCanvas';
import { ResilienceScoreGauge } from '../components/ResilienceScoreGauge';
import { StatusBadge } from '../components/StatusBadge';
import { StatusCard } from '../components/StatusCard';

export function DashboardPage({ status, metrics, onNavigate }) {
  const aws = status?.clouds?.AWS;
  const gcp = status?.clouds?.GCP;
  const activeCloud = status?.activeCloud || 'AWS';
  const failover = status?.failover;
  const recentEvents = status?.recentEvents || [];

  const rtoDisplay = failover?.lastRtoSeconds
    ? `${failover.lastRtoSeconds}s / ${status?.rtoTargetSeconds || 15}s`
    : `< ${status?.rtoTargetSeconds || 15}s target`;

  const rpoDisplay =
    failover?.lastRpoSeconds !== null && failover?.lastRpoSeconds !== undefined
      ? `${failover.lastRpoSeconds}s / ${status?.rpoTargetSeconds || 5}s`
      : `< ${status?.rpoTargetSeconds || 5}s target`;

  return (
    <div className="space-y-6">
      {/* SOC Command Hero: Resilience Posture Ring + Animated Mesh Topology */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <ResilienceScoreGauge status={status} metrics={metrics} />
        </div>
        <div className="xl:col-span-8">
          <LiveTopologyCanvas
            status={status}
            onOpenFailover={() => onNavigate('disaster-recovery')}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          index={0}
          title="System Availability"
          value={`${metrics?.overallAvailabilityPercent ?? 100}%`}
          subtitle="Continuous multi-cloud service SLA"
          icon={ShieldCheck}
          accent="emerald"
          badge={<StatusBadge value="HEALTHY" label="SLA OK" />}
        />
        <StatusCard
          index={1}
          title="Active Cloud"
          value={activeCloud === 'AWS' ? 'AWS Primary' : 'GCP Standby'}
          subtitle={
            activeCloud === 'AWS'
              ? `Serving via ${aws?.region || 'us-east-1'}`
              : `Failover active on ${gcp?.region || 'us-central1'}`
          }
          icon={Cloud}
          accent={activeCloud === 'AWS' ? 'emerald' : 'cyan'}
          badge={<StatusBadge value={failover?.status || 'NORMAL'} />}
        />
        <StatusCard
          index={2}
          title="Recovery Time (RTO)"
          value={rtoDisplay}
          subtitle="Detected outage to standby cutover"
          icon={Timer}
          accent="indigo"
        />
        <StatusCard
          index={3}
          title="Recovery Point (RPO)"
          value={rpoDisplay}
          subtitle="Simulated async replication window"
          icon={Database}
          accent="cyan"
        />
      </div>

      {/* Cloud Provider Perimeter Cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CloudNodeCard cloud={aws} isActive={activeCloud === 'AWS'} />
        <CloudNodeCard cloud={gcp} isActive={activeCloud === 'GCP'} />
      </div>

      {/* Telemetry Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LatencyChart series={metrics?.latencySeries || []} />
        <AvailabilityChart series={metrics?.latencySeries || []} />
      </div>

      {/* Recent System Events */}
      <div className="card-glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-tight text-white">Recent System &amp; Security Events</h3>
          </div>
          <motion.button
            type="button"
            whileHover={{ x: 2 }}
            onClick={() => onNavigate('events')}
            className="font-mono text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            OPEN AUDIT LOGS -&gt;
          </motion.button>
        </div>

        <div className="space-y-2.5">
          {recentEvents.length === 0 ? (
            <p className="text-xs text-slate-400">No system events recorded yet.</p>
          ) : (
            recentEvents.map((ev, idx) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3">
                  <StatusBadge value={ev.severity} />
                  <div>
                    <p className="text-xs font-medium text-slate-200">{ev.message}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                      {ev.event_type} • {ev.source}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 whitespace-nowrap font-mono text-[11px] text-slate-400">
                  <Clock className="h-3 w-3" />
                  {new Date(ev.created_at).toLocaleTimeString()}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
