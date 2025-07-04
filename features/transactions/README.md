# Transactions Feature - Finance SaaS Platform

## Overview
The Transactions feature is the core of the finance platform, managing all financial transactions including income, expenses, transfers, and financial data. It provides comprehensive transaction management with filtering, importing, and analytics capabilities.

## 🏗️ Feature Structure

```
features/transactions/
├── api/                                # API hooks using React Query
│   ├── use-get-transactions.ts         # Fetch transactions with filtering
│   ├── use-get-transaction.ts          # Fetch single transaction
│   ├── use-create-transaction.ts       # Create new transaction
│   ├── use-edit-transaction.ts         # Update existing transaction
│   ├── use-delete-transaction.ts       # Delete single transaction
│   ├── use-bulk-delete-transactions.ts # Bulk delete transactions
│   └── use-bulk-create-transactions.ts # Bulk import transactions
├── components/                         # UI components
│   ├── transaction-form.tsx            # Reusable transaction form
│   ├── new-transaction-sheet.tsx       # Create transaction modal
│   ├── edit-transaction-sheet.tsx      # Edit transaction modal
│   ├── import-card.tsx                 # CSV import interface
│   ├── import-table.tsx                # Import data preview
│   └── category-tooltip.tsx            # Category display component
└── hooks/                              # Feature-specific hooks
    ├── use-new-transaction.ts          # New transaction modal state
    ├── use-open-transaction.ts         # Edit transaction modal state
    └── use-select-account.tsx          # Account selection for transactions
```

## 🔧 API Integration

### Data Fetching with Filtering
```typescript
// features/transactions/api/use-get-transactions.ts
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { client } from "@/lib/hono";

export const useGetTransactions = () => {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const accountId = params.get("accountId") || "";

  const query = useQuery({
    queryKey: ["transactions", { from, to, accountId }],
    queryFn: async () => {
      const response = await client.api.transactions.$get({
        query: {
          from,
          to,
          accountId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
```

### Transaction Creation
```typescript
// features/transactions/api/use-create-transaction.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.transactions.$post>;
type RequestType = InferRequestType<typeof client.api.transactions.$post>["json"];

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transactions.$post({ json });
      
      if (!response.ok) {
        throw new Error("Failed to create transaction");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Transaction created");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create transaction");
    },
  });

  return mutation;
};
```

### Bulk Operations
```typescript
// features/transactions/api/use-bulk-create-transactions.ts
export const useBulkCreateTransactions = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transactions["bulk-create"].$post({
        json,
      });
      
      if (!response.ok) {
        throw new Error("Failed to create transactions");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Transactions created");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create transactions");
    },
  });

  return mutation;
};

// features/transactions/api/use-bulk-delete-transactions.ts
export const useBulkDeleteTransactions = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transactions["bulk-delete"].$delete({
        json,
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete transactions");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Transactions deleted");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete transactions");
    },
  });

  return mutation;
};
```

## 🎨 UI Components

### Transaction Form
```typescript
// features/transactions/components/transaction-form.tsx
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@/src/db/schema";
import { AmountInput } from "@/components/amount-input";
import { DatePicker } from "@/components/date-picker";
import { Select } from "@/components/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  date: z.coerce.date(),
  accountId: z.string(),
  categoryId: z.string().nullable().optional(),
  payee: z.string(),
  amount: z.string(),
  notes: z.string().nullable().optional(),
});

const apiSchema = insertTransactionSchema.omit({
  id: true,
});

type FormValues = z.input<typeof formSchema>;
type ApiFormValues = z.input<typeof apiSchema>;

interface TransactionFormProps {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: ApiFormValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  accountOptions: { label: string; value: string }[];
  categoryOptions: { label: string; value: string }[];
  onCreateAccount: (name: string) => void;
  onCreateCategory: (name: string) => void;
}

export const TransactionForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  accountOptions,
  categoryOptions,
  onCreateAccount,
  onCreateCategory,
}: TransactionFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const handleSubmit = (values: FormValues) => {
    const amount = parseFloat(values.amount);
    const amountInMiliunits = Math.round(amount * 1000);

    onSubmit({
      ...values,
      amount: amountInMiliunits,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 pt-4"
      >
        <FormField
          name="date"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="accountId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select an account"
                  options={accountOptions}
                  onCreate={onCreateAccount}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="categoryId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a category"
                  options={categoryOptions}
                  onCreate={onCreateCategory}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="payee"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payee</FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder="Add a payee"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="amount"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <AmountInput
                  {...field}
                  disabled={disabled}
                  placeholder="0.00"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="notes"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  disabled={disabled}
                  placeholder="Optional notes"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button className="w-full" disabled={disabled}>
          {id ? "Save changes" : "Create transaction"}
        </Button>

        {!!id && (
          <Button
            type="button"
            disabled={disabled}
            onClick={onDelete}
            className="w-full"
            variant="outline"
          >
            <Trash className="size-4 mr-2" />
            Delete transaction
          </Button>
        )}
      </form>
    </Form>
  );
};
```

