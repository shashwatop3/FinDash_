# Categories Feature - Finance SaaS Platform

## Overview
The Categories feature manages transaction categories for budgeting and financial reporting. Users can create, edit, and delete categories to organize their spending and income patterns.

## 🏗️ Feature Structure

```
features/categories/
├── api/                          # API hooks using React Query
│   ├── use-get-categories.ts     # Fetch all user categories
│   ├── use-get-category.ts       # Fetch single category
│   ├── use-create-category.ts    # Create new category
│   ├── use-edit-category.ts      # Update existing category
│   ├── use-delete-category.ts    # Delete single category
│   └── use-bulk-delete-categories.ts # Bulk delete categories
├── components/                   # UI components
│   ├── category-form.tsx         # Reusable category form
│   ├── new-category-sheet.tsx    # Create category modal
│   └── edit-category-sheet.tsx   # Edit category modal
└── hooks/                        # Feature-specific hooks
    ├── use-new-category.ts       # New category modal state
    ├── use-open-category.ts      # Edit category modal state
    └── use-select-category.tsx   # Category selection logic
```

## 🔧 API Integration

### Data Fetching
```typescript
// features/categories/api/use-get-categories.ts
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { client } from "@/lib/hono";

export const useGetCategories = () => {
  const { userId } = useAuth();
  
  const query = useQuery({
    queryKey: ["categories", userId],
    queryFn: async () => {
      const response = await client.api.categories.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch categories.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
```

### Category Creation
```typescript
// features/categories/api/use-create-category.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.categories.$post>;
type RequestType = InferRequestType<typeof client.api.categories.$post>["json"];

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.categories.$post({ json });
      
      if (!response.ok) {
        throw new Error("Failed to create category");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  return mutation;
};
```

### Category Updates
```typescript
// features/categories/api/use-edit-category.ts
export const useEditCategory = (id?: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.categories[":id"].$patch({
        param: { id },
        json,
      });
      
      if (!response.ok) {
        throw new Error("Failed to update category");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["category", { id }] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update category");
    },
  });

  return mutation;
};
```

### Bulk Delete Categories
```typescript
// features/categories/api/use-bulk-delete-categories.ts
export const useBulkDeleteCategories = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.categories["bulk-delete"].$delete({
        json,
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete categories");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Categories deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete categories");
    },
  });

  return mutation;
};
```

## 🎨 UI Components

### Category Form
```typescript
// features/categories/components/category-form.tsx
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema } from "@/src/db/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

const formSchema = insertCategorySchema.pick({
  name: true,
});

type FormValues = z.input<typeof formSchema>;

interface CategoryFormProps {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const CategoryForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
}: CategoryFormProps) => {
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
                  placeholder="e.g. Food, Transportation, Entertainment"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button className="w-full" disabled={disabled}>
          {id ? "Save changes" : "Create category"}
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
            Delete category
          </Button>
        )}
      </form>
    </Form>
  );
};
```

### Create Category Modal
```typescript
// features/categories/components/new-category-sheet.tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CategoryForm } from "./category-form";
import { useNewCategory } from "../hooks/use-new-category";
import { useCreateCategory } from "../api/use-create-category";

export const NewCategorySheet = () => {
  const { isOpen, onClose } = useNewCategory();
  const mutation = useCreateCategory();

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
          <SheetTitle>New Category</SheetTitle>
          <SheetDescription>
            Create a new category to organize your transactions.
          </SheetDescription>
        </SheetHeader>
        <CategoryForm
          onSubmit={onSubmit}
          disabled={mutation.isPending}
        />
      </SheetContent>
    </Sheet>
  );
};
```

