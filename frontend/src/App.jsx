import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrandingProvider } from './contexts/BrandingContext';
import Layout from './components/Layout';
import ModuleErrorBoundary from './components/ModuleErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';

// ── Lazy-loaded pages (code splitting — one chunk per page) ───────────────────
const Login                = lazy(() => import('./pages/Login'));
const Dashboard            = lazy(() => import('./pages/Dashboard'));
const Beneficiaries        = lazy(() => import('./pages/Beneficiaries'));
const Projects             = lazy(() => import('./pages/Projects'));
const Finance              = lazy(() => import('./pages/Finance'));
const HR                   = lazy(() => import('./pages/HR'));
const Inventory            = lazy(() => import('./pages/Inventory'));
const Monitoring           = lazy(() => import('./pages/Monitoring'));
const Cash                 = lazy(() => import('./pages/Cash'));
const DataCollection       = lazy(() => import('./pages/DataCollection'));
const Reports              = lazy(() => import('./pages/Reports'));
const DocumentArchive      = lazy(() => import('./pages/DocumentArchive'));
const Accountability       = lazy(() => import('./pages/Accountability'));
const Learning             = lazy(() => import('./pages/Learning'));
const LogFramePage         = lazy(() => import('./pages/LogFramePage'));
const EvaluationTools      = lazy(() => import('./pages/EvaluationTools'));
const AnalyticsDashboard   = lazy(() => import('./pages/AnalyticsDashboard'));
const MEALPlan             = lazy(() => import('./pages/MEALPlan'));
const Safeguarding         = lazy(() => import('./pages/Safeguarding'));
const ActivityTracker      = lazy(() => import('./pages/ActivityTracker'));
const NeedsAssessment      = lazy(() => import('./pages/NeedsAssessment'));
const ExecutiveDashboard   = lazy(() => import('./pages/ExecutiveDashboard'));
const IPTTDashboard        = lazy(() => import('./pages/IPTTDashboard'));
const FieldVisits          = lazy(() => import('./pages/FieldVisits'));
const Recommendations      = lazy(() => import('./pages/Recommendations'));
const ComplianceDashboard  = lazy(() => import('./pages/ComplianceDashboard'));
const AuditTrail           = lazy(() => import('./pages/AuditTrail'));
const SectorIndicators     = lazy(() => import('./pages/SectorIndicators'));
const AssessmentTools      = lazy(() => import('./pages/AssessmentTools'));
const AIInsights           = lazy(() => import('./pages/AIInsights'));
const OfflineMode          = lazy(() => import('./pages/OfflineMode'));
const KoBoIntegration      = lazy(() => import('./pages/KoBoIntegration'));
const RemoteMonitoring     = lazy(() => import('./pages/RemoteMonitoring'));
const FeedbackLoop         = lazy(() => import('./pages/FeedbackLoop'));
const ScheduledReports     = lazy(() => import('./pages/ScheduledReports'));
const Integrations         = lazy(() => import('./pages/Integrations'));
const MEALHub              = lazy(() => import('./pages/MEALHub'));
const DecisionSupport      = lazy(() => import('./pages/DecisionSupport'));
const AntiFraud            = lazy(() => import('./pages/AntiFraud'));
const Watchtower           = lazy(() => import('./pages/Watchtower'));
const StrategicReview      = lazy(() => import('./pages/StrategicReview'));
const PhaseOneCore         = lazy(() => import('./pages/PhaseOneCore'));
const KanbanPage           = lazy(() => import('./pages/KanbanPage'));
const CalendarPage         = lazy(() => import('./pages/CalendarPage'));
const CustomReports        = lazy(() => import('./pages/CustomReports'));
const ProjectDesigner      = lazy(() => import('./pages/ProjectDesigner'));
const DataQualityHub       = lazy(() => import('./pages/DataQualityHub'));
const TemplateMarketplace  = lazy(() => import('./pages/TemplateMarketplace'));
const NarrativeReportBuilder = lazy(() => import('./pages/NarrativeReportBuilder'));
const IATIExport           = lazy(() => import('./pages/IATIExport'));
const SectorHub            = lazy(() => import('./pages/SectorHub'));
const SecurityPrivacySettings = lazy(() => import('./pages/SecurityPrivacySettings'));
const SystemCustomization  = lazy(() => import('./pages/SystemCustomization'));
const ProposalConverter    = lazy(() => import('./pages/ProposalConverter'));
const DonorReportWizard    = lazy(() => import('./pages/DonorReportWizard'));
const OutcomeHarvesting    = lazy(() => import('./pages/OutcomeHarvesting'));
const ValueForMoney        = lazy(() => import('./pages/ValueForMoney'));
const CommunityVerification = lazy(() => import('./pages/CommunityVerification'));
const GreenMEAL            = lazy(() => import('./pages/GreenMEAL'));
const AdaptiveManagement   = lazy(() => import('./pages/AdaptiveManagement'));
const OCHA5WHub            = lazy(() => import('./pages/OCHA5WHub'));
const CoordinationWatchtower = lazy(() => import('./pages/CoordinationWatchtower'));
const MEALLifecycle        = lazy(() => import('./pages/MEALLifecycle'));
const StatisticalLab       = lazy(() => import('./pages/StatisticalLab'));
const DataQualityAudit     = lazy(() => import('./pages/DataQualityAudit'));
const MissionControl       = lazy(() => import('./pages/MissionControl'));
const ReportFactory        = lazy(() => import('./pages/ReportFactory'));
const SpatialInsights      = lazy(() => import('./pages/SpatialInsights'));
const SmartAuditTrail      = lazy(() => import('./pages/SmartAuditTrail'));
const KnowledgeHub         = lazy(() => import('./pages/KnowledgeHub'));
const EnterpriseControl    = lazy(() => import('./pages/EnterpriseControl'));
const BrandingSettings     = lazy(() => import('./pages/BrandingSettings'));
const Procurement          = lazy(() => import('./pages/Procurement'));
const Grants               = lazy(() => import('./pages/Grants'));
const GISDashboard         = lazy(() => import('./pages/GISDashboard'));
const Assets               = lazy(() => import('./pages/Assets'));
const Fleet                = lazy(() => import('./pages/Fleet'));
const Payroll              = lazy(() => import('./pages/Payroll'));
const AIHub                = lazy(() => import('./pages/AIHub'));
const StrategicDashboard   = lazy(() => import('./pages/StrategicDashboard'));
const BVADashboard         = lazy(() => import('./pages/BVADashboard'));
const RiskManagement       = lazy(() => import('./pages/RiskManagement'));
const PartnerPortal        = lazy(() => import('./pages/PartnerPortal'));
const Documents            = lazy(() => import('./pages/Documents'));
const DevConsole           = lazy(() => import('./pages/DevConsole'));