### CSV Import Component
```typescript
// features/transactions/components/import-card.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useCSVReader } from "react-papaparse";

const dateFormat = "yyyy-MM-dd HH:mm:ss";
const outputFormat = "yyyy-MM-dd";

const requiredOptions = ["amount", "date", "payee"];

interface SelectedColumnsState {
  [key: string]: string | null;
}

export const ImportCard = () => {
  const [data, setData] = useState<string[][]>([]);
  const [progress, setProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  const { CSVReader } = useCSVReader();

  const onUpload = (results: any) => {
    setData(results.data);
  };

  const onCancelImport = () => {
    setData([]);
    setProgress(0);
  };

  const onSubmitImport = async (values: any[]) => {
    const accountId = ""; // Get from form or context
    
    const data = values.map((value) => ({
      ...value,
      accountId,
      amount: Math.round(parseFloat(value.amount) * 1000),
      date: parse(value.date, dateFormat, new Date()),
    }));

    try {
      setIsImporting(true);
      
      for (let i = 0; i < data.length; i++) {
        // Create transaction
        await createTransaction(data[i]);
        setProgress((i + 1) / data.length * 100);
      }
      
      toast.success(`Imported ${data.length} transactions`);
      onCancelImport();
    } catch (error) {
      toast.error("Failed to import transactions");
    } finally {
      setIsImporting(false);
    }
  };

  if (data.length > 0) {
    return (
      <ImportTable
        data={data}
        onCancel={onCancelImport}
        onSubmit={onSubmitImport}
        isImporting={isImporting}
        progress={progress}
      />
    );
  }

  return (
    <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300">
      <CardHeader>
        <CardTitle>Import Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <CSVReader onUploadAccepted={onUpload}>
          {({ getRootProps, acceptedFile }: any) => (
            <div {...getRootProps()} className="text-center cursor-pointer">
              <div className="flex flex-col items-center gap-2 p-8">
                <Upload className="size-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {acceptedFile?.name || "Choose CSV file to upload"}
                </p>
                <Button type="button" size="sm" variant="outline">
                  Select File
                </Button>
              </div>
            </div>
          )}
        </CSVReader>
      </CardContent>
    </Card>
  );
};
```