### Edit Category Modal
```typescript
// features/categories/components/edit-category-sheet.tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CategoryForm } from "./category-form";
import { useOpenCategory } from "../hooks/use-open-category";
import { useGetCategory } from "../api/use-get-category";
import { useEditCategory } from "../api/use-edit-category";
import { useDeleteCategory } from "../api/use-delete-category";
import { useConfirm } from "@/hooks/use-confirm";
import { Loader2 } from "lucide-react";

export const EditCategorySheet = () => {
  const { isOpen, onClose, id } = useOpenCategory();
  
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this category. This action cannot be undone."
  );

  const categoryQuery = useGetCategory(id);
  const editMutation = useEditCategory(id);
  const deleteMutation = useDeleteCategory(id);

  const isPending = editMutation.isPending || deleteMutation.isPending;
  const isLoading = categoryQuery.isLoading;

  const onSubmit = (values: FormValues) => {
    editMutation.mutate(values, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const onDelete = async () => {
    const ok = await confirm();

    if (ok) {
      deleteMutation.mutate(undefined, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const defaultValues = categoryQuery.data
    ? {
        name: categoryQuery.data.name,
      }
    : {
        name: "",
      };

  return (
    <>
      <ConfirmDialog />
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4">
          <SheetHeader>
            <SheetTitle>Edit Category</SheetTitle>
            <SheetDescription>
              Edit an existing category.
            </SheetDescription>
          </SheetHeader>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-4 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <CategoryForm
              id={id}
              defaultValues={defaultValues}
              onSubmit={onSubmit}
              onDelete={onDelete}
              disabled={isPending}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
```

## 🎯 Feature Hooks

### Modal State Management
```typescript
// features/categories/hooks/use-new-category.ts
import { create } from "zustand";

type NewCategoryState = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useNewCategory = create<NewCategoryState>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
```

```typescript
// features/categories/hooks/use-open-category.ts
import { create } from "zustand";

type OpenCategoryState = {
  id?: string;
  isOpen: boolean;
  onOpen: (id: string) => void;
  onClose: () => void;
};

export const useOpenCategory = create<OpenCategoryState>((set) => ({
  id: undefined,
  isOpen: false,
  onOpen: (id: string) => set({ isOpen: true, id }),
  onClose: () => set({ isOpen: false, id: undefined }),
}));
```

### Category Selection
```typescript
// features/categories/hooks/use-select-category.tsx
import { useRef, useState } from "react";
import { useGetCategories } from "../api/use-get-categories";

export const useSelectCategory = () => {
  const [value, setValue] = useState<string>();
  const { data: categories, isLoading } = useGetCategories();

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
    categories: categories || [],
    isLoading,
  };
};
```

## 📱 Page Implementation

### Categories Page
```typescript
// app/(dashboard)/categories/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { useNewCategory } from "@/features/categories/hooks/use-new-category";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useBulkDeleteCategories } from "@/features/categories/api/use-bulk-delete-categories";

const CategoriesPage = () => {
  const newCategory = useNewCategory();
  const deleteCategories = useBulkDeleteCategories();
  const categoriesQuery = useGetCategories();
  const categories = categoriesQuery.data || [];

  const isDisabled = categoriesQuery.isLoading || deleteCategories.isPending;

  if (categoriesQuery.isLoading) {
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
            Categories
          </CardTitle>
          <Button onClick={newCategory.onOpen} size="sm">
            <Plus className="size-4 mr-2" />
            Add new
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            filterKey="name"
            columns={columns}
            data={categories}
            onDelete={(row) => {
              const ids = row.map((r) => r.original.id);
              deleteCategories.mutate({ ids });
            }}
            disabled={isDisabled}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoriesPage;
```

### Data Table Columns
```typescript
// app/(dashboard)/categories/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { InferResponseType } from "hono";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { client } from "@/lib/hono";
import { Actions } from "./actions";

export type ResponseType = InferResponseType<
  typeof client.api.categories.$get,
  200
>["data"][0];

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

### Row Actions
```typescript
// app/(dashboard)/categories/actions.tsx
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { useOpenCategory } from "@/features/categories/hooks/use-open-category";
import { useDeleteCategory } from "@/features/categories/api/use-delete-category";
import { useConfirm } from "@/hooks/use-confirm";

interface ActionsProps {
  id: string;
}

export const Actions = ({ id }: ActionsProps) => {
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this category."
  );

  const deleteMutation = useDeleteCategory(id);
  const { onOpen } = useOpenCategory();

  const handleDelete = async () => {
    const ok = await confirm();

    if (ok) {
      deleteMutation.mutate();
    }
  };

  return (
    <>
      <ConfirmDialog />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-8 p-0">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={deleteMutation.isPending}
            onClick={() => onOpen(id)}
          >
            <Edit className="size-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            <Trash className="size-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
```

## 🔧 Backend Integration

### Category Router
```typescript
// app/api/[[...route]]/categories.ts
import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/src/db/drizzle";
import { categories, insertCategorySchema, transactions } from "@/src/db/schema";

const app = new Hono()
  .get("/", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const data = await db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories)
      .where(eq(categories.userId, auth.userId));

    return c.json({ data });
  })
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
          id: categories.id,
          name: categories.name,
        })
        .from(categories)
        .where(and(eq(categories.userId, auth.userId), eq(categories.id, id)));

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", insertCategorySchema.pick({ name: true })),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [data] = await db
        .insert(categories)
        .values({
          id: createId(),
          userId: auth.userId,
          ...values,
        })
        .returning();

      return c.json({ data });
    }
  )
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    zValidator("json", insertCategorySchema.pick({ name: true })),
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

      const [data] = await db
        .update(categories)
        .set(values)
        .where(and(eq(categories.userId, auth.userId), eq(categories.id, id)))
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
        .delete(categories)
        .where(and(eq(categories.userId, auth.userId), eq(categories.id, id)))
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
        .delete(categories)
        .where(
          and(
            eq(categories.userId, auth.userId),
            inArray(categories.id, values.ids)
          )
        )
        .returning({ id: categories.id });

      return c.json({ data });
    }
  );

