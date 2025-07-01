"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export const WelcomeMsg = () => {
  const { user, isLoaded } = useUser();
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <motion.div 
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="mb-4 space-y-4"
    >
      <motion.div variants={itemVariants}>
        <motion.h2 
          className="text-3xl font-bold text-white lg:text-5xl relative"
          variants={textVariants}
        >
          <span className="relative z-10">
            Welcome back
            {isLoaded ? ", " : " "}
            <motion.span
              className="text-gradient bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
              initial={{ scale: 0.8 }}
              animate={inView ? { scale: 1 } : { scale: 0.8 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {user?.firstName}
            </motion.span>
          </span>
          <motion.span
            className="ml-2 inline-block text-4xl lg:text-6xl"
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
          >
            👋
          </motion.span>
          
          {/* Background glow effect */}
          <motion.div
            className="absolute inset-0 blur-xl bg-gradient-to-r from-cyan-400/30 to-purple-400/30 -z-10"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.h2>
      </motion.div>

      <motion.div variants={itemVariants}>
        <motion.p 
          className="text-lg text-cyan-100 lg:text-xl font-medium"
          variants={textVariants}
        >
          This is your 
          <motion.span
            className="mx-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold"
            whileHover={{ 
              scale: 1.05, 
              backgroundColor: "rgba(255, 255, 255, 0.2)" 
            }}
            transition={{ duration: 0.2 }}
          >
            financial overview
          </motion.span>
          report.
        </motion.p>
      </motion.div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};
