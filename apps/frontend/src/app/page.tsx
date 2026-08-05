'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight, Menu, X, Play, Zap, Shield, Database, BarChart3, Users, Github, Twitter, Mail } from 'lucide-react';

const features = [
  { icon: Shield, label: 'Secure Authentication', desc: 'JWT + RBAC protection' },
  { icon: Zap, label: 'Webhook Automation', desc: 'Instant payload processing' },
  { icon: Play, label: 'AI-Powered Processing', desc: 'Smart summarization' },
  { icon: Database, label: 'Real-time Logs', desc: 'Full execution history' },
  { icon: BarChart3, label: 'Analytics Dashboard', desc: 'Usage insights' },
  { icon: Users, label: 'Team Collaboration', desc: 'Multi-tenant workspaces' },
];

const stats = [
  { value: '10K+', label: 'Workflows Running' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '1M+', label: 'Events Processed' },
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  const yHero = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

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
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05, 
      boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)',
      transition: { duration: 0.2 },
    },
  };

  const featuresVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 overflow-x-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 supports-[backdrop-filter:blur(20px)]:bg-slate-900/80"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
            FlowForge
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-slate-50 transition-colors">
              Product
            </Link>
            <Link href="/documentation" className="text-sm font-medium text-slate-300 hover:text-slate-50 transition-colors">
              Docs
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-300 hover:text-slate-50 transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold border border-slate-700/50 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 text-slate-200 rounded-lg hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm transition-all duration-200 font-medium">
              Sign in
            </Link>
            <Link href="/register" className="hidden md:inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-medium">
              Start Free
            </Link>
            <button
              className="md:hidden p-2 rounded-lg border border-slate-700 hover:bg-slate-800"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ x: mobileOpen ? 0 : '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="md:hidden fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-700 z-50 p-6"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">FlowForge</h2>
            <button onClick={() => setMobileOpen(false)} className="p-1">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="space-y-4">
            <Link href="/dashboard" className="block py-2 text-lg hover:text-primary-400" onClick={() => setMobileOpen(false)}>
              Product
            </Link>
            <Link href="/documentation" className="block py-2 text-lg hover:text-primary-400" onClick={() => setMobileOpen(false)}>
              Docs
            </Link>
            <Link href="/login" className="block py-2 text-lg hover:text-primary-400" onClick={() => setMobileOpen(false)}>
              Sign in
            </Link>
            <Link href="/register" className="block py-2 text-lg hover:text-primary-400" onClick={() => setMobileOpen(false)}>
              Start Free
            </Link>
          </nav>
        </motion.div>
      </motion.header>

      <motion.main style={{ y: yHero }} className="relative">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row items-center gap-12 px-6 py-20 lg:py-32">
          <motion.div 
            className="lg:w-1/2 space-y-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <span className="inline-block px-4 py-1 bg-primary-500/20 text-primary-400 text-xs font-semibold uppercase tracking-wider rounded-full border border-primary-500/30">
                Automation + AI
              </span>
            </motion.div>
            <motion.h1 
              className="text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent"
              variants={itemVariants}
            >
              AI-Powered <br /> Workflow Automation <br /> for Modern Teams
            </motion.h1>
            <motion.p 
              className="text-xl text-slate-300 max-w-lg leading-relaxed"
              variants={itemVariants}
            >
              Build secure webhook automations, process payloads with intelligent AI, 
              and gain complete visibility into every execution from your multi-tenant dashboard.
            </motion.p>
            <motion.div className="flex flex-wrap gap-4" variants={itemVariants}>
              <motion.div variants={buttonVariants} whileHover="hover">
                <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 font-medium">
                  Start Free <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.div variants={buttonVariants} whileHover="hover">
                <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold border border-slate-700/50 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 text-slate-200 rounded-xl hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm transition-all duration-200 font-medium">
                  View Demo
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="lg:w-1/2 relative"
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.02, rotate: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="p-8 rounded-2xl relative overflow-hidden shadow-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900/50 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-blue-500/5 -z-10" />
              <motion.div 
                animate={{ 
                  y: [0, -10, 0], 
                  rotate: [0, 2, -2, 0],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                }}
                className="font-mono text-sm text-slate-300 space-y-3"
              >
                <div>User → API Gateway → Redis Queue</div>
                <div className="text-primary-400 font-semibold">AI Processing → Database → Webhook</div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-success/20 text-success rounded-full">✅ Live</span>
                  <span>Latency: 247ms</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="mx-auto max-w-6xl px-6 py-20 bg-slate-900/30 rounded-3xl mx-8 -mt-12 relative z-10">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={featuresVariants}
          >
            {stats.map((stat, i) => (
              <motion.div key={stat.label} variants={itemVariants} className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-6 py-32">
          <motion.div 
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 
              variants={itemVariants}
              className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-clip-text text-transparent mb-6"
            >
              Built for Production SaaS
            </motion.h2>
            <motion.p 
              variants={itemVariants}
              className="text-xl text-slate-400 max-w-2xl mx-auto"
            >
              Everything you need to power your AI automation platform at scale.
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={featuresVariants}
          >
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div 
                key={label}
                variants={itemVariants}
                whileHover={{ 
                  y: -10, 
                  scale: 1.02,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
                className="p-8 rounded-2xl hover:bg-slate-800/50 border border-slate-700/50 hover:border-primary-500/30 group cursor-pointer shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-slate-100">{label}</h3>
                <p className="text-slate-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </motion.main>

      {/* Footer */}
      <footer className="mt-32 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-lg">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
                FlowForge
              </Link>
              <p className="text-slate-400 max-w-md leading-relaxed">
                AI-powered workflow automation for modern teams. Secure, scalable, and built for production.
              </p>
              <div className="flex gap-4">
                <a href="https://github.com" className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all">
                  <Github className="h-5 w-5" />
                </a>
                <a href="https://twitter.com" className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-slate-200">Product</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/dashboard" className="hover:text-slate-50 transition-colors">Dashboard</Link></li>
                <li><Link href="/documentation" className="hover:text-slate-50 transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-slate-50 transition-colors">API Reference</Link></li>
                <li><Link href="/integrations" className="hover:text-slate-50 transition-colors">Integrations</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-slate-200">Company</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-slate-50 transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-slate-50 transition-colors">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-slate-50 transition-colors">Blog</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-slate-200">Stay Updated</h4>
              <p className="text-slate-400 mb-4 text-sm">Get product updates and AI automation tips.</p>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); alert('Thanks for subscribing!'); }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  required
                />
                <button type="submit" className="p-3 bg-primary-500 hover:bg-primary-600 rounded-xl transition-all flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <span>&copy; {new Date().getFullYear()} FlowForge. All rights reserved.</span>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-slate-400">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-400">Terms of Service</Link>
              <Link href="/security" className="hover:text-slate-400">Security</Link>
              <Link href="/status" className="hover:text-slate-400">Status</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

