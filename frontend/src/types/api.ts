/** Core API response types for HIAOS. */

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  mfa_enabled?: boolean;
}

export type UserRole = 'admin' | 'manager' | 'officer' | 'viewer';

// ── Beneficiary ───────────────────────────────────────────────────────────────

export interface Beneficiary {
  id: number;
  first_name: string;
  last_name: string;
  national_id?: string;
  gender?: 'male' | 'female';
  date_of_birth?: string;
  phone?: string;
  governorate?: string;
  district?: string;
  village?: string;
  household_size: number;
  head_of_household: boolean;
  has_disability: boolean;
  disability_type?: string;
  vulnerability_score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BeneficiaryCreate {
  first_name: string;
  last_name: string;
  national_id?: string;
  gender?: 'male' | 'female';
  date_of_birth?: string;
  phone?: string;
  governorate?: string;
  district?: string;
  household_size?: number;
  vulnerability_score?: number;
  notes?: string;
}

// ── Project ───────────────────────────────────────────────────────────────────

export type ProjectStatus = 'planned' | 'active' | 'completed' | 'suspended' | 'cancelled';

export interface Project {
  id: number;
  code: string;
  name: string;
  description?: string;
  sector?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget: number;
  spent: number;
  currency: string;
  target_beneficiaries: number;
  actual_beneficiaries: number;
  governorate?: string;
  district?: string;
  donor?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  code: string;
  name: string;
  description?: string;
  sector?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  target_beneficiaries?: number;
  governorate?: string;
  donor?: string;
}

// ── Activity ──────────────────────────────────────────────────────────────────

export interface Activity {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget: number;
  status: ProjectStatus;
  responsible?: string;
  progress: number;
}

// ── Finance ───────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  date: string;
  created_at: string;
}

export interface Grant {
  id: number;
  name: string;
  donor_id?: string;
  amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  status: string;
}

// ── Monitoring ────────────────────────────────────────────────────────────────

export type IndicatorType = 'output' | 'outcome' | 'impact' | 'process';

export interface Indicator {
  id: number;
  name: string;
  code?: string;
  type: IndicatorType;
  unit?: string;
  target_value: number;
  actual_value: number;
  baseline: number;
  project_id: number;
}

// ── Accountability ────────────────────────────────────────────────────────────

export interface Complaint {
  id: number;
  reference_number: string;
  channel: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  status: string;
  is_anonymous: boolean;
  created_at: string;
}

// ── Risk ──────────────────────────────────────────────────────────────────────

export interface Risk {
  id: number;
  title: string;
  description?: string;
  category?: string;
  likelihood: string;
  impact: string;
  mitigation_plan?: string;
  status: string;
}

// ── Geographic ────────────────────────────────────────────────────────────────

export interface AdminBoundary {
  id: number;
  name: string;
  name_ar?: string;
  code?: string;
  level: string;
  parent_id?: number;
  latitude?: number;
  longitude?: number;
  population: number;
  area_sq_km: number;
}

export interface Location {
  id: number;
  name: string;
  location_type: string;
  latitude: number;
  longitude: number;
  address?: string;
  is_active: boolean;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_beneficiaries: number;
  total_projects: number;
  total_budget: number;
  active_projects: number;
  total_employees: number;
  total_grants: number;
  total_spent: number;
  total_distributions: number;
  total_cash_transfers: number;
  pending_leaves: number;
  low_stock_items: number;
  active_surveys: number;
}

// ── Notification ──────────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

// ── Search ────────────────────────────────────────────────────────────────────

export interface SearchResult {
  type: string;
  id: number;
  title: string;
  subtitle: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  page: number;
  limit: number;
  results: SearchResult[];
}

// ── Donor Portal ──────────────────────────────────────────────────────────────

export interface Proposal {
  id: number;
  title: string;
  donor_name: string;
  requested_amount: number;
  currency: string;
  sector: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  description?: string;
  created_at: string;
}

export interface FundingOpportunity {
  id: number;
  title: string;
  donor: string;
  amount: number;
  currency: string;
  deadline: string;
  sectors: string;
  status: 'open' | 'closed' | 'upcoming';
}

// ── Data Center ───────────────────────────────────────────────────────────────

export interface PopulationRecord {
  id: number;
  governorate: string;
  district?: string;
  sub_district?: string;
  category: string;
  gender: string;
  age_group: string;
  count: number;
  source?: string;
  reference_date: string;
}

export interface CampSiteProfile {
  id: number;
  name: string;
  camp_type: string;
  governorate: string;
  district?: string;
  status: string;
  capacity: number;
  current_population: number;
  latitude?: number;
  longitude?: number;
}

export interface NeedsAssessment {
  id: number;
  title: string;
  assessment_type: string;
  governorate: string;
  severity_level: number;
  people_in_need: number;
  people_targeted: number;
  reference_date: string;
}

export interface SectorFacility {
  id: number;
  name: string;
  facility_type: string;
  sector: string;
  governorate: string;
  status: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
}
