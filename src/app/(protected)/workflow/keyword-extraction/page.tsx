'use client';

import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Keyword {
  keyword: string;
  category: 'Primary' | 'Secondary' | 'Long Tail' | 'Question';
  difficulty: 'Low' | 'Medium' | 'High' | 'Very High';
  volumeEstimate: string;
  intent: 'Informational' | 'Transactional' | 'Navigational' | 'Commercial';
  competitionInsight: string;
}

export default function KeywordExtractionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const websiteId = searchParams.get('websiteId');

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterIntent, setFilterIntent] = useState<string>('all');
  const [proceeding, setProceding] = useState(false);

  useEffect(() => {
    if (!websiteId) {
      router.push('/workflow');
      return;
    }
    fetchKeywords();
  }, [websiteId, router]);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflow/keyword-extraction?websiteId=${websiteId}`);
      if (response.ok) {
        const data = await response.json();
        setKeywords(data.keywords || []);
      }
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredKeywords = keywords.filter((k) => {
    const categoryMatch = filterCategory === 'all' || k.category === filterCategory;
    const intentMatch = filterIntent === 'all' || k.intent === filterIntent;
    return categoryMatch && intentMatch;
  });

  const handleProceed = () => {
    setProceding(true);
    setTimeout(() => {
      router.push(`/workflow/serp-analysis?websiteId=${websiteId}`);
    }, 500);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Low':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'Very High':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-neutral-500/20 text-neutral-400';
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'Informational':
        return 'bg-blue-500/20 text-blue-300';
      case 'Transactional':
        return 'bg-green-500/20 text-green-300';
      case 'Navigational':
        return 'bg-purple-500/20 text-purple-300';
      case 'Commercial':
        return 'bg-orange-500/20 text-orange-300';
      default:
        return 'bg-neutral-500/20 text-neutral-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-black">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Keyword Extraction
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
              Step 2 of 5
            </h2>
            <p className="text-sm text-neutral-500">Keyword Extraction</p>
          </div>
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '40%' }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-green-600 to-emerald-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-neutral-800/20 backdrop-blur border border-neutral-700/30 rounded-lg p-4 animate-pulse h-20"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              {[
                { label: 'Total Keywords', value: keywords.length, icon: '🔑' },
                { label: 'Primary', value: keywords.filter((k) => k.category === 'Primary').length, icon: '⭐' },
                { label: 'Secondary', value: keywords.filter((k) => k.category === 'Secondary').length, icon: '✨' },
                { label: 'Long Tail', value: keywords.filter((k) => k.category === 'Long Tail').length, icon: '🎯' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur border border-neutral-700/50 rounded-lg p-4"
                >
                  <p className="text-2xl mb-2">{stat.icon}</p>
                  <p className="text-sm text-neutral-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 flex flex-wrap gap-4"
            >
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-neutral-400">Category:</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                >
                  <option value="all">All Categories</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Long Tail">Long Tail</option>
                  <option value="Question">Question</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-neutral-400">Intent:</label>
                <select
                  value={filterIntent}
                  onChange={(e) => setFilterIntent(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                >
                  <option value="all">All Intents</option>
                  <option value="Informational">Informational</option>
                  <option value="Transactional">Transactional</option>
                  <option value="Navigational">Navigational</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
            </motion.div>

            {/* Keywords List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3 mb-8"
            >
              {filteredKeywords.length === 0 ? (
                <div className="text-center py-12 bg-neutral-800/20 backdrop-blur border border-neutral-700/30 rounded-lg">
                  <p className="text-neutral-400">No keywords match your filters.</p>
                </div>
              ) : (
                filteredKeywords.map((keyword, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-gradient-to-r from-neutral-800/30 to-neutral-900/30 backdrop-blur border border-neutral-700/50 rounded-lg p-4 hover:border-green-600/30 transition duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{keyword.keyword}</h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(keyword.difficulty)}`}>
                            Difficulty: {keyword.difficulty}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getIntentColor(keyword.intent)}`}>
                            {keyword.intent}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-neutral-600/20 text-neutral-300">
                            {keyword.volumeEstimate}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 italic">{keyword.competitionInsight}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ml-4 whitespace-nowrap ${
                        keyword.category === 'Primary' ? 'bg-blue-500/20 text-blue-300' :
                        keyword.category === 'Secondary' ? 'bg-purple-500/20 text-purple-300' :
                        keyword.category === 'Long Tail' ? 'bg-pink-500/20 text-pink-300' :
                        'bg-orange-500/20 text-orange-300'
                      }`}>
                        {keyword.category}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-4 pt-4"
            >
              <button
                onClick={() => router.push('/workflow/content-analysis?websiteId=' + websiteId)}
                className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition font-semibold"
              >
                ← Back
              </button>
              <motion.button
                onClick={handleProceed}
                disabled={proceeding}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg hover:shadow-green-500/50 text-white rounded-lg transition font-semibold disabled:opacity-50"
              >
                {proceeding ? 'Proceeding...' : 'Proceed to SERP Analysis →'}
              </motion.button>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
