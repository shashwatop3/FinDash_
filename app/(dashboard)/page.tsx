"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { DataCharts } from "@/components/data-charts";
import { DataGrid } from "@/components/data-grid";
import { AnimatedPage } from "@/providers/animation-provider";

const DashboardPage = () => {
  const { ref: headerRef, inView: headerInView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  const { ref: gridRef, inView: gridInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  const { ref: chartsRef, inView: chartsInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <AnimatedPage className="mx-auto w-full max-w-screen-2xl pb-10 space-y-8">
      {/* Welcome Header */}
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: -50 }}
        animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl glass p-8 mt-6"
      >
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={headerInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl font-bold text-gradient mb-2"
          >
            Welcome to Your Financial Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -30 }}
            animate={headerInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg text-muted-foreground"
          >
            Track your finances with modern insights and beautiful analytics
          </motion.p>
        </div>
        
        {/* Floating background elements */}
        <motion.div
          className="absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20"
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 180, 360],
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div
          className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-gradient-to-r from-emerald-400/20 to-cyan-400/20"
          animate={{ 
            y: [0, 10, 0],
            rotate: [360, 180, 0],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </motion.div>

      {/* Data Grid Section */}
      <motion.div
        ref={gridRef}
        initial={{ opacity: 0, y: 50 }}
        animate={gridInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <DataGrid />
      </motion.div>

      {/* Charts Section */}
      <motion.div
        ref={chartsRef}
        initial={{ opacity: 0, y: 50 }}
        animate={chartsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <DataCharts />
      </motion.div>
    </AnimatedPage>
  );
};

export default DashboardPage;