### Import Data Table
```typescript
// features/transactions/components/import-table.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const requiredOptions = [
  { key: "amount", label: "Amount" },
  { key: "date", label: "Date" },
  { key: "payee", label: "Payee" },
];

const optionalOptions = [
  { key: "notes", label: "Notes" },
  { key: "category", label: "Category" },
];

interface ImportTableProps {
  data: string[][];
  onCancel: () => void;
  onSubmit: (data: any[]) => void;
  isImporting: boolean;
  progress: number;
}

export const ImportTable = ({
  data,
  onCancel,
  onSubmit,
  isImporting,
  progress,
}: ImportTableProps) => {
  const [selectedColumns, setSelectedColumns] = useState<{
    [key: string]: string | null;
  }>({});

  const headers = data[0];
  const body = data.slice(1);

  const onTableHeadSelectChange = (columnIndex: number, value: string | null) => {
    setSelectedColumns((prev) => {
      const newSelectedColumns = { ...prev };

      for (const key in newSelectedColumns) {
        if (newSelectedColumns[key] === value) {
          newSelectedColumns[key] = null;
        }
      }

      if (value === "skip") {
        value = null;
      }

      newSelectedColumns[`column_${columnIndex}`] = value;
      return newSelectedColumns;
    });
  };

  const getProgress = () => {
    if (isImporting) return progress;
    
    const requiredFilled = requiredOptions.every((option) =>
      Object.values(selectedColumns).includes(option.key)
    );
    
    return requiredFilled ? 100 : 0;
  };

  const handleContinue = () => {
    const getColumnIndex = (column: string) => {
      return Object.entries(selectedColumns).find(
        ([key, value]) => value === column
      )?.[0];
    };

    const mappedData = body.map((row) => {
      const transformedRow: any = {};

      requiredOptions.forEach((option) => {
        const columnIndex = getColumnIndex(option.key);
        const cellValue = columnIndex ? row[parseInt(columnIndex.split("_")[1])] : "";
        transformedRow[option.key] = cellValue;
      });

      optionalOptions.forEach((option) => {
        const columnIndex = getColumnIndex(option.key);
        const cellValue = columnIndex ? row[parseInt(columnIndex.split("_")[1])] : "";
        transformedRow[option.key] = cellValue;
      });

      return transformedRow;
    });

    onSubmit(mappedData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Transactions</CardTitle>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Map your CSV columns to transaction fields
          </p>
          <Progress value={getProgress()} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead key={index}>
                    <Select
                      value={selectedColumns[`column_${index}`] || ""}
                      onValueChange={(value) =>
                        onTableHeadSelectChange(index, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Skip" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip</SelectItem>
                        {requiredOptions.map((option) => (
                          <SelectItem key={option.key} value={option.key}>
                            {option.label}
                          </SelectItem>
                        ))}
                        {optionalOptions.map((option) => (
                          <SelectItem key={option.key} value={option.key}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead key={index}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {body.slice(0, 10).map((row, index) => (
                <TableRow key={index}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4">
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleContinue}
            disabled={getProgress() < 100 || isImporting}
          >
            {isImporting ? "Importing..." : `Continue (${body.length})`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

## 📱 Page Implementation

### Transactions Page
```typescript
// app/(dashboard)/transactions/page.tsx
"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/data-table";
import { ImportCard } from "./import-card";

import { columns } from "./columns";
import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";
import { useGetTransactions } from "@/features/transactions/api/use-get-transactions";
import { useBulkDeleteTransactions } from "@/features/transactions/api/use-bulk-delete-transactions";
import { useBulkCreateTransactions } from "@/features/transactions/api/use-bulk-create-transactions";

enum VARIANTS {
  LIST = "LIST",
  IMPORT = "IMPORT",
}

const TransactionsPage = () => {
  const [variant, setVariant] = useState<VARIANTS>(VARIANTS.LIST);
  const newTransaction = useNewTransaction();
  const createTransactions = useBulkCreateTransactions();
  const deleteTransactions = useBulkDeleteTransactions();
  const transactionsQuery = useGetTransactions();
  const transactions = transactionsQuery.data || [];

  const isDisabled = 
    transactionsQuery.isLoading || 
    deleteTransactions.isPending;

  const onUpload = (results: any) => {
    const data = results.data;
    const values = data.map((item: any) => ({
      ...item,
      amount: Math.round(parseFloat(item.amount) * 1000),
    }));

    createTransactions.mutate(values, {
      onSuccess: () => {
        setVariant(VARIANTS.LIST);
      },
    });
  };

  if (transactionsQuery.isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full flex items-center justify-center">
              <Loader2 className="size-6 text-slate-300 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === VARIANTS.IMPORT) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
        <Card className="border-none drop-shadow-sm">
          <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl line-clamp-1">
              Import Transactions
            </CardTitle>
            <div className="flex items-center gap-x-2">
              <Button
                onClick={() => setVariant(VARIANTS.LIST)}
                size="sm"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ImportCard onUpload={onUpload} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Transactions
          </CardTitle>
          <div className="flex items-center gap-x-2">
            <Button
              onClick={newTransaction.onOpen}
              size="sm"
              className="w-full lg:w-auto"
            >
              <Plus className="size-4 mr-2" />
              Add new
            </Button>
            <Button
              onClick={() => setVariant(VARIANTS.IMPORT)}
              size="sm"
              variant="outline"
              className="w-full lg:w-auto"
            >
              Import
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            filterKey="payee"
            columns={columns}
            data={transactions}
            onDelete={(row) => {
              const ids = row.map((r) => r.original.id);
              deleteTransactions.mutate({ ids });
            }}
            disabled={isDisabled}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;
```

### Advanced Table Columns
```typescript
// app/(dashboard)/transactions/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { InferResponseType } from "hono";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { client } from "@/lib/hono";
import { formatCurrency } from "@/lib/utils";
import { AccountColumn } from "./account-column";
import { CategoryColumn } from "./category-column";
import { Actions } from "./actions";

export type ResponseType = InferResponseType<
  typeof client.api.transactions.$get,
  200
>["data"][0];

export const columns: ColumnDef<ResponseType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("date") as Date;
      return (
        <span>
          {format(date, "dd MMM, yyyy")}
        </span>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Category
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <CategoryColumn
        id={row.original.id}
        category={row.original.category}
        categoryId={row.original.categoryId}
      />
    ),
  },
  {
    accessorKey: "payee",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Payee
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return (
        <span
          className={amount < 0 ? "text-red-500" : "text-green-500"}
        >
          {formatCurrency(amount / 1000)}
        </span>
      );
    },
  },
  {
    accessorKey: "account",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Account
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <AccountColumn
        account={row.original.account}
        accountId={row.original.accountId}
      />
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions id={row.original.id} />,
  },
];
```

## 🔧 Backend Integration

### Transaction Router
```typescript
// app/api/[[...route]]/transactions.ts
import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { parse, subDays } from "date-fns";
import { z } from "zod";

