'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Workflow {
  id: string;
  websiteUrl: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  keywordCount: number;
  createdAt: string;
  progress: number;
}

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/workflow/create-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = `/workflow/content-analysis?websiteId=${data.website.id}`;
      }
    } catch (error) {
      console.error('Failed to start workflow:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const stageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 },
    }),
  };

  const stages = [
    { number: 1, name: 'Content Analysis', icon: '📝', color: 'from-blue-600 to-cyan-600' },
    { number: 2, name: 'Keyword Extraction', icon: '🔍', color: 'from-purple-600 to-pink-600' },
    { number: 3, name: 'SERP Analysis', icon: '📊', color: 'from-green-600 to-emerald-600' },
    { number: 4, name: 'Content Generation', icon: '✍️', color: 'from-orange-600 to-red-600' },
    { number: 5, name: 'Rank Tracking', icon: '📈', color: 'from-indigo-600 to-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition">
              SEO Automation Workflow
            </h1>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-4 tracking-tight">
              Automated SEO Excellence
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              From content analysis to ranking optimization. Our AI agents handle the entire SEO workflow automatically.
            </p>
          </div>

          {/* Workflow Entry Form */}
          <motion.form
            onSubmit={handleStartWorkflow}
            className="max-w-2xl mx-auto mb-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur-lg opacity-40 group-hover:opacity-60 transition duration-300" />
              <div className="relative bg-neutral-900/90 backdrop-blur border border-neutral-800 rounded-lg p-1 flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Enter your website URL (e.g., https://example.com)"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="flex-1 bg-transparent px-6 py-4 text-white placeholder-neutral-500 focus:outline-none"
                  required
                />
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-md hover:shadow-lg hover:shadow-cyan-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {submitting ? 'Starting...' : 'Start Workflow'}
                </motion.button>
              </div>
            </div>
          </motion.form>
        </motion.div>

        {/* Workflow Stages */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-8">Workflow Stages</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stages.map((stage, i) => (
              <motion.div
                key={stage.number}
                custom={i}
                variants={stageVariants}
                initial="hidden"
                animate="visible"
                className="relative"
              >
                {/* Connection line */}
                {i < stages.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-4 h-0.5 bg-gradient-to-r from-neutral-700 to-transparent" />
                )}

                <div className="group bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur border border-neutral-700/50 rounded-lg p-6 text-center hover:border-neutral-600 transition duration-300 h-full">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br ${stage.color} flex items-center justify-center text-2xl shadow-lg shadow-${stage.color.split('-')[1]}-500/50`}>
                    {stage.icon}
                  </div>
                  <p className="text-sm font-semibold text-neutral-400 mb-2">
                    Step {stage.number}
                  </p>
                  <h4 className="text-lg font-bold text-white">{stage.name}</h4>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Workflows */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-8">Recent Workflows</h3>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-neutral-800/30 backdrop-blur border border-neutral-700/30 rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-neutral-700 rounded mb-4" />
                  <div className="h-4 bg-neutral-700 rounded w-2/3 mb-4" />
                  <div className="h-8 bg-neutral-700 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12 bg-neutral-800/20 backdrop-blur border border-neutral-700/30 rounded-lg">
              <p className="text-neutral-400 text-lg">No workflows yet. Start one above to get your SEO optimization journey going!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow, i) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur border border-neutral-700/50 rounded-lg p-6 hover:border-neutral-600 transition duration-300 cursor-pointer"
                  onClick={() => window.location.href = `/workflow/content-analysis?websiteId=${workflow.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm text-neutral-400 mb-1">Website</p>
                      <p className="text-white font-semibold truncate">{workflow.websiteUrl}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      workflow.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      workflow.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                      workflow.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-neutral-600/20 text-neutral-400'
                    }`}>
                      {workflow.status}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-neutral-400">Progress</p>
                      <p className="text-sm font-semibold text-white">{workflow.progress}%</p>
                    </div>
                    <div className="w-full bg-neutral-700/50 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${workflow.progress}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-600"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500">
                    {workflow.keywordCount} keywords • {new Date(workflow.createdAt).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
