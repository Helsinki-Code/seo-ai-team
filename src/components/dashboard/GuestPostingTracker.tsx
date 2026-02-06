'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Mail,
  Eye,
  Pointer,
  MessageCircle,
  Loader2,
} from 'lucide-react';

interface Target {
  id: number;
  domain: string;
  authority: number | null;
  relevance: number;
  status: string;
  priority: string;
  contactEmail: string | null;
  outreachCount: number;
  opens: number;
  clicks: number;
  replies: number;
  published: boolean;
  publishedUrl: string | null;
  publishedDate: string | null;
}

interface CampaignData {
  campaign: {
    id: number;
    name: string;
    niche: string;
    status: string;
    createdAt: string;
  };
  stats: {
    totalTargets: number;
    researched: number;
    outreached: number;
    published: number;
    emails: {
      total: number;
      opened: number;
      clicked: number;
      replied: number;
      openRate: number;
      clickRate: number;
    };
  };
  targets: Target[];
}

export default function GuestPostingTracker({
  websiteId,
  campaignId,
}: {
  websiteId: number;
  campaignId?: number;
}) {
  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = campaignId
          ? `/api/data/guest-posting?websiteId=${websiteId}&campaignId=${campaignId}`
          : `/api/data/guest-posting?websiteId=${websiteId}`;
        const response = await fetch(url);
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
  }, [websiteId, campaignId]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'outreached':
        return <Mail className="w-5 h-5 text-blue-400" />;
      case 'researched':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
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
            {data.campaign.name}
          </h1>
          <p className="text-neutral-400">
            {data.campaign.niche} • {data.stats.totalTargets} targets
          </p>
        </div>
        {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
      </motion.div>

      {/* Campaign Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: 'Researched',
            value: data.stats.researched,
            total: data.stats.totalTargets,
            icon: Clock,
            color: 'yellow',
          },
          {
            label: 'Outreached',
            value: data.stats.outreached,
            total: data.stats.totalTargets,
            icon: Mail,
            color: 'blue',
          },
          {
            label: 'Published',
            value: data.stats.published,
            total: data.stats.totalTargets,
            icon: CheckCircle2,
            color: 'green',
          },
          {
            label: 'Open Rate',
            value: `${data.stats.emails.openRate.toFixed(1)}%`,
            total: `${data.stats.emails.total} sent`,
            icon: Eye,
            color: 'cyan',
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
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
                  className={`w-4 h-4 text-${stat.color}-400`}
                  style={{
                    color:
                      stat.color === 'yellow'
                        ? '#facc15'
                        : stat.color === 'blue'
                        ? '#3b82f6'
                        : stat.color === 'green'
                        ? '#22c55e'
                        : '#06b6d4',
                  }}
                />
                <span className="text-xs font-medium text-neutral-400">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-light text-white mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-neutral-500">{stat.total}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Email Engagement Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-neutral-700 bg-neutral-800/50 backdrop-blur-md p-6"
      >
        <h2 className="text-lg font-medium text-white mb-6">
          Email Engagement
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: 'Sent',
              value: data.stats.emails.total,
              icon: Mail,
            },
            {
              label: 'Opened',
              value: data.stats.emails.opened,
              icon: Eye,
            },
            {
              label: 'Clicked',
              value: data.stats.emails.clicked,
              icon: Pointer,
            },
            {
              label: 'Replied',
              value: data.stats.emails.replied,
              icon: MessageCircle,
            },
          ].map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="text-center">
                <Icon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <p className="text-2xl font-light text-white mb-1">
                  {metric.value}
                </p>
                <p className="text-xs text-neutral-400">{metric.label}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Targets List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-neutral-700 bg-neutral-800/50 backdrop-blur-md overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-700">
          <h2 className="text-lg font-medium text-white">
            Target Domains ({data.targets.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-neutral-700 bg-neutral-700/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Authority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Outreach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Opens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Replies
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {data.targets.map((target) => (
                <tr
                  key={target.id}
                  className="hover:bg-neutral-700/30 transition"
                >
                  <td className="px-6 py-4 text-sm font-medium text-white">
                    {target.domain}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-300">
                    {target.authority ? `DA ${target.authority}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(target.status)}
                      <span className="text-sm text-neutral-300 capitalize">
                        {target.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-300">
                    {target.outreachCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-300">
                    {target.opens}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-300">
                    {target.replies}
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