import { db } from "@/src/db/drizzle";
import {
  accounts,
  categories,
  insertTransactionSchema,
  transactions,
} from "@/src/db/schema";

const app = new Hono()
  .get(
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

      const data = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          category: categories.name,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          account: accounts.name,
          accountId: transactions.accountId,
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
          ),
        )
        .orderBy(desc(transactions.date));

      return c.json({ data });
    }
  )
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.string().optional() })),
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      const [data] = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          accountId: transactions.accountId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            eq(accounts.userId, auth.userId),
            eq(transactions.id, id)
          )
        );

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", insertTransactionSchema.omit({ id: true })),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Verify account belongs to user
      const [account] = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, auth.userId),
            eq(accounts.id, values.accountId)
          )
        );

      if (!account) {
        return c.json({ error: "Invalid account" }, 400);
      }

      const [data] = await db
        .insert(transactions)
        .values({
          id: createId(),
          ...values,
        })
        .returning();

      return c.json({ data });
    }
  )
  .post(
    "/bulk-create",
    clerkMiddleware(),
    zValidator("json", z.array(
      insertTransactionSchema.omit({ id: true })
    )),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Verify all accounts belong to user
      const accountIds = [...new Set(values.map(v => v.accountId))];
      const userAccounts = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, auth.userId),
            inArray(accounts.id, accountIds)
          )
        );

      if (userAccounts.length !== accountIds.length) {
        return c.json({ error: "Invalid account(s)" }, 400);
      }

      const data = await db
        .insert(transactions)
        .values(
          values.map((value) => ({
            id: createId(),
            ...value,
          }))
        )
        .returning();

      return c.json({ data });
    }
  )
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    zValidator("json", insertTransactionSchema.omit({ id: true })),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      // Verify account belongs to user
      const [account] = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, auth.userId),
            eq(accounts.id, values.accountId)
          )
        );

      if (!account) {
        return c.json({ error: "Invalid account" }, 400);
      }

      const [data] = await db
        .update(transactions)
        .set(values)
        .where(
          and(
            eq(transactions.id, id),
            eq(accounts.userId, auth.userId)
          )
        )
        .from(accounts)
        .where(eq(transactions.accountId, accounts.id))
        .returning();

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  )
  .delete(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      const [data] = await db
        .delete(transactions)
        .where(
          and(
            eq(transactions.id, id),
            eq(accounts.userId, auth.userId)
          )
        )
        .from(accounts)
        .where(eq(transactions.accountId, accounts.id))
        .returning();

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  )
  .delete(
    "/bulk-delete",
    clerkMiddleware(),
    zValidator("json", z.object({ ids: z.array(z.string()) })),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await db
        .delete(transactions)
        .where(
          and(
            inArray(transactions.id, values.ids),
            eq(accounts.userId, auth.userId)
          )
        )
        .from(accounts)
        .where(eq(transactions.accountId, accounts.id))
        .returning({ id: transactions.id });

      return c.json({ data });
    }
  );

