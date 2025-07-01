"use client";

import { useEffect } from 'react';

export const PerformanceMonitor = () => {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Log or send to analytics service
        if ('value' in entry) {
          console.log(`${entry.name}:`, entry.value);
        } else {
          console.log(`${entry.name}:`, entry.duration);
        }
      });
    });

    // Observe paint, navigation, and layout shifts
    observer.observe({ entryTypes: ['paint', 'navigation', 'layout-shift'] });

    return () => observer.disconnect();
  }, []);

  return null;
};
