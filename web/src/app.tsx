import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import WorkbenchLayout from '@/layouts/WorkbenchLayout';
import { useAuthStore } from '@/stores/authStore';

const LoginPage = lazy(() => import('@/pages/login'));
const WorkbenchPage = lazy(() => import('@/pages/workbench'));
const TrendAgentPage = lazy(() => import('@/pages/agents/trend'));
const ProductAgentPage = lazy(() => import('@/pages/agents/product'));
const ContentAgentPage = lazy(() => import('@/pages/agents/content'));
const DataAgentPage = lazy(() => import('@/pages/agents/data'));
const LivestreamPage = lazy(() => import('@/pages/agents/livestream'));
const PromptPanel = lazy(() => import('@/pages/agents/livestream/PromptPanel'));
const CustomerServicePage = lazy(() => import('@/pages/agents/customer_service'));
const StylingAgentPage = lazy(() => import('@/pages/agents/styling'));
const InventoryPage = lazy(() => import('@/pages/inventory'));
const BillingPage = lazy(() => import('@/pages/billing'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const AdminDashboard = lazy(() => import('@/pages/admin/dashboard'));
const HelpPage = lazy(() => import('@/pages/help'));

const PageLoader = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" />
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <WorkbenchLayout>{children}</WorkbenchLayout>;
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Suspense fallback={PageLoader}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <WorkbenchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/trend"
              element={
                <ProtectedRoute>
                  <TrendAgentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/product"
              element={
                <ProtectedRoute>
                  <ProductAgentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/content"
              element={
                <ProtectedRoute>
                  <ContentAgentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/data"
              element={
                <ProtectedRoute>
                  <DataAgentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/livestream"
              element={
                <ProtectedRoute>
                  <LivestreamPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/livestream/prompt/:sessionId"
              element={
                <ProtectedRoute>
                  <PromptPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/customer-service"
              element={
                <ProtectedRoute>
                  <CustomerServicePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/styling"
              element={
                <ProtectedRoute>
                  <StylingAgentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <HelpPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  );
}