// ── New Modules (Groups A-P) ────────────────────────────────────────────────
const SecurityCenter       = lazy(() => import('./pages/SecurityCenter'));
const AccountingPage       = lazy(() => import('./pages/AccountingPage'));
const ProtectionPage       = lazy(() => import('./pages/ProtectionPage'));
const EmergencyPage        = lazy(() => import('./pages/EmergencyPage'));
const CampManagement       = lazy(() => import('./pages/CampManagement'));
const NutritionPage        = lazy(() => import('./pages/NutritionPage'));
const WashPage             = lazy(() => import('./pages/WashPage'));
const EducationPage        = lazy(() => import('./pages/EducationPage'));
const LivelihoodsPage      = lazy(() => import('./pages/LivelihoodsPage'));
const EarlyWarningPage     = lazy(() => import('./pages/EarlyWarningPage'));
const SupplyChainPage      = lazy(() => import('./pages/SupplyChainPage'));
const HRAdvancedPage       = lazy(() => import('./pages/HRAdvancedPage'));
const StandardsPage        = lazy(() => import('./pages/StandardsPage'));
const BulkOperationsPage   = lazy(() => import('./pages/BulkOperationsPage'));
const UserManagement       = lazy(() => import('./pages/UserManagement'));
const DonorPortal          = lazy(() => import('./pages/DonorPortal'));
const DataCenter           = lazy(() => import('./pages/DataCenter'));

// ── Loading Fallback ─────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-[var(--text-secondary)] animate-pulse">جاري التحميل…</p>
      </div>
    </div>
  );
}

// ── Guards ───────────────────────────────────────────────────────────────────

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25 }}
  >
    {children}
  </motion.div>
);

