import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './shared/layouts/AuthLayout';
import { MainLayout } from './shared/layouts/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import TechnicianDashboardPage from './pages/technician/TechnicianDashboardPage';
import StudentNotificationsPage from './pages/student/StudentNotificationsPage';
import StudentSettingsPage from './pages/student/StudentSettingsPage';

function App() {
  return (
    <BrowserRouter>
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
        <Route element={<MainLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<div>User Management</div>} />
          <Route path="/admin/notifications" element={<div>System Notifications</div>} />
          <Route path="/admin/settings" element={<div>Admin Settings</div>} />
          
          <Route path="/admin/resources" element={<div>Resource Management</div>} />
          <Route path="/admin/tickets" element={<div>Ticket Management</div>} />
          
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/booking" element={<div>My Bookings</div>} />
          <Route path="/student/notifications" element={<StudentNotificationsPage />} />
          <Route path="/student/settings" element={<StudentSettingsPage />} />

          <Route path="/technician/dashboard" element={<TechnicianDashboardPage />} />
          <Route path="/technician/tickets" element={<div>Assigned Tickets</div>} />
          <Route path="/ticket" element={<div>My Tickets</div>} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
