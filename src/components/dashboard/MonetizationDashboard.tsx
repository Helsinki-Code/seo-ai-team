'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface MonetizationData {
  monthly: {
    revenue: number;
    clicks: number;
    conversions: number;
    conversionRate: number;
  };
  annual: { revenue: number };
  bySource: Record<
    string,
    { revenue: number; clicks: number; conversions: number }
  >;
  emailLists: {
    totalSubscribers: number;
    monthlyGrowth: number;
    lists: Array<{
      id: number;
      provider: string;
      subscribers: number;
      growthRate: number;
    }>;
  };
  adSense: { enabled: boolean; publisherId?: string };
  configured: {
    amazon: boolean;
    shareASale: boolean;
    cjAffiliate: boolean;
    clickBank: boolean;
  };
}

export default function MonetizationDashboard({
  websiteId,
}: {
  websiteId: number;
}) {
  const [data, setData] = useState<MonetizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/data/monetization?websiteId=${websiteId}`
        );
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (websiteId) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [websiteId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl"
      >
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-2">
            Monetization Hub
          </h1>
          <p className="text-neutral-400">
            Real-time affiliate revenue and earnings tracking
          </p>
        </div>
        {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
      </motion.div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 p-6 backdrop-blur-md transition"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-neutral-400 text-sm mb-1">
                      Monthly Revenue
                    </p>
                    <h3 className="text-3xl font-light text-white">
                      ${data.monthly.revenue.toLocaleString('en-US', {
                        maximumFractionDigits: 0,
                      })}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Active monetization</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 p-6 backdrop-blur-md transition"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-neutral-400 text-sm mb-1">
                      Annual Revenue
                    </p>
                    <h3 className="text-3xl font-light text-white">
                      ${data.annual.revenue.toLocaleString('en-US', {
                        maximumFractionDigits: 0,
                      })}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
                <p className="text-sm text-neutral-400">
                  Projected yearly earnings
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 p-6 backdrop-blur-md transition"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-neutral-400 text-sm mb-1">
                      Email Subscribers
                    </p>
                    <h3 className="text-3xl font-light text-white">
                      {data.emailLists.totalSubscribers.toLocaleString()}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    +{data.emailLists.monthlyGrowth} this month
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Revenue by Source */}
          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-neutral-700 bg-neutral-800/50 backdrop-blur-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-neutral-700">
              <h2 className="text-lg font-medium text-white">
                Revenue Streams
              </h2>
            </div>
            <div className="divide-y divide-neutral-700">
              {Object.entries(data.bySource).map(([source, metrics]) => (
                <motion.div
                  key={source}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-6 py-4 flex items-center justify-between group hover:bg-neutral-700/30 transition"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl">
                      {source === 'amazon'
                        ? '🛍️'
                        : source === 'shareasale'
                        ? '📊'
                        : source === 'clickbank'
                        ? '⚡'
                        : '🔗'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white capitalize">
                        {source.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <p className="text-sm text-neutral-400">
                        {metrics.conversions} conversions from{' '}
                        {metrics.clicks} clicks
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-light text-white mb-1">
                      ${metrics.revenue.toLocaleString('en-US', {
                        maximumFractionDigits: 0,
                      })}
                    </div>
                    <div className="text-sm text-neutral-400">
                      {metrics.clicks > 0
                        ? (
                            (metrics.conversions / metrics.clicks) *
                            100
                          ).toFixed(1)
                        : 0}
                      % CR
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Email Lists */}
          {data.emailLists.lists.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {data.emailLists.lists.map((list) => (
                <div
                  key={list.id}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 p-6 backdrop-blur-md transition hover:border-blue-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-white capitalize mb-1">
                          {list.provider}
                        </h3>
                        <p className="text-sm text-neutral-400">
                          Email list provider
                        </p>
                      </div>
                      <div className="text-3xl">📧</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-neutral-400 mb-1">
                          Subscribers
                        </p>
                        <p className="text-lg font-light text-white">
                          {list.subscribers.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-400 mb-1">
                          Monthly Growth
                        </p>
                        <p className="text-lg font-light text-white">
                          +{list.growthRate}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Configured Networks */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { name: 'Amazon', enabled: data.configured.amazon },
              { name: 'ShareASale', enabled: data.configured.shareASale },
              { name: 'CJ Affiliate', enabled: data.configured.cjAffiliate },
              { name: 'ClickBank', enabled: data.configured.clickBank },
            ].map((network) => (
              <div
                key={network.name}
                className={`p-4 rounded-lg border transition ${
                  network.enabled
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-neutral-700/20 border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {network.enabled ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-neutral-400" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      network.enabled
                        ? 'text-green-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    {network.name}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  {network.enabled ? 'Connected' : 'Not connected'}
                </p>
              </div>
            ))}
          </motion.div>
        </>
      ) : null}
    </div>
  );
}
