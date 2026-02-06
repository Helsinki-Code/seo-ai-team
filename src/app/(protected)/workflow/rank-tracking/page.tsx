'use client';

import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface RankingData {
  keyword: string;
  currentPosition: number;
  visibility: number;
  estimatedTraffic: number;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
  recommendations: Array<{
    area: string;
    action: string;
    priority: string;
  }>;
}

export default function RankTrackingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const websiteId = searchParams.get('websiteId');

  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!websiteId) {
      router.push('/workflow');
      return;
    }
    fetchRankings();
  }, [websiteId, router]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflow/rank-tracking?websiteId=${websiteId}`);
      if (response.ok) {
        const data = await response.json();
        setRankings(data.rankings || []);
      }
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setCompleting(true);
    setTimeout(() => {
      router.push('/dashboard?workflow=completed');
    }, 500);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-400';
      case 'declining':
        return 'text-red-400';
      default:
        return 'text-neutral-400';
    }
  };

  const getPositionBadgeColor = (position: number) => {
    if (position === 0) return 'bg-gray-500/20 text-gray-300';
    if (position <= 3) return 'bg-green-500/20 text-green-300';
    if (position <= 10) return 'bg-blue-500/20 text-blue-300';
    if (position <= 20) return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-red-500/20 text-red-300';
  };

  const getVisibilityColor = (visibility: number) => {
    if (visibility >= 80) return 'from-green-600 to-emerald-600';
    if (visibility >= 60) return 'from-blue-600 to-cyan-600';
    if (visibility >= 40) return 'from-yellow-600 to-orange-600';
    return 'from-red-600 to-pink-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-black">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Rank Tracking & Monitoring
          </h1>
          <button
            onClick={() => router.push('/workflow')}
            className="text-neutral-400 hover:text-white transition"
          >
            ← Back
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Progress indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">
              Step 5 of 5
            </h2>
            <p className="text-sm text-neutral-500">Rank Tracking</p>
          </div>
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-indigo-600 to-blue-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-neutral-800/20 backdrop-blur border border-neutral-700/30 rounded-lg p-6 animate-pulse h-32"
              />
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-12 bg-neutral-800/20 backdrop-blur border border-neutral-700/30 rounded-lg">
            <p className="text-neutral-400 text-lg">No ranking data available yet. Rankings are tracked continuously.</p>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              {[
                {
                  label: 'Top 3',
                  value: rankings.filter((r) => r.currentPosition > 0 && r.currentPosition <= 3).length,
                  icon: '🥇',
                  color: 'from-green-600 to-emerald-600',
                },
                {
                  label: 'Top 10',
                  value: rankings.filter((r) => r.currentPosition > 0 && r.currentPosition <= 10).length,
                  icon: '🎯',
                  color: 'from-blue-600 to-cyan-600',
                },
                {
                  label: 'Not Ranked',
                  value: rankings.filter((r) => r.currentPosition === 0).length,
                  icon: '❓',
                  color: 'from-neutral-600 to-neutral-700',
                },
                {
                  label: 'Avg Visibility',
                  value: Math.round(rankings.reduce((a, r) => a + r.visibility, 0) / rankings.length) + '%',
                  icon: '👁️',
                  color: 'from-purple-600 to-pink-600',
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${stat.color} rounded-lg p-4 text-white`}
                >
                  <p className="text-2xl mb-2">{stat.icon}</p>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Rankings Cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4 mb-8"
            >
              {rankings.map((ranking, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-gradient-to-r from-neutral-800/30 to-neutral-900/30 backdrop-blur border border-neutral-700/50 rounded-lg p-6 hover:border-indigo-600/30 transition duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{ranking.keyword}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getPositionBadgeColor(ranking.currentPosition)}`}
                        >
                          {ranking.currentPosition === 0 ? 'Not Ranked' : `Position ${ranking.currentPosition}`}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTrendColor(ranking.trend)}`}>
                          {getTrendIcon(ranking.trend)} {ranking.trend}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-500/20 text-indigo-300">
                          Confidence: {ranking.confidence}%
                        </span>
                      </div>
                    </div>
                    {ranking.currentPosition > 0 && ranking.currentPosition <= 10 && (
                      <div className="text-right ml-4">
                        <p className="text-xs text-neutral-400 mb-1">Est. Traffic</p>
                        <p className="text-2xl font-bold text-green-400">{ranking.estimatedTraffic}</p>
                      </div>
                    )}
                  </div>

                  {/* Visibility Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-neutral-400">Visibility</p>
                      <p className="text-sm font-semibold text-white">{ranking.visibility}%</p>
                    </div>
                    <div className="w-full h-2 bg-neutral-700/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ranking.visibility}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
                        className={`h-full bg-gradient-to-r ${getVisibilityColor(ranking.visibility)}`}
                      />
                    </div>
                  </div>

                  {/* Recommendations */}
                  {ranking.recommendations.length > 0 && (
                    <div className="pt-4 border-t border-neutral-700/30">
                      <p className="text-xs font-semibold text-neutral-400 mb-2">Optimization Tips</p>
                      <ul className="space-y-1">
                        {ranking.recommendations.slice(0, 2).map((rec, j) => (
                          <li key={j} className="text-xs text-neutral-300 flex gap-2">
                            <span className="text-indigo-400">→</span>
                            <span>{rec.action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Completion Message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur border border-green-700/50 rounded-lg p-8 text-center"
            >
              <p className="text-2xl mb-2">✅</p>
              <h3 className="text-2xl font-bold text-white mb-2">Workflow Complete!</h3>
              <p className="text-neutral-300 mb-6">
                Your SEO automation workflow is complete. Your content is optimized for {rankings.length} keywords with
                {' '}
                {rankings.filter((r) => r.currentPosition > 0 && r.currentPosition <= 10).length} already in top 10.
              </p>
              <p className="text-sm text-neutral-400">
                Rankings will continue to be monitored 24/7. Check your dashboard for updates and new opportunities.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-4 pt-8"
            >
              <button
                onClick={() => router.push('/workflow/content-generation?websiteId=' + websiteId)}
                className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition font-semibold"
              >
                ← Review Content
              </button>
              <motion.button
                onClick={handleComplete}
                disabled={completing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-lg hover:shadow-indigo-500/50 text-white rounded-lg transition font-semibold disabled:opacity-50"
              >
                {completing ? 'Completing...' : 'Go to Dashboard →'}
              </motion.button>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
