import { type IconType } from "react-icons";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";

import { CountUp } from "./count-up";

const boxVariant = cva("shrink-0 rounded-md p-3 relative overflow-hidden", {
  variants: {
    variant: {
      default: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30",
      success: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30",
      danger: "bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30",
      warning: "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const iconVariant = cva("size-6 relative z-10", {
  variants: {
    variant: {
      default: "text-blue-500 drop-shadow-2xl filter brightness-110",
      success: "text-emerald-500 drop-shadow-2xl filter brightness-110",
      danger: "text-rose-500 drop-shadow-2xl filter brightness-110",
      warning: "text-yellow-500 drop-shadow-2xl filter brightness-110",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type BoxVariants = VariantProps<typeof boxVariant>;
type IconVariants = VariantProps<typeof iconVariant>;

type DataCardProps = BoxVariants &
  IconVariants & {
    icon: IconType;
    title: string;
    value?: number;
    dateRange: string;
    percentageChange?: number;
  };

export const DataCard = ({
  title,
  value = 0,
  percentageChange = 0,
  icon: Icon,
  variant,
  dateRange,
}: DataCardProps) => {
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  const glowVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { delay: 0.3, duration: 1 }
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      whileHover={{ 
        scale: 1.03, 
        transition: { duration: 0.2 }
      }}
    >
      <Card className="glass border-none drop-shadow-2xl hover:drop-shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] shadow-2xl hover:shadow-[0_35px_60px_-12px_rgba(0,0,0,0.3)] transition-all duration-300 relative overflow-hidden group">
        {/* Animated background glow */}
        <motion.div
          variants={glowVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
        
        <CardHeader className="flex flex-row items-center justify-between gap-x-4 relative z-10">
          <div className="space-y-2">
            <CardTitle className="line-clamp-1 text-2xl font-bold">
              {title}
            </CardTitle>
            <CardDescription className="line-clamp-1 text-muted-foreground">
              {dateRange}
            </CardDescription>
          </div>

          <motion.div 
            className={cn(boxVariant({ variant }))}
            whileHover={{ 
              rotate: [0, -10, 10, 0], 
              transition: { duration: 0.5 }
            }}
          >
            {/* Floating background effect */}
            <motion.div
              className="absolute inset-0 rounded-md"
              animate={{
                background: [
                  "linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))",
                  "linear-gradient(90deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))",
                  "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <Icon className={cn(iconVariant({ variant }))} />
          </motion.div>
        </CardHeader>

        <CardContent className="relative z-10">
          <motion.h1 
            className="mb-2 line-clamp-1 break-all text-3xl font-bold "
            initial={{ opacity: 0, scale: 0.5 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <CountUp
              preserveValue
              start={0}
              end={value}
              decimals={2}
              decimalPlaces={2}
              formattingFn={formatCurrency}
            />
          </motion.h1>

          <motion.p
            className={cn(
              "line-clamp-1 text-sm font-medium",
              percentageChange > 0 && "text-emerald-500 neon-glow-green",
              percentageChange < 0 && "text-rose-500 neon-glow-pink",
              percentageChange === 0 && "text-muted-foreground"
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {formatPercentage(percentageChange, { addPrefix: true })} from last period.
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const DataCardLoading = () => {
  return (
    <Card className="h-[192px] border-none drop-shadow-2xl shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-40" />
        </div>

        <Skeleton className="size-12" />
      </CardHeader>

      <CardContent>
        <Skeleton className="mb-2 h-10 w-24 shrink-0" />
        <Skeleton className="h-4 w-40 shrink-0" />
      </CardContent>
    </Card>
  );
};
