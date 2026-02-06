"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";

const OnboardingSteps = [
  {
    id: 1,
    title: "Welcome to Your AI SEO Team",
    description: "Let's set up your first website and meet your AI employees",
  },
  {
    id: 2,
    title: "Enter Your Website",
    description: "Provide the URL of the website you want to optimize",
  },
  {
    id: 3,
    title: "Connect Google Search Console",
    description: "Authenticate with GSC to access your search performance data",
  },
  {
    id: 4,
    title: "Strategy Review",
    description: "Your SEO Director will present an initial analysis and 90-day plan",
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNextStep = async () => {
    if (currentStep === 2 && !websiteUrl.trim()) {
      alert("Please enter a website URL");
      return;
    }

    if (currentStep === 4) {
      router.push("/dashboard");
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentStep(4);
      setIsLoading(false);
    }, 1500);
  };

  const progressPercent = (currentStep / OnboardingSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-blue-950/15 to-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex justify-between mb-6">
            {OnboardingSteps.map((step) => (
              <motion.div
                key={step.id}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-light text-sm transition ${
                  step.id <= currentStep
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20"
                    : "bg-neutral-800 text-neutral-500"
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: (step.id - 1) * 0.1 }}
              >
                {step.id <= currentStep ? "✓" : step.id}
              </motion.div>
            ))}
          </div>
          <div className="h-1.5 bg-neutral-800/50 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-gradient-to-br from-neutral-900/70 to-neutral-950/50 backdrop-blur-xl border border-neutral-800/50 rounded-2xl p-8 md:p-12 shadow-2xl shadow-blue-500/10"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-3 bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
              {OnboardingSteps[currentStep - 1].title}
            </h1>
            <p className="text-neutral-400 text-lg mb-8">
              {OnboardingSteps[currentStep - 1].description}
            </p>
          </motion.div>

          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: "⚙️", name: "Technical SEO Agent", desc: "Crawl errors & optimization" },
                  { icon: "✍️", name: "Content Creator", desc: "SEO-optimized articles" },
                  { icon: "🔗", name: "Link Builder", desc: "High-quality backlinks" },
                ].map((agent, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="p-5 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/30 hover:border-blue-400/50 transition text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                  >
                    <div className="text-4xl mb-3">{agent.icon}</div>
                    <p className="font-semibold text-white text-sm mb-2">{agent.name}</p>
                    <p className="text-xs text-neutral-400">{agent.desc}</p>
                  </motion.div>
                ))}
              </div>
              <div className="p-5 rounded-lg bg-neutral-800/30 border border-neutral-700/30">
                <p className="text-neutral-300 text-sm leading-relaxed">
                  Your dedicated team of AI agents will analyze your website, identify opportunities, and execute a comprehensive SEO strategy 24/7 without manual intervention.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Website URL */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3 uppercase tracking-tight">
                  Your Website URL
                </label>
                <motion.input
                  type="url"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-5 py-4 bg-neutral-800/50 border border-neutral-700/50 hover:border-neutral-600/50 focus:border-blue-500/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition backdrop-blur-sm"
                  whileFocus={{ scale: 1.01 }}
                />
              </div>
              <div className="p-5 rounded-lg bg-blue-600/10 border border-blue-500/20">
                <p className="text-neutral-400 text-sm">
                  ℹ️ We'll perform a full technical audit, crawl all pages, analyze your content, and gather SEO metrics. This typically takes 2-5 minutes.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Google Search Console */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-lg bg-gradient-to-br from-blue-600/15 to-cyan-600/10 border border-blue-500/30 space-y-4">
                <p className="font-semibold text-white mb-4">Connecting GSC enables:</p>
                <ul className="space-y-3">
                  {[
                    "View search queries & click data",
                    "Identify ranking opportunities",
                    "Monitor Core Web Vitals",
                    "Fix indexing issues",
                  ].map((item, idx) => (
                    <motion.li
                      key={idx}
                      className="flex items-center gap-3 text-neutral-300"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                    >
                      <span className="text-cyan-400">✓</span>
                      <span className="text-sm">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full py-4 bg-white text-neutral-950 font-semibold rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-4 h-4 border-2 border-transparent border-t-neutral-950 rounded-full"
                    />
                    Connecting...
                  </span>
                ) : (
                  "Connect Google Search Console"
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Step 4: Strategy Review */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <motion.div
                className="p-6 rounded-lg bg-gradient-to-br from-emerald-600/15 to-cyan-600/10 border border-emerald-500/30"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    className="text-4xl"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🤖
                  </motion.div>
                  <div>
                    <p className="font-semibold text-lg text-white">SEO Director Agent</p>
                    <p className="text-neutral-400 text-sm">Your strategy guide</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Initial Analysis", status: "Complete" },
                    { label: "90-Day Strategy", status: "Ready" },
                    { label: "Quick Wins Identified", status: "12 Opportunities" },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      className="flex justify-between items-center text-sm py-2 border-b border-emerald-500/20"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                    >
                      <span className="text-neutral-300">{item.label}</span>
                      <span className="text-emerald-400 font-semibold">{item.status}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              <p className="text-neutral-400 text-center text-sm">
                ✓ Your team is ready! Approve the strategy to begin autonomous SEO execution.
              </p>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-10 pt-6 border-t border-neutral-800/30">
            {currentStep > 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 border border-neutral-600 hover:border-neutral-400 rounded-lg font-medium text-neutral-300 hover:text-white transition"
              >
                Back
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNextStep}
              disabled={isLoading}
              className="ml-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg disabled:opacity-50 transition shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
            >
              {currentStep === 4 ? "Go to Dashboard" : "Next"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
