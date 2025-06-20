import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@clerk/nextjs";
import { client } from "@/lib/hono";

export const useGetAccounts = () => {
  const user_id = useAuth();
  const query = useQuery({
    queryKey: ["accounts", user_id.userId],
    queryFn: async () => {
      const response = await client.api.accounts.$get();

      if (!response.ok) throw new Error("Failed to fetch accounts.");

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