export default app;
```

## 🚀 Performance Optimizations

### Query Caching
```typescript
// Aggressive caching for categories since they change less frequently
export const useGetCategories = () => {
  const { userId } = useAuth();
  
  return useQuery({
    queryKey: ["categories", userId],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### Optimistic Updates
```typescript
// Immediate UI feedback for category operations
const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onMutate: async (newCategory) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      
      const previousCategories = queryClient.getQueryData(['categories']);
      
      queryClient.setQueryData(['categories'], (old) => [
        ...(old || []),
        { id: 'temp-id', ...newCategory },
      ]);

      return { previousCategories };
    },
    onError: (err, newCategory, context) => {
      queryClient.setQueryData(['categories'], context?.previousCategories);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
```

## 🧪 Testing

### Component Testing
```typescript
// tests/features/categories/components/category-form.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryForm } from '../category-form';

describe('CategoryForm', () => {
  test('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    
    render(<CategoryForm onSubmit={onSubmit} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const submitButton = screen.getByRole('button', { name: /create category/i });
    
    fireEvent.change(nameInput, { target: { value: 'Food & Dining' } });
    fireEvent.click(submitButton);
    
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Food & Dining' });
  });

  test('shows delete button for existing category', () => {
    const onSubmit = jest.fn();
    const onDelete = jest.fn();
    
    render(
      <CategoryForm 
        id="123" 
        onSubmit={onSubmit} 
        onDelete={onDelete} 
      />
    );
    
    expect(screen.getByText(/delete category/i)).toBeInTheDocument();
  });
});
```

## 📚 Usage Examples

### Basic Category Management
```typescript
// In a React component
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useNewCategory } from "@/features/categories/hooks/use-new-category";

const CategoryManager = () => {
  const { data: categories, isLoading } = useGetCategories();
  const { onOpen } = useNewCategory();

  if (isLoading) return <div>Loading categories...</div>;

  return (
    <div>
      <button onClick={onOpen}>Add Category</button>
      <div className="grid gap-2">
        {categories?.map(category => (
          <div key={category.id} className="p-2 border rounded">
            {category.name}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Category Selection in Forms
```typescript
// Using category selection in transaction forms
import { useSelectCategory } from "@/features/categories/hooks/use-select-category";

const TransactionForm = () => {
  const {
    value: selectedCategoryId,
    onChange: onCategoryChange,
    categories,
    isLoading
  } = useSelectCategory();

  return (
    <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map(category => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

## 🎯 Common Use Cases

### Default Categories
```typescript
// Seed common categories for new users
const defaultCategories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Income",
  "Investment",
];

const seedDefaultCategories = async (userId: string) => {
  const categories = defaultCategories.map(name => ({
    id: createId(),
    name,
    userId,
  }));
  
  await db.insert(categories).values(categories);
};
```

### Category Analytics
```typescript
// Get spending by category
const getCategorySpending = async (userId: string, dateRange: DateRange) => {
  return await db
    .select({
      categoryName: categories.name,
      totalSpent: sql<number>`SUM(ABS(${transactions.amount}))`,
      transactionCount: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(accounts.userId, userId),
        lt(transactions.amount, 0), // Only expenses
        gte(transactions.date, dateRange.from),
        lte(transactions.date, dateRange.to)
      )
    )
    .groupBy(categories.name)
    .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`));
};
```

---

## 🔗 Related Features

- **Transactions**: Categories are assigned to transactions for organization
- **Summary**: Category spending included in financial analytics
- **Accounts**: Work together for complete financial tracking
