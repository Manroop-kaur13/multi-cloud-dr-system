import { motion } from 'framer-motion';

export function StatusCard({ title, value, subtitle, icon: Icon, accent = 'cyan', badge, index = 0 }) {
  const accentClasses = {
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };

  const glowColor = {
    cyan: 'from-cyan-400/15',
    emerald: 'from-emerald-400/15',
    amber: 'from-amber-400/15',
    rose: 'from-rose-400/15',
    indigo: 'from-indigo-400/15',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="card-glass overflow-hidden rounded-2xl p-5"
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${
          glowColor[accent] || glowColor.cyan
        } to-transparent blur-2xl`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            0{index + 1} // {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <motion.span
              key={String(value)}
              initial={{ opacity: 0.5, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums"
            >
              {value}
            </motion.span>
          </div>
        </div>
        {Icon && (
          <div className={`rounded-xl border p-2.5 ${accentClasses[accent] || accentClasses.cyan}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="relative mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{subtitle}</p>
        {badge}
      </div>
    </motion.div>
  );
}
