"use client";

import { motion } from "framer-motion";

export function SkeletonLoader() {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="h-20 bg-gradient-to-r from-neutral-800/50 via-neutral-700/30 to-neutral-800/50 rounded-xl overflow-hidden"
          animate={{ backgroundPosition: ["0% center", "100% center"] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            backgroundSize: "200% 100%",
            backgroundPosition: "0% center",
          }}
        />
      ))}
    </motion.div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

export function MetricCard({ label, value, change, icon, isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="p-6 rounded-xl bg-neutral-900/40 border border-neutral-800">
        <div className="h-4 bg-neutral-800 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-neutral-800 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-6 rounded-xl bg-gradient-to-br from-neutral-900/60 to-neutral-950/40 border border-neutral-800/50 hover:border-neutral-700/50 transition-colors backdrop-blur-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm font-medium text-neutral-400 uppercase tracking-tight">
          {label}
        </div>
        <div className="text-2xl opacity-60">{icon}</div>
      </div>
      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-light tracking-tight text-white">
          {value}
        </div>
        {change && (
          <div className={`text-sm font-medium ${
            change.startsWith("+") ? "text-emerald-400" : "text-red-400"
          }`}>
            {change}
          </div>
        )}
      </div>
    </motion.div>
  );
}
