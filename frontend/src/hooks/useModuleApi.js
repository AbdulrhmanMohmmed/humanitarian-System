/**
 * TanStack Query hooks for all Groups A-P backend modules.
 * Each hook returns { data, isLoading, error } for queries
 * and { mutate, mutateAsync, isPending } for mutations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// ── Helper ──────────────────────────────────────────────────────────────────
function useList(key, endpoint, params = {}) {
  return useQuery({
    queryKey: [key, params],
    queryFn: async () => { const { data } = await api.get(endpoint, { params }); return data; },
    keepPreviousData: true,
  });
}
function useMut(key, method, endpoint) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => { const { data } = await api[method](endpoint, body); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });
}

// ── MFA ─────────────────────────────────────────────────────────────────────
export function useMfaStatus() {
  return useQuery({ queryKey: ['mfa-status'], queryFn: async () => { const { data } = await api.get('/mfa/status'); return data; } });
}
export function useMfaSetup() { return useMut('mfa-status', 'post', '/mfa/setup'); }
export function useMfaConfirm() { return useMut('mfa-status', 'post', '/mfa/confirm'); }
export function useMfaDisable() { return useMut('mfa-status', 'post', '/mfa/disable'); }

// ── API Keys ────────────────────────────────────────────────────────────────
export function useApiKeys() { return useList('api-keys', '/security/api-keys'); }
export function useCreateApiKey() { return useMut('api-keys', 'post', '/security/api-keys'); }
export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/security/api-keys/${id}`); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

// ── Sessions ────────────────────────────────────────────────────────────────
export function useSessions() { return useList('sessions', '/security/sessions'); }
export function useTerminateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/security/sessions/${id}`); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

// ── GDPR / Consent ──────────────────────────────────────────────────────────
export function useConsents(beneficiaryId) {
  return useQuery({
    queryKey: ['consents', beneficiaryId],
    queryFn: async () => { const { data } = await api.get(`/security/consents/${beneficiaryId}`); return data; },
    enabled: !!beneficiaryId,
  });
}
export function useRecordConsent() { return useMut('consents', 'post', '/security/consent'); }

// ── Accounting ──────────────────────────────────────────────────────────────
export function useAccounts() { return useList('accounts', '/accounting/accounts'); }
export function useSeedAccounts() { return useMut('accounts', 'post', '/accounting/accounts/seed'); }
export function useCreateAccount() { return useMut('accounts', 'post', '/accounting/accounts'); }
export function useJournalEntries() { return useList('journal-entries', '/accounting/journal-entries'); }
export function useCreateJournalEntry() { return useMut('journal-entries', 'post', '/accounting/journal-entries'); }
export function useTrialBalance() { return useList('trial-balance', '/accounting/trial-balance'); }
export function useBudgetLines(params) { return useList('budget-lines', '/accounting/budget-lines', params); }
export function useCreateBudgetLine() { return useMut('budget-lines', 'post', '/accounting/budget-lines'); }
export function useDonorTemplates() { return useList('donor-templates', '/accounting/donor-templates'); }

// ── MEAL Advanced ───────────────────────────────────────────────────────────
export function useIndicators(params) { return useList('indicators', '/meal/indicators', params); }
export function useCreateIndicator() { return useMut('indicators', 'post', '/meal/indicators'); }
export function useDeduplication() { return useMut('deduplication', 'post', '/meal/deduplication/run'); }
export function usePdmTemplates() { return useList('pdm-templates', '/meal/pdm-templates'); }

// ── HR Advanced ─────────────────────────────────────────────────────────────
export function usePayroll(params) { return useList('payroll', '/hr-advanced/payroll', params); }
export function useCreatePayroll() { return useMut('payroll', 'post', '/hr-advanced/payroll'); }
export function usePerformanceReviews(params) { return useList('reviews', '/hr-advanced/reviews', params); }
export function useCreateReview() { return useMut('reviews', 'post', '/hr-advanced/reviews'); }
export function useTrainings(params) { return useList('trainings', '/hr-advanced/trainings', params); }
export function useCreateTraining() { return useMut('trainings', 'post', '/hr-advanced/trainings'); }
export function useTimesheets(params) { return useList('timesheets', '/hr-advanced/timesheets', params); }
export function useCreateTimesheet() { return useMut('timesheets', 'post', '/hr-advanced/timesheets'); }
export function useSafetyCheckins(params) { return useList('safety', '/hr-advanced/safety-checkins', params); }
export function useCreateSafetyCheckin() { return useMut('safety', 'post', '/hr-advanced/safety-checkins'); }
export function useContracts(params) { return useList('contracts', '/hr-advanced/contracts', params); }
export function useCreateContract() { return useMut('contracts', 'post', '/hr-advanced/contracts'); }

// ── Supply Chain ────────────────────────────────────────────────────────────
export function useStockMovements(params) { return useList('stock', '/supply-chain/stock-movements', params); }
export function useCreateStockMovement() { return useMut('stock', 'post', '/supply-chain/stock-movements'); }
export function useBatches(params) { return useList('batches', '/supply-chain/batches', params); }
export function useCreateBatch() { return useMut('batches', 'post', '/supply-chain/batches'); }
export function useExpiryAlerts() { return useList('expiry-alerts', '/supply-chain/expiry-alerts'); }
export function useLastMileDeliveries(params) { return useList('deliveries', '/supply-chain/deliveries', params); }
export function useCreateDelivery() { return useMut('deliveries', 'post', '/supply-chain/deliveries'); }
export function useVehicleMaintenance(params) { return useList('vehicles', '/supply-chain/vehicle-maintenance', params); }

// ── Standards ───────────────────────────────────────────────────────────────
export function useSphereStandards() { return useList('sphere', '/standards/sphere'); }
export function useSeedSphere() { return useMut('sphere', 'post', '/standards/sphere/seed'); }
export function useGrandBargain() { return useList('grand-bargain', '/standards/grand-bargain'); }
export function useDoNoHarm(params) { return useList('do-no-harm', '/standards/do-no-harm', params); }
export function useCreateDoNoHarm() { return useMut('do-no-harm', 'post', '/standards/do-no-harm'); }
export function useGenderMarkers(params) { return useList('gender-markers', '/standards/gender-markers', params); }
export function useCreateGenderMarker() { return useMut('gender-markers', 'post', '/standards/gender-markers'); }
export function useDisabilityMarkers(params) { return useList('disability', '/standards/disability-markers', params); }
export function useCreateDisabilityMarker() { return useMut('disability', 'post', '/standards/disability-markers'); }

// ── Protection ──────────────────────────────────────────────────────────────
export function useProtectionCases(params) { return useList('protection-cases', '/protection/cases', params); }
export function useCreateProtectionCase() { return useMut('protection-cases', 'post', '/protection/cases'); }
export function useProtectionReferrals(params) { return useList('referrals', '/protection/referrals', params); }
export function useCreateReferral() { return useMut('referrals', 'post', '/protection/referrals'); }

// ── Emergency ───────────────────────────────────────────────────────────────
export function useEmergencies(params) { return useList('emergencies', '/emergency/emergencies', params); }
export function useCreateEmergency() { return useMut('emergencies', 'post', '/emergency/emergencies'); }
export function useRapidAssessments(params) { return useList('assessments', '/emergency/assessments', params); }
export function useCreateAssessment() { return useMut('assessments', 'post', '/emergency/assessments'); }

// ── Camp Management ─────────────────────────────────────────────────────────
export function useCamps(params) { return useList('camps', '/camps', params); }
export function useCreateCamp() { return useMut('camps', 'post', '/camps'); }
export function useCampServices(campId) {
  return useQuery({
    queryKey: ['camp-services', campId],
    queryFn: async () => { const { data } = await api.get(`/camps/${campId}/services`); return data; },
    enabled: !!campId,
  });
}

// ── Nutrition ───────────────────────────────────────────────────────────────
export function useNutritionScreenings(params) { return useList('screenings', '/nutrition/screenings', params); }
export function useCreateScreening() { return useMut('screenings', 'post', '/nutrition/screenings'); }
export function useNutritionDashboard() {
  return useQuery({ queryKey: ['nutrition-dashboard'], queryFn: async () => { const { data } = await api.get('/nutrition/dashboard'); return data; } });
}

// ── WASH ────────────────────────────────────────────────────────────────────
export function useWaterPoints(params) { return useList('water-points', '/wash/water-points', params); }
export function useCreateWaterPoint() { return useMut('water-points', 'post', '/wash/water-points'); }
export function useWaterTests(params) { return useList('water-tests', '/wash/water-tests', params); }
export function useCreateWaterTest() { return useMut('water-tests', 'post', '/wash/water-tests'); }
export function useWashDashboard() {
  return useQuery({ queryKey: ['wash-dashboard'], queryFn: async () => { const { data } = await api.get('/wash/dashboard'); return data; } });
}

// ── Education ───────────────────────────────────────────────────────────────
export function useSchools(params) { return useList('schools', '/education/schools', params); }
export function useCreateSchool() { return useMut('schools', 'post', '/education/schools'); }
export function useEducationDashboard() {
  return useQuery({ queryKey: ['education-dashboard'], queryFn: async () => { const { data } = await api.get('/education/dashboard'); return data; } });
}

// ── Livelihoods ─────────────────────────────────────────────────────────────
export function useLivelihoodPrograms(params) { return useList('livelihoods', '/livelihoods/programs', params); }
export function useCreateLivelihoodProgram() { return useMut('livelihoods', 'post', '/livelihoods/programs'); }

// ── Early Warning ───────────────────────────────────────────────────────────
export function useEarlyWarningIndicators(params) { return useList('ew-indicators', '/early-warning/indicators', params); }
export function useCreateEwIndicator() { return useMut('ew-indicators', 'post', '/early-warning/indicators'); }
export function useUpdateEwValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value }) => { const { data } = await api.put(`/early-warning/indicators/${id}/value`, { value }); return data; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ew-indicators'] }); qc.invalidateQueries({ queryKey: ['ew-alerts'] }); },
  });
}
export function useEarlyWarningAlerts() { return useList('ew-alerts', '/early-warning/alerts'); }

// ── Bulk Operations ─────────────────────────────────────────────────────────
export function useBulkExport(entityType, format = 'json') {
  return useQuery({
    queryKey: ['bulk-export', entityType, format],
    queryFn: async () => { const { data } = await api.get(`/bulk/export/${entityType}`, { params: { format } }); return data; },
    enabled: false, // Manual trigger only
  });
}
export function useBulkImport() {
  const qc = useQueryClient();
  return useMutation({
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
export function useSearch(query, entity = 'all') {
  return useQuery({
    queryKey: ['search', query, entity],
    queryFn: async () => { const { data } = await api.get('/search/', { params: { q: query, entity } }); return data; },
    enabled: query?.length >= 2,
  });
}
