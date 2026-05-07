/**
 * TanStack Query client configuration.
 * Provides global caching, deduplication, and background refetching.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes before refetch
      gcTime: 30 * 60 * 1000,          // 30 minutes cache retention
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
