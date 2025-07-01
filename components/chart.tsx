import {
  AreaChart,
  BarChart3,
  FileSearch,
  LineChart,
  Loader2,
} from "lucide-react";
import { useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load chart variants for better performance
const AreaVariant = lazy(() => import("./area-variant").then(module => ({ default: module.AreaVariant })));
const BarVariant = lazy(() => import("./bar-variant").then(module => ({ default: module.BarVariant })));
const LineVariant = lazy(() => import("./line-variant").then(module => ({ default: module.LineVariant })));

type ChartProps = {
  data?: {
    date: string;
    income: number;
    expenses: number;
  }[];
};

export const Chart = ({ data = [] }: ChartProps) => {
  type ChartType = "area" | "bar" | "line";
  const [chartType, setChartType] = useState<ChartType>("area");

  const onTypeChange = (type: ChartType) => {
    setChartType(type);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="glass border-none drop-shadow-xl card-modern">
        <CardHeader className="flex justify-between space-y-2 lg:flex-row lg:items-center lg:space-y-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <CardTitle className="line-clamp-1 text-2xl font-bold text-gradient">
              Transactions
            </CardTitle>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Select defaultValue={chartType} onValueChange={onTypeChange}>
              <SelectTrigger className="h-9 rounded-md px-3 lg:w-auto glass border-white/20 hover:border-white/40 transition-all">
                <SelectValue placeholder="Chart type" />
              </SelectTrigger>

              <SelectContent className="glass border-white/20">
                <SelectItem value="area">
                  <div className="flex items-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AreaChart className="mr-2 size-4 shrink-0 text-blue-500" />
                    </motion.div>
                    <p className="line-clamp-1">Area chart</p>
                  </div>
                </SelectItem>

                <SelectItem value="line">
                  <div className="flex items-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <LineChart className="mr-2 size-4 shrink-0 text-green-500" />
                    </motion.div>
                    <p className="line-clamp-1">Line chart</p>
                  </div>
                </SelectItem>

                <SelectItem value="bar">
                  <div className="flex items-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <BarChart3 className="mr-2 size-4 shrink-0 text-purple-500" />
                    </motion.div>
                    <p className="line-clamp-1">Bar chart</p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        </CardHeader>

        <CardContent>
          {data.length === 0 ? (
            <motion.div 
              className="flex h-[350px] w-full flex-col items-center justify-center gap-y-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <FileSearch className="size-12 text-muted-foreground neon-glow-blue" />
              </motion.div>
              <p className="text-lg text-muted-foreground font-medium">
                No data for this period.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Suspense fallback={
                <div className="flex h-[350px] w-full items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="size-8 text-primary neon-glow" />
                  </motion.div>
                </div>
              }>
                {chartType === "area" && <AreaVariant data={data} />}
                {chartType === "bar" && <BarVariant data={data} />}
                {chartType === "line" && <LineVariant data={data} />}
              </Suspense>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const ChartLoading = () => {
  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader className="flex justify-between space-y-2 lg:flex-row lg:items-center lg:space-y-0">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-full lg:w-[120px]" />
      </CardHeader>

      <CardContent>
        <div className="flex h-[350px] w-full items-center justify-center">
          <Loader2 className="size-6 animate-spin text-slate-300" />
        </div>
      </CardContent>
    </Card>
  );
};
