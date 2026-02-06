
import React from 'react';
import { Activity, Anchor, BarChart3, Bot, ChevronRight, FileText, Globe, Layers, LayoutDashboard, Search, Settings, Sparkles, Zap, Database, Image as ImageIcon, LineChart } from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'Mission Control', icon: <LayoutDashboard size={20} />, path: '/' },
  { name: 'Keyword Intel', icon: <Search size={20} />, path: '/keywords' },
  { name: 'SERP Lab', icon: <Database size={20} />, path: '/serp' },
  { name: 'Strategy Core', icon: <Activity size={20} />, path: '/strategy' },
  { name: 'Content Forge', icon: <FileText size={20} />, path: '/articles' },
  { name: 'Image Studio', icon: <ImageIcon size={20} />, path: '/images' },
  { name: 'Rank Tracker', icon: <BarChart3 size={20} />, path: '/rank' },
  { name: 'Analytics AI', icon: <LineChart size={20} />, path: '/analytics' },
];

export const THEME_CONFIG = {
  light: {
    bg: 'bg-slate-50',
    card: 'bg-white/80',
    text: 'text-slate-900',
    border: 'border-slate-200'
  },
  dark: {
    bg: 'bg-nexus-dark',
    card: 'bg-nexus-surface/60',
    text: 'text-slate-100',
    border: 'border-white/10'
  }
};