// ── Routes ───────────────────────────────────────────────────────────────────

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  const P = ({ element, moduleName }) => (
    <ProtectedRoute>
      <PageWrapper>
        <ModuleErrorBoundary moduleName={moduleName}>
          <Suspense fallback={<PageLoader />}>{element}</Suspense>
        </ModuleErrorBoundary>
      </PageWrapper>
    </ProtectedRoute>
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> :
          <Suspense fallback={<PageLoader />}><Login /></Suspense>
        } />

        {/* Core Modules */}
        <Route path="/"                       element={<P element={<Dashboard />} />} />
        <Route path="/beneficiaries"          element={<P element={<Beneficiaries />} />} />
        <Route path="/projects"               element={<P element={<Projects />} />} />
        <Route path="/finance"                element={<P element={<Finance />} />} />
        <Route path="/procurement"            element={<P element={<Procurement />} />} />
        <Route path="/grants"                 element={<P element={<Grants />} />} />
        <Route path="/gis"                    element={<P element={<GISDashboard />} />} />
        <Route path="/assets"                 element={<P element={<Assets />} />} />
        <Route path="/fleet"                  element={<P element={<Fleet />} />} />
        <Route path="/payroll"                element={<P element={<Payroll />} />} />
        <Route path="/ai-hub"                 element={<P element={<AIHub />} />} />
        <Route path="/strategic"              element={<P element={<StrategicDashboard />} />} />
        <Route path="/bva"                    element={<P element={<BVADashboard />} />} />
        <Route path="/risk"                   element={<P element={<RiskManagement />} />} />
        <Route path="/partners"               element={<P element={<PartnerPortal />} />} />
        <Route path="/documents"              element={<P element={<Documents />} />} />
        <Route path="/dev"                    element={<P element={<DevConsole />} />} />
        <Route path="/cash"                   element={<P element={<Cash />} />} />
        <Route path="/activities"             element={<P element={<ActivityTracker />} />} />

        {/* MEAL */}
        <Route path="/meal"                   element={<P element={<MEALHub />} />} />
        <Route path="/meal-plan"              element={<P element={<MEALPlan />} />} />
        <Route path="/monitoring"             element={<P element={<Monitoring />} />} />
        <Route path="/logframe"               element={<P element={<LogFramePage />} />} />
        <Route path="/irs"                    element={<Navigate to="/logframe" replace />} />
        <Route path="/iptt"                   element={<P element={<IPTTDashboard />} />} />
        <Route path="/lifecycle"              element={<P element={<MEALLifecycle />} />} />
        <Route path="/field-visits"           element={<P element={<FieldVisits />} />} />
        <Route path="/recommendations"        element={<P element={<Recommendations />} />} />
        <Route path="/evaluation"             element={<P element={<EvaluationTools />} />} />
        <Route path="/assessment-tools"       element={<P element={<AssessmentTools />} />} />
        <Route path="/needs-assessment"       element={<P element={<NeedsAssessment />} />} />
        <Route path="/outcome-harvesting"     element={<P element={<OutcomeHarvesting />} />} />
        <Route path="/adaptive-management"    element={<P element={<AdaptiveManagement />} />} />
        <Route path="/dqa"                    element={<P element={<DataQualityAudit />} />} />
        <Route path="/data-quality"           element={<Navigate to="/dqa" replace />} />
        <Route path="/stats-lab"              element={<P element={<StatisticalLab />} />} />
        <Route path="/vfm"                    element={<P element={<ValueForMoney />} />} />
        <Route path="/green-meal"             element={<P element={<GreenMEAL />} />} />
        <Route path="/remote-monitoring"      element={<P element={<RemoteMonitoring />} />} />

        {/* Analytics & Intelligence */}
        <Route path="/analytics"              element={<P element={<AnalyticsDashboard />} />} />
        <Route path="/executive"              element={<P element={<ExecutiveDashboard />} />} />
        <Route path="/mission-control"        element={<P element={<MissionControl />} />} />
        <Route path="/ai-insights"            element={<P element={<AIInsights />} />} />
        <Route path="/decision-support"       element={<P element={<DecisionSupport />} />} />
        <Route path="/spatial-insights"       element={<P element={<SpatialInsights />} />} />

        {/* Reports */}
        <Route path="/reports"                element={<P element={<Reports />} />} />
        <Route path="/report-factory"         element={<P element={<ReportFactory />} />} />
        <Route path="/custom-reports"         element={<P element={<CustomReports />} />} />
        <Route path="/scheduled-reports"      element={<P element={<ScheduledReports />} />} />
        <Route path="/narrative-builder"      element={<P element={<NarrativeReportBuilder />} />} />
        <Route path="/donor-reports"          element={<P element={<DonorReportWizard />} />} />
        <Route path="/iati-export"            element={<P element={<IATIExport />} />} />
        <Route path="/ocha-5w"               element={<P element={<OCHA5WHub />} />} />

        {/* Accountability & Protection */}
        <Route path="/accountability"         element={<P element={<Accountability />} />} />
        <Route path="/safeguarding"           element={<P element={<Safeguarding />} />} />
        <Route path="/feedback-loop"          element={<P element={<FeedbackLoop />} />} />
        <Route path="/community-verification" element={<P element={<CommunityVerification />} />} />

        {/* Compliance & Audit */}
        <Route path="/compliance"             element={<P element={<ComplianceDashboard />} />} />
        <Route path="/audit"                  element={<P element={<AuditTrail />} />} />
        <Route path="/smart-audit"            element={<P element={<SmartAuditTrail />} />} />
        <Route path="/anti-fraud"             element={<P element={<AntiFraud />} />} />
        <Route path="/strategic-review"       element={<P element={<StrategicReview />} />} />
        <Route path="/phase-one"              element={<P element={<PhaseOneCore />} />} />

        {/* Risk */}
        <Route path="/risks"                  element={<P element={<RiskManagement />} />} />
        <Route path="/risk-radar"             element={<Navigate to="/risks" replace />} />
        <Route path="/watchtower"             element={<P element={<Watchtower />} />} />
        <Route path="/coordination-watchtower" element={<P element={<CoordinationWatchtower />} />} />

        {/* Sectors & Coordination */}
        <Route path="/sector-indicators"      element={<P element={<SectorIndicators />} />} />
        <Route path="/sector-hub"             element={<P element={<SectorHub />} />} />

        {/* Data & Knowledge */}
        <Route path="/data-collection"        element={<P element={<DataCollection />} />} />
        <Route path="/documents"              element={<P element={<DocumentArchive />} />} />
        <Route path="/learning"               element={<P element={<Learning />} />} />
        <Route path="/knowledge-hub"          element={<P element={<KnowledgeHub />} />} />
        <Route path="/marketplace"            element={<P element={<TemplateMarketplace />} />} />
        <Route path="/kobo"                   element={<P element={<KoBoIntegration />} />} />
        <Route path="/offline"                element={<P element={<OfflineMode />} />} />

        {/* System & Settings */}
        <Route path="/project-designer"       element={<P element={<ProjectDesigner />} />} />
        <Route path="/proposal-converter"     element={<P element={<ProposalConverter />} />} />
        <Route path="/security-settings"      element={<P element={<SecurityPrivacySettings />} />} />
        <Route path="/system-customization"   element={<P element={<SystemCustomization />} />} />
        <Route path="/enterprise-control"     element={<P element={<EnterpriseControl />} />} />
        <Route path="/branding-settings"      element={<P element={<BrandingSettings />} />} />
        <Route path="/integrations"           element={<P element={<Integrations />} />} />
        <Route path="/kanban"                 element={<P element={<KanbanPage />} />} />
        <Route path="/calendar"              element={<P element={<CalendarPage />} />} />

        {/* New Humanitarian Modules (Groups A-P) */}
        <Route path="/security-center"       element={<P element={<SecurityCenter />} />} />
        <Route path="/accounting"            element={<P element={<AccountingPage />} />} />
        <Route path="/protection"            element={<P element={<ProtectionPage />} />} />
        <Route path="/emergency"             element={<P element={<EmergencyPage />} />} />
        <Route path="/camps"                 element={<P element={<CampManagement />} />} />
        <Route path="/nutrition"             element={<P element={<NutritionPage />} />} />
        <Route path="/wash"                  element={<P element={<WashPage />} />} />
        <Route path="/education"             element={<P element={<EducationPage />} />} />
        <Route path="/livelihoods"           element={<P element={<LivelihoodsPage />} />} />
        <Route path="/early-warning"         element={<P element={<EarlyWarningPage />} />} />
        <Route path="/supply-chain"          element={<P element={<SupplyChainPage />} />} />
        <Route path="/hr-advanced"           element={<P element={<HRAdvancedPage />} />} />
        <Route path="/standards"             element={<P element={<StandardsPage />} />} />
        <Route path="/bulk-operations"       element={<P element={<BulkOperationsPage />} />} />
        <Route path="/user-management"      element={<P element={<UserManagement />} />} />
        <Route path="/donor-portal"         element={<P element={<DonorPortal />} />} />
        <Route path="/data-center"          element={<P element={<DataCenter />} />} />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  // SeedData removed — app now relies entirely on real Backend API.
  // To set up initial data, run: python -m app.seed from backend directory.
  return (
    <BrowserRouter>
      <LanguageProvider>
        <BrandingProvider>
          <AuthProvider>
            <ThemeProvider>
              <ToastProvider>
                <AppRoutes />
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </BrandingProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
