"use client";

import Link from "next/link";
import { SignUpButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-blue-950/15 to-neutral-950 relative overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-light tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
          >
            AI SEO Employees
          </motion.div>
          <motion.div className="space-x-3 flex items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <SignedOut>
              <SignInButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-neutral-400 hover:text-neutral-200 font-medium transition"
                >
                  Sign In
                </motion.button>
              </SignInButton>
              <SignUpButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-semibold transition shadow-lg shadow-blue-500/20"
                >
                  Get Started
                </motion.button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold transition"
                >
                  Dashboard
                </motion.button>
              </Link>
            </SignedIn>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight mb-6 bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent leading-[1.1]"
          >
            Your 24/7 AI SEO Team
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-neutral-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            An autonomous AI workforce executes comprehensive SEO strategies on autopilot.
            Watch your agents work in real-time, acquire backlinks, publish content, and
            drive organic growth—at a fraction of traditional agency costs.
          </motion.p>
          <motion.div variants={itemVariants} className="flex gap-4 justify-center flex-wrap">
            <SignedOut>
              <SignUpButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-semibold text-lg transition shadow-lg shadow-blue-500/30"
                >
                  Get Started in 60 Seconds
                </motion.button>
              </SignUpButton>
            </SignedOut>
            <Link href="#features">
              <motion.button
                whileHover={{ scale: 1.05, borderColor: "rgb(229, 231, 235)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border border-neutral-600 hover:border-neutral-300 rounded-lg font-semibold text-lg transition text-neutral-300 hover:text-white"
              >
                See How It Works
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Agent Team Visualization */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
        >
          {[
            { icon: "⚙️", title: "Technical SEO Agent", desc: "Crawl audits, performance optimization, schema markup implementation" },
            { icon: "✍️", title: "Content Creator Agent", desc: "Generates SEO-optimized articles, blog posts, guides" },
            { icon: "🔗", title: "Link Builder Agent", desc: "Acquires high-quality backlinks from relevant domains" },
          ].map((agent, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -8, boxShadow: "0 0 30px rgba(59, 130, 246, 0.15)" }}
              className="p-8 rounded-xl backdrop-blur-md bg-gradient-to-br from-blue-600/10 to-cyan-600/5 border border-neutral-700/50 hover:border-blue-500/40 transition group cursor-pointer"
            >
              <motion.div
                className="text-5xl mb-6 group-hover:scale-110 transition-transform"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: idx * 0.5 }}
              >
                {agent.icon}
              </motion.div>
              <h3 className="text-lg font-semibold mb-3 text-white">{agent.title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{agent.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Section */}
        <motion.section
          id="features"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-light tracking-tight mb-10 text-white leading-[1.2]">
              Meet Your AI Employees
            </h2>
            <ul className="space-y-5">
              {[
                "Real-time agent meeting room with live conversations",
                "Fully autonomous task execution & coordination",
                "Daily performance tracking & detailed reporting",
                "Human-in-the-loop approvals for high-impact actions",
                "White-label ready for agency resale",
                "Custom agent training on your brand voice",
              ].map((feature, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4 text-neutral-300 group hover:text-white transition"
                >
                  <motion.span
                    className="mt-1.5 w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform"
                    animate={{ boxShadow: ["0 0 0 0px rgba(59, 130, 246, 0.4)", "0 0 0 8px rgba(59, 130, 246, 0)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-base">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-neutral-900/20 border border-blue-500/20 rounded-2xl p-12 backdrop-blur-md min-h-96 flex flex-col items-center justify-center relative overflow-hidden group"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute w-40 h-40 border border-blue-500/20 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
            <p className="text-neutral-400 text-center relative z-10">
              🚀 <br /> Dashboard Preview Coming Soon
            </p>
          </motion.div>
        </motion.section>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-32 py-20 px-8 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/30 backdrop-blur-md text-center overflow-hidden relative"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl font-light tracking-tight mb-6 text-white"
            >
              Stop Paying $10K/Month for SEO
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="text-xl text-neutral-300 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Get enterprise-grade SEO from your dedicated AI team for a fraction of traditional agency costs.
            </motion.p>
            <SignedOut>
              <SignUpButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.08, boxShadow: "0 0 40px rgba(59, 130, 246, 0.6)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-12 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-semibold text-lg transition shadow-lg shadow-blue-500/40 text-white"
                >
                  Start Your Free Trial Today
                </motion.button>
              </SignUpButton>
            </SignedOut>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
