"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface Activity {
  id: string;
  agent: string;
  action: string;
  timestamp: Date;
  icon: string;
  status: "success" | "pending" | "error";
}

const mockActivities: Activity[] = [
  {
    id: "1",
    agent: "Technical SEO",
    action: "Fixed 12 broken internal links",
    timestamp: new Date(Date.now() - 2 * 60000),
    icon: "✓",
    status: "success",
  },
  {
    id: "2",
    agent: "Content Creator",
    action: "Published: 'Complete SEO Audit Guide'",
    timestamp: new Date(Date.now() - 15 * 60000),
    icon: "📄",
    status: "success",
  },
  {
    id: "3",
    agent: "Content Strategy",
    action: "Analyzing competitor content gaps...",
    timestamp: new Date(Date.now() - 30 * 60000),
    icon: "⏳",
    status: "pending",
  },
];

function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>(mockActivities);

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
        Live Activity
      </div>
      <AnimatePresence>
        {activities.map((activity, idx) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 10, x: -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 rounded-lg bg-gradient-to-r from-neutral-900/40 to-neutral-950/20 border border-neutral-800/30 hover:border-neutral-700/50 transition"
          >
            <div className="flex items-start gap-4">
              <motion.div
                className={`text-lg flex-shrink-0 ${
                  activity.status === "success"
                    ? "text-emerald-400"
                    : activity.status === "pending"
                    ? "text-blue-400"
                    : "text-red-400"
                }`}
                animate={activity.status === "pending" ? { opacity: [0.5, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {activity.icon}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {activity.agent}
                  </p>
                  <span className="text-xs text-neutral-500">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-neutral-400">{activity.action}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
