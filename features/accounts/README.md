# Accounts Feature - Finance SaaS Platform

## Overview
The Accounts feature manages user financial accounts (checking, savings, credit cards, etc.). It provides full CRUD operations with a modern UI and type-safe API integration.

## 🏗️ Feature Structure

```
features/accounts/
├── api/                          # API hooks using React Query
│   ├── use-get-accounts.ts       # Fetch all user accounts
│   ├── use-get-account.ts        # Fetch single account
│   ├── use-create-account.ts     # Create new account
│   ├── use-edit-account.ts       # Update existing account
│   ├── use-delete-account.ts     # Delete single account
│   └── use-bulk-delete-accounts.ts # Bulk delete accounts
├── components/                   # UI components
│   ├── account-form.tsx          # Reusable account form
│   ├── new-account-sheet.tsx     # Create account modal
│   └── edit-account-sheet.tsx    # Edit account modal
└── hooks/                        # Feature-specific hooks
    ├── use-new-account.ts        # New account modal state
    ├── use-open-account.ts       # Edit account modal state
    └── use-select-account.tsx    # Account selection logic
```

## 🔧 API Integration

### Data Fetching
```typescript
// features/accounts/api/use-get-accounts.ts
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { client } from "@/lib/hono";

export const useGetAccounts = () => {
  const user_id = useAuth();
  
  const query = useQuery({
    queryKey: ["accounts", user_id.userId],
    queryFn: async () => {
      const response = await client.api.accounts.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch accounts.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
```

### Account Creation
```typescript
// features/accounts/api/use-create-account.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.accounts.$post>;
type RequestType = InferRequestType<typeof client.api.accounts.$post>["json"];

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.accounts.$post({ json });
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Account created");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: () => {
      toast.error("Failed to create account");
    },
  });

  return mutation;
};
```

### Account Updates
```typescript
// features/accounts/api/use-edit-account.ts
export const useEditAccount = (id?: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.accounts[":id"].$patch({
        param: { id },
        json,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Account updated");
      queryClient.invalidateQueries({ queryKey: ["account", { id }] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: () => {
      toast.error("Failed to edit account");
    },
  });

  return mutation;
};
```

### Bulk Operations
```typescript
// features/accounts/api/use-bulk-delete-accounts.ts
export const useBulkDeleteAccounts = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.accounts["bulk-delete"].$delete({
        json,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Accounts deleted");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: () => {
      toast.error("Failed to delete accounts");
    },
  });

  return mutation;
};
```

## 🎨 UI Components

### Account Form
```typescript
// features/accounts/components/account-form.tsx
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAccountSchema } from "@/src/db/schema";

const formSchema = insertAccountSchema.pick({
  name: true,
});

type FormValues = z.input<typeof formSchema>;

interface AccountFormProps {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const AccountForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
}: AccountFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  const handleDelete = () => {
    onDelete?.();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 pt-4"
      >
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder="e.g. Cash, Bank, Credit Card"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button className="w-full" disabled={disabled}>
          {id ? "Save changes" : "Create account"}
        </Button>
        
        {!!id && (
          <Button
            type="button"
            disabled={disabled}
            onClick={handleDelete}
            className="w-full"
            variant="outline"
          >
            <Trash className="size-4 mr-2" />
            Delete account
          </Button>
        )}
      </form>
    </Form>
  );
};
```

### Create Account Modal
```typescript
// features/accounts/components/new-account-sheet.tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AccountForm } from "./account-form";
import { useNewAccount } from "../hooks/use-new-account";
import { useCreateAccount } from "../api/use-create-account";

export const NewAccountSheet = () => {
  const { isOpen, onClose } = useNewAccount();
  const mutation = useCreateAccount();

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>New Account</SheetTitle>
          <SheetDescription>
            Create a new account to track your transactions.
          </SheetDescription>
        </SheetHeader>
        <AccountForm
          onSubmit={onSubmit}
          disabled={mutation.isPending}
        />
      </SheetContent>
    </Sheet>
  );
};
```

## 🎯 Feature Hooks

### Modal State Management
```typescript
// features/accounts/hooks/use-new-account.ts
import { create } from "zustand";

type NewAccountState = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useNewAccount = create<NewAccountState>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
```

```typescript
// features/accounts/hooks/use-open-account.ts
import { create } from "zustand";

type OpenAccountState = {
  id?: string;
  isOpen: boolean;
  onOpen: (id: string) => void;
  onClose: () => void;
};

export const useOpenAccount = create<OpenAccountState>((set) => ({
  id: undefined,
  isOpen: false,
  onOpen: (id: string) => set({ isOpen: true, id }),
  onClose: () => set({ isOpen: false, id: undefined }),
}));
```

