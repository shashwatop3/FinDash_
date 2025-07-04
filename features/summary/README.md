# Summary Feature - Finance SaaS Platform

## Overview
The Summary feature provides comprehensive financial analytics and insights by aggregating transaction data. It displays key metrics, trends, and visualizations to help users understand their financial health and spending patterns.

## 🏗️ Feature Structure

```
features/summary/
└── api/                          # API hooks using React Query
    └── use-get-summary.ts        # Fetch financial summary data
```

## 🔧 API Integration

### Financial Summary Data
```typescript
// features/summary/api/use-get-summary.ts
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { client } from "@/lib/hono";

export const useGetSummary = () => {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const accountId = params.get("accountId") || "";

  const query = useQuery({
    queryKey: ["summary", { from, to, accountId }],
    queryFn: async () => {
      const response = await client.api.summary.$get({
        query: {
          from,
          to,
          accountId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
```

## 📊 Summary Components

### Financial Overview Cards
```typescript
// components/data-grid.tsx - Summary dashboard grid
import { useGetSummary } from "@/features/summary/api/use-get-summary";
import { DataCard } from "@/components/data-card";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";

export const DataGrid = () => {
  const { data, isLoading } = useGetSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-2 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[192px] bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const {
    currentPeriod,
    previousPeriod,
    remainingChange,
    remainingValue,
    incomeChange,
    incomeValue,
    expensesChange,
    expensesValue,
  } = data || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-2 mb-8">
      <DataCard
        title="Remaining"
        value={remainingValue}
        percentageChange={remainingChange}
        icon={FaArrowTrendUp}
        variant={remainingValue >= 0 ? "default" : "danger"}
      />
      <DataCard
        title="Income"
        value={incomeValue}
        percentageChange={incomeChange}
        icon={FaArrowTrendUp}
        variant="success"
      />
      <DataCard
        title="Expenses"
        value={expensesValue}
        percentageChange={expensesChange}
        icon={FaArrowTrendDown}
        variant="danger"
      />
    </div>
  );
};
```

### Data Card Component
```typescript
// components/data-card.tsx
import { IconType } from "react-icons";
import { VariantProps, cva } from "class-variance-authority";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { CountUp } from "@/components/count-up";

const boxVariant = cva("shrink-0 rounded-md p-3", {
  variants: {
    variant: {
      default: "bg-blue-500/20",
      success: "bg-emerald-500/20",
      danger: "bg-rose-500/20",
      warning: "bg-yellow-500/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const iconVariant = cva("size-6", {
  variants: {
    variant: {
      default: "fill-blue-600",
      success: "fill-emerald-600", 
      danger: "fill-rose-600",
      warning: "fill-yellow-600",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type BoxVariants = VariantProps<typeof boxVariant>;
type IconVariants = VariantProps<typeof iconVariant>;

interface DataCardProps extends BoxVariants, IconVariants {
  icon: IconType;
  title: string;
  value?: number;
  dateRange?: string;
  percentageChange?: number;
}

export const DataCard = ({
  icon: Icon,
  title,
  value = 0,
  variant,
  dateRange,
  percentageChange = 0,
}: DataCardProps) => {
  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-x-4">
        <div className="space-y-2">
          <CardTitle className="text-2xl line-clamp-1">{title}</CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {dateRange}
          </p>
        </div>
        <div className={boxVariant({ variant })}>
          <Icon className={iconVariant({ variant })} />
        </div>
      </CardHeader>
      <CardContent>
        <h1 className="font-bold text-2xl mb-2 line-clamp-1 break-all">
          <CountUp
            preserveValue
            start={0}
            end={value}
            decimals={2}
            decimalPlaces={2}
            formattingFn={formatCurrency}
          />
        </h1>
        <p
          className={cn(
            "text-muted-foreground text-sm line-clamp-1",
            percentageChange > 0 && "text-emerald-500",
            percentageChange < 0 && "text-rose-500"
          )}
        >
          {formatPercentage(percentageChange, { addPrefix: true })} from last period
        </p>
      </CardContent>
    </Card>
  );
};
```

