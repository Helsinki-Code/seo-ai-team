
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Bot, Search, FileText, Zap, ChevronRight, Download, RefreshCw, 
  Layers, Sun, Moon, Sparkles, Activity, Globe, ShieldCheck, CheckCircle2, Database, Image as ImageIcon, Share2, Calendar, GitBranch, ArrowRight, Clock, Terminal, X, Link, ThumbsUp, ArrowLeft, Menu, CheckSquare, Square, 
  TrendingUp, AlertCircle, Link as LinkIcon, ExternalLink, ListChecks, XCircle, BarChart3, LineChart as LineChartIcon, Lock, Unlock, PlayCircle, StopCircle
} from 'lucide-react';
import * as GeminiService from './geminiService';
import { NAV_ITEMS } from './constants';
import { KeywordMetric, SerpResult, GeneratedArticle, AgentTask, DomainRankInfo, ContentStrategy, GeneratedImage, LinkSuggestion, BulkRankResponse, AnalyticsMetric, PagePerformance } from './types';

// --- Context & State ---

interface AppState {
  domain: string;
  setDomain: (d: string) => void;
  sitemap: string[];
  setSitemap: (s: string[]) => void;
  keywords: KeywordMetric[];
  setKeywords: (k: KeywordMetric[]) => void;
  serpResults: Record<string, SerpResult>;
  addSerpResult: (k: string, r: SerpResult) => void;
  articles: GeneratedArticle[];
  addArticle: (a: GeneratedArticle) => void;
  updateArticle: (id: string, updates: Partial<GeneratedArticle>) => void;
  agentTasks: AgentTask[];
  addAgentTask: (t: AgentTask) => void;
  updateAgentTask: (id: string, updates: Partial<AgentTask>) => void;
  rankData: DomainRankInfo[];
  setRankData: (d: DomainRankInfo[]) => void;
  strategy: ContentStrategy | null;
  setStrategy: (s: ContentStrategy) => void;
  generatedImages: GeneratedImage[];
  addGeneratedImage: (i: GeneratedImage) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  gaConnected: boolean;
  setGaConnected: (b: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within Provider");
  return ctx;
};

// --- Helper Functions ---

const downloadFile = (data: any, filename: string, type: 'json' | 'csv' | 'md') => {
    let content = '';
    let mimeType = '';

    if (type === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
    } else if (type === 'csv') {
        // Simple array of objects to CSV
        if (Array.isArray(data) && data.length > 0) {
            const keys = Object.keys(data[0]);
            content = keys.join(',') + '\n' + data.map((row: any) => keys.map(k => JSON.stringify(row[k])).join(',')).join('\n');
        } else {
            content = String(data);
        }
        mimeType = 'text/csv';
    } else {
        content = String(data);
        mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// --- Components ---

const Mascot: React.FC<{ processing: boolean }> = ({ processing }) => (
  <div className={`fixed bottom-8 right-8 w-16 h-16 pointer-events-none z-50 transition-all duration-500 ${processing ? 'scale-110' : 'scale-100'}`}>
    <div className={`absolute inset-0 rounded-full blur-xl bg-nexus-accent/40 ${processing ? 'animate-pulse' : ''}`}></div>
    <div className="relative w-full h-full bg-slate-900 rounded-full border border-slate-700 flex items-center justify-center shadow-2xl overflow-hidden">
      <div className={`absolute w-full h-full bg-gradient-to-tr from-nexus-600/20 to-purple-500/20 ${processing ? 'animate-spin' : ''}`}></div>
      <div className="relative z-10">
        <Bot size={32} className={`text-white transition-colors duration-300 ${processing ? 'text-nexus-accent' : 'text-slate-400'}`} />
      </div>
      {processing && (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-nexus-accent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  </div>
);

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarCollapsed, toggleSidebar } = useAppContext();
  
  return (
    <div className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} h-screen fixed left-0 top-0 border-r border-slate-200 dark:border-white/5 bg-white/50 dark:bg-nexus-surface/50 backdrop-blur-xl flex flex-col z-40 transition-all duration-300`}>
      <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
        <div 
            onClick={toggleSidebar}
            className="cursor-pointer w-8 h-8 rounded-lg bg-gradient-to-br from-nexus-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0"
        >
          <Sparkles className="text-white w-5 h-5" />
        </div>
        {!isSidebarCollapsed && <span className="text-xl font-display font-bold tracking-tight text-slate-900 dark:text-white truncate">NEXUS</span>}
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={isSidebarCollapsed ? item.name : ''}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-nexus-500/10 text-nexus-600 dark:text-nexus-500 font-medium' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className={`transition-colors ${isActive ? 'text-nexus-600 dark:text-nexus-500' : 'group-hover:text-nexus-600 dark:group-hover:text-white'}`}>
                {item.icon}
              </span>
              {!isSidebarCollapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-200 dark:border-white/5">
         <button onClick={toggleSidebar} className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
             {isSidebarCollapsed ? <ChevronRight size={20} /> : <ArrowLeft size={20} />}
         </button>
      </div>
    </div>
  );
};

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-white/10 hover:scale-110 transition-transform duration-200"
    >
      {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
    </button>
  );
};

// --- Analytics Module ---

const AnalyticsCommandCenter = () => {
    const { gaConnected, setGaConnected, addAgentTask, updateAgentTask, articles, updateArticle } = useAppContext();
    const [trafficData, setTrafficData] = useState<AnalyticsMetric[]>([]);
    const [pagePerformance, setPagePerformance] = useState<PagePerformance[]>([]);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [aiInsight, setAiInsight] = useState("Waiting for data stream...");
    
    // Simulating Real-time Data Stream
    useEffect(() => {
        if (!gaConnected) return;

        const interval = setInterval(() => {
            const now = new Date();
            const newPoint: AnalyticsMetric = {
                timestamp: now.toLocaleTimeString(),
                activeUsers: Math.floor(Math.random() * 200) + 800, // fluctuating around 900
                sessions: Math.floor(Math.random() * 50) + 1200,
                bounceRate: 45 + Math.random() * 5,
                avgDuration: 120 + Math.random() * 60
            };

            setTrafficData(prev => {
                const updated = [...prev, newPoint].slice(-20); // Keep last 20 points
                return updated;
            });
            
            // Randomly update page performance
            setPagePerformance(prev => prev.map(p => ({
                ...p,
                views: p.views + Math.floor(Math.random() * 5),
                engagement: Math.min(100, p.engagement + (Math.random() - 0.5))
            })));

        }, 3000);

        return () => clearInterval(interval);
    }, [gaConnected]);

    // AI Analyst Effect
    useEffect(() => {
        if (trafficData.length > 0 && trafficData.length % 5 === 0) { // Analyze every 5 updates
            const analyze = async () => {
                const insight = await GeminiService.analyzeTrafficPatterns(trafficData, pagePerformance);
                setAiInsight(insight);
            };
            analyze();
        }
    }, [trafficData]);

    const handleConnect = (e: React.FormEvent) => {
        e.preventDefault();
        setShowConnectModal(false);
        setGaConnected(true);
        // Initialize simulated data
        setPagePerformance([
            { path: '/blog/seo-strategies-2025', views: 1245, engagement: 85, status: 'indexed' },
            { path: '/products/premium-plan', views: 850, engagement: 60, status: 'indexed' },
            { path: '/about-us', views: 400, engagement: 45, status: 'crawled' },
            { path: '/blog/ai-content-guide', views: 150, engagement: 90, status: 'discovered' }
        ]);
        
        addAgentTask({
            id: 'ga-init', type: 'GA_ANALYST', name: 'Analytics Stream', status: 'completed',
            message: 'Connected to GA4 Stream.', progress: 100, logs: ['Handshake successful', 'Stream active'], startTime: Date.now()
        });
    };

    const handleIndexingRequest = async (articleId: string) => {
        const article = articles.find(a => a.id === articleId);
        if (!article) return;

        const taskId = `idx-${Date.now()}`;
        addAgentTask({
            id: taskId, type: 'INDEXER', name: `Index: ${article.keyword}`, status: 'working',
            message: 'Analyzing content for Google Indexing...', progress: 0, logs: ['Checking meta tags', 'Validating schema markup'], startTime: Date.now()
        });

        const prediction = await GeminiService.predictIndexingSuccess(article.content, article.keyword);
        
        setTimeout(() => {
            updateAgentTask(taskId, {
                status: 'completed',
                progress: 100,
                message: `Indexing Requested. Probability: ${prediction.likelihood}`,
                logs: [`Likelihood: ${prediction.likelihood}`, `Advisor: ${prediction.advice}`, 'Submission API trigger sent'],
                endTime: Date.now()
            });
            updateArticle(articleId, { status: 'indexed' }); // Optimistic update
        }, 3000);
    };

    if (!gaConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-fade-in">
                <div className="bg-white dark:bg-nexus-surface border border-slate-200 dark:border-white/10 p-12 rounded-3xl text-center max-w-lg shadow-2xl">
                    <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LineChartIcon className="w-10 h-10 text-orange-600 dark:text-orange-500" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">Analytics Intelligence</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Connect your Google Analytics 4 property to enable real-time traffic analysis, content performance tracking, and autonomous indexing triggers.</p>
                    <button 
                        onClick={() => setShowConnectModal(true)}
                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all transform hover:scale-[1.02]"
                    >
                        Connect Google Analytics
                    </button>
                </div>

                {/* Connection Modal */}
                {showConnectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
                        <div className="w-full max-w-md bg-white dark:bg-nexus-surface border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Connect Data Stream</h3>
                            <form onSubmit={handleConnect} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GA4 Measurement ID</label>
                                    <input type="text" placeholder="G-XXXXXXXXXX" className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Secret (Optional for Demo)</label>
                                    <input type="password" placeholder="••••••••••••••••" className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowConnectModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold">Connect Agent</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">Command Center</h1>
                    <p className="text-slate-500 dark:text-slate-400">Real-time Traffic Analysis & Indexing Control.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-full text-sm font-bold border border-emerald-500/20">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    Live Stream Active
                </div>
            </header>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Traffic Graph */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-nexus-surface border border-slate-200 dark:border-white/5 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center"><Activity className="w-5 h-5 mr-2 text-orange-500" /> Real-Time Traffic</h3>
                        <div className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                            {trafficData[trafficData.length - 1]?.activeUsers || 0} <span className="text-sm font-sans font-normal text-slate-500">Active Users</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="timestamp" hide />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                                <Area type="monotone" dataKey="activeUsers" stroke="#f97316" fillOpacity={1} fill="url(#colorUsers)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Insight Panel */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 text-white flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Bot size={100} /></div>
                    <h3 className="font-bold text-lg mb-4 flex items-center z-10"><Sparkles className="w-5 h-5 mr-2 text-amber-400" /> Analyst Insight</h3>
                    <div className="flex-1 flex items-center justify-center z-10">
                        <p className="text-lg font-light leading-relaxed italic">
                            "{aiInsight}"
                        </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center z-10 text-sm opacity-70">
                        <span>Updating live...</span>
                        <Activity className="w-4 h-4 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Content Performance & Indexing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-nexus-surface border border-slate-200 dark:border-white/5">
                    <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white flex items-center">
                        <Globe className="w-5 h-5 mr-2 text-blue-500" /> Page Performance
                    </h3>
                    <div className="space-y-4">
                        {pagePerformance.map((page, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                                <div className="flex-1 truncate mr-4">
                                    <div className="font-medium text-slate-900 dark:text-white truncate">{page.path}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <span>{page.views} Views</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                        <span className={page.engagement > 80 ? 'text-emerald-500' : 'text-amber-500'}>{page.engagement.toFixed(1)}% Engagement</span>
                                    </div>
                                </div>
                                <div>
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${
                                        page.status === 'indexed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                        page.status === 'crawled' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                    }`}>
                                        {page.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-nexus-surface border border-slate-200 dark:border-white/5">
                    <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-yellow-500" /> Auto-Indexer Queue
                    </h3>
                    {articles.filter(a => a.status === 'completed' || a.status === 'indexed').length === 0 ? (
                        <div className="text-center py-10 text-slate-500">No completed articles to index.</div>
                    ) : (
                        <div className="space-y-4">
                            {articles.filter(a => a.status === 'completed' || a.status === 'indexed').map((article) => (
                                <div key={article.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                                    <div className="truncate flex-1 mr-4">
                                        <div className="font-medium text-slate-900 dark:text-white truncate">{article.title}</div>
                                        <div className="text-xs text-slate-500">{article.keyword}</div>
                                    </div>
                                    {article.status === 'indexed' ? (
                                        <span className="flex items-center text-emerald-500 text-xs font-bold">
                                            <CheckCircle2 className="w-4 h-4 mr-1" /> Submitted
                                        </span>
                                    ) : (
                                        <button 
                                            onClick={() => handleIndexingRequest(article.id)}
                                            className="px-3 py-1.5 bg-nexus-600 hover:bg-nexus-500 text-white text-xs rounded-lg font-bold shadow-lg shadow-nexus-500/20 transition-all active:scale-95"
                                        >
                                            Request Indexing
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- New Components ---

const Dashboard = () => {
  const { domain, setDomain, agentTasks, articles } = useAppContext();
  const [localDomain, setLocalDomain] = useState(domain);

  const handleSaveDomain = () => {
    setDomain(localDomain);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">Mission Control</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of your SEO operations.</p>
      </header>

      {/* Domain Config */}
      <div className="bg-white dark:bg-nexus-surface p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Target Configuration</h2>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={localDomain}
            onChange={(e) => setLocalDomain(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-nexus-500"
          />
          <button onClick={handleSaveDomain} className="bg-nexus-600 hover:bg-nexus-500 text-white px-6 py-3 rounded-xl font-bold transition-all">
            Save Target
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-lg"><Bot size={20} /></div>
            <span className="bg-white/20 text-xs font-bold px-2 py-1 rounded">Live</span>
          </div>
          <div className="text-3xl font-bold mb-1">{agentTasks.filter(t => t.status === 'working').length}</div>
          <div className="text-white/80 text-sm">Active Agents</div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-nexus-surface border border-slate-200 dark:border-white/5">
           <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><FileText size={20} /></div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{articles.length}</div>
          <div className="text-slate-500 text-sm">Generated Articles</div>
        </div>
      </div>
      
      {/* Task Log */}
      <div className="bg-white dark:bg-nexus-surface p-6 rounded-2xl border border-slate-200 dark:border-white/5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Agent Activity Log</h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {agentTasks.length === 0 && <div className="text-slate-500 text-center py-4">No activity yet.</div>}
          {[...agentTasks].reverse().map(task => (
             <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className={`w-2 h-2 rounded-full ${task.status === 'working' ? 'bg-amber-400 animate-pulse' : task.status === 'completed' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="flex-1">
                   <div className="text-sm font-bold text-slate-900 dark:text-white">{task.name}</div>
                   <div className="text-xs text-slate-500">{task.message}</div>
                </div>
                <div className="text-xs font-mono text-slate-400">
                    {task.type}
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const KeywordResearch = () => {
    const { domain, keywords, setKeywords, addAgentTask, updateAgentTask } = useAppContext();
    const [url, setUrl] = useState(domain);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!url) return;
        setLoading(true);
        const taskId = `kw-${Date.now()}`;
        addAgentTask({
            id: taskId, type: 'RESEARCHER', name: `Analyze: ${url}`, status: 'working',
            message: 'Crawling site structure...', progress: 10, logs: ['Initiating crawler'], startTime: Date.now()
        });

        try {
            const data = await GeminiService.analyzeWebsiteContent(url);
            setKeywords(data.keywords);
            updateAgentTask(taskId, {
                status: 'completed', progress: 100, message: `Found ${data.keywords.length} keywords`,
                logs: [`Identified ${data.pages.length} pages`, `Extracted ${data.keywords.length} keywords`], endTime: Date.now()
            });
        } catch (e) {
            updateAgentTask(taskId, { status: 'error', message: 'Analysis failed', progress: 0 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <header>
                <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">Keyword Intelligence</h1>
            </header>
            
            <div className="flex gap-4">
                 <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter URL to analyze..."
                    className="flex-1 bg-white dark:bg-nexus-surface border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none"
                  />
                  <button 
                    disabled={loading}
                    onClick={handleAnalyze} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                    {loading ? 'Scanning...' : 'Analyze Site'}
                  </button>
            </div>

            {keywords.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {keywords.map((k, i) => (
                        <div key={i} className="bg-white dark:bg-nexus-surface p-4 rounded-xl border border-slate-200 dark:border-white/5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-900 dark:text-white">{k.keyword}</h3>
                                <span className="text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded">{k.intent}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-slate-500">
                                <div>Vol: <span className="text-slate-900 dark:text-slate-200">{k.volume}</span></div>
                                <div>KD: <span className={`font-bold ${k.difficulty > 70 ? 'text-red-500' : 'text-emerald-500'}`}>{k.difficulty}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SerpLab = () => {
    const { addSerpResult, serpResults, addAgentTask, updateAgentTask } = useAppContext();
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!keyword) return;
        setLoading(true);
        const taskId = `serp-${Date.now()}`;
        addAgentTask({
             id: taskId, type: 'ANALYST', name: `SERP: ${keyword}`, status: 'working',
             message: 'Analyzing live search results...', progress: 0, logs: [], startTime: Date.now()
        });

        try {
            const result = await GeminiService.performSerpAnalysis(keyword);
            addSerpResult(keyword, result);
            updateAgentTask(taskId, { status: 'completed', message: 'Analysis ready', progress: 100 });
        } catch (e) {
            updateAgentTask(taskId, { status: 'error', message: 'Failed', progress: 0 });
        } finally {
            setLoading(false);
        }
    };

    return (
         <div className="space-y-6 animate-fade-in">
            <header>
                <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">SERP Laboratory</h1>
            </header>
            <div className="flex gap-4">
                 <input 
                    type="text" 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Target Keyword..."
                    className="flex-1 bg-white dark:bg-nexus-surface border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none"
                  />
                  <button 
                    disabled={loading}
                    onClick={handleAnalyze} 
                    className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                    Analyze SERP
                  </button>
            </div>
            
            <div className="grid gap-6">
                {Object.values(serpResults).map((res, i) => (
                    <div key={i} className="bg-white dark:bg-nexus-surface p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{res.keyword}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl">
                                <h4 className="font-bold text-indigo-500 mb-2">AI Overview Simulation</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 italic">{res.aiOverview}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Competitors</h4>
                                <div className="space-y-2">
                                    {res.competitors.map((comp, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-white/5 rounded-lg">
                                            <span>{comp.domain}</span>
                                            <span className="font-mono bg-slate-200 dark:bg-white/10 px-2 rounded">DA {comp.domainAuthority}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
    );
};

const StrategyCore = () => {
    const { keywords, serpResults, strategy, setStrategy, addAgentTask, updateAgentTask } = useAppContext();
    const [goals, setGoals] = useState('');
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        const taskId = `strat-${Date.now()}`;
        addAgentTask({
            id: taskId, type: 'STRATEGIST', name: 'Develop Strategy', status: 'working',
            message: 'Synthesizing data...', progress: 0, logs: [], startTime: Date.now()
        });

        const serpArray = Object.values(serpResults);
        const strat = await GeminiService.generateContentStrategy(keywords, serpArray, goals);
        setStrategy(strat);
        updateAgentTask(taskId, { status: 'completed', message: 'Strategy generated', progress: 100 });
        setGenerating(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <header>
                <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">Strategy Core</h1>
            </header>
            
            <div className="bg-white dark:bg-nexus-surface p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                <textarea 
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="Define your content goals (e.g., 'Increase organic traffic for SaaS product by 20%')..."
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-4 outline-none mb-4 h-32"
                />
                <button 
                    disabled={generating || keywords.length === 0}
                    onClick={handleGenerate}
                    className="w-full bg-nexus-600 hover:bg-nexus-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                    {generating ? 'Formulating Strategy...' : 'Generate Content Strategy'}
                </button>
            </div>

            {strategy && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white">
                        <h3 className="text-xl font-bold mb-2">Executive Summary</h3>
                        <p>{strategy.summary}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-nexus-surface p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                            <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Content Calendar</h3>
                            <div className="space-y-3">
                                {strategy.calendar.map((item, i) => (
                                    <div key={i} className="flex gap-4 p-3 rounded-lg bg-slate-50 dark:bg-white/5">
                                        <div className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">{item.week}</div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">{item.topic}</div>
                                            <div className="text-xs text-slate-500">{item.type} • {item.bestDay}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-nexus-surface p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                             <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Topic Clusters</h3>
                             <div className="space-y-4">
                                {strategy.clusters.map((cluster, i) => (
                                    <div key={i}>
                                        <div className="font-bold text-indigo-500 mb-1">{cluster.name}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {cluster.keywords.map((k, j) => (
                                                <span key={j} className="text-xs bg-slate-100 dark:bg-white/10 px-2 py-1 rounded text-slate-700 dark:text-slate-300">{k}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ArticleForge = () => {
    const { articles, addArticle, updateArticle, addAgentTask, updateAgentTask, sitemap, serpResults } = useAppContext();
    const [keyword, setKeyword] = useState('');
    const [isWriting, setIsWriting] = useState(false);

    const handleCreate = async () => {
        if (!keyword) return;
        setIsWriting(true);
        const articleId = `art-${Date.now()}`;
        
        // 1. Outline
        addAgentTask({ id: articleId, type: 'WRITER', name: `Write: ${keyword}`, status: 'working', message: 'Generating outline...', progress: 10, logs: [], startTime: Date.now() });
        
        const serp = serpResults[keyword] || { peopleAlsoAsk: [] };
        const outline = await GeminiService.generateArticleOutline(keyword, serp as any, 'Professional');
        
        const newArticle: GeneratedArticle = {
            id: articleId, keyword, title: outline.title, status: 'drafting', progress: 20, logs: ['Outline created'],
            content: '', mdContent: '', sections: outline.sections, wordCount: 0, aiOverviewOptimized: false
        };
        addArticle(newArticle);

        // 2. Write Sections
        let fullContent = `# ${outline.title}\n\n`;
        let completed = 0;
        
        for (const section of outline.sections) {
            updateAgentTask(articleId, { message: `Writing section: ${section.heading}`, progress: 20 + (completed / outline.sections.length * 60) });
            const secData = await GeminiService.writeArticleSection(section.heading, keyword, section.description, 'Professional', section.visualType);
            fullContent += `## ${section.heading}\n\n${secData.content}\n\n`;
            if (secData.imagePrompt) {
                 const imgUrl = await GeminiService.generateImage(secData.imagePrompt);
                 fullContent += `![${section.heading}](${imgUrl})\n\n`;
            }
            completed++;
        }

        // 3. Optimize
        updateAgentTask(articleId, { message: 'Optimizing for AI Overview...', progress: 90 });
        const optimization = await GeminiService.optimizeForAIOverview(fullContent, keyword);
        fullContent = `${optimization}\n\n---\n\n${fullContent}`;

        updateArticle(articleId, { content: fullContent, mdContent: fullContent, status: 'completed', progress: 100 });
        updateAgentTask(articleId, { status: 'completed', message: 'Article ready', progress: 100 });
        setIsWriting(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <header>
                <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">Content Forge</h1>
            </header>
            
             <div className="flex gap-4">
                 <input 
                    type="text" 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Article Topic / Keyword..."
                    className="flex-1 bg-white dark:bg-nexus-surface border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none"
                  />
                  <button 
                    disabled={isWriting}
                    onClick={handleCreate} 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                    {isWriting ? 'Forging...' : 'Generate Article'}
                  </button>
            </div>

            <div className="grid gap-4">
                {articles.map(article => (
                    <div key={article.id} className="bg-white dark:bg-nexus-surface p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{article.title}</h3>
                            <div className="text-sm text-slate-500 mt-1">{article.keyword} • {article.status.toUpperCase()}</div>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => downloadFile(article.mdContent, `${article.keyword}.md`, 'md')} className="p-2 bg-slate-100 dark:bg-white/10 rounded-lg hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                                <Download size={20} className="text-slate-600 dark:text-slate-300" />
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ImageStudio = () => {
    const { generatedImages, addGeneratedImage } = useAppContext();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        const url = await GeminiService.generateImage(prompt);
        addGeneratedImage({
            id: Date.now().toString(), prompt, url, aspectRatio: '16:9', createdAt: Date.now()
        });
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <header>
                <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">Image Studio</h1>
            </header>
            
             <div className="bg-white dark:bg-nexus-surface p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the image you want..."
                        className="flex-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none"
                    />
                    <button 
                        disabled={loading}
                        onClick={handleGenerate}
                        className="bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        {loading ? 'Painting...' : 'Generate'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedImages.map(img => (
                    <div key={img.id} className="group relative rounded-2xl overflow-hidden aspect-video shadow-lg">
                        <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                            <p className="text-white text-sm line-clamp-2">{img.prompt}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RankChecker = () => {
    const { rankData, setRankData, addAgentTask, updateAgentTask } = useAppContext();
    const [domain, setLocalDomain] = useState('');
    const [keywordsStr, setKeywordsStr] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCheck = async () => {
        if (!domain || !keywordsStr) return;
        setLoading(true);
        const kws = keywordsStr.split(',').map(s => s.trim());
        const taskId = `rank-${Date.now()}`;
        addAgentTask({
            id: taskId, type: 'ANALYST', name: 'Rank Check', status: 'working',
            message: 'Checking positions...', progress: 0, logs: [], startTime: Date.now()
        });

        try {
            const data = await GeminiService.checkRank(domain, kws);
            // Process bulk response into RankData format
            const newRankData: DomainRankInfo[] = data.results.map(r => ({
                domain, keyword: r.keyword, currentRank: r.rank || 0, history: []
            }));
            setRankData(newRankData);
            updateAgentTask(taskId, { status: 'completed', message: 'Rank check complete', progress: 100 });
        } catch (e) {
             updateAgentTask(taskId, { status: 'error', message: 'Rank check failed', progress: 0 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <header>
                <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">Rank Tracker</h1>
            </header>
            
            <div className="bg-white dark:bg-nexus-surface p-6 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <input type="text" value={domain} onChange={(e) => setLocalDomain(e.target.value)} placeholder="Domain (e.g. example.com)" className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none" />
                     <input type="text" value={keywordsStr} onChange={(e) => setKeywordsStr(e.target.value)} placeholder="Keywords (comma separated)" className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none" />
                 </div>
                 <button disabled={loading} onClick={handleCheck} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                    {loading ? 'Scanning SERPs...' : 'Check Ranks'}
                 </button>
            </div>

            <div className="bg-white dark:bg-nexus-surface rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-white/5">
                        <tr>
                            <th className="p-4 text-left text-sm font-bold text-slate-500">Keyword</th>
                            <th className="p-4 text-left text-sm font-bold text-slate-500">Current Rank</th>
                            <th className="p-4 text-left text-sm font-bold text-slate-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {rankData.map((item, i) => (
                            <tr key={i}>
                                <td className="p-4 text-slate-900 dark:text-white">{item.keyword}</td>
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <span className={`text-xl font-bold ${item.currentRank > 0 && item.currentRank <= 3 ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {item.currentRank === 0 ? '-' : item.currentRank}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {item.currentRank > 0 ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                            Indexed
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-500">
                                            Not Found
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Main App Component ---

const AppContent = () => {
  const { agentTasks, isSidebarCollapsed } = useAppContext();
  const isProcessing = agentTasks.some(t => t.status === 'working');

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-nexus-dark transition-colors duration-500">
      <Sidebar />
      <ThemeToggle />
      <Mascot processing={isProcessing} />
      
      <main className={`flex-1 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} p-10 min-h-screen overflow-x-hidden transition-all duration-300`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/keywords" element={<KeywordResearch />} />
          <Route path="/serp" element={<SerpLab />} />
          <Route path="/strategy" element={<StrategyCore />} />
          <Route path="/articles" element={<ArticleForge />} />
          <Route path="/images" element={<ImageStudio />} />
          <Route path="/rank" element={<RankChecker />} />
          <Route path="/analytics" element={<AnalyticsCommandCenter />} />
          <Route path="*" element={<div className="text-center mt-20 text-slate-500">Module Under Construction</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  // Global State
  const [domain, setDomain] = useState('');
  const [sitemap, setSitemap] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<KeywordMetric[]>([]);
  const [serpResults, setSerpResults] = useState<Record<string, SerpResult>>({});
  const [articles, setArticles] = useState<GeneratedArticle[]>([]);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [rankData, setRankData] = useState<DomainRankInfo[]>([]);
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [gaConnected, setGaConnected] = useState(false);

  // Helpers
  const addSerpResult = (k: string, r: SerpResult) => setSerpResults(prev => ({...prev, [k]: r}));
  const addArticle = (a: GeneratedArticle) => setArticles(prev => [a, ...prev]);
  const updateArticle = (id: string, updates: Partial<GeneratedArticle>) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };
  const addAgentTask = (t: AgentTask) => setAgentTasks(prev => [...prev, t]);
  const updateAgentTask = (id: string, updates: Partial<AgentTask>) => {
    setAgentTasks(prev => prev.map(t => {
        if (t.id !== id) return t;
        const newLogs = updates.logs ? [...t.logs, ...updates.logs] : t.logs;
        return { ...t, ...updates, logs: newLogs };
    }));
  };
  const addGeneratedImage = (i: GeneratedImage) => setGeneratedImages(prev => [i, ...prev]);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const state: AppState = {
    domain, setDomain,
    sitemap, setSitemap,
    keywords, setKeywords,
    serpResults, addSerpResult,
    articles, addArticle, updateArticle,
    agentTasks, addAgentTask, updateAgentTask,
    rankData, setRankData,
    strategy, setStrategy,
    generatedImages, addGeneratedImage,
    isSidebarCollapsed, toggleSidebar,
    gaConnected, setGaConnected
  };

  return (
    <AppContext.Provider value={state}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppContext.Provider>
  );
}
