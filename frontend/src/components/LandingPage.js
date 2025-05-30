import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon, SpeakerWaveIcon, BoltIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const LandingPage = () => {
  const navigate = useNavigate();

  const parallaxVariants = {
    initial: { y: 0 },
    animate: { y: -20 },
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 w-full z-50 glass-effect"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C7</span>
              </div>
              <span className="text-xl font-bold">Celeste7</span>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/auth')}
              className="btn-bull-red text-white px-6 py-2 rounded-full font-semibold transition-all duration-120"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center hero-gradient">
        {/* Animated Background Elements */}
        <motion.div
          variants={parallaxVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 opacity-10"
        >
          <div className="absolute top-20 left-10 w-32 h-32 bg-teal-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-600 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-600 rounded-full blur-3xl opacity-20"></div>
        </motion.div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8"
          >
            {/* Main Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight text-shadow-premium"
            >
              <span className="hero-text-gradient">Your AI Co-Pilot</span>
              <br />
              <span className="text-white">for Unstoppable</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-600">
                Momentum
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-steel-gray max-w-3xl mx-auto leading-relaxed font-medium"
            >
              Anticipate, act, and accelerate—before you even think to ask.
              <br />
              <span className="text-bull-red font-bold text-shadow-premium">Doubt ends here.</span>
            </motion.p>

            {/* CTA Section */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mt-12"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="btn-bull-red px-8 py-4 rounded-full font-bold text-lg flex items-center space-x-2 btn-hover-scale"
              >
                <span>Start Your Journey</span>
                <ChevronRightIcon className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-effect-strong text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-120 border-0"
              >
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Voice Wave Animation */}
            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-center space-x-2 mt-16"
            >
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`waveform-bar w-1 rounded-full`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Built for <span className="text-accent-teal">Driven Founders</span>
            </h2>
            <p className="text-xl text-steel-gray max-w-3xl mx-auto">
              Shopify, Amazon FBA, dropshipping, or early-stage SaaS—Celeste7 understands your hustle.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <SpeakerWaveIcon className="w-8 h-8" />,
                title: "Voice-First AI",
                description: "Brutally honest, under-5-word prompts that cut through excuses and drive action."
              },
              {
                icon: <BoltIcon className="w-8 h-8" />,
                title: "Proactive Accountability",
                description: "Anticipatory nudges before you ask. Your AI mentor knows what you need."
              },
              {
                icon: <ChartBarIcon className="w-8 h-8" />,
                title: "Holistic Metrics",
                description: "Unifying business KPIs, health data, and emotional state into one experience."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                className="glass-effect p-8 rounded-2xl"
              >
                <div className="text-accent-teal mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-steel-gray">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-teal-900 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to End the Doubt?
            </h2>
            <p className="text-xl text-gray-200 mb-8">
              Join 1000+ founders who've already transformed their momentum.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/auth')}
              className="btn-bull-red text-white px-8 py-4 rounded-full font-bold text-lg btn-hover-scale"
            >
              Start Free Today
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;