### Chart Visualization
```typescript
// components/data-charts.tsx
import { useGetSummary } from "@/features/summary/api/use-get-summary";
import { Chart, ChartLoading } from "@/components/chart";

export const DataCharts = () => {
  const { data, isLoading } = useGetSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        <div className="col-span-1 lg:col-span-3 xl:col-span-4">
          <ChartLoading />
        </div>
        <div className="col-span-1 lg:col-span-3 xl:col-span-2">
          <ChartLoading />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
      <div className="col-span-1 lg:col-span-3 xl:col-span-4">
        <Chart data={data?.days || []} />
      </div>
      <div className="col-span-1 lg:col-span-3 xl:col-span-2">
        <SpendingPie data={data?.categories || []} />
      </div>
    </div>
  );
};
```

### Interactive Charts
```typescript
// components/chart.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, BarChart, LineChart } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaVariant } from "@/components/area-variant";
import { BarVariant } from "@/components/bar-variant";
import { LineVariant } from "@/components/line-variant";

type Props = {
  data?: {
    date: string;
    income: number;
    expenses: number;
  }[];
};

export const Chart = ({ data = [] }: Props) => {
  const [chartType, setChartType] = useState("area");

  const onTypeChange = (type: string) => {
    setChartType(type);
  };

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader className="flex space-y-2 lg:space-y-0 lg:flex-row lg:items-center justify-between">
        <CardTitle className="text-xl line-clamp-1">
          Transactions
        </CardTitle>
        <Select defaultValue={chartType} onValueChange={onTypeChange}>
          <SelectTrigger className="lg:w-auto h-9 rounded-md px-3">
            <SelectValue placeholder="Chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="area">
              Area chart
            </SelectItem>
            <SelectItem value="line">
              Line chart
            </SelectItem>
            <SelectItem value="bar">
              Bar chart
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {chartType === "line" && <LineVariant data={data} />}
        {chartType === "area" && <AreaVariant data={data} />}
        {chartType === "bar" && <BarVariant data={data} />}
      </CardContent>
    </Card>
  );
};

export const ChartLoading = () => {
  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader className="flex space-y-2 lg:space-y-0 lg:flex-row lg:items-center justify-between">
        <div className="h-8 w-48 bg-slate-300 rounded animate-pulse" />
        <div className="h-8 w-32 bg-slate-300 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full bg-slate-200 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
};
```

### Category Spending Pie Chart
```typescript
// components/spending-pie.tsx
import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CategoryTooltip } from "@/components/category-tooltip";

const COLORS = [
  "#0062FF",
  "#12C6FF",
  "#FF647C", 
  "#FF9354",
  "#06D6A0",
  "#F038FF",
  "#FFD23F",
];

type Props = {
  data?: {
    name: string;
    value: number;
  }[];
};

export const SpendingPie = ({ data = [] }: Props) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader className="flex space-y-2 lg:space-y-0 lg:flex-row lg:items-center justify-between">
        <CardTitle className="text-xl line-clamp-1">
          Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Tooltip content={<CategoryTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={60}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  className={
                    activeIndex === index
                      ? "drop-shadow-md"
                      : "drop-shadow-sm"
                  }
                />
              ))}
            </Pie>
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="right"
              iconType="circle"
              content={({ payload }: any) => {
                return (
                  <ul className="flex flex-col space-y-2">
                    {payload.map((entry: any, index: number) => (
                      <li
                        key={`item-${index}`}
                        className="flex items-center space-x-2"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <div className="space-x-1">
                          <span className="text-sm text-muted-foreground">
                            {entry.value}
                          </span>
                          <span className="text-sm">
                            {formatCurrency(entry.payload.value)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
```

## 🔧 Backend Integration

