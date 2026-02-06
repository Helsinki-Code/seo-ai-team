"use client";

import { motion } from "framer-motion";
import { MetricCard } from "@/components/ui/LoadingCard";
import { AgentStatusPanel } from "@/components/dashboard/AgentStatusPanel";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import MonetizationDashboard from "@/components/dashboard/MonetizationDashboard";
import GuestPostingTracker from "@/components/dashboard/GuestPostingTracker";
import EmailTrackingDashboard from "@/components/dashboard/EmailTrackingDashboard";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "monetization" | "guest-posting" | "email-tracking" | "meetings" | "tasks">("overview");
  const [websiteId] = useState(1); // In production, get from context/auth

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-blue-950/10 to-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <h1 className="text-xl font-light tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition">
                AI SEO Employees
              </h1>
            </Link>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden sm:flex gap-1 bg-neutral-900/40 rounded-lg p-1 border border-neutral-800 overflow-x-auto">
            {(["overview", "monetization", "guest-posting", "email-tracking", "meetings", "tasks"] as const).map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                    : "text-neutral-400 hover:text-neutral-300"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab === "guest-posting" ? "Guest Posts" : tab === "email-tracking" ? "Email" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </div>

          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
              },
            }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-light tracking-tight text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-neutral-400">
            Your AI team is working 24/7 to improve your search presence
          </p>
        </motion.div>

        {activeTab === "overview" && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Workflow Quick Links */}
            <motion.div variants={itemVariants} className="flex gap-4">
              <Link href="/workflow">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-cyan-500/50 text-white rounded-lg transition font-semibold"
                >
                  ✨ Start New Workflow
                </motion.button>
              </Link>
            </motion.div>

            {/* Metrics Grid */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <MetricCard
                label="Organic Traffic"
                value="12,450"
                change="+24%"
                icon="📈"
              />
              <MetricCard
                label="Avg. Rankings"
                value="4.2"
                change="+0.8"
                icon="🎯"
              />
              <MetricCard
                label="Domain Authority"
                value="42"
                change="+3"
                icon="⚡"
              />
              <MetricCard
                label="Backlinks Acquired"
                value="24"
                change="+8 this month"
                icon="🔗"
              />
            </motion.div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Agent Status & Activity */}
              <motion.div variants={itemVariants} className="lg:col-span-1 space-y-8">
                <div className="p-6 rounded-xl bg-gradient-to-br from-neutral-900/60 to-neutral-950/40 border border-neutral-800/50 backdrop-blur-sm">
                  <AgentStatusPanel />
                </div>
              </motion.div>

              {/* Right Column: Activity Feed */}
              <motion.div
                variants={itemVariants}
                className="lg:col-span-2 p-6 rounded-xl bg-gradient-to-br from-neutral-900/60 to-neutral-950/40 border border-neutral-800/50 backdrop-blur-sm"
              >
                <ActivityFeed />
              </motion.div>
            </div>

            {/* Task Board Preview */}
            <motion.div
              variants={itemVariants}
              className="p-6 rounded-xl bg-gradient-to-br from-neutral-900/60 to-neutral-950/40 border border-neutral-800/50 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                  Current Tasks
                </div>
                <Link href="/dashboard/tasks">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition"
                  >
                    View All →
                  </motion.button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["To Do", "In Progress", "Completed"].map((status) => (
                  <div
                    key={status}
                    className="p-4 rounded-lg bg-neutral-800/20 border border-neutral-700/30 min-h-40"
                  >
                    <p className="text-xs font-semibold text-neutral-400 mb-4 uppercase tracking-tight">
                      {status}
                    </p>
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          className="p-2 bg-neutral-700/30 rounded-md border border-neutral-600/30 text-xs text-neutral-400 cursor-grab active:cursor-grabbing"
                        >
                          Task {i}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === "monetization" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <MonetizationDashboard websiteId={websiteId} />
          </motion.div>
        )}

        {activeTab === "guest-posting" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <GuestPostingTracker websiteId={websiteId} />
          </motion.div>
        )}

        {activeTab === "email-tracking" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <EmailTrackingDashboard websiteId={websiteId} type="outreach" />
          </motion.div>
        )}

        {activeTab === "meetings" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-6 rounded-xl bg-gradient-to-br from-neutral-900/60 to-neutral-950/40 border border-neutral-800/50 backdrop-blur-sm min-h-96 flex items-center justify-center"
          >
            <p className="text-neutral-400 text-center">Agent Meeting Room Coming Soon</p>
          </motion.div>
        )}

        {activeTab === "tasks" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-6 rounded-xl bg-gradient-to-br from-neutral-900/60 to-neutral-950/40 border border-neutral-800/50 backdrop-blur-sm min-h-96 flex items-center justify-center"
          >
            <p className="text-neutral-400 text-center">Task Board Coming Soon</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
