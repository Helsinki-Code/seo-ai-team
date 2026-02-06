'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Mail,
  Eye,
  Pointer,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  SmilePlus,
  ThumbsDown,
  Minus,
  Loader2,
} from 'lucide-react';

interface EmailMetrics {
  total: number;
  delivered: number;
  deliveryRate: number;
  opened: number;
  openRate: number;
  clicked: number;
  clickRate: number;
  replied: number;
  replyRate: number;
}

interface RecentEmail {
  id: number;
  recipient: string;
  subject: string;
  status: string;
  sent: string;
  opened: string | null;
  clicked: string | null;
  reply: string | null;
  sentiment: string | null;
}

interface EmailTrackingData {
  type: string;
  metrics: EmailMetrics;
  sentiment: Record<string, number>;
  recent: RecentEmail[];
}

export default function EmailTrackingDashboard({
  websiteId,
  type = 'outreach',
}: {
  websiteId: number;
  type?: 'outreach' | 'newsletter';
}) {
  const [data, setData] = useState<EmailTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingType, setTrackingType] = useState<'outreach' | 'newsletter'>(
    type
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/data/email-tracking?websiteId=${websiteId}&type=${trackingType}`
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
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [websiteId, trackingType]);

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

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return (
          <SmilePlus className="w-4 h-4 text-green-400" />
        );
      case 'negative':
        return (
          <ThumbsDown className="w-4 h-4 text-red-400" />
        );
      case 'neutral':
        return (
          <Minus className="w-4 h-4 text-neutral-400" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-2">
            Email Tracking
          </h1>
          <p className="text-neutral-400">
            Real-time open, click, and engagement tracking
          </p>
        </div>
        {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
      </motion.div>

      {/* Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-4 mb-8"
      >
        {['outreach', 'newsletter'].map((t) => (
          <button
            key={t}
            onClick={() => setTrackingType(t as 'outreach' | 'newsletter')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              trackingType === t
                ? 'bg-blue-600/30 border border-blue-500/50 text-blue-300'
                : 'bg-neutral-800/50 border border-neutral-700 text-neutral-400 hover:text-neutral-300'
            }`}
          >
            {t === 'outreach' ? 'Guest Post Outreach' : 'Newsletter'}
          </button>
        ))}
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: 'Sent',
            value: data.metrics.total,
            icon: Mail,
            color: 'blue',
          },
          {
            label: 'Opened',
            value: `${data.metrics.openRate.toFixed(1)}%`,
            subtext: `${data.metrics.opened}/${data.metrics.total}`,
            icon: Eye,
            color: 'cyan',
          },
          {
            label: 'Clicked',
            value: `${data.metrics.clickRate.toFixed(1)}%`,
            subtext: `${data.metrics.clicked}/${data.metrics.total}`,
            icon: Pointer,
            color: 'purple',
          },
          {
            label: 'Replied',
            value: `${data.metrics.replyRate.toFixed(1)}%`,
            subtext: `${data.metrics.replied}/${data.metrics.total}`,
            icon: MessageCircle,
            color: 'green',
          },
        ].map((metric, idx) => {
          const Icon = metric.icon;
          const colorMap: Record<string, string> = {
            blue: '#3b82f6',
            cyan: '#06b6d4',
            purple: '#a855f7',
            green: '#22c55e',
          };

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700 hover:border-neutral-600 transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  className="w-4 h-4"
                  style={{ color: colorMap[metric.color] }}
                />
                <span className="text-xs font-medium text-neutral-400">
                  {metric.label}
                </span>
              </div>
              <p className="text-2xl font-light text-white">
                {metric.value}
              </p>
              {metric.subtext && (
                <p className="text-xs text-neutral-500 mt-1">
                  {metric.subtext}
                </p>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Sentiment Analysis */}
      {Object.keys(data.sentiment).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-neutral-700 bg-neutral-800/50 backdrop-blur-md p-6"
        >
          <h2 className="text-lg font-medium text-white mb-6">
            Response Sentiment
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'Positive',
                key: 'positive',
                color: 'green',
                icon: SmilePlus,
              },
              { label: 'Neutral', key: 'neutral', color: 'neutral', icon: Minus },
              {
                label: 'Negative',
                key: 'negative',
                color: 'red',
                icon: ThumbsDown,
              },
            ].map((sentiment) => {
              const Icon = sentiment.icon;
              const count = data.sentiment[sentiment.key] || 0;
              const colorMap: Record<string, string> = {
                green: '#22c55e',
                neutral: '#6b7280',
                red: '#ef4444',
              };

              return (
                <div key={sentiment.key} className="text-center">
                  <Icon
                    className="w-6 h-6 mx-auto mb-2"
                    style={{ color: colorMap[sentiment.color] }}
                  />
                  <p className="text-2xl font-light text-white mb-1">
                    {count}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {sentiment.label}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recent Emails */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-neutral-700 bg-neutral-800/50 backdrop-blur-md overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-700">
          <h2 className="text-lg font-medium text-white">
            Recent Emails ({data.recent.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-neutral-700 bg-neutral-700/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Opened
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Clicked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Reply
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Sentiment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {data.recent.map((email) => (
                <tr
                  key={email.id}
                  className="hover:bg-neutral-700/30 transition"
                >
                  <td className="px-6 py-4 text-sm font-medium text-white">
                    {email.recipient.substring(0, 30)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-300 max-w-xs truncate">
                    {email.subject}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {email.opened ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-neutral-400">
                            {new Date(
                              email.opened
                            ).toLocaleDateString()}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-neutral-500">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {email.clicked ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    ) : (
                      <span className="text-xs text-neutral-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {email.reply ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    ) : (
                      <span className="text-xs text-neutral-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {getSentimentIcon(email.sentiment)}
                      <span className="text-xs text-neutral-400 capitalize">
                        {email.sentiment || '—'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
