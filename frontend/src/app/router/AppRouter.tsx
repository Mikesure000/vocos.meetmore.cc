import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '../../shared/stores/authStore';
import AppLayout from '../layout/AppLayout';
import AdminLayout from '../layout/AdminLayout';

// Lazy-loaded pages
const LoginPage = lazy(() => import('../../features/auth/LoginPage'));
const RegisterPage = lazy(() => import('../../features/auth/RegisterPage'));
const WorkspacePage = lazy(() => import('../../features/workspace/WorkspacePage'));
const ProjectListPage = lazy(() => import('../../features/project/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('../../features/project/ProjectDetailPage'));
const TaskCreatePage = lazy(() => import('../../features/task/TaskCreatePage'));
const FieldMappingPage = lazy(() => import('../../features/task/FieldMappingPage'));
const TaskProgressPage = lazy(() => import('../../features/task/TaskProgressPage'));
const TrendsPage = lazy(() => import('../../features/dashboard/TrendsPage'));
const ContentBreakdownPage = lazy(() => import('../../features/analysis/content/ContentBreakdownPage'));
const CommentCleaningPage = lazy(() => import('../../features/analysis/comments/CommentCleaningPage'));
const CommentInsightPage = lazy(() => import('../../features/insights/CommentInsightPage'));
const HighValuePage = lazy(() => import('../../features/insights/HighValuePage'));
const DemandMapPage = lazy(() => import('../../features/insights/DemandMapPage'));
const BarrierMapPage = lazy(() => import('../../features/insights/BarrierMapPage'));
const AttributionPage = lazy(() => import('../../features/insights/AttributionPage'));
const StrategyCardPage = lazy(() => import('../../features/strategy/StrategyCardPage'));
const DouyinCardPage = lazy(() => import('../../features/strategy/DouyinCardPage'));
const XiaohongshuCardPage = lazy(() => import('../../features/strategy/XiaohongshuCardPage'));
const CommentOpsPage = lazy(() => import('../../features/operations/CommentOpsPage'));
const AdFitPage = lazy(() => import('../../features/adfit/AdFitPage'));
const PrePublishCheckPage = lazy(() => import('../../features/qa/PrePublishCheckPage'));
const ReportCenterPage = lazy(() => import('../../features/report/ReportCenterPage'));
const ReportPreviewPage = lazy(() => import('../../features/report/ReportPreview'));
const MultiComparePage = lazy(() => import('../../features/compare/MultiComparePage'));
const CollaborationPage = lazy(() => import('../../features/collaborate/CollaborationPage'));
const ShareViewPage = lazy(() => import('../../features/share/ShareViewPage'));
const ExportCenterPage = lazy(() => import('../../features/export/ExportCenterPage'));
const ProfileSettings = lazy(() => import('../../features/settings/ProfileSettings'));
const AISettings = lazy(() => import('../../features/settings/AISettings'));
const TeamSettings = lazy(() => import('../../features/settings/TeamSettings'));
const AdminDashboard = lazy(() => import('../../features/admin/AdminDashboard'));
const AuditLogsPage = lazy(() => import('../../features/admin/AuditLogsPage'));
const PromptManagement = lazy(() => import('../../features/admin/PromptManagement'));
const SchemaManagement = lazy(() => import('../../features/admin/SchemaManagement'));
const AgentManagement = lazy(() => import('../../features/admin/AgentManagement'));
const CostDashboard = lazy(() => import('../../features/admin/CostDashboard'));
const QualityDashboard = lazy(() => import('../../features/admin/QualityDashboard'));
const SkillDashboard = lazy(() => import('../../features/admin/SkillDashboard'));
const BrandListPage = lazy(() => import('../../features/brand/BrandListPage'));
const BrandKnowledgePage = lazy(() => import('../../features/brand/BrandKnowledgePage'));
const CategoryListPage = lazy(() => import('../../features/category/CategoryListPage'));
const CategoryKnowledgePage = lazy(() => import('../../features/category/CategoryKnowledgePage'));
const PostPublishReviewPage = lazy(() => import('../../features/review/PostPublishReviewPage'));

function Loading() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress />
    </Box>
  );
}

