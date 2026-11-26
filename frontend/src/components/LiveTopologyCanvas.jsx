import { motion } from 'framer-motion';
import { Cloud, Database, Globe, Shield, Zap } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export function LiveTopologyCanvas({ status, onOpenFailover }) {
  const activeCloud = status?.activeCloud || 'AWS';
  const aws = status?.clouds?.AWS || {};
  const gcp = status?.clouds?.GCP || {};
  const awsHealthy = aws.status !== 'UNHEALTHY';
  const isAwsActive = activeCloud === 'AWS';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="card-glass hud-corners overflow-hidden rounded-2xl p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              NET.MESH // 02
            </span>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-emerald-300">
              TLS 1.3 • ENCRYPTED
            </span>
          </div>
          <h3 className="mt-0.5 text-sm font-bold tracking-tight text-white">
            Multi-Cloud Traffic Routing &amp; Replication Topology
          </h3>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={onOpenFailover}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-3.5 py-1.5 font-mono text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
        >
          <Zap className="h-3.5 w-3.5" />
          FAILOVER CONSOLE
        </motion.button>
      </div>

      {/* Tactical Cyber-SOC Network Canvas */}
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-800/90 bg-[#05080f] bg-soc-dots p-4 sm:p-6">
        {/* Subtle Horizontal Radar Scan Sweep */}
        <div className="animate-scan-sweep pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-transparent via-emerald-400/5 to-transparent" />

        <svg
          viewBox="0 0 900 250"
          className="pointer-events-none hidden h-56 w-full lg:block"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="socGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            id="path-dns-aws"
            d="M 190 125 C 270 125, 290 55, 370 55"
            fill="none"
            stroke={isAwsActive && awsHealthy ? '#00f5a0' : awsHealthy ? '#475569' : '#ff3b5c'}
            strokeWidth={isAwsActive ? '2.5' : '1.5'}
            className={isAwsActive && awsHealthy ? 'animate-dash-flow' : 'animate-dash-slow'}
            opacity={isAwsActive ? 0.95 : 0.45}
          />

          <path
            id="path-dns-gcp"
            d="M 190 125 C 270 125, 290 195, 370 195"
            fill="none"
            stroke={!isAwsActive ? '#00d9f5' : '#334155'}
            strokeWidth={!isAwsActive ? '2.75' : '1.5'}
            className={!isAwsActive ? 'animate-dash-flow' : 'animate-dash-slow'}
            opacity={!isAwsActive ? 0.95 : 0.45}
          />

          <path
            id="path-aws-db"
            d="M 555 55 C 630 55, 650 125, 720 125"
            fill="none"
            stroke={awsHealthy ? '#00f5a0' : '#ff3b5c'}
            strokeWidth={isAwsActive && awsHealthy ? '2.25' : '1.5'}
            className={awsHealthy ? 'animate-dash-slow' : ''}
            strokeDasharray={awsHealthy ? undefined : '4 6'}
            opacity={awsHealthy ? 0.85 : 0.4}
          />

          <path
            id="path-gcp-db"
            d="M 555 195 C 630 195, 650 125, 720 125"
            fill="none"
            stroke={!isAwsActive ? '#00d9f5' : '#10b981'}
            strokeWidth={!isAwsActive ? '2.5' : '1.5'}
            className="animate-dash-flow"
            opacity={!isAwsActive ? 0.95 : 0.55}
          />

          <line
            x1="462"
            y1="92"
            x2="462"
            y2="158"
            stroke="#00d9f5"
            strokeWidth="1.5"
            className="animate-dash-slow"
            opacity="0.65"
          />

          {isAwsActive && awsHealthy && (
            <>
              <circle r="4.5" fill="#00f5a0" filter="url(#socGlow)">
                <animateMotion dur="1.6s" repeatCount="indefinite">
                  <mpath href="#path-dns-aws" />
                </animateMotion>
              </circle>
              <circle r="4" fill="#00d9f5" filter="url(#socGlow)">
                <animateMotion dur="2s" repeatCount="indefinite" begin="0.35s">
                  <mpath href="#path-aws-db" />
                </animateMotion>
              </circle>
            </>
          )}

          {!isAwsActive && (
            <>
              <circle r="5" fill="#00d9f5" filter="url(#socGlow)">
                <animateMotion dur="1.4s" repeatCount="indefinite">
                  <mpath href="#path-dns-gcp" />
                </animateMotion>
              </circle>
              <circle r="4.5" fill="#00f5a0" filter="url(#socGlow)">
                <animateMotion dur="1.7s" repeatCount="indefinite" begin="0.3s">
                  <mpath href="#path-gcp-db" />
                </animateMotion>
              </circle>
            </>
          )}
        </svg>

        <div className="relative z-10 grid grid-cols-1 gap-4 lg:pointer-events-none lg:absolute lg:inset-6 lg:grid-cols-12 lg:items-center">
          {/* Tier 1: Edge Gateway */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="pointer-events-auto rounded-xl border border-slate-700/80 bg-[#0b101b]/95 p-3.5 shadow-xl lg:col-span-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  INGRESS // WAF
                </p>
                <p className="text-xs font-bold text-white">Edge DNS Router</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-mono text-[11px]">
              <span className="text-slate-500">ROUTE</span>
              <span className={isAwsActive ? 'font-semibold text-emerald-300' : 'font-semibold text-cyan-300'}>
                {isAwsActive ? 'AWS us-east-1' : 'GCP us-central1'}
              </span>
            </div>
          </motion.div>

          {/* Tier 2: Dual Cloud Perimeter */}
          <div className="pointer-events-auto flex flex-col justify-between gap-4 lg:col-span-6 lg:h-full lg:px-8">
            <motion.div
              animate={{
                borderColor: !awsHealthy
                  ? 'rgba(255, 59, 92, 0.75)'
                  : isAwsActive
                    ? 'rgba(0, 245, 160, 0.6)'
                    : 'rgba(51, 65, 85, 0.7)',
              }}
              className="rounded-xl border bg-[#0b101b]/95 p-3 shadow-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-300" />
                  <span className="text-xs font-bold text-white">AWS Primary Node</span>
                </div>
                <StatusBadge value={aws.status || 'HEALTHY'} />
              </div>
              <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-slate-400">
                <span>{aws.region || 'us-east-1'}</span>
                <span className="text-slate-200 tabular-nums">{aws.responseTimeMs ?? 42} ms</span>
              </div>
            </motion.div>

            <motion.div
              animate={{
                borderColor: !isAwsActive
                  ? 'rgba(0, 217, 245, 0.75)'
                  : 'rgba(51, 65, 85, 0.7)',
              }}
              className="rounded-xl border bg-[#0b101b]/95 p-3 shadow-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-cyan-300" />
                  <span className="text-xs font-bold text-white">
                    {isAwsActive ? 'GCP Warm Standby' : 'GCP Active Primary'}
                  </span>
                </div>
                <StatusBadge value={gcp.status || 'HEALTHY'} />
              </div>
              <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-slate-400">
                <span>{gcp.region || 'us-central1'}</span>
                <span className="text-slate-200 tabular-nums">{gcp.responseTimeMs ?? 58} ms</span>
              </div>
            </motion.div>
          </div>

          {/* Tier 3: Encrypted PostgreSQL Cluster */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="pointer-events-auto rounded-xl border border-emerald-500/35 bg-[#0b101b]/95 p-3.5 shadow-xl lg:col-span-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  VAULT // WAL
                </p>
                <p className="text-xs font-bold text-white">PostgreSQL Sync</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-mono text-[11px]">
              <span className="text-slate-500">RPO</span>
              <span className="font-semibold text-emerald-300 tabular-nums">
                {status?.failover?.lastRpoSeconds ?? 0.25}s
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