### Account Selection
```typescript
// features/accounts/hooks/use-select-account.tsx
import { useRef, useState } from "react";
import { useGetAccounts } from "../api/use-get-accounts";

export const useSelectAccount = () => {
  const [value, setValue] = useState<string>();
  const { data: accounts, isLoading } = useGetAccounts();

  const onChange = (value?: string) => {
    setValue(value);
  };

  const disable = () => {
    setValue(undefined);
  };

  return {
    value,
    onChange,
    disable,
    accounts: accounts || [],
    isLoading,
  };
};
```

## 📱 Page Implementation

### Accounts Page
```typescript
// app/(dashboard)/accounts/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useBulkDeleteAccounts } from "@/features/accounts/api/use-bulk-delete-accounts";

const AccountsPage = () => {
  const newAccount = useNewAccount();
  const deleteAccounts = useBulkDeleteAccounts();
  const accountsQuery = useGetAccounts();
  const accounts = accountsQuery.data || [];

  const isDisabled = accountsQuery.isLoading || deleteAccounts.isPending;

  if (accountsQuery.isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <div className="h-8 w-48 lg:w-72 bg-slate-300 rounded animate-pulse" />
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

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Accounts page
          </CardTitle>
          <Button onClick={newAccount.onOpen} size="sm">
            <Plus className="size-4 mr-2" />
            Add new
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            filterKey="name"
            columns={columns}
            data={accounts}
            onDelete={(row) => {
              const ids = row.map((r) => r.original.id);
              deleteAccounts.mutate({ ids });
            }}
            disabled={isDisabled}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsPage;
```

### Data Table Columns
```typescript
// app/(dashboard)/accounts/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { InferResponseType } from "hono";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { client } from "@/lib/hono";
import { Actions } from "./actions";

export type ResponseType = InferResponseType<typeof client.api.accounts.$get, 200>["data"][0];

export const columns: ColumnDef<ResponseType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions id={row.original.id} />,
  },
];
```

## 🔧 Configuration

### Validation Schemas
```typescript
// Using Drizzle Zod schemas
import { insertAccountSchema } from "@/src/db/schema";

// Form validation
const formSchema = insertAccountSchema.pick({
  name: true,
});

// API validation
const apiSchema = insertAccountSchema.omit({
  id: true,
  userId: true,
});
```

### Error Handling
```typescript
// Global error handling in API hooks
const mutation = useMutation({
  mutationFn: async (json) => {
    const response = await client.api.accounts.$post({ json });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create account");
    }
    
    return await response.json();
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

## 🚀 Performance Optimizations

### Query Caching
- Automatic caching with React Query
- Smart invalidation on mutations
- Background refetching for fresh data

### Optimistic Updates
```typescript
const mutation = useMutation({
  mutationFn: updateAccount,
  onMutate: async (newAccount) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['accounts'] });

    // Snapshot previous value
    const previousAccounts = queryClient.getQueryData(['accounts']);

    // Optimistically update
    queryClient.setQueryData(['accounts'], (old) => 
      old?.map(account => 
        account.id === newAccount.id 
          ? { ...account, ...newAccount }
          : account
      )
    );

    return { previousAccounts };
  },
  onError: (err, newAccount, context) => {
    // Rollback on error
    queryClient.setQueryData(['accounts'], context?.previousAccounts);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  },
});
```

## 🧪 Testing

### Component Testing
```typescript
// tests/features/accounts/components/account-form.test.tsx
import { render, screen } from '@testing-library/react';
import { AccountForm } from '../account-form';

describe('AccountForm', () => {
  test('renders form fields', () => {
    const onSubmit = jest.fn();
    
    render(
      <AccountForm onSubmit={onSubmit} />
    );
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });
});
```

### API Hook Testing
```typescript
// tests/features/accounts/api/use-get-accounts.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGetAccounts } from '../use-get-accounts';

describe('useGetAccounts', () => {
  test('fetches accounts successfully', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useGetAccounts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

## 📚 Usage Examples

### Basic Usage
```typescript
// In a React component
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";

const MyComponent = () => {
  const { data: accounts, isLoading } = useGetAccounts();
  const { onOpen } = useNewAccount();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={onOpen}>Create Account</button>
      {accounts?.map(account => (
        <div key={account.id}>{account.name}</div>
      ))}
    </div>
  );
};
```

### With Form Integration
```typescript
// Using the account form in a custom component
import { AccountForm } from "@/features/accounts/components/account-form";
import { useCreateAccount } from "@/features/accounts/api/use-create-account";

const CustomAccountCreator = () => {
  const createAccount = useCreateAccount();

  const handleSubmit = (values) => {
    createAccount.mutate(values);
  };

  return (
    <AccountForm
      onSubmit={handleSubmit}
      disabled={createAccount.isPending}
    />
  );
};
```

---

## 🔗 Related Features

- **Transactions**: Linked to accounts for transaction management
- **Summary**: Account balances included in financial summaries
- **Categories**: Used together for transaction categorization
