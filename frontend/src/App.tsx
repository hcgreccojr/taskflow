import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from './features/auth/pages/AuthPage';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { OrganizationsPage } from './features/organizations/pages/OrganizationsPage';
import { MembersPage } from './features/organizations/pages/MembersPage';
import { DashboardPage } from './features/boards/pages/DashboardPage';
import { BoardPage } from './features/boards/pages/BoardPage';
import { ToastViewport } from './shared/components/Toast';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/orgs" element={<OrganizationsPage />} />
          <Route path="/orgs/:orgId" element={<DashboardPage />} />
          <Route path="/orgs/:orgId/boards/:boardId" element={<BoardPage />} />
          <Route path="/orgs/:orgId/members" element={<MembersPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/orgs" replace />} />
        <Route path="*" element={<Navigate to="/orgs" replace />} />
      </Routes>
      <ToastViewport />
    </BrowserRouter>
  );
}