### Summary API Router
```typescript
// app/api/[[...route]]/summary.ts
import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { differenceInDays, parse, subDays } from "date-fns";
import { and, desc, eq, gte, lt, lte, sql, sum } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/src/db/drizzle";
import { accounts, categories, transactions } from "@/src/db/schema";
import { calculatePercentageChange, fillMissingDays } from "@/lib/utils";

const app = new Hono().get(
  "/",
  clerkMiddleware(),
  zValidator("query", z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    accountId: z.string().optional(),
  })),
  async (c) => {
    const auth = getAuth(c);
    const { from, to, accountId } = c.req.valid("query");

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const defaultTo = new Date();
    const defaultFrom = subDays(defaultTo, 30);

    const startDate = from 
      ? parse(from, "yyyy-MM-dd", new Date()) 
      : defaultFrom;
    const endDate = to 
      ? parse(to, "yyyy-MM-dd", new Date()) 
      : defaultTo;

    const periodLength = differenceInDays(endDate, startDate) + 1;
    const lastPeriodStart = subDays(startDate, periodLength);
    const lastPeriodEnd = subDays(endDate, periodLength);

    // Fetch current period data
    async function fetchFinancialData(
      userId: string,
      startDate: Date,
      endDate: Date
    ) {
      return await db
        .select({
          income: sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(Number),
          expenses: sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(Number),
          remaining: sum(transactions.amount).mapWith(Number),
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            accountId ? eq(transactions.accountId, accountId) : undefined,
            eq(accounts.userId, userId),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );
    }

    const [currentPeriod] = await fetchFinancialData(
      auth.userId,
      startDate,
      endDate
    );

    const [lastPeriod] = await fetchFinancialData(
      auth.userId,
      lastPeriodStart,
      lastPeriodEnd
    );

    // Calculate percentage changes
    const incomeChange = calculatePercentageChange(
      currentPeriod.income,
      lastPeriod.income
    );

    const expensesChange = calculatePercentageChange(
      currentPeriod.expenses,
      lastPeriod.expenses
    );

    const remainingChange = calculatePercentageChange(
      currentPeriod.remaining,
      lastPeriod.remaining
    );

    // Fetch daily breakdown
    const days = await db
      .select({
        date: transactions.date,
        income: sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(Number),
        expenses: sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          accountId ? eq(transactions.accountId, accountId) : undefined,
          eq(accounts.userId, auth.userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactions.date)
      .orderBy(transactions.date);

    // Fetch category breakdown
    const topCategories = await db
      .select({
        name: sql`COALESCE(${categories.name}, 'Uncategorized')`.mapWith(String),
        value: sql`SUM(ABS(${transactions.amount}))`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          accountId ? eq(transactions.accountId, accountId) : undefined,
          eq(accounts.userId, auth.userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
          lt(transactions.amount, 0) // Only expenses
        )
      )
      .groupBy(categories.name)
      .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`))
      .limit(4);

    const activeDays = fillMissingDays(days, startDate, endDate);

    return c.json({
      data: {
        remainingAmount: currentPeriod.remaining,
        remainingChange,
        incomeAmount: currentPeriod.income,
        incomeChange,
        expensesAmount: currentPeriod.expenses,
        expensesChange,
        categories: topCategories,
        days: activeDays,
      },
    });
  }
);

export default app;
```

### Utility Functions
```typescript
// lib/utils.ts - Financial calculations
export const calculatePercentageChange = (
  current: number,
  previous: number
): number => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / previous) * 100;
};

export const fillMissingDays = (
  activeDays: Array<{
    date: Date;
    income: number;
    expenses: number;
  }>,
  startDate: Date,
  endDate: Date
) => {
  if (activeDays.length === 0) {
    return [];
  }

  const allDays: Array<{
    date: string;
    income: number;
    expenses: number;
  }> = [];

  const numDays = differenceInDays(endDate, startDate) + 1;

  for (let i = 0; i < numDays; i++) {
    const date = addDays(startDate, i);
    const dateString = format(date, "yyyy-MM-dd");

    const found = activeDays.find((day) => 
      format(day.date, "yyyy-MM-dd") === dateString
    );

    if (found) {
      allDays.push({
        date: dateString,
        income: found.income,
        expenses: found.expenses,
      });
    } else {
      allDays.push({
        date: dateString,
        income: 0,
        expenses: 0,
      });
    }
  }

  return allDays;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export const formatPercentage = (
  value: number,
  options: { addPrefix?: boolean } = {}
): string => {
  const result = new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
  }).format(value / 100);

  if (options.addPrefix && value > 0) {
    return `+${result}`;
  }

  return result;
};
```

## 📱 Dashboard Implementation

### Main Dashboard Page
```typescript
// app/(dashboard)/page.tsx
"use client";

