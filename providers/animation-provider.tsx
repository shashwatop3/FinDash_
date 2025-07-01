"use client";

import { createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimationContextType {
  pageVariants: any;
  containerVariants: any;
  itemVariants: any;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

interface AnimationProviderProps {
  children: ReactNode;
}

export const AnimationProvider = ({ children }: AnimationProviderProps) => {
  const value = {
    pageVariants,
    containerVariants,
    itemVariants,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

// Reusable animated components
export const AnimatedPage = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className={className}
  >
    {children}
  </motion.div>
);

export const AnimatedContainer = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className={className}
  >
    {children}
  </motion.div>
);

export const AnimatedItem = ({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => (
  <motion.div
    variants={itemVariants}
    initial="hidden"
    animate="visible"
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// Card hover animations
export const HoverCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{
      y: -8,
      scale: 1.02,
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.3 },
    }}
    whileTap={{ scale: 0.98 }}
    className={className}
  >
    {children}
  </motion.div>
);

// Button animations
export const AnimatedButton = ({ children, className = "", onClick, ...props }: any) => (
  <motion.button
    whileHover={{
      scale: 1.05,
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
    }}
    whileTap={{ scale: 0.95 }}
    transition={{ duration: 0.2 }}
    className={`btn-modern ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </motion.button>
);

// Loading spinner
export const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
  />
);
