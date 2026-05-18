/**
 * TanStack Query hooks for all Groups A-P backend modules.
 * TypeScript version with proper typing.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// ── Types ───────────────────────────────────────────────────────────────────

interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface MfaStatus { mfa_enabled: boolean; }
interface MfaSetupResponse { secret: string; qr_uri: string; backup_codes: string[]; }
interface ApiKey { id: number; name: string; key: string; created_at: string; }
interface Account { id: number; code: string; name: string; name_ar?: string; type: string; }
interface JournalEntry { id: number; reference: string; description: string; is_posted: boolean; }
interface TrialBalanceEntry { account_code: string; account_name: string; debit: number; credit: number; }
interface ProtectionCase { id: number; case_number: string; case_type: string; priority: string; status: string; }
interface NutritionScreening { id: number; classification: string; referred: boolean; muac?: number; }
interface WashDashboard { total_water_points: number; functional: number; safe_water: number; total_served: number; }
interface SearchResult { results: { entity_type: string; id: number; name: string; }[]; }

// ── Helper ──────────────────────────────────────────────────────────────────

function useList<T = unknown>(key: string, endpoint: string, params: Record<string, unknown> = {}) {
  return useQuery<T>({
    queryKey: [key, params],
    queryFn: async () => { const { data } = await api.get(endpoint, { params }); return data; },
  });
}

function useMut<TData = unknown, TVariables = unknown>(key: string, method: 'post' | 'put' | 'patch' | 'delete', endpoint: string) {
  const qc = useQueryClient();
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (body) => { const { data } = await (api as any)[method](endpoint, body); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });
}

// ── MFA ─────────────────────────────────────────────────────────────────────
export function useMfaStatus() {
  return useQuery<MfaStatus>({ queryKey: ['mfa-status'], queryFn: async () => { const { data } = await api.get('/mfa/status'); return data; } });
}
export function useMfaSetup() { return useMut<MfaSetupResponse>('mfa-status', 'post', '/mfa/setup'); }
export function useMfaConfirm() { return useMut('mfa-status', 'post', '/mfa/confirm'); }
export function useMfaDisable() { return useMut('mfa-status', 'post', '/mfa/disable'); }

// ── API Keys ────────────────────────────────────────────────────────────────
export function useApiKeys() { return useList<ApiKey[]>('api-keys', '/security/api-keys'); }
export function useCreateApiKey() { return useMut<ApiKey, { name: string }>('api-keys', 'post', '/security/api-keys'); }
export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, number>({
    mutationFn: async (id) => { const { data } = await api.delete(`/security/api-keys/${id}`); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

// ── Sessions ────────────────────────────────────────────────────────────────
export function useSessions() { return useList('sessions', '/security/sessions'); }
export function useTerminateSession() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, number>({
    mutationFn: async (id) => { const { data } = await api.delete(`/security/sessions/${id}`); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

// ── GDPR / Consent ──────────────────────────────────────────────────────────
export function useConsents(beneficiaryId?: number) {
  return useQuery({
    queryKey: ['consents', beneficiaryId],
    queryFn: async () => { const { data } = await api.get(`/security/consents/${beneficiaryId}`); return data; },
    enabled: !!beneficiaryId,
  });
}
export function useRecordConsent() { return useMut('consents', 'post', '/security/consent'); }

// ── Accounting ──────────────────────────────────────────────────────────────
export function useAccounts() { return useList<Account[]>('accounts', '/accounting/accounts'); }
export function useSeedAccounts() { return useMut('accounts', 'post', '/accounting/accounts/seed'); }
export function useCreateAccount() { return useMut('accounts', 'post', '/accounting/accounts'); }
export function useJournalEntries() { return useList<JournalEntry[]>('journal-entries', '/accounting/journal-entries'); }
export function useCreateJournalEntry() { return useMut('journal-entries', 'post', '/accounting/journal-entries'); }
export function useTrialBalance() { return useList<TrialBalanceEntry[]>('trial-balance', '/accounting/trial-balance'); }
export function useBudgetLines(params?: Record<string, unknown>) { return useList('budget-lines', '/accounting/budget-lines', params); }
export function useCreateBudgetLine() { return useMut('budget-lines', 'post', '/accounting/budget-lines'); }
export function useDonorTemplates() { return useList('donor-templates', '/accounting/donor-templates'); }

// ── MEAL Advanced ───────────────────────────────────────────────────────────
export function useIndicators(params?: Record<string, unknown>) { return useList('indicators', '/meal/indicators', params); }
export function useCreateIndicator() { return useMut('indicators', 'post', '/meal/indicators'); }
export function useDeduplication() { return useMut('deduplication', 'post', '/meal/deduplication/run'); }
export function usePdmTemplates() { return useList('pdm-templates', '/meal/pdm-templates'); }

// ── HR Advanced ─────────────────────────────────────────────────────────────
export function usePayroll(params?: Record<string, unknown>) { return useList('payroll', '/hr-advanced/payroll', params); }
export function useCreatePayroll() { return useMut('payroll', 'post', '/hr-advanced/payroll'); }
export function usePerformanceReviews(params?: Record<string, unknown>) { return useList('reviews', '/hr-advanced/performance-reviews', params); }
export function useCreateReview() { return useMut('reviews', 'post', '/hr-advanced/performance-reviews'); }
export function useTrainings(params?: Record<string, unknown>) { return useList('trainings', '/hr-advanced/trainings', params); }
export function useCreateTraining() { return useMut('trainings', 'post', '/hr-advanced/trainings'); }
export function useTimesheets(params?: Record<string, unknown>) { return useList('timesheets', '/hr-advanced/timesheets', params); }
export function useCreateTimesheet() { return useMut('timesheets', 'post', '/hr-advanced/timesheets'); }
export function useSafetyCheckins(params?: Record<string, unknown>) { return useList('safety', '/hr-advanced/safety-checkins', params); }
export function useCreateSafetyCheckin() { return useMut('safety', 'post', '/hr-advanced/safety/check-in'); }
export function useContracts(params?: Record<string, unknown>) { return useList('contracts', '/hr-advanced/contracts', params); }
export function useCreateContract() { return useMut('contracts', 'post', '/hr-advanced/contracts'); }

// ── Supply Chain ────────────────────────────────────────────────────────────
export function useStockMovements(params?: Record<string, unknown>) { return useList('stock', '/supply-chain/stock-movements', params); }
export function useCreateStockMovement() { return useMut('stock', 'post', '/supply-chain/stock-movements'); }
export function useBatches(params?: Record<string, unknown>) { return useList('batches', '/supply-chain/batches', params); }
export function useCreateBatch() { return useMut('batches', 'post', '/supply-chain/batches'); }
export function useExpiryAlerts() { return useList('expiry-alerts', '/supply-chain/expiry-alerts'); }
export function useLastMileDeliveries(params?: Record<string, unknown>) { return useList('deliveries', '/supply-chain/last-mile', params); }
export function useCreateDelivery() { return useMut('deliveries', 'post', '/supply-chain/last-mile'); }
export function useVehicleMaintenance(params?: Record<string, unknown>) { return useList('vehicles', '/supply-chain/vehicle-maintenance', params); }

// ── Standards ───────────────────────────────────────────────────────────────
export function useSphereStandards() { return useList('sphere', '/standards/sphere'); }
export function useSeedSphere() { return useMut('sphere', 'post', '/standards/sphere/seed'); }
export function useGrandBargain() { return useList('grand-bargain', '/standards/grand-bargain'); }
export function useDoNoHarm(params?: Record<string, unknown>) { return useList('do-no-harm', '/standards/do-no-harm', params); }
export function useCreateDoNoHarm() { return useMut('do-no-harm', 'post', '/standards/do-no-harm'); }
export function useGenderMarkers(params?: Record<string, unknown>) { return useList('gender-markers', '/standards/gender-marker', params); }
export function useCreateGenderMarker() { return useMut('gender-markers', 'post', '/standards/gender-marker'); }
export function useDisabilityMarkers(params?: Record<string, unknown>) { return useList('disability', '/standards/disability-inclusion', params); }
export function useCreateDisabilityMarker() { return useMut('disability', 'post', '/standards/disability-inclusion'); }

// ── Protection ──────────────────────────────────────────────────────────────
export function useProtectionCases(params?: Record<string, unknown>) { return useList<PaginatedResponse<ProtectionCase>>('protection-cases', '/protection/cases', params); }
export function useCreateProtectionCase() { return useMut<ProtectionCase>('protection-cases', 'post', '/protection/cases'); }
export function useProtectionReferrals(params?: Record<string, unknown>) { return useList('referrals', '/protection/referrals', params); }
export function useCreateReferral() { return useMut('referrals', 'post', '/protection/referrals'); }

// ── Emergency ───────────────────────────────────────────────────────────────
export function useEmergencies(params?: Record<string, unknown>) { return useList('emergencies', '/emergency/', params); }
export function useCreateEmergency() { return useMut('emergencies', 'post', '/emergency/'); }
export function useRapidAssessments(params?: Record<string, unknown>) { return useList('assessments', '/emergency/assessments', params); }
export function useCreateAssessment() { return useMut('assessments', 'post', '/emergency/assessments'); }

// ── Camp Management ─────────────────────────────────────────────────────────
export function useCamps(params?: Record<string, unknown>) { return useList('camps', '/camps/', params); }
export function useCreateCamp() { return useMut('camps', 'post', '/camps/'); }
export function useCampServices(campId?: number) {
  return useQuery({
    queryKey: ['camp-services', campId],
    queryFn: async () => { const { data } = await api.get(`/camps/${campId}/services`); return data; },
    enabled: !!campId,
  });
}

// ── Nutrition ───────────────────────────────────────────────────────────────
export function useNutritionScreenings(params?: Record<string, unknown>) { return useList<PaginatedResponse<NutritionScreening>>('screenings', '/nutrition/screenings', params); }
export function useCreateScreening() { return useMut<NutritionScreening>('screenings', 'post', '/nutrition/screenings'); }
export function useNutritionDashboard() {
  return useQuery({ queryKey: ['nutrition-dashboard'], queryFn: async () => { const { data } = await api.get('/nutrition/dashboard'); return data; } });
}

// ── WASH ────────────────────────────────────────────────────────────────────
export function useWaterPoints(params?: Record<string, unknown>) { return useList('water-points', '/wash/water-points', params); }
export function useCreateWaterPoint() { return useMut('water-points', 'post', '/wash/water-points'); }
export function useWaterTests(params?: Record<string, unknown>) { return useList('water-tests', '/wash/water-tests', params); }
export function useCreateWaterTest() { return useMut('water-tests', 'post', '/wash/water-tests'); }
export function useWashDashboard() {
  return useQuery<WashDashboard>({ queryKey: ['wash-dashboard'], queryFn: async () => { const { data } = await api.get('/wash/dashboard'); return data; } });
}

// ── Education ───────────────────────────────────────────────────────────────
export function useSchools(params?: Record<string, unknown>) { return useList('schools', '/education/schools', params); }
export function useCreateSchool() { return useMut('schools', 'post', '/education/schools'); }
export function useEducationDashboard() {
  return useQuery({ queryKey: ['education-dashboard'], queryFn: async () => { const { data } = await api.get('/education/dashboard'); return data; } });
}

// ── Livelihoods ─────────────────────────────────────────────────────────────
export function useLivelihoodPrograms(params?: Record<string, unknown>) { return useList('livelihoods', '/livelihoods/programs', params); }
export function useCreateLivelihoodProgram() { return useMut('livelihoods', 'post', '/livelihoods/programs'); }

// ── Early Warning ───────────────────────────────────────────────────────────
export function useEarlyWarningIndicators(params?: Record<string, unknown>) { return useList('ew-indicators', '/early-warning/indicators', params); }
export function useCreateEwIndicator() { return useMut('ew-indicators', 'post', '/early-warning/indicators'); }
export function useUpdateEwValue() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { id: number; value: number }>({
    mutationFn: async ({ id, value }) => { const { data } = await api.put(`/early-warning/indicators/${id}/value`, { value }); return data; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ew-indicators'] }); qc.invalidateQueries({ queryKey: ['ew-alerts'] }); },
  });
}
export function useEarlyWarningAlerts() { return useList('ew-alerts', '/early-warning/alerts'); }

// ── Bulk Operations ─────────────────────────────────────────────────────────
export function useBulkExport(entityType: string, format = 'json') {
  return useQuery({
    queryKey: ['bulk-export', entityType, format],
    queryFn: async () => { const { data } = await api.get(`/bulk/export/${entityType}`, { params: { format } }); return data; },
    enabled: false,
  });
}
export function useBulkImport() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { entityType: string; file: File }>({
    mutationFn: async ({ entityType, file }) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/bulk/import/${entityType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

// ── Unified Search ──────────────────────────────────────────────────────────
export function useSearch(query: string, entity = 'all') {
  return useQuery<SearchResult>({
    queryKey: ['search', query, entity],
    queryFn: async () => { const { data } = await api.get('/search/', { params: { q: query, entity } }); return data; },
    enabled: (query?.length ?? 0) >= 2,
  });
}

// ── KoBoToolbox ─────────────────────────────────────────────────────────────
export function useKoboConnectionTest() {
  return useQuery({ queryKey: ['kobo-test'], queryFn: async () => { const { data } = await api.get('/kobo/connection-test'); return data; } });
}
export function useKoboAssets() {
  return useQuery({ queryKey: ['kobo-assets'], queryFn: async () => { const { data } = await api.get('/kobo/assets'); return data; } });
}
