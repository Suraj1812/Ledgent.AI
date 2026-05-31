import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { AppShell } from "./layouts/AppShell";
import { getAccessToken } from "./services/api";
import { PageSkeleton } from "./components/PageSkeleton";

const ApprovalCenterPage = lazy(() => import("./pages/ApprovalCenterPage").then((module) => ({ default: module.ApprovalCenterPage })));
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage").then((module) => ({ default: module.AuditLogsPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const InvoiceDetailPage = lazy(() => import("./pages/InvoiceDetailPage").then((module) => ({ default: module.InvoiceDetailPage })));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage").then((module) => ({ default: module.InvoicesPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const PurchaseOrdersPage = lazy(() => import("./pages/PurchaseOrdersPage").then((module) => ({ default: module.PurchaseOrdersPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const UserManagementPage = lazy(() => import("./pages/UserManagementPage").then((module) => ({ default: module.UserManagementPage })));
const VendorsPage = lazy(() => import("./pages/VendorsPage").then((module) => ({ default: module.VendorsPage })));
const WorkflowBuilderPage = lazy(() => import("./pages/WorkflowBuilderPage").then((module) => ({ default: module.WorkflowBuilderPage })));

function RequireAuth({ children }: { children: ReactNode }) {
  return getAccessToken() ? children : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="approvals" element={<ApprovalCenterPage />} />
          <Route path="workflows" element={<WorkflowBuilderPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="users" element={<UserManagementPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
