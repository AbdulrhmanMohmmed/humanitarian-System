/**
 * Reusable TanStack Query hooks for common API patterns.
 * Provides caching, deduplication, pagination, and mutations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Generic paginated list hook.
 * @param {string} key - Query key prefix (e.g. 'beneficiaries')
 * @param {string} endpoint - API endpoint path
 * @param {object} params - Query parameters (page, page_size, filters)
 */
export function usePaginatedList(key, endpoint, params = {}) {
  return useQuery({
    queryKey: [key, params],
    queryFn: async () => {
      const { data } = await api.get(endpoint, { params });
      return data;
    },
    keepPreviousData: true,
  });
}

/**
 * Generic single resource hook.
 */
export function useResource(key, endpoint, id, options = {}) {
  return useQuery({
    queryKey: [key, id],
    queryFn: async () => {
      const { data } = await api.get(`${endpoint}/${id}`);
      return data;
    },
    enabled: !!id,
    ...options,
  });
}

/**
 * Generic create mutation.
 */
export function useCreate(key, endpoint) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await api.post(endpoint, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

/**
 * Generic update mutation.
 */
export function useUpdate(key, endpoint) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }) => {
      const { data } = await api.put(`${endpoint}/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

/**
 * Generic delete mutation.
 */
export function useDelete(key, endpoint) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`${endpoint}/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

/* ── Domain-specific hooks ──────────────────────────────────────────────── */

export function useBeneficiaries(params = {}) {
  return usePaginatedList('beneficiaries', '/beneficiaries', params);
}

export function useProjects(params = {}) {
  return usePaginatedList('projects', '/projects', params);
}

export function useGrants(params = {}) {
  return usePaginatedList('grants', '/finance/grants', params);
}

export function useTransactions(params = {}) {
  return usePaginatedList('transactions', '/finance/transactions', params);
}
