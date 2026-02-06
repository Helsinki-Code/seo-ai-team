'use client';

import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface ContentData {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  wordCount: number;
  readingTime: number;
  seoScore: number;
  strategy: string;
  tone: {
    tone: string;
    style: string;
    brandVoice: string;
  };
  currentSection?: string;
  generationProgress?: number;
}

export default function ContentGenerationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const websiteId = searchParams.get('websiteId');

  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [proceeding, setProceding] = useState(false);

  useEffect(() => {
    if (!websiteId) {
      router.push('/workflow');
      return;
    }
    fetchContent();
  }, [websiteId, router]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflow/content-generation?websiteId=${websiteId}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    setProceding(true);
    setTimeout(() => {
      router.push(`/workflow/rank-tracking?websiteId=${websiteId}`);
    }, 500);
  };

  const SEOScoreBar = ({ score }: { score: number }) => (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-neutral-400">SEO Score</p>
        <p className={`text-lg font-bold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-orange-400'}`}>
          {score}/100
        </p>
      </div>
      <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className={`h-full ${score >= 80 ? 'bg-green-600' : score >= 60 ? 'bg-yellow-600' : 'bg-orange-600'}`}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-black">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Content Generation
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
              Step 4 of 5
            </h2>
            <p className="text-sm text-neutral-500">Content Generation</p>
          </div>
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '80%' }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-yellow-600 to-orange-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-neutral-800/20 backdrop-blur border border-neutral-700/30 rounded-lg p-8 animate-pulse h-96" />
            ))}
          </div>
        ) : !content ? (
          <div className="text-center py-12 bg-neutral-800/20 backdrop-blur border border-neutral-700/30 rounded-lg">
            <p className="text-neutral-400 text-lg">Failed to generate content. Please try again.</p>
            <button
              onClick={fetchContent}
              className="mt-4 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            {/* Content Strategy & Tone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur border border-purple-700/50 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-neutral-400 mb-2">Content Strategy</h3>
                <p className="text-2xl font-bold text-purple-300">{content.strategy}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur border border-blue-700/50 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-neutral-400 mb-2">Brand Tone</h3>
                <p className="text-2xl font-bold text-blue-300">{content.tone.tone}</p>
              </div>
            </div>

            {/* Title & Meta */}
            <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur border border-neutral-700/50 rounded-lg p-8">
              <h3 className="text-xl font-bold text-white mb-6">Generated Title & Meta</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-neutral-400 mb-2">Page Title</p>
                  <p className="text-2xl font-bold text-white line-clamp-2">{content.title}</p>
                  <p className="text-xs text-neutral-500 mt-2">{content.title.length} characters</p>
                </div>
                <div className="pt-4 border-t border-neutral-700/50">
                  <p className="text-sm font-semibold text-neutral-400 mb-2">Meta Description</p>
                  <p className="text-white leading-relaxed">{content.metaDescription}</p>
                  <p className="text-xs text-neutral-500 mt-2">{content.metaDescription.length} characters</p>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur border border-neutral-700/50 rounded-lg p-6">
                <p className="text-sm text-neutral-400 mb-2">Word Count</p>
                <p className="text-4xl font-bold text-white">{content.wordCount.toLocaleString()}</p>
                <p className="text-xs text-neutral-500 mt-1">~{content.readingTime} min read</p>
              </div>
              <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur border border-neutral-700/50 rounded-lg p-6">
                <SEOScoreBar score={content.seoScore} />
              </div>
              <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur border border-neutral-700/50 rounded-lg p-6">
                <p className="text-sm text-neutral-400 mb-2">Slug</p>
                <p className="text-sm font-mono text-cyan-400 break-all">{content.slug}</p>
              </div>
            </div>

            {/* Preview Toggle */}
            <motion.button
              onClick={() => setShowPreview(!showPreview)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-3 bg-gradient-to-r from-neutral-700 to-neutral-800 hover:from-neutral-600 hover:to-neutral-700 text-white rounded-lg transition font-semibold"
            >
              {showPreview ? '▼ Hide Content Preview' : '▶ Show Content Preview'}
            </motion.button>

            {/* Content Preview */}
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-neutral-900/50 backdrop-blur border border-neutral-700/30 rounded-lg p-8 max-h-96 overflow-y-auto"
              >
                <h3 className="text-2xl font-bold text-white mb-4">{content.title}</h3>
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {content.content.substring(0, 1000)}...
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-4 pt-4"
            >
              <button
                onClick={() => router.push('/workflow/serp-analysis?websiteId=' + websiteId)}
                className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition font-semibold"
              >
                ← Back
              </button>
              <motion.button
                onClick={handleProceed}
                disabled={proceeding}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:shadow-lg hover:shadow-yellow-500/50 text-white rounded-lg transition font-semibold disabled:opacity-50"
              >
                {proceeding ? 'Proceeding...' : 'Proceed to Rank Tracking →'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