function ProtectedRoute() {
  const { isAuthenticated, isVerifying, verify } = useAuthStore();
  useEffect(() => { verify(); }, []);
  if (isVerifying) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress /></Box>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/workspace" replace />;
  return <Outlet />;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route path="/share/:token" element={<ShareViewPage />} />

        {/* Authenticated User */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/workspace" replace />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/trends" element={<TrendsPage />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/projects/:id/tasks/new" element={<TaskCreatePage />} />
            <Route path="/projects/:id/tasks/:taskId/mapping" element={<FieldMappingPage />} />
            <Route path="/projects/:id/tasks/:taskId/progress" element={<TaskProgressPage />} />
            <Route path="/projects/:id/tasks/:taskId/content" element={<ContentBreakdownPage />} />
            <Route path="/projects/:id/tasks/:taskId/comments/cleaning" element={<CommentCleaningPage />} />
            <Route path="/projects/:id/tasks/:taskId/insights" element={<CommentInsightPage />} />
            <Route path="/projects/:id/tasks/:taskId/high-value" element={<HighValuePage />} />
            <Route path="/projects/:id/tasks/:taskId/demand-map" element={<DemandMapPage />} />
            <Route path="/projects/:id/tasks/:taskId/barrier-map" element={<BarrierMapPage />} />
            <Route path="/projects/:id/tasks/:taskId/attribution" element={<AttributionPage />} />
            <Route path="/projects/:id/tasks/:taskId/strategy" element={<StrategyCardPage />} />
            <Route path="/projects/:id/tasks/:taskId/production/douyin" element={<DouyinCardPage />} />
            <Route path="/projects/:id/tasks/:taskId/production/xiaohongshu" element={<XiaohongshuCardPage />} />
            <Route path="/projects/:id/tasks/:taskId/comment-ops" element={<CommentOpsPage />} />
            <Route path="/projects/:id/tasks/:taskId/ad-fit" element={<AdFitPage />} />
            <Route path="/projects/:id/tasks/:taskId/pre-publish-check" element={<PrePublishCheckPage />} />
            <Route path="/projects/:id/tasks/:taskId/reports" element={<ReportCenterPage />} />
            <Route path="/projects/:id/tasks/:taskId/reports/:reportId" element={<ReportPreviewPage />} />
            <Route path="/projects/:id/compare" element={<MultiComparePage />} />
            <Route path="/projects/:id/collaborate" element={<CollaborationPage />} />
            <Route path="/export-center" element={<ExportCenterPage />} />
            <Route path="/settings" element={<ProfileSettings />} />
            <Route path="/settings/ai" element={<AISettings />} />
            <Route path="/settings/team" element={<TeamSettings />} />
            <Route path="/brands" element={<BrandListPage />} />
            <Route path="/brands/:id/knowledge" element={<BrandKnowledgePage />} />
            <Route path="/category" element={<CategoryListPage />} />
            <Route path="/category/:id/knowledge" element={<CategoryKnowledgePage />} />
            <Route path="/projects/:id/tasks/:taskId/post-review" element={<PostPublishReviewPage />} />
            <Route path="/post-publish-review" element={<PostPublishReviewPage />} />
          </Route>

          {/* Admin */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="/admin/prompts" element={<PromptManagement />} />
            <Route path="/admin/schemas" element={<SchemaManagement />} />
            <Route path="/admin/agents" element={<AgentManagement />} />
            <Route path="/admin/costs" element={<CostDashboard />} />
            <Route path="/admin/quality" element={<QualityDashboard />} />
            <Route path="/admin/skills" element={<SkillDashboard />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Routes>
    </Suspense>
  );
}
