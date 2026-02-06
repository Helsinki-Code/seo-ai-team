'use client';

import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SERPData {
  keyword: string;
  opportunityScore: number;
  difficulty: number;
  competitors: Array<{
    name: string;
    url: string;
    title: string;
    domainAuthority?: number;
  }>;
  peopleAlsoAsk: string[];
  strategicInsights: string[];
  gaps: string[];
  quickWins: string[];
}

export default function SERPAnalysisPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const websiteId = searchParams.get('websiteId');

  const [serpData, setSerpData] = useState<SERPData[]>([]);
  const [loading, setLoading] = useState(true);
  const [proceeding, setProceding] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<number>(0);

  useEffect(() => {
    if (!websiteId) {
      router.push('/workflow');
      return;
    }
    fetchSERPData();
  }, [websiteId, router]);

  const fetchSERPData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflow/serp-analysis?websiteId=${websiteId}`);
      if (response.ok) {
        const data = await response.json();
        setSerpData(data.serpData || []);
      }
    } catch (error) {
      console.error('Failed to fetch SERP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    setProceding(true);
    setTimeout(() => {
      router.push(`/workflow/content-generation?websiteId=${websiteId}`);
    }, 500);
  };

  const current = serpData[selectedKeyword];

  const OpportunityGauge = ({ score }: { score: number }) => (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-neutral-700"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={`${(score / 100) * 283} 283`}
          className={`text-${score > 75 ? 'green' : score > 50 ? 'yellow' : 'red'}-500 transition-all duration-500`}
          transform="rotate(-90 50 50)"
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dy="0.3em"
          className="fill-white font-bold text-2xl"
        >
          {score}
        </text>
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-black">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            SERP Analysis
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
              Step 3 of 5
            </h2>
            <p className="text-sm text-neutral-500">SERP Analysis</p>
          </div>
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '60%' }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-orange-600 to-red-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-neutral-800/20 backdrop-blur border border-neutral-700/30 rounded-lg p-8 animate-pulse h-96" />
            ))}
          </div>
        ) : !current ? (
          <div className="text-center py-12 bg-neutral-800/20 backdrop-blur border border-neutral-700/30 rounded-lg">
            <p className="text-neutral-400 text-lg">No SERP data available. Please try again.</p>
          </div>
        ) : (
          <>
            {/* Keyword Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex gap-2 overflow-x-auto pb-2"
            >
              {serpData.map((data, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedKeyword(i)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                    selectedKeyword === i
                      ? 'bg-orange-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {data.keyword}
                </button>
              ))}
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-8"
            >
              {/* Opportunity Score & Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur border border-green-700/50 rounded-lg p-8 text-center">
                  <h3 className="text-lg font-semibold text-neutral-400 mb-6">Opportunity Score</h3>
                  <OpportunityGauge score={current.opportunityScore} />
                  <p className="text-green-400 font-semibold mt-4">High Potential</p>
                </div>

                <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 backdrop-blur border border-red-700/50 rounded-lg p-8 text-center">
                  <h3 className="text-lg font-semibold text-neutral-400 mb-6">Ranking Difficulty</h3>
                  <OpportunityGauge score={current.difficulty} />
                  <p className="text-orange-400 font-semibold mt-4">Moderate Challenge</p>
                </div>
              </div>

              {/* Top Competitors */}
              <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur border border-neutral-700/50 rounded-lg p-8">
                <h3 className="text-xl font-bold text-white mb-6">Top 5 Competitors</h3>
                <div className="space-y-3">
                  {current.competitors.slice(0, 5).map((comp, i) => (
                    <div key={i} className="flex items-start justify-between p-4 bg-neutral-900/50 rounded-lg border border-neutral-700/30">
                      <div className="flex-1">
                        <p className="font-semibold text-white mb-1">{comp.name}</p>
                        <p className="text-sm text-neutral-400 truncate">{comp.title}</p>
                      </div>
                      {comp.domainAuthority && (
                        <div className="ml-4 text-right">
                          <p className="text-sm text-neutral-400">DA</p>
                          <p className="text-xl font-bold text-orange-400">{comp.domainAuthority}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* People Also Ask */}
              <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur border border-blue-700/50 rounded-lg p-8">
                <h3 className="text-xl font-bold text-white mb-6">People Also Ask (PAA)</h3>
                <div className="space-y-3">
                  {current.peopleAlsoAsk.slice(0, 5).map((question, i) => (
                    <div key={i} className="p-4 bg-blue-900/30 rounded-lg border border-blue-700/30">
                      <p className="text-white font-medium">{question}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic Insights, Gaps & Quick Wins */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur border border-purple-700/50 rounded-lg p-6">
                  <h4 className="text-lg font-bold text-white mb-4">Strategic Insights</h4>
                  <ul className="space-y-2">
                    {current.strategicInsights.slice(0, 3).map((insight, i) => (
                      <li key={i} className="text-sm text-neutral-300 flex gap-2">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 backdrop-blur border border-red-700/50 rounded-lg p-6">
                  <h4 className="text-lg font-bold text-white mb-4">Content Gaps</h4>
                  <ul className="space-y-2">
                    {current.gaps.slice(0, 3).map((gap, i) => (
                      <li key={i} className="text-sm text-neutral-300 flex gap-2">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur border border-green-700/50 rounded-lg p-6">
                  <h4 className="text-lg font-bold text-white mb-4">Quick Wins</h4>
                  <ul className="space-y-2">
                    {current.quickWins.slice(0, 3).map((win, i) => (
                      <li key={i} className="text-sm text-neutral-300 flex gap-2">
                        <span className="text-green-400 font-bold">•</span>
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-4 pt-4"
              >
                <button
                  onClick={() => router.push('/workflow/keyword-extraction?websiteId=' + websiteId)}
                  className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition font-semibold"
                >
                  ← Back
                </button>
                <motion.button
                  onClick={handleProceed}
                  disabled={proceeding}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-lg hover:shadow-orange-500/50 text-white rounded-lg transition font-semibold disabled:opacity-50"
                >
                  {proceeding ? 'Proceeding...' : 'Proceed to Content Generation →'}
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