export default app;
```

## 🚀 Performance Optimizations

### Pagination & Virtual Scrolling
```typescript
// Implement pagination for large datasets
export const useGetTransactions = (page = 1, limit = 100) => {
  return useQuery({
    queryKey: ["transactions", { page, limit }],
    queryFn: async () => {
      const offset = (page - 1) * limit;
      const response = await client.api.transactions.$get({
        query: {
          offset: offset.toString(),
          limit: limit.toString(),
        },
      });
      return response.json();
    },
    keepPreviousData: true, // Keep previous data while loading new page
  });
};
```

### Optimistic Updates
```typescript
// Instant feedback for transaction operations
const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      
      const previousTransactions = queryClient.getQueryData(['transactions']);
      
      queryClient.setQueryData(['transactions'], (old: any) => ({
        ...old,
        data: [
          { id: 'temp-id', ...newTransaction },
          ...(old?.data || []),
        ],
      }));

      return { previousTransactions };
    },
    onError: (err, newTransaction, context) => {
      queryClient.setQueryData(['transactions'], context?.previousTransactions);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
```

## 🧪 Testing

### Component Testing
```typescript
// tests/features/transactions/components/transaction-form.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionForm } from '../transaction-form';

describe('TransactionForm', () => {
  const mockProps = {
    onSubmit: jest.fn(),
    accountOptions: [
      { label: 'Checking', value: 'acc1' },
      { label: 'Savings', value: 'acc2' },
    ],
    categoryOptions: [
      { label: 'Food', value: 'cat1' },
      { label: 'Transport', value: 'cat2' },
    ],
    onCreateAccount: jest.fn(),
    onCreateCategory: jest.fn(),
  };

  test('submits transaction with correct data format', async () => {
    render(<TransactionForm {...mockProps} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/payee/i), {
      target: { value: 'Coffee Shop' }
    });
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '25.50' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create transaction/i }));
    
    expect(mockProps.onSubmit).toHaveBeenCalledWith({
      payee: 'Coffee Shop',
      amount: 25500, // Amount in miliunits
      // ... other fields
    });
  });
});
```

### CSV Import Testing
```typescript
// tests/features/transactions/components/import-card.test.tsx
describe('ImportCard', () => {
  test('processes CSV data correctly', async () => {
    const csvData = [
      ['Date', 'Amount', 'Payee'],
      ['2024-01-01', '25.50', 'Coffee Shop'],
      ['2024-01-02', '-100.00', 'Grocery Store'],
    ];

    const { result } = renderHook(() => useImportTransactions());
    
    act(() => {
      result.current.processCSV(csvData);
    });

    expect(result.current.processedData).toEqual([
      {
        date: new Date('2024-01-01'),
        amount: 25500,
        payee: 'Coffee Shop',
      },
      {
        date: new Date('2024-01-02'),
        amount: -100000,
        payee: 'Grocery Store',
      },
    ]);
  });
});
```

## 📚 Usage Examples

### Basic Transaction Management
```typescript
// Using transactions in a component
import { useGetTransactions } from "@/features/transactions/api/use-get-transactions";
import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";

const TransactionList = () => {
  const { data: transactions, isLoading } = useGetTransactions();
  const { onOpen } = useNewTransaction();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={onOpen}>Add Transaction</button>
      {transactions?.map(transaction => (
        <div key={transaction.id}>
          {transaction.payee}: {transaction.amount}
        </div>
      ))}
    </div>
  );
};
```

### Filtered Transaction Views
```typescript
// Custom hook for filtered transactions
const useFilteredTransactions = (filters: TransactionFilters) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => fetchTransactions(filters),
    enabled: !!filters.accountId, // Only run when account is selected
  });
};

// Usage in component
const AccountTransactions = ({ accountId }: { accountId: string }) => {
  const { data: transactions } = useFilteredTransactions({
    accountId,
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  return (
    <div>
      {transactions?.map(transaction => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
};
```

---

## 🔗 Related Features

- **Accounts**: Transactions belong to accounts
- **Categories**: Transactions can be categorized for reporting
- **Summary**: Transaction data drives financial summaries and analytics
