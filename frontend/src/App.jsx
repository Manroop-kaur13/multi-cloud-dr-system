import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { usePolling } from './hooks/usePolling';
import { CloudMonitoringPage } from './pages/CloudMonitoringPage';
import { DashboardPage } from './pages/DashboardPage';
import { DatabaseReplicationPage } from './pages/DatabaseReplicationPage';
import { DisasterRecoveryPage } from './pages/DisasterRecoveryPage';
import { EventLogsPage } from './pages/EventLogsPage';
import { drApi } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const [status, metrics, replication, events] = await Promise.all([
      drApi.getStatus(),
      drApi.getMetrics(30),
      drApi.getReplication(),
      drApi.getEvents({ limit: 80 }),
    ]);
    return { status, metrics, replication, events };
  }, []);

  const { data, loading, error, refresh } = usePolling(fetchAll, 2500);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const apiActions = {
    simulateFailover: async (payload) => {
      const res = await drApi.simulateFailover(payload);
      await refresh();
      return res;
    },
    recoverPrimary: async (payload) => {
      const res = await drApi.recoverPrimary(payload);
      await refresh();
      return res;
    },
    runManualHealthCheck: async () => {
      const res = await drApi.runManualHealthCheck();
      await refresh();
      return res;
    },
    toggleAutoFailover: async (enabled) => {
      const res = await drApi.toggleAutoFailover(enabled);
      await refresh();
      return res;
    },
    triggerReplicationSync: async () => {
      const res = await drApi.triggerReplicationSync();
      await refresh();
      return res;
    },
    createSampleRecord: async (payload) => {
      const res = await drApi.createSampleRecord(payload);
      await refresh();
      return res;
    },
  };

  const status = data?.status;
  const metrics = data?.metrics;
  const replication = data?.replication;
  const events = data?.events;

  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-obsidian text-slate-100">
      {/* Subtle Ambient Enterprise SOC Backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden bg-jitter-grid opacity-30" />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-float-slow absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="animate-float-slow absolute right-0 top-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-[130px]" />
      </div>

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        status={status}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Header
          activePage={activePage}
          status={status}
          onRefresh={handleManualRefresh}
          refreshing={refreshing || loading}
        />

        <main className="flex-1 p-4 sm:p-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>Backend API connection warning: {error}. Retrying automatically...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              {activePage === 'dashboard' && (
                <DashboardPage status={status} metrics={metrics} onNavigate={setActivePage} />
              )}
              {activePage === 'monitoring' && (
                <CloudMonitoringPage status={status} metrics={metrics} apiActions={apiActions} />
              )}
              {activePage === 'disaster-recovery' && (
                <DisasterRecoveryPage status={status} apiActions={apiActions} />
              )}
              {activePage === 'replication' && (
                <DatabaseReplicationPage replicationData={replication} apiActions={apiActions} />
              )}
              {activePage === 'events' && <EventLogsPage eventsData={events} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
