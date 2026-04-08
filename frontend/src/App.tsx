import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './shared/layouts/AuthLayout';
import { MainLayout } from './shared/layouts/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.tsx';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage.tsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminResourcesPage from './pages/admin/AdminResourcesPage';
import AdminTicketsPage from './pages/admin/AdminTicketsPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import StudentBookingsPage from './pages/student/StudentBookingsPage';
import StudentResourcesPage from './pages/student/StudentResourcesPage';
import StudentNotificationsPage from './pages/student/StudentNotificationsPage';
import TechnicianDashboardPage from './pages/technician/TechnicianDashboardPage';
import TechnicianTicketsPage from './pages/technician/TechnicianTicketsPage';
import StudentSettingsPage from './pages/student/StudentSettingsPage';
import StudentTicketsPage from './pages/student/StudentTicketsPage';
import { AdminRoute, ProtectedRoute, StudentRoute, TechnicianRoute } from './routes/RouteGuards.tsx';
import { NotificationRealtimeBridge } from './features/notification/components/NotificationRealtimeBridge';

function App() {
  return (
    <BrowserRouter>
      <NotificationRealtimeBridge />
      <Routes>
        {/* Public / Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/resources" element={<AdminResourcesPage />} />
              <Route path="/admin/resources/new" element={<AdminResourcesPage />} />
              <Route path="/admin/resources/:id/edit" element={<AdminResourcesPage />} />
              <Route path="/admin/resources/:id/view" element={<AdminResourcesPage />} />
              <Route path="/admin/resources/:id/view/calendar" element={<AdminResourcesPage />} />
              <Route path="/admin/bookings" element={<AdminBookingsPage />} />
              <Route path="/admin/tickets" element={<AdminTicketsPage />} />
            </Route>

            <Route element={<StudentRoute />}>
              <Route path="/student/dashboard" element={<StudentDashboardPage />} />
              <Route path="/student/resources" element={<StudentResourcesPage />} />
              <Route path="/student/booking" element={<StudentBookingsPage />} />
              <Route path="/booking" element={<Navigate to="/student/booking" replace />} />
              <Route path="/student/notifications" element={<StudentNotificationsPage />} />
              <Route path="/student/settings" element={<StudentSettingsPage />} />
              <Route path="/student/tickets" element={<StudentTicketsPage />} />
              <Route path="/ticket" element={<Navigate to="/student/tickets" replace />} />
            </Route>

            <Route element={<TechnicianRoute />}>
              <Route path="/technician/dashboard" element={<TechnicianDashboardPage />} />
              <Route path="/technician/tickets" element={<TechnicianTicketsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
