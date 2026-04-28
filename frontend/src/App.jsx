import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Beneficiaries from './pages/Beneficiaries';
import Projects from './pages/Projects';
import Finance from './pages/Finance';
import HR from './pages/HR';
import Inventory from './pages/Inventory';
import Monitoring from './pages/Monitoring';
import Cash from './pages/Cash';
import DataCollection from './pages/DataCollection';
import Reports from './pages/Reports';
import DocumentArchive from './pages/DocumentArchive';
import Accountability from './pages/Accountability';
import Learning from './pages/Learning';
import LogFramePage from './pages/LogFramePage';
import EvaluationTools from './pages/EvaluationTools';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import RiskManagement from './pages/RiskManagement';
import MEALPlan from './pages/MEALPlan';
import Safeguarding from './pages/Safeguarding';
import ActivityTracker from './pages/ActivityTracker';
import NeedsAssessment from './pages/NeedsAssessment';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import IPTTDashboard from './pages/IPTTDashboard';
import FieldVisits from './pages/FieldVisits';
import Recommendations from './pages/Recommendations';
import ComplianceDashboard from './pages/ComplianceDashboard';
import AuditTrail from './pages/AuditTrail';
import SectorIndicators from './pages/SectorIndicators';
import AssessmentTools from './pages/AssessmentTools';
import AIInsights from './pages/AIInsights';
import OfflineMode from './pages/OfflineMode';
import KoBoIntegration from './pages/KoBoIntegration';
import RemoteMonitoring from './pages/RemoteMonitoring';
import FeedbackLoop from './pages/FeedbackLoop';
import ScheduledReports from './pages/ScheduledReports';
import Integrations from './pages/Integrations';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-gray-400">جاري التحميل...</div></div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/beneficiaries" element={<ProtectedRoute><Beneficiaries /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
      <Route path="/hr" element={<ProtectedRoute><HR /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
      <Route path="/cash" element={<ProtectedRoute><Cash /></ProtectedRoute>} />
      <Route path="/data-collection" element={<ProtectedRoute><DataCollection /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentArchive /></ProtectedRoute>} />
      <Route path="/accountability" element={<ProtectedRoute><Accountability /></ProtectedRoute>} />
      <Route path="/learning" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
      <Route path="/logframe" element={<ProtectedRoute><LogFramePage /></ProtectedRoute>} />
      <Route path="/evaluation" element={<ProtectedRoute><EvaluationTools /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
      <Route path="/risks" element={<ProtectedRoute><RiskManagement /></ProtectedRoute>} />
      <Route path="/meal-plan" element={<ProtectedRoute><MEALPlan /></ProtectedRoute>} />
      <Route path="/safeguarding" element={<ProtectedRoute><Safeguarding /></ProtectedRoute>} />
      <Route path="/activities" element={<ProtectedRoute><ActivityTracker /></ProtectedRoute>} />
      <Route path="/needs-assessment" element={<ProtectedRoute><NeedsAssessment /></ProtectedRoute>} />
      <Route path="/executive" element={<ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>} />
      <Route path="/iptt" element={<ProtectedRoute><IPTTDashboard /></ProtectedRoute>} />
      <Route path="/field-visits" element={<ProtectedRoute><FieldVisits /></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
      <Route path="/compliance" element={<ProtectedRoute><ComplianceDashboard /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />
      <Route path="/sector-indicators" element={<ProtectedRoute><SectorIndicators /></ProtectedRoute>} />
      <Route path="/assessment-tools" element={<ProtectedRoute><AssessmentTools /></ProtectedRoute>} />
      <Route path="/ai-insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
      <Route path="/offline" element={<ProtectedRoute><OfflineMode /></ProtectedRoute>} />
      <Route path="/kobo" element={<ProtectedRoute><KoBoIntegration /></ProtectedRoute>} />
      <Route path="/remote-monitoring" element={<ProtectedRoute><RemoteMonitoring /></ProtectedRoute>} />
      <Route path="/feedback-loop" element={<ProtectedRoute><FeedbackLoop /></ProtectedRoute>} />
      <Route path="/scheduled-reports" element={<ProtectedRoute><ScheduledReports /></ProtectedRoute>} />
      <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
