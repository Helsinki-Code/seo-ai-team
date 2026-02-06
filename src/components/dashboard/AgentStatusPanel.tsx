"use client";

import { motion } from "framer-motion";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: "idle" | "working" | "blocked" | "needs_approval";
  currentTask?: string;
  avatar: string;
}

const AGENTS: Agent[] = [
  {
    id: "1",
    name: "Technical SEO",
    type: "agent",
    status: "working",
    currentTask: "Fixing broken links",
    avatar: "⚙️",
  },
  {
    id: "2",
    name: "Content Strategy",
    type: "agent",
    status: "idle",
    avatar: "📊",
  },
  {
    id: "3",
    name: "Content Creator",
    type: "agent",
    status: "working",
    currentTask: "Writing SEO guide",
    avatar: "✍️",
  },
];

const statusConfig = {
  idle: { color: "bg-emerald-500/20 border-emerald-500/30", dot: "bg-emerald-400" },
  working: { color: "bg-blue-500/20 border-blue-500/30", dot: "bg-blue-400" },
  blocked: { color: "bg-yellow-500/20 border-yellow-500/30", dot: "bg-yellow-400" },
  needs_approval: { color: "bg-purple-500/20 border-purple-500/30", dot: "bg-purple-400" },
};

export function AgentStatusPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-3"
    >
      <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-6">
        Agent Team Status
      </div>
      {AGENTS.map((agent, idx) => {
        const config = statusConfig[agent.status];
        return (
          <motion.button
            key={agent.id}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-4 rounded-lg border transition ${config.color} group cursor-pointer`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="text-2xl">{agent.avatar}</div>
                <motion.div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${config.dot}`}
                  animate={agent.status === "working" ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">{agent.name}</p>
                {agent.currentTask && (
                  <p className="text-xs text-neutral-400 group-hover:text-neutral-300 transition">
                    {agent.currentTask}
                  </p>
                )}
              </div>
              <div className="text-xs font-medium text-neutral-500 group-hover:text-neutral-400 transition">
                {agent.status === "idle" && "Ready"}
                {agent.status === "working" && "Active"}
                {agent.status === "blocked" && "Blocked"}
                {agent.status === "needs_approval" && "Pending"}
              </div>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