import { DataGrid } from "@/components/data-grid";
import { DataCharts } from "@/components/data-charts";

export default function DashboardPage() {
  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <DataGrid />
      <DataCharts />
    </div>
  );
}
```

### Filter Integration
```typescript
// components/filters.tsx
import { AccountFilter } from "@/components/account-filter";
import { DateFilter } from "@/components/date-filter";

export const Filters = () => {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-y-2 lg:gap-y-0 lg:gap-x-2">
      <AccountFilter />
      <DateFilter />
    </div>
  );
};
```

### Date Range Filter
```typescript
// components/date-filter.tsx
"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGetSummary } from "@/features/summary/api/use-get-summary";
import { DateRange } from "react-day-picker";
import { formatDateRange } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDown } from "lucide-react";

export const DateFilter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const accountId = params.get("accountId") || "all";
  const from = params.get("from") || "";
  const to = params.get("to") || "";

  const defaultTo = new Date();
  const defaultFrom = subDays(defaultTo, 30);

  const paramState = {
    from: from ? parse(from, "yyyy-MM-dd", new Date()) : defaultFrom,
    to: to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo,
  };

  const [date, setDate] = useState<DateRange | undefined>(paramState);

  const pushToUrl = (dateRange: DateRange | undefined) => {
    const query = {
      from: format(dateRange?.from || defaultFrom, "yyyy-MM-dd"),
      to: format(dateRange?.to || defaultTo, "yyyy-MM-dd"),
      accountId,
    };

    const url = qs.stringifyUrl(
      {
        url: pathname,
        query,
      },
      { skipNull: true, skipEmptyString: true }
    );

    router.push(url);
  };

  const onReset = () => {
    setDate(undefined);
    pushToUrl(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          disabled={false}
          size="sm"
          variant="outline"
          className="lg:w-auto w-full h-9 rounded-md px-3 font-normal bg-white/10 hover:bg-white/20 hover:text-white border-none focus:ring-offset-0 focus:ring-transparent outline-none text-white focus:bg-white/30 transition"
        >
          <span>{formatDateRange(paramState)}</span>
          <ChevronDown className="ml-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="lg:w-auto w-full p-0" align="start">
        <Calendar
          disabled={false}
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
        />
        <div className="p-4 w-full flex items-center gap-x-2">
          <Button
            onClick={onReset}
            disabled={!date?.from || !date?.to}
            className="w-full"
            variant="outline"
          >
            Reset
          </Button>
          <Button
            onClick={() => pushToUrl(date)}
            disabled={!date?.from || !date?.to}
            className="w-full"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
```

## 🚀 Performance Optimizations

### Efficient Data Aggregation
```typescript
// Optimized summary query with single database call
const getSummaryData = async (userId: string, filters: SummaryFilters) => {
  return await db
    .select({
      // Current period
      currentIncome: sql`SUM(CASE WHEN ${transactions.amount} >= 0 AND ${transactions.date} >= ${filters.from} AND ${transactions.date} <= ${filters.to} THEN ${transactions.amount} ELSE 0 END)`,
      currentExpenses: sql`SUM(CASE WHEN ${transactions.amount} < 0 AND ${transactions.date} >= ${filters.from} AND ${transactions.date} <= ${filters.to} THEN ${transactions.amount} ELSE 0 END)`,
      
      // Previous period
      previousIncome: sql`SUM(CASE WHEN ${transactions.amount} >= 0 AND ${transactions.date} >= ${filters.previousFrom} AND ${transactions.date} <= ${filters.previousTo} THEN ${transactions.amount} ELSE 0 END)`,
      previousExpenses: sql`SUM(CASE WHEN ${transactions.amount} < 0 AND ${transactions.date} >= ${filters.previousFrom} AND ${transactions.date} <= ${filters.previousTo} THEN ${transactions.amount} ELSE 0 END)`,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(eq(accounts.userId, userId));
};
```

### Caching Strategy
```typescript
// Aggressive caching for summary data
export const useGetSummary = () => {
  const params = useSearchParams();
  
  return useQuery({
    queryKey: ["summary", params.toString()],
    queryFn: fetchSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
```

## 🧪 Testing

### Summary API Testing
```typescript
// tests/features/summary/api/use-get-summary.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGetSummary } from '../use-get-summary';

describe('useGetSummary', () => {
  test('calculates financial summary correctly', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useGetSummary(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      remainingAmount: expect.any(Number),
      incomeAmount: expect.any(Number),
      expensesAmount: expect.any(Number),
      remainingChange: expect.any(Number),
      incomeChange: expect.any(Number),
      expensesChange: expect.any(Number),
      categories: expect.any(Array),
      days: expect.any(Array),
    });
  });
});
```

### Chart Component Testing
```typescript
// tests/components/chart.test.tsx
import { render, screen } from '@testing-library/react';
import { Chart } from '../chart';

const mockData = [
  { date: '2024-01-01', income: 1000, expenses: 500 },
  { date: '2024-01-02', income: 1200, expenses: 600 },
];

describe('Chart', () => {
  test('renders chart with data', () => {
    render(<Chart data={mockData} />);
    
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Area chart')).toBeInTheDocument();
  });

  test('switches chart types', () => {
    render(<Chart data={mockData} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    
    const barOption = screen.getByText('Bar chart');
    fireEvent.click(barOption);
    
    expect(screen.getByText('Bar chart')).toBeInTheDocument();
  });
});
```

## 📚 Usage Examples

### Basic Summary Usage
```typescript
// Using summary in a component
import { useGetSummary } from "@/features/summary/api/use-get-summary";

const FinancialOverview = () => {
  const { data: summary, isLoading } = useGetSummary();

  if (isLoading) return <div>Loading financial summary...</div>;

  return (
    <div>
      <h2>Financial Overview</h2>
      <p>Income: {formatCurrency(summary?.incomeAmount || 0)}</p>
      <p>Expenses: {formatCurrency(summary?.expensesAmount || 0)}</p>
      <p>Net: {formatCurrency(summary?.remainingAmount || 0)}</p>
    </div>
  );
};
```

### Custom Summary Hook
```typescript
// Custom hook for specific summary data
const useMonthlyTrends = () => {
  const { data: summary } = useGetSummary();
  
  return useMemo(() => {
    if (!summary?.days) return [];
    
    return summary.days.map(day => ({
      ...day,
      net: day.income - day.expenses,
    }));
  }, [summary]);
};
```

### Real-time Summary Updates
```typescript
// Auto-refresh summary when transactions change
const useLiveSummary = () => {
  const queryClient = useQueryClient();
  
  // Invalidate summary when transactions are updated
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      if (event.query.queryKey[0] === 'transactions') {
        queryClient.invalidateQueries({ queryKey: ['summary'] });
      }
    });
    
    return unsubscribe;
  }, [queryClient]);
  
  return useGetSummary();
};
```

## 🎯 Key Metrics

### Financial KPIs
- **Income vs Expenses**: Track spending against earnings
- **Net Worth Change**: Monitor financial growth over time  
- **Spending Categories**: Identify largest expense categories
- **Monthly Trends**: Visualize financial patterns
- **Period Comparisons**: Compare current vs previous periods

### Calculated Fields
```typescript
// Financial calculations
const calculations = {
  savingsRate: (income - expenses) / income * 100,
  burnRate: expenses / numberOfDays,
  averageDailyIncome: income / numberOfDays,
  expenseRatio: expenses / income,
  netWorthChange: currentPeriod - previousPeriod,
};
```

---

## 🔗 Related Features

- **Transactions**: Source data for all summary calculations
- **Accounts**: Account-level summaries and filtering
- **Categories**: Category-based spending analytics
