'use client';

import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface ToneProfile {
  tone: string;
  style: string;
  keywords: string[];
  brandVoice: string;
}

interface AnalysisData {
  wordCount: number;
  headingCount: number;
  industry: string;
  targetAudience: string;
  toneProfile: ToneProfile;
  strategy: string;
  contentPreview: string;
}

export default function ContentAnalysisPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const websiteId = searchParams.get('websiteId');

  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [proceeding, setProceding] = useState(false);

  useEffect(() => {
    if (!websiteId) {
      router.push('/workflow');
      return;
    }
    fetchAnalysis();
  }, [websiteId, router]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflow/content-analysis?websiteId=${websiteId}`);
      if (response.ok) {
        const analysisData = await response.json();
        setData(analysisData);
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    setProceding(true);
    setTimeout(() => {
      router.push(`/workflow/keyword-extraction?websiteId=${websiteId}`);
    }, 500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-black">
      {/* Background animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Content Analysis
          </h1>
          <button
            onClick={() => router.push('/workflow')}
            className="text-neutral-400 hover:text-white transition"
          >
            ← Back
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Progress indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">
              Step 1 of 5
            </h2>
            <p className="text-sm text-neutral-500">Content Analysis</p>
          </div>
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '20%' }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
            />
          </div>
        </div>

        {loading ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-neutral-800/20 backdrop-blur border border-neutral-700/30 rounded-lg p-8 animate-pulse"
              >
                <div className="h-6 bg-neutral-700 rounded mb-4 w-1/3" />
                <div className="space-y-3">
                  <div className="h-4 bg-neutral-700 rounded" />
                  <div className="h-4 bg-neutral-700 rounded w-5/6" />
                  <div className="h-4 bg-neutral-700 rounded w-4/6" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : !data ? (
          <div className="text-center py-12 bg-neutral-800/20 backdrop-blur border border-neutral-700/30 rounded-lg">
            <p className="text-neutral-400 text-lg">Failed to analyze content. Please try again.</p>
            <button
              onClick={fetchAnalysis}
              className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Content Metrics */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Word Count', value: data.wordCount.toLocaleString(), icon: '📝' },
                { label: 'Headings Found', value: data.headingCount, icon: '📋' },
                { label: 'Industry', value: data.industry || 'Detecting...', icon: '🏢' },
                { label: 'Audience', value: data.targetAudience || 'Analyzing...', icon: '👥' },
              ].map((metric, i) => (
                <div
                  key={i}
                  className="group bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur border border-neutral-700/50 rounded-lg p-4 hover:border-neutral-600 transition duration-300"
                >
                  <p className="text-3xl mb-2">{metric.icon}</p>
                  <p className="text-sm text-neutral-400 mb-1">{metric.label}</p>
                  <p className="text-xl font-bold text-white">{metric.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Brand Tone Profile */}
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur border border-neutral-700/50 rounded-lg p-8">
              <h3 className="text-xl font-bold text-white mb-6">Brand Tone Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-neutral-400 mb-2">Tone</p>
                  <p className="text-2xl font-bold text-purple-400 mb-4">{data.toneProfile.tone}</p>
                  <p className="text-sm text-neutral-400 mb-2">Writing Style</p>
                  <p className="text-lg font-semibold text-white">{data.toneProfile.style}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-2">Brand Voice</p>
                  <p className="text-white leading-relaxed italic">{data.toneProfile.brandVoice}</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-neutral-700/50">
                <p className="text-sm text-neutral-400 mb-3">Brand Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {data.toneProfile.keywords.map((keyword, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/30"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Content Strategy Persona */}
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 backdrop-blur border border-pink-700/50 rounded-lg p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">✨</div>
                <div>
                  <h3 className="text-xl font-bold text-white">Selected Content Strategy</h3>
                  <p className="text-pink-400 font-semibold text-lg">{data.strategy}</p>
                </div>
              </div>
              <p className="text-neutral-300 text-sm leading-relaxed">
                Your content will be optimized using this strategy persona to match your brand voice and audience expectations.
              </p>
            </motion.div>

            {/* Content Preview */}
            <motion.div variants={itemVariants} className="bg-neutral-800/30 backdrop-blur border border-neutral-700/30 rounded-lg p-8">
              <h3 className="text-xl font-bold text-white mb-4">Content Preview</h3>
              <div className="bg-neutral-900/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {data.contentPreview.substring(0, 500)}...
                </p>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div variants={itemVariants} className="flex gap-4 pt-4">
              <button
                onClick={() => router.push('/workflow')}
                className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition font-semibold"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleProceed}
                disabled={proceeding}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/50 text-white rounded-lg transition font-semibold disabled:opacity-50"
              >
                {proceeding ? 'Proceeding...' : 'Proceed to Keyword Extraction →'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
